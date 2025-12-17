# Seedと再現性ガイド

## 概要
- **seed**: 乱数生成の初期値。固定すると毎回同じランダム結果を再現できる。
- 利点: バグ再現、比較検証、CIでの安定テストに有効。

## 提案CLI
- 例: `node scripts/visual-random-simulation.ts --scenario practical_student --runs 2 --seed 42`
- 効果: 色丸の分布、TOP/BOTTOMの並び、効率などが毎回同一になり、差分比較が容易。

## 実装指針
- 乱数ラッパを導入: `const rng = mulberry32(seed)` のような軽量PRNG。
- 既存 `Math.random()` 呼び出し箇所を `rng()` に置換。
- 未指定時は現在の擬似乱数（Math.random）を維持し後方互換。

## テスト
- `vitest`でseed固定の期待出力（分布や閾値）を検証。
- フレーク検知: 複数seedで同一テストを実行し失敗率を監視。

## 注意点
- seed固定は「確率的性質」自体は変えないため、分布の妥当性検証には複数seedでの統計も必要。
