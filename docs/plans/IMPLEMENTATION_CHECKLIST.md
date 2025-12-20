# AI改善計画 実装チェックリスト

## 📋 Phase 1（P0）- 即効改善

### ✅ MemoryAI校正システム

#### 確率校正の実装
- [ ] `src/ai/models/ForgettingCurveModel.ts`に`calibrateForgettingRisk()`追加
- [ ] `learnCalibrationParams()`実装（最小二乗法）
- [ ] `CalibrationParams`型定義追加
- [ ] localStorageに校正パラメータ保存
- [ ] 週次更新ロジック実装
- [ ] ユニットテスト作成

#### 評価メトリクス計算
- [ ] `src/ai/evaluation/calibrationMetrics.ts`新規作成
- [ ] `calculateECE()`実装
- [ ] `calculateMAE()`実装
- [ ] `calculateMSE()`実装
- [ ] `generateCalibrationCurve()`実装
- [ ] テストケース作成

#### 保持率ダッシュボード
- [ ] `src/components/MemoryRetentionPanel.tsx`新規作成
- [ ] `RetentionCurveChart`サブコンポーネント実装
- [ ] Chart.jsインストール: `npm install chart.js react-chartjs-2`
- [ ] CSS/Tailwindスタイリング
- [ ] `ScoreBoard.tsx`に統合
- [ ] レスポンシブ対応
- [ ] アクセシビリティ対応（ARIA属性）

#### データ収集基盤
- [ ] `src/storage/progress/predictionLogger.ts`新規作成
- [ ] `PredictionLogger`クラス実装
- [ ] `updateWordProgress()`でログ記録呼び出し追加
- [ ] 週次クリーンアップタスク実装
- [ ] 統計計算の自動化
- [ ] ストレージ容量管理（最大1000件）

---

### ✅ QuestionScheduler説明可能性

#### 優先度分解データ構造
- [ ] `src/ai/scheduler/types.ts`に`PriorityBreakdown`型追加
- [ ] `PrioritizedQuestion`に`priorityBreakdown`フィールド追加
- [ ] TypeScriptコンパイル確認

#### 分解値の計算と記録
- [ ] `QuestionScheduler.calculatePriorities()`を拡張
- [ ] `PriorityBreakdown`計算ロジック実装
- [ ] `generateExplanation()`実装
- [ ] `applyAntiVibration()`でbreakdown更新
- [ ] デバッグログ出力追加
- [ ] 各種パターンでのテスト

#### UI表示
- [ ] `src/components/PriorityExplainerModal.tsx`新規作成
- [ ] `PriorityBarChart`サブコンポーネント実装
- [ ] 開発モード判定ロジック（`process.env.NODE_ENV`）
- [ ] `MemorizationView.tsx`に「?」ボタン追加
- [ ] モーダルアニメーション実装
- [ ] CSS/スタイリング
- [ ] モバイル対応

#### 監査ログ
- [ ] `src/ai/scheduler/auditLogger.ts`新規作成
- [ ] `SchedulerAuditLogger`クラス実装
- [ ] `QuestionScheduler.schedule()`でログ記録
- [ ] 自動クリーンアップ実装（7日保持）
- [ ] JSONエクスポート機能
- [ ] テスト: ログの保存・取得・削除

---

### ✅ 検証タスク

#### MemoryAI校正の検証
- [ ] 合成データ生成スクリプト作成
- [ ] 校正前後のECE計算
- [ ] 目標達成確認（ECE < 0.10）
- [ ] 検証レポート作成

#### 優先度説明の妥当性検証
- [ ] ユーザビリティテスト計画作成
- [ ] 5人のテストユーザー募集
- [ ] テスト実施（理解度・納得度評価）
- [ ] フィードバック収集
- [ ] 改善実施
- [ ] 検証レポート作成

---

## 📋 Phase 2（P1）- 実運用強化

### 🔄 ErrorPredictionAI強化

#### 特徴量追加
- [ ] `confusionCount`特徴量追加
- [ ] `avgResponseSpeed`特徴量追加
- [ ] `forgettingRisk`特徴量統合
- [ ] `phoneticDistance`計算関数実装
- [ ] `editDistance`（レーベンシュタイン距離）実装
- [ ] 特徴量正規化処理

#### モデル実装
- [ ] ロジスティック回帰の実装
- [ ] 確率校正（Isotonic Regression）
- [ ] オフライン評価: AUC-ROC, Brier Score
- [ ] 評価レポート作成

#### 活用
- [ ] 誤答確率上位語の軽ヒント表示機能
- [ ] 難易度緩和ロジック（選択肢削減等）
- [ ] UI統合

---

### 💤 CognitiveLoadAI強化

#### 個人ベースライン
- [ ] ユーザー固有`normalErrorRate`計算
- [ ] ユーザー固有`normalResponseTime`計算
- [ ] 偏差値化ロジック実装
- [ ] 疲労/最適状態判定の改善

