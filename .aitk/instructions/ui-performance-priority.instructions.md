---
description: UI/UXパフォーマンス最優先指示 - 生徒の学習を妨げないための必須原則
applyTo: '**/*.{ts,tsx,js,jsx}'
priority: CRITICAL
---

# 🎯 UI/UXパフォーマンス最優先原則

## 🚨 第一原則: 生徒の学習を妨げない

**ユーザー体験の絶対的優先事項:**
- ボタンクリックやスワイプには**即座に反応**すること
- データ保存やAI分析を**待たない**こと
- UIレスポンスは**100ms以内**を目標とする
- 重い処理は**必ずバックグラウンド実行**すること

## ❌ 絶対に避けるべきアンチパターン

### 1. UI更新前の重い処理待機

```typescript
// ❌ BAD: ユーザーがボタンを押しても数秒間待たされる
const handleButtonClick = async () => {
  await saveToDatabase();      // IndexedDB書き込み待機（遅い！）
  await updateStatistics();     // 統計計算待機（遅い！）
  await processWithAI();        // AI分析待機（遅い！）
  
  // ↑ここまで2-3秒かかる = 最悪のUX
  setNextQuestion();            // やっと次の問題へ
};
```

### 2. 複数の await を連鎖

```typescript
// ❌ BAD: 直列実行で時間が累積
await operation1();  // 500ms
await operation2();  // 700ms
await operation3();  // 400ms
// 合計: 1600ms = 1.6秒の遅延！
```

### 3. 不必要な再計算やレンダリング

```typescript
// ❌ BAD: 毎回全データを再計算
const sortedData = questions.sort(...);  // useCallbackなし
const filteredData = data.filter(...);    // useMemoなし
```

## ✅ 推奨パターン: UI最優先アーキテクチャ

### パターン1: 即座のUI更新 + バックグラウンド処理

```typescript
// ✅ GOOD: UI更新を最優先、データ保存は後回し
const handleButtonClick = async () => {
  // ステップ1: 即座にUI更新（同期処理のみ）
  const currentData = captureCurrentState();
  setNextQuestion();           // 🚀 即座に次の問題へ
  setLastAnswerTime(Date.now());
  setSessionStats(prev => ({ ...prev, answered: prev.answered + 1 }));
  
  // ステップ2: バックグラウンド処理（非同期・非ブロッキング）
  Promise.all([
    saveToDatabase(currentData),
    updateStatistics(currentData),
    processWithAI(currentData)
  ]).catch(error => {
    logger.error('バックグラウンド処理エラー:', error);
    // エラーがあってもUIは既に更新済み = 学習は妨げられない
  });
};
```

### パターン2: Promise.all で並列実行

```typescript
// ✅ GOOD: 複数の処理を並列実行
await Promise.all([
  operation1(),  // 同時実行
  operation2(),  // 同時実行
  operation3()   // 同時実行
]);
// 合計: max(500ms, 700ms, 400ms) = 700ms
// 改善: 1600ms → 700ms (56%高速化)
```

### パターン3: useMemo/useCallback で最適化

```typescript
// ✅ GOOD: 不要な再計算を防ぐ
const sortedQuestions = useMemo(
  () => questions.sort((a, b) => a.priority - b.priority),
  [questions]
);

const handleClick = useCallback(
  (id: string) => { /* ... */ },
  [dependencies]
);
```

## 📊 実例: 暗記タブのパフォーマンス修正

### 修正前（❌ 問題あり）

```typescript
const handleSwipe = async (direction) => {
  // UI更新前に重い処理を待機
  await recordMemorizationBehavior(behavior);  // 遅延1
  await updateWordProgress(...);                // 遅延2
  await processWithAdaptiveAI(...);             // 遅延3
  
  setNextQuestion();  // やっと次のカードへ（2-3秒後）
};
```

**結果**: ボタンを押しても反応が超遅い（2-3秒）

### 修正後（✅ 最適化済み）

```typescript
const handleSwipe = async (direction) => {
  // 現在の状態を保存
  const answeredQuestion = currentQuestion;
  
  // ステップ1: 即座のUI更新（同期処理のみ）
  setSessionStats(prev => ({ ...prev, answered: prev.answered + 1 }));
  setNextQuestion();  // 🚀 即座に次のカードへ
  
  // ステップ2: バックグラウンド処理（非ブロッキング）
  Promise.all([
    recordMemorizationBehavior(answeredQuestion),
    updateWordProgress(answeredQuestion),
    processWithAdaptiveAI(answeredQuestion)
  ]).catch(error => logger.error('エラー:', error));
};
```

