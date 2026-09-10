import { useLayoutEffect, useRef } from 'react';

//Import Helper
import { customLogger } from '@renderer/common/helpers/logger.helper';


/**
 * @name usePagePerformance
 * @description 컴포넌트의 실제 DOM 마운트 및 레이아웃 배치 성능(FCP 체감 성능)을 밀리초(ms) 단위로 측정
 * @param pageTitle - 성능을 캡처할 타겟 페이지 또는 대형 컴포넌트 명칭
 * @example
 * // 대형 결제 화면이나 테이블 컴포넌트 최상단에 배치
 * usePagePerformance("판매메인화면");
 */
export const usePagePerformance = (pageTitle: string) => {
  
  // 시작 시간 및 로그 플래그 레퍼런스 보존
  const startTimeRef = useRef<number>(performance.now());
  const hasLogged = useRef<boolean>(false);

  if (startTimeRef.current && hasLogged.current) {
    startTimeRef.current = performance.now();
    hasLogged.current = false;
  }

  useLayoutEffect(() => {
    
    // 중복 로깅 방지
    if (hasLogged.current) return;

    const renderTime = Math.round(performance.now() - startTimeRef.current);

    // 훅 내부의 판단 로직 부분
    let rating = 'PASS';  
    let desc = '쾌적: 즉시 전환됨';

    if (renderTime > 2000) {
      rating = 'CRITICAL';
      desc = '매우 느림: 즉시 점검 필요';
    } else if (renderTime > 1000) {
      rating = 'WARNING'; 
      desc = '지연: 성능 최적화 권장';
    } else if (renderTime > 300) {
      rating = 'NOTICE';  
      desc = '보통: 약간의 로딩 체감';
    }

    customLogger.info('PAGE_RENDER_METRIC', {
      type: 'TRANSITION',
      page: pageTitle,
      value_ms: renderTime,
      status: rating,
      message: desc,
    });

    // 로그 전송 완료 표시
    hasLogged.current = true;
    
  }, [pageTitle]);
};