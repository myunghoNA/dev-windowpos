const { loadEnv } = require('vite');

/**
 * @name loadAndSetEnv
 * @description 지정된 모드(dev/stag/prod 등)에 따른 Vite 환경 변수를 로드
 * @example
 *         const mode = process.env.MODE || 'dev';
 *         loadAndSetEnv(mode, process.cwd());
 *         console.log(process.env.VITE_DEV_SERVER_URL); 
 */
export function loadAndSetEnv(mode, cwd) {
  // 1. Vite의 우선순위가 반영된 env 객체 로드
  const env = loadEnv(mode, cwd, 'VITE_');

  // 2. Object.entries를 사용하여 안전하게 process.env에 주입
  for (const [key, value] of Object.entries(env)) {
    // 무조건 덮어쓰기하여 .env.[mode] 파일의 우선순위 보장
    process.env[key] = value;
  }
}