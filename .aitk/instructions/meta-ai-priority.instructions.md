---
description: メタAI（QuestionScheduler）と出題機能のトラブルシューティング優先指示
applyTo: '**/*.{ts,tsx,js,jsx}'
---

# メタAI（QuestionScheduler）と出題機能のトラブルシューティング優先指示

## 🎯 目的

このinstructionsファイルは、QuestionScheduler（メタAI統合層）および7つの専門AIに関する問題発生時の優先対応手順を定義します。

## 🚨 優先度ルール

### 最優先（P0）: 出題機能の停止

QuestionSchedulerが正常に動作せず、問題が出題されない場合：

1. **即座に診断スクリプトを実行**:

   ```bash
   npm run test:scheduler
   ```

2. **エラーログを確認**:
   - ブラウザコンソール（F12）で`QuestionScheduler`エラーを検索
   - localStorage破損の可能性を確認

3. **復旧手順**:

   ```javascript
   // ブラウザコンソールで実行
   localStorage.clear();
   location.reload();
   ```

### 高優先度（P1）: AI統合の不具合

7つの専門AIのシグナル統合に問題がある場合：

1. **AI統合の有効化状態を確認**:

   ```javascript
   localStorage.getItem('enable-ai-coordination');
   ```

2. **AICoordinatorのログを確認**:
   - コンソールで `🤖 AICoordinator` を検索
   - 各AI（Memory AI, Cognitive Load AIなど）のシグナルが出力されているか確認

3. **問題の切り分け**:
   - AI統合を無効化して動作確認:

     ```javascript
     localStorage.removeItem('enable-ai-coordination');
     location.reload();
     ```

## 🏗️ アーキテクチャ理解（必読）

### 8-AIシステム構成

```
┌─────────────────────────────────────────────────────────┐
│         QuestionScheduler（メタAI - 第8のAI）          │
│  - 7つの専門AIのシグナル統合                              │
│  - DTA（Dynamic Time-based Adjustment）                 │
│  - 振動防止（直近正解の除外）                              │
│  - category優先制御（incorrect > still_learning > new）  │
└─────────────────────────────────────────────────────────┘
          ↑ シグナル統合（AICoordinator経由）
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Memory   │Cognitive │  Error   │ Learning │Linguistic│Contextual│Gamifica- │
│   AI     │ Load AI  │Prediction│ Style AI │   AI     │   AI     │ tion AI  │
│          │          │    AI    │          │          │          │          │
│記憶・忘却 │認知負荷  │誤答予測  │学習スタイル│言語難易度│時間帯最適│動機付け  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 実装ファイル構成

```
src/ai/
├── scheduler/
│   ├── QuestionScheduler.ts          # メタAI（第8のAI）
│   └── types.ts                       # 型定義
├── coordinator/
│   └── AICoordinator.ts               # 7AIシグナル統合
└── specialists/
    ├── MemoryAI.ts                    # 記憶AI
    ├── CognitiveLoadAI.ts             # 認知負荷AI
    ├── ErrorPredictionAI.ts           # エラー予測AI
    ├── LearningStyleAI.ts             # 学習スタイルAI
    ├── LinguisticAI.ts                # 言語AI
    ├── ContextualAI.ts                # 文脈AI
    └── GamificationAI.ts              # ゲーミフィケーションAI
```

## 📚 関連ドキュメント

トラブルシューティング・メンテナンス時は以下のドキュメントを参照：

### 包括ガイド（最優先）

1. **メンテナンスガイド**: [docs/maintenance/AI_MAINTENANCE_GUIDE.md](../../docs/maintenance/AI_MAINTENANCE_GUIDE.md) ⭐
   - 学習AIシステム包括的メンテナンスガイド
   - 問題分類マトリクス・診断フローチャート
   - パイプライン確認手順・予防保守

### トラブルシューティング

2. **詳細トラブルシューティング**: [docs/guidelines/META_AI_TROUBLESHOOTING.md](../../docs/guidelines/META_AI_TROUBLESHOOTING.md)
3. **緊急復旧手順**: [docs/how-to/QUESTION_SCHEDULER_RECOVERY.md](../../docs/how-to/QUESTION_SCHEDULER_RECOVERY.md)

### 仕様・統合

4. **仕様書**: [docs/specifications/QUESTION_SCHEDULER_SPEC.md](../../docs/specifications/QUESTION_SCHEDULER_SPEC.md)
5. **統合ガイド**: [docs/guidelines/META_AI_INTEGRATION_GUIDE.md](../../docs/guidelines/META_AI_INTEGRATION_GUIDE.md)
6. **QAパイプライン**: [docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md](../../docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md)

### ユーザー向け

7. **AI統合ガイド**: [docs/ai-systems/integration-guide.md](../../docs/ai-systems/integration-guide.md)
8. **有効化ガイド**: [docs/ai-systems/how-to-enable.md](../../docs/ai-systems/how-to-enable.md)

## 🔍 デバッグ手順

### 1. QuestionSchedulerのstate確認

```typescript
// src/components/MemorizationView.tsx などで
console.log('Scheduled Questions:', scheduledQuestions);
console.log('Recent Answers:', recentAnswers);
console.log('Session Stats:', sessionStats);
```

### 2. AI統合ログの確認

```typescript
// ブラウザコンソールで以下を確認：
// - 🤖 [MemorizationView] AI統合が有効化されました
// - 🧠 Memory AI Signal: ...
// - 💤 Cognitive Load AI Signal: ...
// - 🔮 Error Prediction AI Signal: ...
// - 🤖 Meta AI: Final Priority=...
```

### 3. localStorageデータの確認

```javascript
// ブラウザコンソールで実行
const progress = JSON.parse(localStorage.getItem('english-progress') || '{}');
console.log('Progress Data:', progress);

