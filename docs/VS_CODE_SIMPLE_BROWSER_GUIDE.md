# VS Code シンプルブラウザ利用ガイド

**作成日**: 2025年11月17日

## 📋 概要

VS Codeの「Simple Browser」機能を使用すると、エディタ内でWebアプリケーションをプレビューできます。
外部ブラウザを開かずに、コーディングとプレビューを同じ画面で行えるため、開発効率が向上します。

---

## 🚀 開発サーバーの起動

まず、開発サーバーを起動します。

### ターミナルで実行

```bash
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io
npm run dev
```

### 起動確認

以下のような出力が表示されれば成功です：

```text
  VITE v5.4.21  ready in 169 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🌐 シンプルブラウザを開く方法

### 方法1: コマンドパレット経由（推奨）

1. **Cmd + Shift + P** (macOS) または **Ctrl + Shift + P** (Windows) でコマンドパレットを開く
2. 「Simple Browser」と入力
3. 「**Simple Browser: Show**」を選択
4. URLを入力: `http://localhost:5173`
5. Enterキーを押す

### 方法2: ターミナルのURLから直接開く

1. ターミナルに表示される `http://localhost:5173/` を右クリック
2. 「**Follow Link**」または「**Open in Simple Browser**」を選択
   - ※環境によってメニュー名が異なる場合があります

### 方法3: GitHubでコパイロットに依頼

チャットで以下のように依頼すると自動で開きます：

```text
http://localhost:5173 をシンプルブラウザで開いて
```

---

## 🔍 シンプルブラウザの確認方法

### ブラウザタブの場所

- VS Codeのエディタエリアに「**Simple Browser**」というタブが開きます
- 通常のファイルタブと同じ場所に表示されます

### 見つからない場合

1. **エディタエリアを確認**: 他のタブの後ろに隠れていないか確認
2. **パネルを確認**: 下部パネルやサイドバーに表示されていないか確認
3. **再度開く**: コマンドパレットから再度「Simple Browser: Show」を実行

---

## 🔄 シンプルブラウザの操作

### リロード

- **Cmd + R** (macOS) または **Ctrl + R** (Windows)
- または、ブラウザ上部の更新ボタンをクリック

### 戻る・進む

- ブラウザ上部のナビゲーションボタンを使用
- または、**Cmd + ←** / **Cmd + →** (macOS)

### 新しいタブで開く

- URLの横の「↗」アイコンをクリック → 外部ブラウザで開く

### DevToolsは使用不可

- Simple BrowserではDevToolsが使用できません
- デバッグが必要な場合は、Chrome/Safari等の外部ブラウザを使用してください

---

## 🎯 用途別の使い方

### 開発中のプレビュー（ローカル）

```text
URL: http://localhost:5173
```

- リアルタイムでコード変更を確認
- ホットリロード（HMR）が有効

### デプロイ済みサイトの確認

```text
URL: https://nanashi8.github.io
```

- 本番環境の動作確認
- デプロイ後の最終チェック

### 特定のページを直接開く

```text
URL: http://localhost:5173/#/specific-page
```

- アプリ内の特定のルートやタブを直接開く

---

## ⚠️ トラブルシューティング

### 「接続できません」と表示される

**原因**: 開発サーバーが起動していない

**解決策**:

```bash
npm run dev
```

を実行して開発サーバーを起動してください。

### ページが真っ白

**原因1**: コンソールエラーが発生している可能性

**解決策**: 外部ブラウザ（Chrome）でDevToolsを開いてエラーを確認

**原因2**: キャッシュの問題

**解決策**:

1. Simple Browserを閉じる
2. Cmd + Shift + P → 「Developer: Reload Window」
3. 再度Simple Browserを開く

### 変更が反映されない

**解決策1**: Simple Browser内でリロード（Cmd + R）

**解決策2**: 開発サーバーを再起動

```bash
# Ctrl + C で停止
npm run dev
```

### Simple Browserが見つからない

**確認事項**:

1. VS Codeのバージョンが最新か確認
2. 拡張機能「Built-in」が有効になっているか確認
3. コマンドパレットで「Simple Browser」と検索して候補が出るか確認

---

## 💡 便利なTips

### 1. サイドバイサイド表示

- Simple Browserタブを右クリック
- 「Split Right」または「Split Down」を選択
- コードとプレビューを並べて表示

### 2. キーボードショートカット

| 操作 | macOS | Windows |
|------|-------|---------|
| コマンドパレット | Cmd + Shift + P | Ctrl + Shift + P |
| リロード | Cmd + R | Ctrl + R |
| 戻る | Cmd + ← | Alt + ← |
| 進む | Cmd + → | Alt + → |

### 3. 複数ブラウザタブ

- 複数のSimple Browserタブを開くことが可能
- 異なるURLを同時にプレビューできる

### 4. レスポンシブデザインの確認

- Simple Browserウィンドウのサイズを変更
- モバイル表示の確認に便利

---

## 📝 開発ワークフロー例

### 1. 開発開始

```bash
# ターミナル
npm run dev
```

### 2. プレビュー表示

- Cmd + Shift + P
- 「Simple Browser: Show」
- `http://localhost:5173` を入力

### 3. コーディング

- エディタでコードを編集
- 保存すると自動でブラウザが更新（HMR）

### 4. デバッグ（必要時）

- Chrome/SafariでDevToolsを開く
- コンソールエラーを確認

### 5. デプロイ

```bash
npm run build
npm run deploy
```

### 6. 本番確認

- Simple Browserで `https://nanashi8.github.io` を開く
- 最終動作確認

---

## 🔗 関連リンク

- [VS Code Simple Browser 公式ドキュメント](https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls)
- [Vite 公式ドキュメント](https://vitejs.dev/)
- [プロジェクトのREADME](../README.md)

---

**更新日**: 2025年11月17日  
**プロジェクト**: nanashi8.github.io
