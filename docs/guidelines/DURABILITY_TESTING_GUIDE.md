---
title: 耐久テストガイド（VS Code / CLI）
created: 2025-12-17
updated: 2025-12-19
status: in-progress
tags: [guideline, ai, test]
---

# 耐久テストガイド（VS Code / CLI）

## 目的

- 長時間・大量実行でロジックの安定性、性能、再現性、メモリ健全性を確認する。

## 実行の基本

```bash
# 長時間ラン（seed固定推奨）
node scripts/visual-random-simulation.ts --scenario practical_student --runs 1000 --seed 42

# vitestでシナリオ比較（フレーク検知・再試行）
npx vitest run tests/unit/visualSimScenario.test.ts --retry=3
```

## 計測指標（例）

- 分布安定性: 🔴🟡🟢⚪の比率の範囲（上限・下限）
- 性能: p95/p99の分類・ソート処理時間（`process.hrtime.bigint()`）
- メモリ: `process.memoryUsage()` のRSS/heapUsedの推移（増加傾向で警告）
- フレーク率: 同一テストをseed変えてN回実行し失敗率を記録

## アサーション例

- 連続ミスIDはTOP5以内に入ること
- 未学習⚪が一定割合以上で中優先帯に留まること
- 学習効率が継続的にゼロにならないこと（seed依存で閾値調整）

## CIへの統合

- 週次夜間ジョブで長時間テストを実行
- しきい値（性能・メモリ・分布）を超えたらFailにして回帰検知

## 注意

- VS Codeは編集環境。UIレンダリング耐久は別途ブラウザで実施。ここではロジック・CLI中心。
