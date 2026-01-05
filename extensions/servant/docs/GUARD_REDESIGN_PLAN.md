# Guard再設計（拡張内へ段階移行）実装計画

## 目的（Why）
- pre-commit / VS Code内検証 / AI修正ワークフローで、ガード結果の「形式」と「意味」を統一する。
- repo側scripts（`scripts/pre-commit-ai-guard.sh`, `scripts/ai-guard-check.mjs`）を当面の一次ゲートとして維持しつつ、拡張へロジックを段階的に移植して依存を減らす。
- 既存の運用品質（Specチェック強制、危険パターン検出、関連指示書提示）を落とさない。

## 現状の構成（As-is）

### Repo側（Git hook / scripts）
- `scripts/pre-commit-ai-guard.sh`
  - stagedの変更ファイル（`.ts/.tsx/.js/.jsx/.md`）を収集
  - `.aitk/spec-check.json` の鮮度チェックを強制（期限切れならcommitをブロック）
  - `git diff --cached` を文字列として危険パターン検出（例: `questions.sort` 等）

- `scripts/ai-guard-check.mjs`
  - AI修正開始時の「リアルタイムガード」レポート生成
  - 失敗履歴（`.aitk/ai-failure-history.json`）と失敗パターン（`.aitk/failure-patterns.json`）から類似失敗を提示
  - ユーザー依頼/対象ファイルから「関連指示書」を推定し、読むべきものを一覧化
  - Specチェック未記録/期限切れなら exit code=2 でワークフローを止める

- `scripts/ai-workflow.mjs`
  - `ai-guard-check` → `record-ai-failure start` の順に実行する統合ラッパー

### 拡張側（VS Code Extension）
- `extensions/servant/src/git/HookInstaller.ts`
  - 生成する `.git/hooks/pre-commit` は **repo側の `scripts/pre-commit-ai-guard.sh` を優先実行**。
  - guardが成功した場合のみ、`code --command servant.validateBeforeCommit` を試す（`code` が無い場合は repo guard がある限り commit をブロックしない）。

- `extensions/servant/src/git/PreCommitValidator.ts`
  - Specチェックの鮮度強制（拡張内 `SpecCheck.ts`）
  - `AI_CONTEXT.md` の鮮度強制
  - UI変更時の `DECISIONS.md` 更新要求
  - RuleEngine + InstructionsLoader による指示書違反の検出と、Quick Fix/診断表示

- `extensions/servant/src/guard/SpecCheck.ts`
  - `.aitk/spec-check.json` の鮮度判定
  - staged files と instruction の `applyTo` に基づき必要指示書を算出（repo scripts より高機能）

## 重複/差分（Gap）
- Specチェック強制は **repo側hook** と **拡張側PreCommitValidator** の両方に存在（ただし算出ロジックは拡張側が高機能）。
- 危険パターン検出（diffベース）は repo側hookにのみ存在。
- 失敗履歴/関連指示書提示（ワークフロー支援）は repo側 `ai-guard-check.mjs` にのみ存在。

## To-be（再設計方針）

### 1) Guard結果の正規化（最優先）
- すべてのガード（repo scripts / 拡張内ロジック）は、共通の `GuardResult` に正規化して扱う。
- UI/診断/ログは `GuardResult` のみに依存し、実装（scriptsかTSか）に依存しない。

### 2) Runnerの二層化
- **ScriptsRunner（互換）**: まずは scripts を呼び出して `GuardResult` を生成する。
- **NativeRunner（移植）**: Specチェック鮮度、危険パターン検出などをTSへ段階移植。

### 3) 既存運用の保持
- pre-commitは引き続き repo guard を一次ゲートとして維持。
- VS Code内の検証コマンド（`servant.validateBeforeCommit`）は、まずUI表示の統一から着手。

## マイルストーン
1. 現状Guard責務を棚卸し（この文書）
2. Guard実行インターフェース定義（`GuardRunner` / `GuardResult`）
3. scripts呼び出しRunner実装（最初は結線しない）
4. 結果表示/診断UIを `GuardResult` 基準へ統一
5. Specチェック鮮度チェックをTSへ移植し、repo scriptsとの一致を確認
6. 危険パターン検出を段階移植（diff解析は最小から）
7. hook/コマンド結線を整理（互換維持）
8. テスト（型/結果スナップショット）と移行手順を追加

## 移行・有効化手順（How to start safely）

### VS Code内でrepo guardを実行したい場合（オプトイン）
- 既定では、Git hook 側が repo guard を優先実行するため、VS Code コマンド側での二重実行を避ける目的でOFFです。
- VS Code から `Servant: Validate Before Commit` 実行時にも repo guard を前段で走らせたい場合は、設定を有効化します。

設定キー:
- `servant.guard.runRepoScriptsBeforeCommit`: `true`

期待動作:
- `scripts/pre-commit-ai-guard.sh` が失敗した場合、VS Code 内でも同じ理由が表示され、コミットをブロックします。
- 成功した場合は、既存の `PreCommitValidator`（指示書違反/Specチェック/Context Packetなど）へ続行します。

## 非目標（Not in scope）
- 既存のQuestionScheduler等の出題ロジックの改変
- 新しいUI画面の追加
- scripts側の仕様を一気に削除する（段階移行が前提）
