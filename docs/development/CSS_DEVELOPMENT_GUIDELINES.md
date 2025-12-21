# CSS開発ガイドライン

**最終更新**: 2025年12月2日  
**対象**: 英語学習アプリ (nanashi8.github.io)

---

## 📋 目次

1. [概要](#概要)
1. [CSS構造](#css構造)
1. [命名規約（BEM）](#命名規約bem)
1. [CSS変数の使用](#css変数の使用)
1. [禁止事項](#禁止事項)
1. [開発フロー](#開発フロー)
1. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### 原則
- **段階的改善**: 既存12,000行のCSSは急激にリファクタしない
- **手動優先**: 自動化ツールはレイアウト破壊リスクが高いため、手動編集を基本とする
- **新規コードのみBEM**: 既存CSSは触らず、新規コンポーネントからBEM命名を適用
- **CSS変数必須**: ハードコード値の使用を禁止し、必ずCSS変数を使う

### 現状
- **総行数**: 約12,000行（`dark.css`: 12,255行、`variables.css`: 500+行）
- **主要ファイル**:
  - `src/styles/themes/dark.css` - ダークモードテーマ
  - `src/styles/variables.css` - CSS変数定義（100+変数）
  - `src/styles/global.css` - グローバルスタイル
- **重複削減**: 2025年12月2日に18の重複ルール（82行）を手動削除済み

---

## CSS構造

### ディレクトリ構成

```
src/styles/
├── variables.css          # CSS変数定義（色、スペーシング、タイポグラフィ）
├── global.css             # グローバルスタイル
├── themes/
│   └── dark.css          # ダークモードテーマ（12,255行）
└── components/           # 🆕 今後追加するコンポーネント専用CSS
    └── [component-name].css
```

### 既存CSSの扱い

**⚠️ 重要: 既存CSSファイルは可能な限り触らない**

- `dark.css`、`global.css`などの既存ファイルは修正リスクが高い
- 明らかな重複のみ、手動で慎重に削除
- 大規模リファクタは行わない（レイアウト破壊リスク）

---

## 命名規約（BEM）

### BEM基本

**Block__Element--Modifier** 形式を採用

```css
/* ❌ 既存コード（そのまま残す） */
.quiz-card { }
.answer-button { }
.quiz-card .title { }

/* ✅ 新規コード（BEM命名） */
.quiz-card { }
.quiz-card__title { }
.quiz-card__answer-button { }
.quiz-card__answer-button--correct { }
.quiz-card__answer-button--incorrect { }
```

### 命名パターン

#### Block（ブロック）
独立した意味を持つコンポーネント

```css
.quiz-card { }
.stats-panel { }
.navigation-bar { }
```

#### Element（要素）
ブロック内の部品（`__`で接続）

```css
.quiz-card__header { }
.quiz-card__body { }
.quiz-card__footer { }
.stats-panel__title { }
.stats-panel__value { }
```

#### Modifier（修飾子）
状態やバリエーション（`--`で接続）

```css
.quiz-card--active { }
.quiz-card--disabled { }
.quiz-card__answer-button--correct { }
.stats-panel__value--positive { }
.stats-panel__value--negative { }
```

### 適用例

#### ❌ 悪い例（既存コード）
```css
/* セレクタのネスト */
.quiz-container .card .button {
  background: blue;
}

.quiz-container .card .button:hover {
  background: darkblue;
}

.quiz-container .card.active .button {
  background: green;
}
```

#### ✅ 良い例（新規BEMコード）
```css
/* フラットなセレクタ */
.quiz-card__submit-button {
  background-color: var(--color-primary);
}

.quiz-card__submit-button:hover {
  background-color: var(--color-primary-dark);
}

.quiz-card--active .quiz-card__submit-button {
  background-color: var(--color-success);
}
```

---

## CSS変数の使用

### 必須ルール

**🚫 ハードコード値の使用禁止**

```css
/* ❌ NG: ハードコード */
.new-component {
  color: #ffffff;
  background: #1a1a1a;
  padding: 16px;
  font-size: 14px;
  border-radius: 8px;
}

/* ✅ OK: CSS変数を使用 */
.new-component {
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-md);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}
```

### 主要CSS変数

`src/styles/variables.css`で定義された変数を使用:

#### 色

```css
/* テキスト */
--color-text: #e0e0e0;
--color-text-secondary: #a0a0a0;
--color-text-muted: #808080;

/* 背景 */
--color-bg: #121212;
--color-bg-secondary: #1e1e1e;
--color-bg-elevated: #2a2a2a;

/* アクセントカラー */
--color-primary: #4a9eff;
--color-success: #4caf50;
--color-warning: #ff9800;
--color-error: #f44336;
```

#### スペーシング

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

#### タイポグラフィ

```css
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-bold: 700;
```

#### その他

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;

--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

### 新規CSS変数の追加

新しい値が必要な場合:

1. `src/styles/variables.css`に追加
1. 命名規則に従う（`--category-property-variant`）
1. コメントで用途を明記

```css
/* カスタムボーダー色（例） */
--color-border-highlight: #4a9eff; /* フォーカス時のボーダー色 */
```

---

## 禁止事項

### ❌ 絶対にやってはいけないこと

1. **自動化ツールでのCSS変更**
   ```bash
   # ❌ 使用禁止（レイアウト破壊リスク）
   python scripts/deduplicate_css.py
   python scripts/replace_css_vars.py
   ```
   - 過去に2回レイアウト破壊を引き起こした実績あり
   - 手動での段階的変更のみ許可

1. **既存CSSの大規模リファクタ**
   - 既存12,000行のCSSは現状維持
   - 新規コンポーネントのみBEM適用

1. **ハードコード値の使用**
   ```css
   /* ❌ NG */
   color: #ffffff;
   padding: 16px;
   
   /* ✅ OK */
   color: var(--color-text);
   padding: var(--spacing-md);
   ```

1. **重複セレクタの作成**
   ```css
   /* ❌ NG: 同じセレクタを2箇所に定義 */
   .dark-mode .quiz-card { background: black; }
   /* ... 100行後 ... */
   .dark-mode .quiz-card { padding: 16px; } /* 重複！ */
   ```

1. **深いネストの使用**
   ```css
   /* ❌ NG: 3階層以上のネスト */
   .container .wrapper .card .title { }
   
   /* ✅ OK: BEMでフラットに */
   .card__title { }
   ```

---

## 開発フロー

### 新規コンポーネント追加時

#### 1. CSSファイル作成

```bash
# コンポーネント専用CSSファイルを作成
touch src/styles/components/quiz-result-card.css
```

#### 2. BEM命名でCSS記述

```css
/* src/styles/components/quiz-result-card.css */

/* Block */
.quiz-result-card {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

/* Elements */
.quiz-result-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.quiz-result-card__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.quiz-result-card__score {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.quiz-result-card__body {
  margin-bottom: var(--spacing-md);
}

.quiz-result-card__stat-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

/* Modifiers */
.quiz-result-card--perfect .quiz-result-card__score {
  color: var(--color-success);
}

.quiz-result-card--failed .quiz-result-card__score {
  color: var(--color-error);
}
```

#### 3. TypeScriptコンポーネントでインポート

```tsx
// src/components/QuizResultCard.tsx
import '../styles/components/quiz-result-card.css';

interface QuizResultCardProps {
  score: number;
  totalQuestions: number;
  isPerfect?: boolean;
}

export function QuizResultCard({ score, totalQuestions, isPerfect }: QuizResultCardProps) {
  const percentage = (score / totalQuestions) * 100;
  
  return (
    <div className={`quiz-result-card ${isPerfect ? 'quiz-result-card--perfect' : ''}`}>
      <div className="quiz-result-card__header">
        <h2 className="quiz-result-card__title">クイズ結果</h2>
        <span className="quiz-result-card__score">{percentage}%</span>
      </div>
      <div className="quiz-result-card__body">
        <div className="quiz-result-card__stat-item">
          <span>正解数</span>
          <span>{score} / {totalQuestions}</span>
        </div>
      </div>
    </div>
  );
}
```

#### 4. ビルド確認

```bash
# 型チェック
npm run typecheck

# CSSリント
npm run lint:css

# ビルド
npm run build
```

#### 5. Simple Browserで目視確認

```bash
# 開発サーバー起動
npm run dev

# VS Code Simple Browser で http://localhost:5173 を開く
# Cmd+Shift+P → "Simple Browser: Show"
```

#### 6. コミット

```bash
git add src/styles/components/quiz-result-card.css
git add src/components/QuizResultCard.tsx
git commit -m "feat: add QuizResultCard component with BEM CSS"

# pre-commitフックで自動チェック:
# - TypeScript型チェック
# - CSSリント
# - ビルド検証
```

### 既存コンポーネント修正時

#### ✅ 安全な変更

- CSS変数の値変更（`variables.css`）
- 明らかなタイポ修正
- コメント追加

#### ⚠️ 慎重な変更（手動のみ）

1. **重複セレクタの削除**
   ```bash
   # 1. 該当箇所を特定
   grep -n ".dark-mode .quiz-card" src/styles/themes/dark.css
   
   # 2. ファイルを開いて目視確認
   code src/styles/themes/dark.css:1234
   
   # 3. 手動で重複を削除（後の定義を残す）
   
   # 4. ビルドで確認
   npm run build
   
   # 5. Simple Browserで目視確認
   npm run dev
   ```

1. **プロパティ値の変更**
   ```bash
   # 1箇所ずつ変更 → ビルド → 目視確認 → コミット
   ```

---

## トラブルシューティング

### レイアウトが崩れた場合

#### 即座にロールバック

```bash
# 変更を破棄
git checkout -- src/styles/themes/dark.css

# または直前のコミットに戻す
git reset --hard HEAD~1
```

#### 原因調査

1. **Chromeデベロッパーツールで確認**
   - 要素を選択して適用されているスタイルを確認
   - どのCSSルールが効いているか確認

1. **差分確認**
   ```bash
   git diff HEAD~1 src/styles/themes/dark.css
   ```

1. **ビルドログ確認**
   ```bash
   npm run build 2>&1 | tee build.log
   ```

### CSS変数が効かない場合

#### 変数が定義されているか確認

```bash
grep "variable-name" src/styles/variables.css
```

#### スコープ確認

```css
/* ✅ :root で定義（グローバル） */
:root {
  --color-primary: #4a9eff;
}

/* ❌ 特定セレクタ内（スコープ限定） */
.dark-mode {
  --color-primary: #4a9eff; /* .dark-mode 内でのみ有効 */
}
```

### 重複セレクタの見つけ方

```bash
# 特定セレクタの出現箇所を検索
grep -n "\.quiz-card {" src/styles/themes/dark.css

# 出現回数をカウント
grep -c "\.quiz-card {" src/styles/themes/dark.css
```

---

## チェックリスト

### 新規CSS追加時

- [ ] BEM命名規約に従っている
- [ ] CSS変数を使用している（ハードコード値なし）
- [ ] `src/styles/components/`に配置している
- [ ] `npm run build`が成功する
- [ ] Simple Browserで目視確認済み
- [ ] TypeScript型エラーなし
- [ ] CSSリントエラーなし

### 既存CSS修正時

- [ ] 変更箇所は1箇所のみ（段階的変更）
- [ ] ビルド成功を確認済み
- [ ] Simple Browserで目視確認済み
- [ ] 変更前にバックアップ取得（gitコミット）
- [ ] 自動化ツールは使用していない

---

## 参考資料

- [BEM公式サイト](https://en.bem.info/)
- [CSS Variables (MDN)](https://developer.mozilla.org/../Web/CSS/Using_CSS_custom_properties)
- [UI開発ガイドライン](./UI_DEVELOPMENT_GUIDELINES.md)
- [VS Code Simple Browser ガイド](../how-to/VS_CODE_SIMPLE_BROWSER_GUIDE.md)

---

**改訂履歴**:
- 2025-12-02: 初版作成（12,000行CSS、重複削除完了後）
