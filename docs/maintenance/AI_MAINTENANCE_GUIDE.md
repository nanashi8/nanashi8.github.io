---
canonical: docs/maintenance/AI_MAINTENANCE_GUIDE.md
status: stable
lastUpdated: 2025-12-19
version: 1.0.0
diataxisCategory: how-to
description: 学習AIシステム（8-AI）の包括的メンテナンスガイド
references:
  - .aitk/instructions/meta-ai-priority.instructions.md
  - docs/guidelines/META_AI_TROUBLESHOOTING.md
  - docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md
  - docs/specifications/QUESTION_SCHEDULER_SPEC.md
  - docs/how-to/QUESTION_SCHEDULER_RECOVERY.md
doNotMove: true
---

# 学習AIシステム メンテナンスガイド

**バージョン**: 1.0.0  
**最終更新**: 2025-12-19  
**対象**: 開発者・AIアシスタント  
**目的**: 8-AIシステム（7つの専門AI + メタAI統合層）のメンテナンス手順を体系化

---

## 📋 目次

1. [メンテナンス開始前の確認](#メンテナンス開始前の確認)
2. [問題の分類と診断フロー](#問題の分類と診断フロー)
3. [パイプライン確認手順](#パイプライン確認手順)
4. [コンポーネント別メンテナンス](#コンポーネント別メンテナンス)
5. [予防保守チェックリスト](#予防保守チェックリスト)
6. [緊急対応手順](#緊急対応手順)

---

## メンテナンス開始前の確認

### ⚠️ 必ず最初に実行

学習AIのメンテナンス作業を開始する前に、以下の手順で現状を把握してください。

#### 1. システム全体の健全性チェック（5分）

```bash
# TypeScriptエラーの確認
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io
npx tsc --noEmit

# 期待結果: エラー0件
```

```bash
# ビルドの成功確認
npm run build

# 期待結果: ビルド成功
```

```bash
# テストスイートの実行
npm run test

# 期待結果: All tests passed
```

**判定**:
- ✅ すべて成功 → 通常メンテナンスへ進む
- ❌ いずれか失敗 → [緊急対応手順](#緊急対応手順)へ

#### 2. AI統合の有効化状態確認（1分）

ブラウザのコンソール（F12）で実行：

```javascript
// AI統合の状態確認
console.log('AI統合:', localStorage.getItem('enable-ai-coordination'));
// 期待結果: 'true' または null

// 進捗データの存在確認
const progress = localStorage.getItem('english-progress');
console.log('進捗データサイズ:', progress ? progress.length : 0);
// 期待結果: 数値（0以上）
```

#### 3. QuestionSchedulerの動作確認（3分）

ブラウザで暗記タブを開き、F12コンソールで以下のログを確認：

```text
必須ログ（これらが表示されない場合は異常）:
✅ [QuestionScheduler] カテゴリー統計: ...
✅ [QuestionScheduler] 振動防止除外: ...
✅ [QuestionScheduler] スケジューリング完了: ...

AI統合が有効の場合の追加ログ:
✅ 🤖 [MemorizationView] AI統合が有効化されました
✅ 🧠 Memory AI Signal: ...
✅ 💤 Cognitive Load AI Signal: ...
```

**判定基準**:
- 必須ログがすべて表示される → 正常動作
- 必須ログが1つでも欠けている → [問題の分類と診断フロー](#問題の分類と診断フロー)へ

---

## 問題の分類と診断フロー

### 🔍 問題分類マトリクス

メンテナンス指示を受けたら、まず問題を以下のカテゴリーに分類してください。

| 症状 | カテゴリー | 優先度 | 初期診断先 |
|------|-----------|--------|-----------|
| 問題が全く出題されない | 致命的エラー | P0 | [QuestionScheduler診断](#1-questionschedulerメタai統合層) |
| 復習単語が出題されない | category管理不具合 | P0 | [category管理診断](#2-category管理システム) |
| 優先度がおかしい | 優先度計算不具合 | P1 | [優先度計算診断](#優先度計算の検証) |
| 同じ問題が連続出題 | 振動防止不具合 | P1 | [振動防止診断](#振動防止の検証) |
| AIシグナルが反映されない | AI統合不具合 | P2 | [AI統合診断](#3-ai統合層aicoordinator) |
| 特定タブだけ動作しない | タブ固有問題 | P1 | [タブ別診断](#4-タブ別コンポーネント) |
| パフォーマンス低下 | 最適化必要 | P3 | [パフォーマンス診断](#パフォーマンスチェック) |

### 📊 診断フローチャート

```
学習AIメンテナンス指示
        ↓
┌───────────────────┐
│ 問題の症状は？    │
└───────────────────┘
        ↓
    [分類判定]
        ↓
┌─────────┬─────────┬─────────┬─────────┐
│ 出題停止 │ 復習NG  │ 優先度NG │ その他  │
└─────────┴─────────┴─────────┴─────────┘
    ↓         ↓         ↓         ↓
 P0:緊急   P0:緊急   P1:高優先  P2/P3:通常
    ↓         ↓         ↓         ↓
[QScheduler][category][優先度計算][該当セクション]
    診断      診断      診断        へ移動
```

---

## パイプライン確認手順

### パイプラインとは？

学習AIシステムには、以下の3つの品質保証パイプラインが存在します。メンテナンス時は、**該当するパイプラインを必ず確認**してください。

#### 1. QuestionScheduler品質保証パイプライン

**ドキュメント**: [QUESTION_SCHEDULER_QA_PIPELINE.md](../quality/QUESTION_SCHEDULER_QA_PIPELINE.md)

**対象範囲**:
- QuestionScheduler（メタAI統合層）
- category管理システム
- 優先度計算ロジック
- 振動防止機構

**確認コマンド**:

```bash
# ユニットテストの実行
npm run test -- src/ai/scheduler/QuestionScheduler.test.ts

# 統合テストの実行
npm run test:integration

# シミュレーションテスト
npm run test:simulation
```

**パイプライン実行タイミング**:
- QuestionScheduler.ts変更時（必須）
- progressStorage.ts変更時（必須）
- 出題不具合報告時（必須）
- 定期実施: 毎週1回

#### 2. AI統合品質パイプライン

**ドキュメント**: [integration-guide.md](../ai-systems/integration-guide.md)

**対象範囲**:
- AICoordinator（7AIシグナル統合）
- 7つの専門AI（Memory AI〜Gamification AI）
- AI統合フラグ管理

**確認コマンド**:

```bash
# AI統合テスト
npm run test:ai-integration

# 個別AIのテスト
npm run test -- src/ai/specialists/*.test.ts
```

**パイプライン実行タイミング**:
- AICoordinator.ts変更時（必須）
- 専門AI（specialists/*.ts）変更時（必須）
- AI統合動作不具合時（必須）

#### 3. 統合品質パイプライン

**ドキュメント**: [INTEGRATED_QUALITY_PIPELINE.md](../quality/INTEGRATED_QUALITY_PIPELINE.md)

**対象範囲**:
- データ品質（文法・和訳・スペル・長文）
- コンテンツ重複チェック
- 全体的なデータ整合性

**確認コマンド**:

```bash
# 全タブデータ検証
python3 scripts/validate_all_content.py

# 特定タブのみ
python3 scripts/validate_all_content.py --type grammar
```

**パイプライン実行タイミング**:
- データファイル変更時
- コンテンツ追加時
- 定期実施: データ追加後

### パイプライン確認の優先順位

メンテナンス時は以下の順序でパイプラインを確認：

1. **QuestionScheduler品質保証パイプライン**（最優先）
   - 出題機能の根幹を担当
   - 不具合の影響範囲が最大

2. **AI統合品質パイプライン**
   - 7AI機能の動作確認
   - オプトイン機能のため影響範囲限定

3. **統合品質パイプライン**
   - データ品質の確認
   - 出題機能とは独立

---

## コンポーネント別メンテナンス

### 1. QuestionScheduler（メタAI統合層）

**ファイルパス**: `src/ai/scheduler/QuestionScheduler.ts`

#### 1.1 日常的なメンテナンス手順

```bash
# Step 1: 型定義の確認
cat src/ai/scheduler/types.ts | grep "export interface"

# Step 2: テストの実行
npm run test -- QuestionScheduler.test.ts

# Step 3: デバッグログの確認（ブラウザで）
# → F12コンソールで「QuestionScheduler」を検索
```

#### 1.2 よくあるメンテナンス課題

**課題A: 復習単語が出題されない**

診断手順:

```typescript
// ブラウザコンソールで実行
const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
const incorrectWords = Object.entries(progress)
  .filter(([_, data]) => data.category === 'incorrect')
  .map(([word, data]) => ({ word, ...data }));
console.table(incorrectWords);
```

期待結果: incorrect単語が存在し、lastSeenAt等のプロパティが存在する

対応ドキュメント:
- [META_AI_TROUBLESHOOTING.md](../guidelines/META_AI_TROUBLESHOOTING.md) - Section: "復習単語が出題されない"
- [meta-ai-priority.instructions.md](../../.aitk/instructions/meta-ai-priority.instructions.md) - Section: "問題1"

**課題B: 優先度計算が期待と異なる**

診断手順:

```javascript
// ブラウザコンソールでログを確認
// 期待ログ: [QuestionScheduler] 優先度計算: ...
```

確認ポイント:
- 基本優先度が正しく計算されているか
- DTAブースト（forgettingRisk）が適用されているか
- シグナル反映率が30%以内に制限されているか

対応ドキュメント:
- [QUESTION_SCHEDULER_SPEC.md](../specifications/QUESTION_SCHEDULER_SPEC.md) - Section: "アルゴリズム詳細"

**課題C: 振動（同じ問題が連続出題）**

診断手順:

```javascript
// ブラウザコンソールでログ確認
// 期待ログ: [QuestionScheduler] 振動防止除外: X問
```

確認ポイント:
- recentAnswersが正しく保存されているか
- VIBRATION_PENALTY（-1000）が適用されているか
- 除外期間（1分）が正しく計算されているか

対応ドキュメント:
- [meta-ai-priority.instructions.md](../../.aitk/instructions/meta-ai-priority.instructions.md) - Section: "問題3"

### 2. category管理システム

**ファイルパス**: `src/utils/progressStorage.ts`

#### 2.1 category更新ロジックの確認

```typescript
// 正しい更新パターン（MemorizationView.tsx等で使用）
updateProgress(question.word, {
  category: isCorrect ? 'mastered' : 'incorrect',
  lastSeenAt: Date.now(),
  reviewCount: (currentData?.reviewCount || 0) + 1,
  correctStreak: isCorrect ? (currentData?.correctStreak || 0) + 1 : 0,
});
```

#### 2.2 category修復機能の確認

```javascript
// ブラウザコンソールで修復ログを確認
// 期待ログ: [Category Repair] 修復された単語数: X
```

修復ロジックが実行されない場合:
- `loadProgress()`が正しく呼ばれているか確認
- localStorage破損の可能性を確認

### 3. AI統合層（AICoordinator）

**ファイルパス**: `src/ai/coordinator/AICoordinator.ts`

#### 3.1 AI統合の有効化確認

```javascript
// ブラウザコンソールで実行
localStorage.getItem('enable-ai-coordination');
// 期待結果: 'true' または null（無効）
```

#### 3.2 7AIシグナルの確認

```javascript
// ブラウザコンソールでログを確認
// 期待ログ（AI統合が有効の場合）:
// 🧠 Memory AI Signal: ...
// 💤 Cognitive Load AI Signal: ...
// 🔮 Error Prediction AI Signal: ...
// 🎯 Learning Style AI Signal: ...
// 📚 Linguistic AI Signal: ...
// 🌍 Contextual AI Signal: ...
// 🎮 Gamification AI Signal: ...
```

#### 3.3 Promise.all並列処理の確認

```typescript
// AICoordinator.ts内部
const signals = await Promise.all([
  this.memoryAI.generateSignal(context),
  this.cognitiveLoadAI.generateSignal(context),
  // ... 他5つのAI
]);
```

エラーハンドリング:
- 個別AIでエラーが発生しても他のAIは継続実行される
- エラーログを確認: `catch (error)` ブロックでコンソール出力

### 4. タブ別コンポーネント

各タブ固有の実装を確認：

| タブ | ファイル | QuestionScheduler統合 |
|------|---------|---------------------|
| 暗記 | MemorizationView.tsx | ✅ 完全統合 |
| 文法 | GrammarQuizView.tsx | ✅ 完全統合 |
| スペル | SpellingView.tsx | ✅ 完全統合 |
| 和訳 | TranslationView.tsx | 🔄 統合予定 |

#### 4.1 タブ固有の確認ポイント

**暗記タブ（MemorizationView.tsx）**:

```typescript
// 必須実装パターン
const [scheduler] = useState(() => new QuestionScheduler());
const [scheduledQuestions, setScheduledQuestions] = useState<Question[]>([]);
const [recentAnswers, setRecentAnswers] = useState<RecentAnswer[]>([]);

// スケジューリング実行
const result = await scheduler.scheduleQuestions({
  questions: allQuestions,
  recentAnswers,
  sessionStats,
  mode: 'memorization',
});
```

**文法タブ（GrammarQuizView.tsx）**:

```typescript
// mode指定が異なる
mode: 'grammar'
```

---

## 予防保守チェックリスト

メンテナンス指示がなくても、定期的に以下を確認してください。

### 毎週実施（推奨）

- [ ] TypeScriptエラーチェック: `npx tsc --noEmit`
- [ ] ビルドチェック: `npm run build`
- [ ] QuestionSchedulerテスト: `npm run test:scheduler`
- [ ] ブラウザでの動作確認（各タブ1問ずつ解答）
- [ ] ブラウザコンソールでエラーログ確認

### 毎月実施（推奨）

- [ ] 全テストスイート実行: `npm run test`
- [ ] 長期動作テスト（セッション30分以上）
- [ ] localStorage破損チェック
- [ ] パフォーマンスプロファイリング

### コード変更時（必須）

以下のファイルを変更した場合、必ずパイプラインを実行：

- [ ] `QuestionScheduler.ts` → QuestionScheduler品質保証パイプライン
- [ ] `types.ts` → 型定義の整合性確認
- [ ] `progressStorage.ts` → category管理テスト
- [ ] `AICoordinator.ts` → AI統合テスト
- [ ] `specialists/*.ts` → 個別AIテスト
- [ ] `*View.tsx`（4タブ） → タブ別統合テスト

---

## 緊急対応手順

### 🚨 レベル分類

#### Level 0: 致命的（即座に対応）

症状:
- アプリが起動しない
- 問題が全く出題されない
- QuestionScheduler.tsが削除された

対応手順:
1. [QUESTION_SCHEDULER_RECOVERY.md](../how-to/QUESTION_SCHEDULER_RECOVERY.md)を開く
2. 緊急度判定セクションを実施
3. 復旧手順に従って作業

推定復旧時間: 7.5時間

#### Level 1: 重大（当日中に対応）

症状:
- 復習単語が出題されない
- 優先度が機能していない
- 特定タブだけ動作しない

対応手順:
1. [META_AI_TROUBLESHOOTING.md](../guidelines/META_AI_TROUBLESHOOTING.md)を開く
2. 該当する症状のセクションへ移動
3. デバッグ手順を実施

推定復旧時間: 1-3時間

#### Level 2: 中程度（週内に対応）

症状:
- AIシグナルが反映されない
- 振動防止が不完全
- パフォーマンス低下

対応手順:
1. 該当コンポーネントのメンテナンス手順を実施
2. 必要に応じてテスト追加
3. パイプライン実行で品質確認

推定作業時間: 2-4時間

#### Level 3: 軽微（次回スプリントで対応）

症状:
- 特定の状況下でのみ発生する不具合
- 最適化の余地がある
- ドキュメント更新が必要

対応手順:
1. GitHub Issueを作成
2. 優先度ラベルを付与
3. スプリント計画に含める

---

## 📚 関連ドキュメント一覧

メンテナンス作業時に参照すべき主要ドキュメント：

### 最優先（必読）

1. **[meta-ai-priority.instructions.md](../../.aitk/instructions/meta-ai-priority.instructions.md)**
   - トラブルシューティング優先指示
   - よくある問題と解決策

2. **[META_AI_TROUBLESHOOTING.md](../guidelines/META_AI_TROUBLESHOOTING.md)**
   - 詳細なトラブルシューティング手順
   - デバッグログの読み方

3. **[QUESTION_SCHEDULER_QA_PIPELINE.md](../quality/QUESTION_SCHEDULER_QA_PIPELINE.md)**
   - 品質保証パイプライン
   - テストケース一覧

### 仕様・設計

4. **[QUESTION_SCHEDULER_SPEC.md](../specifications/QUESTION_SCHEDULER_SPEC.md)**
   - 詳細仕様書（1,669行）
   - アルゴリズム完全解説

5. **[integration-guide.md](../ai-systems/integration-guide.md)**
   - 7AI統合の技術詳細
   - 実装パターン

### 緊急時

6. **[QUESTION_SCHEDULER_RECOVERY.md](../how-to/QUESTION_SCHEDULER_RECOVERY.md)**
   - 緊急復旧手順書（1,080行）
   - 7.5時間で復旧可能

### その他

7. **[core-principles.instructions.md](../../.aitk/instructions/core-principles.instructions.md)**
   - 8-AIアーキテクチャ原則
   - 開発方針

---

## 💡 メンテナンス作業のベストプラクティス

### 1. ドキュメントファーストアプローチ

```
メンテナンス指示受領
    ↓
[このガイドで問題分類]
    ↓
[該当ドキュメントを開く]
    ↓
[診断手順を実施]
    ↓
[パイプライン確認]
    ↓
[修正作業]
    ↓
[テスト実行]
    ↓
[ドキュメント更新]
```

### 2. 変更前のバックアップ

```bash
# 重要ファイルのバックアップ
cp src/ai/scheduler/QuestionScheduler.ts .backup/QuestionScheduler.ts.$(date +%Y%m%d-%H%M%S)
```

### 3. 段階的な修正

1つの変更 → テスト → 確認 → 次の変更

大規模な変更は避け、小さな変更を積み重ねる

### 4. ログの活用

```typescript
// デバッグログを積極的に追加
console.log('[Maintenance Debug] 変数X:', variableX);
```

修正後は不要なログを削除

### 5. テスト駆動メンテナンス

```bash
# 修正前: 既存テストが通ることを確認
npm run test

# 修正後: テストが引き続き通ることを確認
npm run test

# 必要に応じて新規テストを追加
```

---

## 📞 サポート・エスカレーション

### このガイドで解決しない場合

1. **GitHub Issueを作成**
   - テンプレート: `bug_report.md`
   - ラベル: `component:ai`, `priority:high`

2. **以下の情報を含める**:
   - 症状の詳細
   - 実施した診断手順と結果
   - ブラウザコンソールのログ（全文）
   - localStorage内容（スクリーンショット）
   - 環境情報（OS、ブラウザ、Node.jsバージョン）

3. **緊急時の連絡先**:
   - GitHub Discussions: 技術的な質問
   - GitHub Issues: バグ報告
   - プロジェクトメンテナー: 緊急時のみ

---

**最終更新**: 2025-12-19  
**バージョン**: 1.0.0  
**メンテナー**: AI Development Team  
**次回レビュー**: 2026-01-19
