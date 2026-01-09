# バッチ数設定システム TDD実装計画

## 📋 概要

暗記タブのバッチ数設定とカテゴリー別配分システムをテスト駆動開発で実装する計画です。

### 主要機能
1. **バッチ数設定**: 設定なし、10、20、30、50、75、100、150、200、300、500
2. **カテゴリー別配分**:
   - 分からない: 20%
   - まだまだ: 20%
   - 覚えてる: 10%
   - 未出題: 50%
3. **動的上限システム**:
   - 分からない・まだまだの上限: 10-50%（設定可能）
   - 上限到達時: 40%に増加、未出題30%に抑制
4. **連続出題防止**: 分からない語が連続する場合、間隔を徐々に拡大
5. **振動防止**: 回答時に次の出題位置が確定、同じ語が振動しない

---

## 🏗️ Phase 1: UI設定追加（ScoreBoard） ✅

### 実装内容
- ✅ バッチ数選択ドロップダウン追加
- ✅ 上限比率選択ドロップダウン追加（10-50%）
- ✅ LocalStorage連携
- ✅ state管理（batchSize, reviewRatioLimit）

### ファイル
- [x] `src/components/ScoreBoard.tsx`

### テスト項目
- [x] UI表示確認
- [ ] LocalStorage保存確認
- [ ] デフォルト値確認（設定なし、20%）

---

## 🎯 Phase 2: スロット配分ロジック更新（SlotConfigManager） ✅

### 実装内容
- ✅ DEFAULT_SLOT_CONFIGSを新配分に更新
  - memorization: { new: 50%, incorrect: 20%, still_learning: 20%, mastered: 10% }

### ファイル
- [x] `src/ai/scheduler/SlotConfigManager.ts`

### テスト項目
- [ ] 単体テスト: getSlotConfig('memorization')の返り値確認
- [ ] 比率の合計が1.0になることを確認

---

## 🔄 Phase 3: 動的上限システム実装（SlotAllocator） ✅

### 実装内容
- ✅ DynamicSlotConfig型定義追加（types.ts）
- ✅ applyDynamicLimits()メソッド実装
  - LocalStorageからreviewRatioLimit取得
  - 現在の分からない・まだまだ語数をカウント
  - 上限到達判定
  - 上限到達時に配分変更（incorrect:20%, still_learning:20%, new:30%）

### ファイル
- [x] `src/ai/scheduler/types.ts`
- [x] `src/ai/scheduler/SlotAllocator.ts`

### テスト項目
- [ ] 単体テスト: applyDynamicLimits()の動作確認
  - 上限未到達時: baseConfigを返す
  - 上限到達時: adjustedConfigを返す
- [ ] 統合テスト: allocateSlots()でmode='memorization'の場合に動的上限が適用される

---

## 🔗 Phase 4: MemorizationView統合準備 🔄

### 実装内容（予定）
1. バッチ数設定をLocalStorageから取得
2. BatchManagerの初期化にバッチ数を渡す
3. QuestionSchedulerのパラメータ調整
4. 廃止されたstillLearningLimit/incorrectLimitの参照を削除

### ファイル
- [ ] `src/components/MemorizationView.tsx`

### 変更箇所
```typescript
// 1. state追加
const [batchSize, setBatchSize] = useState<number | null>(() => {
  const saved = localStorage.getItem('memorization-batch-size');
  return saved ? parseInt(saved) : null;
});

// 2. BatchManager初期化
useEffect(() => {
  if (batchSize && BatchManager.isEnabled()) {
    BatchManager.initialize(allQuestions, {
      batchSize,
      mode: 'memorization',
    });
  }
}, [batchSize, allQuestions]);

// 3. QuestionScheduler呼び出し時にbatchSizeを渡す
const scheduleResult = await scheduler.schedule({
  questions: candidateQuestions,
  mode: 'memorization',
  useCategorySlots,
  batchSize: batchSize || undefined, // 設定なしの場合は全語出題
  // 廃止: limits: { learningLimit, reviewLimit }
});
```

### テスト項目
- [ ] バッチ数設定なしの場合: 全語出題
- [ ] バッチ数設定ありの場合: 指定数のみ出題
- [ ] 動的上限が正しく適用される

---

## 📊 Phase 5: バッチ数設定の統合

### 実装内容（予定）
1. QuestionSchedulerにbatchSizeパラメータ追加
2. scheduleCategorySlots()でtotalSlotsとしてbatchSizeを使用
3. バッチ数が設定されている場合、questions配列をバッチサイズに制限

### ファイル
- [ ] `src/ai/scheduler/QuestionScheduler.ts`
- [ ] `src/ai/scheduler/types.ts` (ScheduleParamsにbatchSize追加)

### テスト項目
- [ ] バッチ数100の場合、100語のみスケジューリング
- [ ] バッチ数設定なしの場合、全語スケジューリング

---

## ✅ Phase 6: 動的上限の動作確認

### テスト項目
1. **初期状態（上限未到達）**
   - 分からない: 20%
   - まだまだ: 20%
   - 覚えてる: 10%
   - 未出題: 50%

2. **上限到達時（reviewRatioLimit=20%、分からない+まだまだが20語以上）**
   - 分からない: 20%
   - まだまだ: 20%
   - 覚えてる: 10%
   - 未出題: 30%（抑制）

3. **上限設定変更**
   - 10%, 20%, 30%, 40%, 50%それぞれでテスト

