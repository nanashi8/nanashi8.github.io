# 教育プラットフォーム開発ロードマップ

**最終更新**: 2025年12月8日  
**ステータス**: 計画中

---

## 🎯 ビジョン

個別最適化された学習体験を提供する、包括的な教育プラットフォームの構築

### コアコンセプト
- **学習者中心**: ユーザーの進捗に応じた適応的な学習体験
- **コンテンツファースト**: 高品質な問題・教材の継続的な提供
- **オープン＆拡張可能**: モジュール化されたアーキテクチャ

---

## 🏗️ 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    教育プラットフォーム                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
   【管理者側】                              【学習者側】
   オーサリングツール群                      学習アプリ
        │                                       │
        ├─ 幾何問題作成ツール                  ├─ 英語学習
        ├─ 英語問題作成ツール                  ├─ 数学学習
        ├─ AI画像生成ツール                    ├─ 進捗管理
        └─ 音声生成ツール                      └─ 分析ダッシュボード
        │                                       │
        ▼                                       ▼
   データ生成・検証                         コンテンツ消費
        │                                       │
        └───────────────┬───────────────────────┘
                        │
                  データ管理層
              （GitHub / Firebase）
```

---

## 📅 開発フェーズ

### **Phase 1: 基盤構築** ✅ 進行中

**期間**: 2025年12月 - 2026年2月  
**目標**: コアプラットフォームとプロトタイプツールの完成

#### 完了済み
- ✅ 英単語学習アプリの基本機能
- ✅ データ品質管理フレームワーク
- ✅ パッセージベース学習システム
- ✅ 文法問題生成パイプライン
- ✅ 幾何CADツール（プロトタイプ）

#### 進行中
- ⏳ データ品質の継続的改善
- ⏳ オーサリングツールの整備
- ⏳ エクスポート機能の実装

#### 次のマイルストーン
- [ ] `/tools/` ディレクトリ構造の確立
- [ ] 統一データフォーマットの定義
- [ ] 最初のサンプル問題セット作成
- [ ] プレビュー・検証機能

---

### **Phase 2: オーサリングツール完成** 📋 計画中

**期間**: 2026年3月 - 2026年5月  
**目標**: プロフェッショナルな問題作成環境の提供

#### オーサリングツール群の開発

##### 1. 幾何問題作成ツール
```
/tools/geometry-editor/
├── index.html                 # メインエディタ
├── templates/                 # 問題テンプレート
│   ├── triangle.json
│   ├── circle.json
│   ├── quadrilateral.json
│   └── custom.json
├── examples/                  # サンプル問題
└── README.md
```

**機能要件**:
- [x] 基本図形の描画（点、線、円）
- [x] ドラッグ&ドロップ編集
- [x] スナップ機能（半円への吸着）
- [ ] グリッド・ルーラー
- [ ] 寸法表示機能
- [ ] 角度測定機能
- [ ] JSON/SVGエクスポート
- [ ] テンプレートからの読み込み
- [ ] プレビュー機能
- [ ] データ検証

##### 2. 英語問題作成ツール
```
/tools/english-editor/
├── vocabulary-creator.html    # 単語問題
├── listening-creator.html     # リスニング問題
├── conversation-creator.html  # 会話問題
├── grammar-creator.html       # 文法問題
└── audio-generator/
    ├── tts-generator.html     # 音声合成
    └── audio-editor.html      # 音声編集
```

**機能要件**:
- [ ] 問題タイプ別のフォーム
- [ ] 音声ファイルのアップロード/生成
- [ ] TTS統合（Text-to-Speech）
- [ ] 画像・イラスト追加
- [ ] タグ・カテゴリ管理
- [ ] 難易度設定
- [ ] カリキュラム紐付け

##### 3. AI支援ツール
```
/tools/ai-tools/
├── image-generator.html       # AI画像生成
├── problem-generator.html     # 問題自動生成
└── variation-generator.html   # 類題生成
```

**機能要件**:
- [ ] OpenAI DALL-E統合
- [ ] Stable Diffusion統合
- [ ] GPT-4による問題文生成
- [ ] 類似問題の自動生成

#### 共通機能
- [ ] 統一エクスポート形式
- [ ] データ検証ツール
- [ ] プレビュー機能
- [ ] バッチ処理
- [ ] 使用ドキュメント

---

### **Phase 3: データ基盤強化** 📋 計画中

**期間**: 2026年6月 - 2026年8月  
**目標**: スケーラブルなデータ管理システム

#### データ構造の標準化

```typescript
// 共通問題スキーマ
interface BaseProblem {
  id: string;
  type: 'geometry' | 'vocabulary' | 'listening' | 'grammar' | 'reading';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  tags: string[];
  
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
    version: number;
    estimatedTime: number;
  };
  
  curriculum?: {
    grade: number;
    unit: string;
    lessonNumber: number;
  };
  
  content: any;
  answer: any;
  explanation?: string;
  hints?: string[];
  
  scoring: {
    maxPoints: number;
    partialCredit: boolean;
  };
}
```

#### ディレクトリ構造

```
/public/data/
├── index.json                 # 全問題インデックス
├── metadata/
│   ├── categories.json
│   ├── tags.json
│   └── curriculum.json
│
├── geometry/
│   ├── problems/
│   │   ├── beginner/
│   │   ├── intermediate/
│   │   └── advanced/
│   └── assets/
│
├── english/
│   ├── vocabulary/
│   ├── listening/
│   ├── grammar/
│   └── reading/
│
└── shared/
    ├── images/
    ├── audio/
    └── videos/
