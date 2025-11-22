# Passage Source Correction Report (2025-11-23)

本レポートは `public/data/passage-sources/*.txt` に含まれる既存英文ドラフトの品質監査結果です。目的は現行生成物を英語教育・読解教材として再利用可能か英文学的観点 (語法 / 構文 / 談話構成 / コロケーション / 語彙レベル適合) から判定し、再構築方針を確立することです。

## 1. 総合評価

- 全 10 ファイル (beginner 3 / intermediate 4 / advanced 3) に自然言語として意味的凝集性 (semantic cohesion) がほぼ欠如。
- 文テンプレートへのランダム語彙挿入に近く、文法的形態は一部正しくても語法・語義連接が破綻 (例: *We should brother with care* / *Hospital shows how adjective can affect our annoy* / *A cautious is not only a simple violent* 等)。
- コロケーション不成立 (動詞+目的語 / 形容詞+名詞) の頻発により語感学習に有害。
- discourse markers (In addition, Therefore, As a result...) が形式的反復で、論理的進行や段落機能（導入→展開→結論）が存在せず。
- 高頻度語と低頻度・専門語が無秩序混在し CEFR レベル整合性が失われている。
- `advanced-3.txt` は単一汎用テンプレート文の大量反復で教材価値無し。

結論: 部分修正は非効率。**全ファイル全面置換 (Full Replacement)** が最適。

## 2. 代表的問題カテゴリと例

| カテゴリ | 説明 | 例 | 推奨処置 |
|-----------|------|----|-----------|
| Lexical Misuse | 品詞/語義不適合 | *We should dead with care* | 正常語法に基づく再執筆 |
| Collocation Failure | 自然結合不可 | *reduce air and share benefits in the student* | 意味フィールド整合の語選定 |
| Semantic Incoherence | 文間意味連接欠如 | 無関連語列挿入 | 段落構成設計 (Topic → Support → Close) |
| Template Redundancy | 定型文反復 | *In the X, people work together...* 連続 | テンプレート排除・固有情報挿入 |
| Register Inconsistency | レジスター混在 | *ammunition* と *sun* | レベル別語彙リスト制約 |
| Morphosyntax Artifacts | 生成ノイズ | *A die is not only a simple before* | 文法的再構築 |

## 3. レベル別再構築ガイドライン

### Beginner (A2 ～ B1 移行)
- 語数: 120–160 語 / 1–2 段落。
- 構成: 説明的 or 軽い物語 (起→展→簡単結び)。
- 語彙: NGSL/基礎学習語 70% 以上。抽象語は最小限。
- 文型: SVO / 進行形 / 現在完了 (導入程度) を制限的導入。
### Intermediate (B1～B2)
- 語数: 200–260 語 / 2–3 段落。
- 構成: 問題提示 → 説明/例 → まとめ。
- 語彙: 抽象概念 (community, impact, device 等) と具体動詞の自然コロケーション。
- 文型: 関係代名詞節 / 分詞構文 / 比較表現。
### Advanced (B2～C1)
- 語数: 320–400 語 / 3 段落。
- 構成: Issue → Evidence/Data → Implication/Takeaway。
- 語彙: 学術的だが頻度過度でない (sustainability, policy, metrics, incentive, resilience)。
- 文型: 論理接続 (however, consequently, whereas) と名詞化構造適度使用。過度な専門用語の羅列禁止。

## 4. 新データ構造提案

各再構築パッセージを JSON 化し以下フィールドを標準化:
```jsonc
{
  "id": "beginner-1",
  "level": "beginner",
  "title": "School Morning Routine",
  "theme": "school-life",
  "paragraphs": ["...", "..."],
  "totalWordCount": 142,
  "keyVocab": ["routine", "encourage", "focus"],
  "questions": [
    {"type": "mc", "q": "What happens before the first bell?", "choices": ["Students play", "Students greet"], "answer": 1},
    {"type": "short", "q": "Give one benefit of a calm start."}
  ],
  "created": "2025-11-23"
}
```

## 5. 自動検証要件 (Validation Script Spec)

| チェック | 内容 | 合格閾値 |
|----------|------|---------|
| Word Count Range | レベル別目標語数 | ±5% 以内 |
| High-Freq Ratio | NGSL or 基礎語彙出現率 | Beginner ≥70%, Intermediate ≥55%, Advanced ≥45% |
| Repetition | 同一文の完全反復禁止 | 0 回 |
| Collocation List | 禁止ビッグラム (不自然組合せ) | 0 件 |
| Readability | Flesch / Dale–Chall | レベル範囲内 |

## 6. 作業ステップ (Roadmap)

1. 既存 .txt を `public/data/passage-sources/archive/` へ移動 (保全)。
2. Beginner 3 本再執筆 → 検証 → コミット。
3. Intermediate 2 本 (優先テーマ: health, environment) → 検証。
4. Advanced 1 本 (global sustainability) プロトタイプ。
5. 残りを順次補完 → index.json 更新。

## 7. サンプル冒頭 (Beginner)

> School mornings start quietly. Students greet each other, store their bags, and sit before the first bell rings. A calm beginning helps everyone focus...

## 8. 推奨アクション

- 今回レポート内容承認後、段階 1 (アーカイブ) および 段階 2 (Beginner再執筆) へ進行希望。

承認いただければ次ターンでアーカイブと Beginner パッセージ新規作成を実行します。
