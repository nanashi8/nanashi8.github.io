# 文法問題 複数正解検証・修正計画

## 📋 プロジェクト概要

**目的**: 文法問題の選択肢に複数正解が存在しないか徹底検証し、存在する場合は適切に処理する

**品質方針**:

- すべての問題を人間の目で確認
- 文法的に正しい選択肢はすべて正解として扱う
- 各正解に適切な解説を付ける
- 学習効果を最大化する

**対象データ**:

- `public/data/grammar/grammar_grade*.json`（全学年）
- 約3,000問以上の文法問題

**想定工数**: 40〜60時間（最高品質を確保するため）

---

## 🎯 Phase 1: 現状分析・データ収集（4時間）

### 目的

現在の文法問題の構造、問題タイプ、選択肢パターンを完全に理解する

### 作業内容

#### 1.1 データ構造の完全把握（1時間）

```bash
# すべての文法ファイルを分析
cd /path/to/project

# ファイル数とサイズを確認
ls -lh public/data/grammar/grammar_grade*.json

# 問題タイプの分布を確認
python3 << 'SCRIPT'
import json
import glob
from collections import Counter

grammar_files = glob.glob('public/data/grammar/grammar_grade*.json')
type_counter = Counter()
total_questions = 0

for filepath in grammar_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'questions' in data:
        for q in data['questions']:
            type_counter[q.get('type', 'unknown')] += 1
            total_questions += 1

print(f"総問題数: {total_questions}")
print("\n問題タイプ別分布:")
for qtype, count in type_counter.most_common():
    print(f"  {qtype}: {count}問")
SCRIPT
```

#### 1.2 選択肢数の分布調査（1時間）

```python
# 選択肢数のパターンを調査
# - 2択、3択、4択、5択など
# - 選択肢がない問題の特定
# - 異常に多い選択肢（バグの可能性）
```

#### 1.3 複数正解が発生しやすいパターンの特定（2時間）

```
よくある複数正解パターン:

1. 時制の問題
   例: "I ___ to school yesterday."
   → "went" も "walked" も文法的に正しい

2. 動詞の選択
   例: "She ___ a book."
   → "reads", "read", "is reading" すべて可能

3. 前置詞の問題
   例: "I arrived ___ Tokyo."
   → "at" も "in" も文脈により正しい

4. 冠詞の問題
   例: "___ apple is red."
   → "An" が正解だが、文脈により "The" も可能

5. 助動詞の問題
   例: "You ___ study hard."
   → "should", "must", "have to" すべて文脈により正しい

6. 受動態/能動態
   例: "The window ___."
   → "broke" も "was broken" も可能

7. 関係代名詞
   例: "The person ___ I met"
   → "who" も "whom" も "that" も可能
```

### 成果物

- データ構造分析レポート（Markdown）
- 問題タイプ別統計
- 複数正解リスクパターン一覧

### 品質基準

- [ ] すべてのデータファイルを確認
- [ ] 問題タイプごとの特徴を把握
- [ ] 複数正解パターンを10個以上特定

---

## 🔍 Phase 2: 自動検出システム開発（8時間）

### 目的

複数正解の可能性がある問題を自動で検出するツールを開発

### 作業内容

#### 2.1 文法ルールデータベース構築（3時間）

```python
# grammar_rules_db.py

class GrammarRuleChecker:
    """文法ルールに基づいて選択肢の妥当性をチェック"""

    def __init__(self):
        self.rules = {
            # 時制ルール
            'past_time_markers': ['yesterday', 'last', 'ago', 'in 1990'],
            'present_time_markers': ['now', 'today', 'usually', 'always'],
            'future_time_markers': ['tomorrow', 'next', 'will', 'going to'],

            # 動詞変化ルール
            'irregular_verbs': {
                'go': ['go', 'goes', 'went', 'gone', 'going'],
                'be': ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
                # ... 他の不規則動詞
            },

            # 前置詞ルール
            'preposition_rules': {
                'arrive': ['at', 'in'],  # 両方可能
                'go': ['to'],
                'depend': ['on'],
            },
        }

    def check_time_consistency(self, sentence, choice):
        """時制マーカーと選択肢の一貫性をチェック"""
        pass

    def check_verb_form(self, sentence, choice):
        """動詞の形が文法的に正しいかチェック"""
        pass

    def check_preposition(self, sentence, choice):
        """前置詞が文法的に正しいかチェック"""
        pass
```