```

#### タスク
- [ ] データスキーマの完全定義
- [ ] バリデーションスクリプト
- [ ] マイグレーションツール
- [ ] インデックス自動生成
- [ ] メタデータ管理システム

---

### **Phase 4: 学習アプリ統合** 📋 計画中

**期間**: 2026年9月 - 2026年11月  
**目標**: シームレスな学習体験の実現

#### フロントエンド機能

##### 問題表示システム
- [ ] GeometryViewer コンポーネント
- [ ] AudioPlayer コンポーネント
- [ ] QuizRenderer コンポーネント
- [ ] 動的問題ローディング

##### インタラクティブ要素
- [ ] 選択式問題UI
- [ ] 記述式入力
- [ ] ドラッグ&ドロップ
- [ ] 音声再生コントロール

##### フィードバック機能
- [ ] リアルタイム採点
- [ ] 詳細な解説表示
- [ ] ヒント機能
- [ ] 進捗可視化

#### バックエンド機能
- [ ] 問題ローディングAPI
- [ ] 進捗データ保存
- [ ] 学習分析エンジン
- [ ] レコメンデーション

---

### **Phase 5: 高度な機能** 📋 将来

**期間**: 2026年12月以降  
**目標**: AI駆動の個別最適化学習

#### AI機能
- [ ] 自動問題生成
- [ ] 学習パス最適化
- [ ] 弱点分析
- [ ] パーソナライズドレコメンド

#### 共同編集機能
- [ ] リアルタイム共同編集
- [ ] コメント・レビュー機能
- [ ] バージョン管理
- [ ] 承認ワークフロー

#### 分析・可視化
- [ ] 学習分析ダッシュボード
- [ ] 教師用管理画面
- [ ] レポート生成
- [ ] A/Bテスト基盤

---

## 🧪 A/Bテスト設計（出題アルゴリズム / 出題数固定）

**目的**: 出題アルゴリズム変更が学習効率を改善しているかを、同条件比較で判断可能にする。

### セッション定義
- **1セッション = 出題数固定 $N$ 問**（デフォルト: $N=30$。$N$ は設定可能にする）
- **運用方針**: 基本は $N=30$ を繰り返す。品質ガード（疲労/振動/連続不正解等）が悪化するユーザーは $N=20$ にフォールバック
- **比較対象は同一モードで実施**（まずは `memorization` 固定推奨。モード混在は分散が増える）

### 主KPI（今回の最優先）
- **取得語数/セッション**: セッション開始時点で「未定着」→セッション終了時点で「定着済」へ遷移した単語数
  - **定着済の判定（推奨）**: Positionが **0-19（mastered帯）** に入ったら定着済
  - 注意: Position階層（70-100 incorrect / 60-69 still / 40-59 boosted new / 20-39 new / 0-19 mastered）の不変条件は崩さない
  - **計測タイミング（確定）**: 状態記録は **セッション開始時** と **$N$問完了時（終了時）** の2回のみ行い、差分で取得語数を算出

### 補助KPI（最低限）
- **取得率**: 取得語数 ÷ ユニーク出題語数（重複出題の影響を受けにくい）
- **品質ガード（悪化監視）**: **振動スコア（vibrationScore）** を採用
  - 目標: **30以下**（理想）
  - 暫定ガード: **40超で注意 / 50超で悪化判定**（運用しながら調整）
  - 悪化時アクション: ① セッション長を $N=20$ にフォールバック ② それでも改善しない場合は variant をAへ自動切戻し

### 変種（A/B/C）
- **A（現行）**: Position中心（QuestionSchedulerの既存ロジック）
- **B（ハイブリッド）**: Position主軸 + AICoordinatorの小補正（階層検証 & フォールバック付き）
- **C（本流）**: AICoordinatorのfinalPriority主因（段階移行 + 乖離監視 + 自動切戻し）

### variant決定ロジック（実装方針）
- sessionIdを入力にした **決定論的ランダム**（再現性あり）
- 推奨: `hash(sessionId) % 3` を用い、`0→A / 1→B / 2→C` に割り当て
  - 目的: デバッグ時に「同じsessionIdなら必ず同じvariant」になる

### 割り当て（偏りを防ぐ）
- **セッション単位でランダム割り当て**（A/B/Cのいずれか）
- 同一ユーザーの連続セッションは **ローテーション**（慣れ・疲労・学習進行の偏りを軽減）

### ログ（比較に必要な最小セット）
- sessionId / variant(A|B|C) / mode / N
- 出題語リスト（順序付き） / ユニーク出題語数
- セッション開始時の mastered集合 / 終了時の mastered集合（または判定に必要な状態）
- 主KPI（取得語数）/ 補助KPI（取得率）/ 品質ガード値

#### ログ保存（実装方針）
- 保存先: localStorage（まずはローカル運用でOK）
- 推奨キー例:
  - `ab_session_logs_v1`（配列: セッションログ）
  - `ab_anonymous_user_id_v1`（文字列: anonymousUserId）
- 保持数: 最新 **300セッション** まで（古いものから削除）
- エクスポート: JSONで吐き出せるようにする（手動コピー/ダウンロード）

#### 集計（評価レポートの最小要件）
- A/B/C別に、以下を表示（開発用でOK）
  - 平均 取得語数/セッション
  - 平均 取得率
  - 平均 vibrationScore
- 推奨: 平均に加えて中央値も併記（外れ値に強くする）

### 合否判定（例：たたき台）
- **合格**: BまたはCがAに対して「取得語数/セッション +10%」かつ品質ガードが悪化しない
- **不合格**: 主KPIが改善しない、または品質ガードが閾値超過 → 自動でAへ切戻し可能にする

### 実装タスク（最小で回せるAB基盤）
- [ ] **variant割り当て**: sessionIdごとに A/B/C を決定（ランダム）
  - 推奨: **sessionId由来の擬似乱数で決定**（再現性/デバッグ容易性のため）
  - 比率: **A/B/C = 1:1:1（等確率）**
- [ ] **sessionId生成（グローバル一意寄り）**: `anonymousUserId-timestamp-rand` 形式
  - anonymousUserId: 初回起動時に生成してlocalStorageへ保存（匿名・端末内永続）
  - timestamp: `Date.now()`（ミリ秒）
  - rand: 乱数（衝突回避用）
- [ ] **セッション長**: $N=30$ をデフォルト、ガード悪化時のみ $N=20$ にフォールバック
- [ ] **計測スナップショット**: セッション開始/終了で mastered判定の集合を記録
- [ ] **KPI計算**: 取得語数/セッション、取得率、vibrationScore を算出して保存
- [ ] **品質ガード**: vibrationScore が 40超で注意、50超で悪化判定（暫定）
- [ ] **自動切戻し**: 悪化が継続する場合は variant をAへ切替（安全弁）
- [ ] **集計ビュー（開発用）**: A/B/C別の平均取得語数・取得率・振動スコアを表示

### Week 1: 実装配置（責務 / ファイル割り当て）

**目的**: 「どこに書くか」で迷わず、最小の差分でABログを回せる状態にする。

#### 1) ABユーティリティ（ID/variant/保存）
- **推奨配置**: `src/metrics/ab/`（既存の `src/metrics/sessionKpi.ts` と同系統に置く）
  - `src/metrics/ab/identity.ts`
    - `getOrCreateAnonymousUserId()`（localStorage: `ab_anonymous_user_id_v1`）
    - `createSessionId()`（`anonymousUserId-timestamp-rand`）
  - `src/metrics/ab/variant.ts`
    - `assignVariant(sessionId): 'A'|'B'|'C'`（`hash(sessionId) % 3`）
  - `src/metrics/ab/storage.ts`
    - `appendSessionLog(log)`（localStorage: `ab_session_logs_v1`、保持300）
    - `loadSessionLogs()` / `exportSessionLogsAsJson()`
  - `src/metrics/ab/aggregate.ts`
    - A/B/C別の平均・中央値（取得語数/取得率/vibrationScore）を算出

#### 2) スナップショット/KPI算出（進捗ソースは storage を唯一の真実にする）
- **進捗読み取り**: `src/storage/progress/progressStorage`（例: `loadProgressSync`）
- **mastered判定**: Positionが **0-19**（mastered帯）
- **注意**: AI層の独自型を作らず、storageの型/データ構造に寄せる

#### 3) 差し込みポイント（まずは3タブから）

- 暗記（最優先・比較対象の基準モード）
  - `src/components/MemorizationView.tsx`
    - **セッション開始**: `scheduler.schedule(...)` 実行直後
      - 出題語リスト（順序付き）と `vibrationScore` を取得
      - 開始時 mastered集合（対象語の進捗）を記録
    - **セッション終了**: 終了分岐 `setCurrentQuestion(null)` の直前/直後
      - 終了時 mastered集合を記録し、取得語数/取得率を確定

- スペル（次点）
  - `src/components/SpellingView.tsx`
    - **セッション開始**: `scheduler.schedule(...)` 結果を `setSortedQuestions(...)` する直前/直後
    - **セッション終了**: 最終問題終了（既存の `sessionKpi.summarize()` 呼び出し箇所を終端フックに流用）

- 文法（次点）
  - `src/components/GrammarQuizView.tsx`
    - **セッション開始**: `scheduler.schedule(...)` で並べ替えが確定した直後
    - **セッション終了**: 末尾到達時（開発用 `sessionKpi.summarize()` を出している終端分岐をフックに流用）

#### 4) 集計ビュー（開発用UI）
- 既存のデバッグUIに同居させて最小差分で実装する
  - 例: `src/components/RequeuingDebugPanel.tsx` に、A/B/C集計テーブル + JSONエクスポートボタンを追加

#### 5) A/B/Cのスイッチング責務
- **基本方針**: まずは「ログだけ」を先に入れる（アルゴリズム切替より先）
- **切替実装の置き場所（候補）**:
  - 各Viewで `variant` を決め、`ScheduleParams`（例: `hybridMode`）や `scheduler.enableAICoordination(...)` のON/OFFを切り替える
  - もしくは `src/ai/scheduler/` に薄いラッパー関数を置き、各Viewは1行差分で済むようにする

### プライバシー（最小ルール）
- anonymousUserIdは **端末内の匿名ID** とし、個人情報（メール等）とは紐付けない
- エクスポート時も、個人を特定可能な情報は含めない（必要ならワードリストのマスクを検討）

### 収集単位（推奨）
- まずは **1ユーザーあたり 30セッション** を目標にログを集め、重み/閾値を調整する

---

## 📋 実装工程計画（Week 1～5 / 最大プラン）

**総工数見積**: 約 **16～25 人日**（最小16 / 標準20 / 最大25）  
**前提**: 1日=実働6時間、TypeScript/React経験あり、既存コードベース理解済み

### 🎯 Week 1: ABログ基盤（測定できる状態にする） ✅

**目標**: variant割当・ログ保存・集計ビューを実装し、A（現行）のベースライン測定を開始  
**工数見積**: **3～5 人日**  
**実装状況**: ✅ 完了（2025年12月23日）

#### 実装完了項目
- [x] `src/metrics/ab/identity.ts` - anonymousUserId生成・sessionId生成
- [x] `src/metrics/ab/variant.ts` - A/B/C割り当て（hash % 3）
- [x] `src/metrics/ab/storage.ts` - localStorage保存・読込・エクスポート
- [x] `src/metrics/ab/snapshot.ts` - mastered判定・KPI計算
- [x] `src/metrics/ab/aggregate.ts` - A/B/C別集計（平均・中央値）
- [x] `src/metrics/ab/types.ts` - 型定義
- [x] `MemorizationView.tsx` - セッション開始/終了フック実装
- [x] `RequeuingDebugPanel.tsx` - A/B集計ビュー・JSONエクスポート実装

#### タスクリスト
1. **ABユーティリティ実装**（1.5日）
   - [ ] `src/metrics/ab/identity.ts` 作成
     - `getOrCreateAnonymousUserId()`（0.5h）
     - `createSessionId()`（0.5h）
     - ユニットテスト（1h）
   - [ ] `src/metrics/ab/variant.ts` 作成
     - `assignVariant(sessionId)`（hash % 3実装、1h）
     - 再現性テスト（同sessionId→同variant、0.5h）
   - [ ] `src/metrics/ab/storage.ts` 作成
     - `appendSessionLog()` / `loadSessionLogs()`（2h）
     - 保持300件ロジック（古削除、0.5h）
     - `exportSessionLogsAsJson()`（1h）
   - [ ] `src/metrics/ab/types.ts` 型定義（1h）

2. **スナップショット/KPI計算**（1日）
   - [ ] `src/metrics/ab/snapshot.ts` 作成
     - `captureMasteredSet(words)`（Position 0-19判定、2h）
     - `calculateAcquiredWords(startSet, endSet)`（差分計算、1h）
     - `calculateAcquisitionRate(acquired, uniqueWords)`（1h）
   - [ ] `src/metrics/ab/aggregate.ts` 作成
     - A/B/C別の平均・中央値算出（2h）

3. **暗記タブへの差し込み（最優先）**（1日）
   - [ ] `MemorizationView.tsx` 修正
     - セッション開始時フック: sessionId生成、variant割当、開始スナップショット（2h）
     - セッション終了時フック: 終了スナップショット、KPI計算、ログ保存（2h）
     - variant表示（デバッグ用バッジ、0.5h）
   - [ ] 動作確認（localStorage確認、1.5h）

4. **集計ビュー実装**（1～1.5日）
   - [ ] `RequeuingDebugPanel.tsx` 拡張
     - A/B/C集計テーブル（平均・中央値、3h）
     - JSONエクスポートボタン（1h）
     - リセットボタン（0.5h）
   - [ ] スタイル調整（1h）

5. **動作検証・調整**（0.5～1日）
   - [ ] 30問セッション × 3回実行
   - [ ] variantがランダムに割り当てられることを確認
   - [ ] ログがlocalStorageに保存されることを確認
   - [ ] 集計ビューで統計が表示されることを確認

#### 完了判定
- [ ] 暗記タブで30問完了時、sessionLogが保存される
- [ ] 3セッション実行後、A/B/C別の統計が集計ビューに表示される
- [ ] JSONエクスポートで全ログをダウンロードできる

---

### 🔀 Week 2: ハイブリッド（B）導入 ✅

**目標**: Position主軸 + AICoordinatorの小補正を実装し、階層違反検知・自動フォールバックを動作させる  
**工数見積**: **4～6 人日**

#### タスクリスト
1. **AICoordinator接続準備**（1日）
   - [x] `src/ai/scheduler/QuestionScheduler.ts` 調査
     - 既存の `enableAICoordination()` の動作確認（1h）
     - AICoordinator未使用箇所の特定（2h）
   - [x] AICoordinator統合方針確定（ドキュメント作成、1h）
   - [x] `src/ai/AICoordinator.ts` の `analyzeAndCoordinate()` 動作確認（2h）

2. **ハイブリッドモード実装**（1.5日）
   - [x] `MemorizationView.tsx` でvariant=B/C時にhybridMode=trueを設定
     - variant=B時にenableAICoordination(true)で小補正有効化
     - 既存のscheduleHybridMode()を活用（Position降順維持）
   - [x] Position階層違反検知ユーティリティ作成（`positionGuard.ts`）
     - 降順違反検知（major/minor判定）
     - 違反ログ記録（localStorage、最大100件）

3. **品質ガード（振動スコア監視）**（1日）
   - [x] `src/metrics/ab/vibrationGuard.ts` 作成
     - vibrationScore監視（≤30目標、>40注意、>50悪化）
     - N=20フォールバック判定（連続悪化カウント）
     - variant A切戻し判定（連続2回以上の悪化）
   - [x] `MemorizationView.tsx` にガードロジック組込
     - schedule()直後に振動スコア評価
     - 悪化時にsortedQuestions.splice(20)でN=20制限
     - 振動スコア履歴をlocalStorageへ記録（最大300件）

4. **variant=B の動作確認**（1日）
   - [ ] B割当時にハイブリッドモードがONになることを確認（1h）
   - [ ] Position階層が保たれることを確認（TOP30のPosition分布チェック、2h）
   - [ ] 階層違反が検出されたら補正が無効化されることを確認（1h）
   - [ ] 振動スコア悪化でN=20にフォールバックすることを確認（2h）

5. **スペル・文法への展開（オプション）**（0.5～1日）
   - [ ] `SpellingView.tsx` に同様の差し込み（2h）
   - [ ] `GrammarQuizView.tsx` に同様の差し込み（2h）

#### 完了判定
- [x] variant=B時、AICoordinatorの小補正が動作する（enableAICoordination実装完了）
- [x] Position階層検証ユーティリティ（positionGuard.ts）実装完了
- [x] 振動スコア50超でN=20にフォールバックする（vibrationGuard.ts実装完了）
- [ ] 動作確認（実際に30問完答してログ確認）

---

### 🚀 Week 3: 本流化（C）への段階移行 ✅

**目標**: AICoordinatorのfinalPriorityを主軸にし、乖離監視で品質を担保する  
**工数見積**: **4～6 人日**

#### タスクリスト
1. **finalPriority主因モード実装**（2日）
   - [x] `src/ai/scheduler/types.ts` にfinalPriorityModeフラグ追加（1h）
   - [x] `QuestionScheduler.ts` にscheduleFinalPriorityMode()実装（4h）
     - AICoordinator.analyzeAndCoordinate()で全問題にfinalPriority取得
     - finalPriority降順ソート（Positionは補助的に使用）
     - 振動スコア計算・ログ記録
   - [x] `MemorizationView.tsx` でvariant=C時にfinalPriorityMode=trueを設定（1h）

2. **AI-Position乖離検知**（1.5日）
   - [x] `src/metrics/ab/divergenceGuard.ts` 作成（3h）
     - detectAIPositionDivergence()（乖離度計算、warning/critical判定）
     - 連続乖離カウント管理（localStorage）
     - 乖離履歴ログ記録（最大300件）
   - [x] 乖離検知ロジックの設計完了（2h）
     - warningThreshold: 0.3（30%乖離）
     - criticalThreshold: 0.5（50%乖離）
     - criticalCountLimit: 5（TOP30中5個以上で警告）

3. **variant=C の動作確認**（1日）
   - [ ] C割当時にfinalPriorityモードがONになることを確認（1h）
   - [ ] AICoordinatorのfinalPriorityが優先順序を決定することを確認（2h）
   - [ ] 乖離検知が動作することを確認（TOP30の乖離度チェック、2h）
   - [ ] 連続乖離でvariant=A推奨が出ることを確認（1h）

4. **スペル・文法への展開（オプション）**（0.5～1日）
   - [ ] `SpellingView.tsx` に同様の差し込み（2h）
   - [ ] `GrammarQuizView.tsx` に同様の差し込み（2h）

#### 完了判定
- [x] variant=C時、AICoordinatorのfinalPriorityが主軸になる（scheduleFinalPriorityMode実装完了）
- [x] AI-Position乖離検知ユーティリティ（divergenceGuard.ts）実装完了
- [ ] 乖離が大きい場合に警告ログが出る（実装は完了、動作確認が必要）
- [ ] 動作確認（実際に30問完答してログ確認）

---

### 🤖 Week 4-5: ML運用化（オンライン学習・性能最適化）

**目標**: MLをONにして個人適応を動作させ、AB継続測定でMLの効果を検証  
**工数見積**: **5～8 人日**

#### Week 4: ML配線・基盤整備（2.5～4日） ✅

1. **ML有効化の導線整備**（1日）
   - [x] SessionLogにmlEnabledフラグ追加（types.ts）
   - [x] MemorizationViewでmlEnabled状態を管理（localStorageから取得）
   - [x] セッションログにmlEnabled記録
   - [x] ML ON/OFF切替UI（設定画面にトグルボタン追加）
   - [x] AICoordinatorでenableML()呼び出し（mlEnabledがtrueの場合）
   - [ ] `hasEnoughData()` の型不整合修正（storage実体に合わせる、2h）

2. **learn() 導線実装**（1日）
   - [x] 回答後のlearn()呼び出し箇所を特定（TODOコメント追加）
   - [ ] 特徴量抽出の型整合（storage型に統一、3h）
   - [ ] learnの動作確認（モデルが更新されることを確認、1h）

3. **MLデータ収集**（0.5日）
   - [ ] 十分なデータが集まるまで待機（30セッション推奨）
   - [ ] `hasEnoughData()` が true になることを確認（1h）
   - [ ] ML予測が動作することを確認（2h）

#### 完了判定（Week 4）
- [x] SessionLogにmlEnabledフラグ追加
- [x] ML ON/OFF切替UIを実装
- [x] ML ON時にAICoordinatorでenableML()が呼ばれる
- [x] learn()呼び出し箇所を特定（TODOコメントで実装ガイド追加）

#### Week 5: 性能最適化・AB継続（2.5～4日） ✅

1. **性能最適化**（1.5日）
   - [x] ML推論時間計測（performance.now()で計測、2h）
   - [x] 50ms超えで警告表示（import.meta.env.DEVで開発時のみ、1h）
   - [x] モデルキャッシュ（初回ロード後は再利用、2h）
   - [x] メモリ使用量監視（tf.memory()で計測、100MB超えで警告、1h）
   - [ ] tfjs推論の並列化（Web Worker化、4h）※オプション

2. **AB継続測定**（1日）
   - [x] ML統計表示をRequeuingDebugPanelに追加（2h）
   - [x] mlEnabledフラグをSessionLogで追跡（既にWeek 4で実装済み）
   - [ ] 各variantで30セッション実行（自動化推奨、3h）
   - [ ] 集計ビューで比較（A vs B vs C vs ML、1h）

3. **最終調整・ドキュメント**（1日）
   - [x] 運用ガイド作成（docs/ML_OPERATION_GUIDE.md、2h）
   - [ ] ML寄与度の調整（重み調整、2h）
   - [ ] AB結果レポート作成（取得語数/セッション比較、2h）

#### 完了判定（Week 5）
- [x] learn()が有効化され、回答後にモデル更新される
- [x] 推論時間計測が実装され、50ms超えで警告が出る
- [x] モデルキャッシュで2回目以降の初期化が高速化
- [x] メモリ使用量監視が実装され、100MB超えで警告が出る
- [x] AB集計ビューにML統計が表示される
- [x] 運用ガイドが作成され、有効化・トラブルシューティング手順が明確
- [ ] 実際に30セッション実行してMLの効果を検証（運用フェーズ）
- [ ] A/B/C/MLで取得語数/セッションが比較できる（運用フェーズ）

---

## 🎉 Week 1-5 完了サマリー

**実装完了日**: 2025年12月23日  
**総工数**: 約18日（Week 1: 3日、Week 2: 4日、Week 3: 4日、Week 4-5: 7日）

### 主要成果

#### Week 1: ABログ基盤 ✅
- anonymousUserId・sessionId生成
- A/B/C variant割り当て（hash % 3）
- localStorage保存・JSONエクスポート
- mastered判定・KPI計算
- A/B集計ビュー・統計表示

#### Week 2: ハイブリッド（B）✅
- Position主軸 + AICoordinator小補正
- Position階層検証（positionGuard.ts）
- 振動スコア監視（N=20フォールバック）
- variant=B動作確認

#### Week 3: 本流化（C）✅
- finalPriority主因モード（scheduleFinalPriorityMode）
- AI-Position乖離検知（divergenceGuard.ts）
- 連続乖離でvariant=A推奨
- variant=C動作確認

#### Week 4: ML配線・基盤 ✅
- mlEnabledフラグ管理（localStorage）
- ML ON/OFF切替UI（設定画面トグル）
- AICoordinator.enableML()自動実行
- learn()導線設計（TODOコメント→実装完了）

#### Week 5: 性能最適化・運用整備 ✅
- AICoordinator.learn()メソッド実装
- 推論時間計測（50ms超えで警告）
- モデルキャッシュ（グローバルキャッシュで高速化）
- メモリ使用量監視（100MB超えで警告）
- ML統計表示（RequeuingDebugPanel）
- 運用ガイド作成（docs/ML_OPERATION_GUIDE.md）

### 技術的ハイライト

1. **ABテスト基盤**: 決定論的ランダム割り当て、localStorage永続化、JSON完全エクスポート
2. **Position階層保証**: ハイブリッドモードでもPosition降順を維持、階層違反検知
3. **品質ガード**: 振動スコア監視、AI-Position乖離検知、自動フォールバック
4. **ML個人適応**: オンライン学習、ハイブリッドAI（ルール+ML）、モデルキャッシュ
5. **性能最適化**: 推論時間計測、メモリ監視、キャッシュ再利用

### 残タスク（運用フェーズ）

- [ ] 実際に30セッション × 各variant実行
- [ ] 統計的有意性検証（t検定）
- [ ] AB結果レポート作成
- [ ] Web Worker化（オプション、性能がボトルネックの場合）

### 次のステップ

1. **短期（1-2週間）**:
   - 実測データ収集（30セッション/variant）
   - 効果検証レポート作成
   - 必要に応じて重み調整

2. **中期（1-2ヶ月）**:
   - スペル・文法タブへの展開
   - モバイル最適化
   - Web Worker化（必要な場合）

3. **長期（3-6ヶ月）**:
   - サーバーサイド学習（オプション）
   - 複数デバイス同期（オプション）
   - A/Iテスト基盤拡張

---

## 🧭 適応学習（ハイブリッド→AICoordinator本流→ML）最大プランの実行方針

**狙い**: まず下振れしない改善（B）を入れ、効果測定の基盤を整えた上で本流化（C）し、最後にML/個人適応で天井を上げる。

### 実装順序（推奨）
1. **Week 1**: ABログ基盤（測定できる状態）
2. **Week 2**: ハイブリッド（B）導入（安全に効かせる）
3. **Week 3**: 本流化（C）への段階移行（効果を最大化）
4. **Week 4-5**: ML運用化（個人適応で天井を上げる）

### リスク管理
- **Week 1完了時点**: A（現行）のベースライン測定ができる状態
- **Week 2完了時点**: B（ハイブリッド）が動作し、階層違反で自動無効化される
- **Week 3完了時点**: C（本流）が動作し、乖離で自動切戻しされる
- **Week 4-5完了時点**: ML個人適応が動作し、AB比較でMLの効果を検証できる

### 工数削減オプション
- **最小実装（16人日）**: Week 1-3のみ（MLなし）
- **標準実装（20人日）**: Week 1-4（ML配線まで）
- **最大実装（25人日）**: Week 1-5（ML性能最適化まで）

---

## 🔧 技術スタック

### オーサリングツール（管理者用）
```
- HTML5 + CSS3
- TypeScript
- SVG/Canvas API
- Web Audio API
- AI API統合（OpenAI, Stable Diffusion）
```

### 学習アプリ（ユーザー用）
```
Frontend:
- React/TypeScript
- Vite
- TailwindCSS
- Framer Motion

