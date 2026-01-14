# AI CONTEXT PACKET

- generatedAt: 2026-01-14T11:34:54.759Z

## Single Source of Truth

- WORKING_SPEC: nanashi8.github.io/docs/specifications/WORKING_SPEC.md
- DECISIONS: nanashi8.github.io/docs/specifications/DECISIONS.md

## Staged Files

## Signals (Recent, Decayed)

- windowHours: 24
- candidates: 30
- startNodeSource: signals
- docs/archive/README-2024-archive.md (hot=0.034)
- extensions/servant/src/ui/states/MaintenanceState.ts (hot=0.028)
- docs/guidelines/AI_COLLABORATION_WORKFLOW.md (hot=0.026)
- scripts/ORGANIZATION.md (hot=0.025)
- .husky/README.md (hot=0.025)
- tools/npm-audit-summary.mjs (hot=0.023)
- docs/research/README.md (hot=0.02)
- scripts/generate-docs-index.ts (hot=0.02)
- docs/research/NATIVE_CODING_REFINEMENT_WORKFLOW.md (hot=0.018)
- extensions/servant/package.json (hot=0.016)

## Related (Neural Propagation)

- startNode: docs/archive/README-2024-archive.md
- seeds: 5
- affectedFiles: 0
- computationTimeMs: 1

### Seeds

- docs/archive/README-2024-archive.md (activation=1.000, source=signal, signals=[save:0.03])
- extensions/servant/src/ui/states/MaintenanceState.ts (activation=0.824, source=signal, signals=[save:0.03])
- docs/guidelines/AI_COLLABORATION_WORKFLOW.md (activation=0.765, source=signal, signals=[save:0.03])
- scripts/ORGANIZATION.md (activation=0.735, source=signal, signals=[save:0.03])
- .husky/README.md (activation=0.735, source=signal, signals=[save:0.03])

- (no related files detected)

- (none)

## Required Instructions (Enforced)

- .aitk/instructions/mandatory-spec-check.instructions.md
- .aitk/instructions/meta-ai-priority.instructions.md

## SpecCheck Freshness

- ok: false
- reason: expired
- ageHours: 227.70

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

