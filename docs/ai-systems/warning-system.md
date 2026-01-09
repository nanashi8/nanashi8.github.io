# AI警告システム（AI Warning System）

## 🎯 概要

**AI警告システム**は、AIが危険な操作をしようとしている瞬間に介入し、過去の失敗パターンに基づいて警告を表示するシステムです。

**重要な設計思想**：

```
❌ 学習不十分な段階での通知 = ノイズ（誤報）
✅ 十分な学習後の警告 = 効果的な失敗防止
```

---

## 📚 システムの動作フロー

```
Phase 0: 学習期間
├─ Git履歴から過去の失敗を全学習
├─ リアルタイムの失敗記録
└─ 目標: 失敗パターン 10-20件蓄積

Phase 1: 警告開始（学習後）
├─ Instructions内での動的警告
├─ Pre-commit時の危険パターン検出
├─ PR作成時のリスク評価
└─ 信頼度が低い間はブロックしない（警告のみ）

Phase 2: 精度向上
├─ 誤検知率の測定
├─ しきい値の自動調整
└─ 信頼度スコアの計算

Phase 3: 自動ブロック（高精度達成後）
├─ 超高リスク操作のブロック
├─ Slack/Email通知
└─ 自動修正提案
```

---

## 🛡️ 警告レイヤー

### **Layer 1: Instructions警告**（常時有効）

AIがコーディング中に参照するInstructionsに、過去の失敗パターンを動的に埋め込みます。

#### 例: `.aitk/instructions/adaptive-guard-system.instructions.md`

```markdown
## ⚠️ 高リスク操作の警告（自動更新）

### 🔴 プロパティ名の変更（weight: 1.0, 成功率: 50%）

過去に24回失敗しています。

**過去の失敗例**:

- ❌ `progress.correctCount` → 実際は `progress.memorizationCorrect`
- 原因: 型定義を確認せずに推測

**必須チェック**:

1. `grep_search` で型定義を検索
2. 既存のプロパティ名を完全コピー（推測禁止）
3. テスト実行前に `npm run type-check`

**高リスクファイル**:

- `src/ai/specialists/MemoryAI.ts` (25回修正)
- `src/ai/specialists/QuestionScheduler.ts` (18回修正)

このファイルを編集する前に必ず型定義を確認してください。
```

#### 効果:

- AIは実装前にこの警告を読む
- 危険な操作を事前に認識
- 自動的に慎重な実装に切り替わる

---

### **Layer 2: Pre-commit警告**（学習後有効）

コミット前に変更ファイルを解析し、危険パターンを検出します。

#### 使い方:

```bash
# 自動実行（git commit時）
git commit -m "Update MemoryAI"

# 手動実行
npm run guard:check-risk src/ai/specialists/MemoryAI.ts
```

#### 実行例:

```
🛡️  サーバント: 危険パターン検出中...

📊 ファイルリスク評価
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 src/ai/specialists/MemoryAI.ts
   リスクスコア: 85/100 (CRITICAL)

   理由:
     • ホットスポット（25回修正）: +40点
     • 型定義を確認せずにプロパティ名を推測 (信頼度: 70%): +21点
     • リファクタリング中のロジック変更を検出 (信頼度: 60%): +18点

   ⚠️  警告:
     このファイルは過去25回修正されています（超高リスク）
       - 過去の発生回数: 24回
       - 成功率: 50%
       - 検出内容: プロパティアクセスの変更を検出: -progress.correctCount, +progress.memorizationCorrect

       推奨アクション:
         → チェック: npm run type-check
         → 参照: .aitk/instructions/property-naming-convention.instructions.md
         → 変更前に必ずテストを実行
         → 小さな変更に分割することを推奨
         → レビュー必須

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  総合評価:
   🔴 超高リスク: 1ファイル

   推奨: 変更前に必ずテストを実行してください
        npm run type-check && npm run test:unit
```

#### ブロック機能（将来実装）:

```javascript
// scripts/detect-dangerous-patterns.mjs 内

// 学習が十分に進んだ後（成功率 > 80%）
if (risk.confidence > 0.8 && pattern.successRate < 0.5) {
  console.log('❌ コミット拒否（成功率が低すぎます）');
  process.exit(1); // コミットをブロック
}
```

