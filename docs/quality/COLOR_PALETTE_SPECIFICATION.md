# 22色カラーパレット仕様書

## 概要

本仕様書は、アプリケーション全体で使用する色を**22色に限定**し、UI一貫性・アクセシビリティ・メンテナンス性を向上させるための標準規格です。

**業界標準準拠**: Material Design、Bootstrap、Tailwind CSSのベストプラクティスに基づく構成

---

## 1. 基本テキスト色（5色）

| CSS変数 | 色コード | 用途 | WCAG AA準拠 |
|---------|---------|------|-------------|
| `--text-color` | `#333333` | 本文・見出し・主要テキスト | ✅ 白背景で12.6:1 |
| `--text-secondary` | `#666666` | サブテキスト・補足情報 | ✅ 白背景で5.7:1 |
| `--text-tertiary` | `#999999` | 薄いテキスト・非活性状態 | ⚠️ 白背景で2.8:1 (背景色限定) |
| `--white` | `#ffffff` | 白テキスト・明るい背景 | ✅ |
| `--black` | `#000000` | 黒テキスト・濃い背景 | ✅ |

**使用例:**
```css
/* 本文 */
color: var(--text-color);

/* サブテキスト */
color: var(--text-secondary);

/* ダークモード白テキスト */
color: var(--white);
```

---

## 2. 状態色（4色）

### 2.1 成功（緑系）

| CSS変数 | 色コード | 用途 |
|---------|---------|------|
| `--success-color` | `#10b981` | 成功アイコン・ボタン・枠線 |
| `--success-bg` | `#d1fae5` | 成功メッセージ背景 |
| `--success-text` | `#065f46` | 成功メッセージテキスト |

### 2.2 エラー（赤系）

| CSS変数 | 色コード | 用途 |
|---------|---------|------|
| `--error-color` | `#ef4444` | エラーアイコン・ボタン・枠線 |
| `--error-bg` | `#fee2e2` | エラーメッセージ背景 |
| `--error-bg-hover` | `#fecaca` | エラーボタンホバー |
| `--error-text` | `#991b1b` | エラーメッセージテキスト |

### 2.3 警告（黄・オレンジ系）

| CSS変数 | 色コード | 用途 |
|---------|---------|------|
| `--warning-color` | `#f59e0b` | 警告アイコン・ボタン・枠線 |
| `--warning-bg` | `#fff3cd` | 警告メッセージ背景 |
| `--warning-text` | `#78350f` | 警告メッセージテキスト |

### 2.4 情報（青系）

| CSS変数 | 色コード | 用途 |
|---------|---------|------|
| `--info-color` | `#2196f3` | 情報アイコン・ボタン・枠線 |
| `--info-bg` | `#e7f3ff` | 情報メッセージ背景 |
| `--info-text` | `#0056b3` | 情報メッセージテキスト |
| `--info-blue` | `#60a5fa` | 明るい青（ハイライト） |

---

## 3. アクセント色（3色）

| CSS変数 | 色コード | 用途 |
|---------|---------|------|
| `--accent-blue` | `#3b82f6` | アクセント（青） |
| `--accent-red` | `#f44336` | アクセント（赤） |
| `--accent-purple` | `#9c27b0` | アクセント（紫） |

---

## 4. グレースケール（9色）

| CSS変数 | 色コード | 明度 | 用途 |
|---------|---------|------|------|
| `--gray-100` | `#f8f9fa` | 最明 | 背景・カードホバー |
| `--gray-200` | `#e9ecef` | 明 | 背景・セクション区切り |
| `--gray-300` | `#e0e0e0` | 中明 | 枠線・区切り線 |
| `--gray-400` | `#cccccc` | 中 | 枠線（強調） |
| `--gray-500` | `#aaaaaa` | 中暗 | 非活性ボタン |
| `--gray-600` | `#999999` | 暗 | サブテキスト |
| `--gray-700` | `#666666` | 濃 | テキスト（secondary） |
| `--gray-800` | `#444444` | 最濃 | テキスト（濃いめ） |
| `--gray-900` | `#333333` | 最暗 | 本文テキスト |

