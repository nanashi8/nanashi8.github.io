# Copilot Prompt Files 診断レポート

**作成日**: 2025年10月25日

## 📋 診断結果サマリー

### ✅ 正しく設定されているファイル

1. **`.github/prompts/swift.prompt.md`** ✓
   - 形式: 正しい（単一 applyTo）
   - 対象: `**/*.swift`
   - 内容: Swift コーディング規約が適切に記述されている

2. **`.github/prompts/csv.prompt.md`** ✓
   - 形式: 正しい（単一 applyTo）
   - 対象: `**/*.csv`
   - 内容: CSV形式規約が適切に記述されている

### ⚠️ 修正が必要なファイル

1. **`.github/copilot-instructions.md`** ❌
   - 問題: ファイルが空
   - 推奨: プロジェクトの基本的な指示を記述すべき
   - 対応: `.github/copilot-instructions-new.md` に正しい内容を作成済み

2. **`.github/prompts/PromptFiles.prompt.md`** ⚠️
   - 問題: 複数の `applyTo` セクションが混在している
   - 説明: Prompt Files は1ファイルにつき1つの `applyTo` のみサポート
   - 現状: `**/*`, `**/*.swift`, `**/*.csv` の3つが混在
   - 推奨: グローバル設定のみ残し、Swift/CSV専用は別ファイルに分離（既に分離済み）
   - 対応: `.github/prompts/global.prompt.md` に正しい内容を作成済み

3. **`.github/instructions/CustumInstruction.instructions.md`** ⚠️
   - 問題: ファイル名に誤字（Custum → Custom）
   - 内容: QuizView のクイックリファレンス（内容は問題なし）

## 🔧 推奨される修正アクション

### 手動で実施していただく作業

#### 1. copilot-instructions.md の更新
```bash
# 古いファイルを削除
rm .github/copilot-instructions.md

# 新しいファイルをリネーム
mv .github/copilot-instructions-new.md .github/copilot-instructions.md
```

#### 2. PromptFiles.prompt.md の更新
```bash
# 古いファイルをバックアップ
mv .github/prompts/PromptFiles.prompt.md .github/prompts/PromptFiles.prompt.md.bak

# 新しいファイルをリネーム
mv .github/prompts/global.prompt.md .github/prompts/PromptFiles.prompt.md
```

#### 3. instructions ファイル名の修正
```bash
# ファイル名の誤字を修正
cd .github/instructions
mv CustumInstruction.instructions.md CustomInstruction.instructions.md
```

## 📚 Prompt Files の正しい使い方

### 基本構造
```markdown
---
applyTo: "パターン"
---
# 指示内容
```

### 重要なルール
1. **1ファイル = 1つの applyTo**: 複数の applyTo セクションは同一ファイル内に記述できない
2. **ファイル命名規則**: `*.prompt.md` または `*.instructions.md`
3. **配置場所**: 
   - `.github/prompts/` - Prompt Files
   - `.github/instructions/` - Instructions Files
   - `.github/copilot-instructions.md` - グローバル設定（最優先）

### applyTo パターン例
- `**/*` - すべてのファイル
- `**/*.swift` - すべての Swift ファイル
- `**/*.csv` - すべての CSV ファイル
- `Features/**/*.swift` - Features 配下の Swift ファイルのみ

## 📊 現在のファイル構成

```
.github/
├── copilot-instructions.md          [空] → 修正必要
├── copilot-instructions-new.md      [✓] 正しい内容
├── prompts/
│   ├── PromptFiles.prompt.md        [⚠️] 複数applyTo混在
│   ├── global.prompt.md             [✓] 正しい内容（新規作成）
│   ├── swift.prompt.md              [✓] 正しい
│   └── csv.prompt.md                [✓] 正しい
└── instructions/
    ├── CustumInstruction.instructions.md  [⚠️] 誤字
    └── ... (その他)
```

## ✨ 修正後の理想的な構成

```
.github/
├── copilot-instructions.md          [✓] グローバル設定
├── prompts/
│   ├── global.prompt.md             [✓] 全ファイル対象
│   ├── swift.prompt.md              [✓] Swift専用
│   └── csv.prompt.md                [✓] CSV専用
└── instructions/
    ├── CustomInstruction.instructions.md  [✓] QuizView参照
    └── ... (その他)
```

## 🎯 まとめ

**現状**: 部分的に正しく設定されているが、いくつかの修正が必要

**問題点**:
1. メインの `copilot-instructions.md` が空
2. `PromptFiles.prompt.md` に複数の applyTo が混在
3. ファイル名の誤字

**対処状況**:
- ✅ 正しい内容のファイルを新規作成済み
- ⏳ 既存ファイルの上書きは手動で実施が必要（ファイルがロックされている可能性）

上記の手動修正を実施いただければ、Copilot Prompt Files が正しく機能するようになります。
