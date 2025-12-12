// 英語あるある・豆知識システム
import { AIPersonality } from '@/types';

export interface EnglishTrivia {
  type: 'fun-fact' | 'common-mistake' | 'cultural' | 'etymology' | 'pronunciation' | 'grammar-tip';
  content?: string; // 豆知識の内容（AI人格に依存しない）
  messages?: {
    [key in AIPersonality]: string; // 各AI人格の言い方
  };
  teacher?: AIPersonality; // 廃止予定（後方互換性のため残す）
  message?: string; // 廃止予定（後方互換性のため残す）
}

// 全AI人格対応の豆知識（新形式）
const ENGLISH_TRIVIA_NEW: EnglishTrivia[] = [
  {
    type: 'common-mistake',
    content: 'I\'m exciting と I\'m excited の違い',
    messages: {
      'drill-sergeant': '😈「"I\'m exciting"は間違いだ！自分がワクワクしてる時は"I\'m excited"だ！excitingは「興奮させる」、excitedは「興奮している」だぞ！」',
      'kind-teacher': '😃「"I\'m exciting"って言ってませんか？正しくは"I\'m excited"ですよ。自分がワクワクしてる時はed形、人を興奮させるものはing形です！」',
      'analyst': '🤖「感情動詞の分析："I\'m excited"（興奮状態）、"It\'s exciting"（興奮させる性質）。人の感情はed形、原因や性質はing形です。」',
      'enthusiastic-coach': '😼「"I\'m excited"だぞ！自分の気持ちはed形だ！覚えろ！excitingは「ワクワクさせるもの」に使うんだ！」',
      'wise-sage': '🧙「"excited"と"exciting"の違いじゃな。人の感情状態にはed形、物事の性質にはing形を使うのじゃ。」'
    }
  },
  {
    type: 'common-mistake',
    content: 'I\'m boring と I\'m bored の違い',
    messages: {
      'drill-sergeant': '😈「"I\'m boring"は「私は退屈な人間だ」という意味だぞ！退屈してる時は"I\'m bored"が正解だ！間違えるな！」',
      'kind-teacher': '😃「"I\'m boring"だと「私は退屈な人だ」になってしまいます。退屈してる時は"I\'m bored"ですよ！」',
      'analyst': '🤖「boring=退屈させる性質、bored=退屈している状態。主語が人で状態を表す場合はed形を選択します。」',
      'enthusiastic-coach': '😼「"I\'m bored"だ！退屈してる時はed形だぞ！boringは「退屈な人・物」に使うんだ！混同するな！」',
      'wise-sage': '🧙「boringは「退屈させる」性質、boredは「退屈している」状態じゃ。自分の気持ちならed形じゃぞ。」'
    }
  },
  {
    type: 'common-mistake',
    content: 'funnyとfunの違い',
    messages: {
      'drill-sergeant': '😈「"funny"と"fun"は違うぞ！funnyは「面白い（笑える）」、funは「楽しい」だ！混同するな！」',
      'kind-teacher': '😃「"funny"は「面白い・笑える」、"fun"は「楽しい」という違いがありますよ。使い分けに注意しましょう！」',
      'analyst': '🤖「funny=humor（笑い）を伴う面白さ、fun=enjoyment（楽しさ）。意味の違いを正確に理解してください。」',
      'enthusiastic-coach': '😼「funnyは「笑える」、funは「楽しい」だ！ニュアンスが全然違うぞ！使い分けろ！」',
      'wise-sage': '🧙「funnyは笑いを誘う面白さ、funは心から楽しむことじゃ。状況に応じて使い分けるのじゃぞ。」'
    }
  },
  {
    type: 'common-mistake',
    content: 'adviceは数えられない名詞',
    messages: {
      'drill-sergeant': '😈「"an advice"は間違いだ！adviceは数えられない名詞だ！"a piece of advice"または"some advice"と言え！」',
      'kind-teacher': '😃「"advice"は数えられない名詞なので、"an advice"とは言えません。"a piece of advice"や"some advice"と言いましょう！」',
      'analyst': '🤖「advice=不可算名詞。数える場合は"a piece of advice"、"two pieces of advice"のように単位をつけます。」',
      'enthusiastic-coach': '😼「adviceは数えられないぞ！"a piece of advice"って言うんだ！この形を覚えろ！」',
      'wise-sage': '🧙「adviceは不可算名詞じゃ。一つのアドバイスは"a piece of advice"と表現するのじゃぞ。」'
    }
  },
  {
    type: 'fun-fact',
    content: '接頭辞re-は「再び」の意味',
    messages: {
      'drill-sergeant': '😈「接頭辞"re-"は「再び」だ！return（戻る）、review（復習）、repeat（繰り返す）、全部「再び」の意味が入ってるぞ！」',
      'kind-teacher': '😃「接頭辞"re-"は「再び」という意味なんですよ。return（戻る）、review（復習）、repeat（繰り返す）など、覚えやすいですね！」',
      'analyst': '🤖「接頭辞"re-"の意味分析：「再び・戻って」。return、review、repeat、rebuild等、共通の意味パターンを認識してください。」',
      'enthusiastic-coach': '😼「"re-"は「もう一回！」って意味だ！return（戻る）、review（見直す）、repeat（繰り返す）！覚えやすいだろ！」',
      'wise-sage': '🧙「接頭辞"re-"は「再び」を意味するのじゃ。return（再び来る）、review（再び見る）のように理解すると良いぞ。」'
    }
  },
  {
    type: 'fun-fact',
    content: '長文読解のコツ：最初と最後の段落を読む',
    messages: {
      'drill-sergeant': '😈「長文は最初と最後の段落を読め！そして各段落の最初の文をチェックだ！全体の流れが一瞬で掴めるぞ！」',
      'kind-teacher': '😃「長文読解のコツです！最初と最後の段落、そして各段落の最初の文を読むと、全体の流れがつかめますよ！」',
      'analyst': '🤖「長文読解の効率的手法：導入段落と結論段落、各段落のトピックセンテンスを読むことで論旨を把握できます。」',
      'enthusiastic-coach': '😼「長文は最初と最後が大事だ！あと各段落の出だしをチェックしろ！これで全体像が見えてくるぞ！」',
      'wise-sage': '🧙「長文の知恵じゃが、最初と最後の段落、各段落の冒頭文を読めば全体の流れが見えてくるぞ。」'
    }
  }
];

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
// 全ての豆知識をまとめる（新形式を優先）
const ALL_TRIVIA: EnglishTrivia[] = [
  ...ENGLISH_TRIVIA_NEW, // 新形式（全AI人格対応）を優先
  ...ENGLISH_COMMON_MISTAKES,
  ...ENGLISH_FUN_FACTS,
  ...PRONUNCIATION_TIPS,
  ...CULTURAL_TIPS,
  ...ETYMOLOGY_TIPS,
  ...GRAMMAR_TIPS
];

