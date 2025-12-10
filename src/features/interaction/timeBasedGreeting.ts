// 時間帯別のAI挨拶・励ましメッセージシステム
import { AIPersonality } from '@/types';
import { getTimeOfDay } from './aiCommentGenerator';

export interface GreetingContext {
  lastLoginDate: string | null;
  daysSinceLastLogin: number;
  consecutiveDays: number;
  todayStudyCount: number;
  todayAccuracy: number;
}

// 最終ログイン日時を保存・取得
export function getLastLoginDate(): string | null {
  return localStorage.getItem('lastLoginDate');
}

export function updateLastLoginDate(): void {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  localStorage.setItem('lastLoginDate', now);
}

// 連続ログイン日数を計算
export function getConsecutiveDays(): number {
  const streak = localStorage.getItem('loginStreak');
  return streak ? parseInt(streak, 10) : 0;
}

export function updateConsecutiveDays(): void {
  const today = new Date().toISOString().split('T')[0];
  const lastLogin = getLastLoginDate();
  
  if (!lastLogin) {
    localStorage.setItem('loginStreak', '1');
    updateLastLoginDate();
    return;
  }
  
  const lastDate = new Date(lastLogin);
  const todayDate = new Date(today);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // 同じ日
    return;
  } else if (diffDays === 1) {
    // 連続
    const currentStreak = getConsecutiveDays();
    localStorage.setItem('loginStreak', String(currentStreak + 1));
  } else {
    // 途切れた
    localStorage.setItem('loginStreak', '1');
  }
  
  updateLastLoginDate();
}

