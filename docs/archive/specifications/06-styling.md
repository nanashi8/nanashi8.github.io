# スタイリング仕様書

## 📌 概要

アプリケーション全体のCSS設計、デザインシステム、レスポンシブ対応の詳細仕様。

## 🎨 デザインシステム

### カラーパレット

```css
:root {
  /* プライマリーカラー */
  --primary-blue: #2196F3;
  --primary-blue-dark: #1976D2;
  --primary-blue-light: #e3f2fd;
  
  /* セカンダリーカラー */
  --green-success: #4CAF50;
  --green-success-dark: #45a049;
  --red-error: #f44336;
  --red-error-dark: #da190b;
  --yellow-warning: #ffeb3b;
  --yellow-warning-dark: #fbc02d;
  
  /* グレースケール */
  --gray-900: #212121;
  --gray-700: #333333;
  --gray-600: #666666;
  --gray-400: #cccccc;
  --gray-200: #e0e0e0;
  --gray-100: #f5f5f5;
  --white: #ffffff;
  
  /* グラデーション */
  --gradient-purple: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* シャドウ */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.15);
  
  /* トランジション */
  --transition-fast: 0.2s;
  --transition-normal: 0.3s;
  
  /* ボーダーラディウス */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### タイポグラフィ

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--gray-700);
}

/* 見出し */
h1 { font-size: 2.5rem; font-weight: 700; }
h2 { font-size: 2rem; font-weight: 600; }
h3 { font-size: 1.5rem; font-weight: 600; }
h4 { font-size: 1.25rem; font-weight: 500; }

/* 英語表示用 */
.english-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1rem;
  font-weight: 500;
}
```

## 🏗️ レイアウト構造

### App全体のレイアウト

```css
#root {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.app-header {
  background: var(--gradient-purple);
  color: white;
  padding: 2rem;
  text-align: center;
}

.app-header h1 {
  margin: 0;
  font-size: 2.5rem;
}
```

### タブナビゲーション

```css
.tab-nav {
  display: flex;
  background: var(--gray-100);
  border-bottom: 2px solid var(--gray-200);
}

.tab-button {
  flex: 1;
  padding: 1rem 2rem;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--gray-600);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
}

.tab-button:hover {
  background: var(--gray-200);
  color: var(--gray-900);
}

.tab-button.active {
  background: white;
  color: var(--primary-blue);
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-blue);
}
```

### タブコンテンツエリア

```css
.tab-content {
  padding: 2rem;
  min-height: 500px;
  background: var(--gray-100);
}
```

## 🎯 和訳クイズのスタイル

```css
/* 問題カード */
.question-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  max-width: 600px;
  margin: 2rem auto;
}

.question-word {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: var(--primary-blue);
  margin: 2rem 0;
  font-family: 'Courier New', monospace;
}

/* 選択肢 */
.choices-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
}

.choice-btn {
  padding: 1.25rem;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: white;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
}

.choice-btn:hover:not(:disabled) {
  background: var(--gray-100);
  border-color: var(--primary-blue);
  transform: translateX(5px);
}

.choice-btn.correct {
  background: var(--green-success);
  color: white;
  border-color: var(--green-success);
}

.choice-btn.wrong {
  background: var(--red-error);
  color: white;
  border-color: var(--red-error);
}

.choice-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* ネクストボタン */
.next-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 1.5rem;
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.next-btn:hover {
  background: var(--primary-blue-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}
```

## ✏️ スペルクイズのスタイル

```css
/* 意味表示 */
.meaning-display {
  font-size: 1.5rem;
  text-align: center;
  color: var(--gray-700);
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--primary-blue-light);
  border-radius: var(--radius-md);
}

/* 単語表示エリア */
.word-blanks {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem 0;
  font-size: 2.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

/* 文字ボックス */
.letter-box {
  width: 3rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--primary-blue);
  border-radius: var(--radius-md);
  background: white;
}

.letter-box.blank {
  background: var(--gray-100);
  border-style: dashed;
  color: var(--gray-400);
}

.letter-box.correct {
  background: var(--green-success);
  color: white;
  border-color: var(--green-success);
  animation: correctPop 0.3s ease;
}

.letter-box.wrong {
  background: var(--red-error);
  color: white;
  border-color: var(--red-error);
  animation: shake 0.3s ease;
}

/* アニメーション */
@keyframes correctPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 文字選択肢 */
.letters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin: 2rem 0;
}

.letter-btn {
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
  font-weight: bold;
  border: 2px solid var(--primary-blue);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.letter-btn:hover:not(:disabled) {
  background: var(--primary-blue);
  color: white;
  transform: scale(1.1);
}

.letter-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: var(--gray-400);
}
```

## 📖 長文読解のスタイル

