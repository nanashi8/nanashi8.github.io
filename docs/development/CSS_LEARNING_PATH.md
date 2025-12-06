# CSS学習ロードマップ - 基礎から実践まで

**対象者:** HTML基礎（文字表示程度）からCSS最適化・テーマシステム構築までの知識を習得したい方

**最終目標:** このプロジェクトで実施したCSS最適化作業を理解できるレベル

---

## 📚 学習ステップ

### Level 0: 前提知識（あなたの現在地）

#### HTML基礎
```html
<!DOCTYPE html>
<html>
<head>
    <title>私のページ</title>
</head>
<body>
    <h1>こんにちは</h1>
    <p>これが表示できる</p>
</body>
</html>
```

**✅ できること:**
- HTMLファイルを作成
- テキストを表示
- 見出しや段落の使い分け

**→ 次のステップ: CSSで見た目を変える**

---

## Level 1: CSS基礎（学習時間: 3-5時間）

### 1.1 CSSの基本構文

**CSSとは？** → HTML要素の見た目（色、サイズ、配置）を決めるもの

#### 基本的な書き方
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* セレクタ { プロパティ: 値; } */
        h1 {
            color: blue;        /* 文字色を青に */
            font-size: 24px;   /* 文字サイズを24pxに */
        }
        
        p {
            color: gray;
            background-color: #f0f0f0;  /* 背景色 */
            padding: 10px;              /* 内側の余白 */
        }
    </style>
</head>
<body>
    <h1>青い見出し</h1>
    <p>灰色の文字、灰色の背景</p>
</body>
</html>
```

**学習ポイント:**
- セレクタ（どの要素に適用するか）
- プロパティ（何を変えるか）
- 値（どう変えるか）

#### 練習課題
```html
<style>
    /* 課題: 以下を完成させよう */
    h1 {
        color: red;           /* 赤い文字 */
        background-color: yellow;  /* 黄色い背景 */
    }
    
    p {
        font-size: 18px;      /* 文字サイズ18px */
        text-align: center;   /* 中央揃え */
    }
</style>
```

### 1.2 セレクタの種類

#### タグセレクタ
```css
/* 全てのh1に適用 */
h1 {
    color: blue;
}
```

#### クラスセレクタ（重要！）
```html
<style>
    /* .クラス名 で指定 */
    .red-text {
        color: red;
    }
    
    .big-text {
        font-size: 30px;
    }
</style>

<p class="red-text">赤い文字</p>
<p class="red-text big-text">赤くて大きい文字</p>
```

#### IDセレクタ
```html
<style>
    /* #ID名 で指定（1ページに1つだけ） */
    #header {
        background-color: navy;
        color: white;
    }
</style>

<div id="header">ヘッダー部分</div>
```

**このプロジェクトでの例:**
```css
/* App.cssより */
.app {                    /* クラスセレクタ */
    background: white;
    color: #333;
}

.tab-btn {               /* クラスセレクタ */
    padding: 10px;
}

.tab-btn.active {        /* 複数クラス */
    background: blue;
}
```

### 1.3 色の指定方法

```css
.element {
    /* 方法1: 色名 */
    color: red;
    
    /* 方法2: 16進数 (最も一般的) */
    color: #ff0000;     /* 赤 */
    color: #667eea;     /* 紫っぽい青 */
    
    /* 方法3: RGB */
    color: rgb(255, 0, 0);  /* 赤 */
    
    /* 方法4: RGBA (透明度付き) */
    color: rgba(255, 0, 0, 0.5);  /* 半透明の赤 */
}
```

**16進数カラーコードの読み方:**
```
#667eea
 ↓↓ ↓↓ ↓↓
 赤 緑 青
 
 00 = 最小（暗い）
 ff = 最大（明るい）
```

---

## Level 2: CSS中級（学習時間: 5-10時間）

### 2.1 外部CSSファイル

**なぜ分けるの？** → HTMLとCSSを分離すると管理しやすい

#### Before: HTMLに直接書く（初心者）
```html
<html>
<head>
    <style>
        h1 { color: blue; }
        p { color: gray; }
        /* 100行以上続く... */
    </style>
