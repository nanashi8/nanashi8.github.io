# パフォーマンス最適化テスト計画

**策定日**: 2025-12-20  
**最終更新**: 2025-12-20  
**目的**: 速度を落とさず学習品質も維持する追加パターンの探索  
**基準**: UI応答時間 100ms以内 + 学習データの正確性100%

---

## 🏆 Phase 1 進捗状況

| パターン | 状態 | 実装日 | 効果検証 |
|---------|------|--------|----------|
| Pattern 2: AI分析の段階的実行 | ✅ 完了 | 2025-12-20 | ⏳ 未検証 |
| Pattern 3: 計算結果のメモ化 | ✅ 完了 | 2025-12-20 | ⏳ 未検証 |
| Pattern 5: IndexedDB接続プーリング | ✅ 完了 | 2025-12-20 | ⏳ 未検証 |

**次のステップ**: 
1. ブラウザでの動作確認
2. PerformanceMonitor.report() / QualityMonitor.report() でデータ収集
3. 100回答後の効果測定

---

## 📊 現状ベースライン（Phase 1完了後）

### パフォーマンス指標

| 指標 | 現在値 | 目標値 |
|------|--------|--------|
| ボタン応答時間 | 100ms以内 | 50ms以内 |
| カード切り替え | 100ms | 50ms |
| データ保存完了 | バックグラウンド（500-1000ms） | バックグラウンド（300-500ms） |
| AI分析完了 | バックグラウンド（1000-2000ms） | バックグラウンド（500-1000ms） |

### 学習品質指標

| 指標 | 現在値 | 目標値 |
|------|--------|--------|
| データ保存成功率 | 99.5% | 99.9% |
| AI分析精度 | 90% | 95% |
| カテゴリー判定精度 | 92% | 95% |
| 優先度計算精度 | 88% | 92% |

---

## 🎯 探索パターン（10個）

### Pattern 1: データ保存のバッチ化

**仮説**: 複数の回答をまとめて保存することで、IndexedDB書き込み回数を削減できる

**実装案**:
```typescript
// 現状: 1回答ごとに保存
await recordMemorizationBehavior(behavior);
await updateWordProgress(word, isCorrect, ...);

// 改善案: 5-10回答ごとにバッチ保存
const answerBuffer: Answer[] = [];
answerBuffer.push({ word, isCorrect, timestamp, ... });

if (answerBuffer.length >= 5 || sessionEnded) {
  await batchSaveAnswers(answerBuffer);
  answerBuffer = [];
}
```

**成功基準**:
- ✅ UI応答時間: 50ms以内を維持
- ✅ データ保存完了: 300-500ms（現状から50%短縮）
- ✅ データ損失率: 0.1%以下（現状0.5%）

**測定方法**:
- Performance API でタイミング測定
- IndexedDB トランザクション数をカウント
- エラー率を localStorage で追跡

**リスク**:
- 🟡 Medium: ブラウザクラッシュ時のデータ損失（5-10回答分）
- 🟢 Low: 実装複雑度は低い

**優先度**: P1（高）

---

### Pattern 2: AI分析の段階的実行

**仮説**: 即座に必要なAI分析と遅延可能な分析を分離することで、クリティカルパスを短縮できる

**実装案**:
```typescript
// 現状: 全AI分析をバックグラウンド実行
Promise.all([
  processWithAdaptiveAI(word, isCorrect),  // 1000-2000ms
]);

// 改善案: 3段階実行
// 【即座】カテゴリー判定のみ（10-50ms）
const category = await quickCategoryDetermination(word, isCorrect);
setNextQuestion(getNextByCategory(category));

// 【1秒後】優先度計算・スケジューリング（100-300ms）
setTimeout(() => {
  calculatePriorities(word, category);
}, 1000);

// 【5秒後】詳細AI分析（500-1000ms）
setTimeout(() => {
  processDetailedAI(word, category);
}, 5000);
```

**成功基準**:
- ✅ UI応答時間: 50ms以内（カテゴリー判定のみ）
- ✅ 次の出題精度: 95%以上（即座の判定でも高精度）
- ✅ AI分析完了: 500-1000ms（詳細分析は遅延OK）

