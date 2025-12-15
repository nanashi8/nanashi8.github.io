---
description: リファクタリング安全ガイドライン（AI開発アシスタント用・最優先）
applyTo: '**'
---

# 🔒 リファクタリング安全ガイドライン

**最終更新**: 2025年12月11日  
**対象**: すべてのリファクタリング作業  
**優先度**: CRITICAL

---

## 🚨 発生した重大事故（2025年12月11日）

### 事故1: リベース時のsrc/完全消失
- **状況**: リベース中断後に`git reset --hard origin/main`実行
- **被害**: 116ファイルのsrc/ディレクトリが完全消失
- **原因**: バックアップなし + リモート状態確認不足
- **復旧**: reflogとGitタグから復元（2時間以上）

### 事故2: SimpleWord iOS混入
- **状況**: Webアプリリポジトリに無関係なiOSプロジェクト混在
- **期間**: 初回コミットから2ヶ月間気づかず
- **原因**: `.gitignore`による除外なし

---

## ⚠️ AI開発アシスタント必須チェック項目

### リファクタリング作業を開始する前に必ず確認すること

#### 1. **チェックポイント作成の確認**
```bash
# ユーザーがチェックポイントを作成済みか確認
./scripts/refactor-checkpoint.sh list

# 未作成の場合は促す
"リファクタリングを開始する前に、チェックポイントを作成してください:
./scripts/refactor-checkpoint.sh save phase2-[作業名]"
```

#### 2. **現在の状態確認**
```bash
# ビルドが成功することを確認
npm run build

# src/ファイル数を確認（ベースライン: 100+）
find src -type f | wc -l

# Git作業ディレクトリがクリーンか確認
git status
```

#### 3. **作業範囲の明確化**
- ❌ 一度に10個以上のファイルを変更しない
- ❌ 複数のディレクトリを同時に再構成しない
- ✅ 1つのフック抽出 = 1コミット
- ✅ 1つのコンポーネント分割 = 1コミット

---

## 📋 AI開発アシスタントの実装手順

### ステップ1: 事前確認（必須）

```typescript
// AI判断フロー
if (ユーザーがリファクタリングを依頼) {
  // 1. チェックポイント確認
  if (!checkpointExists()) {
    return "チェックポイントを作成してください: ./scripts/refactor-checkpoint.sh save [名前]";
  }
  
  // 2. ビルド確認
  if (!buildSuccess()) {
    return "現在のコードがビルドに失敗しています。先に修正してください。";
  }
  
  // 3. 作業範囲確認
  if (変更ファイル数 > 10) {
    return "作業範囲が大きすぎます。段階的に分割しましょう。";
  }
  
  // OK: リファクタリング実施
}
```

### ステップ2: 段階的実装

#### ❌ 悪い例
```typescript
// 一度に大量変更
- src/types.ts を5ファイルに分割
- src/constants.ts を3ファイルに分割
- src/utils/*.ts を10ファイル移動
- コンポーネント5個作成
// → まとめてコミット
```

#### ✅ 良い例
```typescript
// 1. types.tsからQuizQuestion型を分割
- src/types/quiz.ts 作成
- App.tsx等でimport path更新
- ビルド確認
- コミット: "refactor(types): extract QuizQuestion to quiz.ts"
- チェックポイント: ./scripts/refactor-checkpoint.sh save phase2-quiz-types

// 2. 次の型を分割
- src/types/grammar.ts 作成
- import path更新
- ビルド確認
- コミット: "refactor(types): extract grammar types"
- チェックポイント: ./scripts/refactor-checkpoint.sh save phase2-grammar-types

// ... 以下同様に1つずつ
```

### ステップ3: 各変更後の検証（自動）

```bash
# pre-commit-refactorフックが自動実行する内容
✓ src/ファイル数チェック (100ファイル以下で警告)
✓ 大量削除検知 (5ファイル以上で停止)
✓ 重要ファイル保護 (App.tsx, main.tsx等)
✓ ビルド成功確認

# AI開発アシスタントは結果を確認
if (フック失敗) {
  // エラー内容を解析して対処法を提示
  // 必要なら変更をロールバック
}
```