**結果**: ボタンを押すと即座に次のカード（100ms以内）

## 🔍 パフォーマンス問題の検出キーワード

以下のキーワードが出たら、即座にこの指示を確認すること:

- 「ボタンを押しても反応が遅い」
- 「画面の切り替えが遅い」
- 「カクカクする」
- 「スワイプが重い」
- 「タップしても反応しない」
- 「次の問題が出るまで時間がかかる」
- 「学習のテンポが悪い」

## 📈 パフォーマンス測定の目標値

| 指標 | 目標値 | 許容値 | 限界値 |
|------|--------|--------|--------|
| ボタン応答時間 | 50ms | 100ms | 200ms |
| カード切り替え | 100ms | 200ms | 500ms |
| データ保存 | バックグラウンド | バックグラウンド | バックグラウンド |
| AI処理 | バックグラウンド | バックグラウンド | バックグラウンド |

## 🛡️ サーバントの自動検出ルール

以下のコードパターンを検出したら警告すること:

1. **UI更新前のawait**
   ```typescript
   // 🚨 検出パターン
   await heavyOperation();
   setUIState(...);
   ```

2. **連続したawait（直列実行）**
   ```typescript
   // 🚨 検出パターン
   await op1();
   await op2();
   await op3();
   // → Promise.all を推奨
   ```

3. **useMemo/useCallbackの欠如**
   ```typescript
   // 🚨 検出パターン
   const sorted = data.sort(...);  // 毎回実行
   const filtered = data.filter(...);  // 毎回実行
   ```

## 💡 修正時の判断基準

### Q: この処理は即座に必要か？

**YES（即座に実行）:**
- UI状態の更新（setState）
- 次の問題/画面への遷移
- ユーザーへのフィードバック表示
- セッション統計の更新

**NO（バックグラウンド実行）:**
- データベース保存（IndexedDB/localStorage）
- サーバー通信（API呼び出し）
- AI分析・計算
- ログ記録
- 統計計算

### Q: この処理はUI更新をブロックするか？

**ブロックする（修正必須）:**
```typescript
await heavyProcess();
setNextState();  // ← ここまで待たされる
```

**ブロックしない（OK）:**
```typescript
setNextState();  // ← 即座に実行
heavyProcess();  // ← 後で実行
```

## 📝 修正チェックリスト

- [ ] UI更新前に `await` を使っていないか
- [ ] 複数の `await` を `Promise.all` で並列化できないか
- [ ] 重い計算を `useMemo` でキャッシュできないか
- [ ] イベントハンドラーを `useCallback` でキャッシュできないか
- [ ] データ保存はバックグラウンド実行になっているか
- [ ] エラーハンドリングが適切に実装されているか
- [ ] ユーザーがボタンを押してから100ms以内に反応するか

## 🎓 教育アプリの特殊性

学習アプリでは、**学習のリズムとテンポ**が最も重要:

1. **即座のフィードバック**: 正解/不正解の判定は即座に表示
2. **スムーズな移行**: 次の問題への切り替えは瞬時
3. **集中力の維持**: 遅延は集中力を削ぐ最大の敵
4. **学習効率**: 1問あたり3秒の遅延 × 100問 = 5分のロス

**結論**: データの完全性よりもUXを優先すること。
- データはバックグラウンドで保存すればよい
- UIの応答性は妥協できない

## 🔄 継続的改善

### パフォーマンス改善の履歴

#### 2025-12-20: 暗記タブのボタン反応最適化

**問題**: ボタンを押しても反応が超遅い（2-3秒の遅延）

**原因**:
- `await recordMemorizationBehavior()` - IndexedDB書き込み待機
- `await updateWordProgress()` - 再度IndexedDB書き込み待機
- `await processWithAdaptiveAI()` - AI分析待機
- これらを直列実行（合計2-3秒）

**修正**:
- UI更新を最優先（同期処理のみ）
- データ保存をバックグラウンド化（Promise.all）
- エラーハンドリングを個別に実装

**効果**:
- ボタン応答時間: 2-3秒 → 100ms以内（95%以上改善）
- ユーザー体験: 「遅い」→「即座に反応」

**学習パターン**:
```json
{
  "pattern": "ui-blocking-await",
  "category": "performance-critical",
  "severity": "high",
  "fix": "background-execution",
  "files": ["src/components/MemorizationView.tsx"]
}
```

---

**最終更新**: 2025-12-20  
**適用範囲**: 全てのUIコンポーネント（特に学習タブ）  
**優先度**: CRITICAL（最優先事項）
