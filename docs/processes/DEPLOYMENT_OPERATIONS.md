---
canonical: docs/processes/DEPLOYMENT_OPERATIONS.md
status: stable
lastUpdated: 2025-12-19
diataxisCategory: how-to
references:
  - .aitk/instructions/security-best-practices.instructions.md
  - README.md
  - docs/processes/STUDENT_DEPLOYMENT_GUIDE.md
---

# 🚀 デプロイメント運用ガイド

**開発者・運用者向け** - 生徒が学習を中断しないデプロイメント手順

---

## 📋 デプロイメント前チェックリスト

### 1. 品質確認（本番デプロイ前日）

```bash
# 現在の状態確認
git status                    # クリーンな状態か
npm run typecheck            # 型エラー: 0
npm run lint:errors-only     # Lint エラー: 0
npm run build                # ビルド成功

# テスト実行
npm test                     # 全テスト PASS
```

### 2. 変更内容の確認

```bash
# mainブランチとの差分確認
git log --oneline main..HEAD

# 変更ファイル確認
git diff --stat main

# 変更内容レビュー（慎重に）
git diff main
```

### 3. ステージング環境での確認

- [ ] ローカル開発サーバーで動作確認: `npm run dev`
- [ ] Service Worker が正常に登録されているか（DevTools → Application → Service Workers）
- [ ] キャッシュバスティングが機能しているか（DevTools → Network）
- [ ] オフラインでも基本機能が動作するか

---

## 🔄 デプロイメント手順

### ステップ1: PRを作成

```bash
git checkout -b deploy/production-YYYYMMDD

# 変更をコミット（既にコミット済みならスキップ）
git commit -m "feat/fix: ..."

# リモートにプッシュ
git push origin deploy/production-YYYYMMDD
```

### ステップ2: GitHub で PR を作成

1. **GitHub** → **Pull Requests** → **New Pull Request**
1. `main` ← `deploy/production-YYYYMMDD` で PR 作成
1. PR Description に以下を記載:

```markdown
## 📝 変更概要
- [何を変更したか簡潔に]

## ✅ テスト確認
- [ ] ローカルビルド成功
- [ ] npm run typecheck パス
- [ ] npm run lint:errors-only パス
- [ ] npm run test 成功
- [ ] ステージング環境で動作確認

## 📊 影響範囲
- [変更ファイル数]
- [影響を受けるコンポーネント]

## 🔐 セキュリティ確認
- [ ] 秘密情報が含まれていない
- [ ] 個人情報の露出なし
- [ ] 依存関係の脆弱性がない

## 📋 デプロイメント注意事項
- [本番デプロイ時に注意すべき点]
```

### ステップ3: GitHub Actions で自動テスト

PR 作成後、自動的に以下が実行されます：

```
✓ Quality Check
  - TypeScript typecheck
  - ESLint
  - Build verification
  - Refactoring Safety Check (src/ integrity, file count, etc.)

→ 全て PASS したら、マージ可能
```

### ステップ4: PR をレビュー

1. **コード品質の確認**
   - 型安全性: TypeScript型チェック PASS
   - リント: ESLint PASS
   - テスト: テストスイート PASS

1. **リファクタリング安全性の確認**
   - src/ファイル数: 100+ 保持
   - 大量削除: なし（5ファイル以上の削除がないか）
   - 重要ファイル: 削除されていないか
   - ビルド: 成功

1. **本番デプロイ影響の確認**
   - 生徒学習への影響: なし
   - セッション継続性: 確保
   - ロールバック可能性: 確認

### ステップ5: main にマージ

```bash
# GitHub UI から "Merge pull request"
# または コマンドラインから

git checkout main
git merge deploy/production-YYYYMMDD
git push origin main
```

### ステップ6: GitHub Actions の自動デプロイ

`main` ブランチへのpush で、自動的に以下が実行：

```
🔄 Quality Check
  - すべての品質確認再実行

📦 Build & Upload to Staging
  - dist ディレクトリをビルド
  - ステージング環境にアップロード
  - health check 実行

⏸️  Approval Gate (手動)
  - 本番デプロイに進む前に、手動承認待機
  - ステージング環境で最終確認

🚀 Production Deployment
  - GitHub Pages に本番デプロイ
  - サービスワーカーのキャッシュ無効化
  - デプロイ完了通知
  - リリースタグ自動生成

✅ Post-Deployment Check
  - 本番環境の health check
  - ロールバック手順の確認
```

---

## 🚨 問題が発生した場合（ロールバック）

### シナリオ1: 本番デプロイ直後に問題発見

**最速対応: 3-5分で前バージョンに戻す**