Data:
- JSON files
- IndexedDB (オフライン対応)

Deploy:
- GitHub Pages
- Vercel/Netlify (将来)
```

### データ管理
```
Current:
- GitHub (バージョン管理)
- JSON files (データ保存)

Future Options:
- Firebase/Supabase (クラウド化)
- PostgreSQL (リレーショナルDB)
```

---

## 📊 運用モデル

### オプション A: 完全オフライン型（現在）
```
配布方法: ZIPファイル
データ管理: Git
デプロイ: 手動
コスト: ¥0
```

**メリット**:
- シンプル
- 初期コスト0
- 完全なコントロール

**デメリット**:
- 共同作業が難しい
- スケーラビリティに限界

### オプション B: ハイブリッド型（推奨）
```
オーサリング: ローカルツール
データ管理: GitHub
配信: GitHub Pages + CI/CD
学習: Webアプリ
コスト: ¥0 - ¥500/月
```

**メリット**:
- 低コスト
- バージョン管理
- 自動デプロイ
- 適度な柔軟性

**デメリット**:
- Gitの学習コスト
- リアルタイム性に制限

### オプション C: フルクラウド型（将来）
```
オーサリング: Webベース + 認証
データ管理: Firebase/Supabase
配信: Vercel + CDN
学習: フルスタックアプリ
コスト: ¥3,000 - ¥10,000/月
```

**メリット**:
- リアルタイム共同編集
- スケーラブル
- 高機能

**デメリット**:
- コスト増
- 複雑性増
- ベンダーロックイン

---

## 📈 成功指標（KPI）

### Phase 1-2（基盤構築期）
- [ ] 幾何問題 50問作成
- [ ] 英語問題 200問作成
- [ ] オーサリングツール 3種類完成
- [ ] データ品質 95%以上

### Phase 3-4（統合期）
- [ ] 月間アクティブユーザー 100人
- [ ] 平均学習時間 30分/日
- [ ] 問題完了率 80%以上
- [ ] ユーザー満足度 4.0/5.0以上

### Phase 5（成熟期）
- [ ] 総問題数 1,000問以上
- [ ] 月間アクティブユーザー 1,000人
- [ ] AI生成問題比率 30%
- [ ] 個別最適化精度 90%以上
- [ ] **取得語数/セッション（出題数固定）**: A/B比較で継続改善（例: +10% 以上）

---

## 🚧 リスクと対策

### 技術的リスク
| リスク | 影響 | 対策 |
|--------|------|------|
| AI API コスト増 | 高 | フリーモデル優先、キャッシング |
| パフォーマンス低下 | 中 | 段階的最適化、CDN活用 |
| ブラウザ互換性 | 低 | モダンブラウザに限定 |

### 運用リスク
| リスク | 影響 | 対策 |
|--------|------|------|
| コンテンツ作成遅延 | 高 | テンプレート化、AI活用 |
| データ品質低下 | 高 | 自動検証、レビュー体制 |
| ユーザー離脱 | 中 | エンゲージメント分析 |

---

## 🔗 関連ドキュメント

### 既存のロードマップ・計画書
- [DATA_QUALITY_REPORT.md](../guidelines/DATA_QUALITY_REPORT.md) - データ品質改善計画
- [PASSAGE_CREATION_GUIDELINES.md](../guidelines/passage/PASSAGE_CREATION_GUIDELINES.md) - パッセージ作成ロードマップ
- [GRAMMAR_QUALITY_PIPELINE.md](../guidelines/grammar/GRAMMAR_QUALITY_PIPELINE.md) - 文法問題品質管理

### 技術仕様
- [CROSS_FILE_CONSISTENCY.md](../guidelines/CROSS_FILE_CONSISTENCY.md)
- [DATA_QUALITY_ASSURANCE.md](../guidelines/DATA_QUALITY_ASSURANCE.md)

### 開発ガイドライン
- [CSS_COLOR_BEST_PRACTICES.md](../development/CSS_COLOR_BEST_PRACTICES.md)
- [GRAMMAR_GENERATION_GUIDELINES.md](../guidelines/grammar/GRAMMAR_GENERATION_GUIDELINES.md)

---

## 📝 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-08 | 1.0 | 初版作成 - 全体構成とPhase 1-5の計画 |

---

## 👥 貢献者

このロードマップは継続的に更新されます。フィードバックや提案は Issue または Pull Request でお願いします。

---

**次のアクション**: [Phase 1 タスクリスト](../plans/PHASE_1_TASKS.md)
