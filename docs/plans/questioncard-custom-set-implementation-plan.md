# QuestionCardカスタムセット機能追加 - 細分化実装計画

## 📋 概要

QuestionCardコンポーネントにカスタムセット機能を追加する際の段階的な実装計画。
既存のQuizView、MemorizationView、ComprehensiveReadingViewの実装パターンを参考にし、エラーを最小化しながら進める。

## 🎯 目標

- QuestionCardにAddToCustomButtonを安全に統合
- 既存の機能を破壊しない
- 他のViewと一貫性のあるUI/UX

## 📊 現状分析

### ✅ 完了済み
- QuestionCardProps にカスタムセット関連のpropsが定義済み
  - `customQuestionSets?: CustomQuestionSet[]`
  - `onAddWordToCustomSet?: (setId: string, word: CustomWord) => void`
  - `onRemoveWordFromCustomSet?: (setId: string, word: CustomWord) => void`
  - `onOpenCustomSetManagement?: () => void`
- AddToCustomButtonコンポーネントが実装済み
- 他の3つのView(Quiz, Memorization, ComprehensiveReading)で既に実装・動作確認済み

### ❌ 未実装
- QuestionCard内でのAddToCustomButtonの配置
- CustomWordオブジェクトの生成
- UIレイアウトの調整

## 🔄 段階的実装計画

### Phase 1: 準備と検証 (10分)

#### Task 1.1: 参照実装の詳細確認
```bash
# 既存実装の配置場所と実装パターンを確認
- QuizView.tsx の実装箇所を特定
- MemorizationView.tsx の実装箇所を特定
- ComprehensiveReadingView.tsx の実装箇所を特定
```

**検証ポイント:**
- AddToCustomButtonの配置位置
- CustomWordオブジェクトの生成方法
- 条件分岐の実装方法

**成功基準:**
- 3つの実装パターンの共通点を把握
- QuestionCardに最適な配置場所を特定

#### Task 1.2: QuestionCardの現状コード読解
```bash
# QuestionCardの構造を把握
- 既存のJSX構造を確認
- 適切な挿入箇所を特定
- 既存クラス名・スタイルの確認
```

**検証ポイント:**
- question-card内の適切な挿入ポイント
- 既存のdivタグ構造との整合性
- レスポンシブデザインへの影響

**成功基準:**
- 挿入箇所を2-3箇所候補として特定
- レイアウト崩れのリスク評価完了

---

### Phase 2: 最小限の実装 (15分)

#### Task 2.1: CustomWordオブジェクト生成ロジックの追加
```typescript
// QuestionCard.tsx内に追加
// 既存の他Viewの実装を参考にCustomWordを生成
const customWord: CustomWord = {
  word: question.word,
  meaning: question.meaning,
  reading: question.reading,
  // 他の必須フィールドを確認して追加
};
```

**検証ポイント:**
- CustomWord型の必須フィールドをすべて満たしているか
- questionオブジェクトから適切にデータを取得できるか
- undefinedやnullの適切な処理

**成功基準:**
- TypeScriptエラーなし
- ビルド成功

#### Task 2.2: 条件分岐の実装
```typescript
// propsの存在確認
{onAddWordToCustomSet && 
 onRemoveWordFromCustomSet && 
 onOpenCustomSetManagement && 
 customQuestionSets && (
  // AddToCustomButtonの配置
)}
```

**検証ポイント:**
- すべての必須propsの存在確認
- 短絡評価の適切な使用
- ネストの深さが適切か

**成功基準:**
- TypeScriptエラーなし
- 未定義関数の呼び出しが発生しない

---

### Phase 3: AddToCustomButtonの配置 (20分)

#### Task 3.1: 最もシンプルな位置に配置
```tsx
{/* カスタムセットに追加ボタン */}
{onAddWordToCustomSet && 
 onRemoveWordFromCustomSet && 
 onOpenCustomSetManagement && 
 customQuestionSets && (
  <div className="mt-4">
    <AddToCustomButton
      word={customWord}
      sets={customQuestionSets}
      onAddWord={onAddWordToCustomSet}
      onRemoveWord={onRemoveWordFromCustomSet}
      onOpenManagement={onOpenCustomSetManagement}
      size="medium"
      variant="both"
    />
  </div>
)}
```

**配置候補:**
1. **選択肢の下** (推奨) - 他Viewと同じパターン
2. 問題文の横
3. ナビゲーションボタンの近く

**検証ポイント:**
- レイアウトの崩れがないか
- モバイル表示での問題がないか
- ダークモードでの表示確認

**成功基準:**
- ビルドエラーなし
- ブラウザでの表示確認OK
- クリック可能

#### Task 3.2: 動作確認
```bash
# 開発サーバーで確認
npm run dev
```

**テスト項目:**
1. ボタンが表示されるか
2. クリックでメニューが開くか
3. セットへの追加が動作するか
4. セットからの削除が動作するか
5. セット管理画面が開くか

**成功基準:**
- すべてのテスト項目がパス
- コンソールエラーなし

---

### Phase 4: UI/UX調整 (15分)

#### Task 4.1: スタイリング調整
```tsx
// 既存のQuestionCardスタイルと統一
// 必要に応じてマージン、パディング、色を調整
```

**調整ポイント:**
- 既存要素との間隔
- ボタンサイズの適切性
- 色の統一感

**検証ポイント:**
- デスクトップ表示
- タブレット表示
- モバイル表示
- ダークモード

