# AI協調作業ワークフロー

## 🏰 役割分担

### ユーザー（主人）
- プロジェクトのオーナー
- 最終的な意思決定者
- 作業指示を出す

### メインAI（執事長・私）
- ユーザーからの指示を受け取る
- サーバントに相談して情報収集
- 実際のコード編集・ファイル操作を実行
- 結果をユーザーに報告

### サーバント（屋敷管理人）
- **ファイル**: `scripts/project_ai_servant.py`
- **役割**: プロジェクトのメタ情報管理
- **知識**: scripts/ の全スクリプト用途を熟知
- **機能**:
  - プロジェクト構造の把握
  - 過去の失敗パターンの記憶
  - 参考ドキュメントの提示
  - 推奨スクリプトの提案
  - 現在の問題の警告

## 🔄 作業フロー

```
①【ユーザー】作業指示
    "文法データを追加したい"
    ↓
②【メインAI】サーバントに相談
    python3 scripts/project_ai_servant.py --analyze "文法データを追加したい"
    ↓
③【サーバント】情報提供
    - タスクタイプ: data_addition
    - 必要なドキュメント: docs/data/GRAMMAR_DATA_STRUCTURE.md
    - 推奨スクリプト: scripts/validate_grammar_advanced.py
    - 警告: 既存のCRITICAL問題が19件あります
    ↓
④【メインAI】効率的に作業
    - ドキュメントを参照
    - 既存問題を先に確認
    - 推奨スクリプトで検証しながら作業
    ↓
⑤【成果物】品質保証された変更
```

## 🤖 サーバントの主な機能

### 1. タスク分析（--analyze）

```bash
python3 scripts/project_ai_servant.py --analyze "○○したい"
```

**提供される情報**:
- タスクタイプ（data_addition, feature, bug_fix等）
- 推定作業時間
- 必要なドキュメントリスト
- 関連スクリプト
- 注意事項

**例**:
```bash
# 文法データの品質チェック
python3 scripts/project_ai_servant.py --analyze "文法データの品質チェックをしたい"

# 出力:
# タスクタイプ: maintenance
# ワークフロー: メンテナンス・品質改善
# 推定時間: 10-30分
# 必要なドキュメント:
#   ✅ docs/quality/QUALITY_SYSTEM.md
```

### 2. 次のアクション提案（--suggest）

```bash
python3 scripts/project_ai_servant.py --suggest "○○したい"
```

**機能**:
- 現在の問題状況を先に報告
- 優先すべき作業を提案
- 問題がある場合は**作業をブロック**

**例**:
```bash
python3 scripts/project_ai_servant.py --suggest "新機能を追加したい"

# 出力:
# 🚨 緊急: CRITICAL問題が19件検出されています
# 推奨対応:
#   1. python3 scripts/maintenance_ai.py --verbose
#   2. CRITICAL問題を優先的に修正
#   3. 修正後に再検証
# 新しい作業は問題修正後に開始してください。
```

### 3. 用語辞書（--query-term）

```bash
python3 scripts/project_ai_servant.py --query-term [変数名/関数名]
```

**機能**:
- プロジェクト固有の変数・関数の意味を説明
- 使用上の注意点を提示
- 誤用防止

**例**:
```bash
python3 scripts/project_ai_servant.py --query-term isSkipped

# 出力:
# isSkipped:
#   意味: スキップボタン用パラメータ
#   注意: 初回問題判定には使わない！
#   使用箇所: processAnswerAndGetNext()
```

### 4. ステータス確認（--status）

```bash
python3 scripts/project_ai_servant.py --status
```

**機能**:
- プロジェクトの健康状態
- 現在の問題数（CRITICAL/WARNING/INFO）
- カテゴリ別の内訳

### 5. 問題パネル確認（--check-panel）

```bash
python3 scripts/project_ai_servant.py --check-panel
```

**機能**:
- VS Code の Problems パネルの内容を確認
- エラー・警告の一覧

### 6. 警告の詳細分析（--analyze-warnings）

```bash
python3 scripts/project_ai_servant.py --analyze-warnings
```

**機能**:
- 警告の詳細な分析
- 対処方法の提案

### 7. 用語リスト（--list-terms）

```bash
python3 scripts/project_ai_servant.py --list-terms
```

**機能**:
- 登録されている全用語の一覧表示

## 📋 メインAIの作業手順（標準プロトコル）

### ステップ1: サーバントに相談

```bash
# 作業内容を伝える
python3 scripts/project_ai_servant.py --analyze "[ユーザーの指示内容]"
```

### ステップ2: 現状確認

```bash
# プロジェクトの健康状態を確認
python3 scripts/project_ai_servant.py --status

# 問題があれば詳細確認
python3 scripts/project_ai_servant.py --check-panel
```

### ステップ3: ドキュメント参照

サーバントが提示したドキュメントを読む:
```typescript
// 例: サーバントが提示したドキュメント
read_file("docs/quality/QUALITY_SYSTEM.md")
read_file("docs/data/GRAMMAR_DATA_STRUCTURE.md")
```

### ステップ4: 作業実行

- 推奨されたスクリプトを活用
- 参考ドキュメントに従う
- 不明な用語は `--query-term` で確認

