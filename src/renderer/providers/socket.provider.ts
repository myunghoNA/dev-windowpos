import { io, Socket as SocketType } from 'socket.io-client';

import { customLogger } from '@renderer/common/helpers';

const MQ_SOCKET_URL = '추후필요시';


/**
 * @name socket
 * @description 소켓 커넥션 전역 인스턴스 및 세션 캡슐화
 */
export const socket: SocketType = io(MQ_SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5, 
    reconnectionDelay: 1000, 
    transports: ['websocket'],
});

const LOG_TITLE  = '[socket.provider]';

let cachedLoginData: any = null;

/**
 * @name isSocketConnected
 * @description 현재 실시간 MQ 소켓이 세션에 안전하게 고정되어 있는지 상태를 검증
 */
export function isSocketConnected(): boolean{
    const isConnected = socket?.connected ?? false;
    customLogger.info(`${LOG_TITLE} 연결상태 확인: ${isConnected} (URL: ${MQ_SOCKET_URL})`);

    return isConnected;
}


/**
 * @name initSocketConnection
 * @description 메인 파이프라인 시동 및 자동 재연결 가드를 결합한 소켓 세션 초기화
 */
export function initSocketConnection(loginData?: any) {
    
    if (socket.connected) return;

    if (loginData) {
        cachedLoginData = loginData;
    }

    // 접속 완료 시 실행 (최초 접속 + 자동 재연결)
    socket.off('connect').on('connect', () => {
        customLogger.info(`[SOCKET] 접속 성공! ID: ${socket.id}`);
        
        // 접속되자마자 로그인이 필요한 경우 자동 전송
        if (cachedLoginData) {
            loginSocketMessage(cachedLoginData);
        }
    });

    // 접속 해제 예외 모니터링
    socket.off('disconnect').on('disconnect', (reason) => {
        customLogger.warn(`[SOCKET] 접속 해제 사유: ${reason}`);
    });

    // 접속 오류 예외 모니터링
    socket.off('connect_error').on('connect_error', (error) => {
        customLogger.error(`[SOCKET] 접속 에러: ${error.message}`);
    });
    
    socket.connect();
}


/**
 * @name loginSocketMessage
 * @description MQ 게이트웨이 인증을 위한 패킷 송신
 */
export function loginSocketMessage(message: any){
    
    if (!socket.connected) {
        customLogger.warn('[SOCKET] 연결되지 않아 로그인 메시지를 전송할 수 없습니다.');
        return;
    }

    socket.emit('user connected', message);
    customLogger.info('[SOCKET] 로그인 요청 전송', { param: message, socketId: socket.id });
}


/**
 * @name sendSocketMessage
 * @description 실시간 메시지 요청 송신 (연결 유실 세이프티 가드 포함)
 */
export function sendSocketMessage(message: any) {    
    if (!socket.connected) {
        customLogger.warn('[SOCKET] 미연결 상태에서 메시지 전송 요청 감지 - 연결 복구 스케줄링 가동');
        
        // 비동기 핸드셰이크 상태에서 데이터가 유실되지 않도록, 원터치성 일회성 리스너로 연결 완결 시점에 전송.
        socket.once('connect', () => {
            socket.emit('message', message);
            customLogger.info('[SOCKET] 재접속 완료 후 대기 패킷 전송 완결', { message });
        });
        
        socket.connect();
        return;
    }

    socket.emit('message', message);
    customLogger.info('[SOCKET] 메시지 전송 완료', { message });
}


/**
 * @name disconnectSocket
 * @description 프로그램 종료 또는 로그아웃 시 소켓 완전 소멸 및 리스너 초기화
 */
export function disconnectSocket(){   
    
    if (!socket.connected) {
        customLogger.info('[SOCKET] 이미 소켓 연결되어 있지 않습니다.');
        return;
    }

    socket.off('receive');

    socket.disconnect();
    cachedLoginData = null;
    customLogger.info('[SOCKET] 소켓 연결 및 메모리 버퍼 종료 완료');
}