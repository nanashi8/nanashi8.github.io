#!/usr/bin/env python3
"""
reading-passages-comprehensive.jsonの空白の意味を修正するスクリプト (Step 5 - Final)
残りの頻出単語（100語）の意味を一括で修正します。
"""

import json
from pathlib import Path

# 残りの頻出単語とその意味の辞書（100語）
WORD_MEANINGS_STEP5 = {
    'high': '高い',
    'piano': 'ピアノ',
    'last': '最後の',
    'did': 'した',
    'reading': '読むこと',
    'enjoy': '楽しむ',
    'animals': '動物',
    'spend': '過ごす',
    'get': '得る',
    'what': '何',
    'only': '唯一の',
    'action': '行動',
    'serious': '深刻な',
    'breathe': '呼吸する',
    'becoming': 'なること',
    'factories': '工場',
    'children': '子供',
    'especially': '特に',
    'risk': 'リスク',
    'climate': '気候',
    'sea': '海',
    'rise': '上昇する',
    'living': '生きている',
    'killing': '殺すこと',
    'habitats': '生息地',
    'single': '単一の',
    'bottles': 'ボトル',
    'bags': '袋',
    'anything': '何でも',
    'government': '政府',
    'should': 'すべき',
    'make': '作る',
    'recycle': 'リサイクルする',
    'individual': '個人の',
    'act': '行動する',
    'first': '最初の',
    'tell': '伝える',
    'second': '2番目の',
    'third': '3番目の',
    'always': '常に',
    'tired': '疲れた',
    'classroom': '教室',
    'teacher': '先生',
    'kind': '親切な',
    'making': '作ること',
    'meet': '会う',
    'club': 'クラブ',
    'member': 'メンバー',
    'friendly': '友好的な',
    'soon': 'すぐに',
    'felt': '感じた',
    'nervous': '緊張した',
    'became': 'なった',
    'comfortable': '快適な',
    'favorite': 'お気に入りの',
    'subject': '科目',
    'english': '英語',
    'math': '数学',
    'teacher': '先生',
    'always': '常に',
    'interesting': '面白い',
    'lessons': 'レッスン',
    'difficult': '難しい',
    'try': '試す',
    'hard': '一生懸命',
    'lunchtime': '昼食時間',
    'bought': '買った',
    'delicious': 'おいしい',
    'cafeteria': 'カフェテリア',
    'usually': '通常',
    'bring': '持ってくる',
    'from': 'から',
    'home': '家',
    'joined': '参加した',
    'basketball': 'バスケットボール',
    'practice': '練習',
    'weekdays': '平日',
    'teammates': 'チームメイト',
    'great': '素晴らしい',
    'coach': 'コーチ',
    'teaches': '教える',
    'teamwork': 'チームワーク',
    'important': '重要な',
    'winning': '勝つこと',
    'losing': '負けること',
    'went': '行った',
    'home': '家',
    'bus': 'バス',
    'homework': '宿題',
    'assignment': '課題',
    'finished': '終えた',
    'bath': 'お風呂',
    'dinner': '夕食',
    'parents': '両親',
    'asked': '尋ねた',
    'about': 'について',
    'told': '話した',
    'everything': 'すべて',
}

def fix_empty_meanings(input_file: Path, output_file: Path):
    """空白の意味を修正する"""
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_count = 0
    total_segments = 0
    
    for passage in data:
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                total_segments += 1
                word = segment.get('word', '')
                meaning = segment.get('meaning', '')
                word_lower = word.lower()
                
                # 意味が空白で、辞書に存在する場合
                if (not meaning or len(meaning.strip()) == 0) and word_lower in WORD_MEANINGS_STEP5:
                    segment['meaning'] = WORD_MEANINGS_STEP5[word_lower]
                    fixed_count += 1
    
    print(f"Fixed {fixed_count} meanings out of {total_segments} total segments")
    print(f"Writing to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Done!")

if __name__ == '__main__':
    input_file = Path('public/data/reading-passages-comprehensive.json')
    output_file = Path('public/data/reading-passages-comprehensive.json')
    
    fix_empty_meanings(input_file, output_file)
