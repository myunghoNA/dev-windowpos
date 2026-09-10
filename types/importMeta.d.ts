/// <reference types="vite/client" />
import { ImportMetaEnv as CustomEnv } from './env';

/**
 * @namespace DeclareGlobal
 * @description 일렉트론 인프라 내 Vite 환경 변수(import.meta.env) 및 정적 에셋 컴파일러 타입 추론 시스템 확장
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ImportMetaEnv extends CustomEnv {}

  // 메타 정보 참조 컨텍스트 동결 (Readonly)
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
export { };

