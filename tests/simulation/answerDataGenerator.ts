/**
 * 解答データ生成器
 *
 * 生徒プロファイルから実際の解答履歴データを生成します。
 */

import type { StudentProfile } from './studentProfiles';
import type { WordProgress } from '../../src/types/storage';

export interface SimulatedAnswer {
  word: string;
  correct: boolean;
  timestamp: number;
  timeTaken: number; // ミリ秒
}

export interface SimulationContext {
  wordProgressMap: Map<string, WordProgress>;
  answers: SimulatedAnswer[];
  sessionStats: {
    totalAnswers: number;
    correctAnswers: number;
    incorrectAnswers: number;
    averageTimePerQuestion: number;
    sessionStartTime: number;
    cognitiveLoad: number;
  };
}

/**
 * プロファイルからWordProgressを生成
 */
export function generateWordProgressFromProfile(
  profile: StudentProfile,
  wordList: string[]
): Map<string, WordProgress> {
  const wordProgressMap = new Map<string, WordProgress>();
  const now = Date.now();

  let index = 0;

  // incorrect単語を生成
  for (
    let i = 0;
    i < profile.categoryDistribution.incorrect && index < wordList.length;
    i++, index++
  ) {
    const word = wordList[index];
    const isConsecutiveIncorrect = profile.patterns.consecutiveIncorrect.includes(word);
    const isRecentError = profile.patterns.recentErrors.includes(word);

    wordProgressMap.set(word, {
      word,
      correctCount: Math.floor(Math.random() * 3), // 0-2回正解
      incorrectCount: isConsecutiveIncorrect ? 3 : 2,
      consecutiveCorrect: 0,
      consecutiveIncorrect: isConsecutiveIncorrect ? 2 : 1,
      lastStudied: isRecentError ? now - 1 * 60 * 60 * 1000 : now - profile.patterns.timeGap,
      lastReviewedAt: isRecentError ? now - 1 * 60 * 60 * 1000 : now - profile.patterns.timeGap,
      masteredAt: null,
      nextReviewAt: now - 12 * 60 * 60 * 1000, // 12時間前に復習予定だった
      easinessFactor: 1.8,
      interval: 1,
      reviewCount: isConsecutiveIncorrect ? 5 : 3,
      category: 'incorrect',
      learningPhase: 'learning',
    });
  }

  // still_learning単語を生成
  for (
    let i = 0;
    i < profile.categoryDistribution.still_learning && index < wordList.length;
    i++, index++
  ) {
    const word = wordList[index];

    wordProgressMap.set(word, {
      word,
      correctCount: Math.floor(Math.random() * 5) + 2, // 2-6回正解
      incorrectCount: Math.floor(Math.random() * 2) + 1, // 1-2回不正解
      consecutiveCorrect: Math.floor(Math.random() * 3), // 0-2回連続正解
      consecutiveIncorrect: 0,
      lastStudied: now - profile.patterns.timeGap / 2,
      lastReviewedAt: now - profile.patterns.timeGap / 2,
      masteredAt: null,
      nextReviewAt: now + 6 * 60 * 60 * 1000, // 6時間後に復習予定
      easinessFactor: 2.2,
      interval: 2,
      reviewCount: Math.floor(Math.random() * 5) + 3, // 3-7回レビュー
      category: 'still_learning',
      learningPhase: 'learning',
    });
  }

  // mastered単語を生成
  for (
    let i = 0;
    i < profile.categoryDistribution.mastered && index < wordList.length;
    i++, index++
  ) {
    const word = wordList[index];

    wordProgressMap.set(word, {
      word,
      correctCount: Math.floor(Math.random() * 5) + 8, // 8-12回正解
      incorrectCount: Math.floor(Math.random() * 2), // 0-1回不正解
      consecutiveCorrect: Math.floor(Math.random() * 5) + 3, // 3-7回連続正解
      consecutiveIncorrect: 0,
      lastStudied: now - 3 * 24 * 60 * 60 * 1000, // 3日前
      lastReviewedAt: now - 3 * 24 * 60 * 60 * 1000, // 3日前
      masteredAt: now - 7 * 24 * 60 * 60 * 1000, // 7日前に定用
      nextReviewAt: now + 7 * 24 * 60 * 60 * 1000, // 7日後に復習予定
      easinessFactor: 2.5,
      interval: 7,
      reviewCount: Math.floor(Math.random() * 5) + 10, // 10-14回レビュー
      category: 'mastered',
      learningPhase: 'mastered',
    });
  }

  // new単語を生成
  for (let i = 0; i < profile.categoryDistribution.new && index < wordList.length; i++, index++) {
    const word = wordList[index];

    wordProgressMap.set(word, {
      word,
      correctCount: 0,
      incorrectCount: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      lastStudied: 0,
      lastReviewedAt: 0,
      masteredAt: null,
      nextReviewAt: now,
      easinessFactor: 2.5,
      interval: 0,
      reviewCount: 0,
      category: 'new',
      learningPhase: 'new',
    });
  }

  return wordProgressMap;
}