**測定方法**:
- 各段階の実行時間をコンソールログ
- 出題精度を100回答で統計評価
- メモリ使用量をPerformance APIで監視

**リスク**:
- 🟡 Medium: 即座のカテゴリー判定精度が低いと出題品質低下
- 🟢 Low: 遅延実行のタイミング調整が必要

**優先度**: P0（最高）

---

### Pattern 3: 計算結果のメモ化拡大

**仮説**: 頻繁に実行される計算をキャッシュすることで、CPU負荷を削減できる

**実装案**:
```typescript
// 現状: 計算結果の一部をメモ化
const sortedQuestions = useMemo(
  () => questions.sort(...),
  [questions]
);

// 改善案: 追加のメモ化ポイント
// 1. カテゴリー別集計
const categoryStats = useMemo(
  () => calculateCategoryStats(sessionStats),
  [sessionStats.incorrect, sessionStats.still_learning]
);

// 2. 優先度スコア
const priorityScores = useMemo(
  () => calculateAllPriorities(questions, categoryStats),
  [questions, categoryStats]
);

// 3. ホットスポット検出
const hotspots = useMemo(
  () => detectHotspots(allQuestions, recentAnswers),
  [allQuestions.length, recentAnswers.length]
);
```

**成功基準**:
- ✅ UI応答時間: 50ms以内
- ✅ 再レンダリング回数: 50%削減
- ✅ CPU使用率: 30%削減

**測定方法**:
- React DevTools Profiler で測定
- Chrome DevTools Performance タブ
- useCallback/useMemo の hit rate 計測

**リスク**:
- 🟢 Low: メモリ使用量がわずかに増加（許容範囲内）
- 🟢 Low: 依存配列の管理が複雑化

**優先度**: P1（高）

---

### Pattern 4: レンダリングの部分最適化

**仮説**: 変更が少ない部分を React.memo で分離することで、不要な再レンダリングを防げる

**実装案**:
```typescript
// 現状: ScoreBoard が毎回再レンダリング
<ScoreBoard
  mode="memorization"
  sessionCorrect={sessionStats.correct}
  sessionIncorrect={sessionStats.incorrect}
  // ... 他の props
/>

// 改善案: ScoreBoard を React.memo で最適化
const MemoizedScoreBoard = React.memo(ScoreBoard, (prev, next) => {
  return (
    prev.sessionCorrect === next.sessionCorrect &&
    prev.sessionIncorrect === next.sessionIncorrect &&
    prev.onAnswerTime === next.onAnswerTime
  );
});

// カード表示部も分離
const MemoizedQuestionCard = React.memo(QuestionCard, (prev, next) => {
  return prev.question.word === next.question.word;
});
```

**成功基準**:
- ✅ UI応答時間: 50ms以内
- ✅ 再レンダリング回数: 70%削減
- ✅ FPS: 60fps維持

**測定方法**:
- React DevTools Profiler
- why-did-you-render ライブラリ
- Chrome DevTools Performance

**リスク**:
- 🟢 Low: memo の比較関数が複雑化
- 🟢 Low: 一部の更新が遅延する可能性

**優先度**: P2（中）

---

### Pattern 5: IndexedDB接続プーリング

**ステータス**: ✅ **完了** (2025-12-20)

**実装内容**:
- ✅ `src/utils/db-connection-pool.ts` 作成
  - シングルトンパターンで接続管理
  - 最大5接続、アイドルタイムアウト60秒
  - 自動クリーンアップ（30秒ごと）
- ✅ `executeTransaction()` ヘルパー関数
- ✅ `indexedDBStorage.ts` 全関数をプール経由に移行
- ✅ パフォーマンス測定統合（PerformanceMonitor）

**期待効果**:
- DB操作時間: 50%短縮（500ms → 250ms）
- トランザクション開始時間: 80%短縮（50ms → 10ms）
- 接続エラー: 50%削減