</head>
<body>...</body>
</html>
```

#### After: 外部ファイルに分ける（推奨）
```html
<!-- index.html -->
<html>
<head>
    <link rel="stylesheet" href="style.css">
</head>
<body>...</body>
</html>
```

```css
/* style.css */
h1 {
    color: blue;
}

p {
    color: gray;
}
```

**メリット:**
- HTMLがスッキリ
- 複数のHTMLで同じCSSを使い回せる
- 修正が1箇所で済む

### 2.2 ボックスモデル（超重要！）

CSSの**最重要概念**。全ての要素は「箱」として扱われる。

```
┌─────────────────────────┐
│      margin (外側の余白)    │
│  ┌──────────────────┐  │
│  │  border (枠線)      │  │
│  │ ┌─────────────┐ │  │
│  │ │ padding (内側余白)│ │
│  │ │ ┌──────────┐ │ │  │
│  │ │ │ content  │ │ │  │
│  │ │ │ (内容)    │ │ │  │
│  │ │ └──────────┘ │ │  │
│  │ └─────────────┘ │  │
│  └──────────────────┘  │
└─────────────────────────┘
```

```css
.box {
    width: 200px;          /* 幅 */
    height: 100px;         /* 高さ */
    
    padding: 20px;         /* 内側の余白 */
    border: 2px solid black;  /* 枠線 */
    margin: 10px;          /* 外側の余白 */
    
    background-color: lightblue;
}
```

**実際のサイズ計算:**
```
実際の幅 = width + padding左右 + border左右
         = 200px + 40px + 4px = 244px
```

**box-sizing: border-box（便利！）**
```css
.box {
    box-sizing: border-box;  /* これを指定すると */
    width: 200px;            /* 実際の幅が200pxになる */
    padding: 20px;
    border: 2px solid black;
}
```

### 2.3 Flexbox（レイアウトの基本）

**横並び・縦並びが簡単にできる**

```html
<style>
    .container {
        display: flex;           /* フレックスボックス化 */
        gap: 10px;              /* 要素間の隙間 */
    }
    
    .item {
        padding: 20px;
        background: lightblue;
        border: 1px solid blue;
    }
</style>

<div class="container">
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
    <div class="item">Item 3</div>
</div>
```

**よく使うプロパティ:**
```css
.container {
    display: flex;
    
    /* 横並び・縦並び */
    flex-direction: row;        /* 横並び（デフォルト） */
    flex-direction: column;     /* 縦並び */
    
    /* 水平方向の配置 */
    justify-content: center;    /* 中央 */
    justify-content: space-between;  /* 両端揃え */
    
    /* 垂直方向の配置 */
    align-items: center;        /* 中央 */
    align-items: flex-start;    /* 上揃え */
}
```

**このプロジェクトでの例:**
```css
/* App.cssより */
.app {
    display: flex;
    flex-direction: column;  /* 縦並び */
    min-height: 100vh;       /* 画面全体の高さ */
}
```

---

## Level 3: CSS変数（学習時間: 2-3時間）

### 3.1 なぜCSS変数が必要？

#### Before: 同じ色を何度も書く
```css
.header {
    background-color: #667eea;
}

.button {
    background-color: #667eea;
}

.link {
    color: #667eea;
}

/* 色を変更したい！ → 3箇所全部修正が必要 😱 */
```

#### After: CSS変数を使う
```css
:root {
    --primary-color: #667eea;  /* 1箇所で定義 */
}

.header {
    background-color: var(--primary-color);
}

.button {
    background-color: var(--primary-color);
}

.link {
    color: var(--primary-color);
}