// ランダムに豆知識を取得（5%の確率）
// 現在のAI人格に応じてメッセージを変換
export function getRandomEnglishTrivia(personality?: AIPersonality): EnglishTrivia | null {
  if (Math.random() > 0.05) {
    return null;
  }
  
  const trivia = ALL_TRIVIA[Math.floor(Math.random() * ALL_TRIVIA.length)];
  
  // 新形式（messagesプロパティを持つ）の場合、現在のAI人格に応じたメッセージを返す
  if (personality && trivia.messages && trivia.messages[personality]) {
    return {
      ...trivia,
      message: trivia.messages[personality]
    };
  }
  
  return trivia;
}

// 特定の種類の豆知識を取得
export function getTriviaByType(type: EnglishTrivia['type'], personality?: AIPersonality): EnglishTrivia | null {
  const filtered = ALL_TRIVIA.filter(t => t.type === type);
  if (filtered.length === 0) return null;
  
  const trivia = filtered[Math.floor(Math.random() * filtered.length)];
  
  // 新形式の場合、現在のAI人格に応じたメッセージを返す
  if (personality && trivia.messages && trivia.messages[personality]) {
    return {
      ...trivia,
      message: trivia.messages[personality]
    };
  }
  
  return trivia;
}

// 間違いやすい英語あるある（正解・不正解に応じて）
export function getRelevantMistakeTip(isCorrect: boolean, personality?: AIPersonality): string | null {
  if (Math.random() > 0.08) return null; // 8%の確率
  
  if (isCorrect) {
    // 正解時は面白い豆知識や語源
    const tips = [...ENGLISH_FUN_FACTS, ...ETYMOLOGY_TIPS, ...CULTURAL_TIPS];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    
    // 新形式の場合、AI人格に応じたメッセージを返す
    if (personality && tip.messages && tip.messages[personality]) {
      return tip.messages[personality];
    }
    return tip.message || '';
  } else {
    // 不正解時は間違いやすいポイントや文法のコツ
    const tips = [...ENGLISH_COMMON_MISTAKES, ...GRAMMAR_TIPS];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    
    // 新形式の場合、AI人格に応じたメッセージを返す
    if (personality && tip.messages && tip.messages[personality]) {
      return tip.messages[personality];
    }
    return tip.message || '';
  }
}

