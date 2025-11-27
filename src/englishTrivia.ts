// 英語あるある・豆知識システム
import { AIPersonality } from './types';

export interface EnglishTrivia {
  type: 'fun-fact' | 'common-mistake' | 'cultural' | 'etymology' | 'pronunciation' | 'grammar-tip';
  message: string;
  teacher?: AIPersonality;
}

// 英語あるあるネタ
const ENGLISH_COMMON_MISTAKES: EnglishTrivia[] = [
  {
    type: 'common-mistake',
    message: '😃「"I\'m exciting"って言ってませんか？正しくは"I\'m excited"ですよ。自分がワクワクしてる時はed形です！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'common-mistake',
    message: '😈「"I\'m boring"は「私は退屈な人間だ」という意味だぞ！"I\'m bored"が正解だ！間違えるな！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'common-mistake',
    message: '🤖「"funny"と"fun"は異なります。"funny"は「面白い（笑える）」、"fun"は「楽しい」。使い分けが重要です。」',
    teacher: 'analyst'
  },
  {
    type: 'common-mistake',
    message: '😃「"advice"は数えられない名詞なので、"an advice"とは言えません。"a piece of advice"と言いましょう！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'common-mistake',
    message: '😈「"How do you think?"は間違いだ！"What do you think?"が正解！何度言わせる！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'common-mistake',
    message: '😼「"see a dream"じゃないぞ！"have a dream"だ！夢は見るんじゃなくて持つんだ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'common-mistake',
    message: '🧙「"say"と"tell"の違いじゃが..."say"は内容を、"tell"は相手を強調するのじゃ。"tell me"とは言えるが"say me"とは言えぬぞ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'common-mistake',
    message: '😃「"enjoy"の後は必ず-ing形ですよ！"enjoy to study"ではなく"enjoy studying"です。」',
    teacher: 'kind-teacher'
  },
  {
    type: 'common-mistake',
    message: '🤖「"remember to do"（これからすることを覚えている）と"remember doing"（したことを覚えている）は意味が異なります。」',
    teacher: 'analyst'
  },
  {
    type: 'common-mistake',
    message: '😈「"I\'m agree"は間違いだ！"agree"は動詞だから"I agree"だ！基本を忘れるな！」',
    teacher: 'drill-sergeant'
  }
];

// 受験に役立つ英語知識
const ENGLISH_FUN_FACTS: EnglishTrivia[] = [
  {
    type: 'fun-fact',
    message: '🧙「接頭辞"re-"は「再び」の意味じゃ。return（戻る）、review（復習）、repeat（繰り返す）など、覚えやすいぞ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'fun-fact',
    message: '🤖「長文読解のコツ：最初と最後の段落、各段落の最初の文を読めば全体の流れがつかめます。」',
    teacher: 'analyst'
  },
  {
    type: 'fun-fact',
    message: '😃「"however"（しかし）、"therefore"（したがって）、"moreover"（さらに）などの接続詞を覚えると、論理展開が見えやすくなりますよ！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'fun-fact',
    message: '😼「接尾辞"-tion"をつけると動詞が名詞になるぞ！educate→education、communicate→communicationだ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'fun-fact',
    message: '🧙「"compare A with B"（AとBを比較する）と"compare A to B"（AをBに例える）は意味が違うぞ。試験でよく出る。」',
    teacher: 'wise-sage'
  },
  {
    type: 'fun-fact',
    message: '🤖「同義語を増やすと表現力が上がります。important=significant=crucial、show=demonstrate=illustrate など。」',
    teacher: 'analyst'
  },
  {
    type: 'fun-fact',
    message: '😃「接頭辞"un-"、"in-"、"dis-"は否定の意味。unhappy、impossible、disagreeなど、パターンで覚えましょう！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'fun-fact',
    message: '😈「"not only A but also B"（AだけでなくBも）は頻出構文だ！セットで覚えろ！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'fun-fact',
    message: '🧙「"although"と"though"はほぼ同じ意味（〜だけれども）じゃが、thoughの方がカジュアルじゃな。」',
    teacher: 'wise-sage'
  },
  {
    type: 'fun-fact',
    message: '😼「接尾辞"-able"は「〜できる」の意味だ！readable（読める）、comfortable（快適な）って感じだぞ！」',
    teacher: 'enthusiastic-coach'
  }
];

