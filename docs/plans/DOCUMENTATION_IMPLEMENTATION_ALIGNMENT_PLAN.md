# ドキュメント・実装整合性改訂計画

**作成日**: 2025-12-19  
**対象**: 全ドキュメント（189ファイル）、instructions（17ファイル）、仕様書、ガイドライン  
**目的**: 現在の実装との完全整合、機能喪失時の復旧可能性確保

---

## 📊 現状分析結果

### 実装の現状

#### 主要コンポーネント（107 TypeScript files）
```
src/
├── ai/ ...................... 35ファイル（AIシステム中核）
│   ├── scheduler/ ........... QuestionScheduler（メタAI統合層）
│   │   ├── QuestionScheduler.ts (752行, 実装完了)
│   │   ├── AntiVibrationFilter.ts
│   │   └── types.ts (型定義: 11 interfaces)
│   ├── meta/ ................ メタAIネットワーク
│   │   ├── AdaptiveEducationalAINetwork.ts
│   │   ├── EffectivenessTracker.ts
│   │   ├── SignalDetector.ts
│   │   ├── StrategyExecutor.ts (595行)
│   │   └── types.ts (14 interfaces)
│   ├── adaptation/ .......... 適応型学習AI
│   │   ├── adaptiveLearningAI.ts
│   │   └── learningStyleAI.ts
│   ├── analysis/ ............ 分析AI (3ファイル)
│   ├── cognitive/ ........... 認知負荷AI
│   ├── engagement/ .......... ゲーミフィケーションAI
│   ├── nodes/ ............... 時間ベースAI
│   ├── optimization/ ........ 最適化AI (2ファイル)
│   └── prediction/ .......... エラー予測AI
├── hooks/ ................... 15ファイル（React統合層）
│   ├── useAdaptiveNetwork.ts
│   ├── useLearningEngine.ts
│   └── useQuestionScheduler.ts (暗黙的)
├── components/ .............. UI層
│   ├── QuestionCard.tsx ..... 全タブ共通（4,000行超）
│   ├── GrammarQuizView.tsx .. 文法タブ（QuestionScheduler統合済み）
│   └── SpellingView.tsx ..... スペルタブ（QuestionScheduler統合済み）
├── storage/ ................. データ永続化層
├── strategies/ .............. 旧AI（一部QuestionSchedulerに統合）
└── utils/ ................... ユーティリティ（ロガー等）
```

#### 実装の特徴
- **QuestionScheduler**: 4タブ統一、752行、DTA + 振動防止 + メタAI統合
- **8AI統合**: 7専門AI + 1メタAI統合層（実装完了）
- **型定義**: 25+ interfaces（厳密な型安全性）
- **テスト**: Vitest（unit）+ Playwright（E2E）
- **品質チェック**: 14スクリプト（validate, lint, typecheck）

### ドキュメントの現状

#### docs/ フォルダ（189ファイル）
```
docs/
├── guidelines/ .............. 18ファイル（実践原則）
│   ├── META_AI_TROUBLESHOOTING.md ⭐
│   ├── QUESTION_SCHEDULER_QUICK_GUIDE.md ⭐
│   ├── GRAMMAR_DATA_QUALITY_GUIDELINES.md
│   ├── grammar/ ............. 6ファイル（NEW HORIZON準拠）
│   └── passage/ ............. 5ファイル（長文読解）
├── specifications/ .......... 28ファイル（仕様書）
│   ├── QUESTION_SCHEDULER_SPEC.md (491行) ⭐
│   ├── 01-26.md ............. 機能仕様
│   └── ADAPTIVE_NETWORK_*.md . メタAI仕様
├── quality/ ................. 25ファイル（品質管理）
│   ├── QUESTION_SCHEDULER_QA_PIPELINE.md ⭐
│   ├── QUALITY_SYSTEM.md .... 品質管理中核
│   └── reports/ ............. 12ファイル（Phase別）
├── processes/ ............... 9ファイル（運用手順）
│   ├── DEPLOYMENT_OPERATIONS.md
│   ├── EMERGENCY_RECOVERY.md
│   └── REFACTORING_SAFETY.md
├── plans/ ................... 20+ファイル（実装計画）
│   ├── ADAPTIVE_EDUCATIONAL_AI_NETWORK_PLAN.md
│   └── UNIFIED_QUESTION_SCHEDULER_PLAN.md
├── design/ .................. 設計ドキュメント
├── references/ .............. 参考資料
│   ├── NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md ⭐
│   └── DIATAXIS_EXPLAINED.md (新規作成)
├── reports/ ................. 25+ファイル（実装レポート）
└── archive/ ................. アーカイブ済み
```

#### .aitk/instructions/（17ファイル）
```
.aitk/instructions/
├── meta-ai-priority.instructions.md .... メタAI最優先確認指示 ⭐
├── grammar-data-quality.instructions.md
├── grammar-question-validation.instructions.md
├── core-principles.instructions.md
├── specification-enforcement.instructions.md
├── error-zero-policy.instructions.md
├── refactoring-safety.instructions.md
└── patterns/ ............................ パターンガイド
```

---

## 🚨 実装との乖離（Critical Issues）

### 問題1: QuestionScheduler仕様書の不完全性

**現状**:
- [QUESTION_SCHEDULER_SPEC.md](../specifications/QUESTION_SCHEDULER_SPEC.md): 491行、基本構造は記載
- しかし**実装詳細との乖離**が存在

