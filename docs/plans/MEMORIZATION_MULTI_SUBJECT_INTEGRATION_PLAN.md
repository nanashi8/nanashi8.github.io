# 暗記タブ多教科統合実装計画

## 📋 実装概要

**目的**: 暗記タブを英語専用から「英語・社会科（将来的に他教科も）」へ拡張し、教科ごとに適切なフィルタを動的に切り替える統合UI/ロジックを構築する。

**方針**: 案A（出題元に「社会」追加 + 動的フィルタ切り替え）

**設計原則**:

- 拡張性: 他教科（理科・国語等）を将来追加可能な設計
- 後方互換性: 既存の英語学習機能・進捗データに影響を与えない
- 一貫性: 学習効率AI、QuestionScheduler、進捗管理を全教科で統一

---

## 🔢 工程数算出

### フェーズ1: 型定義・データモデル拡張（3工程）

1. **教科識別型の追加** (`src/types/subjects.ts` 新規作成)
   - SubjectType: 'english' | 'social-studies' | 'science' | 'japanese' 等
   - SubjectConfig: 各教科のフィルタ構成定義
   - 影響ファイル: 新規1

2. **QuestionSet型の拡張** (`src/types/domain.ts`)
   - `subject?: SubjectType` フィールド追加
   - 社会科データの暗記タブ用変換インターフェース定義
   - 影響ファイル: 既存1

3. **統合Progress型の定義** (`src/types/progress.ts` or 新規)
   - 英語progressと社会科progressの共通インターフェース
   - 進捗ストレージのキー命名規則統一
   - 影響ファイル: 新規1 or 既存1

### フェーズ2: データローダー・変換層（4工程）

4. **社会科データローダー** (`src/loaders/socialStudiesLoader.ts` 新規)
   - `loadSocialStudiesQuestions(dataSource)`: JSON読み込み
   - SocialStudiesQuestion → Question型への変換
   - relationshipsデータの統合
   - 影響ファイル: 新規1

5. **教科別QuestionSet統合** (`src/App.tsx` または新規hooks)
   - 英語questionSetsと社会科questionSetsの統合配列生成
   - 教科識別子（subject）の付与
   - 影響ファイル: 既存1（App.tsx）

6. **社会科進捗アダプター** (`src/adapters/socialStudiesProgressAdapter.ts` 新規)
   - 社会科固有の進捗API → 統一Progress形式へ変換
   - `getSocialStudiesTermProgress(term)` → `getWordProgress(word)` 互換
   - 影響ファイル: 新規1

7. **QuestionScheduler拡張** (`src/ai/scheduler/QuestionScheduler.ts`)
   - 社会科questionの識別（term vs word）
   - 社会科特有の優先度（年代・因果関係重視）対応
   - 影響ファイル: 既存1

### フェーズ3: UI動的フィルタ実装（5工程）

8. **教科選択ロジック** (`src/components/MemorizationView.tsx`)
   - `selectedSubject` state追加
   - dataSource選択時の自動教科判定（prefix 'social-' 等）
   - 影響ファイル: 既存1

9. **動的フィルタコンポーネント** (`src/components/SubjectFilterSelector.tsx` 新規)
   - 教科ごとのフィルタ項目を動的生成
   - 英語: 単語/熟語、カテゴリ10種、難易度3段階
   - 社会科: 学年/単元、分野（歴史/地理/公民）、時代/地域、難易度5段階
   - 影響ファイル: 新規1

10. **フィルタリングロジック統合** (`src/components/MemorizationView.tsx`)
    - 教科判定に基づくフィルタ条件の分岐
    - 社会科専用フィルタstate追加（selectedGrade, selectedSocialField 等）
    - 影響ファイル: 既存1

11. **出題元select更新** (`src/components/MemorizationView.tsx`)
    - questionSetsに教科ラベル（英語/社会科）を表示
    - グループ化（optgroup）による視覚的分離
    - 影響ファイル: 既存1

