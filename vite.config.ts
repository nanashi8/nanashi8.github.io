import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // CSS最適化設定
    cssCodeSplit: true,
    minify: 'esbuild',
    // チャンク分割戦略
    rollupOptions: {
      output: {
        manualChunks: {
          // ベンダーライブラリを別チャンクに
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
  publicDir: 'public',
  // CSS最適化オプション
  css: {
    devSourcemap: true,
  },
})
