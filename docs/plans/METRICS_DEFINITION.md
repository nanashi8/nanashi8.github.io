# AI学習システム評価メトリクス定義

## 📊 オフライン評価指標

### 1. MemoryAI（記憶AI）

#### 1.1 忘却リスク予測精度

**Expected Calibration Error (ECE)**
```
目標: < 0.10（業界標準）
計算方法:
  1. 予測確率を10個のビン（0-10%, 10-20%, ..., 90-100%）に分割
  2. 各ビンで実際の正答率を計算
  3. ECE = Σ (|ビンの予測確率 - 実際の正答率| × ビンのサンプル数) / 総サンプル数

測定頻度: 週次
データソース: PredictionLogger
実装: src/ai/evaluation/calibrationMetrics.ts
```

**Mean Absolute Error (MAE)**
```
目標: < 15%
計算方法: MAE = Σ |予測保持率 - 実際の正答率| / N
測定頻度: 日次
データソース: PredictionLogger
```

**Mean Squared Error (MSE)**
```
目標: < 0.03
計算方法: MSE = Σ (予測保持率 - 実際の正答率)² / N
測定頻度: 日次
```

#### 1.2 半減期推定の安定性

**Half-Life Variance**
```
目標: < 2.0日
計算方法: 
  - 各単語の半減期の7日間の標準偏差
  - 安定した学習者ほど分散が小さい
測定頻度: 週次
```

---

### 2. ErrorPredictionAI（誤答予測AI）

#### 2.1 分類精度

**AUC-ROC (Area Under ROC Curve)**
```
目標: > 0.75
計算方法: 
  - 予測誤答確率 vs 実際の誤答
  - ROC曲線下の面積を計算
測定頻度: 週次
データソース: 誤答ログ
実装: src/ai/evaluation/errorPredictionMetrics.ts
```

**Brier Score**
```
目標: < 0.20
計算方法: BS = Σ (予測確率 - 実際の結果)² / N
測定頻度: 日次
```

**Precision & Recall**
```
目標: Precision > 0.70, Recall > 0.65
計算方法: 
  - Precision = TP / (TP + FP)
  - Recall = TP / (TP + FN)
  - 閾値: 誤答確率 > 0.5を「誤答予測」とする
測定頻度: 日次
```

---

### 3. CognitiveLoadAI（認知負荷AI）

#### 3.1 疲労検出精度

**F1-Score**
```
目標: > 0.80
計算方法: F1 = 2 × (Precision × Recall) / (Precision + Recall)
正例: ユーザーが「疲れた」と報告、または離脱
測定頻度: 週次
実装: src/ai/evaluation/cognitiveLoadMetrics.ts
```

**False Positive Rate**
```
目標: < 0.20
計算方法: FPR = FP / (FP + TN)
意味: 疲れていないのに疲労と誤判定する割合
測定頻度: 週次
```

#### 3.2 最適状態検出

**Optimal State Precision**
```
目標: > 0.75
計算方法: 
  - 最適状態と判定した時の実際のパフォーマンス
  - エラー率20-35%, 連続正解3-7回を「最適」とする
測定頻度: 週次
```

---

## 📈 データ品質メトリクス（新規追加）

### 4. ストレージ整合性

#### 4.1 データ完全性

**Missing Field Rate**
```
目標: 0%
計算方法: (必須フィールド欠損レコード数 / 総レコード数) × 100
測定頻度: 起動時＋週次
実装: src/storage/progress/validator.ts
重要度: Critical（データ損失防止）
```

**Invalid Value Rate**
```
目標: < 1%
計算方法: (範囲外・型不正レコード数 / 総レコード数) × 100
例: memoryStrength < 0, correctCount < 0, 未来のlastReview等
測定頻度: 起動時＋週次
自動修正: 有効（範囲内にクリップ）
```

**Duplicate Key Rate**
```
目標: 0%
計算方法: (重複キー数 / 総キー数) × 100
測定頻度: 起動時＋週次
自動修正: 有効（最新データ優先）
```

#### 4.2 スキーマバージョン管理

**Migration Success Rate**
```
目標: 100%
計算方法: (成功マイグレーション数 / 試行数) × 100
測定頻度: バージョン更新時
実装: src/storage/progress/migrations.ts
エラーハンドリング: ロールバック＋エラーログ
```

**Schema Consistency**
```
目標: 100%
計算方法: (正しいschemaVersionを持つレコード数 / 総レコード数) × 100
測定頻度: 起動時
自動修正: 自動マイグレーション実行
```

