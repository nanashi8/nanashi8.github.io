# アーカイブ: 2026年1月8日

## 統合により不要になったワークフロー

以下のワークフローは `quality-check.yml`（品質保証パイプライン統合版）に統合されました。

### 統合されたワークフロー:

1. **build.yml** 
   - TypeScript型チェック
   - ESLintチェック
   - ビルド確認
   - Bundle Sizeチェック
   
   → `quality-check.yml` の該当ステップに統合

2. **css-lint.yml**
   - Stylelintによるcss品質チェック
   
   → `quality-check.yml` の「CSSリント (Stylelint)」ステップに統合

3. **pr-validation.yml**
   - PR品質検証
   - 変更ファイルの型チェック・リント
   
   → `quality-check.yml` がPRトリガーを含むため統合

### 統合の効果:

- ✅ CI実行時間の短縮（重複実行を削減）
- ✅ GitHub Actionsの並列実行枠の節約
- ✅ 保守性の向上（1つのワークフローで全体を把握）
- ✅ Node.jsバージョンの統一管理（20に統一）

### 復元方法:

これらのワークフローを復元する必要がある場合は、このフォルダから `.github/workflows/` にコピーしてください。
ただし、`quality-check.yml` と重複するため、通常は復元不要です。

### 実施者:

- AI Copilot (GitHub Copilot with Claude Sonnet 4.5)
- Servant拡張のActionsHealthMonitor機能による推奨に基づく
