const { join } = require('path');
const { node } = require('./electron-dep-versions');


/**
 * @name MainViteConfig
 * @type {import('vite').UserConfig}
 * @description 백엔드 코어 시스템(OS 네이티브 윈도우 핸들링, IPC 라우팅, 하드웨어 소켓 제어)을 빌드하기 위한 Vite 설정 셋 (CJS 포맷)
 * @see https://vitejs.dev/config/
 */
module.exports = {

  // ===========================================
  // 경로 정의 및 자원 정의
  // ===========================================
  publicDir: 'src/main/public',
  resolve: {
    alias: {
      '@main/': join(process.cwd(), './src/main') + '/',
      '@shared/': join(process.cwd(), './src/shared') + '/',
    },
  },

  // ===========================================
  // Node.js 코어 런타임 빌드 세팅
  // ===========================================
  build: {
    target: `node${node}`,
    outDir: 'dist/source/main',
    assetsDir: '.',
    // 개발 중에는 디버깅을 위해 압축 해제, 운영 환경에선 압축
    minify: process.env.MODE === 'dev' ? false : 'esbuild',
    lib: {
      entry: 'src/main/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      /**
       * @property external
       * @description 시리얼 포트(@serialport) 같은 C++ 네이티브 모듈은 
       * Vite 가상 번들링 시 파일이 깨지므로 ASAR 패키지 외부 패킹 대상(External)으로 원천 격리
       */
      external: require('./external-packages').default,
      output: {
        entryFileNames: '[name].[format].js',
        chunkFileNames: '[name].[format].js',
        assetFileNames: '[name].[ext]',
      },
    },
    emptyOutDir: true,
    sourcemap: true,
  },
};