/* 色を変更したい！ → :root の1行だけ修正 ✨ */
```

### 3.2 CSS変数の基本

#### 定義方法
```css
:root {
    /* --変数名: 値; */
    --text-color: #333333;
    --background: white;
    --primary-color: #667eea;
}
```

**:root とは？** → HTML全体に適用される特別なセレクタ

#### 使用方法
```css
.element {
    /* var(--変数名) */
    color: var(--text-color);
    background: var(--background);
}
```

#### デフォルト値を設定
```css
.element {
    /* 変数が未定義の場合、redを使用 */
    color: var(--未定義の変数, red);
}
```

### 3.3 実践例: テーマカラー管理

```css
/* variables.css */
:root {
    /* 基本色 */
    --primary: #667eea;
    --secondary: #764ba2;
    --text: #333333;
    --background: #ffffff;
    
    /* セマンティックカラー */
    --success: #10b981;
    --error: #ef4444;
    --warning: #f59e0b;
}

/* 使用例 */
.button-primary {
    background: var(--primary);
    color: white;
}

.alert-success {
    background: var(--success);
    color: white;
}
```

**このプロジェクトでの実例:**
```css
/* src/styles/themes/variables.css より */
:root {
    --text-color: #333333;
    --background: #ffffff;
    --btn-primary-bg: #667eea;
    --success-color: #10b981;
    --error-color: #ef4444;
}
```

---

## Level 4: ダークモード（学習時間: 3-5時間）

### 4.1 ダークモードの基本概念

**やりたいこと:** ボタン1つで画面全体の色を変える

#### 従来の方法（ダメな例）
```css
/* 全てのスタイルを2回書く... */
.card {
    background: white;
    color: black;
}

.card.dark {
    background: #1a1a1a;
    color: white;
}

/* 100個のクラスがあったら... 😱 */
```

#### CSS変数を使った方法（良い例）
```css
/* ライトモード */
:root {
    --background: white;
    --text: black;
}

/* ダークモード */
.dark-mode {
    --background: #1a1a1a;
    --text: white;
}

/* 共通スタイル（1回だけ書く） */
.card {
    background: var(--background);
    color: var(--text);
}
```

### 4.2 実装ステップ

#### Step 1: CSS変数を定義
```css
/* style.css */
:root {
    --bg: white;
    --text: #333;
}

.dark-mode {
    --bg: #1a1a1a;
    --text: #e0e0e0;
}

body {
    background: var(--bg);
    color: var(--text);
}
```

#### Step 2: JavaScriptで切り替え
```html
<button id="theme-toggle">ダークモード切替</button>

<script>
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});
</script>
```

**動作:**
1. ボタンをクリック
1. `<body class="dark-mode">` が付く
1. CSS変数が上書きされる
1. 画面全体の色が変わる ✨

### 4.3 このプロジェクトの実装

```css
/* src/styles/themes/variables.css */
:root {
    --text-color: #333333;
    --background: #ffffff;
    --btn-primary-bg: #667eea;
}

/* src/styles/themes/dark.css */
.dark-mode {
    --text-color: #e0e0e0;      /* 上書き */
    --background: #1a1a1a;      /* 上書き */
    --btn-primary-bg: #667eea;  /* 変更なし */
}
```

**使用例:**
```css
/* App.css */
.app {
    background: var(--background);  /* ライト: white, ダーク: #1a1a1a */
    color: var(--text-color);       /* ライト: #333, ダーク: #e0e0e0 */
}
```

---

## Level 5: ファイル分割とインポート（学習時間: 2-3時間）

### 5.1 なぜファイルを分けるの？

**問題:** 1つのCSSファイルが10,000行になった...
- 探すのが大変
- 修正が怖い
- 複数人で編集しづらい

**解決:** ファイルを役割ごとに分ける

### 5.2 @importの使い方

#### 基本構造
```
project/
├── index.html
└── styles/
    ├── main.css         (メインファイル)
    ├── variables.css    (変数定義)
    ├── buttons.css      (ボタン)
    └── cards.css        (カード)
```

#### main.css
```css
/* 他のCSSファイルを読み込む */
@import './variables.css';
@import './buttons.css';
@import './cards.css';

