import csv
import json

# 英語の不規則動詞の活用形データベース（主要なもの）
IRREGULAR_VERBS = {
    'be': {'past': ['was', 'were'], 'past_participle': 'been', 'present_participle': 'being', 'third_person': 'is'},
    'have': {'past': 'had', 'past_participle': 'had', 'present_participle': 'having', 'third_person': 'has'},
    'do': {'past': 'did', 'past_participle': 'done', 'present_participle': 'doing', 'third_person': 'does'},
    'go': {'past': 'went', 'past_participle': 'gone', 'present_participle': 'going', 'third_person': 'goes'},
    'make': {'past': 'made', 'past_participle': 'made', 'present_participle': 'making', 'third_person': 'makes'},
    'take': {'past': 'took', 'past_participle': 'taken', 'present_participle': 'taking', 'third_person': 'takes'},
    'come': {'past': 'came', 'past_participle': 'come', 'present_participle': 'coming', 'third_person': 'comes'},
    'see': {'past': 'saw', 'past_participle': 'seen', 'present_participle': 'seeing', 'third_person': 'sees'},
    'know': {'past': 'knew', 'past_participle': 'known', 'present_participle': 'knowing', 'third_person': 'knows'},
    'get': {'past': 'got', 'past_participle': 'gotten', 'present_participle': 'getting', 'third_person': 'gets'},
    'give': {'past': 'gave', 'past_participle': 'given', 'present_participle': 'giving', 'third_person': 'gives'},
    'find': {'past': 'found', 'past_participle': 'found', 'present_participle': 'finding', 'third_person': 'finds'},
    'think': {'past': 'thought', 'past_participle': 'thought', 'present_participle': 'thinking', 'third_person': 'thinks'},
    'tell': {'past': 'told', 'past_participle': 'told', 'present_participle': 'telling', 'third_person': 'tells'},
    'become': {'past': 'became', 'past_participle': 'become', 'present_participle': 'becoming', 'third_person': 'becomes'},
    'leave': {'past': 'left', 'past_participle': 'left', 'present_participle': 'leaving', 'third_person': 'leaves'},
    'feel': {'past': 'felt', 'past_participle': 'felt', 'present_participle': 'feeling', 'third_person': 'feels'},
    'bring': {'past': 'brought', 'past_participle': 'brought', 'present_participle': 'bringing', 'third_person': 'brings'},
    'begin': {'past': 'began', 'past_participle': 'begun', 'present_participle': 'beginning', 'third_person': 'begins'},
    'keep': {'past': 'kept', 'past_participle': 'kept', 'present_participle': 'keeping', 'third_person': 'keeps'},
    'hold': {'past': 'held', 'past_participle': 'held', 'present_participle': 'holding', 'third_person': 'holds'},
    'write': {'past': 'wrote', 'past_participle': 'written', 'present_participle': 'writing', 'third_person': 'writes'},
    'stand': {'past': 'stood', 'past_participle': 'stood', 'present_participle': 'standing', 'third_person': 'stands'},
    'hear': {'past': 'heard', 'past_participle': 'heard', 'present_participle': 'hearing', 'third_person': 'hears'},
    'let': {'past': 'let', 'past_participle': 'let', 'present_participle': 'letting', 'third_person': 'lets'},
    'mean': {'past': 'meant', 'past_participle': 'meant', 'present_participle': 'meaning', 'third_person': 'means'},
    'set': {'past': 'set', 'past_participle': 'set', 'present_participle': 'setting', 'third_person': 'sets'},
    'meet': {'past': 'met', 'past_participle': 'met', 'present_participle': 'meeting', 'third_person': 'meets'},
    'run': {'past': 'ran', 'past_participle': 'run', 'present_participle': 'running', 'third_person': 'runs'},
    'pay': {'past': 'paid', 'past_participle': 'paid', 'present_participle': 'paying', 'third_person': 'pays'},
    'sit': {'past': 'sat', 'past_participle': 'sat', 'present_participle': 'sitting', 'third_person': 'sits'},
    'speak': {'past': 'spoke', 'past_participle': 'spoken', 'present_participle': 'speaking', 'third_person': 'speaks'},
    'lie': {'past': 'lay', 'past_participle': 'lain', 'present_participle': 'lying', 'third_person': 'lies'},
    'lead': {'past': 'led', 'past_participle': 'led', 'present_participle': 'leading', 'third_person': 'leads'},
    'read': {'past': 'read', 'past_participle': 'read', 'present_participle': 'reading', 'third_person': 'reads'},
    'grow': {'past': 'grew', 'past_participle': 'grown', 'present_participle': 'growing', 'third_person': 'grows'},
    'lose': {'past': 'lost', 'past_participle': 'lost', 'present_participle': 'losing', 'third_person': 'loses'},
    'fall': {'past': 'fell', 'past_participle': 'fallen', 'present_participle': 'falling', 'third_person': 'falls'},
    'send': {'past': 'sent', 'past_participle': 'sent', 'present_participle': 'sending', 'third_person': 'sends'},
    'build': {'past': 'built', 'past_participle': 'built', 'present_participle': 'building', 'third_person': 'builds'},
    'understand': {'past': 'understood', 'past_participle': 'understood', 'present_participle': 'understanding', 'third_person': 'understands'},
    'draw': {'past': 'drew', 'past_participle': 'drawn', 'present_participle': 'drawing', 'third_person': 'draws'},
    'break': {'past': 'broke', 'past_participle': 'broken', 'present_participle': 'breaking', 'third_person': 'breaks'},
    'spend': {'past': 'spent', 'past_participle': 'spent', 'present_participle': 'spending', 'third_person': 'spends'},
    'cut': {'past': 'cut', 'past_participle': 'cut', 'present_participle': 'cutting', 'third_person': 'cuts'},
    'rise': {'past': 'rose', 'past_participle': 'risen', 'present_participle': 'rising', 'third_person': 'rises'},
    'drive': {'past': 'drove', 'past_participle': 'driven', 'present_participle': 'driving', 'third_person': 'drives'},
    'buy': {'past': 'bought', 'past_participle': 'bought', 'present_participle': 'buying', 'third_person': 'buys'},
    'wear': {'past': 'wore', 'past_participle': 'worn', 'present_participle': 'wearing', 'third_person': 'wears'},
    'choose': {'past': 'chose', 'past_participle': 'chosen', 'present_participle': 'choosing', 'third_person': 'chooses'},
    'seek': {'past': 'sought', 'past_participle': 'sought', 'present_participle': 'seeking', 'third_person': 'seeks'},
    'throw': {'past': 'threw', 'past_participle': 'thrown', 'present_participle': 'throwing', 'third_person': 'throws'},
    'catch': {'past': 'caught', 'past_participle': 'caught', 'present_participle': 'catching', 'third_person': 'catches'},
    'deal': {'past': 'dealt', 'past_participle': 'dealt', 'present_participle': 'dealing', 'third_person': 'deals'},
    'win': {'past': 'won', 'past_participle': 'won', 'present_participle': 'winning', 'third_person': 'wins'},
    'forget': {'past': 'forgot', 'past_participle': 'forgotten', 'present_participle': 'forgetting', 'third_person': 'forgets'},
    'fight': {'past': 'fought', 'past_participle': 'fought', 'present_participle': 'fighting', 'third_person': 'fights'},
    'teach': {'past': 'taught', 'past_participle': 'taught', 'present_participle': 'teaching', 'third_person': 'teaches'},
    'eat': {'past': 'ate', 'past_participle': 'eaten', 'present_participle': 'eating', 'third_person': 'eats'},
    'sell': {'past': 'sold', 'past_participle': 'sold', 'present_participle': 'selling', 'third_person': 'sells'},
    'sing': {'past': 'sang', 'past_participle': 'sung', 'present_participle': 'singing', 'third_person': 'sings'},
    'fly': {'past': 'flew', 'past_participle': 'flown', 'present_participle': 'flying', 'third_person': 'flies'},
    'ride': {'past': 'rode', 'past_participle': 'ridden', 'present_participle': 'riding', 'third_person': 'rides'},
    'swim': {'past': 'swam', 'past_participle': 'swum', 'present_participle': 'swimming', 'third_person': 'swims'},
    'shake': {'past': 'shook', 'past_participle': 'shaken', 'present_participle': 'shaking', 'third_person': 'shakes'},
    'hide': {'past': 'hid', 'past_participle': 'hidden', 'present_participle': 'hiding', 'third_person': 'hides'},
    'wake': {'past': 'woke', 'past_participle': 'woken', 'present_participle': 'waking', 'third_person': 'wakes'},
    'blow': {'past': 'blew', 'past_participle': 'blown', 'present_participle': 'blowing', 'third_person': 'blows'},
    'shine': {'past': 'shone', 'past_participle': 'shone', 'present_participle': 'shining', 'third_person': 'shines'},
    'shoot': {'past': 'shot', 'past_participle': 'shot', 'present_participle': 'shooting', 'third_person': 'shoots'},
    'steal': {'past': 'stole', 'past_participle': 'stolen', 'present_participle': 'stealing', 'third_person': 'steals'},
    'drink': {'past': 'drank', 'past_participle': 'drunk', 'present_participle': 'drinking', 'third_person': 'drinks'},
    'ring': {'past': 'rang', 'past_participle': 'rung', 'present_participle': 'ringing', 'third_person': 'rings'},
}

