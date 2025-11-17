#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Advanced 3パッセージを効率的に生成
各3,500語目標
"""

import json
from pathlib import Path


def create_phrase(phrase_id, words, meaning):
    """フレーズオブジェクトを作成"""
    return {
        "id": phrase_id,
        "words": words,
        "phraseMeaning": meaning
    }


def generate_advanced_1():
    """Advanced-1: Sustainable Society (3,500語)"""
    phrases = []
    pid = 1
    
    content = [
        # Introduction (導入)
        (["Sustainability", "is", "the", "defining", "challenge", "of", "our", "time"], "持続可能性は私たちの時代の決定的な課題です"),
        (["We", "face", "environmental", "crises", "that", "threaten", "our", "future"], "私たちの未来を脅かす環境危機に直面しています"),
        (["Climate", "change", "resource", "depletion", "and", "pollution", "require", "urgent", "action"], "気候変動資源枯渇汚染は緊急の行動を必要とします"),
        (["Building", "a", "sustainable", "society", "is", "not", "optional"], "持続可能な社会を築くことは選択肢ではありません"),
        (["It", "is", "essential", "for", "survival"], "それは生存に不可欠です"),
        (["A", "sustainable", "society", "meets", "present", "needs"], "持続可能な社会は現在のニーズを満たします"),
        (["Without", "compromising", "future", "generations", "ability"], "将来の世代の能力を損なうことなく"),
        (["This", "requires", "transforming", "how", "we", "produce", "and", "consume"], "これは生産と消費の方法を変革することを必要とします"),
        (["It", "demands", "new", "economic", "models"], "新しい経済モデルを要求します"),
        (["It", "calls", "for", "individual", "and", "collective", "action"], "個人的および集団的行動を求めます"),
        
        # Climate Crisis (気候危機)
        (["Climate", "change", "is", "the", "greatest", "threat", "we", "face"], "気候変動は私たちが直面する最大の脅威です"),
        (["Global", "temperatures", "are", "rising", "rapidly"], "地球の気温は急速に上昇しています"),
        (["The", "last", "decade", "was", "the", "hottest", "on", "record"], "過去10年は記録上最も暑かったです"),
        (["Extreme", "weather", "events", "are", "becoming", "more", "frequent"], "極端な気象現象がより頻繁になっています"),
        (["Hurricanes", "droughts", "floods", "and", "wildfires", "intensify"], "ハリケーン干ばつ洪水山火事が激化しています"),
        (["Sea", "levels", "are", "rising"], "海面が上昇しています"),
        (["Coastal", "cities", "face", "flooding", "risks"], "沿岸都市は洪水のリスクに直面しています"),
        (["Small", "island", "nations", "may", "disappear", "entirely"], "小さな島国は完全に消える可能性があります"),
        (["Ice", "caps", "and", "glaciers", "are", "melting"], "氷冠と氷河が溶けています"),
        (["This", "disrupts", "water", "supplies", "for", "millions"], "これは何百万人もの水供給を混乱させます"),
        (["Ecosystems", "are", "collapsing"], "生態系が崩壊しています"),
        (["Species", "extinction", "rates", "are", "accelerating"], "種の絶滅率が加速しています"),
        (["Coral", "reefs", "are", "dying", "from", "ocean", "acidification"], "サンゴ礁が海洋酸性化で死んでいます"),
        (["Forests", "that", "regulate", "climate", "are", "being", "destroyed"], "気候を調節する森林が破壊されています"),
        (["The", "main", "cause", "is", "greenhouse", "gas", "emissions"], "主な原因は温室効果ガスの排出です"),
        (["Burning", "fossil", "fuels", "releases", "carbon", "dioxide"], "化石燃料を燃やすと二酸化炭素が放出されます"),
        (["Coal", "oil", "and", "natural", "gas", "powered", "our", "development"], "石炭石油天然ガスが私たちの発展を動かしました"),
        (["But", "their", "use", "is", "now", "destroying", "our", "planet"], "しかし今やその使用は地球を破壊しています"),
        (["We", "must", "transition", "to", "clean", "energy"], "クリーンエネルギーに移行しなければなりません"),
        (["This", "transition", "is", "already", "beginning"], "この移行はすでに始まっています"),
        
        # Renewable Energy (再生可能エネルギー)
        (["Renewable", "energy", "offers", "hope", "for", "the", "future"], "再生可能エネルギーは未来への希望を提供します"),
        (["Solar", "power", "harnesses", "energy", "from", "the", "sun"], "太陽光発電は太陽からエネルギーを利用します"),
        (["Solar", "panels", "convert", "sunlight", "into", "electricity"], "ソーラーパネルは日光を電気に変換します"),
        (["Costs", "have", "dropped", "dramatically"], "コストは劇的に下がりました"),
        (["Solar", "is", "now", "cheaper", "than", "coal", "in", "many", "places"], "太陽光は今や多くの場所で石炭より安いです"),
        (["Homes", "and", "businesses", "install", "solar", "panels"], "家庭と企業はソーラーパネルを設置します"),
        (["Large", "solar", "farms", "generate", "power", "for", "entire", "cities"], "大規模な太陽光発電所は都市全体に電力を供給します"),
        (["Wind", "power", "is", "another", "clean", "energy", "source"], "風力発電は別のクリーンエネルギー源です"),
        (["Wind", "turbines", "capture", "energy", "from", "moving", "air"], "風力タービンは動く空気からエネルギーを捕らえます"),
        (["Offshore", "wind", "farms", "are", "particularly", "effective"], "洋上風力発電所は特に効果的です"),
        (["Ocean", "winds", "are", "strong", "and", "consistent"], "海の風は強く一貫しています"),
        (["Countries", "like", "Denmark", "generate", "most", "electricity", "from", "wind"], "デンマークのような国は風力から電力の大部分を生成します"),
        (["Hydroelectric", "power", "uses", "flowing", "water"], "水力発電は流れる水を使います"),
        (["Dams", "generate", "electricity", "from", "rivers"], "ダムは川から電気を生成します"),
        (["This", "is", "a", "mature", "technology"], "これは成熟した技術です"),
        (["Many", "countries", "rely", "heavily", "on", "hydropower"], "多くの国は水力発電に大きく依存しています"),
        (["Geothermal", "energy", "taps", "heat", "from", "the", "Earth"], "地熱エネルギーは地球からの熱を利用します"),
        (["It", "is", "reliable", "and", "constant"], "それは信頼性が高く一定です"),
        (["Iceland", "uses", "geothermal", "for", "heating", "and", "electricity"], "アイスランドは暖房と電気のために地熱を使用します"),
        (["Biomass", "energy", "comes", "from", "organic", "materials"], "バイオマスエネルギーは有機材料から来ます"),
        (["We", "can", "generate", "energy", "from", "agricultural", "waste"], "農業廃棄物からエネルギーを生成できます"),
        (["Biofuels", "can", "replace", "gasoline", "in", "vehicles"], "バイオ燃料は車両でガソリンを置き換えることができます"),
        (["The", "key", "is", "diversifying", "our", "energy", "sources"], "鍵はエネルギー源を多様化することです"),
        (["Different", "regions", "have", "different", "renewable", "resources"], "異なる地域には異なる再生可能資源があります"),
        (["Sunny", "areas", "focus", "on", "solar"], "日当たりの良い地域は太陽光に焦点を当てます"),
        (["Windy", "regions", "develop", "wind", "power"], "風の強い地域は風力を開発します"),
        (["Together", "renewables", "can", "power", "our", "entire", "civilization"], "一緒に再生可能エネルギーは私たちの文明全体を動かすことができます"),
        
        # Circular Economy (循環経済)
        (["Our", "current", "economy", "is", "linear"], "私たちの現在の経済は線形です"),
        (["We", "take", "resources", "make", "products", "and", "discard", "them"], "資源を取り製品を作りそれらを捨てます"),
        (["This", "take", "make", "waste", "model", "is", "unsustainable"], "この取る作る廃棄するモデルは持続不可能です"),
        (["It", "depletes", "finite", "resources"], "有限の資源を枯渇させます"),
        (["It", "creates", "mountains", "of", "waste"], "山のような廃棄物を作ります"),
        (["We", "need", "a", "circular", "economy"], "循環経済が必要です"),
        (["In", "a", "circular", "economy", "nothing", "is", "wasted"], "循環経済では何も無駄になりません"),
        (["Products", "are", "designed", "for", "durability", "and", "repair"], "製品は耐久性と修理のために設計されます"),
        (["When", "products", "end", "their", "life", "materials", "are", "recycled"], "製品が寿命を終えると材料はリサイクルされます"),
        (["These", "materials", "become", "inputs", "for", "new", "products"], "これらの材料は新製品の投入物になります"),
        (["The", "cycle", "continues", "indefinitely"], "サイクルは無期限に続きます"),
        (["This", "mimics", "nature", "ecosystems"], "これは自然の生態系を模倣します"),
        (["In", "nature", "there", "is", "no", "waste"], "自然には廃棄物はありません"),
        (["One", "organism", "waste", "is", "another", "food"], "ある生物の廃棄物は別の生物の食物です"),
        (["We", "can", "design", "industrial", "systems", "the", "same", "way"], "同じように産業システムを設計できます"),
        (["Companies", "are", "adopting", "circular", "principles"], "企業は循環原則を採用しています"),
        (["Some", "offer", "product", "as", "a", "service"], "一部は製品をサービスとして提供します"),
        (["Instead", "of", "selling", "light", "bulbs", "they", "sell", "lighting"], "電球を売る代わりに照明を売ります"),
        (["They", "maintain", "ownership", "and", "responsibility"], "所有権と責任を維持します"),
        (["This", "incentivizes", "making", "durable", "products"], "これは耐久性のある製品を作ることを奨励します"),
        (["Sharing", "economy", "platforms", "reduce", "consumption"], "シェアリングエコノミープラットフォームは消費を減らします"),
        (["Car", "sharing", "reduces", "vehicles", "needed"], "カーシェアリングは必要な車両を減らします"),
        (["Tool", "libraries", "let", "people", "borrow", "instead", "of", "buy"], "ツールライブラリーは人々が買う代わりに借りることを可能にします"),
        (["Repair", "cafes", "help", "fix", "broken", "items"], "修理カフェは壊れたアイテムを修理するのを助けます"),
        (["This", "extends", "product", "lifespans"], "これは製品の寿命を延ばします"),
        (["Right", "to", "repair", "laws", "are", "emerging"], "修理する権利法が出現しています"),
        (["Manufacturers", "must", "provide", "parts", "and", "instructions"], "製造業者は部品と説明書を提供しなければなりません"),
        (["This", "fights", "planned", "obsolescence"], "これは計画的陳腐化と戦います"),
        (["Industrial", "symbiosis", "connects", "different", "industries"], "産業共生は異なる産業をつなぎます"),
        (["One", "factory", "waste", "becomes", "another", "raw", "material"], "ある工場の廃棄物は別の工場の原材料になります"),
        (["This", "reduces", "both", "waste", "and", "resource", "extraction"], "これは廃棄物と資源採取の両方を減らします"),
        
        # Sustainable Agriculture (持続可能な農業)
        (["Agriculture", "must", "also", "become", "sustainable"], "農業も持続可能にならなければなりません"),
        (["Industrial", "farming", "damages", "the", "environment"], "工業的農業は環境を損傷します"),
        (["It", "uses", "excessive", "pesticides", "and", "fertilizers"], "過度の農薬と肥料を使用します"),
        (["These", "chemicals", "pollute", "water", "and", "soil"], "これらの化学物質は水と土壌を汚染します"),
        (["They", "harm", "beneficial", "insects", "and", "wildlife"], "有益な昆虫と野生生物に害を与えます"),
        (["Monoculture", "farming", "depletes", "soil", "nutrients"], "単一栽培農業は土壌栄養素を枯渇させます"),
        (["It", "makes", "crops", "vulnerable", "to", "pests", "and", "disease"], "作物を害虫と病気に対して脆弱にします"),
        (["Organic", "farming", "offers", "an", "alternative"], "有機農業は代替案を提供します"),
        (["It", "avoids", "synthetic", "chemicals"], "合成化学物質を避けます"),
        (["It", "uses", "natural", "pest", "control", "methods"], "自然な害虫駆除方法を使います"),
        (["Crop", "rotation", "maintains", "soil", "health"], "輪作は土壌の健康を維持します"),
        (["Composting", "returns", "nutrients", "to", "the", "soil"], "堆肥化は栄養素を土壌に戻します"),
        (["Organic", "food", "is", "healthier", "for", "consumers"], "有機食品は消費者にとってより健康的です"),
        (["It", "is", "better", "for", "farm", "workers", "too"], "農業労働者にとっても良いです"),
        (["Regenerative", "agriculture", "goes", "further"], "再生農業はさらに進みます"),
        (["It", "actively", "improves", "soil", "and", "ecosystems"], "土壌と生態系を積極的に改善します"),
        (["Cover", "crops", "prevent", "erosion"], "被覆作物は侵食を防ぎます"),
        (["No", "till", "farming", "preserves", "soil", "structure"], "不耕起農業は土壌構造を保存します"),
        (["Integrating", "livestock", "mimics", "natural", "grazing"], "家畜を統合することは自然な放牧を模倣します"),
        (["Animals", "fertilize", "fields", "naturally"], "動物は自然に畑を肥やします"),
        (["This", "approach", "can", "sequester", "carbon", "in", "soil"], "このアプローチは土壌に炭素を隔離できます"),
        (["It", "helps", "fight", "climate", "change", "while", "producing", "food"], "食料を生産しながら気候変動と戦うのを助けます"),
        (["Urban", "agriculture", "brings", "food", "production", "to", "cities"], "都市農業は都市に食料生産をもたらします"),
        (["Rooftop", "gardens", "use", "unused", "space"], "屋上庭園は未使用のスペースを使います"),
        (["Vertical", "farms", "grow", "food", "in", "buildings"], "垂直農場は建物で食料を育てます"),
        (["This", "reduces", "transportation", "emissions"], "これは輸送排出を減らします"),
        (["Fresh", "produce", "reaches", "consumers", "faster"], "新鮮な農産物がより速く消費者に届きます"),
        (["Community", "gardens", "strengthen", "neighborhoods"], "コミュニティガーデンは地域を強化します"),
        (["People", "connect", "with", "food", "production"], "人々は食料生産とつながります"),
        (["They", "learn", "where", "food", "comes", "from"], "食べ物がどこから来るか学びます"),
        
        # Sustainable Transportation (持続可能な交通)
        (["Transportation", "accounts", "for", "significant", "emissions"], "交通は重要な排出を占めます"),
        (["Cars", "trucks", "and", "planes", "burn", "fossil", "fuels"], "車トラック飛行機は化石燃料を燃やします"),
        (["We", "must", "transform", "how", "we", "move", "people", "and", "goods"], "人と物をどう動かすかを変革しなければなりません"),
        (["Electric", "vehicles", "are", "becoming", "mainstream"], "電気自動車が主流になっています"),
        (["They", "produce", "no", "tailpipe", "emissions"], "排気管からの排出はありません"),
        (["As", "electricity", "grids", "become", "cleaner", "EVs", "become", "greener"], "電力網がクリーンになるにつれてEVはよりグリーンになります"),
        (["Battery", "technology", "is", "improving", "rapidly"], "バッテリー技術は急速に改善しています"),
        (["Range", "is", "increasing", "while", "costs", "decrease"], "航続距離は増加しコストは減少しています"),
        (["Charging", "infrastructure", "is", "expanding"], "充電インフラは拡大しています"),
        (["Soon", "EVs", "will", "be", "cheaper", "than", "gas", "cars"], "間もなくEVはガソリン車より安くなります"),
        (["Public", "transportation", "is", "more", "efficient", "than", "private", "cars"], "公共交通機関は自家用車より効率的です"),
        (["Buses", "and", "trains", "carry", "many", "people", "at", "once"], "バスと電車は一度に多くの人を運びます"),
        (["This", "reduces", "per", "capita", "emissions"], "これは一人当たりの排出を減らします"),
        (["Cities", "are", "investing", "in", "better", "transit", "systems"], "都市はより良い交通システムに投資しています"),
        (["Light", "rail", "and", "subways", "move", "people", "quickly"], "ライトレールと地下鉄は人々を素早く動かします"),
        (["Dedicated", "bus", "lanes", "improve", "service"], "専用バスレーンはサービスを改善します"),
        (["Cycling", "and", "walking", "are", "the", "greenest", "options"], "自転車と徒歩は最もグリーンな選択肢です"),
        (["They", "produce", "zero", "emissions"], "ゼロ排出を生み出します"),
        (["They", "also", "improve", "health"], "健康も改善します"),
        (["Cities", "are", "building", "extensive", "bike", "lane", "networks"], "都市は広範な自転車レーンネットワークを構築しています"),
        (["Bike", "sharing", "programs", "make", "cycling", "accessible"], "自転車シェアリングプログラムはサイクリングを利用可能にします"),
        (["Walkable", "neighborhoods", "reduce", "car", "dependency"], "歩きやすい地域は車依存を減らします"),
        (["Mixed", "use", "development", "puts", "homes", "near", "shops", "and", "work"], "複合用途開発は家を店と仕事の近くに置きます"),
        (["People", "can", "meet", "daily", "needs", "without", "driving"], "人々は運転せずに日常のニーズを満たすことができます"),
        (["This", "creates", "more", "livable", "cities"], "これはより住みやすい都市を作ります"),
        (["High", "speed", "rail", "can", "replace", "short", "flights"], "高速鉄道は短距離フライトを置き換えることができます"),
        (["Trains", "are", "more", "efficient", "for", "distances", "under", "500", "miles"], "電車は500マイル未満の距離でより効率的です"),
        (["They", "offer", "comfort", "and", "city", "center", "to", "city", "center", "travel"], "快適さと都心から都心への旅行を提供します"),
        (["For", "freight", "shipping", "must", "become", "cleaner"], "貨物輸送はよりクリーンにならなければなりません"),
        (["Ships", "currently", "burn", "dirty", "fuel"], "船は現在汚い燃料を燃やします"),
        (["Hydrogen", "and", "ammonia", "fuels", "are", "being", "developed"], "水素とアンモニア燃料が開発されています"),
        (["Optimizing", "shipping", "routes", "reduces", "emissions"], "輸送ルートを最適化することは排出を減らします"),
        
        # Green Buildings (グリーンビルディング)
        (["Buildings", "consume", "enormous", "amounts", "of", "energy"], "建物は膨大な量のエネルギーを消費します"),
        (["Heating", "cooling", "and", "lighting", "require", "power"], "暖房冷房照明は電力を必要とします"),
        (["Traditional", "buildings", "are", "inefficient"], "伝統的な建物は非効率です"),
        (["Poor", "insulation", "wastes", "energy"], "貧弱な断熱はエネルギーを無駄にします"),
        (["Old", "windows", "leak", "heat"], "古い窓は熱を漏らします"),
        (["Inefficient", "appliances", "consume", "excess", "electricity"], "非効率な機器は過剰な電力を消費します"),
        (["Green", "buildings", "address", "these", "issues"], "グリーンビルディングはこれらの問題に対処します"),
        (["They", "are", "designed", "for", "energy", "efficiency"], "エネルギー効率のために設計されています"),
        (["Thick", "insulation", "reduces", "heating", "and", "cooling", "needs"], "厚い断熱材は暖房と冷房のニーズを減らします"),
        (["Triple", "pane", "windows", "minimize", "heat", "transfer"], "三重窓ガラスは熱伝達を最小限にします"),
        (["LED", "lighting", "uses", "fraction", "of", "energy"], "LED照明はエネルギーの一部を使用します"),
        (["Smart", "thermostats", "optimize", "temperature", "control"], "スマートサーモスタットは温度制御を最適化します"),
        (["Solar", "panels", "on", "roofs", "generate", "electricity"], "屋根のソーラーパネルは電気を生成します"),
        (["Some", "buildings", "produce", "more", "energy", "than", "they", "consume"], "一部の建物は消費するより多くのエネルギーを生産します"),
        (["These", "net", "positive", "buildings", "sell", "excess", "to", "the", "grid"], "これらのネットポジティブビルディングは余剰を電力網に売ります"),
        (["Green", "roofs", "provide", "insulation", "and", "reduce", "runoff"], "グリーンルーフは断熱を提供し流出を減らします"),
        (["Plants", "absorb", "rainwater"], "植物は雨水を吸収します"),
        (["They", "cool", "buildings", "through", "evaporation"], "蒸発を通して建物を冷やします"),
        (["They", "create", "habitat", "for", "wildlife"], "野生生物の生息地を作ります"),
        (["Passive", "design", "uses", "natural", "systems"], "パッシブデザインは自然のシステムを使います"),
        (["Orientation", "maximizes", "natural", "light"], "方向は自然光を最大化します"),
        (["Overhangs", "provide", "shade", "in", "summer"], "軒は夏に日陰を提供します"),
        (["Thermal", "mass", "stores", "and", "releases", "heat"], "熱容量は熱を蓄え放出します"),
        (["Natural", "ventilation", "reduces", "air", "conditioning", "needs"], "自然換気は空調のニーズを減らします"),
        (["Sustainable", "materials", "reduce", "environmental", "impact"], "持続可能な材料は環境への影響を減らします"),
        (["Bamboo", "grows", "quickly", "and", "is", "strong"], "竹は早く成長し強いです"),
        (["Recycled", "steel", "and", "concrete", "reduce", "resource", "extraction"], "リサイクルされた鋼とコンクリートは資源採取を減らします"),
        (["Low", "VOC", "paints", "improve", "indoor", "air", "quality"], "低VOC塗料は室内空気質を改善します"),
        (["Retrofitting", "existing", "buildings", "is", "also", "important"], "既存の建物の改修も重要です"),
        (["Most", "buildings", "in", "2050", "already", "exist", "today"], "2050年のほとんどの建物は今日すでに存在します"),
        (["Upgrading", "them", "is", "more", "efficient", "than", "demolition"], "それらをアップグレードすることは取り壊しより効率的です"),
        (["Simple", "improvements", "make", "big", "differences"], "簡単な改善が大きな違いを生みます"),
        
        # Consumer Choices (消費者の選択)
        (["Individual", "choices", "collectively", "create", "massive", "impact"], "個々の選択が集合的に大きな影響を生み出します"),
        (["How", "we", "consume", "shapes", "markets"], "私たちがどう消費するかが市場を形作ります"),
        (["Reducing", "consumption", "is", "most", "effective"], "消費を減らすことが最も効果的です"),
        (["Buy", "less", "but", "choose", "quality"], "少なく買いますが質を選んでください"),
        (["Durable", "goods", "last", "longer"], "耐久財は長持ちします"),
        (["They", "save", "money", "and", "resources", "over", "time"], "時間とともにお金と資源を節約します"),
        (["Avoid", "fast", "fashion"], "ファストファッションを避けてください"),
        (["Cheap", "clothes", "are", "made", "under", "poor", "conditions"], "安い服は劣悪な条件で作られます"),
        (["They", "are", "discarded", "quickly"], "すぐに捨てられます"),
        (["Choose", "timeless", "pieces", "that", "last", "years"], "何年も持つ時代を超えたピースを選んでください"),
        (["Support", "ethical", "brands"], "倫理的なブランドをサポートしてください"),
        (["Reduce", "meat", "consumption"], "肉の消費を減らしてください"),
        (["Livestock", "farming", "has", "huge", "environmental", "costs"], "家畜飼育は巨大な環境コストがあります"),
        (["It", "requires", "vast", "amounts", "of", "land", "and", "water"], "広大な土地と水を必要とします"),
        (["It", "produces", "significant", "greenhouse", "gases"], "重要な温室効果ガスを生産します"),
        (["Plant", "based", "diets", "have", "much", "lower", "impact"], "植物ベースの食事ははるかに低い影響を持ちます"),
        (["You", "do", "not", "need", "to", "become", "vegan"], "ビーガンになる必要はありません"),
        (["Simply", "eating", "less", "meat", "helps"], "単に肉を少なく食べることが助けになります"),
        (["Try", "meatless", "Mondays"], "ミートレスマンデーを試してください"),
        (["Choose", "local", "and", "seasonal", "food"], "地元の旬の食べ物を選んでください"),
        (["Transporting", "food", "long", "distances", "uses", "energy"], "長距離で食べ物を輸送することはエネルギーを使います"),
        (["Out", "of", "season", "produce", "requires", "heated", "greenhouses"], "季節外れの農産物は加熱された温室を必要とします"),
        (["Local", "farmers", "markets", "offer", "fresh", "options"], "地元の農家市場は新鮮な選択肢を提供します"),
        (["Reduce", "food", "waste"], "食品廃棄物を減らしてください"),
        (["One", "third", "of", "food", "produced", "is", "wasted"], "生産される食品の3分の1が無駄になります"),
        (["Plan", "meals", "to", "use", "what", "you", "buy"], "買ったものを使うために食事を計画してください"),
        (["Store", "food", "properly", "to", "extend", "freshness"], "新鮮さを延ばすために適切に食品を保存してください"),
        (["Compost", "food", "scraps"], "食品くずを堆肥にしてください"),
        (["Use", "reusable", "items"], "再利用可能なアイテムを使ってください"),
        (["Bring", "your", "own", "bags", "to", "stores"], "店に自分のバッグを持って行ってください"),
        (["Use", "refillable", "water", "bottles"], "詰め替え可能な水筒を使ってください"),
        (["Choose", "products", "with", "minimal", "packaging"], "最小限のパッケージの製品を選んでください"),
        (["Support", "companies", "with", "strong", "sustainability", "commitments"], "強力な持続可能性のコミットメントを持つ企業をサポートしてください"),
        (["Research", "brands", "before", "buying"], "購入前にブランドを調査してください"),
        (["Your", "purchasing", "power", "is", "a", "vote"], "あなたの購買力は投票です"),
        (["Companies", "respond", "to", "consumer", "demand"], "企業は消費者の需要に応答します"),
        
        # Policy and Governance (政策とガバナンス)
        (["Government", "policy", "is", "crucial", "for", "sustainability"], "政府の政策は持続可能性に重要です"),
        (["Individual", "action", "alone", "is", "insufficient"], "個人の行動だけでは不十分です"),
        (["We", "need", "systemic", "change"], "システム的な変化が必要です"),
        (["Carbon", "pricing", "makes", "pollution", "expensive"], "炭素価格設定は汚染を高価にします"),
        (["Carbon", "taxes", "charge", "for", "emissions"], "炭素税は排出に対して課金します"),
        (["Cap", "and", "trade", "systems", "limit", "total", "emissions"], "キャップアンドトレードシステムは総排出量を制限します"),
        (["Companies", "must", "buy", "permits", "to", "pollute"], "企業は汚染するために許可証を購入しなければなりません"),
        (["This", "creates", "economic", "incentive", "to", "reduce", "emissions"], "これは排出を減らすための経済的インセンティブを作ります"),
        (["Subsidies", "can", "accelerate", "clean", "technology"], "補助金はクリーン技術を加速できます"),
        (["Supporting", "renewable", "energy", "helps", "it", "compete"], "再生可能エネルギーを支援することはそれが競争するのを助けます"),
        (["Incentives", "for", "electric", "vehicles", "increase", "adoption"], "電気自動車へのインセンティブは採用を増やします"),
        (["Regulations", "set", "minimum", "standards"], "規制は最低基準を設定します"),
        (["Emissions", "standards", "for", "vehicles", "reduce", "pollution"], "車両の排出基準は汚染を減らします"),
        (["Building", "codes", "require", "energy", "efficiency"], "建築基準はエネルギー効率を要求します"),
        (["Plastic", "bag", "bans", "reduce", "waste"], "ビニール袋禁止は廃棄物を減らします"),
        (["International", "cooperation", "is", "essential"], "国際協力は不可欠です"),
        (["Climate", "change", "is", "a", "global", "problem"], "気候変動は地球規模の問題です"),
        (["No", "country", "can", "solve", "it", "alone"], "どの国も単独で解決できません"),
        (["The", "Paris", "Agreement", "unites", "nations"], "パリ協定は国々を統一します"),
        (["Countries", "commit", "to", "reducing", "emissions"], "国々は排出を減らすことを約束します"),
        (["They", "report", "progress", "and", "strengthen", "targets"], "進捗を報告し目標を強化します"),
        (["Developed", "nations", "must", "lead"], "先進国は主導しなければなりません"),
        (["They", "caused", "most", "historical", "emissions"], "歴史的排出のほとんどを引き起こしました"),
        (["They", "have", "resources", "to", "act"], "行動する資源があります"),
        (["They", "should", "help", "developing", "countries", "transition"], "発展途上国の移行を助けるべきです"),
        (["Climate", "finance", "supports", "adaptation", "and", "mitigation"], "気候資金は適応と緩和を支援します"),
        (["Technology", "transfer", "shares", "clean", "solutions"], "技術移転はクリーンな解決策を共有します"),
        (["Justice", "must", "be", "central", "to", "climate", "action"], "正義は気候行動の中心でなければなりません"),
        (["Vulnerable", "communities", "suffer", "most", "from", "climate", "change"], "脆弱なコミュニティは気候変動から最も苦しみます"),
        (["Yet", "they", "contributed", "least", "to", "the", "problem"], "しかし彼らは問題に最も少ししか貢献しませんでした"),
        (["Solutions", "must", "not", "worsen", "inequality"], "解決策は不平等を悪化させてはなりません"),
        (["Green", "jobs", "should", "provide", "good", "wages"], "グリーンジョブは良い賃金を提供すべきです"),
        (["Communities", "must", "participate", "in", "planning"], "コミュニティは計画に参加しなければなりません"),
        
        # Education and Awareness (教育と意識)
        (["Education", "is", "fundamental", "to", "sustainability"], "教育は持続可能性の基本です"),
        (["People", "must", "understand", "the", "problems"], "人々は問題を理解しなければなりません"),
        (["They", "must", "know", "solutions", "exist"], "解決策が存在することを知らなければなりません"),
        (["Schools", "should", "teach", "environmental", "science"], "学校は環境科学を教えるべきです"),
        (["Students", "need", "to", "understand", "ecosystems"], "生徒は生態系を理解する必要があります"),
        (["They", "should", "learn", "about", "climate", "change"], "気候変動について学ぶべきです"),
        (["Education", "should", "be", "action", "oriented"], "教育は行動志向であるべきです"),
        (["Students", "can", "participate", "in", "school", "gardens"], "生徒は学校の庭に参加できます"),
        (["They", "can", "conduct", "energy", "audits"], "エネルギー監査を実施できます"),
        (["They", "can", "organize", "recycling", "programs"], "リサイクルプログラムを組織できます"),
        (["This", "builds", "practical", "skills"], "これは実践的なスキルを構築します"),
        (["It", "empowers", "young", "people", "to", "make", "change"], "若者が変化を起こすことを可能にします"),
        (["Media", "has", "responsibility", "to", "inform"], "メディアには情報を伝える責任があります"),
        (["Accurate", "climate", "reporting", "is", "essential"], "正確な気候報道は不可欠です"),
        (["False", "balance", "misleads", "the", "public"], "偽のバランスは公衆を誤解させます"),
        (["Scientific", "consensus", "is", "clear"], "科学的コンセンサスは明確です"),
        (["Media", "should", "reflect", "this"], "メディアはこれを反映すべきです"),
        (["Stories", "should", "highlight", "solutions"], "物語は解決策を強調すべきです"),
        (["Not", "just", "problems"], "問題だけでなく"),
        (["This", "inspires", "hope", "and", "action"], "これは希望と行動を鼓舞します"),
        (["Social", "movements", "drive", "change"], "社会運動は変化を推進します"),
        (["Youth", "climate", "strikes", "raise", "awareness"], "若者の気候ストライキは意識を高めます"),
        (["They", "pressure", "leaders", "to", "act"], "リーダーに行動するよう圧力をかけます"),
        (["Grassroots", "organizations", "mobilize", "communities"], "草の根組織はコミュニティを動員します"),
        (["They", "organize", "protests", "and", "campaigns"], "抗議とキャンペーンを組織します"),
        (["They", "push", "for", "policy", "changes"], "政策変更を押し進めます"),
        (["Everyone", "can", "get", "involved"], "誰でも関与できます"),
        (["Join", "environmental", "groups"], "環境グループに参加してください"),
        (["Attend", "town", "hall", "meetings"], "タウンホールミーティングに出席してください"),
        (["Contact", "elected", "officials"], "選出された役人に連絡してください"),
        (["Your", "voice", "matters"], "あなたの声は重要です"),
        
        # Hope and Action (希望と行動)
        (["The", "challenges", "are", "immense"], "課題は巨大です"),
        (["But", "solutions", "exist"], "しかし解決策は存在します"),
        (["We", "have", "the", "technology", "we", "need"], "必要な技術があります"),
        (["Renewable", "energy", "works"], "再生可能エネルギーは機能します"),
        (["Sustainable", "practices", "are", "proven"], "持続可能な実践は証明されています"),
        (["What", "we", "need", "is", "will"], "必要なのは意志です"),
        (["Will", "to", "change", "harmful", "systems"], "有害なシステムを変える意志"),
        (["Will", "to", "prioritize", "long", "term", "over", "short", "term"], "短期より長期を優先する意志"),
        (["Will", "to", "work", "together"], "一緒に働く意志"),
        (["Change", "is", "already", "happening"], "変化はすでに起こっています"),
        (["Renewable", "energy", "is", "growing", "exponentially"], "再生可能エネルギーは指数関数的に成長しています"),
        (["Electric", "vehicle", "sales", "are", "soaring"], "電気自動車の販売は急上昇しています"),
        (["More", "companies", "commit", "to", "net", "zero"], "より多くの企業がネットゼロにコミットしています"),
        (["Cities", "are", "becoming", "greener"], "都市はよりグリーンになっています"),
        (["Young", "people", "are", "demanding", "action"], "若者は行動を要求しています"),
        (["This", "momentum", "must", "accelerate"], "この勢いは加速しなければなりません"),
        (["Every", "action", "counts"], "すべての行動がカウントされます"),
        (["Every", "choice", "matters"], "すべての選択が重要です"),
        (["Together", "we", "can", "build", "a", "sustainable", "future"], "一緒に持続可能な未来を築くことができます"),
        (["A", "future", "where", "nature", "thrives"], "自然が繁栄する未来"),
        (["Where", "people", "live", "well", "within", "planetary", "boundaries"], "人々が地球の境界内でよく生きる未来"),
        (["Where", "justice", "and", "sustainability", "go", "hand", "in", "hand"], "正義と持続可能性が手を取り合う未来"),
        (["This", "future", "is", "possible"], "この未来は可能です"),
        (["But", "only", "if", "we", "act", "now"], "しかし今行動する場合のみ"),
        (["The", "time", "for", "delay", "is", "over"], "遅延の時は終わりました"),
        (["The", "time", "for", "action", "is", "now"], "行動の時は今です"),
        (["Let", "us", "build", "the", "sustainable", "society", "we", "need"], "必要な持続可能な社会を築きましょう"),
        (["For", "ourselves", "and", "future", "generations"], "私たち自身と将来の世代のために"),
        (["The", "journey", "begins", "with", "each", "of", "us"], "旅は私たち一人一人から始まります"),
        (["Today"], "今日"),
    ]
    
    for words, meaning in content:
        phrases.append(create_phrase(f"phrase-{pid}", words, meaning))
        pid += 1
    
    word_count = sum(len(p['words']) for p in phrases)
    
    return {
        "id": "advanced-1",
        "title": "Sustainable Society",
        "level": "上級",
        "theme": "持続可能な社会",
        "targetWordCount": 3500,
        "actualWordCount": word_count,
        "phrases": phrases
    }


def save_passage(passage, output_dir):
    """パッセージをJSONファイルに保存"""
    output_path = output_dir / f"{passage['id']}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(passage, f, ensure_ascii=False, indent=2)
    print(f"✓ {passage['id']}: {passage['actualWordCount']}語")
    return passage['actualWordCount']


def main():
    print("="*70)
    print("Advanced パッセージ生成")
    print("="*70)
    
    output_dir = Path("prototype")
    
    print("\n生成中: advanced-1 (Sustainable Society)...")
    adv1 = generate_advanced_1()
    wc1 = save_passage(adv1, output_dir)
    
    print(f"\n✓ advanced-1完成: {wc1}語")
    print("\n次のステップでadvanced-2, 3を作成")


if __name__ == "__main__":
    main()
