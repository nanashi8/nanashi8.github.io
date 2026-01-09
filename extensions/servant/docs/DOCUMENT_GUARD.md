# DocumentGuard - ドキュメント作成ルール強制機能

Servant 拡張機能の一部として、docs/ 配下の新規 Markdown ファイル作成を監視し、プロジェクトのドキュメント運用ルールを自動的に遵守させます。

## 機能

### 1. 新規ドキュメント作成の監視

docs/ 配下に新規 Markdown ファイルを作成すると、自動的に以下をチェックします:

- ✅ **配置先の妥当性**: docs 直下への配置を検出し、適切なサブディレクトリを提案
- ✅ **Front Matter の有無**: Front Matter がない場合、自動挿入を提案
- ✅ **ファイル名からの推論**: ファイル名から適切な配置先とタグを推測

### 2. 自動修正機能

ルール違反を検出すると、以下のアクションを提案します:

- **Front Matter を追加**: 自動的に適切な Front Matter を生成・挿入
- **移動する**: 推奨されるディレクトリに自動移動
- **無視**: このファイルはルール違反を許容
- **ルールを確認**: DOCUMENTATION_OPERATIONS.md を開く

### 3. Front Matter 自動生成

以下の情報を自動的に生成します:

```yaml
---
title: ファイル名から推測されたタイトル
created: 作成日（自動）
updated: 作成日（自動）
status: draft
tags: [ファイル名から推測されたタグ]
---
```

### 4. タグの自動推測

ファイル名から以下のタグを自動的に推測します:

- `ai` - AI、adaptive、learning などを含む
- `test` - test、quality などを含む
- `specification` - spec、specification などを含む
- `plan` - plan、roadmap などを含む
- `report` - report、completion などを含む
- `guideline` - guideline、rule などを含む
- `development` - development、dev などを含む

---

## 使い方

### 自動監視（常時動作）

Servant が有効な状態で、docs/ 配下に新規 Markdown ファイルを作成すると、自動的にルールチェックが実行されます。

### 手動コマンド

#### 既存ドキュメントの検証

```
コマンドパレット → "Servant: Validate Documents"
```

すべての既存ドキュメントをスキャンし、ルール違反を出力パネルにレポートします。

**出力例:**
```
📄 既存ドキュメントを検証中...
⚠️  AI_INTEGRATION_GUIDE.md - docs 直下に配置
⚠️  HOW_TO_ENABLE_AI.md - docs 直下に配置
⚠️  specs/new-feature.md - Front Matter なし

=== 検証結果 ===
総ファイル数: 374
docs 直下のファイル: 23
Front Matter なし: 45
違反総数: 68
```

#### Front Matter の一括追加

```
コマンドパレット → "Servant: Batch Add Front Matter"
```

Front Matter がないすべてのドキュメントに自動的に追加します。

**注意**: 実行前に確認ダイアログが表示されます。

---

## 配置ルール（自動推測）

DocumentGuard は、ファイル名から以下のルールで配置先を推測します:

| ファイル名パターン | 推奨ディレクトリ | 説明 |
|-------------------|-----------------|------|
| `*spec*`, `*specification*` | `specifications/` | 機能の仕様 |
| `*report*`, `*completion*` | `reports/` | 実装・テスト報告 |
| `*plan*`, `*roadmap*` | `plans/` | 計画・ロードマップ |
| `*guideline*`, `*rule*` | `guidelines/` | コーディング規約 |
| `*development*`, `*dev*` | `development/` | 開発環境・手順 |
| `*how-to*`, `*guide*` | `how-to/` | 使い方ガイド |
| `*quality*`, `*test*` | `quality/` | 品質管理・テスト |
| `*reference*` | `references/` | 技術情報 |
| `*process*`, `*workflow*` | `processes/` | ワークフロー |
| `*maintenance*` | `maintenance/` | 保守・メンテナンス |
| `*ai*`, `*adaptive*`, `*learning*` | `specifications/ai/` | AI関連仕様 |
| `*grammar*` | `guidelines/grammar/` | 文法機能 |
| `*passage*` | `guidelines/passage/` | パッセージ機能 |

---

## 設定

### DocumentGuard を無効化

Servant 全体を無効化することで、DocumentGuard も無効化されます:

```json
{
  "servant.enable": false
}
```

### 監視対象から除外

`docs/private/` 配下は自動的に除外されます（git ignore 対象のため）。

---

## 技術的な詳細

### 実装

- **ファイル監視**: `vscode.workspace.createFileSystemWatcher` を使用
- **Front Matter 解析**: YAML Front Matter の有無を正規表現でチェック
- **自動挿入**: `vscode.WorkspaceEdit` を使用してファイル内容を編集
- **ファイル移動**: `vscode.WorkspaceEdit.renameFile` を使用

### パフォーマンス

- 新規ファイル作成時のみ動作（既存ファイルの編集には反応しない）
- 500ms の遅延を入れてファイル書き込み完了を待つ
- private/ 配下は早期リターンで無視

### 連携

- **GitHub Copilot Chat**: ルール違反時に Copilot Chat と連携して修正提案を行う（将来実装予定）
- **INDEX.md 自動生成**: `npm run generate-index` との連携（Front Matter 追加後に自動実行を推奨）

---

## トラブルシューティング

### Q: 通知が表示されない

**A**: Servant が有効か確認してください:
```
ステータスバー → "🛡️ Servant" が表示されているか確認
```

### Q: Front Matter が追加されない

**A**: ファイルが既に開かれている場合、再読み込みが必要な場合があります。ファイルを閉じてから再度開いてください。

### Q: 推奨ディレクトリが正しくない

**A**: ファイル名を変更するか、手動で移動してください。ルールは [DOCUMENTATION_OPERATIONS.md](../../../docs/DOCUMENTATION_OPERATIONS.md) に記載されています。

---

## 関連ドキュメント

- [docs/DOCUMENTATION_OPERATIONS.md](../../../docs/DOCUMENTATION_OPERATIONS.md) - ドキュメント運用ルール
- [docs/DOCUMENTATION_ORGANIZATION_PLAN.md](../../../docs/DOCUMENTATION_ORGANIZATION_PLAN.md) - 整理計画
- [scripts/generate-docs-index.ts](../../../scripts/generate-docs-index.ts) - INDEX.md 自動生成

---

**作成日**: 2026-01-09  
**バージョン**: 0.3.29（次回リリース予定）
