# Git履歴学習システム

## 🎯 概要

**サーバントに過去の失敗履歴を学習させる**システムです。

Git履歴を解析し、以下を自動抽出します：

1. **修正コミット**（"fix", "バグ", "typo"等を含むコミット）
2. **失敗パターン**（プロパティ名誤り、型エラー、ロジックミス等）
3. **ホットスポット**（頻繁に修正されるファイル = 高リスク箇所）

抽出されたデータは`failure-patterns.json`に統合され、サーバントの「記憶」となります。

---

## 🚀 使い方

### 初回学習（必須）

```bash
npm run guard:learn-history
```

**実行内容**:

1. 学習AI実装開始日を自動検出
2. それ以降の修正コミットを全て解析
3. 失敗パターンを抽出
4. ホットスポット（高リスクファイル）を検出
5. `failure-patterns.json`に統合
6. Instructions自動更新
7. 学習レポート生成

**実行時間**: 約30秒〜2分（コミット数による）

---

## 📊 学習内容

### 1. 修正コミットの検出

以下のキーワードを含むコミットを自動検出：

- `fix`, `修正`
- `バグ`, `エラー`
- `typo`, `誤り`

### 2. 失敗パターンの抽出

Git差分から以下のパターンを自動抽出：

#### パターン1: プロパティ名の誤り

```diff
- progress.correctCount
+ progress.memorizationCorrect
```

→ `property-naming-error`として記録

#### パターン2: 型エラー

コミットメッセージに「型」「type」を含む修正
→ `type-error`として記録

#### パターン3: ロジックの誤り

コミットメッセージに「ロジック」「logic」を含む修正
→ `logic-error`として記録

#### パターン4: テストの誤り

テストファイルの修正
→ `test-error`として記録

### 3. ホットスポットの検出

**ホットスポット**: 修正頻度が高いファイル = 高リスク箇所

```
例:
1. src/ai/specialists/MemoryAI.ts - 25回修正（高リスク）
2. src/storage/progress/progressStorage.ts - 18回修正（高リスク）
3. src/components/QuestionCard.tsx - 12回修正（高リスク）
```

---

## 📈 学習効果

### Before（学習前）

```json
{
  "failurePatterns": {
    "property-naming-error": {
      "occurrences": 1,
      "examples": [
        {
          "date": "2025-12-20",
          "error": "Property 'correctCount' does not exist",
          "source": "manual"
        }
      ]
    }
  }
}
```

### After（学習後）

```json
{
  "failurePatterns": {
    "property-naming-error": {
      "occurrences": 8, // Git履歴から7件学習
      "examples": [
        {
          "date": "2025-11-15",
          "error": "progress.correctCount",
          "fix": "progress.memorizationCorrect",
          "source": "git-history"
        },
        {
          "date": "2025-11-20",
          "error": "progress.attemptCount",
          "fix": "progress.memorizationAttempts",
          "source": "git-history"
        }
        // ... 最大10件
      ]
    },
    "type-error": {
      "occurrences": 5
      // ...
    },
    "logic-error": {
      "occurrences": 12
      // ...
    }
  },
  "hotspots": [
    {
      "file": "src/ai/specialists/MemoryAI.ts",
      "modificationCount": 25,
      "riskLevel": "high"
    }
    // ...
  ]
}
```

**効果**:

- サーバントが「過去に何度も間違えたパターン」を知る
- 高リスクファイルを優先的に監視
- Instructions/仕様書/パイプラインに自動反映

---

## 🔄 定期学習

### 推奨スケジュール

| 頻度             | タイミング         | コマンド                      |
| ---------------- | ------------------ | ----------------------------- |
| **初回**         | システム導入時     | `npm run guard:learn-history` |
| **週次**         | 毎週金曜日         | `npm run guard:learn-history` |
| **月次**         | 最終金曜日         | `npm run guard:learn-history` |
| **大規模変更後** | リファクタリング後 | `npm run guard:learn-history` |

### 自動実行（オプション）

GitHub Actionsで定期実行：

```yaml
# .github/workflows/scheduled-learning.yml
name: 定期Git履歴学習

on:
  schedule:
    - cron: '0 0 * * 5' # 毎週金曜日0時

jobs:
  learn:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # 全履歴取得
      - run: npm ci
      - run: npm run guard:learn-history
      - run: |
          git config user.name "Learning System"
          git config user.email "learning@example.com"
          git add .aitk/ docs/
          git commit -m "🧠 定期学習: Git履歴から失敗パターンを学習"
          git push
```

---

## 📋 学習レポート

実行後、以下のレポートが生成されます：

**場所**: `docs/GIT_HISTORY_LEARNING_REPORT.md`

