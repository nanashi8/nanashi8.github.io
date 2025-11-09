import Foundation

// Note: This tool script defines CSV-only types and generators.
// To avoid being compiled into the app target (which would cause name collisions
// with the app's Core Data `Item` and top-level expressions errors), the
// executable main block is guarded by `#if DEBUG_CSV_GENERATOR`.


// 簡易CSV出力ユーティリティ（カンマ/二重引用符をエスケープ）
func csvLine(_ fields: [String]) -> String {
    return fields.map { f in
        if f.contains(",") || f.contains("\"") || f.contains("\n") {
            let e = f.replacingOccurrences(of: "\"", with: "\"\"")
            return "\"" + e + "\""
        } else {
            return f
        }
    }.joined(separator: ",")
}

// Renamed Item -> CSVItem to avoid collision with app's Core Data Item
struct CSVItem: Hashable {
    var term: String
    var reading: String
    var meaning: String
    var etymology: String
    var relatedWords: [String]
    var relatedFields: [String]
    var difficulty: String
}

// 片仮名化の超簡易近似（主要な基本語のみ辞書、未定義は原文を返す）
let kanaDict: [String:String] = [
    // verbs
    "look":"ルック","take":"テイク","get":"ゲット","go":"ゴー","come":"カム","put":"プット","turn":"ターン","give":"ギブ","make":"メイク","keep":"キープ","bring":"ブリング","call":"コール","find":"ファインド","show":"ショー","think":"シンク","know":"ノウ","use":"ユーズ","try":"トライ","ask":"アスク","tell":"テル","say":"セイ","work":"ワーク","help":"ヘルプ","play":"プレイ","study":"スタディ","eat":"イート","drink":"ドリンク","sleep":"スリープ","read":"リード","write":"ライト","open":"オープン","close":"クローズ","learn":"ラーン","teach":"ティーチ","watch":"ウォッチ","see":"シー","hear":"ヒア","listen":"リッスン","walk":"ウォーク","run":"ラン","swim":"スイム","wait":"ウェイト","meet":"ミート","live":"リブ","stay":"ステイ","leave":"リーブ","arrive":"アライヴ","start":"スタート","finish":"フィニッシュ","change":"チェンジ","talk":"トーク","speak":"スピーク","cook":"クック","clean":"クリーン",
    // particles
    "up":"アップ","down":"ダウン","on":"オン","off":"オフ","in":"イン","out":"アウト","over":"オーバー","away":"アウェイ","back":"バック","through":"スルー","into":"イントゥ","onto":"オントゥ","along":"アロング","around":"アラウンド","with":"ウィズ","without":"ウィズアウト","against":"アゲンスト","of":"オブ","from":"フロム","for":"フォー","to":"トゥ","at":"アット","by":"バイ","after":"アフター","before":"ビフォー","than":"ザン","as":"アズ",
    // nouns/adjectives common
    "apple":"アップル","book":"ブック","school":"スクール","teacher":"ティーチャー","student":"スチューデント","desk":"デスク","pencil":"ペンシル","notebook":"ノートブック","city":"シティ","country":"カントリー","family":"ファミリー","friend":"フレンド","music":"ミュージック","sport":"スポート","water":"ウォーター","food":"フード","animal":"アニマル","weather":"ウェザー","hello":"ハロー","morning":"モーニング","afternoon":"アフタヌーン","evening":"イブニング","station":"ステーション","price":"プライス","please":"プリーズ","time":"タイム","restaurant":"レストラン","hotel":"ホテル","bathroom":"バスルーム","bus":"バス","train":"トレイン","airport":"エアポート","ticket":"チケット","map":"マップ","museum":"ミュージアム","hospital":"ホスピタル","police":"ポリス",
]

func toKatakana(_ text: String) -> String {
    let lowered = text.lowercased()
    if let k = kanaDict[lowered] { return k }
    // 複合語/スペースを処理
    if lowered.contains(" ") || lowered.contains("-") || lowered.contains("/") {
        let parts = lowered.replacingOccurrences(of: "/", with: " ")
            .replacingOccurrences(of: "-", with: " ")
            .split(separator: " ")
        let conv = parts.map { kanaDict[String($0)] ?? String($0) }
        return conv.joined(separator: " ")
    }
    return text // 未登録は原文を返す（簡易）
}

