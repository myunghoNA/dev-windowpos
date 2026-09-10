import axios from 'axios';
//import https from 'https';

import { formatUtcTimestamp, getToday } from '@renderer/common/helpers/datetime.helper';
import { getCurrentSession } from '@renderer/common/helpers/storage.helper';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const VITE_APP_MODE = import.meta.env.VITE_APP_MODE;
//const VITE_APP_MODE = 'prod';
const VITE_APP_VERSION = import.meta.env.VITE_APP_VERSION;
const VITE_ES_URL = import.meta.env.VITE_ES_URL;
const VITE_ES_USER = import.meta.env.VITE_ES_USER;
const VITE_ES_PWD = import.meta.env.VITE_ES_PWD;

// 자체 서명 인증서 검증 무시
//const insecureAgent = new https.Agent({ rejectUnauthorized: false });

class CustomLogger {
    private logQueue: any[] = [];
    private isProcessing = false;
    private readonly MAX_BATCH_SIZE = 20;
    private readonly FLUSH_INTERVAL = 5000;
    private flushTimer: NodeJS.Timeout | null = null; // 타이머 제어용

    constructor() {
        if (VITE_APP_MODE === 'prod') {
            this.startTimer();
            // 💡 앱 종료(새로고침 등) 시 큐에 남은 로그 강제 전송
            window.addEventListener('beforeunload', () => {
                this.processQueue();
            });
        }
    }

    private startTimer() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flushTimer = setInterval(() => this.processQueue(), this.FLUSH_INTERVAL);
    }

    public error(message: string, ...data: any[]): void {
        this.log('error', message, data);
        if (VITE_APP_MODE === 'prod') this.processQueue(); // 에러는 즉시 전송
    }

    public warn(message: string, ...data: any[]): void {
        this.log('warn', message, data);
    }

    public info(message: string, ...data: any[]): void {
        this.log('info', message, data);
    }

    public debug(message: string, ...data: any[]): void {
        if (VITE_APP_MODE !== 'prod') {
            this.log('debug', message, data);
        }
    }

    private log(logLevel: LogLevel, message: string, data: any[] = []): void {
        // 💡 1. data가 1개면 배열 껍데기를 벗기고, 여러 개면 배열 유지
        const rawDetails = data.length > 0 ? (data.length === 1 ? data[0] : data) : null;

        const logObj = {
            msg: message,
            // 객체면 JSON, 문자열이면 그냥 문자열로 저장
            details: rawDetails !== null 
                ? (typeof rawDetails === 'object' ? JSON.stringify(rawDetails) : String(rawDetails)) 
                : null,
        };

        // 💡 2. 콘솔 출력 가공 (배열 괄호, 쌍따옴표 제거)
        let consoleDataStr = '';
        if (rawDetails !== null) {
            if (typeof rawDetails === 'object') {
                consoleDataStr = `\n${JSON.stringify(rawDetails, undefined, 2)}`;
            } else {
                consoleDataStr = ` ${rawDetails}`;
            }
        }

        const consoleMsg = `[${logLevel.toUpperCase()}] ${message}${consoleDataStr}`;

        const consoleMap = {
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug,
        };
        (consoleMap[logLevel] || console.info)(consoleMsg);

        // 운영 환경일 경우 큐에 삽입
        if (VITE_APP_MODE === 'prod') {
            this.addToQueue(logLevel, logObj);
        }
    }

    private addToQueue(level: LogLevel, logObj: object) {
        const isoTimestamp = formatUtcTimestamp();
        const session = getCurrentSession();

        const storeId = session?.storeId?.toString() || 'UNKNOWN_ID';
        const storeNm = session?.storeNm || 'UNKNOWN_STORE';
        const terminalId = session?.terminalId || 'UNKNOWN_TERMINAL';

        this.logQueue.push({
            log: { level },
            terminal: {  // 💡 오타 수정 (teminal -> terminal)
                id: terminalId,
            },
            service: {
                name: 'pos-window',
                version: VITE_APP_VERSION,
            },
            labels: {
                storeId: storeId,
                storeNm: storeNm,
            },
            message: logObj,
            '@timestamp': isoTimestamp,
        });
        
        if (this.logQueue.length >= this.MAX_BATCH_SIZE) {
            this.processQueue();
            this.startTimer(); // 전송 후 타이머 리셋
        }
    }

    private async processQueue() {
        if (this.isProcessing || this.logQueue.length === 0) return;

        this.isProcessing = true;
        // 안전하게 현재 큐 전체를 복사하고 비움 (에러 시 복구 용이)
        const batch = [...this.logQueue];
        this.logQueue = [];

        try {
            const indexName = `window-pos-logs-${getToday('YYYY.MM.DD')}`;

            const bulkBody = batch
                .map(item => [
                    JSON.stringify({ index: { _index: indexName } }),
                    JSON.stringify(item),
                ].join('\n'))
                .join('\n') + '\n';

            const response = await axios.post(`${VITE_ES_URL}/_bulk`, bulkBody, {
                timeout: 3000,
                // httpsAgent: insecureAgent,
                auth: {
                    username: VITE_ES_USER,
                    password: VITE_ES_PWD,
                },
                headers: {
                    'Content-Type': 'application/x-ndjson',
                },
            });

            if (response.data?.errors) {
                const failedItems = response.data.items.filter((item: any) => item.index?.status >= 400);
                failedItems.forEach((item: any) => {
                    console.error('[ES] 색인 실패 상세:', item.index.status, item.index.error);
                });
            }
        } catch (error) {
            console.error('[ES] 로그 배치 전송 실패. 복구 시도.', error);
            // 실패 시 큐 맨 앞에 다시 추가
            this.logQueue = [...batch, ...this.logQueue];

            // 최대치 초과 시 오래된 로그 폐기
            if (this.logQueue.length > 1000) {
                const removeCount = this.logQueue.length - 1000;
                this.logQueue.splice(0, removeCount);
            }
        } finally {
            this.isProcessing = false;
        }
    }
}

export const customLogger = new CustomLogger();


/**
 * 비즈니스 함수의 실행/성공/실패 자동 로깅 래퍼
 */
export function withLogging<T extends (...args: any[]) => Promise<any>>(
  label: string,
  fn: T,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const start = Date.now();
    
    customLogger.info(`[${label}] Start`);

    try {
      const result = await fn(...args);
      
      customLogger.info(`[${label}] Complete (${Date.now() - start}ms)`);
      return result;
    } catch (error: any) {
      customLogger.error(`[${label}] Fail (${Date.now() - start}ms)`, {
        name: error?.name,
        message: error?.message,
        code: error?.code, 
      });
      
      throw error; 
    }
  }) as T;
}