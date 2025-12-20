---
description: GitHub Actions CI/CDパイプライン強化 - 型チェック・テスト・品質検証の自動化
---

# CI/CDパイプライン強化設定

## 新規追加する検証ステップ

### 1. TypeScript型チェック（必須）

```yaml
- name: TypeScript型チェック
  run: npm run type-check
  
- name: 型チェック失敗時の通知
  if: failure()
  run: |
    echo "::error::TypeScript型エラーが検出されました"
    echo "::error::src/storage/progress/types.ts を確認してください"
```

### 2. ESLint実行（必須）

```yaml
- name: ESLint実行
  run: npm run lint
  
- name: リント失敗時の通知
  if: failure()
  run: |
    echo "::error::ESLintエラーが検出されました"
    echo "::error::npm run lint:fix で自動修正を試行してください"
```

### 3. ユニットテスト（必須）

```yaml
- name: ユニットテスト実行
  run: npm run test:unit
  
- name: テストカバレッジレポート生成
  run: npm run test:coverage
  
- name: カバレッジアップロード
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### 4. 統合テスト（必須）

```yaml
- name: 統合テスト実行
  run: npm run test:integration
  
- name: スクリーンショット比較
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-screenshots
    path: test-results/
```

## 実装予定のワークフロー

### `.github/workflows/quality-check.yml`

完全な型チェック・リント・テストパイプライン

### `.github/workflows/pr-validation.yml`

プルリクエスト時の検証パイプライン

### `.github/workflows/dependency-update.yml`

依存関係の自動更新と検証
