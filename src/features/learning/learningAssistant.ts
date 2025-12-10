// AI学習アシスタント - スキップした単語の検証と復習管理
import { logger } from '../../logger';

import { loadProgressSync, saveProgress } from '../../storage/progress/progressStorage';

// スキップグループ情報
export interface SkipGroup {
  timestamp: number; // スキップした時刻
  words: string[]; // 同時期にスキップされた単語リスト
  verificationStatus: 'pending' | 'verified' | 'suspicious'; // 検証状態
  suspiciousWords: string[]; // 疑わしい単語リスト
}

const SKIP_GROUP_KEY = 'learning-assistant-skip-groups';
const SKIP_GROUP_TIME_WINDOW = 5 * 60 * 1000; // 5分以内にスキップされた単語は同じグループ

// スキップグループの読み込み
function loadSkipGroups(): SkipGroup[] {
  try {
    const data = localStorage.getItem(SKIP_GROUP_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error('スキップグループの読み込みエラー:', error);
    return [];
  }
}

// スキップグループの保存
function saveSkipGroups(groups: SkipGroup[]): void {
  try {
    localStorage.setItem(SKIP_GROUP_KEY, JSON.stringify(groups));
  } catch (error) {
    logger.error('スキップグループの保存エラー:', error);
  }
}

/**
 * 単語をスキップグループに追加
 * 同じ時期にスキップされた単語をグループ化
 */
export function addToSkipGroup(word: string): void {
  const groups = loadSkipGroups();
  const now = Date.now();
  
  // 直近のグループを探す（5分以内）
  let currentGroup = groups.find(g => 
    g.verificationStatus === 'pending' && 
    now - g.timestamp < SKIP_GROUP_TIME_WINDOW
  );
  
  if (currentGroup) {
    // 既存のグループに追加
    if (!currentGroup.words.includes(word)) {
      currentGroup.words.push(word);
    }
  } else {
    // 新しいグループを作成
    groups.push({
      timestamp: now,
      words: [word],
      verificationStatus: 'pending',
      suspiciousWords: []
    });
  }
  
  saveSkipGroups(groups);
}

/**
 * スキップした単語が実際に出題され、不正解だった場合の処理
 * 同じグループの他の単語を疑わしいとマーク
 */
export function handleSkippedWordIncorrect(word: string): void {
  const groups = loadSkipGroups();
  const progress = loadProgressSync();
  
  // この単語が含まれるグループを探す
  const group = groups.find(g => g.words.includes(word));
  
  if (group && group.verificationStatus === 'pending') {
    // グループを疑わしいとマーク
    group.verificationStatus = 'suspicious';
    
    // 同じグループの他の単語をsuspiciousWordsに追加
    group.suspiciousWords = group.words.filter(w => w !== word);
    
    // 疑わしい単語のskipExcludeUntilをクリアして出題対象に
    group.suspiciousWords.forEach(suspiciousWord => {
      if (progress.wordProgress[suspiciousWord]) {
        const wordProgress = progress.wordProgress[suspiciousWord];
        
        // 除外期間をクリア
        delete wordProgress.skipExcludeUntil;
        
        // 定着レベルを下げる
        wordProgress.masteryLevel = 'learning';
        wordProgress.consecutiveCorrect = 0;
        
        // 検証が必要とマーク
        wordProgress.needsVerification = true;
        wordProgress.verificationReason = `同時期にスキップした「${word}」が不正解だったため`;
      }
    });
    
    saveProgress(progress);
    saveSkipGroups(groups);
    
    logger.log(`AI学習アシスタント: 「${word}」が不正解でした。同時期にスキップした${group.suspiciousWords.length}個の単語を再出題対象にします。`);
  }
}

/**
 * スキップした単語が実際に出題され、正解だった場合の処理
 */
export function handleSkippedWordCorrect(word: string): void {
  const groups = loadSkipGroups();
  const progress = loadProgressSync();
  
  // この単語が含まれるグループを探す
  const group = groups.find(g => g.words.includes(word));
  
  if (group) {
    // 疑わしいリストから削除
    group.suspiciousWords = group.suspiciousWords.filter(w => w !== word);
    
    // グループ内の全単語が検証済みかチェック
    const allVerified = group.words.every(w => {
      const wp = progress.wordProgress[w];
      return wp && (wp.correctCount > 0 || wp.incorrectCount > 0);
    });
    
    if (allVerified && group.suspiciousWords.length === 0) {
      group.verificationStatus = 'verified';
    }
    
    // 検証フラグをクリア
    if (progress.wordProgress[word]) {
      delete progress.wordProgress[word].needsVerification;
      delete progress.wordProgress[word].verificationReason;
    }
    
    saveProgress(progress);
    saveSkipGroups(groups);
  }
}

/**
 * 検証が必要な単語を取得
 */
export function getWordsNeedingVerification(): string[] {
  const progress = loadProgressSync();
  return Object.values(progress.wordProgress)
    .filter(wp => wp.needsVerification)
    .map(wp => wp.word);
}

/**
 * スキップされたが検証が必要な単語を優先的に出題リストに含める
 */
export function prioritizeVerificationWords<T extends { word: string }>(
  questions: T[],
  maxVerificationWords: number = 5
): T[] {
  const verificationWords = getWordsNeedingVerification();
  
  if (verificationWords.length === 0) {
    return questions;
  }
  
  // 検証が必要な単語を優先的に追加
  const verificationQuestions = questions.filter(q => 
    verificationWords.includes(q.word)
  ).slice(0, maxVerificationWords);
  
  // 残りの問題
  const otherQuestions = questions.filter(q => 
    !verificationWords.includes(q.word)
  );
  
  // 検証問題を最初に配置
  return [...verificationQuestions, ...otherQuestions];
}

/**
 * AI学習アシスタントのアドバイスメッセージを生成
 */
export function generateAssistantMessage(word: string): string | null {
  const progress = loadProgressSync();
  const wordProgress = progress.wordProgress[word];
  
  if (!wordProgress || !wordProgress.needsVerification) {
    return null;
  }
  
  return `💡 学習アシスタント: この単語は以前スキップされましたが、${wordProgress.verificationReason}。本当に定着しているか確認させてください。`;
}

/**
 * スキップグループの統計情報を取得
 */
export function getSkipGroupStats(): {
  totalGroups: number;
  pendingGroups: number;
  suspiciousGroups: number;
  verifiedGroups: number;
  wordsNeedingVerification: number;
} {
  const groups = loadSkipGroups();
  const verificationWords = getWordsNeedingVerification();
  
  return {
    totalGroups: groups.length,
    pendingGroups: groups.filter(g => g.verificationStatus === 'pending').length,
    suspiciousGroups: groups.filter(g => g.verificationStatus === 'suspicious').length,
    verifiedGroups: groups.filter(g => g.verificationStatus === 'verified').length,
    wordsNeedingVerification: verificationWords.length
  };
}
