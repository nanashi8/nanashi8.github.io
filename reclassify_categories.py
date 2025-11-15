#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高校受験英単語のカテゴリーを20分類から10分類に再分類するスクリプト
"""

import csv
from collections import Counter

# 旧カテゴリーから新カテゴリーへのマッピング
CATEGORY_MAPPING = {
    # 文法機能語
    '文法': '文法機能語',
    
    # 日常・家庭
    '日常': '日常・家庭',
    '家族': '日常・家庭',
    '買い物': '日常・家庭',
    
    # 学校・教育
    '学校': '学校・教育',
    
    # 仕事・職業
    '職業': '仕事・職業',
    
    # 人・感情
    '感情': '人・感情',
    
    # 自然・生物
    '動物': '自然・生物',
    '自然': '自然・生物',
    
    # 地理・旅行
    '地理': '地理・旅行',
    '交通': '地理・旅行',
    '旅行': '地理・旅行',
    
    # 食・健康・運動
    '食べ物': '食・健康・運動',
    '健康': '食・健康・運動',
    'スポーツ': '食・健康・運動',
    
    # 文化・娯楽
    '文化': '文化・娯楽',
    '時間': '文化・娯楽',
    
    # 科学・技術
    '科学': '科学・技術',
    'テクノロジー': '科学・技術',
    
    # その他は内容に応じて適切に振り分け（後で個別処理）
    'その他': 'その他',
    '上級': 'その他',  # 難易度が誤ってカテゴリーに入っているもの
}

def reclassify_category(old_category, word, meaning, difficulty):
    """
    旧カテゴリーを新カテゴリーに変換
    「その他」は単語の意味から適切なカテゴリーを推測
    """
    # マッピングにある場合はそれを使用
    if old_category in CATEGORY_MAPPING and CATEGORY_MAPPING[old_category] != 'その他':
        return CATEGORY_MAPPING[old_category]
    
    # 「その他」や不明なカテゴリーの場合、意味と単語から判断
    word_lower = word.lower()
    meaning_lower = meaning.lower()
    
    # 明確な文法機能語のリスト（限定的に）
    strict_grammar_words = {
        # 代名詞
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
        'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
        'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
        # 冠詞・限定詞
        'the', 'a', 'an', 'some', 'any', 'each', 'every', 'all', 'both', 'either', 'neither',
        # 前置詞
        'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'of', 'about', 'as', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among',
        'under', 'over', 'up', 'down', 'out', 'off', 'away',
        # 接続詞
        'and', 'but', 'or', 'so', 'yet', 'nor', 'for', 'because', 'if', 'when', 'while',
        'although', 'though', 'unless', 'until', 'since', 'as',
        # 助動詞
        'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
        'do', 'does', 'did', 'done', 'doing',
        'have', 'has', 'had', 'having',
        'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
        # その他の機能語
        'not', 'no', 'yes', 'there', 'here', 'where', 'how', 'why', 'whose'
    }
    
    if word_lower in strict_grammar_words:
        return '文法機能語'
    
    # カテゴリー判定（優先順位順）
    
    # 1. 感情・人（感情表現は優先度高）
    emotion_keywords = ['感情', '感じ', '気持ち', '喜', '怒', '哀', '楽', '悲し', '嬉し', '怖', '恐', '愛', '憎',
                       '性格', '態度', '優し', '親切', '意地悪', '恥', '誇', '驚', '不安', '心配', '満足']
    if any(k in meaning for k in emotion_keywords):
        return '人・感情'
    
    # 2. 食べ物・健康・運動
    food_health_keywords = ['食べ', '飲', '料理', '味', '甘', '辛', '酸', '苦', '肉', '魚', '野菜', '果物',
                           '体', '身体', '健康', '病', '医', '痛', '熱', '薬', '治',
                           'スポーツ', '運動', '走', '泳', '投げ', '蹴', '試合', '競技', '選手']
    if any(k in meaning for k in food_health_keywords):
        return '食・健康・運動'
    
    # 3. 動物・自然
    nature_keywords = ['動物', '鳥', '魚', '虫', '獣', '犬', '猫', '馬', '牛', '豚',
                      '植物', '木', '花', '草', '葉', '根', '枝',
                      '天気', '気候', '雨', '風', '雪', '雲', '空', '晴', '曇', '霧', '雷',
                      '自然', '森', '林', '野', '環境']
    if any(k in meaning for k in nature_keywords):
        return '自然・生物'
    
    # 4. 地理・旅行・交通
    geography_keywords = ['地理', '国', '都市', '町', '村', '州', '県', '首都', '山', '川', '海', '湖', '島', '谷', '岸', '丘',
                         '旅', '旅行', '観光', 'ホテル', '宿',
                         '交通', '道', '通り', '橋', '駅', '港', '空港', '車', '電車', 'バス', '飛行機', '船', '自転車',
                         '乗', '運転', '運ぶ', '移動']
    if any(k in meaning for k in geography_keywords):
        return '地理・旅行'
    
    # 5. 学校・教育
    school_keywords = ['学', '教', '授業', '先生', '教師', '生徒', '学生', '児童', '勉強', '学習',
                      '試験', 'テスト', '宿題', '科目', '数学', '英語', '国語', '理科', '社会',
                      '教室', '学校', '大学', '図書']
    if any(k in meaning for k in school_keywords):
        return '学校・教育'
    
    # 6. 仕事・職業
    work_keywords = ['仕事', '職', '働', '労働', '雇', '会社', '企業', 'ビジネス', '商', '売', '買',
                    '経済', '金', 'お金', '給料', '収入', '社員', '店員', '医者', '看護師', '教師',
                    '警察', '消防', '農', '漁', '工場', 'オフィス', '会議']
    if any(k in meaning for k in work_keywords):
        return '仕事・職業'
    
    # 7. 文化・娯楽・時間
    culture_keywords = ['文化', '伝統', '習慣', '祭', '行事', '式', '儀式',
                       '芸術', '音楽', '歌', '楽器', '演奏', '絵', '画', '彫刻', '映画', '劇', '演劇',
                       '本', '書', '物語', '詩', '小説',
                       '時間', '時', '分', '秒', '日', '週', '月', '年', '季節', '朝', '昼', '夜', '夕',
                       '今', '昔', '昨日', '今日', '明日', '過去', '現在', '未来',
                       '娯楽', '遊', '趣味', 'ゲーム']
    if any(k in meaning for k in culture_keywords):
        return '文化・娯楽'
    
    # 8. 科学・技術
    science_keywords = ['科学', '技術', '研究', '実験', '発明', '発見',
                       '数', '計算', '数学', '図', '形',
                       '機械', 'コンピュータ', '電気', '電子', 'エネルギー', '原子',
                       '化学', '物理', '生物学', '地学']
    if any(k in meaning for k in science_keywords):
        return '科学・技術'
    
    # 9. 日常・家庭
    daily_keywords = ['家', '部屋', '家族', '親', '父', '母', '兄', '姉', '弟', '妹', '子', '孫',
                     '日常', '生活', '住', '暮らし', '掃除', '洗', '料理',
                     '買', '店', '市場', 'スーパー', '商品', '服', '着', '靴']
    if any(k in meaning for k in daily_keywords):
        return '日常・家庭'
    
    # 10. 動詞・形容詞・副詞の一般的な語彙は意味に応じて振り分け
    # 抽象的な動詞・形容詞（状態・動作・性質など）
    abstract_keywords = ['状態', '様子', '〜する', '〜である', '〜になる', '〜させる',
                        '〜的', '〜性', '程度', '非常に', 'とても', '少し']
    
    # 抽象的な語で、他のカテゴリーに該当しないものは文法機能語扱い
    if any(k in meaning for k in abstract_keywords) and len(meaning) < 20:
        return '文法機能語'
    
    # それでも分類できない場合
    # 名詞系は日常・家庭、動詞・形容詞・副詞系は文法機能語
    if '〜する' in meaning or '〜させる' in meaning or '〜される' in meaning:
        return '文法機能語'
    elif '〜い' in meaning or '〜な' in meaning or '〜的' in meaning:
        return '文法機能語'
    else:
        return '日常・家庭'

def main():
    input_file = 'public/data/junior-high-entrance-words.csv'
    output_file = 'public/data/junior-high-entrance-words.csv.new'
    
    rows = []
    
    # CSVを読み込み
    print("CSVファイルを読み込んでいます...")
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            # Noneキーを削除（余分な列がある場合）
            if None in row:
                del row[None]
            
            old_category = row['関連分野']
            new_category = reclassify_category(
                old_category, 
                row['語句'], 
                row['意味'],
                row['難易度']
            )
            row['関連分野'] = new_category
            rows.append(row)
    
    print(f"総単語数: {len(rows)}語")
    
    # 新しいカテゴリーでCSVを書き込み
    print("\n新しいカテゴリーでCSVを書き込んでいます...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    # カテゴリー別の集計
    print("\n【新カテゴリー別の単語数】")
    category_counter = Counter([row['関連分野'] for row in rows])
    for cat, count in sorted(category_counter.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(rows)) * 100
        print(f"{cat}: {count}語 ({percentage:.1f}%)")
    
    print(f"\n✅ 完了！新しいファイルを {output_file} に保存しました。")
    print("確認後、以下のコマンドで元のファイルを置き換えてください:")
    print(f"mv {output_file} {input_file}")

if __name__ == '__main__':
    main()
