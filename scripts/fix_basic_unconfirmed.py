#!/usr/bin/env python3
"""
(要確認)の単語を基本的な英和辞書で修正するスクリプト
"""

import json
from pathlib import Path

# 基本的な英和辞書（頻出単語）
BASIC_DICTIONARY = {
    # 動詞（過去形・進行形を含む）
    'inspired': '刺激を受けた・鼓舞された',
    'struggling': '苦労している・奮闘している',
    'organized': '組織した・整理した',
    'assured': '保証した・確信させた',
    'asking': '尋ねている・求めている',
    'offered': '提供した・申し出た',
    'improved': '改善した・向上した',
    'gathered': '集まった・収集した',
    'revealed': '明らかにした・暴露した',
    'demonstrating': '実演している・示している',
    'exclaimed': '叫んだ・大声で言った',
    'chose': '選んだ',
    'confirmed': '確認した・確定した',
    'considering': '考慮している・検討している',
    
    # 形容詞
    'actual': '実際の・現実の',
    'remarkable': '注目すべき・驚くべき',
    'quite': 'かなり・全く',
    'smaller': 'より小さい',
    'honest': '正直な',
    'honestly': '正直に',
    'middle': '中間の・真ん中の',
    'previous': '以前の・前の',
    'previously': '以前に・前もって',
    'effective': '効果的な',
    'complex': '複雑な',
    'severe': '深刻な・厳しい',
    'various': '様々な',
    'entire': '全体の・完全な',
    'recent': '最近の',
    'unique': '独特な・唯一の',
    'ancient': '古代の',
    'traditional': '伝統的な',
    'modern': '現代の',
    
    # 名詞
    'approaches': 'アプローチ・接近方法',
    'principles': '原則・主義',
    'thing': '物・事',
    'response': '反応・返答',
    'schedule': 'スケジュール・予定',
    'months': '月（複数）',
    'half': '半分',
    'effort': '努力',
    'progress': '進歩・進展',
    'skill': '技能・スキル',
    'technique': '技術・手法',
    'balance': 'バランス・均衡',
    'opportunity': '機会',
    'challenge': '挑戦・課題',
    'experience': '経験',
    'knowledge': '知識',
    'research': '研究',
    'treatment': '治療・処置',
    'evidence': '証拠',
    'rate': '率・割合',
    'data': 'データ',
    'factor': '要因',
    'impact': '影響',
    'benefit': '利益・恩恵',
    'risk': 'リスク・危険',
    'issue': '問題・課題',
    'solution': '解決策',
    'method': '方法',
    'result': '結果',
    'system': 'システム・制度',
    'process': 'プロセス・過程',
    'practice': '実践・練習',
    'relationship': '関係',
    'community': '地域社会',
    'culture': '文化',
    'tradition': '伝統',
    'generation': '世代',
    'period': '期間・時代',
    'century': '世紀',
    'decade': '10年間',
    'region': '地域',
    'area': '地域・分野',
    'population': '人口',
    
    # 副詞
    'abroad': '海外で・外国で',
    'carefully': '注意深く',
    'recently': '最近',
    'currently': '現在',
    'especially': '特に',
    'particularly': '特に',
    'significantly': '著しく・大幅に',
    'approximately': 'およそ・約',
    'nearly': 'ほぼ・もう少しで',
    'almost': 'ほとんど',
    'exactly': '正確に',
    'directly': '直接に',
    'immediately': 'すぐに',
    'gradually': '徐々に',
    'rapidly': '急速に',
    'slowly': 'ゆっくりと',
    
    # その他
    "couldn't": 'できなかった',
    "wouldn't": 'しないだろう',
    "shouldn't": 'すべきでない',
    "haven't": 'していない',
    "hasn't": 'していない',
    "hadn't": 'していなかった',
    "wasn't": 'でなかった',
    "weren't": 'でなかった',
    "isn't": 'でない',
    "aren't": 'でない',
    "don't": 'しない',
    "doesn't": 'しない',
    "didn't": 'しなかった',
}

def fix_unconfirmed_with_basic_dict(dictionary_path: Path) -> int:
    """
    基本辞書で(要確認)を修正
    """
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    fixed_count = 0
    
    for word, data in dictionary.items():
        if data.get('meaning', '') == '(要確認)':
            # 基本辞書にあるかチェック
            if word in BASIC_DICTIONARY:
                dictionary[word]['meaning'] = BASIC_DICTIONARY[word]
                fixed_count += 1
                print(f"  {word} → {BASIC_DICTIONARY[word]}")
    
    # 辞書を保存
    with open(dictionary_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    return fixed_count

def main():
    base_dir = Path(__file__).parent.parent
    dictionary_path = base_dir / 'public' / 'data' / 'dictionaries' / 'reading-passages-dictionary.json'
    
    print("(要確認)を基本辞書で修正中...")
    fixed = fix_unconfirmed_with_basic_dict(dictionary_path)
    
    print(f"\n修正完了: {fixed}個")
    
    # 残りの要確認を確認
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    remaining = sum(1 for data in dictionary.values() if data.get('meaning', '') == '(要確認)')
    print(f"残り(要確認): {remaining}個")

if __name__ == '__main__':
    main()
