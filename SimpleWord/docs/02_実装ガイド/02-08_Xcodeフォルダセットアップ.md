# Xcodeプロジェクトでのフォルダ整理手順

## 📋 概要
CSV リファクタリングで作成したファイルをXcodeプロジェクト内で適切なグループに整理する手順です。

## ⚠️ 重要な注意事項
- **必ずXcode上で操作してください**（Finderで移動しないこと）
- 操作前にGitコミットまたはバックアップを推奨
- グループの作成順序を守ってください

## 📁 目標のフォルダ構造

```
SimpleWord (Project Root)
├── Common/                          ← 新規作成
│   ├── Data/                        ← 新規作成
│   │   ├── DataSource/              ← 新規作成
│   │   │   ├── DataSourceProtocol.swift
│   │   │   ├── CSVDataSource.swift
│   │   │   └── DataSourceFactory.swift
│   │   ├── Parser/                  ← 新規作成
│   │   │   ├── Parser.swift
│   │   │   └── QuestionItemParser.swift
│   │   ├── Repository/              ← 新規作成
│   │   │   ├── RepositoryProtocol.swift
│   │   │   └── QuestionItemRepository.swift
│   │   ├── Schema/                  ← 新規作成
│   │   │   └── QuestionItemCSVSchema.swift
│   │   └── Legacy/                  ← 新規作成
│   │       ├── LegacyCSVLoaderAdapter.swift
│   │       └── LegacyCSVQuestionLoaderAdapter.swift
│   ├── Extensions/                  ← 新規作成
│   │   └── Result+Extensions.swift
│   └── Utility/                     ← 新規作成
│       └── Logger.swift
├── App/
├── Config/
├── CoreData/
├── Features/
├── Models/
├── Persistence/
├── QuizComponents/
├── QuizModels/
├── Resources/
├── Services/
│   └── CSVQuestionLoader.swift      ← 更新済み
├── Stores/
├── Tools/
├── Utils/
│   └── CSVLoader.swift              ← 更新済み
└── Views/
```

## 🔧 操作手順

### Step 1: Xcodeでプロジェクトを開く
```bash
open /Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord.xcodeproj
```

### Step 2: グループ構造の作成

#### 2-1. Commonグループを作成
1. 左サイドバー（Project Navigator）で **「SimpleWord」フォルダ**（黄色いアイコン）を選択
2. 右クリック → **「New Group」** を選択
3. 名前を **「Common」** に変更

#### 2-2. Dataグループを作成
1. **「Common」** を選択
2. 右クリック → **「New Group」**
3. 名前を **「Data」** に変更

#### 2-3. Dataの下に5つのサブグループを作成
**「Data」** を選択した状態で、以下を順番に作成：

1. 右クリック → **「New Group」** → 名前: **「DataSource」**
2. 右クリック → **「New Group」** → 名前: **「Parser」**
3. 右クリック → **「New Group」** → 名前: **「Repository」**
4. 右クリック → **「New Group」** → 名前: **「Schema」**
5. 右クリック → **「New Group」** → 名前: **「Legacy」**

#### 2-4. Commonの下に2つのグループを作成
**「Common」** を選択した状態で：

1. 右クリック → **「New Group」** → 名前: **「Extensions」**
2. 右クリック → **「New Group」** → 名前: **「Utility」**

### Step 3: ファイルをグループに移動

#### 3-1. ファイルシステムでファイルの場所を確認
```bash
# 作成されたファイルの一覧
ls -R /Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Common/
```

#### 3-2. Xcodeでファイルを追加

**DataSourceグループに追加:**
1. **「DataSource」** グループを右クリック → **「Add Files to "SimpleWord"...」**
2. 以下のファイルを選択（Commandキーを押しながら複数選択）:
   - `Common/Data/DataSource/DataSourceProtocol.swift`
   - `Common/Data/DataSource/CSVDataSource.swift`
   - `Common/Data/DataSource/DataSourceFactory.swift`
3. **「Options」** で以下を確認:
   - ✅ **「Copy items if needed」** はチェック**しない**
   - ✅ **「Create groups」** を選択
   - ✅ **「Add to targets: SimpleWord」** にチェック
