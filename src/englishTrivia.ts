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

// 英語の面白い豆知識
const ENGLISH_FUN_FACTS: EnglishTrivia[] = [
  {
    type: 'fun-fact',
    message: '🧙「"queue"という単語は5文字だが、最後の4文字を取っても発音は同じ"Q"なのじゃ。不思議じゃのう。」',
    teacher: 'wise-sage'
  },
  {
    type: 'fun-fact',
    message: '🤖「英語で最も長い単語は"pneumonoultramicroscopicsilicovolcanoconiosis"（45文字）。肺の病気の名称です。」',
    teacher: 'analyst'
  },
  {
    type: 'fun-fact',
    message: '😃「"bookkeeper"は、連続する同じ文字が3組もある珍しい単語なんですよ（oo, kk, ee）！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'fun-fact',
    message: '😼「"set"は英語で最も意味の多い単語だ！動詞だけで430以上の意味があるぞ！すごいだろ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'fun-fact',
    message: '🧙「"goodbye"の語源は"God be with you"なのじゃ。時を経て短くなったのじゃな。」',
    teacher: 'wise-sage'
  },
  {
    type: 'fun-fact',
    message: '🤖「"rhythm"は母音がyしかない最長の英単語です。統計的に珍しいパターンです。」',
    teacher: 'analyst'
  },
  {
    type: 'fun-fact',
    message: '😃「"uncopyrightable"は、同じ文字を2回使わない最長の英単語（15文字）なんですよ！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'fun-fact',
    message: '😈「"terrific"と"terrible"は語源が同じだが、意味は正反対だ！言葉は面白いものだな！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'fun-fact',
    message: '🧙「"month"には完全な韻を踏む単語が存在せぬ。"orange"、"silver"、"purple"も同様じゃ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'fun-fact',
    message: '😼「"I am"は英語で2番目に短い完全な文だ！1番短いのは"Go"だぞ！」',
    teacher: 'enthusiastic-coach'
  }
];

// 発音に関する豆知識
const PRONUNCIATION_TIPS: EnglishTrivia[] = [
  {
    type: 'pronunciation',
    message: '😃「"L"と"R"の発音の違い、難しいですよね。Lは舌先を上の歯の裏に、Rは舌をどこにも付けずに！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'pronunciation',
    message: '😈「"th"の発音！舌を噛め！"think"を"シンク"と言うな！正しく発音しろ！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'pronunciation',
    message: '🤖「"schedule"はアメリカ英語では"スケジュール"、イギリス英語では"シェジュール"。地域差があります。」',
    teacher: 'analyst'
  },
  {
    type: 'pronunciation',
    message: '🧙「"salmon"の"l"、"Wednesday"の最初の"d"は発音せぬぞ。黙字じゃ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'pronunciation',
    message: '😼「"water"のtはアメリカ英語だと"ワラー"みたいになるぞ！RとDの中間みたいな音だ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'pronunciation',
    message: '😃「"comfortable"は3音節で"カムフタブル"。"コンフォータブル"じゃないですよ！」',
    teacher: 'kind-teacher'
  },
  {
    type: 'pronunciation',
    message: '🤖「"colonel"は"kernel"と同じ発音です。スペルと発音の不一致の典型例です。」',
    teacher: 'analyst'
  }
];

// 文化に関する豆知識
const CULTURAL_TIPS: EnglishTrivia[] = [
  {
    type: 'cultural',
    message: '😃「"How are you?"と聞かれたら、本当に調子が悪くても"I\'m fine"と答えるのが普通ですよ。挨拶みたいなものです。」',
    teacher: 'kind-teacher'
  },
  {
    type: 'cultural',
    message: '🧙「アメリカでは"thank you"と言われたら"You\'re welcome"じゃが、イギリスでは"No worries"もよく使うのじゃ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'cultural',
    message: '🤖「"see you later"は実際に後で会う予定がなくても使います。別れの挨拶として機能します。」',
    teacher: 'analyst'
  },
  {
    type: 'cultural',
    message: '😼「アメリカ人は"awesome"を超頻繁に使うぞ！ちょっと良いことでも"That\'s awesome!"だ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'cultural',
    message: '😃「レストランで"I\'m good"と言うと「大丈夫です（要りません）」という意味になりますよ。」',
    teacher: 'kind-teacher'
  },
  {
    type: 'cultural',
    message: '😈「"sorry"を連発するのは日本人の癖だ！必要ない時まで謝るな！堂々としろ！」',
    teacher: 'drill-sergeant'
  },
  {
    type: 'cultural',
    message: '🧙「"bless you"はくしゃみをした人に言う言葉じゃ。中世の疫病の名残りじゃな。」',
    teacher: 'wise-sage'
  }
];

// 語源に関する豆知識
const ETYMOLOGY_TIPS: EnglishTrivia[] = [
  {
    type: 'etymology',
    message: '🧙「"breakfast"は"break"（破る）と"fast"（断食）からできた言葉じゃ。夜の断食を破る食事じゃな。」',
    teacher: 'wise-sage'
  },
  {
    type: 'etymology',
    message: '🤖「"salary"の語源はラテン語の"salarium"（塩のお金）。ローマ兵士が塩で給料を受け取っていたことに由来します。」',
    teacher: 'analyst'
  },
  {
    type: 'etymology',
    message: '😃「"butterfly"の語源は諸説ありますが、バターのような黄色い蝶に由来するという説が有力ですよ。」',
    teacher: 'kind-teacher'
  },
  {
    type: 'etymology',
    message: '🧙「"quarantine"（隔離）は、イタリア語の"quaranta"（40）が語源じゃ。疫病の船を40日間隔離したことからじゃ。」',
    teacher: 'wise-sage'
  },
  {
    type: 'etymology',
    message: '😼「"OK"の語源は諸説あるが、"oll korrect"（all correctのふざけたスペル）説が有力だぞ！」',
    teacher: 'enthusiastic-coach'
  },
  {
    type: 'etymology',
    message: '🤖「"robot"はチェコ語の"robota"（強制労働）が語源。1920年の戯曲で初めて使われました。」',
    teacher: 'analyst'
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

// 学習中の息抜き豆知識
export function getBreatherTrivia(): string {
  const breathers = [
    '😃💡 ちょっと息抜き！"bookworm"は「本の虫」＝読書好きな人のことですよ。',
    '😼💡 豆知識！"piece of cake"は「簡単なこと」という意味だぞ！ケーキ食べるように簡単ってことだ！',
    '🧙💡 知っておるか？"It\'s raining cats and dogs"は土砂降りという意味じゃ。',
    '🤖💡 データ：英語には17万語以上の単語が存在します。でも日常会話は3000語程度で十分です。',
    '😈💡 覚えておけ！"break a leg"は「頑張って」という意味だ！足を折れって意味じゃないぞ！',
    '😃💡 "couch potato"は「カウチポテト」＝テレビばかり見てゴロゴロしている人のことです。',
    '🧙💡 "once in a blue moon"は「めったにない」という意味じゃ。青い月は滅多に見えぬからのう。',
    '😼💡 "hit the books"は「勉強する」って意味だ！本を叩くんじゃないぞ！',
    '🤖💡 興味深い事実："alphabet"はギリシャ文字の最初の2文字"alpha"と"beta"に由来します。',
    '😃💡 "butterflies in my stomach"は緊張してドキドキする様子を表現する言葉ですよ。'
  ];
  
  return breathers[Math.floor(Math.random() * breathers.length)];
}
