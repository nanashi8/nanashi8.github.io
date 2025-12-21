# AI学習システム改善計画 - ドキュメント索引

## 📚 概要

このディレクトリには、学習AIシステムを**業界トップクラスから次世代レベル（LACL L4）**へ引き上げるための包括的な改善計画が含まれています。

---

## 📖 ドキュメント一覧

### 🎯 [クイックスタート](./QUICKSTART.md)
**最初に読むべきドキュメント**

- 5分で理解できる概要
- 今すぐ始める手順
- Phase 1の最初のタスク
- トラブルシューティング

**読者**: すべての開発者

---

### 🗺️ [AI改善ロードマップ](./AI_IMPROVEMENT_ROADMAP.md)
**全体戦略とビジョン**

- LACL（学習AI能力レベル）の定義
- 各AIモジュールの現状評価
- Phase 1-4の戦略とマイルストーン
- 成功の定義とビジョン

**読者**: プロジェクトマネージャー、技術リーダー、すべての開発者

**主要セクション**:
- 📊 現状評価サマリー（各AIのレベル）
- 🎯 Phase 1: 即効改善（P0）
- 🚀 Phase 2: 実運用強化（P1）
- 🌟 Phase 3: 高度統合（P2）
- 🔬 Phase 4: 次世代研究（P3）
- 📊 評価・検証フレームワーク
- 🎯 成功の定義

---

### 📋 [Phase 1（P0）実装タスク詳細](./PHASE1_P0_TASKS.md)
**即効改善の詳細設計**

- Task 1: MemoryAI校正システム
  - 確率校正（Platt Scaling）
  - 評価メトリクス計算
  - 保持率ダッシュボード
- Task 2: データ品質とスキーマ管理
  - スキーマバージョニング
  - データ整合性検証
- Task 3: QuestionScheduler説明可能性
- Task 4: 監査ログシステム
- Task 5: フィーチャーフラグとAB実験基盤

**読者**: 実装担当者

**工数**: 20-25日（1人）

---

### 🔄 [責務分離リファクタリング計画](./RESPONSIBILITY_SEPARATION_PLAN.md)
**アーキテクチャ改善計画**

- Phase 1: progressStorageのビジネスロジック分離（7.5日）
- Phase 2: ForgettingCurveModelの責務明確化（3.0日）
- Phase 3: 旧AIコードのクリーンアップ（1.5日）
- リスク評価と緩和策
- P0タスクとの並行作業計画

**読者**: アーキテクト、実装担当者

**工数**: 14.4日（余裕込み、3週間推奨）

**優先度**: P0と並行可能、コード品質向上に重要

---

### 📊 [評価メトリクス定義](./METRICS_DEFINITION.md)

- データ収集基盤
- Task 2: QuestionScheduler説明可能性
  - 優先度分解データ構造
  - 分解値の計算と記録
  - UI表示
  - 監査ログ

**読者**: 実装担当者

**工数見積**: 20-25日（1人）

---

### 📊 [評価メトリクス定義](./METRICS_DEFINITION.md)
**測定指標と成功基準**

- オフライン評価指標
  - MemoryAI: ECE, MAE, MSE, Half-Life Variance
  - ErrorPredictionAI: AUC-ROC, Brier Score, Precision/Recall
  - CognitiveLoadAI: F1-Score, False Positive Rate
  - LinguisticAI: 音韻難易度相関、形態透明性効果
- オンライン評価指標（A/B）
  - 7日/30日定着率
  - 再誤答率
  - セッション継続率
  - 離脱率
  - ユーザー満足度（NPS）

**読者**: データサイエンティスト、QA担当者、プロダクトマネージャー

---

### ✅ [実装チェックリスト](./IMPLEMENTATION_CHECKLIST.md)
**タスクの進捗管理**

- Phase 1-4のすべてのタスクをチェックリスト化
- マイルストーンと完了基準
- 次のアクション

**読者**: すべての開発者（毎日更新）

**使い方**:
1. 毎日このファイルを開く
2. 完了したタスクにチェックマーク `- [x]`
3. Git commitで進捗を記録

---

## 🎯 LACL（学習AI能力レベル）とは

自動運転のSAEレベルのような統一指標は学習AIには存在しないため、本プロジェクト独自の成熟度指標を定義：

