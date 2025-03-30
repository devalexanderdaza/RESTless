import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: false,
    cors: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RESTless',
      formats: ['es', 'umd'],
      fileName: (format) => `restless.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'restless.[ext]'
      }
    }
  },
  optimizeDeps: {
    exclude: []
  }
});