#!/usr/bin/env python3
"""
解説に類似構文・類似単語の情報を追加するスクリプト
"""
import json
from pathlib import Path

# 基準ディレクトリ
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "public" / "data" / "grammar"

def enhance_it_takes_explanations():
    """It takes構文の解説を充実(spend, costとの関連を追加)"""
    file_path = DATA_DIR / "grammar_grade2_unit4.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # It takes構文の問題の解説を強化
    for q in data['questions']:
        if q['id'].startswith('g2-u4-takes-'):
            old_exp = q['explanation']
            # 既に類似構文が含まれている場合はスキップ
            if 'spend' in old_exp or 'cost' in old_exp:
                continue
            # 類似構文の情報を追加
            q['explanation'] = old_exp + " 類似:spend(人が主語), cost(物が主語)も時間・お金の構文を作る。"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ It takes構文の解説を充実しました")

def enhance_spend_explanations():
    """spend構文の解説を充実(It takes, costとの関連を追加)"""
    file_path = DATA_DIR / "grammar_grade2_unit4.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for q in data['questions']:
        if q['id'].startswith('g2-u4-spend-'):
            old_exp = q['explanation']
            if 'It takes' in old_exp or 'cost' in old_exp:
                continue
            q['explanation'] = old_exp + " 類似:It takes(形式主語), cost(物が主語)も時間・お金の構文を作る。"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ spend構文の解説を充実しました")

def enhance_cost_explanations():
    """cost構文の解説を充実(It takes, spendとの関連を追加)"""
    file_path = DATA_DIR / "grammar_grade2_unit4.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for q in data['questions']:
        if q['id'].startswith('g2-u4-cost-'):
            old_exp = q['explanation']
            if 'It takes' in old_exp or 'spend' in old_exp:
                continue
            q['explanation'] = old_exp + " 類似:It takes(形式主語), spend(人が主語)も時間・お金の構文を作る。"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ cost構文の解説を充実しました")

def enhance_svoc_explanations():
    """SVOC構文の解説を充実(他の動詞例を追加)"""
    file_path = DATA_DIR / "grammar_grade3_unit9.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for q in data['questions']:
        if q['id'].startswith('g3-u9-call-'):
            old_exp = q['explanation']
            if 'name' in old_exp or 'consider' in old_exp:
                continue
            q['explanation'] = old_exp + " 類似:name, considerなどもSVOC構文を作る。"
        elif q['id'].startswith('g3-u9-make-'):
            old_exp = q['explanation']
            if 'leave' in old_exp or 'keep' in old_exp:
                continue
            q['explanation'] = old_exp + " 類似:leave, keepなどもSVOC構文を作る。"
        elif q['id'].startswith('g3-u9-keep-'):
            old_exp = q['explanation']
            if 'make' in old_exp or 'leave' in old_exp:
                continue
            q['explanation'] = old_exp + " 類似:make, leaveなどもSVOC構文を作る。"
        elif q['id'].startswith('g3-u9-find-'):
            old_exp = q['explanation']
            if 'think' in old_exp or 'consider' in old_exp:
                continue
            q['explanation'] = old_exp + " 類似:think, considerなどもSVOC構文を作る。"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ SVOC構文の解説を充実しました")

def enhance_emotion_participles_explanations():
    """感情分詞の解説を充実(他の感情動詞例を追加)"""
    file_path = DATA_DIR / "grammar_grade3_unit6.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    emotion_verbs_examples = "例:excited/exciting, interested/interesting, bored/boring, surprised/surprising, tired/tiring, amazed/amazing, disappointed/disappointing, confused/confusingなど。"
    
    for q in data['questions']:
        if q['id'].startswith('g3-u6-emotion-'):
            old_exp = q['explanation']
            # 既に他の感情動詞が含まれている場合はスキップ
            if 'amazed' in old_exp or '例:' in old_exp:
                continue
            q['explanation'] = old_exp + " " + emotion_verbs_examples
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ 感情分詞の解説を充実しました")

def enhance_comparative_explanations():
    """比較級構文の解説を充実(他の重要構文を追加)"""
    file_path = DATA_DIR / "grammar_grade2_unit7.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for q in data['questions']:
        if q['id'].startswith('g2-u7-comp-and-'):
            old_exp = q['explanation']
            if 'no other' in old_exp or 'as...as' in old_exp:
                continue
            q['explanation'] = old_exp + " 他の重要構文:the 比較級 the 比較級, no other...as...as, one of the 最上級など。"
        elif q['id'].startswith('g2-u7-the-comp-'):
            old_exp = q['explanation']
            if 'no other' in old_exp or '比較級 and 比較級' in old_exp:
                continue
            q['explanation'] = old_exp + " 他の重要構文:比較級 and 比較級, no other...as...as, one of the 最上級など。"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ 比較級構文の解説を充実しました")

def enhance_prep_gerund_explanations():
    """前置詞+動名詞の解説を充実(類似表現を追加)"""
    file_path = DATA_DIR / "grammar_grade3_unit5.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    prep_gerund_examples = "他の前置詞+動名詞:be good at doing, be afraid of doing, instead of doing, How about doing?, What about doing?など。"
    
    for q in data['questions']:
        if q['id'].startswith('g3-u5-prep-'):
            old_exp = q['explanation']
            # 既に他の表現が含まれている場合はスキップ
            if 'be good at' in old_exp or '他の前置詞' in old_exp:
                continue
            q['explanation'] = old_exp + " " + prep_gerund_examples
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ 前置詞+動名詞の解説を充実しました")

if __name__ == "__main__":
    print("=== 解説の充実化を開始 ===\n")
    
    # Task 1: It takes/spend/cost構文
    enhance_it_takes_explanations()
    enhance_spend_explanations()
    enhance_cost_explanations()
    
    # Task 2: SVOC構文
    enhance_svoc_explanations()
    
    # Task 3: 感情分詞
    enhance_emotion_participles_explanations()
    
    # Task 4: 比較級構文
    enhance_comparative_explanations()
    
    # Task 5: 前置詞+動名詞
    enhance_prep_gerund_explanations()
    
    print("\n=== すべての解説を充実化完了 ===")