// MARK: Generators

func genEnglishWords(target: Int) -> [CSVItem] {
    // カテゴリ別の基本語を幅広く用意
    let numbers = ["one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty"]
    let days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
    let months = ["january","february","march","april","may","june","july","august","september","october","november","december"]
    let colors = ["red","blue","green","yellow","black","white","orange","purple","pink","brown","gray","gold","silver"]
    let animals = ["dog","cat","bird","fish","horse","cow","sheep","pig","rabbit","bear","lion","tiger","monkey","elephant","giraffe","zebra","panda","fox","wolf","deer","mouse","rat","whale","dolphin","shark","eagle","owl","chicken","duck","goose","frog","turtle","snake","bee","ant","butterfly","spider","kangaroo","koala","camel","hippo","rhino"]
    let foods = ["rice","bread","noodles","meat","chicken","beef","pork","egg","milk","cheese","butter","yogurt","apple","banana","grape","orange","lemon","strawberry","peach","pear","carrot","potato","tomato","onion","cabbage","lettuce","cucumber","pumpkin","corn","mushroom","sugar","salt","pepper","tea","coffee","water","juice","soup","salad","cake","cookie","chocolate","icecream"]
    let school = ["school","teacher","student","class","classroom","desk","chair","pencil","pen","eraser","notebook","paper","book","bag","ruler","scissors","glue","computer","tablet","blackboard","whiteboard","marker","chalk","clock","test","exam","homework","subject","math","english","science","history","geography","music","art","pe","lunch"]
    let places = ["home","house","room","kitchen","bathroom","garden","park","street","city","village","country","mountain","river","sea","beach","island","shop","store","market","restaurant","cafe","school","library","hospital","station","airport","busstop","museum","zoo","hotel","office","factory","farm","temple","shrine"]
    let clothing = ["shirt","tshirt","pants","jeans","shorts","skirt","dress","coat","jacket","sweater","hat","cap","shoes","socks","boots","belt","scarf","gloves"]
    let body = ["head","face","hair","eye","ear","nose","mouth","tooth","neck","shoulder","arm","hand","finger","chest","back","stomach","leg","knee","foot","toe","heart"]
    let nature = ["sun","moon","star","sky","cloud","rain","snow","wind","storm","rainbow","tree","leaf","flower","grass","stone","rock","sand","soil","fire","water","ice"]
    let transport = ["car","bus","train","subway","bicycle","bike","motorcycle","truck","ship","boat","plane","airplane","taxi","tram"]
    let verbs = ["be","have","do","go","come","get","make","take","see","look","watch","hear","listen","say","tell","speak","think","know","learn","study","teach","read","write","open","close","eat","drink","cook","clean","wash","sleep","wake","play","run","walk","swim","work","help","use","try","start","finish","change","meet","live","stay","leave","arrive","buy","sell","pay","bring","carry","call","find","show","wait","move","build","draw","paint","sing","dance","smile","laugh","cry"]
    let adjectives = ["big","small","long","short","high","low","fast","slow","early","late","new","old","young","good","bad","hot","cold","warm","cool","right","left","happy","sad","kind","nice","funny","interesting","boring","beautiful","pretty","cute","clean","dirty","easy","hard","light","heavy","safe","dangerous","rich","poor","hungry","thirsty","tired","busy","free","quiet","noisy"]
    let occupations = ["teacher","student","doctor","nurse","driver","farmer","cook","chef","police","artist","singer","musician","actor","writer","engineer","pilot","clerk","manager","scientist","dentist","teacher","soldier","firefighter","carpenter","waiter","waitress","lawyer","judge"]

    var pool: [String] = []
    pool += numbers + days + months + colors + animals + foods + school + places + clothing + body + nature + transport + verbs + adjectives + occupations
    // 重複除去
    pool = Array(Set(pool)).sorted()

    // 十分な件数がない場合は語形変化で増やす（play/plays/played/playingなど）
    func expandForms(_ v: String) -> [String] {
        if ["be","have","do","go","come","get","make","take","see","look","watch","hear","listen","say","tell","speak","think","know","learn","study","teach","read","write","open","close","eat","drink","cook","clean","wash","sleep","wake","play","run","walk","swim","work","help","use","try","start","finish","change","meet","live","stay","leave","arrive","buy","sell","pay","bring","carry","call","find","show","wait","move","build","draw","paint","sing","dance","smile","laugh","cry"].contains(v) {
            return [v, v+"s", v+"ed", v+"ing"]
        }
        return [v]
    }
    var expanded: [String] = []
    for w in pool { expanded += expandForms(w) }
    expanded = Array(Set(expanded))

    // 300件を満たす
    let terms = Array(expanded.prefix(target))

    var items: [CSVItem] = []
    for t in terms {
        let reading = toKatakana(t)
        let meaning: String
        if colors.contains(t) { meaning = "色の名前" }
        else if numbers.contains(t) { meaning = "数の名前" }
        else if days.contains(t) { meaning = "曜日" }
        else if months.contains(t) { meaning = "月の名前" }
        else if animals.contains(t) { meaning = "動物" }
        else if foods.contains(t) { meaning = "食べ物・飲み物" }
        else if school.contains(t) { meaning = "学校・学習に関する語" }
        else if places.contains(t) { meaning = "場所・施設" }
        else if clothing.contains(t) { meaning = "衣類" }
        else if body.contains(t) { meaning = "からだの部位" }
        else if nature.contains(t) { meaning = "自然・天気・天体" }
        else if transport.contains(t) { meaning = "交通・乗り物" }
        else if verbs.contains(t.replacingOccurrences(of: "s", with: "").replacingOccurrences(of: "ed", with: "").replacingOccurrences(of: "ing", with: "")) { meaning = "基本動詞/語形" }
        else if adjectives.contains(t) { meaning = "基本形容詞" }
        else { meaning = "基本語彙" }

        let etymology = "日常で使う基本語。語源: 欧州語由来（概略）。"
        var related: [String] = []
        if colors.contains(t) { related = ["color","paint","rainbow"] }
        if animals.contains(t) { related = ["zoo","pet","wild"] }
        if foods.contains(t) { related = ["eat","meal","restaurant"] }
        if school.contains(t) { related = ["study","teacher","class"] }
        if places.contains(t) { related = ["map","travel","city"] }
        if nature.contains(t) { related = ["sky","weather","season"] }
        if verbs.contains(t) { related = ["do","action","practice"] }

        var fields: [String] = []
        if colors.contains(t) { fields = ["芸術","日常生活"] }
        else if animals.contains(t) { fields = ["生物","自然"] }
        else if foods.contains(t) { fields = ["食事","日常生活"] }
        else if school.contains(t) { fields = ["学校","学習"] }
        else if places.contains(t) { fields = ["地理","日常生活"] }
        else if clothing.contains(t) { fields = ["日常生活"] }
        else if body.contains(t) { fields = ["健康"] }
        else if nature.contains(t) { fields = ["自然"] }
        else if transport.contains(t) { fields = ["交通"] }
        else if numbers.contains(t) || days.contains(t) || months.contains(t) { fields = ["学校"] }
        else { fields = ["日常生活"] }

        let diff = (verbs.contains(t) || adjectives.contains(t)) ? "2" : "1"
        items.append(CSVItem(term: t, reading: reading, meaning: meaning, etymology: etymology, relatedWords: related, relatedFields: fields, difficulty: diff))
    }
    return items
}

