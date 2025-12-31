---
description: パフォーマンス問題解決時のカテゴリ索引
category: performance
---

# 📂 Category: Performance

## 🎯 このカテゴリの対象

- パフォーマンス問題の診断
- パフォーマンスの最適化
- レスポンスタイム改善
- バンドルサイズ削減

---

## 🌳 判断が必要な場合: Decision Tree

**パフォーマンス最適化の判断に迷ったら、Decision Treeから開始してください**:

📄 **[Performance Decision Tree](../decision-trees/performance-decision.instructions.md)**

このDecision Treeが自動的に:
- ボトルネックの特定方法
- 最適化優先度の判定
- 最適化手法の選択
- 計測方法の提示

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. UI パフォーマンス優先ガイド ⭐ 最優先

📄 **[ui-performance-priority.instructions.md](../ui-performance-priority.instructions.md)**

**パフォーマンス優先度**:
1. 初回ロード時間
2. インタラクティブまでの時間（TTI）
3. レスポンスタイム
4. メモリ使用量

---

### 2. 効率ガード

📄 **[efficiency-guard.instructions.md](../efficiency-guard.instructions.md)**

**効率的な実装**:
- 不必要な再レンダリングを避ける
- 大量データの適切な処理
- メモ化の活用
- 遅延ロード

---

## 🔍 パフォーマンス診断

### Lighthouse

```bash
npm run lighthouse
```

**目標スコア**:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

---

### バンドルサイズチェック

```bash
npm run size

# 詳細分析
npm run size:why
```

**目標サイズ**:
- Main Bundle: 500 KB以下
- React Vendor: 200 KB以下
- CSS Bundle: 100 KB以下

---

### React DevTools Profiler

1. React DevTools をインストール
2. Profiler タブを開く
3. 記録開始
4. 操作を実行
5. 記録停止
6. レンダリング時間を確認

---

## 🎯 最適化手法

### 1. React 最適化

**memo / useMemo / useCallback**:
```typescript
// 高コストな計算
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// コールバックのメモ化
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// コンポーネントのメモ化
const MemoizedComponent = React.memo(MyComponent);
```

**仮想化**:
```typescript
// 大量データのレンダリング
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={35}
>
  {Row}
</FixedSizeList>
```

---

### 2. コード分割

```typescript
// 遅延ロード
const LazyComponent = React.lazy(() => import('./LazyComponent'));

<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

---

### 3. バンドル最適化

```typescript
// Tree shaking
import { specific } from 'library'; // ✅
import * as all from 'library';      // ❌

// 動的インポート
const module = await import('./module');
```

---

## 🧪 パフォーマンステスト

### 1. 手動測定

```typescript
console.time('operation');
// 処理
console.timeEnd('operation');
```

### 2. Performance API

```typescript
const start = performance.now();
// 処理
const end = performance.now();
console.log(`Duration: ${end - start}ms`);
```

### 3. React Profiler API

```typescript
<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

---

## 📊 パフォーマンスメトリクス

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: 2.5秒以下
- **FID (First Input Delay)**: 100ms以下
- **CLS (Cumulative Layout Shift)**: 0.1以下

### 追加メトリクス

- **FCP (First Contentful Paint)**: 1.8秒以下
- **TTI (Time to Interactive)**: 3.8秒以下
- **TBT (Total Blocking Time)**: 200ms以下

---

## 🚫 禁止事項

- ❌ 計測せずに最適化（推測での最適化）
- ❌ 早すぎる最適化
- ❌ 可読性を犠牲にした最適化
- ❌ 大量の不必要な再レンダリング
- ❌ 巨大なバンドルサイズを放置

---

## 📚 関連 Individual Instructions 一覧

- [ui-performance-priority.instructions.md](../ui-performance-priority.instructions.md) ⭐ 最優先
- [efficiency-guard.instructions.md](../efficiency-guard.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
