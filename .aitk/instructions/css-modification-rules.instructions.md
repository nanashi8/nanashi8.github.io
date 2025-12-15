---
description: CSS修正ルール - レイアウト・デザイン変更の厳格な制限
applyTo: '**/*.css,**/*.tsx,**/*.jsx'
priority: HIGH
---

# CSS修正ルール

## 🚫 絶対禁止事項

### ユーザーの明示的な指示なしに変更してはならないもの

1. **レイアウト構造**
   - `flex`, `grid`, `block`, `inline-block`
   - `flex-col`, `flex-row`, `grid-cols-*`
   - `gap-*`, `space-*`

2. **配置・位置**
   - `relative`, `absolute`, `fixed`, `sticky`
   - `top-*`, `left-*`, `right-*`, `bottom-*`
   - `z-*`

3. **サイズ**
   - `w-*`, `h-*`, `max-w-*`, `min-h-*`
   - `text-*` (フォントサイズ)

4. **余白**
   - `m-*`, `p-*`（大幅な変更）

5. **デザイン要素**
   - `border-radius`
   - `transition`, `animation`
   - 要素の配置

---

## ⚠️ レイアウト変更が危険な理由

1. **既存UIは調整済み**
   - ユーザー体験のため最適化されている
   - 無断変更は意図しない副作用を引き起こす

2. **レスポンシブ対応への影響**
   - モバイル/タブレット/デスクトップで動作検証済み
   - 変更により特定デバイスで崩れる可能性

3. **アクセシビリティへの影響**
   - 視認性、操作性が調整されている
   - 変更により使いづらくなる可能性

4. **他コンポーネントとの整合性**
   - デザインシステムとして統一されている
   - 個別変更は全体の一貫性を崩す

---

## ✅ 許可される修正

### 1. ダークモード専用の色変更（ユーザー指示時のみ）

```css
/* ✅ OK: ダークモード専用スコープ */
.dark-mode .element {
  background: var(--gray-900);
  color: var(--gray-100);
}

/* ❌ NG: ライトモードに影響 */
.element {
  background: var(--gray-900);
}
```

### 2. バグ修正

```typescript
// ✅ OK: TypeScriptエラー修正
className="text-gray-900" // 以前: className="text-gray-900

// ✅ OK: 構文エラー修正
```

### 3. 機能不全の修正

```css
/* ✅ OK: 表示されない要素の修正 */
display: block; /* 以前: display: none; (意図しないhidden) */
```

---

## 🎨 ダークモード色ガイドライン

### 背景色
- **主背景**: `var(--gray-950)` または `var(--gray-900)`（黒っぽく）
- **副背景**: `var(--gray-900)` または `var(--gray-800)`
- **カード背景**: `var(--gray-900)` または `var(--gray-800)`

### 文字色
- **主文字**: `var(--gray-100)` または `var(--white)`（明るく）
- **副文字**: `var(--gray-200)` または `var(--gray-300)`
- **弱調文字**: `var(--gray-400)`

### ボーダー
- **通常**: `var(--gray-700)` または `var(--gray-800)`
- **強調**: `var(--gray-600)`

### アクセントカラー
- **成功**: `var(--success-color)` (緑系)
- **エラー**: `var(--error-color)` (赤系)
- **警告**: `var(--warning-color)` (黄系)
- **情報**: `var(--info-color)` (青系)

---

## 📋 修正前のチェックリスト

```markdown
CSS修正を行う前に、以下を確認してください:

□ ユーザーから「CSSを変更してください」という明示的な指示がある
□ レイアウト構造を変更していない（flex, grid, gap等）
□ サイズ・余白を大幅に変更していない
□ ダークモードの場合、.dark-modeスコープ内で変更している
□ ライトモードに影響を与えていない
□ 既存のコメント・仕様を確認した
```

---

## 🚨 違反例と修正例

### 違反例1: レイアウト構造の無断変更

```tsx
// ❌ 禁止
// Before
<div className="flex flex-col gap-4">

// After（無断変更）
<div className="grid grid-cols-2 gap-6">
```

**修正**: 元に戻す

### 違反例2: ライトモードへの影響

```css
/* ❌ 禁止 */
.button {
  background: var(--gray-900); /* ライトモードでも適用されてしまう */
}
```

**修正**:
```css
/* ✅ OK */
.dark-mode .button {
  background: var(--gray-900);
}
```

### 違反例3: サイズの大幅変更

```tsx
// ❌ 禁止
<div className="w-96 h-96"> // 以前: w-full h-auto
```

**修正**: 元に戻す（ユーザーに確認）

---

## 🛡️ 安全な修正手順

### 1. 色のみの変更（ダークモード）

```css
/* Step 1: .dark-modeスコープを確認 */
.dark-mode .card {
  /* Step 2: 色のみ変更 */
  background: var(--gray-900); /* 変更 */
  color: var(--gray-100); /* 変更 */
  
  /* Step 3: レイアウトは変更しない */
  /* display, flex, grid, gap, margin, padding等は触らない */
}
```

### 2. バグ修正

```typescript
// Step 1: エラー内容を確認
// Step 2: 最小限の修正
// Step 3: 他への影響を確認
```

---

## 📚 関連ドキュメント

- [仕様書遵守強制ルール](./specification-enforcement.instructions.md) - 変更禁止の詳細
- [DESIGN_FREEZE.md](../../docs/design/DESIGN_FREEZE.md) - デザインフリーズ宣言
- [COLOR_PALETTE_SPECIFICATION.md](../../docs/quality/COLOR_PALETTE_SPECIFICATION.md) - カラーパレット仕様

---

**重要**: このルールに従わない修正は、即座にrevertされます。

**最終更新**: 2025-12-15
**優先度**: HIGH