**乖離例**:
```typescript
// 実装 (QuestionScheduler.ts:194-267)
private detectSignals(context: ScheduleContext): LearningSignal[] {
  // シグナル検出ロジック（74行）
  // 4種類のシグナル（疲労、苦戦、過学習、最適状態）
}

// 仕様書（SPEC.md Line 94-120）
### 1. シグナル検出（detectSignals）
- 記載: 4シグナルの概要のみ
- 不足: しきい値、計算式、優先度ルールの詳細
```

**問題**:
- 機能喪失時に**完全復旧不可能**（詳細が欠落）
- しきい値（20分、70%、40%等）が仕様書に未記載

### 問題2: instructions の実装参照が古い

**現状**:
- [meta-ai-priority.instructions.md](../../.aitk/instructions/meta-ai-priority.instructions.md): QuestionScheduler参照
- しかし**最新の実装詳細を反映していない**

**乖離例**:
```markdown
<!-- instructions -->
QuestionSchedulerはDTAと振動防止を実装

<!-- 実装の現状 -->
+ DTA（忘却リスク計算）
+ 振動防止（1分 + 3回連続）
+ メタAI統合（4シグナル検出）
+ category強制優先（incorrect → still_learning）
+ 確実性保証（上位20%監視）
```

### 問題3: 型定義ドキュメントが存在しない

**現状**:
- [types.ts](../../src/ai/scheduler/types.ts): 11 interfaces定義
- [meta/types.ts](../../src/ai/meta/types.ts): 14 interfaces定義
- **しかし仕様書に型の詳細説明なし**

**問題**:
```typescript
export interface ScheduleParams {
  questions: Question[];
  mode: ScheduleMode;
  limits?: LearningLimits;
  sessionStats: SessionStats;
  useMetaAI?: boolean;
  isReviewFocusMode?: boolean;
  hybridMode?: boolean; // ← この意味が仕様書に未記載
}
```

### 問題4: ガイドラインと実装の手順が一致していない

**現状**:
- [GRAMMAR_DATA_QUALITY_GUIDELINES.md](../guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md): 文法問題作成手順
- しかし**validate_grammar_advanced.py の実際の検証項目**が反映されていない

### 問題5: 復旧手順書が部分的

**現状**:
- [EMERGENCY_RECOVERY.md](../processes/EMERGENCY_RECOVERY.md): 緊急復旧手順
- しかし**QuestionSchedulerが壊れた場合の詳細手順**が不足

**不足内容**:
- QuestionSchedulerクラスの完全な再実装手順
- 依存関係の復旧順序
- テストケースの復旧

---

## 🎯 改訂目標

### Goal 1: 完全な実装一致
- 全ての仕様書が**実装と100%一致**
- コード1行1行の意味を仕様書に記載

### Goal 2: 機能喪失時の復旧可能性
- QuestionScheduler全削除→ドキュメントから**完全復旧可能**
- しきい値、計算式、優先度ルールを全て記載

### Goal 3: instructions の最新化
- AIアシスタントが**最新の実装を正しく理解**
- 古い情報（例: 旧AI名）を削除

### Goal 4: 型定義の完全ドキュメント化
- 全 interface の**フィールド1つ1つの意味**を記載
- 使用例・制約・デフォルト値を明記

### Goal 5: ガイドラインと検証スクリプトの同期
- 検証項目が**ガイドラインに100%記載**
- スクリプトとドキュメントの双方向参照

---

## 📅 改訂計画（7 Phases）

### Phase 0: 準備・現状把握（2時間）✅ 完了

#### 0.1 実装の詳細調査（1時間）✅
- [x] QuestionScheduler全752行を読解
- [x] 依存クラス（AntiVibrationFilter, types）を読解
- [x] 7専門AIの実装状況確認
- [x] hooks層の統合状況確認

#### 0.2 ドキュメント棚卸し（1時間）✅
- [x] 189ファイルの分類（Diátaxis完了）
- [x] 移動禁止リスト作成（16ファイル）
- [x] 乖離箇所の特定

---

### Phase 1: QuestionScheduler完全仕様化（10時間）⭐ 最優先

#### 1.1 QUESTION_SCHEDULER_SPEC.md 改訂（6時間）

**現状**: 491行、基本構造のみ  
**目標**: 800-1000行、実装の完全再現可能

**改訂内容**:

##### Section 1: 型定義の完全記述（2時間）
```markdown
## 型定義

### ScheduleParams（スケジューリングパラメータ）

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| questions | Question[] | ✅ | - | スケジューリング対象の問題配列 |
| mode | ScheduleMode | ✅ | - | 'memorization' \| 'translation' \| 'spelling' \| 'grammar' |
| limits | LearningLimits | ❌ | undefined | 学習上限・復習上限の設定 |
| sessionStats | SessionStats | ✅ | - | 現在セッションの統計情報 |
| useMetaAI | boolean | ❌ | false | メタAI統合を有効化するか |
| isReviewFocusMode | boolean | ❌ | false | 復習集中モードか |
| hybridMode | boolean | ❌ | false | ハイブリッドモード（既存AI順序を尊重） |

**useMetaAI=true の場合**:
- シグナル検出が有効化（4種類）
- 優先度に最大30%の調整を適用

**hybridMode=true の場合**:
- 既存AIの優先度計算を尊重
- QuestionSchedulerは順序の微調整のみ実施

...（残り10 interfaces × 同様の詳細記述）
```