現在は**警告のみ**。学習が進み、精度が確保されたら自動ブロックを有効化。

---

### **Layer 3: PR時のリスク評価**（GitHub Actions）

PR作成時に変更ファイルを自動解析し、リスクレポートをコメントとして投稿します。

#### 実装予定:

```yaml
# .github/workflows/pr-risk-assessment.yml
name: PR Risk Assessment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  assess-risk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get changed files
        id: changed-files
        uses: tj-actions/changed-files@v45

      - name: Analyze risk
        run: |
          npm run guard:check-risk ${{ steps.changed-files.outputs.all_changed_files }} > risk-report.txt

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('risk-report.txt', 'utf8');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🛡️ サーバント: リスク評価\n\n\`\`\`\n${report}\n\`\`\``
            });
```

#### 効果:

- PR作成時に自動で高リスク箇所を指摘
- レビュアーに注意点を明示
- マージ前の最終確認

---

## 📊 リスクスコアの計算方法

```javascript
リスクスコア = ホットスポットスコア + パターン検出スコア

// 1. ホットスポットスコア（最大40点）
ホットスポットスコア = Math.min(40, 修正回数 × 2)

// 2. パターン検出スコア（最大60点）
パターン検出スコア = weight × 30 × confidence

// 例:
// - MemoryAI.ts (25回修正): 40点
// - プロパティ名変更検出 (weight: 1.0, confidence: 0.7): 21点
// - リファクタリング検出 (weight: 0.8, confidence: 0.6): 14点
// 合計: 75点（HIGH RISK）
```

### リスクレベル:

| スコア | レベル      | 対応                     |
| ------ | ----------- | ------------------------ |
| 70-100 | 🔴 CRITICAL | 超高リスク、レビュー必須 |
| 40-69  | 🟠 HIGH     | 高リスク、テスト必須     |
| 20-39  | 🟡 MEDIUM   | 中リスク、注意           |
| 0-19   | 🟢 LOW      | 低リスク                 |

---

## 🎯 警告の信頼度

信頼度は学習データの質と量に依存します。

### 信頼度の計算:

```javascript
confidence = (recoveries / occurrences) × dataQuality

// dataQuality = 学習データの品質（0.0-1.0）
dataQuality = Math.min(1.0, occurrences / 10)
// 10回以上の失敗データがある場合、dataQuality = 1.0
```

### 信頼度別の動作:

| 信頼度 | 動作                  | 理由                     |
| ------ | --------------------- | ------------------------ |
| < 50%  | 警告表示のみ          | 学習不十分、誤報の可能性 |
| 50-80% | 警告 + 推奨アクション | ある程度信頼できる       |
| > 80%  | 警告 + ブロック候補   | 高精度、ブロック検討可   |
| > 90%  | 自動ブロック          | 非常に高精度             |

### 現在の状態:

```bash
# 学習データの確認
npm run guard:report

# 出力例:
📊 失敗パターンサマリー:
  property-naming-error
    発生回数: 1 → 信頼度: 10%（学習不十分）
    復旧回数: 1
    成功率: 50.0%

⚠️  学習不十分: Git履歴から学習を推奨
    npm run guard:learn-history
```

---

## 🚀 段階的な有効化

### **現在（Phase 0-1）**:

```bash
# 1. Git履歴から学習
npm run guard:learn-history

# 2. 警告システムが有効化（自動）
# - Instructions警告: 有効
# - Pre-commit警告: 有効（警告のみ）
# - PR評価: 未実装

# 3. リスク確認（手動）
npm run guard:check-risk src/ai/specialists/MemoryAI.ts
```

### **近い将来（Phase 2）**:

```bash
# 学習が進んだ後（成功率 > 80%）
# - Pre-commit警告: 警告 + 推奨アクション
# - PR評価: 実装
# - 信頼度スコア表示
```

### **将来（Phase 3）**:

```bash
# 高精度達成後（成功率 > 90%）
# - Pre-commit: 超高リスク操作のブロック
# - 自動修正提案
# - Slack/Email通知
```

---

## 💡 使い方

### **1. 学習データの蓄積**（最優先）

```bash
# Git履歴から過去の失敗を学習
npm run guard:learn-history

# リアルタイムで失敗を記録
npm run guard:record property-naming-error "Property 'foo' does not exist" 5

