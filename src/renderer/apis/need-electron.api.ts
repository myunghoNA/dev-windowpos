import type { ExposedInMainWorld } from '@preload/index';


// ===========================================
//  전역 브라우저 Window 객체 타입 확장
// ===========================================
declare global {
  interface Window {
    electron: ExposedInMainWorld;
  }
}

/**
 * @name needElectron
 * @description 프리로드 스크립트가 메인에 격리 주입한 IPC 통신 채널 및 네이티브 API 인스턴스를 타입 안전하게 반환
 */
export function needElectron(): ExposedInMainWorld {
  return window.electron;
}
