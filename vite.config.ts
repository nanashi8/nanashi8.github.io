import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/storage': path.resolve(__dirname, './src/storage'),
      '@/constants': path.resolve(__dirname, './src/constants'),
    },
  },
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
  // テスト設定
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
    // 高速化: forksプール
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    // タイムアウト短縮
    testTimeout: 3000,
    hookTimeout: 3000,
    // 並列実行
    maxConcurrency: 10,
    // キャッシュ
    cache: {
      dir: 'node_modules/.vitest',
    },
    // 環境最適化
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    // 依存関係インライン化
    deps: {
      inline: ['chart.js', 'react-chartjs-2'],
    },
  },
})