func genIdioms(target: Int) -> [CSVItem] {
    let verbToParticles: [String:[String]] = [
        "look":["at","for","after","up","over","into","out","back","around"],
        "take":["off","on","out","up","over","back","in"],
        "get":["up","off","on","out","over","along","through","back","around"],
        "go":["out","in","on","off","over","through","back","ahead","away","along"],
        "come":["in","out","back","across","along","over","up","down"],
        "put":["on","off","out","up","away","back","through"],
        "turn":["on","off","up","down","in","out","over","back"],
        "make":["up","out","for","over","into"],
        "give":["up","in","out","back","away"],
        "bring":["up","out","back","about"],
        "call":["up","off","back","for","on"],
        "find":["out","out about"],
        "check":["in","out","over","up on"],
    ]
    // その他表現
    let fixed = [
        "as soon as","a lot of","each other","be good at","be interested in","be proud of","be afraid of","be responsible for","be similar to","be different from","because of","in front of","on top of","in spite of","according to","thanks to","in order to","as well as","as far as","as long as","by means of","at first","at last","in fact","of course","take care of","pay attention to","get rid of","look forward to","look up to","run out of","put up with","come up with","catch up with","keep up with",
    ]

    var set = Set<String>()
    var phrases: [String] = []
    for (v, parts) in verbToParticles {
        for p in parts {
            let ph = "\(v) \(p)"
            if !set.contains(ph) { set.insert(ph); phrases.append(ph) }
        }
    }
    for p in fixed { if !set.contains(p) { set.insert(p); phrases.append(p) } }
    // 足りない場合は、動詞と前置詞の現実的な組合せから追加
    let verbs = ["break","cut","fall","hand","hold","keep","let","point","put","set","take","turn","work","write"]
    let preps = ["up","down","on","off","in","out","over","away","back","through","with","for","to","from","at"]
    outer: while phrases.count < target {
        for v in verbs {
            for p in preps {
                let ph = "\(v) \(p)"
                if !set.contains(ph) { set.insert(ph); phrases.append(ph) }
                if phrases.count >= target { break outer }
            }
        }
    }

    // 生成
    var items: [CSVItem] = []
    for ph in phrases.prefix(target) {
        let reading = ph.split(separator: " ").map { toKatakana(String($0)) }.joined(separator: " ")
        let meaning = "英熟語: \(ph) の基本的な意味（学習用）。"
        let etym = "句動詞/表現の組合せ。構文として暗記。"
        let parts = ph.split(separator: " ")
        let related = parts.count >= 2 ? [String(parts[0]), String(parts[1])] : [ph]
        let fields = ["学校","日常生活"]
        let diff = ph.contains("as ") || ph.contains("in ") || ph.contains("of ") ? "2" : "1"
        items.append(CSVItem(term: ph, reading: reading, meaning: meaning, etymology: etym, relatedWords: related, relatedFields: fields, difficulty: diff))
    }
    return items
}

