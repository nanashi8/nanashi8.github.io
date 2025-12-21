---
title: デザインシステムルール
created: 2025-11-25
updated: 2025-12-07
status: in-progress
tags: [development, ai, dark-mode]
---

# デザインシステムルール

## 概要

このドキュメントは、UI開発時に遵守すべきデザインルールを定義します。すべてのAI支援開発およびコードレビューにおいて、これらのルールへの準拠を自動チェックする必要があります。

## 🎨 カラーシステムの原則

### 基本ルール

**❌ 禁止事項:**

- ハードコードされた色の使用（`#ffffff`, `rgb()`, `white`, `black`等）
- ライトモード専用またはダークモード専用の色指定
- 直接色指定によるスタイル適用

**✅ 必須事項:**

- すべての色はCSS変数経由で指定
- ライトモード・ダークモード両方への対応
- セマンティックな色変数の使用

### ライトモード・ダークモードの色定義

#### ライトモード（デフォルト）

```css
/* src/index.css の :root で定義 */

/* 基本文字色 */
--text-color: #333333; /* メイン文字色: 黒に近いダークグレー */
--text-secondary: #666666; /* サブ文字色: ミディアムグレー */
--text-tertiary: #999999; /* 補助文字色: ライトグレー */

/* 基本背景色 */
--background: #ffffff; /* メイン背景: 白 */
--bg-secondary: #f8f9fa; /* セカンダリ背景: オフホワイト */
--bg-tertiary: #e9ecef; /* ターシャリ背景: ライトグレー */

/* ボーダー・区切り線 */
--border-color: #dddddd; /* ボーダー: ライトグレー */

/* 基本ボタン */
--btn-primary-bg: #667eea; /* プライマリボタン背景: 紫 */
--btn-primary-text: #ffffff; /* プライマリボタン文字: 白 */
--btn-primary-hover: #5568d3; /* プライマリボタンホバー: 濃い紫 */
```

#### ダークモード

```css
/* src/App.css の .dark-mode で定義 */

/* 基本文字色 */
--text-color: #e0e0e0; /* メイン文字色: 白に近いライトグレー */
--text-secondary: #b0b0b0; /* サブ文字色: ミディアムグレー */
--text-tertiary: #888888; /* 補助文字色: グレー */

/* 基本背景色 */
--background: #1a1a1a; /* メイン背景: ダークグレー（ほぼ黒） */
--bg-secondary: #2a2a2a; /* セカンダリ背景: ダークグレー */
--bg-tertiary: #3a3a3a; /* ターシャリ背景: ミディアムグレー */

/* ボーダー・区切り線 */
--border-color: #555555; /* ボーダー: ダークグレー */

/* 基本ボタン */
--btn-primary-bg: #8b9ef5; /* プライマリボタン背景: 明るい紫 */
--btn-primary-text: #ffffff; /* プライマリボタン文字: 白 */
--btn-primary-hover: #7a8de4; /* プライマリボタンホバー: 紫 */
```

### コントラスト比の要件

#### ライトモード

- 背景: 白 `#ffffff`
- メイン文字: ダークグレー `#333333`（コントラスト比: 12.63:1 ✅ AAA）
- サブ文字: ミディアムグレー `#666666`（コントラスト比: 5.74:1 ✅ AA）
- 補助文字: ライトグレー `#999999`（コントラスト比: 2.85:1 ⚠️ 最小サイズのみ）

#### ダークモード

- 背景: ダークグレー `#1a1a1a`
- メイン文字: ライトグレー `#e0e0e0`（コントラスト比: 12.09:1 ✅ AAA）
- サブ文字: グレー `#b0b0b0`（コントラスト比: 7.24:1 ✅ AAA）
- 補助文字: グレー `#888888`（コントラスト比: 4.26:1 ✅ AA）

## 🚫 禁止パターン

### 1. 直接色指定

```css
/* ❌ 絶対に禁止 */
.component {
  background: #ffffff;
  color: #000000;
  border: 1px solid #ddd;
}

.dark-mode .component {
  background: #1a1a1a;
  color: #ffffff;
}
```

```css
/* ✅ 正しい方法 */
.component {
  background: var(--background);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}
```

### 2. モード別の重複スタイル

```css
/* ❌ 避けるべきパターン */
.button {
  background: var(--bg-secondary);
}

.dark-mode .button {
  background: var(--bg-secondary); /* 同じCSS変数なら不要 */
}
```

```css
/* ✅ 正しい方法 */
.button {
  background: var(--bg-secondary); /* CSS変数が自動的にモードに応じて変化 */
}
```

### 3. グレー系の暗い色の直接使用

```css
/* ❌ ライトモードで暗いグレーを直接指定（視認性低下） */
.template-btn {
  background: #6c757d; /* ダークグレー - ライトモードで見づらい */
}

.btn-skip-word:hover {
  background: #757575; /* ダークグレー - ライトモードで見づらい */
}
```