12. **LocalStorage分離** (`src/components/MemorizationView.tsx`)
    - 教科ごとのフィルタ保存キー
    - `memorization-filter-english-*` / `memorization-filter-social-*`
    - 影響ファイル: 既存1

### フェーズ4: 学習ロジック統合（3工程）

13. **統一進捗更新** (`src/components/MemorizationView.tsx`)
    - handleAnswer内で教科判定 → 適切な進捗API呼び出し
    - 社会科: `updateSocialStudiesProgress(term, ...)`
    - 英語: 既存 `updateWordProgress(word, ...)`
    - 影響ファイル: 既存1

14. **学習効率AI統合** (`src/components/MemorizationView.tsx`)
    - 教科ごとの効率AI切り替え
    - 英語: `LearningEfficiencyAI`
    - 社会科: `SocialStudiesEfficiencyAI`（既存）
    - ScoreBoardへの効率指標渡し
    - 影響ファイル: 既存1

15. **問題選択戦略統合** (`src/strategies/MemorizationStrategy.ts`)
    - 社会科のcategoryロジック対応（field, term単位）
    - 忘却曲線計算の共通化（英語・社会科で同じ復習間隔）
    - 影響ファイル: 既存1

### フェーズ5: ScoreBoard対応（2工程）

16. **ScoreBoard教科対応** (`src/components/ScoreBoard.tsx`)
    - `subject?: SubjectType` prop追加
    - 教科ごとの統計表示文言（「単語」→「語句」等）
    - AIコメント生成時の教科判定
    - 影響ファイル: 既存1

17. **統計API教科判定** (`src/progressStorage.ts`)
    - `getMemorizationDetailedRetentionStats` 等の教科対応
    - 社会科用の統計関数（既存）との統合呼び出し
    - 影響ファイル: 既存1

### フェーズ6: テスト・検証（4工程）

18. **単体テスト** (新規 `tests/unit/subjectIntegration.test.ts`)
    - 教科判定ロジック
    - データ変換（SocialStudiesQuestion → Question）
    - フィルタリング条件分岐
    - 影響ファイル: 新規1

19. **統合テスト** (新規 `tests/integration/memorizationMultiSubject.test.ts`)
    - 英語→社会科切り替えの動作
    - 進捗の教科別分離
    - LocalStorageのクロス汚染防止
    - 影響ファイル: 新規1

20. **E2Eシナリオテスト** (Playwright)
    - 暗記タブで英語問題セット選択 → 出題確認
    - 社会科問題セット選択 → フィルタUI変化確認 → 出題確認
    - 進捗の独立性確認
    - 影響ファイル: 新規1（`tests/e2e/memorization-subjects.spec.ts`）

21. **品質検証スクリプト** (`scripts/validate-memorization-integration.ts`)
    - 全教科データの整合性チェック
    - QuestionSet IDの重複検出
    - 型安全性の静的解析
    - 影響ファイル: 新規1

### フェーズ7: ドキュメント・最終調整（3工程）

22. **実装ガイド作成** (`docs/how-to/add-new-subject.md`)
    - 新しい教科を追加する手順書
    - 型定義・データ形式・フィルタ設定の例
    - 影響ファイル: 新規1

23. **ユーザー向けヘルプ更新** (`docs/features/memorization-tab.md`)
    - 教科切り替えの説明
    - 各教科のフィルタ項目説明
    - 影響ファイル: 既存1 or 新規1

24. **リファクタリング・パフォーマンス最適化**
    - 重複コードの共通化
    - useMemoによる再計算防止
    - LazyLoadによる初期ロード高速化（社会科データ）
    - 影響ファイル: 複数（リファクタリング範囲に依存）

---

## 📊 工程サマリー