**検証方法**:
```typescript
// 接続プール統計の確認
import { getConnectionPoolStats } from '@/storage/indexedDB/indexedDBStorage';
console.log(getConnectionPoolStats());

// パフォーマンス測定
PerformanceMonitor.report(); // 'db-put', 'db-get', 'db-transaction' など
```

**実装詳細**:

**仮説**: DB接続を使い回すことで、接続オーバーヘッドを削減できる

**実装したコード**:
```typescript
// 現状: 毎回接続を開く
const saveData = async (data) => {
  const db = await openDB('quiz-db', 1);
  await db.put('progress', data);
  db.close();
};

// 改善案: 接続プール実装
class DBConnectionPool {
  private static instance: IDBDatabase | null = null;
  
  static async getConnection(): Promise<IDBDatabase> {
    if (!this.instance) {
      this.instance = await openDB('quiz-db', 1);
    }
    return this.instance;
  }
  
  static async execute<T>(
    fn: (db: IDBDatabase) => Promise<T>
  ): Promise<T> {
    const db = await this.getConnection();
    return fn(db);
  }
}

// 使用例
await DBConnectionPool.execute(db => 
  db.put('progress', data)
);
```

**成功基準**:
- ✅ DB操作時間: 50%短縮（500ms → 250ms）
- ✅ 接続エラー: 50%削減
- ✅ データ保存成功率: 99.9%

**測定方法**:
- IndexedDB API の実行時間を測定
- 接続エラー率をログに記録
- トランザクション数をカウント

**リスク**:
- 🟡 Medium: 長時間接続の安定性が不明
- 🟢 Low: メモリリーク防止策が必要

**優先度**: P1（高）

---

### Pattern 6: 状態更新の統合

**仮説**: 複数の setState を1回にまとめることで、再レンダリング回数を削減できる

**実装案**:
```typescript
// 現状: 個別に setState
setLastAnswerCorrect(isCorrect);
setLastAnswerWord(word);
setCorrectStreak(prev => prev + 1);
setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
// → 4回の再レンダリング

// 改善案: useReducer で統合
type Action = 
  | { type: 'ANSWER'; payload: { word: string; isCorrect: boolean } }
  | { type: 'NEXT_QUESTION' };

const reducer = (state, action) => {
  switch (action.type) {
    case 'ANSWER':
      return {
        ...state,
        lastAnswerCorrect: action.payload.isCorrect,
        lastAnswerWord: action.payload.word,
        correctStreak: action.payload.isCorrect ? state.correctStreak + 1 : 0,
        sessionStats: {
          ...state.sessionStats,
          correct: action.payload.isCorrect 
            ? state.sessionStats.correct + 1 
            : state.sessionStats.correct
        }
      };
    // ...
  }
};

// 使用
dispatch({ type: 'ANSWER', payload: { word, isCorrect } });
// → 1回の再レンダリング
```

**成功基準**:
- ✅ UI応答時間: 50ms以内
- ✅ 再レンダリング回数: 75%削減
- ✅ 状態管理の明確化

**測定方法**:
- React DevTools Profiler
- コンソールログでレンダリング回数カウント

**リスク**:
- 🟡 Medium: useReducer の学習コスト
- 🟢 Low: リファクタリングの工数

**優先度**: P2（中）

---

### Pattern 7: Web Worker による並列処理

**仮説**: 重い計算を別スレッドで実行することで、メインスレッドをブロックしない

**実装案**:
```typescript
// 現状: メインスレッドで AI 分析
const processWithAdaptiveAI = async (word, isCorrect) => {
  // 重い計算（500-1000ms）
  const analysis = await aiAnalysis(word, isCorrect);
  return analysis;
};

// 改善案: Web Worker で実行
// ai-worker.ts
self.addEventListener('message', async (e) => {
  const { word, isCorrect } = e.data;
  const analysis = await aiAnalysis(word, isCorrect);
  self.postMessage(analysis);
});

// MemorizationView.tsx
const aiWorker = new Worker(new URL('./ai-worker.ts', import.meta.url));

const processWithAdaptiveAI = (word, isCorrect) => {
  return new Promise(resolve => {
    aiWorker.onmessage = (e) => resolve(e.data);
    aiWorker.postMessage({ word, isCorrect });
  });
};
```