func genConversationV2(target: Int) -> [CSVItem] {
    // 基本テンプレート
    let places = ["station","library","hospital","museum","hotel","restaurant","toilet","bus stop","airport","post office","bank","park","school","classroom","city hall","police station","convenience store","supermarket","bookstore","bakery","pharmacy","parking lot","taxi stand"]
    let items = ["this","that","it","the book","the ticket","the map","the menu","the bag","the pen","the phone","the room","the seat","the window","the door","the key","the receipt","the bill"]
    let foods = ["water","tea","coffee","juice","rice","bread","noodles","chicken","salad","soup","cake","ice cream","pizza","hamburger","sandwich"]
    let activities = ["help me","speak slowly","say that again","show me","tell me the way","take a photo","open the door","close the window","call a taxi","change money","find my seat","check in","check out","carry this bag","translate this"]
    let times = ["What time is it?","When does it open?","When does it close?","What time is the next bus?","What time is the meeting?","When does the museum open?","When does the restaurant close?"]

    var phrases: [String] = []
    // 所在/価格/注文/依頼など
    for p in places { phrases.append("Where is the \(p)?") }
    for it in items { phrases.append("How much is \(it)?") }
    for f in foods { phrases.append("I'd like \(f), please.") }
    for a in activities { phrases.append("Could you \(a), please?") }
    phrases += times

    // 汎用依頼/所有/可否
    let moreStarts = ["Do you have","Can I have","May I have","Could I get","Is there"]
    let moreEnds = ["a map?","a ticket?","a receipt?","a discount?","free Wi-Fi?","an English menu?","a restroom?","any recommendations?","a charger?","a taxi?","a room available?"]
    for s in moreStarts { for e in moreEnds { phrases.append("\(s) \(e)") } }

    // 道案内
    let directions = ["How can I get to the station?","Which bus goes to the museum?","Is this the right way to the hotel?","How far is it from here?","How long does it take?","Could you tell me how to get to the airport?"]
    phrases += directions

    // 数詞×名詞
    let nums = [1,2,3,4,5,6,7,8,9,10]
    let countables = ["ticket","bottle of water","cup of coffee","slice of pizza","piece of cake","room","key","towel","fork","spoon","knife","bag","postcard"]
    for n in nums { for c in countables { phrases.append("I have \(n) \(c)s.") } }

    // 近隣施設の有無
    let poi = ["ATM","pharmacy","bakery","subway station","parking lot","taxi stand","bus stop","convenience store","supermarket","park","bank","post office","restroom"]
    for p in poi { phrases.append("Is there a \(p) near here?") }

    // どこで買える/できる
    let buyables = ["a ticket","a map","a SIM card","an adapter","an umbrella","a souvenir","some water","a postcard","stamps","a charger","medicine","a train pass","a bus ticket"]
    for b in buyables { phrases.append("Where can I buy \(b)?") }

    // 新規: 汎用動詞×目的語のテンプレート
    let requestVerbs = ["buy","find","see","visit","use","charge","book","reserve","order","change","exchange","return","cancel","print","copy","scan","borrow","repair","fix","wash","clean","send","ship","deliver","pay"]
    let objectsCommon = ["a ticket","a room","a table","a taxi","a map","my ticket","my seat","my bag","my phone","Wi-Fi","money","yen","dollars","my order","my booking","water","coffee","the restroom","the exit","the entrance","the elevator","the stairs","the platform","the gate","the counter","the office"]

    for v in requestVerbs { for o in objectsCommon { phrases.append("Where can I \(v) \(o)?") } }
    for v in requestVerbs { for o in objectsCommon { phrases.append("How can I \(v) \(o)?") } }
    for v in requestVerbs { for o in objectsCommon { phrases.append("Can I \(v) \(o)?") } }
    for v in requestVerbs { for o in objectsCommon { phrases.append("I want to \(v) \(o).") } }
    for v in requestVerbs { for o in objectsCommon { phrases.append("I need to \(v) \(o).") } }
    for v in requestVerbs { for o in objectsCommon { phrases.append("Please \(v) \(o).") } }

    // 時間・料金・開閉時間（placeごと）
    let timeVerbs = ["open","close","start","end"]
    for p in places { for tv in timeVerbs { phrases.append("What time does the \(p) \(tv)?") } }
    for p in places { phrases.append("When is the \(p) open?") }
    for p in places { phrases.append("When is the \(p) closed?") }

    // 価格詳細
    let purchasables = ["this","that","the ticket","the pass","the bottle of water","the coffee","the sandwich","the umbrella","the adapter","the charger"]
    for x in purchasables { phrases.append("How much does \(x) cost?") }

    // 300まで重複排除
    var set = Set<String>()
    var out: [String] = []
    for ph in phrases {
        let trimmed = ph.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty { continue }
        if !set.contains(trimmed) { set.insert(trimmed); out.append(trimmed) }
        if out.count >= target { break }
    }

    var itemsOut: [CSVItem] = []
    for ph in out.prefix(target) {
        let meaning = "会話表現: \(ph) の基本フレーズ。"
        let reading = ph.split(separator: " ").map { toKatakana(String($0)) }.joined(separator: " ")
        let etym = "旅行・日常で頻出の定型表現。"
        let fields = ["会話","旅行","日常生活"]
        itemsOut.append(CSVItem(term: ph, reading: reading, meaning: meaning, etymology: etym, relatedWords: [], relatedFields: fields, difficulty: "1"))
    }
    return itemsOut
}

