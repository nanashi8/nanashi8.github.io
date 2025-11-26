import { Question } from './types';

/**
 * CSVテキストをパースして問題配列に変換
 * quiz-app互換の7列形式: 語句,読み,意味,語源等解説,関連語,関連分野,難易度
 * 
 * RFC 4180に準拠したCSVパーサー（引用符内のカンマを正しく処理）
 */
export function parseCSV(csvText: string): Question[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  /**
   * CSV行を正しくパースする関数（引用符で囲まれたフィールドに対応）
   */
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // エスケープされた引用符
          current += '"';
          i++; // 次の引用符をスキップ
        } else {
          // 引用符の開始/終了
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // フィールドの区切り
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // 最後のフィールドを追加
    result.push(current.trim());
    
    return result;
  }

  let startIndex = 0;

  // ヘッダー行を検出してスキップ
  const firstLine = lines[0].trim();
  if (
    firstLine.includes('語句') ||
    firstLine.includes('term') ||
    firstLine.includes('読み') ||
    firstLine.includes('reading') ||
    firstLine.includes('意味') ||
    firstLine.includes('meaning')
  ) {
    startIndex = 1;
  }

  const questions: Question[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 空行やコメント行をスキップ
    if (!line || line.startsWith('//') || line.startsWith('#')) {
      continue;
    }

    const columns = parseCSVLine(line);

    if (columns.length >= 3) {
      const word = columns[0] || '';
      const reading = columns[1] || '';
      const meaning = columns[2] || '';
      const etymology = columns[3] || '';
      
      // CSVの列数によって処理を分岐（関連語フィールドに改行が含まれる場合、8列になる）
      let relatedWords = '';
      let relatedFields = '';
      let difficultyRaw = '';
      
      if (columns.length >= 8) {
        // 8列の場合：関連語が2列に分かれている
        relatedWords = (columns[4] || '') + (columns[5] || '');
        relatedFields = columns[6] || '';
        difficultyRaw = columns[7] || '';
      } else {
        // 7列の場合：正常なフォーマット
        relatedWords = columns[4] || '';
        relatedFields = columns[5] || '';
        difficultyRaw = columns[6] || '';
      }

      // 難易度を日本語から英語に変換
      let difficulty = '';
      if (difficultyRaw.includes('初級') || difficultyRaw === 'beginner') {
        difficulty = 'beginner';
      } else if (difficultyRaw.includes('中級') || difficultyRaw === 'intermediate') {
        difficulty = 'intermediate';
      } else if (difficultyRaw.includes('上級') || difficultyRaw === 'advanced') {
        difficulty = 'advanced';
      }

      if (word && meaning) {
        questions.push({
          word,
          reading,
          meaning,
          etymology,
          relatedWords,
          relatedFields,
          category: relatedFields, // categoryとして使用
          difficulty,
        });
      }
    }
  }

  return questions;
}

/**
 * 配列をシャッフル
 */
export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * 選択肢を生成（正解1つ + 誤答2つ + 「分からない」）
 */
export function generateChoices(
  correctAnswer: string,
  allQuestions: Question[],
  currentIndex: number
): string[] {
  const wrongAnswers: string[] = [];
  const otherQuestions = allQuestions.filter((_, idx) => idx !== currentIndex);
  const shuffledOthers = shuffle(otherQuestions);

  for (let i = 0; i < shuffledOthers.length && wrongAnswers.length < 2; i++) {
    const wrongAnswer = shuffledOthers[i].meaning;
    if (wrongAnswer !== correctAnswer && !wrongAnswers.includes(wrongAnswer)) {
      wrongAnswers.push(wrongAnswer);
    }
  }

  // 誤答が足りない場合はダミーを追加
  while (wrongAnswers.length < 2) {
    wrongAnswers.push(`選択肢${wrongAnswers.length + 1}`);
  }

  // 正解と誤答3つをシャッフルして、「分からない」を最後に追加
  const shuffledFirst3 = shuffle([correctAnswer, ...wrongAnswers]);
  return [...shuffledFirst3, '分からない'];
}

