# シナリオ可視化ガイド（色丸）

## 目的
- 学習AIの挙動をターミナルで直感的に把握（🔴🟡🟢⚪）。
- 複数パターンを並べて比較・評価。

## コマンド例
```bash
node scripts/visual-random-simulation.ts --scenario heavy_miss --runs 2
node scripts/visual-random-simulation.ts --scenario time_boost --runs 3
node scripts/visual-random-simulation.ts --scenario perfect --runs 2
node scripts/visual-random-simulation.ts --scenario varied --runs 3
node scripts/visual-random-simulation.ts --scenario practical_student --runs 2
```

## 出力の読み方
- カテゴリ分布: 🔴分からない / 🟡まだまだ / 🟢覚えてる / ⚪未学習 の割合バー。
- 優先度TOP10: 色丸＋履歴（✓✗）＋バー（高優先度は█）。
- BOTTOM5: 定着済み・時間経過待ちの一覧表示。
- 学習効率: 出題済みのうち定着済み割合（目安指標）。

## シナリオの意味
- heavy_miss: 誤答が連続するケースの優先度挙動を検証。
- time_boost: 未復習時間の影響（TimeBasedPriorityAI）を強調。
- perfect: 高正答・連続正解時の新規出題の比重を確認。
- varied: 正誤混在の一般的ケース。
- practical_student: 序盤高正答→中盤疲労→終盤回復の実践的フェーズを再現。

## よくある評価ポイント
- 連続ミスがTOPに浮上しているか（再出題優先に効く）。
- 未学習⚪の比率が過度に大きすぎないか（出題バランス）。
- 🟢がBOTTOMへ適切に退避し、復習サイクルが過密になっていないか。

## 拡張案
- `--seed <n>`で再現性担保。
- `--json`/`--csv`で機械可読出力。
- 複数シナリオの一括比較 `--scenario a,b,c`。
