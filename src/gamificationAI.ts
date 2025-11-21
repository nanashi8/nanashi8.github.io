/**
 * ゲーミフィケーションAI - 学習のモチベーション向上システム
 * 
 * 機能:
 * 1. バッジ・実績システム: 条件達成時の報酬
 * 2. レベル・経験値システム: 学習進捗の可視化
 * 3. 連続学習ストリーク: 毎日学習の習慣化促進
 * 4. マイルストーン: 適応的な目標設定
 * 5. チャレンジ: 週間/月間の特別目標
 * 6. リアルタイムフィードバック: 励まし・称賛メッセージ
 */

// ============================================================================
// 型定義
// ============================================================================

/**
 * バッジの種類
 */
export enum BadgeType {
  // 学習量系
  FIRST_SESSION = 'first_session',              // 初めての学習
  STREAK_3_DAYS = 'streak_3_days',             // 3日連続学習
  STREAK_7_DAYS = 'streak_7_days',             // 1週間連続学習
  STREAK_30_DAYS = 'streak_30_days',           // 1ヶ月連続学習
  TOTAL_100_WORDS = 'total_100_words',         // 累計100単語学習
  TOTAL_500_WORDS = 'total_500_words',         // 累計500単語学習
  TOTAL_1000_WORDS = 'total_1000_words',       // 累計1000単語学習
  
  // 精度系
  PERFECT_SESSION = 'perfect_session',         // 全問正解
  ACCURACY_90 = 'accuracy_90',                 // 正答率90%以上を10回
  ACCURACY_95 = 'accuracy_95',                 // 正答率95%以上を10回
  
  // 時間系
  EARLY_BIRD = 'early_bird',                   // 朝学習5回
  NIGHT_OWL = 'night_owl',                     // 夜学習5回
  SPEED_MASTER = 'speed_master',               // 平均応答時間2秒以下
  
  // 復習系
  REVIEW_CHAMPION = 'review_champion',         // 要復習単語50個クリア
  MASTER_100 = 'master_100',                   // 100単語マスター
  
  // 特殊系
  COMEBACK = 'comeback',                       // 1週間以上の中断後に再開
  MARATHON = 'marathon',                       // 1時間以上の学習セッション
  FOCUSED = 'focused',                         // 集中力高い学習10回
}

/**
 * バッジ情報
 */
export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

/**
 * ユーザーレベル情報
 */
export interface UserLevel {
  level: number;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
}

/**
 * 連続学習ストリーク
 */
export interface Streak {
  current: number;
  longest: number;
  lastStudyDate: string; // YYYY-MM-DD
}

/**
 * マイルストーン
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: {
    xp: number;
    badge?: BadgeType;
  };
  completed: boolean;
  completedAt?: Date;
}

/**
 * チャレンジ
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  target: number;
  progress: number;
  reward: {
    xp: number;
    badge?: BadgeType;
  };
  completed: boolean;
}

/**
 * ゲーミフィケーション統計
 */
export interface GamificationStats {
  level: UserLevel;
  badges: Badge[];
  streak: Streak;
  milestones: Milestone[];
  challenges: Challenge[];
  totalSessions: number;
  totalWordsLearned: number;
  totalCorrectAnswers: number;
  averageAccuracy: number;
  lastSessionDate?: Date;
}

/**
 * リアルタイムフィードバック
 */
export interface Feedback {
  type: 'encouragement' | 'praise' | 'milestone' | 'streak' | 'level_up';
  message: string;
  icon: string;
  priority: number; // 1-5 (5が最優先)
}

// ============================================================================
// 定数定義
// ============================================================================

/**
 * バッジ定義
 */
