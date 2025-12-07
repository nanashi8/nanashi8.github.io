# データ修正の具体例

## 実際のエラーと修正方法

### 1. KATAKANA_ENGLISH_MIXED（カタカナに英語混入）

#### Before（誤り）
```csv
August,ɔːˈɡʌst (August),8月,中学英語で重要な単語です。,,時間・数量,intermediate,intermediate
Brazil,bɹə.ˈzɪl (Brazil),ブラジル,南米の国。例: Brazil coffee(ブラジル産コーヒー)。,"country(カントリー): 国, South America(サウスアメリカ): 南米",場所・移動,intermediate,intermediate
```

#### After（正解）
```csv
August,ɔːˈɡʌst (オーガ́スト),8月,中学英語で重要な単語です。,,時間・数量,intermediate,intermediate
Brazil,bɹəˈzɪl (ブラジ́ル),ブラジル,南米の国。例: Brazil coffee(ブラジル産コーヒー)。,"country(カントリー): 国, South America(サウスアメリカ): 南米",場所・移動,intermediate,intermediate
```

**ポイント**: 
- `(August)` → `(オーガ́スト)`
- `(Brazil)` → `(ブラジ́ル)`
- アクセント記号（́）を必ず付ける

---

### 2. IPA_MISSING（IPA発音欠損）

#### Before（誤り）
```csv
February,フェ́ブルアリー,2月,中学英語で重要な単語です。,,時間・数量,intermediate,intermediate
France,フラ́ンス,フランス,中学英語で重要な単語です。,,場所・移動,intermediate,intermediate
```

#### After（正解）
```csv
February,ˈfɛbruɛri (フェ́ブルアリー),2月,中学英語で重要な単語です。,,時間・数量,intermediate,intermediate
France,fɹæns (フラ́ンス),フランス,中学英語で重要な単語です。,,場所・移動,intermediate,intermediate
```

**ポイント**: 
- カタカナのみ → `IPA (カタカナ́)`
- IPA発音記号を追加（Wiktionaryなどから取得）

---

### 3. フレーズの複数IPA+カタカナペア

#### Before（誤り）
```csv
get up,get,起きる,...
```

#### After（正解）
```csv
get up,ɡet (ゲット) ʌp (アップ),起きる,...
```

**ポイント**: 
- 各単語ごとに `IPA (カタカナ́)` のペアを作成
- スペースで区切る

---

## 修正に役立つリソース

### IPA発音記号の確認
1. **Wiktionary** - https://en.wiktionary.org/
   - 例: https://en.wiktionary.org/wiki/February
   - `/ˈfɛb.ɹu.ɛɹ.i/` などと表示される

2. **Cambridge Dictionary** - https://dictionary.cambridge.org/
   - 英米両方の発音が確認できる

3. **既存データから探す**
   ```bash
   grep "August" public/data/vocabulary/*.csv
   ```

### カタカナ変換の確認
1. **英語をカタカナで読む**
   - August → オーガスト
   - アクセント位置に ́ を付ける → オーガ́スト

2. **既存の正しいパターンを参考**
   ```bash
   grep "America" public/data/vocabulary/all-words.csv
   # America,əˈmɛɹɪkə (アメ́リカ),アメリカ,...
   ```

---

## 一括修正のテクニック

### VS Codeでの検索・置換
1. `Cmd+Shift+F` で全体検索
2. 正規表現モードON
3. 検索: `,(August),`
4. 置換: `,(オーガ́スト),`

### Excel/Google Sheetsでの修正
1. CSVをインポート
2. 「読み」列でフィルター
3. 英語が含まれる行を抽出
4. 一括置換
5. CSV形式で保存（UTF-8）

---

## チェックリスト

修正後、以下を確認：

- [ ] IPA発音記号が入っている
- [ ] カッコ `()` で囲まれている
- [ ] カタカナにアクセント記号（́）がある
- [ ] 英語が残っていない
- [ ] フォーマット: `IPA (カタカナ́)`

---

## 修正後の検証

```bash
# 修正後、必ずチェック
npm run check:data-quality

# エラーが減っているか確認
grep "エラー:" scripts/output/data-quality-report.txt
```

---

**最終更新**: 2025年12月7日
