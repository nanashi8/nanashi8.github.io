---
title: UI開発ガイドライン
created: 2025-11-19
updated: 2025-12-07
status: in-progress
tags: [development, ai, dark-mode]
---

# UI開発ガイドライン

## 概要

このドキュメントは、本プロジェクトでUIコンポーネントを開発・変更する際の必須要件とベストプラクティスをまとめたものです。

## 📚 関連ドキュメント

- **[DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)** - カラーシステムの詳細ルール・自動チェック方法
- [17-styling.md](./17-styling.md) - スタイリング全般
- [18-dark-mode.md](./18-dark-mode.md) - ダークモード実装詳細

## 必須要件

### 1. ライトモード・ダークモード対応 🌓

**すべてのUI変更・新規コンポーネントは必ずライトモード・ダークモード両方に対応する必要があります。**

#### ⚠️ 重要な原則

**色の指定は必ずCSS変数を使用してください。直接色コード（`#ffffff`、`rgb()`、`white`など）を記述することは禁止です。**

このプロジェクトでは、包括的なCSS変数システムを採用しており、ライトモード・ダークモードの切り替えは以下の仕組みで自動的に行われます：

1. **ライトモード（デフォルト）**: `src/index.css`で定義された70+のCSS変数が適用
1. **ダークモード**: `documentElement`に`.dark-mode`クラスが追加され、`src/App.css`の`.dark-mode`セレクタ内で定義された変数がオーバーライド
1. **切り替え**: ユーザーが設定タブで切り替えると、全要素の色が自動的に変更

#### 実装方法

```tsx
// ✅ 正しい: CSS変数を使用
const MyComponent = () => (
  <div
    style={{
      backgroundColor: 'var(--background)',
      color: 'var(--text-color)',
      borderColor: 'var(--border-color)',
    }}
  >
    コンテンツ
  </div>
);

// ❌ 間違い: ハードコードされた色（絶対に使用禁止）
const BadComponent = () => (
  <div
    style={{
      backgroundColor: '#ffffff', // ダメ！
      color: '#000000', // ダメ！
      borderColor: 'white', // ダメ！
    }}
  >
    コンテンツ
  </div>
);
```

#### CSS変数の使用

```css
/* 基本変数 (src/index.css で定義、.dark-mode で自動オーバーライド) */

/* 背景色 */
--background: ライトモード時は #ffffff、ダークモード時は #1a1a1a --bg-secondary: ライトモード時は
  #f8f9fa、ダークモード時は #2a2a2a --bg-tertiary: ライトモード時は #e9ecef、ダークモード時は
  #3a3a3a /* テキスト色 */ --text-color: ライトモード時は #333333、ダークモード時は #e0e0e0
  --text-secondary: ライトモード時は #666666、ダークモード時は #b0b0b0
  --text-tertiary: ライトモード時は #999999、ダークモード時は #888888 /* ボーダー */
  --border-color: ライトモード時は #dddddd、ダークモード時は #555555 /* ボタン */
  --btn-primary-bg: ライトモード時は #667eea、ダークモード時は #8b9ef5
  --btn-primary-text: ライトモード時は #ffffff、ダークモード時は #ffffff
  --btn-primary-hover: ライトモード時は #5568d3、ダークモード時は #7a8de4 /* セマンティックカラー */
  --success-color: #28a745（両モードで共通、必要に応じてオーバーライド） --error-color: #dc3545
  --warning-color: #ffc107 --info-color: #17a2b8;
```

#### 利用可能なCSS変数の完全リスト

詳細は`src/index.css`を参照してください。主要な変数：

**基本色**

- `--text-color`: メインテキスト
- `--text-secondary`: サブテキスト
- `--text-tertiary`: 補助テキスト・プレースホルダー
- `--background`: メイン背景
- `--bg-secondary`: セカンダリ背景（カード等）
- `--bg-tertiary`: ターシャリ背景（ホバー状態等）
- `--border-color`: ボーダー・区切り線

**ボタン**

- `--btn-primary-bg`: プライマリボタン背景
- `--btn-primary-text`: プライマリボタンテキスト
- `--btn-primary-hover`: プライマリボタンホバー
- `--btn-secondary-bg`: セカンダリボタン背景
- `--btn-secondary-text`: セカンダリボタンテキスト

**セマンティック**

- `--success-color/bg/border/text`: 成功状態
- `--error-color/bg/border/text`: エラー状態
- `--warning-color/bg/border/text`: 警告状態
- `--info-color/bg/border/text`: 情報表示

**UI要素**

- `--card-bg/border/shadow`: カード
- `--shadow-sm/md/lg`: 影
- `--overlay-bg`: オーバーレイ
- `--link-color/hover`: リンク

#### CSS変数の追加・変更時の注意

**新しい色を追加する場合は、必ず両方のファイルを更新してください：**

1. **`src/index.css`**: ライトモード用の値を`:root`に追加
1. **`src/App.css`**: ダークモード用の値を`.dark-mode`に追加

```css
/* src/index.css */
:root {
  --new-color: #your-light-value;
}

/* src/App.css */
.dark-mode {
  --new-color: #your-dark-value;
}
```

#### チェックリスト

UI変更・追加時には以下を確認してください:

- [ ] すべての背景色が`var(--background)`や`var(--bg-secondary)`等のCSS変数を使用している
- [ ] すべてのテキスト色が`var(--text-color)`や`var(--text-secondary)`等のCSS変数を使用している
- [ ] すべてのボーダー・アウトラインが`var(--border-color)`等のCSS変数を使用している
- [ ] ボタンは`var(--btn-primary-bg)`等の専用変数を使用している
- [ ] ホバー・フォーカス・アクティブ状態もCSS変数を使用している
- [ ] 直接色コード（`#ffffff`、`rgb()`、`white`等）を一切使用していない
- [ ] ライトモードとダークモードの両方で動作確認済み
- [ ] ライトモードで視覚的に確認した
- [ ] ダークモードで視覚的に確認した
- [ ] コントラスト比がアクセシビリティ基準を満たしている

### 2. レスポンシブデザイン 📱

すべてのUIは以下のデバイスで正しく表示される必要があります:

- デスクトップ (1024px以上)
- タブレット (768px-1023px)
- モバイル (320px-767px)

#### ブレークポイント

```css
/* モバイル優先アプローチ */
.component {
  /* モバイルデフォルト */
  padding: 1rem;
}

@media (min-width: 768px) {
  /* タブレット */
  .component {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  /* デスクトップ */
  .component {
    padding: 2rem;
  }
}
```

### 3. アクセシビリティ ♿

#### 必須項目

- セマンティックHTMLの使用 (`<button>`, `<nav>`, `<main>`, など)
- キーボード操作のサポート
- スクリーンリーダー対応 (ARIAラベル)
- 適切なコントラスト比 (WCAG AA基準)

```tsx
// ✅ 良い例
<button
  onClick={handleClick}
  aria-label="クイズを開始"
  className="start-button"
>
  開始
</button>

// ❌ 悪い例
<div onClick={handleClick}>開始</div>
```

### 4. パフォーマンス ⚡

- 不要な再レンダリングを避ける (`React.memo`, `useMemo`, `useCallback`)
- 大きな画像は最適化する
- 遅延読み込み (lazy loading) を適切に使用する

## コンポーネント開発フロー

### 1. 設計

- [ ] コンポーネントの責務を明確にする
- [ ] Propsインターフェースを定義する
- [ ] 状態管理の方法を決定する

### 2. 実装

```tsx
import React from 'react';
import './MyComponent.css';

interface MyComponentProps {
  title: string;
  onAction: () => void;
  variant?: 'primary' | 'secondary';
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction,
  variant = 'primary',
}) => {
  return (
    <div className={`my-component my-component--${variant}`}>
      <h2 className="my-component__title">{title}</h2>
      <button className="my-component__button" onClick={onAction} aria-label={`${title}を実行`}>
        実行
      </button>
    </div>
  );
};
```

### 3. スタイリング

```css
/* MyComponent.css */
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 8px;
}

.my-component__title {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.my-component__button {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.my-component__button:hover {
  opacity: 0.9;
}

.my-component__button:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

.my-component--secondary .my-component__button {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

### 4. テスト

- [ ] ライトモードで表示確認
- [ ] ダークモードで表示確認
- [ ] モバイルで表示確認
- [ ] タブレットで表示確認
- [ ] デスクトップで表示確認
- [ ] キーボード操作確認
- [ ] スクリーンリーダー確認

## ダークモード切り替えの実装

### テーマコンテキスト

```tsx
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### テーマ切り替えボタン

```tsx
// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`${theme === 'light' ? 'ダーク' : 'ライト'}モードに切り替え`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
```

```css
/* ThemeToggle.css */
.theme-toggle {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background-color: var(--bg-primary);
  transform: scale(1.1);
}

.theme-toggle:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}
```

## よくある問題と解決策

### 問題1: ダークモードで読みにくい

**原因**: コントラスト比が不十分

**解決策**:

```css
/* 不十分 */
[data-theme='dark'] {
  --text-primary: #999999; /* ❌ コントラスト比低い */
}

/* 適切 */
[data-theme='dark'] {
  --text-primary: #e0e0e0; /* ✅ コントラスト比十分 */
}
```

### 問題2: インライン スタイルが切り替わらない

**原因**: インラインスタイルに直接色を指定している

**解決策**:

```tsx
// ❌ 悪い
<div style={{ backgroundColor: '#ffffff' }}>

// ✅ 良い
<div style={{ backgroundColor: 'var(--bg-primary)' }}>
```

### 問題3: 画像がダークモードで見づらい

**解決策**:

```css
[data-theme='dark'] img {
  filter: brightness(0.8);
}

/* または画像を切り替え */
.logo {
  content: url('/logo-light.png');
}

[data-theme='dark'] .logo {
  content: url('/logo-dark.png');
}
```

## コードレビューチェックリスト

レビュアーは以下を確認してください:

- [ ] CSS変数が適切に使用されている
- [ ] ハードコードされた色値がない
- [ ] ライトモード・ダークモード両方で表示確認済み
- [ ] レスポンシブデザインが実装されている
- [ ] アクセシビリティ要件を満たしている
- [ ] セマンティックHTMLが使用されている
- [ ] ARIAラベルが適切に設定されている
- [ ] キーボード操作が可能
- [ ] パフォーマンスへの配慮がある

## 参考リンク

- [MDN: CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Inclusive Components](https://inclusive-components.design/)

## 更新履歴

- 2025-11-19: 初版作成