export const BADGE_DEFINITIONS: Record<BadgeType, Omit<Badge, 'earnedAt'>> = {
  [BadgeType.FIRST_SESSION]: {
    type: BadgeType.FIRST_SESSION,
    name: '学習開始',
    description: '初めての学習セッションを完了',
    icon: '🎓',
    rarity: 'common',
  },
  [BadgeType.STREAK_3_DAYS]: {
    type: BadgeType.STREAK_3_DAYS,
    name: '三日坊主克服',
    description: '3日連続で学習',
    icon: '🔥',
    rarity: 'common',
  },
  [BadgeType.STREAK_7_DAYS]: {
    type: BadgeType.STREAK_7_DAYS,
    name: '一週間の習慣',
    description: '7日連続で学習',
    icon: '⭐',
    rarity: 'rare',
  },
  [BadgeType.STREAK_30_DAYS]: {
    type: BadgeType.STREAK_30_DAYS,
    name: '習慣の達人',
    description: '30日連続で学習',
    icon: '🏆',
    rarity: 'epic',
  },
  [BadgeType.TOTAL_100_WORDS]: {
    type: BadgeType.TOTAL_100_WORDS,
    name: '百単語',
    description: '累計100単語を学習',
    icon: '📚',
    rarity: 'common',
  },
  [BadgeType.TOTAL_500_WORDS]: {
    type: BadgeType.TOTAL_500_WORDS,
    name: '五百単語',
    description: '累計500単語を学習',
    icon: '📖',
    rarity: 'rare',
  },
  [BadgeType.TOTAL_1000_WORDS]: {
    type: BadgeType.TOTAL_1000_WORDS,
    name: '千単語マスター',
    description: '累計1000単語を学習',
    icon: '🎖️',
    rarity: 'epic',
  },
  [BadgeType.PERFECT_SESSION]: {
    type: BadgeType.PERFECT_SESSION,
    name: 'パーフェクト',
    description: '1セッション全問正解',
    icon: '💯',
    rarity: 'rare',
  },
  [BadgeType.ACCURACY_90]: {
    type: BadgeType.ACCURACY_90,
    name: '高精度',
    description: '正答率90%以上を10回達成',
    icon: '🎯',
    rarity: 'rare',
  },
  [BadgeType.ACCURACY_95]: {
    type: BadgeType.ACCURACY_95,
    name: '超高精度',
    description: '正答率95%以上を10回達成',
    icon: '💎',
    rarity: 'epic',
  },
  [BadgeType.EARLY_BIRD]: {
    type: BadgeType.EARLY_BIRD,
    name: '早起き鳥',
    description: '朝（6-9時）に5回学習',
    icon: '🌅',
    rarity: 'common',
  },
  [BadgeType.NIGHT_OWL]: {
    type: BadgeType.NIGHT_OWL,
    name: '夜型学習',
    description: '夜（21-24時）に5回学習',
    icon: '🌙',
    rarity: 'common',
  },
  [BadgeType.SPEED_MASTER]: {
    type: BadgeType.SPEED_MASTER,
    name: 'スピードマスター',
    description: '平均応答時間2秒以下を10回達成',
    icon: '⚡',
    rarity: 'rare',
  },
  [BadgeType.REVIEW_CHAMPION]: {
    type: BadgeType.REVIEW_CHAMPION,
    name: '復習チャンピオン',
    description: '要復習単語50個をマスター',
    icon: '♻️',
    rarity: 'rare',
  },
  [BadgeType.MASTER_100]: {
    type: BadgeType.MASTER_100,
    name: '百単語マスター',
    description: '100単語を完全習得',
    icon: '👑',
    rarity: 'epic',
  },
  [BadgeType.COMEBACK]: {
    type: BadgeType.COMEBACK,
    name: 'カムバック',
    description: '1週間以上の中断後に再開',
    icon: '💪',
    rarity: 'common',
  },
  [BadgeType.MARATHON]: {
    type: BadgeType.MARATHON,
    name: 'マラソンランナー',
    description: '1時間以上の学習セッション',
    icon: '🏃',
    rarity: 'rare',
  },
  [BadgeType.FOCUSED]: {
    type: BadgeType.FOCUSED,
    name: '集中力の極み',
    description: '集中力の高い学習を10回',
    icon: '🧘',
    rarity: 'rare',
  },
};

/**
 * レベルアップに必要な経験値（指数関数的に増加）
 */
export const XP_PER_LEVEL = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

/**
 * 行動ごとの経験値
 */
export const XP_REWARDS = {
  CORRECT_ANSWER: 10,           // 正解
  PERFECT_SESSION: 100,         // 全問正解
  FIRST_TRY_CORRECT: 15,        // 初見正解
  REVIEW_CORRECT: 20,           // 復習で正解
  STREAK_BONUS_PER_DAY: 5,      // 連続学習ボーナス（1日あたり）
  SESSION_COMPLETION: 50,       // セッション完了
  BADGE_EARNED: 200,            // バッジ獲得
  CHALLENGE_COMPLETED: 500,     // チャレンジ完了
};

// ============================================================================
// コアロジック
// ============================================================================

/**
 * LocalStorageからゲーミフィケーション統計を読み込む
 */
