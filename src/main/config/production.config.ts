
/**
 * @name inProduction
 * @description 운영(Production) 환경 전역 보안 및 시스템 최적화 옵션 주입
 */
export function inProduction(): void {
	process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}