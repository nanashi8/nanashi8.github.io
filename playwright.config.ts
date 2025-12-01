import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E テスト設定
 * 
 * 破壊的変更を防ぐための自動テスト設定
 */
export default defineConfig({
  testDir: './tests',
  
  // タイムアウト設定
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  // テスト実行設定
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // レポート設定
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // 共通設定
  use: {
    // ベースURL
    baseURL: 'http://localhost:5173',
    
    // トレース設定（失敗時のみ）
    trace: 'on-first-retry',
    
    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',
    
    // ビデオ（失敗時のみ）
    video: 'retain-on-failure',
  },
  
  // プロジェクト設定（ブラウザ）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // 開発サーバー設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
