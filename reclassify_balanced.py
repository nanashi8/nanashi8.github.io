#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高校受験英単語のカテゴリー再分類スクリプト（テーマ別均等配分型）

目標: 各カテゴリー約360語（3,600語 ÷ 10カテゴリー）
"""

import csv
import shutil
from collections import Counter

# 新カテゴリー定義
NEW_CATEGORIES = {
    '言語基本': '基本動詞・形容詞・副詞・前置詞・接続詞・代名詞など',
    '学校・学習': '教育・授業・科目・学問・知識・読み書きなど',
    '日常生活': '家庭・住居・日課・買い物・家事など',
    '人・社会': '人間関係・感情・性格・職業・ビジネス・経済など',
    '自然・環境': '動物・植物・天候・地理・環境問題など',
    '食・健康': '食べ物・料理・身体・医療・衛生など',
    '運動・娯楽': 'スポーツ・趣味・芸術・音楽・行事など',
    '場所・移動': '交通・旅行・方向・位置・建物など',
    '時間・数量': '時制・数学・測定・数・量など',
    '科学・技術': 'テクノロジー・実験・道具・機械・通信など'
}

def classify_word(word, meaning, old_category):
    """
    単語を新しいカテゴリーに分類する
    優先順位に基づいて段階的に判定
    """
    word_lower = word.lower()
    
    # 1. 言語基本 - 厳密に品詞機能語のみ（代名詞・前置詞・接続詞・助動詞・冠詞・基本副詞）
    pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
                'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
                'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
                'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'what', 'which']
    
    articles = ['a', 'an', 'the']
    
    conjunctions = ['and', 'or', 'but', 'so', 'because', 'if', 'when', 'while', 'although', 'though',
                    'since', 'unless', 'until', 'as', 'than', 'whether', 'nor', 'yet']
    
    prepositions = ['in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'of', 'off',
                    'up', 'down', 'into', 'onto', 'out', 'over', 'under', 'below', 'above',
                    'between', 'among', 'through', 'during', 'after', 'before', 'behind',
                    'across', 'along', 'around', 'near', 'beside', 'against', 'toward', 'without']
    
    modals = ['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'ought']
    
    be_verbs = ['be', 'is', 'am', 'are', 'was', 'were', 'been', 'being']
    
    aux_verbs = ['have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing']
    
    basic_adverbs = ['not', "n't", 'no', 'yes', 'very', 'too', 'quite', 'rather', 'really',
                     'just', 'only', 'also', 'even', 'still', 'already', 'yet', 'ever', 'never',
                     'always', 'often', 'sometimes', 'usually', 'seldom', 'rarely',
                     'here', 'there', 'where', 'everywhere', 'anywhere', 'somewhere', 'nowhere',
                     'now', 'then', 'today', 'tomorrow', 'yesterday', 'soon', 'ago']
    
    determiners = ['all', 'both', 'each', 'every', 'some', 'any', 'many', 'much', 'few', 'little',
                   'more', 'most', 'less', 'least', 'several', 'enough', 'either', 'neither',
                   'another', 'other', 'such']
    
    numerals = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                'first', 'second', 'third', 'once', 'twice']
    
    # 言語基本に該当するか判定
    if (word_lower in pronouns or word_lower in articles or word_lower in conjunctions or
        word_lower in prepositions or word_lower in modals or word_lower in be_verbs or
        word_lower in aux_verbs or word_lower in basic_adverbs or word_lower in determiners or
        word_lower in numerals):
        return '言語基本'
    
    # 2. 学校・学習 - 教育関連を優先的に判定
    school_keywords = ['学', '校', '授業', '教', '習', '勉強', '試験', 'テスト', '宿題', '先生', '生徒',
                       '科目', '数学', '歴史', '地理', '科学', '英語', '国語', '読', '書', '練習',
                       'クラス', '級', '学年', '卒業', '入学', '講義', '図書', '辞書', '文法', '語彙']
    if any(kw in meaning for kw in school_keywords):
        return '学校・学習'
    
    school_words = ['school', 'student', 'teacher', 'class', 'lesson', 'study', 'learn', 'teach',
                    'education', 'exam', 'test', 'homework', 'subject', 'math', 'history', 'science',
                    'book', 'read', 'write', 'paper', 'pen', 'pencil', 'notebook', 'desk', 'board',
                    'library', 'university', 'college', 'grade', 'question', 'answer', 'problem',
                    'knowledge', 'information', 'skill', 'practice', 'exercise', 'example',
                    'dictionary', 'grammar', 'vocabulary', 'language', 'text', 'page', 'chapter']
    if word_lower in school_words:
        return '学校・学習'
    
    # 3. 食・健康 - 身体・医療を明確に判定
    food_keywords = ['食', '飲', '料理', '味', '身体', '体', '健康', '病', '医', '薬', '痛', '治', '血']
    if any(kw in meaning for kw in food_keywords):
        return '食・健康'
    
    food_words = ['food', 'eat', 'drink', 'meal', 'breakfast', 'lunch', 'dinner', 'supper', 'restaurant', 'cafe',
                  'bread', 'rice', 'meat', 'fish', 'chicken', 'beef', 'pork', 'vegetable', 'fruit', 'apple',
                  'banana', 'orange', 'egg', 'cheese', 'milk', 'butter', 'sugar', 'salt', 'oil',
                  'water', 'tea', 'coffee', 'juice', 'beer', 'wine', 'delicious', 'taste', 'sweet', 'bitter',
                  'health', 'healthy', 'sick', 'ill', 'disease', 'doctor', 'nurse', 'hospital', 'medicine', 'drug',
                  'body', 'head', 'face', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'neck', 'shoulder',
                  'hand', 'finger', 'arm', 'leg', 'foot', 'knee', 'back', 'heart', 'blood', 'skin',
                  'pain', 'hurt', 'ache', 'fever', 'cold', 'cough', 'tired', 'die', 'dead', 'death']
    if word_lower in food_words:
        return '食・健康'
    
    # 4. 運動・娯楽 - スポーツ・芸術・趣味
    sports_keywords = ['運動', 'スポーツ', '遊', '趣味', '音楽', '歌', '絵', '芸術', '祭', '楽しい', '競技']
    if any(kw in meaning for kw in sports_keywords):
        return '運動・娯楽'
    
    sports_words = ['sport', 'play', 'game', 'ball', 'soccer', 'baseball', 'basketball', 'tennis', 'golf',
                    'team', 'player', 'win', 'lose', 'victory', 'defeat', 'run', 'jump', 'swim', 'ski',
                    'music', 'song', 'sing', 'dance', 'piano', 'guitar', 'drum', 'concert', 'band',
                    'art', 'picture', 'paint', 'draw', 'drawing', 'artist', 'museum', 'gallery',
                    'movie', 'film', 'cinema', 'television', 'tv', 'radio', 'video', 'camera',
                    'fun', 'enjoy', 'hobby', 'interest', 'exciting', 'wonderful',
                    'party', 'festival', 'celebration', 'holiday', 'vacation', 'celebrate']
    if word_lower in sports_words:
        return '運動・娯楽'
    
    # 5. 場所・移動 - 交通・旅行・建物・方向
    place_keywords = ['場所', '位置', '方向', '旅', '交通', '乗', '駅', '道', '街', '町', '建物', '移動']
    if any(kw in meaning for kw in place_keywords):
        return '場所・移動'
    
    place_words = ['place', 'position', 'location', 'area', 'region', 'city', 'town', 'country', 'village',
                   'street', 'road', 'way', 'path', 'avenue', 'direction', 'distance',
                   'north', 'south', 'east', 'west', 'left', 'right', 'center', 'middle', 'side', 'corner',
                   'travel', 'trip', 'journey', 'visit', 'tour', 'tourist', 'station', 'airport', 'port',
                   'train', 'bus', 'car', 'taxi', 'truck', 'bike', 'bicycle', 'ship', 'boat', 'plane', 'airplane',
                   'drive', 'ride', 'walk', 'arrive', 'leave', 'depart', 'reach', 'pass', 'cross', 'enter',
                   'building', 'house', 'office', 'shop', 'store', 'hotel', 'restaurant',
                   'church', 'temple', 'tower', 'castle', 'bridge', 'gate', 'wall', 'roof']
    if word_lower in place_words:
        return '場所・移動'
    
    # 6. 時間・数量 - 時間・数・量・測定
    time_keywords = ['時', '分', '秒', '日', '週', '月', '年', '今', '昔', '未来', '数', '量', '計', '測']
    if any(kw in meaning for kw in time_keywords):
        return '時間・数量'
    
    time_words = ['time', 'moment', 'period', 'while', 'day', 'week', 'month', 'year', 'century',
                  'hour', 'minute', 'second', 'morning', 'afternoon', 'evening', 'night', 'midnight',
                  'today', 'tomorrow', 'yesterday', 'now', 'then', 'before', 'after', 'later',
                  'past', 'present', 'future', 'history', 'modern', 'ancient', 'recent',
                  'number', 'count', 'calculate', 'measure', 'size', 'length', 'width', 'height', 'depth',
                  'weight', 'speed', 'degree', 'temperature', 'total', 'amount', 'quantity',
                  'half', 'quarter', 'double', 'single', 'pair', 'piece', 'percent']
    if word_lower in time_words:
        return '時間・数量'
    
    # 7. 科学・技術 - テクノロジー・実験・道具
    science_keywords = ['科学', '技術', '機械', '道具', '実験', 'コンピュータ', '電', '発明', '理論']
    if any(kw in meaning for kw in science_keywords):
        return '科学・技術'
    
    science_words = ['science', 'scientific', 'technology', 'technical', 'computer', 'internet', 'email', 'website',
                     'phone', 'telephone', 'mobile', 'machine', 'engine', 'motor', 'robot', 'tool', 'instrument',
                     'electric', 'electronic', 'electricity', 'power', 'energy', 'battery', 'wire',
                     'experiment', 'laboratory', 'research', 'study', 'theory', 'method',
                     'invent', 'invention', 'discover', 'discovery', 'create', 'develop', 'design']
    if word_lower in science_words:
        return '科学・技術'
    
    # 8. 自然・環境 - 動植物・天候・地理
    nature_keywords = ['動物', '植物', '木', '花', '草', '鳥', '魚', '虫', '天気', '雨', '雪', '風',
                       '空', '海', '山', '川', '森', '自然', '環境', '地球', '世界', '季節']
    if any(kw in meaning for kw in nature_keywords):
        return '自然・環境'
    
    nature_words = ['nature', 'natural', 'environment', 'environmental', 'earth', 'world', 'globe', 'planet',
                    'animal', 'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'elephant', 'lion',
                    'tree', 'flower', 'rose', 'plant', 'grass', 'leaf', 'root', 'seed', 'fruit', 'forest', 'wood',
                    'sky', 'sun', 'moon', 'star', 'cloud', 'light', 'dark', 'shadow',
                    'weather', 'climate', 'rain', 'snow', 'wind', 'storm', 'thunder', 'lightning',
                    'hot', 'cold', 'warm', 'cool', 'wet', 'dry',
                    'water', 'sea', 'ocean', 'wave', 'river', 'lake', 'pond', 'ice',
                    'mountain', 'hill', 'valley', 'island', 'beach', 'shore', 'coast', 'land', 'ground', 'soil',
                    'season', 'spring', 'summer', 'fall', 'autumn', 'winter']
    if word_lower in nature_words:
        return '自然・環境'
    
    # 9. 人・社会 - 人間関係・感情・職業・社会
    people_keywords = ['人', '感情', '性格', '心', '気持ち', '仕事', '職', '会社', 'ビジネス',
                       '経済', '政治', '社会', '友', '関係', '愛', '怒', '悲', '喜', '恐', '驚']
    if any(kw in meaning for kw in people_keywords):
        return '人・社会'
    
    people_words = ['person', 'people', 'human', 'man', 'woman', 'boy', 'girl', 'child', 'baby', 'adult',
                    'friend', 'friendship', 'neighbor', 'guest', 'stranger', 'enemy',
                    'love', 'like', 'hate', 'dislike', 'prefer', 'happy', 'happiness', 'sad', 'sadness',
                    'angry', 'anger', 'afraid', 'fear', 'worry', 'surprise', 'surprised', 'hope', 'wish',
                    'kind', 'kindness', 'nice', 'good', 'bad', 'brave', 'honest', 'polite', 'rude',
                    'job', 'work', 'worker', 'business', 'businessman', 'office', 'company', 'factory',
                    'money', 'pay', 'payment', 'salary', 'wage', 'price', 'cost', 'expensive', 'cheap',
                    'rich', 'poor', 'wealth', 'poverty',
                    'society', 'social', 'public', 'private', 'community', 'culture', 'cultural',
                    'government', 'politics', 'political', 'law', 'legal', 'rule', 'right', 'duty',
                    'meet', 'meeting', 'talk', 'speak', 'speech', 'conversation', 'discuss', 'discussion',
                    'tell', 'say', 'explain', 'ask', 'answer', 'reply', 'agree', 'disagree',
                    'smile', 'laugh', 'laughter', 'cry', 'tear', 'shout', 'whisper']
    if word_lower in people_words:
        return '人・社会'
    
    # 10. 日常生活 - 家庭・住居・日課
    daily_keywords = ['家', '部屋', '台所', '日課', '朝', '夜', '掃除', '洗', '買い物',
                      '服', '着', '寝', '起き', '住', '家族', '親', '子', '兄', '姉', '弟', '妹']
    if any(kw in meaning for kw in daily_keywords):
        return '日常生活'
    
    daily_words = ['home', 'house', 'apartment', 'room', 'bedroom', 'bathroom', 'kitchen', 'living',
                   'door', 'window', 'floor', 'ceiling', 'wall', 'roof', 'stairs', 'yard', 'garden',
                   'furniture', 'bed', 'table', 'chair', 'desk', 'sofa', 'lamp', 'clock', 'mirror',
                   'clean', 'wash', 'washing', 'sweep', 'dry', 'dirty',
                   'family', 'father', 'mother', 'parent', 'son', 'daughter', 'brother', 'sister',
                   'grandfather', 'grandmother', 'uncle', 'aunt', 'cousin', 'husband', 'wife',
                   'wake', 'sleep', 'sleeping', 'rest', 'relax', 'sit', 'stand', 'lie',
                   'wear', 'dress', 'clothes', 'clothing', 'shirt', 'pants', 'skirt', 'shoes', 'hat',
                   'shop', 'shopping', 'buy', 'sell', 'sale', 'customer', 'goods', 'product']
    if word_lower in daily_words:
        return '日常生活'
    
    
    # 上記のいずれにも該当しない場合のデフォルト判定
    # 一般的な動詞・形容詞を意味から推測して適切なカテゴリに振り分け
    
    # 行動・動作系の動詞 → 最も関連する具体的カテゴリへ
    action_verbs = {
        '人・社会': ['言う', '話す', '聞く', '見る', '会う', '考える', '思う', '信じる', '感じる', '与える', '得る', '送る', '受け取る'],
        '日常生活': ['する', '作る', '使う', '持つ', '置く', '取る', '開ける', '閉める', '入る', '出る'],
        '場所・移動': ['行く', '来る', '歩く', '走る', '飛ぶ', '移動', '旅', '訪れる'],
        '学校・学習': ['知る', '学ぶ', '覚える', '忘れる', '理解', '説明'],
    }
    
    for category, keywords in action_verbs.items():
        if any(kw in meaning for kw in keywords):
            return category
    
    # 状態・性質を表す形容詞 → 関連カテゴリへ
    adj_categories = {
        '人・社会': ['大きい', '小さい', '多い', '少ない', '高い', '低い', '強い', '弱い', '明るい', '暗い'],
        '日常生活': ['新しい', '古い', '長い', '短い', '広い', '狭い', '重い', '軽い'],
        '学校・学習': ['正しい', '間違', '簡単', '難しい', '可能', '不可能'],
    }
    
    for category, keywords in adj_categories.items():
        if any(kw in meaning for kw in keywords):
            return category
    
    # それでも分類できない場合は、旧カテゴリーを参考に新カテゴリーにマッピング
    category_mapping = {
        '文法機能語': '言語基本',
        '日常・家庭': '日常生活',
        '学校・教育': '学校・学習',
        '仕事・職業': '人・社会',
        '人・感情': '人・社会',
        '自然・生物': '自然・環境',
        '地理・旅行': '場所・移動',
        '食・健康・運動': '食・健康',
        '文化・娯楽': '運動・娯楽',
        '科学・技術': '科学・技術'
    }
    
    return category_mapping.get(old_category, '人・社会')  # 最もカバレッジの広い「人・社会」をデフォルトに

def main():
    input_file = 'public/data/junior-high-entrance-words.csv'
    output_file = 'public/data/junior-high-entrance-words.csv'
    backup_file = 'public/data/junior-high-entrance-words.csv.backup2'
    
    # バックアップ作成
    shutil.copy2(input_file, backup_file)
    print(f'✅ バックアップ作成: {backup_file}')
    
    # CSVを読み込み
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f'📊 総単語数: {len(rows)}')
    print(f'🔄 再分類を開始...\n')
    
    # 各行を再分類
    for row in rows:
        if None in row:
            del row[None]
        old_category = row['関連分野']
        new_category = classify_word(row['語句'], row['意味'], old_category)
        row['関連分野'] = new_category
    
    # 新しいCSVに書き出し
    fieldnames = ['語句', '読み', '意味', '語源等解説', '関連語', '関連分野', '難易度']
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f'✅ 再分類完了: {output_file}\n')
    
    # 分類結果の集計
    category_counts = Counter([row['関連分野'] for row in rows])
    
    print('【新カテゴリー分布】')
    for category in NEW_CATEGORIES.keys():
        count = category_counts[category]
        percentage = count / len(rows) * 100
        print(f'{category}: {count}語 ({percentage:.1f}%)')
    
    print(f'\n目標: 各カテゴリー約360語 (10%)')
    
    # 偏りの評価
    max_count = max(category_counts.values())
    min_count = min(category_counts.values())
    balance_ratio = max_count / min_count if min_count > 0 else 0
    
    print(f'\n偏り評価:')
    print(f'  最大: {max_count}語')
    print(f'  最小: {min_count}語')
    print(f'  比率: {balance_ratio:.2f}倍')
    
    if balance_ratio < 2.0:
        print('  ✅ バランス良好（2倍以内）')
    elif balance_ratio < 3.0:
        print('  ⚠️ やや偏りあり（2〜3倍）')
    else:
        print('  ❌ 大きな偏り（3倍以上）')

if __name__ == '__main__':
    main()
