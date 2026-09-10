import { app, BrowserWindow, dialog, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import si from 'systeminformation';

import { CONFIG } from '@main/config/common.config';
// Import Service
import {
    appState,
    sendAppUpdateCheck,
    sendAppUpdateProgress,
    sendLogToRenderer,
} from '@main/services';
// Import Shared
import { I18N_RESOURCES } from '@shared/locales';

const LOG_TITLE = '[APP-UPDATE.SERVICE]';


/**
 * @name setupUpdateService
 * @description electron-updater의 모든 업데이트 라이프사이클 이벤트 등록.
 *              체크 → 발견 → 다운로드 → 완료/에러
 */
export function setupUpdateService(mainWindow: BrowserWindow) {
    
    let retryCount    = 0;
    const MAX_RETRIES = 5;
    const ICON_PATH   = CONFIG.APP.ICON;

    // 자동 다운로드 방지
    let isDownloadApproved   = false;
    autoUpdater.autoDownload = false;

    const getTranslation = () => {
        const currentLang = appState.language || 'en';
        return {
            t: I18N_RESOURCES[currentLang].translation,
        };
    };

    // ===========================================
    // 업데이트 확인 시작
    // ===========================================
    autoUpdater.on('checking-for-update', () => {
        sendLogToRenderer(`${LOG_TITLE} CHECKING`, '업데이트 체크 시작');
    });


    // ===========================================
    // 업데이트 없음 (이미 최신 버전)
    // ===========================================
    autoUpdater.on('update-not-available', (info) => {
        retryCount = 0;
        sendAppUpdateCheck('update-not-available');
        sendLogToRenderer(`${LOG_TITLE} NOT AVAILABLE`, `현재 버전이 최신입니다. (v${info.version})`);
    });


    // ===========================================
    // 업데이트 발견 → 디스크 체크 → 사용자 확인 → 다운로드 시작
    // ===========================================
    autoUpdater.on('update-available', async (info) => {
        retryCount = 0;
        
        // 다국어 리소스 버퍼 로드
        const { t } = getTranslation();

        // 다운로드 전 디스크 여유 공간 확인
        const { availableDiskGB, totalDiskGB } = await checkDiskSpace();
        sendLogToRenderer(`${LOG_TITLE} AVAILABLE`, `신규 버전 발견: v${info.version} (여유공간: ${availableDiskGB}GB / 전체: ${totalDiskGB}GB)`);

        // 최소 1GB 미만이면 다운로드 자체를 막고 알림만 표시
        if (availableDiskGB < 1) {
            new Notification({ 
                title: t.update.disk_shortage_title,  //'업데이트 공간 부족' 
                body: t.update.disk_shortage_body,    //'최소 1GB 이상의 여유 공간이 필요합니다. 공간을 확보해주세요.'
                icon: ICON_PATH, 
            }).show();
            
            sendAppUpdateCheck('update-not-diskusage');
            return;
        }

        sendAppUpdateCheck('update-available');

        const parsedMessage    = t.update.notify_message.replace('{{version}}', info.version);
        const parsedDetail:any = info.releaseNotes || '';
  
        // 사용자에게 다운로드 여부 확인
        const { response } = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: t.update.notify_title, // '업데이트 알림'
            message: parsedMessage, // '새로운 버전(v{{version}})이 출시되었습니다.\n지금 다운로드하시겠습니까?',
            detail: parsedDetail,
            buttons: [t.update.btn_install_now, t.update.btn_later], // [지금 설치], [나중에]
            icon: ICON_PATH,
            cancelId: 1,
            noLink: true,
        });

        if (response === 0) {
            isDownloadApproved = true;
            autoUpdater.downloadUpdate();
            sendLogToRenderer(`${LOG_TITLE} ACTION`, '사용자가 다운로드를 승인함');
        } else {
            isDownloadApproved = false;
            sendLogToRenderer(`${LOG_TITLE} ACTION`, '사용자가 나중에 설치를 선택함');
        }
        return;
    });


    // ===========================================
    // 다운로드 진행률 - 렌더러 전달 + 작업표시줄 프로그레스 바 동기화
    // ===========================================
    autoUpdater.on('download-progress', (progressObj) => {
        sendAppUpdateProgress(progressObj);
        
        appState.runSafeWindowAction(mainWindow, (win) => {
            win.setProgressBar(progressObj.percent / 100);
        });
    });


    // ===========================================
    // 다운로드 완료 → 재시작 여부 확인 → 설치
    // ===========================================
    autoUpdater.on('update-downloaded', async () => {

        // 다국어 리소스 버퍼 로드
        const { t } = getTranslation();

        if (!isDownloadApproved) {
            sendLogToRenderer(`${LOG_TITLE} GUARD`, '이전 잔여 캐시가 발견되었으나 사용자가 승인하기 전이므로 팝업을 차단합니다.');
            return; 
        }
        
        const { response } = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: t.update.ready_title,     // '업데이트 준비 완료',
            message: t.update.ready_message, // '업데이트 파일 다운로드가 완료되었습니다.\n프로그램을 재시작하여 설치를 완료할까요?',
            buttons: [t.update.btn_restart, t.common.cancel],  // '예 (재시작)', '아니오'
            icon: ICON_PATH,
            cancelId: 1,
        });

        if (response === 0) {
            appState.isQuitForUpdate = true;
            autoUpdater.quitAndInstall(false, true);
            sendLogToRenderer(`${LOG_TITLE} DOWNLOAD`, '업데이트 완료 후 프로그램 재시작 선택');
        }
        else{
            sendLogToRenderer(`${LOG_TITLE} DOWNLOAD`, '업데이트 완료 후 프로그램 재시작 않함 선택');
        }
    });


    // ===========================================
    // 에러 처리 - 일시적 오류는 지수 백오프로 재시도, 그 외엔 포기하고 알림
    // ===========================================
    autoUpdater.on('error', (err) => {
        if ((err.message.includes('403') || err.message.includes('timeout')) && retryCount < MAX_RETRIES) {
            retryCount++;

            const delay = Math.min(5000 * 2 ** retryCount, 60000);
            sendLogToRenderer(`${LOG_TITLE} RETRY`, `${retryCount}/${MAX_RETRIES}회 재시도 (${delay / 1000}초 후)`);
            setTimeout(() => autoUpdater.checkForUpdates(), delay);
        } 
        else {
            retryCount = 0;
            sendAppUpdateCheck('update-not-available');
            sendLogToRenderer(`${LOG_TITLE} ERROR`, `업데이트 실패 ${err.message}`);

            appState.runSafeWindowAction(mainWindow, (win) => {
                win.setProgressBar(-1);
            });
        }
    });
}


/**
 * @name checkDiskSpace
 * @description 앱이 설치된 드라이브 기준으로 전체/여유 디스크 용량(GB)을 조회.
 *              조회 자체가 실패해도 업데이트 흐름을 막지 않기 위해 임의의 fallback 값을 반환.
 */
async function checkDiskSpace() {
    try {
        const fsList = await si.fsSize();
        const currentPath = app.getAppPath();
        const mainFs = fsList.find(f => currentPath.startsWith(f.mount)) || fsList[0];
        
        return {
            totalDiskGB: mainFs ? Math.round(mainFs.size / (1024 ** 3)) : 0,
            availableDiskGB: mainFs ? Math.round(mainFs.available / (1024 ** 3)) : 0,
        };
    } catch (e) {
        sendLogToRenderer(`${LOG_TITLE} DISK_CHECK_ERROR`, `디스크 확인 실패: ${e instanceof Error ? e.message : String(e)}`);
        return { totalDiskGB: 0, availableDiskGB: 10 }; 
    }
}