### ステップ5: 検証

```bash
# 作業後の検証
npm run quality:check
python3 scripts/validate_grammar_advanced.py
```

### ステップ6: 再度ステータス確認

```bash
# 問題が増えていないか確認
python3 scripts/project_ai_servant.py --status
```

## 🎯 実践例

### 例1: 文法データ追加

```
【ユーザー】「新しい文法問題を追加してください」
    ↓
【メインAI】
1. python3 scripts/project_ai_servant.py --analyze "新しい文法問題を追加"
   → タスクタイプ: data_addition
   → 必要ドキュメント: docs/data/GRAMMAR_DATA_STRUCTURE.md
   → 推奨スクリプト: scripts/validate_grammar_advanced.py

2. python3 scripts/project_ai_servant.py --status
   → 🚨 CRITICAL問題19件！
   → 先に既存問題を解決すべき

3. ユーザーに報告:
   「現在CRITICAL問題が19件あります。先にこれらを解決しますか？
    それとも新規追加を優先しますか？」
```

### 例2: リファクタリング

```
【ユーザー】「QuestionSchedulerをリファクタリングして」
    ↓
【メインAI】
1. python3 scripts/project_ai_servant.py --query-term QuestionScheduler
   → 用語説明を取得

2. python3 scripts/project_ai_servant.py --analyze "QuestionSchedulerのリファクタリング"
   → 関連ドキュメント: docs/specifications/QUESTION_SCHEDULER.md
   → 注意事項: アルゴリズム変更時はsimulationで検証必須

3. ドキュメント参照 + 実装

4. npm run simulate で検証

5. python3 scripts/project_ai_servant.py --status で最終確認
```

### 例3: バグ修正

```
【ユーザー】「スキップボタンのバグを修正して」
    ↓
【メインAI】
1. python3 scripts/project_ai_servant.py --query-term isSkipped
   → 注意: 初回問題判定には使わない！

2. python3 scripts/project_ai_servant.py --analyze "スキップボタンのバグ修正"
   → 関連ファイル: src/specialists/questionScheduler.ts
   → テスト: tests/integration/questionScheduler.test.ts

3. バグ修正

4. npm run test:unit で検証

5. git commit (pre-commit フックで自動検証)
```

## 🔧 scriptsディレクトリの役割

### プロジェクトのメタ情報を管理

```
scripts/
├── project_ai_servant.py      # サーバント本体
├── maintenance_ai.py           # メンテナンス自動化
├── context_database.py         # プロジェクト情報DB
├── quality_nervous_system.py  # 品質監視システム
├── validate_*.py               # 各種検証スクリプト
├── check-*.sh                  # チェックスクリプト
└── ...                         # その他150+のツール
```

### サーバントの「手帳」

サーバントは以下を記録・把握:
- 各スクリプトの用途
- 実行タイミング（自動/手動）
- 依存関係
- 推奨される使い方
- 過去の失敗パターン
- よくある問題と解決方法

## ⚠️ 重要原則

### 1. 独断専行しない

❌ **悪い例**:
```
【ユーザー】「文法データ追加して」
【メインAI】（いきなりコード編集開始）
→ 既存の問題を見落とす
→ データ構造を誤解
→ 品質チェックをスキップ
```

✅ **良い例**:
```
【ユーザー】「文法データ追加して」
【メインAI】
  1. サーバントに相談
  2. 現状確認
  3. ドキュメント参照
  4. 慎重に作業
  5. 検証
```

### 2. 用語は必ず確認

❌ 推測で変数名・関数名を使う
✅ `--query-term` で意味を確認してから使う

### 3. 問題の優先順位を尊重

サーバントが「CRITICAL問題あり」と警告したら:
- ユーザーに報告
- 優先順位を確認
- 必要なら既存問題を先に解決

### 4. 検証を怠らない

作業後は必ず:
```bash
npm run quality:check
python3 scripts/project_ai_servant.py --status
```

## 📚 参考ドキュメント

- [scripts/README.md](../scripts/README.md) - スクリプト全体説明
- [scripts/ORGANIZATION.md](../scripts/ORGANIZATION.md) - 整理ガイド
- [.husky/README.md](../.husky/README.md) - Git hooks説明
- [docs/quality/QUALITY_SYSTEM.md](../quality/QUALITY_SYSTEM.md) - 品質システム

## 🎓 新規AIへの教育

このプロジェクトに参加する新しいAIは:

1. まずこのドキュメントを読む
2. `python3 scripts/project_ai_servant.py --help` を実行
3. サーバントの機能を理解
4. 作業フローを守る

## 🔮 将来の展望

### サーバントの進化

- より高度なタスク分析
- 自動修正の提案
- コード生成支援
- パターン学習の強化

### メインAIの自動化

- サーバントへの自動相談
- ドキュメント自動参照
- 検証の自動実行

## まとめ

```
効率的な作業 = サーバントとの協調

【成功の鍵】
1. 独断専行しない
2. サーバントに相談
3. ドキュメントを参照
4. 検証を徹底
5. 問題の優先順位を尊重
```

このワークフローを守ることで:
- ✅ 品質の維持
- ✅ 効率の向上
- ✅ ミスの削減
- ✅ チーム協調
