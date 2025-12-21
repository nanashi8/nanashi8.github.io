# UI変更禁止仕様書

## 📋 概要

このドキュメントは、AIアシスタントがUI修正を行う際に**絶対に変更してはならない仕様**を定義します。
これらの仕様は、ユーザー体験とアプリケーションの一貫性を保つために厳守する必要があります。

## 🔒 絶対に変更してはならない仕様

### 1. カラーシステム 🎨

#### ✅ 必須ルール

- **すべての色指定は必ずCSS変数を使用する**
- **ハードコードされた色コード（`#ffffff`, `rgb()`, `white`等）の使用は絶対禁止**
- **ライトモード・ダークモード両方に対応する**
- **ユーザーの明示的な指示なくUIの色を変更してはならない**

#### 🌙 ダークモード専用ルール

**背景色**

- 背景は**黒っぽい色**（`#1a1a1a`, `#2a2a2a`等）
- メイン背景: `--background` (ダークモード: `#1a1a1a`)
- セカンダリ背景: `--bg-secondary` (ダークモード: `#2a2a2a`)

**文字色**

- 基本文字色は**白色**（`#e0e0e0`, `#ffffff`等）
- メインテキスト: `--text-color` (ダークモード: `#e0e0e0`)
- セカンダリテキスト: `--text-secondary` (ダークモード: `#b0b0b0`)

**色文字の使用制限**

- **カウント表示**や**カラーでなければ視覚効果が得られない場合のみ**使用可能
- 例: 正解数（緑）、不正解数（赤）、定着済（青）等
- 通常のテキストには色を付けない

**枠線・ボーダー**

- 明るいグレー（`#555555`, `#666666`等）
- `--border-color` (ダークモード: `#555555`)

**カード・コンポーネント**

- 黒っぽい背景と比較して見やすい色
- 背景より明るい色（`#2a2a2a`, `#3a3a3a`等）
- 適切なコントラスト比を確保

#### ❌ 禁止事項

```tsx
// ❌ 絶対禁止: ハードコードされた色
style={{ backgroundColor: '#ffffff' }}
style={{ color: 'black' }}
style={{ borderColor: 'rgb(255,255,255)' }}

// ❌ 禁止: ユーザーの指示なしに色を変更
// 既存のCSS変数の値を勝手に変更してはならない

// ✅ 正しい: CSS変数を使用
style={{ backgroundColor: 'var(--background)' }}
style={{ color: 'var(--text-color)' }}
style={{ borderColor: 'var(--border-color)' }}
```

#### 📚 参照ドキュメント

- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) - カラーシステム詳細
- [UI_DEVELOPMENT_GUIDELINES.md](./UI_DEVELOPMENT_GUIDELINES.md) - UI開発ガイドライン
- [18-dark-mode.md](../specifications/18-dark-mode.md) - ダークモード実装仕様

---

### 2. ScoreBoard（スコアボード）表示 📊

#### ✅ 必須仕様

**タブ構成（モード別）**

- **和訳・スペルタブ**: プラン → 状況 → 履歴 → 設定
- **文法・長文タブ**: プラン → 状況 → 設定（履歴タブなし）

**プラン表示内容（全モード共通）**

```
1行目: 📚 問題集 | 分野 | 難易度 | [単語・熟語フィルター※]
2行目: 定着済: X | 学習中: Y [/上限] | 要復習: Z [/上限] [⚙️※]
```

※和訳・スペルタブのみ表示

**モバイル版タブラベル**

- プラン: 📋 プラン
- 状況: 📈 状況
- 履歴: 📜 履歴（和訳・スペルのみ）
- 設定: ⚙️ 設定

#### ❌ 禁止事項

- タブの順序変更
- プラン表示を簡易版に変更（全モードで詳細版を使用）
- モード別の表示内容を統一しない変更

#### 📚 参照コード

- `src/components/ScoreBoard.tsx` (Lines 118-291)

---

### 3. 語句詳細表示 📖

#### ✅ 必須仕様

**表示項目と順序**

1. 語句: `{word}`
1. 読み: `{reading}`
1. **意味: `{meaning}`** ← 必須（読みの次に表示）
1. 📚 語源等: `{etymology}`
1. 🔗 関連語: `{relatedWords}`
1. 🏷️ 分野: `{relatedFields}`
1. 難易度: `{difficulty}`

**回答後の動作**

- 選択肢をタップ → **全ての選択肢の詳細を一括開閉**
- いずれか開いている → タップで全て閉じる
- 全て閉じている → タップで全て開く

**回答前の動作**

- 選択肢をタップ → 個別に開閉

#### ❌ 禁止事項

- 意味フィールドの削除・非表示
- 表示順序の変更
- 回答後の一括開閉動作の削除

#### 📚 参照コード

- `src/components/QuestionCard.tsx` (Lines 66-91, 424-457)

---

### 4. question-nav-row（問題ナビゲーション） 🧭

#### ✅ 必須仕様

**スタイル設定**

```css
.question-text {
  font-size: 28px; /* 単語フォントサイズ */
}

.question-nav-row {
  padding: 6px;
  margin-bottom: 10px;
}
```

#### ❌ 禁止事項

- フォントサイズを28px未満に変更
- padding/marginを元の値（10px/15px）に戻す

#### 📚 参照コード

