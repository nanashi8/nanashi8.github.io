---
description: 英語学習アプリ開発ガイド（AI開発アシスタント用）
applyTo: '**'
---

# 英語学習アプリ 開発指示書

このプロジェクトは、React + TypeScript で構築された英語学習アプリケーションです。
AI開発アシスタント（GitHub Copilot等）が開発支援する際の必須ガイドラインです。

---

## 📁 プロジェクト概要

- **技術スタック**: React 18 + TypeScript 5 + Vite 5
- **CSS**: 12,000行超（`dark.css`が主体）、BEM命名規約を新規コードから適用
- **テスト**: Playwright E2E
- **品質管理**: TypeScript + ESLint + Stylelint + Husky pre-commit hooks

---

## 🚨 **絶対に守るべき原則**

### 1. **CSS変更は極めて慎重に**

- ❌ **自動化ツールでのCSS変更は禁止**
  ```bash
  # ❌ 使用禁止（過去に2回レイアウト破壊）
  python scripts/deduplicate_css.py
  python scripts/replace_css_vars.py
  ```

- ✅ **CSS変更の正しい手順**:
  1. 1箇所ずつ手動で変更
  2. `npm run build` で確認
  3. Simple Browserで目視確認
  4. コミット

- 📖 **詳細**: `docs/CSS_DEVELOPMENT_GUIDELINES.md`

### 2. **新規コンポーネントはBEM命名**

```css
/* ✅ 新規コード */
.quiz-card { }
.quiz-card__title { }
.quiz-card__button { }
.quiz-card__button--primary { }
```

```css
/* ❌ 既存コードは触らない */
.quiz-container .card .button { }  /* そのまま残す */
```

### 3. **ハードコード値の使用禁止**

```css
/* ❌ NG */
color: #ffffff;
padding: 16px;

/* ✅ OK */
color: var(--color-text);
padding: var(--spacing-md);
```

### 4. **TypeScript型安全性の維持**

```tsx
// ✅ 型定義必須
interface Props {
  title: string;
  count: number;
}

// ❌ any型禁止
const data: any = getData();
```

### 5. **コミット前チェック必須**

```bash
# 必ず実行（pre-commitフックで自動実行）
npm run typecheck  # TypeScript型エラー0件
npm run lint:css   # CSSリントエラー0件
npm run build      # ビルド成功
```

---

## 📚 開発ガイドライン

### 必読ドキュメント

1. **CSS開発ガイドライン** (`docs/CSS_DEVELOPMENT_GUIDELINES.md`)
   - BEM命名規約
   - CSS変数の使用
   - 重複禁止ルール
   - 安全な変更手順

2. **TypeScript/React開発ガイドライン** (`docs/TYPESCRIPT_DEVELOPMENT_GUIDELINES.md`)
   - コンポーネント設計
   - Props型定義
   - 状態管理（useState, useReducer）
   - カスタムフック

3. **品質管理パイプライン** (`docs/QUALITY_PIPELINE.md`)
   - Git Hooks
   - CI/CD
   - テスト戦略
   - 品質基準

---

## 🛠️ 開発フロー

### 新規コンポーネント追加

```bash
# 1. 型定義作成（必要な場合）
touch src/types/feature.ts

# 2. コンポーネント作成
touch src/components/FeatureComponent.tsx

# 3. CSS作成（BEM命名）
touch src/styles/components/feature-component.css

# 4. チェック
npm run typecheck
npm run lint
npm run build

# 5. 目視確認
npm run dev
# Simple Browserで http://localhost:5173 を確認

# 6. コミット（pre-commitフック自動実行）
git add .
git commit -m "feat: add FeatureComponent"
```

### 既存コンポーネント修正

```bash
# 1. 変更（1箇所ずつ）
# ... コード編集 ...

# 2. 型チェック
npm run typecheck

# 3. ビルド確認
npm run build

# 4. 目視確認
npm run dev

# 5. コミット
git commit -m "fix: update component logic"
```

---

## 🎯 品質基準

### コミット可能条件（必須）

- ✅ TypeScriptエラー: **0件**
- ✅ ビルドエラー: **0件**
- ✅ CSSリントエラー: **0件**
- ✅ Pre-commit Hook: **成功**

### 推奨基準

- ESLint warnings: 最小化（現在56件→改善中）
- バンドルサイズ: 前回比+10%以内
- E2Eテスト: すべて成功

---

## 🧪 テスト実行

