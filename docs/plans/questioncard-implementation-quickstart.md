# QuestionCardカスタムセット機能 - クイックスタートガイド

## 🚀 即座に開始できる実装手順

このガイドに従えば、エラーを最小限に抑えながらQuestionCardにカスタムセット機能を追加できます。

---

## Step 1: 参照実装を確認 (5分)

### 1.1 QuizViewの実装を確認

```bash
# 以下のファイルの該当行を確認
src/components/QuizView.tsx (390-392行目)
```

確認すべきコード:
```tsx
<AddToCustomButton
  word={customWord}
  sets={customQuestionSets}
  onAddWord={onAddWordToCustomSet}
  onRemoveWord={onRemoveWordFromCustomSet}
  onOpenManagement={onOpenCustomSetManagement}
  size="medium"
  variant="both"
/>
```

### 1.2 CustomWord生成方法を確認

QuizView内でCustomWordを生成している箇所を探す:
```tsx
const customWord: CustomWord = {
  word: currentQuestion.word,
  meaning: currentQuestion.meaning,
  reading: currentQuestion.reading || '',
  // その他のフィールド
};
```

**✅ チェックポイント**: CustomWordの全フィールドを把握

---

## Step 2: QuestionCardを編集準備 (3分)

### 2.1 ファイルを開く

```bash
src/components/QuestionCard.tsx
```

### 2.2 現在のimport文を確認

既に以下がimportされているか確認:
```tsx
import AddToCustomButton from './AddToCustomButton';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';
```

**✅ チェックポイント**: import済み

---

## Step 3: CustomWordオブジェクトを生成 (10分)

### 3.1 コンポーネント内に変数を追加

QuestionCard関数内の適切な場所(useState定義の後あたり)に追加:

```tsx
// カスタムセット用のCustomWordオブジェクトを生成
const customWord: CustomWord = useMemo(() => ({
  word: question.word,
  meaning: question.meaning,
  reading: question.reading || '',
  // 必要に応じて他のフィールドも追加
}), [question.word, question.meaning, question.reading]);
```

### 3.2 型定義を確認

もしTypeScriptエラーが出た場合:
```bash
# 型定義ファイルを確認
src/types/customQuestions.ts
```

**必須フィールドをすべて満たす**ように調整。

**✅ チェックポイント**: TypeScriptエラーなし

---

## Step 4: AddToCustomButtonを配置 (15分)

### 4.1 挿入位置を特定

QuestionCard.tsxの以下の部分を探す:
```tsx
</div> {/* choices の閉じタグ */}
```

### 4.2 コードを挿入

`</div>` (choices) の直後、かつ `</div>` (question-card) の直前に挿入:

```tsx
      </div> {/* choices */}

      {/* カスタムセットに追加ボタン */}
      {onAddWordToCustomSet && 
       onRemoveWordFromCustomSet && 
       onOpenCustomSetManagement && 
       customQuestionSets && (
        <div className="mt-4 px-4">
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
    </div> {/* question-card */}
```

**✅ チェックポイント**: 
- インデントが正しい
- 閉じタグが対応している

---

## Step 5: ビルド確認 (5分)

### 5.1 TypeScriptコンパイル確認

```bash
npm run build
```

または

```bash
tsc --noEmit
```

**期待結果**: エラー0件

### 5.2 開発サーバー起動

```bash
npm run dev
```

**期待結果**: サーバーが正常に起動

**✅ チェックポイント**: ビルドエラーなし

---

## Step 6: ブラウザで動作確認 (10分)

### 6.1 基本表示確認

1. ブラウザで http://localhost:5173 を開く
1. QuizViewに移動
1. 問題カードを表示
1. AddToCustomButtonが表示されているか確認

### 6.2 機能テスト

**テスト1: ボタンが見える**
- [ ] ボタンが表示されている
- [ ] 適切な位置に配置されている

**テスト2: クリックできる**
- [ ] ボタンをクリックできる
- [ ] メニューが開く (セットが複数ある場合)

**テスト3: 追加/削除**
- [ ] セットに追加できる
- [ ] セットから削除できる
- [ ] ボタンの色が変わる (追加済みの場合は緑)

