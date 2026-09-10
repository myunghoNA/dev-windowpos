
import { isProd } from '@main/common/helper';
import * as config from '@main/config';

/**
 * @name setupEnvironment
 * @description 앱 기동 초기 운영/개발 모드를 판정하여 환경별 설정을 동적 주입
 */
export function setupEnvironment(): void {
    if (isProd()) {
        config.inProduction();
    } else {
        config.inDevelopment();
    }
}