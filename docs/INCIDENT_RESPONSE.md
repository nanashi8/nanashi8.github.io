# 🚨 インシデント対応手順書

**最終更新**: 2025年12月11日  
**対象**: セキュリティインシデント、本番デプロイメント障害、データ損失

---

## 📋 目次

1. [緊急対応フロー](#緊急対応フロー)
2. [Scenario 別対応](#scenario-別対応)
3. [ロールバック手順](#ロールバック手順)
4. [事後対応](#事後対応)
5. [連絡先・エスカレーション](#連絡先エスカレーション)

---

## 🚨 緊急対応フロー

```
インシデント検出
    ↓
1. 状況把握（5分以内）
    ↓
2. 初動対応（15分以内）
    ↓
3. 復旧実施（30分以内）
    ↓
4. 検証＆本番確認（10分）
    ↓
5. 事後対応＆報告
```

---

## Scenario 別対応

### Scenario 1: セキュリティ脆弱性検出（CRITICAL/HIGH）

**検出パターン**:
- GitHub Security Alert で脆弱性通知
- npm audit で CRITICAL/HIGH 脆弱性検出
- 本番環境で未パッチの脆弱性が動作中

**対応タイムライン**:

| 時間 | アクション |
|------|-----------|
| 0min | アラート検出 → 修正パッケージ確認 |
| 5min | 修正パッケージで npm audit fix |
| 10min | ローカルビルド＆テスト |
| 15min | GitHub で修正 PR 作成 |
| 20min | GitHub Actions テスト監視 |
| 25min | PR マージ＆本番デプロイ実行 |
| 30min | 本番環境で脆弱性消失を確認 |

**詳細手順**:

```bash
# 1. 脆弱性確認
npm audit
npm audit fix --dry-run  # 何が変わるか確認

# 2. 修正実装
npm audit fix            # 可能な限り自動修正
npm audit fix --force    # 破壊的変更が許容される場合

# 3. テスト
npm run build
npm run typecheck
npm run test

# 4. PR 作成＆マージ
git checkout -b security/fix-vuln-YYYYMMDD
git add package.json package-lock.json
git commit -m "security: fix CRITICAL/HIGH vulnerability in [package-name]

Impact: Patches [CVE-XXXX-XXXXX] in [package-name] v[X.Y.Z]
Severity: CRITICAL/HIGH
Action: Immediate patching required

修正内容:
- npm audit fix で脆弱性パッチ適用
- ローカルビルド＆テスト PASS
- 本番デプロイで脆弱性対策完了"

git push origin security/fix-vuln-YYYYMMDD
```

5. GitHub で PR 作成 → マージ
6. `safe-deployment.yml` が自動実行 → 本番デプロイ

**確認**:

```bash
# 本番環境で脆弱性が解決したか確認
# https://github.com/[owner]/[repo]/security/dependabot

# または、本番環境で npm audit
npm audit  # 脆弱性: 0 を確認
```

---

### Scenario 2: 本番デプロイ直後に機能障害検出

**検出パターン**:
- ユーザー報告: 「○○が動かない」
- ブラウザコンソール: JS エラー出力
- GitHub Actions: post-deployment-check で health check 失敗

**対応タイムライン**:

| 時間 | アクション | 目標 |
|------|-----------|------|
| 0min | 障害検出・確認 | - |
| 2min | ロールバック実行 | 本番環境を前バージョンに戻す |
| 5min | 本番環境動作確認 | ユーザーの影響がなくなったか確認 |
| 10min | 原因分析 | 何が問題だったか特定 |
| 30min | 修正実装＆テスト | ローカルで再現＆修正確認 |
| 45min | 修正版デプロイ | セキュアに本番反映 |

**詳細手順**:

```bash
# 1. 最新のデプロイを確認
git log --oneline -5

# 2. 直前の安定版タグを確認
git tag | grep "^v20" | sort | tail -5
# 例: v20251211-140000（1時間前）

# 3. ロールバック実行（直前の安定版に戻す）
git reset --hard v20251211-140000
git push -f origin main

# 出力例:
# Updated references in refs/heads/main
# Total 0 (delta 0), reused 0 (delta 0), pack-reused 0
```

**注意**: `git push -f`（強制プッシュ）は、GitHub Pages をリセットします。5-10分後に本番環境が自動更新されます。

**確認**:

```bash
# 1. 本番環境を確認（以下の URL にアクセス）
# https://nanashi8.github.io

# 2. DevTools で確認
# - Network: index.html が最新版か確認
# - Console: エラーなし
# - Application: Service Worker が正常に登録

# 3. オフラインモードで動作確認（DevTools）
# - キャッシュされたアセットから正常に動作するか
```

**原因分析**:

```bash
# 1. 問題のあったコミットを確認
git diff v20251211-140000 v20251211-150000

# 2. 問題の部分を特定
# 例: src/components/Button.tsx で未定義変数
grep -n "undefined" src/components/Button.tsx

# 3. 修正を実装
# [修正実装]

# 4. ローカルで再現確認
npm run dev
# ブラウザで動作確認

# 5. テスト
npm run build
npm run test
npm run typecheck
```

**修正版デプロイ**:

```bash
git add -A
git commit -m "fix: resolve [issue] from previous deployment

Issue: [何が問題だったか]
Solution: [どう修正したか]
Testing: [どのようにテストしたか]

Root cause: [根本原因]
Prevention: [今後の予防策]"

git push origin main

# safe-deployment.yml が自動実行
# → ステージング検証 → 本番デプロイ
```

---

### Scenario 3: セッションデータ損失の報告

**検出パターン**:
- 複数生徒報告: 「学習進度がリセットされた」
- ブラウザ dev: sessionStorage/localStorage が空になっている

**対応タイムライン**:

| 時間 | アクション |
|------|-----------|
| 0min | 障害確認＆原因調査 |
| 10min | 影響範囲の特定 |
| 20min | データ復旧手順の開始 |
| 30min | 生徒への対応ガイド提供 |

**確認手順**:

```bash
# 1. Service Worker が正常に動作しているか確認
# DevTools → Application → Service Workers
# 「active and running」が表示されているか

# 2. キャッシュが正常か確認
# DevTools → Application → Cache Storage
# 最新のアセットが保存されているか

# 3. sessionManager.ts が動作しているか確認
# DevTools → Console
# sessionStorage の内容を確認
console.log(sessionStorage.getItem('learningState'))
```

**可能な原因**:

| 原因 | 対応 |
|------|------|
| キャッシュクリア（ユーザー） | sessionStorage は再構築自動保存 |
| Service Worker エラー | 生徒に「キャッシュをクリア」指示 |
| セッション有効期限切れ（1時間） | セッションは仕様通りリセット |
| デプロイ後のキャッシュ問題 | キャッシュバスティング確認 |

**生徒への連絡テンプレート**:

```
【重要】学習データに関する最新情報

申し訳ございません。複数のユーザーから学習進度がリセットされた
との報告をいただきました。

【対処方法】
1. ブラウザを更新（Ctrl+F5 または Cmd+Shift+R）
2. キャッシュをクリア（DevTools → Application → Clear site data）
3. ページを再度開く

【ご確認】
- データは 1時間ごとに自動保存されます
- オフライン時もローカルに保存されます
- サーバー障害はありません

ご質問は...
```

---

### Scenario 4: GitHub Actions ワークフロー失敗

**検出パターン**:
- PR が「All checks have failed」で マージできない
- refactoring-safety-check が失敗
- safe-deployment が途中で止まっている

**対応手順**:

```bash
# 1. GitHub Actions ログを確認
# GitHub → Actions → [ワークフロー名] → Run

# 2. エラーメッセージから原因を特定
# 例: "❌ src/ integrity check failed: Expected 100+, Actual 95"

# 3. 原因に応じた対応
```

**よくあるエラー＆対応**:

| エラー | 原因 | 対応 |
|--------|------|------|
| `src/ integrity check failed` | ファイル削除 | 削除が意図的か確認、チェックポイント更新 |
| `Critical files missing` | App.tsx 削除 | `git reset` でファイル復元 |
| `SimpleWord contamination detected` | iOS ファイル混在 | `.gitignore` に追加して再度 commit |
| `Build output directory not found` | npm run build 失敗 | ローカルで `npm run build` 実行して原因調査 |
| `npm audit: CRITICAL` | 脆弱性検出 | `npm audit fix` を実行 |

**ワークフロー再実行**:

```bash
# 原因を修正した後、ワークフローを再実行
# GitHub → [PR] → "Re-run failed jobs"

# またはコマンドラインから
gh run rerun [run-id]
```

---

## 🔄 ロールバック手順

### 迅速ロールバック（3-5分）

**状況**: 本番デプロイ直後に重大エラー検出

```bash
# 1. 直前の安定版タグを確認
git tag | grep "^v20" | sort | tail -5

# 2. ロールバック実行
git reset --hard v20251211-140000
git push -f origin main

# 3. GitHub Actions 自動実行を監視
# → 5-10分後に本番環境が自動更新
```

**確認**:
- https://nanashi8.github.io にアクセス
- DevTools → Application で Service Worker バージョン確認
- コンソールでエラーがないか確認

---

### 段階的ロールバック（修正版がある場合）

**状況**: 1時間後に問題が判明 → 修正版がある

```bash
# 1. 問題のあったコミットを確認
git log --oneline -5

# 2. 問題コミットを revert
git revert abc1234

# 3. コミットメッセージを編集
# "Fix: Revert problematic feature from abc1234
#  Reason: [issue description]
#  Proper fix: [when will be available]"

# 4. Push
git push origin main
```

**メリット**:
- Git 履歴が保持される
- 何が変わったか追跡可能
- 修正版との diff が明確

---

## 📋 事後対応

### Post-Incident Review（インシデント後 24 時間以内）

```markdown
## インシデント報告書

### 1. インシデント概要
- **タイトル**: [何が起こったか]
- **検出時刻**: 2025-12-11 15:30 JST
- **解決時刻**: 2025-12-11 15:45 JST
- **継続時間**: 15分
- **影響範囲**: [何が影響を受けたか]

### 2. タイムライン
- 15:30 - ユーザー報告で障害検出
- 15:32 - ロールバック実行開始
- 15:35 - 本番環境確認開始
- 15:38 - ロールバック完了＆確認
- 15:45 - 全機能復旧

### 3. 根本原因
[何が根本原因だったか]

### 4. 修正内容
[どう修正したか、PR#]

### 5. 予防策
[今後どう防ぐか]
- Pre-deployment testing の強化
- Staging 環境での smoke test 追加
- 等

### 6. Action Items
- [ ] [対応項目 1]
- [ ] [対応項目 2]
- [ ] [対応項目 3]
```

### Lessons Learned

全スタッフで共有:

```bash
# GitHub Issues で振り返り
# → label: "incident" "postmortem"

# または、議事録として docs/ に保存
docs/incidents/2025-12-11-session-loss.md
```

---

## 📞 連絡先・エスカレーション

### 緊急時の連絡先

| 対象 | 連絡方法 | 優先度 |
|------|--------|--------|
| 開発チーム | Slack #dev-alerts | 即座 |
| 運用チーム | Email ops@... | 即座 |
| 学校管理者 | Phone 050-... | P1 |
| ユーザー | In-app notification | 状況に応じて |

### エスカレーション条件

| 条件 | レベル | 対応 |
|------|--------|------|
| 5分以上本番ダウン | P1 | 全員対応 |
| セキュリティ脆弱性（CRITICAL） | P1 | 即座対応 |
| 複数ユーザー報告 | P2 | 1時間内対応 |
| 単一ユーザー影響 | P3 | 営業時間内対応 |

---

## ✅ チェックリスト

### インシデント対応中

- [ ] 状況を正確に把握（スクリーンショット、エラーログ）
- [ ] Slack #incidents で情報共有開始
- [ ] 影響範囲を特定
- [ ] 必要に応じてロールバック実行
- [ ] 本番環境で復旧確認

### インシデント後

- [ ] 事象のまとめを作成（日本語）
- [ ] 根本原因を特定
- [ ] 修正版をデプロイ
- [ ] Post-Incident Review 実施（24時間以内）
- [ ] Action Items を実行

---

**安全で信頼できる運用を心がけましょう！** 🎯
