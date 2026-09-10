import { useEffect, useRef } from 'react';

/**
 * @description 선언적으로 인터벌을 관리하는 훅
 * @param callback - 콜백함수
 * @param delay - 타이머 주기 (ms). null 또는 undefined를 주입하면 즉시 인터벌 스케줄링이 중지
 * @example
 * useInterval(() => {
 *   console.log('데이터 갱신 중...');
 * }, isPeakTime ? 500 : 3000);
 */
const useInterval = (callback: () => void, delay?: number | null) => {
  
  // 최신의 렌더링 컨텍스트 함수를 가리키도록 ref로 격리
  const savedCallback = useRef<() => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);


  // ===========================================
  //  인터벌 타이머 스케줄링 및 정리
  // ===========================================
  useEffect(() => {

    if (delay === null || delay === undefined) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    // 네이티브 타이머 등록
    const id = setInterval(tick, delay);

    return () => {
      clearInterval(id);
    };

  }, [delay]);
};

export default useInterval;