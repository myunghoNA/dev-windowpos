import react from '@vitejs/plugin-react';
import { join } from 'path';
import { defineConfig } from 'vite';
import { chrome } from './electron-dep-versions';


const currentMode = process.env.MODE || 'prod';
/**
 * @name rendererPath
 * @description 렌더러(프론트엔드) 소스 디렉토리 절대 경로로 매핑
 */
const rendererPath = (pathString = '') =>
  join(process.cwd(), './src/renderer', pathString);

/**
 * @name RendererViteConfig
 * @description UI 레이어를 빌드하기 위한 Vite 및 Rollup 컴파일러 최종 설정 셋
 */
export default defineConfig({
  
  // ===========================================
  // 기본 루트 및 경로 별칭(Alias)
  // ===========================================
  base: './',
  root: rendererPath(),
  define: {
    'import.meta.env.MODE': JSON.stringify(currentMode),
    'process.env.MODE': JSON.stringify(currentMode),
  },
  resolve: {
    alias: {
      '@renderer/': rendererPath() + '/',
      '@shared/': join(process.cwd(), './src/shared') + '/',
    },
  },

  // ===========================================
  // CSS 및 전처리기 가드 세팅
  // ===========================================
  css: {
    preprocessorOptions: {
      scss: {
        // 구버전/신버전 모두에서 레거시 API 경고를 강제로 음소거(Mute) 처리
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },

  // ===========================================
  // 플러그인 레이어 (React + Emotion)
  // ===========================================
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],

  // ===========================================
  // 하드웨어 최적화 번들링 배포 세팅 (Rollup)
  // ===========================================
  build: {
    target: `chrome${chrome}`,
    outDir: join(process.cwd(), 'dist/source/renderer'),
    assetsDir: '.',
    rollupOptions: {
      input: {
        main: rendererPath('index.html'),
        'did-index': rendererPath('did-index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString();
          }
        },
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      // external: [] // 필요한 경우 external-packages 내용 추가
    },
    emptyOutDir: true,
    sourcemap: true,
  },
});
