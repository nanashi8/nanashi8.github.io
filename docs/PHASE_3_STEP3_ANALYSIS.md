# Phase 3 Step 3: progressStorage.ts分析レポート

## 📊 基本統計

| 項目 | 値 |
|------|-----|
| 総行数 | 3,607行 |
| export宣言数 | 86件 |
| 関数/メソッド数 | 95件 |
| export関数数 | 78件 |
| 暗記関連関数数 | 13件 |

## 🔍 機能分類

### 1. **コアCRUD操作** (Core Operations)
基本的な進捗データの読み書き・管理
- `loadProgress()` - 進捗データ読み込み（非同期）
- `loadProgressSync()` - 進捗データ読み込み（同期）
- `saveProgress()` - 進捗データ保存
- `updateProgressCache()` - キャッシュ更新
- `addQuizResult()` - クイズ結果追加
- `clearProgress()` - 進捗データクリア
- `exportProgress()` - データエクスポート
- `importProgress()` - データインポート

**推定行数**: ~500行

### 2. **統計・集計機能** (Statistics & Analytics)
データ分析、統計情報の生成
- `getResultsByDateRange()` - 期間別結果取得
- `getStatsByMode()` - モード別統計
- `getStatsByCategory()` - カテゴリ別統計
- `getStatsByDifficulty()` - 難易度別統計
- `getRecentResults()` - 最近の結果取得
- `getTodayStats()` - 今日の統計
- `getDailyStudyTime()` - 日別学習時間
- `getWordProgressSummary()` - 単語進捗サマリー
- `getTodayIncorrectWords()` - 今日の誤答単語
- `getWeakWords()` - 弱点単語
- `getOvercomeWeakWords()` - 克服済み弱点単語
- `getCurrentWeakWords()` - 現在の弱点単語
- `getWeakWordsAdvanced()` - 高度な弱点単語分析

**推定行数**: ~800行

### 3. **単語進捗管理** (Word Progress Management)
単語レベルの学習進捗追跡
- `updateWordProgress()` - 単語進捗更新
- `getWordProgress()` - 単語進捗取得
- `getAllWordProgress()` - 全単語進捗取得
- `getWordsByMasteryLevel()` - 習熟度別単語取得
- `getWordsSortedByDifficulty()` - 難易度順単語取得
- `getWordsNeedingReview()` - 復習必要単語
- `recordConfusion()` - 混同記録
- `getConfusedWords()` - 混同単語取得
- `getMasteredWordsCount()` - 定着済み単語数
- `getMasteredWords()` - 定着済み単語リスト
- `recordWordSkip()` - 単語スキップ記録
- `isWordSkipExcluded()` - スキップ除外判定
- `filterSkippedWords()` - スキップ単語フィルタ
- `initializeWordProgress()` (internal) - 単語進捗初期化
- `calculateDifficultyScore()` (internal) - 難易度スコア計算
- `updateMasteryLevel()` (internal) - 習熟レベル更新

**推定行数**: ~700行

### 4. **記憶定着・復習機能** (Retention & Review)
忘却曲線、間隔反復、復習スケジュール管理
- `getRetentionRate()` - 定着率取得
- `calculateRetentionRate()` (internal) - 定着率計算
- `getReviewSchedule()` - 復習スケジュール
- `updateReviewSchedule()` (internal) - 復習スケジュール更新
- `getForgettingCurve()` - 忘却曲線データ
- `predictNextReviewDate()` (internal) - 次回復習日予測

**推定行数**: ~400行

### 5. **暗記モード機能** (Memorization Mode)
暗記カード、学習曲線、行動記録
- `saveMemorizationCardSettings()` - カード表示設定保存
- `getMemorizationCardSettings()` - カード表示設定取得
- `saveMemorizationSettings()` - 暗記設定保存
- `getMemorizationSettings()` - 暗記設定取得
- `recordMemorizationBehavior()` - 暗記行動記録
- `getMemorizationBehaviors()` - 暗記行動履歴取得
- `updateMemorizationCurve()` - 学習曲線更新
- `getMemorizationCurve()` - 学習曲線取得
- `analyzeWordRetention()` - 単語定着分析
- カスタム問題セット管理関数群 (6関数)

**推定行数**: ~500行

### 6. **セッション管理** (Session Management)
セッション履歴、学習設定
- `addSessionHistory()` - セッション履歴追加
- `getSessionHistory()` - セッション履歴取得
- `clearSessionHistory()` - セッション履歴クリア
- `getStudySettings()` - 学習設定取得
- `saveStudySettings()` - 学習設定保存
- `updateStudySettings()` - 学習設定更新

**推定行数**: ~200行

### 7. **ユーティリティ・内部関数** (Utilities)
ヘルパー関数、データ圧縮、バリデーション
- `_safeSetItem()` - 安全なLocalStorage操作
- `cleanupOldResults()` - 古い結果削除
- `compressProgressData()` - データ圧縮
- `validateProgressData()` (internal) - データ検証
- 型定義 (QuizResult, WordProgress, UserProgress等)

**推定行数**: ~300行

---

## 📦 分割計画（4ファイル構成）

### **ファイル1: `progressCore.ts`** (~800行)
**責務**: 基本CRUD、データ永続化、キャッシュ管理

```typescript
// エクスポート関数
- loadProgress()
- loadProgressSync()
- saveProgress()
- updateProgressCache()
- addQuizResult()
- clearProgress()
- exportProgress()
- importProgress()
- compressProgressData()

// 型定義
- QuizResult
- UserProgress
- StudySettings
```

