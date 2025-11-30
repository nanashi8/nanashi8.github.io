# 長文データ作成・編集・運用パイプライン

## 1. 構想・原稿作成
- テーマ・レベル・語数・学習目的を決定
- 英文原稿・日本語訳・文節分割案を作成

## 2. データ構造設計
- ReadingPassage, ReadingPhrase, ReadingSegment型に準拠
- Question型互換（word, lemma, reading, meaning, etymology, relatedWords, relatedFields, difficulty）

## 3. 変換・メタデータ付与
- `scripts/add_lemma_metadata.py`で自動変換
  - lemma（原形）: spaCyで抽出
  - reading, etymology, relatedWords, relatedFields, difficulty: 既存meaningから展開 or AI APIで生成
- JSONファイル（passages-phrase-learning/*.json）に保存

## 4. 品質検証
- `scripts/validate_all_data.py`で型・内容チェック
- 必要に応じて手動修正

## 5. システム連携
- ReadingView.tsxでQuestion型として保存・出題
- 和訳・スペルタブで復習可能

## 6. Git管理・レビュー
- 変更はgit add/commit/pushで管理
- Pull Requestレビュー推奨

---

# 作業ガイドライン（AI/人間共通）

1. **必ずQuestion型互換で設計すること**
   - inflected form（gathered等）はlemma（gather）で保存
   - reading, etymology, relatedWords, relatedFields, difficultyも必須

2. **自動変換スクリプトを活用すること**
   - `scripts/add_lemma_metadata.py`で一括変換
   - AI API未設定時は最低限lemmaとdifficultyのみ自動付与

3. **品質検証を必ず実施すること**
   - `scripts/validate_all_data.py`でエラーゼロを確認

4. **編集履歴・変更理由を記録すること**
   - 主要な変更はコミットメッセージに明記

5. **パイプライン手順を守ること**
   - 構想→設計→変換→検証→連携→管理の順で作業

---

> 本ガイドはAI/人間どちらでも効率的に長文データを作成・編集・運用できるよう設計されています。