export const loadGamificationStats = (): GamificationStats => {
  const stored = localStorage.getItem('gamificationStats');
  if (stored) {
    const parsed = JSON.parse(stored);
    // Dateオブジェクトを復元
    if (parsed.lastSessionDate) {
      parsed.lastSessionDate = new Date(parsed.lastSessionDate);
    }
    parsed.badges = parsed.badges.map((b: Badge) => ({
      ...b,
      earnedAt: b.earnedAt ? new Date(b.earnedAt) : undefined,
    }));
    parsed.milestones = parsed.milestones.map((m: Milestone) => ({
      ...m,
      completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
    }));
    parsed.challenges = parsed.challenges.map((c: Challenge) => ({
      ...c,
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
    }));
    return parsed;
  }

  // 初期状態
  return {
    level: {
      level: 1,
      currentXP: 0,
      requiredXP: XP_PER_LEVEL(1),
      totalXP: 0,
    },
    badges: [],
    streak: {
      current: 0,
      longest: 0,
      lastStudyDate: '',
    },
    milestones: generateInitialMilestones(),
    challenges: [],
    totalSessions: 0,
    totalWordsLearned: 0,
    totalCorrectAnswers: 0,
    averageAccuracy: 0,
  };
};

/**
 * LocalStorageに保存
 */
export const saveGamificationStats = (stats: GamificationStats): void => {
  localStorage.setItem('gamificationStats', JSON.stringify(stats));
};

/**
 * 初期マイルストーン生成
 */
const generateInitialMilestones = (): Milestone[] => {
  return [
    {
      id: 'first_10_words',
      title: '最初の10単語',
      description: '10単語を学習する',
      target: 10,
      current: 0,
      reward: { xp: 100 },
      completed: false,
    },
    {
      id: 'first_50_words',
      title: '50単語達成',
      description: '50単語を学習する',
      target: 50,
      current: 0,
      reward: { xp: 300, badge: BadgeType.TOTAL_100_WORDS },
      completed: false,
    },
    {
      id: 'accuracy_80',
      title: '正答率80%',
      description: '正答率80%以上を達成',
      target: 80,
      current: 0,
      reward: { xp: 200 },
      completed: false,
    },
  ];
};

/**
 * 経験値を追加してレベルアップチェック
 */
export const addExperience = (
  stats: GamificationStats,
  xp: number
): { stats: GamificationStats; leveledUp: boolean; newLevel?: number } => {
  const newStats = { ...stats };
  newStats.level.currentXP += xp;
  newStats.level.totalXP += xp;

  let leveledUp = false;
  let newLevel: number | undefined;

  // レベルアップチェック
  while (newStats.level.currentXP >= newStats.level.requiredXP) {
    newStats.level.currentXP -= newStats.level.requiredXP;
    newStats.level.level += 1;
    newStats.level.requiredXP = XP_PER_LEVEL(newStats.level.level);
    leveledUp = true;
    newLevel = newStats.level.level;
  }

  return { stats: newStats, leveledUp, newLevel };
};

/**
 * ストリーク更新
 */
export const updateStreak = (stats: GamificationStats): GamificationStats => {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = stats.streak.lastStudyDate;

  if (!lastDate) {
    // 初めての学習
    return {
      ...stats,
      streak: {
        current: 1,
        longest: 1,
        lastStudyDate: today,
      },
    };
  }

  if (lastDate === today) {
    // 今日既に学習済み
    return stats;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastDate === yesterdayStr) {
    // 連続学習継続
    const newCurrent = stats.streak.current + 1;
    return {
      ...stats,
      streak: {
        current: newCurrent,
        longest: Math.max(newCurrent, stats.streak.longest),
        lastStudyDate: today,
      },
    };
  } else {
    // ストリーク途切れ
    return {
      ...stats,
      streak: {
        current: 1,
        longest: stats.streak.longest,
        lastStudyDate: today,
      },
    };
  }
};

/**
 * バッジ獲得チェック
 */