// 学習中の息抜き知識（受験に役立つ内容）- AI人格対応版
export function getBreatherTrivia(personality?: AIPersonality): string {
  // 全AI人格対応の豆知識データ
  const triviaData = [
    {
      content: '受験テク！同じ単語の繰り返しを避けるため、代名詞や同義語に注目すると読解が楽になる',
      messages: {
        'drill-sergeant': '😈💡 受験テク！同じ単語の繰り返しを避けろ！代名詞（it, they, this）や同義語をチェックだ！読解が一気に楽になるぞ！',
        'kind-teacher': '😃💡 受験テクです！同じ単語の繰り返しを避けるため、代名詞（it, they, this）や同義語に注目すると読解が楽になりますよ。',
        'analyst': '🤖💡 読解効率化：代名詞（it, they, this）や同義語の参照関係を追うことで、論理構造を高速把握できます。',
        'enthusiastic-coach': '😼💡 受験の裏ワザだ！同じ単語の繰り返しをチェックしろ！代名詞や同義語を見つければ読解が超楽になるぞ！',
        'wise-sage': '🧙💡 読解の知恵じゃが、代名詞（it, they, this）や同義語の参照先を意識すると、文章の流れが見えてくるぞ。'
      }
    },
    {
      content: '動詞+前置詞の熟語は、イメージで覚える',
      messages: {
        'drill-sergeant': '😈💡 熟語の覚え方だ！動詞+前置詞はイメージで叩き込め！look up（上を見る→調べる）、give up（上げる→諦める）だぞ！',
        'kind-teacher': '😃💡 覚え方のコツ！動詞+前置詞の熟語は、イメージで覚えると忘れにくいですよ。look up（調べる）、give up（諦める）のように！',
        'analyst': '🤖💡 記憶定着法：動詞+前置詞熟語は視覚的イメージと結びつけることで長期記憶化率が向上します。',
        'enthusiastic-coach': '😼💡 熟語暗記のコツだ！動詞+前置詞はイメージで覚えろ！look up（上見る→調べる）、give up（上げる→諦める）だ！',
        'wise-sage': '🧙💡 熟語の知恵じゃが、動詞+前置詞はイメージで理解すると良いぞ。look up（調べる）は「上を見る」から来ておるのじゃ。'
      }
    },
    {
      content: '長文のコツ：設問を先に読む',
      messages: {
        'drill-sergeant': '😈💡 長文攻略法だ！設問を先に読め！何を探すべきか分かってから本文を読むんだ！時間短縮できるぞ！',
        'kind-teacher': '😃💡 長文のコツです！設問を先に読んでから本文を読むと、何を探せばいいか分かって効率的ですよ。',
        'analyst': '🤖💡 長文読解の最適化：設問を事前に確認することで、必要情報の選択的取得が可能になり、処理速度が向上します。',
        'enthusiastic-coach': '😼💡 長文は設問が先だ！何を探すか分かってから読めば、無駄な時間をかけずに済むぞ！',
        'wise-sage': '🧙💡 長文の知恵じゃが、設問を先に読んでから本文に臨むと、探すべき答えが見えてきて効率的じゃぞ。'
      }
    },
    {
      content: '統計データ：各難易度の単語数',
      messages: {
        'drill-sergeant': '😈💡 データを叩き込め！初級1,077語、中級1,616語、上級885語だ！計画的に語彙を増やせ！',
        'kind-teacher': '😃💡 統計データです！初級は約1,077語、中級は約1,616語、上級は約885語ですよ。計画的に語彙を増やしましょう。',
        'analyst': '🤖💡 統計データ：初級1,077語、中級1,616語、上級885語。合計3,578語を体系的に習得することが目標です。',
        'enthusiastic-coach': '😼💡 データで見るぞ！初級1,077語、中級1,616語、上級885語だ！全部マスターすれば最強だぞ！',
        'wise-sage': '🧙💡 数値で見ると、初級1,077語、中級1,616語、上級885語じゃ。焦らず一歩ずつ覚えていくのじゃぞ。'
      }
    },
    {
      content: '時制の一致の基本',
      messages: {
        'drill-sergeant': '😈💡 時制の一致だ！主節が過去形なら従属節も過去形だ！"He said that he was tired"だぞ！基本中の基本だ！',
        'kind-teacher': '😃💡 時制の一致です！主節が過去形なら従属節も過去形にしましょう。"He said that he was tired"のようにね。',
        'analyst': '🤖💡 時制の一致規則：主節＝過去形 → 従属節＝過去形。例："He said that he was tired"。文法の基礎です。',
        'enthusiastic-coach': '😼💡 時制の一致を覚えろ！主節が過去なら従属節も過去だ！"He said that he was tired"って感じだ！',
        'wise-sage': '🧙💡 時制の一致じゃが、主節が過去形なら従属節も過去形にするのが原則じゃ。"He said that he was tired"じゃな。'
      }
    }
  ];
  
  const selected = triviaData[Math.floor(Math.random() * triviaData.length)];
  
  // AI人格が指定されている場合は対応するメッセージを返す
  if (personality && selected.messages[personality]) {
    return selected.messages[personality];
  }
  
  // デフォルト（優しい先生）
  return selected.messages['kind-teacher'];
}