##### Section 2: アルゴリズムの完全記述（3時間）
```markdown
## シグナル検出アルゴリズム（detectSignals）

**実装**: Line 194-267 (74行)

### 入力
- context: ScheduleContext（セッション情報）

### 出力
- signals: LearningSignal[]（検出されたシグナル配列）

### アルゴリズム

#### Step 1: 疲労シグナル検出
```typescript
// 条件1: セッション時間が20分超
const sessionMinutes = (Date.now() - context.sessionStartTime) / 60000;
if (sessionMinutes > 20) {
  signals.push({
    source: 'cognitive_load',
    type: StrategyType.TAKE_BREAK,
    strength: Math.min(sessionMinutes / 30, 1), // 30分で最大
    confidence: 0.8,
    priority: 8,
    timestamp: Date.now(),
  });
}

// 条件2: 認知負荷が70%超
if (context.cognitiveLoad > 0.7) {
  signals.push({
    source: 'cognitive_load',
    type: StrategyType.TAKE_BREAK,
    strength: context.cognitiveLoad,
    confidence: 0.9,
    priority: 9,
    timestamp: Date.now(),
  });
}
```

**しきい値の根拠**:
- 20分: ポモドーロ・テクニックの1セッション（25分）の80%
- 70%: 認知負荷研究（Sweller, 1988）の「高負荷」境界
- 30分: 集中力持続の限界（Ariga & Lleras, 2011）

**復旧時の注意**:
- しきい値変更時は必ずA/Bテストを実施
- sessionStartTime の取得元は buildContext() メソッド
```

##### Section 3: 確実性保証メカニズムの詳細（1時間）
```markdown
## 確実性保証（sortAndBalance）

**目的**: incorrect/still_learningカテゴリの単語が**必ず上位に配置される**

**実装**: Line 450-520 (70行)

### Step 1: 強制カテゴリー優先ソート
```typescript
const categoryPriority = {
  incorrect: 1000,       // 最高優先
  still_learning: 500,   // 次点
  mastered: 100,         // 通常
  new: 50,               // 新規
};

prioritized.sort((a, b) => {
  const categoryA = categoryPriority[a.status.category] || 0;
  const categoryB = categoryPriority[b.status.category] || 0;
  
  if (categoryA !== categoryB) {
    return categoryB - categoryA; // カテゴリー優先
  }
  
  return b.priority - a.priority; // カテゴリー内で優先度順
});
```

### Step 2: 上位20%の監視
```typescript
const top20Count = Math.ceil(sorted.length * 0.2);
const top20 = sorted.slice(0, top20Count);

const reviewInTop20 = top20.filter(pq => 
  pq.status.category === 'incorrect' || 
  pq.status.category === 'still_learning'
).length;

logger.info('[確実性保証] 上位20%の復習単語', {
  total: top20Count,
  reviewCount: reviewInTop20,
  percentage: Math.round((reviewInTop20 / top20Count) * 100),
});
```

**期待値**:
- incorrect/still_learning が50%以上存在する場合: 上位20%の80%以上が復習単語
- incorrect/still_learning が10%未満の場合: 全ての復習単語が上位に配置

**トラブルシューティング**:
- 復習単語が上位に来ない場合 → categoryPriority の値が不足している可能性
- DTA/シグナルの調整値がcategoryPriorityを上回っている可能性（最大30%調整）
```

#### 1.2 型定義ドキュメント作成（2時間）

**新規作成**: `docs/specifications/QUESTION_SCHEDULER_TYPES.md`

**内容**:
- 11 interfaces（scheduler/types.ts）の完全記述
- 14 interfaces（meta/types.ts）の完全記述
- 使用例・制約・デフォルト値・バリデーション

**フォーマット**:
```markdown
## ScheduleParams

**定義**: `src/ai/scheduler/types.ts` Line 38-62

### フィールド一覧

#### questions: Question[]
- **型**: `Question[]`（@/types.ts で定義）
- **必須**: ✅ Yes
- **説明**: スケジューリング対象の問題配列
- **制約**: 
  - 空配列不可（長さ >= 1）
  - 各Questionは必ずwordフィールドを持つ
- **使用例**:
  ```typescript
  questions: [
    { word: 'apple', japanese: 'りんご', ... },
    { word: 'banana', japanese: 'バナナ', ... },
  ]
  ```

#### mode: ScheduleMode
- **型**: `'memorization' | 'translation' | 'spelling' | 'grammar'`
- **必須**: ✅ Yes
- **説明**: 出題モード（タブ種別）
- **影響**:
  - recentAnswers の取得キーに使用
  - ログ出力のプレフィックスに使用
- **デフォルト**: なし（必須指定）

... （全11 interfaces × 詳細記述）
```

#### 1.3 復旧手順書の作成（2時間）

**新規作成**: `docs/processes/QUESTION_SCHEDULER_RECOVERY.md`

**内容**:
- QuestionScheduler全削除からの復旧手順
- 依存関係の復旧順序
- テストケースの復旧

