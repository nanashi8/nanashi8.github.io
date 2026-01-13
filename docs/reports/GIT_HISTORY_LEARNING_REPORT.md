# Git履歴学習レポート

**学習日時**: 2026-01-13T18:10:12.707Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 484件
- **抽出パターン数**: 420件
- **新規パターン**: 0件
- **更新パターン**: 420件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）


1. **src/components/ReadingPassageView.tsx** - 11回修正
   - リスクレベル: 高


2. **src/components/ExplanationBoard.tsx** - 11回修正
   - リスクレベル: 高


3. **extensions/servant/src/ui/states/OverviewState.ts** - 9回修正
   - リスクレベル: 中


4. **extensions/servant/src/ui/ConstellationViewPanel.ts** - 7回修正
   - リスクレベル: 中


5. **extensions/servant/src/extension.ts** - 5回修正
   - リスクレベル: 低


6. **src/utils/slashSplitLogic.ts** - 4回修正
   - リスクレベル: 低


7. **src/components/MemorizationView.tsx** - 4回修正
   - リスクレベル: 低


8. **extensions/servant/src/autopilot/AutopilotController.ts** - 4回修正
   - リスクレベル: 低


9. **test-debug.ts** - 3回修正
   - リスクレベル: 低


10. **src/utils/testSlashSplit.ts** - 3回修正
   - リスクレベル: 低


---

## 📋 抽出された失敗パターン


### 1. test-error

**説明**: chore: move AI integration test guide to docs/testing/


**影響ファイル**: docs/development/BATCH_SYSTEM_TDD_PLAN.md, docs/features/random-skip-feature.md, docs/fixes/VIBRATION_ISSUE_20251229.md, docs/how-to/TESTING_GUIDE.md, ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md


### 2. logic-error

**説明**: chore(ci): fix reusable workflow refs for editor diagnostics


**影響ファイル**: .github/workflows/auto-deploy.yml, .github/workflows/deploy-state.yml, .github/workflows/deploy.yml, .github/workflows/quality-check.yml, .github/workflows/quality-strategy.yml, .github/workflows/safe-deployment.yml, .github/workflows/scheduled-deploy.yml, .vscode/settings.json


### 3. logic-error

**説明**: fix: Replace hard tabs with spaces in markdown


**影響ファイル**: docs/how-to/GENERATE_CLASSICAL_JAPANESE_PDF.md


### 4. logic-error

**説明**: fix: Update GitHub Actions badges to reference existing workflow files


**影響ファイル**: README.md, README.old.md, README_JP.md, docs/quality/archive/QUALITY_PIPELINE.md


### 5. logic-error

**説明**: fix: markdownlintignoreにDATA_GENERATION_TOOLS_CATALOG.mdを追加


**影響ファイル**: .markdownlintignore


### 6. logic-error

**説明**: fix: eslint.config.jsでservantを除外（.eslintignoreは非推奨）


**影響ファイル**: .eslintignore, eslint.config.js


### 7. logic-error

**説明**: fix: ReadingPassageView.tsxの未使用import削除


**影響ファイル**: src/components/ReadingPassageView.tsx


### 8. logic-error

**説明**: fix: 構文エラーを修正


**影響ファイル**: src/components/ReadingPassageView.tsx


### 9. logic-error

**説明**: fix: 未使用変数を削除（ESLint警告解消）


**影響ファイル**: src/components/ReadingPassageView.tsx


### 10. logic-error

**説明**: 長文読解UI改善: 段落字下げ修正、/分割ロジック統合、一文訳の交互表示、語句タブ追加


**影響ファイル**: .aitk/.commit-count, src/components/ExplanationBoard.tsx, src/components/ReadingPassageView.tsx, src/utils/slashSplitLogic.ts, test-debug.ts


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 420件
2. **高リスクファイル**: 2ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2026-01-13T18:10:12.707Z