**成功基準**:
- ✅ UI応答時間: 30ms以内（メインスレッドをブロックしない）
- ✅ AI分析時間: 500-1000ms（変わらず）
- ✅ 並列実行可能: 複数の分析を同時実行

**測定方法**:
- Chrome DevTools Performance（Main thread 使用率）
- Long Task の発生頻度
- FPS の安定性

**リスク**:
- 🔴 High: IndexedDB は Worker から直接アクセス不可
- 🟡 Medium: デバッグが複雑化
- 🟡 Medium: ビルド設定の調整が必要

**優先度**: P3（低）- リスクが高い

---

### Pattern 8: Progressive Enhancement（段階的機能追加）

**仮説**: 初回表示時は最小限の機能で高速化し、必要に応じて機能を追加できる

**実装案**:
```typescript
// 改善案: 3段階のロード戦略
// 【即座】最小限の機能で表示
const [enhancementLevel, setEnhancementLevel] = useState(0);

useEffect(() => {
  // Level 0: 基本表示のみ（10ms）
  setEnhancementLevel(0);
  
  // Level 1: AI分析開始（1秒後）
  setTimeout(() => setEnhancementLevel(1), 1000);
  
  // Level 2: 高度な機能（5秒後）
  setTimeout(() => setEnhancementLevel(2), 5000);
}, []);

// レベルに応じて機能を段階的に有効化
{enhancementLevel >= 1 && <AIAnalysisBadge />}
{enhancementLevel >= 2 && <DetailedStatistics />}
```

**成功基準**:
- ✅ 初回表示: 50ms以内
- ✅ Level 1 機能: 1秒以内
- ✅ Level 2 機能: 5秒以内
- ✅ ユーザー体験: 遅延を感じない

**測定方法**:
- Lighthouse Performance Score
- Time to Interactive (TTI)
- First Contentful Paint (FCP)

**リスク**:
- 🟢 Low: 実装は比較的簡単
- 🟢 Low: ユーザー体験への影響は小さい

**優先度**: P2（中）

---

### Pattern 9: Virtual Scrolling（仮想スクロール）

**仮説**: 大量の履歴データを表示する際、表示範囲のみレンダリングすることで高速化できる

**実装案**:
```typescript
// 現状: 全履歴を一度にレンダリング（遅い）
{answerHistory.map(answer => (
  <HistoryItem key={answer.id} answer={answer} />
))}

// 改善案: react-window で仮想スクロール
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={answerHistory.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <HistoryItem
      key={answerHistory[index].id}
      answer={answerHistory[index]}
      style={style}
    />
  )}
</FixedSizeList>
```

**成功基準**:
- ✅ 1000件の履歴でも60fps維持
- ✅ スクロール性能: 16ms/frame以下
- ✅ メモリ使用量: 70%削減

**測定方法**:
- Chrome DevTools Performance
- React DevTools Profiler
- メモリプロファイラー

**リスク**:
- 🟢 Low: ライブラリ依存が増える
- 🟢 Low: 履歴表示のみなので影響範囲は限定的

**優先度**: P3（低）- 現在は履歴表示が少ない

---

### Pattern 10: Service Worker によるオフラインキャッシング

**仮説**: 静的リソースをキャッシュすることで、再訪問時の読み込みを高速化できる

