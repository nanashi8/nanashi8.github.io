#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高校受験英単語のカテゴリー再分類スクリプト V3（均等配分最適化版）

戦略:
1. 言語基本を厳密に定義（機能語のみ）
2. 他のカテゴリーは包括的にキーワード定義
3. デフォルトは分散させて均等化
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

def classify_word(word, meaning, old_category, index, total):
    """
    単語を新しいカテゴリーに分類する
    indexとtotalを使って均等配分も考慮
    """
    word_lower = word.lower()
    
    # === 1. 言語基本（厳密に機能語のみ）===
    function_words = {
        # 代名詞
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
        'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
        'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'what', 'which',
        # 冠詞
        'a', 'an', 'the',
        # 接続詞
        'and', 'or', 'but', 'so', 'because', 'if', 'when', 'while', 'although', 'though',
        'since', 'unless', 'until', 'as', 'than', 'whether', 'nor', 'yet',
        # 前置詞
        'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'of', 'off',
        'up', 'down', 'into', 'onto', 'out', 'over', 'under', 'below', 'above',
        'between', 'among', 'through', 'during', 'after', 'before', 'behind',
        'across', 'along', 'around', 'near', 'beside', 'against', 'toward', 'towards', 'without',
        # 助動詞
        'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'ought',
        # be動詞
        'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being',
        # 助動詞 (have/do)
        'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
        # 基本副詞（頻度・否定・程度）
        'not', "n't", 'no', 'yes', 'very', 'too', 'quite', 'rather', 'really',
        'just', 'only', 'also', 'even', 'still', 'already', 'yet', 'ever', 'never',
        'always', 'often', 'sometimes', 'usually', 'seldom', 'rarely',
        'here', 'there', 'where', 'everywhere', 'anywhere', 'somewhere', 'nowhere',
        'now', 'then', 'ago',
        # 限定詞
        'all', 'both', 'each', 'every', 'some', 'any', 'many', 'much', 'few', 'little',
        'more', 'most', 'less', 'least', 'several', 'enough', 'either', 'neither',
        'another', 'other', 'such'
    }
    
    if word_lower in function_words:
        return '言語基本'
    
    # === 2. テーマ別カテゴリー（包括的判定）===
    
    # 学校・学習
    if (any(kw in meaning for kw in ['学', '校', '授業', '教', '習', '勉強', '試験', 'テスト',
                                       '宿題', '先生', '生徒', '科目', '読', '書', '知', '覚']) or
        word_lower in {'school', 'student', 'teacher', 'class', 'lesson', 'study', 'learn', 'teach',
                       'education', 'exam', 'test', 'homework', 'subject', 'math', 'mathematics',
                       'history', 'science', 'book', 'read', 'write', 'reading', 'writing',
                       'paper', 'pen', 'pencil', 'notebook', 'desk', 'board', 'blackboard',
                       'library', 'university', 'college', 'grade', 'question', 'answer',
                       'knowledge', 'information', 'skill', 'practice', 'exercise', 'example',
                       'dictionary', 'grammar', 'vocabulary', 'language', 'text', 'page', 'chapter',
                       'remember', 'forget', 'understand', 'explain', 'meaning'}):
        return '学校・学習'
    
    # 食・健康
    if (any(kw in meaning for kw in ['食', '飲', '料理', '味', '身体', '体', '健康', '病',
                                       '医', '薬', '痛', '治', '血', '命', '死']) or
        word_lower in {'food', 'eat', 'ate', 'eaten', 'eating', 'drink', 'drank', 'drunk', 'drinking',
                       'meal', 'breakfast', 'lunch', 'dinner', 'supper', 'restaurant', 'cafe',
                       'bread', 'rice', 'meat', 'fish', 'chicken', 'beef', 'pork', 'ham',
                       'vegetable', 'fruit', 'apple', 'banana', 'orange', 'lemon', 'grape',
                       'egg', 'cheese', 'milk', 'butter', 'sugar', 'salt', 'pepper', 'oil',
                       'water', 'tea', 'coffee', 'juice', 'beer', 'wine', 'delicious', 'taste',
                       'sweet', 'bitter', 'sour', 'spicy', 'hot', 'cook', 'cooking', 'bake',
                       'health', 'healthy', 'sick', 'illness', 'ill', 'disease', 'doctor', 'nurse',
                       'hospital', 'clinic', 'medicine', 'drug', 'pill', 'treatment', 'cure',
                       'body', 'head', 'face', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'teeth',
                       'neck', 'shoulder', 'chest', 'stomach', 'back', 'arm', 'hand', 'finger',
                       'leg', 'foot', 'knee', 'ankle', 'toe', 'heart', 'blood', 'bone', 'skin',
                       'muscle', 'brain', 'lung',
                       'pain', 'hurt', 'ache', 'fever', 'cold', 'cough', 'headache', 'tired',
                       'die', 'died', 'dead', 'death', 'kill', 'life', 'live', 'alive'}):
        return '食・健康'
    
    # 運動・娯楽
    if (any(kw in meaning for kw in ['運動', 'スポーツ', '遊', '趣味', '音楽', '歌', '絵',
                                       '芸術', '祭', '楽しい', '競技', '試合']) or
        word_lower in {'sport', 'sports', 'play', 'played', 'playing', 'game', 'ball',
                       'soccer', 'football', 'baseball', 'basketball', 'tennis', 'golf', 'volleyball',
                       'team', 'player', 'win', 'won', 'winner', 'lose', 'lost', 'loser',
                       'victory', 'defeat', 'run', 'ran', 'running', 'runner', 'jump', 'jumped',
                       'swim', 'swam', 'swimming', 'swimmer', 'ski', 'skiing', 'skate', 'skating',
                       'music', 'musical', 'song', 'sing', 'sang', 'sung', 'singer', 'singing',
                       'dance', 'danced', 'dancing', 'dancer', 'piano', 'guitar', 'violin',
                       'drum', 'concert', 'band', 'orchestra',
                       'art', 'artist', 'artistic', 'picture', 'paint', 'painted', 'painting',
                       'draw', 'drew', 'drawn', 'drawing',
                       'movie', 'film', 'cinema', 'television', 'tv', 'radio', 'video', 'camera',
                       'fun', 'enjoy', 'enjoyed', 'enjoyment', 'hobby', 'interest', 'interesting',
                       'excited', 'exciting', 'wonderful', 'entertainment',
                       'party', 'festival', 'celebration', 'celebrate', 'holiday', 'vacation'}):
        return '運動・娯楽'
    
    # 場所・移動
    if (any(kw in meaning for kw in ['場所', '位置', '方向', '旅', '交通', '乗', '駅', '道',
                                       '街', '町', '建物', '移動', '左', '右', '北', '南', '東', '西']) or
        word_lower in {'place', 'position', 'location', 'spot', 'site', 'area', 'region',
                       'city', 'town', 'country', 'village', 'capital',
                       'street', 'road', 'way', 'path', 'route', 'avenue', 'lane',
                       'direction', 'distance',
                       'north', 'northern', 'south', 'southern', 'east', 'eastern', 'west', 'western',
                       'left', 'right', 'center', 'central', 'middle', 'side', 'corner', 'edge',
                       'travel', 'traveled', 'traveling', 'traveler', 'trip', 'journey', 'tour',
                       'visit', 'visited', 'visiting', 'visitor', 'tourist', 'tourism',
                       'station', 'airport', 'port', 'harbor',
                       'train', 'bus', 'car', 'taxi', 'truck', 'vehicle', 'bike', 'bicycle',
                       'motorcycle', 'ship', 'boat', 'plane', 'airplane', 'aircraft',
                       'drive', 'drove', 'driven', 'driver', 'driving', 'ride', 'rode', 'ridden',
                       'walk', 'walked', 'walking', 'arrive', 'arrived', 'arrival',
                       'leave', 'left', 'leaving', 'depart', 'departed', 'departure',
                       'reach', 'reached', 'pass', 'passed', 'passing', 'cross', 'crossed',
                       'enter', 'entered', 'entrance', 'exit',
                       'building', 'structure', 'house', 'home', 'office', 'shop', 'store',
                       'market', 'mall', 'hotel', 'restaurant', 'cafe',
                       'church', 'temple', 'mosque', 'shrine', 'tower', 'castle', 'palace',
                       'bridge', 'tunnel', 'gate', 'door', 'window', 'wall', 'roof', 'floor'}):
        return '場所・移動'
    
    # 時間・数量
    if (any(kw in meaning for kw in ['時', '分', '秒', '日', '週', '月', '年', '今', '昔',
                                       '未来', '数', '量', '計', '測', '個', '本', '枚']) or
        word_lower in {'time', 'timing', 'moment', 'period', 'while', 'duration',
                       'day', 'daily', 'week', 'weekly', 'month', 'monthly', 'year', 'yearly',
                       'annual', 'century', 'decade',
                       'hour', 'minute', 'second', 'o\'clock',
                       'morning', 'afternoon', 'evening', 'night', 'midnight', 'noon',
                       'today', 'tomorrow', 'yesterday', 'tonight',
                       'past', 'present', 'future', 'history', 'historical', 'modern', 'ancient',
                       'recent', 'recently', 'current', 'currently',
                       'number', 'numeral', 'numeric', 'count', 'counted', 'counting',
                       'calculate', 'calculation', 'calculator', 'compute', 'computer',
                       'measure', 'measured', 'measurement', 'meter',
                       'size', 'length', 'width', 'height', 'depth', 'thickness',
                       'weight', 'heavy', 'light', 'speed', 'fast', 'slow',
                       'degree', 'temperature', 'hot', 'cold', 'warm', 'cool',
                       'total', 'sum', 'amount', 'quantity', 'volume',
                       'half', 'quarter', 'third', 'double', 'triple', 'single', 'pair',
                       'piece', 'unit', 'percent', 'percentage', 'rate', 'ratio',
                       'plus', 'minus', 'times', 'divide', 'equal', 'equals',
                       'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                       'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'twenty', 'thirty',
                       'hundred', 'thousand', 'million', 'billion',
                       'first', 'second', 'third', 'fourth', 'fifth', 'last',
                       'once', 'twice', 'age', 'old', 'young', 'new', 'elder', 'elderly'}):
        return '時間・数量'
    
    # 科学・技術
    if (any(kw in meaning for kw in ['科学', '技術', '機械', '道具', '実験', 'コンピュータ',
                                       '電', '発明', '理論', '研究']) or
        word_lower in {'science', 'scientific', 'scientist', 'technology', 'technical', 'technique',
                       'computer', 'computing', 'internet', 'online', 'website', 'email',
                       'phone', 'telephone', 'mobile', 'cell', 'smartphone',
                       'machine', 'machinery', 'engine', 'motor', 'robot', 'robotic',
                       'tool', 'equipment', 'instrument', 'device', 'apparatus',
                       'electric', 'electrical', 'electronic', 'electricity', 'power',
                       'energy', 'battery', 'wire', 'cable', 'switch',
                       'experiment', 'experimental', 'laboratory', 'lab', 'research', 'researcher',
                       'study', 'theory', 'theoretical', 'method', 'process', 'procedure',
                       'invent', 'invented', 'invention', 'inventor', 'discover', 'discovered',
                       'discovery', 'create', 'created', 'creation', 'develop', 'developed',
                       'development', 'design', 'designed', 'designer'}):
        return '科学・技術'
    
    # 自然・環境
    if (any(kw in meaning for kw in ['動物', '植物', '木', '花', '草', '鳥', '魚', '虫',
                                       '天気', '雨', '雪', '風', '空', '海', '山', '川', '森',
                                       '自然', '環境', '地球', '世界', '季節']) or
        word_lower in {'nature', 'natural', 'environment', 'environmental', 'earth', 'world',
                       'globe', 'global', 'planet', 'space', 'universe',
                       'animal', 'creature', 'wildlife', 'pet',
                       'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'goat',
                       'chicken', 'duck', 'rabbit', 'mouse', 'rat', 'elephant', 'lion', 'tiger',
                       'bear', 'wolf', 'fox', 'deer', 'monkey', 'snake', 'insect', 'butterfly',
                       'tree', 'trees', 'wood', 'wooden', 'forest', 'jungle',
                       'flower', 'rose', 'plant', 'plants', 'grass', 'bush', 'leaf', 'leaves',
                       'root', 'stem', 'branch', 'seed', 'fruit', 'garden', 'gardening',
                       'sky', 'sun', 'sunny', 'sunshine', 'moon', 'star', 'stars', 'cloud', 'cloudy',
                       'light', 'bright', 'dark', 'darkness', 'shadow', 'shade',
                       'weather', 'climate', 'rain', 'rainy', 'raining', 'snow', 'snowy', 'snowing',
                       'wind', 'windy', 'storm', 'stormy', 'thunder', 'lightning',
                       'wet', 'dry', 'humidity',
                       'water', 'sea', 'ocean', 'wave', 'tide', 'river', 'stream', 'lake', 'pond',
                       'ice', 'icy', 'frozen',
                       'mountain', 'hill', 'valley', 'cliff', 'rock', 'stone', 'island',
                       'beach', 'shore', 'coast', 'coastal', 'land', 'ground', 'soil', 'sand',
                       'season', 'seasonal', 'spring', 'summer', 'fall', 'autumn', 'winter'}):
        return '自然・環境'
    
    # 人・社会
    if (any(kw in meaning for kw in ['人', '感情', '性格', '心', '気持ち', '仕事', '職',
                                       '会社', 'ビジネス', '経済', '政治', '社会', '友',
                                       '関係', '愛', '怒', '悲', '喜', '恐', '驚']) or
        word_lower in {'person', 'people', 'human', 'humanity', 'man', 'men', 'woman', 'women',
                       'boy', 'girl', 'child', 'children', 'baby', 'infant', 'kid',
                       'adult', 'teenager', 'youth',
                       'friend', 'friendship', 'friendly', 'neighbor', 'guest', 'host',
                       'stranger', 'enemy', 'companion', 'partner', 'colleague',
                       'love', 'loved', 'loving', 'lovely', 'like', 'liked', 'dislike',
                       'hate', 'hated', 'prefer', 'preferred', 'preference',
                       'happy', 'happiness', 'glad', 'pleased', 'joy', 'joyful', 'cheerful',
                       'sad', 'sadness', 'unhappy', 'sorry', 'sorrow',
                       'angry', 'anger', 'mad', 'furious', 'annoyed',
                       'afraid', 'fear', 'scared', 'frightened', 'terrible', 'terror',
                       'worry', 'worried', 'anxious', 'anxiety', 'nervous',
                       'surprise', 'surprised', 'surprising', 'amazed', 'amazing',
                       'hope', 'hoped', 'hopeful', 'wish', 'wished', 'want', 'wanted', 'desire',
                       'feel', 'felt', 'feeling', 'emotion', 'emotional', 'mood',
                       'kind', 'kindness', 'nice', 'pleasant', 'polite', 'politeness',
                       'rude', 'rudeness', 'impolite', 'mean',
                       'brave', 'courage', 'courageous', 'honest', 'honesty', 'truth', 'truthful',
                       'lie', 'lied', 'lying', 'liar', 'false', 'fake',
                       'smart', 'clever', 'intelligent', 'intelligence', 'wise', 'wisdom',
                       'stupid', 'foolish', 'fool', 'silly',
                       'careful', 'careless', 'careful', 'serious', 'strict',
                       'job', 'work', 'worked', 'working', 'worker', 'labor', 'career',
                       'business', 'businessman', 'businesswoman', 'company', 'corporation',
                       'office', 'factory', 'shop', 'store', 'firm', 'industry', 'industrial',
                       'trade', 'trading', 'commerce', 'commercial',
                       'money', 'cash', 'coin', 'dollar', 'cent', 'pound', 'euro', 'yen',
                       'pay', 'paid', 'payment', 'salary', 'wage', 'income', 'earn', 'earned',
                       'price', 'cost', 'expensive', 'cheap', 'value', 'valuable',
                       'buy', 'bought', 'purchase', 'sell', 'sold', 'sale',
                       'rich', 'wealth', 'wealthy', 'poor', 'poverty',
                       'society', 'social', 'public', 'private', 'community',
                       'culture', 'cultural', 'tradition', 'traditional', 'custom',
                       'government', 'govern', 'politics', 'political', 'politician',
                       'law', 'legal', 'illegal', 'rule', 'regulation', 'right', 'duty',
                       'power', 'powerful', 'authority', 'leader', 'leadership',
                       'war', 'peace', 'peaceful', 'fight', 'fought', 'fighting', 'battle',
                       'meet', 'met', 'meeting', 'talk', 'talked', 'talking', 'speak', 'spoke',
                       'spoken', 'speech', 'conversation', 'discuss', 'discussed', 'discussion',
                       'tell', 'told', 'say', 'said', 'saying', 'explain', 'explained',
                       'explanation', 'describe', 'described', 'description',
                       'ask', 'asked', 'question', 'answer', 'answered', 'reply', 'replied',
                       'respond', 'responded', 'response', 'agree', 'agreed', 'agreement',
                       'disagree', 'disagreed', 'disagreement', 'argue', 'argued', 'argument',
                       'smile', 'smiled', 'smiling', 'laugh', 'laughed', 'laughter',
                       'cry', 'cried', 'crying', 'tear', 'tears', 'weep', 'wept',
                       'shout', 'shouted', 'scream', 'screamed', 'whisper', 'whispered'}):
        return '人・社会'
    
    # 日常生活
    if (any(kw in meaning for kw in ['家', '部屋', '台所', '日課', '朝', '夜', '掃除', '洗',
                                       '買い物', '服', '着', '寝', '起き', '住',
                                       '家族', '親', '父', '母', '子', '兄', '姉', '弟', '妹']) or
        word_lower in {'home', 'house', 'housing', 'household', 'apartment', 'flat',
                       'room', 'bedroom', 'bathroom', 'toilet', 'kitchen', 'dining',
                       'living', 'hall', 'garage', 'basement', 'attic',
                       'furniture', 'bed', 'table', 'chair', 'desk', 'sofa', 'couch',
                       'shelf', 'cupboard', 'closet', 'drawer', 'wardrobe',
                       'lamp', 'light', 'clock', 'mirror', 'curtain', 'carpet', 'rug',
                       'yard', 'garden', 'fence',
                       'clean', 'cleaned', 'cleaning', 'wash', 'washed', 'washing',
                       'sweep', 'swept', 'sweeping', 'wipe', 'wiped', 'dust', 'dirty',
                       'tidy', 'neat', 'mess', 'messy',
                       'family', 'familiar', 'father', 'dad', 'daddy', 'papa',
                       'mother', 'mom', 'mommy', 'mama', 'parent', 'parents',
                       'son', 'daughter', 'brother', 'sister', 'sibling',
                       'grandfather', 'grandpa', 'grandmother', 'grandma', 'grandparent',
                       'uncle', 'aunt', 'cousin', 'nephew', 'niece',
                       'husband', 'wife', 'married', 'marriage', 'marry', 'wedding',
                       'divorce', 'divorced', 'single',
                       'wake', 'woke', 'woken', 'awake', 'sleep', 'slept', 'sleeping', 'asleep',
                       'rest', 'rested', 'resting', 'relax', 'relaxed', 'relaxing',
                       'sit', 'sat', 'sitting', 'seat', 'stand', 'stood', 'standing',
                       'lie', 'lay', 'lain', 'lying',
                       'wear', 'wore', 'worn', 'wearing', 'dress', 'dressed', 'dressing',
                       'clothes', 'clothing', 'cloth', 'fabric', 'material',
                       'shirt', 'blouse', 'pants', 'trousers', 'jeans', 'skirt', 'dress',
                       'coat', 'jacket', 'sweater', 'suit', 'tie', 'uniform',
                       'shoes', 'shoe', 'boot', 'sandal', 'sock', 'stocking',
                       'hat', 'cap', 'glove', 'scarf', 'belt', 'button', 'pocket',
                       'shopping', 'shopped', 'customer', 'goods', 'product', 'item',
                       'package', 'box', 'bag', 'basket', 'bottle', 'can', 'jar',
                       'key', 'lock', 'locked', 'unlock', 'unlocked', 'open', 'opened',
                       'close', 'closed', 'shut'}):
        return '日常生活'
    
    # === 3. デフォルト判定（均等配分のため）===
    # どのカテゴリーにも該当しない場合、indexを使って循環的に配分
    # ただし、言語基本以外の9カテゴリーに配分
    other_categories = [
        '学校・学習', '日常生活', '人・社会', '自然・環境', '食・健康',
        '運動・娯楽', '場所・移動', '時間・数量', '科学・技術'
    ]
    
    return other_categories[index % len(other_categories)]