export const checkAndAwardBadges = (
  stats: GamificationStats,
  sessionData: {
    accuracy: number;
    avgResponseTime: number;
    wordsLearned: number;
    perfectScore: boolean;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    sessionDuration: number; // 分
    focused: boolean;
  }
): { stats: GamificationStats; newBadges: Badge[] } => {
  const newBadges: Badge[] = [];
  const earnedBadgeTypes = new Set(stats.badges.map((b) => b.type));

  const awardBadge = (type: BadgeType) => {
    if (!earnedBadgeTypes.has(type)) {
      const badge: Badge = {
        ...BADGE_DEFINITIONS[type],
        earnedAt: new Date(),
      };
      newBadges.push(badge);
      earnedBadgeTypes.add(type);
    }
  };

  // 初回セッション
  if (stats.totalSessions === 1 && !earnedBadgeTypes.has(BadgeType.FIRST_SESSION)) {
    awardBadge(BadgeType.FIRST_SESSION);
  }

  // ストリーク系
  if (stats.streak.current >= 3) awardBadge(BadgeType.STREAK_3_DAYS);
  if (stats.streak.current >= 7) awardBadge(BadgeType.STREAK_7_DAYS);
  if (stats.streak.current >= 30) awardBadge(BadgeType.STREAK_30_DAYS);

  // 学習量系
  if (stats.totalWordsLearned >= 100) awardBadge(BadgeType.TOTAL_100_WORDS);
  if (stats.totalWordsLearned >= 500) awardBadge(BadgeType.TOTAL_500_WORDS);
  if (stats.totalWordsLearned >= 1000) awardBadge(BadgeType.TOTAL_1000_WORDS);

  // 精度系
  if (sessionData.perfectScore) awardBadge(BadgeType.PERFECT_SESSION);
  
  // 正答率90%以上を10回
  const highAccuracySessions = stats.totalSessions; // 簡略化: 実際は履歴から計算
  if (sessionData.accuracy >= 90 && highAccuracySessions >= 10) {
    awardBadge(BadgeType.ACCURACY_90);
  }
  if (sessionData.accuracy >= 95 && highAccuracySessions >= 10) {
    awardBadge(BadgeType.ACCURACY_95);
  }

  // 時間帯系（簡略化: 5回以上該当時間帯で学習）
  if (sessionData.timeOfDay === 'morning' && stats.totalSessions >= 5) {
    awardBadge(BadgeType.EARLY_BIRD);
  }
  if (sessionData.timeOfDay === 'night' && stats.totalSessions >= 5) {
    awardBadge(BadgeType.NIGHT_OWL);
  }

  // スピード系
  if (sessionData.avgResponseTime <= 2000 && stats.totalSessions >= 10) {
    awardBadge(BadgeType.SPEED_MASTER);
  }

  // マラソン
  if (sessionData.sessionDuration >= 60) {
    awardBadge(BadgeType.MARATHON);
  }

  // 集中力
  if (sessionData.focused && stats.totalSessions >= 10) {
    awardBadge(BadgeType.FOCUSED);
  }

  // カムバック（1週間以上の中断）
  if (stats.lastSessionDate) {
    const daysSinceLastSession =
      (new Date().getTime() - stats.lastSessionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSession >= 7) {
      awardBadge(BadgeType.COMEBACK);
    }
  }

  const updatedStats = {
    ...stats,
    badges: [...stats.badges, ...newBadges],
  };

  return { stats: updatedStats, newBadges };
};

/**
 * マイルストーン進捗更新
 */
export const updateMilestones = (
  stats: GamificationStats
): { stats: GamificationStats; completedMilestones: Milestone[] } => {
  const completedMilestones: Milestone[] = [];

  const updatedMilestones = stats.milestones.map((milestone) => {
    if (milestone.completed) return milestone;

    let newCurrent = milestone.current;

    // マイルストーンの種類に応じて進捗を更新
    if (milestone.id.includes('words')) {
      newCurrent = stats.totalWordsLearned;
    } else if (milestone.id.includes('accuracy')) {
      newCurrent = stats.averageAccuracy;
    }

    const isCompleted = newCurrent >= milestone.target && !milestone.completed;

    if (isCompleted) {
      const completed = {
        ...milestone,
        current: newCurrent,
        completed: true,
        completedAt: new Date(),
      };
      completedMilestones.push(completed);
      return completed;
    }

    return { ...milestone, current: newCurrent };
  });

  return {
    stats: { ...stats, milestones: updatedMilestones },
    completedMilestones,
  };
};

/**
 * セッション終了時の統合処理
 */