#### 2.2 複数正解検出スクリプト作成（3時間）

```python
# detect_multiple_correct.py

import json
import glob
from typing import List, Dict, Tuple

class MultipleCorrectDetector:
    """複数正解の可能性がある問題を検出"""

    def __init__(self):
        self.grammar_checker = GrammarRuleChecker()
        self.suspicious_questions = []

    def analyze_question(self, question: Dict) -> Dict:
        """1つの問題を分析"""
        result = {
            'id': question.get('id'),
            'type': question.get('type'),
            'sentence': question.get('sentence'),
            'correctAnswer': question.get('correctAnswer'),
            'choices': question.get('choices', []),
            'suspicion_level': 0,  # 0-5
            'reasons': [],
            'alternative_correct': [],
        }

        # 選択肢を1つずつチェック
        for choice in result['choices']:
            if choice == result['correctAnswer']:
                continue

            # 文法的に正しいかチェック
            if self.is_grammatically_correct(
                result['sentence'],
                choice,
                result['correctAnswer']
            ):
                result['alternative_correct'].append(choice)
                result['suspicion_level'] += 2
                result['reasons'].append(
                    f"'{choice}' も文法的に正しい可能性"
                )

        # 時制マーカーの曖昧性チェック
        if self.has_ambiguous_time_marker(result['sentence']):
            result['suspicion_level'] += 1
            result['reasons'].append("時制マーカーが曖昧")

        # 文脈依存の可能性チェック
        if self.is_context_dependent(result['sentence']):
            result['suspicion_level'] += 1
            result['reasons'].append("文脈依存の可能性")

        return result

    def is_grammatically_correct(
        self,
        sentence: str,
        choice: str,
        correct_answer: str
    ) -> bool:
        """選択肢が文法的に正しいか判定"""

        # 動詞の原形と活用形の関係をチェック
        if self.are_related_verb_forms(choice, correct_answer):
            # 時制マーカーをチェック
            if not self.has_clear_time_marker(sentence):
                return True  # 時制が曖昧なので両方正しい可能性

        # 前置詞の代替可能性をチェック
        if choice in self.grammar_checker.rules.get('prepositions', {}):
            return True

        return False

    def generate_report(self) -> str:
        """検出結果のレポートを生成"""
        report = "# 複数正解の可能性がある問題一覧\n\n"

        # 疑惑レベル別にソート
        sorted_questions = sorted(
            self.suspicious_questions,
            key=lambda x: x['suspicion_level'],
            reverse=True
        )

        for q in sorted_questions:
            if q['suspicion_level'] > 0:
                report += f"## {q['id']} (疑惑レベル: {q['suspicion_level']})\n\n"
                report += f"**文**: {q['sentence']}\n\n"
                report += f"**正解**: {q['correctAnswer']}\n\n"
                report += f"**選択肢**: {', '.join(q['choices'])}\n\n"

                if q['alternative_correct']:
                    report += f"**代替正解候補**: {', '.join(q['alternative_correct'])}\n\n"

                report += "**理由**:\n"
                for reason in q['reasons']:
                    report += f"- {reason}\n"
                report += "\n---\n\n"

        return report

# メイン処理
if __name__ == '__main__':
    detector = MultipleCorrectDetector()

    grammar_files = glob.glob('public/data/grammar/grammar_grade*.json')

    for filepath in grammar_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if 'questions' in data:
            for question in data['questions']:
                result = detector.analyze_question(question)
                if result['suspicion_level'] > 0:
                    detector.suspicious_questions.append(result)

    # レポート生成
    report = detector.generate_report()
    with open('docs/reports/multiple-correct-detection-report.md', 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"検出完了: {len(detector.suspicious_questions)}問に疑惑あり")
```

#### 2.3 英文法AI支援ツール統合（2時間）

