# AI CONTEXT PACKET

- generatedAt: 2026-01-07T05:08:16.793Z

## Single Source of Truth

- WORKING_SPEC: nanashi8.github.io/docs/specifications/WORKING_SPEC.md
- DECISIONS: nanashi8.github.io/docs/specifications/DECISIONS.md

## Staged Files

## Signals (Recent, Decayed)

- windowHours: 24
- candidates: 30
- startNodeSource: signals
- scripts/pre-commit-quality-guard.sh (hot=0.083)
- extensions/servant/src/health/RealtimeHealthMonitor_proposal.ts (hot=0.082)
- docs/CONSTELLATION_ENHANCEMENT_ROADMAP.md (hot=0.072)
- docs/PHASE1_DETAILED_DESIGN.md (hot=0.072)
- docs/PROTOTYPE_VALIDATION_CHECKLIST.md (hot=0.072)
- docs/IMPLEMENTATION_PLAN_SUMMARY.md (hot=0.072)
- extensions/servant/src/ui/ConstellationViewPanel_zero.ts (hot=0.046)
- extensions/servant/src/ui/ConstellationViewPanel.ts (hot=0.02)
- extensions/servant/package.json (hot=0.014)
- extensions/servant/src/extension.ts (hot=0.008)

## Related (Neural Propagation)

- startNode: scripts/pre-commit-quality-guard.sh
- seeds: 10
- affectedFiles: 0
- computationTimeMs: 0

### Seeds

- scripts/pre-commit-quality-guard.sh (activation=1.000, source=signal, signals=[save:0.08])
- extensions/servant/src/health/RealtimeHealthMonitor_proposal.ts (activation=0.988, source=signal, signals=[save:0.08])
- docs/CONSTELLATION_ENHANCEMENT_ROADMAP.md (activation=0.867, source=signal, signals=[save:0.07])
- docs/PHASE1_DETAILED_DESIGN.md (activation=0.867, source=signal, signals=[save:0.07])
- docs/PROTOTYPE_VALIDATION_CHECKLIST.md (activation=0.867, source=signal, signals=[save:0.07])
- package.json (activation=0.150, source=stagedFiles)
- public/constellation-3d-demo.html (activation=0.150, source=stagedFiles)
- scripts/deploy-gh-pages.mjs (activation=0.150, source=stagedFiles)
- src/ai/scheduler/QuestionScheduler.ts (activation=0.150, source=stagedFiles)
- src/ai/scheduler/SlotAllocator.ts (activation=0.150, source=stagedFiles)

- (no related files detected)

- package.json
- public/constellation-3d-demo.html
- scripts/deploy-gh-pages.mjs
- src/ai/scheduler/QuestionScheduler.ts
- src/ai/scheduler/SlotAllocator.ts
- src/ai/utils/categoryDetermination.ts
- src/components/RequeuingDebugPanel.tsx
- src/strategies/learningUtils.ts
- src/utils/questionPrioritySorter.ts

## Required Instructions (Enforced)

- .aitk/instructions/mandatory-spec-check.instructions.md
- .aitk/instructions/meta-ai-priority.instructions.md

## SpecCheck Freshness

- ok: false
- reason: expired
- ageHours: 53.26

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

