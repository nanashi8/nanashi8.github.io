# AI CONTEXT PACKET

- generatedAt: 2026-01-07T10:13:08.432Z

## Single Source of Truth

- WORKING_SPEC: nanashi8.github.io/docs/specifications/WORKING_SPEC.md
- DECISIONS: nanashi8.github.io/docs/specifications/DECISIONS.md

## Staged Files

## Signals (Recent, Decayed)

- windowHours: 24
- candidates: 30
- startNodeSource: signals
- src/ai/scheduler/QuestionScheduler.ts (hot=0.139)
- src/ai/scheduler/strategies/DefaultScheduleStrategy.ts (hot=0.089)
- src/ai/scheduler/helpers/ScheduleHelpers.ts (hot=0.071)
- src/ai/scheduler/strategies/HybridScheduleStrategy.ts (hot=0.062)
- src/ai/scheduler/strategies/ScheduleStrategy.ts (hot=0.052)
- docs/reports/PHASE1_STRATEGY_PATTERN_COMPLETION.md (hot=0.043)
- CHANGELOG.md (hot=0.043)
- src/ai/scheduler/strategies/FinalPriorityScheduleStrategy.ts (hot=0.037)
- scripts/pre-commit-ai-guard.sh (hot=0.035)
- docs/development/DESIGN_PATTERNS_REFACTORING_INVESTIGATION.md (hot=0.032)

## Related (Neural Propagation)

- startNode: src/ai/scheduler/QuestionScheduler.ts
- seeds: 5
- affectedFiles: 0
- computationTimeMs: 0

### Seeds

- src/ai/scheduler/QuestionScheduler.ts (activation=1.000, source=signal, signals=[save:0.14])
- src/ai/scheduler/strategies/DefaultScheduleStrategy.ts (activation=0.640, source=signal, signals=[save:0.09])
- src/ai/scheduler/helpers/ScheduleHelpers.ts (activation=0.511, source=signal, signals=[save:0.07])
- src/ai/scheduler/strategies/HybridScheduleStrategy.ts (activation=0.446, source=signal, signals=[save:0.06])
- src/ai/scheduler/strategies/ScheduleStrategy.ts (activation=0.374, source=signal, signals=[save:0.05])

- (no related files detected)

- (none)

## Required Instructions (Enforced)

- .aitk/instructions/mandatory-spec-check.instructions.md
- .aitk/instructions/meta-ai-priority.instructions.md

## SpecCheck Freshness

- ok: false
- reason: expired
- ageHours: 58.34

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