```python
# 外部APIを使った文法チェック（オプション）
# - LanguageTool API
# - Grammarly API
# - OpenAI API（GPT-4による文法チェック）

def check_with_ai(sentence: str, choices: List[str]) -> Dict:
    """AIを使って各選択肢の文法的正しさを判定"""
    # GPT-4に問い合わせ
    prompt = f"""
以下の英文の空欄に入る選択肢を評価してください。
文法的に正しい選択肢をすべて挙げ、それぞれの妥当性を説明してください。

文: {sentence}
選択肢: {', '.join(choices)}

各選択肢について:
1. 文法的に正しいか（Yes/No）
2. 正しい場合、どのような文脈で正しいか
3. 間違っている場合、どこが間違っているか
"""
    # API呼び出し
    # ...
```

### 成果物

- `scripts/detect_multiple_correct.py`（複数正解検出ツール）
- `scripts/grammar_rules_db.py`（文法ルールDB）
- `docs/reports/multiple-correct-detection-report.md`（自動検出レポート）

### 品質基準

- [ ] 検出精度70%以上（偽陽性を許容）
- [ ] すべての問題タイプに対応
- [ ] 実行時間10分以内

---

## 👁️ Phase 3: 手動レビュー（20時間）

### 目的

自動検出結果を人間の目で確認し、本当に複数正解かを判定

### 作業内容

#### 3.1 レビュー基準の策定（1時間）

```markdown
## レビュー判定基準

### A: 明確に複数正解

- 文法的に両方とも完全に正しい
- 文脈がなくても両方正しい
- → 対応: 両方を正解として扱う

### B: 文脈依存で複数正解

- 文脈があれば片方が正しい
- 文脈が不明瞭なので両方正しい可能性
- → 対応: 文脈を明確にするか、両方正解扱い

### C: ニュアンスの違いのみ

- 文法的には両方正しいが、意味が異なる
- → 対応: 問題文を修正してニュアンスを明確に

### D: 片方のみ正解（検出誤り）

- よく見ると片方だけが正しい
- → 対応: 現状維持、または選択肢を修正

### E: すべて不正解（データエラー）

- 正解とされている選択肢も実は間違い
- → 対応: 緊急修正
```

#### 3.2 疑惑レベル別レビュー（15時間）

```bash
# レビュー順序（優先度順）

1. 疑惑レベル5（最高）: 約50問想定 → 2時間
   - ほぼ確実に複数正解
   - 最優先で確認

2. 疑惑レベル4: 約100問想定 → 4時間
   - 複数正解の可能性が高い

3. 疑惑レベル3: 約200問想定 → 6時間
   - 複数正解の可能性あり

4. 疑惑レベル2: 約300問想定 → 3時間
   - 念のため確認

5. 疑惑レベル1（低）: スキップ可能
   - 偽陽性の可能性が高い
```

#### 3.3 レビューシート作成（1時間）

```csv
# review_sheet.csv
問題ID,ファイル名,疑惑レベル,文,正解,選択肢,判定,代替正解,修正方針,レビュアー,日時

例:
g3u0_010,grammar_grade3_unit0.json,4,"They ___ a good time at the party yesterday.",had,"had,have,haved",A,have,"両方正解として扱う。解説に「have」も文脈により正しいことを追記",reviewer1,2025-12-21
```

#### 3.4 専門家レビュー（3時間）

```
レビュアー構成:
- 英語教師 or 英語ネイティブ: 1名以上
- 日本人英語学習者視点: 1名以上
- ダブルチェック体制
```

### 成果物

- `docs/reports/manual-review-sheet.csv`（レビュー結果）
- `docs/reports/multiple-correct-confirmed-list.md`（確定リスト）
- `docs/reports/false-positive-list.md`（偽陽性リスト）

### 品質基準

- [ ] 疑惑レベル3以上はすべて確認
- [ ] ダブルチェック実施
- [ ] 判定理由を明記

---

## 🔧 Phase 4: データ修正実装（6時間）

### 目的

複数正解と判定された問題に対して適切な修正を実施

### 作業内容

#### 4.1 修正パターンの分類（1時間）

```
修正パターン:

Pattern A: 複数正解として扱う
  → correctAnswers配列を実装（単数形から複数形へ）

Pattern B: 文脈を明確にして単一正解に
  → 問題文を修正

Pattern C: 選択肢を変更して複数正解を回避
  → 明らかに間違っている選択肢に変更

Pattern D: 問題自体を削除
  → 修正不可能な場合（稀）
```