// 日数差を計算
export function getDaysSinceLastLogin(): number {
  const lastLogin = getLastLoginDate();
  if (!lastLogin) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const lastDate = new Date(lastLogin);
  const todayDate = new Date(today);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// 今日の学習状況を取得
export function getTodayStudyStats(): { count: number; accuracy: number } {
  const today = new Date().toISOString().split('T')[0];
  const stats = localStorage.getItem(`studyStats-${today}`);
  
  if (!stats) {
    return { count: 0, accuracy: 0 };
  }
  
  const parsed = JSON.parse(stats);
  return {
    count: parsed.count || 0,
    accuracy: parsed.correct && parsed.count ? (parsed.correct / parsed.count) * 100 : 0
  };
}

// 時間帯別の挨拶メッセージを生成
export function generateTimeBasedGreeting(personality: AIPersonality): string | null {
  const timeOfDay = getTimeOfDay();
  const daysSince = getDaysSinceLastLogin();
  const consecutive = getConsecutiveDays();
  const { count, accuracy } = getTodayStudyStats();
  
  const context: GreetingContext = {
    lastLoginDate: getLastLoginDate(),
    daysSinceLastLogin: daysSince,
    consecutiveDays: consecutive,
    todayStudyCount: count,
    todayAccuracy: accuracy
  };
  
  // 数日ぶりのログイン（優先）
  if (daysSince >= 3) {
    return generateReturningGreeting(personality, daysSince);
  }
  
  // 連続ログイン祝福
  if (consecutive >= 7 && count === 0) {
    return generateStreakGreeting(personality, consecutive);
  }
  
  // 時間帯別の挨拶
  return generateTimeGreeting(personality, timeOfDay, context);
}

// 久しぶりのログイン時の挨拶
function generateReturningGreeting(personality: AIPersonality, days: number): string {
  switch (personality) {
    case 'drill-sergeant':
      if (days >= 7) {
        return `😈 ${days}日も空けるとは何事だ！今すぐ復習を開始しろ！`;
      }
      return `😈 ${days}日ぶりか。遅れを取り戻すぞ！`;
      
    case 'kind-teacher':
      if (days >= 7) {
        return `😃 お久しぶりです！${days}日経っていますが、焦らず少しずつ思い出していきましょう。`;
      }
      return `😃 ${days}日ぶりですね。ゆっくり復習していきましょう。`;
      
    case 'analyst':
      if (days >= 7) {
        return `🤖 前回から${days}日経過。記憶定着率は推定40-60%。体系的な復習を推奨します。`;
      }
      return `🤖 ${days}日の間隔。忘却曲線を考慮した復習が必要です。`;
      
    case 'enthusiastic-coach':
      if (days >= 7) {
        return `😼 ${days}日ぶりのカムバック！今日から再スタートだ！全力で行くぞ！`;
      }
      return `😼 待ってたぜ！${days}日の遅れは今日取り戻そう！`;
      
    case 'wise-sage':
      if (days >= 7) {
        return `🧙 ${days}日の休息も学びの一部じゃ。焦らず、着実に進めば良い。`;
      }
      return `🧙 ${days}日の空白も、リフレッシュの時間だったのじゃろう。さあ、ゆっくり再開じゃ。`;
      
    default:
      return `お帰りなさい！${days}日ぶりですね。`;
  }
}

// 連続ログイン祝福
function generateStreakGreeting(personality: AIPersonality, streak: number): string {
  switch (personality) {
    case 'drill-sergeant':
      return `😈 ${streak}日連続！素晴らしい継続力だ！今日も油断するな！`;
      
    case 'kind-teacher':
      return `😃 ${streak}日連続ログイン、素晴らしいですね！継続は力なりです。`;
      
    case 'analyst':
      return `🤖 ${streak}日連続。継続率100%。統計的に学習効果は最大化されています。`;
      
    case 'enthusiastic-coach':
      return `😼 ${streak}日連続達成！この勢いで突き進め！記録更新だ！`;
      
    case 'wise-sage':
      return `🧙 ${streak}日の継続、見事じゃ。千里の道も一歩から、じゃな。`;
      
    default:
      return '';
  }
}

// 時間帯別の挨拶
function generateTimeGreeting(
  personality: AIPersonality,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  context: GreetingContext
): string | null {
  const { todayStudyCount, todayAccuracy } = context;
  
  switch (personality) {
    case 'drill-sergeant':
      return getDrillSergeantTimeGreeting(timeOfDay, todayStudyCount, todayAccuracy);
      
    case 'kind-teacher':
      return getKindTeacherTimeGreeting(timeOfDay, todayStudyCount, todayAccuracy);
      
    case 'analyst':
      return getAnalystTimeGreeting(timeOfDay, todayStudyCount, todayAccuracy);
      
    case 'enthusiastic-coach':
      return getEnthusiasticCoachTimeGreeting(timeOfDay, todayStudyCount, todayAccuracy);
      
    case 'wise-sage':
      return getWiseSageTimeGreeting(timeOfDay, todayStudyCount, todayAccuracy);
      
    default:
      return null;
  }
}

// 鬼軍曹の時間帯別メッセージ
function getDrillSergeantTimeGreeting(timeOfDay: string, count: number, _accuracy: number): string {
  switch (timeOfDay) {
    case 'morning':
      if (count === 0) {
        return '😈 朝だぞ！脳が一番冴えてる時間だ！今すぐ学習を開始しろ！';
      }
      if (count >= 20) {
        return '😈 朝から素晴らしいペースだ！この調子を維持しろ！';
      }
      return '😈 朝の学習は効果的だ！もっとやれるはずだ！';
      
    case 'afternoon':
      if (count === 0) {
        return '😈 午後になったぞ！今日はまだ何もやってないのか？さっさと始めろ！';
      }
      if (count >= 20) {
        return '😈 午後も順調だな！午前中の勢いを落とすな！';
      }
      return '😈 午後は集中力が落ちやすい。気合を入れ直せ！';
      
    case 'evening':
      if (count === 0) {
        return '😈 もう夕方だぞ！今日の分は今日中に終わらせろ！';
      }
      if (count >= 30) {
        return '😈 今日はよく頑張った！あと少しで完璧だ！';
      }
      return '😈 夕方は復習のゴールデンタイムだ！追い込みをかけろ！';
      
    case 'night':
      if (count === 0) {
        return '😈 夜になってしまったぞ！少しでもいいから学習しろ！0より1だ！';
      }
      if (count >= 30) {
        return '😈 夜遅くまでよく頑張った！早く休んで明日に備えろ！';
      }
      return '😈 夜は軽めの復習が効果的だ！無理はするな！';
      
    default:
      return '😈 さあ、学習を開始するぞ！';
  }
}

// 優しい先生の時間帯別メッセージ
function getKindTeacherTimeGreeting(timeOfDay: string, count: number, _accuracy: number): string {
  switch (timeOfDay) {
    case 'morning':
      if (count === 0) {
        return '😃 おはようございます！朝は記憶力が高まる時間ですよ。一緒に頑張りましょう！';
      }
      if (count >= 20) {
        return '😃 朝から素晴らしいですね！でも無理はしないでくださいね。';
      }
      return '😃 朝の学習、順調ですね！この調子で進めましょう。';
      
    case 'afternoon':
      if (count === 0) {
        return '😃 こんにちは！午後は少し眠くなりやすいので、軽めの復習がおすすめですよ。';
      }
      if (count >= 20) {
        return '😃 午後もよく頑張っていますね！休憩も忘れずに取ってくださいね。';
      }
      return '😃 午後も順調ですね。マイペースで大丈夫ですよ。';
      
    case 'evening':
      if (count === 0) {
        return '😃 こんばんは。夕方は復習に最適な時間です。今日学んだことを軽く見直してみませんか？';
      }
      if (count >= 30) {
        return '😃 今日は本当によく頑張りましたね！もう十分ですよ。';
      }
      return '😃 夕方の復習、良いですね！焦らずゆっくり進めましょう。';
      
    case 'night':
      if (count === 0) {
        return '😃 夜遅くまでお疲れ様です。無理せず、できる範囲で大丈夫ですよ。';
      }
      if (count >= 30) {
        return '😃 今日は十分頑張りました！そろそろ休んで、明日に備えましょうね。';
      }
      return '😃 夜の学習も大切ですが、睡眠も同じくらい大切ですよ。';
      
    default:
      return '😃 一緒に頑張りましょうね！';
  }
}

// 冷静な分析官の時間帯別メッセージ
function getAnalystTimeGreeting(timeOfDay: string, count: number, accuracy: number): string {
  switch (timeOfDay) {
    case 'morning':
      if (count === 0) {
        return '🤖 現在時刻：朝。脳のパフォーマンス：最適。新規学習効率：+30%。学習開始を推奨。';
      }
      if (count >= 20) {
        return `🤖 朝の学習${count}問完了。正答率${accuracy.toFixed(1)}%。良好なペース。`;
      }
      return '🤖 朝の学習進行中。認知機能が高い時間帯を活用してください。';
      
    case 'afternoon':
      if (count === 0) {
        return '🤖 午後の時間帯。集中力：やや低下傾向。短時間集中型の学習を推奨。';
      }
      if (count >= 20) {
        return `🤖 本日${count}問学習済み。午後の生産性：維持されています。`;
      }
      return '🤖 午後の学習継続中。15分×3セットの分割学習が効果的です。';
      
    case 'evening':
      if (count === 0) {
        return '🤖 夕方の時間帯。復習効率：最高レベル。今日の学習内容の定着に最適。';
      }
      if (count >= 30) {
        return `🤖 本日${count}問達成。十分な学習量です。休息を推奨。`;
      }
      return '🤖 夕方の復習タイム。朝の学習内容の再確認が記憶定着率を向上させます。';
      
    case 'night':
      if (count === 0) {
        return '🤖 夜間。新規学習より復習を推奨。睡眠前の軽い復習は記憶の固定化に有効。';
      }
      if (count >= 30) {
        return `🤖 本日${count}問完了。学習目標達成。22-23時の就寝で記憶定着率が向上します。`;
      }
      return '🤖 夜間学習中。過度な学習は睡眠の質を低下させます。適度な学習を推奨。';
      
    default:
      return '🤖 学習データを記録中。継続的な学習が最も効率的です。';
  }
}

// 熱血コーチの時間帯別メッセージ
function getEnthusiasticCoachTimeGreeting(timeOfDay: string, count: number, _accuracy: number): string {
  switch (timeOfDay) {
    case 'morning':
      if (count === 0) {
        return '😼 朝だ！新しい一日の始まりだ！今日も最高の学習をしよう！';
      }
      if (count >= 20) {
        return '😼 朝から絶好調だな！この勢いで今日も完璧にやり遂げよう！';
      }
      return '😼 朝の学習、最高だ！もっともっと行けるぞ！';
      
    case 'afternoon':
      if (count === 0) {
        return '😼 午後も元気出していこう！今からでも遅くないぞ！全力で行け！';
      }
      if (count >= 20) {
        return '😼 午後も素晴らしいペースだ！お前なら絶対できる！';
      }
      return '😼 午後の学習も気合十分だな！この調子この調子！';
      
    case 'evening':
      if (count === 0) {
        return '😼 夕方だぞ！今日の目標はまだ達成してないだろ？さあ、やろう！';
      }
      if (count >= 30) {
        return '😼 今日は完璧だ！お前の努力は必ず報われる！誇りに思え！';
      }
      return '😼 夕方の追い込み、良いぞ！ラストスパートだ！';
      
    case 'night':
      if (count === 0) {
        return '😼 夜だけど諦めるな！たった10分でもいい、今日の分をやろう！';
      }
      if (count >= 30) {
        return '😼 夜遅くまでお疲れ様！今日のお前は最高だった！ゆっくり休め！';
      }
      return '😼 夜の学習も頑張ってるな！無理はするなよ、でも頑張れ！';
      
    default:
      return '😼 さあ、今日も全力で行くぞ！お前なら絶対できる！';
  }
}

// 賢者の時間帯別メッセージ
function getWiseSageTimeGreeting(timeOfDay: string, count: number, _accuracy: number): string {
  switch (timeOfDay) {
    case 'morning':
      if (count === 0) {
        return '🧙 朝の静けさは学びに最適じゃ。心を落ち着けて、ゆっくり始めるがよい。';
      }
      if (count >= 20) {
        return '🧙 朝から良いペースじゃのう。焦らず、着実に進めば良い。';
      }
      return '🧙 朝の学習、順調じゃな。無理せず、自分のペースで進むのじゃ。';
      
    case 'afternoon':
      if (count === 0) {
        return '🧙 午後は少し休んでから始めるのも良いぞ。焦る必要はない。';
      }
      if (count >= 20) {
        return '🧙 午後も着実に進んでおるのう。継続こそが力じゃ。';
      }
      return '🧙 午後の学習も大切じゃが、休息も忘れぬようにな。';
      
    case 'evening':
      if (count === 0) {
        return '🧙 夕暮れ時は一日を振り返る時間じゃ。学びも同じく、復習が大切じゃぞ。';
      }
      if (count >= 30) {
        return '🧙 今日はよく励んだのう。学びは量より質じゃ。十分じゃろう。';
      }
      return '🧙 夕方の復習、良い習慣じゃ。急がず、確実に進めば良い。';
      
    case 'night':
      if (count === 0) {
        return '🧙 夜は心穏やかに過ごすが良い。軽い復習だけでも十分じゃ。';
      }
      if (count >= 30) {
        return '🧙 今日の学びは十分じゃ。良き睡眠が明日への力となる。ゆっくり休むがよい。';
      }
      return '🧙 夜更かしはほどほどにな。睡眠も学びの一部じゃぞ。';
      
    default:
      return '🧙 学びとは長い旅じゃ。一歩ずつ、着実に進めば良い。';
  }
}
