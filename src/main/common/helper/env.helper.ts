/**
* @name isDev
* @description 현재 실행 컨텍스트가 Vite 개발 서버(HMR) 환경인지 여부를 판정     
*/
export function isDev (): boolean  {
    return import.meta.env.DEV;
}

/**
* @name isProd
* @description 현재 실행 컨텍스트가 최종 빌드된 상용 운영(Production) 배포 환경인지 여부를 판정
*/
export function isProd (): boolean  {
    return import.meta.env.PROD;
}
