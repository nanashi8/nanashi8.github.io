# ファイル配置規約

**作成日**: 2025年11月7日  
**目的**: プロジェクトルートの整理整頓とファイル管理の明確化

---

## 📁 基本原則

### ✅ ルート直下に配置して良いファイル

以下のファイル**のみ**をプロジェクトルートに配置可能：

```
quiz-app/
├── README.md                    # プロジェクトの概要・使い方
├── CHANGELOG.md                 # バージョン履歴
├── LICENSE                      # ライセンスファイル
└── .gitignore                   # Git除外設定
```

### ❌ ルート直下に配置してはいけないファイル

- ログファイル（`*.log`）
- 実装レポート（`*_REPORT.md`等）
- ガイドドキュメント（`*_GUIDE.md`）
- テスト出力ファイル
- 一時ファイル（`*.tmp`, `*.temp`）
- バックアップファイル（`*.backup`, `*_V2.md`等）

---

## 📂 ファイル種類別の配置場所

### 1. ドキュメントファイル（.md）

#### ガイド・チュートリアル
**配置先**: `docs/03_開発ガイド/`

**例**:
- `ADAPTIVE_LEARNING_GUIDE.md` → `docs/03_開発ガイド/`
- `TEST_GUIDE.md` → `docs/03_開発ガイド/`
- `XCODE_FOLDER_SETUP_GUIDE.md` → `docs/03_開発ガイド/`

#### 実装レポート・設計書
**配置先**: `docs/04_レポート/`

**例**:
- `CSV_FIXED_COLUMN_CHOICE_GENERATION_REPORT.md` → `docs/04_レポート/`
- `FEATURE_IMPLEMENTATION_SUMMARY.md` → `docs/04_レポート/`

#### 仕様書
**配置先**: `docs/01_仕様書/`

#### 実装ガイド
**配置先**: `docs/02_実装ガイド/`

#### アーカイブ（古いドキュメント）
**配置先**: `docs/99_アーカイブ/`

**例**:
- `README_V2.md` → `docs/99_アーカイブ/`
- `README_RECOVERED.md` → `docs/99_アーカイブ/`

---

### 2. ログファイル（.log）

**配置先**: `logs/`（Git管理外）

**重要**: ログファイルは`.gitignore`に追加し、リポジトリにコミットしない

**例**:
```
logs/
├── .gitkeep                     # フォルダ構造のみGit管理
├── CSV_ANALYSIS_OUTPUT.log
├── CSV_TEST_OUTPUT.log
├── debug.log
└── error.log
```

---

### 3. 一時ファイル

**配置先**: `tmp/`（Git管理外）

**例**:
```
tmp/
├── .gitkeep
├── temp_data.json
└── scratch.txt
```

---

### 4. スクリプト・ツール

**配置先**: `Tools/`（既存）

**例**:
- Python/Swiftスクリプト
- CSV処理ツール
- ユーティリティ

---

### 5. CSVデータファイル

**配置先**: 
- **アプリリソース**: `SimpleWord/Resources/`
- **テンプレート**: `Resources/`（ルート直下のResourcesフォルダ）

---

## 🚫 .gitignore設定

以下のファイル・フォルダは**必ず**`.gitignore`に追加：

```gitignore
# ログファイル
*.log
logs/
!logs/.gitkeep

# 一時ファイル
tmp/
*.tmp
*.temp
*.swp
*~

# macOS
.DS_Store
.AppleDouble
.LSOverride

# Xcode
*.xcuserstate
*.xcworkspace/xcuserdata/
DerivedData/

# ビルド成果物
*.ipa
*.app
*.dSYM.zip
*.dSYM
```

---

## 📝 新規ファイル作成時のチェックリスト

ファイルを作成する前に、以下を確認：

- [ ] このファイルはルート直下に置くべきか？
- [ ] ログファイルなら`logs/`に配置したか？
- [ ] ドキュメントなら適切な`docs/`サブフォルダに配置したか？
- [ ] 一時ファイルなら`tmp/`に配置したか？
- [ ] `.gitignore`に追加すべきファイルか？

---

## 🔄 定期メンテナンス

### 週次
```bash
# 未追跡ファイルの確認
git status --short

# 不要な一時ファイルの削除（確認）
git clean -n

# ログファイルのローテーション（必要に応じて）
rm logs/*.log
```

### 月次
```bash
# 古いアーカイブの整理
# docs/99_アーカイブ/内の不要ファイルを削除
```

---

## 🤖 AI（GitHub Copilot）への指示

**Copilotにファイルを作成させる場合**、以下を明示：

❌ 悪い例:
```
「実装レポートを作成して」
→ ルート直下に作成される可能性
```

✅ 良い例:
```
「実装レポートをdocs/04_レポート/に作成して」
→ 正しい場所に作成される
```

**この規約は`.github/copilot-instructions.md`にも記載されています。**

---

## 📊 現在のフォルダ構造

```
quiz-app/
├── README.md                               ✅ ルート直下OK
├── CHANGELOG.md                            ✅ ルート直下OK
├── docs/
│   ├── 00_INDEX.md
│   ├── 01_仕様書/
│   ├── 02_実装ガイド/
│   ├── 03_開発ガイド/                     📚 ガイド類
│   ├── 04_レポート/                       📝 レポート類
│   └── 99_アーカイブ/                     🗄️ 古いドキュメント
├── logs/                                   🚫 Git管理外
│   └── .gitkeep
├── tmp/                                    🚫 Git管理外
│   └── .gitkeep
├── Resources/                              📊 CSVテンプレート
├── SimpleWord/                             📱 アプリコード
├── Tools/                                  🔧 スクリプト
└── 参考資料/                               📚 参考資料
```

---

## 🎯 まとめ

### 守るべき3つのルール

1. **ルート直下はREADME.md、CHANGELOG.mdのみ**
2. **ログファイルは必ずlogs/に配置し、.gitignoreで除外**
3. **新規ドキュメントは必ずdocs/配下の適切なフォルダに配置**

この規約に従うことで、プロジェクトルートが常に整理された状態を保てます。

---

**質問・提案がある場合は、GitHub Issueまたはプルリクエストで議論してください。**