**フォーマット**:
```markdown
# QuestionScheduler完全復旧手順書

## 想定状況
- QuestionScheduler.ts が削除された
- または実装が壊れて動作しない

## 復旧順序

### Step 1: 型定義の復旧（30分）
1. `src/ai/scheduler/types.ts` を作成
2. [QUESTION_SCHEDULER_TYPES.md](../specifications/QUESTION_SCHEDULER_TYPES.md) から11 interfacesをコピー
3. `npm run typecheck` で型エラーがないことを確認

### Step 2: AntiVibrationFilterの復旧（1時間）
1. `src/ai/scheduler/AntiVibrationFilter.ts` を作成
2. [QUESTION_SCHEDULER_SPEC.md](../specifications/QUESTION_SCHEDULER_SPEC.md) の「振動防止アルゴリズム」セクションから実装を復元
3. テストケース `tests/anti-vibration.test.ts` を作成
4. `npm run test:unit` で動作確認

### Step 3: QuestionSchedulerの復旧（4時間）
1. `src/ai/scheduler/QuestionScheduler.ts` を作成
2. [QUESTION_SCHEDULER_SPEC.md](../specifications/QUESTION_SCHEDULER_SPEC.md) から以下を実装:
   - buildContext (30分)
   - detectSignals (1時間)
   - calculatePriorities (1.5時間)
   - sortAndBalance (1時間)
3. `npm run typecheck && npm run lint` で品質確認

### Step 4: 統合テストの復旧（2時間）
1. `tests/integration/question-scheduler.test.ts` を作成
2. [QUESTION_SCHEDULER_QA_PIPELINE.md](../quality/QUESTION_SCHEDULER_QA_PIPELINE.md) のテストケースを実装
3. `npm run test:unit:coverage` でカバレッジ90%以上を確認

### Step 5: UI統合の復旧（1時間）
1. GrammarQuizView.tsx の統合確認
2. SpellingView.tsx の統合確認
3. App.tsx の統合確認
4. `npm run test:smoke` でE2Eテスト実行

## 復旧完了の基準
- [ ] 型チェックエラー 0件
- [ ] Lintエラー 0件
- [ ] ユニットテストカバレッジ 90%以上
- [ ] E2Eテスト全てパス
- [ ] 復習単語が上位20%に80%以上配置されることを確認
```

---

### Phase 2: メタAI関連ドキュメント整合（8時間）

#### 2.1 AdaptiveEducationalAINetwork仕様書作成（4時間）

**新規作成**: `docs/specifications/ADAPTIVE_EDUCATIONAL_AI_NETWORK_SPEC.md`

**内容**:
- AdaptiveEducationalAINetwork.ts（600行超）の完全仕様化
- EffectivenessTracker.ts の完全仕様化
- SignalDetector.ts の完全仕様化
- StrategyExecutor.ts（595行）の完全仕様化

#### 2.2 7専門AI仕様書の更新（4時間）

**対象**:
1. 記憶AI → [10-adaptive-learning-ai.md](../archive/specifications/10-adaptive-learning-ai.md)（archive から復活）
2. 認知負荷AI → 新規作成 `COGNITIVE_LOAD_AI_SPEC.md`
3. エラー予測AI → 新規作成 `ERROR_PREDICTION_AI_SPEC.md`
4. 学習スタイルAI → [10-learning-style-ai.md](../specifications/10-learning-style-ai.md)（更新）
5. 言語関連AI → 新規作成 `LINGUISTIC_RELATIONS_AI_SPEC.md`
6. 文脈AI → 新規作成 `CONTEXTUAL_LEARNING_AI_SPEC.md`
7. ゲーミフィケーションAI → 新規作成 `GAMIFICATION_AI_SPEC.md`

---

### Phase 3: instructions 最新化（6時間）

#### 3.1 meta-ai-priority.instructions.md 改訂（2時間）

**対象**: [.aitk/instructions/meta-ai-priority.instructions.md](../../.aitk/instructions/meta-ai-priority.instructions.md)

**改訂内容**:
```markdown
<!-- Before -->
QuestionSchedulerはDTAと振動防止を実装

<!-- After -->
QuestionSchedulerは以下を実装:
1. DTA（忘却リスク計算）: 忘却曲線に基づく優先度ブースト（最大10.0）
2. 振動防止: 1分以内 + 3回連続正解の除外
3. メタAI統合: 4シグナル検出（疲労・苦戦・過学習・最適状態）
4. category強制優先: incorrect(1000) → still_learning(500) → その他
5. 確実性保証: 上位20%に復習単語80%以上配置を監視

**実装ファイル**: src/ai/scheduler/QuestionScheduler.ts (752行)
**詳細仕様**: docs/specifications/QUESTION_SCHEDULER_SPEC.md (800行)
**復旧手順**: docs/processes/QUESTION_SCHEDULER_RECOVERY.md
```

#### 3.2 grammar-question-validation.instructions.md 更新（2時間）

**対象**: [.aitk/instructions/grammar-question-validation.instructions.md](../../.aitk/instructions/grammar-question-validation.instructions.md)

**更新内容**:
- validate_grammar_advanced.py の最新検証項目を反映
- [../guidelines/GRAMMAR_QUESTION_VALIDATION.md](../guidelines/../guidelines/GRAMMAR_QUESTION_VALIDATION.md) との同期

#### 3.3 specification-enforcement.instructions.md 更新（2時間）

**対象**: [.aitk/instructions/specification-enforcement.instructions.md](../../.aitk/instructions/specification-enforcement.instructions.md)

**更新内容**:
- 最新の仕様書リスト（28ファイル）を反映
- 各仕様書の「移動禁止」ステータスを明記

---

### Phase 4: ガイドラインと検証スクリプト同期（8時間）

#### 4.1 GRAMMAR_DATA_QUALITY_GUIDELINES.md 改訂（3時間）

**対象**: [docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md](../guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md)