| レベル | 名称 | 特徴 |
|-------|------|------|
| **L1** | 基礎 | ルールベース、基本統計、手動評価 |
| **L2** | 実運用 | データ駆動適応、継続学習、A/B、監視 |
| **L3** | 先進 | 個別最適、確率校正、説明可能性、バイアス対策 |
| **L4** | 次世代 | 予測最適化＋探索、多目的最適化、形式検証 |

### 各AIモジュールの現在レベルと目標

| モジュール | 現在 | 目標 | 優先度 |
|-----------|------|------|--------|
| MemoryAI | L3 | L4 | P0 |
| QuestionScheduler | L2-L3 | L4 | P0 |
| CognitiveLoadAI | L2 | L3 | P1 |
| ErrorPredictionAI | L2 | L3 | P1 |
| LinguisticAI | L1-L2 | L3 | P1 |
| ContextualAI | L2 | L3 | P2 |
| GamificationAI | L1-L2 | L3 | P2 |

---

## 🗓️ タイムライン

```
Week 1-2  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  Phase 1（P0）完了
Week 3-6  ░░░░░░░░░░▓▓▓▓▓▓▓▓░░  Phase 2（P1）完了
Week 7-12 ░░░░░░░░░░░░░░░░░░▓▓  Phase 3（P2）完了
Month 4+  ░░░░░░░░░░░░░░░░░░░░  Phase 4（P3）研究開始
```

---

## 📈 期待される成果

### 技術指標
- ECE < 0.10（忘却リスク予測精度）
- AUC-ROC > 0.75（誤答予測精度）
- F1-score > 0.80（疲労検出精度）

### ビジネス指標
- **7日定着率**: +15%
- **30日定着率**: +20%
- **再誤答率**: -25%
- **セッション継続率**: +10%
- **離脱率**: -15%
- **NPS**: > 50

### ユーザー体験
- 復習タイミングが最適化される
- 出題順序の根拠が理解できる
- 疲労を感じる前に休憩提案
- 個人に合わせた学習ペース

---

## 🚀 始め方

### 1. 計画理解（30分）

```bash
# クイックスタートを読む
cat docs/plans/QUICKSTART.md

# ロードマップを読む
cat docs/plans/AI_IMPROVEMENT_ROADMAP.md

# 自分の担当タスクを確認
cat docs/plans/IMPLEMENTATION_CHECKLIST.md
```

### 2. 環境準備（10分）

```bash
npm install
npm install chart.js react-chartjs-2
npm run dev
```

### 3. 実装開始

```bash
# Phase 1の最初のタスク
# → PHASE1_P0_TASKS.md の Task 1.1参照
```

---

## 🤝 貢献ガイドライン

### ブランチ戦略

```
main
  ├── feature/memory-ai-calibration    (Phase 1-1)
  ├── feature/scheduler-explainability (Phase 1-2)
  ├── feature/error-prediction         (Phase 2-1)
  └── ...
```

### コミットメッセージ

```bash
# Conventional Commits形式
feat(memory-ai): add calibration system
fix(scheduler): fix priority calculation bug
docs(roadmap): update Phase 1 timeline
test(metrics): add ECE calculation tests
```

### Pull Request

1. feature ブランチを作成
2. 実装 + テスト
3. チェックリストを更新（`- [x]`）
4. PR作成（テンプレート使用）
5. コードレビュー
6. マージ

---

## 📞 サポート

### 質問・相談
- **技術的な質問**: GitHub Issues
- **コードレビュー**: Pull Request
- **緊急対応**: プロジェクトSlack #ai-improvement

### 定例ミーティング
- **週次レビュー**: 毎週月曜 10:00-11:00
- **Phase 完了レビュー**: Phase終了時

---

## 📝 更新履歴

| 日付 | 内容 | 担当者 |
|------|------|--------|
| 2025-12-20 | 改善計画策定完了 | AI Architect |
| ... | ... | ... |

---

## 🎊 Vision

> 「人間の記憶の科学的理解に基づき、一人ひとりに最適化された学習体験を提供し、教育の民主化を実現する」

次世代の学習AIシステムを一緒に作りましょう！🚀

---

**まず読むべきドキュメント**: [QUICKSTART.md](./QUICKSTART.md)