**テスト4: セット管理**
- [ ] セット管理画面が開く

**✅ チェックポイント**: すべてのテストがパス

---

## Step 7: レスポンシブ確認 (5分)

### 7.1 デスクトップ表示

- [ ] レイアウトが崩れていない
- [ ] ボタンが適切なサイズ

### 7.2 モバイル表示

ブラウザの開発者ツール(F12)でモバイルモードに切り替え:

- [ ] ボタンが表示されている
- [ ] タップできる
- [ ] 他の要素と重なっていない

**✅ チェックポイント**: 全デバイスで表示OK

---

## Step 8: ダークモード確認 (3分)

### 8.1 ダークモード切り替え

アプリのダークモードボタンをクリック:

- [ ] ボタンの色が適切
- [ ] テキストが読みやすい
- [ ] 背景とのコントラストが十分

**✅ チェックポイント**: ダークモードでも見やすい

---

## Step 9: エッジケーステスト (10分)

### 9.1 セット数による挙動確認

**セットが0個の場合:**
- [ ] ボタンをクリック → セット管理画面が開く

**セットが1個の場合:**
- [ ] ボタンをクリック → 直接追加/削除される
- [ ] メニューは開かない

**セットが複数の場合:**
- [ ] ボタンをクリック → メニューが開く
- [ ] 各セットの追加/削除ができる

### 9.2 状態遷移テスト

1. 問題に回答する
1. ボタンをクリックしてセットに追加
1. 次の問題に移動
1. 前の問題に戻る
1. ボタンの状態が保持されているか確認

**✅ チェックポイント**: すべてのエッジケースで正常動作

---

## Step 10: 最終チェック (5分)

### 10.1 コンソールエラー確認

ブラウザの開発者ツール(F12)のConsoleタブ:
- [ ] エラーなし
- [ ] 警告なし (重要なもの)

### 10.2 TypeScriptエラー確認

```bash
npm run lint
```

- [ ] エラー0件
- [ ] 警告が増えていない

### 10.3 コミット前チェック

- [ ] 不要なconsole.logを削除
- [ ] コメントを適切に追加
- [ ] インデントが正しい
- [ ] 不要なインポートがない

**✅ チェックポイント**: すべてクリーン

---

## 🎉 完了！

以上で実装完了です。以下のコマンドで変更を保存:

```bash
git add src/components/QuestionCard.tsx
git commit -m "feat: QuestionCardにカスタムセット機能を追加"
```

---

## ❌ トラブルシューティング

### 問題1: TypeScriptエラーが出る

**症状**: CustomWord型に関するエラー

**解決策**:
```bash
# 型定義を確認
cat src/types/customQuestions.ts | grep "interface CustomWord"
```

必須フィールドをすべて満たしているか確認。

### 問題2: ボタンが表示されない

**症状**: ブラウザでボタンが見えない

**解決策**:
1. propsが親から渡されているか確認
1. 条件分岐がすべて満たされているか確認
1. ブラウザのコンソールでエラーを確認

### 問題3: レイアウトが崩れる

**症状**: ボタンが変な位置に表示される

**解決策**:
1. 挿入位置を再確認
1. classNameを調整 (例: `mt-4` → `mt-2`)
1. 親要素のFlexbox設定を確認

### 問題4: クリックしても反応しない

**症状**: ボタンをクリックしても何も起きない

**解決策**:
1. onAddWord等の関数がpropsで渡されているか確認
1. ブラウザコンソールでエラーを確認
1. イベントハンドラーが正しく設定されているか確認

---

## 📚 参考資料

- [詳細実装計画](./questioncard-custom-set-implementation-plan.md)
- AddToCustomButtonコンポーネント: `src/components/AddToCustomButton.tsx`
- CustomWord型定義: `src/types/customQuestions.ts`
- 参照実装:
  - QuizView: `src/components/QuizView.tsx`
  - MemorizationView: `src/components/MemorizationView.tsx`
  - ComprehensiveReadingView: `src/components/ComprehensiveReadingView.tsx`

---

**推定所要時間**: 60-70分  
**難易度**: ⭐⭐☆☆☆ (中級)