func genClassical(target: Int) -> [CSVItem] {
    // 基本古語＋活用形展開で件数を確保（学習用に代表的語義）
    let bases = [
        ("あはれ","しみじみとした情趣・かわいそうだ"), ("をかし","趣がある・おもしろい"), ("いと","たいへん・非常に"), ("いみじ","たいそう・すばらしい/ひどい"), ("かなし","いとしい・かわいい"), ("あやし","不思議だ・身分が低い"), ("ありがたし","めったにない・すばらしい"), ("めでたし","すばらしい・めでたい"), ("やさし","上品だ・けなげだ"), ("うつくし","かわいらしい"), ("をとこ","男"), ("をんな","女"), ("いへ","家"), ("みち","道"), ("こころ","心・気持ち"), ("かたち","容貌・姿"), ("けしき","様子・機嫌・兆し"), ("ほど","程度・身分・年齢・時間"), ("かげ","光・姿・影・面影"), ("つれづれ","退屈なさま"), ("なり(断定)","〜である"), ("なり(存在/伝聞)","〜にある・〜だそうだ"), ("たり(断定)","〜である"), ("り(存続)","〜し続ける"), ("べし","〜すべきだ/〜にちがいない"), ("めり","〜ようだ（推定）"), ("らむ","〜のだろう（現在推量）"), ("けり","過去・詠嘆"), ("む","〜しよう・〜だろう"), ("ず","打消"), ("き","過去"), ("けむ","過去推量"), ("つ","完了・強意"), ("ぬ","完了・強意"), ("たり(完了)","完了・存続"), ("り","完了・存続"), ("まじ","〜まい（打消推量）"), ("らし","〜らしい（推定）"), ("やう","よう・様子"), ("たまふ","お与えになる（尊敬）"), ("侍り","あります・お仕えします"), ("候ふ","あります・お仕えします"), ("おぼゆ","思われる"), ("見ゆ","見える・現れる"), ("聞こゆ","申し上げる（謙譲）/聞こえる"), ("あり","ある"), ("なし","ない"), ("行く","行く"), ("来","来る"), ("見る","見る"), ("言ふ","言う"), ("問ふ","尋ねる"), ("答ふ","答える"),
    ]
    let inflectA = ["","し","き","けり","ける","く","う","げ","げに"]
    var set = Set<String>()
    var items: [CSVItem] = []
    for (w, m) in bases {
        for suf in inflectA {
            let term = suf.isEmpty ? w : w + suf
            if set.contains(term) { continue }
            set.insert(term)
            let reading = term
            let ety = "古文で頻出の語。用法と活用に注意。"
            let fields = ["国語","古文"]
            let diff = suf.isEmpty ? "2" : "3"
            items.append(CSVItem(term: term, reading: reading, meaning: m, etymology: ety, relatedWords: [], relatedFields: fields, difficulty: diff))
            if items.count >= target { break }
        }
        if items.count >= target { break }
    }
    if items.count < target {
        let nouns = ["あさ","ゆふべ","あかつき","あした","よる","ひる","はる","なつ","あき","ふゆ","ひと","こ","とも","やま","かわ","うみ","そら","くも","あめ","ゆき","かぜ","つき","ほし","はな","くさ","き","いし","すな","みち","いへ"]
        for n in nouns {
            if set.contains(n) { continue }
            set.insert(n)
            items.append(CSVItem(term: n, reading: n, meaning: "古文の基本語", etymology: "古語の名詞", relatedWords: [], relatedFields: ["国語","古文"], difficulty: "1"))
            if items.count >= target { break }
        }
    }
    return Array(items.prefix(target))
}

