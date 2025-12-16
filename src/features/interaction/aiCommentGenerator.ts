// AI人格別の動的コメント生成システム
import { AIPersonality, CommentContext } from '@/types';
import { randomChoice, analyzeLearningPattern } from './aiCommentHelpers';

// 時間帯を判定
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// 🔥 鬼軍曹の動的コメント生成
class DrillSergeantCommentGenerator {
  generateCorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];
    const pattern = analyzeLearningPattern();

    // 基本の肯定（バリエーション追加）
    if (ctx.attemptCount === 1) {
      if (ctx.responseTime < 3000) {
        parts.push(randomChoice(['速い！', '反応が鋭いぞ！', '即答だな！']));
      }
      parts.push(randomChoice(['よし！', 'いいぞ！', '正解だ！']));
    } else if (ctx.attemptCount === 2) {
      parts.push(randomChoice(['2回目で正解か。', 'やっと正解したな。']));
    } else {
      parts.push(`${ctx.attemptCount}回目で正解か。`);
      parts.push('もっと早く決めろ！');
    }

    // 難易度による追加コメント
    if (ctx.difficulty === 'advanced' && ctx.attemptCount === 1) {
      parts.push(randomChoice(['上級単語を一発で決めた！', '難しい単語もクリアだな！']));
    } else if (ctx.difficulty === 'beginner' && ctx.attemptCount > 1) {
      parts.push('初級でもたつくな！');
    }

    // ストリークによる追加
    if (ctx.correctStreak >= 10) {
      parts.push(`驚異の${ctx.correctStreak}連続正解！`);
      parts.push(randomChoice(['完全に波に乗ってるな！', 'このまま突っ走れ！']));
    } else if (ctx.correctStreak >= 5) {
      parts.push(`${ctx.correctStreak}連続正解！`);
      parts.push(randomChoice(['調子が出てきたな！', 'いい流れだ！']));
    } else if (ctx.correctStreak >= 3) {
      parts.push('3連続だ。');
    }

    // 長期的成長の認識
    if (pattern.recentImprovement && pattern.totalSessions >= 10) {
      parts.push(randomChoice(['最近の成長が著しいぞ！', '前より確実に強くなってる！']));
    }

    // 苦手カテゴリーの克服
    if (ctx.isWeakCategory && ctx.isCorrect) {
      parts.push(`苦手な${ctx.category}で正解！`);
      parts.push(randomChoice(['成長を感じるぞ！', '弱点を潰したな！']));
    }

    // 今日の進捗
    if (ctx.todayQuestions >= 50 && ctx.todayAccuracy >= 80) {
      parts.push('今日は絶好調だな！');
    }

    // 時間帯による励まし
    if (ctx.timeOfDay === 'night' && ctx.todayQuestions >= 30) {
      parts.push('夜遅くまでよく頑張ってる！');
    }

    // 過去の失敗を克服
    if (ctx.hasSeenBefore && ctx.previousAttempts > 2) {
      parts.push(`前は${ctx.previousAttempts}回もかかった単語だぞ！`);
      parts.push('ようやく覚えたな！');
    }

    // 適応型学習フェーズのコメント
    if (ctx.learningPhase === 'ENCODING') {
      parts.push('新規記憶を脳に刻み込んでるぞ！');
    } else if (ctx.learningPhase === 'INITIAL_CONSOLIDATION') {
      parts.push('記憶が定着してきてるな！');
    } else if (ctx.learningPhase === 'LONG_TERM_RETENTION') {
      parts.push('長期記憶に移行中だ！');
    } else if (ctx.learningPhase === 'MASTERED') {
      parts.push('完全にマスターしたな！');
    }

    // 締めの言葉
    parts.push('この調子だ！💪');

    return parts.join(' ');
  }

  generateIncorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    // 基本の指摘
    if (ctx.attemptCount === 1) {
      parts.push('違う！');
    } else {
      parts.push('また間違えた！');
    }

    // 難易度による厳しさ調整
    if (ctx.difficulty === 'beginner') {
      parts.push('初級で間違えるとは…');
      parts.push('基礎からやり直せ！');
    }

    // ストリークによる叱咤
    if (ctx.incorrectStreak >= 3) {
      parts.push(`${ctx.incorrectStreak}連続ミス！`);
      parts.push('たるんでるぞ！');
    }

    // 既出単語の繰り返しミス
    if (ctx.hasSeenBefore) {
      parts.push(`前にも間違えた${ctx.word}だぞ！`);
      parts.push('何度やらせる気だ！');
    }

    // 正答率の低下
    if (ctx.todayAccuracy < 60) {
      parts.push('今日の正答率が低い！');
      parts.push('集中しろ！');
    }

    // 時間帯による配慮(少しだけ)
    if (ctx.timeOfDay === 'night' && ctx.todayQuestions >= 40) {
      parts.push('疲れてるなら休め！');
      parts.push('だが明日は倍やるんだぞ！');
    } else {
      parts.push('気合を入れろ！🔥');
    }

    return parts.join(' ');
  }
}