#### 4.3 ストレージ使用率

**LocalStorage Usage**
```
警告閾値: 80%
危険閾値: 95%
計算方法: (使用容量 / ブラウザ上限) × 100
測定頻度: 各保存操作時
アクション:
  - 80%超: 警告表示、古いログ削除提案
  - 95%超: 緊急クリーンアップ、重要データのみ保持
実装: src/utils/storageMonitor.ts
```

---

## 🧪 実験品質メトリクス（新規追加）

### 5. AB実験の信頼性

#### 5.1 サンプルサイズ

**Minimum Detectable Effect (MDE)**
```
目標: 3pt（正答率差）
計算方法: 検出力分析（統計的検出力 = 0.80, α = 0.05）
必要サンプル: 各群 N ≈ 385（正答率70%→73%を検出）
測定頻度: 実験開始前＋中間レビュー
実装: src/utils/experimentAnalysis.ts
```

**Sample Ratio Mismatch (SRM)**
```
目標: p-value > 0.01（50:50分割想定）
計算方法: カイ二乗検定で実際の割当比率を検証
測定頻度: 実験開始後1週間、終了時
異常時対応: 割当ロジックの再検証
```

#### 5.2 統計的妥当性

**Multiple Testing Correction**
```
方法: Bonferroni補正
調整後有意水準: α / テスト数
例: 3つのKPIをテスト → α = 0.05 / 3 = 0.0167
実装: src/utils/statisticalTests.ts
```