---

## 5. プライマリ色（1色）

| CSS変数 | 色コード | 用途 |
|---------|---------|------|
| `--btn-primary-bg` | `#667eea` | プライマリボタン背景 |
| `--btn-primary-light` | `#8b9ef5` | プライマリボタンホバー |

---

## 使用規則

### ✅ 必須ルール

1. **直接色指定禁止**: `color: #333;` ではなく `color: var(--text-color);` を使用
1. **22色限定**: 上記22色以外の色は使用禁止
1. **グラデーション禁止**: `linear-gradient` は使用禁止（単色のみ）
1. **コントラスト遵守**: WCAG AA基準（4.5:1以上）を満たす組み合わせのみ使用

### ✅ 推奨パターン

```css
/* 本文テキスト */
color: var(--text-color);

/* サブテキスト */
color: var(--text-secondary);

/* 成功メッセージ */
background: var(--success-bg);
color: var(--success-text);
border: 1px solid var(--success-color);

/* エラーメッセージ */
background: var(--error-bg);
color: var(--error-text);
border: 1px solid var(--error-color);

/* ダークモード */
.dark-mode {
  background: var(--gray-900);
  color: var(--white);
}
```

### ❌ 禁止パターン

```css
/* NG: 直接色指定 */
color: #333333;
background: #f8f9fa;

/* NG: 22色外の色 */
color: #abc123;

/* NG: グラデーション */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* NG: RGB/RGBA指定 */
color: rgb(51, 51, 51);
background: rgba(255, 255, 255, 0.5);
```

---

## アクセシビリティ基準

### WCAG AA準拠の組み合わせ例

| 背景色 | テキスト色 | コントラスト比 | 判定 |
|--------|-----------|--------------|------|
| `--white` | `--text-color` | 12.6:1 | ✅ AAA |
| `--white` | `--text-secondary` | 5.7:1 | ✅ AA |
| `--white` | `--text-tertiary` | 2.8:1 | ❌ 不合格 |
| `--gray-900` | `--white` | 15.8:1 | ✅ AAA |
| `--success-bg` | `--success-text` | 7.2:1 | ✅ AAA |
| `--error-bg` | `--error-text` | 8.1:1 | ✅ AAA |

---

## 検証方法

### 自動検証（パイプライン）

```bash
# 22色準拠検証
python scripts/validate_color_palette.py

# 出力例
[✓] 22色パレット準拠検証
  - 直接色指定: 0件
  - 22色外の色: 0件
  - グラデーション: 0件
  ✓ 全て22色パレットに準拠しています
```

### 手動検証

```bash
# 直接色指定を検索
grep -r "color: #" src --include="*.css"

# 22色外の色を検索
grep -rE "color: #[0-9a-fA-F]{3,6}" src --include="*.css" | grep -v "var(--"
```

---

## 移行ガイド

### 80色→22色マッピング

詳細は `color-mapping.md` を参照

**主要な置き換え例:**

| 旧色コード | 新CSS変数 | 備考 |
|-----------|----------|------|
| `#333333` | `var(--text-color)` | 本文 |
| `#666666` | `var(--text-secondary)` | サブテキスト |
| `#999999` | `var(--text-tertiary)` | 薄いテキスト |
| `#10b981` | `var(--success-color)` | 成功 |
| `#ef4444` | `var(--error-color)` | エラー |
| `#f59e0b` | `var(--warning-color)` | 警告 |
| `#2196f3` | `var(--info-color)` | 情報 |
| `#9e9e9e` | `var(--gray-500)` | グレー |

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-01 | 1.0.0 | 初版作成・22色パレット定義 |

---

## 参考資料

- [Material Design Color System](https://material.io/design/color)
- [Bootstrap Colors](https://getbootstrap.com/docs/5.0/customize/color/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