4. **「Add」** をクリック

**Parserグループに追加:**
1. **「Parser」** グループを右クリック → **「Add Files to "SimpleWord"...」**
2. 以下を選択:
   - `Common/Data/Parser/Parser.swift`
   - `Common/Data/Parser/QuestionItemParser.swift`
3. 同じオプションで **「Add」**

**Repositoryグループに追加:**
1. **「Repository」** グループを右クリック → **「Add Files to "SimpleWord"...」**
2. 以下を選択:
   - `Common/Data/Repository/RepositoryProtocol.swift`
   - `Common/Data/Repository/QuestionItemRepository.swift`
3. 同じオプションで **「Add」**

**Schemaグループに追加:**
1. **「Schema」** グループを右クリック → **「Add Files to "SimpleWord"...」**
2. 以下を選択:
   - `Common/Data/Schema/QuestionItemCSVSchema.swift`
3. 同じオプションで **「Add」**

**Legacyグループに追加:**
1. **「Legacy」** グループを右クリック → **「Add Files to "SimpleWord"...」**
2. 以下を選択:
   - `Common/Data/Legacy/LegacyCSVLoaderAdapter.swift`
   - `Common/Data/Legacy/LegacyCSVQuestionLoaderAdapter.swift`
3. 同じオプションで **「Add」**

**Extensionsグループに追加:**
1. **「Extensions」** グループを右クリック → **「Add Files to "SimpleWord"...」**
2. 以下を選択:
   - `Common/Extensions/Result+Extensions.swift`
3. 同じオプションで **「Add」**

**Utilityグループに追加:**
1. **「Utility」** グループを右クリック → **「Add Files to "SimpleWord"...」**
2. 以下を選択:
   - `Common/Utility/Logger.swift`
3. 同じオプションで **「Add」**

### Step 4: ビルドして確認

1. **Product** → **Clean Build Folder** (Shift + Command + K)
2. **Product** → **Build** (Command + B)
3. ✅ **「Build Succeeded」** が表示されることを確認

### Step 5: 動作確認（オプション）

1. シミュレータでアプリを起動
2. CSV読み込みが正常に動作することを確認
3. コンソールログで新しいLogger出力を確認

## ❓ トラブルシューティング

### ファイルが見つからない場合
```bash
# ファイルの実際の場所を確認
find /Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord -name "*.swift" -path "*/Common/*"
```

### ビルドエラーが出る場合
1. **Product** → **Clean Build Folder**
2. Xcodeを再起動
3. DerivedDataを削除:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/SimpleWord-*
   ```
4. 再度ビルド

### ファイルが重複している場合
1. Project Navigatorで重複ファイルを探す
2. 古い方を選択して **Delete** → **「Remove Reference」** を選択

## ✅ 完了チェックリスト

- [ ] Commonグループが作成されている
- [ ] Data/DataSource に3ファイルが配置されている
- [ ] Data/Parser に2ファイルが配置されている
- [ ] Data/Repository に2ファイルが配置されている
- [ ] Data/Schema に1ファイルが配置されている
- [ ] Data/Legacy に2ファイルが配置されている
- [ ] Extensions に1ファイルが配置されている
- [ ] Utility に1ファイルが配置されている
- [ ] ビルドが成功する
- [ ] アプリが正常に起動する

## 📝 補足

### グループ vs フォルダ
- Xcodeの **「Group」** は論理的な整理（黄色いフォルダアイコン）
- ファイルシステムの物理フォルダとは必ずしも一致しない
- 今回は物理フォルダも作成済みなので、それを反映させる

### なぜXcodeで操作するのか？
- ビルド設定（Target Membership）が自動的に設定される
- プロジェクトファイル（.xcodeproj）が正しく更新される
- Finderで移動するとビルドエラーの原因になる

## 🎉 完了後

フォルダ整理が完了したら、`CSV_REFACTORING_REPORT.md` の「Phase 2: 段階的な移行」を確認して、新しいAPIの使い方を学んでください。

---

質問や問題があれば、遠慮なくお知らせください！