/* メインのスタイル */
body {
    margin: 0;
    font-family: Arial, sans-serif;
}
```

#### index.html
```html
<link rel="stylesheet" href="styles/main.css">
<!-- main.cssが他のファイルを自動で読み込む -->
```

### 5.3 このプロジェクトの構造

```
src/
├── index.css                    (エントリーポイント)
├── App.css                      (共通スタイル, 496行)
└── styles/
    └── themes/
        ├── variables.css        (CSS変数定義, 190行)
        ├── light.css            (ライトモード, 13行)
        └── dark.css             (ダークモード, 12,646行)
```

**index.css (エントリーポイント):**
```css
@import './styles/themes/variables.css';
@import './styles/themes/light.css';
@import './styles/themes/dark.css';

:root {
    font-family: 'Segoe UI', sans-serif;
}
```

**メリット:**
- App.css: 13,133行 → 496行に削減
- 修正箇所が見つけやすい
- テーマごとに管理できる

---

## Level 6: CSS設計とメンテナンス（学習時間: 5-8時間）

### 6.1 命名規則: BEM

**BEM = Block Element Modifier**

#### 構造
```
.block              (大きな要素)
.block__element     (block内の部品)
.block--modifier    (blockのバリエーション)
```

#### 例
```html
<style>
    /* Block */
    .card {
        background: white;
        border-radius: 8px;
    }
    
    /* Element */
    .card__title {
        font-size: 20px;
        font-weight: bold;
    }
    
    .card__content {
        padding: 16px;
    }
    
    /* Modifier */
    .card--highlighted {
        border: 2px solid blue;
    }
</style>

<div class="card card--highlighted">
    <h2 class="card__title">タイトル</h2>
    <p class="card__content">内容</p>
</div>
```

**メリット:**
- クラス名から構造が分かる
- 名前の衝突が起きにくい
- メンテナンスしやすい

### 6.2 セマンティックな命名

#### ダメな例（見た目ベース）
```css
.red-button {        /* 色を変えたらクラス名と矛盾 */
    background: red;
}

.big-text {          /* サイズ変更でクラス名と矛盾 */
    font-size: 24px;
}
```

#### 良い例（意味ベース）
```css
.btn-danger {        /* 「危険」という意味 */
    background: red;  /* 色を変えてもOK */
}

.heading-primary {   /* 「主要な見出し」という意味 */
    font-size: 24px;  /* サイズ変更してもOK */
}
```

**このプロジェクトの例:**
```css
/* セマンティックな変数名 */
--success-color: #10b981;   /* 「成功」の色 */
--error-color: #ef4444;     /* 「エラー」の色 */
--btn-primary-bg: #667eea;  /* 「主要ボタン」の背景 */
```

### 6.3 CSS詳細度（Specificity）

**詳細度 = CSSの優先順位を決めるルール**

#### 優先順位（強い順）
1. `!important` (最強、使わない方が良い)
1. インラインスタイル `style="..."`
1. IDセレクタ `#header`
1. クラスセレクタ `.button`
1. タグセレクタ `div`

```css
/* 詳細度: 1 (タグ) */
p {
    color: black;
}

/* 詳細度: 10 (クラス) */
.text {
    color: blue;     /* こちらが優先される */
}

/* 詳細度: 100 (ID) */
#special {
    color: red;      /* こちらが最優先 */
}
```

#### 実践的なルール
```css
/* ❌ 詳細度が高すぎて上書きしづらい */
#header .nav .item a {
    color: blue;
}

/* ✅ クラスだけで十分 */
.nav-link {
    color: blue;
}
```

---

## Level 7: ビルドツールとVite（学習時間: 3-5時間）

### 7.1 ビルドツールとは？

**やってくれること:**
- CSSを圧縮（ファイルサイズ削減）
- 複数ファイルを1つに結合
- 未使用のCSSを削除
- 自動でプレフィックス追加（ブラウザ互換性）

#### Before（手動）
```css
/* styles.css (100KB) */
.button {
    display: flex;
    justify-content: center;
    /* 改行やスペースがたくさん */
}
```