```bash
# 直前のタグを確認
git tag | grep "^v20" | sort | tail -5

# 例: v20251211-140000 に戻す
git reset --hard v20251211-140000

# リモートに強制プッシュ
git push -f origin main
```

→ 5-10分後に本番環境が自動更新される

### シナリオ2: デプロイ完了後（数時間後）に問題発見

**原因特定が必要**

```bash
# デプロイ後のコミットを確認
git log --oneline -5

# 問題の原因を特定
git diff <previous-tag> <current-tag>

# 原因が特定できたら修正コミット
git revert <problematic-commit>
git push origin main
```

→ 修正版が自動デプロイされます

### シナリオ3: 多くの生徒に影響が出ている場合

**緊急対応フロー**

1. **即座に前バージョンに戻す** (上記 Scenario 1 参照)
1. **生徒への通知** (オプション)
   - 学習コンテンツを通じて「メンテナンス中」と案内
   - または、静かに復旧（生徒側の影響が小さい場合）
1. **原因分析**
   - ローカル環境で再現
   - エラーログ確認
   - 修正実装
1. **修正版の本番デプロイ**
   - ステージング環境で十分テスト
   - 修正版をmainにマージ
   - 自動デプロイ実行

---

## 📊 デプロイメント監視

### リアルタイム監視

```bash
# デプロイ中のログを確認
# GitHub Actions → Workflows → Safe Deployment で確認

# または、コマンドラインから
gh run list --workflow=safe-deployment.yml --limit=10
```

### 生徒への影響確認（デプロイ直後）

- 🔍 **ブラウザのDevTools で確認**
  - Network タブ: index.html が `no-cache` で取得されているか
  - Application タブ: Service Worker が最新版で登録されているか
  - Console: エラーが出ていないか

- 📱 **モバイルデバイスで確認**
  - Safari、Chrome で正常に動作するか
  - オフラインモードでも基本機能が使えるか

---

## 🔐 セキュリティ確認

### 毎回のデプロイ前

```bash
# 秘密情報が含まれていないか確認
git diff HEAD~1 | grep -i "password\|secret\|api_key\|token"

# 環境変数の確認
cat .env.production.example  # テンプレート（公開OK）
cat .env.production          # 実環境（絶対に公開NG）
```

### GitHub Secrets の確認

GitHub リポジトリ → Settings → Secrets

必須の Secrets:
- [ ] `VITE_SENTRY_DSN` (エラートラッキング)
- [ ] その他、本番環境変数

---

## 📈 デプロイメント統計

### 月次レポート例

```markdown
## 2025年12月 デプロイメント統計

### デプロイ数
- 本番デプロイ: 5回
- ステージング検証: 5回
- ロールバック: 0回

### 平均デプロイ時間
- 品質チェック: 2分
- ステージング検証: 3分
- 本番デプロイ: 5分
- 合計: 10分

### 問題検出
- デプロイ前: 2件 (修正で対応)
- デプロイ後: 0件

### 生徒への影響
- セッション中断: 0件
- データ損失: 0件
- ネットワークエラー: 0件
```

---

## 📚 参考リソース

### ドキュメント
- [REFACTORING_SAFETY.md](./REFACTORING_SAFETY.md) - リファクタリング安全ガイド
- [STUDENT_DEPLOYMENT_GUIDE.md](./STUDENT_DEPLOYMENT_GUIDE.md) - 生徒向けガイド
- [EMERGENCY_RECOVERY.md](./EMERGENCY_RECOVERY.md) - 緊急復旧手順

### GitHub Actions ワークフロー
- `.github/workflows/safe-deployment.yml` - 本番デプロイメント
- `.github/workflows/refactoring-safety-check.yml` - リファクタリング安全チェック

### Service Worker & セッション管理
- `public/sw.js` - Service Worker
- `src/utils/sessionManager.ts` - セッション自動保存
- `src/components/UpdateNotification.tsx` - アップデート通知UI

---

## ✅ チェックリスト（デプロイ後）

デプロイメント完了後、以下を確認してください：

- [ ] GitHub Actions デプロイが成功 (緑チェック)
- [ ] 本番環境 (`https://nanashi8.github.io`) にアクセス可能
- [ ] キャッシュバスティングが機能 (DevTools → Network)
- [ ] Service Worker が登録済み (DevTools → Application)
- [ ] オフラインモードで基本機能が使える
- [ ] 複数デバイス・ブラウザで動作確認
- [ ] 生徒からのフィードバック: なし (または前向きなもののみ)

---

**安全で信頼できるデプロイメントを心がけましょう！** 🎯
