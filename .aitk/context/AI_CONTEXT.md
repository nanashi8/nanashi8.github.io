# AI CONTEXT PACKET

- generatedAt: 2026-01-13T15:08:52.423Z

## Single Source of Truth

- WORKING_SPEC: nanashi8.github.io/docs/specifications/WORKING_SPEC.md
- DECISIONS: nanashi8.github.io/docs/specifications/DECISIONS.md

## Staged Files

## Signals (Recent, Decayed)

- windowHours: 24
- candidates: 30
- startNodeSource: signals
- docs/research/UDD_METABOLIC_MONITORING_VALIDATION_SUMMARY_JP.md (hot=0.029)
- public/data/passages-for-phrase-work/J_2023_5.txt (hot=0.017)
- scripts/generate-passages-sentences.mjs (hot=0.015)
- docs/research/CLINICAL_TRIAL_OS_CONCEPT.md (hot=0.014)
- public/data/passages-translations/J_2023_5_phrases.txt (hot=0.011)
- public/data/passages-translations/J_2020_4_full.txt (hot=0.007)
- public/data/passages-translations/J_2020_4_phrases.txt (hot=0.007)
- public/data/passages-translations/J_2020_5_phrases.txt (hot=0.007)
- public/data/passages-translations/J_2021_5_phrases.txt (hot=0.007)
- public/data/passages-translations/J_2024_5_phrases.txt (hot=0.007)

## Related (Neural Propagation)

- startNode: docs/research/UDD_METABOLIC_MONITORING_VALIDATION_SUMMARY_JP.md
- seeds: 3
- affectedFiles: 0
- computationTimeMs: 0

### Seeds

- docs/research/UDD_METABOLIC_MONITORING_VALIDATION_SUMMARY_JP.md (activation=1.000, source=signal, signals=[save:0.03])
- scripts/generate-passages-sentences.mjs (activation=0.517, source=signal, signals=[save:0.01])
- docs/research/CLINICAL_TRIAL_OS_CONCEPT.md (activation=0.483, source=signal, signals=[save:0.01])

- (no related files detected)

- (none)

## Required Instructions (Enforced)

- .aitk/instructions/mandatory-spec-check.instructions.md
- .aitk/instructions/meta-ai-priority.instructions.md

## SpecCheck Freshness

- ok: false
- reason: expired
- ageHours: 207.27

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