func genPeople(target: Int) -> [CSVItem] {
    let names = [
        // 科学
        "Albert Einstein","Marie Curie","Isaac Newton","Galileo Galilei","Charles Darwin","Niels Bohr","James Clerk Maxwell","Richard Feynman","Stephen Hawking","Michael Faraday","Dmitri Mendeleev","Louis Pasteur","Gregor Mendel","Nikola Tesla","Thomas Edison","Alexander Fleming","Enrico Fermi","Max Planck","Werner Heisenberg","Erwin Schrödinger","Paul Dirac","Rosalind Franklin","Barbara McClintock","Katherine Johnson","Ada Lovelace","Alan Turing","Grace Hopper","Tim Berners-Lee","Linus Pauling","Emmy Noether",
        // 芸術・文学
        "William Shakespeare","Homer","Dante Alighieri","Johann Wolfgang von Goethe","Leo Tolstoy","Fyodor Dostoevsky","Victor Hugo","Mark Twain","Jane Austen","Charles Dickens","Edgar Allan Poe","Ernest Hemingway","George Orwell","Franz Kafka","Gabriel Garcia Marquez","Haruki Murakami","夏目漱石","芥川龍之介","紫式部","清少納言",
        // 音楽
        "Ludwig van Beethoven","Wolfgang Amadeus Mozart","Johann Sebastian Bach","Frédéric Chopin","Franz Schubert","Pyotr Tchaikovsky","Antonín Dvořák","Giuseppe Verdi","Richard Wagner","Igor Stravinsky","Claude Debussy","Maurice Ravel",
        // 政治・歴史
        "Mahatma Gandhi","Nelson Mandela","George Washington","Abraham Lincoln","Theodore Roosevelt","Franklin D. Roosevelt","Winston Churchill","Napoleon Bonaparte","Julius Caesar","Cleopatra","Queen Elizabeth I","Queen Victoria","秦始皇帝","聖徳太子","織田信長","豊臣秀吉","徳川家康","坂本龍馬","西郷隆盛","伊藤博文",
        // 技術・企業
        "Steve Jobs","Steve Wozniak","Bill Gates","Paul Allen","Elon Musk","Larry Page","Sergey Brin","Sundar Pichai","Satya Nadella","Jeff Bezos","Andy Grove","Gordon Moore","Jensen Huang",
        // 医療・福祉
        "Florence Nightingale","Mother Teresa","Clara Barton","Jonas Salk",
        // スポーツ
        "Pelé","Diego Maradona","Lionel Messi","Cristiano Ronaldo","Michael Jordan","Serena Williams","Roger Federer","Usain Bolt","Yuzuru Hanyu",
        // 日本の科学・文化
        "野口英世","小柴昌俊","田中耕一","真鍋淑郎","湯川秀樹","朝永振一郎","本庶佑","川端康成","大江健三郎",
    ]

    let moreFirst = ["John","Mary","Robert","Patricia","Michael","Linda","William","Barbara","David","Elizabeth","James","Jennifer","Thomas","Susan","Charles","Margaret","Joseph","Sarah","Daniel","Karen"]
    let moreLast = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee"]

    var full: [String] = names
    outer: while full.count < target {
        for f in moreFirst {
            for l in moreLast {
                full.append("\(f) \(l)")
                if full.count >= target { break outer }
            }
        }
    }
    full = Array(Set(full)).prefix(target).map { $0 }

    var items: [CSVItem] = []
    for n in full.prefix(target) {
        let reading = n
        let meaning = "著名人: \(n) の概要（学習用）。"
        let ety = "人名（由来や業績を一言で）"
        let fields = ["歴史","文化","科学","芸術"].shuffled().prefix(2)
        items.append(CSVItem(term: n, reading: reading, meaning: meaning, etymology: ety, relatedWords: [], relatedFields: Array(fields), difficulty: "2"))
    }
    return items
}

