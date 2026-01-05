import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E テスト設定
 *
 * 破壊的変更を防ぐための自動テスト設定
 */
export default defineConfig({
  testDir: './tests',

  // tests/ 配下はVitestとPlaywrightが混在しているため、Playwrightは専用サフィックスのみ対象
  // 例: *.pw.spec.ts / *.pw.spec.tsx
  testMatch: '**/*.pw.spec.{ts,tsx,js,jsx}',

  // タイムアウト設定
  timeout: 30 * 1000, // 外部URL（本番/beta）にアクセスするため余裕を持たせる
  expect: {
    timeout: 10 * 1000,
  },

  // テスト実行設定
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // レポート設定
  reporter: [['html', { open: 'never' }], ['list'], process.env.CI ? ['github'] : ['list']],

  // 共通設定
  use: {
    // ベースURL（環境変数で上書き可能）
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    // 外部URLの初回ロードが遅い環境でも落ちないように
    navigationTimeout: 30 * 1000,

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

  // 開発サーバーは手動で起動してください: npm run dev
  // webServer設定は削除（高速化のため）
});
