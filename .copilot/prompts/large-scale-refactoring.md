# 大規模リファクタリングプロンプト（Git統合版）

## ⚠️ 重要な前提
このプロンプトは、500行以上の大規模ファイルをリファクタリングする際に使用します。
通常のリファクタリングは `refactor-component.md` を使用してください。

**必読**: 
- `参考資料/大規模リファクタリング実現方策.md`
- `.copilot/prompts/ai-git-workflow.md`（Git統合ワークフロー）
- `.copilot/prompts/version-management.md`（バージョン管理）

## 使用タイミング
- ファイルが500行を超え、複数の責務が複雑に絡み合っている
- 30個以上の @State 変数を持つ
- リファクタリング失敗のリスクが高い

---

## 事前準備（必須）

### チェックリスト

作業を開始する前に、以下をすべて完了すること：

- [ ] `参考資料/大規模リファクタリング実現方策.md` を読んだ
- [ ] `参考資料/リファクタリング失敗分析_20251019.md` を読んだ
- [ ] `.copilot/prompts/ai-git-workflow.md` を読んだ
- [ ] 現在のコードが動作することを確認した
- [ ] ユーザーに作業時間（2-3時間）の承認を得た

### 🆕 Git統合ワークフロー

**このリファクタリングでは、AIが自動的にGit操作を行います：**

✅ **AIが自動実行すること:**
1. Gitブランチ作成（`refactor-quiz-view-YYYYMMDD`）
2. 初期コミット（作業開始マーカー）
3. 各ステップでのコミット（チェックポイント作成）
4. ビルド・テスト確認
5. 問題発生時の自動ロールバック（5秒）
6. changelog.md の更新
7. バージョンタグの作成（完了時）

📋 **あなたがすること:**
- 自然言語で指示するだけ
- 問題が起きたら「中断してロールバック」と指示
- 各Phase完了後に動作確認

詳細は `.copilot/prompts/ai-git-workflow.md` を参照。

---

## プロンプト0: 事前準備（Git統合版）

```
# タスク
QuizView.swift の大規模リファクタリングを開始する前に、事前準備を完了してください。
Git統合ワークフローを使用します。

# Git操作（AIが自動実行）

## 1. 現在の状態を確認
```bash
git status
git log --oneline -5
```

## 2. 作業ブランチを作成
```bash
BRANCH_NAME="refactor-quiz-view-$(date +%Y%m%d)"
git checkout -b "$BRANCH_NAME"
git commit --allow-empty -m "開始: QuizView大規模リファクタリング

事前準備フェーズ:
- テストコード作成
- 依存関係マップ作成
- 現状確認

目標: QuizView.swift (1,100行) を300行に削減"
```

# 実施内容

## 3. 現状確認
- QuizView.swift の行数を確認
- @State 変数の数を確認
- @EnvironmentObject の数を確認
- 主要メソッドをリストアップ

## 4. テストの作成
- SimpleWordTests/QuizViewTests.swift を作成
- 以下のテストケースを実装：
  * testQuizStartsWithFirstQuestion
  * testCorrectAnswerUpdatesScore
  * testIncorrectAnswerDoesNotUpdatePassedCount
  * testGeneratesCorrectNumberOfChoices
  * testGiveUpMarksAsIncorrect
- テストを実行して全て green であることを確認

## 5. 依存関係マップ作成
- 参考資料/QuizView依存関係マップ.md を作成
- 以下を列挙：
  * すべての @State 変数
  * すべての @EnvironmentObject
  * すべての子コンポーネント
  * すべてのメソッドと責務

## 6. Gitコミット
```bash
git add SimpleWordTests/QuizViewTests.swift 参考資料/QuizView依存関係マップ.md
xcodebuild test -scheme SimpleWord 2>&1 | tail -10
git commit -m "✅ 事前準備完了: テストと依存関係マップ作成

作成ファイル:
- QuizViewTests.swift: 5つのテストケース
- QuizView依存関係マップ.md: 完全な依存関係図

テスト結果: ✅ 全て通過 (0 failures)
次のステップ: Phase 1, Step 1.1"
```

# 完了条件
- [ ] 現状確認完了（行数、変数数をレポート）
- [ ] テスト作成完了、全て green
- [ ] 依存関係マップ作成完了
- [ ] Gitブランチ作成完了
- [ ] 初期コミット完了

# 完了後
上記がすべて完了したら、次のメッセージを表示：

「✅ 事前準備が完了しました。

**Gitブランチ:** {ブランチ名}
**初期コミット:** {コミットID}
**テスト:** 全て green (0 failures)

Phase 1, Step 1.1 を開始する準備ができています。
続行する場合は「Phase 1, Step 1.1 を実行してください」と指示してください。」
```

---

## Phase 1: 最小限の抽出（1ステップずつ）

### プロンプト1.1: QuizEngine スケルトン作成（Git統合版）