### **ファイル2: `progressStatistics.ts`** (~800行)
**責務**: 統計分析、集計、レポート生成

```typescript
// エクスポート関数
- getResultsByDateRange()
- getStatsByMode()
- getStatsByCategory()
- getStatsByDifficulty()
- getRecentResults()
- getTodayStats()
- getDailyStudyTime()
- getWordProgressSummary()
- getTodayIncorrectWords()
- getWeakWords()
- getOvercomeWeakWords()
- getCurrentWeakWords()
- getWeakWordsAdvanced()
```

### **ファイル3: `progressWordTracking.ts`** (~1100行)
**責務**: 単語進捗追跡、習熟度管理、定着率計算

```typescript
// エクスポート関数
- updateWordProgress()
- getWordProgress()
- getAllWordProgress()
- getWordsByMasteryLevel()
- getWordsSortedByDifficulty()
- getWordsNeedingReview()
- recordConfusion()
- getConfusedWords()
- getMasteredWordsCount()
- getMasteredWords()
- recordWordSkip()
- isWordSkipExcluded()
- filterSkippedWords()
- getRetentionRate()
- calculateRetentionRate()
- getReviewSchedule()
- getForgettingCurve()
- analyzeWordRetention()

// 型定義
- WordProgress
```

### **ファイル4: `progressMemorization.ts`** (~700行)
**責務**: 暗記モード、カスタム問題セット、セッション履歴

```typescript
// エクスポート関数
【暗記設定】
- saveMemorizationCardSettings()
- getMemorizationCardSettings()
- saveMemorizationSettings()
- getMemorizationSettings()

【暗記行動・学習曲線】
- recordMemorizationBehavior()
- getMemorizationBehaviors()
- updateMemorizationCurve()
- getMemorizationCurve()

【カスタム問題セット】
- getCustomQuestionSets()
- saveCustomQuestionSet()
- updateCustomQuestionSet()
- deleteCustomQuestionSet()
- getCustomQuestionSet()
- addQuestionsToSet()

【セッション管理】
- addSessionHistory()
- getSessionHistory()
- clearSessionHistory()
- getStudySettings()
- saveStudySettings()
- updateStudySettings()

// 型定義
- SessionHistoryItem
```

### **ファイル5: `progressStorage.ts`** (~200行)
**責務**: 統合エントリーポイント、後方互換性維持

```typescript
// 全モジュールの再エクスポート
export * from './progressCore';
export * from './progressStatistics';
export * from './progressWordTracking';
export * from './progressMemorization';

// 後方互換性のための型定義エイリアス
```

---

## 🔄 依存関係マップ

```
progressCore.ts (基盤)
  ↑
  ├─ progressStatistics.ts (統計 → コアに依存)
  ├─ progressWordTracking.ts (単語追跡 → コアに依存)
  └─ progressMemorization.ts (暗記 → コア + 単語追跡に依存)

progressStorage.ts (統合エントリー)
  ↑ 全モジュールを再エクスポート
```

**依存方向**: 
- `progressCore.ts` = 依存なし（最下層）
- `progressStatistics.ts` → `progressCore.ts`
- `progressWordTracking.ts` → `progressCore.ts`
- `progressMemorization.ts` → `progressCore.ts` + `progressWordTracking.ts`

---

## ⚠️ リスク評価

| リスク | レベル | 対策 |
|--------|--------|------|
| 循環依存 | 🟡 中 | 依存グラフを厳密に管理、双方向参照禁止 |
| 型エラー | 🟢 低 | 型定義を最初に分離、各モジュールでre-export |
| インポート修正漏れ | 🔴 高 | grep全検索で全参照箇所を特定後に一括修正 |
| 機能破損 | 🟡 中 | 各モジュール分割後に即座にテスト実行 |
| 後方互換性破壊 | 🟢 低 | progressStorage.tsで全関数を再エクスポート |

---

## ✅ 成功基準

1. **全81テスト合格維持**
2. **TypeScript型エラー0件**
3. **ESLintエラー0件**
4. **ビルド成功**
5. **各分割ファイルが目標行数範囲内** (600-1100行)
6. **循環依存なし** (madge等で検証)
7. **既存インポート文すべて動作** (progressStorage.tsからの再エクスポートで保証)

---

## 📅 実装スケジュール

### **Phase 3 Step 4-a**: 型定義分離 (30分)
- 共通型を`progressTypes.ts`に抽出
- 各分割ファイルで型をインポート

### **Phase 3 Step 4-b**: progressCore.ts作成 (1時間)
- CRUD関数を抽出
- テスト実行・修正

### **Phase 3 Step 4-c**: progressStatistics.ts作成 (1時間)
- 統計関数を抽出
- テスト実行・修正

### **Phase 3 Step 4-d**: progressWordTracking.ts作成 (1.5時間)
- 単語追跡関数を抽出
- テスト実行・修正

### **Phase 3 Step 4-e**: progressMemorization.ts作成 (1時間)
- 暗記関連関数を抽出
- テスト実行・修正

### **Phase 3 Step 4-f**: 統合・検証 (30分)
- progressStorage.ts作成（再エクスポート）
- 全インポート文修正確認
- 最終テスト実行
- git commit + tag

**合計見積**: 5.5時間

---

## 🎯 次のアクション

1. ✅ この分析レポートをレビュー
2. 型定義の抽出開始（progressTypes.ts作成）
3. progressCore.ts作成
4. 各モジュールを順次作成
5. 統合テスト

---

作成日: 2025-12-12
Phase: 3 Step 3
ステータス: 分析完了、実装準備完了