#### 4.2 データスキーマ拡張（2時間）

```typescript
// 従来のスキーマ
interface GrammarQuestion {
  id: string;
  type: string;
  sentence: string;
  correctAnswer: string; // 単数形
  choices: string[];
  explanation: string;
}

// 新しいスキーマ
interface GrammarQuestionV2 {
  id: string;
  type: string;
  sentence: string;

  // 複数正解対応
  correctAnswer?: string; // 後方互換性のため残す
  correctAnswers?: string[]; // 複数正解の場合

  choices: string[];

  // 解説も複数対応
  explanation?: string; // 汎用解説
  explanations?: {
    [answer: string]: string; // 各正解に対する個別解説
  };

  // メタ情報
  hasMultipleCorrect?: boolean;
  lastReviewed?: string; // ISO日付
  reviewedBy?: string;
}
```

#### 4.3 修正スクリプト作成（2時間）

```python
# apply_corrections.py

import json
import csv

def apply_corrections(review_sheet_path: str):
    """レビュー結果に基づいてデータを修正"""

    # レビューシートを読み込み
    corrections = []
    with open(review_sheet_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['判定'] in ['A', 'B']:  # 複数正解
                corrections.append(row)

    # ファイルごとに修正を適用
    files_to_update = {}
    for correction in corrections:
        filename = correction['ファイル名']
        if filename not in files_to_update:
            files_to_update[filename] = []
        files_to_update[filename].append(correction)

    for filename, corrections in files_to_update.items():
        filepath = f'public/data/grammar/{filename}'

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 各問題を修正
        for question in data['questions']:
            for correction in corrections:
                if question['id'] == correction['問題ID']:
                    # 複数正解に変更
                    if correction['代替正解']:
                        question['correctAnswers'] = [
                            question['correctAnswer'],
                            correction['代替正解']
                        ]
                        question['hasMultipleCorrect'] = True

                        # 解説を追加
                        base_explanation = question.get('explanation', '')
                        additional_explanation = f"\n\n補足: 「{correction['代替正解']}」も正解です。{correction['修正方針']}"
                        question['explanation'] = base_explanation + additional_explanation

                        # メタ情報
                        question['lastReviewed'] = correction['日時']
                        question['reviewedBy'] = correction['レビュアー']

        # ファイルを保存
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"✅ {filename}: {len(corrections)}問を修正")

if __name__ == '__main__':
    apply_corrections('docs/reports/manual-review-sheet.csv')
```

#### 4.4 バックアップ作成（30分）

```bash
# 修正前に必ずバックアップ
cd public/data/grammar
mkdir -p ../../../backups/grammar_$(date +%Y%m%d_%H%M%S)
cp *.json ../../../backups/grammar_$(date +%Y%m%d_%H%M%S)/
```

### 成果物

- `scripts/apply_corrections.py`（修正適用スクリプト）
- 修正されたJSONファイル
- バックアップデータ

### 品質基準

- [ ] バックアップ作成必須
- [ ] 修正前後のdiff確認
- [ ] 修正漏れゼロ

---

## ✅ Phase 5: フロントエンド対応（4時間）

### 目的

複数正解に対応したUIとロジックを実装

### 作業内容

#### 5.1 複数正解判定ロジック実装（2時間）

```typescript
// src/utils/grammarQuizUtils.ts

export function isAnswerCorrect(userAnswer: string, question: GrammarQuestionV2): boolean {
  // 複数正解対応
  if (question.correctAnswers && question.correctAnswers.length > 0) {
    return question.correctAnswers.some(
      (answer) => answer.toLowerCase() === userAnswer.toLowerCase()
    );
  }

  // 従来の単一正解
  return question.correctAnswer?.toLowerCase() === userAnswer.toLowerCase();
}

export function getExplanationForAnswer(userAnswer: string, question: GrammarQuestionV2): string {
  // 個別解説がある場合
  if (question.explanations && question.explanations[userAnswer]) {
    return question.explanations[userAnswer];
  }

  // 汎用解説
  return question.explanation || '';
}
```

#### 5.2 UI表示の改善（1時間）