/**
 * 選択肢とそれに対応するQuestionオブジェクトを生成
 */
export function generateChoicesWithQuestions(
  currentQuestion: Question,
  allQuestions: Question[],
  currentIndex: number
): Array<{ text: string; question: Question | null }> {
  const wrongQuestions: Question[] = [];
  const otherQuestions = allQuestions.filter((_, idx) => idx !== currentIndex);
  const shuffledOthers = shuffle(otherQuestions);

  for (let i = 0; i < shuffledOthers.length && wrongQuestions.length < 2; i++) {
    const wrongQuestion = shuffledOthers[i];
    if (wrongQuestion.meaning !== currentQuestion.meaning && 
        !wrongQuestions.some(q => q.meaning === wrongQuestion.meaning)) {
      wrongQuestions.push(wrongQuestion);
    }
  }

  // 誤答が足りない場合はダミーを追加
  while (wrongQuestions.length < 2) {
    wrongQuestions.push({
      word: `ダミー${wrongQuestions.length + 1}`,
      meaning: `選択肢${wrongQuestions.length + 1}`,
      reading: '',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
      category: '',
      difficulty: ''
    });
  }

  // 正解と誤答をシャッフルして、「分からない」を最後に追加
  const allChoices = [
    { text: currentQuestion.meaning, question: currentQuestion },
    ...wrongQuestions.map(q => ({ text: q.meaning, question: q }))
  ];
  const shuffledFirst3 = shuffle(allChoices);
  return [...shuffledFirst3, { text: '分からない', question: null }];
}

/**
 * スペルクイズ用: 単語を虫食いにして、必要なアルファベットと選択肢を生成
 */
export function generateSpellingPuzzle(word: string): {
  displayWord: string[];
  missingIndices: number[];
  letterChoices: string[];
} {
  if (!word || word.length === 0) {
    return { displayWord: [], missingIndices: [], letterChoices: [] };
  }

  const wordUpper = word.toUpperCase();
  const wordArray = wordUpper.split('');
  
  // 虫食いにする位置を決定（単語の長さに応じて）
  const numBlanks = Math.min(Math.ceil(word.length / 2), 5);
  const missingIndices: number[] = [];
  
  // ランダムに虫食い位置を選択
  const availableIndices = Array.from({ length: word.length }, (_, i) => i);
  const shuffledIndices = shuffle(availableIndices);
  
  for (let i = 0; i < numBlanks && i < shuffledIndices.length; i++) {
    missingIndices.push(shuffledIndices[i]);
  }
  
  missingIndices.sort((a, b) => a - b);
  
  // 正解のアルファベット
  const correctLetters = missingIndices.map(idx => wordArray[idx]);
  
  // ダミーのアルファベット（重複しないように）
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const usedLetters = new Set(correctLetters);
  const dummyLetters: string[] = [];
  
  const shuffledAll = shuffle(allLetters);
  for (const letter of shuffledAll) {
    if (!usedLetters.has(letter) && dummyLetters.length < 6) {
      dummyLetters.push(letter);
    }
  }
  
  // 選択肢をシャッフル
  const letterChoices = shuffle([...correctLetters, ...dummyLetters]);
  
  return {
    displayWord: wordArray,
    missingIndices,
    letterChoices,
  };
}

// ========== QuestionSet 管理関数 ==========

import type { QuestionSet, ReadingPassage } from './types';

const QUESTION_SETS_KEY = 'quizApp_questionSets';

/**
 * 問題集リストを localStorage に保存
 */
export function saveQuestionSets(sets: QuestionSet[]): void {
  try {
    localStorage.setItem(QUESTION_SETS_KEY, JSON.stringify(sets));
  } catch (error) {
    console.error('Failed to save question sets:', error);
  }
}

