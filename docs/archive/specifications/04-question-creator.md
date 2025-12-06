# 問題作成機能仕様書

## 📌 概要

新しい英単語の問題を作成し、CSV形式でエクスポートする機能。

## 🎯 機能要件

### 基本機能
- 7項目の入力フォーム
- 入力バリデーション
- 問題リストへの追加
- CSV形式でのエクスポート
- 問題の削除・編集

### データ形式
標準7列CSV: `語句,読み,意味,語源等解説,関連語,関連分野,難易度`

## 📊 データ構造

### CreateViewState

```typescript
interface CreateViewState {
  newQuestion: Question;      // 現在編集中の問題
  createdQuestions: Question[]; // 作成済み問題リスト
}
```

### 入力フィールド

```typescript
const emptyQuestion: Question = {
  word: '',          // 英単語（必須）
  reading: '',       // 読み（ひらがな）
  meaning: '',       // 意味（必須）
  explanation: '',   // 語源等解説
  relatedWords: '',  // 関連語
  category: '',      // 関連分野
  difficulty: ''     // 難易度
};
```

## 🔧 実装詳細

### CreateView.tsx

**状態管理:**

```typescript
const [newQuestion, setNewQuestion] = useState<Question>(emptyQuestion);
const [createdQuestions, setCreatedQuestions] = useState<Question[]>([]);
```

**入力ハンドラ:**

```typescript
const handleChange = (field: keyof Question, value: string) => {
  setNewQuestion({
    ...newQuestion,
    [field]: value
  });
};
```

**問題追加:**

```typescript
const handleAddQuestion = () => {
  // バリデーション
  if (!newQuestion.word.trim() || !newQuestion.meaning.trim()) {
    alert('英単語と意味は必須です');
    return;
  }
  
  // 重複チェック
  const isDuplicate = createdQuestions.some(
    q => q.word.toLowerCase() === newQuestion.word.toLowerCase()
  );
  
  if (isDuplicate) {
    if (!confirm('同じ単語が既に存在します。追加しますか?')) {
      return;
    }
  }
  
  setCreatedQuestions([...createdQuestions, newQuestion]);
  setNewQuestion(emptyQuestion); // フォームリセット
};
```

**CSV生成:**

```typescript
const generateCSV = (questions: Question[]): string => {
  const header = '語句,読み,意味,語源等解説,関連語,関連分野,難易度';
  const rows = questions.map(q => {
    return [
      q.word,
      q.reading,
      q.meaning,
      q.explanation,
      q.relatedWords,
      q.category,
      q.difficulty
    ].map(field => {
      // カンマを含む場合はダブルクォートで囲む
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
};
```

**CSVダウンロード:**