| フェーズ                  | 工程数     | 新規ファイル | 既存ファイル修正 | 推定工数      |
| ------------------------- | ---------- | ------------ | ---------------- | ------------- |
| 1. 型定義・データモデル   | 3          | 2            | 1                | 2-3時間       |
| 2. データローダー・変換層 | 4          | 3            | 2                | 4-6時間       |
| 3. UI動的フィルタ         | 5          | 1            | 4                | 6-8時間       |
| 4. 学習ロジック統合       | 3          | 0            | 3                | 3-4時間       |
| 5. ScoreBoard対応         | 2          | 0            | 2                | 2-3時間       |
| 6. テスト・検証           | 4          | 4            | 0                | 4-6時間       |
| 7. ドキュメント・最終調整 | 3          | 2            | 1+               | 2-4時間       |
| **合計**                  | **24工程** | **12**       | **13+**          | **23-34時間** |

---

## 🎯 実装優先順位

### 優先度A（MVP: 最小限の動作確認）

- 工程 1-5（型定義〜データローダー）
- 工程 8-11（UI動的フィルタの基本）
- 工程 13（進捗更新統合）
  → **12工程、約15-20時間**

### 優先度B（実用レベル）

- 工程 6-7（QuestionScheduler・進捗アダプター）
- 工程 12（LocalStorage分離）
- 工程 14-15（学習効率AI・問題選択戦略）
- 工程 16-17（ScoreBoard対応）
  → **追加6工程、約8-12時間**

### 優先度C（品質保証・運用）

- 工程 18-21（テスト）
- 工程 22-24（ドキュメント・最適化）
  → **追加6工程、約8-12時間**

---

## 🛠️ 技術的課題と対策

### 課題1: データ型の統一

**問題**: SocialStudiesQuestion（term/reading/matter）と Question（word/reading/meaning）の構造差異

**対策**:

- Adapter層で変換: `term → word`, `matter → meaning`
- 内部的に教科フラグ（`_subject`）を保持して逆変換可能に
- QuestionScheduler内で `question._subject === 'social-studies'` で分岐

### 課題2: 進捗管理の教科分離

**問題**: LocalStorageキーが英語前提（`word-progress`）で社会科と衝突

**対策**:

- 教科別プレフィックス: `english-word-progress`, `social-studies-term-progress`
- 統一API: `getProgressBySubject(subject, identifier)` でラップ
- 既存の英語データは自動マイグレーション（初回起動時）

### 課題3: QuestionSchedulerの互換性

**問題**: Positionロジック・優先度計算が英語用語を前提

**対策**:

- `word` の代わりに汎用 `identifier` プロパティで抽象化
- 社会科特有の優先度（年代順・因果関係）は追加ロジックとして分岐
- 基本アルゴリズム（Position 0-100、忘却曲線）は共通

### 課題4: UIフィルタの複雑化

**問題**: 教科ごとにフィルタ項目が異なり、条件分岐が増える

**対策**:

- SubjectConfig による宣言的設計（設定ファイル化）
- 動的コンポーネント生成（`SubjectFilterSelector`）でコード重複回避
- カスタムフック `useSubjectFilters` でロジック分離

---

## 📦 影響範囲マップ

### コアファイル（必須修正）

1. `src/components/MemorizationView.tsx` ★★★
2. `src/types/domain.ts` ★★
3. `src/ai/scheduler/QuestionScheduler.ts` ★★
4. `src/components/ScoreBoard.tsx` ★

### 新規ファイル（追加）

1. `src/types/subjects.ts`
2. `src/loaders/socialStudiesLoader.ts`
3. `src/adapters/socialStudiesProgressAdapter.ts`
4. `src/components/SubjectFilterSelector.tsx`
5. `src/hooks/useSubjectFilters.ts` (optional)
6. テスト/ドキュメント群（6ファイル）

### 軽微な修正

- `src/App.tsx`: questionSets統合ロジック追加
- `src/progressStorage.ts`: 教科判定分岐
- `src/strategies/MemorizationStrategy.ts`: 社会科対応

