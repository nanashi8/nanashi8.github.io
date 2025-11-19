// 教師同士の掛け合い・冗談・通りすがりコメントシステム
import { AIPersonality } from './types';

export interface TeacherInteraction {
  mainTeacher: AIPersonality;
  otherTeacher?: AIPersonality;
  message: string;
  type: 'joke' | 'banter' | 'passerby' | 'argument' | 'support';
}

// ランダムに教師間のやりとりを生成（10%の確率で発生）
export function generateTeacherInteraction(
  currentPersonality: AIPersonality,
  isCorrect: boolean,
  streak: number
): TeacherInteraction | null {
  // 10%の確率でやりとりが発生
  if (Math.random() > 0.1) {
    return null;
  }
  
  const interactions = getInteractionPatterns(currentPersonality, isCorrect, streak);
  if (interactions.length === 0) return null;
  
  return interactions[Math.floor(Math.random() * interactions.length)];
}

// 教師の組み合わせごとのやりとりパターン
function getInteractionPatterns(
  mainTeacher: AIPersonality,
  isCorrect: boolean,
  streak: number
): TeacherInteraction[] {
  const patterns: TeacherInteraction[] = [];
  
  // 鬼軍曹のやりとり
  if (mainTeacher === 'drill-sergeant') {
    if (isCorrect && streak >= 5) {
      patterns.push({
        mainTeacher: 'drill-sergeant',
        otherTeacher: 'kind-teacher',
        message: '😈「よし！その調子だ！」 😃「ちょ、ちょっと褒めすぎでは...」 😈「うるさい！良いものは良いんだ！」',
        type: 'banter'
      });
      patterns.push({
        mainTeacher: 'drill-sergeant',
        otherTeacher: 'wise-sage',
        message: '😈「完璧だ！」 🧙「ふむ、鬼軍曹殿も嬉しそうじゃのう」 😈「べ、別に...」',
        type: 'banter'
      });
    }
    
    if (!isCorrect) {
      patterns.push({
        mainTeacher: 'drill-sergeant',
        otherTeacher: 'kind-teacher',
        message: '😈「何度同じ間違いを...！」 😃「まあまあ、落ち着いて。誰にでも苦手はありますから」 😈「甘やかすな！」',
        type: 'argument'
      });
      patterns.push({
        mainTeacher: 'drill-sergeant',
        otherTeacher: 'analyst',
        message: '😈「たるんでるぞ！」 🤖「統計的には許容範囲内のミスです」 😈「データじゃない、気持ちの問題だ！」',
        type: 'argument'
      });
    }
    
    // 通りすがり
    patterns.push({
      mainTeacher: 'drill-sergeant',
      otherTeacher: 'enthusiastic-coach',
      message: '😼（通りすがり）「おっ、鬼軍曹の特訓か！頑張れよ！」 😈「...余計な口出しするな」',
      type: 'passerby'
    });
  }
  
  // 優しい先生のやりとり
  if (mainTeacher === 'kind-teacher') {
    if (isCorrect) {
      patterns.push({
        mainTeacher: 'kind-teacher',
        otherTeacher: 'drill-sergeant',
        message: '😃「素晴らしいですね！」 😈（遠くから）「まだまだ油断するな！」 😃「...聞こえてます？」',
        type: 'passerby'
      });
      patterns.push({
        mainTeacher: 'kind-teacher',
        otherTeacher: 'wise-sage',
        message: '😃「よくできました！」 🧙「うむ、着実な成長じゃ」 😃「賢者先生もそう思われますよね」',
        type: 'support'
      });
    }
    
    if (!isCorrect) {
      patterns.push({
        mainTeacher: 'kind-teacher',
        otherTeacher: 'enthusiastic-coach',
        message: '😃「大丈夫、次は必ずできますよ」 😼「そうそう！失敗は成功の母だ！」 😃「熱血コーチも応援してますよ」',
        type: 'support'
      });
    }
    
    // 冗談
    patterns.push({
      mainTeacher: 'kind-teacher',
      message: '😃「あ、お茶を入れ忘れて...」 😈（遠くから）「仕事中に何してる！」 😃「す、すみません！」',
      type: 'joke'
    });
  }
  
  // 冷静な分析官のやりとり
  if (mainTeacher === 'analyst') {
    if (streak >= 10) {
      patterns.push({
        mainTeacher: 'analyst',
        otherTeacher: 'enthusiastic-coach',
        message: '🤖「10連続正解。統計的に有意です」 😼「すげー！最高だ！」 🤖「...感情表現は不要です」',
        type: 'banter'
      });
    }
    
    patterns.push({
      mainTeacher: 'analyst',
      otherTeacher: 'drill-sergeant',
      message: '🤖「データに基づくと...」 😈「理屈はいい！気合だ！」 🤖「非科学的です」 😈「うるさい！」',
      type: 'argument'
    });
    
    patterns.push({
      mainTeacher: 'analyst',
      otherTeacher: 'kind-teacher',
      message: '🤖「正答率73.4%」 😃「あの...もう少し優しく伝えられませんか？」 🤖「事実を述べているだけです」',
      type: 'banter'
    });
    
    // 冗談
    patterns.push({
      mainTeacher: 'analyst',
      message: '🤖「...コーヒーのカフェイン含有量は...」 😃「分析官先生、今は授業中ですよ」 🤖「失礼しました」',
      type: 'joke'
    });
  }
  
  // 熱血コーチのやりとり
  if (mainTeacher === 'enthusiastic-coach') {
    if (isCorrect && streak >= 5) {
      patterns.push({
        mainTeacher: 'enthusiastic-coach',
        otherTeacher: 'wise-sage',
        message: '😼「最っ高だぁぁ！！」 🧙「...少し声が大きいかのう」 😼「うるさくて悪かったな！」',
        type: 'banter'
      });
      patterns.push({
        mainTeacher: 'enthusiastic-coach',
        otherTeacher: 'drill-sergeant',
        message: '😼「よっしゃー！」 😈「騒がしい...だが、悪くないな」 😼「おっ、鬼軍曹に褒められた！」',
        type: 'support'
      });
    }
    
    if (!isCorrect) {
      patterns.push({
        mainTeacher: 'enthusiastic-coach',
        otherTeacher: 'kind-teacher',
        message: '😼「ドンマイ！次だ次！」 😃「そうですね、焦らずに」 😼「二人で応援してるぞ！」',
        type: 'support'
      });
    }
    
    // 冗談
    patterns.push({
      mainTeacher: 'enthusiastic-coach',
      message: '😼「今日の筋トレは...」 🤖「それは英語学習と無関係です」 😼「体が資本だろ！？」',
      type: 'joke'
    });
  }
  
  // 賢者のやりとり
  if (mainTeacher === 'wise-sage') {
    if (isCorrect) {
      patterns.push({
        mainTeacher: 'wise-sage',
        otherTeacher: 'drill-sergeant',
        message: '🧙「良き成長じゃ」 😈「当たり前だ、俺の教え子だからな」 🧙「...お主も教えておったのか？」',
        type: 'banter'
      });
    }
    
    patterns.push({
      mainTeacher: 'wise-sage',
      otherTeacher: 'analyst',
      message: '🧙「時には感覚も大事じゃぞ」 🤖「感覚は測定不可能です」 🧙「...若いのう」',
      type: 'argument'
    });
    
    patterns.push({
      mainTeacher: 'wise-sage',
      otherTeacher: 'enthusiastic-coach',
      message: '🧙「焦らず、じっくりと...」 😼「たまには全力疾走も大事っすよ！」 🧙「...それも一理あるか」',
      type: 'banter'
    });
    
    // 冗談
    patterns.push({
      mainTeacher: 'wise-sage',
      message: '🧙「昔はのう...」 😃😈😼🤖「「「「また昔話！？」」」」 🧙「...最近の若者は」',
      type: 'joke'
    });
  }
  
  // 全教師共通の職員室あるある
  const commonPatterns: TeacherInteraction[] = [
    {
      mainTeacher: mainTeacher,
      message: '😃「お昼は何食べます？」 😈「時間の無駄だ」 😼「俺はカツ丼！」 🤖「栄養バランスを考慮すべきです」 🧙「...わしは蕎麦がいいのう」',
      type: 'joke'
    },
    {
      mainTeacher: mainTeacher,
      message: '😈「...誰だ、職員室でコーヒーこぼしたのは！」 😃「す、すみません...」 😼「ドンマイ！」 🤖「清掃方法を提示します」',
      type: 'joke'
    },
    {
      mainTeacher: mainTeacher,
      message: '🧙「...印刷機が動かんのじゃが」 🤖「IT担当を呼びます」 😃「私が見てみますね」 😈「さっさと直せ！」 😼「みんなで協力だ！」',
      type: 'joke'
    },
    {
      mainTeacher: mainTeacher,
      message: '😼「今日の授業どうだった？」 😃「みんな頑張ってましたよ」 😈「まだまだだ」 🤖「データで見ると改善傾向です」 🧙「それぞれの成長があるのう」',
      type: 'banter'
    }
  ];
  
  // 5%の確率で職員室あるあるを追加
  if (Math.random() < 0.05) {
    patterns.push(...commonPatterns);
  }
  
  return patterns;
}