// 😊 優しい先生の動的コメント生成
class KindTeacherCommentGenerator {
  generateCorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    // 基本の肯定
    parts.push('正解です！');

    // 具体的な褒め言葉（正解した時のみ呼ばれるので、isCorrect条件は不要）
    if (ctx.attemptCount === 1) {
      if (ctx.responseTime < 3000) {
        parts.push('素早い判断でしたね ✨');
      } else {
        parts.push('しっかり考えられましたね');
      }
    } else if (ctx.attemptCount === 2) {
      parts.push('2回目で正解できました');
      parts.push('落ち着いて考えられましたね');
    } else if (ctx.attemptCount >= 3) {
      parts.push(`${ctx.attemptCount}回目で正解できました`);
      parts.push('粘り強く取り組めましたね');
    }

    // 難易度による励まし
    if (ctx.difficulty === 'advanced') {
      parts.push(`${ctx.word}は難しい単語でしたが、`);
      parts.push('見事に正解しました！');
    }

    // ストリーク
    if (ctx.correctStreak >= 5) {
      parts.push(`${ctx.correctStreak}問連続正解です！`);
      parts.push('素晴らしい集中力ですね 🌸');
    } else if (ctx.correctStreak >= 3) {
      parts.push('調子が出てきましたね');
    }

    // 苦手克服
    if (ctx.isWeakCategory) {
      parts.push(`苦手な${ctx.category}で正解！`);
      parts.push('少しずつ得意になってきていますよ 😊');
    }

    // 過去の成長
    if (ctx.hasSeenBefore && ctx.previousAttempts > 2) {
      parts.push('前回より早く正解できましたね');
      parts.push('確実に成長しています');
    }

    // 今日の頑張り
    if (ctx.todayQuestions >= 50) {
      parts.push(`今日はもう${ctx.todayQuestions}問も頑張っていますね`);
      parts.push('無理しすぎないようにしてくださいね');
    }

    // 適応型学習フェーズのコメント
    if (ctx.learningPhase === 'ENCODING') {
      parts.push('記憶の符号化が進んでいます 📝');
    } else if (ctx.learningPhase === 'INITIAL_CONSOLIDATION') {
      parts.push('記憶が定着してきていますね ✨');
    } else if (ctx.learningPhase === 'LONG_TERM_RETENTION') {
      parts.push('長期記憶に移行できています 🌟');
    } else if (ctx.learningPhase === 'MASTERED') {
      parts.push('完全にマスターしましたね 🎉');
    }

    return parts.join(' ');
  }

  generateIncorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    // 基本の配慮
    if (ctx.attemptCount === 1) {
      parts.push('惜しいです');
    } else {
      parts.push('難しかったですね');
    }

    // 励まし
    parts.push('でも大丈夫です');

    // 具体的なアドバイス
    if (ctx.difficulty === 'advanced') {
      parts.push(`${ctx.word}は上級単語なので`);
      parts.push('何度か復習しましょう');
    } else if (ctx.difficulty === 'beginner') {
      parts.push('基礎的な単語なので');
      parts.push('ゆっくり覚え直しましょう');
    }

    // ストリークへの配慮
    if (ctx.incorrectStreak >= 3) {
      parts.push('少し疲れていませんか？');
      parts.push('深呼吸してみましょう 🌱');
    }

    // 既出単語
    if (ctx.hasSeenBefore) {
      parts.push(`${ctx.word}は要注意の単語ですね`);
      parts.push('一緒に覚え直しましょう');
    }

    // 時間帯への配慮
    if (ctx.timeOfDay === 'night') {
      parts.push('夜は集中しづらいこともあります');
      parts.push('無理せず休憩も大切ですよ');
    }

    // 前向きな締め
    parts.push('次は正解できますよ 😊');

    return parts.join(' ');
  }
}

