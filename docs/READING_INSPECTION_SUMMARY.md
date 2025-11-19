# 読解データ 検査・修正 サマリー

**検査日**: 2025年11月19日  
**対象システム**: nanashi8.github.io 読解機能

---

## 🔍 検査結果

### 検出された問題

| # | 問題カテゴリ | 件数 | 深刻度 | 状態 |
|---|------------|------|--------|------|
| 1 | **フレーズ訳表示時の単語意味重複** | 1件 | ⚠️ 最高 | 🔧 修正方法提示済み |
| 2 | **辞書の固有名詞誤記** | 376件 | 🔴 高 | 📋 リスト作成済み |
| 3 | **並列要素の読点欠落** | 702件 | 🟡 中 | 📊 レポート出力済み |
| 4 | **ピリオドの格納** | 0件 | ✅ 正常 | ✅ 問題なし |

---

## 📁 作成したドキュメント

### 1. READING_STEP_BY_STEP_GUIDE.md（メインガイド）★
**内容**: 手動修正の完全ガイド  
**用途**: 修正作業の実施手順  
**推奨**: まずこのファイルを参照

### 2. READING_MANUAL_FIXES.md
**内容**: 修正項目の概要と主要な修正例  
**用途**: 修正方針の理解

### 3. READING_DETAILED_FIXES.md
**内容**: 辞書エントリの詳細な修正リスト  
**用途**: 辞書修正時の参照

### 4. TRANSLATION_CHECK_REPORT.txt
**内容**: 全702件の問題箇所の完全リスト  
**用途**: 詳細な問題確認

### 5. check_reading_translations.py
**内容**: 自動検査スクリプト  
**用途**: 修正後の再検査

---

## 🎯 修正の優先順位

### 最優先（必須）- 所要時間: 10分

1. **ComprehensiveReadingView.tsx の修正**
   - ファイル: `src/components/ComprehensiveReadingView.tsx`
   - 行: 882-889行目を削除
   - 効果: フレーズ訳表示時の重複解消

2. **Sustainability の修正**
   - ファイル: `public/data/reading-passages-dictionary.json`
   - 内容: `"meaning": "Sustainability（固有名詞）"` → `"meaning": "持続可能性"`
   - 効果: 最も目立つ誤記の修正

### 高優先（強く推奨）- 所要時間: 30分

3. **主要な固有名詞誤記の修正**
   - Solar, Renewable, Electric, Coal など8単語
   - ファイル: `public/data/reading-passages-dictionary.json`

4. **Advanced-1.json の並列要素修正**
   - phrase-3, phrase-15, phrase-27 の読点追加
   - ファイル: `public/data/advanced-1.json`

### 中優先（推奨）- 所要時間: 1-2時間

5. **その他の辞書修正**（残り360件）
6. **その他のパッセージ修正**（残り700件）

---

## 📝 具体的な修正例

### 例1: ComprehensiveReadingView.tsx

**修正前（882-889行目）**:
```tsx
<div className="phrase-translation visible">
  <div className="translation-text">{phrase.phraseMeaning}</div>
  <div className="word-meanings">
    {phrase.segments?.filter(s => s.meaning && s.meaning !== '-').map((seg, idx) => (
      <span key={idx} className="word-meaning-pair">
        <strong>{seg.word}</strong>: {seg.meaning}
      </span>
    ))}
  </div>
</div>
```

**修正後**:
```tsx
<div className="phrase-translation visible">
  <div className="translation-text">{phrase.phraseMeaning}</div>
</div>
```

### 例2: 辞書ファイル（Sustainability）

**修正前**:
```json
"sustainability": {
  "word": "Sustainability",
  "reading": "-",
  "meaning": "Sustainability（固有名詞）",
```

**修正後**:
```json
"sustainability": {
  "word": "Sustainability",
  "reading": "サステナビリティ",
  "meaning": "持続可能性",
```

### 例3: パッセージファイル

**修正前**:
```json
"phraseMeaning": "気候変動資源枯渇汚染は緊急の行動を必要とします"
```

**修正後**:
```json
"phraseMeaning": "気候変動、資源枯渇、汚染は緊急の行動を必要とします"
```

---

## ⚙️ 検証コマンド

### JSON構文チェック
```bash
jq . public/data/reading-passages-dictionary.json > /dev/null && echo "OK"
```

### 問題数の確認
```bash
grep -c "（固有名詞）" public/data/reading-passages-dictionary.json
```

### 再検査
```bash
python3 check_reading_translations.py
```

### ビルドテスト
```bash
npm run build
```

---

## 📊 影響範囲

### 影響を受けるファイル

| ファイル種別 | ファイル数 | 推定修正箇所 |
|------------|-----------|------------|
| TypeScriptコンポーネント | 1 | 1箇所（7行削除） |
| JSONデータ（辞書） | 1 | 376箇所 |
| JSONデータ（パッセージ） | 11 | 702箇所 |

### 影響を受ける機能

- ✅ 読解機能の表示
- ✅ 単語詳細ポップアップ
- ✅ フレーズ訳の表示

---

## 🎬 次のステップ

1. **READING_STEP_BY_STEP_GUIDE.md** を開く
2. ステップ1から順番に修正を実施
3. 各ステップ完了後に動作確認
4. すべて完了したらコミット・デプロイ

---

## ℹ️ 補足情報

### なぜこれらの問題が発生したか

1. **固有名詞誤記**: 自動生成時に大文字始まりの単語を固有名詞と判定
2. **読点欠落**: 英語の並列構造（A, B, and C）を日本語に変換時、読点が省略
3. **重複表示**: フレーズ訳と単語訳の両方を表示する仕様の実装ミス

### 今後の予防策

- 自動生成後に人間によるレビュー工程を追加
- 並列構造の検出とカンマ挿入の自動化
- UIコンポーネントのテストケース追加

---

## 📞 質問・問題が発生した場合

各ガイドの「トラブルシューティング」セクションを参照してください。

---

**検査実施者**: GitHub Copilot  
**レポート作成日**: 2025年11月19日
