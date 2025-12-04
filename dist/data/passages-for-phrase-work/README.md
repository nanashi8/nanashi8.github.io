# フレーズ分割作業用ファイル

このフォルダには、フレーズ学習用JSON作成のための元ファイルが含まれています。

## ファイル一覧（21パッセージ）

### Beginner（初級）- 5ファイル
1. beginner-cafe-menu.txt
2. beginner-conversation-daily.txt
3. beginner-supermarket-shopping.txt
4. beginner-weather-seasons.txt
5. beginner-wildlife-park-guide.txt

### Intermediate（中級）- 8ファイル
1. intermediate-career-day.txt
2. intermediate-community-events.txt
3. intermediate-exchange-student-australia.txt
4. intermediate-homestay-america.txt
5. intermediate-hospital-visit.txt
6. intermediate-school-events-year.txt
7. intermediate-school-news.txt
8. intermediate-science-museum.txt

### Advanced（上級）- 8ファイル
1. advanced-environmental-issues.txt
2. advanced-family-gathering.txt
3. advanced-health-statistics.txt
4. advanced-historical-figures.txt
5. advanced-international-exchange.txt
6. advanced-school-festival.txt
7. advanced-summer-vacation-stories.txt
8. advanced-technology-future.txt

## 重要な発見

**これらのファイルはすでに適切に改行されています！**

各ファイルの特徴:
- ✅ 各行が5-20語程度の適切な長さ
- ✅ 意味的なまとまりで改行済み
- ✅ セクション見出しあり
- ✅ 会話文も自然に分割済み
- ✅ 段落インデント（4スペース）あり

つまり、**改行作業は不要**で、このままフレーズJSONに変換できます。

## 次のステップ

1. 各パッセージの全訳ファイルを作成
   - 保存先: `public/data/passages-translations/[パッセージID]-ja.txt`
   - 例: `intermediate-exchange-student-australia-ja.txt`

2. 自動変換スクリプトで各行をフレーズとして処理
   - ガイドライン参照: `docs/PASSAGE_PHRASE_JSON_CREATION_GUIDE.md`
   - セクション: 「改行済みファイルからの高速変換」

3. フレーズJSONファイルを生成
   - 保存先: `public/data/passages-phrase-learning/[パッセージID].json`

## 参考資料

- ガイドライン: `docs/PASSAGE_PHRASE_JSON_CREATION_GUIDE.md`
- プロトタイプ: `public/data/passages-phrase-learning/intermediate-exchange-student-australia.json`
- 辞書: `public/data/dictionaries/reading-passages-dictionary.json`

---

**作成日**: 2025年11月23日