/**
 * 問題集リストを localStorage から読み込み
 */
export function loadQuestionSets(): QuestionSet[] {
  try {
    const data = localStorage.getItem(QUESTION_SETS_KEY);
    if (!data) return [];
    return JSON.parse(data) as QuestionSet[];
  } catch (error) {
    console.error('Failed to load question sets:', error);
    return [];
  }
}

/**
 * 問題集を追加または更新
 */
export function saveQuestionSet(set: QuestionSet): void {
  const sets = loadQuestionSets();
  const index = sets.findIndex(s => s.id === set.id);
  
  if (index >= 0) {
    sets[index] = set;
  } else {
    sets.push(set);
  }
  
  saveQuestionSets(sets);
}

/**
 * 問題集を削除（組み込みは削除不可）
 */
export function deleteQuestionSet(id: string): boolean {
  const sets = loadQuestionSets();
  const set = sets.find(s => s.id === id);
  
  if (set?.isBuiltIn) {
    return false; // 組み込みは削除不可
  }
  
  const filtered = sets.filter(s => s.id !== id);
  saveQuestionSets(filtered);
  return true;
}

/**
 * 一意なIDを生成
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ========== 長文データの JSON インポート/エクスポート ==========

/**
 * ReadingPassage 配列を JSON 文字列に変換
 */
export function exportPassagesJSON(passages: ReadingPassage[]): string {
  return JSON.stringify(passages, null, 2);
}

/**
 * JSON 文字列から ReadingPassage 配列をパース
 */
export function importPassagesJSON(jsonText: string): ReadingPassage[] {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid format: expected array');
    }
    // 簡易バリデーション
    for (const p of parsed) {
      if (!p.id || !p.title || !Array.isArray(p.phrases)) {
        throw new Error('Invalid passage structure');
      }
    }
    return parsed as ReadingPassage[];
  } catch (error) {
    console.error('Failed to import passages:', error);
    throw error;
  }
}

/**
 * ReadingPassage 配列を JSON ファイルとしてダウンロード
 */