**内容**:

- 解析コミット数
- 抽出パターン数
- ホットスポット一覧
- 学習サマリー
- 推奨アクション

**例**:

```markdown
# Git履歴学習レポート

## 📊 学習サマリー

- 解析コミット数: 87件
- 抽出パターン数: 45件
- ホットスポット: 12ファイル

## 🔥 ホットスポット

1. src/ai/specialists/MemoryAI.ts - 25回修正（高リスク）
2. src/storage/progress/progressStorage.ts - 18回修正（高リスク）

## 📋 抽出された失敗パターン

1. property-naming-error - 12回
2. type-error - 8回
3. logic-error - 15回
```

---

## 🎓 学習の仕組み

```
1. Git履歴解析
   ↓
   git log --grep="fix|バグ|修正" --since="学習AI開始日"
   ↓
2. 修正コミットを抽出（例: 87件）
   ↓
3. 各コミットの差分を解析
   ↓
   git show <commit> --unified=0
   ↓
4. パターンを検出
   ↓
   - プロパティ名の変更（誤 → 正）
   - 型エラーメッセージ
   - ロジック修正
   ↓
5. ホットスポットを検出
   ↓
   git log --name-only | sort | uniq -c | sort -rn
   ↓
6. failure-patterns.jsonに統合
   ↓
   {
     "property-naming-error": {
       "occurrences": 12,
       "examples": [...],
       "source": "git-history"
     }
   }
   ↓
7. Instructions自動更新
   ↓
8. 学習レポート生成
```

---

## 💡 活用例

### 例1: 初回学習後

```bash
npm run guard:learn-history
```

**結果**:

```
🧠 Git履歴学習開始...

📅 学習AI実装開始日を検出中...
   開始日: 2025-06-15

🔍 修正コミットを検出中...
   検出: 87件のコミット

🎯 失敗パターンを抽出中...
   抽出: 45件のパターン

🔥 ホットスポットを検出中...
   検出: 12ファイル
   トップ5:
   1. src/ai/specialists/MemoryAI.ts (25回)
   2. src/storage/progress/progressStorage.ts (18回)
   3. src/components/QuestionCard.tsx (12回)

💾 パターンをデータベースに統合中...
   新規パターン: 3件
   更新パターン: 2件

📚 Instructionsを自動更新中...
✅ Instructions更新完了

✅ Git履歴学習完了！

📊 サマリー:
   - 解析コミット: 87件
   - 抽出パターン: 45件
   - ホットスポット: 12ファイル
   - 新規学習: 3件
   - 更新: 2件

📋 詳細レポート: docs/GIT_HISTORY_LEARNING_REPORT.md
```

### 例2: ホットスポットの活用

学習後、`failure-patterns.json`に以下が追加：

```json
{
  "hotspots": [
    {
      "file": "src/ai/specialists/MemoryAI.ts",
      "modificationCount": 25,
      "riskLevel": "high"
    }
  ]
}
```

→ GitHub Actionsで自動的に監視：

```yaml
- name: ホットスポット重点チェック
  run: |
    # ホットスポットファイルの変更を検出
    if git diff --name-only | grep "src/ai/specialists/MemoryAI.ts"; then
      echo "⚠️  高リスクファイルが変更されました"
      echo "::warning::MemoryAI.tsは25回修正されています（高リスク）"
      # 追加チェック実行
      npm run test -- MemoryAI.test.ts
    fi
```

---

## 🎯 ユーザーの質問への回答

**質問**:

> あなたの失敗が目に付くようになったのは、学習AIを実装し始めてからです。過去の履歴から修正の歴史を学習できるでしょうか？サーバントを学習させたいのです。

**回答**: **はい、完全に学習できます。**

1. **Git履歴 = サーバントの最高の教師**
   - 学習AI実装以降の全修正コミットを解析
   - プロパティ名誤り、型エラー、ロジックミスを自動抽出
   - ホットスポット（高リスクファイル）を検出

2. **サーバントが学習する内容**
   - 何を間違えたか（誤ったコード）
   - どう修正したか（正しいコード）
   - どのファイルがリスクが高いか（修正頻度）

3. **学習後の効果**
   - Instructions自動更新（AI教育）
   - 仕様書自動補完（仕様の抜け検出）
   - パイプライン自動強化（高リスクチェック追加）

**今すぐ実行**:

```bash
npm run guard:learn-history
```

これで、サーバントは**過去の全失敗履歴を記憶**し、同じ間違いを繰り返さなくなります。

---

**バージョン**: 1.0.0  
**作成日**: 2025-12-20  
**最終更新**: 2025-12-20