```tsx
// src/components/GrammarQuizView.tsx

// 複数正解の場合の表示
{
  question.hasMultipleCorrect && (
    <div className="multiple-correct-badge">ℹ️ この問題には複数の正解があります</div>
  );
}

// 解説表示
<div className="explanation">
  {getExplanationForAnswer(userAnswer, question)}

  {question.hasMultipleCorrect && (
    <div className="alternative-answers">
      <h4>他の正解:</h4>
      <ul>
        {question.correctAnswers
          ?.filter((a) => a !== userAnswer)
          .map((answer) => (
            <li key={answer}>{answer}</li>
          ))}
      </ul>
    </div>
  )}
</div>;
```

#### 5.3 進捗管理の調整（1時間）

```typescript
// 複数正解の場合、どれか1つでも正解なら記録
const isCorrect = isAnswerCorrect(userAnswer, question);

await updateWordProgress(questionId, isCorrect, responseTime, undefined, 'grammar');
```

### 成果物

- `src/utils/grammarQuizUtils.ts`（修正版）
- `src/components/GrammarQuizView.tsx`（修正版）
- UIコンポーネント（バッジ等）

### 品質基準

- [ ] 後方互換性を保つ
- [ ] 複数正解でも正しく進捗記録
- [ ] UI表示が分かりやすい

---

## 🧪 Phase 6: 総合テスト（8時間）

### 目的

修正したデータとコードが正しく動作することを検証

### 作業内容

#### 6.1 データ整合性テスト（2時間）

```python
# test_data_integrity.py

def test_multiple_correct_integrity():
    """複数正解データの整合性をテスト"""

    grammar_files = glob.glob('public/data/grammar/grammar_grade*.json')
    errors = []

    for filepath in grammar_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for question in data['questions']:
            # 複数正解の場合のチェック
            if question.get('hasMultipleCorrect'):
                # correctAnswersが存在するか
                if 'correctAnswers' not in question:
                    errors.append(f"{question['id']}: hasMultipleCorrect=True だが correctAnswers がない")

                # correctAnswersが2つ以上か
                elif len(question.get('correctAnswers', [])) < 2:
                    errors.append(f"{question['id']}: correctAnswers が2つ未満")

                # すべての correctAnswers が choices に含まれるか
                for answer in question.get('correctAnswers', []):
                    if answer not in question.get('choices', []):
                        errors.append(f"{question['id']}: correctAnswer '{answer}' が choices にない")

                # 解説が更新されているか
                if '補足' not in question.get('explanation', ''):
                    errors.append(f"{question['id']}: 複数正解だが解説が更新されていない")

    if errors:
        print("❌ データ整合性エラー:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print("✅ データ整合性テスト: PASS")
        return True
```

#### 6.2 ユニットテスト（2時間）

```typescript
// tests/grammarQuizUtils.test.ts

describe('複数正解判定', () => {
  test('単一正解の場合', () => {
    const question = {
      id: 'test1',
      correctAnswer: 'went',
      choices: ['go', 'went', 'gone'],
    };

    expect(isAnswerCorrect('went', question)).toBe(true);
    expect(isAnswerCorrect('go', question)).toBe(false);
  });

  test('複数正解の場合', () => {
    const question = {
      id: 'test2',
      correctAnswers: ['went', 'walked'],
      hasMultipleCorrect: true,
      choices: ['go', 'went', 'walked', 'gone'],
    };

    expect(isAnswerCorrect('went', question)).toBe(true);
    expect(isAnswerCorrect('walked', question)).toBe(true);
    expect(isAnswerCorrect('go', question)).toBe(false);
  });
});
```

#### 6.3 統合テスト（2時間）

```bash
# 実際のブラウザで動作確認

テストシナリオ:
1. 複数正解問題を出題
2. 正解Aを選択 → 正解と判定されるか
3. 次の問題へ
4. 同じ問題を再度出題
5. 正解Bを選択 → 正解と判定されるか
6. 解説に両方の正解が表示されるか
7. 進捗データが正しく記録されるか
```

#### 6.4 手動テスト（2時間）

