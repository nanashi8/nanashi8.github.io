#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV fixer for 中学英会話.csv
- Fix rows where `phrase` contains commas that break column splitting
- Translate relatedWords (semicolon-separated) from English tokens to Japanese

Usage:
    python3 fix_chu_english_conv.py
"""
import csv
from pathlib import Path
import shutil

SRC = Path(__file__).resolve().parents[1] / 'Resources' / '中学英会話.csv'
BACKUP = SRC.with_suffix('.csv.bak')

# Mapping of relatedWords tokens to Japanese
MAP = {
    'greeting': '挨拶',
    'small talk': '世間話',
    'polite': '丁寧',
    'offer': '申し出',
    'assistance': '援助',
    'apology': '謝罪',
    'ask': '質問',
    'time': '時間',
    'direction': '道案内',
    'travel': '旅行',
    'request': '依頼',
    'clarify': '明確化',
    'reply': '返答',
    'attention': '注意',
    'confusion': '混乱',
    'name': '名前',
    'introductions': '自己紹介',
    'identity': '身元',
    'origin': '出身',
    'family': '家族',
    'personal': '個人',
    'school': '学校',
    'basic': '基本',
    'hobby': '趣味',
    'preference': '好み',
    'sports': 'スポーツ',
    'leisure': '余暇',
    'food': '食べ物',
    'japanese': '日本料理',
    'beverage': '飲み物',
    'response': '返答',
    'restaurant': 'レストラン',
    'payment': '支払い',
    'facility': '施設',
    'shopping': '買い物',
    'price': '価格',
    'clothes': '服',
    'purchase': '購入',
    'communication': 'コミュニケーション',
    'uncertainty': '不確実',
    'check': '確認',
    'understand': '理解',
    'confirmation': '確認',
    'feeling': '感情',
    'suggestion': '提案',
    'opinion': '意見',
    'dislike': '嫌い',
    'weather': '天気',
    'description': '説明',
    'advice': '助言',
    'plans': '予定',
    'future': '未来',
    'invitation': '招待',
    'join': '参加',
    'agree': '同意',
    'action': '行動',
    'warning': '警告',
    'safety': '安全',
    'health': '健康',
    'rest': '休憩',
    'item': '持ち物',
    'borrow': '借用',
    'classroom': '教室',
    'command': '指示',
    'help': '助け',
    'trouble': '問題',
    'symptom': '症状',
    'urgent': '緊急',
    'transport': '交通',
    'duration': '所要時間',
    'navigation': '案内',
    'camera': 'カメラ',
    'wait': '待機',
    'hotel': 'ホテル',
    'service': 'サービス',
    'internet': 'インターネット',
    'access': 'アクセス',
    'cancel': 'キャンセル',
    'party': 'パーティー',
    'turn': '順番',
    'practice': '練習',
    'pronunciation': '発音',
    'past': '過去',
    'distance': '距離',
    'location': '場所',
    'proximity': '近接',
    'recommendation': '推薦',
    'books': '本',
    'subject': '教科',
    'study': '学習',
    'learning': '学習',
    'education': '教育',
    'vocabulary': '語彙',
    'phone': '電話',
    'contact': '連絡先',
    'information': '情報',
    'privacy': 'プライバシー',
    'budget': '予算',
    'lost': '紛失',
    # additional translations discovered from file analysis
    'ability': '能力',
    'absent': '欠席',
    'accept': '受け入れ',
    'age': '年齢',
    'agreement': '同意',
    'anticipation': '期待',
    'approve': '承認',
    'arrange': '手配',
    'arrival': '到着',
    'association': '連想',
    'attempt': '試み',
    'calendar': 'カレンダー',
    'casual': 'カジュアル',
    'celebration': '祝賀',
    'checkin': 'チェックイン',
    'chore': '雑用',
    'comfort': '安心',
    'comment': 'コメント',
    'common': '共通',
    'concern': '懸念',
    'conversation': '会話',
    'culture': '文化',
    'date': '日付',
    'definition': '定義',
    'determination': '決意',
    'disagreement': '不一致',
    'discussion': '討論',
    'drink': '飲み物',
    'emergency': '緊急',
    'emotion': '感情',
    'encourage': '励ます',
    'encouragement': '励まし',
    'entertainment': '娯楽',
    'excuse': '言い訳',
    'explain': '説明する',
    'explanation': '説明',
    'farewell': '別れ',
    'form': 'フォーム',
    'formal': '正式',
    'game': 'ゲーム',
    'grammar': '文法',
    'gratitude': '感謝',
    'group': 'グループ',
    'habit': '習慣',
    'inquiry': '問い合わせ',
    'instruction': '指示',
    'interest': '興味',
    'interpret': '解釈する',
    'invite': '招待',
    'language': '言語',
    'limit': '制限',
    'meet': '会う',
    'meeting': '会合',
    'memory': '記憶',
    'money': 'お金',
    'motivation': '動機',
    'night': '夜',
    'order': '注文',
    'parting': '別れ',
    'people': '人々',
    'permission': '許可',
    'plan': '計画',
    'praise': '称賛',
    'problem': '問題',
    'promise': '約束',
    'punctuality': '時間厳守',
    'question': '質問',
    'reading': '読解',
    'reason': '理由',
    'reassure': '安心させる',
    'room': '部屋',
    'routine': '日課',
    'rule': '規則',
    'search': '捜索',
    'seat': '席',
    'security': 'セキュリティ',
    'short': '短い',
    'skill': '技能',
    'store': '店',
    'support': '支援',
    'tip': 'チップ',
    'toast': '乾杯',
    'translation': '翻訳',
    'trust': '信頼',
    'welcome': '歓迎',
    'wish': '願い'
}


def translate_related_field(field_value: str) -> str:
    parts = [p.strip() for p in field_value.split(';') if p.strip()]
    translated = []
    for p in parts:
        key = p.lower()
        if key in MAP:
            translated.append(MAP[key])
        else:
            # Try simple normalizations
            if key.replace(' ', '') in MAP:
                translated.append(MAP[key.replace(' ', '')])
            else:
                # fallback: keep original token
                translated.append(p)
    return ';'.join(translated)


def fix_csv(path: Path):
    if not path.exists():
        print(f"Source CSV not found: {path}")
        return
    # Backup
    # Copy to backup (do not remove original) if backup does not already exist
    if not BACKUP.exists():
        shutil.copy2(path, BACKUP)
    # else: backup already exists, skip

    # Read raw lines to handle malformed CSV rows
    lines = path.read_text(encoding='utf-8').splitlines()

    out_rows = []
    header = None
    for i, raw in enumerate(lines):
        if i == 0:
            header = raw
            out_rows.append(header)
            continue
        # Use csv reader for the line
        reader = csv.reader([raw])
        fields = next(reader)
        # If fields less than 7 just keep as-is
        if len(fields) < 7:
            # try more robust splitting by comma counts using the original line
            parts = raw.split(',')
            if len(parts) >= 7:
                fields = parts
            else:
                # skip malformed
                print(f"Skipping malformed line {i+1}")
                out_rows.append(raw)
                continue
        # If there are more than 7 fields, assume extra commas are in phrase (first field)
        if len(fields) > 7:
            # phrase is the prefix that consumes the extra fields
            num_extra = len(fields) - 7
            phrase_parts = fields[0:num_extra+1]
            phrase = ','.join(phrase_parts)
            # the rest 6 fields are last 6
            rest = fields[num_extra+1:]
            if len(rest) != 6:
                # fallback: take last 6 fields
                rest = fields[-6:]
            reading, meaning, etymology, paraphrase, related, difficulty = [r.strip() for r in rest]
        else:
            phrase, reading, meaning, etymology, paraphrase, related, difficulty = [f.strip() for f in fields]
        # Translate related
        related_jp = translate_related_field(related)
        # Prepare to write using csv writer later; store as list
        out_rows.append([phrase, reading, meaning, etymology, paraphrase, related_jp, difficulty])

    # Write back using csv.writer to ensure quoting for commas
    with path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        # header: write as header row
        # header maybe string or existing fields
        header_fields = header.split(',') if isinstance(header, str) else header
        writer.writerow(header_fields)
        for r in out_rows[1:]:
            writer.writerow(r)

    print(f"Fixed CSV written to {path}")


if __name__ == '__main__':
    fix_csv(SRC)