- `src/styles/themes/dark.css` (Lines 1407-1419, 3196-3207)

---

### 5. 非同期処理とScoreBoard更新 ⚡

#### ✅ 必須仕様

**スキップ機能の実装**

```typescript
const handleSkip = async () => {
  // 1. recordWordSkipを await
  await recordWordSkip(currentQuestion.word, 30);

  // 2. updateWordProgressを await
  await updateWordProgress(currentQuestion.word, true, responseTime, undefined, 'translation');

  // 3. その他の処理...

  // 4. addQuizResultを await
  await addQuizResult({...});

  // 5. 最後にScoreBoard更新トリガー
  setLastAnswerTime(Date.now());
};
```

**重要ポイント**

- `recordWordSkip`, `updateWordProgress`, `addQuizResult` は**必ず await する**
- `setLastAnswerTime` は**全ての非同期処理完了後**に呼ぶ
- **遅延（setTimeout）は使用しない**

#### ❌ 禁止事項

- 非同期関数を await せずに呼び出す
- setLastAnswerTime を非同期処理完了前に呼ぶ
- setTimeout 等の遅延を使用してタイミングを調整

#### 📚 参照コード

- `src/App.tsx` (handleSkip関数: Lines 1138-1207)
- `src/progressStorage.ts` (recordWordSkip: Lines 1320-1348)

---

### 6. レスポンシブデザイン 📱

#### ✅ 必須仕様

**ブレークポイント**

- モバイル: `768px` 以下
- デスクトップ: `768px` 超

**モバイル最適化**

- タブはアイコン+ラベル形式
- フォントサイズ・余白の調整
- タッチターゲットサイズ: 最小 44px × 44px

#### ❌ 禁止事項

- ブレークポイントの変更
- モバイル版の削除・簡略化
- デスクトップ版のみの最適化

---

### 7. データ構造の整合性 🗄️

#### ✅ 必須仕様

**Word型の必須フィールド**

```typescript
interface Word {
  word: string;
  reading: string;
  meaning: string; // 必須
  etymology: string;
  relatedWords: string;
  relatedFields: string;
  difficulty: string;
}
```

#### ❌ 禁止事項

- 必須フィールドの削除
- 型定義の変更（後方互換性なし）

#### 📚 参照ドキュメント

- [15-data-structures.md](../specifications/15-data-structures.md)

---

## 🔧 変更可能な範囲

以下は、要件に応じて変更可能です：

### ✅ 許可される変更

1. **新機能の追加**（既存機能を壊さない範囲）
1. **パフォーマンス最適化**（表示・動作に影響しない）
1. **バグ修正**（仕様に準拠）
1. **アクセシビリティ向上**（aria属性追加等）
1. **CSS変数の値調整**（ライト・ダーク両モード対応）

### ⚠️ 慎重に判断が必要な変更

1. **レイアウト変更** → ユーザーに確認
1. **新しいCSS変数追加** → 必ずライト・ダーク両方定義
1. **既存コンポーネントの大幅な書き換え** → 仕様確認後に実施

---

## 📝 変更時のチェックリスト

UI修正を行う前に、必ず以下を確認してください：

- [ ] カラーはCSS変数のみ使用しているか？
- [ ] ライトモード・ダークモード両方で動作確認したか？
- [ ] **ダークモードの色ルール（黒背景・白文字・明るいグレー枠線）に準拠しているか？**
- [ ] **色文字はカウント・視覚効果必須の場所のみに使用しているか？**
- [ ] **ユーザーの指示なしに色を変更していないか？**
- [ ] ScoreBoardのタブ構成は正しいか？
- [ ] 語句詳細に意味が表示されるか？
- [ ] 非同期処理は正しく await されているか？
- [ ] モバイル表示は適切か？
- [ ] 既存の仕様を破壊していないか？

---

## 🚨 仕様違反を見つけた場合

既存コードで本ドキュメントの仕様に違反している箇所を発見した場合：

1. **即座にユーザーに報告**
1. 修正提案を行う
1. ユーザーの承認後に修正

**絶対に**: 自己判断で仕様を変更しない

---

## 📚 関連ドキュメント

### 必読

- [UI_DEVELOPMENT_GUIDELINES.md](./UI_DEVELOPMENT_GUIDELINES.md) - UI開発全般
- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) - デザインシステム
- [AI_WORKFLOW_INSTRUCTIONS.md](../references/AI_WORKFLOW_INSTRUCTIONS.md) - AI作業手順

### 参考

- [17-styling.md](../specifications/17-styling.md) - スタイリング仕様
- [18-dark-mode.md](../specifications/18-dark-mode.md) - ダークモード詳細
- [15-data-structures.md](../specifications/15-data-structures.md) - データ構造
- [02-translation-quiz.md](../specifications/02-translation-quiz.md) - 和訳クイズ仕様
- [03-spelling-quiz.md](../specifications/03-spelling-quiz.md) - スペルクイズ仕様

---

## 📅 ドキュメント情報

- **作成日**: 2025年11月30日
- **最終更新**: 2025年11月30日
- **バージョン**: 1.0.0
- **ステータス**: 有効

---

## ⚖️ このドキュメントの優先順位

本ドキュメントに記載された仕様は、**他のドキュメントより優先されます**。
矛盾する記述がある場合は、ユーザーに確認してください。
