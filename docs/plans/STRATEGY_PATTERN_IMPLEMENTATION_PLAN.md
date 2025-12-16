# 戦略パターン実装計画書

## 📋 実装概要

**目的**: 4つの学習タブ（暗記・和訳・スペル・文法）の出題ロジックを戦略パターンで統一し、高度な適応型学習機能を全タブに展開

**現状分析**:
- 暗記タブ: 高度な忘却リスク計算・間隔反復学習を実装済み
- 他3タブ: 基本的な優先順位のみ実装
- コード重複: calculateEffectiveLimitが4タブで重複
- 依存関係: 30個のコンポーネント、複雑な型定義

## 🎯 実装工程（全16工程）

### フェーズ1: 分析・設計（工程1-4）

#### 工程1: コード分析と依存関係マッピング [2h]
**タスク**:
- [ ] MemorizationView.tsxの全関数を分析（150行×3関数 = 450行）
- [ ] QuizView/SpellingView/GrammarQuizViewの実装確認
- [ ] 型定義の洗い出し（Question, QuizState, SpellingState）
- [ ] localStorage構造の確認（wordProgress構造）
- [ ] 依存関係図の作成

**成果物**: `DEPENDENCY_MAP.md`

#### 工程2: 共通ロジックの抽出設計 [1.5h]
**タスク**:
- [ ] 暗記タブから抽出すべき関数のリスト作成
  - calculateOptimalInterval（間隔反復学習）
  - calculateForgettingRisk（忘却リスク計算）
  - calculateEffectiveLimit（段階的上限計算）
  - getWordStatus（問題状態取得）
- [ ] 共通化可能なロジックと固有ロジックの分離
- [ ] ユーティリティ関数の設計（10-15関数）

**成果物**: `COMMON_LOGIC_DESIGN.md`

#### 工程3: 戦略クラスインターフェース詳細設計 [2h]
**タスク**:
- [ ] QuestionSelectionStrategy インターフェースの完全定義
- [ ] BaseQuestionStrategy の実装詳細設計
- [ ] 各戦略クラスの責務定義
  - MemorizationStrategy: 忘却リスク + 間隔反復
  - TranslationStrategy: 正答率 + 学習履歴
  - SpellingStrategy: タイピング速度 + 正答率
  - GrammarStrategy: 文法パターン + 正答率
- [ ] カスタマイズポイントの設計

**成果物**: `STRATEGY_INTERFACE_SPEC.md`

#### 工程4: データフロー設計とエラーハンドリング [1.5h]
**タスク**:
- [ ] 各コンポーネント → 戦略クラス → localStorage のフロー定義
- [ ] エラーケースの洗い出し（10-15パターン）
- [ ] フォールバック戦略の設計
- [ ] パフォーマンス要件定義（ソート処理: <100ms）

**成果物**: `DATA_FLOW_SPEC.md`

---

### フェーズ2: 共通基盤実装（工程5-7）

#### 工程5: 共通ユーティリティ関数実装 [3h]
**ファイル**: `src/strategies/learningUtils.ts`

**タスク**:
- [ ] calculateOptimalInterval実装（SuperMemo SM-2アルゴリズム）
- [ ] calculateForgettingRisk実装（忘却曲線ベース）
- [ ] calculateEffectiveLimit実装（3段階制限）
- [ ] getQuestionStatusFromStorage実装（localStorage読み込み）
- [ ] updateQuestionProgress実装（進捗保存）
- [ ] 各関数のJSDocコメント追加
- [ ] 単体テスト作成（10-15ケース）

**検証**:
```bash
npm run test -- learningUtils.test.ts
```

#### 工程6: 基底戦略クラス完全実装 [2h]
**ファイル**: `src/strategies/QuestionSelectionStrategy.ts`（更新）

**タスク**:
- [ ] BaseQuestionStrategy の全メソッド実装
- [ ] calculateEffectiveLimit の統合
- [ ] shouldEnterReviewMode の実装
- [ ] getQuestionStatus のモード対応実装
- [ ] 型定義の完全化（SessionStats, LearningLimits等）
- [ ] エラーハンドリング追加

**検証**:
```typescript
// 型チェック
npx tsc --noEmit
```

#### 工程7: カスタムフック作成 [2h]
**ファイル**: `src/hooks/useQuestionStrategy.ts`

**タスク**:
- [ ] useQuestionStrategy フック実装
  ```typescript
  interface UseQuestionStrategyResult<T> {
    sortedQuestions: T[];
    shouldReview: boolean;
    effectiveLimits: { learning: number; review: number };
    updateLimits: (learning: number, review: number) => void;
  }
  ```
- [ ] 戦略切り替えロジック
- [ ] メモ化最適化（useMemo, useCallback）
- [ ] デバッグログ追加

**検証**:
```bash
npm run lint
```

---

### フェーズ3: 個別戦略実装（工程8-11）

#### 工程8: MemorizationStrategy実装 [4h]
**ファイル**: `src/strategies/MemorizationStrategy.ts`