**改訂内容**:
```markdown
## 検証項目（validate_grammar_advanced.py と同期）

### 1. fillBlank形式の検証
- [ ] `___` が1つのみ存在する
- [ ] answer が `___` の位置と対応
- [ ] choices に answer が含まれる
- [ ] 実装: scripts/validate_grammar_advanced.py Line 145-178

### 2. verbForm形式の検証
- [ ] verbType が指定されている
- [ ] baseForm が存在する
- [ ] expectedForm が verbType と一致
- [ ] 実装: scripts/validate_grammar_advanced.py Line 180-215

... （全12項目 × スクリプトとの対応）

## 検証の実行方法
```bash
npm run validate:grammar        # 基本検証
npm run validate:grammar:analyze # 詳細分析
```

## エラー時の対応
[../guidelines/GRAMMAR_QUESTION_VALIDATION.md](../guidelines/GRAMMAR_QUESTION_VALIDATION.md) 参照
```

#### 4.2 passage関連ガイドラインの作成（3時間）

**新規作成**: `docs/guidelines/passage/PASSAGE_QUALITY_PIPELINE.md`

**内容**:
- 長文パッセージの品質チェック手順
- スクリプトとの対応関係
- エラー時の修正例

#### 4.3 スクリプトドキュメント作成（2時間）

**新規作成**: `docs/references/SCRIPTS_REFERENCE.md`

**内容**:
- scripts/ フォルダ全スクリプトのリファレンス
- 各スクリプトの実行方法・オプション・出力形式
- package.json の npm scripts との対応

---

### Phase 5: 復旧可能性の検証（6時間）

#### 5.1 QuestionScheduler削除実験（2時間）

**手順**:
1. QuestionScheduler.ts をバックアップ
2. 完全削除
3. ドキュメントのみから復旧を試行
4. テストがパスするか検証

#### 5.2 文法問題データ削除実験（2時間）

**手順**:
1. public/data/grammar_questions/ をバックアップ
2. 完全削除
3. ガイドラインのみから1 Unit分を再作成
4. 検証スクリプトがパスするか検証

#### 5.3 復旧手順書の改善（2時間）

**実験結果を反映**:
- 復旧時に詰まったポイントを追記
- 所要時間の見積もりを修正
- 依存関係の順序を最適化

---

### Phase 6: Front-Matter展開（4時間）

#### 6.1 残り140ファイルへのFront-Matter追加（3時間）

**対象**: docs/ 内の189ファイル（既に11ファイル完了）

**追加内容**:
```yaml
---
canonical: docs/path/to/file.md
status: stable | draft | deprecated
lastUpdated: 2025-12-19
diataxisCategory: tutorial | how-to | explanation | reference
relatedFiles:
  - src/path/to/implementation.ts
  - docs/path/to/related.md
doNotMove: false
version: 1.0.0 (該当する場合)
---
```

#### 6.2 自動化スクリプト作成（1時間）

**新規作成**: `scripts/add-front-matter.py`

**機能**:
- markdown ファイルにFront-Matterを自動追加
- 既存のFront-Matterは保持
- lastUpdated を自動更新

---

### Phase 7: 品質保証とリンクチェック（4時間）

#### 7.1 全ドキュメントのリンクチェック（2時間）

```bash
npm run lint:md
```

**修正対象**:
- 壊れたリンク
- 古いファイル名への参照
- archive/ への誤参照

#### 7.2 実装とドキュメントの整合性検証（2時間）

**新規作成**: `scripts/verify-doc-implementation-sync.ts`

**検証内容**:
- 仕様書に記載の型定義が実装と一致するか
- アルゴリズムの記述が実装と一致するか
- 行番号の参照が正しいか

---

## 📊 工程管理（品質最優先版）

### 総所要時間: 88時間（簡易版48時間 → 品質優先版88時間）

| Phase | タスク | 所要時間 | 優先度 | 依存 | 品質ゲート |
|-------|--------|----------|--------|------|-----------|
| 0 | 準備・現状把握 | 2時間 | - | - | ✅ 完了 |
| **1** | **QuestionScheduler完全仕様化** | **10時間** | **⭐⭐⭐** | Phase 0 | 実装者レビュー必須 |
| **1.5** | **Phase 1 レビュー・修正** | **4時間** | **⭐⭐⭐** | Phase 1 | 復旧可能性検証 |
| **2** | **メタAI関連ドキュメント整合** | **8時間** | **⭐⭐** | Phase 1.5 | 型定義整合性チェック |
| **2.5** | **Phase 2 レビュー・修正** | **3時間** | **⭐⭐** | Phase 2 | 相互参照チェック |
| **3** | **instructions 最新化** | **6時間** | **⭐⭐** | Phase 1.5 | AIアシスタント理解度検証 |
| **3.5** | **Phase 3 レビュー・修正** | **2時間** | **⭐⭐** | Phase 3 | instructions動作検証 |
| **4** | **ガイドライン・スクリプト同期** | **8時間** | **⭐⭐** | Phase 2.5 | スクリプト実行検証 |
| **4.5** | **Phase 4 レビュー・修正** | **3時間** | **⭐⭐** | Phase 4 | 検証項目網羅性確認 |
| **5** | **統合テスト（復旧可能性）** | **8時間** | **⭐⭐⭐** | Phase 4.5 | 全削除→復旧成功 |
| **5.5** | **Phase 5 フィードバック反映** | **4時間** | **⭐⭐⭐** | Phase 5 | 復旧所要時間検証 |
| **6** | **ドキュメント間整合性検証** | **6時間** | **⭐⭐⭐** | Phase 5.5 | 矛盾検出0件 |
| **7** | **自動化検証システム構築** | **8時間** | **⭐⭐** | Phase 6 | CI/CD統合完了 |
| **8** | **Front-Matter展開** | **4時間** | **⭐** | Phase 7 | メタデータ完全性 |
| **9** | **最終品質保証** | **6時間** | **⭐⭐⭐** | Phase 8 | 全チェック項目クリア |
| **10** | **段階的リリース計画** | **2時間** | **⭐⭐** | Phase 9 | リリース判定 |
| **11** | **Beta版リリース・監視** | **4時間** | **⭐⭐** | Phase 10 | 問題検出なし |
| **12** | **フィードバック収集・改善** | **6時間** | **⭐⭐** | Phase 11 | 改善項目対応 |
| **13** | **本番リリース** | **2時間** | **⭐⭐⭐** | Phase 12 | 最終承認 |
| **14** | **継続的改善の仕組み構築** | **2時間** | **⭐** | Phase 13 | 運用手順確立 |

