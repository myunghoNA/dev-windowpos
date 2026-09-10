import { app, BrowserWindow, dialog } from 'electron';

import { CONFIG } from '@main/config/common.config';
// Import Service
import { appState, sendLogToRenderer } from '@main/services';
// Import Shared
import { I18N_RESOURCES } from '@shared/locales';


const LOG_TITLE = '[WINDOW.SERVICE]';

/**
 * @name setupWindowEvents
 * @description 메인 윈도우의 종료(Close), 파괴(Closed), 가시성 변경(Hide) 등 
 *              시스템 생명주기 전반의 네이티브 이벤트 핸들러 바인딩
 */
export function setupWindowEvents(mainWindow: BrowserWindow) {

  // =============================================================
  // 사우디 현지화 전용 아랍어 RTL 헬퍼
  // =============================================================
  const wrapRtl = (text: string) => `\u202B${text}\u202C`;

  // =============================================================
  // 윈도우 Close 이벤트 레이어 (종료 방어 및 안심 마감 다이얼로그)
  // =============================================================
  mainWindow.on('close', (event) => {

    // 종료 조건 승인 상태
    if (appState.isCanClose()) return;

    // 즉시 닫히는 것을 방지 
    event.preventDefault();

    // 다이얼로그가 이미 표시 중이면 중복 실행 방지
    if (appState.isCloseDialogVisible) return;
    appState.isCloseDialogVisible = true;

    // 현재세션 다국어 리소스 로드
    const currentLang = appState.language || 'en';
    const localeLang = I18N_RESOURCES[currentLang] || I18N_RESOURCES.ko;
    const t = localeLang.translation;

    const isRtl = currentLang === 'ar';
    // RTL 텍스트 래핑 유틸리티 함수
    const getLocalizedText = (text: string) => isRtl ? wrapRtl(text) : text;

    // 로케일에 따른 메시지 설정
    const dialogContent = {
      title: getLocalizedText(t.dialog.close_title), // 시스템종료
      message: getLocalizedText(t.dialog.close_message), // Flownet POS를 종료하시겠습니까?
      detail: getLocalizedText(t.dialog.close_detail), // 모든 주문 데이터는 클라우드에 안전하게 보관 중입니다.\n영업을 마치셨다면 종료를 눌러주세요.
      buttons: [
        getLocalizedText(t.common.exit),    // 프로그램 종료
        getLocalizedText(t.common.cancel),  // 취소
      ],
      defaultId: 0,
      cancelId: 1,
    };

    // 네이티브 메시지 박스 렌더링
    dialog.showMessageBox(mainWindow, {
      type: 'question', // 질문형 아이콘
      title: dialogContent.title,
      message: dialogContent.message,
      detail: dialogContent.detail,
      buttons: dialogContent.buttons,
      defaultId: dialogContent.defaultId,
      cancelId: dialogContent.cancelId,
      noLink: true,
      icon: CONFIG.APP.ICON,
    })
    .then((result) => {
      // 상태 해제
      appState.isCloseDialogVisible = false;

      // '종료' 버튼 선택 시
      if (result.response === 0) {
        sendLogToRenderer(`${LOG_TITLE} CLOSE EVENT`, '사용자 승인 하에 시스템 종료 시작');
        
        // 종료 플래그 설정 후 창 닫기 재시도
        appState.isCloseWindow = true;
        appState.runSafeWindowAction(mainWindow, (win) => {
            win.close();
        });
      }
    })
    .catch((err) => {
      appState.isCloseDialogVisible = false;
      sendLogToRenderer(`${LOG_TITLE} DIALOG_ERROR`, err);
    });

  });


  // =============================================================
  // 자원 정리 및 라이프사이클 마감 레이어
  // =============================================================

  /** 윈도우가 완전히 닫힌 후 (앱 종료) */
  mainWindow.on('closed', () => {
    sendLogToRenderer(`${LOG_TITLE} CLOSED EVENT`, '메인 윈도우 closed 완료. OS 자원 회수');

    // 메인 창이 닫히면 앱 전체를 종료하여 자원 정리
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });


  /** 윈도우 숨김 이벤트 (트레이 모드 등에서 활용)*/
  mainWindow.on('hide', () => {
    sendLogToRenderer(`${LOG_TITLE} HIDE EVENT`, 'WINDOW POS HIDE');
  });
}