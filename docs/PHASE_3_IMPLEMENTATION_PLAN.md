# Phase 3: 構造最適化 段階的実施計画

**プロジェクト**: nanashi8.github.io リファクタリング  
**フェーズ**: Phase 3 - 構造最適化  
**アプローチ**: 段階的・安全第一  
**作成日**: 2025年12月12日

---

## 🎯 Phase 3 の目標

### 主な課題
1. **再エクスポートファイルの整理** - 後方互換性用の一時ファイル(9個)が残存
2. **大規模ファイルの分割** - progressStorage.ts(3551行)が管理困難
3. **フォルダ構造の最適化** - src/直下にファイルが散在

### リスク評価
- **高リスク**: 大規模ファイル分割、インポートパス一括変更
- **中リスク**: ファイル移動、リネーム
- **低リスク**: 未使用ファイル削除、ドキュメント整理

---

## 📋 段階的実施計画

### Step 1: 未使用再エクスポートファイルの削除 (低リスク)

**対象ファイル**: 9個
```
src/aiCommentGenerator.ts
src/aiCommentHelpers.ts
src/confusionPairs.ts
src/forgettingAlert.ts
src/goalSimulator.ts
src/learningAssistant.ts
src/progressStorage.ts
src/retentionRateImproved.ts
src/speechSynthesis.ts
src/teacherInteractions.ts
src/timeBasedGreeting.ts
```

**実施内容**:
1. 各ファイルの使用状況を確認(grep検索)
2. 未使用確認後、削除
3. テスト実行で影響確認
4. ビルド確認

**期待される成果**:
- src/直下のファイル数削減
- インポートパスの明確化
- メンテナンス性向上

**所要時間**: 0.5日

---

### Step 2: ドキュメント整理とテスト追加 (低リスク)

**対象**:
- Phase 3タスクリスト作成
- 既存テストの実行確認
- 構造変更前のベースライン確立

**実施内容**:
1. `docs/PHASE_3_TASKS.md` 作成
2. 全テスト実行(81テスト)
3. ビルド成功確認
4. チェックポイント作成

**期待される成果**:
- Phase 3の明確な記録
- 変更前の状態保存
- ロールバック準備

**所要時間**: 0.5日

---

### Step 3: progressStorage.ts 分析と分割計画 (中リスク)

**対象**: src/storage/progress/progressStorage.ts (3551行)

**実施内容**:
1. 関数の責務を分析
2. 分割案の作成
   - `progressStorage/core.ts` - 基本CRUD
   - `progressStorage/statistics.ts` - 統計計算
   - `progressStorage/retention.ts` - 定着率
   - `progressStorage/migration.ts` - データ移行
3. 依存関係マップ作成
4. テスト戦略立案

**期待される成果**:
- 詳細な分割設計書
- リスク評価
- テスト計画

**所要時間**: 1日 (実装なし、計画のみ)

---

### Step 4: progressStorage.ts 段階的分割 (高リスク)

**実施内容**:
1. **Step 4-1**: core機能の抽出
   - 基本的な読み書き関数のみ
   - テスト作成・実行
   - ビルド確認
   
2. **Step 4-2**: statistics機能の抽出
   - 統計計算関数の移動
   - テスト作成・実行
   - ビルド確認

3. **Step 4-3**: retention機能の抽出
   - 定着率関連関数の移動
   - テスト作成・実行
   - ビルド確認

4. **Step 4-4**: 統合とクリーンアップ
   - インポートパス整理
   - 元のファイルをindex.tsに変更
   - 全テスト実行

**期待される成果**:
- 管理しやすいモジュール構造
- 各モジュール500-800行程度
- テストカバレッジ向上

**所要時間**: 2-3日

---

### Step 5: src/直下ファイルの整理 (中リスク)

**対象ファイル**:
```
src/utils.ts (大きい可能性)
src/types.ts
src/englishTrivia.ts (移動済みの再確認)
```

**実施内容**:
1. utils.tsのサイズ確認と分割検討
2. types.tsの整理(src/types/へ統合)
3. 残存ファイルの適切な配置

**期待される成果**:
- src/直下にはApp.tsx, main.tsx, index.cssなど最小限のみ
- 機能別フォルダへの適切な配置

**所要時間**: 1日

---

### Step 6: 最終検証とドキュメント更新 (低リスク)

**実施内容**:
1. 全テスト実行(目標: 100%合格)
2. ビルドサイズ確認
3. インポートパスの一貫性確認
4. Phase 3完了レポート作成
5. README更新

**期待される成果**:
- Phase 3完了の明確な記録
- 次フェーズへの引継ぎ資料

**所要時間**: 0.5日

---

## 📊 全体スケジュール

| Step | 内容 | リスク | 期間 | 累計 |
|------|------|--------|------|------|
| Step 1 | 再エクスポートファイル削除 | 低 | 0.5日 | 0.5日 |
| Step 2 | ドキュメント整備 | 低 | 0.5日 | 1日 |
| Step 3 | 分割計画作成 | 中 | 1日 | 2日 |
| Step 4 | progressStorage分割 | 高 | 2-3日 | 4-5日 |
| Step 5 | src/整理 | 中 | 1日 | 5-6日 |
| Step 6 | 最終検証 | 低 | 0.5日 | 5.5-6.5日 |

**合計所要時間**: 5.5-6.5日

---

## ⚠️ リスク管理

### 各Stepでの必須確認事項
1. ✅ テスト実行: `npm run test:unit -- --run`
2. ✅ ビルド確認: `npm run build`
3. ✅ 型チェック: `npm run typecheck`
4. ✅ Git commit: 各Step完了時

### ロールバック戦略
```bash
# 各Step開始前
git tag phase3-step{N}-start
git commit -m "checkpoint: Phase 3 Step {N} start"

# 問題発生時
git reset --hard phase3-step{N}-start
```

### 中断基準
以下の場合、直ちに作業を中断:
- テストが1つでも失敗
- ビルドエラー発生
- 型エラーが10個以上増加
- 動作確認で異常を検知

---

## 🎯 成功基準

### 必須条件
- [x] 全テスト合格(81テスト以上)
- [ ] ビルド成功
- [ ] src/直下のファイル数が10個以下
- [ ] progressStorage.ts が4ファイル以内に分割
- [ ] 型エラー数が増加していない

### 推奨条件
- [ ] テスト追加(目標: 100テスト)
- [ ] ファイルサイズが平均500行以下
- [ ] インポートパスが@/エイリアス統一
- [ ] ドキュメント完備

---

## 📝 次のアクション

### 即座に実施可能: Step 1
1. 再エクスポートファイルの使用確認
2. 未使用ファイルの削除
3. テスト・ビルド確認

**開始条件**: Phase 2完了(✅ 完了済み)  
**所要時間**: 0.5日  
**リスク**: 低

---

## 📚 参考資料

- [PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md)
- [PHASE_2_COMPLETION_REPORT.md](./PHASE_2_COMPLETION_REPORT.md)
- [REFACTORING_MASTER_PLAN.md](./REFACTORING_MASTER_PLAN.md)
- [REFACTORING_SAFETY.md](./REFACTORING_SAFETY.md)

---

**作成日**: 2025年12月12日  
**更新予定**: 各Step完了時
