import nodePortScanner from 'node-port-scanner';

import { sendLogToRenderer } from '@main/services';

const LOG_TITLE = '[PORT-SCANNER.SERVICE]';
const PORTS_TO_SCAN = [8080, 8090];

/**
 * @name checkOpenPort
 * @description 지정된 로컬 루프백(127.0.0.1) 포트 대역을 일괄 스캔하여 렌더러에 전송
 */
export async function checkOpenPort(): Promise<void> {
    try {
        const results = await nodePortScanner('127.0.0.1', PORTS_TO_SCAN);
        sendLogToRenderer(`${LOG_TITLE} PORTS_TO_SCAN`, results);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        sendLogToRenderer(`${LOG_TITLE} PORTS_TO_SCAN_ERROR`, `포트 일괄 스캔 중 오류 발생: ${errorMsg}`);
    }
}