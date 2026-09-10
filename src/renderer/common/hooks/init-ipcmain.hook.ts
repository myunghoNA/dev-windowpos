import { useEffect } from 'react';

import { needElectron } from '@renderer/apis/need-electron.api';
import { bytesToHumanRead, customLogger, SweetAlert } from '@renderer/common/helpers';

const LOG_TITLE = '[INIT-IPCMAIN.HOOK]';

/**
 * 메인 프로세스 일반 로그 수신
 */
export const useOnMainLog = () => {
    useEffect(() => {
        const electron = needElectron();
        if (!electron?.common?.onMainLog) return;

        const removeListener = electron.common.onMainLog((_event: any, data: any) => {
            if (typeof data === 'object') {
                const prefix = `[MAIN] ${data.step || ''}`.trim();

                let cleanMessage = data.message;
                if (Array.isArray(data.message) && data.message.length === 1) {
                    cleanMessage = data.message[0];
                }

                const level = (data.level || 'info').toLowerCase();
                
                if (typeof cleanMessage === 'string') {
                    const fullMessage = `${prefix} ${cleanMessage}`;
                    if (level === 'error') customLogger.error(fullMessage);
                    else if (level === 'warn') customLogger.warn(fullMessage);
                    else customLogger.info(fullMessage);
                } else {
                    if (level === 'error') customLogger.error(prefix, cleanMessage);
                    else if (level === 'warn') customLogger.warn(prefix, cleanMessage);
                    else customLogger.info(prefix, cleanMessage);
                }
            } else {
                customLogger.info(`[MAIN] ${data}`);
            }
        });

        return () => removeListener();
    }, []);
};

/**
 * 프린터 상태 메시지 수신 - 로그 + 알림
 */
export const useOnPrinterStatus= () => {
    
    useEffect(() => {
        const electron = needElectron();
        if (!electron?.printer?.onPrinterStatus) return;

        const removeListener = electron.printer.onPrinterStatus((_event: any, data: any) => {
            const msg = typeof data === 'object' ? data.message : data;
            customLogger.warn(LOG_TITLE, msg);
            SweetAlert.error('프린터 확인요망', msg);
        });

        return () => removeListener();
    }, []);

};


/**
 * 이동페이지 수신
 */
export const useOnGoPage= () => {
    
    useEffect(() => {
        const electron = needElectron();
        if (!electron?.alarm?.onGoPage) return;

        const removeListener = electron.alarm.onGoPage((_event: any, data: any) => {
            customLogger.info(LOG_TITLE, data);
            
            // 페이지 이동 로직 연동 추후
            if (data.path) {
               // navigate(data.path);
            }
        });

        return () => removeListener();
    }, []);

};


/**
 * App 업데이트 확인
 */
export const useAppUpdateProcess = () => {
    useEffect(() => {
        const electron = needElectron();
        if (!electron?.common?.onAppUpdateProgress) return;

        // 업데이트 진행상태 응답
        const removeListener = electron.common.onAppUpdateProgress((_event:any, progressObj:any) => {
            const bytesPerSecond = progressObj.bytesPerSecond;
            const transferred    = progressObj.transferred;
            const total          = progressObj.total;
    
            const infoMessage = `속도 ${bytesToHumanRead(bytesPerSecond)}/s ( ${bytesToHumanRead(transferred)} / ${bytesToHumanRead(total)})`;
    
            customLogger.info(`${LOG_TITLE}[useAppUpdateProcess]`, infoMessage);
        });

        // 메인에 업데이트 정보 요청 트리거 (비동기 처리)
        const checkUpdate = async () => {
            try {
                const result = await electron.common.getAppUpdateCheck();
                customLogger.info(`${LOG_TITLE}[useAppUpdateProcess]`, '업데이트 Provider 정보 수신 완료:', result);
            } catch (error) {
                customLogger.error(`${LOG_TITLE}[useAppUpdateProcess]`, '업데이트 요청 중 에러 발생:', error);
            }
        };

        // 앱 기동 시 1회 실행
        checkUpdate();

        // 3. Clean-up
        return () => removeListener();
    }, []);
};