**Effect Size (Cohen's d)**
```
解釈基準:
  - Small: d = 0.2
  - Medium: d = 0.5
  - Large: d = 0.8
計算方法: d = (平均treatment - 平均control) / プール標準偏差
測定頻度: 実験終了時
```

#### 5.3 Kill Switch監視

**Real-time Degradation Detection**
```
監視頻度: 1時間ごと
閾値:
  - 正答率: 基準値 -10pt
  - エラー率: 5%超
  - 重複率: 20%超
  - 応答時間: 基準値 ×2倍
アクション: 自動停止＋アラート
実装: src/config/killSwitch.ts
```

---

### 6. LinguisticAI（言語AI）

#### 6.1 音韻難易度の妥当性

**Phonetic Difficulty Correlation**
```
目標: 相関係数 > 0.60
計算方法: 
  - 音韻難易度スコア vs 実際の初回正答率
  - ピアソン相関係数を計算
測定頻度: 月次
データソース: 音韻困難語の学習履歴
```

#### 4.2 形態透明性の効果

**Morphological Transparency Gain**
```
目標: 学習時間 -15%
計算方法: 
  - 透明性高い語（接辞が既習）vs 低い語の平均学習時間
測定頻度: 月次
```

---

## 🎯 オンライン評価指標（A/B）

### 5. ユーザー学習成果

#### 5.1 定着率

**7日定着率**
```
目標: +15%（ベースライン比）
計算方法: 
  - 学習後7日時点での保持率（テスト正答率）
測定方法: A/Bテスト（実験群 vs 対照群）
測定期間: 4週間
サンプルサイズ: 各群200ユーザー以上
```

**30日定着率**
```
目標: +20%（ベースライン比）
計算方法: 学習後30日時点での保持率
測定期間: 8週間
```

#### 5.2 再誤答率

**Re-Error Rate**
```
目標: -25%（ベースライン比）
計算方法: 
  - 既習語（過去に正解した語）の再誤答発生率
測定頻度: 週次
```

---

### 6. ユーザーエンゲージメント

#### 6.1 セッション継続

**Average Session Duration**
```
目標: +10%（ベースライン比）
計算方法: 1セッションあたりの平均時間（分）
測定頻度: 日次
```

**Session Completion Rate**
```
目標: +15%
計算方法: 目標問題数を完了したセッションの割合
測定頻度: 日次
```

#### 6.2 継続率

**30日継続率**
```
目標: -15%離脱率（= +15%継続率）
計算方法: 登録後30日時点でアクティブなユーザーの割合
測定頻度: 月次
```

**Weekly Active Users (WAU)**
```
目標: +20%
計算方法: 直近7日間でアクティブなユーザー数
測定頻度: 週次
```

---

### 7. ユーザー満足度（主観評価）

#### 7.1 満足度調査

**Net Promoter Score (NPS)**
```
目標: > 50
質問: 「このアプリを友人に勧める可能性は？」（0-10）
計算方法: NPS = (%推奨者 - %批判者)
測定頻度: 月次
サンプル: 100ユーザー以上
```

**Satisfaction Rating**
```
目標: > 4.2 / 5.0
質問: 「復習タイミングは適切ですか？」（1-5）
測定頻度: 週次
```

#### 7.2 認知負荷（主観）

**Perceived Difficulty**
```
目標: 平均3.0±0.5（5段階中）
質問: 「今日の学習は難しかったですか？」（1:簡単 - 5:難しい）
測定頻度: セッション終了時
```

---

## 📈 ダッシュボード実装

### 8.1 リアルタイム監視

**実装ファイル**: `src/admin/MetricsDashboard.tsx`（将来実装）

**表示項目**:
- [ ] 日次MAE/ECEトレンド
- [ ] 誤答予測AUC推移
- [ ] 疲労検出F1-score
- [ ] A/Bテスト進捗（定着率・離脱率）
- [ ] アラート（閾値超過時）

### 8.2 週次レポート

**自動生成**: 毎週月曜日

**内容**:
- すべてのオフライン指標
- A/Bテスト中間結果
- ユーザーフィードバックサマリー
- 改善推奨事項

---

## 🔬 A/Bテスト設計

### 9. 実験プロトコル

#### 9.1 Phase 1（P0施策）

**実験名**: `memory-calibration-v1`

**仮説**: 
- MemoryAI校正により定着率が向上する
- 優先度説明により満足度が向上する

**実験群（Treatment）**:
- MemoryAI校正ON
- 保持率ダッシュボード表示
- 優先度説明機能ON

**対照群（Control）**:
- 既存システム（校正なし）

**配分**: 50% / 50%

**期間**: 4週間

**主要指標**:
- 7日定着率（primary）
- 30日定着率（secondary）
- NPS（secondary）

**サンプルサイズ計算**:
```
目標検出力: 80%
有意水準: 5%
最小検出差: 15%（定着率）
必要サンプル: 各群200ユーザー
```

**成功基準**:
- 7日定着率 +15%以上（p < 0.05）
- NPS +10ポイント以上

---

## 📊 測定ツール実装

### 10.1 メトリクス収集

**ファイル**: `src/analytics/metricsCollector.ts`（新規作成）

```typescript
interface MetricEvent {
  type: 'prediction' | 'error' | 'session' | 'satisfaction';
  timestamp: number;
  userId: string;
  data: any;
}

export class MetricsCollector {
  static track(event: MetricEvent): void {
    // イベントをlocalStorageに記録
    // 定期的にサーバーに送信（将来実装）
  }
  
  static calculateDailyMetrics(): DailyMetrics {
    // 日次メトリクスを計算
  }
}
```

### 10.2 A/Bテストインフラ

**ファイル**: `src/analytics/abTesting.ts`（新規作成）

```typescript
export class ABTesting {
  static assignVariant(userId: string, experimentId: string): 'control' | 'treatment' {
    // ユーザーを実験群/対照群に割り当て
    // ハッシュベースで一貫性を保証
  }
  
  static trackExperiment(experimentId: string, variant: string, metric: string, value: number): void {
    // 実験データを記録
  }
  
  static analyzeResults(experimentId: string): ExperimentResults {
    // 統計的有意性を検定（t検定、カイ二乗検定）
  }
}
```

---

## 🎯 メトリクス達成ロードマップ

### Week 1-2: 基盤構築
- [ ] メトリクス収集インフラ実装
- [ ] A/Bテスト基盤実装
- [ ] 監視ダッシュボード雛形

### Week 3-4: Phase 1実験開始
- [ ] `memory-calibration-v1`実験開始
- [ ] 日次モニタリング
- [ ] 中間レポート作成

### Week 5-8: 実験完了・分析
- [ ] 実験終了・データ集計
- [ ] 統計分析（有意性検定）
- [ ] 最終レポート作成
- [ ] 改善施策の決定

---

## 📝 データプライバシー

### 11. コンプライアンス

**収集データの匿名化**:
- ユーザーIDはハッシュ化
- 個人識別情報は収集しない
- localStorageのみ使用（サーバー送信は将来実装）

**ユーザー同意**:
- 初回起動時に利用規約で同意取得
- オプトアウト機能の提供

**データ保持期間**:
- 個別ログ: 30日
- 集計データ: 1年

---

**更新履歴**
- 2025-12-20: 初版策定
