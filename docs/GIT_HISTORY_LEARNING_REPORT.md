# Git履歴学習レポート

**学習日時**: 2026-01-09T22:53:42.596Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 460件
- **抽出パターン数**: 397件
- **新規パターン**: 0件
- **更新パターン**: 397件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）


1. **src/components/ExplanationBoard.tsx** - 5回修正
   - リスクレベル: 低


2. **src/components/ReadingPassageView.tsx** - 4回修正
   - リスクレベル: 低


3. **src/components/MemorizationView.tsx** - 4回修正
   - リスクレベル: 低


4. **extensions/servant/src/extension.ts** - 4回修正
   - リスクレベル: 低


5. **src/utils/socialStudiesLoader.ts** - 3回修正
   - リスクレベル: 低


6. **extensions/servant/src/ui/states/OverviewState.ts** - 3回修正
   - リスクレベル: 低


7. **extensions/servant/src/ui/ConstellationViewPanel.ts** - 3回修正
   - リスクレベル: 低


8. **extensions/servant/src/monitoring/ActionsHealthMonitor.ts** - 3回修正
   - リスクレベル: 低


9. **extensions/servant/src/autopilot/AutopilotController.ts** - 3回修正
   - リスクレベル: 低


10. **src/utils/db-connection-pool.ts** - 2回修正
   - リスクレベル: 低


---

## 📋 抽出された失敗パターン


### 1. logic-error

**説明**: fix: 未使用のhandleSelectSentence関数を削除


**影響ファイル**: src/components/ReadingPassageView.tsx


### 2. logic-error

**説明**: fix: ExplanationBoardに渡す不要なpropsを削除


**影響ファイル**: src/components/ReadingPassageView.tsx


### 3. logic-error

**説明**: style: コードフォーマット修正


**影響ファイル**: .aitk/.commit-count, src/components/ExplanationBoard.tsx


### 4. logic-error

**説明**: fix: 長文タブの表示形式を改善


**影響ファイル**: src/components/ExplanationBoard.tsx


### 5. logic-error

**説明**: fix(data): use kundoku for kanbun example readings


**影響ファイル**: public/data/classical-japanese/kanbun-practice.csv, scripts/fill-classical-japanese-example-full-readings.ts


### 6. logic-error

**説明**: fix: VS Code問題パネルのエラー解消


**影響ファイル**: .aitk/.commit-count, .aitk/context/AI_CONTEXT.md, .aitk/failure-patterns.json, .aitk/instructions/adaptive-guard-system.instructions.md, .vscode/settings.json, docs/GIT_HISTORY_LEARNING_REPORT.md, requirements.txt, scripts/adaptive-guard-checks.sh


### 7. logic-error

**説明**: fix: model.json 404の連発を防止（初回404パスを記録してキャッシュ）


**影響ファイル**: src/ai/ml/MLEnhancedSpecialistAI.ts


### 8. logic-error

**説明**: fix: faviconとapple-touch-iconの404を解消


**影響ファイル**: public/apple-touch-icon-precomposed.png, public/apple-touch-icon.png, public/favicon.ico


### 9. logic-error

**説明**: fix: swが参照するmanifest.jsonを追加


**影響ファイル**: public/manifest.json


### 10. logic-error

**説明**: fix: model.json 404とword未定義クラッシュを防止


**影響ファイル**: .aitk/.commit-count, src/App.tsx, src/ai/ml/MLEnhancedSpecialistAI.ts, src/components/MemorizationView.tsx


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 397件
2. **高リスクファイル**: 0ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2026-01-09T22:53:42.596Z
