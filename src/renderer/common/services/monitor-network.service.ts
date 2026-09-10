import { noInterceptorInstance } from '@renderer/apis/axios-client';
//# Import Service
//# Import Helper
import { customLogger } from '@renderer/common/helpers';
//# Import Type
import { NetworkStatus, NetworkStatusResponse } from '@shared/types';

type StatusListener = (status: NetworkStatus) => void;

const CHECK_INTERVAL_MS = 10000;
const REQUEST_TIMEOUT_MS = 5000;
const OFFLINE_THRESHOLD_COUNT = 2;

let currentStatus: NetworkStatus = 'online';
let checkFailures = 0;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<StatusListener>();


async function checkServerReachable(): Promise<boolean> {
    try {
        const res = await noInterceptorInstance.get<NetworkStatusResponse>('/health', {
            timeout: REQUEST_TIMEOUT_MS,
        });

        return res.data?.code === 'SUCCESS';
    } catch {
        return false;
    }
}

function notifyListeners(status: NetworkStatus) {
    listeners.forEach((listener) => listener(status));
}

async function runCheck() {
    const reachable = await checkServerReachable();

    if (reachable) {
        checkFailures = 0;

        if (currentStatus !== 'online') {
            currentStatus = 'online';
            customLogger.info('[NetworkMonitor] 서버 연결 복구됨');
            notifyListeners('online');
        }
    } else {
        checkFailures += 1;

        if (checkFailures >= OFFLINE_THRESHOLD_COUNT && currentStatus !== 'offline') {
            currentStatus = 'offline';
            customLogger.warn('[NetworkMonitor] 서버 연결 끊김 - 비상모드 전환 필요', { checkFailures });
            notifyListeners('offline');
        }
    }
}

function handleOsOnline() {
    customLogger.info('[NetworkMonitor] OS 네트워크 어댑터 연결 감지 - 즉시 재확인');
    runCheck();
}

function handleOsOffline() {
    customLogger.warn('[NetworkMonitor] OS 네트워크 어댑터 연결 끊김 감지');
    checkFailures = OFFLINE_THRESHOLD_COUNT; // 임계값 강제 도달 -> runCheck에서 바로 offline 판정
    runCheck();
}


export const NetworkMonitor = {
    start(): void {
      if (intervalHandle) return;

      window.addEventListener('online', handleOsOnline);
      window.addEventListener('offline', handleOsOffline);

      runCheck();
      intervalHandle = setInterval(runCheck, CHECK_INTERVAL_MS);
    },

    stop(): void {
      if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
      }

       window.removeEventListener('online', handleOsOnline);
       window.removeEventListener('offline', handleOsOffline);
    },

    subscribe(listener: StatusListener): () => void {
      listeners.add(listener);
      listener(currentStatus);
      return () => listeners.delete(listener);
    },

    getCurrentStatus(): NetworkStatus {
      return currentStatus;
    },
};