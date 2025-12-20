# AI改善計画 クイックスタート

## 🎯 概要

このプロジェクトは、業界トップクラスの学習AIシステムから**次世代レベル（LACL L4）**へ引き上げるための改善計画です。

### 主要目標
- **定着率**: +20%（30日）
- **離脱率**: -15%
- **ユーザー満足度**: NPS > 50
- **技術レベル**: 全AIモジュールをL3-L4へ

---

## 📚 ドキュメント構成

```
docs/plans/
├── AI_IMPROVEMENT_ROADMAP.md      # 全体ロードマップ（戦略）
├── PHASE1_P0_TASKS.md             # Phase 1詳細タスク（戦術）
├── METRICS_DEFINITION.md          # 評価メトリクス定義（測定）
├── IMPLEMENTATION_CHECKLIST.md    # 実装チェックリスト（実行）
└── QUICKSTART.md                  # このファイル
```

---

## 🚀 今すぐ始める

### Step 1: 計画の確認（5分）

```bash
# ロードマップを確認
cat docs/plans/AI_IMPROVEMENT_ROADMAP.md

# Phase 1タスクを確認
cat docs/plans/PHASE1_P0_TASKS.md
```

**確認事項**:
- [ ] 各Phaseの目標を理解
- [ ] 優先度（P0/P1/P2/P3）を確認
- [ ] 自分の担当タスクを特定

---

### Step 2: 開発環境準備（10分）

```bash
# プロジェクトルートに移動
cd /path/to/nanashi8.github.io

# 依存関係インストール（まだの場合）
npm install

# 新規依存関係追加（Phase 1で必要）
npm install chart.js react-chartjs-2

# TypeScript型チェック
npm run type-check

# 開発サーバー起動
npm run dev
```

---

### Step 3: 最初のタスクに着手（Phase 1-1.1）

#### Task 1.1: MemoryAI校正システム

**作業ファイル**: `src/ai/models/ForgettingCurveModel.ts`

**実装内容**:
```typescript
// 1. 型定義追加
interface CalibrationParams {
  alpha: number;  // Sigmoid変換のスケール
  beta: number;   // Sigmoid変換のシフト
}

// 2. 校正メソッド追加
export class ForgettingCurveModel {
  /**
   * 忘却リスクを校正（Platt Scaling風）
   */
  static calibrateForgettingRisk(
    rawRisk: number,
    params: CalibrationParams
  ): number {
    // calibratedRisk = 1 / (1 + exp(alpha * rawRisk + beta))
    const logit = params.alpha * rawRisk + params.beta;
    return 1 / (1 + Math.exp(-logit));
  }

  /**
   * 実績データから校正パラメータを学習
   */
  static learnCalibrationParams(
    predictions: Array<{ predicted: number; actual: boolean }>
  ): CalibrationParams {
    // 最小二乗法で alpha, beta を推定
    // TODO: 実装
    return { alpha: 1.0, beta: 0.0 };
  }
}
```

**テスト**:
```bash
# ユニットテスト作成
touch src/ai/models/__tests__/ForgettingCurveModel.test.ts

# テスト実行
npm run test
```

---

### Step 4: 進捗管理（毎日）

#### チェックリスト更新

```bash
# 実装チェックリストを開く
code docs/plans/IMPLEMENTATION_CHECKLIST.md

# 完了したタスクにチェックマーク
# - [ ] → - [x]
```

#### Git運用

```bash
# feature ブランチ作成
git checkout -b feature/memory-ai-calibration

# 実装
# ...

# コミット（conventional commits形式）
git add .
git commit -m "feat(memory-ai): add calibration system"

# プッシュ
git push origin feature/memory-ai-calibration

# Pull Request作成
# GitHub UIでPR作成
```

---

## 📊 評価方法

### オフライン評価（毎週金曜日）

```bash
# メトリクス計算スクリプト実行（将来実装）
npm run metrics:calculate

# レポート生成
npm run metrics:report
```

**確認項目**:
- [ ] ECE < 0.10
- [ ] MAE < 15%
- [ ] AUC-ROC > 0.75
- [ ] F1-score > 0.80

### オンライン評価（A/Bテスト）

**実験開始**:
```bash
# A/Bテスト設定（将来実装）
npm run ab:start memory-calibration-v1

# 進捗確認
npm run ab:status
```

**モニタリング**:
- 日次: セッション継続率、エラー率
- 週次: 定着率、再誤答率
- 月次: 継続率、NPS

---

## 🎯 Phase 1完了基準

### 技術的完了（Week 2目標）

- [x] ロードマップ策定完了
- [ ] MemoryAI校正システム実装完了
- [ ] QuestionScheduler説明可能性実装完了
- [ ] 保持率ダッシュボード実装完了
- [ ] 監査ログ実装完了
- [ ] ユニットテスト全合格
- [ ] E2Eテスト全合格

### 品質基準

- [ ] ECE < 0.10達成
- [ ] ユーザビリティテスト合格（理解度 > 80%）
- [ ] コードレビュー承認
- [ ] ドキュメント更新完了

### デプロイ基準

- [ ] ステージング環境で動作確認
- [ ] パフォーマンステストパス
- [ ] セキュリティ監査パス
- [ ] 本番デプロイ完了

---

## 🆘 トラブルシューティング

### よくある問題

#### 1. TypeScriptエラー

```bash
# 型定義を再生成
npm run type-check

# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. テスト失敗

```bash
# キャッシュクリア
npm run test -- --clearCache

# 特定のテストファイルのみ実行
npm run test ForgettingCurveModel.test.ts
```

#### 3. ビルドエラー

```bash
# ビルドキャッシュクリア
npm run clean
npm run build
```

---

## 📞 サポート

### ドキュメント
- [全体ロードマップ](./AI_IMPROVEMENT_ROADMAP.md)
- [Phase 1タスク](./PHASE1_P0_TASKS.md)
- [メトリクス定義](./METRICS_DEFINITION.md)
- [チェックリスト](./IMPLEMENTATION_CHECKLIST.md)

### 連絡先
- GitHub Issues: 技術的な質問・バグ報告
- Pull Request: コードレビュー依頼
- プロジェクトミーティング: 毎週月曜 10:00

---

## 🎊 次のステップ

1. ✅ このクイックスタートを読む
2. ⬜ [PHASE1_P0_TASKS.md](./PHASE1_P0_TASKS.md)を熟読
3. ⬜ Task 1.1から実装開始
4. ⬜ 毎日チェックリストを更新
5. ⬜ 週次でメトリクス確認

**頑張ってください！🚀**

---

**更新履歴**
- 2025-12-20: 初版作成
