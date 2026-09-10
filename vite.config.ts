import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',          // 무조건 v8 엔진 사용
      reporter: ['text', 'html'], // 터미널에 요약 출력 + 예쁜 HTML 리포트 생성
      
      // 💡 선택사항: 커버리지 측정에서 제외할 경로 지정 (설정 파일, 빌드 결과물 등)
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.*',
        '**/*.test.ts', // 테스트 파일 자체는 측정 제외
      ],
    },
  },
  resolve: {
    alias: {
      // '/@'로 시작하는 경로를 실제 물리적인 src 폴더 경로로 맵핑
      '@renderer': path.resolve(__dirname, './src/renderer'),
      // 메인 프로세스용 별칭 추가
      '@main': path.resolve(__dirname, './src/main'),
    },
  },
});