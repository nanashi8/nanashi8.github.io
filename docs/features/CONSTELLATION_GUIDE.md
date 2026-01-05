# 天体儀システム（Constellation）機能ガイド

## 概要

**天体儀システム**は、プロジェクトの全体像をAIと人間の両方に提供する機能です。プロジェクトのゴールを中心に据え、各ファイルの重要度・活発さ・関係性を可視化します。

### 目的
- **AIへの情報提供**: 作業開始前に、プロジェクトのゴール・重要ファイル・リスクをAIに伝える
- **人間の理解支援**: 3D/2D可視化でプロジェクトの構造を直感的に把握（将来実装予定）
- **サーバントの自律**: ゴールに向かう最適な作業を自動提案

---

## 機能一覧

### ✅ 実装済み（Phase 1〜5）

#### 1. プロジェクトゴール定義
**ファイル**: `.vscode/project-goals.json`

プロジェクトの目標を定義し、各ファイルとの距離を計算します。

```json
{
  "version": 1,
  "goals": [
    {
      "id": "main-goal",
      "name": "英語学習プラットフォーム",
      "description": "スマートレビューで長期記憶を促進",
      "priority": 1.0,
      "keywords": ["learning", "memory", "scheduling"],
      "coreFiles": [
        "src/models/QuestionScheduler.ts",
        "src/models/MemoryAI.ts"
      ]
    }
  ]
}
```

#### 2. 優先度スコア計算
各ファイルの重要度を多次元的に計算：

| 要素 | 重み | 説明 |
|------|------|------|
| ゴール距離 | 40% | ゴールに近いほど重要 |
| 活性化レベル | 20% | 最近使用されているほど重要 |
| インポート数 | 15% | 他から依存されているほど重要 |
| 複雑度 | 10% | 複雑なほど注意が必要 |
| 変更頻度 | 10% | 活発に変更されているほど重要 |
| エッジ重み | 5% | 結合が強いほど影響範囲が大きい |

#### 3. 変更頻度（Git履歴）
Git履歴から各ファイルの活発さを計算：

- **総コミット数**: 全履歴のコミット数
- **過去30日のコミット数**: 最近の活動
- **過去7日のコミット数**: 直近の活動
- **changeFrequency**: 0〜1の値（高いほど活発）

#### 4. AIへの情報提供
AI作業開始時に、サーバントが以下を自動出力：

```
═══════════════════════════════════════════════════════════
🌟 プロジェクトの全体像（天体儀ビュー）
═══════════════════════════════════════════════════════════

## 🎯 プロジェクトのゴール
**英語学習プラットフォーム**
スマートレビューと適応的学習で長期記憶を促進

## ⭐ 重要度上位ファイル（ゴールに近い）
1. QuestionScheduler [AI] (優先度: 0.95) (変更頻度: 85%)
2. MemoryAI [AI] (優先度: 0.92) (変更頻度: 78%)
...

## ⚠️ 注意が必要なファイル（頻繁に変更 + 重要）
- QuestionScheduler (優先度: 0.95, 変更頻度: 85%)
...

## 💡 推奨アクション
- ゴールに近いファイルを優先的に改善してください
- 変更頻度が高いファイルは、慎重に扱ってください
...
```

---

### 🔮 未実装（Phase 6〜8）

#### 6. VS Code天体儀ビュー（3D可視化）
**予定**: エクスプローラーサイドバーに3D可視化ビュー

- Three.js + OrbitControls で回転可能
- ノードクリックでファイルを開く
- 編集中のファイルをハイライト
- 関連ファイルをグリーン表示
- 3軸（構造・階層・時系列）のオンオフ

#### 7. VR対応（ロードマップ）
**予定**: WebXR Device APIでVR環境対応

- Meta Quest / Apple Vision Pro 対応
- 音声入力でAIに指示
- 手でノードを掴んで調整
- 空間内でプロジェクト全体を操作

---

## 使い方

### 1. プロジェクトゴールを定義

`.vscode/project-goals.json` を作成：

```json
{
  "version": 1,
  "goals": [
    {
      "id": "main-goal",
      "name": "あなたのプロジェクトのゴール",
      "description": "具体的な目標の説明",
      "priority": 1.0,
      "keywords": ["keyword1", "keyword2"],
      "coreFiles": [
        "src/core/MainFile.ts"
      ]
    }
  ]
}
```

### 2. AI作業を開始

GitHub Copilot Chatなどでコード編集を開始すると、**自動的に**サーバントがプロジェクトの全体像をOutput Channelに出力します。

