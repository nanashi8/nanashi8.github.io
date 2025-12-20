/**
 * 生徒プロファイル定義
 *
 * 実在の生徒の学習パターンを模倣したプロファイルを定義します。
 * これらのプロファイルを使用して、メタAI出題機能が正しく動作するかシミュレーションします。
 */

export interface StudentProfile {
  name: string;
  description: string;

  // 単語の分布
  totalWords: number;
  categoryDistribution: {
    incorrect: number; // 間違えた単語数
    still_learning: number; // 学習中の単語数
    mastered: number; // 定着した単語数
    new: number; // 未学習の単語数
  };

  // 解答パターン
  patterns: {
    // 最近間違えた単語（復習が必要）
    recentErrors: string[];

    // 連続で間違えた単語（苦戦中）
    consecutiveIncorrect: string[];

    // 前回学習からの経過時間（ミリ秒）
    timeGap: number;

    // 連続正解数
    consecutiveCorrect: number;

    // エラー率（0.0 - 1.0）
    errorRate: number;
  };

  // セッション情報
  session: {
    durationMinutes: number; // セッション時間（分）
    cognitiveLoad: number; // 認知負荷（0.0 - 1.0）
    answersCount: number; // 総解答数
  };
}

/**
 * プロファイル1: 苦戦中の生徒
 * - 復習単語（incorrect/still_learning）が多い
 * - メタAIが「苦戦シグナル」を検出し、復習単語を優先出題すべき
 */
export const strugglingStudent: StudentProfile = {
  name: 'Struggling_Student',
  description: '復習単語が多く、苦戦している生徒',

  totalWords: 100,
  categoryDistribution: {
    incorrect: 30, // 30% が間違えた単語
    still_learning: 40, // 40% が学習中
    mastered: 20, // 20% が定着
    new: 10, // 10% が未学習
  },

  patterns: {
    recentErrors: [
      'abandon',
      'ability',
      'absent',
      'absorb',
      'abstract',
      'accept',
      'access',
      'accident',
      'accomplish',
      'account',
    ],
    consecutiveIncorrect: ['achieve', 'acquire', 'across', 'action', 'active'],
    timeGap: 24 * 60 * 60 * 1000, // 24時間経過
    consecutiveCorrect: 2,
    errorRate: 0.45, // 45%のエラー率（苦戦シグナル閾値40%超）
  },

  session: {
    durationMinutes: 15,
    cognitiveLoad: 0.6,
    answersCount: 50,
  },
};

/**
 * プロファイル2: 過学習気味の生徒
 * - 連続正解が多く、同じ問題ばかり出題されている
 * - メタAIが「過学習シグナル」を検出し、新規単語を優先出題すべき
 */
export const overlearningStudent: StudentProfile = {
  name: 'Overlearning_Student',
  description: '連続正解が多く、新しい挑戦が必要な生徒',

  totalWords: 100,
  categoryDistribution: {
    incorrect: 5, // 5% のみ間違えた
    still_learning: 15, // 15% が学習中
    mastered: 60, // 60% が定着
    new: 20, // 20% が未学習
  },

  patterns: {
    recentErrors: ['abandon', 'ability'],
    consecutiveIncorrect: [],
    timeGap: 12 * 60 * 60 * 1000, // 12時間経過
    consecutiveCorrect: 15, // 15問連続正解（過学習シグナル閾値10超）
    errorRate: 0.08, // 8%のエラー率
  },

  session: {
    durationMinutes: 10,
    cognitiveLoad: 0.3,
    answersCount: 30,
  },
};

/**
 * プロファイル3: 疲労中の生徒
 * - 長時間学習で疲労が蓄積
 * - メタAIが「疲労シグナル」を検出し、簡単な問題を優先出題すべき
 */
export const fatiguedStudent: StudentProfile = {
  name: 'Fatigued_Student',
  description: '長時間学習で疲労が蓄積している生徒',

  totalWords: 100,
  categoryDistribution: {
    incorrect: 15,
    still_learning: 25,
    mastered: 50,
    new: 10,
  },

  patterns: {
    recentErrors: ['abandon', 'ability', 'absent', 'absorb'],
    consecutiveIncorrect: ['abstract'],
    timeGap: 6 * 60 * 60 * 1000, // 6時間経過
    consecutiveCorrect: 5,
    errorRate: 0.25, // 25%のエラー率
  },

  session: {
    durationMinutes: 25, // 25分経過（疲労シグナル閾値20分超）
    cognitiveLoad: 0.75, // 75%の認知負荷（疲労シグナル閾値70%超）
    answersCount: 80,
  },
};

/**
 * プロファイル4: 最適な学習状態の生徒
 * - エラー率が20-35%の理想的な範囲
 * - メタAIが「最適状態シグナル」を検出し、現状維持すべき
 */
export const optimalStudent: StudentProfile = {
  name: 'Optimal_Student',
  description: '理想的な学習ペースを維持している生徒',

  totalWords: 100,
  categoryDistribution: {
    incorrect: 10,
    still_learning: 30,
    mastered: 40,
    new: 20,
  },

  patterns: {
    recentErrors: ['abandon', 'ability', 'absent'],
    consecutiveIncorrect: ['absorb'],
    timeGap: 12 * 60 * 60 * 1000, // 12時間経過
    consecutiveCorrect: 5,
    errorRate: 0.28, // 28%のエラー率（最適状態シグナル範囲20-35%）
  },

  session: {
    durationMinutes: 12,
    cognitiveLoad: 0.5,
    answersCount: 40,
  },
};

/**
 * プロファイル5: 初心者の生徒
 * - ほとんどが未学習の単語
 * - 新規単語を中心に学習を開始する
 */
export const beginnerStudent: StudentProfile = {
  name: 'Beginner_Student',
  description: '学習を始めたばかりの初心者',

  totalWords: 100,
  categoryDistribution: {
    incorrect: 5,
    still_learning: 10,
    mastered: 5,
    new: 80, // 80%が未学習
  },

  patterns: {
    recentErrors: ['abandon', 'ability'],
    consecutiveIncorrect: ['absent'],
    timeGap: 48 * 60 * 60 * 1000, // 48時間経過
    consecutiveCorrect: 3,
    errorRate: 0.35,
  },

  session: {
    durationMinutes: 8,
    cognitiveLoad: 0.4,
    answersCount: 20,
  },
};

/**
 * 全プロファイルのエクスポート
 */
export const allProfiles: StudentProfile[] = [
  strugglingStudent,
  overlearningStudent,
  fatiguedStudent,
  optimalStudent,
  beginnerStudent,
];

/**
 * プロファイル検証関数
 */
export function validateProfile(profile: StudentProfile): boolean {
  const { incorrect, still_learning, mastered, new: newWords } = profile.categoryDistribution;
  const total = incorrect + still_learning + mastered + newWords;

  if (total !== profile.totalWords) {
    console.error(`[Validation Error] ${profile.name}: カテゴリー合計が totalWords と一致しません`);
    return false;
  }

  if (profile.patterns.errorRate < 0 || profile.patterns.errorRate > 1) {
    console.error(`[Validation Error] ${profile.name}: errorRate が範囲外です (0.0-1.0)`);
    return false;
  }

  if (profile.session.cognitiveLoad < 0 || profile.session.cognitiveLoad > 1) {
    console.error(`[Validation Error] ${profile.name}: cognitiveLoad が範囲外です (0.0-1.0)`);
    return false;
  }

  return true;
}

/**
 * 全プロファイルを検証
 */
export function validateAllProfiles(): boolean {
  return allProfiles.every(validateProfile);
}
