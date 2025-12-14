# 🚨 絶対厳守ルール - AI実装時の必読事項

## ⛔ 絶対禁止事項

### 1. ダークモード関連の実装禁止

**現在の方針: ダークモードは使用しない**

```tsx
// ❌ 絶対禁止 - dark:プレフィックスを使用してはいけない
<div className="bg-white dark:bg-gray-800">
<button className="text-gray-900 dark:text-gray-100">

// ✅ 正解 - ライトモードのみ
<div className="bg-white">
<button className="text-gray-900">
```

**理由:**
- ダークモード機能は再開発の余地として残しているが、現在は使用しない
- 将来的に必要になれば、ユーザーからの明示的な指示の下で再実装する

**違反時のペナルティ:**
- 即座にrevert
- コミット拒否

### 2. ユーザー指示なしの勝手な実装禁止

**禁止行為:**
- ユーザーが要求していない機能を追加する
- 「改善」と称して勝手に変更する
- 「ベストプラクティス」を理由に構造を変える

**許可される行動:**
- ユーザーの明確な指示に従う
- 構文エラーやTypeScriptエラーの修正
- 明らかなバグの修正

### 3. レイアウトの無断変更・最適化の絶対禁止

**🚫 最も重要: レイアウト変更はユーザーの明確な指示がない限り禁止**

**禁止される変更（例）:**
```tsx
// ❌ ユーザーの指示なしにこれらを変更してはいけない

// 1. Flexbox/Grid レイアウトの変更
<div className="flex flex-col"> → <div className="grid grid-cols-2"> // ❌
<div className="gap-4"> → <div className="gap-6"> // ❌

// 2. Positioning の変更
<div className="relative"> → <div className="absolute"> // ❌
<div className="top-4"> → <div className="top-8"> // ❌

// 3. Spacing の変更
<div className="p-4"> → <div className="p-6"> // ❌
<div className="space-y-2"> → <div className="space-y-4"> // ❌

// 4. Width/Height の変更
<div className="w-full"> → <div className="w-1/2"> // ❌
<div className="h-auto"> → <div className="h-screen"> // ❌

// 5. Display の変更
<div className="block"> → <div className="inline-block"> // ❌
```

**許可される場合（限定的）:**
- ✅ ユーザーが「レイアウトを変更してください」と明示的に指示
- ✅ ユーザーが具体的な変更内容を指定（「flexをgridに変更」等）
- ✅ 新規作成のコンポーネント（既存UIへの影響なし）

**禁止される「最適化」の例:**
```
❌ 「レイアウトを最適化しました」
❌ 「より効率的なグリッドレイアウトに変更」
❌ 「レスポンシブ対応を改善しました」
❌ 「スペーシングを調整しました」
```

**理由:**
1. 既存UIはユーザー体験のため調整済み
2. 無断の最適化は意図しない副作用を引き起こす
3. レスポンシブ対応（モバイル/タブレット）に影響
4. アクセシビリティ（視認性、操作性）が変わる
5. 他のコンポーネントとの整合性が崩れる

**違反時のペナルティ:**
- 🚨 即座にrevert（変更を元に戻す）
- ⛔ コミット拒否（pre-commitフックで検出）
- 📋 ユーザーへの確認を求めるメッセージ

### 4. CSS変数・スタイルの勝手な変更禁止

**禁止:**
```css
/* ❌ 指示なしにこれらを変更してはいけない */
- border-radius
- font-size, line-height
- color, background-color
- animation, transition
```

**許可:**
- ユーザーが明示的に指示した変更のみ
- 明らかなバグ（要素が見えない、レイアウト崩れ）の修正

## ✅ 必須確認事項

### 実装前チェックリスト

コードを書く前に、以下を**必ず**確認:

- [ ] ユーザーから明示的な指示があるか？
- [ ] `dark:`クラスを追加していないか？
- [ ] 既存のスタイル・レイアウトを変更していないか？
- [ ] 「改善」「最適化」を理由に勝手な変更をしていないか？
- [ ] ドキュメントの方針に従っているか？

### 実装後チェックリスト

- [ ] `dark:`で検索して、追加していないことを確認
- [ ] CSS変更がユーザー指示通りか確認
- [ ] 不要な「改善」を含んでいないか確認

## 🛡️ 保護機構

### 自動チェック

1. **pre-commit hook** - コミット前にチェック
2. **TypeScript** - 型エラーを検出
3. **ESLint** - コードスタイルをチェック
4. **Prettier** - フォーマットを統一

### 手動チェック手順

```bash
# dark:クラスが含まれていないか確認
git diff | grep "dark:"

# 変更したファイルを確認
git status

# 変更内容を確認
git diff
```

## 📋 違反例と正解例

### 例1: タブデザインの統一

**❌ 間違った実装:**
```tsx
// ユーザーが要求していないのにdark:を追加
className="bg-primary text-white dark:bg-gray-800 dark:text-gray-300"
```

**✅ 正しい実装:**
```tsx
// ユーザーの指示通り、ライトモードのみ
className="bg-primary text-white"
```

### 例2: カードコンポーネント

**❌ 間違った実装:**
```tsx
// 「ベストプラクティス」を理由にdark:を追加
<div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
```

**✅ 正しい実装:**
```tsx
// 指示通り、シンプルにライトモードのみ
<div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
```

### 例3: テキストスタイル

**❌ 間違った実装:**
```tsx
// 勝手にダークモード対応を追加
<p className="text-gray-700 dark:text-gray-300">
```

**✅ 正しい実装:**
```tsx
// 必要なスタイルのみ
<p className="text-gray-700">
```

## 🔥 緊急対応

### もしダークモードクラスを追加してしまったら

1. **即座に削除**
```bash
# dark:クラスをすべて検索
grep -r "dark:" src/components/

# sedで一括削除（例）
sed -i '' 's/ dark:bg-[a-z-0-9]*//g' src/components/*.tsx
sed -i '' 's/ dark:text-[a-z-0-9]*//g' src/components/*.tsx
sed -i '' 's/ dark:border-[a-z-0-9]*//g' src/components/*.tsx
```

2. **変更を確認**
```bash
git diff
```

3. **ユーザーに報告**
「申し訳ありません。誤ってdark:クラスを追加してしまいました。削除しました。」

## 📚 関連ドキュメント

- `.ai-instructions/css-modification-rules.md` - CSS修正ルール
- `.copilot-instructions.md` - 基本的な指示
- `DARK_MODE_GUIDE.md` - ダークモード仕様（現在は使用しない）

## 🎯 行動原則

1. **ユーザーの指示を最優先する**
2. **勝手な「改善」はしない**
3. **迷ったら確認する**
4. **間違えたら即座に修正して報告する**

---

**このルールを守れないAIは、このプロジェクトで作業してはいけません。**
