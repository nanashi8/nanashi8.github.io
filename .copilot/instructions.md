# 英単語クイズアプリ - 開発ガイドライン

このドキュメントは、`nanashi8/quiz-app`リポジトリの設計方針を参考にした開発ガイドラインです。

---

## 🎯 基本設計原則

### 1. シンプルさの追求

- **最小限の実装**: 必要な機能だけを実装
- **単一ファイル構成**: 小規模プロジェクトは1ファイルで完結
- **段階的な拡張**: 必要になってから機能を追加

### 2. 保守性の重視

- **読みやすいコード**: 変数名・関数名は意図が明確に伝わるように
- **適切なコメント**: 複雑なロジックには日本語で説明を追加
- **一貫性**: コーディングスタイルを統一

### 3. ユーザー体験の優先

- **直感的なUI**: 説明不要で使えるインターフェース
- **即座のフィードバック**: 操作結果が視覚的にわかりやすい
- **レスポンシブ**: モバイル・デスクトップ両対応

---

## 🏗️ アーキテクチャ原則

### Feature-First思考

機能ごとに責務を分離し、将来的な拡張に備える：

```
現状（プロトタイプ）:
├── index.html (全機能を1ファイルに統合)

将来の拡張例:
├── index.html (メイン画面)
├── js/
│   ├── quiz-logic.js (クイズロジック)
│   ├── question-data.js (問題データ)
│   └── score-manager.js (スコア管理)
└── css/
    └── styles.css (スタイル分離)
```

### 単一責任の原則（SRP）

各コンポーネントは1つの責務のみを持つ：

- **問題表示**: 問題文と選択肢を表示
- **正誤判定**: ユーザーの回答をチェック
- **スコア管理**: 正解数・正答率を計算
- **UI更新**: 視覚的なフィードバックを提供

### データとロジックの分離

```javascript
// 良い例: データとロジックを分離
const questions = [/* データ */];
function showQuestion() {/* ロジック */}

// 避ける: データとロジックが混在
function showQuestion() {
    const question = { /* データ */ };
    // ロジック...
}
```

---

## 📝 コーディング規約

### HTML

- **セマンティックなタグ**: 意味のあるタグを使用 (`<button>`, `<section>` など)
- **アクセシビリティ**: `alt`, `aria-label` などを適切に設定
- **明確なID/Class**: 目的がわかる命名 (`questionText`, `choice-btn`)

### CSS

- **モバイルファースト**: 基本スタイルはモバイル向け、大画面は`@media`で対応
- **再利用可能なクラス**: `.btn`, `.card` など汎用的なクラスを活用
- **CSS変数**: 色・サイズは変数で管理すると変更が容易

```css
:root {
    --primary-color: #667eea;
    --success-color: #4caf50;
    --error-color: #f44336;
}
```

### JavaScript

#### 命名規則

- **変数**: `camelCase` (例: `currentQuestion`, `correctAnswers`)
- **定数**: `UPPER_SNAKE_CASE` (例: `MAX_QUESTIONS`)
- **関数**: 動詞で始める (例: `showQuestion`, `checkAnswer`, `updateScore`)

#### 関数設計

```javascript
// 良い例: 単一責任
function shuffle(array) {
    // 配列をシャッフルするだけ
}

function showQuestion() {
    // 問題を表示するだけ
}

// 避ける: 複数の責務
function showQuestionAndCheckAnswer() {
    // 1つの関数で複数の処理
}
```

#### コメント

```javascript
// 意図を説明するコメント
// 配列をシャッフルする関数（Fisher-Yatesアルゴリズム）
function shuffle(array) {
    // ...
}

// 避ける: 明らかな内容の繰り返し
// 変数iを宣言
let i = 0;
```

---

## 🎨 UI/UX設計原則

### レスポンシブデザイン

```css
/* モバイル: 基本スタイル */
.container {
    padding: 20px;
}

/* タブレット以上 */
@media (min-width: 768px) {
    .container {
        padding: 40px;
    }
}
```

### 視覚的フィードバック

- **即座の反応**: ボタンクリックに対して即座に視覚変化
- **アニメーション**: `transition`で滑らかな変化
- **色による状態表現**: 正解=緑、不正解=赤、通常=グレー

### アクセシビリティ

- **十分なコントラスト**: テキストと背景のコントラスト比
- **大きなタップ領域**: ボタンは最低44px×44px
- **キーボード操作**: Tabキーで移動、Enterで選択可能

---

## 📊 データ構造

### 問題データの設計

```javascript
const questions = [
    {
        word: "apple",           // 英単語
        meaning: "りんご",       // 正解の意味
        choices: ["りんご", "バナナ", "オレンジ"],  // 選択肢
        hint: "果物"             // ヒント（省略可）
    }
];
```

#### 拡張例

```javascript
// 将来的に追加可能なプロパティ
{
    word: "apple",
    meaning: "りんご",
    choices: ["りんご", "バナナ", "オレンジ"],
    hint: "果物",
    difficulty: "easy",          // 難易度
    category: "food",            // カテゴリ
    example: "I eat an apple.",  // 例文
    pronunciation: "/ˈæp.əl/"    // 発音記号
}
```

---

## 🔄 状態管理

### アプリケーション状態

