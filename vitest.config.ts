import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.spec.ts',
      'tests/content/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
    exclude: ['tests/smoke*.spec.ts', 'tests/visual*.spec.ts', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'dist-beta/',
        'tests/',
        'playwright-report/',
        'test-results/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types.ts',
        '**/types/*.ts',
        'src/vite-env.d.ts',
        'src/tests/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