### スモークテスト（高速）

```bash
npm run test:smoke
# 約10秒、基本動作確認
```

### 完全E2Eテスト

```bash
npm run test:e2e
# 約30秒、全機能+ビジュアルリグレッション
```

### Smart Test（差分ベース）

```bash
./scripts/smart-test.sh
# Git差分から必要なテストのみ実行
```

---

## ⚙️ ファイル構成

```
src/
├── components/           # Reactコンポーネント
├── types/               # TypeScript型定義
├── hooks/               # カスタムフック（🆕 今後追加）
├── utils/               # ユーティリティ関数
├── styles/
│   ├── variables.css    # CSS変数（100+変数）
│   ├── global.css
│   ├── themes/
│   │   └── dark.css     # ダークモードテーマ（12,255行）
│   └── components/      # 🆕 新規コンポーネント専用CSS
└── data/                # CSVデータ
```

---

## 🔧 主要スクリプト

```json
{
  "dev": "vite",                    // 開発サーバー
  "build": "tsc -b && vite build",  // 本番ビルド
  "preview": "vite preview",        // ビルド結果プレビュー
  "typecheck": "tsc --noEmit",      // TypeScript型チェック
  "lint": "eslint .",               // ESLint実行
  "lint:css": "stylelint 'src/**/*.css'",  // CSS Lint
  "test:smoke": "playwright test tests/smoke.spec.ts",  // スモークテスト
  "test:e2e": "playwright test"     // 完全E2Eテスト
}
```

---

## 📝 コミットメッセージ規約

### フォーマット

```
<type>(<scope>): <subject>

<body>
```

### Type

- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `style`: CSS/スタイル変更
- `test`: テスト追加・修正
- `docs`: ドキュメント変更
- `chore`: ビルド・設定変更

### 例

```bash
git commit -m "feat(quiz): add multiple choice question component"
git commit -m "fix(css): remove duplicate .quiz-card selector"
git commit -m "refactor(types): improve QuizQuestion type definition"
```

---

## 🚫 やってはいけないこと

### 1. 既存CSSの大規模リファクタ

```bash
# ❌ 一度に100行変更
# ✅ 1箇所ずつ変更 → 確認 → コミット
```

### 2. 自動化ツールでのCSS変更

```bash
# ❌ スクリプトで一括置換
# ✅ 手動で1箇所ずつ
```

### 3. any型の使用

```tsx
// ❌
const data: any = fetchData();

// ✅
interface Data {
  id: string;
  value: number;
}
const data: Data = fetchData();
```

### 4. pre-commitフックのスキップ

```bash
# ❌ 緊急時以外は禁止
git commit --no-verify

# ✅ 正常なコミット
git commit -m "fix: update component"
```

---

## 🐛 トラブルシューティング

### レイアウトが崩れた

```bash
# 即座にロールバック
git checkout -- src/styles/themes/dark.css

# または
git reset --hard HEAD~1
```

### TypeScriptエラーが出る

```bash
# キャッシュクリア
rm -rf node_modules
npm install

# 型チェック
npm run typecheck
```

### ビルドが失敗する

```bash
# Viteキャッシュ削除
rm -rf node_modules/.vite dist

# 再ビルド
npm run build
```

---

## 📖 参考リソース

- [BEM公式](https://en.bem.info/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Playwright公式](https://playwright.dev/)
- [Vite公式](https://vitejs.dev/)

---

## 📌 重要な注意事項

### CSS変更時の教訓

**2025年11月**: 自動化ツールで2回レイアウト破壊  
- `deduplicate_css.py` → レイアウト崩壊 → rollback  
- `replace_css_vars.py` → レイアウト崩壊 → rollback

**教訓**:
1. CSS変更は手動のみ
2. 1箇所ずつ変更
3. 必ずビルド確認
4. Simple Browserで目視確認

### TypeScriptエラー削減の成果

- **開始時**: 11エラー
- **2025年12月2日**: **0エラー** ✅
- **段階的修正**: 1ファイルずつ慎重に対応

### 品質パイプライン導入成果

- **Pre-commit Hook**: 破壊的変更を事前検出
- **TypeScript + ESLint**: コード品質維持
- **Playwright E2E**: UI動作保証
- **CI/CD**: GitHub Actionsで自動検証

---

**最終更新**: 2025年12月2日  
**改訂履歴**:
- 2025-12-02: 初版作成（開発パイプライン確立後）
