# 読解のヒント機能

## 概要

長文読解画面（ComprehensiveReadingView）で文を選択すると、その文に関連する読解テクニックのヒントが自動的に表示されます。中学生にも分かる口語的な説明で、読解のコツを学べます。

## 機能の詳細

### 1. 文パターンのヒント（💡 読解のヒント）

文中のキーワードを検出して、関連する読解テクニックを提案します。

**表示内容:**
- パターンのタイトル（例: 「対比: but/however は"前と逆"の合図」）
- 要点（gist）: 口語的な説明
- 手順（steps）: 具体的なステップ

**例:**
```
文: However, this approach has some limitations.

表示されるヒント:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
対比: but/however は"前と逆"の合図

but/however は『それでも/しかし』。
前と逆の方向に注意を向ける合図。
前後を逆方向でメモすると混乱しない。

手順:
• but/however をマークする
• 前の内容を一語でラベル化
• 後ろの内容を一語でラベル化（逆方向）
• 前後をペアで覚える
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. 段落構造のヒント（📚 段落構造のヒント）

文の位置や特徴語から、段落全体の役割を判定してヒントを表示します。

**表示内容:**
- 段落パターンのタイトル（例: 「段落の導入: まず"何の話か"を提示」）
- 要点（gist）: 段落の役割の説明
- 手順（steps）: 読解のステップ

**例:**
```
文: First, we need to understand the problem.

表示されるヒント:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
段落の導入: まず"何の話か"を提示

第1段落（導入段落）は本文全体のトピック
（何の話か）を提示する場所。

手順:
• 1段落目の中心語（名詞）を拾う
• その語が全体のトピックとして機能するか確認
• トピックとして保存して次に進む
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 検出されるパターンの例

### 文パターン（最大2つまで表示）

| キーワード | 検出されるパターン | ID |
|----------|--------------|-----|
| but, however, although | 対比パターン | S1, S4, S5, S18, S81 |
| because, since | 因果パターン | S8, S19, S83 |
| if, unless | 条件パターン | S10, S96, S99 |
| which, who, whom | 関係詞パターン | S11, S12, S13 |
| not only...but also | 複合パターン | S16, S95 |
| than, more...than | 比較パターン | S17, S73, S74, S90 |
| overall, in short | まとめパターン | S80 |

### 段落パターン（最大1つ表示）

| 条件 | 検出されるパターン | ID |
|-----|--------------|-----|
| 第1文 | 導入段落 | P1, P2 |
| however, but で始まる | 対比段落 | P3, P10, P11, P71 |
| for example | 例示段落 | P4, P70 |
| therefore, thus | 結論段落 | P5, P50, P51 |
| moreover, furthermore | 追加段落 | P6, P75 |
| first...second...third | 列挙段落 | P15 |
| this suggests | 含意段落 | P19, P84 |

## データソース

- 文パターン: `/data/reading-techniques/sentence_reading_patterns.json` (S1〜S100)
- 段落パターン: `/data/reading-techniques/paragraph_reading_patterns.json` (P1〜P100)

データは初期化時に一度だけ読み込まれ、メモリにキャッシュされます。

## 実装ファイル

- **UI**: `src/components/ComprehensiveReadingView.tsx`
- **ローダー**: `src/utils/readingTechniquesLoader.ts`
- **型定義**: `src/types/readingTechniques.ts`
- **テスト**: `tests/unit/readingTechniquesLoader.test.ts`
- **データ同期**: `scripts/sync-reading-techniques.mjs`

## 今後の拡張案

- [ ] 設問戦略（Q）のヒント追加（読解問題を解くときのコツ）
- [ ] ユーザーのお気に入りパターンの保存
- [ ] 難易度別のパターン表示（初級・中級・上級）
- [ ] パターン検出精度の向上（機械学習ベースのマッチング）
