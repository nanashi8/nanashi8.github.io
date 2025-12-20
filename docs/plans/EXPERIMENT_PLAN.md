# AB実験計画 (Experiment Plan)

## 目的
- 学習効果改善施策の客観的評価
- ユーザー体験への影響測定
- データドリブンな意思決定

## 最小構成の実験基盤

### 1. フィーチャーフラグ管理
**実装場所:** `src/config/featureFlags.ts`

```typescript
interface ExperimentConfig {
  id: string;
  variant: 'control' | 'treatment';
  startDate: string;
  endDate?: string;
  sampleRate: number; // 0.0 - 1.0
}

// ユーザーIDベースの安定したグループ割当
function assignVariant(userId: string, experimentId: string): 'control' | 'treatment' {
  const hash = simpleHash(`${userId}-${experimentId}`);
  return hash % 2 === 0 ? 'control' : 'treatment';
}
```

**特徴:**
- localStorage基盤でシンプル実装
- ユーザーIDごとに安定したグループ割当
- フェイルセーフ（エラー時はcontrolに）

### 2. 計測イベント
**必須KPI:**
- 正答率（accuracy）
- 再学習率（relearn_rate）
- 重複出題率（duplicate_rate）
- セッション時間（session_duration）
- 完了問題数（completed_questions）

**イベント構造:**
```json
{
  "event_type": "answer_submitted",
  "experiment_id": "forgetting-curve-v2",
  "variant": "treatment",
  "user_id": "hash-xxx",
  "timestamp": "2025-12-20T10:30:00Z",
  "data": {
    "word_id": "apple",
    "correct": true,
    "response_time_ms": 1200,
    "retention_predicted": 0.82,
    "priority_score": 42.5
  }
}
```

### 3. Phase 1の実験候補

#### 実験A: 校正済み忘却曲線
- **仮説:** 個別パラメータ校正により正答率+3-5pt改善
- **Treatment:** `ForgettingCurveModel`の校正有効化
- **Control:** デフォルトパラメータのまま
- **期間:** 4週間
- **サンプル:** 新規ユーザー50%
- **成功基準:**
  - 正答率+3pt以上
  - ECE 20%低減
  - ユーザー満足度維持（離脱率変化なし）

#### 実験B: 重複防止強化
- **仮説:** 30秒ハードブロックで重複率<1%達成、満足度向上
- **Treatment:** `AntiVibrationFilter`のStrategy 0有効化
- **Control:** 従来の緩いペナルティのみ
- **期間:** 2週間
- **サンプル:** 全ユーザー100%（安全性確認済み）
- **成功基準:**
  - 重複率<1%（直近5問以内）
  - セッション時間維持または増加
  - クレーム件数ゼロ

#### 実験C: 優先度説明UI
- **仮説:** 説明性向上でユーザーエンゲージメント+10%
- **Treatment:** Priority Explainerモーダル表示
- **Control:** 説明なし（現状）
- **期間:** 3週間
- **サンプル:** アクティブユーザー30%
- **成功基準:**
  - モーダル開封率>20%
  - セッション完了率+5pt
  - 定性フィードバック収集

### 4. 停止条件（Kill Switch）
実験を即座に停止すべき状況:
- 正答率が10pt以上低下
- エラー率が5%超過
- 重複率が20%超過
- ユーザークレーム3件/日以上
- パフォーマンス劣化（応答時間2倍以上）

**実装:**
```typescript
function checkKillSwitch(metrics: ExperimentMetrics): boolean {
  return (
    metrics.accuracy < baseline.accuracy - 0.10 ||
    metrics.errorRate > 0.05 ||
    metrics.duplicateRate > 0.20 ||
    metrics.responseTimeP95 > baseline.responseTimeP95 * 2
  );
}
```

### 5. 分析手順
1. **中間レビュー（1週間後）:**
   - KPI確認、異常検出
   - サンプルサイズ十分性確認
2. **最終分析（実験終了時）:**
   - 統計的有意性検定（t検定、カイ二乗検定）
   - 効果量計算（Cohen's d）
   - セグメント別分析（初級/中級/上級）
3. **意思決定:**
   - 有意＋効果量大 → 全ロールアウト
   - 有意＋効果量小 → コスト評価後判断
   - 非有意 → 廃棄または再設計

### 6. プライバシーとデータ保護
- ユーザーIDはハッシュ化（SHA-256）
- PII（個人識別情報）は一切収集しない
- データはブラウザlocalStorageのみ（サーバー送信なし）
- オプトアウト機能提供（設定画面）

### 7. 実装チェックリスト
- [ ] `featureFlags.ts`作成（グループ割当関数）
- [ ] `experimentLogger.ts`作成（イベント記録）
- [ ] 既存コンポーネントにフラグ分岐追加
- [ ] Kill Switch監視関数実装
- [ ] ダッシュボードに実験メトリクス表示
- [ ] ドキュメント更新（README、QUICKSTART）

## Phase 2以降の検討事項
- より高度な統計手法（ベイズAB、バンディット）
- サーバーサイド実験基盤への移行
- 多変量実験（MVT）
- 機械学習モデルのオンライン評価

---
**更新履歴:**
- 2025-12-20: 初版作成（最小構成に特化）