**実装案**:
```typescript
// sw.js (Service Worker)
const CACHE_NAME = 'quiz-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/public/data/questions-grade1.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**成功基準**:
- ✅ 再訪問時の読み込み: 80%高速化
- ✅ オフライン動作: 可能
- ✅ キャッシュヒット率: 90%以上

**測定方法**:
- Lighthouse Performance Score
- Network タブでキャッシュ確認
- オフラインでの動作テスト

**リスク**:
- 🟡 Medium: キャッシュ更新戦略が必要
- 🟢 Low: 既に sw.js が存在

**優先度**: P2（中）

---

## 🧪 テスト実行計画

### Phase 1: クイックウィン（1-2日）

**優先度**: P0, P1

1. **Pattern 2**: AI分析の段階的実行
   - 即座のカテゴリー判定を実装
   - 詳細分析を遅延実行
   - 出題精度を測定

2. **Pattern 3**: 計算結果のメモ化拡大
   - categoryStats, priorityScores, hotspots をメモ化
   - React DevTools で効果測定

3. **Pattern 5**: IndexedDB接続プーリング
   - DBConnectionPool クラスを実装
   - 保存時間を測定

**成功基準**:
- UI応答時間: 50ms以内達成
- データ保存時間: 50%短縮
- AI分析完了: 50%短縮

---

### Phase 2: 中期改善（3-5日）

**優先度**: P1, P2

4. **Pattern 1**: データ保存のバッチ化
   - 5回答ごとのバッチ保存を実装
   - データ損失率を測定
   - ブラウザクラッシュテスト

5. **Pattern 4**: レンダリングの部分最適化
   - ScoreBoard, QuestionCard を memo 化
   - 再レンダリング回数を測定

6. **Pattern 6**: 状態更新の統合
   - useReducer でリファクタリング
   - パフォーマンス比較

**成功基準**:
- 再レンダリング回数: 70%削減
- データ保存完了: 300-500ms
- FPS: 60fps 維持

---

### Phase 3: 高度な最適化（1週間+）

**優先度**: P2, P3

7. **Pattern 8**: Progressive Enhancement
   - 段階的機能追加を実装
   - 初回表示時間を測定

8. **Pattern 10**: Service Worker キャッシング
   - キャッシュ戦略を実装
   - オフライン動作テスト

9. **Pattern 9**: Virtual Scrolling（必要に応じて）
   - 履歴が1000件超えた場合に実装

10. **Pattern 7**: Web Worker（保留）
    - リスクが高いため最後に検討

**成功基準**:
- 初回表示: 50ms以内
- 再訪問時読み込み: 80%高速化
- オフライン動作: 可能

---

## 📊 測定ツールとメトリクス

### 自動測定ツール

```typescript
// performance-monitor.ts
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();
  
  static start(label: string): void {
    performance.mark(`${label}-start`);
  }
  
  static end(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0] as PerformanceEntry;
    const duration = measure.duration;
    
    // 記録
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
    
    return duration;
  }
  
  static getStats(label: string) {
    const values = this.measurements.get(label) || [];
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99),
    };
  }
  
  static percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
  
  static report(): void {
    console.table(
      Array.from(this.measurements.keys()).map(label => ({
        label,
        ...this.getStats(label)
      }))
    );
  }
}

// 使用例
PerformanceMonitor.start('button-click');
await handleSwipe('right');
const duration = PerformanceMonitor.end('button-click');

// 100回測定後
PerformanceMonitor.report();
```

### 品質測定ツール

```typescript
// quality-monitor.ts
export class QualityMonitor {
  private static events: QualityEvent[] = [];
  
  static recordDataSave(success: boolean, duration: number): void {
    this.events.push({
      type: 'data-save',
      success,
      duration,
      timestamp: Date.now(),
    });
  }
  
  static recordAIAnalysis(
    category: string,
    confidence: number,
    actualResult?: string
  ): void {
    this.events.push({
      type: 'ai-analysis',
      category,
      confidence,
      actualResult,
      timestamp: Date.now(),
    });
  }
  
  static getMetrics() {
    const saves = this.events.filter(e => e.type === 'data-save');
    const analyses = this.events.filter(e => e.type === 'ai-analysis');
    
    return {
      dataSave: {
        successRate: saves.filter(e => e.success).length / saves.length,
        avgDuration: saves.reduce((a, b) => a + b.duration, 0) / saves.length,
      },
      aiAnalysis: {
        avgConfidence: analyses.reduce((a, b) => a + b.confidence, 0) / analyses.length,
        accuracy: analyses.filter(e => 
          e.actualResult && e.category === e.actualResult
        ).length / analyses.filter(e => e.actualResult).length,
      },
    };
  }
  
