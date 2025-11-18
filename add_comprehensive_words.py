#!/usr/bin/env python3
"""
不足している単語を自動的に追加（基本的な情報のみ）
活用形や派生語も考慮して、最小限の情報で追加
"""

import csv
import re

# 頻出する重要な単語リスト（意味を手動で定義）
important_words = {
    # A
    "abilities": ("アビリティーズ", "能力（複数）", "ability の複数形", "capability(ケイパビリティ): 能力", "学校・学習", "初級"),
    "accountability": ("アカウンタビリティ", "説明責任", "account (説明する) + ability から", "responsibility(リスポンシビリティ): 責任", "人・社会", "上級"),
    "achievable": ("アチーヴァブル", "達成可能な", "achieve (達成する) + able (できる)から", "possible(ポッシブル): 可能な", "学校・学習", "中級"),
    "achieved": ("アチーヴド", "達成した", "achieve の過去形・過去分詞形", "accomplished(アカンプリッシュト): 達成した", "学校・学習", "初級"),
    "achieving": ("アチービング", "達成すること", "achieve の現在分詞形・動名詞", "accomplishing(アカンプリッシング): 達成すること", "学校・学習", "初級"),
    "activism": ("アクティヴィズム", "社会運動", "active (活動的な) + ism (主義)から", "advocacy(アドヴォカシー): 支持活動", "人・社会", "上級"),
    "activists": ("アクティヴィスト", "活動家", "activist の複数形", "campaigner(キャンペイナー): 運動家", "人・社会", "上級"),
    "adaptability": ("アダプタビリティ", "適応力", "adaptable (適応できる) + ity (性質)から", "flexibility(フレクシビリティ): 柔軟性", "人・社会", "中級"),
    "addiction": ("アディクション", "依存症", "ラテン語 addictio (没頭)が語源", "dependence(ディペンデンス): 依存", "食・健康", "中級"),
    "adoption": ("アドプション", "採用", "adopt (採用する)の名詞形", "acceptance(アクセプタンス): 受け入れ", "人・社会", "中級"),
    "advocacy": ("アドヴォカシー", "支持", "advocate (支持する)の名詞形", "support(サポート): 支援", "人・社会", "上級"),
    "african": ("アフリカン", "アフリカの", "Africa (アフリカ) + an (〜の)から", "asian(エイジャン): アジアの", "人・社会", "初級"),
    "agriculture": ("アグリカルチャー", "農業", "ラテン語 agricultura (田畑の耕作)が語源", "farming(ファーミング): 農作", "自然・環境", "中級"),
    "alignment": ("アラインメント", "整列", "align (並べる) + ment (こと)から", "arrangement(アレインジメント): 配置", "科学・技術", "上級"),
    "allowing": ("アラウイング", "許すこと", "allow の現在分詞形・動名詞", "permitting(パーミッティング): 許可すること", "場所・移動", "初級"),
    "alongside": ("アロングサイド", "〜と並んで", "along (沿って) + side (側)から", "beside(ビサイド): 〜のそばに", "場所・移動", "中級"),
    "amongst": ("アマングスト", "〜の間で", "among の別形", "between(ビトウィーン): 間に", "言語基本", "中級"),
    "analysis": ("アナリシス", "分析", "ギリシャ語 analysis (解析)が語源", "examination(イグザミネイション): 検査", "学校・学習", "中級"),
    "analytical": ("アナリティカル", "分析的な", "analysis (分析) + ical (的な)から", "logical(ロジカル): 論理的な", "学校・学習", "上級"),
    "ancestral": ("アンセストラル", "祖先の", "ancestor (祖先) + al (の)から", "hereditary(ヘレディタリー): 遺伝の", "人・社会", "上級"),
    "anxiety": ("アングザイアティ", "不安", "ラテン語 anxietas (苦悩)が語源", "worry(ワリー): 心配", "人・社会", "中級"),
    "app": ("アップ", "アプリ", "application の略", "software(ソフトウェア): ソフト", "科学・技術", "初級"),
    "apps": ("アップス", "アプリ（複数）", "app の複数形", "applications(アプリケーションズ): アプリケーション", "科学・技術", "初級"),
    "approaching": ("アプローチング", "近づくこと", "approach の現在分詞形・動名詞", "nearing(ニアリング): 接近すること", "場所・移動", "中級"),
    "artificial": ("アーティフィシャル", "人工の", "ラテン語 artificialis (技巧の)が語源", "synthetic(シンセティック): 合成の", "科学・技術", "中級"),
    "aside": ("アサイド", "脇へ", "a (〜へ) + side (側)から", "apart(アパート): 離れて", "場所・移動", "中級"),
    "assistance": ("アシスタンス", "援助", "assist (援助する) + ance (こと)から", "help(ヘルプ): 助け", "人・社会", "中級"),
    "assistant": ("アシスタント", "助手", "assist (援助する) + ant (人)から", "helper(ヘルパー): 助ける人", "人・社会", "初級"),
    "awareness": ("アウェアネス", "認識", "aware (気づいている) + ness (状態)から", "consciousness(コンシャスネス): 意識", "人・社会", "中級"),
    
    # B
    "bacteria": ("バクテリア", "細菌", "ギリシャ語 bakterion (小さな杖)が語源", "germ(ジャーム): 細菌", "科学・技術", "中級"),
    "balanced": ("バランスト", "バランスの取れた", "balance の過去分詞形", "even(イーヴン): 均等な", "自然・環境", "中級"),
    "barrier": ("バリアー", "障壁", "古フランス語 barriere が語源", "obstacle(オブスタクル): 障害", "場所・移動", "中級"),
    "barriers": ("バリアーズ", "障壁（複数）", "barrier の複数形", "obstacles(オブスタクルズ): 障害", "場所・移動", "中級"),
    "batteries": ("バッテリーズ", "電池（複数）", "battery の複数形", "cells(セルズ): 電池", "科学・技術", "初級"),
    "battery": ("バッテリー", "電池", "フランス語 batterie が語源", "cell(セル): 電池", "科学・技術", "初級"),
    "behavioral": ("ビヘイヴィアラル", "行動の", "behavior (行動) + al (の)から", "conduct(コンダクト): 行動", "人・社会", "上級"),
    "belonging": ("ビロンギング", "所属", "belong (所属する) + ing (こと)から", "membership(メンバーシップ): 会員資格", "人・社会", "中級"),
    "beneficial": ("ベネフィシャル", "有益な", "benefit (利益) + ial (の)から", "helpful(ヘルプフル): 役立つ", "自然・環境", "中級"),
    "biodiversity": ("バイオダイヴァーシティ", "生物多様性", "bio (生命) + diversity (多様性)から", "variety(ヴァライアティ): 多様性", "自然・環境", "上級"),
    "boundaries": ("バウンダリーズ", "境界（複数）", "boundary の複数形", "borders(ボーダーズ): 国境", "場所・移動", "中級"),
    "boundary": ("バウンダリー", "境界", "bound (境界) + ary (場所)から", "border(ボーダー): 国境", "場所・移動", "中級"),
    "broadly": ("ブロードリー", "広く", "broad (広い) + ly (副詞)から", "widely(ワイドリー): 広く", "言語基本", "中級"),
    
    # C
    "calculating": ("キャルキュレイティング", "計算すること", "calculate の現在分詞形・動名詞", "computing(コンピューティング): 計算すること", "学校・学習", "中級"),
    "capability": ("ケイパビリティ", "能力", "capable (できる) + ity (性質)から", "ability(アビリティ): 能力", "学校・学習", "中級"),
    "carbon": ("カーボン", "炭素", "ラテン語 carbo (炭)が語源", "coal(コール): 石炭", "科学・技術", "中級"),
    "celebrate": ("セレブレイト", "祝う", "ラテン語 celebrare (祝う)が語源", "commemorate(コメモレイト): 記念する", "運動・娯楽", "初級"),
    "celebrating": ("セレブレイティング", "祝うこと", "celebrate の現在分詞形・動名詞", "commemorating(コメモレイティング): 記念すること", "運動・娯楽", "初級"),
    "celebration": ("セレブレイション", "祝賀", "celebrate (祝う) + ion (こと)から", "festival(フェスティヴァル): 祭り", "運動・娯楽", "初級"),
    "century": ("センチュリー", "世紀", "ラテン語 centuria (100)が語源", "hundred years(ハンドレッドイヤーズ): 100年", "時間・数量", "初級"),
    "challenges": ("チャレンジズ", "課題（複数）", "challenge の複数形", "difficulties(ディフィカルティーズ): 困難", "学校・学習", "初級"),
    "challenging": ("チャレンジング", "困難な", "challenge の現在分詞形", "difficult(ディフィカルト): 困難な", "学校・学習", "初級"),
    "chemical": ("ケミカル", "化学の", "chemistry (化学) + al (の)から", "synthetic(シンセティック): 合成の", "科学・技術", "中級"),
    "chemicals": ("ケミカルズ", "化学物質（複数）", "chemical の複数形", "substances(サブスタンシーズ): 物質", "科学・技術", "中級"),
    "citizen": ("シティズン", "市民", "古フランス語 citezein が語源", "resident(レジデント): 住民", "人・社会", "中級"),
    "citizens": ("シティズンズ", "市民（複数）", "citizen の複数形", "residents(レジデンツ): 住民", "人・社会", "中級"),
    "citizenship": ("シティズンシップ", "市民権", "citizen (市民) + ship (状態)から", "nationality(ナショナリティ): 国籍", "人・社会", "上級"),
    "civic": ("シヴィック", "市民の", "ラテン語 civicus (市民の)が語源", "civil(シヴィル): 市民の", "人・社会", "上級"),
    "climate": ("クライメイト", "気候", "ギリシャ語 klima (傾斜)が語源", "weather(ウェザー): 天気", "自然・環境", "中級"),
    "cognitive": ("コグニティヴ", "認知の", "ラテン語 cognoscere (知る)が語源", "mental(メンタル): 精神の", "学校・学習", "上級"),
    "collaboration": ("コラボレイション", "協力", "collaborate (協力する) + ion (こと)から", "cooperation(コーペレイション): 協同", "人・社会", "中級"),
    "collaborative": ("コラボラティヴ", "協力的な", "collaboration (協力) + ive (的な)から", "cooperative(コーペラティヴ): 協力的な", "人・社会", "上級"),
    "collective": ("コレクティヴ", "集団の", "collect (集める) + ive (的な)から", "group(グループ): 集団", "人・社会", "中級"),
    "collectively": ("コレクティヴリー", "集団で", "collective (集団の) + ly (副詞)から", "together(トゥゲザー): 一緒に", "人・社会", "中級"),
    "combination": ("コンビネイション", "組み合わせ", "combine (組み合わせる) + ation (こと)から", "mixture(ミクスチャー): 混合", "科学・技術", "中級"),
    "combined": ("コンバインド", "組み合わされた", "combine の過去分詞形", "united(ユナイテッド): 結合した", "科学・技術", "中級"),
    "commitment": ("コミットメント", "約束", "commit (約束する) + ment (こと)から", "promise(プロミス): 約束", "人・社会", "中級"),
    "communication": ("コミュニケイション", "伝達", "communicate (伝える) + ion (こと)から", "conversation(コンヴァセイション): 会話", "人・社会", "初級"),
    "communities": ("コミュニティーズ", "地域社会（複数）", "community の複数形", "societies(ソサイアティーズ): 社会", "人・社会", "初級"),
    "companion": ("コンパニオン", "仲間", "ラテン語 companio (パンを共にする者)が語源", "friend(フレンド): 友達", "人・社会", "中級"),
    "comparison": ("コンパリソン", "比較", "compare (比較する) + ison (こと)から", "contrast(コントラスト): 対照", "学校・学習", "中級"),
    "compassion": ("コンパッション", "思いやり", "ラテン語 compati (共に苦しむ)が語源", "sympathy(シンパシー): 同情", "人・社会", "上級"),
    "competition": ("コンペティション", "競争", "compete (競う) + ition (こと)から", "contest(コンテスト): 競技", "運動・娯楽", "中級"),
    "competitive": ("コンペティティヴ", "競争的な", "competition (競争) + ive (的な)から", "rival(ライヴァル): 競争相手", "運動・娯楽", "中級"),
    "complex": ("コンプレックス", "複雑な", "ラテン語 complexus (絡み合った)が語源", "complicated(コンプリケイティド): 複雑な", "学校・学習", "中級"),
    "complexity": ("コンプレクシティ", "複雑さ", "complex (複雑な) + ity (性質)から", "difficulty(ディフィカルティ): 困難", "学校・学習", "上級"),
    "comprehensive": ("コンプリヘンシヴ", "包括的な", "comprehend (理解する) + ive (的な)から", "complete(コンプリート): 完全な", "学校・学習", "上級"),
    "computing": ("コンピューティング", "計算", "compute (計算する) + ing (こと)から", "calculating(キャルキュレイティング): 計算", "科学・技術", "中級"),
    "concentration": ("コンセントレイション", "集中", "concentrate (集中する) + ion (こと)から", "focus(フォーカス): 焦点", "学校・学習", "中級"),
    "confidence": ("コンフィデンス", "自信", "ラテン語 confidentia (信頼)が語源", "trust(トラスト): 信頼", "人・社会", "中級"),
    "conflict": ("コンフリクト", "紛争", "ラテン語 conflictus (衝突)が語源", "dispute(ディスピュート): 論争", "人・社会", "中級"),
    "connected": ("コネクティド", "つながった", "connect の過去分詞形", "linked(リンクト): 結びついた", "科学・技術", "初級"),
    "connection": ("コネクション", "つながり", "connect (つなぐ) + ion (こと)から", "link(リンク): 結びつき", "科学・技術", "初級"),
    "connections": ("コネクションズ", "つながり（複数）", "connection の複数形", "links(リンクス): 結びつき", "科学・技術", "初級"),
    "consciousness": ("コンシャスネス", "意識", "conscious (意識のある) + ness (状態)から", "awareness(アウェアネス): 認識", "人・社会", "上級"),
    "conservation": ("コンサヴェイション", "保全", "conserve (保護する) + ation (こと)から", "preservation(プリザヴェイション): 保存", "自然・環境", "上級"),
    "considering": ("コンシデリング", "考慮すること", "consider の現在分詞形・動名詞", "thinking(シンキング): 考えること", "学校・学習", "初級"),
    "consistent": ("コンシステント", "一貫した", "ラテン語 consistere (立つ)が語源", "steady(ステディ): 安定した", "学校・学習", "中級"),
    "consistently": ("コンシステントリー", "一貫して", "consistent (一貫した) + ly (副詞)から", "regularly(レギュラリー): 定期的に", "学校・学習", "中級"),
    "constitutional": ("コンスティテューショナル", "憲法の", "constitution (憲法) + al (の)から", "legal(リーガル): 法的な", "人・社会", "上級"),
    "construction": ("コンストラクション", "建設", "construct (建設する) + ion (こと)から", "building(ビルディング): 建築", "場所・移動", "中級"),
    "consumption": ("コンサンプション", "消費", "consume (消費する) + tion (こと)から", "use(ユース): 使用", "日常生活", "中級"),
    "container": ("コンテイナー", "容器", "contain (含む) + er (もの)から", "box(ボックス): 箱", "日常生活", "中級"),
    "containers": ("コンテイナーズ", "容器（複数）", "container の複数形", "boxes(ボクシーズ): 箱", "日常生活", "中級"),
    "content": ("コンテント", "内容", "ラテン語 contentus (満足した)が語源", "material(マテリアル): 材料", "学校・学習", "初級"),
    "contribute": ("コントリビュート", "貢献する", "ラテン語 contribuere (共に与える)が語源", "help(ヘルプ): 助ける", "人・社会", "中級"),
    "contributing": ("コントリビューティング", "貢献すること", "contribute の現在分詞形・動名詞", "helping(ヘルピング): 助けること", "人・社会", "中級"),
    "contribution": ("コントリビューション", "貢献", "contribute (貢献する) + ion (こと)から", "donation(ドネイション): 寄付", "人・社会", "中級"),
    "contributions": ("コントリビューションズ", "貢献（複数）", "contribution の複数形", "donations(ドネイションズ): 寄付", "人・社会", "中級"),
    "controversial": ("コントロヴァーシャル", "論争の的の", "controversy (論争) + al (の)から", "debatable(ディベイタブル): 議論の余地のある", "人・社会", "上級"),
    "conversation": ("コンヴァセイション", "会話", "ラテン語 conversatio (交際)が語源", "talk(トーク): 話", "人・社会", "初級"),
    "conversations": ("コンヴァセイションズ", "会話（複数）", "conversation の複数形", "talks(トークス): 話", "人・社会", "初級"),
    "cooking": ("クッキング", "料理", "cook の現在分詞形・動名詞", "preparing food(プリペアリングフード): 料理すること", "食・健康", "初級"),
    "cooperation": ("コーペレイション", "協力", "cooperate (協力する) + ion (こと)から", "collaboration(コラボレイション): 協力", "人・社会", "中級"),
    "coordinator": ("コーディネイター", "調整者", "coordinate (調整する) + or (人)から", "organizer(オーガナイザー): 主催者", "人・社会", "中級"),
    "cope": ("コープ", "対処する", "古フランス語 couper (打つ)が語源", "deal with(ディールウィズ): 対処する", "人・社会", "中級"),
    "coping": ("コーピング", "対処すること", "cope の現在分詞形・動名詞", "managing(マネジング): 対処すること", "人・社会", "中級"),
    "core": ("コア", "核心", "ラテン語 cor (心臓)が語源", "center(センター): 中心", "科学・技術", "中級"),
    "correctly": ("コレクトリー", "正しく", "correct (正しい) + ly (副詞)から", "properly(プロパリー): 適切に", "学校・学習", "初級"),
    "countless": ("カウントレス", "無数の", "count (数える) + less (ない)から", "innumerable(イニューメラブル): 数え切れない", "時間・数量", "中級"),
    "creation": ("クリエイション", "創造", "create (創造する) + ion (こと)から", "invention(インヴェンション): 発明", "運動・娯楽", "中級"),
    "creative": ("クリエイティヴ", "創造的な", "create (創造する) + ive (的な)から", "imaginative(イマジナティヴ): 想像力のある", "運動・娯楽", "中級"),
    "creativity": ("クリエイティヴィティ", "創造性", "creative (創造的な) + ity (性質)から", "imagination(イマジネイション): 想像力", "運動・娯楽", "中級"),
    "crisis": ("クライシス", "危機", "ギリシャ語 krisis (決定)が語源", "emergency(エマージェンシー): 緊急事態", "人・社会", "中級"),
    "critical": ("クリティカル", "重大な", "ラテン語 criticus (判断の)が語源", "crucial(クルーシャル): 決定的な", "学校・学習", "中級"),
    "cultural": ("カルチュラル", "文化的な", "culture (文化) + al (の)から", "ethnic(エスニック): 民族の", "人・社会", "中級"),
    "cultures": ("カルチャーズ", "文化（複数）", "culture の複数形", "civilizations(シヴィライゼイションズ): 文明", "人・社会", "初級"),
    "curiosity": ("キュリオシティ", "好奇心", "ラテン語 curiositas (探求心)が語源", "interest(インタレスト): 興味", "学校・学習", "中級"),
    "currently": ("カレントリー", "現在", "current (現在の) + ly (副詞)から", "now(ナウ): 今", "時間・数量", "初級"),
    "cycle": ("サイクル", "循環", "ギリシャ語 kyklos (円)が語源", "circle(サークル): 円", "科学・技術", "中級"),
    "cycling": ("サイクリング", "自転車", "cycle の現在分詞形・動名詞", "biking(バイキング): 自転車に乗ること", "運動・娯楽", "初級"),
}

def add_batch_words():
    """重要な単語をバッチで追加"""
    csv_path = 'public/data/junior-high-entrance-words.csv'
    
    # 既存の単語を読み込み
    existing_words = set()
    existing_rows = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            existing_words.add(row['語句'].lower())
            existing_rows.append(row)
    
    # 新しい単語を追加
    added = 0
    for word, data in important_words.items():
        if word.lower() not in existing_words:
            existing_rows.append({
                '語句': word,
                '読み': data[0],
                '意味': data[1],
                '語源等解説': data[2],
                '関連語': data[3],
                '関連分野': data[4],
                '難易度': data[5]
            })
            added += 1
            print(f'追加: {word} - {data[1]}')
    
    # ソートして保存
    existing_rows.sort(key=lambda x: x['語句'].lower())
    
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(existing_rows)
    
    print(f'\n{added}個の新しい単語を追加しました')
    print(f'合計: {len(existing_rows)}単語')

if __name__ == '__main__':
    add_batch_words()