export function downloadPassagesJSON(passages: ReadingPassage[], filename: string = 'passages.json'): void {
  const json = exportPassagesJSON(passages);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * 問題集を CSV 文字列に変換
 */
export function exportQuestionSetCSV(set: QuestionSet): string {
  const header = '語句,読み,意味,語源等解説,関連語,関連分野,難易度';
  const rows = set.questions.map(q => {
    return [
      q.word,
      q.reading,
      q.meaning,
      q.etymology,
      q.relatedWords,
      q.relatedFields,
      q.difficulty
    ].map(field => {
      // カンマやダブルクォートを含む場合はエスケープ
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * 問題集を CSV ファイルとしてダウンロード
 */
export function downloadQuestionSetCSV(set: QuestionSet): void {
  const csv = exportQuestionSetCSV(set);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${set.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// ========== 適応的出題アルゴリズム ==========

import { getAllWordProgress, getWordProgress } from './progressStorage';

/**
 * 適応的に出題する問題を選択
 * - 新規単語: 30% (まだ学習していない or masteryLevel='new')
 * - 復習単語: 50% (学習中 masteryLevel='learning')
 * - 定着済み: 20% (習得済み masteryLevel='mastered')
 */
export function selectAdaptiveQuestions(
  allQuestions: Question[],
  count: number = 10
): Question[] {
  if (allQuestions.length === 0) return [];
  
  // 各単語の進捗を取得
  const wordProgressMap = new Map<string, any>();
  const allProgress = getAllWordProgress();
  allProgress.forEach(wp => {
    wordProgressMap.set(wp.word.toLowerCase(), wp);
  });
  
  // 問題を習熟レベル別に分類
  const newWords: Question[] = [];
  const learningWords: Question[] = [];
  const masteredWords: Question[] = [];
  
  allQuestions.forEach(q => {
    const progress = wordProgressMap.get(q.word.toLowerCase());
    
    if (!progress || progress.masteryLevel === 'new') {
      newWords.push(q);
    } else if (progress.masteryLevel === 'learning') {
      learningWords.push(q);
    } else if (progress.masteryLevel === 'mastered') {
      masteredWords.push(q);
    }
  });
  
  // 必要な各カテゴリの問題数を計算
  const newCount = Math.ceil(count * 0.3);
  const learningCount = Math.ceil(count * 0.5);
  const masteredCount = Math.floor(count * 0.2);
  
  let selected: Question[] = [];
  
  // 1. 復習単語を優先（難易度スコアが高い順）
  const learningWithScores = learningWords.map(q => {
    const progress = wordProgressMap.get(q.word.toLowerCase());
    return { question: q, score: progress?.difficultyScore || 50 };
  });
  learningWithScores.sort((a, b) => b.score - a.score);
  
  const selectedLearning = learningWithScores
    .slice(0, Math.min(learningCount, learningWithScores.length))
    .map(item => item.question);
  selected.push(...selectedLearning);
  
  // 2. 新規単語（ランダム）
  const shuffledNew = shuffle(newWords);
  const selectedNew = shuffledNew.slice(0, Math.min(newCount, shuffledNew.length));
  selected.push(...selectedNew);
  
  // 3. 定着済み単語（時々復習）
  const shuffledMastered = shuffle(masteredWords);
  const selectedMastered = shuffledMastered.slice(0, Math.min(masteredCount, shuffledMastered.length));
  selected.push(...selectedMastered);
  
  // 不足分を補充
  const remaining = count - selected.length;
  if (remaining > 0) {
    const allRemaining = [...newWords, ...learningWords, ...masteredWords].filter(
      q => !selected.includes(q)
    );
    const shuffledRemaining = shuffle(allRemaining);
    selected.push(...shuffledRemaining.slice(0, remaining));
  }
  
  // 最終的にシャッフル
  return shuffle(selected).slice(0, count);
}

/**
 * 苦手単語のみを抽出（難易度スコア50以上）
 */
export function selectWeakQuestions(
  allQuestions: Question[],
  count: number = 10
): Question[] {
  const allProgress = getAllWordProgress();
  const weakWords = allProgress
    .filter(wp => wp.difficultyScore >= 50)
    .sort((a, b) => b.difficultyScore - a.difficultyScore)
    .map(wp => wp.word.toLowerCase());
  
  const weakQuestions = allQuestions.filter(q => 
    weakWords.includes(q.word.toLowerCase())
  );
  
  return shuffle(weakQuestions).slice(0, Math.min(count, weakQuestions.length));
}

/**
 * 復習が必要な単語を選択（最終学習から24時間以上経過）
 */
export function selectReviewQuestions(
  allQuestions: Question[],
  count: number = 10,
  hoursThreshold: number = 24
): Question[] {
  const now = Date.now();
  const threshold = hoursThreshold * 60 * 60 * 1000;
  
  const allProgress = getAllWordProgress();
  const needReviewWords = allProgress
    .filter(wp => {
      const timeSinceLastStudy = now - wp.lastStudied;
      return wp.masteryLevel === 'learning' && timeSinceLastStudy >= threshold;
    })
    .sort((a, b) => b.difficultyScore - a.difficultyScore)
    .map(wp => wp.word.toLowerCase());
  
  const reviewQuestions = allQuestions.filter(q => 
    needReviewWords.includes(q.word.toLowerCase())
  );
  
  return shuffle(reviewQuestions).slice(0, Math.min(count, reviewQuestions.length));
}

/**
 * 指定した習熟レベルの単語のみを選択
 */
export function selectQuestionsByMasteryLevel(
  allQuestions: Question[],
  masteryLevel: 'new' | 'learning' | 'mastered',
  count?: number
): Question[] {
  const allProgress = getAllWordProgress();
  const targetWords = allProgress
    .filter(wp => wp.masteryLevel === masteryLevel)
    .map(wp => wp.word.toLowerCase());
  
  const filteredQuestions = allQuestions.filter(q => {
    const progress = getWordProgress(q.word);
    
    // 進捗データがない場合は'new'として扱う
    if (!progress && masteryLevel === 'new') {
      return true;
    }
    
    return targetWords.includes(q.word.toLowerCase());
  });
  
  const shuffled = shuffle(filteredQuestions);
  return count ? shuffled.slice(0, count) : shuffled;
}

/**
 * 熟語のタイプを分類する
 * @param phrase - 分類する熟語（例: "look forward to", "break the ice"）
 * @returns 'phrasal-verb' | 'idiom' | 'collocation' | 'other'
 */
export function classifyPhraseType(phrase: string): string {
  // スペースがない場合は単語なので分類不要
  if (!phrase.includes(' ')) {
    return 'word';
  }

  const lowerPhrase = phrase.toLowerCase();
  const words = lowerPhrase.split(' ');
  
  // 句動詞パターン: 動詞 + 前置詞/副詞
  const commonVerbs = [
    'get', 'go', 'come', 'take', 'make', 'put', 'look', 'turn', 'break', 
    'bring', 'call', 'carry', 'check', 'figure', 'fill', 'find', 'give',
    'hand', 'hang', 'hold', 'keep', 'knock', 'lay', 'let', 'pass', 'pick',
    'pull', 'push', 'run', 'set', 'show', 'shut', 'sit', 'stand', 'stay',
    'stick', 'take', 'talk', 'think', 'throw', 'try', 'work', 'write'
  ];
  
  const particles = [
    'up', 'down', 'in', 'out', 'on', 'off', 'away', 'back', 'over', 'through',
    'around', 'across', 'along', 'about', 'after', 'for', 'from', 'into', 'to', 'with'
  ];
  
  // 句動詞判定: 最初の単語が一般的な動詞で、後続に前置詞/副詞
  if (words.length >= 2 && commonVerbs.includes(words[0])) {
    const hasParticle = words.slice(1).some(w => particles.includes(w));
    if (hasParticle) {
      return 'phrasal-verb';
    }
  }
  
  // イディオムの特徴的パターン
  const idiomPatterns = [
    /^a .+ of$/,                    // a piece of, a drop in the bucket
    /^the .+ (of|in)$/,             // the tip of the iceberg, the elephant in the room
    /^(break|beat|hit|kick) (the|a)/, // break the ice, beat around the bush
    /^(catch|have|take|make) (a|an|the)/, // catch one's eye, have a blast
    /(eye|eyes|face|hand|tongue|ear|nose|heart|mind|bone)/i, // 身体部位を含むイディオム
    /^once in a/,                   // once in a blue moon
    /^(cost|pay|worth) (an|a)/,    // cost an arm and a leg
    /^at .+ (heart|first|last|once)/, // at heart, at first sight
  ];
  
  const isIdiom = idiomPatterns.some(pattern => pattern.test(lowerPhrase));
  if (isIdiom) {
    return 'idiom';
  }
  
  // コロケーション判定: 前置詞句、形容詞+名詞、動詞+名詞など
  const collocPatterns = [
    /^(in|on|at|by|with|from|to) (the|a|an) /, // 前置詞句
    /^(make|take|do|have|get) (a|an|the) /,    // 動詞+冠詞+名詞
    /(strong|weak|heavy|light|high|low|good|bad|big|small) /i, // 形容詞+名詞
  ];
  
  const isCollocation = collocPatterns.some(pattern => pattern.test(lowerPhrase));
  if (isCollocation) {
    return 'collocation';
  }
  
  // それ以外
  return 'other';
}

/**
 * 熟語タイプの日本語ラベルを取得
 */
export function getPhraseTypeLabel(phraseType: string): string {
  const labels: Record<string, string> = {
    'word': '単語',
    'phrasal-verb': '句動詞',
    'idiom': 'イディオム',
    'collocation': 'コロケーション',
    'other': 'その他'
  };
  return labels[phraseType] || 'その他';
}

// ========== 90日学習プラン機能 ==========

import type { LearningSchedule, DailyStudyPlan } from './types';

/**
 * 学習プランを生成（期間調整可能）
 * @param allQuestions 全問題データ
 * @param months 学習期間（月）: 1, 2, 3, 6
 * @param startDate 開始日
 */
export function generateLearningPlan(
  allQuestions: Question[],
  months: number = 3,
  startDate: number = Date.now()
): LearningSchedule {
  const totalDays = months * 30; // 1ヶ月=30日として計算
  const totalWords = allQuestions.length;
  
  // 1日あたりの新規学習単語数を計算
  const dailyNewWords = Math.ceil(totalWords / totalDays);
  const dailyReviewWords = Math.ceil(dailyNewWords * 1.5);
  const dailyMinutes = Math.ceil((dailyNewWords + dailyReviewWords) * 0.5); // 1単語約0.5分
  
  // マイルストーンを動的に生成
  const milestones = generateMilestones(totalDays, dailyNewWords);
  
  const schedule: LearningSchedule = {
    userId: 'default',
    startDate,
    currentDay: 1,
    totalDays,
    planDurationMonths: months,
    phase: 1,
    
    dailyGoals: {
      newWords: dailyNewWords,
      reviewWords: dailyReviewWords,
      timeMinutes: dailyMinutes,
    },
    
    weeklyProgress: [],
    milestones,
  };
  
  return schedule;
}

/**
 * マイルストーンを動的に生成
 */
function generateMilestones(totalDays: number, dailyNewWords: number) {
  const milestones = [];
  
  // 1週間ごと
  if (totalDays >= 7) {
    milestones.push({
      day: 7,
      title: '1週間継続！',
      wordsTarget: dailyNewWords * 7,
      achieved: false
    });
  }
  
  // 2週間
  if (totalDays >= 14) {
    milestones.push({
      day: 14,
      title: '2週間継続！',
      wordsTarget: dailyNewWords * 14,
      achieved: false
    });
  }
  
  // 3週間
  if (totalDays >= 21) {
    milestones.push({
      day: 21,
      title: '3週間継続！',
      wordsTarget: dailyNewWords * 21,
      achieved: false
    });
  }
  
  // 1ヶ月
  if (totalDays >= 30) {
    milestones.push({
      day: 30,
      title: '1ヶ月達成！',
      wordsTarget: dailyNewWords * 30,
      achieved: false
    });
  }
  
  // 中間地点
  const halfDay = Math.floor(totalDays / 2);
  if (totalDays >= 60 && halfDay > 30) {
    milestones.push({
      day: halfDay,
      title: '折り返し地点！',
      wordsTarget: dailyNewWords * halfDay,
      achieved: false
    });
  }
  
  // 2ヶ月
  if (totalDays >= 60) {
    milestones.push({
      day: 60,
      title: '2ヶ月達成！',
      wordsTarget: dailyNewWords * 60,
      achieved: false
    });
  }
  
  // 75%地点
  const threeQuarterDay = Math.floor(totalDays * 0.75);
  if (totalDays >= 90 && threeQuarterDay > 60) {
    milestones.push({
      day: threeQuarterDay,
      title: 'ラストスパート！',
      wordsTarget: dailyNewWords * threeQuarterDay,
      achieved: false
    });
  }
  
  // 3ヶ月
  if (totalDays >= 90) {
    milestones.push({
      day: 90,
      title: '3ヶ月達成！',
      wordsTarget: dailyNewWords * 90,
      achieved: false
    });
  }
  
  // 6ヶ月
  if (totalDays >= 180) {
    milestones.push({
      day: 180,
      title: '6ヶ月達成！',
      wordsTarget: dailyNewWords * 180,
      achieved: false
    });
  }
  
  // 最終日
  if (!milestones.find(m => m.day === totalDays)) {
    milestones.push({
      day: totalDays,
      title: `${Math.floor(totalDays / 30)}ヶ月完走！`,
      wordsTarget: dailyNewWords * totalDays,
      achieved: false
    });
  }
  
  return milestones.sort((a, b) => a.day - b.day);
}

/**
 * 旧名称との互換性のためのエイリアス
 */
export function generate90DayPlan(
  allQuestions: Question[],
  startDate: number = Date.now()
): LearningSchedule {
  return generateLearningPlan(allQuestions, 3, startDate);
}

/**
 * フェーズ判定（1-3）
 * @param dayNumber 現在の日数
 * @param totalDays 総日数
 */
function getPhase(dayNumber: number, totalDays: number = 90): 1 | 2 | 3 {
  const phase1End = Math.floor(totalDays / 3);
  const phase2End = Math.floor(totalDays * 2 / 3);
  
  if (dayNumber <= phase1End) return 1;
  if (dayNumber <= phase2End) return 2;
  return 3;
}

/**
 * 未学習の単語を取得
 */
function getUnlearnedWords(allQuestions: Question[]): Question[] {
  const allProgress = getAllWordProgress();
  const progressMap = new Map<string, any>();
  
  allProgress.forEach(wp => {
    progressMap.set(wp.word.toLowerCase(), wp);
  });
  
  return allQuestions.filter(q => {
    const progress = progressMap.get(q.word.toLowerCase());
    return !progress || progress.masteryLevel === 'new';
  });
}

/**
 * 復習が必要な単語を取得（忘却曲線ベース）
 */
function getReviewDueWords(allQuestions: Question[]): Question[] {
  const now = Date.now();
  const allProgress = getAllWordProgress();
  const progressMap = new Map<string, any>();
  
  allProgress.forEach(wp => {
    progressMap.set(wp.word.toLowerCase(), wp);
  });
  
  return allQuestions.filter(q => {
    const progress = progressMap.get(q.word.toLowerCase());
    if (!progress) return false;
    
    const daysSinceLastStudy = (now - progress.lastStudied) / (1000 * 60 * 60 * 24);
    
    // 忘却曲線: 次回復習タイミング
    let dueInterval: number;
    
    switch (progress.masteryLevel) {
      case 'new':
        dueInterval = 1;
        break;
      case 'learning':
        dueInterval = Math.min(7, progress.consecutiveCorrect + 1);
        break;
      case 'mastered':
        dueInterval = Math.min(30, progress.consecutiveCorrect * 2);
        break;
      default:
        dueInterval = 1;
    }
    
    return daysSinceLastStudy >= dueInterval;
  });
}

/**
 * フェーズに応じた新規単語の選択
 */
function selectNewWordsForPhase(
  unlearnedWords: Question[],
  phase: 1 | 2 | 3,
  count: number
): Question[] {
  let filtered: Question[];
  
  switch (phase) {
    case 1: // Phase 1: 初級中心
      filtered = unlearnedWords.filter(q => q.difficulty === '初級');
      if (filtered.length < count) {
        // 初級が足りなければ中級も含める
        filtered = [...filtered, ...unlearnedWords.filter(q => q.difficulty === '中級')];
      }
      break;
      
    case 2: // Phase 2: 初級+中級
      const beginner = unlearnedWords.filter(q => q.difficulty === '初級');
      const intermediate = unlearnedWords.filter(q => q.difficulty === '中級');
      filtered = [...beginner, ...intermediate];
      break;
      
    case 3: // Phase 3: 中級+上級
      const mid = unlearnedWords.filter(q => q.difficulty === '中級');
      const adv = unlearnedWords.filter(q => q.difficulty === '上級');
      filtered = [...mid, ...adv];
      break;
  }
  
  return shuffle(filtered).slice(0, count);
}

/**
 * 今日の学習プランを生成
 */
export function generateDailyPlan(
  schedule: LearningSchedule,
  allQuestions: Question[]
): DailyStudyPlan {
  const dayNumber = schedule.currentDay;
  const phase = getPhase(dayNumber, schedule.totalDays);
  
  // 未学習の単語を取得
  const unlearnedWords = getUnlearnedWords(allQuestions);
  
  // 復習が必要な単語を取得（忘却曲線に基づく）
  const reviewDueWords = getReviewDueWords(allQuestions);
  
  // 朝: 新規学習
  const morningCount = Math.ceil(schedule.dailyGoals.newWords * 0.3);
  const morningWords = selectNewWordsForPhase(unlearnedWords, phase, morningCount);
  
  // 昼: 復習（苦手な単語優先）
  const afternoonCount = Math.ceil(schedule.dailyGoals.reviewWords * 0.4);
  const afternoonWords = selectWeakQuestions(reviewDueWords.length > 0 ? reviewDueWords : allQuestions, afternoonCount);
  
  // 夜: 総合演習（新規+復習ミックス）
  const eveningNewCount = Math.floor(morningCount * 0.3);
  const eveningReviewCount = Math.ceil(schedule.dailyGoals.reviewWords * 0.3);
  const eveningWords = [
    ...shuffle(morningWords).slice(0, eveningNewCount),
    ...shuffle(reviewDueWords.length > 0 ? reviewDueWords : allQuestions).slice(0, eveningReviewCount),
  ];
  
  return {
    date: schedule.startDate + (dayNumber - 1) * 24 * 60 * 60 * 1000,
    dayNumber,
    phase,
    
    morning: {
      newWords: morningWords,
      duration: Math.ceil(schedule.dailyGoals.timeMinutes * 0.35),
      mode: 'discovery',
    },
    
    afternoon: {
      reviewWords: afternoonWords,
      duration: Math.ceil(schedule.dailyGoals.timeMinutes * 0.3),
      mode: 'weakness',
    },
    
    evening: {
      mixedWords: shuffle(eveningWords),
      duration: Math.ceil(schedule.dailyGoals.timeMinutes * 0.35),
      mode: 'mixed',
    },
    
    completed: false,
    actualAccuracy: 0,
  };
}

/**
 * 学習進捗の計算
 */
export function calculateProgress(schedule: LearningSchedule): {
  totalLearned: number;
  totalReviewed: number;
  averageAccuracy: number;
  estimatedCompletion: number;
} {
  const allProgress = getAllWordProgress();
  
  const totalLearned = allProgress.filter(
    wp => wp.masteryLevel !== 'new'
  ).length;
  
  const totalReviewed = allProgress.reduce(
    (sum, wp) => sum + wp.correctCount + wp.incorrectCount,
    0
  );
  
  const totalCorrect = allProgress.reduce(
    (sum, wp) => sum + wp.correctCount,
    0
  );
  
  const averageAccuracy = totalReviewed > 0
    ? (totalCorrect / totalReviewed) * 100
    : 0;
  
  // 推定完了日数
  const dailyAverage = totalLearned / schedule.currentDay;
  const remaining = 4700 - totalLearned;
  const estimatedDays = remaining / (dailyAverage || 50);
  
  return {
    totalLearned,
    totalReviewed,
    averageAccuracy,
    estimatedCompletion: Math.ceil(estimatedDays),
  };
}

/**
 * 今週の達成率を計算
 */
export function calculateWeeklyAchievement(
  schedule: LearningSchedule
): number {
  const weekNumber = Math.ceil(schedule.currentDay / 7);
  const targetPerWeek = schedule.dailyGoals.newWords * 7;
  
  const weekProgress = schedule.weeklyProgress.find(w => w.week === weekNumber);
  if (!weekProgress) return 0;
  
  return (weekProgress.wordsLearned / targetPerWeek) * 100;
}

