import { WindowsPrinterItem } from '@shared/types';
import { BrowserWindow } from 'electron';
// Import Service
import {
    sendLogToRenderer,
} from '@main/services';

const LOG_TITLE = '[EXCUTE-WINDOWS.PRINTER]';

/**
 * @name excuteWindowsPrinter
 * @description 윈도우 정식 프린터 드라이버(스풀러)를 통한 백그라운드 HTML 가상 렌더링 인쇄
 */
export async function excuteWindowsPrinter(printSendItem: WindowsPrinterItem): Promise<void> {

    const {
        interfacePath,
        printHtml,   
    } = printSendItem;

    return new Promise((resolve, reject) => {
        (async () => {
            let workerWindow: BrowserWindow | null = null;

            try {
                sendLogToRenderer(`${LOG_TITLE} INFO`, `일렉트론 내장 커널 프린트 가동: ${interfacePath}`);

                workerWindow = new BrowserWindow({
                    show: true,
                    useContentSize: true,
                    webPreferences: {
                        nodeIntegration: true,
                    },
                });

                await workerWindow.loadURL(`data:text/html;base64,${Buffer.from(printHtml).toString('base64')}`);

                workerWindow.webContents.openDevTools({ mode: 'detach' });

                //return;
                // 웹폰트(아랍어 폰트) 로딩 완료 대기
                //await workerWindow.webContents.executeJavaScript('document.fonts.ready');

                workerWindow.webContents.print({
                    silent: true,
                    printBackground: true,
                    deviceName: interfacePath,
                   // margins: { marginType: 'none' },
                }, (success, failureReason) => {

                    workerWindow?.destroy();
                    workerWindow = null;

                    if (!success) {
                        sendLogToRenderer(`${LOG_TITLE} ERROR`, `드라이버 거부 원인: ${failureReason}`);
                        return reject(new Error(`Windows Print Failed: ${failureReason}`));
                    }

                    sendLogToRenderer(`${LOG_TITLE} SUCCESS`, '윈도우 정식 드라이버 전송 성공!');
                    resolve();
                });

            } catch (error: any) {
                sendLogToRenderer(`${LOG_TITLE} ERROR: Windows 가상 렌더링 예외`, error.message);
                if (workerWindow) workerWindow.destroy();
                reject(error);
            }
        })();
    });
}