```
テスト項目:
- [ ] 複数正解問題が正しく表示される
- [ ] どの正解を選んでも正解扱いになる
- [ ] 解説が適切に表示される
- [ ] 他の正解が表示される
- [ ] 進捗が正しく記録される
- [ ] 単一正解問題も正常に動作する（後方互換性）
- [ ] パフォーマンスが劣化していない
- [ ] UIが分かりやすい
```

### 成果物

- `tests/grammarQuizUtils.test.ts`（テストコード）
- `scripts/test_data_integrity.py`（データ検証）
- `docs/reports/test-results.md`（テスト結果レポート）

### 品質基準

- [ ] すべてのテストがパス
- [ ] カバレッジ80%以上
- [ ] 手動テストで問題なし

---

## 📚 Phase 7: ドキュメント整備（4時間）

### 目的

変更内容を記録し、今後のメンテナンスを容易にする

### 作業内容

#### 7.1 仕様書更新（1時間）

```markdown
# docs/specifications/grammar-question-format.md

## 複数正解対応仕様

### データ構造

...

### 判定ロジック

...

### UI表示

...
```

#### 7.2 CHANGELOG更新（30分）

```markdown
# CHANGELOG.md

## [1.5.0] - 2025-12-22

### Added

- 文法問題の複数正解対応機能
- 複数正解検出ツール（scripts/detect_multiple_correct.py）
- 複数正解表示UI

### Changed

- GrammarQuestionスキーマを拡張（correctAnswers追加）
- isAnswerCorrect関数を複数正解対応に修正
- 解説表示ロジックを改善

### Fixed

- 123問の複数正解問題を修正
- 文脈が曖昧だった45問の問題文を明確化
```

#### 7.3 メンテナンスガイド作成（1時間30分）

```markdown
# docs/maintenance/grammar-multiple-correct-maintenance.md

## 複数正解問題のメンテナンス

### 新規追加時の注意点

...

### 定期レビュー方法

...

### トラブルシューティング

...
```

#### 7.4 レビュー結果アーカイブ（1時間）

```bash
# レビュー関連ファイルを整理してアーカイブ
mkdir -p docs/archive/grammar-review-2025-12
mv docs/reports/multiple-correct-*.md docs/archive/grammar-review-2025-12/
mv docs/reports/manual-review-sheet.csv docs/archive/grammar-review-2025-12/
```

### 成果物

- `docs/specifications/grammar-question-format.md`（更新版）
- `CHANGELOG.md`（更新版）
- `docs/maintenance/grammar-multiple-correct-maintenance.md`（新規）
- アーカイブフォルダ

### 品質基準

- [ ] すべてのドキュメントが最新
- [ ] 次回のメンテナンスに必要な情報がすべて記載
- [ ] レビュー結果がアーカイブされている

---

## 📊 Phase 8: 最終検証・リリース（6時間）

### 目的

本番環境へのリリース前の最終確認

### 作業内容

#### 8.1 品質メトリクス測定（1時間）

```python
# 品質指標を測定

メトリクス:
1. 複数正解対応率
   - 対応済み問題数 / 複数正解と判定された問題数

2. 解説充実度
   - 解説が更新された問題数 / 複数正解問題数

3. テストカバレッジ
   - 複数正解関連コードのカバレッジ率

4. レビュー完了率
   - レビューされた問題数 / 検出された問題数

目標:
- 複数正解対応率: 100%
- 解説充実度: 100%
- テストカバレッジ: 80%以上
- レビュー完了率: 100%
```

#### 8.2 パフォーマンステスト（1時間）

```bash
# ページ読み込み時間
# 問題表示速度
# 判定処理速度

目標:
- ページ読み込み: 2秒以内
- 問題表示: 100ms以内
- 判定処理: 50ms以内
```

#### 8.3 クロスブラウザテスト（2時間）

```
テスト対象:
- Chrome（最新版）
- Safari（最新版）
- Firefox（最新版）
- Edge（最新版）
- iOS Safari
- Android Chrome

確認項目:
- [ ] 複数正解が正しく判定される
- [ ] UIが正しく表示される
- [ ] パフォーマンスが良好
```

#### 8.4 リリース準備（2時間）

```bash
# 1. 最終コミット
git add .
git commit -m "feat: 複数正解対応機能を実装"

# 2. タグ付け
git tag -a v1.5.0 -m "複数正解対応リリース"

# 3. プッシュ
git push origin main
git push origin v1.5.0

# 4. リリースノート作成
# GitHub Releasesに詳細を記載

# 5. デプロイ
npm run build
# デプロイコマンド実行
```

