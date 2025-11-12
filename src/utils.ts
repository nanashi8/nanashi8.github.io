import { Question } from './types';

/**
 * CSVテキストをパースして問題配列に変換
 * quiz-app互換の7列形式: 語句,読み,意味,語源等解説,関連語,関連分野,難易度
 */
export function parseCSV(csvText: string): Question[] {
  const lines = csvText
    .trim()
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#');
    });

  if (lines.length === 0) return [];

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
    if (!line) continue;

    const columns = line.split(',').map((col) => col.trim());

    if (columns.length >= 3) {
      const word = columns[0] || '';
      const reading = columns[1] || '';
      const meaning = columns[2] || '';
      const etymology = columns[3] || '';
      const relatedWords = columns[4] || '';
      const relatedFields = columns[5] || '';
      const difficulty = columns[6] || '';

      if (word && meaning) {
        questions.push({
          word,
          reading,
          meaning,
          etymology,
          relatedWords,
          relatedFields,
          difficulty,
          hint: relatedFields || etymology.substring(0, 30),
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
 * 選択肢を生成（正解1つ + 誤答2つ）
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

  return shuffle([correctAnswer, ...wrongAnswers]);
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