// 時間帯に応じた教師間の会話
export function getTimeBasedTeacherChat(): string | null {
  const hour = new Date().getHours();
  
  // 5%の確率で発生
  if (Math.random() > 0.05) return null;
  
  if (hour >= 6 && hour < 9) {
    const morning = [
      '😃「おはようございます！」 😈「朝から元気だな」 😼「よっしゃ、今日も全力だ！」',
      '🧙「うむ、良い朝じゃのう」 🤖「気温18度、学習に最適です」 😃「天気も良いですね」',
      '😈「遅刻するな！」 😃「ま、まだ開始10分前ですよ...」',
    ];
    return morning[Math.floor(Math.random() * morning.length)];
  }
  
  if (hour >= 12 && hour < 13) {
    const lunch = [
      '😼「腹減った〜！」 😃「お弁当買ってきましたよ」 😈「昼休みは30分だぞ」',
      '🧙「今日の定食は何かのう」 🤖「カロリー計算が必要です」 😃「みんなで食べましょう」',
      '😈「食後は休むな！」 😃「消化に悪いですよ...」 😼「少しは休もうぜ！」',
    ];
    return lunch[Math.floor(Math.random() * lunch.length)];
  }
  
  if (hour >= 17 && hour < 19) {
    const evening = [
      '😃「今日もお疲れ様でした」 😈「まだ終わってない」 😼「いや、十分頑張ったって！」',
      '🧙「日が暮れてきたのう」 🤖「17時32分、定刻です」 😃「みんな頑張りましたね」',
      '😼「今日の反省会する？」 😃「いいですね」 😈「無駄話はするな」 🧙「それも大切じゃぞ」',
    ];
    return evening[Math.floor(Math.random() * evening.length)];
  }
  
  if (hour >= 22) {
    const lateNight = [
      '😃「もう遅いですね...」 😈「帰れ！明日に備えろ！」 🧙「無理はいかんぞ」',
      '🤖「22時を超過。睡眠時間確保を推奨」 😃「そうですね、帰りましょう」',
      '😼「夜遅くまでお疲れ！」 😃「明日も頑張りましょう」 😈「...早く寝ろ」',
    ];
    return lateNight[Math.floor(Math.random() * lateNight.length)];
  }
  
  return null;
}

