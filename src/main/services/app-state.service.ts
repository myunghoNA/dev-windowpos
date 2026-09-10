import { BrowserWindow } from 'electron';

export const appState = {
    isQuitForUpdate: false,
    isCloseWindow: false,
    isCloseDialogVisible: false,
    language: 'en' as 'ko' | 'en' | 'ar',
    privateLanguageCallback: null as (() => void) | null,

    /**
     * @name onLanguageChange
     * @description 언어 변경 신호를 감지하도록 콜백 리스너
     */
    onLanguageChange(callback: () => void): void {
        this.privateLanguageCallback = callback;
    },

    /**
     * @name triggerLanguageChange
     * @description 언어가 들어왔을 때 등록된 콜백을 실행
     */
    triggerLanguageChange(): void {
        if (typeof this.privateLanguageCallback === 'function') {
            this.privateLanguageCallback();
        }
    },

    /**
     * @name isCanClose
     * @description 종료 가능 여부 판정
     */
    isCanClose(): boolean {
        return this.isCloseWindow || this.isQuitForUpdate;
    },

    /**
     * @name isWindowValid
     * @description 특정 윈도우 인스턴스 존재여부
     */
    isWindowValid: (win: BrowserWindow | null): win is BrowserWindow => {
        return !!win && !win.isDestroyed();
    },

    /**
     * @name isWindowValid
     * @description 네이티브 액션 콜백을 실행
     */
    runSafeWindowAction(win: BrowserWindow | null, action: (win: BrowserWindow) => void): void {
        if (this.isWindowValid(win)) {
            action(win);
        }
    },

};