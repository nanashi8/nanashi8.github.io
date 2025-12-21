---
title: 18. ダークモード実装仕様書
created: 2025-11-22
updated: 2025-12-05
status: in-progress
tags: [specification, dark-mode]
---

# 18. ダークモード実装仕様書

## 🌙 概要

ダークモードは、目の疲労を軽減し、夜間の学習を快適にするための機能です。ライト/ダーク/システム自動の3モードをサポートし、ユーザーの好みに応じて切り替えが可能です。

---

## 🎯 機能仕様

### 1. モード切り替え

```typescript
type DarkModeOption = 'light' | 'dark' | 'system';

const handleDarkModeChange = (mode: DarkModeOption) => {
  setDarkMode(mode);
  localStorage.setItem('darkMode', mode);
  applyDarkMode(mode);
};
```

### 2. システム設定の検出

```typescript
const applyDarkMode = (mode: DarkModeOption) => {
  let isDark = false;
  if (mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = mode === 'dark';
  }
  document.documentElement.classList.toggle('dark-mode', isDark);
};
```

### 3. システム設定変更の監視

```typescript
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (darkMode === 'system') {
      applyDarkMode('system');
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, [darkMode]);
```

### 4. CSS変数

```css
.dark-mode {
  --background: #1e1e1e;
  --text-primary: #e0e0e0;
  --border: #444;
}
```

---

## 📚 関連ドキュメント

- [06. 設定画面](./06-settings.md) - モード切り替えUI
- [17. スタイリング仕様](./17-styling.md) - カラーパレット