**確認方法**:
1. VS Code下部の「Output」パネルを開く
2. ドロップダウンから「**Servant (Autopilot)**」を選択
3. 「🌟 プロジェクトの全体像（天体儀ビュー）」セクションを確認

### 3. 通知を確認

AI作業開始時に、以下の通知が表示されます：

```
🌟 サーバント: 英語学習プラットフォームに向かって作業を進めます
```

---

## コマンド

現在、天体儀システム専用のコマンドはありません。すべて自動で動作します。

将来実装予定：
- `servant.constellation.show`: 天体儀ビューを開く
- `servant.constellation.refresh`: データを再生成
- `servant.constellation.export`: JSON形式でエクスポート

---

## データファイル

### `.vscode/project-goals.json`
プロジェクトのゴール定義

### `.vscode/neural-graph.json`
ファイル間の依存関係グラフ（自動生成）
- ノード情報（priority Score, goalDistance, changeFrequency等）
- エッジ情報（重み付き結合）

### `.vscode/constellation-data.json`（未実装）
天体儀ビュー用の3D座標データ

---

## 技術詳細

### アーキテクチャ

```
GoalManager
  ↓ (ゴール定義読み込み)
NeuralDependencyGraph
  ↓ (依存関係グラフ構築)
GitIntegration
  ↓ (変更頻度計算)
NeuralDependencyGraph.computePriorityScores()
  ↓ (優先度計算)
ConstellationDataGenerator
  ↓ (3D座標・色・サイズ計算)
AutopilotController
  ↓ (AI作業開始時)
Output Channel に表示
```

### クラス一覧

#### `GoalManager`
- **役割**: ゴール定義の読み込み・管理
- **ファイル**: `extensions/servant/src/goals/GoalManager.ts`
- **主要メソッド**:
  - `calculateGoalDistance(filePath)`: ファイルとゴールの距離計算
  - `getMainGoal()`: メインゴール取得
  - `findClosestGoal(filePath)`: 最も近いゴール判定

#### `ConstellationDataGenerator`
- **役割**: 天体儀用データの生成
- **ファイル**: `extensions/servant/src/constellation/ConstellationDataGenerator.ts`
- **主要メソッド**:
  - `generate()`: 全データ生成
  - `getTopPriorityNodes(n)`: 上位N件取得
  - `getRiskyNodes()`: リスク高いノード抽出

#### `AutopilotController`
- **役割**: AI作業の事前誘導・事後レビュー
- **ファイル**: `extensions/servant/src/autopilot/AutopilotController.ts`
- **追加機能**:
  - `generateConstellationContext()`: 天体儀コンテキスト生成
  - AI作業開始時に自動出力

---

## トラブルシューティング

### 「プロジェクトの全体像」が表示されない

**原因1**: `.vscode/project-goals.json` が存在しない
- **解決策**: ファイルを作成してゴールを定義

**原因2**: グラフが未構築
- **解決策**: 一度コミット前検証を実行すると自動構築されます

**原因3**: `servant.autopilot.enabled` が無効
- **解決策**: 設定を `true` に変更

### 優先度スコアが0のファイルが多い

**原因**: changeFrequency が未計算（Git履歴なし）
- **解決策**: Git履歴がないファイルは優先度が低くなります。正常動作です。

### 変更頻度が0になる

**原因**: Git履歴にコミットがない
- **解決策**: 少なくとも1回コミットすると変更頻度が計算されます。

---

## パフォーマンス

### 計算コスト
- **グラフ構築**: 100ファイルで約1秒
- **priorityScore計算**: 100ファイルで約0.1秒
- **changeFrequency更新**: Git履歴の大きさに依存（通常3秒以内）
- **Constellation生成**: 100ファイルで約0.05秒

### 最適化
- グラフは`.vscode/neural-graph.json`にキャッシュされます
- 差分更新により、変更されたファイルのみ再計算
- Git履歴は一括取得で効率化

---

## 今後の予定

### Phase 6: VS Code天体儀ビュー（1〜2週間）
- WebView Panel で3D可視化
- Three.js + OrbitControls 統合
- クリック操作でファイルを開く

### Phase 7: 実データ検証（1週間）
- 実プロジェクトでの動作確認
- アルゴリズム調整
- UI/UX改善

### Phase 8: VR対応（ロードマップ）
- WebXR基本対応
- VRコントローラー操作
- 音声入力＋AI連携

---

## 参考

- [実装計画](../plans/CONSTELLATION_IMPLEMENTATION_PLAN.md)
- [Autopilotガイド](../HOW_TO_ENABLE_AI.md)
- [Neural Dependency Graph](../specifications/NEURAL_DEPENDENCY_GRAPH.md)