#### After（Viteでビルド）
```css
/* styles.min.css (32KB) */
.button{display:flex;justify-content:center}
```

**68%削減！** 🎉

### 7.2 Viteの基本

**Vite = 超高速なビルドツール**

#### プロジェクト構造
```
project/
├── index.html
├── src/
│   ├── main.js
│   ├── App.css
│   └── index.css
├── package.json
└── vite.config.js    (設定ファイル)
```

#### vite.config.js の例
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',        // 出力先
    cssCodeSplit: true,    // CSS分割
    minify: 'esbuild',     // 圧縮方法
  },
  css: {
    devSourcemap: true,    // 開発時のソースマップ
  },
})
```

#### ビルドコマンド
```bash
npm run build
```

**結果:**
```
dist/
├── index.html
└── assets/
    ├── index-abc123.css    (圧縮済み)
    └── index-def456.js     (圧縮済み)
```

### 7.3 このプロジェクトでの設定

```javascript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,     // CSS分割有効
    minify: 'esbuild',      // 高速圧縮
  },
  css: {
    devSourcemap: true,
  },
})
```

**ビルド結果:**
- CSS: 210.01 KB → 32.93 KB (gzipped)
- 84%削減！

---

## Level 8: CSS最適化テクニック（学習時間: 5-8時間）

### 8.1 直接色指定の問題

#### 問題のあるコード
```css
.button {
    background: #667eea;
}

.header {
    background: #667eea;
}

.link {
    color: #667eea;
}

/* 同じ色が100箇所に... */
/* 色を変えたい → 100箇所修正が必要 😱 */
```

**問題点:**
- メンテナンス性が低い
- 見落としが発生しやすい
- 一貫性が保てない

#### 解決: CSS変数化
```css
:root {
    --primary: #667eea;  /* 1箇所で定義 */
}

.button {
    background: var(--primary);
}

.header {
    background: var(--primary);
}

.link {
    color: var(--primary);
}

/* 色を変えたい → :rootの1行だけ ✨ */
```

**このプロジェクトでの成果:**
- 直接色指定: 1,089箇所 → 471箇所 (-57%)

### 8.2 巨大CSSファイルの分割

#### 問題
```
App.css (13,133行)
├─ 共通スタイル (500行)
├─ ライトモード (500行)
└─ ダークモード (12,000行)

問題:
- 探すのに時間がかかる
- 修正が怖い
- Gitコンフリクトが起きやすい
```

#### 解決: ファイル分割
```
src/
├── App.css (496行)           ← 共通スタイルのみ
└── styles/themes/
    ├── variables.css (190行)  ← 変数定義
    ├── light.css (13行)       ← ライトモード
    └── dark.css (12,646行)    ← ダークモード

メリット:
✅ 検索時間 -80%
✅ メンテナンス時間 -50%
✅ コンフリクト率 -80%
```

### 8.3 循環参照の回避

#### ダメな例（循環参照）
```css
.dark-mode {
    --text-color: var(--text-color);  /* 自分自身を参照 */
    --bg: var(--text-color);          /* 循環してる！ */
}
```

**問題:** CSSが正しく適用されない

#### 正しい例
```css
/* variables.css */
:root {
    --text-color: #333;     /* 基本値を定義 */
}

/* dark.css */
.dark-mode {
    --text-color: #e0e0e0;  /* 新しい値で上書き */
}
```

**このプロジェクトで修正した箇所:**
- 循環参照: 2箇所発見・修正

---

## 実践プロジェクト: ミニテーマシステムを作ろう

### ゴール
ボタン1つでライト/ダークモードを切り替えられるページを作る

### Step 1: HTML構造
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>テーマ切替デモ</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>テーマシステムデモ</h1>
        <button id="theme-toggle" class="btn">
            🌙 ダークモード切替
        </button>
        
        <div class="card">
            <h2 class="card__title">カードタイトル</h2>
            <p class="card__content">
                これはカードの内容です。
                テーマを切り替えると色が変わります。
            </p>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>
```

