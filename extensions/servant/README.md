# Servant

**プロジェクト内に住むAIサーバント - 設計方針を守り、AIの作業を効率化**

## 🎯 コンセプト

Servant は、あなたのプロジェクトに常駐する**知的な執事**です。

### Servant の3つの役割

#### 1. 🛡️ **ガーディアン（守護者）**
`.instructions.md` に記述された設計方針を監視し、リアルタイムでルール違反を検出。コミット前にも自動チェックし、品質を保証します。

#### 2. 🤖 **AIアシスタント（支援者）**（Phase 8-9で実装予定）
プロジェクト構造を解析し、依存関係マップを構築します。
- `.vscode/project-index.json` に構造化データを保存
- ファイル間のインポート関係を抽出
- Git履歴からホットスポット（問題頻発ファイル）を検出

**Note**: AI向けコンテキスト自動提供機能は Phase 8 で実装予定です。

---

## 🚀 主要機能

### Phase 1-6: コア機能（実装済み ✅）

#### リアルタイム検証
コード編集中に `.instructions.md` のルール違反を即座に検出し、Problems パネルに表示。

#### AI-Powered Quick Fix
💡 電球アイコンをクリックするだけで、違反を自動修正。

#### Pre-commit Hook
Git コミット前に自動検証。違反があればコミットをブロック。

#### 高速キャッシング
変更されたファイルのみを検証。**98.7%の検証時間削減**（472ms → 6ms）。

### Phase 7: 適応的学習機能（実装済み ✅）

#### 自動学習サイクル
Servant は、あなたのコーディングパターンから学習します:
- 違反を自動記録（手動検証 or pre-commit 時）
- **15回のサイクルで自動学習**を実行
- 頻発する違反パターンを `.aitk/instructions/` に自動生成
- 重み付けで重要なルールを優先

#### Git 履歴解析
```
Servant: Learn from Git History
→ コミット履歴からパターンを抽出
→ ホットスポット（頻繁に変更されるファイル）を検出
```

#### プロジェクトインデックス
```
Servant: Index Project for AI
→ コードベース全体をインデックス化
→ 依存関係マップを .vscode/project-index.json に保存
```

#### ホットスポット検出
```
Servant: Show Problem Hotspots
→ 頻繁に違反が発生するファイルを検出
→ リスクスコアで優先順位付け
```

**Note**: AI向けコンテキスト自動提供は Phase 8 で実装予定です。現在は手動でインデックスを生成する必要があります。

---

## 📦 インストール

### 方法1: VSIXファイルから（ローカル）

1. VSCode で **Cmd+Shift+P**
2. 「**Extensions: Install from VSIX...**」を選択
3. `servant-0.3.0.vsix` を選択

### 方法2: 開発モード（最も簡単）

```bash
cd extensions/servant
# VSCode で F5 を押す
```

---

## 🎮 使い方

### 基本的な使用

1. **`.instructions.md` ファイルを作成**
   ```markdown
   ---
   description: TypeScript は関数型スタイルで書く
   applyTo: '**/*.ts'
   ---
   
   - 必ずアロー関数を使用すること
   - `function` キーワードは禁止
   ```

2. **コードを編集**
   - ルール違反があれば自動的に赤い波線で表示
   
3. **Quick Fix で修正**
   - 💡 をクリック → 自動修正を適用

### コマンド

#### 基本機能
- **`Servant: Validate Instructions`** - 手動で全体検証
- **`Servant: Install Git Hooks`** - pre-commit hook をインストール
- **`Servant: Validate Before Commit`** - コミット前検証を実行

#### Phase 7 機能（実装済み ✅）
- **`Servant: Learn from Git History`** - Git 履歴から学習（パターン抽出）
- **`Servant: Index Project for AI`** - プロジェクト全体をAI向けにインデックス化
- **`Servant: Show Learning Statistics`** - 学習統計を表示
- **`Servant: Reset Learning Data`** - 学習データをリセット

---

## ⚙️ 設定

### 基本設定

```json
{
  "servant.enable": true,
  "servant.severity": "error"
}
```

### Pre-commit 設定

```json
{
  "servant.preCommit.enabled": true,
  "servant.preCommit.strictMode": false,
  "servant.preCommit.autoFix": false,
  "servant.preCommit.ignorePatterns": ["node_modules", "dist", ".git"]
}
```

### パフォーマンス設定

```json
{
  "servant.performance.enableCache": true,
  "servant.performance.maxCacheSize": 100,
  "servant.performance.enableIncremental": true
}
```

### Phase 7: 学習機能設定

```json
{
  "servant.learning.enabled": true,
  "servant.learning.cycleSize": 15,
  "servant.learning.autoUpdateInstructions": true
}

### 通知設定（"心地良い完璧"）

Servant は通知のノイズを減らすため、既定で `quiet` を採用します（重要な失敗は表示し、その他は Output/Problems 側に寄せます）。

```json
{
  "servant.notifications.mode": "quiet",
  "servant.notifications.cooldownMs": 60000
}
```

詳細な方針: [docs/NOTIFICATION_POLICY.md](docs/NOTIFICATION_POLICY.md)
```

---

## 📊 パフォーマンス

| 指標 | 初回検証 | キャッシュ有効 | 改善率 |
|------|---------|-------------|-------|
| 検証時間 | 472ms | 6ms | **98.7%** |
| メモリ使用量 | 50MB | 52MB | -4% |
| CPU使用率 | 15% | 1% | **93.3%** |

---

## 🛠️ 開発

### テスト実行

```bash
npm test                  # 全テスト実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジ計測
```

### コンパイル

```bash
npm run compile           # 本番ビルド
npm run watch             # 開発ウォッチモード
```

### パッケージング

```bash
npm run package           # VSIX ファイル生成
```

---

## 📝 ライセンス

MIT License - nanashi8

---

## 🗺️ ロードマップ

### ✅ Phase 1-6: コア機能（完了）
- リアルタイム検証
- Quick Fix
- Pre-commit Hook
- キャッシング & 増分検証

### ✅ Phase 7: 適応的学習（完了）
- 違反パターンの自動記録
- 15回サイクルでの自動学習
- Git 履歴解析機能
- プロジェクトインデックス機能
- AI向けコンテキスト収集

### 📅 Phase 8: AI統合強化（計画中）
- vscode.lm API 統合
- チャット統合（@servant）
- ナレッジグラフ可視化
- カスタムルールエンジン

### 📅 Phase 9: Team 機能（計画中）
- Team 設定の同期
- Web ダッシュボード
- 複数 Instructions ファイルのマージ

---

**Servant は、あなたとAIが協力してプロジェクトを成功させるための、最高のパートナーです。**