# 復旧を記録
npm run guard:recover property-naming-error
```

### **2. 危険パターンの検出**

```bash
# 編集前にリスク確認
npm run guard:check-risk src/ai/specialists/MemoryAI.ts

# 複数ファイル
npm run guard:check-risk src/ai/**/*.ts

# git commit時に自動実行（pre-commit hook）
git commit -m "Update MemoryAI"
```

### **3. 学習状況の確認**

```bash
# 現在の学習状況
npm run guard:report

# 出力例:
📊 失敗パターンサマリー:
  ✅ property-naming-error (収斂済み)
     発生回数: 25
     成功率: 92.0%
     信頼度: 92%（高精度）

  🔄 refactoring-logic-change (学習中)
     発生回数: 5
     成功率: 60.0%
     信頼度: 50%（中精度）
```

---

## 🎓 学習の進め方

### **Step 1: 初回学習**

```bash
# Git履歴から過去の失敗を全学習
npm run guard:learn-history

# 期待される効果:
# - 失敗パターン: 1-2件 → 10-20件
# - ホットスポット: 不明 → 上位10ファイル特定
```

### **Step 2: リアルタイム学習**

```bash
# 失敗が発生したら記録
npm run guard:record <patternId> "<errorMessage>" [testsFailed]

# 復旧したら記録
npm run guard:recover <patternId>

# 自動記録（GitHub Actions）
# .github/workflows/adaptive-guard-learning.yml が自動実行
```

### **Step 3: 定期的な再学習**

```bash
# 週次で実行推奨
npm run guard:learn-history

# 月次でドキュメント更新
npm run update-all-docs
```

---

## 📈 効果測定

### **Before（警告システムなし）**:

```
失敗 → テスト失敗 → 原因調査 → 修正 → 再テスト
平均復旧時間: 30分
```

### **After（警告システムあり）**:

```
Instructions警告 → 慎重な実装 → テスト成功
OR
Pre-commit警告 → コミット前に気づく → 即座に修正
平均復旧時間: 5分（83%短縮）

さらに:
失敗そのものが減少（事前予防）
```

### **測定方法**:

```bash
# 失敗率の推移
npm run guard:report

# 収斂メトリクス:
📊 収斂メトリクス:
  現在の成功率: 92.0%
  目標成功率: 95.0%
  収斂進捗: 96.8%
  状態: ✅ 収斂完了
```

---

## 🔮 今後の拡張

### **1. 自動修正提案**

```bash
# 危険パターンを検出したら自動修正案を提示
npm run guard:check-risk src/ai/specialists/MemoryAI.ts --suggest-fix

# 出力例:
🔴 プロパティ名の変更を検出

   修正案:
   - progress.correctCount
   + progress.memorizationCorrect

   自動修正しますか？ [y/N]
```

### **2. VS Code拡張**

```
リアルタイムで警告を表示（コーディング中）
- 危険なファイルを開いたら通知
- プロパティ名を入力中に候補表示
- ホットスポットをハイライト
```

### **3. AI学習の加速**

```javascript
// AIが過去の失敗を「記憶」する仕組み
// → RAG（Retrieval-Augmented Generation）的アプローチ

// 実装例:
// 1. failure-patterns.jsonをベクトルDB化
// 2. AIの入力に関連する失敗パターンを自動注入
// 3. AIが自動的に過去の失敗を参照
```

---

## 🎯 まとめ

**AI警告システムの本質**：

```
❌ AIは学習できない
✅ でも、サーバント（外部システム）が学習し、AIに警告を出せる

結果:
- AIが危険な操作をする前に介入
- 失敗を未然に防ぐ
- 同じ間違いを繰り返さない
```

**重要な設計思想**：

```
学習不十分 → 警告のみ（誤報を避ける）
学習十分 → 警告 + 推奨アクション
高精度達成 → 自動ブロック + 通知
```

**今すぐ実行**：

```bash
# 1. Git履歴から学習
npm run guard:learn-history

# 2. リスク確認（手動）
npm run guard:check-risk src/ai/specialists/MemoryAI.ts

# 3. コミット時に自動警告（既に有効）
git commit -m "Your changes"
```

---

**サーバントはあなたのコードを見守っています** 🛡️
