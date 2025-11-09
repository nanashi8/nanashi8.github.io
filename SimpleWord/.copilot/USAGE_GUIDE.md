# 非推奨構文対策ガイド

このドキュメントは、プロジェクトで非推奨構文を防ぐために実装された対策の使用方法を説明します。

---

## 📋 実装された対策一覧

### 1. ドキュメント（`.copilot/`）
- **`deprecated-patterns.md`**: 非推奨パターンの詳細リスト
- **`quick-ref.md`**: 実装時の即座な参照用（非推奨セクション追加済み）
- **`prompts/code-review.md`**: コードレビュー手順

### 2. 自動チェックツール
- **`.swiftlint.yml`**: SwiftLintによる静的解析
- **`.git/hooks/pre-commit`**: コミット前の自動チェック
- **`.github/workflows/code-quality.yml`**: CI/CDでの自動チェック

---

## 🔍 使用方法

### エラー修正時（最優先）
1. **`docs/ERROR_RESOLUTION_PROTOCOL.md`** を確認
2. 標準手順に従ってエラーを解決
3. 修正後の検証を必ず実行

### よくあるエラーの自動チェック
```bash
# 全ファイルをチェック
./.copilot/scripts/check_common_errors.sh

# 特定のファイルをチェック
./.copilot/scripts/check_common_errors.sh SimpleWord/Views/ContentView.swift
```

詳細は `.copilot/scripts/README_CHECK_ERRORS.md` を参照

### コード作成前
1. `.copilot/deprecated-patterns.md` を確認
2. `.copilot/quick-ref.md` でエラーパターンを確認
3. 非推奨パターンを避けてコーディング

### コード作成後
1. 自動エラーチェックを実行：
```bash
./.copilot/scripts/check_common_errors.sh
```

2. SwiftLintを実行：
```bash
swiftlint
```

3. 問題があれば修正

### コミット時
- `pre-commit`フックが自動実行されます
- 問題が見つかった場合、コミットが中断されます
- 修正後、再度コミット

### CI/CD（GitHub Actions）
- プルリクエスト時に自動チェック実行
- 問題があればマージ前に通知

---

## ⚠️ 重要な注意点

### 1. エラー修正は必ずプロトコルに従う
- ビルド成功 ≠ 正常動作
- 必ず実機/シミュレータで動作確認
- CPU/メモリの異常に注意

### 2. よくある落とし穴
- NavigationLinkで環境オブジェクトが継承されない
- `.onReceive`による無限ループ
- 非推奨構文の使用

### 3. 問題が解決しない場合
- 3回以上同じ方法で失敗したら立ち止まる
- `docs/ERROR_RESOLUTION_PROTOCOL.md`を再読
- アプローチを変更

---

## 📚 関連ドキュメント

- **エラー解決**: `docs/ERROR_RESOLUTION_PROTOCOL.md`
- **エラー修正ガイドライン**: `.copilot/ERROR_FIX_GUIDELINES.md`
- **非推奨パターン**: `.copilot/deprecated-patterns.md`
- **クイックリファレンス**: `.copilot/quick-ref.md`
- **改善レポート**: `docs/ERROR_FIX_IMPROVEMENT_REPORT_20251023.md`

---

## 🎯 目標

この対策により、以下を達成します：

1. ✅ 非推奨構文の自動検出
2. ✅ エラーの早期発見
3. ✅ コード品質の維持
4. ✅ 開発効率の向上
5. ✅ 問題の再発防止

---

**このガイドを活用して、クリーンで保守性の高いコードを維持しましょう！**
