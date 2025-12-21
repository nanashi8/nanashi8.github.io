---
title: 視覚回帰テスト（Visual Regression Testing）ガイド
created: 2025-12-02
updated: 2025-12-07
status: in-progress
tags: [development, ai, test]
---

# 視覚回帰テスト（Visual Regression Testing）ガイド

## 概要

このプロジェクトでは、CSSリファクタリングやUI変更時にレイアウト崩壊を自動検出するため、視覚回帰テストを導入しています。

## 仕組み

1. **ベースラインスクリーンショット**: 正常な状態のスクリーンショットを保存
1. **テスト実行**: 変更後のスクリーンショットとベースラインを比較
1. **差分検出**: ピクセル単位で差分を検出し、許容範囲を超えたら失敗

## 使い方

### 初回セットアップ（ベースライン作成）

正常な状態でベースラインスクリーンショットを生成：

```bash
npm run test:smoke:update
```

これにより `tests/*.spec.ts-snapshots/` ディレクトリにスクリーンショットが保存されます。

### テスト実行

```bash
# 通常実行
npm run test:smoke

# UI モード（インタラクティブ）
npm run test:smoke:ui

# デバッグモード
npm run test:smoke:debug
```

### ベースライン更新

意図的にデザインを変更した場合、ベースラインを更新：

```bash
npm run test:smoke:update
```

**⚠️ 注意**: ベースライン更新は慎重に行ってください。レイアウト崩壊を「正常」として記録してしまう可能性があります。

## テスト内容

### 機能テスト

- ✅ アプリ起動
- ✅ 翻訳クイズ開始
- ✅ 文法クイズ開始
- ✅ JavaScriptエラーなし

### 視覚回帰テスト

- 📸 メインページ全体
- 📸 翻訳クイズ問題カード
- 📸 文法クイズ問題カード
- 📸 スコアボード
- 📸 ナビゲーションタブ
- 📸 ボタンスタイル

### CSS変数テスト

- ✅ カラーパレット変数
- ✅ スペーシング変数
- ✅ タイポグラフィ変数
- ✅ Z-index変数

### レスポンシブテスト

- 📱 モバイル（375x667）
- 📱 タブレット（768x1024）
- 💻 デスクトップ（1280x720）

## CI/CD統合

### Pre-commit フック

コミット前に自動実行：

- ESLintチェック
- TypeScript型チェック
- CSSチェック
- ビルドチェック

### Pre-push フック

プッシュ前に自動実行：

- 煙テスト（機能 + 視覚回帰）

破壊的変更があると、プッシュが中止されます。

### GitHub Actions

Pull Request作成時に自動実行：

- すべてのテスト
- スクリーンショット差分
- テスト結果をPRにコメント

## トラブルシューティング

### テストが失敗する場合

1. **意図した変更の場合**

   ```bash
   npm run test:smoke:update
   git add tests/*.spec.ts-snapshots/
   git commit -m "chore: 視覚回帰テストのベースライン更新"
   ```

1. **意図しない変更の場合**
   - `playwright-report/index.html` を開いて差分を確認
   - CSSの変更を元に戻す
   - CSS変数の定義を確認

1. **フレーキー（不安定）なテストの場合**
   - `maxDiffPixels` の値を調整
   - アニメーションが無効化されているか確認
   - フォントの読み込みを待機

### スクリーンショットの差分を確認

```bash
# UIモードで差分を視覚的に確認
npm run test:smoke:ui
```

## ベストプラクティス

### CSS変更時

1. ローカルで煙テストを実行
1. 差分を確認
1. 意図した変更のみベースライン更新
1. コミット前に再度テスト

### リファクタリング時

1. テストを実行してベースライン確保
1. リファクタリング実施
1. テスト実行で差分確認
1. 差分がない = 安全なリファクタリング成功

### 新機能追加時

1. 新しいテストケースを追加
1. ベースラインスクリーンショット生成
1. テストがパスすることを確認
1. コミット

## ファイル構成

```
tests/
  smoke.spec.ts                    # 煙テスト定義
  smoke.spec.ts-snapshots/         # ベースラインスクリーンショット（Git管理）
    chromium-darwin/               # OS・ブラウザ別
      main-page.png
      translation-quiz-question.png
      grammar-quiz-question.png
      ...

playwright-report/                 # テストレポート（Git無視）
test-results/                      # テスト結果（Git無視）
```

## 参考リンク

- [Playwright Visual Comparisons](https://playwright.d../test-snapshots)
- [Visual Regression Testing Guide](https://playwright.d../screenshots)
