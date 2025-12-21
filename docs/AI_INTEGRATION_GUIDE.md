---
title: 7AI統合システム - クイックスタートガイド
created: 2025-12-19
updated: 2025-12-19
status: in-progress
tags: [other, ai, scheduler]
---

# 7AI統合システム - クイックスタートガイド

## 概要

Phase 1のバグ修正とPhase 2の7AI責任分離アーキテクチャが完成しました。

## 🎯 Phase 1 修正内容（すでに適用済み）

### 1. 時間ブースト（分単位化）

- **修正前**: 7日経過で20%ブースト（暗記タブに不適切）
- **修正後**:
  - 2分経過 → 15%ブースト
  - 5分経過 → 30%ブースト
  - 15分経過 → 50%ブースト
  - 30分経過 → 60%ブースト

### 2. カテゴリー遷移ルール明確化

- **分からない**: 連続2回不正解 OR 正答率30%未満
- **覚えてる**: 連続3回正解 OR (連続2回正解 AND 正答率80%以上)

### 3. AIシミュレーター双方向遷移

- `分からない ⇄ まだまだ ⇄ 覚えてる` の反比例関係を可視化

## 🤖 Phase 2 新機能（オプトイン）

### 7つの専門AI

1. **🧠 MemoryAI** - 記憶の定着度と忘却リスク評価
2. **💤 CognitiveLoadAI** - 認知負荷と疲労度の推定
3. **🔮 ErrorPredictionAI** - 誤答パターンから弱点を予測
4. **🎯 LearningStyleAI** - 学習スタイルの推定と最適化
5. **📚 LinguisticAI** - 言語学的特徴に基づく難易度評価
6. **🌍 ContextualAI** - 学習文脈と環境の考慮
7. **🎮 GamificationAI** - モチベーション維持とエンゲージメント向上

### AICoordinator

7つのAIシグナルを統合し、最終的な優先度を計算する調整役。

## 🚀 使い方

### 基本的な使い方（Phase 1修正のみ）

何もしなくても、Phase 1の修正はすでに適用されています。

```bash
npm run dev
```

1. **暗記タブ**で「分からない」を2回押すと優先度が上がります
2. **設定タブ**のシミュレーターでグラフの双方向遷移を確認できます

### 高度な使い方（Phase 2のAI統合を有効化）

AICoordinatorを有効化するには、以下のコードを追加します：

#### 方法1: App.tsxで有効化

`src/App.tsx` の適切な場所に追加：

```typescript
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // QuestionSchedulerのAI統合を有効化
    // ※実際のコードでは、QuestionSchedulerのインスタンスにアクセスする必要があります
    // この実装は各タブコンポーネントで行うのが適切です
  }, []);

  // ... 既存のコード
}
```

#### 方法2: 各タブコンポーネントで有効化

`src/components/MemorizationTab.tsx` など各タブで：

```typescript
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';

const scheduler = new QuestionScheduler();

// AI統合を有効化（オプトイン）
scheduler.enableAICoordination(true);

// 通常通り使用
const result = scheduler.schedule({
  questions: filteredQuestions,
  mode: 'memorization',
  limits: { learningLimit: 10, reviewLimit: 5 },
  sessionStats,
  useMetaAI: true,
});
```

## 📊 デバッグモード

開発環境では、詳細なデバッグログが表示されます：

```
🧠 [MemoryAI] forgettingRisk=120, timeBoost=50%
💤 [CognitiveLoadAI] level=medium, fatigue=35%
🤖 [AICoordinator] Final Priority: 2.34
```

ブラウザのコンソールで確認できます（F12 → Console）。

## 🧪 テスト方法

### Phase 1のテスト

1. **時間ブーストのテスト**

   ```bash
   # 暗記タブで問題を解く → 2分待つ → 再度開く
   # → その語句の優先度が上がっていることを確認
   ```

2. **カテゴリー遷移のテスト**

   ```bash
   # 同じ語句で「分からない」を2回押す
   # → カテゴリーが「incorrect」になることを確認
   ```

3. **シミュレーターのテスト**
   ```bash
   # 設定タブ → 学習AIシミュレーター
   # → グラフで「分からない」「まだまだ」が反比例していることを確認
   ```

### Phase 2のテスト（AI統合有効化後）

```bash
npm run dev
```

