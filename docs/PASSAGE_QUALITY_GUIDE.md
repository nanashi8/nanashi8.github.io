# パッセージ品質検査ガイド

## 概要

新しいパッセージを追加した際に、英文の自然さと教育的適切性を保証するための検査システムです。

## 検査スクリプトの使用方法

### 基本的な使い方

```bash
# 単一ファイルの検査
python3 scripts/validate_passage.py public/data/beginner-1.json

# 全ファイルの検査
for file in public/data/*.json; do
  python3 scripts/validate_passage.py "$file"
done
```

### 出力例

```
📋 検査中: public/data/beginner-1.json
📊 総フレーズ数: 74

⚠️  5件の問題が検出されました:

🔴 深刻度: 高 (3件)
  [12] subordinate_clause_split: 従属節が分離されています: "when I entered the classroom."
      💡 前のフレーズと統合してください

  [25] prepositional_phrase_split: 前置詞句が分離されています: "with my classmates"
      💡 前のフレーズと統合してください

🟡 深刻度: 中 (1件)
  [45] infinitive_split: to不定詞句が分離されています: "to make new friends"
      💡 前のフレーズと統合してください

🟢 深刻度: 低 (1件)
  [60] missing_comma_in_series: 並列項目にカンマが欠落している可能性: "math science and English"
      💡 "math, science and English"に修正を検討してください
```

## 検査項目

### 1. 従属節の分離 (高)
**検出**: when, if, because, although, while等で始まる節が独立したフレーズになっている

❌ **悪い例**:
```
Phrase 1: "I was very nervous"
Phrase 2: "when I entered the classroom."
```

✅ **良い例**:
```
Phrase 1: "I was very nervous when I entered the classroom."
```

### 2. 前置詞句の分離 (高)
**検出**: with, from, to, at, in, on等で始まる短い句が独立したフレーズになっている

❌ **悪い例**:
```
Phrase 1: "I played soccer"
Phrase 2: "with my friends."
```

✅ **良い例**:
```
Phrase 1: "I played soccer with my friends."
```

### 3. 等位接続詞の分離 (高)
**検出**: and, or, butで始まるフレーズが独立している

❌ **悪い例**:
```
Phrase 1: "I like reading books"
Phrase 2: "and playing sports."
```

✅ **良い例**:
```
Phrase 1: "I like reading books and playing sports."
```

### 4. to不定詞句の分離 (中)
**検出**: "to + 動詞"で始まるフレーズが独立している

❌ **悪い例**:
```
Phrase 1: "I went to the library"
Phrase 2: "to study English."
```

✅ **良い例**:
```
Phrase 1: "I went to the library to study English."
```

### 5. 関係詞節の分離 (高)
**検出**: who, which, that, where等で始まる節が独立したフレーズになっている

❌ **悪い例**:
```
Phrase 1: "I met a girl"
Phrase 2: "who lives in Tokyo."
```

✅ **良い例**:
```
Phrase 1: "I met a girl who lives in Tokyo."
```

### 6. 並列項目のカンマ欠落 (低)
**検出**: 3つ以上の項目の並列でカンマが欠落している可能性

❌ **悪い例**:
```
"We study math science and English."
```

✅ **良い例**:
```
"We study math, science and English."
```

### 7. 句読点の重複 (高)
**検出**: カンマやピリオドが重複している

❌ **悪い例**:
```
"I like sports,, especially soccer."
"We went home.."
```

✅ **良い例**:
```
"I like sports, especially soccer."
"We went home."
```

