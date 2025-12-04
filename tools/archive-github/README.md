# Archive: 旧GitHub Actions設定

このフォルダには、外側のフォルダ構造用に作成された古いGitHub Actions設定が保管されています。

## 保管されているファイル

### `workflows/quality-check.yml`
品質保証パイプライン（Quality Assurance Pipeline）

**目的**: 
- データ品質の自動検証
- UI仕様書への準拠チェック
- パッセージ品質の詳細検証
- 品質低下の検出

**状態**: 
- ❌ 現在は機能しない（参照するスクリプトがアーカイブに移動済み）
- パスが旧構造 `nanashi8.github.io/public/data/**` を前提

**参照スクリプト** (すべて `tools/archive-scripts/` に移動済み):
- `validate_all_content.py`
- `validate_ui_specifications.py`
- `validate_passage_quality.py`
- `check_quality_regression.py`
- `generate_quality_report.py`

## 現在の品質チェック

現在は以下のワークフローが `.github/workflows/` で稼働中:
- `build.yml` - TypeScript型チェックとビルド確認
- `smoke-test.yml` - Playwrightによる煙テスト
- `css-lint.yml` - CSSリント
- `deploy.yml` - GitHub Pagesへのデプロイ

## 復元方法

このワークフローを復元する場合:
1. パスを現在の構造に修正 (`nanashi8.github.io/` プレフィックスを削除)
2. 必要なPythonスクリプトを `scripts/` に復元
3. `.github/workflows/` にコピー
