---
description: 英語学習アプリ開発ガイド（AI開発アシスタント用）
applyTo: '**'
---

# 英語学習アプリ 開発指示書

このプロジェクトは、React + TypeScript で構築された英語学習アプリケーションです。
AI開発アシスタント（GitHub Copilot等）が開発支援する際の必須ガイドラインです。

---

## ⚠️ 最優先: リファクタリング安全ガイドライン

**リファクタリング作業を行う際は、必ず `.aitk/instructions/refactoring-safety.instructions.md` を参照してください。**

2025年12月11日に発生した重大事故（src/ディレクトリ完全消失）を防ぐため、以下を徹底:
- チェックポイント作成必須
- 段階的実装（1機能 = 1コミット）
- ビルド確認後にコミット
- 大量ファイル操作の禁止（10ファイル以上は分割）

詳細: [refactoring-safety.instructions.md](./.aitk/instructions/refactoring-safety.instructions.md)

---

## 📁 プロジェクト概要

- **技術スタック**: React 18 + TypeScript 5 + Vite 5
- **CSS**: 12,000行超（`dark.css`が主体）、BEM命名規約を新規コードから適用
- **テスト**: Playwright E2E
- **品質管理**: TypeScript + ESLint + Stylelint + Husky pre-commit hooks

---

## 🚨 **絶対に守るべき原則**

### 0. **ユーザー報告を最優先し、実装確認を徹底する（最優先）**

- ✅ **ユーザーが「実装されていない」「表示されない」と報告した場合の対応手順**
  1. **即座に実際のコードを確認する**（推測で回答しない）
  2. **表示条件を全て確認する**（if文、三項演算子、論理演算子、`&&`など）
  3. **propsの受け渡しチェーンを追跡する**（親→子コンポーネント全て）
  4. **関連する全てのファイルを確認する**（1ファイルだけで判断しない）
  5. **状態管理を確認する**（useState、useEffectの依存配列など）
  
- ❌ **絶対に行わないこと（禁止事項）**
  - 「実装されているはずです」という推測での回答
  - コードを確認せずに「既に存在しています」と答える
  - 一部のコードだけ見て全体を判断する
  - ユーザーの報告を疑う前に自分の確認不足を疑う
  - 「ブラウザのキャッシュをクリアしてください」だけで済ませる

- 📖 **過去の失敗例と教訓**:
  - **2025-12-10: 文法タブの学習設定問題**
    - ユーザー報告: 「学年、単元、出題形式を選ぶ機能が喪失している」
    - AI回答: 「実装されているはずです」「既に存在しています」
    - 実際の問題:
      1. GrammarQuizViewに`study-settings-panel`のコードは存在
      2. しかし`{showSettings && ...}`の条件が満たされず表示されない
      3. ScoreBoard内のsettingsタブに実装する必要があった
      4. propsが渡されていなかった
    - **教訓**: コードが存在する ≠ ユーザーに表示される
    - **教訓**: UIコンポーネントは表示条件とprops全体を追跡する
  
  - **2025-12-10: 学習カレンダー更新問題**
    - ユーザー報告: 「解答後、学習カレンダーの表示が更新されない」
    - AI対応: StatsViewの更新間隔を1秒に短縮した
    - 実際の問題:
      1. 和訳タブとスペルタブは`addQuizResult`を呼んでいた
      2. 文法タブは`updateWordProgress`のみで`addQuizResult`を呼んでいなかった
      3. `getStudyCalendarData`は`progress.results`からデータを取得
      4. 文法タブの解答が`progress.results`に記録されていなかった
    - **教訓**: 同じ機能でも全タブで同じ関数が呼ばれているか確認する
    - **教訓**: データの保存経路と取得経路の両方を追跡する
    - **教訓**: 「更新頻度を上げる」だけでなく「データが記録されているか」を確認する
    - **教訓**: 複数ファイルにまたがる実装は全体を確認する

### 0-1. **繰り返し指示の検知と自己診断（重要）**

- 🔴 **同じ指示が2〜3回繰り返された場合の対応**
  
  **即座に以下を認識すること:**
  - ユーザーの指示が繰り返される = 自分の対応が不完全だった
  - 「できました」と回答したが実際には完了していない
  - 表面的な対応で根本原因に対処していない
  - 確認不足で見落としがある
  
  **必須の自己診断手順:**
  1. **前回の対応を振り返る**
     - 何を変更したか
     - 何を確認したか
     - 何を確認しなかったか
  
  2. **全体を再確認する**
     - 関連する全ファイルを検索
     - データフロー全体を追跡（入力→処理→出力）
     - 条件分岐を全て確認（if文、三項演算子、`&&`、`||`）
     - 全タブ・全モードで同じ処理が実装されているか確認
  
  3. **ユーザーに報告する**
     - 「前回の対応が不完全でした」と明示
     - 見落としていた箇所を具体的に説明
     - 今回の対応で何を追加で確認したかを説明
  
  4. **このガイドラインに教訓を追加する**
     - 失敗例として記録
     - 次回同じミスをしないためのチェックリストを作成

