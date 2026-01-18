# Git履歴学習レポート

**学習日時**: 2026-01-18T01:34:17.506Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 497件
- **抽出パターン数**: 430件
- **新規パターン**: 0件
- **更新パターン**: 430件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）

1. **src/components/ReadingPassageView.tsx** - 11回修正
   - リスクレベル: 高

2. **src/components/ExplanationBoard.tsx** - 11回修正
   - リスクレベル: 高

3. **extensions/servant/src/ui/states/OverviewState.ts** - 10回修正
   - リスクレベル: 中

4. **extensions/servant/src/extension.ts** - 9回修正
   - リスクレベル: 中

5. **extensions/servant/src/ui/ConstellationViewPanel.ts** - 8回修正
   - リスクレベル: 中

6. **extensions/servant/src/autopilot/AutopilotController.ts** - 7回修正
   - リスクレベル: 中

7. **src/utils/passageDataLoader.ts** - 6回修正
   - リスクレベル: 中

8. **src/components/MemorizationView.tsx** - 6回修正
   - リスクレベル: 中

9. **extensions/servant/src/ui/ServantWarningLogger.ts** - 5回修正
   - リスクレベル: 低

10. **extensions/servant/src/monitoring/ActionsHealthMonitor.ts** - 5回修正

- リスクレベル: 低

---

## 📋 抽出された失敗パターン

### 1. logic-error

**説明**: feat: 長文問題データ整備とパス解決修正

**影響ファイル**: .aitk/context/AI_CONTEXT.md, .github/workflows/deploy-state.yml, docs/plans/PROJECT_EVALUATION_AND_REFACTORING_PLAN.md, docs/plans/servant-ux-improvement-plan.md, docs/quality/pattern-learning/INDEX.md, docs/quality/pattern-learning/J_2020_4.md, docs/quality/pattern-learning/J_2020_5.md, docs/quality/pattern-learning/J_2021_5.md, docs/quality/pattern-learning/J_2022_5.md, docs/quality/pattern-learning/J_2023_5.md, docs/quality/pattern-learning/J_2024_5.md, docs/quality/pattern-learning/J_2024_6.md, docs/quality/pattern-learning/J_2025_5.md, docs/quality/pattern-learning/WORKSHEET_TEMPLATE.md, docs/quality/pattern-learning/beginner_50_Morning-Routine.md, docs/research/MICRO_MACRO_UDD_ARCHITECTURE.md, docs/research/MICRO_MACRO_UDD_QC_COMPATIBILITY.md, docs/research/README.md, docs/research/UDD_CROSS_DOMAIN_CLOSED_LOOP_EXAMPLES.md, docs/research/UDD_SIGNIFICANCE_CONCEPT.md, docs/research/UUD_OBSERVATION_LAYER_PAPER_DRAFT.md, docs/research/uud-observation-layer/README.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_EN.aux, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_EN.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_EN.out, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_EN.pdf, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_EN.tex, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_EN.toc, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_JP.aux, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_JP.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_JP.out, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_JP.pdf, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_JP.tex, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_CLEAN_JP.toc, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_PAPER_DRAFT.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_PAPER_DRAFT_JP.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_QIITA_JP.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_QIITA_SUMMARY_JP.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_RESULTS.md, docs/research/uud-observation-layer/UUD_OBSERVATION_LAYER_WEB_VALIDATION.md, docs/research/uud-observation-layer/generate-figures.mjs, docs/research/uud-observation-layer/images/uud-ablation-xy.png, docs/research/uud-observation-layer/images/uud-observation-layer.png, docs/research/uud-observation-layer/images/uud-stability-xy.png, docs/research/uud-observation-layer/metrics.sample.json, docs/research/uud-observation-layer/metrics.web.validation.json, docs/research/uud-observation-layer/uud-ablation-xy.mmd, docs/research/uud-observation-layer/uud-observation-layer.mmd, docs/research/uud-observation-layer/uud-stability-xy.mmd, extensions/servant/package.json, extensions/servant/src/autopilot/AutopilotController.ts, extensions/servant/src/autopilot/states/CompletedState.ts, extensions/servant/src/autopilot/states/FailedState.ts, extensions/servant/src/autopilot/states/IdleState.ts, extensions/servant/src/autopilot/states/InvestigatingState.ts, extensions/servant/src/autopilot/states/PausedState.ts, extensions/servant/src/autopilot/states/ReviewingState.ts, extensions/servant/src/autopilot/states/RunningState.ts, extensions/servant/src/extension.ts, extensions/servant/src/ui/ConstellationViewPanel.ts, extensions/servant/src/ui/ServantWarningLogger.ts, extensions/servant/src/ui/states/DetailState.ts, extensions/servant/src/ui/states/FilterState.ts, extensions/servant/src/ui/states/MaintenanceState.ts, extensions/servant/src/ui/states/OverviewState.ts, extensions/servant/src/ui/states/SearchState.ts, public/data/passages/1_passages-original/J_2020_4.txt, public/data/passages/1_passages-original/J_2020_5.txt, public/data/passages/1_passages-original/J_2021_5.txt, public/data/passages/1_passages-original/J_2022_5.txt, public/data/passages/1_passages-original/J_2023_5.txt, public/data/passages/1_passages-original/J_2024_5.txt, public/data/passages/1_passages-original/J_2024_6.txt, public/data/passages/1_passages-original/J_2025_5.txt, public/data/passages/1_passages-original/beginner_50_Morning-Routine.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2020_4.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2020_5.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2021_5.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2022_5.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2023_5.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2024_5.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2024_6.txt, public/data/passages/5_passages-for-phrase-work-ja/J_2025_5.txt, src/utils/passageAdapter.ts, src/utils/passageDataLoader.ts

### 2. logic-error

**説明**: fix(lint): 未使用関数にアンダースコアプレフィックスを追加

**影響ファイル**: src/utils/passageDataLoader.ts

### 3. logic-error

**説明**: fix(passage): 正規表現リテラルのエスケープ修正

**影響ファイル**: src/utils/passageDataLoader.ts

### 4. logic-error

**説明**: fix: avoid category ssot violation

**影響ファイル**: src/ai/scheduler/CategorySlotScheduler.ts, src/utils.ts, tests/unit/quiz-generation.test.ts

### 5. logic-error

**説明**: fix: remove unused scheduler var

**影響ファイル**: src/ai/scheduler/CategorySlotScheduler.ts

### 6. logic-error

**説明**: fix: limit auto-merge to pull_request events

**影響ファイル**: .github/workflows/auto-merge.yml

### 7. logic-error

**説明**: fix: remove private directory entries from \_components.yaml

**影響ファイル**: docs/\_components.yaml

### 8. logic-error

**説明**: fix: regenerate \_components.yaml to remove invalid file references

**影響ファイル**: docs/\_components.yaml

### 9. logic-error

**説明**: docs: update security status with clear-text-storage fix

**影響ファイル**: docs/security/SECURITY_STATUS.md

### 10. logic-error

**説明**: fix: improve HTML script tag pattern to address CodeQL bad-tag-filter warning

**影響ファイル**: extensions/servant/src/learning/CodeQualityGuard.ts

---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 430件
2. **高リスクファイル**: 2ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:

- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2026-01-18T01:34:17.506Z