def get_regular_verb_forms(verb):
    """規則動詞の活用形を生成"""
    forms = {}
    
    # 過去形・過去分詞（-ed）
    if verb.endswith('e'):
        forms['past'] = verb + 'd'
        forms['past_participle'] = verb + 'd'
    elif verb.endswith('y') and len(verb) > 2 and verb[-2] not in 'aeiou':
        forms['past'] = verb[:-1] + 'ied'
        forms['past_participle'] = verb[:-1] + 'ied'
    elif len(verb) >= 3 and verb[-1] not in 'aeiou' and verb[-2] in 'aeiou' and verb[-3] not in 'aeiou':
        # CVC pattern: stop -> stopped
        forms['past'] = verb + verb[-1] + 'ed'
        forms['past_participle'] = verb + verb[-1] + 'ed'
    else:
        forms['past'] = verb + 'ed'
        forms['past_participle'] = verb + 'ed'
    
    # 三単現（-s/-es）
    if verb.endswith(('s', 'x', 'z', 'ch', 'sh', 'o')):
        forms['third_person'] = verb + 'es'
    elif verb.endswith('y') and len(verb) > 2 and verb[-2] not in 'aeiou':
        forms['third_person'] = verb[:-1] + 'ies'
    else:
        forms['third_person'] = verb + 's'
    
    # 現在分詞（-ing）
    if verb.endswith('ie'):
        forms['present_participle'] = verb[:-2] + 'ying'
    elif verb.endswith('e') and not verb.endswith('ee'):
        forms['present_participle'] = verb[:-1] + 'ing'
    elif len(verb) >= 3 and verb[-1] not in 'aeiouwxy' and verb[-2] in 'aeiou' and verb[-3] not in 'aeiou':
        # CVC pattern: stop -> stopping
        forms['present_participle'] = verb + verb[-1] + 'ing'
    else:
        forms['present_participle'] = verb + 'ing'
    
    return forms

def get_verb_conjugations(verb):
    """動詞の活用形を取得（不規則動詞を優先）"""
    verb_lower = verb.lower()
    
    if verb_lower in IRREGULAR_VERBS:
        return IRREGULAR_VERBS[verb_lower]
    else:
        return get_regular_verb_forms(verb_lower)

# テスト
test_verbs = ['walk', 'study', 'stop', 'like', 'try', 'go', 'have', 'be']
for v in test_verbs:
    forms = get_verb_conjugations(v)
    print(f"{v}: {forms}")
