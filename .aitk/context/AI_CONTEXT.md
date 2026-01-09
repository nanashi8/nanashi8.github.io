# AI CONTEXT PACKET

- generatedAt: 2026-01-09T00:15:24.082Z

## Single Source of Truth

- WORKING_SPEC: nanashi8.github.io/docs/specifications/WORKING_SPEC.md
- DECISIONS: nanashi8.github.io/docs/specifications/DECISIONS.md

## Staged Files

## Signals (Recent, Decayed)

- windowHours: 24
- candidates: 30
- startNodeSource: signals
- scripts/audit-classical-japanese-examples-quality.ts (hot=0.128)
- docs/quality/CLASSICAL_JAPANESE_DATA_AUDIT_PLAN.md (hot=0.108)
- public/data/classical-japanese/classical-grammar.csv (hot=0.106)
- public/data/classical-japanese/classical-words.csv (hot=0.106)
- scripts/tsconfig.json (hot=0.106)
- scripts/fill-classical-japanese-example-full-readings.ts (hot=0.086)
- scripts/override-classical-japanese-example-readings.ts (hot=0.071)
- scripts/migrate-kanbun-to-examples.ts (hot=0.029)
- scripts/fill-classical-japanese-examples.ts (hot=0.028)
- .gitignore (hot=0.028)

## Related (Neural Propagation)

- startNode: scripts/audit-classical-japanese-examples-quality.ts
- seeds: 5
- affectedFiles: 0
- computationTimeMs: 0

### Seeds

- scripts/audit-classical-japanese-examples-quality.ts (activation=1.000, source=signal, signals=[save:0.13])
- docs/quality/CLASSICAL_JAPANESE_DATA_AUDIT_PLAN.md (activation=0.844, source=signal, signals=[save:0.11])
- public/data/classical-japanese/classical-grammar.csv (activation=0.828, source=signal, signals=[save:0.11])
- public/data/classical-japanese/classical-words.csv (activation=0.828, source=signal, signals=[save:0.11])
- scripts/tsconfig.json (activation=0.828, source=signal, signals=[save:0.11])

- (no related files detected)

- (none)

## Required Instructions (Enforced)

- .aitk/instructions/mandatory-spec-check.instructions.md
- .aitk/instructions/meta-ai-priority.instructions.md

## SpecCheck Freshness

- ok: false
- reason: expired
- ageHours: 96.38

## Latest SpecCheck Record (Raw)

```json
{
  "recordedAt": "2026-01-04T23:52:43.428Z",
  "requiredInstructions": [
    ".aitk/instructions/mandatory-spec-check.instructions.md",
    ".aitk/instructions/meta-ai-priority.instructions.md"
  ],
  "note": "manual"
}
```

## Recent DECISIONS (Tail)

```
# DECISIONS

ここは仕様の変更理由・矛盾解消・運用決定のログです。

- 形式: `- YYYY-MM-DDTHH:mm:ss.sssZ: 決定内容`

- 2026-01-03T20:35:14.000Z: pre-commit 失敗時の逆伝播学習は、ニューラルグラフ未構築でも自動で `buildGraph()` してから発火する（手動実行不要）
- 2026-01-04T00:00:00.000Z: AI_CONTEXTのseed選定を改善: (1)実在hotのみで`maxHot`算出→正規化の頑健性向上、(2)staged filesを弱seed(activation=0.15)として追加（最大5件、重複・startNode除外）→作業中ファイルを自動考慮
- 2026-01-04T00:00:01.000Z: Autopilotに閉ループ再計画（save→増分検証→replan）を最小実装で追加: 保存時に変更ファイルを増分検証し、違反があれば最適化再提案をOutputへ提示（スロットル付き）。設定`autopilot.closedLoopReplanOnSave`(default:false)と`autopilot.closedLoopThrottleMs`(default:8000)で有効化・調整可能


```

## Notes

- This packet is generated locally (no external model).
- Output path: nanashi8.github.io/.aitk/context/AI_CONTEXT.md