```typescript
const handleExportCSV = () => {
  if (createdQuestions.length === 0) {
    alert('問題がありません');
    return;
  }
  
  const csv = generateCSV(createdQuestions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `questions_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
};
```

**問題削除:**

```typescript
const handleDelete = (index: number) => {
  if (confirm('この問題を削除しますか?')) {
    setCreatedQuestions(createdQuestions.filter((_, i) => i !== index));
  }
};
```

**問題編集:**

```typescript
const handleEdit = (index: number) => {
  const question = createdQuestions[index];
  setNewQuestion(question);
  setCreatedQuestions(createdQuestions.filter((_, i) => i !== index));
};
```

## 🎨 UI要素

### レイアウト構造

```
┌──────────────────────────────────┐
│ 新しい問題を作成                 │
├──────────────────────────────────┤
│ 英単語: [____________]  ※必須   │
│ 読み:   [____________]          │
│ 意味:   [____________]  ※必須   │
│ 語源等: [____________]          │
│ 関連語: [____________]          │
│ 分野:   [____________]          │
│ 難易度: [初級▼]                 │
│                                  │
│        [問題を追加]              │
├──────────────────────────────────┤
│ 作成済み問題 (3件)               │
├──────────────────────────────────┤
│ ┌────────────────────────────┐  │
│ │ 1. apple (りんご)          │  │
│ │    意味: りんご             │  │
│ │    [編集] [削除]           │  │
│ └────────────────────────────┘  │
│ ┌────────────────────────────┐  │
│ │ 2. banana (ばなな)         │  │
│ │    意味: バナナ             │  │
│ │    [編集] [削除]           │  │
│ └────────────────────────────┘  │
├──────────────────────────────────┤
│      [CSVでダウンロード]         │
└──────────────────────────────────┘
```

### スタイリング

```css
/* フォームコンテナ */
.create-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* 入力フォーム */
.question-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-group label .required {
  color: #f44336;
  margin-left: 0.25rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #2196F3;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

/* 追加ボタン */
.add-btn {
  width: 100%;
  padding: 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

/* 問題リスト */
.questions-list {
  margin-top: 2rem;
}

.questions-list h3 {
  margin-bottom: 1rem;
  color: #333;
}

.question-item {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  color: #2196F3;
}

.question-item-reading {
  color: #666;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.question-item-meaning {
  margin: 0.5rem 0;
  color: #333;
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
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-btn {
  background: #4CAF50;
  color: white;
}

.edit-btn:hover {
  background: #45a049;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover {
  background: #da190b;
}

/* エクスポートボタン */
.export-btn {
  width: 100%;
  padding: 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 2rem;
  transition: all 0.3s;
}

.export-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.export-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}
```

## 📋 バリデーションルール

### 必須フィールド
- `word` (英単語): 空白不可
- `meaning` (意味): 空白不可

### 推奨フィールド
- `reading` (読み): ひらがな推奨
- `difficulty` (難易度): 初級/中級/上級/専門

### オプションフィールド
- `explanation` (語源等解説)
- `relatedWords` (関連語)
- `category` (関連分野)

### 入力制限
```typescript
const validateQuestion = (question: Question): string[] => {
  const errors: string[] = [];
  
  if (!question.word.trim()) {
    errors.push('英単語は必須です');
  }
  
  if (!question.meaning.trim()) {
    errors.push('意味は必須です');
  }
  
  if (question.word.length > 100) {
    errors.push('英単語は100文字以内にしてください');
  }
  
  if (question.meaning.length > 200) {
    errors.push('意味は200文字以内にしてください');
  }
  
  return errors;
};
```

## 🔌 連携機能

### CSV形式互換性

生成されるCSVは`parseCSV()`関数で読み込み可能:

```typescript
// utils.ts
export function parseCSV(text: string): Question[] {
  // 生成されたCSVを正しくパースできる
}
```

### 既存データとの統合

```typescript
// エクスポートしたCSVを再度読み込み可能
<FileSelector onFileSelect={handleFileSelect} />
```

## ✅ テストシナリオ

1. **正常系**
   - 全フィールド入力 → 問題追加成功
   - 必須のみ入力 → 問題追加成功
   - 複数問題追加 → リスト表示
   - CSVエクスポート → ダウンロード成功

1. **バリデーション**
   - 英単語空白 → エラーメッセージ
   - 意味空白 → エラーメッセージ
   - 重複単語 → 確認ダイアログ

1. **編集・削除**
   - 編集ボタン → フォームに値が入る
   - 削除ボタン → 確認後削除

1. **CSV品質**
   - カンマを含む値 → クォートで囲む
   - 改行を含む値 → 正しくエスケープ
   - 日本語文字 → UTF-8で保存

## 📝 保守メモ

### CSV仕様
- エンコーディング: UTF-8 (BOM付き推奨)
- 区切り文字: カンマ
- エスケープ: ダブルクォート

### 将来の改善案
- 一括インポート機能
- 問題の並び替え
- カテゴリ・難易度のプリセット
- 画像添付機能
- 発音記号入力サポート
- ドラフト保存機能（LocalStorage）
