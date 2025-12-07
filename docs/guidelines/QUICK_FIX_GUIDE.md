# データ品質修正クイックガイド

## 🚀 すぐに使えるコマンド

### データ品質チェック実行
```bash
npm run check:data-quality
```

または

```bash
python3 scripts/data-quality-check.py
```

レポート: `scripts/output/data-quality-report.txt`

---

## 📝 最優先修正項目（772件）

### 1. IPA欠損の修正（336件）

**ファイル**: `public/data/vocabulary/all-words.csv`

**Before**:
```csv
February,フェ́ブルアリー,2月
France,フラ́ンス,フランス
```

**After**:
```csv
February,ˈfɛbruɛri (フェ́ブルアリー),2月
France,fɹæns (フラ́ンス),フランス
```

**ツール**: IPA辞書サイトを活用
- https://en.wiktionary.org/
- https://tophonetics.com/

---

### 2. カタカナ英語混入の修正（436件）

**ファイル**: `public/data/vocabulary/all-words.csv`

**Before**:
```csv
August,ɔːˈɡʌst (August),8月
Brazil,bɹə.ˈzɪl (Brazil),ブラジル
```

**After**:
```csv
August,ɔːˈɡʌst (オーガ́スト),8月
Brazil,bɹəˈzɪl (ブラジ́ル),ブラジル
```

**注意**: アクセント記号（́）を必ず付ける！

---

## 🔍 よくある間違いパターン

### ❌ 間違い1: IPA部分が空
```csv
word,(カタカナ),meaning  # IPAがない
```

### ✅ 正解
```csv
word,ipa (カタカナ́),meaning
```

---

### ❌ 間違い2: カッコがない
```csv
word,ipa カタカナ,meaning  # カッコがない
```

### ✅ 正解
```csv
word,ipa (カタカナ́),meaning
```

---

### ❌ 間違い3: 英語がそのまま
```csv
word,ipa (Word),meaning  # 英語のまま
```

### ✅ 正解
```csv
word,ipa (ワ́ード),meaning
```

---

## 🎯 修正チェックリスト

- [ ] IPA発音記号が入っている
- [ ] カタカナ読みがカッコ内にある
- [ ] カタカナにアクセント記号（́）がある
- [ ] 英語が混入していない
- [ ] フォーマット: `IPA (カタカナ́)`

---

## 💡 修正の優先順位

1. **IPA_MISSING (336件)** - 最優先
2. **KATAKANA_ENGLISH_MIXED (436件)** - 最優先
3. MISSING_REQUIRED_FIELD (150件) - 中
4. その他 (78件) - 低

**目標**: 上位2つ（772件）を修正すれば、エラーが77%削減！

---

## 🛠️ 推奨作業フロー

1. **バックアップ作成**
   ```bash
   cp public/data/vocabulary/all-words.csv public/data/vocabulary/all-words.csv.backup
   ```

2. **CSVエディタで開く**
   - Excel, Google Sheets, VS Code等

3. **検索・置換で一括修正**
   - 例: `(August)` → `(オーガ́スト)`

4. **修正後チェック**
   ```bash
   npm run check:data-quality
   ```

5. **エラーが減っていることを確認**

6. **コミット**
   ```bash
   git add public/data/vocabulary/all-words.csv
   git commit -m "fix: IPA欠損とカタカナ英語混入を修正 (336+436件)"
   ```

---

## 📚 参考リソース

### IPA発音記号リファレンス
- [Wikipedia - IPA](https://en.wikipedia.org/wiki/International_Phonetic_Alphabet)
- [Wiktionary](https://en.wiktionary.org/)
- [Cambridge Dictionary](https://dictionary.cambridge.org/)

### 英語→カタカナ変換
- [WebLio](https://translate.weblio.jp/)
- [Google翻訳](https://translate.google.com/)

---

## ⚡ トラブルシューティング

### Q: アクセント記号（́）の入力方法は？
A: Macの場合
```
Option + E → 母音（a, e, i, o, u）
または、カタカナ直後に ́ を貼り付け
```

### Q: IPA記号の入力方法は？
A: 
1. Wiktionaryから発音記号をコピー
2. IPA Keyboard（ブラウザ拡張）を使用
3. 既存の正しいデータからコピー

### Q: 修正後もエラーが減らない
A:
1. ファイルを保存したか確認
2. チェックコマンドを再実行
3. レポートで具体的なエラー行を確認

---

**最終更新**: 2025年12月7日  
**バージョン**: 1.0
