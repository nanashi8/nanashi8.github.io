---
description: AI自己チェック用プロンプトテンプレート - 実装前後の必須確認項目
---

# AI実装時の自己チェックプロンプト

## 🎯 使用方法

コード変更を行う前に、このプロンプトを使用して自己チェックを実行します。

---

## 📋 実装前チェックプロンプト

```
私は以下のコード変更を行おうとしています。
実装前に以下を確認してください：

【変更内容】
<変更内容を記述>

【確認事項】
1. 型定義ファイル（src/storage/progress/types.ts）を確認しましたか？
2. 使用するプロパティ名は型定義と完全に一致していますか？
3. リファクタリングの場合、元のコードを完全コピーしましたか？
4. 推測で実装していませんか？
5. モード専用プロパティを使用していますか？

【必須確認ファイル】
- [ ] src/storage/progress/types.ts
- [ ] 元のコード（git show HEAD:ファイル名）
- [ ] .aitk/instructions/ai-code-quality-checklist.instructions.md
- [ ] .aitk/instructions/property-naming-convention.instructions.md

【確認結果】
<各項目の確認結果を記述>
```

---

## ✅ 実装後チェックプロンプト

```
私は以下のコード変更を完了しました。
実装後の品質を確認してください：

【変更内容】
<変更内容を記述>

【実行済みチェック】
1. TypeScript型チェック
   実行コマンド: npm run type-check
   結果: <成功/失敗>
   
2. ESLint
   実行コマンド: npm run lint
   結果: <成功/失敗>
   
3. ユニットテスト
   実行コマンド: npm run test:unit
   結果: <X passed, Y failed>
   
4. 統合テスト
   実行コマンド: npm run test:integration
   結果: <X passed, Y failed>

【確認事項】
1. プロパティ名は型定義と完全に一致していますか？
2. 元のロジックを維持していますか？
3. 「まだまだ」を0.5点として計算していますか？
4. すべてのテストが成功していますか？
5. git diffで変更内容を確認しましたか？

【自己評価】
- 品質スコア: <1-10>
- リスク評価: <低/中/高>
- コミット可否: <可/要修正>
```

---

## 🚨 失敗時チェックプロンプト

```
テストが失敗しました。原因を特定してください：

【失敗情報】
- 失敗テスト数: <数>
- エラーメッセージ: <メッセージ>

【原因分析】
1. プロパティ名の誤りの可能性
   確認: src/storage/progress/types.ts
   
2. ロジックの変更の可能性
   確認: git diff HEAD~1 src/path/to/file.ts
   元のコード: git show HEAD~1:src/path/to/file.ts
   
3. 「まだまだ」の扱いの誤りの可能性
   確認: effectiveCorrect = correct + stillLearning * 0.5
   
4. モード専用プロパティの誤用の可能性
   確認: memorizationXxx vs correctCount

【推奨対応】
<revert/修正/段階的実装>

【修正方針】
<具体的な修正内容>
```

---

## 🎓 学習プロンプト

```
最近の失敗から学習してください：

【失敗事例】
日時: 2025-12-20
内容: カテゴリー判定統一化で誤ったプロパティ使用
失敗テスト: 24 failed

【根本原因】
1. 型定義を確認せずに推測で実装
2. 元のコードを完全コピーしなかった
3. WordProgressのモード別プロパティを理解していなかった

【学習ポイント】
1. 必ず型定義を確認する
2. 元のコードを完全コピーする
3. プロパティ名を推測しない
4. モード専用プロパティを使用する
5. 「まだまだ」は0.5点として計算する

【今後の対策】
<今後同じ失敗を避けるための具体的な対策>
```

---

## 📝 コミット前チェックプロンプト

```
以下の変更をコミットしようとしています。
最終確認を実行してください：

【コミット情報】
- ブランチ: <ブランチ名>
- コミットメッセージ: <メッセージ>
- 変更ファイル数: <数>
- 変更行数: <追加/削除>

【最終確認チェックリスト】
- [ ] 型チェック成功（npm run type-check）
- [ ] リント成功（npm run lint）
- [ ] ユニットテスト成功
- [ ] 統合テスト成功
- [ ] git diffで差分確認
- [ ] 不要なコードを削除
- [ ] コメント・空白を整理
- [ ] コミットメッセージが明確

【確認結果】
すべてチェック済み: <はい/いいえ>
コミット可: <はい/いいえ>

【次のステップ】
<コミット/修正/revert>
```

---

## 🤖 使用例

### 例1: リファクタリング前

```
私はカテゴリー判定を3箇所から1箇所に統一化しようとしています。

【確認事項】
1. src/storage/progress/types.ts を確認 → ✅ 完了
   - memorizationAttempts
   - memorizationCorrect
   - memorizationStillLearning
   - memorizationStreak

2. 元のコード確認 → ✅ 完了
   git show HEAD:src/ai/specialists/MemoryAI.ts

3. プロパティ名コピー → ✅ 完了
   完全に一致することを確認

4. ロジック完全コピー → ✅ 完了
   effectiveCorrect = correct + stillLearning * 0.5

【実装準備完了】
リスク: 低
理由: 型定義確認済み、元のコード完全コピー
```

### 例2: テスト失敗時

```
24テストが失敗しました。

【エラー】
Expected: "mastered"
Received: "other"

【原因分析】
1. プロパティ名確認
   誤: progress.correctCount
   正: progress.memorizationCorrect
   
2. git diff確認
   - categoryDetermination.tsで誤ったプロパティ使用
   
【対応】
1. 即座にrevert検討 → テスト失敗数が多いため推奨
2. 修正方針: 型定義を再確認して正しいプロパティに変更
3. 再テスト: 修正後すぐに実行
```

---

## 📚 参考資料

- [AI実装時の品質保証チェックリスト](../../.aitk/instructions/ai-code-quality-checklist.instructions.md)
- [リファクタリング安全実行ガイド](../../.aitk/instructions/refactoring-safety-guide.instructions.md)
- [プロパティ命名規則ガイド](../../.aitk/instructions/property-naming-convention.instructions.md)
