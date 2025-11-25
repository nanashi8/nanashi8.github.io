# 22. 開発環境セットアップガイド

## 🛠️ 概要

本プロジェクトの開発環境を構築するための手順を説明します。Node.js、npm、VS Code等の必要なツールのインストールから、ローカルでの動作確認までを網羅します。

---

## 📋 必要な環境

### 1. システム要件

- **OS**: macOS / Windows / Linux
- **Node.js**: v18以上
- **npm**: v9以上
- **Git**: v2.30以上

### 2. 推奨エディタ

- **VS Code**: 最新版
- **拡張機能**:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

---

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/nanashi8/nanashi8.github.io.git
cd nanashi8.github.io
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

### 4. ビルド

```bash
npm run build
```

### 5. プレビュー

```bash
npm run preview
```

---

## 🔧 主要コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run preview` | ビルド結果のプレビュー |
| `npm run deploy` | GitHub Pagesへデプロイ |

---

## 📦 主要パッケージ

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.2.2",
  "vite": "^5.4.1",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0"
}
```

---

## 📚 関連ドキュメント

- [23. デプロイ手順](./23-deployment.md) - GitHub Pagesへの公開
- [24. テスト戦略](./24-testing-strategy.md) - テストの実行
- [**UI開発ガイドライン**](./UI_DEVELOPMENT_GUIDELINES.md) - ⚠️ UI開発前に必読：CSS変数使用規則

---

## ⚠️ 開発時の重要な注意事項

### CSS変数の使用必須

**このプロジェクトでは、すべての色指定にCSS変数を使用する必要があります。**

```tsx
// ✅ 正しい
<div style={{ color: 'var(--text-color)' }}>テキスト</div>

// ❌ 間違い（絶対に使用禁止）
<div style={{ color: '#000000' }}>テキスト</div>
<div style={{ color: 'black' }}>テキスト</div>
```

**理由**: 
- ライトモード・ダークモードの包括的な切り替えを実現するため
- ハードコードされた色は片方のモードで見えなくなる可能性がある
- CSS変数を使用することで、モード切り替え時に全要素の色が自動的に変更される

詳細は [UI開発ガイドライン](./UI_DEVELOPMENT_GUIDELINES.md) を参照してください。