```javascript
// グローバル状態（最小限に）
let currentQuestion = 0;      // 現在の問題番号
let correctAnswers = 0;       // 正解数
let totalQuestions = 0;       // 総回答数
let answered = false;         // 回答済みフラグ
```

### 状態の更新パターン

```javascript
// 1. 状態を更新
correctAnswers++;

// 2. UIを更新
updateScore();

// 3. 次の状態へ遷移
showNextQuestion();
```

---

## 🚀 開発の進め方

### 段階的な開発

#### Phase 1: プロトタイプ（現状）
- ✅ 基本的なクイズ機能
- ✅ 3択問題の表示
- ✅ 正誤判定
- ✅ スコア表示

#### Phase 2: 機能拡張
- 問題数の増加
- カテゴリ別フィルター
- 難易度設定
- 学習履歴の保存（LocalStorage）

#### Phase 3: データ駆動化
- 外部JSONファイルから問題読み込み
- 問題の動的追加
- カスタム問題セットの作成

#### Phase 4: 高度な機能
- 適応型学習（間違えた問題を優先出題）
- スペースド・リピティション
- 統計情報の可視化

### ブランチ戦略

```bash
# 新機能開発
git checkout -b feature/category-filter
# 開発・コミット
git commit -m "Add category filter feature"
# mainにマージ
git checkout main
git merge feature/category-filter
```

### コミットメッセージ

```
✅ 良い例:
- Add category filter to quiz settings
- Fix score calculation bug
- Update responsive design for mobile

❌ 避ける:
- update
- fix bug
- changes
```

---

## 🧪 テストと品質保証

### 手動テスト項目

- [ ] モバイル（小画面）で正しく表示される
- [ ] タブレット・PC（大画面）で正しく表示される
- [ ] 正解を選択すると緑色になる
- [ ] 不正解を選択すると赤色になる
- [ ] スコアが正しく更新される
- [ ] 次の問題へ進める
- [ ] 問題がランダムに表示される

### ブラウザ互換性

- Chrome（最新版）
- Safari（iOS/macOS）
- Firefox（最新版）
- Edge（最新版）

---

## 📚 参考資料

### 設計方針の参考元

このガイドラインは以下のリポジトリの設計思想を参考にしています：

- **リポジトリ**: [nanashi8/quiz-app](https://github.com/nanashi8/quiz-app)
- **主要原則**:
  - Feature-First / Vertical Slice Architecture
  - 単一責任の原則（SRP）
  - 既存コードの尊重と段階的な改善
  - テスタビリティを考慮した設計

### 学習リソース

- **HTML/CSS**: [MDN Web Docs](https://developer.mozilla.org/)
- **JavaScript**: [JavaScript.info](https://javascript.info/)
- **レスポンシブデザイン**: [CSS-Tricks](https://css-tricks.com/)
- **アクセシビリティ**: [WebAIM](https://webaim.org/)

---

## 🔧 トラブルシューティング

### よくある問題

#### 問題が表示されない
```javascript
// 確認: questionsデータが正しく定義されているか
console.log(questions);
```

#### スコアが更新されない
```javascript
// 確認: updateScore()が呼ばれているか
function checkAnswer(selected, correct) {
    // ...
    updateScore(); // ← この行があるか確認
}
```

#### モバイルで崩れる
```css
/* 確認: viewport meta tagがあるか */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* 確認: メディアクエリが正しいか */
@media (max-width: 600px) {
    /* モバイル用スタイル */
}
```

---

## 💡 ベストプラクティス

### DO（推奨）

✅ コードは短く、シンプルに
✅ 変数名・関数名は説明的に
✅ コメントは「なぜ」を説明
✅ 機能ごとにコミット
✅ 動作確認してからプッシュ

### DON'T（非推奨）

❌ 過度な抽象化
❌ 不要な依存ライブラリ
❌ 複雑なネスト
❌ グローバル変数の乱用
❌ コメントなしの複雑なロジック

---

## 📈 将来の拡張性

### データ永続化

```javascript
// LocalStorageで学習履歴を保存
function saveProgress() {
    const progress = {
        correctAnswers,
        totalQuestions,
        lastPlayed: new Date().toISOString()
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('quizProgress');
    return saved ? JSON.parse(saved) : null;
}
```

### 外部データソース

```javascript
// JSONファイルから問題を読み込み
async function loadQuestions() {
    const response = await fetch('data/questions.json');
    const data = await response.json();
    return data.questions;
}
```

### 多言語対応

```javascript
const i18n = {
    ja: {
        title: "英単語3択クイズ",
        next: "次の問題へ"
    },
    en: {
        title: "English Vocabulary Quiz",
        next: "Next Question"
    }
};
```

---

## 🎓 まとめ

このガイドラインの核心：

1. **シンプルから始める**: 最小限の機能で動作するものを作る
2. **段階的に拡張**: 必要に応じて機能を追加
3. **保守性を重視**: 将来の自分が理解できるコード
4. **ユーザー第一**: 使いやすさと見やすさを最優先
5. **継続的改善**: 小さな改善を積み重ねる

**プロトタイプ → MVP → 完成版** のプロセスを楽しみながら開発しましょう！

---

**最終更新**: 2025-11-10  
**参考元**: [nanashi8/quiz-app](https://github.com/nanashi8/quiz-app)
