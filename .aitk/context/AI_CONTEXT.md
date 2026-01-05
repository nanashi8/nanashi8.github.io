# AI CONTEXT PACKET

- generatedAt: 2026-01-05T13:22:54.230Z

## Single Source of Truth

- WORKING_SPEC: nanashi8.github.io/docs/specifications/WORKING_SPEC.md
- DECISIONS: nanashi8.github.io/docs/specifications/DECISIONS.md

## Staged Files

## Signals (Recent, Decayed)

- windowHours: 24
- candidates: 6
- startNodeSource: signals
- extensions/servant/package.json (hot=0.133)
- extensions/servant/src/extension.ts (hot=0.105)
- extensions/servant/src/ui/ConstellationViewPanel.ts (hot=0.098)
- extensions/servant/tests/HookInstaller.symlinkSafety.test.ts (hot=0.059)
- extensions/servant/src/git/HookInstaller.ts (hot=0.056)
- extensions/servant/src/autopilot/AutopilotController.ts (hot=0.048)

## Related (Neural Propagation)

- startNode: extensions/servant/package.json
- seeds: 5
- affectedFiles: 0
- computationTimeMs: 0

### Seeds

- extensions/servant/package.json (activation=1.000, source=signal, signals=[save:0.13])
- extensions/servant/src/extension.ts (activation=0.789, source=signal, signals=[save:0.10])
- extensions/servant/src/ui/ConstellationViewPanel.ts (activation=0.737, source=signal, signals=[save:0.10])
- extensions/servant/tests/HookInstaller.symlinkSafety.test.ts (activation=0.444, source=signal, signals=[save:0.06])
- extensions/servant/src/git/HookInstaller.ts (activation=0.421, source=signal, signals=[save:0.06])

- (no related files detected)

- (none)

## Required Instructions (Enforced)

- .aitk/instructions/mandatory-spec-check.instructions.md
- .aitk/instructions/meta-ai-priority.instructions.md

## SpecCheck Freshness

- ok: true
- recordedAt: 2026-01-04T23:52:43.428Z
- ageHours: 13.50

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

