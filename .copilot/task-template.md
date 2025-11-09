# タスク実行テンプレート

---

## タスク: QuizView分割

### ステップ1: 影響範囲の特定
- **変更対象ファイル**: 
  - QuizView.swift（分割元）
  - 新規作成ファイル（分割先）
  
- **依存ファイル**:
  - QuizSettings.swift
  - ScoreStore.swift
  - WordScoreStore.swift
  - CurrentCSV.swift
  - QuestionItem.swift（モデル）
  
- **影響を受けるコンポーネント**:
  - 既存の@EnvironmentObject
  - 内部構造体（Choice, ChoiceView, DontKnowView）
  - ViewBuilder関数群

---

### ステップ2: 最小変更セットの抽出

#### Phase 1-1: QuizStatisticsView 分離
- **変更必要な関数/プロパティ**:
  - 統計表示部分（line 350-390）
  - アニメーション状態変数（@State）を@Bindingに変更
  
- **追加必要なファイル**:
  - `QuizStatisticsView.swift`

#### Phase 1-2: QuestionCardView 分離
- **変更必要な関数/プロパティ**:
  - `questionHeaderCard(for:)` 関数
  - WordScoreStore参照
  
- **追加必要なファイル**:
  - `QuestionCardView.swift`

#### Phase 1-3: ChoiceCardView 分離
- **変更必要な関数/プロパティ**:
  - `ChoiceView` 内部構造体
  - `Choice` 構造体
  - 展開状態管理
  
- **追加必要なファイル**:
  - `ChoiceCardView.swift`
  - `QuizModels.swift`（Choice構造体用）

#### Phase 1-4: DontKnowCardView 分離
- **変更必要な関数/プロパティ**:
  - `DontKnowView` 内部構造体
  
- **追加必要なファイル**:
  - `DontKnowCardView.swift`

#### Phase 1-5: QuizResultView 分離
- **変更必要な関数/プロパティ**:
  - 結果表示部分（finished時）
  
- **追加必要なファイル**:
  - `QuizResultView.swift`

---

### ステップ3: 段階的実装

#### 手順
1. **QuizStatisticsView 作成**
   - 新規ファイル作成
   - 統計表示ロジックを移行
   - @Binding でアニメーション状態を受け取る
   - QuizView から呼び出し
   - コンパイル確認

2. **QuestionCardView 作成**
   - 新規ファイル作成
   - questionHeaderCard ロジックを移行
   - @EnvironmentObject で WordScoreStore を受け取る
   - QuizView から呼び出し
   - コンパイル確認

3. **QuizModels.swift 作成**
   - Choice 構造体を移行
   - 他の共通構造体も集約

4. **ChoiceCardView 作成**
   - 新規ファイル作成
   - ChoiceView ロジックを移行
   - Choice 構造体を import
   - QuizView から呼び出し
   - コンパイル確認

5. **DontKnowCardView 作成**
   - 新規ファイル作成
   - DontKnowView ロジックを移行
   - QuizView から呼び出し
   - コンパイル確認

6. **QuizResultView 作成**
   - 新規ファイル作成
   - 結果表示ロジックを移行
   - QuizView から呼び出し
   - コンパイル確認

7. **QuizView のリファクタリング**
   - 分離したコンポーネントを呼び出す
   - 不要なコードを削除
   - 全体のコンパイル確認

8. **動作確認**
   - アプリ実行
   - 各画面の動作確認
   - アニメーション動作確認

---

### ステップ4: 検証ポイント

#### コンパイル時
- [ ] コンパイルエラーなし
- [ ] 警告なし（可能な限り）
- [ ] import文が適切
- [ ] @EnvironmentObject の伝播が正しい

#### 実行時
- [ ] CSV読み込み成功
- [ ] 問題表示が正常
- [ ] 選択肢選択が正常
- [ ] 「分からない」ボタンが正常
- [ ] アニメーションが動作
- [ ] スコア記録が正常
- [ ] バッチ遷移が正常
- [ ] 結果表示が正常

#### 既存機能への影響
- [ ] バッチ管理ロジックが維持されている
- [ ] AdaptiveScheduler連携が維持されている
- [ ] WordScoreStore記録が維持されている
- [ ] 自動遷移が維持されている
- [ ] タイマー機能が維持されている
- [ ] 音声読み上げが維持されている

#### 新機能の動作確認
- [ ] カード分離表示が正しい
- [ ] 合格数アニメーションが動作
- [ ] 総出題数アニメーションが動作
- [ ] 学習モード表示が正しい

---

## タスク完了チェックリスト

- [ ] 全ファイルがコンパイル可能
- [ ] 全ての既存機能が動作
- [ ] 全ての新機能が動作
- [ ] `.copilot/changelog.md` に変更を記録
- [ ] Xcodeプロジェクトに新規ファイルを追加
- [ ] コミット可能な状態

---
