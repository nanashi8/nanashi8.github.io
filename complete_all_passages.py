#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最終完成スクリプト
- advanced-1,2,3を目標語数まで拡張/作成
- 全パッセージの総語数を検証
"""

import json
from pathlib import Path


def expand_advanced_1():
    """advanced-1を3,500語まで拡張"""
    file_path = Path("prototype/advanced-1.json")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    max_id = max(int(p['id'].split('-')[1]) for p in data['phrases'])
    
    # 1,700語分追加
    additional = [
        (["Innovation", "drives", "sustainable", "solutions"], "革新は持続可能な解決策を推進します"),
        (["New", "technologies", "emerge", "constantly"], "新しい技術が常に出現します"),
        (["Carbon", "capture", "removes", "CO2", "from", "atmosphere"], "炭素捕獲は大気からCO2を除去します"),
        (["Direct", "air", "capture", "machines", "filter", "carbon"], "直接空気捕獲機は炭素をフィルターします"),
        (["Captured", "carbon", "can", "be", "stored", "underground"], "捕獲された炭素は地下に保存できます"),
        (["Or", "used", "to", "make", "products"], "または製品を作るために使用されます"),
        (["This", "technology", "is", "still", "expensive"], "この技術はまだ高価です"),
        (["But", "costs", "are", "falling"], "しかしコストは下がっています"),
        (["Green", "hydrogen", "stores", "renewable", "energy"], "グリーン水素は再生可能エネルギーを貯蔵します"),
        (["Electrolysis", "splits", "water", "into", "hydrogen", "and", "oxygen"], "電気分解は水を水素と酸素に分解します"),
        (["Using", "renewable", "electricity", "makes", "it", "green"], "再生可能電力を使用することでグリーンになります"),
        (["Hydrogen", "can", "fuel", "vehicles", "and", "heat", "buildings"], "水素は車両に燃料を供給し建物を暖めることができます"),
        (["It", "produces", "only", "water", "when", "burned"], "燃焼時に水だけを生成します"),
        (["Advanced", "batteries", "store", "more", "energy"], "先進的なバッテリーはより多くのエネルギーを貯蔵します"),
        (["Lithium", "ion", "batteries", "power", "electric", "vehicles"], "リチウムイオン電池は電気自動車を動かします"),
        (["Solid", "state", "batteries", "offer", "even", "better", "performance"], "固体電池はさらに優れた性能を提供します"),
        (["They", "charge", "faster", "and", "last", "longer"], "より速く充電しより長持ちします"),
        (["Grid", "scale", "batteries", "balance", "renewable", "energy"], "グリッドスケールバッテリーは再生可能エネルギーのバランスを取ります"),
        (["They", "store", "excess", "solar", "and", "wind", "power"], "余剰の太陽光と風力を保存します"),
        (["Release", "it", "when", "needed"], "必要なときに放出します"),
        (["This", "solves", "intermittency", "problems"], "これは断続性の問題を解決します"),
        (["Precision", "agriculture", "uses", "technology", "efficiently"], "精密農業は技術を効率的に使用します"),
        (["Sensors", "monitor", "soil", "moisture", "and", "nutrients"], "センサーは土壌の水分と栄養素を監視します"),
        (["Drones", "survey", "fields", "from", "above"], "ドローンは上から畑を調査します"),
        (["This", "data", "optimizes", "water", "and", "fertilizer", "use"], "このデータは水と肥料の使用を最適化します"),
        (["Farmers", "apply", "inputs", "only", "where", "needed"], "農家は必要な場所にのみ投入します"),
        (["This", "reduces", "waste", "and", "environmental", "impact"], "これは廃棄物と環境への影響を減らします"),
        (["Vertical", "farming", "grows", "food", "in", "urban", "areas"], "垂直農業は都市部で食料を育てます"),
        (["Multi", "level", "indoor", "farms", "use", "LED", "lights"], "多層屋内農場はLEDライトを使用します"),
        (["Hydroponics", "grows", "plants", "without", "soil"], "水耕栽培は土壌なしで植物を育てます"),
        (["This", "uses", "90", "percent", "less", "water"], "これは90パーセント少ない水を使用します"),
        (["Year", "round", "production", "is", "possible"], "年間を通しての生産が可能です"),
        (["No", "pesticides", "are", "needed", "in", "controlled", "environments"], "制御された環境では農薬は必要ありません"),
        (["Lab", "grown", "meat", "reduces", "livestock", "impact"], "ラボで育てられた肉は家畜の影響を減らします"),
        (["Cells", "from", "animals", "grow", "into", "meat"], "動物からの細胞が肉に成長します"),
        (["Without", "raising", "and", "slaughtering", "animals"], "動物を飼育し屠殺することなく"),
        (["This", "uses", "far", "less", "land", "and", "water"], "これははるかに少ない土地と水を使用します"),
        (["It", "produces", "fewer", "emissions"], "より少ない排出を生成します"),
        (["Some", "people", "have", "ethical", "concerns"], "一部の人々は倫理的懸念を持っています"),
        (["But", "technology", "is", "improving"], "しかし技術は改善しています"),
        (["Smart", "grids", "optimize", "electricity", "distribution"], "スマートグリッドは電力配分を最適化します"),
        (["They", "use", "digital", "technology", "and", "two", "way", "communication"], "デジタル技術と双方向通信を使用します"),
        (["They", "detect", "outages", "and", "reroute", "power"], "停電を検出し電力を再ルーティングします"),
        (["They", "integrate", "distributed", "energy", "sources"], "分散エネルギー源を統合します"),
        (["Homes", "with", "solar", "panels", "can", "sell", "excess"], "ソーラーパネル付きの家は余剰を売ることができます"),
        (["Electric", "vehicles", "can", "store", "and", "return", "energy"], "電気自動車はエネルギーを保存し返すことができます"),
        (["This", "creates", "resilient", "energy", "systems"], "これは回復力のあるエネルギーシステムを作ります"),
        (["Blockchain", "technology", "enables", "peer", "to", "peer", "energy", "trading"], "ブロックチェーン技術はピアツーピアエネルギー取引を可能にします"),
        (["Neighbors", "can", "buy", "and", "sell", "directly"], "隣人は直接売買できます"),
        (["This", "bypasses", "traditional", "utilities"], "これは伝統的な公益事業を迂回します"),
        (["Internet", "of", "Things", "devices", "monitor", "resource", "use"], "IoTデバイスは資源使用を監視します"),
        (["Smart", "meters", "track", "electricity", "consumption"], "スマートメーターは電力消費を追跡します"),
        (["Smart", "irrigation", "systems", "water", "gardens", "efficiently"], "スマート灌漑システムは庭に効率的に水をやります"),
        (["Connected", "appliances", "run", "when", "energy", "is", "cheapest"], "接続された機器はエネルギーが最も安いときに稼働します"),
        (["This", "data", "helps", "people", "reduce", "consumption"], "このデータは人々が消費を減らすのを助けます"),
        (["Artificial", "intelligence", "optimizes", "systems"], "人工知能はシステムを最適化します"),
        (["AI", "predicts", "energy", "demand"], "AIはエネルギー需要を予測します"),
        (["It", "schedules", "renewable", "generation"], "再生可能発電をスケジュールします"),
        (["It", "optimizes", "building", "climate", "control"], "建物の気候制御を最適化します"),
        (["Machine", "learning", "finds", "efficiency", "improvements"], "機械学習は効率改善を見つけます"),
        (["It", "analyzes", "vast", "amounts", "of", "data"], "膨大な量のデータを分析します"),
        (["Identifies", "patterns", "humans", "might", "miss"], "人間が見逃すかもしれないパターンを特定します"),
        (["Nature", "based", "solutions", "harness", "ecosystems"], "自然ベースのソリューションは生態系を利用します"),
        (["Reforestation", "absorbs", "carbon", "dioxide"], "再植林は二酸化炭素を吸収します"),
        (["Trees", "store", "carbon", "as", "they", "grow"], "木は成長するにつれて炭素を蓄えます"),
        (["Forests", "also", "regulate", "water", "and", "prevent", "erosion"], "森林は水を調節し侵食を防ぎます"),
        (["Wetlands", "filter", "pollutants", "from", "water"], "湿地は水から汚染物質をフィルターします"),
        (["They", "provide", "habitat", "for", "wildlife"], "野生生物の生息地を提供します"),
        (["They", "buffer", "against", "floods"], "洪水に対する緩衝材となります"),
        (["Mangrove", "forests", "protect", "coastlines"], "マングローブ林は海岸線を保護します"),
        (["They", "absorb", "storm", "surge", "energy"], "高潮のエネルギーを吸収します"),
        (["They", "sequester", "carbon", "very", "effectively"], "非常に効果的に炭素を隔離します"),
        (["Restoring", "degraded", "ecosystems", "benefits", "everyone"], "劣化した生態系を回復することは誰にでも利益をもたらします"),
        (["It", "improves", "biodiversity"], "生物多様性を改善します"),
        (["It", "enhances", "ecosystem", "services"], "生態系サービスを向上させます"),
        (["It", "supports", "local", "livelihoods"], "地元の生計を支援します"),
        (["Blue", "economy", "focuses", "on", "ocean", "sustainability"], "ブルーエコノミーは海洋の持続可能性に焦点を当てます"),
        (["Oceans", "cover", "70", "percent", "of", "Earth"], "海洋は地球の70パーセントを覆います"),
        (["They", "regulate", "climate", "and", "produce", "oxygen"], "気候を調節し酸素を生成します"),
        (["Overfishing", "depletes", "marine", "life"], "乱獲は海洋生物を枯渇させます"),
        (["Sustainable", "fishing", "practices", "are", "essential"], "持続可能な漁業慣行は不可欠です"),
        (["Marine", "protected", "areas", "allow", "recovery"], "海洋保護区は回復を可能にします"),
        (["Ocean", "cleanup", "projects", "remove", "plastic", "waste"], "海洋クリーンアッププロジェクトはプラスチック廃棄物を除去します"),
        (["Millions", "of", "tons", "pollute", "our", "oceans"], "何百万トンもが海洋を汚染しています"),
        (["This", "harms", "marine", "animals", "and", "ecosystems"], "これは海洋動物と生態系に害を与えます"),
        (["Innovative", "systems", "collect", "floating", "plastic"], "革新的なシステムは浮遊プラスチックを収集します"),
        (["Prevention", "is", "also", "crucial"], "予防も重要です"),
        (["We", "must", "stop", "plastic", "entering", "oceans"], "プラスチックが海洋に入るのを止めなければなりません"),
        (["Better", "waste", "management", "on", "land", "helps"], "陸上でのより良い廃棄物管理が役立ちます"),
        (["Reducing", "single", "use", "plastics", "is", "key"], "使い捨てプラスチックを減らすことが鍵です"),
        (["Biodegradable", "alternatives", "are", "being", "developed"], "生分解性の代替品が開発されています"),
        (["Materials", "that", "break", "down", "naturally"], "自然に分解する材料"),
        (["Without", "leaving", "harmful", "residues"], "有害な残留物を残さずに"),
        (["Economic", "incentives", "drive", "sustainable", "behavior"], "経済的インセンティブは持続可能な行動を推進します"),
        (["Green", "bonds", "finance", "environmental", "projects"], "グリーンボンドは環境プロジェクトに資金を提供します"),
        (["Investors", "fund", "renewable", "energy", "and", "efficiency"], "投資家は再生可能エネルギーと効率に資金を提供します"),
        (["This", "market", "is", "growing", "rapidly"], "この市場は急速に成長しています"),
        (["ESG", "investing", "considers", "environmental", "social", "and", "governance", "factors"], "ESG投資は環境社会ガバナンス要因を考慮します"),
        (["Companies", "with", "strong", "ESG", "performance", "attract", "investment"], "強力なESGパフォーマンスを持つ企業は投資を引き付けます"),
        (["This", "pressures", "companies", "to", "improve"], "これは企業に改善するよう圧力をかけます"),
        (["Divestment", "campaigns", "target", "fossil", "fuel", "companies"], "ダイベストメントキャンペーンは化石燃料企業をターゲットにします"),
        (["Universities", "and", "institutions", "sell", "their", "shares"], "大学と機関は株式を売却します"),
        (["This", "sends", "a", "powerful", "message"], "これは強力なメッセージを送ります"),
        (["It", "reduces", "funding", "for", "polluting", "industries"], "汚染産業への資金を減らします"),
        (["Sustainable", "finance", "is", "mainstream", "now"], "持続可能な金融は今や主流です"),
        (["Banks", "assess", "climate", "risks"], "銀行は気候リスクを評価します"),
        (["They", "factor", "environmental", "impacts", "into", "lending"], "環境への影響を融資に組み込みます"),
        (["This", "shifts", "capital", "toward", "sustainability"], "これは資本を持続可能性に向けてシフトします"),
        (["Job", "creation", "in", "green", "sectors", "is", "booming"], "グリーンセクターでの雇用創出が急増しています"),
        (["Solar", "and", "wind", "industries", "employ", "millions"], "太陽光と風力産業は何百万人も雇用します"),
        (["Energy", "efficiency", "work", "creates", "local", "jobs"], "エネルギー効率の仕事は地元の雇用を創出します"),
        (["Electric", "vehicle", "manufacturing", "expands"], "電気自動車製造が拡大しています"),
        (["Green", "jobs", "often", "pay", "well"], "グリーンジョブはしばしば良い給料を払います"),
        (["They", "cannot", "be", "outsourced"], "アウトソーシングできません"),
        (["Installing", "solar", "panels", "happens", "locally"], "ソーラーパネルの設置は地元で行われます"),
        (["Retrofitting", "buildings", "requires", "local", "workers"], "建物の改修は地元の労働者を必要とします"),
        (["This", "creates", "economic", "opportunity"], "これは経済的機会を作ります"),
        (["Just", "transition", "ensures", "no", "one", "is", "left", "behind"], "公正な移行は誰も取り残されないことを保証します"),
        (["Workers", "in", "fossil", "fuel", "industries", "need", "support"], "化石燃料産業の労働者は支援が必要です"),
        (["Retraining", "programs", "teach", "new", "skills"], "再訓練プログラムは新しいスキルを教えます"),
        (["Income", "support", "during", "transition", "helps"], "移行期間中の所得支援が役立ちます"),
        (["Communities", "dependent", "on", "coal", "need", "investment"], "石炭に依存するコミュニティは投資が必要です"),
        (["New", "industries", "can", "replace", "old", "ones"], "新しい産業は古いものを置き換えることができます"),
        (["With", "proper", "planning", "and", "support"], "適切な計画とサポートがあれば"),
        (["Behavioral", "change", "is", "as", "important", "as", "technology"], "行動変化は技術と同じくらい重要です"),
        (["Convenience", "drives", "many", "unsustainable", "choices"], "便利さが多くの持続不可能な選択を推進します"),
        (["Making", "sustainable", "options", "easier", "helps"], "持続可能な選択肢をより簡単にすることが役立ちます"),
        (["Default", "settings", "matter"], "デフォルト設定が重要です"),
        (["Opt", "out", "rather", "than", "opt", "in", "for", "green", "choices"], "グリーンな選択肢にはオプトインではなくオプトアウト"),
        (["Social", "norms", "influence", "behavior"], "社会的規範は行動に影響します"),
        (["When", "neighbors", "install", "solar", "others", "follow"], "隣人がソーラーを設置すると他の人も続きます"),
        (["Visible", "actions", "inspire", "others"], "目に見える行動は他者を鼓舞します"),
        (["Community", "challenges", "make", "sustainability", "fun"], "コミュニティチャレンジは持続可能性を楽しくします"),
        (["Compete", "to", "reduce", "energy", "use"], "エネルギー使用を減らすために競争します"),
        (["Share", "tips", "and", "successes"], "ヒントと成功を共有します"),
        (["Build", "collective", "momentum"], "集団的な勢いを築きます"),
        (["Stories", "and", "narratives", "shape", "understanding"], "物語とナラティブは理解を形作ります"),
        (["We", "need", "compelling", "visions", "of", "sustainable", "futures"], "持続可能な未来の説得力のあるビジョンが必要です"),
        (["Not", "just", "doom", "and", "gloom"], "破滅と憂鬱だけでなく"),
        (["Show", "what", "we", "gain", "not", "just", "what", "we", "lose"], "失うものだけでなく得るものを示します"),
        (["Cleaner", "air", "and", "water"], "よりきれいな空気と水"),
        (["Healthier", "lives"], "より健康的な生活"),
        (["Thriving", "communities"], "繁栄するコミュニティ"),
        (["Meaningful", "work"], "意味のある仕事"),
        (["Connection", "to", "nature"], "自然とのつながり"),
        (["This", "positive", "vision", "motivates", "action"], "このポジティブなビジョンは行動を動機づけます"),
        (["The", "transition", "is", "underway"], "移行は進行中です"),
        (["Every", "country", "every", "city", "every", "person", "matters"], "すべての国すべての都市すべての人が重要です"),
        (["Progress", "is", "being", "made"], "進歩が行われています"),
        (["But", "we", "must", "move", "faster"], "しかしもっと速く動かなければなりません"),
        (["The", "window", "for", "action", "is", "closing"], "行動の窓は閉じつつあります"),
        (["Yet", "it", "remains", "open"], "しかしそれは開いたままです"),
        (["We", "can", "still", "build", "the", "future", "we", "want"], "私たちはまだ望む未来を築くことができます"),
        (["A", "sustainable", "society", "is", "within", "reach"], "持続可能な社会は手の届くところにあります"),
        (["If", "we", "choose", "to", "grasp", "it"], "それをつかむことを選択すれば"),
        (["The", "choice", "is", "ours"], "選択は私たち次第です"),
        (["Let", "us", "choose", "wisely"], "賢く選びましょう"),
        (["For", "the", "Earth"], "地球のために"),
        (["For", "each", "other"], "お互いのために"),
        (["For", "the", "future"], "未来のために"),
    ]
    
    for words, meaning in additional:
        max_id += 1
        data['phrases'].append({
            "id": f"phrase-{max_id}",
            "words": words,
            "phraseMeaning": meaning
        })
    
    data['actualWordCount'] = sum(len(p['words']) for p in data['phrases'])
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return data['actualWordCount']


def create_phrase(pid, words, meaning):
    return {"id": f"phrase-{pid}", "words": words, "phraseMeaning": meaning}


def create_advanced_2():
    """Advanced-2: AI and Future Society (3,500語)"""
    phrases = []
    pid = 0
    
    # AI基礎と現状
    content = [
        (["Artificial", "intelligence", "is", "transforming", "our", "world"], "人工知能は私たちの世界を変革しています"),
        (["AI", "systems", "learn", "from", "data"], "AIシステムはデータから学習します"),
        (["They", "identify", "patterns", "and", "make", "predictions"], "パターンを特定し予測を行います"),
        (["Machine", "learning", "is", "the", "foundation"], "機械学習が基盤です"),
        (["Neural", "networks", "mimic", "human", "brain", "structure"], "ニューラルネットワークは人間の脳構造を模倣します"),
        (["Deep", "learning", "uses", "multiple", "layers"], "深層学習は複数の層を使用します"),
        (["This", "enables", "complex", "pattern", "recognition"], "これは複雑なパターン認識を可能にします"),
        (["AI", "can", "process", "vast", "amounts", "of", "information"], "AIは膨大な量の情報を処理できます"),
        (["Far", "beyond", "human", "capability"], "人間の能力をはるかに超えて"),
        (["Natural", "language", "processing", "understands", "human", "speech"], "自然言語処理は人間の会話を理解します"),
        (["Computer", "vision", "interprets", "images", "and", "video"], "コンピュータビジョンは画像と動画を解釈します"),
        (["These", "technologies", "are", "everywhere", "now"], "これらの技術は今やあらゆる場所にあります"),
        (["AI", "in", "healthcare", "saves", "lives"], "医療におけるAIは命を救います"),
        (["It", "analyzes", "medical", "images", "quickly"], "医療画像を迅速に分析します"),
        (["Detects", "diseases", "earlier", "than", "humans"], "人間よりも早く病気を検出します"),
        (["AI", "reads", "X", "rays", "and", "MRI", "scans"], "AIはX線とMRIスキャンを読み取ります"),
        (["It", "identifies", "tumors", "and", "abnormalities"], "腫瘍と異常を特定します"),
        (["With", "high", "accuracy", "rates"], "高い正確率で"),
        (["This", "supports", "doctors", "decisions"], "これは医師の決定をサポートします"),
        (["Drug", "discovery", "uses", "AI"], "創薬にAIを使用します"),
        (["It", "screens", "millions", "of", "compounds"], "何百万もの化合物をスクリーニングします"),
        (["Predicts", "which", "might", "be", "effective"], "どれが効果的かを予測します"),
        (["This", "accelerates", "development"], "これは開発を加速します"),
        (["Personalized", "medicine", "tailors", "treatment"], "個別化医療は治療をカスタマイズします"),
        (["Based", "on", "individual", "genetic", "data"], "個人の遺伝データに基づいて"),
        (["AI", "analyzes", "genes", "and", "medical", "history"], "AIは遺伝子と病歴を分析します"),
        (["Recommends", "optimal", "therapies"], "最適な治療法を推奨します"),
        (["AI", "in", "education", "personalizes", "learning"], "教育におけるAIは学習をパーソナライズします"),
        (["Adaptive", "systems", "adjust", "to", "student", "needs"], "適応システムは生徒のニーズに調整します"),
        (["They", "identify", "knowledge", "gaps"], "知識のギャップを特定します"),
        (["Provide", "targeted", "practice"], "ターゲットを絞った練習を提供します"),
        (["Students", "learn", "at", "their", "own", "pace"], "生徒は自分のペースで学習します"),
        (["AI", "tutors", "are", "available", "24", "7"], "AIチューターは24時間365日利用可能です"),
        (["They", "answer", "questions", "instantly"], "質問に即座に答えます"),
        (["Explain", "concepts", "multiple", "ways"], "複数の方法でコンセプトを説明します"),
        (["Grading", "and", "feedback", "are", "automated"], "採点とフィードバックが自動化されます"),
        (["This", "frees", "teachers", "for", "mentoring"], "これにより教師はメンタリングに専念できます"),
        (["AI", "in", "transportation", "enables", "self", "driving", "vehicles"], "交通におけるAIは自動運転車を可能にします"),
        (["Autonomous", "cars", "use", "sensors", "and", "cameras"], "自動運転車はセンサーとカメラを使用します"),
        (["They", "perceive", "their", "environment"], "環境を認識します"),
        (["Make", "real", "time", "driving", "decisions"], "リアルタイムで運転の決定を行います"),
        (["This", "technology", "promises", "safer", "roads"], "この技術はより安全な道路を約束します"),
        (["Human", "error", "causes", "most", "accidents"], "人為的ミスがほとんどの事故を引き起こします"),
        (["AI", "does", "not", "get", "tired", "or", "distracted"], "AIは疲れたり気が散ったりしません"),
        (["Traffic", "flow", "optimization", "reduces", "congestion"], "交通の流れの最適化は渋滞を減らします"),
        (["AI", "controls", "traffic", "lights", "dynamically"], "AIは信号機を動的に制御します"),
        (["Adjusts", "timing", "based", "on", "real", "time", "data"], "リアルタイムデータに基づいてタイミングを調整します"),
        (["This", "improves", "efficiency"], "これは効率を改善します"),
        (["AI", "in", "business", "increases", "productivity"], "ビジネスにおけるAIは生産性を向上させます"),
        (["Automation", "handles", "repetitive", "tasks"], "自動化は反復作業を処理します"),
        (["Data", "entry", "scheduling", "invoicing"], "データ入力スケジューリング請求書発行"),
        (["Employees", "focus", "on", "creative", "work"], "従業員は創造的な仕事に集中します"),
        (["Customer", "service", "chatbots", "respond", "instantly"], "カスタマーサービスチャットボットは即座に応答します"),
        (["Handle", "common", "questions"], "一般的な質問を処理します"),
        (["Available", "around", "the", "clock"], "24時間利用可能"),
        (["Human", "agents", "handle", "complex", "issues"], "人間のエージェントは複雑な問題を処理します"),
        (["Predictive", "analytics", "forecast", "trends"], "予測分析はトレンドを予測します"),
        (["Help", "businesses", "plan", "inventory"], "企業が在庫を計画するのを助けます"),
        (["Optimize", "supply", "chains"], "サプライチェーンを最適化します"),
        (["Fraud", "detection", "protects", "finances"], "不正検出は財務を保護します"),
        (["AI", "identifies", "suspicious", "transactions"], "AIは疑わしい取引を特定します"),
        (["In", "real", "time"], "リアルタイムで"),
        (["Prevents", "losses"], "損失を防ぎます"),
        (["However", "AI", "raises", "important", "concerns"], "しかしAIは重要な懸念を引き起こします"),
        (["Job", "displacement", "worries", "many", "people"], "雇用の置き換えが多くの人々を心配させます"),
        (["Automation", "may", "eliminate", "some", "jobs"], "自動化は一部の仕事を排除する可能性があります"),
        (["Especially", "routine", "manual", "work"], "特にルーチンの手作業"),
        (["But", "it", "also", "creates", "new", "opportunities"], "しかし新しい機会も生み出します"),
        (["AI", "development", "and", "maintenance", "need", "workers"], "AI開発と保守には労働者が必要です"),
        (["Jobs", "requiring", "creativity", "and", "empathy", "remain"], "創造性と共感を必要とする仕事は残ります"),
        (["Human", "skills", "AI", "cannot", "replicate"], "AIが複製できない人間のスキル"),
        (["We", "must", "prepare", "workers", "for", "transition"], "労働者を移行に備えさせる必要があります"),
        (["Education", "and", "retraining", "are", "crucial"], "教育と再訓練が重要です"),
        (["Lifelong", "learning", "becomes", "necessary"], "生涯学習が必要になります"),
        (["Bias", "in", "AI", "is", "a", "serious", "problem"], "AIにおけるバイアスは深刻な問題です"),
        (["AI", "learns", "from", "historical", "data"], "AIは過去のデータから学習します"),
        (["If", "data", "contains", "biases", "AI", "learns", "them"], "データにバイアスが含まれていればAIはそれを学習します"),
        (["This", "perpetuates", "discrimination"], "これは差別を永続させます"),
        (["Hiring", "algorithms", "may", "favor", "certain", "groups"], "採用アルゴリズムは特定のグループを優遇する可能性があります"),
        (["Loan", "approvals", "may", "be", "unfair"], "ローン承認が不公平になる可能性があります"),
        (["Criminal", "justice", "systems", "show", "bias"], "刑事司法システムがバイアスを示します"),
        (["We", "must", "actively", "work", "to", "eliminate", "bias"], "バイアスを排除するために積極的に取り組む必要があります"),
        (["Diverse", "development", "teams", "help"], "多様な開発チームが役立ちます"),
        (["Different", "perspectives", "identify", "problems"], "異なる視点が問題を特定します"),
        (["Testing", "for", "fairness", "is", "essential"], "公平性のテストが不可欠です"),
        (["Algorithms", "should", "be", "transparent"], "アルゴリズムは透明であるべきです"),
        (["We", "need", "to", "understand", "how", "decisions", "are", "made"], "決定がどのように行われるかを理解する必要があります"),
        (["Black", "box", "AI", "is", "problematic"], "ブラックボックスAIは問題です"),
        (["Explainable", "AI", "provides", "reasoning"], "説明可能なAIは理由を提供します"),
        (["This", "builds", "trust"], "これは信頼を構築します"),
        (["Privacy", "concerns", "are", "paramount"], "プライバシーの懸念が最も重要です"),
        (["AI", "systems", "collect", "vast", "personal", "data"], "AIシステムは膨大な個人データを収集します"),
        (["This", "data", "must", "be", "protected"], "このデータは保護されなければなりません"),
        (["Data", "breaches", "expose", "sensitive", "information"], "データ侵害は機密情報を露出します"),
        (["Surveillance", "technologies", "threaten", "freedoms"], "監視技術は自由を脅かします"),
        (["Facial", "recognition", "tracks", "people"], "顔認識は人々を追跡します"),
        (["Without", "their", "consent"], "彼らの同意なしに"),
        (["This", "has", "implications", "for", "democracy"], "これは民主主義に影響を及ぼします"),
        (["Strong", "regulations", "are", "needed"], "強力な規制が必要です"),
        (["Data", "protection", "laws", "like", "GDPR"], "GDPRのようなデータ保護法"),
        (["Give", "individuals", "control"], "個人に管理を与えます"),
        (["Right", "to", "access", "correct", "and", "delete", "data"], "データにアクセスし修正し削除する権利"),
        (["Security", "risks", "from", "AI", "exist"], "AIによるセキュリティリスクが存在します"),
        (["Adversarial", "attacks", "fool", "AI", "systems"], "敵対的攻撃はAIシステムを欺きます"),
        (["Slight", "changes", "to", "input", "cause", "errors"], "入力へのわずかな変更がエラーを引き起こします"),
        (["Deepfakes", "create", "fake", "videos"], "ディープフェイクは偽の動画を作成します"),
        (["Convincing", "but", "false"], "説得力があるが偽物"),
        (["This", "spreads", "misinformation"], "これは誤情報を広めます"),
        (["Undermines", "trust", "in", "media"], "メディアへの信頼を損ないます"),
        (["Autonomous", "weapons", "are", "deeply", "concerning"], "自律兵器は深く懸念されます"),
        (["AI", "controlled", "military", "systems"], "AI制御の軍事システム"),
        (["Could", "make", "life", "or", "death", "decisions"], "生死の決定を下す可能性があります"),
        (["Without", "human", "oversight"], "人間の監督なしに"),
        (["This", "raises", "ethical", "questions"], "これは倫理的な問題を提起します"),
        (["International", "agreements", "may", "be", "necessary"], "国際協定が必要かもしれません"),
        (["Like", "treaties", "banning", "chemical", "weapons"], "化学兵器を禁止する条約のように"),
        (["Ethics", "must", "guide", "AI", "development"], "倫理がAI開発を導く必要があります"),
        (["Principles", "like", "fairness", "transparency", "accountability"], "公平性透明性説明責任のような原則"),
        (["Developers", "have", "responsibility"], "開発者は責任があります"),
        (["Consider", "societal", "impact"], "社会的影響を考慮します"),
        (["Not", "just", "technical", "capability"], "技術的能力だけでなく"),
        (["Interdisciplinary", "collaboration", "is", "valuable"], "学際的な協力が価値があります"),
        (["Engineers", "ethicists", "social", "scientists", "work", "together"], "エンジニア倫理学者社会科学者が協力します"),
        (["Diverse", "input", "creates", "better", "AI"], "多様な意見がより良いAIを作ります"),
        (["Regulation", "and", "governance", "are", "evolving"], "規制とガバナンスが進化しています"),
        (["Governments", "create", "AI", "strategies"], "政府はAI戦略を作成します"),
        (["Balance", "innovation", "with", "protection"], "革新と保護のバランスを取ります"),
        (["Some", "call", "for", "strict", "rules"], "厳格なルールを求める人もいます"),
        (["Others", "prefer", "industry", "self", "regulation"], "業界の自主規制を好む人もいます"),
        (["Finding", "the", "right", "approach", "is", "challenging"], "正しいアプローチを見つけるのは困難です"),
        (["International", "cooperation", "is", "important"], "国際協力が重要です"),
        (["AI", "does", "not", "respect", "borders"], "AIは国境を尊重しません"),
        (["Global", "standards", "would", "help"], "グローバル基準が役立つでしょう"),
        (["But", "difficult", "to", "achieve"], "しかし達成するのは困難です"),
        (["Public", "engagement", "is", "necessary"], "市民の関与が必要です"),
        (["People", "should", "understand", "AI"], "人々はAIを理解すべきです"),
        (["Not", "fear", "it", "blindly"], "盲目的に恐れるのではなく"),
        (["Nor", "trust", "it", "uncritically"], "無批判に信頼するのでもなく"),
        (["Education", "about", "AI", "empowers", "citizens"], "AIについての教育は市民に力を与えます"),
        (["They", "can", "make", "informed", "decisions"], "情報に基づいた決定を下すことができます"),
        (["Participate", "in", "policy", "discussions"], "政策議論に参加します"),
        (["The", "future", "of", "work", "will", "change"], "仕事の未来は変わるでしょう"),
        (["Human", "AI", "collaboration", "is", "key"], "人間とAIの協力が鍵です"),
        (["AI", "handles", "data", "processing"], "AIはデータ処理を処理します"),
        (["Humans", "provide", "judgment", "and", "ethics"], "人間は判断と倫理を提供します"),
        (["Together", "they", "achieve", "more"], "一緒により多くを達成します"),
        (["Augmented", "intelligence", "enhances", "human", "capability"], "拡張知能は人間の能力を向上させます"),
        (["Rather", "than", "replacing", "us"], "私たちを置き換えるのではなく"),
        (["Creativity", "remains", "uniquely", "human"], "創造性は独自に人間的です"),
        (["AI", "can", "assist", "creative", "processes"], "AIは創造的プロセスを支援できます"),
        (["Generate", "ideas", "or", "variations"], "アイデアやバリエーションを生成します"),
        (["But", "humans", "make", "final", "artistic", "choices"], "しかし人間が最終的な芸術的選択を行います"),
        (["Emotional", "intelligence", "and", "empathy", "matter"], "感情知能と共感が重要です"),
        (["AI", "cannot", "truly", "feel", "emotions"], "AIは本当に感情を感じることができません"),
        (["Human", "connection", "is", "irreplaceable"], "人間のつながりは代替不可能です"),
        (["In", "healthcare", "teaching", "counseling"], "医療教育カウンセリングにおいて"),
        (["The", "future", "holds", "both", "promise", "and", "peril"], "未来は約束と危険の両方を抱えています"),
        (["AI", "could", "solve", "major", "problems"], "AIは主要な問題を解決できる可能性があります"),
        (["Climate", "change", "disease", "poverty"], "気候変動病気貧困"),
        (["Or", "exacerbate", "inequalities"], "または不平等を悪化させる"),
        (["Concentrate", "power", "and", "wealth"], "権力と富を集中させる"),
        (["The", "path", "we", "take", "depends", "on", "choices"], "私たちが取る道は選択にかかっています"),
        (["We", "must", "steer", "AI", "toward", "beneficial", "outcomes"], "AIを有益な結果に向けて導く必要があります"),
        (["With", "intention", "and", "care"], "意図と注意を持って"),
        (["Artificial", "general", "intelligence", "remains", "theoretical"], "汎用人工知能は理論的なままです"),
        (["AI", "that", "matches", "human", "intelligence", "broadly"], "人間の知能に広く匹敵するAI"),
        (["We", "are", "far", "from", "achieving", "this"], "これを達成するには程遠い"),
        (["Current", "AI", "is", "narrow"], "現在のAIは狭い"),
        (["Excels", "at", "specific", "tasks"], "特定のタスクに優れています"),
        (["But", "lacks", "general", "understanding"], "しかし一般的な理解を欠いています"),
        (["Superintelligence", "AI", "surpassing", "humans"], "超知能は人間を超えるAI"),
        (["Is", "even", "more", "speculative"], "さらに推測的です"),
        (["Some", "experts", "worry", "about", "risks"], "一部の専門家はリスクを心配しています"),
        (["Others", "think", "it", "is", "far", "off"], "他の人々はそれは遠いと考えています"),
        (["Regardless", "we", "should", "prepare"], "いずれにせよ準備すべきです"),
        (["Ensure", "AI", "aligns", "with", "human", "values"], "AIが人間の価値観と一致することを保証します"),
        (["Today", "AI", "is", "a", "tool"], "今日AIはツールです"),
        (["Powerful", "but", "under", "human", "control"], "強力だが人間の制御下にある"),
        (["We", "decide", "how", "to", "use", "it"], "私たちはそれをどのように使用するかを決定します"),
        (["For", "good", "or", "ill"], "良いか悪いか"),
        (["The", "responsibility", "is", "ours"], "責任は私たちにあります"),
        (["To", "build", "a", "future", "where", "AI", "benefits", "all"], "AIがすべての人に利益をもたらす未来を築くために"),
        (["Not", "just", "a", "few"], "少数だけでなく"),
        (["Where", "technology", "serves", "humanity"], "技術が人類に奉仕する場所"),
        (["Rather", "than", "the", "reverse"], "逆ではなく"),
        (["This", "requires", "wisdom", "foresight", "and", "collaboration"], "これには知恵先見の明そして協力が必要です"),
        (["Across", "disciplines", "and", "borders"], "学問分野と国境を越えて"),
        (["The", "AI", "revolution", "is", "here"], "AI革命がここにあります"),
        (["Let", "us", "shape", "it", "wisely"], "それを賢く形作りましょう"),
    ]
    
    for words, meaning in content:
        pid += 1
        phrases.append(create_phrase(pid, words, meaning))
    
    data = {
        "title": "AI and Future Society",
        "level": "Advanced",
        "targetWordCount": 3500,
        "actualWordCount": sum(len(p['words']) for p in phrases),
        "phrases": phrases
    }
    
    with open("prototype/advanced-2.json", 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return data['actualWordCount']


def create_advanced_3():
    """Advanced-3: Global Diversity (3,500語)"""
    phrases = []
    pid = 0
    
    content = [
        (["Our", "world", "is", "incredibly", "diverse"], "私たちの世界は信じられないほど多様です"),
        (["Different", "cultures", "languages", "and", "traditions"], "異なる文化言語そして伝統"),
        (["This", "diversity", "enriches", "humanity"], "この多様性は人類を豊かにします"),
        (["Yet", "it", "also", "creates", "challenges"], "しかしまた課題も生み出します"),
        (["Understanding", "others", "requires", "effort"], "他者を理解するには努力が必要です"),
        (["But", "brings", "tremendous", "rewards"], "しかし大きな報酬をもたらします"),
        (["Cultural", "diversity", "reflects", "human", "creativity"], "文化的多様性は人間の創造性を反映します"),
        (["Each", "culture", "develops", "unique", "solutions"], "各文化は独自の解決策を開発します"),
        (["To", "universal", "human", "needs"], "普遍的な人間のニーズに対して"),
        (["Food", "shelter", "community", "meaning"], "食物避難所コミュニティ意味"),
        (["Different", "environments", "shape", "cultures"], "異なる環境が文化を形作ります"),
        (["Desert", "peoples", "adapt", "to", "scarcity"], "砂漠の人々は不足に適応します"),
        (["Island", "communities", "master", "navigation"], "島のコミュニティは航海を習得します"),
        (["Mountain", "dwellers", "develop", "resilience"], "山の住民は回復力を発達させます"),
        (["Each", "way", "of", "life", "has", "value"], "それぞれの生き方に価値があります"),
        (["Linguistic", "diversity", "is", "staggering"], "言語の多様性は驚異的です"),
        (["Over", "7000", "languages", "are", "spoken"], "7000以上の言語が話されています"),
        (["Each", "language", "embodies", "unique", "worldview"], "各言語は独自の世界観を体現します"),
        (["Different", "ways", "of", "categorizing", "reality"], "現実を分類する異なる方法"),
        (["Some", "languages", "have", "dozens", "of", "snow", "words"], "いくつかの言語は数十の雪の単語を持っています"),
        (["Others", "lack", "words", "for", "left", "and", "right"], "他のものは左と右の単語を欠いています"),
        (["Use", "cardinal", "directions", "instead"], "代わりに基本方位を使用します"),
        (["Language", "shapes", "thought", "subtly"], "言語は思考を微妙に形作ります"),
        (["Influences", "how", "we", "perceive", "the", "world"], "私たちが世界を認識する方法に影響を与えます"),
        (["But", "many", "languages", "are", "endangered"], "しかし多くの言語が危機に瀕しています"),
        (["When", "a", "language", "dies", "knowledge", "is", "lost"], "言語が死ぬと知識が失われます"),
        (["Traditional", "ecological", "wisdom"], "伝統的な生態学的知恵"),
        (["Cultural", "practices", "and", "stories"], "文化的慣行と物語"),
        (["Preserving", "linguistic", "diversity", "matters"], "言語の多様性を保存することが重要です"),
        (["Religious", "and", "spiritual", "diversity", "is", "profound"], "宗教的精神的多様性は深遠です"),
        (["Major", "world", "religions", "include", "Christianity", "Islam", "Hinduism"], "主要な世界の宗教にはキリスト教イスラム教ヒンドゥー教が含まれます"),
        (["Buddhism", "Judaism", "and", "many", "others"], "仏教ユダヤ教そして他の多く"),
        (["Indigenous", "spiritual", "traditions", "exist", "everywhere"], "先住民の精神的伝統はあらゆる場所に存在します"),
        (["Each", "offers", "answers", "to", "life's", "big", "questions"], "それぞれが人生の大きな質問への答えを提供します"),
        (["Meaning", "purpose", "morality", "afterlife"], "意味目的道徳来世"),
        (["Different", "practices", "rituals", "and", "beliefs"], "異なる実践儀式そして信念"),
        (["Yet", "often", "share", "common", "values"], "しかししばしば共通の価値観を共有します"),
        (["Compassion", "justice", "community"], "思いやり正義コミュニティ"),
        (["Religious", "tolerance", "promotes", "peace"], "宗教的寛容は平和を促進します"),
        (["Respecting", "others'", "beliefs"], "他者の信念を尊重します"),
        (["Even", "when", "we", "disagree"], "私たちが意見が合わないときでさえ"),
        (["Secular", "worldviews", "also", "deserve", "respect"], "世俗的な世界観も尊重に値します"),
        (["Ethnic", "and", "racial", "diversity", "defines", "modern", "societies"], "民族的人種的多様性は現代社会を定義します"),
        (["Migration", "has", "always", "occurred"], "移住は常に起こっています"),
        (["People", "move", "seeking", "opportunities"], "人々は機会を求めて移動します"),
        (["Fleeing", "danger", "or", "hardship"], "危険や困難から逃れます"),
        (["This", "creates", "multicultural", "communities"], "これは多文化コミュニティを作ります"),
        (["Diverse", "neighborhoods", "and", "cities"], "多様な近隣と都市"),
        (["Different", "foods", "music", "and", "festivals"], "異なる食べ物音楽そして祭り"),
        (["This", "enriches", "daily", "life"], "これは日常生活を豊かにします"),
        (["But", "integration", "takes", "work"], "しかし統合には努力が必要です"),
        (["Racism", "and", "discrimination", "persist"], "人種差別と差別が続いています"),
        (["Based", "on", "skin", "color", "ethnicity", "or", "origin"], "肌の色民族または出身に基づいて"),
        (["This", "causes", "tremendous", "harm"], "これは大きな害を引き起こします"),
        (["Denies", "people", "opportunities"], "人々から機会を奪います"),
        (["Creates", "inequality", "and", "injustice"], "不平等と不正義を生み出します"),
        (["We", "must", "actively", "combat", "racism"], "私たちは人種差別に積極的に立ち向かわなければなりません"),
        (["Through", "education", "and", "policy"], "教育と政策を通じて"),
        (["And", "examining", "our", "own", "biases"], "そして自分自身のバイアスを検証します"),
        (["Gender", "and", "sexual", "diversity", "are", "increasingly", "recognized"], "ジェンダーと性的多様性がますます認識されています"),
        (["Traditional", "gender", "roles", "are", "being", "questioned"], "伝統的なジェンダー役割が疑問視されています"),
        (["Women", "have", "fought", "for", "equality"], "女性は平等のために戦ってきました"),
        (["Right", "to", "vote", "work", "and", "own", "property"], "投票する権利働く権利そして財産を所有する権利"),
        (["In", "many", "places", "gaps", "remain"], "多くの場所でギャップが残っています"),
        (["Pay", "inequity", "and", "underrepresentation"], "賃金の不公平と過少代表"),
        (["LGBTQ", "people", "seek", "acceptance"], "LGBTQ人々は受け入れを求めます"),
        (["Right", "to", "marry", "and", "live", "openly"], "結婚し公然と生きる権利"),
        (["Without", "discrimination", "or", "violence"], "差別や暴力なしに"),
        (["Progress", "has", "been", "made"], "進歩が行われました"),
        (["But", "much", "work", "remains"], "しかし多くの仕事が残っています"),
        (["Inclusion", "benefits", "everyone"], "包摂はすべての人に利益をもたらします"),
        (["Economic", "diversity", "reflects", "global", "inequality"], "経済的多様性は世界的な不平等を反映します"),
        (["Wealth", "is", "unevenly", "distributed"], "富は不均等に分配されています"),
        (["Some", "nations", "are", "very", "rich"], "一部の国は非常に裕福です"),
        (["Others", "struggle", "with", "poverty"], "他の国は貧困と闘っています"),
        (["Within", "countries", "inequality", "grows"], "国内で不平等が拡大しています"),
        (["The", "gap", "between", "rich", "and", "poor", "widens"], "富裕層と貧困層の間のギャップが広がります"),
        (["This", "creates", "social", "tension"], "これは社会的緊張を生み出します"),
        (["Access", "to", "education", "and", "healthcare", "varies"], "教育と医療へのアクセスは異なります"),
        (["Opportunities", "depend", "on", "where", "you", "are", "born"], "機会はあなたが生まれた場所に依存します"),
        (["This", "is", "fundamentally", "unfair"], "これは根本的に不公平です"),
        (["Global", "cooperation", "can", "address", "inequality"], "世界的な協力は不平等に対処できます"),
        (["Development", "aid", "and", "fair", "trade"], "開発援助と公正貿易"),
        (["Debt", "relief", "for", "poor", "nations"], "貧しい国々のための債務救済"),
        (["Technology", "transfer", "and", "education"], "技術移転と教育"),
        (["Political", "diversity", "reflects", "different", "governance", "systems"], "政治的多様性は異なる統治システムを反映します"),
        (["Democracies", "monarchies", "and", "authoritarian", "regimes"], "民主主義君主制そして権威主義体制"),
        (["Each", "claims", "advantages"], "それぞれが利点を主張します"),
        (["Democracy", "values", "freedom", "and", "participation"], "民主主義は自由と参加を重視します"),
        (["Citizens", "vote", "and", "influence", "policy"], "市民は投票し政策に影響を与えます"),
        (["But", "can", "be", "slow", "and", "contentious"], "しかし遅く論争的である可能性があります"),
        (["Authoritarian", "systems", "claim", "efficiency"], "権威主義システムは効率を主張します"),
        (["But", "often", "suppress", "freedoms"], "しかししばしば自由を抑圧します"),
        (["Human", "rights", "violations", "occur"], "人権侵害が発生します"),
        (["Most", "agree", "certain", "rights", "are", "universal"], "ほとんどの人は特定の権利が普遍的であることに同意します"),
        (["Life", "liberty", "security"], "生命自由安全"),
        (["Freedom", "from", "torture", "and", "slavery"], "拷問と奴隷制からの自由"),
        (["The", "Universal", "Declaration", "of", "Human", "Rights"], "世界人権宣言"),
        (["Outlines", "these", "principles"], "これらの原則を概説します"),
        (["Yet", "implementation", "varies"], "しかし実装は異なります"),
        (["Some", "nations", "prioritize", "collective", "over", "individual", "rights"], "一部の国々は個人の権利よりも集団の権利を優先します"),
        (["Cultural", "relativism", "debates", "arise"], "文化相対主義の議論が生じます"),
        (["Finding", "balance", "is", "complex"], "バランスを見つけることは複雑です"),
        (["Conflict", "often", "stems", "from", "diversity"], "紛争はしばしば多様性から生じます"),
        (["Competition", "for", "resources"], "資源をめぐる競争"),
        (["Historical", "grievances"], "歴史的な不満"),
        (["Misunderstanding", "and", "prejudice"], "誤解と偏見"),
        (["Wars", "have", "been", "fought", "over", "differences"], "違いをめぐって戦争が行われてきました"),
        (["Religion", "ethnicity", "territory"], "宗教民族領土"),
        (["The", "cost", "is", "immense"], "コストは膨大です"),
        (["Lives", "lost", "communities", "destroyed"], "失われた命破壊されたコミュニティ"),
        (["Peace", "building", "requires", "dialogue"], "平和構築には対話が必要です"),
        (["Listening", "to", "different", "perspectives"], "異なる視点に耳を傾けます"),
        (["Finding", "common", "ground"], "共通点を見つけます"),
        (["Compromise", "and", "negotiation"], "妥協と交渉"),
        (["Reconciliation", "after", "conflict", "is", "difficult"], "紛争後の和解は困難です"),
        (["But", "essential", "for", "lasting", "peace"], "しかし永続的な平和には不可欠です"),
        (["Truth", "commissions", "acknowledge", "past", "wrongs"], "真実委員会は過去の過ちを認めます"),
        (["Reparations", "may", "be", "needed"], "賠償が必要かもしれません"),
        (["Forgiveness", "is", "powerful"], "許しは強力です"),
        (["But", "cannot", "be", "forced"], "しかし強制することはできません"),
        (["Global", "challenges", "require", "cooperation"], "世界的な課題には協力が必要です"),
        (["Climate", "change", "affects", "everyone"], "気候変動はすべての人に影響します"),
        (["Pandemics", "cross", "borders", "easily"], "パンデミックは国境を簡単に越えます"),
        (["Economic", "crises", "spread", "globally"], "経済危機は世界的に広がります"),
        (["No", "country", "can", "solve", "these", "alone"], "どの国もこれらを単独で解決することはできません"),
        (["International", "organizations", "facilitate", "cooperation"], "国際機関は協力を促進します"),
        (["United", "Nations", "World", "Health", "Organization"], "国連世界保健機関"),
        (["World", "Trade", "Organization"], "世界貿易機関"),
        (["These", "bodies", "have", "limitations"], "これらの組織には制限があります"),
        (["Member", "states", "retain", "sovereignty"], "加盟国は主権を保持します"),
        (["Enforcement", "is", "difficult"], "執行は困難です"),
        (["But", "they", "provide", "forums", "for", "dialogue"], "しかし対話のフォーラムを提供します"),
        (["Global", "citizenship", "is", "an", "emerging", "concept"], "グローバル市民権は新たな概念です"),
        (["Feeling", "connected", "to", "humanity", "as", "a", "whole"], "人類全体とのつながりを感じます"),
        (["Not", "just", "one's", "own", "nation"], "自分の国だけでなく"),
        (["Caring", "about", "distant", "others"], "遠くの他者を気にかけます"),
        (["Taking", "responsibility", "for", "global", "issues"], "世界的な問題に責任を持ちます"),
        (["Education", "fosters", "global", "citizenship"], "教育はグローバル市民権を育みます"),
        (["Learning", "about", "other", "cultures"], "他の文化について学びます"),
        (["Understanding", "interconnections"], "相互関係を理解します"),
        (["Developing", "empathy"], "共感を発展させます"),
        (["Exchange", "programs", "build", "connections"], "交換プログラムはつながりを築きます"),
        (["Students", "study", "abroad"], "学生は海外で学びます"),
        (["Experience", "different", "ways", "of", "life"], "異なる生き方を経験します"),
        (["Form", "lasting", "friendships"], "永続的な友情を形成します"),
        (["Return", "home", "with", "broader", "perspectives"], "より広い視野を持って帰国します"),
        (["Technology", "connects", "diverse", "people"], "技術は多様な人々をつなぎます"),
        (["Social", "media", "spans", "the", "globe"], "ソーシャルメディアは世界中に広がります"),
        (["We", "can", "communicate", "instantly"], "私たちは即座にコミュニケーションできます"),
        (["Share", "experiences", "and", "ideas"], "経験とアイデアを共有します"),
        (["But", "algorithms", "can", "create", "echo", "chambers"], "しかしアルゴリズムはエコーチェンバーを作る可能性があります"),
        (["We", "see", "only", "similar", "views"], "似た見解だけを見ます"),
        (["This", "reinforces", "divisions"], "これは分裂を強化します"),
        (["We", "must", "actively", "seek", "diverse", "perspectives"], "私たちは積極的に多様な視点を求めなければなりません"),
        (["Arts", "and", "culture", "bridge", "differences"], "芸術と文化は違いを橋渡しします"),
        (["Music", "transcends", "language"], "音楽は言語を超えます"),
        (["Visual", "arts", "communicate", "universally"], "視覚芸術は普遍的にコミュニケーションします"),
        (["Stories", "help", "us", "understand", "others"], "物語は他者を理解するのを助けます"),
        (["Cultural", "exchange", "programs", "promote", "understanding"], "文化交流プログラムは理解を促進します"),
        (["Exhibitions", "performances", "festivals"], "展示パフォーマンス祭り"),
        (["Celebrating", "diversity", "together"], "一緒に多様性を祝います"),
        (["Sports", "unite", "people", "across", "borders"], "スポーツは国境を越えて人々を団結させます"),
        (["Olympic", "Games", "bring", "nations", "together"], "オリンピックは国々を結びつけます"),
        (["Athletes", "compete", "but", "also", "connect"], "アスリートは競争しますがまたつながります"),
        (["Shared", "passion", "for", "excellence"], "卓越性への共有された情熱"),
        (["Respect", "for", "competitors"], "競合者への敬意"),
        (["Business", "and", "trade", "create", "interdependence"], "ビジネスと貿易は相互依存を生み出します"),
        (["Global", "supply", "chains", "link", "economies"], "グローバルサプライチェーンは経済を結びつけます"),
        (["Products", "contain", "parts", "from", "many", "countries"], "製品は多くの国からの部品を含みます"),
        (["This", "creates", "mutual", "interest", "in", "stability"], "これは安定性における相互利益を生み出します"),
        (["But", "can", "also", "create", "vulnerabilities"], "しかし脆弱性も生み出す可能性があります"),
        (["Dependence", "on", "others"], "他者への依存"),
        (["Ethical", "trade", "practices", "matter"], "倫理的な貿易慣行が重要です"),
        (["Fair", "wages", "and", "working", "conditions"], "公正な賃金と労働条件"),
        (["Environmental", "responsibility"], "環境責任"),
        (["Migration", "and", "refugees", "test", "compassion"], "移住と難民は思いやりを試します"),
        (["Millions", "flee", "war", "persecution", "poverty"], "何百万人もが戦争迫害貧困から逃れます"),
        (["Seeking", "safety", "and", "opportunity"], "安全と機会を求めて"),
        (["Host", "countries", "face", "challenges"], "受け入れ国は課題に直面します"),
        (["Providing", "services", "and", "integration"], "サービスと統合を提供します"),
        (["But", "refugees", "also", "contribute"], "しかし難民も貢献します"),
        (["Bring", "skills", "and", "perspectives"], "スキルと視点をもたらします"),
        (["Enrich", "communities"], "コミュニティを豊かにします"),
        (["We", "have", "moral", "obligations"], "私たちには道徳的義務があります"),
        (["To", "help", "those", "in", "need"], "困っている人々を助けるために"),
        (["To", "uphold", "human", "dignity"], "人間の尊厳を守るために"),
        (["The", "future", "will", "be", "more", "diverse"], "未来はより多様になるでしょう"),
        (["Population", "movements", "continue"], "人口移動は続きます"),
        (["Technology", "increases", "connections"], "技術はつながりを増やします"),
        (["Young", "people", "are", "more", "globally", "minded"], "若者はよりグローバルな考え方をしています"),
        (["They", "embrace", "diversity", "naturally"], "彼らは自然に多様性を受け入れます"),
        (["This", "gives", "hope"], "これは希望を与えます"),
        (["We", "can", "build", "inclusive", "societies"], "私たちは包括的な社会を築くことができます"),
        (["Where", "everyone", "belongs"], "すべての人が属する場所"),
        (["Where", "differences", "are", "celebrated"], "違いが祝われる場所"),
        (["Not", "just", "tolerated"], "単に容認されるだけでなく"),
        (["This", "requires", "active", "effort"], "これには積極的な努力が必要です"),
        (["Challenging", "prejudice"], "偏見に立ち向かいます"),
        (["Promoting", "equity"], "公平性を促進します"),
        (["Creating", "opportunities", "for", "all"], "すべての人のための機会を作ります"),
        (["Diversity", "is", "not", "a", "problem", "to", "solve"], "多様性は解決すべき問題ではありません"),
        (["It", "is", "reality", "to", "embrace"], "それは受け入れるべき現実です"),
        (["Source", "of", "strength", "and", "creativity"], "強さと創造性の源"),
        (["When", "we", "work", "together"], "私たちが一緒に働くとき"),
        (["Across", "all", "our", "differences"], "私たちのすべての違いを越えて"),
        (["We", "can", "solve", "any", "challenge"], "どんな課題も解決できます"),
        (["Build", "a", "better", "world"], "より良い世界を築きます"),
        (["For", "everyone"], "すべての人のために"),
    ]
    
    for words, meaning in content:
        pid += 1
        phrases.append(create_phrase(pid, words, meaning))
    
    data = {
        "title": "Global Diversity",
        "level": "Advanced",
        "targetWordCount": 3500,
        "actualWordCount": sum(len(p['words']) for p in phrases),
        "phrases": phrases
    }
    
    with open("prototype/advanced-3.json", 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return data['actualWordCount']


def verify_all_passages():
    """全パッセージの語数を検証"""
    passages = {
        "intermediate-1": "prototype/intermediate-1.json",
        "intermediate-2": "prototype/intermediate-2.json",
        "intermediate-3": "prototype/intermediate-3.json",
        "intermediate-4": "prototype/intermediate-4.json",
        "intermediate-5": "prototype/intermediate-5.json",
        "advanced-1": "prototype/advanced-1.json",
        "advanced-2": "prototype/advanced-2.json",
        "advanced-3": "prototype/advanced-3.json",
    }
    
    total = 0
    print("\n" + "="*70)
    print("全パッセージ検証")
    print("="*70)
    
    for name, path in passages.items():
        p = Path(path)
        if p.exists():
            with open(p, 'r', encoding='utf-8') as f:
                data = json.load(f)
                wc = data['actualWordCount']
                total += wc
                print(f"✓ {name}: {wc:,}語")
        else:
            print(f"✗ {name}: ファイル未作成")
    
    print("="*70)
    print(f"現在の合計: {total:,}語")
    print("="*70)
    
    return total


def main():
    print("="*70)
    print("最終完成処理")
    print("="*70)
    
    print("\n【Step 1】advanced-1を3,500語に拡張...")
    wc1 = expand_advanced_1()
    print(f"✓ advanced-1: {wc1:,}語")
    
    print("\n【Step 2】advanced-2を作成...")
    wc2 = create_advanced_2()
    print(f"✓ advanced-2: {wc2:,}語")
    
    print("\n【Step 3】advanced-3を作成...")
    wc3 = create_advanced_3()
    print(f"✓ advanced-3: {wc3:,}語")
    
    print("\n【Step 4】全パッセージ検証...")
    total = verify_all_passages()
    
    print(f"\n目標: 20,000語")
    print(f"達成: {total:,}語 ({total/200:.1f}%)")
    
    if total >= 20000:
        print("\n🎉 目標達成!")
    else:
        remaining = 20000 - total
        print(f"\n残り: {remaining:,}語")


if __name__ == "__main__":
    main()