/**
 * 解答履歴を生成
 */
export function generateAnswerHistory(
  profile: StudentProfile,
  wordProgressMap: Map<string, WordProgress>
): SimulatedAnswer[] {
  const answers: SimulatedAnswer[] = [];
  const now = Date.now();
  const sessionStartTime = now - profile.session.durationMinutes * 60 * 1000;

  const _words = Array.from(wordProgressMap.keys());
  const totalAnswers = profile.session.answersCount;
  const correctAnswers = Math.floor(totalAnswers * (1 - profile.patterns.errorRate));
  const incorrectAnswers = totalAnswers - correctAnswers;

  // 不正解の履歴を生成
  let incorrectIndex = 0;
  for (let i = 0; i < incorrectAnswers; i++) {
    const progress = Array.from(wordProgressMap.values()).find(
      (p, idx) => p.category === 'incorrect' && idx === incorrectIndex
    );

    if (progress) {
      answers.push({
        word: progress.word,
        correct: false,
        timestamp: sessionStartTime + i * 10000, // 10秒間隔
        timeTaken: Math.floor(Math.random() * 3000) + 2000, // 2-5秒
      });
      incorrectIndex++;
    }
  }

  // 正解の履歴を生成
  let correctIndex = 0;
  for (let i = 0; i < correctAnswers; i++) {
    // mastered単語から優先的に選択
    const progress = Array.from(wordProgressMap.values()).find(
      (p, idx) =>
        (p.category === 'mastered' || p.category === 'still_learning') && idx === correctIndex
    );

    if (progress) {
      answers.push({
        word: progress.word,
        correct: true,
        timestamp: sessionStartTime + (incorrectAnswers + i) * 10000,
        timeTaken: Math.floor(Math.random() * 2000) + 1000, // 1-3秒
      });
      correctIndex++;
    }
  }

  // タイムスタンプでソート
  answers.sort((a, b) => a.timestamp - b.timestamp);

  return answers;
}

/**
 * シミュレーションコンテキストを生成
 */
export function createSimulationContext(
  profile: StudentProfile,
  wordList: string[]
): SimulationContext {
  const wordProgressMap = generateWordProgressFromProfile(profile, wordList);
  const answers = generateAnswerHistory(profile, wordProgressMap);

  const now = Date.now();
  const sessionStartTime = now - profile.session.durationMinutes * 60 * 1000;
  const totalTimeTaken = answers.reduce((sum, a) => sum + a.timeTaken, 0);

  return {
    wordProgressMap,
    answers,
    sessionStats: {
      totalAnswers: answers.length,
      correctAnswers: answers.filter((a) => a.correct).length,
      incorrectAnswers: answers.filter((a) => !a.correct).length,
      averageTimePerQuestion: totalTimeTaken / answers.length,
      sessionStartTime,
      cognitiveLoad: profile.session.cognitiveLoad,
    },
  };
}

/**
 * サンプル単語リストを生成（テスト用）
 */
export function generateSampleWordList(count: number): string[] {
  const words = [
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
    'achieve',
    'acquire',
    'across',
    'action',
    'active',
    'adapt',
    'add',
    'address',
    'adjust',
    'admire',
    'admit',
    'adopt',
    'advance',
    'advantage',
    'adventure',
    'affect',
    'afford',
    'afraid',
    'after',
    'again',
    'against',
    'age',
    'agent',
    'agree',
    'ahead',
    'aid',
    'aim',
    'air',
    'alarm',
    'album',
    'alert',
    'alien',
    'align',
    'alike',
    'alive',
    'allow',
    'almost',
    'alone',
    'along',
    'already',
    'also',
    'alter',
    'although',
    'always',
    'amazing',
    'among',
    'amount',
    'amuse',
    'ancient',
    'angle',
    'angry',
    'animal',
    'announce',
    'annual',
    'another',
    'answer',
    'anticipate',
    'anxious',
    'apart',
    'apologize',
    'appear',
    'append',
    'apple',
    'apply',
    'appoint',
    'appreciate',
    'approach',
    'appropriate',
    'approve',
    'area',
    'argue',
    'arise',
    'arm',
    'around',
    'arrange',
    'arrest',
    'arrive',
    'article',
    'artist',
    'ascend',
    'ashamed',
    'aside',
    'ask',
    'asleep',
    'aspect',
    'assemble',
    'assert',
    'assess',
    'assign',
    'assist',
  ];

  return words.slice(0, Math.min(count, words.length));
}
