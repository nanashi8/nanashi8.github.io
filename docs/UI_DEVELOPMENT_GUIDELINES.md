# UI開発ガイドライン

## 概要

このドキュメントは、本プロジェクトでUIコンポーネントを開発・変更する際の必須要件とベストプラクティスをまとめたものです。

## 必須要件

### 1. ダークモード対応 🌓

**すべてのUI変更・新規コンポーネントは必ずダークモードに対応する必要があります。**

#### 実装方法

```tsx
// ✅ 推奨: CSS変数を使用
const MyComponent = () => (
  <div style={{
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-color)'
  }}>
    コンテンツ
  </div>
);

// ❌ 非推奨: ハードコードされた色
const BadComponent = () => (
  <div style={{
    backgroundColor: '#ffffff',
    color: '#000000'
  }}>
    コンテンツ
  </div>
);
```

#### CSS変数の使用

```css
/* グローバルCSS変数 (src/index.css) */
:root {
  /* ライトモード */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #dddddd;
  --accent-color: #007bff;
  --success-color: #28a745;
  --error-color: #dc3545;
}

[data-theme="dark"] {
  /* ダークモード */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border-color: #404040;
  --accent-color: #4a9eff;
  --success-color: #4caf50;
  --error-color: #f44336;
}
```

#### チェックリスト

UI変更時には以下を確認してください:

- [ ] すべての背景色がCSS変数を使用している
- [ ] すべてのテキスト色がCSS変数を使用している
- [ ] すべてのボーダー・アウトラインがCSS変数を使用している
- [ ] ホバー・フォーカス状態もダークモード対応している
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
  variant = 'primary'
}) => {
  return (
    <div className={`my-component my-component--${variant}`}>
      <h2 className="my-component__title">{title}</h2>
      <button
        className="my-component__button"
        onClick={onAction}
        aria-label={`${title}を実行`}
      >
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
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
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
[data-theme="dark"] {
  --text-primary: #999999; /* ❌ コントラスト比低い */
}

/* 適切 */
[data-theme="dark"] {
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
[data-theme="dark"] img {
  filter: brightness(0.8);
}

/* または画像を切り替え */
.logo {
  content: url('/logo-light.png');
}

[data-theme="dark"] .logo {
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