```
# タスク
Phase 1, Step 1.1: QuizEngine クラスの最小限のスケルトンを作成してください。
Git統合ワークフローを使用します。

# 実施内容

## 1. ファイル作成
```bash
mkdir -p SimpleWord/Features/Quiz
cat > SimpleWord/Features/Quiz/QuizEngine.swift << 'EOF'
// SimpleWord/Features/Quiz/QuizEngine.swift
// 出題ロジックを管理するエンジンクラス（Phase 1: スケルトン）

import Foundation
import Combine

final class QuizEngine: ObservableObject {
    
    // 依存する Store
    private let quizSettings: QuizSettings
    private let scoreStore: ScoreStore
    private let wordScoreStore: WordScoreStore
    private let currentCSV: CurrentCSV
    
    init(
        quizSettings: QuizSettings,
        scoreStore: ScoreStore,
        wordScoreStore: WordScoreStore,
        currentCSV: CurrentCSV
    ) {
        self.quizSettings = quizSettings
        self.scoreStore = scoreStore
        self.wordScoreStore = wordScoreStore
        self.currentCSV = currentCSV
        
        print("✅ QuizEngine initialized")
    }
    
    func start() {
        print("✅ QuizEngine.start() called")
    }
}
EOF
```

## 2. Xcode プロジェクトに追加
xcodeproj gem を使って自動追加（または手動で追加を指示）

## 3. ビルド確認
```bash
xcodebuild clean build -scheme SimpleWord -destination 'platform=iOS Simulator,name=iPhone 17' 2>&1 | tail -5
```

期待結果: ** BUILD SUCCEEDED **

## 4. Gitコミット
```bash
git add SimpleWord/Features/Quiz/QuizEngine.swift SimpleWord.xcodeproj/project.pbxproj
git commit -m "✅ Phase1, Step1.1完了: QuizEngineスケルトン作成

作成内容:
- QuizEngine.swift を新規作成
- 最小限の実装（print文のみ）
- Xcodeプロジェクトに追加

ビルド: ✅ 成功
テスト: ✅ 全て通過 (0 failures)
影響範囲: 新規ファイルのみ
次のステップ: Phase 1, Step 1.2"
```

# 完了条件
- [ ] QuizEngine.swift が作成された
- [ ] Xcode プロジェクトに追加された
- [ ] ビルド成功（BUILD SUCCEEDED）
- [ ] テスト全て green（0 failures）
- [ ] Git コミット完了

# ロールバック条件
以下の場合は即座にロールバック：
- ビルドエラーが解決できない（5分以上かかる）
- テストが red になった
- Xcode プロジェクトへの追加に失敗した

ロールバックコマンド:
```bash
git reset --hard HEAD~1
```

# 完了後
「✅ Phase 1, Step 1.1 が完了しました。

**コミット:** {コミットID}
**ビルド:** 成功
**テスト:** 全て green

次は Step 1.2（QuizEngine の初期化）です。
続行する場合は「Step 1.2 を実行してください」と指示してください。」
```

---

### プロンプト1.2: QuizView で QuizEngine を初期化（Git統合版）

```
# タスク
Phase 1, Step 1.2: QuizView で QuizEngine を初期化し、呼び出せるようにしてください。
Git統合ワークフローを使用します。

# 重要な制約
- QuizView の既存ロジックは一切変更しない
- QuizEngine.start() は print するだけ（ロジック移行はまだ）
- 既存の start() メソッドは削除しない

# 実施内容

## 1. QuizView に quizEngine プロパティを追加

```swift
struct QuizView: View {
    
    @EnvironmentObject var quizSettings: QuizSettings
    @EnvironmentObject var scoreStore: ScoreStore
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV
    
    // 🆕 QuizEngine を追加
    @State private var quizEngine: QuizEngine?
    
    // ...existing code...
}
```

## 2. onAppear で QuizEngine を初期化

```swift
.onAppear {
    // 🆕 QuizEngine を初期化（最初の1回のみ）
    if quizEngine == nil {
        quizEngine = QuizEngine(
            quizSettings: quizSettings,
            scoreStore: scoreStore,
            wordScoreStore: wordScoreStore,
            currentCSV: currentCSV
        )
        // テスト呼び出し
        quizEngine?.start()
    }
    
    // ...既存の onAppear 処理は維持...
}
```

## 3. ビルド確認
```bash
xcodebuild clean build -scheme SimpleWord 2>&1 | tail -5
```

期待結果: ** BUILD SUCCEEDED **

## 4. 実行確認
1. シミュレータでアプリを起動
2. クイズ画面を開く
3. Xcode のコンソールで確認：
   - "✅ QuizEngine initialized"
   - "✅ QuizEngine.start() called"

## 5. Gitコミット
```bash
git add SimpleWord/QuizView.swift
git commit -m "✅ Phase1, Step1.2完了: QuizEngineの初期化