**成功基準:**
- 他のViewと一貫性のある見た目
- レスポンシブ対応OK

#### Task 4.2: アクセシビリティ確認
```bash
# キーボード操作の確認
# スクリーンリーダーでの確認
```

**検証ポイント:**
- Tab キーでフォーカス可能か
- Enter/Space キーで操作可能か
- aria-label等の適切な設定

**成功基準:**
- キーボード操作完全対応
- アクセシビリティ警告なし

---

### Phase 5: テストと最終確認 (20分)

#### Task 5.1: 統合テスト
```bash
# 実際の使用シナリオでテスト
1. 問題に回答
2. カスタムセットに追加
3. 次の問題へ移動
4. 前の問題に戻る
5. 追加した単語を削除
```

**テストシナリオ:**
- [ ] セットが0個の場合
- [ ] セットが1個の場合
- [ ] セットが複数の場合
- [ ] 既に追加済みの単語の場合
- [ ] 未回答の状態での表示
- [ ] 回答後の状態での表示

**成功基準:**
- すべてのシナリオで正常動作
- エッジケースでもエラーなし

#### Task 5.2: パフォーマンス確認
```bash
# レンダリング回数の確認
# メモリリークの確認
```

**検証ポイント:**
- 不要な再レンダリングがないか
- メモリ使用量の異常増加がないか
- 動作のもたつきがないか

**成功基準:**
- React DevToolsで異常なし
- スムーズな動作

#### Task 5.3: コードレビュー
```bash
# コード品質チェック
- TypeScript型エラー確認
- ESLint警告確認
- 未使用変数の削除
- コメントの追加
```

**チェックリスト:**
- [ ] TypeScriptエラー: 0
- [ ] ESLint警告: 0
- [ ] 適切なコメント追加済み
- [ ] 不要なconsole.log削除済み

**成功基準:**
- すべてのリンターチェックパス
- コードの可読性確保

---

## 🚨 リスク管理

### 高リスク項目
1. **レイアウト崩れ**: 既存のFlexboxレイアウトとの競合
   - **対策**: 段階的に配置を調整、各段階で確認
   
2. **TypeScriptエラー**: CustomWord型の不一致
   - **対策**: Phase 2.1で型定義を先に完全確認

3. **propsの伝播ミス**: 親コンポーネントからのprops未伝達
   - **対策**: 呼び出し元(App.tsx等)の確認も含める

### 中リスク項目
1. **パフォーマンス劣化**: 不要な再レンダリング
   - **対策**: React.memoやuseMemoの適切な使用

2. **モバイル表示の問題**: 小画面でのレイアウト
   - **対策**: 早い段階でモバイル表示確認

## ✅ チェックリスト

### Phase 1 完了時
- [ ] 参照実装の調査完了
- [ ] 挿入箇所の特定完了
- [ ] リスク評価完了

### Phase 2 完了時
- [ ] CustomWordオブジェクト生成ロジック実装
- [ ] 条件分岐実装
- [ ] TypeScriptエラーなし

### Phase 3 完了時
- [ ] AddToCustomButton配置完了
- [ ] 基本動作確認OK
- [ ] ブラウザ表示確認OK

### Phase 4 完了時
- [ ] スタイリング調整完了
- [ ] レスポンシブ対応確認
- [ ] アクセシビリティ確認

### Phase 5 完了時
- [ ] 全テストシナリオパス
- [ ] パフォーマンス確認完了
- [ ] コードレビュー完了
- [ ] ドキュメント更新

## 📝 実装メモ

### 参照コードの場所
- QuizView.tsx: 390-392行目
- MemorizationView.tsx: 530-542行目
- ComprehensiveReadingView.tsx: 1476-1488行目

### CustomWord型定義の場所
- src/types/customQuestions.ts

### 関連ファイル
- src/components/AddToCustomButton.tsx
- src/components/QuestionCard.tsx
- src/App.tsx (親コンポーネント)

## 🎓 学習ポイント

各Phaseで学ぶべきこと:
1. 既存コードの読解力
2. 段階的な機能追加の技術
3. TypeScriptの型システムの活用
4. Reactのベストプラクティス
5. アクセシビリティの重要性

## 📊 進捗追跡

| Phase | タスク | 状態 | 所要時間 | 備考 |
|-------|--------|------|----------|------|
| 1.1 | 参照実装確認 | ⬜ 未着手 | - | - |
| 1.2 | コード読解 | ⬜ 未着手 | - | - |
| 2.1 | CustomWord生成 | ⬜ 未着手 | - | - |
| 2.2 | 条件分岐実装 | ⬜ 未着手 | - | - |
| 3.1 | ボタン配置 | ⬜ 未着手 | - | - |
| 3.2 | 動作確認 | ⬜ 未着手 | - | - |
| 4.1 | スタイリング | ⬜ 未着手 | - | - |
| 4.2 | アクセシビリティ | ⬜ 未着手 | - | - |
| 5.1 | 統合テスト | ⬜ 未着手 | - | - |
| 5.2 | パフォーマンス | ⬜ 未着手 | - | - |
| 5.3 | コードレビュー | ⬜ 未着手 | - | - |

## 🔄 ロールバック手順

各Phaseで問題が発生した場合:
```bash
# 変更を取り消し
git checkout src/components/QuestionCard.tsx

# または特定のコミットに戻る
git reset --hard <commit-hash>
```

---

**作成日**: 2025-12-10  
**最終更新**: 2025-12-10  
**推定総所要時間**: 80分
