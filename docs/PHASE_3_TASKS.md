# Phase 3: 構造最適化 タスクリスト

**期間**: 2025年12月12日〜  
**ステータス**: 🔄 進行中 (Step 1完了)  
**完了率**: 16% (1/6 Step完了)

---

## 📋 Phase 3 ステップ別タスク

### Step 1: 未使用再エクスポートファイルの削除 (0.5日) ✅ 完了

#### タスク
- [x] 再エクスポートファイルの使用状況確認
  - [x] grep検索で全ファイルチェック
  - [x] 11ファイル全て未使用確認
- [x] ファイル削除実行
  - [x] aiCommentGenerator.ts
  - [x] aiCommentHelpers.ts
  - [x] confusionPairs.ts
  - [x] forgettingAlert.ts
  - [x] goalSimulator.ts
  - [x] learningAssistant.ts
  - [x] progressStorage.ts
  - [x] retentionRateImproved.ts
  - [x] speechSynthesis.ts
  - [x] teacherInteractions.ts
  - [x] timeBasedGreeting.ts
- [x] インポートパス修正
  - [x] 相対パス → @/エイリアス一括変更
  - [x] 動的インポート(import())も修正
- [x] テスト・ビルド確認
  - [x] 81テスト全合格
  - [x] ビルド成功

#### 完了日
2025年12月12日

#### 成果
- ✅ src/直下のファイル数削減: 11ファイル削除
- ✅ インポートパスの明確化: @/エイリアスに統一
- ✅ 影響なし: テスト・ビルド共に成功

---

### Step 2: ドキュメント整理とベースライン確立 (0.5日) 🔄 進行中

#### タスク
- [ ] Phase 3タスクリスト作成
  - [ ] docs/PHASE_3_TASKS.md
  - [ ] Step別の詳細記録
- [ ] 現状のベースライン記録
  - [ ] テスト結果記録(81テスト)
  - [ ] ビルド成功確認
  - [ ] ファイル構造記録
- [ ] チェックポイント作成
  - [ ] Git commit
  - [ ] Git tag: phase3-step1-complete

#### 期限
2025年12月13日

---

### Step 3: progressStorage.ts 分析と分割計画 (1日)

#### タスク
- [ ] progressStorage.ts の詳細分析
  - [ ] 3551行の関数リスト作成
  - [ ] 責務ごとにグループ化
  - [ ] 依存関係マップ作成
- [ ] 分割設計書作成
  - [ ] core.ts: 基本CRUD(読み書き)
  - [ ] statistics.ts: 統計計算
  - [ ] retention.ts: 定着率・復習
  - [ ] migration.ts: データ移行
- [ ] テスト戦略立案
  - [ ] 各モジュールのテスト計画
  - [ ] 統合テスト計画
- [ ] リスク評価とロールバック計画

#### 期限
2025年12月14日

---

### Step 4: progressStorage.ts 段階的分割 (2-3日)

#### Step 4-1: core機能の抽出
- [ ] progressStorage/core.ts 作成
  - [ ] loadProgress関数
  - [ ] saveProgress関数
  - [ ] 基本的なデータ構造定義
- [ ] テスト作成・実行
- [ ] ビルド確認

#### Step 4-2: statistics機能の抽出
- [ ] progressStorage/statistics.ts 作成
  - [ ] getTodayStats関数
  - [ ] getRetentionRate関数
  - [ ] 各種統計計算関数
- [ ] テスト作成・実行
- [ ] ビルド確認

#### Step 4-3: retention機能の抽出
- [ ] progressStorage/retention.ts 作成
  - [ ] 定着率計算
  - [ ] 復習スケジュール
  - [ ] 忘却曲線関連
- [ ] テスト作成・実行
- [ ] ビルド確認

#### Step 4-4: 統合とクリーンアップ
- [ ] progressStorage/index.ts 作成
  - [ ] 各モジュールの統合エクスポート
- [ ] インポートパス整理
- [ ] 全テスト実行
- [ ] 最終ビルド確認

#### 期限
2025年12月15-17日

---

### Step 5: src/直下ファイルの整理 (1日)

#### タスク
- [ ] utils.ts のサイズ確認
  - [ ] 行数確認
  - [ ] 分割の必要性判断
- [ ] types.ts の整理
  - [ ] src/types/ へ統合検討
  - [ ] 重複型定義の統一
- [ ] 残存ファイルの配置確認
  - [ ] englishTrivia.ts
  - [ ] その他のファイル

#### 期限
2025年12月18日

---

### Step 6: 最終検証とドキュメント更新 (0.5日)

#### タスク
- [ ] 全テスト実行
  - [ ] 目標: 100テスト以上
  - [ ] 100%合格
- [ ] ビルド最終確認
  - [ ] サイズ確認
  - [ ] エラー・警告なし
- [ ] インポートパス一貫性確認
  - [ ] @/エイリアス統一
  - [ ] 相対パスなし
- [ ] ドキュメント作成
  - [ ] Phase 3完了レポート
  - [ ] 進捗サマリー更新

#### 期限
2025年12月18-19日

---

## ✅ Phase 3 完了基準

### 必須条件 (Must Have)
- [ ] 全テスト合格(100テスト以上)
- [ ] ビルド成功
- [ ] src/直下のファイル数 ≤ 10個
- [ ] progressStorage.ts が4ファイル以内に分割
- [ ] 型エラー数が増加していない

### 推奨条件 (Should Have)
- [ ] テスト追加(目標: 100テスト)
- [ ] ファイルサイズ平均 ≤ 500行
- [ ] インポートパスが@/エイリアス統一
- [ ] 完全なドキュメント

---

## 📈 進捗トラッキング

### Week 1-2 (12/12-12/19)
- [x] Step 1完了(12/12)
- [ ] Step 2完了
- [ ] Step 3完了
- [ ] Step 4開始

### Week 2-3 (12/15-12/22)
- [ ] Step 4完了
- [ ] Step 5完了
- [ ] Step 6完了

---

## ⚠️ リスク管理

### 各Step完了時の必須確認
1. ✅ `npm run test:unit -- --run`
2. ✅ `npm run build`
3. ✅ `npm run typecheck` (型エラー増加なし)
4. ✅ Git commit

### ロールバック手順
```bash
# 問題発生時
git tag -l 'phase3-step*'
git reset --hard phase3-step{N}-complete
```

### 中断基準
- テスト失敗(1つでも)
- ビルドエラー
- 型エラー10個以上増加
- 動作異常検知

---

## 📊 進捗メトリクス

| 項目 | 開始時 | 現在 | 目標 |
|------|--------|------|------|
| src/直下ファイル数 | 22個 | 11個 | ≤10個 |
| progressStorage行数 | 3551行 | 3551行 | ≤800行/ファイル |
| テスト数 | 81 | 81 | ≥100 |
| 型エラー数 | ~30 | ~30 | 増加なし |

---

## 🔗 関連リソース

- [PHASE_3_IMPLEMENTATION_PLAN.md](./PHASE_3_IMPLEMENTATION_PLAN.md) - 段階的実施計画
- [PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md) - Phase 1完了レポート
- [PHASE_2_COMPLETION_REPORT.md](./PHASE_2_COMPLETION_REPORT.md) - Phase 2完了レポート
- [REFACTORING_MASTER_PLAN.md](./REFACTORING_MASTER_PLAN.md) - リファクタリング全体計画
- [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md) - 進捗サマリー

---

## 📝 更新履歴

| 日付 | 変更内容 |
|------|--------|
| 2025-12-12 | Step 1完了 - 11ファイル削除、インポートパス修正 |
| 2025-12-12 | Phase 3タスクリスト作成 |
