const { join } = require('path');
const { chrome } = require('./electron-dep-versions');


/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
module.exports = {
  resolve: {
    alias: {
      '@preload/': join(process.cwd(), './src/preload') + '/',
      '@shared/': join(process.cwd(), './src/shared') + '/',
    },
  },
  build: {
    target: `chrome${chrome}`,
    outDir: 'dist/source/preload',
    assetsDir: '.',
    minify: process.env.MODE === 'dev' ? false : 'esbuild',
    lib: {
      entry: 'src/preload/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: require('./external-packages').default,
      output: {
        entryFileNames: '[name].[format].js',
        chunkFileNames: '[name].[format].js',
        assetFileNames: '[name].[ext]',
      },
    },
    emptyOutDir: true,
  },
};