---

## 🛡️ 実装済み安全システム

### 1. Gitフック（自動実行）

| フック | タイミング | チェック内容 |
|--------|-----------|-------------|
| `pre-commit` | コミット前 | 型チェック + Lint + リファクタリング安全チェック |
| `pre-commit-refactor` | コミット前 | src/ファイル数、大量削除、重要ファイル、ビルド |
| `pre-rebase` | リベース前 | 自動バックアップタグ作成 + src/検証 |
| `post-rebase` | リベース後 | 整合性チェック + 復旧ガイド表示 |
| `pre-push` | プッシュ前 | 最終安全確認 + SimpleWord混入検知 |

### 2. チェックポイントシステム（手動実行）

```bash
# チェックポイント作成
./scripts/refactor-checkpoint.sh save <名前>

# 進捗確認
./scripts/refactor-checkpoint.sh compare

# 一覧表示
./scripts/refactor-checkpoint.sh list

# ロールバック
./scripts/refactor-checkpoint.sh restore <名前>
```

**記録内容**:
- コミットハッシュ
- ブランチ名
- src/ファイル数
- components/ファイル数
- hooks/ファイル数
- features/ファイル数
- ビルド状態

### 3. 包括的ドキュメント

- **`docs/processes/REFACTORING_SAFETY.md`**: ユーザー向け完全ガイド
- **`docs/processes/EMERGENCY_RECOVERY.md`**: 緊急復旧手順
- **`docs/development/REFACTORING_PLAN.md`**: Phase 1-3計画

---

## 🤖 AI開発アシスタント向け実装パターン

### パターン1: フック抽出

```typescript
// ユーザー依頼: "App.tsxからクイズ設定のロジックをフックに抽出して"

// AI応答例:
"以下の手順で安全に実施します:

1. チェックポイント確認
   ./scripts/refactor-checkpoint.sh list

2. src/hooks/useQuizSettings.ts 作成
   - autoAdvance関連のstateを抽出
   - 22行の新しいフック

3. App.tsxで使用
   - import追加
   - 15行削除

4. ビルド確認 & コミット
   npm run build
   git commit -m 'refactor: extract useQuizSettings hook'

5. チェックポイント作成
   ./scripts/refactor-checkpoint.sh save phase2-quiz-settings

実装を開始しますか？"
```

### パターン2: ディレクトリ再構成

```typescript
// ユーザー依頼: "src/types.tsを分割して"

// AI応答例:
"types.tsは485行あるため、段階的に分割します:

Phase A: quiz関連 (150行)
1. src/types/quiz.ts 作成
2. QuizQuestion等を移動
3. import path更新
4. ビルド & コミット & チェックポイント

Phase B: grammar関連 (180行)
1. src/types/grammar.ts 作成
2. GrammarData等を移動
3. import path更新
4. ビルド & コミット & チェックポイント

Phase C: 残り (155行)
1. src/types/common.ts, progress.ts 作成
2. 残りの型を整理
3. import path更新
4. ビルド & コミット & チェックポイント

Phase Aから開始しますか？"
```

### パターン3: コンポーネント分割

```typescript
// ユーザー依頼: "App.tsxを分割して"

// AI応答例:
"App.tsx (6617行) の分割は高リスクです。
以下の安全な手順を推奨します:

前提条件チェック:
- [ ] チェックポイント作成済み
- [ ] 現在のビルド成功
- [ ] Git状態がクリーン

推奨分割順序（1つずつ実施）:
1. ScoreBoard → 独立コンポーネント (400行)
2. QuizView → 独立コンポーネント (800行)
3. SpellingGame → 独立コンポーネント (600行)

各ステップで:
- ファイル作成
- Props定義
- ロジック移動
- ビルド確認
- コミット
- チェックポイント

最初のScoreBoardから開始しますか？"
```

---

## ⚠️ 危険な操作の検出と警告

### AI開発アシスタントが警告すべき状況

#### 1. 大量ファイル操作
```typescript
if (削除ファイル数 >= 5 || 移動ファイル数 >= 10) {
  警告: "一度に多数のファイルを操作しています。
        段階的に分割することを推奨します。
        続行しますか？"
}
```

