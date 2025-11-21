# 17. スタイリング仕様書

## 🎨 概要

本アプリケーションのCSSデザインシステムとスタイリング戦略を説明します。レスポンシブデザイン、カラーパレット、タイポグラフィ、コンポーネントスタイルなど、一貫したUIを実現するための規則を定義しています。

---

## 🎯 デザインシステム

### 1. カラーパレット

#### ライトモード

```css
:root {
  --primary-color: #2196f3;
  --primary-dark: #1976d2;
  --primary-light: #e3f2fd;
  
  --background: #ffffff;
  --background-secondary: #f9f9f9;
  --text-primary: #2c3e50;
  --text-secondary: #666;
  
  --border: #c0c0c0;
  --border-light: #ddd;
  
  --success: #4caf50;
  --error: #f44336;
  --warning: #ff9800;
}
```

#### ダークモード

```css
.dark-mode {
  --primary-color: #42a5f5;
  --background: #1e1e1e;
  --background-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --border: #444;
}
```

### 2. タイポグラフィ

```css
:root {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.17em; }
```

### 3. スペーシング

```css
.section { margin: 24px 0; }
.card { padding: 16px; }
.btn { padding: 12px 24px; }
```

### 4. レスポンシブデザイン

```css
@media (max-width: 768px) {
  .card { padding: 12px; }
  h1 { font-size: 1.5em; }
}
```

### 5. グラデーション背景

```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

---

## 📚 関連ドキュメント

- [18. ダークモード実装](./18-dark-mode.md) - テーマ切り替え詳細
