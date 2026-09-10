import { BrowserWindow, WebContentsView } from 'electron';
//# Import Listener
import { handleIpcWebview } from '@main/listener';

let webView: WebContentsView | null = null;

/**
 * @name setupWebviewService
 * @description 외부 사이트(X-Frame-Options로 iframe이 차단된 사이트)를
 *              WebContentsView로 임베드하기 위한 IPC 핸들러 등록.
 *              mainWindow 생성 이후 1회만 호출.
 */
export function setupWebviewService(mainWindow: BrowserWindow) {

    webView = new WebContentsView({
        webPreferences: {
            contextIsolation: true,
            partition: 'persist:flownet_pos', 
        },
    });

     mainWindow.contentView.addChildView(webView);

     // 초기 상태는 화면에 보이지 않게 (React 쪽에서 위치 잡은 뒤 보여짐)
    webView.setBounds({ x: 0, y: 0, width: 0, height: 0 });

    //# IPC 리스너 등록
    handleIpcWebview(webView);
}