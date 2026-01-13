# Git履歴学習レポート

**学習日時**: 2026-01-10T14:44:55.044Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 470件
- **抽出パターン数**: 410件
- **新規パターン**: 0件
- **更新パターン**: 410件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）


1. **src/components/ReadingPassageView.tsx** - 11回修正
   - リスクレベル: 高


2. **src/components/ExplanationBoard.tsx** - 11回修正
   - リスクレベル: 高


3. **extensions/servant/src/ui/states/OverviewState.ts** - 8回修正
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


9. **tests/debug/test-debug.ts** - 3回修正
   - リスクレベル: 低


10. **src/utils/testSlashSplit.ts** - 3回修正
   - リスクレベル: 低


---

## 📋 抽出された失敗パターン


### 1. logic-error

**説明**: fix: markdownlintignoreにDATA_GENERATION_TOOLS_CATALOG.mdを追加


**影響ファイル**: .markdownlintignore


### 2. logic-error

**説明**: fix: eslint.config.jsでservantを除外（.eslintignoreは非推奨）


**影響ファイル**: .eslintignore, eslint.config.js


### 3. logic-error

**説明**: fix: ReadingPassageView.tsxの未使用import削除


**影響ファイル**: src/components/ReadingPassageView.tsx


### 4. logic-error

**説明**: fix: 構文エラーを修正


**影響ファイル**: src/components/ReadingPassageView.tsx


### 5. logic-error

**説明**: fix: 未使用変数を削除（ESLint警告解消）


**影響ファイル**: src/components/ReadingPassageView.tsx


### 6. logic-error

**説明**: 長文読解UI改善: 段落字下げ修正、/分割ロジック統合、一文訳の交互表示、語句タブ追加


**影響ファイル**: .aitk/.commit-count, src/components/ExplanationBoard.tsx, src/components/ReadingPassageView.tsx, src/utils/slashSplitLogic.ts, tests/debug/test-debug.ts


### 7. logic-error

**説明**: /分割ロジック完成（正解率100%）- 期待値の修正、to不定詞文末ルールを削除、全17ケース完全合格


**影響ファイル**: .aitk/.commit-count, scripts/generate-classical-japanese-text.ts, src/utils/slashSplitLearning.ts, src/utils/testSlashSplitValidation.ts


### 8. logic-error

**説明**: /分割ロジック最終調整（正解率94.1%）- soの副詞/接続詞を正確に区別、J2022_5_10完全修正


**影響ファイル**: .aitk/.commit-count, scripts/generate-classical-japanese-text.ts, src/utils/slashSplitLogic.ts, tests/debug/test-debug.ts


### 9. logic-error

**説明**: fix: reduce 404 errors - create models dir and remove J_2020_4 from passages list


**影響ファイル**: .aitk/.commit-count, public/models/.gitkeep, src/components/ReadingPassageView.tsx, src/utils/passageDataLoader.ts


### 10. logic-error

**説明**: fix: 未使用変数の警告を解消 (setSelectedSentence)


**影響ファイル**: src/components/ReadingPassageView.tsx


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 410件
2. **高リスクファイル**: 2ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2026-01-10T14:44:55.044Z
