# .gitignore 更新案

以下を `.gitignore` に追加してください：

```gitignore
# ========================================
# AI実行データ・キャッシュ（整理計画対応）
# ========================================

# AI全般の実行データ（.ai/統合後）
.ai/.data/
.ai/.data/history/*.json
.ai/.data/cache/

# VS Code AI実行データ
.vscode/.ai-data/
.vscode/ai-*.json
.vscode/neural-*.json
.vscode/project-*.json
.vscode/workflow-*.json
.vscode/cache/

# 旧構造の実行データ（マイグレーション期間中）
.aitk/*.json
.aitk/.commit-count
.aitk/spec-check.json

# pytest キャッシュ
.pytest_cache/
__pycache__/
*.pyc
*.pyo
```

## 既存の重複エントリとの統合

現在の `.gitignore` に以下の行があります：

```gitignore
.aitk/spec-check.json
.aitk/.commit-count
```

これらは上記の包括的なパターンに統合されます。