**タスク**:
- [ ] 既存のsortQuestionsByPriority移行（450行）
- [ ] 忘却リスクベースの優先度計算
- [ ] 復習モード時の優先度調整
- [ ] 間隔反復学習の統合
- [ ] 新規問題抑制ロジック（復習20%以上で抑制）
- [ ] パフォーマンステスト（1000問で<100ms）

**重要なロジック**:
```typescript
// 忘却リスク: 150+ → 最優先
// 忘却リスク: 100-149 → 高優先
// incorrect → 常に高優先
// still_learning → 高優先
// mastered → 忘却リスクに応じて調整
// new → 復習状況に応じて大幅抑制
```

#### 工程9: TranslationStrategy実装 [2h]
**ファイル**: `src/strategies/TranslationStrategy.ts`

**タスク**:
- [ ] 正答率ベースの優先度計算
- [ ] 学習履歴の考慮（最終学習日時）
- [ ] シンプルなソートロジック
- [ ] 効果的上限の適用
- [ ] 復習モード判定

**ロジック**:
```typescript
// accuracy < 50% → incorrect → priority 1
// 50% <= accuracy < 80% → still_learning → priority 2
// accuracy >= 80% && streak >= 2 → mastered → priority 5
```

#### 工程10: SpellingStrategy実装 [2.5h]
**ファイル**: `src/strategies/SpellingStrategy.ts`

**タスク**:
- [ ] タイピング速度の考慮（avgResponseSpeed）
- [ ] 正答率ベースの優先度
- [ ] SpellingQuestion型への対応
- [ ] 特殊文字・長単語の優先度調整
- [ ] 効果的上限の適用

**拡張ロジック**:
```typescript
// avgResponseSpeed が遅い → 優先度UP
// 長単語（8文字以上） → 優先度調整
// 特殊文字含む → 優先度調整
```

#### 工程11: GrammarStrategy実装 [2.5h]
**ファイル**: `src/strategies/GrammarStrategy.ts`

**タスク**:
- [ ] 文法パターン認識の統合
- [ ] 正答率ベースの優先度
- [ ] GrammarQuestion型への対応
- [ ] 文法カテゴリ別の優先度調整
- [ ] 効果的上限の適用

**拡張ロジック**:
```typescript
// 文法パターン（時制・仮定法等）の重要度
// 誤答パターンの分析
// 関連文法の連続学習抑制
```

---

### フェーズ4: コンポーネント統合（工程12-15）

#### 工程12: MemorizationView統合 [3h]
**ファイル**: `src/components/MemorizationView.tsx`

**タスク**:
- [ ] 既存のsortQuestionsByPriority削除（450行削除）
- [ ] useQuestionStrategy フック導入
- [ ] MemorizationStrategy インスタンス化
- [ ] effectiveLimits の UI 反映
- [ ] 復習モード自動切替の統合
- [ ] 動作確認（20パターン）

**変更箇所**:
```typescript
// Before: 450行の独自ロジック
// After: 
const strategy = new MemorizationStrategy();
const { sortedQuestions, shouldReview, effectiveLimits } = useQuestionStrategy(
  questions,
  strategy,
  { learningLimit: stillLearningLimit, reviewLimit: incorrectLimit }
);
```

**検証**:
- [ ] 全画面表示動作
- [ ] 音声発音
- [ ] 統計表示
- [ ] 上限設定変更時の再ソート

#### 工程13: QuizView統合 [2h]
**ファイル**: `src/components/QuizView.tsx`

**タスク**:
- [ ] calculateEffectiveLimit削除
- [ ] TranslationStrategy導入
- [ ] useQuestionStrategy フック統合
- [ ] 問題リスト更新ロジックの簡略化
- [ ] 動作確認

#### 工程14: SpellingView統合 [2h]
**ファイル**: `src/components/SpellingView.tsx`

**タスク**:
- [ ] calculateEffectiveLimit削除
- [ ] SpellingStrategy導入
- [ ] SpellingQuestion型対応
- [ ] useSpellingGame との統合
- [ ] 動作確認

#### 工程15: GrammarQuizView統合 [2h]
**ファイル**: `src/components/GrammarQuizView.tsx`

**タスク**:
- [ ] calculateEffectiveLimit削除
- [ ] GrammarStrategy導入
- [ ] 文法問題特有の統計表示
- [ ] 動作確認

---

### フェーズ5: テスト・最適化（工程16）

#### 工程16: 総合テストと最適化 [4h]

**テスト項目**:
1. **単体テスト** (各戦略クラス)
   - [ ] MemorizationStrategy: 忘却リスク計算（15ケース）
   - [ ] TranslationStrategy: 正答率ベース（10ケース）
   - [ ] SpellingStrategy: タイピング速度（10ケース）
   - [ ] GrammarStrategy: 文法パターン（10ケース）

2. **統合テスト** (各コンポーネント)
   - [ ] MemorizationView: 問題切替・音声・統計
   - [ ] QuizView: 問題切替・正誤判定
   - [ ] SpellingView: 文字入力・判定
   - [ ] GrammarQuizView: 選択肢・判定

3. **パフォーマンステスト**
   - [ ] 1000問のソート: <100ms
   - [ ] メモリ使用量: <50MB増
   - [ ] レンダリング: <16ms (60fps)