### 8. 所有格の誤り (中)
**検出**: 所有格('s)にスペースが含まれている

❌ **悪い例**:
```
"many countries ' cultures"
```

✅ **良い例**:
```
"many countries' cultures"
```

### 9. 文断片 (中)
**検出**: 句読点なしで終わり、次のフレーズが小文字で始まる

❌ **悪い例**:
```
Phrase 1: "I enjoy playing soccer"
Phrase 2: "because it is fun."
```

✅ **良い例**:
```
Phrase 1: "I enjoy playing soccer because it is fun."
```

## ワークフロー

### 新しいパッセージを追加する場合

1. **JSONファイルを作成**
   ```bash
   # public/data/new-passage.json
   ```

2. **基本構造を記述**
   ```json
   {
     "title": "タイトル",
     "titleJa": "日本語タイトル",
     "level": "beginner|intermediate|advanced",
     "phrases": [
       {"en": "英文", "ja": "日本語訳"},
       ...
     ]
   }
   ```

3. **検査スクリプトを実行**
   ```bash
   python3 scripts/validate_passage.py public/data/new-passage.json
   ```

4. **問題を修正**
   - 深刻度「高」の問題は必ず修正
   - 深刻度「中」の問題は可能な限り修正
   - 深刻度「低」の問題は文脈に応じて判断

5. **再検査**
   ```bash
   python3 scripts/validate_passage.py public/data/new-passage.json
   ```

6. **ビルドテスト**
   ```bash
   npm run build
   ```

### 既存のパッセージを修正する場合

1. **現状を確認**
   ```bash
   python3 scripts/validate_passage.py public/data/existing-passage.json
   ```

2. **バックアップを作成**
   ```bash
   cp public/data/existing-passage.json public/data/existing-passage.json.backup
   ```

3. **修正を適用**

4. **再検査**

5. **ビルドテスト**

## 自動修正スクリプト

より高度な修正が必要な場合は、`fix_all_passages.py`を参考にカスタムスクリプトを作成できます。

### 例: 特定の問題だけを自動修正

```python
#!/usr/bin/env python3
import json
import sys

def fix_subordinate_clauses(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    phrases = data.get('phrases', [])
    fixed_phrases = []
    
    i = 0
    while i < len(phrases):
        current = phrases[i]
        
        # 次のフレーズが従属節で始まる場合は統合
        if i + 1 < len(phrases):
            next_en = phrases[i + 1]['en'].strip()
            first_word = next_en.split()[0].lower() if next_en.split() else ''
            
            if first_word in ['when', 'if', 'because', 'although']:
                # 統合
                current['en'] = current['en'].strip() + ' ' + next_en
                current['ja'] = current['ja'].strip() + phrases[i + 1]['ja']
                i += 1  # 次をスキップ
        
        fixed_phrases.append(current)
        i += 1
    
    data['phrases'] = fixed_phrases
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 修正完了: {len(phrases)} → {len(fixed_phrases)} フレーズ")

if __name__ == '__main__':
    fix_subordinate_clauses(sys.argv[1])
```

## ベストプラクティス

### フレーズ分割の原則

1. **意味的まとまりを優先**
   - 1つの完結した意味を持つ単位で分割
   - 学習者が理解しやすい長さ(10-20語程度)

2. **文法的完結性を保つ**
   - 主語+述語を含む完全な節
   - 従属節は主節と一緒に

3. **自然な音読リズム**
   - 音読した際に自然な区切り
   - 息継ぎのタイミングと一致

### 避けるべきパターン

- ❌ 接続詞で分割
- ❌ 前置詞句で分割
- ❌ to不定詞句で分割
- ❌ 関係詞節で分割
- ❌ 不完全な文断片

### 推奨されるパターン

- ✅ ピリオド、セミコロンでの分割
- ✅ カンマ+接続詞での分割(文が長い場合)
- ✅ 意味的に独立した句での分割

## トラブルシューティング

### Q: スクリプトが「問題なし」と判定したが、不自然に感じる

A: スクリプトは機械的なパターン検出のみ。最終的には人間の判断が必要です。

### Q: 深刻度「低」の問題は無視してもよい?

A: 文脈によります。並列項目のカンマは、リスト的な要素なら追加を推奨。

### Q: 検査で検出されない問題がある

A: スクリプトに新しいルールを追加できます。`validate_passage.py`に新しい`check_*`メソッドを追加してください。

## まとめ

新しいパッセージを追加する際は:
1. 📝 JSONファイルを作成
2. 🔍 `validate_passage.py`で検査
3. ✏️  問題を修正
4. 🔁 再検査
5. 🏗️  ビルドテスト
6. ✅ 完了

この手順を踏むことで、常に高品質なパッセージを維持できます。
