# 読解データ 手動修正 完全ガイド

**作成日**: 2025年11月19日  
**対象**: nanashi8.github.io 読解機能

---

## 📋 検査結果サマリー

| 問題カテゴリ | 件数 | 優先度 |
|------------|------|--------|
| **フレーズ訳の重複表示**（コード） | 1件 | ⚠️ **最高** |
| **辞書の固有名詞誤記** | 376件 | 🔴 **高** |
| **並列要素の読点欠落** | 702件 | 🟡 **中** |
| **ピリオドの格納** | 0件（正常） | ✅ 問題なし |

---

## 🎯 修正作業の進め方

### ステップ1: 最優先修正（10分）

#### 1-1. ComprehensiveReadingView.tsx の修正

**ファイル**: `src/components/ComprehensiveReadingView.tsx`

**場所**: 882-889行目

**操作**: 以下の7行を**完全に削除**

```tsx
<div className="word-meanings">
  {phrase.segments?.filter(s => s.meaning && s.meaning !== '-').map((seg, idx) => (
    <span key={idx} className="word-meaning-pair">
      <strong>{seg.word}</strong>: {seg.meaning}
    </span>
  ))}
</div>
```

**修正後の確認**:
```tsx
{phraseTranslations[phraseIdx] ? (
  <div className="phrase-translation visible">
    <div className="translation-text">{phrase.phraseMeaning}</div>
  </div>
) : (
  <button
```

保存してビルドテストを実行:
```bash
npm run build
```

---

### ステップ2: 辞書ファイルの修正（30-60分）

#### 2-1. Sustainability の修正（最優先）

**ファイル**: `public/data/reading-passages-dictionary.json`

**検索**: `"sustainability"` （Ctrl+F / Cmd+F）

**修正箇所**:
```json
// 修正前（5行目付近）
"sustainability": {
  "word": "Sustainability",
  "reading": "-",
  "meaning": "Sustainability（固有名詞）",
  
// 修正後
"sustainability": {
  "word": "Sustainability",
  "reading": "サステナビリティ",
  "meaning": "持続可能性",
```

#### 2-2. その他の主要な修正

以下を順番に検索して修正してください:

| 検索キーワード | 修正内容 |
|--------------|---------|
| `"solar"` | `"meaning": "太陽の", "reading": "ソーラー"` |
| `"renewable"` | `"meaning": "再生可能な", "reading": "リニューアブル"` |
| `"electric"` | `"meaning": "電気の", "reading": "エレクトリック"` |
| `"coal"` | `"meaning": "石炭", "reading": "コール"` |
| `"ice"` | `"meaning": "氷", "reading": "アイス"` |
| `"species"` | `"meaning": "種（複数形）", "reading": "スピーシーズ"` |
| `"biomass"` | `"meaning": "バイオマス（生物資源）", "reading": "バイオマス"` |
| `"geothermal"` | `"meaning": "地熱の", "reading": "ジオサーマル"` |

**作業のコツ**:
1. 検索で該当箇所を見つける
2. `meaning` フィールドを修正
3. `reading` フィールドを `-` からカタカナに変更
4. 次の検索へ

各10個修正したら保存してJSONの構文チェック:
```bash
jq . public/data/reading-passages-dictionary.json > /dev/null && echo "OK"
```

---

### ステップ3: パッセージファイルの修正（60-120分）

#### 3-1. Advanced-1.json の最優先修正

**ファイル**: `public/data/advanced-1.json`

| 検索文字列 | 修正内容 |
|-----------|---------|
| `気候変動資源枯渇汚染` | `気候変動、資源枯渇、汚染` |
| `ハリケーン干ばつ洪水山火事` | `ハリケーン、干ばつ、洪水、山火事` |
| `石炭石油天然ガス` | `石炭、石油、天然ガス` |

**手順**:
1. ファイルを開く
2. Ctrl+H（または Cmd+H）で置換機能を開く
3. 上記の文字列を検索して、修正後の文字列に置換
4. 保存

#### 3-2. Intermediate-5.json の修正

**ファイル**: `public/data/intermediate-5.json`