// 受験に役立つ発音・読解知識
const PRONUNCIATION_TIPS: EnglishTrivia[] = [
  {
    type: 'pronunciation',
    message: '😃「アクセント問題対策！2音節の名詞は最初にアクセント（PRESent）、動詞は後（preSENT）が多いですよ。」',
    teacher: 'kind-teacher'
  },
  {
    type: 'pronunciation',
    message: '😈「同じスペルでも品詞で発音が変わる！record（名詞：レコード、動詞：記録する）に注意しろ！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'pronunciation',
    message: '🤖「黙字（silent letter）に注意。knife（k）、doubt（b）、receipt（p）など、つづりと発音の不一致があります。」',
    teacher: 'analyst'
  },
  {
    type: 'pronunciation',
    message: '🧙「"-ed"の発音は3パターンじゃ。/t/（walked）、/d/（played）、/id/（wanted）。前の音で決まるぞ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'pronunciation',
    message: '😼「複数形"-s"の発音も3パターンだ！/s/（cats）、/z/（dogs）、/iz/（buses）を区別しよう！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'pronunciation',
    message: '😃「強勢の位置で意味が変わる語に注意！PHOtograph（写真）→phoTOgraphy（写真術）→photoGRAphic（写真の）」',
    teacher: 'kind-teacher'
  },
  {
    type: 'pronunciation',
    message: '🤖「リエゾン（音の連結）を知ると聞き取りが楽に。"an apple"は"アン・アップル"でなく"アナップル"です。」',
    teacher: 'analyst'
  }
];

// 受験に役立つ文化知識
const CULTURAL_TIPS: EnglishTrivia[] = [
  {
    type: 'cultural',
    message: '😃「英文エッセイは結論を最初に書くのが基本。Introduction→Body→Conclusionの3部構成ですよ。」',
    teacher: 'kind-teacher'
  },
  {
    type: 'cultural',
    message: '🧙「英語の論理展開は"主張→理由→具体例"が基本じゃ。For example, For instance を使いこなそう。」',
    teacher: 'wise-sage'
  },
  {
    type: 'cultural',
    message: '🤖「学術的な文章では、contractions（短縮形）は使いません。don\'t→do not、it\'s→it is と書きます。」',
    teacher: 'analyst'
  },
  {
    type: 'cultural',
    message: '😼「意見を述べる表現！I think, In my opinion, From my perspective など、バリエーションを増やそう！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'cultural',
    message: '😃「理由を述べる時は"because"だけじゃなく、"since"、"as"、"due to"なども使えますよ。」',
    teacher: 'kind-teacher'
  },
  {
    type: 'cultural',
    message: '😈「受動態を使いこなせ！"The experiment was conducted"など、客観的な表現に必要だ！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'cultural',
    message: '🧙「対比の表現："on the other hand"（一方で）、"in contrast"（対照的に）は論述問題で重宝するぞ。」',
    teacher: 'wise-sage'
  }
];

// 受験に役立つ語源知識
const ETYMOLOGY_TIPS: EnglishTrivia[] = [
  {
    type: 'etymology',
    message: '🧙「"pre-"は「前」の意味じゃ。preview（予習・試写）、predict（予測する）、prepare（準備する）と覚えよう。」',
    teacher: 'wise-sage'
  },
  {
    type: 'etymology',
    message: '🤖「"post-"は「後」。postpone（延期する）、postwar（戦後の）など。pre-とセットで覚えると効率的です。」',
    teacher: 'analyst'
  },
  {
    type: 'etymology',
    message: '😃「"tele-"はギリシャ語で「遠い」という意味。telephone（電話）、television（テレビ）、telescope（望遠鏡）ですよ！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'etymology',
    message: '🧙「"bi-"は「2つ」の意味じゃ。bicycle（二輪車）、bilingual（2言語話せる）、biweekly（隔週の）じゃな。」',
    teacher: 'wise-sage'
  },
  {
    type: 'etymology',
    message: '😼「"auto-"は「自動・自己」だ！automatic（自動の）、autobiography（自伝）って感じだぞ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'etymology',
    message: '🤖「"micro-"は「小さい」、"macro-"は「大きい」。microscope（顕微鏡）、macroeconomics（マクロ経済学）です。」',
    teacher: 'analyst'
  },
  {
    type: 'etymology',
    message: '😃「"sub-"は「下」の意味。subway（地下鉄）、submarine（潜水艦）、subtitle（字幕）ですよ！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'etymology',
    message: '🧙「"super-"は「上・超」じゃ。superior（優れた）、supernatural（超自然的な）、supervise（監督する）じゃな。」',
    teacher: 'wise-sage'
  }
];

