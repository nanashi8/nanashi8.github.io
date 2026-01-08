# エラー発生防止ガイド

## 概要

VS Code問題パネルのエラーを防止し、開発体験を向上させるための対策をまとめています。

## 実施済み対策

### 1. Pythonパッケージ不足の防止

**問題**: `reportlab`などのパッケージが未インストールの場合、インポートエラーが発生

**対策**:

- すべての依存パッケージを`requirements.txt`に明記
- 新しいスクリプトを追加する際は、使用するパッケージを必ず`requirements.txt`に追加
- 定期的に`pip install -r requirements.txt`を実行して同期

**確認方法**:

```bash
cd nanashi8.github.io
pip install -r requirements.txt
```

### 2. GitHub Actions検証エラーの抑制

**問題**: ネットワーク接続の問題でGitHub Actionsの定義が取得できず、31件のエラーが表示

**対策**:

- `.vscode/settings.json`でYAML検証を無効化
- GitHub Actionsのワークフローは実際のCI/CD環境で検証

**設定内容**:

```json
{
  "yaml.validate": false,
  "yaml.customTags": ["!reference sequence"]
}
```

## 再発防止チェックリスト

### 新しいPythonスクリプトを追加する場合

- [ ] 使用するすべてのパッケージを`requirements.txt`に追加
- [ ] `pip install -r requirements.txt`で動作確認
- [ ] VS Code問題パネルでエラーがないことを確認

### 新しいGitHub Actionsワークフローを追加する場合

- [ ] ローカルでは`yaml.validate: false`のため、エディタエラーは無視
- [ ] GitHubにpush後、Actions画面で実際の動作を確認
- [ ] エラーが出た場合は、GitHub Actions画面のログで詳細を確認

### 定期メンテナンス

- [ ] 月次: `pip list --outdated`でパッケージ更新を確認
- [ ] 月次: GitHub Actionsの実行ログを確認
- [ ] 月次: VS Code問題パネルで新しいエラーがないか確認

## サーバント連携

このガイドの対策は、pre-commitフック（サーバント）と連携しています：

- **ai-guard**: 型チェック・リント・ビルドを自動実行
- **品質ガード**: ファイルサイズ・複雑度・危険パターンをチェック
- **効率化ガード**: 対症療法パターン・重複コードを検出

エラーが発生した場合、サーバントが自動的に検出してコミットをブロックします。

## トラブルシューティング

### VS Code問題パネルに大量のエラーが表示される

1. エラーの種類を確認
   - Python importエラー → `pip install -r requirements.txt`
   - GitHub Actionsエラー → 無視（設定で無効化済み）
   - TypeScriptエラー → `npm run typecheck`で詳細確認

2. VS Codeをリロード

   ```
   Cmd+Shift+P → Developer: Reload Window
   ```

3. それでも解消しない場合は、このガイドの対策を再実施

## 関連ドキュメント

- [品質保証システム](../quality/QUALITY_SYSTEM.md)
- [AI統合ガイド](../AI_INTEGRATION_GUIDE.md)
- [開発ガイドライン](.aitk/instructions/development-guidelines.instructions.md)