```css
/* ✅ 正しい方法 */
.template-btn {
  background: #9e9e9e; /* ライトモード: 明るいグレー */
}

.dark-mode .template-btn {
  background: #6c757d; /* ダークモード: 暗いグレー */
}

/* または専用のCSS変数を作成 */
:root {
  --btn-secondary-bg: #9e9e9e;
}

.dark-mode {
  --btn-secondary-bg: #6c757d;
}

.template-btn {
  background: var(--btn-secondary-bg);
}
```

## ✅ 推奨パターン

### 1. セマンティックなCSS変数の使用

```css
/* 用途が明確な変数名 */
--success-bg: #d4edda;
--success-text: #155724;
--error-bg: #f8d7da;
--error-text: #721c24;
--warning-bg: #fff3cd;
--warning-text: #856404;
```

### 2. モードに応じた適切な色選択

```tsx
// コンポーネント内での使用
const MessageBox = ({ type, children }) => (
  <div
    style={{
      backgroundColor: `var(--${type}-bg)`,
      color: `var(--${type}-text)`,
      border: `1px solid var(--${type}-border)`,
    }}
  >
    {children}
  </div>
);
```

### 3. 段階的な背景色の使用

```css
/* 深度を表現するために3段階の背景色を使用 */
.page {
  background: var(--background); /* レベル0: ページ背景 */
}

.card {
  background: var(--bg-secondary); /* レベル1: カード背景 */
}

.card-section {
  background: var(--bg-tertiary); /* レベル2: カード内セクション */
}
```

## 📋 チェックリスト

### UI実装時の必須確認項目

#### 色の使用

- [ ] すべての`background`プロパティがCSS変数を使用
- [ ] すべての`color`プロパティがCSS変数を使用
- [ ] すべての`border-color`プロパティがCSS変数を使用
- [ ] `#ffffff`, `#000000`, `white`, `black`等の直接指定が存在しない
- [ ] グレー系の色（`#[0-9][0-9][0-9][0-9][0-9][0-9]`）が直接指定されていない

#### モード対応

- [ ] ライトモードで視覚的に確認済み
- [ ] ダークモードで視覚的に確認済み
- [ ] 両モードで文字が読みやすい
- [ ] 両モードで背景と文字のコントラストが十分
- [ ] 両モードでボタンやリンクが識別可能
- [ ] 両モードでホバー・フォーカス状態が明確

#### CSS変数の定義

- [ ] 新しいCSS変数は`src/index.css`の`:root`に定義
- [ ] 新しいCSS変数は`src/App.css`の`.dark-mode`にも定義
- [ ] 変数名がセマンティックで用途が明確
- [ ] 既存の変数で代用できないか確認済み

## 🔍 自動チェックのためのパターン

### grep検索パターン

```bash
# 直接色指定の検索（禁止）
grep -rn "background.*#[0-9a-fA-F]\{6\}" src/**/*.css | grep -v "dark-mode"
grep -rn "color.*#[0-9a-fA-F]\{6\}" src/**/*.css | grep -v "dark-mode" | grep -v "border-color"

# 暗い色の直接使用（警告）
grep -rn "background.*#[0-4][0-9a-fA-F]\{5\}" src/**/*.css | grep -v "dark-mode"

# white/black の直接使用（禁止）
grep -rn ":\s*white\|:\s*black" src/**/*.css | grep -v "dark-mode"
```

## 🎯 例外ケース

### 許可される直接色指定

以下のケースでは、直接色指定が許可されます:

1. **グラデーション内の色**（両モードで同じ場合）

   ```css
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   ```

1. **セマンティックカラー**（ブランドカラー等、モードで変えない場合）

   ```css
   --primary-color: #667eea; /* 両モードで共通のブランドカラー */
   ```

1. **特定の機能色**（成功・エラー等、認識しやすさ優先）

   ```css
   --success-base: #28a745; /* 緑は両モードで認識しやすい */
   --error-base: #dc3545; /* 赤は両モードで認識しやすい */
   ```

1. **`.dark-mode`セレクタ内での色指定**
   ```css
   .dark-mode .component {
     background: #2a2a2a; /* ダークモード専用スタイルなので許可 */
   }
   ```

## 📚 参考ドキュメント

- **UI開発ガイドライン**: `docs/UI_DEVELOPMENT_GUIDELINES.md`
- **CSS変数定義（ライトモード）**: `src/index.css`
- **CSS変数定義（ダークモード）**: `src/App.css`（`.dark-mode`セクション）
- **スタイリング全般**: `docs/17-styling.md`
- **ダークモード実装**: `docs/18-dark-mode.md`

## 🔄 更新履歴

| 日付       | バージョン | 内容                                                |
| ---------- | ---------- | --------------------------------------------------- |
| 2025-11-25 | 1.0.0      | 初版作成。ライトモード/ダークモードの基本ルール定義 |