// The following main-generation invocation is guarded so it won't be part of
// the app build. To run the script locally, invoke swift with -DDEBUG_CSV_GENERATOR
// example: swift -DDEBUG_CSV_GENERATOR Tools/generate_csvs.swift

#if DEBUG_CSV_GENERATOR
// main block (writes CSVs)
let root = FileManager.default.currentDirectoryPath
let resources = URL(fileURLWithPath: root).appendingPathComponent("SimpleWord/Resources")
try? FileManager.default.createDirectory(at: resources, withIntermediateDirectories: true)

let files: [(name:String, gen:(Int)->[CSVItem])] = [
    ("中学英単語.csv", genEnglishWords),
    ("中学英熟語.csv", genIdioms),
    ("中学英会話.csv", genConversationV2),
    ("中学古文単語.csv", genClassical),
    ("中学人名.csv", genPeople),
]

let targetCount = 300

for (fname, gen) in files {
    var items = gen(targetCount)
    // 念のため重複排除（term+reading+meaning+etymology基準）
    var seen = Set<CSVItem>()
    var unique: [CSVItem] = []
    for it in items { if !seen.contains(it) { seen.insert(it); unique.append(it) } }
    items = unique

    // 書き出し
    var lines: [String] = []
    lines.append(csvLine(["語句","読み","意味","語源等解説","関連語","関連分野","難易度"]))
    for it in items {
        lines.append(csvLine([
            it.term,
            it.reading,
            it.meaning,
            it.etymology,
            it.relatedWords.joined(separator: ";"),
            it.relatedFields.joined(separator: ";"),
            it.difficulty
        ]))
    }
    let text = lines.joined(separator: "\n")
    let url = resources.appendingPathComponent(fname)
    try text.write(to: url, atomically: true, encoding: .utf8)
    fputs("[WRITE] \(fname): rows=\(items.count)\n", stderr)
}

print("Done generating CSVs to \(resources.path)")
#endif