#### 2. 重要ファイルの変更
```typescript
const CRITICAL_FILES = [
  'src/App.tsx',
  'src/main.tsx',
  'index.html',
  'vite.config.ts',
  'package.json'
];

if (変更ファイル in CRITICAL_FILES) {
  警告: "重要ファイルを変更します。
        チェックポイントを作成済みですか？
        バックアップを確認してください。"
}
```

#### 3. ビルド失敗の予測
```typescript
if (import文の変更 && !対応するexport更新) {
  警告: "import pathを変更していますが、
        対応するexportが見つかりません。
        ビルドが失敗する可能性があります。"
}
```

---

## 📊 安全性レベルの判定

### AI開発アシスタントの判断基準

| 変更内容 | 安全性 | 対応 |
|---------|--------|------|
| 1ファイル新規作成 | 🟢 Safe | そのまま実装 |
| 1-3ファイル修正 | 🟢 Safe | ビルド確認してコミット |
| 4-9ファイル修正 | 🟡 Caution | チェックポイント必須 |
| 10+ファイル修正 | 🔴 Danger | 分割を提案 |
| 5+ファイル削除 | 🔴 Danger | 段階的削除を提案 |
| App.tsx変更 | 🟡 Caution | 慎重に確認 |
| types.ts分割 | 🟡 Caution | import path全チェック |
| ディレクトリ再構成 | 🔴 Danger | Phase分割必須 |

---

## 🔄 エラー発生時の対処

### AI開発アシスタントの復旧支援

#### シナリオ1: pre-commitフック失敗
```bash
❌ ERROR: Too many files deleted: 8

# AI応答:
"pre-commitフックが失敗しました。
理由: 8ファイルが削除されています（上限5）

削除ファイル:
[ファイルリストを表示]

以下の対応を選択してください:
1. 削除を複数コミットに分割
2. 削除を取り消す: git reset HEAD
3. フックを一時無効化（非推奨）"
```

#### シナリオ2: ビルド失敗
```bash
❌ ERROR: Build failed after changes

# AI応答:
"ビルドが失敗しました。
詳細エラー: npm run build の出力を確認中...

よくある原因:
1. Import path未更新: [検出されたパス]
2. 型エクスポート漏れ: [検出された型]
3. 循環依存: [検出された循環]

修正案:
[具体的な修正コードを提示]

または前の状態に戻しますか？
git reset --hard HEAD"
```

#### シナリオ3: ファイル消失検知
```bash
⚠️  WARNING: Only 85 files in src/ (baseline: 100+)

# AI応答:
"src/ディレクトリのファイル数が減少しています。
予想: 100+ ファイル
現在: 85 ファイル (-15)

変更内容:
削除: [リスト]
追加: [リスト]

これは意図的な統合ですか？
- はい → 続行
- いいえ → チェックポイントに戻す:
  ./scripts/refactor-checkpoint.sh restore [名前]"
```

---

## 📝 コミットメッセージ規約（リファクタリング専用）

```bash
# フォーマット
refactor(scope): 簡潔な説明

- 変更内容1
- 変更内容2
- ファイル数変化: +X, -Y
- ビルド状態: Success

# 例1: フック抽出
refactor(hooks): extract useQuizSettings from App.tsx

- Create src/hooks/useQuizSettings.ts (22 lines)
- Extract auto-advance settings logic
- Reduce App.tsx by 15 lines
- Files: +1, Build: Success

# 例2: 型分割
refactor(types): split types.ts into domain files

- Create quiz.ts, grammar.ts, common.ts
- Move 485 lines across 3 files
- Update 12 import statements
- Files: +3, -1, Build: Success

# 例3: コンポーネント分割
refactor(components): extract ScoreBoard component

- Create src/components/ScoreBoard.tsx (400 lines)
- Define ScoreBoardProps interface
- Reduce App.tsx by 380 lines
- Files: +1, Build: Success
```

---

## 🎯 Phase 2リファクタリング特有の注意点

### REFACTORING_PLAN.mdとの連携