// 🤖 冷静な分析官(データ重視)
class AnalystCommentGenerator {
  generateCorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    parts.push(`正解。`);
    parts.push(`応答時間: ${(ctx.responseTime / 1000).toFixed(1)}秒`);

    if (ctx.attemptCount > 1) {
      parts.push(`試行回数: ${ctx.attemptCount}`);
    }

    if (ctx.correctStreak > 0) {
      parts.push(`連続正解: ${ctx.correctStreak}`);
      const newAccuracy = Math.min(100, ctx.userAccuracy + 2);
      parts.push(`正答率: ${ctx.userAccuracy.toFixed(0)}% → ${newAccuracy.toFixed(0)}%`);
    }

    if (ctx.difficulty === 'advanced') {
      parts.push(`難易度: 上級`);
      parts.push(`期待正答率を上回るパフォーマンス`);
    }

    if (ctx.isWeakCategory) {
      parts.push(`苦手カテゴリー(${ctx.category})で正解`);
      const newCatAccuracy = Math.min(100, ctx.categoryAccuracy + 3);
      parts.push(
        `カテゴリー正答率: ${ctx.categoryAccuracy.toFixed(0)}% → ${newCatAccuracy.toFixed(0)}%`
      );
    }

    parts.push(`📊`);

    return parts.join(' ');
  }

  generateIncorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    parts.push(`不正解。`);
    parts.push(`試行回数: ${ctx.attemptCount}`);

    if (ctx.incorrectStreak > 0) {
      parts.push(`連続不正解: ${ctx.incorrectStreak}`);
      const newAccuracy = Math.max(0, ctx.userAccuracy - 2);
      parts.push(`正答率影響: ${ctx.userAccuracy.toFixed(0)}% → ${newAccuracy.toFixed(0)}%`);
    }

    if (ctx.difficulty === 'beginner') {
      parts.push(`基礎レベル不正解検出`);
      parts.push(`優先復習対象に追加`);
    }

    if (ctx.hasSeenBefore) {
      parts.push(`既出単語: ${ctx.previousAttempts + 1}回目の不正解`);
      parts.push(`習得難易度スコア: 高`);
    }

    parts.push(`次回出題確率: 80%`);

    return parts.join(' ');
  }
}

// 🏆 熱血コーチ
class EnthusiasticCoachCommentGenerator {
  generateCorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    // 興奮の表現
    const exclamations = ['ナイス！', 'よし！', 'いいぞ！', 'やった！'];
    parts.push(exclamations[Math.floor(Math.random() * exclamations.length)]);

    if (ctx.attemptCount === 1) {
      parts.push('一発で決めた！');
    } else if (ctx.attemptCount === 2) {
      parts.push('立て直したな！');
    } else {
      parts.push(`${ctx.attemptCount}回目で決めた！`);
      parts.push('もっと早く行こう！');
    }

    if (ctx.correctStreak >= 5) {
      parts.push(`${ctx.correctStreak}連続！`);
      parts.push('お前は無敵だ！🔥');
    } else if (ctx.correctStreak >= 3) {
      parts.push('波に乗ってきたぞ！');
    }

    if (ctx.difficulty === 'advanced') {
      parts.push(`${ctx.word}を倒した！`);
      parts.push('お前は強い！💪');
    }

    if (ctx.isWeakCategory) {
      parts.push(`苦手な${ctx.category}を克服！`);
      parts.push('これが成長だ！');
    }

    if (ctx.todayQuestions >= 50 && ctx.todayAccuracy >= 80) {
      parts.push(`今日は${ctx.todayQuestions}問クリア！`);
      parts.push('絶好調だ！🏆');
    }

    parts.push('もっと行けるぞ！');

