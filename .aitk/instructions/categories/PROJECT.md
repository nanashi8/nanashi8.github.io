---
description: プロジェクト構造・設定変更時のカテゴリ索引
category: project
---

# 📂 Category: Project Structure

## 🎯 このカテゴリの対象

- プロジェクト構造の変更
- 依存関係の追加・更新
- ビルド設定の変更
- 開発環境の変更
- CI/CDの変更

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. プロジェクト構造ガイド ⭐ 最優先

📄 **[project-structure.instructions.md](../project-structure.instructions.md)**

**ディレクトリ構造**:
```
nanashi8.github.io/
├── .aitk/                     # AI Toolkit設定
│   └── instructions/          # Instructions体系
│       ├── INDEX.md           # エントリーポイント
│       ├── categories/        # カテゴリ索引
│       └── *.instructions.md  # Individual Instructions
├── src/                       # ソースコード
│   ├── components/            # Reactコンポーネント
│   ├── hooks/                 # カスタムフック
│   ├── utils/                 # ユーティリティ
│   ├── ai/                    # AIシステム
│   ├── storage/               # ストレージ層
│   └── types/                 # 型定義
├── tests/                     # テスト
│   ├── unit/                  # ユニットテスト
│   ├── integration/           # 統合テスト
│   └── e2e/                   # E2Eテスト
├── docs/                      # ドキュメント
├── scripts/                   # スクリプト
└── public/                    # 静的ファイル
```

---

### 2. 仕様強制ガイド

📄 **[specification-enforcement.instructions.md](../specification-enforcement.instructions.md)**

**仕様の階層**:
1. 不変条件（*-enforcement.instructions.md）
2. システム仕様（meta-ai-priority.instructions.md等）
3. ガイドライン（development-guidelines.instructions.md等）

---

## 📦 依存関係管理

### 依存関係の追加

```bash
# 本番依存
npm install <package>

# 開発依存
npm install --save-dev <package>
```

**追加前の確認**:
- [ ] 本当に必要か（YAGNI原則）
- [ ] 代替手段はないか
- [ ] ライセンスは適切か
- [ ] メンテナンスされているか
- [ ] バンドルサイズへの影響
- [ ] セキュリティ脆弱性はないか

---

### 依存関係の更新

```bash
# 依存関係チェック
npm outdated

# 更新
npm update

# 破壊的変更を含む更新
npm install <package>@latest
```

**更新後の確認**:
- [ ] すべてのテストが通る
- [ ] ビルドが成功する
- [ ] アプリが正常動作する
- [ ] 破壊的変更への対応完了

---

## ⚙️ ビルド設定

### Vite設定

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    // ビルド設定
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### TypeScript設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true
  }
}
```

---

## 🔧 開発環境

### VS Code設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Git フック

```bash
# pre-commit hook（自動ガード）
.git/hooks/pre-commit -> scripts/pre-commit-ai-guard.sh
```

---

## 🚀 CI/CD

### GitHub Actions

```yaml
# .github/workflows/
├── ci.yml                    # CI
├── deploy.yml                # デプロイ
└── servant-auto-learning.yml # サーバント自動学習
```

**CI チェック項目**:
- [ ] TypeScript型チェック
- [ ] Lint
- [ ] ユニットテスト
- [ ] ビルド成功
- [ ] E2Eテスト（本番前）

---

## 📋 プロジェクト変更フロー

```
1. 変更理由の明確化
   - なぜ必要か
   - 影響範囲は？
   ↓
2. 影響分析
   - ビルドへの影響
   - テストへの影響
   - デプロイへの影響
   - チーム開発への影響
   ↓
3. バックアップ
   git add .
   git commit -m "Before project change"
   ↓
4. 変更実装
   - 設定ファイル変更
   - 依存関係変更
   ↓
5. 動作確認
   npm run dev
   ↓
6. ビルド確認
   npm run build
   ↓
7. テスト実行
   npm run test:unit:fast
   ↓
8. ドキュメント更新
   - README更新
   - セットアップ手順更新
   ↓
9. コミット
```

---

## 🚫 禁止事項

- ❌ 理由なき依存関係追加
- ❌ 動作確認なしで依存関係更新
- ❌ ビルド設定の無計画な変更
- ❌ 後方互換性を破壊する変更（要議論）
- ❌ ドキュメント更新なしで環境変更
- ❌ チーム合意なしで大規模変更

---

## 📚 関連 Individual Instructions 一覧

- [project-structure.instructions.md](../project-structure.instructions.md) ⭐ 最優先
- [specification-enforcement.instructions.md](../specification-enforcement.instructions.md)
- [security-best-practices.instructions.md](../security-best-practices.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
