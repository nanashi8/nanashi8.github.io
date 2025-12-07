# コントリビューションガイド

このプロジェクトへの貢献を検討いただきありがとうございます！

## 開発ガイドライン

コードを変更する前に、必ず [開発ガイドライン](.github/DEVELOPMENT_GUIDELINES.md) をお読みください。

特に重要なポイント：

### 🚫 禁止事項

1. **progress.results への直接記録**
   ```typescript
   // ❌ 禁止
   progress.results.push({...});
   
   // ✅ 正しい
   await updateWordProgress(word, isCorrect, responseTime, undefined, mode);
   ```

2. **二重記録**
   ```typescript
   // ❌ 禁止（二重記録）
   await updateWordProgress(...);
   await addQuizResult({...});
   
   // ✅ 正しい（updateWordProgressのみ）
   await updateWordProgress(...);
   ```

3. **ScoreBoard更新忘れ**
   ```typescript
   // ❌ 禁止
   await updateWordProgress(...);
   // setLastAnswerTime を忘れている
   
   // ✅ 正しい
   await updateWordProgress(...);
   setLastAnswerTime(Date.now());
   ```

### ✅ 必須事項

1. **TypeScriptエラーがないこと**
   ```bash
   npm run typecheck
   ```

2. **ビルドが成功すること**
   ```bash
   npm run build
   ```

3. **ガイドラインチェックに合格すること**
   ```bash
   ./scripts/check-guidelines.sh
   ```

## Pull Requestを送る前に

- [ ] [開発ガイドライン](.github/DEVELOPMENT_GUIDELINES.md) を読んだ
- [ ] `npm run typecheck` が成功する
- [ ] `npm run build` が成功する
- [ ] `./scripts/check-guidelines.sh` が成功する
- [ ] 変更内容を実際に動作確認した
- [ ] 既存の機能に影響がないことを確認した

## 新機能を追加する場合

1. **既存パターンに従う**
   - 他のタブ（View）と同じ構造を使用
   - `updateWordProgress` で進捗を記録
   - `setLastAnswerTime` でScoreBoardを更新

2. **型定義を更新する**
   - 新しいモードを追加する場合は、必ず型定義を更新
   - `updateWordProgress` の型
   - `QuizResult.mode` の型
   - `WordProgress` の型

3. **ドキュメントを更新する**
   - README.mdに新機能を追加
   - 必要に応じてスクリーンショットを追加

## 質問・相談

不明な点がある場合は、Issueを作成してください。

## ライセンス

このプロジェクトへの貢献により、あなたのコードはプロジェクトと同じライセンスの下で公開されることに同意したものとみなされます。
