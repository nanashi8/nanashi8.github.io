# Git履歴学習レポート

**学習日時**: 2026-01-08T00:31:40.666Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 437件
- **抽出パターン数**: 378件
- **新規パターン**: 0件
- **更新パターン**: 378件
- **ホットスポット**: 0ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）



---

## 📋 抽出された失敗パターン


### 1. logic-error

**説明**: chore(actions): deploy系workflow整理（重複起動防止/Node20/タグ検出修正）


**影響ファイル**: .github/workflows/auto-deploy.yml, .github/workflows/deploy.yml, .github/workflows/scheduled-deploy.yml


### 2. logic-error

**説明**: fix: カテゴリースロット経路の例外フォールバックを修正


**影響ファイル**: src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/helpers/ScheduleHelpers.ts, src/ai/scheduler/strategies/ScheduleStrategy.ts


### 3. logic-error

**説明**: fix: レポートファイルをmarkdownlint対象外に追加


**影響ファイル**: .markdownlintignore


### 4. logic-error

**説明**: fix: ESLint/Markdownlintの設定を修正


**影響ファイル**: .aitk/.commit-count, .markdownlintignore, eslint.config.js, extensions/servant/src/ui/ConstellationViewPanel.ts


### 5. logic-error

**説明**: fix(lint): 不要なeslint-disableディレクティブを削除


**影響ファイル**: .aitk/.commit-count, extensions/servant/src/commands/quickFixCommit.ts


### 6. logic-error

**説明**: fix(lint): ESLint警告とエラーを修正


**影響ファイル**: .aitk/.commit-count, extensions/servant/src/autopilot/SeniorEngineerQualityCheck.ts, extensions/servant/src/commands/quickFixCommit.ts, extensions/servant/src/constellation/ConstellationDataGenerator.ts, extensions/servant/src/git/GitIntegration.ts, extensions/servant/src/ui/ConstellationViewPanel.ts, src/hooks/useAdaptiveLearning.ts


### 7. type-error

**説明**: fix: Add 'japanese' to RequeuingDebugPanel subject type


**影響ファイル**: src/components/RequeuingDebugPanel.tsx


### 8. logic-error

**説明**: fix: Add 'japanese' to RequeuingDebugPanel subject type


**影響ファイル**: src/components/RequeuingDebugPanel.tsx


### 9. logic-error

**説明**: fix: Remove plan tab from all subject scoreboards and fix service worker for dev mode


**影響ファイル**: .husky/pre-commit, docs/plans/CLASSICAL_JAPANESE_EXPANSION_PLAN.md, docs/plans/SOCIAL_STUDIES_EXPANSION_PLAN.md, package.json, public/data/classical-japanese/classical-grammar.csv, public/data/classical-japanese/classical-knowledge.csv, public/data/classical-japanese/classical-vocabulary.csv, public/data/classical-japanese/classical-words.csv, public/data/social-studies/all-social-studies.csv, public/data/social-studies/social-studies-civics-30.csv, public/data/social-studies/social-studies-geography-30.csv, public/data/social-studies/social-studies-history-40.csv, public/data/social-studies/social-studies-sample.csv, public/sw.js, scripts/check-reading-grammar-tags.ts, src/App.tsx, src/ai/scheduler/CategoryClassifier.ts, src/ai/scheduler/PositionCalculator.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/types.ts, src/ai/utils/categoryDetermination.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/QuestionCard.tsx, src/components/RequeuingDebugPanel.tsx, src/components/ScoreBoard.tsx, src/components/SettingsView.tsx, src/components/SocialMemorizationView.tsx, src/components/SocialStudiesView.tsx, src/components/SocialStudiesView.tsx.old, src/components/SpellingView.tsx, src/components/TranslationView.tsx, src/hooks/useSessionStats.ts, src/strategies/MemorizationStrategy.ts, src/strategies/learningUtils.ts, src/types.ts, src/utils.ts, src/utils/grammarAnalyzer.ts, src/utils/questionPrioritySorter.ts, src/utils/socialStudiesLoader.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/grammarAnalyzer.analyzeSentence.test.ts


### 10. logic-error

**説明**: fix: sessionStats propsを各Viewコンポーネントから削除


**影響ファイル**: .aitk/.commit-count, public/layout-prototype.html, src/components/GrammarQuizView.tsx, src/components/ScoreBoard.tsx, src/components/SpellingView.tsx, src/components/TranslationView.tsx


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 378件
2. **高リスクファイル**: 0ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2026-01-08T00:31:40.666Z