// 文法のコツ
const GRAMMAR_TIPS: EnglishTrivia[] = [
  {
    type: 'grammar-tip',
    message: '😃「"a"と"an"の使い分けは、次の単語の「音」で決まります。"an hour"（hourのhは発音しない）ですよ！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'grammar-tip',
    message: '😈「現在完了は「今に関係がある過去」だ！"I have lost my key"は今も見つかってないという意味だ！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'grammar-tip',
    message: '🤖「"fewer"は数えられる名詞、"less"は数えられない名詞に使います。"fewer people"、"less water"です。」',
    teacher: 'analyst'
  },
  {
    type: 'grammar-tip',
    message: '🧙「"used to"は過去の習慣、"be used to"は慣れている、"get used to"は慣れるじゃ。全て違うぞ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'grammar-tip',
    message: '😼「"will"は意志、"be going to"は予定や予測だ！使い分けられると英語っぽくなるぞ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'grammar-tip',
    message: '😃「"some"と"any"、肯定文はsome、疑問文・否定文はanyが基本ですが、"Would you like some tea?"のように勧める時はsomeですよ！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'grammar-tip',
    message: '😈「三単現のs！忘れるな！"He go"ではなく"He goes"だ！基本中の基本だぞ！」',
    teacher: 'drill-sergeant'
  }
];

// 全ての豆知識をまとめる
const ALL_TRIVIA: EnglishTrivia[] = [
  ...ENGLISH_COMMON_MISTAKES,
  ...ENGLISH_FUN_FACTS,
  ...PRONUNCIATION_TIPS,
  ...CULTURAL_TIPS,
  ...ETYMOLOGY_TIPS,
  ...GRAMMAR_TIPS
];

// ランダムに豆知識を取得（5%の確率）
export function getRandomEnglishTrivia(): EnglishTrivia | null {
  if (Math.random() > 0.05) {
    return null;
  }
  
  return ALL_TRIVIA[Math.floor(Math.random() * ALL_TRIVIA.length)];
}

// 特定の種類の豆知識を取得
export function getTriviaByType(type: EnglishTrivia['type']): EnglishTrivia | null {
  const filtered = ALL_TRIVIA.filter(t => t.type === type);
  if (filtered.length === 0) return null;
  
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// 間違いやすい英語あるある（正解・不正解に応じて）
export function getRelevantMistakeTip(isCorrect: boolean): string | null {
  if (Math.random() > 0.08) return null; // 8%の確率
  
  if (isCorrect) {
    // 正解時は面白い豆知識や語源
    const tips = [...ENGLISH_FUN_FACTS, ...ETYMOLOGY_TIPS, ...CULTURAL_TIPS];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return tip.message;
  } else {
    // 不正解時は間違いやすいポイントや文法のコツ
    const tips = [...ENGLISH_COMMON_MISTAKES, ...GRAMMAR_TIPS];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return tip.message;
  }
}

// 学習中の息抜き知識（受験に役立つ内容）
export function getBreatherTrivia(): string {
  const breathers = [
    '😃💡 受験テク！同じ単語の繰り返しを避けるため、代名詞（it, they, this）や同義語に注目すると読解が楽になりますよ。',
    '😼💡 覚え方！動詞+前置詞の熟語は、イメージで覚えるといいぞ！look up（上を見る→調べる）、give up（上げる→諦める）だ！',
    '🧙💡 長文のコツ：設問を先に読んでから本文を読むと、何を探せばいいか分かって効率的じゃ。',
    '🤖💡 統計データ：初級は約1,077語、中級は約1,616語、上級は約885語です。計画的に語彙を増やしましょう。',
    '😈💡 時制の一致！主節が過去形なら従属節も過去形だ！"He said that he was tired"だぞ！',
    '😃💡 整序問題のコツ！まず主語と動詞を見つけて、修飾語を後から付け足すと解きやすいですよ。',
    '🧙💡 冠詞の使い分け："a/an"は初めて出る・特定できないもの、"the"は既出・特定できるものじゃ。',
    '😼💡 リスニング対策！消去法が有効だ！明らかに違う選択肢を消していくと正解率が上がるぞ！',
    '🤖💡 効率的学習法：単語は文脈の中で覚えると定着率が3倍以上高まります。例文ごと覚えましょう。',
    '😃💡 比較表現："as...as"（同等）、"-er than"（比較級）、"the -est"（最上級）の3パターンをマスターしましょう！'
  ];
  
  return breathers[Math.floor(Math.random() * breathers.length)];
}