---

## 🚀 実装ロードマップ

### Week 1: 基盤構築（優先度A前半）

- Day 1-2: 型定義（工程1-3）
- Day 3-4: データローダー（工程4-5）
- Day 5: 初期統合テスト

### Week 2: UI実装（優先度A後半）

- Day 1-2: 動的フィルタUI（工程8-11）
- Day 3: 進捗更新統合（工程13）
- Day 4-5: 動作確認・バグ修正

### Week 3: 学習ロジック完成（優先度B）

- Day 1-2: QuestionScheduler・進捗アダプター（工程6-7, 12）
- Day 3: 学習効率AI統合（工程14-15）
- Day 4-5: ScoreBoard対応（工程16-17）

### Week 4: 品質保証（優先度C）

- Day 1-2: テスト実装（工程18-21）
- Day 3: ドキュメント作成（工程22-23）
- Day 4-5: リファクタリング・最適化（工程24）

---

## 🔮 将来の拡張計画

### 他教科追加時の工数見積もり

既に基盤が整備されているため、**理科・国語追加は各教科2-4時間**で可能：

1. データJSON作成（教科固有）
2. SubjectConfig追加（フィルタ項目定義）
3. Loader追加（既存パターンのコピー）
4. テスト追加

### 予定教科

- **理科**: 用語・実験・法則（1-3年分野別）
- **国語**: 古文・漢文・現代文読解語彙
- **数学**: 公式・定理（暗記よりフラッシュカード的使用）

### アーキテクチャ強化

- 教科別AI学習戦略（科目の特性に応じた最適化）
- クロス教科いもづる式学習（歴史×地理、理科×英語専門用語等）
- 教科横断統計ダッシュボード

---

## ✅ 実装チェックリスト

### 前準備

- [ ] 社会科データ100問の品質検証（validate-social-studies.ts修復）
- [ ] 既存の英語学習進捗データのバックアップ
- [ ] 開発ブランチ作成（`feature/multi-subject-memorization`）

### フェーズ1-3（MVP）完了条件

- [ ] 英語問題セット選択 → 英語用フィルタ表示 → 出題動作
- [ ] 社会科問題セット選択 → 社会科用フィルタ表示 → 出題動作
- [ ] 進捗が教科別に独立して保存される
- [ ] TypeScriptエラーなし

### フェーズ4-5（実用レベル）完了条件

- [ ] 学習効率AI（定着率・学習速度）が教科別に表示
- [ ] QuestionSchedulerが社会科問題を適切に優先度付け
- [ ] ScoreBoardが教科判定して適切なコメント生成

### フェーズ6-7（リリース）完了条件

- [ ] 全テストパス（unit, integration, e2e）
- [ ] ユーザー向けドキュメント完成
- [ ] パフォーマンス劣化なし（Lighthouse スコア維持）
- [ ] プロダクション環境デプロイ・動作確認

---

## 📝 備考

### コードレビューポイント

- 型安全性: `SubjectType` による厳密な教科判定
- パフォーマンス: useMemo/useCallbackの適切な使用
- テスタビリティ: ロジックのコンポーネント外分離
- アクセシビリティ: 動的フィルタのaria-label設定

### ユーザー体験への影響

- **ポジティブ**: 1つのタブで複数教科を学習可能、UI一貫性
- **注意点**: 初回のフィルタ切り替え時の学習コスト（説明文・tooltipで緩和）
- **移行**: 既存ユーザーは英語のみ使用なら変化なし（後方互換）

### リスク管理

- **高リスク**: 進捗データの破損 → バックアップ・マイグレーション機能必須
- **中リスク**: QuestionSchedulerの挙動変化 → A/Bテスト継続
- **低リスク**: UIの複雑化 → プロトタイプでのユーザビリティテスト

---

**作成日**: 2025年12月28日  
**次回レビュー予定**: MVP完了時（フェーズ3終了後）
