# Vite開発サーバー - 参考資料

## Viteとは

**Vite（ヴィート）** は、次世代の高速なフロントエンド開発ツールです。

### 主な特徴

1. **超高速な起動**
   - 従来のWebpack等と比べて10倍以上高速
   - プロジェクトが大きくなっても起動時間がほぼ変わらない

1. **即座の更新（HMR - Hot Module Replacement）**
   - ファイルを保存すると**自動的にブラウザに反映**
   - ページ全体をリロードせず、変更部分だけ更新
   - 開発体験が大幅に向上

1. **最新のJavaScript標準に対応**
   - TypeScript、JSX、CSSを標準サポート
   - 設定不要で使える

---

## このプロジェクトでの使い方

### 開発サーバーの起動

```bash
cd nanashi8.github.io
npm run dev
```

以下のような出力が表示されます：

```
VITE v5.4.21  ready in 163 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### ブラウザでの確認

1. ブラウザで `http://localhost:5173` を開く
1. VS Codeのシンプルブラウザでも開ける

### 自動リロード（HMR）の動作

#### CSSファイルを編集した場合

```css
/* src/styles/themes/dark.css を編集 */
.choice-btn {
  background: var(--gray-800);  /* 変更 */
}
```

1. ファイルを保存（⌘+S）
1. **ブラウザが自動的に更新される**
1. サーバー再起動は不要

#### Reactコンポーネントを編集した場合

```typescript
// src/components/GrammarQuizView.tsx を編集
export default function GrammarQuizView() {
  return <div>変更内容</div>
}
```

1. ファイルを保存（⌘+S）
1. **ブラウザが自動的に更新される**
1. コンポーネントの状態も保持される

---

## Vite設定ファイル

### `vite.config.ts`

このプロジェクトの設定：

```typescript
export default defineConfig({
  plugins: [react()],  // React対応
  base: '/',
  server: {
    hmr: {
      overlay: true,  // エラーを画面に表示
    },
    watch: {
      usePolling: true,  // ファイル変更検出を強化
    },
  },
  // ... ビルド設定
})
```

### 主な設定項目

- **`plugins: [react()]`** - Reactのサポートを有効化
- **`hmr.overlay: true`** - エラーが発生したら画面にオーバーレイ表示
- **`watch.usePolling: true`** - ファイル変更の検出方法を強化（自動リロード確実化）

---

## HMR（Hot Module Replacement）の仕組み

### 通常のリロード（従来）

```
ファイル編集 → 保存 → 手動でブラウザリロード（⌘+R）
                    → ページ全体が再読み込み
                    → フォームの入力内容などが消える
```

### HMR（Vite）

```
ファイル編集 → 保存 → 自動的にブラウザ更新
                    → 変更部分だけ置き換え
                    → アプリの状態は保持される
```

### メリット

- **手動リロード不要** - 保存するだけで反映
- **開発が高速** - 編集→確認のサイクルが超高速
- **状態保持** - フォーム入力、スクロール位置などが保持される

---

## トラブルシューティング

### HMRが動かない場合

1. **サーバーが起動しているか確認**
   ```bash
   lsof -i:5173
   ```

1. **ブラウザのコンソールを確認**
   - F12で開発者ツールを開く
   - WebSocketエラーがないか確認

1. **サーバーを再起動**
   ```bash
   pkill -f "vite.*5173"
   npm run dev
   ```

### ポートが使用中の場合

```bash
# 使用中のプロセスを確認
lsof -i:5173

# 強制終了
pkill -f "vite.*5173"
```

### キャッシュをクリア

```bash
# node_modulesとキャッシュを削除して再インストール
rm -rf node_modules .vite
npm install
npm run dev
```

---

## よくある質問

### Q1: なぜサーバー再起動が不要なのか？

**A:** Viteは以下の仕組みで動作しています：

1. ファイル変更を監視
1. 変更を検出すると、そのモジュールだけを再読み込み
1. WebSocket経由でブラウザに通知
1. ブラウザが自動的に更新

### Q2: CSS変更が反映されない場合は？

**A:** 以下を確認してください：

1. ファイルが保存されているか（⌘+S）
1. ブラウザのコンソールにエラーがないか
1. CSSの構文エラーがないか

### Q3: 本番環境にデプロイするには？

**A:** ビルドコマンドを実行：

```bash
npm run build
```

`dist/`フォルダに最適化されたファイルが生成されます。

---

## パフォーマンス比較

### 起動時間（プロジェクトサイズ：中規模）

| ツール | 起動時間 |
|--------|----------|
| Webpack | 30-60秒 |
| Vite | 1-3秒 ⚡ |

### ホットリロード（1ファイル変更）

| ツール | 反映時間 |
|--------|----------|
| Webpack | 3-10秒 |
| Vite | 0.1-0.5秒 ⚡ |

---

## 参考リンク

- [Vite公式ドキュメント](https://ja.vitejs.dev/)
- [Vite GitHub](https://github.com/vitejs/vite)
- [HMRについて](https://ja.vitejs.dev/guide/features.html#hot-module-replacement)

---

## まとめ

### Viteを使うと...

✅ **ファイル保存 → 自動的にブラウザ更新**  
✅ **サーバー再起動不要**  
✅ **開発スピードが劇的に向上**  
✅ **設定なしで TypeScript/React が使える**  

### 開発フロー

```
1. npm run dev でサーバー起動
1. ブラウザで localhost:5173 を開く
1. CSSやReactファイルを編集
1. 保存（⌘+S）
1. 自動的にブラウザに反映される ← ここが重要！
```

**つまり、一度サーバーを起動したら、あとは編集して保存するだけで、すぐにブラウザで確認できます。**
