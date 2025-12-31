# Servant 通知ポリシー（"心地良い完璧"）

目的は「情報を消さずに、割り込みを最小化する」ことです。原則として、日常の情報は Output/Problems に集約し、トースト通知は **失敗中心**に寄せます。

## 対象範囲

- 対象: VS Code の `showInformationMessage/showWarningMessage/showErrorMessage` によるトースト通知
- 対象外（例外）:
  - ユーザー選択が必要な確認ダイアログ（例: リセット確認）
  - `withProgress` の進捗UI（コマンド実行中の明示的なフィードバック）
  - ユーザーが明示的に選択したガイダンス表示（Quick Fix など）は `Notifier.modalInfo` を許容

## モード（設定）

- `servant.notifications.mode`
  - `quiet`（既定）: 割り込み最小
  - `standard`: コマンド起点の通知を表示
  - `strict`: すべて表示
- `servant.notifications.cooldownMs`（既定 60000）: 同一通知の再表示を抑制（0で無効）

## 通知の原則（分類）

- **critical（常に割り込み）**
  - 「ユーザーの次の操作が止まる」/「無視すると損害が大きい」
  - 例: ワークスペースが無い、コミットがブロックされる 等
- **command（ユーザー起点）**
  - コマンド実行結果の要約
  - `quiet` では基本的に `info` のみ（成功/完了の短い確認）
- **auto（自動イベント）**
  - 自動学習など、バックグラウンドの出来事
  - `quiet` では `info/warning` を抑制し、必要なら Output に記録

## 目標指標（受け入れ基準）

- `quiet`:
  - 自動イベントの `info/warning` は **0件**（トーストは出さない）
  - コマンド成功のトーストは **最大1件/コマンド**（短い要約）
  - エラーは表示（失敗で無反応にならない）
- `standard`:
  - コマンド起点の `info/warning/error` を表示
  - 自動イベントは `error` 以外は抑制
- `strict`:
  - すべて表示（デバッグ用途）

## 実装メモ

- 通知は `extensions/servant/src/ui/Notifier.ts` に集約する
- 抑制した通知は OutputChannel に `[Notify][suppressed]` として記録し、後から追跡できるようにする