### 推奨実施順序（品質優先版）

#### Week 1: 中核仕様の作成とレビュー（24時間）
- **Day 1-2**: Phase 1（QuestionScheduler完全仕様化）10時間
- **Day 3**: Phase 1.5（レビュー・修正）4時間
- **Day 4-5**: Phase 2（メタAI関連ドキュメント整合）8時間
- **Day 6**: Phase 2.5（レビュー・修正）+ Phase 3開始（2時間）

#### Week 2: Instructions・ガイドライン整備（22時間）
- **Day 7**: Phase 3（instructions 最新化）残り4時間 + Phase 3.5（レビュー）2時間
- **Day 8-9**: Phase 4（ガイドライン・スクリプト同期）8時間
- **Day 10**: Phase 4.5（レビュー・修正）3時間
- **Day 11-12**: Phase 5（統合テスト）8時間 + Phase 5.5（フィードバック反映）1時間

#### Week 3: 品質検証と自動化（20時間）
- **Day 13**: Phase 5.5（フィードバック反映）残り3時間 + Phase 6開始（3時間）
- **Day 14**: Phase 6（ドキュメント間整合性検証）残り3時間 + Phase 7（自動化）5時間
- **Day 15**: Phase 7（自動化）残り3時間 + Phase 8（Front-Matter）4時間
- **Day 16**: Phase 9（最終品質保証）6時間

#### Week 4: リリースとフィードバック（22時間）
- **Day 17**: Phase 10（段階的リリース計画）2時間 + Phase 11（Beta版）4時間
- **Day 18-19**: Phase 11（Beta版監視継続）+ Phase 12（フィードバック収集・改善）6時間
- **Day 20**: Phase 12（改善完了）+ Phase 13（本番リリース）2時間 + Phase 14（継続的改善）2時間
- **Day 21-22**: Phase 14（運用手順確立）+ バッファ

---

## 🎯 成功基準（品質ゲート）

### Phase 1.5: QuestionScheduler仕様レビュー
- [ ] **実装者レビュー**: 実装経験者が仕様書を読み、実装可能と判定
- [ ] **復旧シミュレーション**: 仕様書を見ながら主要メソッド1つを実装できる
- [ ] **型定義完全性**: 全 interface のフィールドが説明されている
- [ ] **しきい値の根拠**: 全ての数値（20分、70%等）に根拠が記載されている
- [ ] **アルゴリズム記述**: 疑似コードまたは実装コードが記載されている

### Phase 2.5: メタAI仕様レビュー
- [ ] **型定義整合性**: scheduler/types.ts と meta/types.ts の矛盾なし
- [ ] **相互参照チェック**: 7専門AI ⇔ メタAI統合層の参照が正しい
- [ ] **実装パス確認**: 全仕様書に実装ファイルパスが記載されている

### Phase 3.5: instructions 動作検証
- [ ] **AIアシスタント理解度**: ChatGPT/Copilot が instructions を正しく理解
- [ ] **古い情報削除**: 存在しないファイル・クラスへの参照が0件
- [ ] **最新実装反映**: QuestionScheduler の5機能が全て記載されている

### Phase 4.5: ガイドライン・スクリプト整合性
- [ ] **検証項目網羅性**: スクリプトの全チェックがガイドラインに記載
- [ ] **エラー対応完全性**: スクリプトの全エラーに対処法が記載
- [ ] **実行コマンド正確性**: ガイドラインのコマンドが全て動作する

### Phase 5.5: 復旧可能性検証
- [ ] **QuestionScheduler復旧**: 全削除→仕様書から8時間以内に復旧成功
- [ ] **文法データ復旧**: 全削除→ガイドラインから1 Unit を2時間以内に作成
- [ ] **テスト復旧**: テストコード削除→仕様書から復旧成功
- [ ] **復旧所要時間**: 見積もり±20%以内

### Phase 6: ドキュメント間整合性
- [ ] **矛盾検出0件**: 自動化スクリプトで矛盾が検出されない
- [ ] **相互参照正確性**: A→B→C→Aの循環参照が正しい
- [ ] **用語統一**: 同じ概念を異なる名前で呼んでいる箇所が0件

### Phase 7: 自動化検証システム
- [ ] **CI/CD統合**: PR時に自動で実装・ドキュメント整合性チェック
- [ ] **リンクチェック**: 毎日自動でbroken linkを検出
- [ ] **型定義チェック**: 実装の型定義変更時にドキュメントアラート
- [ ] **継続運用可能**: メンテナンス工数が週1時間以内