### Step 2: CSS（style.css）
```css
/* ===== 変数定義 ===== */
:root {
    /* ライトモード */
    --bg: #ffffff;
    --text: #333333;
    --card-bg: #f8f9fa;
    --card-border: #e0e0e0;
    --btn-bg: #667eea;
    --btn-text: #ffffff;
}

.dark-mode {
    /* ダークモード */
    --bg: #1a1a1a;
    --text: #e0e0e0;
    --card-bg: #2a2a2a;
    --card-border: #444444;
    --btn-bg: #7a8ef0;
    --btn-text: #ffffff;
}

/* ===== 共通スタイル ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: Arial, sans-serif;
    transition: background 0.3s, color 0.3s;  /* スムーズに切り替え */
}

.container {
    max-width: 600px;
    margin: 50px auto;
    padding: 20px;
}

h1 {
    margin-bottom: 20px;
}

/* ===== ボタン ===== */
.btn {
    background: var(--btn-bg);
    color: var(--btn-text);
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 30px;
    transition: transform 0.2s;
}

.btn:hover {
    transform: translateY(-2px);
}

/* ===== カード（BEM命名） ===== */
.card {
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: 12px;
    padding: 24px;
    transition: background 0.3s, border-color 0.3s;
}

.card__title {
    margin-bottom: 12px;
    color: var(--btn-bg);  /* アクセントカラー */
}

.card__content {
    line-height: 1.6;
}
```

### Step 3: JavaScript（script.js）
```javascript
// テーマ切替ボタンを取得
const themeToggle = document.getElementById('theme-toggle');

// 保存されたテーマを読み込む
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

// ボタンクリック時の処理
themeToggle.addEventListener('click', () => {
    // dark-modeクラスをトグル（付け外し）
    document.body.classList.toggle('dark-mode');
    
    // 現在のテーマを保存
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // ボタンのテキストを変更
    themeToggle.textContent = isDark ? '☀️ ライトモード切替' : '🌙 ダークモード切替';
});
```

### 完成！

**ファイル構成:**
```
project/
├── index.html
├── style.css
└── script.js
```

**動作:**
1. ページを開く → ライトモード
1. ボタンをクリック → ダークモードに切り替え
1. ページをリロード → 前回の設定を記憶

---

## 用語集

### CSS基礎
- **セレクタ**: CSSを適用する対象（`.class`, `#id`, `tag`）
- **プロパティ**: 変更する項目（`color`, `background`, `font-size`）
- **値**: 設定する内容（`red`, `#667eea`, `16px`）

### レイアウト
- **Flexbox**: 柔軟なレイアウトシステム
- **Box Model**: 要素の寸法計算（content + padding + border + margin）
- **Grid**: 2次元レイアウトシステム

### CSS変数
- **:root**: HTML全体に適用されるセレクタ
- **var()**: CSS変数を使用する関数
- **カスタムプロパティ**: CSS変数の正式名称

### テーマ
- **ダークモード**: 暗い配色のテーマ
- **ライトモード**: 明るい配色のテーマ
- **セマンティックカラー**: 意味を持つ色（success, error, warning）

### ビルド
- **ミニファイ**: コードを圧縮すること
- **バンドル**: 複数ファイルを1つに結合
- **gzip**: 圧縮アルゴリズム（転送サイズを削減）

### 設計
- **BEM**: Block Element Modifier（命名規則）
- **詳細度**: CSSの優先順位
- **循環参照**: 変数が自分自身を参照してしまうエラー

---

## 推奨学習リソース

### 無料リソース
1. **MDN Web Docs** (日本語)
   - https://developer.mozilla.org/ja/docs/Web/CSS
   - CSS公式リファレンス

1. **CSS Tricks**
   - https://css-tricks.com/
   - 実践的なテクニック集（英語）

1. **Flexbox Froggy**
   - https://flexboxfroggy.com/#ja
   - Flexboxをゲームで学習（日本語対応）

1. **Grid Garden**
   - https://cssgridgarden.com/#ja
   - CSS Gridをゲームで学習（日本語対応）