#### 日内リズム
- [ ] `timeOfDay`ごとの統計収集
- [ ] 最適負荷帯の学習アルゴリズム
- [ ] 朝型/夜型の自動判定

#### フロー状態検知
- [ ] 高精度・短時間連続正解の検出
- [ ] 「集中モード」判定ロジック
- [ ] 疲労判定の一時猶予実装

---

### 🔤 LinguisticAI強化

#### 音韻難易度
- [ ] L2音韻困難パターン定義（/r-l/, /θ-ð/等）
- [ ] IPA発音記号からの自動判定
- [ ] 音韻難易度ペナルティの統合

#### 形態透明性
- [ ] 語根/接辞の学習進捗保持
- [ ] 透明性スコア計算
- [ ] 難易度調整ロジック

---

## 📋 Phase 3（P2）- 高度統合

### 🌍 ContextualAI強化

#### 知識グラフ
- [ ] `relatedFields`からグラフ構築
- [ ] 単語間近接度の計算
- [ ] 近接語の束ね出題ロジック

#### 例文最適化
- [ ] 誤答語の文脈分析
- [ ] 文脈近接の例文検索
- [ ] 動的例文差し替え機能

---

### 🎮 GamificationAI強化

#### 動的報酬
- [ ] 認知負荷に基づく報酬調整
- [ ] 誤答確率に基づく報酬調整
- [ ] 報酬曲線の最適化

#### マイクロ目標
- [ ] 目標自動生成アルゴリズム
- [ ] UI表示機能
- [ ] 達成度追跡

#### ストリーク保険
- [ ] 疲労検出時の保護ロジック
- [ ] ユーザー通知機能

---

### 🎯 QuestionSchedulerメタ学習

#### シグナル重み最適化
- [ ] Thompson Samplingアルゴリズム実装
- [ ] シグナル重みの自動学習
- [ ] 週次最適化バッチジョブ

---

## 📋 Phase 4（P3）- 次世代研究

### 🔬 高度スケジューリング

#### DKT実装
- [ ] Deep Knowledge Tracingアルゴリズム研究
- [ ] TensorFlow.js統合検討
- [ ] プロトタイプ実装

#### FSRS統合
- [ ] FSRS（Free Spaced Repetition Scheduler）調査
- [ ] 統合実装
- [ ] A/B比較実験

#### Thompson Sampling
- [ ] 探索戦略の実装
- [ ] 多目的最適化

---

## 🔧 インフラ・ツール

### 分析基盤
- [ ] `src/analytics/metricsCollector.ts`実装
- [ ] `src/analytics/abTesting.ts`実装
- [ ] 監視ダッシュボード雛形作成

### テスト環境
- [ ] E2Eテスト環境構築
- [ ] パフォーマンステスト環境
- [ ] A/Bテストインフラ

### ドキュメント
- [ ] API仕様書作成
- [ ] 開発者ガイド更新
- [ ] ユーザーマニュアル更新

---

## 📊 マイルストーン

### Week 2（目標）
- [x] Phase 1計画完了
- [ ] MemoryAI校正システム完了
- [ ] QuestionScheduler説明可能性完了
- [ ] 検証完了

### Week 4（目標）
- [ ] ErrorPredictionAI強化 50%完了
- [ ] CognitiveLoadAI強化 50%完了

### Week 6（目標）
- [ ] Phase 2（P1）完了

### Week 10（目標）
- [ ] ContextualAI強化完了
- [ ] GamificationAI強化完了

### Week 12（目標）
- [ ] Phase 3（P2）完了

### Month 4+（目標）
- [ ] Phase 4（P3）研究開始

---

## 🎯 完了基準

### Phase 1完了
- [ ] すべてのP0タスク完了
- [ ] ECE < 0.10達成
- [ ] ユーザビリティテスト合格（理解度 > 80%）
- [ ] 監査ログが正常に動作
- [ ] 保持率ダッシュボード動作確認
- [ ] コードレビュー完了
- [ ] ドキュメント更新完了

### Phase 2完了
- [ ] すべてのP1タスク完了
- [ ] 誤答予測AUC > 0.75達成
- [ ] 疲労検出F1 > 0.80達成
- [ ] 音韻難易度統合完了
- [ ] A/Bテスト開始

### Phase 3完了
- [ ] すべてのP2タスク完了
- [ ] 知識グラフ構築完了
- [ ] 動的報酬システム動作確認
- [ ] メタ学習実装完了

### L4達成（最終目標）
- [ ] すべてのPhase完了
- [ ] 定着率+20%達成
- [ ] 離脱率-15%達成
- [ ] NPS > 50達成
- [ ] 監査ログ・A/B・継続学習が自動化
- [ ] バイアス検査・説明可能性・倫理審査パス

---

## 📝 次のアクション

1. ✅ チェックリストレビュー
2. ⬜ Phase 1タスクをGitHub Issueに変換
3. ⬜ 開発環境セットアップ
4. ⬜ Task 1.1（MemoryAI校正）から着手

---

**更新履歴**
- 2025-12-20: 初版作成
