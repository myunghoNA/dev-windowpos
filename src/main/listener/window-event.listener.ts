import { App, BrowserWindow } from 'electron';

import { appState } from '@main/services';

/**
 * @name onAllWindowsClosed
 * @description [Lifecycle] 모든 네이티브 윈도우가 닫혔을 때 플랫폼(OS) 설정을 감지하여 프로세스를 완전히 드롭
 */
export function onAllWindowsClosed(app: App) {
	return (): void => {
		if (process.platform !== 'darwin')
			app.quit();
	};
}


/**
 * @name onSecondInstance
 * @description [Single Instance] 매장 포스기 중복 실행 감지 시, 신규 프로세스는 자정하고 기존 가동 중인 메인 윈도우를 안전하게 전면 레이어로 호출
 */
export function onSecondInstance(mainWindow: BrowserWindow | null) {
	return (): void => {
		appState.runSafeWindowAction(mainWindow, (win) => {
            if (win.isMinimized()) {
                win.restore();
            }
            win.focus();
        });
	};
}