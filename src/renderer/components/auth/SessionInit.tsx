
import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { needElectron } from '@renderer/apis/need-electron.api';
import { useAppDispatch, useAppSelector } from '@renderer/redux/hooks';
//# Import Slice
import { ClearSession, SetSession } from '@renderer/redux/common/session.slice';
//# Import Helper
import { customLogger, withLogging } from '@renderer/common/helpers';
//# Import Service
import { syncStoreOperation } from '@renderer/common/services';
//# Import DB
import { setupTerminalId } from '@renderer/common/repositories/terminal.repository';
//# Import Type
import { CurrentSession } from '@shared/types';

 const LOG_TITLE = '[renderer.sessionInit]';

/**
 * RabbitMQ 연결 헬퍼 (실패 시 로그만 남기고 앱 구동을 막지 않음)
 */
const tryConnectMQ = async (currentSession: CurrentSession) => {
  try {
    await withLogging('RabbitMQ/connect', async () => {
      const result = await needElectron().rabbitmq.connectRabbitmq(currentSession);
      if (!result.isSuccess) {
        throw new Error(result?.errorMessage || 'RabbitMQ 연결 실패');
      }
    })();
  } catch (e: any) {
    customLogger.warn(`${LOG_TITLE} RabbitMQ 연결 실패 상태로 진행`, e);
  }
};

/**
 * 세션이 존재할 때마다 - 최초 로그인 직후 및 앱 재시작시 항상 실행
 * -  운영정보 최신화
 * -  상품정보 최신화 
 * -> terminalRegistry 조회/등록
 * -> RabbitMQ 연결
 * 완료 전까지는 하위 라우팅막음.
 */
export function SessionInit() {
 

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const session = useAppSelector((state) => state.session.current);
  
  const [isReady, setIsReady] = useState(false);
  const [asyncError, setAsyncError] = useState<Error | null>(null);
  const initializedStoreId = useRef<number | null>(null);

  /**
   * 초기설정
   */
  useEffect(() => {
    //# 세션이 없으면 로그인 화면이동(라우터에서 처리)
    if (!session) {
      customLogger.info(`${LOG_TITLE} 세션 없음 - 세션처리 스킵`);
      return;
    }

    //# 중복실행 방지
    if (initializedStoreId.current === session.storeId) return;
    initializedStoreId.current = session.storeId;

    customLogger.info(`${LOG_TITLE} 시작 - storeId: ${session.storeId}`);

    //# 세션초기화
    const initSessionProcess = async () => {
      try {
        //## 매장 운영정보 동기화 및 데이터 추출
         const storeData = await syncStoreOperation(session.storeId);

         const data = storeData?.data || null;
         const brandId  = data?.brand?.brandId ?? session.brandId ?? 0;
         const storeNm   = data?.storeName?.en || data?.storeName?.ar  || '';

        //## 단말기 ID 세팅 (기존 ID 조회 or 신규 발급)
        const terminalId = await setupTerminalId(session.storeId, brandId, session.isCsMode);

        //## 세션 최신화 (Redux 상태 업데이트)
        const currentSession:CurrentSession ={
          ...session,
          brandId,
          terminalId,
          storeNm,
        };
        dispatch(SetSession(currentSession));

        //## MQ 연결
        await tryConnectMQ(currentSession); 

        //## 초기화 완료 처리
        setIsReady(true);

      } catch (error: any) {
        customLogger.error(`${LOG_TITLE} 초기화 에러 발생:`, error);
        handleInitError(error);
      }
    };

    //# 에러 핸들링 로직 분리
    const handleInitError = (error: any) => {
      const isSessionError = 
        error?.code === 'NOT_FOUND' || 
        error?.code === 'NO_STORE_DATA' ||
        error?.name === 'TypeError' ||
        error?.message?.includes('Table.get');

      if (isSessionError) {
        customLogger.warn(`${LOG_TITLE} 유효하지 않은 정보입니다. 로그인 화면으로 이동합니다.`);
        //## TODO: 사용자 알림 표시
        dispatch(ClearSession());
        navigate('/login', { replace: true });
      } else {
        setAsyncError(error); // 치명적 에러는 ErrorBoundary로
      }
    };

    initSessionProcess();
  }, [session?.storeId]); 

  // ErrorBoundary로 전달
  if (asyncError) throw asyncError; 
  // 로그인 페이지로 이동
  if (!session) return null;
  //TODO: LoadingSpinner 처리 초기화 프로세스 완료될 때까지 화면 차단
  if (!isReady) return <></>;

  return <Outlet />;
}