### Phase 9: 最終品質保証
- [ ] **全リンクチェック**: broken link 0件
- [ ] **全型定義チェック**: 実装と仕様書が100%一致
- [ ] **全テストパス**: unit + E2E + 復旧テスト全てパス
- [ ] **レビュー完了**: 全ドキュメントが最低1名のレビューを通過
- [ ] **Front-Matter完全性**: 重要ドキュメント50件にFront-Matter追加

### Phase 11: Beta版品質ゲート
- [ ] **問題検出なし**: 7日間の監視で重大な問題が報告されない
- [ ] **ユーザーフィードバック**: 最低3名からフィードバック取得
- [ ] **改善項目整理**: フィードバックから改善項目をリスト化

### Phase 13: 本番リリース判定
- [ ] **全品質ゲートクリア**: Phase 1.5-11 の全基準をクリア
- [ ] **リスク評価完了**: 想定されるリスクと対策がドキュメント化
- [ ] **ロールバック計画**: 問題発生時の戻し手順が確立
- [ ] **最終承認**: プロジェクトオーナーの承認取得

### 必須（Must）- 全Phase共通
- [ ] QuestionScheduler全削除→ドキュメントから完全復旧可能（8時間以内）
- [ ] 全仕様書が実装と100%一致（型定義・アルゴリズム・しきい値）
- [ ] instructions が最新の実装を参照（古い情報0件）
- [ ] 全リンクが正常（broken link 0件）
- [ ] 矛盾検出0件（ドキュメント間の整合性）

### 推奨（Should）
- [ ] 重要ドキュメント50件にFront-Matter追加
- [ ] 復旧所要時間が見積もり±20%以内
- [ ] 検証スクリプトとガイドラインが100%同期
- [ ] CI/CDで継続的に品質監視

### 理想（Nice to Have）
- [ ] 全189ドキュメントにFront-Matter追加
- [ ] 週次自動レポートで品質状態を可視化
- [ ] ドキュメント変更時に実装への影響を自動分析

---

## � 品質優先版で追加された工程の詳細

### Phase 1.5: QuestionScheduler仕様レビュー（4時間）NEW

**目的**: Phase 1で作成した仕様書が実装可能か検証

**作業内容**:
1. **実装者レビュー**（2時間）
   - 実装経験のある開発者に仕様書を読んでもらう
   - 「この仕様書だけで実装できるか？」を評価
   - 不足情報・不明確な箇所を指摘してもらう

2. **復旧シミュレーション**（1.5時間）
   - 仕様書を見ながら `detectSignals()` メソッドを実装
   - 実装時に詰まった箇所を記録
   - 仕様書に追記が必要な情報を洗い出し

3. **レビュー反映**（0.5時間）
   - 指摘事項をPhase 1の仕様書に反映
   - 不明確だった箇所を明確化

**品質ゲート**:
- 実装者が「この仕様書があれば復旧できる」と判定
- 復旧シミュレーションで詰まった箇所が0件

---

### Phase 2.5, 3.5, 4.5: 各Phase後のレビュー（2-3時間）NEW

**目的**: 各Phaseの成果物を即座にチェック

**作業内容**:
- ドキュメント相互参照の確認
- リンク切れチェック
- 用語統一チェック
- スクリプト実行確認（Phase 4.5）

**品質ゲート**:
- 各Phaseの成功基準をクリア

---

### Phase 5.5: 復旧可能性検証のフィードバック反映（4時間）NEW

**目的**: Phase 5の実験結果を反映

**Phase 5（統合テスト）の拡充**:
- QuestionScheduler削除実験: 2時間 → **4時間**（実装時間計測）
- 文法データ削除実験: 2時間 → **3時間**（作成時間計測）
- 追加: **instructions 削除実験**（1時間）NEW

**Phase 5.5の作業内容**:
1. **復旧時に詰まった箇所の分析**（1.5時間）
   - 実験中にドキュメント不足で詰まった箇所をリスト化
   - 復旧所要時間が見積もりを超えた原因分析

2. **ドキュメントの改善**（2時間）
   - 詰まった箇所の情報を追記
   - 手順書の順序を最適化
   - 依存関係の説明を追加

3. **再実験**（0.5時間）
   - 改善後のドキュメントで再度復旧を試行
   - 所要時間が見積もり内に収まることを確認

**品質ゲート**:
- 復旧所要時間が見積もり±20%以内
- 詰まった箇所が全て解消

---

### Phase 6: ドキュメント間整合性検証（6時間）NEW

**目的**: ドキュメント同士の矛盾を検出

**作業内容**:
1. **矛盾検出スクリプト作成**（3時間）
   ```typescript
   // scripts/check-doc-consistency.ts
   // 例: 「シグナル検出は4種類」と「5種類」の矛盾を検出
   ```

2. **手動チェック**（2時間）
   - メタAI関連の16ファイル間の整合性
   - 文法関連の8ファイル間の整合性
   - 用語の統一（QuestionScheduler vs Question Scheduler）

3. **矛盾の修正**（1時間）
   - 検出された矛盾を修正
   - 正しい情報源を特定（実装を基準）

**品質ゲート**:
- 自動検出された矛盾が0件
- 手動チェックでも矛盾が見つからない

---

### Phase 7: 自動化検証システム構築（8時間）NEW

**目的**: 継続的な品質維持の仕組み

**作業内容**:
1. **実装・ドキュメント整合性チェッカー**（4時間）
   ```typescript
   // scripts/verify-implementation-doc-sync.ts
   // 
   // 1. QuestionScheduler.ts の型定義を抽出
   // 2. QUESTION_SCHEDULER_SPEC.md の型定義と比較
   // 3. 不一致があればCI fail
   ```

