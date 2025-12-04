# Git リベース vs マージ 完全ガイド

## 📋 目次

1. [基本概念](#基本概念)
2. [リベース（Rebase）とは](#リベースrebaseとは)
3. [マージ（Merge）とは](#マージmergeとは)
4. [実践例: 分岐したブランチの統合](#実践例-分岐したブランチの統合)
5. [コマンド比較表](#コマンド比較表)
6. [使い分けガイド](#使い分けガイド)
7. [トラブルシューティング](#トラブルシューティング)

---

## 基本概念

### Gitのコミット履歴とは

```
A --- B --- C --- D
↑     ↑     ↑     ↑
1つ目 2つ目 3つ目 4つ目のコミット
```

各コミットは:
- 変更内容のスナップショット
- 親コミットへの参照
- コミットメッセージ
- 作成者、日時などのメタデータ

を持ちます。

### ブランチの分岐が発生する状況

```
【初期状態】デスクトップとスマホが同じ状態
A --- B --- C
            ↑
        両方ここ

【作業開始】
デスクトップ: ファイルを編集中...
スマホ:       READMEを修正してコミット＆プッシュ

【結果】分岐が発生
         origin/main (リモート)
              ↓
A --- B --- C --- D (スマホの変更)
              ↓
              E (デスクトップの変更)
              ↑
           HEAD (ローカル)

この状態を "diverged" (分岐した) と呼びます
```

---

## リベース（Rebase）とは

### 概念図

```
【実行前】
origin/main
    ↓
A --- B --- C --- D    (リモート: スマホでREADME修正)
              ↓
              E        (ローカル: 機能追加)
              ↑
           HEAD

【git pull --rebase origin main 実行】

ステップ1: ローカルのコミットEを一時退避
A --- B --- C --- D
              ↑
        ここまで巻き戻す

ステップ2: リモートの変更を取り込む
A --- B --- C --- D
                  ↑
              最新の状態

ステップ3: 退避したコミットEをDの上に再適用
A --- B --- C --- D --- E'
                        ↑
                      HEAD
                   (E'はEの内容だが新しいコミット)

【実行後】
origin/main と HEAD が一直線！
    ↓            ↓
A --- B --- C --- D --- E'

グラフに分岐なし ✅
```

### リベースの特徴

**メリット:**
- ✅ 履歴が一直線で読みやすい
- ✅ グラフが綺麗（分岐なし）
- ✅ プロジェクトの進行が時系列で明確
- ✅ `git log` がシンプル

**デメリット:**
- ⚠️ コミットIDが変わる（E → E'）
- ⚠️ すでにプッシュしたコミットをリベースすると問題が発生する可能性
- ⚠️ コンフリクト解決が複雑になる場合がある

**適用場面:**
- 個人開発
- ローカルのコミットをまだプッシュしていない時
- チームでリベースを標準としている場合

---

## マージ（Merge）とは

### 概念図

```
【実行前】
origin/main
    ↓
A --- B --- C --- D    (リモート: スマホでREADME修正)
              ↓
              E        (ローカル: 機能追加)
              ↑
           HEAD

【git pull origin main または git merge origin/main 実行】

ステップ1: リモートの変更を取得
A --- B --- C --- D    (origin/main)
              ↓
              E        (HEAD)

ステップ2: 両方の変更を統合する「マージコミット」を作成
A --- B --- C --- D ------
              ↓          ↘
              E --------- M  (マージコミット)
                          ↑
                        HEAD

【実行後】
origin/main        HEAD
    ↓               ↓
A --- B --- C --- D ---
              ↓        ↘
              E ------- M

グラフが二股に分かれている 🔀
```

### マージコミット（M）の特徴

```
コミット M の情報:
- 親コミット1: D (リモートの最新)
- 親コミット2: E (ローカルの最新)
- メッセージ: "Merge branch 'main' of https://..."
- 変更内容: DとEの統合
```

### マージの特徴

**メリット:**
- ✅ コミット履歴が改変されない（EはEのまま）
- ✅ 誰が何をいつ変更したかが正確に記録される
- ✅ 複数人での開発で安全
- ✅ コンフリクト解決が分かりやすい

**デメリット:**
- ❌ グラフが複雑になる（分岐が増える）
- ❌ `git log` が読みにくくなる
- ❌ マージコミットが増える

**適用場面:**
- チーム開発
- 公開リポジトリ
- すでにプッシュしたコミットを統合する時
- フィーチャーブランチを統合する時

---

## 実践例: 分岐したブランチの統合

### シナリオ

```
状況:
- スマホでREADME.mdを修正してプッシュ (2コミット)
- デスクトップで機能追加作業 (1コミット)
- git status で "diverged" エラー

分岐状態:
A --- B --- C --- D1 --- D2    (origin/main: スマホの変更)
              ↓
              E                (HEAD: デスクトップの変更)
```

### 方法1: リベース（推奨: 個人開発）

```bash
# ステップ1: 変更を全てステージング
git add -A

# ステップ2: コミット作成
git commit -m "feat: 機能追加"

# ステップ3: リベース実行
git pull --rebase origin main

# ステップ4: プッシュ
git push origin main
```

**結果:**
```
A --- B --- C --- D1 --- D2 --- E'
                                ↑
                           origin/main
                              HEAD

履歴が一直線 ✨
```

**トラブル時の対処:**

```bash
# コンフリクトが発生した場合
# 1. ファイルを手動で修正
# 2. 修正をステージング
git add <修正したファイル>

# 3. リベース続行
git rebase --continue

# 4. リベースを中止したい場合
git rebase --abort  # 元の状態に戻る
```

### 方法2: マージ

```bash
# ステップ1: 変更を全てステージング
git add -A

# ステップ2: コミット作成
git commit -m "feat: 機能追加"

# ステップ3: マージ実行
git pull origin main
# または
git fetch origin
git merge origin/main

# ステップ4: プッシュ
git push origin main
```

**結果:**
```
A --- B --- C --- D1 --- D2 ------
              ↓                   ↘
              E ------------------ M
                                   ↑
                              origin/main
                                 HEAD

履歴に分岐が残る 🔀
```

---

## コマンド比較表

| 操作 | リベース | マージ |
|------|----------|--------|
| **基本コマンド** | `git pull --rebase origin main` | `git pull origin main` |
| **2ステップ版** | `git fetch origin`<br>`git rebase origin/main` | `git fetch origin`<br>`git merge origin/main` |
| **履歴の形** | 一直線 | 分岐 |
| **コミットID** | 変わる（E→E'） | 変わらない（Eのまま） |
| **追加コミット** | なし | マージコミットM |
| **グラフの見た目** | `*` のみ | `* \\ /` |
| **コンフリクト時** | `git rebase --continue`<br>`git rebase --abort` | `git merge --continue`<br>`git merge --abort` |

---

## 使い分けガイド

### 🎯 リベースを使うべき状況

```
✅ ローカルでの作業をまだプッシュしていない
✅ 個人開発・個人ブランチ
✅ フィーチャーブランチを最新のmainに追従させたい
✅ 綺麗な履歴を保ちたい
✅ チームがリベースを標準としている

例:
git checkout feature-branch
git pull --rebase origin main  # mainの最新を取り込む
git push origin feature-branch
```

### 🎯 マージを使うべき状況

```
✅ すでにプッシュしたコミットを統合する
✅ チーム開発・公開リポジトリ
✅ フィーチャーブランチをmainに統合
✅ 誰が何をしたか正確に記録したい
✅ 複数人が同じブランチで作業している

例:
git checkout main
git merge feature-branch  # フィーチャーブランチを統合
git push origin main
```

### 判断フローチャート

```
コミットをまだプッシュしていない？
    ↓ YES
個人開発またはチームでリベース推奨？
    ↓ YES
【リベースを使用】
git pull --rebase origin main

    ↓ NO (上記いずれか)
【マージを使用】
git pull origin main
```

---

## トラブルシューティング

### Q1: リベース中にコンフリクトが発生

```bash
# 状況
Auto-merging src/components/App.tsx
CONFLICT (content): Merge conflict in src/components/App.tsx
error: could not apply abc1234... feat: 新機能追加

# 解決手順
# 1. コンフリクトファイルを開く
<<<<<<< HEAD
// リモートの変更
const value = 100;
=======
// あなたの変更
const value = 200;
>>>>>>> abc1234 (feat: 新機能追加)

# 2. 正しい内容に修正
const value = 200; // あなたの変更を採用

# 3. ステージング
git add src/components/App.tsx

# 4. リベース続行
git rebase --continue

# 5. 中止したい場合
git rebase --abort
```

### Q2: すでにプッシュしたコミットをリベースしてしまった

```bash
# 状況: リベース後にプッシュできない
! [rejected] main -> main (non-fast-forward)

# ⚠️ 危険: force pushは他の人の作業を壊す可能性がある
# 個人開発の場合のみ
git push --force origin main

# 🔧 より安全な方法: force-with-lease
# 他の人がプッシュしていたら失敗する
git push --force-with-lease origin main

# 推奨: チーム開発ではマージに切り替える
git rebase --abort
git pull origin main  # マージで統合
git push origin main
```

### Q3: リベースをやり直したい

```bash
# 直前のリベースを取り消す
git reflog  # 履歴を確認
# 例: abc1234 HEAD@{1}: rebase finished
git reset --hard HEAD@{1}  # リベース前に戻る
```

### Q4: "diverged" エラーが出る

```
Your branch and 'origin/main' have diverged,
and have 1 and 2 different commits each, respectively.
```

**意味**: ローカルに1コミット、リモートに2コミットあり、分岐している

**解決策:**

```bash
# 方法1: リベース（履歴を一直線に）
git pull --rebase origin main

# 方法2: マージ（分岐を残す）
git pull origin main

# 方法3: ローカルを破棄してリモートに合わせる
git fetch origin
git reset --hard origin/main  # ⚠️ ローカルの変更が消える
```

---

## 実際のワークフロー例

### 個人開発（リベース推奨）

```bash
# 朝: 作業開始
git pull --rebase origin main

# 作業中: こまめにコミット
git add .
git commit -m "feat: 機能A追加"
git add .
git commit -m "fix: バグ修正"

# 昼: リモートの最新を取り込む
git pull --rebase origin main

# 夕方: プッシュ
git push origin main

# 結果: 一直線の綺麗な履歴
A --- B --- C --- D --- E --- F
```

### チーム開発（マージ推奨）

```bash
# フィーチャーブランチで作業
git checkout -b feature/new-ui
git commit -m "feat: 新UI追加"
git push origin feature/new-ui

# プルリクエスト作成
# レビュー → 承認

# mainブランチに統合（GitHub上でマージ）
# または
git checkout main
git pull origin main
git merge feature/new-ui
git push origin main

# 結果: 分岐した履歴（どのPRで何が入ったか明確）
A --- B --- C ------- E (main)
       ↓           ↗
       D ---------    (feature/new-ui)
```

---

## まとめ

### リベース（Rebase）

```
📊 履歴の形:  A --- B --- C --- D --- E  (一直線)
🎯 目的:      綺麗な履歴を保つ
✅ 使用場面:  個人開発、ローカルのコミット
⚠️  注意点:   コミットIDが変わる
```

### マージ（Merge）

```
📊 履歴の形:  A --- B --- C --- D ---
                   ↓             ↘
                   E ----------- M  (分岐)
🎯 目的:      正確な履歴を保つ
✅ 使用場面:  チーム開発、公開リポジトリ
⚠️  注意点:   グラフが複雑になる
```

### 推奨ルール

1. **個人開発**: リベースで履歴を綺麗に保つ
2. **チーム開発**: マージで安全に統合
3. **迷ったら**: マージを使う（安全）
4. **プッシュ後**: リベースは避ける

---

*最終更新: 2025年11月29日*
