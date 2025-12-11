#!/usr/bin/env python3
"""
文法問題で日本語訳が文法用語になっているものを修正するスクリプト
paraphrase問題: correctAnswerの日本語訳を使用
その他: sentenceまたは適切な文の日本語訳を使用
"""

import json
import sys
from pathlib import Path

# 手動で作成した日本語訳マッピング
TRANSLATIONS = {
    # grammar_grade1_unit0.json
    "g1-u0-vf-015": "彼女は学生ではありません。",
    "g1-u0-conv-005": "はい、私は学生です。",
    
    # grammar_grade1_unit1.json  
    "g1-u1-para-015": "私は本を愛しています。",
    
    # grammar_grade1_unit3.json
    "g1-u3-para-001": "それらは本です。",
    "g1-u3-para-002": "これらはペンです。",
    "g1-u3-para-003": "これは本です。",
    "g1-u3-para-004": "あれらはボールです。",
    "g1-u3-para-012": "それらはボールです。",
    
    # grammar_grade1_unit5.json
    "g1-u5-para-015": "彼は泳ぐことができません。",
    
    # grammar_grade1_unit6.json
    "g1-u6-para-015": "彼女は学生ではありません。",
    
    # grammar_grade1_unit7.json
    "g1-u7-para-001": "ドアを開けなさい。",
    "g1-u7-para-002": "走らないで。",
    "g1-u7-para-003": "寝なさい。",
    "g1-u7-para-004": "一緒に勉強しましょう。",
    "g1-u7-para-005": "静かにしなさい。",
    "g1-u7-para-006": "走らないで。",
    "g1-u7-para-007": "お願いします、手伝ってください。",
    "g1-u7-para-008": "一緒に遊びましょうか。",
    "g1-u7-para-009": "話さないで。",
    "g1-u7-para-010": "静かにしなさい。",
    "g1-u7-para-011": "暑いので窓を開けなさい。",
    "g1-u7-para-012": "遅刻しないで。",
    "g1-u7-para-013": "一緒に行かないでおきましょう。",
    "g1-u7-para-014": "本当に頑張りなさい。",
    "g1-u7-para-015": "本を読んでみませんか。",
    "g1-u7-vf-015": "ドアを開けなさい。",
    "g1-u7-vf-016": "話しなさい。",
    "g1-u7-vf-017": "静かにしなさい。",
    "g1-u7-vf-018": "遅刻しないで。",
    "g1-u7-vf-019": "勉強しなさい。",
    
    # grammar_grade2_unit0.json
    "g2-u0-para-001": "私は昨日忙しかったです。",
    "g2-u0-para-002": "彼は先週学校にいました。",
    "g2-u0-para-003": "彼らは昨日家にいました。",
    "g2-u0-para-004": "私は昨日忙しくありませんでした。",
    "g2-u0-para-005": "彼は昨日学校にいませんでした。",
    "g2-u0-para-006": "あなたは昨日忙しかったですか。",
    "g2-u0-para-007": "彼らは昨日家にいましたか。",
    "g2-u0-para-008": "私は今忙しいです。",
    "g2-u0-para-009": "彼らは今家にいます。",
    
    # grammar_grade2_unit1.json
    "g2-u1-para-001": "私は昨日勉強していました。",
    "g2-u1-para-002": "彼は昨日走っていました。",
    "g2-u1-para-003": "彼らは昨日遊んでいました。",
    "g2-u1-para-004": "私は昨日勉強していませんでした。",
    "g2-u1-para-005": "彼は昨日走っていませんでした。",
    "g2-u1-para-006": "あなたは昨日勉強していましたか。",
    "g2-u1-para-007": "彼らは昨日遊んでいましたか。",
    "g2-u1-para-008": "私は昨日勉強しました。",
    "g2-u1-para-009": "彼は今勉強しています。",
}

def fix_japanese_translations(data, file_id=None):
    """文法用語になっている日本語訳を修正"""
    modified = False
    
    if isinstance(data, dict):
        # 問題IDがある場合
        question_id = data.get("id")
        if question_id and question_id in TRANSLATIONS:
            if data.get("japanese") != TRANSLATIONS[question_id]:
                data["japanese"] = TRANSLATIONS[question_id]
                modified = True
                print(f"  ✓ {question_id}: {data['japanese']}")
        
        # 再帰的に処理
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                if fix_japanese_translations(value, file_id):
                    modified = True
    elif isinstance(data, list):
        for item in data:
            if fix_japanese_translations(item, file_id):
                modified = True
    
    return modified

def main():
    grammar_dir = Path("public/data/grammar")
    
    if not grammar_dir.exists():
        print(f"❌ ディレクトリが見つかりません: {grammar_dir}")
        sys.exit(1)
    
    json_files = sorted(grammar_dir.glob("grammar_*.json"))
    
    if not json_files:
        print(f"❌ 文法ファイルが見つかりません: {grammar_dir}")
        sys.exit(1)
    
    total_files = 0
    modified_files = 0
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            file_modified = fix_japanese_translations(data, json_file.stem)
            
            if file_modified:
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    f.write('\n')
                
                modified_files += 1
                print(f"✅ 修正: {json_file.name}")
            
            total_files += 1
            
        except Exception as e:
            print(f"❌ エラー ({json_file.name}): {e}")
            sys.exit(1)
    
    print(f"\n📊 完了: {modified_files}/{total_files}ファイルを修正しました")

if __name__ == "__main__":
    main()