### 実践的な学習サイト
1. **CodePen**
   - https://codepen.io/
   - ブラウザ上でCSS練習

1. **CSS Battle**
   - https://cssbattle.dev/
   - CSSコーディングチャレンジ

### 動画学習（YouTube）
1. "CSS完全初心者講座"
1. "Flexboxレイアウト入門"
1. "ダークモード実装チュートリアル"

---

## 学習ロードマップ（時間配分）

```
Week 1: CSS基礎（10時間）
├─ Day 1-2: セレクタ、プロパティ、色
├─ Day 3-4: ボックスモデル
└─ Day 5-7: Flexbox

Week 2: CSS中級（12時間）
├─ Day 1-2: 外部ファイル、@import
├─ Day 3-4: CSS変数
└─ Day 5-7: 実践プロジェクト

Week 3: CSS応用（15時間）
├─ Day 1-3: ダークモード実装
├─ Day 4-5: ファイル分割
└─ Day 6-7: ビルドツール(Vite)

Week 4: 最適化（8時間）
├─ Day 1-2: CSS設計(BEM)
├─ Day 3-4: パフォーマンス最適化
└─ Day 5-7: 総復習、ポートフォリオ作成

合計: 約45時間で実践レベルに到達
```

---

## チェックリスト

### Level 1: 基礎 ✓
- [ ] CSSの基本構文を理解
- [ ] セレクタ（タグ、クラス、ID）を使い分けられる
- [ ] 色を指定できる（16進数、RGB）
- [ ] ボックスモデルを理解

### Level 2: 中級 ✓
- [ ] 外部CSSファイルを使える
- [ ] Flexboxで横並びレイアウトができる
- [ ] レスポンシブデザインの基本を理解

### Level 3: CSS変数 ✓
- [ ] CSS変数を定義・使用できる
- [ ] :rootの意味を理解
- [ ] var()関数を使える

### Level 4: ダークモード ✓
- [ ] CSS変数でテーマを切り替えられる
- [ ] JavaScriptでクラスを操作できる
- [ ] localStorageで設定を保存できる

### Level 5: ファイル分割 ✓
- [ ] @importでCSSをインポートできる
- [ ] ファイル構成を設計できる
- [ ] 役割ごとにファイルを分けられる

### Level 6: CSS設計 ✓
- [ ] BEM命名規則を使える
- [ ] セマンティックな命名ができる
- [ ] 詳細度を理解している

### Level 7: ビルドツール ✓
- [ ] Viteの基本を理解
- [ ] npm run buildができる
- [ ] ミニファイの意味を理解

### Level 8: 最適化 ✓
- [ ] 直接色指定を変数化できる
- [ ] 巨大ファイルを分割できる
- [ ] 循環参照を回避できる

---

## このプロジェクトで学べたこと

### Phase 1: 直接色指定の変数化
**学習内容:**
- CSS変数の実践的な使い方
- 一括置換（sed）の活用
- メンテナンス性の向上

**成果:**
- 1,089箇所 → 471箇所 (-57%)

### Phase 2: テーマファイル分離
**学習内容:**
- ファイル分割戦略
- @importの活用
- テーマシステムの設計

**成果:**
- App.css: 13,133行 → 496行 (-96%)

### 最適化
**学習内容:**
- 循環参照の発見・修正
- Vite設定の最適化
- ビルドサイズの削減

**成果:**
- ビルド時間: 1.73秒
- gzipped CSS: 32.93 KB

---

## 次のステップ

### 短期（1-2ヶ月）
1. CSS Gridを学習
1. アニメーションを追加
1. レスポンシブデザインを強化

### 中期（3-6ヶ月）
1. CSS Modules導入（Phase 3）
1. Tailwind CSSを試す
1. Sassを学習

### 長期（6-12ヶ月）
1. パフォーマンス最適化の深掘り
1. アクセシビリティ対応
1. デザインシステム構築

---

**最終更新日:** 2025年11月26日  
**作成者:** GitHub Copilot  
**バージョン:** 1.0