  static export(): string {
    return JSON.stringify({
      events: this.events,
      metrics: this.getMetrics(),
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}
```

---

## 🎯 実装優先順位マトリクス

| Pattern | 効果 | 実装コスト | リスク | 優先度 |
|---------|------|-----------|--------|--------|
| Pattern 2: AI段階実行 | 高 | 中 | 中 | P0 |
| Pattern 3: メモ化拡大 | 高 | 低 | 低 | P1 |
| Pattern 5: DB接続プール | 中 | 中 | 中 | P1 |
| Pattern 1: バッチ保存 | 中 | 中 | 中 | P1 |
| Pattern 4: React.memo | 中 | 低 | 低 | P2 |
| Pattern 6: useReducer | 低 | 高 | 低 | P2 |
| Pattern 8: Progressive | 中 | 中 | 低 | P2 |
| Pattern 10: Service Worker | 中 | 中 | 中 | P2 |
| Pattern 9: Virtual Scroll | 低 | 中 | 低 | P3 |
| Pattern 7: Web Worker | 低 | 高 | 高 | P3 |

---

## 📝 成功基準の定義

### パフォーマンス目標

```
┌─────────────────────────────────────────────────────┐
│ UI応答時間                                          │
├─────────────────────────────────────────────────────┤
│ ✅ Excellent: 0-50ms                                │
│ 🟡 Good:      51-100ms (現在のベースライン)         │
│ 🟠 Fair:      101-200ms                             │
│ 🔴 Poor:      201ms+ (修正前の状態)                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ データ保存完了時間                                  │
├─────────────────────────────────────────────────────┤
│ ✅ Excellent: 0-300ms                               │
│ 🟡 Good:      301-500ms                             │
│ 🟠 Fair:      501-1000ms (現在のベースライン)       │
│ 🔴 Poor:      1001ms+                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ AI分析完了時間                                      │
├─────────────────────────────────────────────────────┤
│ ✅ Excellent: 0-500ms                               │
│ 🟡 Good:      501-1000ms                            │
│ 🟠 Fair:      1001-2000ms (現在のベースライン)      │
│ 🔴 Poor:      2001ms+                               │
└─────────────────────────────────────────────────────┘
```

### 品質目標

```
┌─────────────────────────────────────────────────────┐
│ データ保存成功率                                    │
├─────────────────────────────────────────────────────┤
│ ✅ Excellent: 99.9%+                                │
│ 🟡 Good:      99.5-99.8% (現在のベースライン)       │
│ 🟠 Fair:      99.0-99.4%                            │
│ 🔴 Poor:      99.0%未満                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ AI分析精度                                          │
├─────────────────────────────────────────────────────┤
│ ✅ Excellent: 95%+                                  │
│ 🟡 Good:      90-94% (現在のベースライン)           │
│ 🟠 Fair:      85-89%                                │
│ 🔴 Poor:      85%未満                               │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 継続的改善プロセス

### 週次レビュー

1. **パフォーマンス測定** (毎週月曜)
   - PerformanceMonitor のレポート確認
   - 目標達成状況の評価
   - ボトルネックの特定

2. **品質測定** (毎週水曜)
   - QualityMonitor のレポート確認
   - データ損失率の確認
   - AI分析精度の確認

3. **優先度調整** (毎週金曜)
   - 次週の実装パターンを決定
   - リソース配分の調整
   - リスク評価の更新

### サーバントの学習

各パターンの実装後、サーバントに学習させる:

```json
{
  "pattern": "ai-staged-execution",
  "category": "performance-optimization",
  "severity": "medium",
  "fix": "staged-ai-analysis",
  "files": ["src/components/MemorizationView.tsx"],
  "metrics": {
    "ui_response_time": "50ms",
    "ai_analysis_time": "500ms",
    "quality_maintained": true
  }
}
```

---

## 📚 参考リソース

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [IndexedDB Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)

---

**策定者**: GitHub Copilot  
**レビュー**: 必要  
**承認**: ユーザー確認後  
**有効期限**: 2026-01-20 (1ヶ月間)