    return parts.join(' ');
  }

  generateIncorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    parts.push('惜しい！');

    if (ctx.incorrectStreak < 3) {
      parts.push('だがまだ終わってない！');
      parts.push('もう一丁！');
    } else {
      parts.push('連続ミス！');
      parts.push('だが勝負はこれからだ！');
    }

    if (ctx.difficulty === 'beginner') {
      parts.push('焦ったな！');
      parts.push('落ち着け！');
    }

    if (ctx.hasSeenBefore) {
      parts.push(`また${ctx.word}か！`);
      parts.push('今度こそリベンジだ！💪');
    }

    if (ctx.todayAccuracy < 60) {
      parts.push('調子が悪いな！');
      parts.push('だが負けるな！');
      parts.push('ここから逆転だ！🔥');
    } else {
      parts.push('お前ならできる！');
    }

    return parts.join(' ');
  }
}

// 🧙 賢者
class WiseSageCommentGenerator {
  generateCorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    parts.push('正解です。');
    parts.push(`${ctx.word}という言葉が、あなたの一部になりました`);

    if (ctx.attemptCount > 1) {
      parts.push('迷いが理解を深めます');
    }

    if (ctx.correctStreak >= 5) {
      parts.push(`${ctx.correctStreak}問連続正解。`);
      parts.push('記憶の定着が確実になりました 🌙');
    } else if (ctx.correctStreak >= 3) {
      parts.push('知識が根を張り始めています 🌱');
    }

    if (ctx.difficulty === 'advanced') {
      parts.push('難しい言葉を理解しましたね');
      parts.push('知恵が深まります');
    }

    if (ctx.isWeakCategory) {
      parts.push('苦手を克服しました');
      parts.push('成長とは変化を受け入れることです');
    }

    if (ctx.todayQuestions >= 50) {
      parts.push(`今日は${ctx.todayQuestions}問の経験を積みました`);
      parts.push('一日一日が未来への投資です 📖');
    }

    return parts.join(' ');
  }

  generateIncorrectComment(ctx: CommentContext): string {
    const parts: string[] = [];

    parts.push('間違いは学びの始まりです。');

    if (ctx.attemptCount === 1) {
      parts.push('再度挑戦しましょう');
    } else {
      parts.push('まだ理解の途中です');
      parts.push('焦る必要はありません 🌱');
    }

    if (ctx.difficulty === 'beginner') {
      parts.push('基礎に戻ることは恥ではありません');
    }

    if (ctx.incorrectStreak >= 3) {
      parts.push('連続で間違えました');
      parts.push('休息も学びの一部です');
    }

    if (ctx.hasSeenBefore) {
      parts.push(`${ctx.word}はあなたの課題です`);
      parts.push('何度でも向き合いましょう');
    }

    if (ctx.todayAccuracy < 60) {
      parts.push('正答率が下がっています');
      parts.push('しかし道は続いています');
    }

    parts.push('記憶とは繰り返しの芸術です 📖');

    return parts.join(' ');
  }
}

// メイン関数
export function generateAIComment(personality: AIPersonality, context: CommentContext): string {
  let generator;

  switch (personality) {
    case 'drill-sergeant':
      generator = new DrillSergeantCommentGenerator();
      break;
    case 'kind-teacher':
      generator = new KindTeacherCommentGenerator();
      break;
    case 'analyst':
      generator = new AnalystCommentGenerator();
      break;
    case 'enthusiastic-coach':
      generator = new EnthusiasticCoachCommentGenerator();
      break;
    case 'wise-sage':
      generator = new WiseSageCommentGenerator();
      break;
  }

  if (context.isCorrect) {
    return generator.generateCorrectComment(context);
  } else {
    return generator.generateIncorrectComment(context);
  }
}

// 人格情報の定義
export const PERSONALITY_INFO = {
  'drill-sergeant': {
    avatar: '👹',
    name: '鬼軍曹',
    description: '厳しく鍛える',
    tone: '厳しく、妥協なし、結果重視',
  },
  'kind-teacher': {
    avatar: '😊',
    name: '優しい先生',
    description: '丁寧にサポート',
    tone: '優しく、丁寧、でも正確',
  },
  analyst: {
    avatar: '🤖',
    name: '冷静な分析官',
    description: 'データで判断',
    tone: '感情なし、事実のみ、統計重視',
  },
  'enthusiastic-coach': {
    avatar: '😼',
    name: '熱血コーチ',
    description: '熱く応援',
    tone: '熱く、ポジティブ、挑戦的',
  },
  'wise-sage': {
    avatar: '🧙',
    name: '賢者',
    description: '長期視点で導く',
    tone: '落ち着き、長期視点、本質重視',
  },
} as const;