// 特定の状況での教師のリアクション集
export function getTeacherReactionToStreak(streak: number): string | null {
  if (streak === 10) {
    return '😼「10連続！！」 😈「よし！」 😃「すごい！」 🤖「統計的に優秀」 🧙「見事じゃ」';
  }
  
  if (streak === 20) {
    return '😈「20連続だと...！？」 😃「信じられません！」 😼「最っ高だ！」 🤖「異常値です（褒め言葉）」 🧙「天才か...」';
  }
  
  if (streak === 50) {
    return '😈😃😼🤖🧙「「「「「50連続！！！！！」」」」」（全員スタンディングオベーション）';
  }
  
  return null;
}

// 特別な日の教師の会話
export function getSpecialDayChat(): string | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = now.getDay();
  
  // 月曜日
  if (day === 1) {
    return '😃「今週も頑張りましょう」 😈「月曜から飛ばせ！」 😼「週の始まりだ！」';
  }
  
  // 金曜日
  if (day === 5) {
    return '😼「金曜だ！あと少し！」 😃「でも気を抜かずに」 😈「最後まで気合だ！」';
  }
  
  // クリスマス
  if (month === 12 && date === 25) {
    return '😃「メリークリスマス！」 😈「浮かれるな」 😼「たまにはいいだろ！」 🧙「ほっほっほ」';
  }
  
  // 元日
  if (month === 1 && date === 1) {
    return '😃😈😼🤖🧙「「「「「あけましておめでとうございます！」」」」」';
  }
  
  return null;
}
