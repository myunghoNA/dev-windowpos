import { customLogger } from '@renderer/common/helpers';
import { useEffect } from 'react';


const LOG_TITLE = '[INIT-STORAGE.HOOK]';

/**
 * IndexedDB 영구 보존 권한 및 저장소 상태 확인
 * 브라우저가 임의로 IndexedDB를 비우지 않도록 영구 보존 모드를 요청.
 */
export const useStorageInit = () => {
    useEffect(() => {
        const initPersistence = async () => {
            try {
                if (navigator.storage && navigator.storage.persist) {
                    const isPersisted = await navigator.storage.persisted();
                    if (!isPersisted) {
                        const granted = await navigator.storage.persist();
                        customLogger.info(LOG_TITLE, `영구 보존 권한 ${granted ? '승인' : '거부'}`);
                    }

                    if (navigator.storage.estimate) {
                        const { usage, quota } = await navigator.storage.estimate();
                        const usageMB = usage ? (usage / (1024 * 1024)).toFixed(2) : 0;
                        const quotaMB = quota ? (quota / (1024 * 1024)).toFixed(2) : 0;
                        customLogger.info(`${LOG_TITLE} STORAGE`, `용량 현황: ${usageMB}MB / 전체 한도: ${quotaMB}MB`);
                    }
                }
            } catch (error) {
                customLogger.error(LOG_TITLE, error);
            }
        };
        initPersistence();
    }, []);
};