4. **エッジケーステスト**
   - [ ] 問題数0の場合
   - [ ] localStorage破損時
   - [ ] 上限設定0の場合
   - [ ] 全問正解の場合
   - [ ] 全問不正解の場合

**最適化**:
- [ ] 不要な再レンダリング削減（React.memo）
- [ ] ソート処理の最適化（quicksort → heapsort検討）
- [ ] localStorage アクセスのバッチ化
- [ ] デバッグログの本番環境除外

**ドキュメント**:
- [ ] コード内コメント追加（JSDoc）
- [ ] README更新（戦略パターンの説明）
- [ ] 使用例の追加
- [ ] トラブルシューティングガイド

---

## 📊 工程概要表

| フェーズ | 工程 | 内容 | 所要時間 | 担当ファイル数 |
|---------|------|------|----------|--------------|
| 1. 分析・設計 | 1-4 | コード分析、設計 | 7h | - |
| 2. 共通基盤 | 5-7 | ユーティリティ、基底クラス、フック | 7h | 3ファイル |
| 3. 個別戦略 | 8-11 | 4つの戦略クラス実装 | 11h | 4ファイル |
| 4. 統合 | 12-15 | 4つのコンポーネント統合 | 9h | 4ファイル |
| 5. テスト | 16 | 総合テスト・最適化 | 4h | 全体 |
| **合計** | **16工程** | **全工程** | **38時間** | **11ファイル** |

---

## 🎯 成功基準

### 機能要件
- ✅ 全4タブで戦略パターン適用完了
- ✅ コード重複が80%以上削減
- ✅ 暗記タブの高度な機能を他3タブに展開

### 非機能要件
- ✅ 既存機能の互換性100%維持
- ✅ パフォーマンス劣化なし（±5%以内）
- ✅ TypeScriptエラー0件
- ✅ テストカバレッジ80%以上

### 保守性要件
- ✅ 新しい戦略追加が1ファイルで完結
- ✅ 各タブの微調整が独立して可能
- ✅ ドキュメント整備完了

---

## 🚨 リスクと対策

### リスク1: 既存機能の破壊
**対策**: 段階的な統合（1タブずつテスト）、フィーチャーフラグの活用

### リスク2: パフォーマンス劣化
**対策**: ベンチマークテスト、メモ化最適化、プロファイリング

### リスク3: 型定義の複雑化
**対策**: ジェネリクスの適切な使用、型ガードの実装

### リスク4: 実装期間の超過
**対策**: 優先度付け（P0: 暗記タブ統合、P1: 他3タブ）、MVP定義

---

## 📝 実装チェックリスト

### Phase 1完了条件
- [ ] すべての依存関係を把握
- [ ] 設計ドキュメント完成
- [ ] 全メンバーがアーキテクチャを理解

### Phase 2完了条件
- [ ] 共通ユーティリティが単体テスト通過
- [ ] 基底クラスが型エラーなし
- [ ] カスタムフックが動作確認済み

### Phase 3完了条件
- [ ] 4つの戦略クラスが実装完了
- [ ] 各戦略が単体テスト通過
- [ ] パフォーマンス要件達成

### Phase 4完了条件
- [ ] 4つのコンポーネントが統合完了
- [ ] 既存機能が全て動作
- [ ] UIに変更なし

### Phase 5完了条件
- [ ] 全テスト通過
- [ ] ドキュメント更新完了
- [ ] 本番デプロイ準備完了

---

## 🎓 学習目標

### 技術的学習
- 戦略パターンの実践的理解
- TypeScriptの高度な型システム活用
- React Hooks のカスタムフック設計
- パフォーマンス最適化技法

### ドメイン知識
- 間隔反復学習アルゴリズム（SuperMemo SM-2）
- 忘却曲線理論
- 適応型学習システム設計
- 教育心理学の応用

---

## 📚 参考資料

### アルゴリズム
- SuperMemo SM-2: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
- 忘却曲線: Ebbinghaus Forgetting Curve

### デザインパターン
- Strategy Pattern: GoF Design Patterns
- React Hooks Pattern: React公式ドキュメント

### パフォーマンス
- React Performance Optimization
- JavaScript Profiling Guide

---

## 🔄 実装順序の根拠

1. **分析・設計を最初に** → 手戻りを最小化
2. **共通基盤から実装** → 依存関係を明確化
3. **暗記タブから統合** → 最も複雑な実装で検証
4. **他3タブは並行可能** → 依存関係が少ない
5. **最後に総合テスト** → 全体の整合性確認

---

## ✅ 完了後の期待効果

### 開発効率
- 新機能追加: 50%高速化
- バグ修正: 70%高速化
- コードレビュー: 60%時間短縮

### コード品質
- 重複コード: 80%削減
- テストカバレッジ: 40% → 80%
- 型安全性: 95% → 100%

### ユーザー体験
- 学習効率: 30%向上（適応型学習）
- エラー率: 50%削減
- レスポンス: 変化なし

---

**策定日**: 2025年12月16日
**策定者**: GitHub Copilot
**承認者**: 未定
**バージョン**: 1.0