### 確認方法
- [ ] デバッグパネルでカテゴリー別配分を表示
- [ ] LocalStorageから設定を確認
- [ ] SlotAllocatorのログ出力を確認

---

## 🚫 Phase 7: 連続出題防止の強化確認

### 既存実装確認
useQuestionRequeue.tsに既に実装済み:
- ✅ minGapForMode: memorizationモードで連続不正解に応じて間隔拡大（10〜60問）
- ✅ consecutiveIncorrect（SSOT）に基づく動的調整
- ✅ 既に近くに存在する場合の移動ロジック

### テスト項目
- [ ] 同じ語が2回連続で出題されないことを確認
- [ ] 連続不正解が増えると間隔が広がることを確認
- [ ] minGap=10（1回不正解） → minGap=11（2回） → minGap=12（3回）...

### 確認方法
- [ ] RequeuingDebugPanelで再出題イベントを監視
- [ ] LocalStorage debug_requeue_eventsを確認
- [ ] 実際に暗記タブで連続不正解をテスト

---

## 🔄 Phase 8: 振動防止の動作確認

### 既存実装確認
- ✅ useQuestionRequeue: 重複挿入防止
- ✅ AntiVibrationFilter: 1分以内の正解語を除外
- ✅ isTooSoonForMinGap: minGap範囲内の場合は必ず移動

### テスト項目
- [ ] 同じ語が「分からない→数問後→分からない→数問後」と振動しない
- [ ] 回答時に次の出題位置が確定し、変更されない
- [ ] Position不整合時の再スケジューリングが発動する

### 確認方法
- [ ] デバッグレポート機能で振動パターンを検出
- [ ] 連続30問の出題履歴を記録
- [ ] 同一語の出題間隔を計測

---

## 🧪 Phase 9: E2Eテスト（手動確認）

### シナリオ1: バッチ数100で学習
1. 設定なし → バッチ数100に変更
2. クイズ開始
3. 100語出題されることを確認
4. カテゴリー別配分を確認
   - 未出題: 50語
   - 分からない: 20語
   - まだまだ: 20語
   - 覚えてる: 10語

### シナリオ2: 動的上限の発動
1. バッチ数100、上限20%に設定
2. 分からない・まだまだが合計20語に達するまで学習
3. 上限到達後、配分が変化することを確認
   - 分からない+まだまだ: 40語
   - 未出題: 30語

### シナリオ3: 連続出題防止
1. 同じ語を連続で不正解
2. 出題間隔が徐々に広がることを確認
3. 10問後 → 13問後 → 16問後...

### シナリオ4: 振動防止
1. 特定の2語を不正解
2. 同じ語が振動せず、一度出題位置が決まったら変わらないことを確認

---

## 📊 Phase 10: デバッグパネル追加

### 実装内容（予定）
1. バッチ設定表示
   - 現在のバッチ数
   - 上限比率
   - カテゴリー別配分
2. リアルタイム統計
   - 各カテゴリーの語数
   - 上限到達状態
   - 配分比率
3. 再出題履歴
   - 最近の再出題イベント
   - 出題間隔
   - minGap値

### ファイル
- [ ] `src/components/BatchSystemDebugPanel.tsx` (新規作成)
- [ ] `src/components/MemorizationView.tsx` (パネル統合)

---

## 🚀 Phase 11: 本番デプロイ準備

### チェックリスト
- [ ] 全テストパス
- [ ] ESLint/TypeScriptエラーなし
- [ ] パフォーマンス確認（100語スケジューリング < 100ms）
- [ ] LocalStorage容量確認
- [ ] デバッグログの本番無効化確認
- [ ] READMEドキュメント更新
- [ ] CHANGELOG更新

---

## 📝 実装ステータス

### 完了 ✅
- [x] Phase 1: UI設定追加
- [x] Phase 2: スロット配分ロジック更新
- [x] Phase 3: 動的上限システム実装

### 進行中 🔄
- [~] Phase 4: MemorizationView統合準備

### 未着手 ⏳
- [ ] Phase 5: バッチ数設定の統合
- [ ] Phase 6: 動的上限の動作確認
- [ ] Phase 7: 連続出題防止の強化確認
- [ ] Phase 8: 振動防止の動作確認
- [ ] Phase 9: E2Eテスト
- [ ] Phase 10: デバッグパネル追加
- [ ] Phase 11: 本番デプロイ準備

---

## 🎯 次のアクション

### Phase 4の実装
1. MemorizationView.tsxのstate更新
2. 廃止されたstillLearningLimit/incorrectLimit参照の削除
3. バッチ数設定の統合
4. 初期テスト実行

### 推定工数
- Phase 4-5: 2時間
- Phase 6-8: 3時間
- Phase 9: 2時間
- Phase 10-11: 1時間
- **合計: 8時間**

---

## 🐛 既知の課題

1. **MemorizationViewの複雑性**
   - 3000行超のファイル
   - 多数の依存関係
   - リファクタリングが必要

2. **テストカバレッジ不足**
   - 単体テストが未整備
   - E2Eテストが手動のみ

3. **パフォーマンス懸念**
   - LocalStorage頻繁アクセス
   - 大量問題（500語）のスケジューリング

---

## 📖 参考資料

- [ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md](../../ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md)
- [QuestionScheduler API](../../src/ai/scheduler/QuestionScheduler.ts)
- [useQuestionRequeue Hook](../../src/hooks/useQuestionRequeue.ts)
- [BatchManager](../../src/ai/scheduler/BatchManager.ts)