```css
/* コンテナ */
.reading-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* パッセージ選択 */
.passage-selector {
  margin-bottom: 1.5rem;
}

.passage-selector select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid var(--primary-blue);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  transition: border-color var(--transition-normal);
}

.passage-selector select:focus {
  outline: none;
  border-color: var(--primary-blue-dark);
}

/* フレーズリスト */
.reading-chunks {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

/* フレーズブロック */
.chunk-block {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform var(--transition-normal);
}

.chunk-block:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 英単語行 */
.chunk-words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* 単語ボタン */
.word-btn {
  padding: 0.5rem 1rem;
  background: var(--primary-blue-light);
  border: 2px solid var(--primary-blue);
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.word-btn:hover {
  background: var(--primary-blue);
  color: white;
  transform: translateY(-2px);
}

.word-btn.unknown {
  background: var(--yellow-warning);
  border-color: var(--yellow-warning-dark);
  font-weight: bold;
  box-shadow: 0 0 8px rgba(255, 235, 59, 0.6);
}

/* 単語の意味行 */
.chunk-word-meanings {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: var(--gray-600);
  font-size: 0.95rem;
  line-height: 1.8;
  padding: 0.5rem 0;
  border-top: 1px solid var(--gray-200);
  border-bottom: 1px solid var(--gray-200);
}

/* フレーズ和訳 */
.chunk-translation {
  background: var(--gradient-purple);
  color: white;
  padding: 1rem;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  margin-top: 0.5rem;
  box-shadow: var(--shadow-sm);
}

/* 送信ボタン */
.submit-unknown-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 2rem;
  background: var(--green-success);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.submit-unknown-btn:hover:not(:disabled) {
  background: var(--green-success-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.submit-unknown-btn:disabled {
  background: var(--gray-400);
  cursor: not-allowed;
  transform: none;
}
```

## 📝 問題作成のスタイル

```css
/* フォームコンテナ */
.create-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* 問題フォーム */
.question-form {
  background: white;
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  margin-bottom: 2rem;
}

/* フォームグループ */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--gray-700);
}

.form-group label .required {
  color: var(--red-error);
  margin-left: 0.25rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-normal);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-blue);
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

/* 問題アイテム */
.question-item {
  background: white;
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.question-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.question-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.question-item-word {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary-blue);
}

.question-item-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.edit-btn {
  background: var(--green-success);
  color: white;
}

.edit-btn:hover {
  background: var(--green-success-dark);
}

.delete-btn {
  background: var(--red-error);
  color: white;
}

.delete-btn:hover {
  background: var(--red-error-dark);
}
```

## 📱 レスポンシブデザイン

```css
/* タブレット */
@media (max-width: 768px) {
  #root {
    padding: 1rem;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
  
  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
  
  .tab-content {
    padding: 1rem;
  }
}

/* スマートフォン */
@media (max-width: 600px) {
  #root {
    padding: 0.5rem;
  }
  
  .app-header {
    padding: 1.5rem 1rem;
  }
  
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .tab-nav {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1 1 50%;
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
  
  .question-word {
    font-size: 2rem;
  }
  
  .word-blanks {
    font-size: 2rem;
    gap: 0.3rem;
  }
  
  .letter-box {
    width: 2.5rem;
    height: 3rem;
    font-size: 1.8rem;
  }
  
  .letter-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.2rem;
  }
  
  .chunk-block {
    padding: 1rem;
  }
  
  .word-btn {
    font-size: 1rem;
    padding: 0.4rem 0.8rem;
  }
}

/* 極小画面 */
@media (max-width: 400px) {
  .tab-button {
    flex: 1 1 100%;
  }
  
  .word-blanks {
    font-size: 1.5rem;
  }
  
  .letter-box {
    width: 2rem;
    height: 2.5rem;
    font-size: 1.5rem;
  }
}
```

## 🎭 アクセシビリティ

```css
/* フォーカス表示 */
*:focus {
  outline: 3px solid rgba(33, 150, 243, 0.5);
  outline-offset: 2px;
}

/* ハイコントラストモード対応 */
@media (prefers-contrast: high) {
  .choice-btn,
  .word-btn,
  .letter-btn {
    border-width: 3px;
  }
}

/* ダークモード対応（将来の拡張用） */
@media (prefers-color-scheme: dark) {
  /* ダークモードのスタイル */
}

/* モーション削減 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

## 📦 ユーティリティクラス

```css
/* マージン */
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

/* テキスト配置 */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

/* 表示制御 */
.hidden { display: none; }
.visible { display: block; }

/* フレックス */
.flex { display: flex; }
.flex-center { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

## 📝 保守メモ

### CSS変数の活用
カラー変更時は`:root`内の変数を編集するだけで全体に反映。

### BEM命名規則
Block__Element--Modifier形式を推奨（例: `.question-card__button--active`）

### パフォーマンス
- アニメーションは`transform`と`opacity`のみ使用
- 複雑なセレクタを避ける
- CSSは自動的にViteでミニファイされる
