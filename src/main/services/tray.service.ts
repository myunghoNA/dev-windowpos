import { BrowserWindow, Menu, Tray } from 'electron';

import { CONFIG } from '@main/config/common.config';
// Import Service
import { appState } from '@main/services';
// Import Shared
import { I18N_RESOURCES } from '@shared/locales';

let mainTray: Tray | null = null;


/**
 * @name setupTray
 * @description Windows 작업 표시줄 알림 영역(트레이)에 아이콘 생성 및 시스템 제어 메뉴 바인딩
 */
export function setupTray(mainWindow: BrowserWindow): void {

    const { APP } = CONFIG;
    const toolTip = APP.TITLE;

    // 기존 트레이 인스턴스가 있다면 정리
    if (mainTray) mainTray.destroy();

    // 네이티브 시스템 트레이 생성
    mainTray = new Tray(APP.ICON);
    mainTray.setToolTip(toolTip);


    // ===========================================
    //  트레이 네이티브 마우스 이벤트 바인딩 (추가)
    // ===========================================
    mainTray.on('double-click', () => {
        appState.runSafeWindowAction(mainWindow, (win) => {
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus(); // 윈도우를 맨 앞으로 강제 포커싱
        });
    });


    // ===========================================
    //  트레이 컨텍스트 메뉴 템플릿 빌드
    // ===========================================
    const updateContextMenu = () => {

        // 현재 세션 언어 확인 (ko, en, ar)
        const currentLang = appState.language || 'en';

        // 현재 언어셋의 'translation' 도메인 추출 
        const localeLang = I18N_RESOURCES[currentLang] || I18N_RESOURCES.ko;
        const t = localeLang.translation;

        const contextMenu = Menu.buildFromTemplate([
            { 
                label: t.common.open, // '열기' 
                click: () => {
                    appState.runSafeWindowAction(mainWindow, (win) => {
                        if (win.isMinimized()) win.restore();
                        win.show();
                    });
                },
            },
            { 
                label: t.common.hide, // '숨기기' 
                click: () => {
                   appState.runSafeWindowAction(mainWindow, (win) => win.hide());
                },
            },
            { type: 'separator'},
            { 
                label: t.common.max, // '최대화' 
                click: () => {
                    appState.runSafeWindowAction(mainWindow, (win) => win.maximize());
                },
            },
            {  
                label: t.common.min, // '최소화' 
                click: () => {
                    appState.runSafeWindowAction(mainWindow, (win) => win.minimize());
                },
            },
            { type: 'separator' },
            { 
                label: t.common.exit, // '프로그램종료' 
                click: () => {
                    appState.runSafeWindowAction(mainWindow, (win) => {
                        appState.isCloseWindow = true; 
                        win.close();
                    });
                },
            },
        ]);

        mainTray?.setContextMenu(contextMenu);
    };

    // 초기 메뉴 설정
    updateContextMenu();

    // ===========================================
    //  런타임 실시간 언어 체인지 리스너 고정
    // ===========================================
    appState.onLanguageChange(() => {
        updateContextMenu();
    });

}