- 📖 **繰り返し指示の例**:
  - 「まだ表示されません」「表示経路を確認してください」（2回目）
  - 「できていません」「もう一度確認してください」（3回目）
  - 「和訳タブにも追加してください」→「和訳タブに追加されていません」（2回目）
  
  **これらは全て「初回対応が不完全だった」というシグナル**

### 0-2. **すべてのエラー・警告を完全に解消する**

- ✅ **動作に影響しないエラーも必ず修正**
  - TypeScriptエラー（型エラー、未使用変数等）
  - ESLintエラー・警告
  - マークダウンリンター警告（リスト番号、テーブル、リンク等）
  - GitHub Actions警告（環境変数アクセス等）
  - Python import警告（開発ツールでも）
  - その他すべての警告・エラー

- ❌ **「動作に影響しないから放置」は禁止**
  - リンター警告の無視
  - 型エラーの放置
  - ビルド警告の無視
  - 未使用変数の放置

- 📖 **理由**: 
  - 小さな警告の蓄積がコード品質を低下させる
  - 重要なエラーが警告に埋もれて見逃される
  - メンテナンス性が悪化する

### 1. **CSS変更は極めて慎重に**

- ❌ **自動化ツールでのCSS変更は禁止**
  ```bash
  # ❌ 使用禁止（過去に2回レイアウト破壊）
  python scripts/deduplicate_css.py
  python scripts/replace_css_vars.py
  ```

- ✅ **CSS変更の正しい手順**:
  1. 1箇所ずつ手動で変更
  1. `npm run build` で確認
  1. Simple Browserで目視確認
  1. コミット

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
npm run typecheck  # TypeScript型エラー0件（必須）
npm run lint       # ESLintエラー・警告0件（必須）
npm run lint:css   # CSSリントエラー0件（必須）
npm run build      # ビルド成功、警告0件（必須）

# すべてのエラー・警告を確認
# VS Codeの問題パネルで0件を確認してからコミット
```

### 6. **エラー・警告ゼロの維持**

```bash
# 開発中に常に確認
# VS Code問題パネル: 0エラー、0警告

# コミット前に必ず確認
git status
npm run typecheck && npm run lint && npm run lint:css && npm run build

# すべてが✅であることを確認してからコミット
```

---

## 📚 開発ガイドライン

### 必読ドキュメント

1. **CSS開発ガイドライン** (`docs/CSS_DEVELOPMENT_GUIDELINES.md`)
   - BEM命名規約
   - CSS変数の使用
   - 重複禁止ルール
   - 安全な変更手順

1. **TypeScript/React開発ガイドライン** (`docs/TYPESCRIPT_DEVELOPMENT_GUIDELINES.md`)
   - コンポーネント設計
   - Props型定義
   - 状態管理（useState, useReducer）
   - カスタムフック

1. **品質管理パイプライン** (`docs/QUALITY_PIPELINE.md`)
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
1. 1箇所ずつ変更
1. 必ずビルド確認
1. Simple Browserで目視確認

### TypeScriptエラー削減の成果

- **開始時**: 11エラー
- **2025年12月2日**: **0エラー** ✅
- **段階的修正**: 1ファイルずつ慎重に対応

### 品質パイプライン導入成果

- **Pre-commit Hook**: 破壊的変更を事前検出
- **TypeScript + ESLint**: コード品質維持
- **Playwright E2E**: UI動作保証
- **CI/CD**: GitHub Actionsで自動検証

## 📝 更新履歴

- 2025-12-10: 「繰り返し指示の検知と自己診断」原則を追加（同じ指示が2〜3回続いた場合の対応手順）
- 2025-12-10: 「学習カレンダー更新問題」の教訓を追加（データ保存経路と取得経路の追跡の重要性）
- 2025-12-10: 「ユーザー報告を最優先し、実装確認を徹底する」原則を追加（文法タブ学習設定問題の教訓）

---

**最終更新**: 2025年12月10日  
**改訂履歴**:
- 2025-12-10: 「ユーザー報告を最優先し、実装確認を徹底する」原則を追加（文法タブ学習設定問題の教訓）
- 2025-12-02: 初版作成（開発パイプライン確立後）