**検索**: `ライフスタイル収入幸福`

**修正**: `ライフスタイル、収入、幸福`

#### 3-3. その他のパッセージ（時間がある場合）

`docs/TRANSLATION_CHECK_REPORT.txt` を参照して、
702件の問題箇所を確認できます。

**優先順位**:
1. 明らかな並列（3つ以上の名詞が連続）
2. カタカナ長文
3. 自然さの調整

---

## ✅ 各ステップの確認方法

### 修正後の確認チェックリスト

#### □ ステップ1完了後
```bash
npm run build
# エラーがないことを確認
npm run dev
# ブラウザで読解機能を開き、フレーズ訳を表示
# → 単語の意味が重複表示されないことを確認
```

#### □ ステップ2完了後
```bash
# JSONの構文チェック
jq . public/data/reading-passages-dictionary.json > /dev/null && echo "OK"

# 修正数の確認
grep -c "（固有名詞）" public/data/reading-passages-dictionary.json
# → 数が減っていることを確認
```

#### □ ステップ3完了後
```bash
# 各パッセージファイルの構文チェック
for file in public/data/beginner-*.json public/data/intermediate-*.json public/data/advanced-*.json; do
  jq . "$file" > /dev/null && echo "$file: OK" || echo "$file: ERROR"
done

# ビルド
npm run build

# 動作確認
npm run dev
```

---

## 🔍 よくある質問

### Q1: JSON形式を壊してしまった場合は？

**A**: 以下のコマンドでエラー箇所を確認:
```bash
jq . ファイル名.json
```
エラーメッセージの行番号を見て修正してください。

よくあるミス:
- カンマの付け忘れ・付け過ぎ
- `"`（ダブルクォート）の閉じ忘れ
- 全角カンマ（、）と半角カンマ（,）の混同

### Q2: どこまで修正すれば良い？

**A**: 最低限の修正範囲:

| 優先度 | 内容 | 所要時間 |
|--------|------|---------|
| **必須** | ステップ1（重複表示） | 5分 |
| **強く推奨** | ステップ2-1（Sustainability） | 5分 |
| **推奨** | ステップ2-2（主要8単語） | 20分 |
| **推奨** | ステップ3-1, 3-2（パッセージ3箇所） | 10分 |
| 任意 | その他の辞書修正 | 60分+ |
| 任意 | その他のパッセージ修正 | 120分+ |

### Q3: 修正結果をデプロイするには？

**A**: 
```bash
npm run build
npm run deploy
```

---

## 📚 参考ファイル

修正作業に役立つドキュメント:

1. **READING_MANUAL_FIXES.md**  
   修正の概要と主要な修正項目

2. **READING_DETAILED_FIXES.md**  
   辞書エントリの詳細な修正例

3. **TRANSLATION_CHECK_REPORT.txt**  
   全702件の問題箇所リスト

4. **check_reading_translations.py**  
   問題検出スクリプト（再実行可能）

---

## 📞 トラブルシューティング

### ビルドエラーが出る

```bash
# エラーの詳細を確認
npm run build 2>&1 | less

# 該当ファイルのJSON構文をチェック
jq . public/data/ファイル名.json
```

### 変更が反映されない

```bash
# キャッシュをクリア
rm -rf dist/
npm run build
npm run dev
```

### 元に戻したい

```bash
# Gitで変更を確認
git diff

# 特定ファイルを元に戻す
git checkout -- ファイル名

# 全ての変更を元に戻す
git checkout -- .
```

---

## 🎉 修正完了後

すべての修正が完了したら:

1. ✅ 全ファイルのビルドが成功することを確認
2. ✅ ブラウザで読解機能の動作を確認
3. ✅ 変更をコミット
4. ✅ デプロイ

```bash
# コミット
git add .
git commit -m "fix: 読解機能の日本語訳とUIの改善

- フレーズ訳表示時の単語意味重複を削除
- 辞書の固有名詞誤記を修正（Sustainability他）
- 並列要素に読点を追加（主要箇所）"

# プッシュ
git push origin main

# デプロイ
npm run deploy
```

---

**修正作業、お疲れ様でした！** 🎊