const aiEnabled = localStorage.getItem('enable-ai-coordination');
console.log('AI Coordination Enabled:', aiEnabled);
```

## ⚠️ よくある問題と解決策

### 問題1: 「分からない・まだまだ」が優先されない

**症状**: incorrect/still_learning の単語が新規単語より後に出題される

**原因**: category優先制御が正しく動作していない

**解決策**:

1. QuestionScheduler.tsの`ensureCategoryPriority()`関数を確認
2. priorityScoreの計算ロジックを検証
3. テストを実行: `npm run test:scheduler`

### 問題2: 7つのAIシグナルが反映されない

**症状**: AICoordinatorのログが出力されない、または優先度が変化しない

**原因**: AI統合が有効化されていない、またはAICoordinatorのインスタンス化失敗

**解決策**:

1. AI統合を有効化:

   ```javascript
   localStorage.setItem('enable-ai-coordination', 'true');
   location.reload();
   ```

2. MemorizationView.tsx等でAICoordinatorが正しくインポートされているか確認
3. エラーログを確認（Promiseのエラーがないか）

### 問題3: 振動（同じ問題が連続出題）

**症状**: 最近正解した問題が即座に再出題される

**原因**: recentAnswersの管理不備、またはvibrationPenaltyが機能していない

**解決策**:

1. QuestionScheduler.tsの`applyVibrationPenalty()`を確認
2. recentAnswersが正しく更新されているか確認
3. VIBRATION_PENALTYの値を確認（デフォルト: -1000）

## 🧪 テストコマンド

```bash
# TypeScript
npm run typecheck

# ユニットテスト
npm run test:unit

# ユニットテスト（高速・APIスキップ）
npm run test:unit:fast

# Playwright 煙テスト（PR/CIでの基本導線確認）
npm run test:smoke
```

## 📝 コードレビューチェックリスト

QuestionScheduler関連のコード変更時は以下を確認：

- [ ] QuestionScheduler.tsの型定義が最新か
- [ ] 4タブ（暗記・和訳・スペル・文法）すべてで動作するか
- [ ] recentAnswersが正しく管理されているか
- [ ] sessionStatsが正しく更新されているか
- [ ] AI統合が有効・無効の両方で動作するか
- [ ] ドキュメントが更新されているか
- [ ] テストが追加/更新されているか

## 🚀 デプロイ前チェック

本番環境へのデプロイ前に以下を確認：

1. **TypeScriptエラーゼロ**:

   ```bash
   npx tsc --noEmit
   ```

2. **全テストパス**:

   ```bash
   npm run test:unit
   npm run test:smoke
   ```

3. **ビルド成功**:

   ```bash
   npm run build
   ```

4. **ドキュメント整合性**:
   - README.mdに最新の機能説明があるか
   - CHANGELOG.mdが更新されているか
   - docs/配下のドキュメントが最新か

## 🔁 補助機構: 再出題/再スケジュール（重要）

QuestionScheduler（Position降順ソート + インターリーブ）が主。
ただし、学習体験の破綻を防ぐために以下の補助機構が存在する。

- **再出題（requeue）**: 「まだまだ/分からない」を数問後に差し込み、完了（Position 40+ の解消）へ向かわせる
  - 連続で同じ問題が「分からない」になり続ける場合は、再出題間隔を少しずつ延長してうんざりを防ぐ
- **再スケジュール（reschedule）**: 新規苦手化を検知したら、残りキュー（現在位置以降）のみ再スケジュールして吸引を継続
  - 可視化は通知ではなく ScoreBoard の「学習状況」タブのパルスを使う

デバッグキー:

- `debug_reschedule_events`（triggered/applied/skipped/error）
- `debug_position_aware_insertions`（Position-aware 挿入ログ）

## 📞 エスカレーション

上記の手順で解決しない場合：

1. GitHub Issueを作成（テンプレート使用）
2. 以下の情報を含める：
   - エラーログ（ブラウザコンソール）
   - localStorageの内容
   - 再現手順
   - 期待する動作と実際の動作
3. ラベル `priority:high`, `component:question-scheduler` を付与

---

**最終更新**: 2025-12-19  
**メンテナー**: AI Development Team
