#!/usr/bin/env python3
"""
文法ファイルの不足項目を分析するスクリプト
"""

import json
from pathlib import Path
from collections import Counter, defaultdict

def analyze_grammar_files():
    grammar_dir = Path("public/data/grammar")
    files = sorted(grammar_dir.glob("grammar_grade*.json"))
    
    print("="*80)
    print("文法ファイル分析: 不足している知識・問題タイプの特定")
    print("="*80)
    
    # 1. 各ユニットの基本情報
    print("\n【1】各ユニットの概要\n")
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        grade = filepath.stem.replace('grammar_', '')
        title = data.get('title', '')
        grammar = data.get('grammar', '')
        total = data.get('totalQuestions', 0)
        
        print(f"{grade:20s} {title:20s} {total:3d}問 - {grammar}")
    
    # 2. 問題タイプの使用状況
    print("\n" + "="*80)
    print("【2】問題タイプの使用状況\n")
    
    type_counts = defaultdict(int)
    missing_types_by_file = {}
    
    standard_types = {'fillInBlank', 'sentenceOrdering', 'paraphrase', 'verbForm', 'conversation'}
    
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        questions = data.get('questions', [])
        types_in_file = set(q.get('type') for q in questions)
        missing = standard_types - types_in_file
        
        if missing:
            missing_types_by_file[filepath.name] = missing
        
        for q in questions:
            qtype = q.get('type')
            type_counts[qtype] += 1
    
    print("全体の問題タイプ別集計:")
    for qtype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {qtype:20s}: {count:4d}問")
    
    if missing_types_by_file:
        print("\n未使用の問題タイプがあるファイル:")
        for filename, missing in sorted(missing_types_by_file.items()):
            print(f"  {filename:30s}: 未使用 → {', '.join(sorted(missing))}")
    
    # 3. 文法項目ごとの詳細分析
    print("\n" + "="*80)
    print("【3】不足している可能性のある文法・語彙項目\n")
    
    # Grade 1の分析
    print("■ Grade 1 (中学1年)")
    grade1_gaps = {
        "unit0 (be動詞)": ["There is/are構文の基礎", "所有格(my/your/his/her)との組み合わせ"],
        "unit1 (一般動詞)": ["頻度の副詞(always/usually/sometimes)", "曜日・時刻表現"],
        "unit2 (三人称単数)": ["doesn'tの短縮形", "疑問詞+does構文"],
        "unit3 (複数形)": ["不規則複数形(child→children)", "How many構文"],
        "unit4 (疑問詞)": ["whose構文", "which構文", "How+形容詞構文"],
        "unit5 (can)": ["canの過去形could", "be able to"],
        "unit6 (現在進行形)": ["近い未来を表す現在進行形", "状態動詞(know/like等)との違い"],
        "unit7 (命令文)": ["Please~", "Never~", "Be動詞の命令形"],
        "unit8 (過去形規則)": ["時を表す前置詞(at/in/on)", "ago表現"],
        "unit9 (過去形不規則)": ["不規則動詞の完全リスト練習", "疑問詞+did構文"],
    }
    
    for unit, gaps in grade1_gaps.items():
        print(f"\n  {unit}:")
        for gap in gaps:
            print(f"    - {gap}")
    
    # Grade 2の分析
    print("\n■ Grade 2 (中学2年)")
    grade2_gaps = {
        "unit0 (be動詞過去)": ["There was/were構文", "過去の天気・気候表現"],
        "unit1 (過去進行形)": ["when節との組み合わせ", "while構文"],
        "unit2 (未来)": ["時・条件を表す副詞節(現在形)", "未来進行形"],
        "unit3 (must/have to)": ["must/have toの違い", "don't have to vs must not"],
        "unit4 (不定詞)": ["ask/tell/want+人+to", "It is~for...to", "疑問詞+to"],
        "unit5 (動名詞)": ["enjoy/finish/stop等", "前置詞+動名詞"],
        "unit6 (接続詞)": ["so~that構文", "though/although", "not only~but also"],
        "unit7 (比較)": ["as~as構文", "not as~as", "the+比較級, the+比較級"],
        "unit8 (There is/are)": ["There will be", "There used to be"],
        "unit9 (受動態)": ["by以外の前置詞(with/in/at)", "受動態の疑問文・否定文完全版"],
    }
    
    for unit, gaps in grade2_gaps.items():
        print(f"\n  {unit}:")
        for gap in gaps:
            print(f"    - {gap}")
    
    # Grade 3の分析
    print("\n■ Grade 3 (中学3年)")
    grade3_gaps = {
        "unit0 (受動態)": ["助動詞+be+過去分詞", "SVOO/SVOCの受動態"],
        "unit1 (現在完了)": ["just/already/yet/ever/never完全版", "How long構文"],
        "unit2 (現在完了進行)": ["since/for完全版", "現在完了との使い分け"],
        "unit3 (関係代名詞)": ["関係代名詞の省略", "前置詞+関係代名詞", "whose"],
        "unit4 (不定詞応用)": ["It is~that強調構文", "too~to", "enough to", "形容詞的用法完全版"],
        "unit5 (動名詞)": ["動名詞vs不定詞(forget/remember/try等)", "慣用表現"],
        "unit6 (分詞)": ["分詞構文", "感情を表す分詞(interesting/interested)"],
        "unit7 (仮定法)": ["I wish構文", "as if構文", "仮定法未来(should)"],
        "unit8 (間接疑問文)": ["if/whether", "Do you know構文", "間接疑問文の語順完全版"],
        "unit9 (比較)": ["one of the+最上級", "比較級+and+比較級", "the last+名詞"],
    }
    
    for unit, gaps in grade3_gaps.items():
        print(f"\n  {unit}:")
        for gap in gaps:
            print(f"    - {gap}")
    
    # 4. 重要構文の実装状況
    print("\n" + "="*80)
    print("【4】重要構文の実装状況チェック\n")
    
    important_patterns = {
        "It is ~ that (強調)": False,
        "so ~ that": False,
        "too ~ to": False,
        "enough to": False,
        "ask/tell ~ to": False,
        "It is ~ for ... to": False,
        "not only ~ but also": False,
        "both ~ and": False,
        "either ~ or": False,
        "neither ~ nor": False,
        "would like to": False,
        "used to": False,
        "as ~ as (同等比較)": False,
        "make/let/have ~ do": False,
        "see/hear ~ do/doing": False,
        "There is/are (存在)": False,
        "疑問詞+to": False,
        "関係代名詞省略": False,
        "間接疑問文if/whether": False,
        "現在完了継続+How long": False,
    }
    
    # 各ファイルをチェック
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        content = json.dumps(data, ensure_ascii=False)
        
        if "so" in content and "that" in content:
            important_patterns["so ~ that"] = True
        if "too" in content and "to" in content:
            important_patterns["too ~ to"] = True
        if "enough" in content and "to" in content:
            important_patterns["enough to"] = True
        if "ask" in content or "tell" in content:
            important_patterns["ask/tell ~ to"] = True
        if "There" in content and ("is" in content or "are" in content):
            important_patterns["There is/are (存在)"] = True
        if "as" in content and "比較" in content:
            important_patterns["as ~ as (同等比較)"] = True
        if "would like" in content:
            important_patterns["would like to"] = True
        if "used to" in content:
            important_patterns["used to"] = True
    
    print("重要構文の実装状況:")
    implemented = []
    not_implemented = []
    
    for pattern, status in important_patterns.items():
        if status:
            implemented.append(pattern)
        else:
            not_implemented.append(pattern)
    
    print(f"\n✅ 実装済み({len(implemented)}個):")
    for p in implemented:
        print(f"  - {p}")
    
    print(f"\n❌ 未実装({len(not_implemented)}個):")
    for p in not_implemented:
        print(f"  - {p}")
    
    # 5. 推奨される追加内容
    print("\n" + "="*80)
    print("【5】推奨される追加実装項目\n")
    
    recommendations = [
        ("最優先", [
            "Grade 2 Unit 4: ask/tell/want+人+to構文 (15問)",
            "Grade 2 Unit 6: so~that構文 (10問)",
            "Grade 2 Unit 7: as~as同等比較 (10問)",
            "Grade 3 Unit 4: too~to構文 (10問)",
            "Grade 3 Unit 4: enough to構文 (10問)",
            "Grade 3 Unit 4: It is~for...to構文 (10問)",
        ]),
        ("高優先", [
            "Grade 1 Unit 3: How many構文 (5問)",
            "Grade 1 Unit 4: How+形容詞構文 (5問)",
            "Grade 2 Unit 2: 時・条件副詞節の未来 (5問)",
            "Grade 2 Unit 6: not only~but also (5問)",
            "Grade 2 Unit 7: the+比較級, the+比較級 (5問)",
            "Grade 3 Unit 1: How long構文 (10問)",
            "Grade 3 Unit 3: 関係代名詞の省略 (10問)",
            "Grade 3 Unit 8: if/whether間接疑問 (10問)",
        ]),
        ("中優先", [
            "Grade 1各Unit: 頻度副詞の追加 (各5問)",
            "Grade 2 Unit 1: when/while節 (10問)",
            "Grade 2 Unit 3: must/have toの違い (10問)",
            "Grade 3 Unit 5: 動名詞vs不定詞 (10問)",
            "Grade 3 Unit 6: 感情分詞 (10問)",
            "Grade 3 Unit 9: one of the最上級 (10問)",
        ]),
    ]
    
    for priority, items in recommendations:
        print(f"\n【{priority}】")
        for item in items:
            print(f"  - {item}")
    
    print("\n" + "="*80)
    print("分析完了")
    print("="*80)

if __name__ == "__main__":
    analyze_grammar_files()
