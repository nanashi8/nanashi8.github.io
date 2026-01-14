---
title: AntiVibrationFilter 仕様（スタブ）
created: 2026-01-09
updated: 2026-01-09
status: draft
---

# AntiVibrationFilter 仕様（スタブ）

このドキュメントは振動防止（同一要素の過剰な連続出題/連続処理）を抑制する仕組みの仕様スタブです。

## 背景

- 短時間に同じ対象が再出題/再処理され続けると、体験が悪化する
- 一方で、誤答（incorrect）の復習保証を阻害しないことも重要

## 実装参照

- `src/ai/scheduler/AntiVibrationFilter.ts`

## TODO

- 抑制条件（時間窓/例外）
- incorrect の扱い（フェイルセーフ）
- チューニング指標