### 成果物

- 品質メトリクスレポート
- パフォーマンステストレポート
- クロスブラウザテスト結果
- リリースノート

### 品質基準

- [ ] すべてのメトリクスが目標達成
- [ ] すべてのブラウザで動作確認
- [ ] リリースノートが完成

---

## 📅 タイムライン

### 全体スケジュール（最高品質想定）

```
Week 1: Phase 1-2（現状分析・自動検出）
├─ Day 1: Phase 1（現状分析）
├─ Day 2-3: Phase 2（自動検出システム開発）
└─ Day 3: Phase 2 完了、レポート生成

Week 2: Phase 3（手動レビュー）
├─ Day 1: レビュー基準策定、レビュー開始
├─ Day 2-3: 疑惑レベル5-4のレビュー
├─ Day 4-5: 疑惑レベル3-2のレビュー
└─ Weekend: 専門家レビュー

Week 3: Phase 4-5（実装）
├─ Day 1-2: Phase 4（データ修正）
├─ Day 3: Phase 5（フロントエンド対応）
└─ Day 4-5: 中間テスト

Week 4: Phase 6-8（テスト・リリース）
├─ Day 1-2: Phase 6（総合テスト）
├─ Day 3: Phase 7（ドキュメント整備）
├─ Day 4: Phase 8（最終検証）
└─ Day 5: リリース
```

### マイルストーン

- **M1**: Phase 2完了（自動検出完了）- Week 1 終了時
- **M2**: Phase 3完了（手動レビュー完了）- Week 2 終了時
- **M3**: Phase 5完了（実装完了）- Week 3 終了時
- **M4**: Phase 8完了（リリース）- Week 4 終了時

---

## 💰 リソース要件

### 人的リソース

- メイン担当者: 1名（プログラマー/データサイエンティスト）
- 英語専門家: 1名（パートタイム、レビュー時のみ）
- QAテスター: 1名（パートタイム、テスト時のみ）

### 技術リソース

- Python 3.8+
- Node.js 18+
- テスト用ブラウザ環境
- （オプション）AI API（GPT-4等）

### 時間リソース

- **最高品質想定**: 40-60時間
- **標準品質想定**: 30-40時間
- **最低品質想定**: 20-30時間（非推奨）

---

## ⚠️ リスクと対策

### リスク1: レビュー工数の増大

**対策**: 疑惑レベルでトリアージ、AIツールで効率化

### リスク2: 複数正解の判定が曖昧

**対策**: 専門家レビューの実施、判定基準の明確化

### リスク3: フロントエンド実装の遅延

**対策**: 後方互換性を保つ、段階的リリース

### リスク4: パフォーマンス劣化

**対策**: パフォーマンステストの徹底、最適化

---

## ✅ 成功基準

### 必須基準

- [ ] 疑惑レベル3以上の問題をすべてレビュー
- [ ] 複数正解と判定された問題すべてに対応
- [ ] すべてのテストがパス
- [ ] ドキュメントが完備

### 理想基準

- [ ] 疑惑レベル2以上の問題をすべてレビュー
- [ ] 解説が充実している
- [ ] UIが直感的
- [ ] パフォーマンスが向上

### 最高基準

- [ ] すべての問題をレビュー
- [ ] AI支援ツールによる継続的モニタリング
- [ ] 自動テストが充実
- [ ] メンテナンスガイドが詳細

---

## 📖 参考資料

### 英文法リファレンス

- 『ロイヤル英文法』
- 『一億人の英文法』
- Cambridge Grammar of English
- Oxford English Grammar

### ツール・API

- LanguageTool API
- Grammarly API（有料）
- OpenAI API（GPT-4）

### 社内ドキュメント

- [学習AIシステム アーキテクチャ仕様書](../specifications/LEARNING_AI_SYSTEM_ARCHITECTURE.md)
- [学習コンテンツ品質保証ガード](../../.aitk/instructions/learning-content-quality-guard.instructions.md)

---

**この計画に従うことで、最高品質の文法問題データを実現します。**
