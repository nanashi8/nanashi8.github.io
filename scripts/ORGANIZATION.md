# Scripts ディレクトリ整理ガイド

## 📂 現在の課題

`scripts/`ディレクトリが150以上のファイルでフラット構造になっており、以下の問題があります：
- どのスクリプトがどこで使われるか不明確
- 用途別の検索が困難
- 新規参加者が迷う

## 🎯 推奨される整理構造

### 第1段階: カテゴリ分類（最小限）

```
scripts/
├── README.md                           # 導線：全体の説明とカテゴリ索引
├── hooks/                              # Git hooks の実体
│   ├── pre-commit-ai-guard.sh
│   ├── pre-commit-quality-guard.sh
│   ├── pre-commit-symptomatic-check
│   ├── adaptive-guard-checks.sh
│   └── efficiency-guard.sh
├── checks/                             # 品質チェック（CI/手動実行）
│   ├── check-*.sh
│   ├── check-*.mjs
│   └── check_*.py
├── validation/                         # データ検証
│   ├── validate-*.py
│   ├── validate-*.ts
│   └── validate-*.sh
├── generation/                         # コンテンツ生成
│   ├── generate-*.ts
│   ├── generate-*.mjs
│   └── generate_*.py
├── data-processing/                    # データ処理・変換
│   ├── convert-*.py
│   ├── convert-*.ts
│   ├── migrate-*.ts
│   ├── fix-*.py
│   ├── add-*.py
│   └── auto-fix-*.py
├── analysis/                           # 分析・レポート
│   ├── analyze-*.mjs
│   ├── analyze-*.sh
│   └── *-stats-*.py
├── maintenance/                        # メンテナンス・ヘルスチェック
│   ├── health-check.sh
│   ├── project_ai_servant.py
│   ├── maintenance_ai.py
│   └── monitor_project_health.py
├── testing/                            # テスト実行
│   ├── test-runner.sh
│   ├── smart-test.sh
│   ├── test-*.py
│   └── simulate-*.mjs
├── deployment/                         # デプロイ関連
│   ├── deploy-gh-pages.mjs
│   ├── copy-constellation-demo-vendors.mjs
│   └── setup-branch-protection.sh
├── guards/                             # ガード・パターン検出
│   ├── guard-*.sh
│   ├── detect-dangerous-patterns.mjs
│   ├── ai-guard-check.mjs
│   └── learn-from-*.mjs
├── documentation/                      # ドキュメント処理
│   ├── docpart/
│   ├── generate-docs-index.ts
│   ├── update-instructions.mjs
│   ├── update-specifications.mjs
│   └── sync-reading-techniques.mjs
└── archive/                            # 廃止・参考用
    └── (古いスクリプト)
```

### 第2段階: package.json scripts の整理

```json
{
  "scripts": {
    "// === Development ===": "",
    "dev": "npm run copy:assets && vite",
    "preview": "vite preview",
    
    "// === Build & Deploy ===": "",
    "build": "...",
    "deploy": "...",
    "deploy:beta": "...",
    
    "// === Quality Checks ===": "",
    "quality:check": "...",
    "quality:strict": "...",
    "quality:grammar": "...",
    
    "// === Testing ===": "",
    "test": "npm run test:unit:fast",
    "test:unit": "...",
    "test:smoke": "...",
    "test:visual": "...",
    
    "// === Validation ===": "",
    "validate": "...",
    "validate:grammar": "...",
    "validate:social-studies": "...",
    
    "// === Guards ===": "",
    "guard:record": "...",
    "guard:check-risk": "...",
    
    "// === Documentation ===": "",
    "docs:analyze": "...",
    "generate-index": "..."
  }
}
```

## 🔄 実行フロー

### Git フックからの実行

```
git commit
  ↓
.husky/pre-commit
  ↓
scripts/hooks/pre-commit-ai-guard.sh  ← 実体
  ↓
scripts/checks/check-*.sh
  ↓
scripts/validation/validate-*.py
```

### package.json からの実行

```
npm run quality:check
  ↓
package.json "scripts"
  ↓
scripts/checks/check-*.sh
```

### 手動実行

```bash
# 直接実行
bash scripts/hooks/pre-commit-ai-guard.sh

# npm経由
npm run quality:check

# Python直接実行
python3 scripts/maintenance/project_ai_servant.py --status
```

## 📚 ドキュメント導線

### 必須ドキュメント

1. **scripts/README.md** - メインの導線
   ```markdown
   # Scripts ディレクトリ
   
   ## カテゴリ別索引
   - [Hooks](./hooks/README.md) - Git hooks の実体
   - [Checks](./checks/README.md) - 品質チェック
   - ...
   
   ## よく使うコマンド
   - コミット前チェック: `npm run quality:check`
   - データ検証: `npm run validate`
   ...
   ```

2. **各カテゴリのREADME** (例: `scripts/hooks/README.md`)
   ```markdown
   # Git Hooks
   
   ## ファイル一覧
   - `pre-commit-ai-guard.sh` - AIガード（.husky/pre-commitから呼ばれる）
   - `adaptive-guard-checks.sh` - 適応的チェック
   
   ## 実行方法
   自動: git commit時
   手動: `bash scripts/hooks/pre-commit-ai-guard.sh`
   ```

3. **package.jsonのコメント** - scripts セクションに `//` でコメント

4. **VS Code tasks.json** (オプション)
   ```json
   {
     "tasks": [
       {
         "label": "🔍 Pre-commit Check",
         "type": "shell",
         "command": "bash scripts/hooks/pre-commit-ai-guard.sh"
       }
     ]
   }
   ```

## 🔧 移行手順

### ステップ1: カテゴリディレクトリ作成

```bash
mkdir -p scripts/{hooks,checks,validation,generation,data-processing,analysis,maintenance,testing,deployment,guards,documentation}
```

### ステップ2: 段階的移動

```bash
# 例: hooks カテゴリ
git mv scripts/pre-commit-*.sh scripts/hooks/
git mv scripts/*-guard*.sh scripts/hooks/

# 例: checks カテゴリ  
git mv scripts/check-*.sh scripts/checks/
git mv scripts/check-*.mjs scripts/checks/
```

### ステップ3: パス更新

1. `.husky/*` のファイル
2. `package.json` の scripts
3. 他のスクリプトからの相対パス参照

### ステップ4: README追加

各カテゴリに README.md を追加

## ⚠️ 注意点

1. **Git履歴の保持**: `git mv` を使う（コピー＆削除NG）
2. **段階的移行**: 全部一度に移動せず、カテゴリごとに
3. **テスト**: 移行後、必ず `npm run quality:check` 実行
4. **チーム通知**: 移行前にチームに周知

## 🎯 優先順位

1. **高**: hooks カテゴリ（.huskyとの連携を明確化）
2. **中**: checks, validation（よく使う）
3. **低**: その他（段階的に）

## 📊 期待効果

- 検索時間: 30秒 → 5秒
- 新規参加者の理解: 3日 → 30分
- 保守性: 大幅向上
