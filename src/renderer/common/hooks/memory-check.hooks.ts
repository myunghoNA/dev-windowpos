//Import Helper
import { customLogger } from '@renderer/common/helpers/logger.helper';
//Import Hooks
import useInterval from '@renderer/common/hooks/interval.hooks';


/**
 * @description 애플리케이션의 메모리 사용량을 주기적으로 모니터링.
 *              Chrome 계열 브라우저의 성능 측정 API를 활용, 
 */
export const useMemoryCheck = () => {
  useInterval(() => {
    const memory = (performance as any).memory;
    if (!memory) return;

    // ===========================================
    //  크로미움 하드웨어 네이티브 메모리 메트릭 수집
    // ===========================================
    const usedHeap     = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const limitHeap    = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    const usagePercent = Number(((usedHeap / limitHeap) * 100).toFixed(1));

    // ===========================================
    //  포스기 안정성 임계치 판단 (80% 가드)
    // ===========================================
    const isCritical = usagePercent > 80;
    const logMethod  = isCritical ? 'warn' : 'info';

    if(isCritical) {
      customLogger[logMethod]('MEMORY_METRIC', {
        type: 'STABILITY',
        used_mb: usedHeap,
        limit_mb: limitHeap,
        usage_percent: usagePercent,
        status: isCritical ? 'CRITICAL' : 'STABLE',
        comment: isCritical 
          ? `위험: 메모리 점유율이 ${usagePercent}%입니다. 재시작을 권장합니다.` 
          : `정상: 메모리 사용량 ${usagePercent}%로 안정적입니다.`,
      });
    }

  }, 60000 * 10);
};