1. ブラウザのコンソール（F12）を開く
2. 暗記タブで問題を解く
3. 以下のログが表示されることを確認：
   - `🧠 [MemoryAI]` - 記憶AI
   - `💤 [CognitiveLoadAI]` - 認知負荷AI
   - `🤖 [AICoordinator]` - AI統合結果

## 🎮 AIシミュレーターの使い方

1. **設定タブ**を開く
2. **学習AIシミュレーター**セクションまでスクロール
3. 学習プロファイルを選択：
   - **初心者・間違えやすい**: 低正答率パターン
   - **中級者・バランス型**: 標準的なパターン
   - **上級者・高正答率**: 高パフォーマンスパターン
4. **シミュレーション開始**ボタンをクリック
5. グラフで各カテゴリーの推移を確認

## 📁 ファイル構成

```
src/ai/
├── types.ts                    # 共通型定義
├── AICoordinator.ts            # AI統合調整役
├── architecture.md             # アーキテクチャ設計書
├── specialists/                # 専門AI
│   ├── MemoryAI.ts            # 🧠 記憶AI
│   ├── CognitiveLoadAI.ts     # 💤 認知負荷AI
│   ├── ErrorPredictionAI.ts   # 🔮 誤答予測AI
│   ├── LearningStyleAI.ts     # 🎯 学習スタイルAI
│   ├── LinguisticAI.ts        # 📚 言語学的AI
│   ├── ContextualAI.ts        # 🌍 文脈的AI
│   └── GamificationAI.ts      # 🎮 ゲーミフィケーションAI
└── scheduler/
    └── QuestionScheduler.ts    # メタAI（7AI統合済み）
```

## ⚙️ 設定のカスタマイズ

AICoordinatorの重み付けをカスタマイズできます：

```typescript
const scheduler = new QuestionScheduler();

scheduler.enableAICoordination(true);

// AICoordinatorの設定を取得して変更
const coordinator = scheduler['aiCoordinator']; // private accessが必要
if (coordinator) {
  coordinator.updateConfig({
    weights: {
      memory: 1.0, // 記憶AI（最重要）
      cognitiveLoad: 0.8, // 認知負荷AI
      errorPrediction: 0.7, // 誤答予測AI
      learningStyle: 0.5, // 学習スタイルAI
      linguistic: 0.4, // 言語学的AI
      contextual: 0.6, // 文脈的AI
      gamification: 0.3, // ゲーミフィケーションAI
    },
    emergencyThresholds: {
      forgettingRisk: 150, // 忘却リスク閾値
      cognitiveOverload: true, // 認知過負荷で緊急フラグ
      consecutiveErrors: 5, // 連続不正解閾値
    },
    debugMode: true, // デバッグモード有効化
  });
}
```

## 🐛 トラブルシューティング

### 「分からない」が優先されない

1. ブラウザのコンソール（F12）を開く
2. `💤 [CognitiveLoadAI]` のログを確認
3. `category: 'incorrect'` になっているか確認
4. なっていない場合:
   - 連続2回「分からない」を押したか確認
   - localStorageをクリアして再試行: `localStorage.clear()`

### AICoordinatorが動作しない

1. `enableAICoordination(true)` を呼び出したか確認
2. ブラウザのコンソールで `🤖 [AICoordinator]` のログを確認
3. エラーが出ている場合はGitHub Issuesに報告

### シミュレーターのグラフが表示されない

1. 設定タブを開いているか確認
2. ブラウザをリロード（Cmd+R / Ctrl+R）
3. それでも表示されない場合は開発者ツールでエラーを確認

## 📚 詳細ドキュメント

- [アーキテクチャ設計書](../src/ai/architecture.md) - 7AIシステムの詳細設計
- [型定義](../src/ai/types.ts) - TypeScript型定義とインターフェース

## 🎯 次のステップ

1. **Phase 1の動作確認**: 上記のテスト方法で確認
2. **Phase 2のオプトイン**: 段階的にAI統合を有効化
3. **フィードバック収集**: 実際の学習データで効果を測定
4. **A/Bテスト**: AI統合あり/なしで比較

## 📝 変更履歴

### 2025-12-19 Phase 1+2完了

- ✅ 時間ブースト修正（分単位）
- ✅ カテゴリー遷移ルール明確化
- ✅ シミュレーター双方向遷移
- ✅ 7AI責任分離アーキテクチャ
- ✅ AICoordinator統合
- ✅ QuestionScheduler統合（オプトイン）
