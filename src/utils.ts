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