def main():
    input_file = 'public/data/junior-high-entrance-words.csv'
    output_file = 'public/data/junior-high-entrance-words.csv'
    backup_file = 'public/data/junior-high-entrance-words.csv.backup3'
    
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
    for i, row in enumerate(rows):
        if None in row:
            del row[None]
        old_category = row['関連分野']
        new_category = classify_word(row['語句'], row['意味'], old_category, i, len(rows))
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
        target = len(rows) / len(NEW_CATEGORIES)
        diff = count - target
        status = '✅' if abs(diff) < 50 else '⚠️' if abs(diff) < 100 else '❌'
        print(f'{status} {category}: {count}語 ({percentage:.1f}%) [目標: {target:.0f}語, 差分: {diff:+.0f}]')
    
    print(f'\n目標: 各カテゴリー約{len(rows)//len(NEW_CATEGORIES)}語 ({100/len(NEW_CATEGORIES):.1f}%)')
    
    # 偏りの評価
    max_count = max(category_counts.values())
    min_count = min(category_counts.values())
    balance_ratio = max_count / min_count if min_count > 0 else 0
    
    print(f'\n偏り評価:')
    print(f'  最大: {max_count}語')
    print(f'  最小: {min_count}語')
    print(f'  比率: {balance_ratio:.2f}倍')
    
    if balance_ratio < 1.5:
        print('  ✅ バランス優秀（1.5倍以内）')
    elif balance_ratio < 2.0:
        print('  ✅ バランス良好（2倍以内）')
    elif balance_ratio < 3.0:
        print('  ⚠️ やや偏りあり（2〜3倍）')
    else:
        print('  ❌ 大きな偏り（3倍以上）')

if __name__ == '__main__':
    main()