```typescript
// AI開発アシスタントはPlanを参照
const plan = await read('docs/development/REFACTORING_PLAN.md');

// Phase 2: カスタムフック抽出 (5個)
const hooks = [
  'useQuizSettings',    // 22行, 難易度: Low
  'useQuizFilters',     // 45行, 難易度: Medium
  'useQuizState',       // 67行, 難易度: Medium
  'useSpellingGame',    // 推定80行, 難易度: High
  'useSessionStats'     // 推定60行, 難易度: Medium
];

// 各フック抽出時のチェックリスト
for (const hook of hooks) {
  // 1. チェックポイント作成
  // 2. フックファイル作成
  // 3. ロジック抽出
  // 4. 型定義追加
  // 5. App.tsxで使用
  // 6. ビルド確認
  // 7. テスト実行
  // 8. コミット
  // 9. チェックポイント作成
}
```

### 進捗トラッキング

```bash
# AI開発アシスタントは進捗を報告
./scripts/refactor-checkpoint.sh list

# 出力例:
📋 Available checkpoints:
  [20251211-140408] phase2-safety-system-installed
    Files: 116 | Build: success
  [20251211-150230] phase2-quiz-settings-done
    Files: 117 | Build: success
  [20251211-152045] phase2-quiz-filters-done
    Files: 118 | Build: success

# 進捗報告
"Phase 2進捗:
✅ useQuizSettings 完了
✅ useQuizFilters 完了
🔄 useQuizState 作業中 (60%)
⏳ useSpellingGame 未着手
⏳ useSessionStats 未着手"
```

---

## 🚫 絶対に行ってはいけない操作

### AI開発アシスタントの禁止事項

1. **チェックポイントなしで大規模リファクタリング開始**
   ```bash
   ❌ いきなり10ファイル変更
   ✅ まずチェックポイント作成を促す
   ```

2. **ビルド確認なしでコミット**
   ```bash
   ❌ git commit (ビルド未確認)
   ✅ npm run build → 成功確認 → git commit
   ```

3. **複数の変更を1コミットにまとめる**
   ```bash
   ❌ フック3個抽出 + 型分割 + コンポーネント作成 → 1コミット
   ✅ 各作業を個別コミット
   ```

4. **エラー無視して続行**
   ```bash
   ❌ ビルド失敗 → "後で直す" → 次の変更
   ✅ ビルド失敗 → 即座に修正 or ロールバック
   ```

5. **import path更新漏れ**
   ```bash
   ❌ types.ts分割 → import未更新
   ✅ ファイル移動 → 全import検索・更新
   ```

---

## 📚 参考ドキュメント

### ユーザー向け
- **`docs/processes/REFACTORING_SAFETY.md`**: 完全な安全ガイド
- **`docs/processes/EMERGENCY_RECOVERY.md`**: 緊急復旧手順
- **`docs/development/REFACTORING_PLAN.md`**: Phase 1-3詳細計画

### AI開発アシスタント向け
- **このファイル**: リファクタリング安全ガイドライン
- **`.aitk/instructions/development-guidelines.instructions.md`**: 開発原則
- **`.aitk/instructions/core-principles.instructions.md`**: コア原則

---

## ✅ 最終チェックリスト（AI開発アシスタント用）

リファクタリング開始前:
- [ ] ユーザーがチェックポイント作成済みか確認
- [ ] 現在のビルドが成功することを確認
- [ ] Git状態がクリーンか確認
- [ ] 作業範囲が適切か確認（10ファイル以下）
- [ ] REFACTORING_PLAN.mdで手順確認済み

各コミット前:
- [ ] npm run build 成功
- [ ] npm run lint パス
- [ ] pre-commitフック成功
- [ ] 変更ファイル数が適切（10以下）
- [ ] コミットメッセージが規約準拠

各Phase完了後:
- [ ] チェックポイント作成
- [ ] ./scripts/refactor-checkpoint.sh compare で変更確認
- [ ] 動作確認（開発サーバー起動）
- [ ] ドキュメント更新（必要なら）

---

**最重要**: リファクタリングは焦らず、小さく、確実に。
AI開発アシスタントは常に安全性を最優先してください。