変更内容:
- QuizView に quizEngine プロパティ追加
- onAppear で初期化
- start() 呼び出し（テスト用）

ビルド: ✅ 成功
テスト: ✅ 全て通過
実行確認: ✅ コンソールにログ表示確認
影響範囲: QuizView.swift のみ
次のステップ: Phase 1, Step 1.3"
```

# 完了条件
- [ ] QuizView に quizEngine プロパティが追加された
- [ ] onAppear で初期化されている
- [ ] ビルド成功
- [ ] 実行確認OK（コンソールにログ表示）
- [ ] テスト全て green
- [ ] Git コミット完了

# ロールバック条件
以下の場合は即座にロールバック：
- ビルドエラーが解決できない
- 実行時エラーが発生
- UI が表示されない
- コンソールにログが表示されない

ロールバックコマンド:
```bash
git reset --hard HEAD~1
```

# 完了後
「✅ Phase 1, Step 1.2 が完了しました。

**コミット:** {コミットID}
**実行確認:** コンソールにログ表示確認

次は Step 1.3（start() ロジックの移行）です。
⚠️ ここから既存ロジックを変更します。より慎重に進めます。
続行する場合は「Step 1.3 を実行してください」と指示してください。」
```

---

## 🚨 重要な原則（Git統合版）

### 🚫 やってはいけないこと

1. **一度に複数のファイルを作成・変更しない**
   - 1ステップ = 1ファイル変更が原則
   - 問題の切り分けが困難になる

2. **ビルド確認なしで次のステップに進まない**
   - 必ず `xcodebuild clean build` を実行
   - BUILD SUCCEEDED を確認してから次へ

3. **Gitコミットせずに次のステップに進まない**
   - 各ステップで必ずコミット
   - チェックポイントを作る

4. **エラーが出たら深追いしない**
   - 5分以内に解決できない場合は即座にロールバック
   - `git reset --hard HEAD~1` で前の状態に戻る

### ✅ 必ずやること

1. **各ステップでGitコミット**
   - コミットメッセージに結果を詳細に記載
   - いつでもロールバックできる状態を維持

2. **ビルド → テスト → 実行確認 → コミット のサイクル**
   - この順番を必ず守る
   - 1つでも失敗したらロールバック

3. **コミットメッセージに詳細を記載**
   - 何を変更したか
   - ビルド・テスト結果
   - 次のステップ

4. **問題発生時は即座にロールバック**
   ```bash
   git reset --hard HEAD~1
   xcodebuild clean build  # 元の状態を確認
   ```

---

## 📊 完了後のバージョニング

### リファクタリング完了時

全Phase（1-3）が完了したら、バージョンタグを作成します：

```bash
# 変更規模: 大規模機能（MAJOR +1）
# v0.9.0 → v1.0.0

git tag -a "v1.0.0" -m "v1.0.0: QuizView大規模リファクタリング完了

Phase 1-3 完了:
- QuizEngine 抽出
- QuestionSelector 抽出
- ScoreUpdater 抽出

成果:
- QuizView: 1,100行 → 300行
- テスト: 全て通過
- ビルド: 成功

所要時間: 6時間
影響ファイル: 10ファイル"
```

詳細は `.copilot/prompts/version-management.md` を参照。

---

## 📚 関連ドキュメント

- `参考資料/大規模リファクタリング実現方策.md` - 詳細な手順書
- `参考資料/リファクタリング失敗分析_20251019.md` - 失敗から学んだ教訓
- `.copilot/prompts/ai-git-workflow.md` - Git統合ワークフロー
- `.copilot/prompts/version-management.md` - バージョン管理ルール
- `.copilot/structure-map.md` - プロジェクト構造
- `.copilot/changelog.md` - 変更履歴

---

## 🎯 次のステップ

事前準備が完了したら、AIエージェントに以下のように指示してください：

```
「プロンプト0（事前準備）をGit統合ワークフローで実行してください」
```

事前準備が完了したら：

```
「Phase 1, Step 1.1 をGit統合ワークフローで実行してください」
```

各ステップが完了したら：

```
「Step 1.2 を実行してください」
```

問題が発生したら：

```
「中断してロールバックしてください」
```

---

## 🎓 まとめ

**Git統合版リファクタリングの特徴:**
- **AIが自動的にGit操作**（ブランチ作成、コミット、ロールバック）
- **各ステップでチェックポイント**（5秒で前の状態に戻れる）
- **バージョン管理と統合**（完了時に自動タグ作成）

**開発者の負担:**
- Gitコマンドを覚える必要なし
- 自然言語で指示するだけ
- 問題が起きたら「中断してロールバック」

**AIの責任:**
- Git操作を全て自動実行
- ビルド・テスト確認を必ず実施
- 問題発生時は自動ロールバックと原因分析
- バージョンタグを自動作成
