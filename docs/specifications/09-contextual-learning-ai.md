# 09. 文脈学習AI仕様書

## 🔗 概要

文脈学習AIは、意味的に関連する単語をグループ化し、文脈的学習を促進するAIシステムです。類似単語や対義語を連続出題することで、記憶の定着を強化し、学習効率を向上させます。

### 主な機能

- **意味的クラスタリング**: 関連単語をテーマ別にグループ化
- **関連単語検出**: 類似語・対義語・同じテーマの単語を抽出
- **文脈ベース出題順序**: 関連単語を近くに配置して学習効率を向上
- **テーマ別学習**: ストーリー性のある単語シーケンスを生成

---

## 🎯 機能仕様

### 1. 意味的関連性のタイプ

```typescript
export type SemanticRelationType = 
  | 'synonym'       // 類義語
  | 'antonym'       // 対義語
  | 'category'      // 同じカテゴリー
  | 'theme'         // 同じテーマ
  | 'word_family'   // 語源が同じ
  | 'collocation'   // よく一緒に使われる
  | 'context';      // 同じ文脈で使われる
```

### 2. テーマ定義

```typescript
const SEMANTIC_THEMES = {
  emotions: {
    name: '感情',
    keywords: ['happy', 'sad', 'angry', 'excited', 'worried'],
    relatedCategories: ['形容詞']
  },
  movement: {
    name: '動作・移動',
    keywords: ['walk', 'run', 'jump', 'fly', 'swim'],
    relatedCategories: ['動詞']
  },
  time: {
    name: '時間',
    keywords: ['day', 'night', 'morning', 'evening', 'week'],
    relatedCategories: ['名詞', '副詞']
  },
  weather: {
    name: '天気',
    keywords: ['sunny', 'rainy', 'cloudy', 'windy', 'snowy'],
    relatedCategories: ['形容詞', '名詞']
  }
};
```

### 3. 対義語ペア

```typescript
const ANTONYM_PAIRS = [
  ['big', 'small'],
  ['long', 'short'],
  ['happy', 'sad'],
  ['day', 'night'],
  ['start', 'end'],
  ['love', 'hate']
];
```

### 4. 類義語グループ

```typescript
const SYNONYM_GROUPS = [
  ['big', 'large', 'huge', 'enormous'],
  ['happy', 'glad', 'joyful', 'pleased'],
  ['difficult', 'hard', 'tough', 'challenging']
];
```

### 5. クラスター生成

```typescript
export function generateSemanticClusters(
  questions: Question[],
  wordProgress: Record<string, WordProgress>
): SemanticCluster[] {
  const clusters: SemanticCluster[] = [];
  
  // テーマベースのクラスタリング
  Object.entries(SEMANTIC_THEMES).forEach(([themeId, theme]) => {
    const themeWords = questions.filter(q => {
      const word = q.word.toLowerCase();
      return theme.keywords.some(keyword => word.includes(keyword));
    }).map(q => q.word);
    
    if (themeWords.length >= 2) {
      clusters.push({
        id: `theme_${themeId}`,
        name: theme.name,
        theme: themeId,
        words: themeWords,
        relationType: 'theme',
        priority: 50
      });
    }
  });
  
  return clusters;
}
```

### 6. 最適な出題順序

```typescript
export function optimizeQuestionSequence(
  questions: Question[],
  clusters: SemanticCluster[]
): string[] {
  const sequence: string[] = [];
  const used = new Set<string>();
  
  // クラスター内の単語を連続して出題
  clusters.forEach(cluster => {
    cluster.words.forEach(word => {
      if (!used.has(word)) {
        sequence.push(word);
        used.add(word);
      }
    });
  });
  
  // 残りの単語を追加
  questions.forEach(q => {
    if (!used.has(q.word)) {
      sequence.push(q.word);
    }
  });
  
  return sequence;
}
```

---

## 📚 関連ドキュメント

- [07. 認知負荷管理AI](./07-cognitive-load-ai.md) - 疲労度検出
- [08. エラー予測AI](./08-error-prediction-ai.md) - 誤答リスク予測
- [12. 学習曲線AI](./12-learning-curve-ai.md) - 習得速度の予測