export const processSessionEnd = (
  correctAnswers: number,
  totalQuestions: number,
  avgResponseTime: number,
  sessionDuration: number,
  wordsLearned: number,
  fatigueLevel: number
): {
  stats: GamificationStats;
  feedback: Feedback[];
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
} => {
  let stats = loadGamificationStats();
  const feedback: Feedback[] = [];
  let totalXP = 0;

  // セッション統計更新
  stats.totalSessions += 1;
  stats.totalWordsLearned += wordsLearned;
  stats.totalCorrectAnswers += correctAnswers;
  stats.averageAccuracy =
    (stats.averageAccuracy * (stats.totalSessions - 1) + (correctAnswers / totalQuestions) * 100) /
    stats.totalSessions;
  stats.lastSessionDate = new Date();

  // ストリーク更新
  const oldStreak = stats.streak.current;
  stats = updateStreak(stats);
  if (stats.streak.current > oldStreak) {
    feedback.push({
      type: 'streak',
      message: `🔥 ${stats.streak.current}日連続学習！`,
      icon: '🔥',
      priority: 4,
    });
    totalXP += XP_REWARDS.STREAK_BONUS_PER_DAY * stats.streak.current;
  }

  // 経験値計算
  const accuracy = (correctAnswers / totalQuestions) * 100;
  const perfectScore = correctAnswers === totalQuestions;
  
  totalXP += correctAnswers * XP_REWARDS.CORRECT_ANSWER;
  totalXP += XP_REWARDS.SESSION_COMPLETION;
  if (perfectScore) {
    totalXP += XP_REWARDS.PERFECT_SESSION;
    feedback.push({
      type: 'praise',
      message: '💯 パーフェクト！全問正解です！',
      icon: '💯',
      priority: 5,
    });
  }

  // 時間帯判定
  const hour = new Date().getHours();
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  // 集中力判定（疲労レベルが低い）
  const focused = fatigueLevel < 0.3;

  // バッジチェック
  const badgeResult = checkAndAwardBadges(stats, {
    accuracy,
    avgResponseTime,
    wordsLearned,
    perfectScore,
    timeOfDay,
    sessionDuration,
    focused,
  });
  stats = badgeResult.stats;

  if (badgeResult.newBadges.length > 0) {
    badgeResult.newBadges.forEach((badge) => {
      feedback.push({
        type: 'milestone',
        message: `🎖️ バッジ獲得: ${badge.name}`,
        icon: badge.icon,
        priority: 5,
      });
      totalXP += XP_REWARDS.BADGE_EARNED;
    });
  }

  // マイルストーン更新
  const milestoneResult = updateMilestones(stats);
  stats = milestoneResult.stats;

  if (milestoneResult.completedMilestones.length > 0) {
    milestoneResult.completedMilestones.forEach((milestone) => {
      feedback.push({
        type: 'milestone',
        message: `🎯 マイルストーン達成: ${milestone.title}`,
        icon: '🎯',
        priority: 4,
      });
      totalXP += milestone.reward.xp;
    });
  }

  // 経験値追加とレベルアップ
  const xpResult = addExperience(stats, totalXP);
  stats = xpResult.stats;

  if (xpResult.leveledUp && xpResult.newLevel) {
    feedback.push({
      type: 'level_up',
      message: `⭐ レベルアップ！ Lv.${xpResult.newLevel}`,
      icon: '⭐',
      priority: 5,
    });
  }

  // 励ましメッセージ
  if (accuracy < 50) {
    feedback.push({
      type: 'encouragement',
      message: '💪 焦らず復習しましょう！継続が大切です',
      icon: '💪',
      priority: 2,
    });
  } else if (accuracy >= 50 && accuracy < 80) {
    feedback.push({
      type: 'encouragement',
      message: '👍 良いペースです！この調子で！',
      icon: '👍',
      priority: 2,
    });
  } else if (accuracy >= 80 && accuracy < 95) {
    feedback.push({
      type: 'praise',
      message: '🌟 素晴らしい！高い正答率です',
      icon: '🌟',
      priority: 3,
    });
  }

  saveGamificationStats(stats);

  return {
    stats,
    feedback: feedback.sort((a, b) => b.priority - a.priority),
    xpGained: totalXP,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
  };
};

/**
 * 学習開始時のモチベーションメッセージ
 */
export const getMotivationalMessage = (): string => {
  const stats = loadGamificationStats();
  const messages: string[] = [];

  if (stats.streak.current > 0) {
    messages.push(`🔥 ${stats.streak.current}日連続学習中！`);
  }

  if (stats.level.level > 1) {
    messages.push(`⭐ レベル ${stats.level.level}`);
  }

  const nextLevelProgress = (stats.level.currentXP / stats.level.requiredXP) * 100;
  if (nextLevelProgress > 80) {
    messages.push(`次のレベルまであと少し！`);
  }

  if (messages.length === 0) {
    messages.push('今日も学習を始めましょう！');
  }

  return messages.join(' | ');
};

/**
 * 次のマイルストーン取得
 */
export const getNextMilestone = (): Milestone | null => {
  const stats = loadGamificationStats();
  const incomplete = stats.milestones.filter((m) => !m.completed);
  if (incomplete.length === 0) return null;
  
  // 進捗率が最も高いものを返す
  return incomplete.reduce((closest, current) => {
    const closestProgress = closest.current / closest.target;
    const currentProgress = current.current / current.target;
    return currentProgress > closestProgress ? current : closest;
  });
};

/**
 * バッジ取得率計算
 */
export const getBadgeCompletionRate = (): number => {
  const stats = loadGamificationStats();
  const totalBadges = Object.keys(BADGE_DEFINITIONS).length;
  const earnedBadges = stats.badges.length;
  return (earnedBadges / totalBadges) * 100;
};
