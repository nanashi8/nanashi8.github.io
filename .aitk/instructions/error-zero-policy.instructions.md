---
description: エラー・警告ゼロポリシー（厳格な品質基準）
applyTo: '**'
---

# エラー・警告ゼロポリシー

**最終更新**: 2025年12月7日

---

## 🎯 基本方針

**すべてのエラー・警告を完全に解消する**

- ✅ 動作に影響するエラー → 即座に修正
- ✅ 動作に影響しないエラー → 必ず修正
- ✅ 警告 → 必ず修正
- ❌ 「動作に影響しないから放置」は禁止

---

## 📋 チェック対象

### 1. TypeScript エラー・警告

```bash
npm run typecheck
```

**完全解消必須:**
- 型エラー
- any型の使用
- 未使用変数（_プレフィックスで明示的に無視する場合を除く）
- 型推論の失敗
- importエラー

**目標:** 0エラー、0警告

### 2. ESLint エラー・警告

```bash
npm run lint
```

**完全解消必須:**
- コーディング規約違反
- 未使用変数・import
- React Hooksルール違反
- その他すべての警告

**設定:** `--max-warnings 0`（警告もエラーとして扱う）

### 3. CSS Lint エラー・警告

```bash
npm run lint:css
```

**完全解消必須:**
- CSS構文エラー
- プロパティ重複
- 命名規約違反
- その他すべての警告

### 4. Markdown Lint エラー・警告

```bash
npm run lint:md
```

**完全解消必須:**
- リスト番号スタイル不一致（MD029）
- テーブル列数不一致（MD056）
- リンクフラグメント無効（MD051）
- その他すべての警告

### 5. GitHub Actions 警告

**完全解消必須:**
- 環境変数コンテキスト警告
- 非推奨アクション使用
- セキュリティ警告
- その他すべての警告

### 6. ビルド警告

```bash
npm run build
```

**完全解消必須:**
- Viteビルド警告
- ブラウザコンソール警告
- パフォーマンス警告
- その他すべての警告

### 7. Python依存関係警告

**完全解消必須:**
- importエラー
- 未使用import
- 型ヒント警告
- その他すべての警告

**対象:** 開発ツールスクリプトも含む

---

## 🚫 禁止事項

### ❌ 警告の無視

```typescript
// ❌ 禁止
// @ts-ignore
// eslint-disable-next-line
```

**例外:** 正当な理由がある場合のみ、コメントで理由を明記

```typescript
// ✅ 許可（理由を明記）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 理由: 外部ライブラリの型定義が不完全なため
const data: any = externalLibrary.getData();
```

### ❌ 警告の放置

```bash
# ❌ 禁止
⚠️  3 warnings
# 「動作するからいいや」← 禁止
```

### ❌ --no-verifyの使用

```bash
# ❌ 緊急時以外禁止
git commit --no-verify
git push --no-verify
```

---

## ✅ コミット前チェックリスト

### 必須チェック項目

- [ ] VS Code問題パネル: **0エラー、0警告**
- [ ] `npm run typecheck`: **PASS**
- [ ] `npm run lint`: **PASS（0 warnings）**
- [ ] `npm run lint:css`: **PASS**
- [ ] `npm run build`: **SUCCESS（0 warnings）**
- [ ] ブラウザコンソール: **0エラー、0警告**

### 推奨チェック項目

- [ ] `npm run lint:md`: **PASS**
- [ ] GitHub Actions: **0 warnings**
- [ ] Python scripts: **0 import errors**

---

## 🔧 修正の優先順位

### 優先度1: ビルドブロッカー

- TypeScript型エラー
- ESLintエラー（max-warnings 0）
- CSSリントエラー
- ビルド失敗

→ **即座に修正**

### 優先度2: 品質低下

- 未使用変数・import
- any型の使用
- console.log残存
- 非推奨API使用

→ **同じPRで修正**

### 優先度3: 軽微な問題

- マークダウンリスト番号
- コメントの誤字
- コーディングスタイル統一

→ **別PRまたは同時修正**

---

## 📊 品質メトリクス

### 目標値

| メトリクス | 目標 | 現状 |
|-----------|------|------|
| TypeScriptエラー | 0件 | 0件 ✅ |
| ESLint警告 | 0件 | 0件 ✅ |
| CSSエラー | 0件 | 0件 ✅ |
| Markdown警告 | 0件 | 2件 🟡 |
| ビルド警告 | 0件 | 0件 ✅ |

### 測定方法

```bash
# すべてのチェックを一括実行
npm run quality:check

# 個別チェック
npm run typecheck && \
npm run lint && \
npm run lint:css && \
npm run lint:md && \
npm run build
```

---

## 🎓 教訓

### 過去の失敗例

1. **TypeScript any型放置** → 実行時エラー発生
1. **未使用変数放置** → コードが肥大化、可読性低下
1. **マークダウン警告放置** → ドキュメント品質低下
1. **ビルド警告放置** → パフォーマンス問題発生

### 成功事例

1. **TypeScriptエラー完全解消** → バグ検出率向上
1. **ESLint導入** → コード品質安定化
1. **pre-commitフック** → 問題の早期発見
1. **CI/CD統合** → 自動品質チェック

---

## 🚀 実践ガイド

### 開発フロー

```bash
# 1. 開発開始前
git pull
npm install

# 2. 開発中（随時確認）
npm run typecheck
npm run lint:errors-only  # エラーのみチェック

# 3. コミット前（必須）
npm run quality:check  # エラーのみチェック
git add .
git commit -m "..."
# pre-commitフックが自動実行

# 4. 定期的な警告チェック（推奨）
npm run quality:strict  # エラー + 警告チェック

# 5. プッシュ前（必須）
npm run test:smart
git push
# pre-pushフックが自動実行
```

### エラー修正フロー（段階的アプローチ）

```bash
# 段階1: エラーのみ修正（必須）
npm run lint:errors-only
# → エラーを修正

# 段階2: TypeScriptエラー修正（必須）
npm run typecheck
# → VSCode問題パネルで確認 → 修正

# 段階3: CSSエラー修正（必須）
npm run lint:css:fix

# 段階4: マークダウンエラー修正（推奨）
npm run lint:md

# 段階5: 警告修正（推奨、段階的に）
npm run quality:strict
# → 警告を1つずつ修正

# 6. 再確認
npm run quality:check
# → すべてPASSを確認

# 7. コミット
git add .
git commit -m "fix: エラー・警告を解消"
```

### 段階的な品質向上

1. **Phase 1（必須）**: エラーのみ解消
   - TypeScriptエラー → 0件
   - ESLintエラー → 0件
   - CSSエラー → 0件
   - ビルドエラー → 0件

2. **Phase 2（推奨）**: 重要な警告解消
   - any型使用 → 型定義追加
   - 未使用変数 → 削除または_プレフィックス
   - console.log → 削除または環境変数制御

3. **Phase 3（目標）**: すべての警告解消
   - ESLint警告 → 0件
   - マークダウン警告 → 0件
   - ビルド警告 → 0件

---

## 📚 参考資料

- [TypeScript公式](https://www.typescriptlang.org/)
- [ESLint公式](https://eslint.org/)
- [Stylelint公式](https://stylelint.io/)
- [markdownlint公式](https://github.com/DavidAnson/markdownlint)

---

**重要:** このポリシーは品質維持のために厳格に運用します。
「動作に影響しない」という理由でのエラー放置は認めません。