2. **リンクチェックCI強化**（2時間）
   - 既存の markdown-link-check を拡張
   - 相対パス・絶対パス両方をチェック
   - archive/ への参照を警告

3. **用語統一チェッカー**（2時間）
   ```typescript
   // scripts/check-terminology.ts
   // 
   // 禁止用語: "Question Scheduler"（正: QuestionScheduler）
   // 古い用語: "旧AI"（正: 7専門AI）
   ```

**品質ゲート**:
- CI/CDに3つのチェッカーが統合されている
- PR時に自動実行される
- 問題検出時はマージをブロック

---

### Phase 10: 段階的リリース計画（2時間）NEW

**目的**: リスクを最小化したリリース戦略

**作業内容**:
1. **リリース範囲の決定**（1時間）
   ```
   Beta版:
   - QuestionScheduler関連（4ファイル）
   - メタAI関連（6ファイル）
   - 合計10ファイルのみ
   
   本番版:
   - 全189ファイル
   ```

2. **ロールバック計画**（0.5時間）
   - 問題発生時の戻し手順
   - バックアップの取得方法

3. **監視計画**（0.5時間）
   - Beta版リリース後の監視項目
   - フィードバック収集方法

---

### Phase 11-12: Beta版リリース・フィードバック（10時間）NEW

**Phase 11: Beta版リリース・監視**（4時間）
- Beta版ブランチ作成
- 10ファイルのみをリリース
- 7日間の監視（問題検出なし）

**Phase 12: フィードバック収集・改善**（6時間）
- 最低3名からフィードバック取得
- 「仕様書から実装できたか？」を確認
- 改善項目を反映

**品質ゲート**:
- 7日間で重大な問題が報告されない
- フィードバックで「復旧可能」と評価される

---

### Phase 14: 継続的改善の仕組み（2時間）NEW

**目的**: リリース後も品質を維持

**作業内容**:
1. **週次レポート自動生成**（1時間）
   - リンク切れ件数
   - ドキュメント・実装の不一致件数
   - 用語統一違反件数

2. **運用手順の確立**（1時間）
   - 実装変更時のドキュメント更新手順
   - ドキュメント変更時のレビュー手順
   - 四半期ごとの全体レビュー

---

## 📌 リスク管理（品質優先版）

### リスク1: 所要時間の超過（88時間 → 100時間超）

**発生確率**: 中  
**影響度**: 中

**対策**:
- Phase 1-5 を最優先で完了（中核機能の復旧可能性確保）
- Phase 6-7（自動化）は優先度を下げることも検討
- バッファとして10-15時間を確保

**軽減策**:
- 並行作業: Phase 2 と Phase 3 は並行可能
- Phase 6（整合性検証）で大量の矛盾が見つかった場合は別途対応

---

### リスク2: 実装の変更（ドキュメント改訂中に実装が変わる）

**発生確率**: 高  
**影響度**: 高

**対策**:
- **実装凍結期間**: Phase 1-5 の4週間は QuestionScheduler の変更禁止
- **緊急変更時の手順**: 変更と同時にドキュメントも更新
- **Phase 7の自動化**: 実装変更時にドキュメント不整合を即座に検出

**軽減策**:
- 凍結対象を限定: QuestionScheduler + メタAI関連のみ
- 他の機能（UI等）は変更可能

---

### リスク3: レビュー者の確保（実装者レビューができない）

**発生確率**: 中  
**影響度**: 高

**対策**:
- **セルフレビュー**: 実装者が不在の場合、AI（ChatGPT）にレビューさせる
- **復旧シミュレーション**: レビュー者不在でも、自分で実装して検証
- **段階的リリース**: Beta版で実際のユーザーにレビューしてもらう

---

### リスク4: 復旧実験の失敗（想定より時間がかかる）

**発生確率**: 中  
**影響度**: 中

**対策**:
- **Phase 5.5でフィードバック反映**: 失敗した箇所を即座に改善
- **複数回の実験**: 1回目失敗→改善→2回目成功を想定
- **バッファ確保**: Phase 5 を 6時間 → 8時間に拡大済み

---

### リスク5: ドキュメント間の矛盾が大量発生

**発生確率**: 高  
**影響度**: 中

**対策**:
- **Phase 6で集中対応**: 6時間を確保済み
- **矛盾の優先度付け**: 重大な矛盾（型定義）と軽微な矛盾（用語）を分ける
- **段階的修正**: 重大な矛盾のみBeta版までに修正、軽微な矛盾は本番版で修正

---

### リスク6: 自動化システムの構築失敗

**発生確率**: 中  
**影響度**: 中

**対策**:
- **Phase 7を必須としない**: 自動化が失敗しても品質ゲートはクリア可能
- **手動チェックで代替**: 自動化できない場合は手動レビューを継続
- **段階的な自動化**: リンクチェックのみ→型定義チェック→用語チェックの順

---

## 🚀 開始方法

### Immediate Action（今すぐ開始）

```bash
# Phase 1.1 を開始
cd docs/specifications
code QUESTION_SCHEDULER_SPEC.md

# 実装を参照しながら改訂
code ../../src/ai/scheduler/QuestionScheduler.ts
```

### 開始前の確認

- [ ] 実装が安定している（大きな変更予定なし）
- [ ] バックアップが取得されている
- [ ] 改訂作業用のブランチを作成

---

**作成者**: GitHub Copilot  
**承認**: 保留中  
**次のアクション**: Phase 1.1（QUESTION_SCHEDULER_SPEC.md改訂）の開始
