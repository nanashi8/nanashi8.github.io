/**
 * 社会科CSVデータ読み込みとQuestion型変換
 */

import { Question } from '../types';

function normalizeQuestionSource(value: string): Question['source'] {
  const trimmed = (value || '').trim();
  if (!trimmed) return undefined;

  if (
    trimmed === 'junior' ||
    trimmed === 'intermediate' ||
    trimmed === 'history' ||
    trimmed === 'geography' ||
    trimmed === 'civics'
  ) {
    return trimmed;
  }
  return undefined;
}

function normalizeTermType(value: string): Question['termType'] {
  const trimmed = (value || '').trim();

  // 社会科の種別
  if (
    trimmed === '人物名' ||
    trimmed === '出来事' ||
    trimmed === '地名' ||
    trimmed === '制度概念'
  ) {
    return trimmed;
  }

  // 古文の種別（すべて「その他」として扱う）
  if (
    trimmed === '古文単語' ||
    trimmed === '古文重要動詞' ||
    trimmed === '古文敬語' ||
    trimmed === '助動詞' ||
    trimmed === '古典作品' ||
    trimmed === '名文句' ||
    trimmed === '古文表現'
  ) {
    return 'その他';
  }

  return 'その他';
}

const PLACEHOLDER_SOCIAL_STUDIES_MEANINGS = new Set(['地理', '歴史', '政治', '経済', '国際']);

function extractShortMeaningFromExplanation(explanation: string): string | null {
  const trimmed = (explanation || '').trim();
  if (!trimmed) return null;

  // 1文目を「短い意味」として使う（末尾の句点は外す）
  const jpSentenceEnd = trimmed.indexOf('。');
  if (jpSentenceEnd !== -1) {
    const first = trimmed.slice(0, jpSentenceEnd).trim();
    return first || null;
  }

  const enSentenceEnd = trimmed.indexOf('.');
  if (enSentenceEnd !== -1) {
    const first = trimmed.slice(0, enSentenceEnd + 1).trim().replace(/\.$/, '');
    return first || null;
  }

  // 句点がなければ全文（長すぎる場合は先頭のみ）
  const maxLen = 80;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen).trim() : trimmed;
}

function normalizeSocialStudiesMeaning(rawMeaning: string, explanation: string): string {
  const trimmed = (rawMeaning || '').trim();

  // 「意味」列が分野ラベルだけの場合、詳細解説の1文目を意味として採用
  if (PLACEHOLDER_SOCIAL_STUDIES_MEANINGS.has(trimmed)) {
    const derived = extractShortMeaningFromExplanation(explanation);
    if (derived) return derived;
  }

  return trimmed;
}

/**
 * RFC 4180準拠のCSVパーサー（引用符内の改行とカンマに対応）
 */
function parseCSV<T>(csvText: string): T[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;
  
  // 引用符を考慮して行を分割
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // エスケープされた引用符（""）
        currentLine += '"';
        i++; // 次の引用符をスキップ
      } else {
        // 引用符の開始/終了
        insideQuotes = !insideQuotes;
      }
    } else if (char === '\n' && !insideQuotes) {
      // 引用符外の改行 = 行の終わり
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  // 最後の行を追加
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length < 2) return [];

  // ヘッダー行を解析
  const headers = parseCSVLine(lines[0]);
  const rows: T[] = [];

  // データ行を解析
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row as T);
  }

  return rows;
}

/**
 * CSV行を解析（引用符で囲まれたフィールドに対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // エスケープされた引用符（""）→ 1つの引用符として追加
        currentField += '"';
        i++;
      } else {
        // 引用符の開始/終了
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // 引用符外のカンマ = フィールドの区切り
      result.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // 最後のフィールドを追加
  result.push(currentField.trim());
  
  return result;
}

/**
 * 社会科・国語CSV行の型
 */
interface SocialStudiesRow {
  語句: string;
  読み: string;
  意味: string;
  詳細解説?: string; // 社会科
  解説?: string; // 古文
  関連事項: string;
  関連分野?: string; // 社会科
  時代背景?: string; // 古文
  種別: string;
  source?: string; // 社会科
}

/**
 * 種別ごとにグループ化された問題
 */
interface QuestionsByType {
  人物名: Question[];
  出来事: Question[];
  地名: Question[];
  制度概念: Question[];
  その他: Question[];
}

/**
 * 社会科・国語CSVを読み込んでQuestion型に変換
 */
export async function loadSocialStudiesCSV(filename: string): Promise<Question[]> {
  try {
    // ファイル名から適切なディレクトリを判定
    const directory = filename.includes('classical') || filename.includes('kanbun') ? 'classical-japanese' : 'social-studies';
    const url = `/data/${directory}/${filename}`;
    
    console.log('[loadSocialStudiesCSV] データ読み込み開始:', { filename, directory, url });
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`データの読み込みに失敗: ${response.status} ${response.statusText} (URL: ${url})`);
    }

    const csvText = await response.text();
    console.log('[loadSocialStudiesCSV] CSV読み込み完了:', { 
      filename, 
      length: csvText.length, 
      firstLine: csvText.split('\n')[0]?.slice(0, 100) 
    });
    
    const rows = parseCSV<SocialStudiesRow>(csvText);
    console.log('[loadSocialStudiesCSV] CSV解析完了:', { filename, rowCount: rows.length });

    const questions = rows.map((row) => ({
      word: row.語句,
      reading: row.読み,
      meaning: normalizeSocialStudiesMeaning(row.意味, row.詳細解説 || row.解説 || ''),
      etymology: row.詳細解説 || row.解説 || '', // 社会科または古文
      relatedWords: row.関連事項,
      relatedFields: row.関連分野 || row.時代背景 || '', // 社会科または古文
      difficulty: 'intermediate' as const,
      source: normalizeQuestionSource(row.source || ''),
      termType: normalizeTermType(row.種別),
    }));
    
    console.log('[loadSocialStudiesCSV] Question変換完了:', { filename, questionCount: questions.length });
    return questions;
  } catch (error) {
    console.error('[loadSocialStudiesCSV] エラー発生:', { filename, error });
    throw error;
  }
}

/**
 * 種別ごとに問題をグループ化
 */
function _groupQuestionsByType(questions: Question[]): QuestionsByType {
  const grouped: QuestionsByType = {
    人物名: [],
    出来事: [],
    地名: [],
    制度概念: [],
    その他: [],
  };

  questions.forEach((q) => {
    const type = (q as any).termType || 'その他';
    if (type in grouped) {
      grouped[type as keyof QuestionsByType].push(q);
    } else {
      grouped.その他.push(q);
    }
  });

  return grouped;
}

/**
 * 社会科問題用の選択肢を生成（同じ種別から抽出）
 *
 * @param correctAnswer 正解の問題
 * @param allQuestions 全問題リスト
 * @param choiceCount 選択肢の数（デフォルト3）
 * @returns 選択肢の配列（正解含む、シャッフル済み）
 */
export function generateSocialStudiesChoices(
  correctAnswer: Question,
  allQuestions: Question[],
  choiceCount: number = 3
): string[] {
  const correctType = (correctAnswer as any).termType || 'その他';

  // 同じ種別の問題のみを抽出
  const sameTypeQuestions = allQuestions.filter((q) => {
    const type = (q as any).termType || 'その他';
    return type === correctType && q.word !== correctAnswer.word;
  });

  // 誤答選択肢を生成
  const wrongChoices: string[] = [];
  const usedIndices = new Set<number>();

  while (wrongChoices.length < choiceCount - 1 && wrongChoices.length < sameTypeQuestions.length) {
    const randomIndex = Math.floor(Math.random() * sameTypeQuestions.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      wrongChoices.push(sameTypeQuestions[randomIndex].word);
    }
  }

  // 同じ種別の問題が不足している場合、他の種別からも選択
  if (wrongChoices.length < choiceCount - 1) {
    const otherQuestions = allQuestions.filter((q) => {
      const type = (q as any).termType || 'その他';
      return type !== correctType && q.word !== correctAnswer.word && !wrongChoices.includes(q.word);
    });

    while (wrongChoices.length < choiceCount - 1 && wrongChoices.length < otherQuestions.length) {
      const randomIndex = Math.floor(Math.random() * otherQuestions.length);
      if (!wrongChoices.includes(otherQuestions[randomIndex].word)) {
        wrongChoices.push(otherQuestions[randomIndex].word);
      }
    }
  }

  // 正解を追加してシャッフル
  const allChoices = [...wrongChoices, correctAnswer.word];

  // Fisher-Yatesシャッフル
  for (let i = allChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
  }

  return allChoices;
}

/**
 * 社会科問題の表示用テキストを生成
 *
 * @param question 問題オブジェクト
 * @returns 問題文（「～は何か？」「～は誰か？」形式）
 */
export function generateSocialStudiesQuestionText(question: Question): string {
  const type = (question as any).termType || 'その他';
  const matter = question.meaning;

  // 種別に応じた疑問詞を選択
  let questionWord = '何';
  if (type === '人物名') {
    questionWord = '誰';
  } else if (type === '地名') {
    questionWord = 'どこ';
  }

  // matter（意味）から問題文を生成
  if (matter.includes('？') || matter.includes('?')) {
    // すでに疑問文形式の場合はそのまま使用
    return matter;
  }

  // 「～は○○か？」形式に変換
  return `${matter}は${questionWord}か？`;
}

/**
 * 社会科データソースの選択肢
 */
export const SOCIAL_STUDIES_DATA_SOURCES = [
  { id: 'all-social-studies', name: '全分野', filename: 'all-social-studies.csv' },
  { id: 'social-studies-sample', name: 'サンプル', filename: 'social-studies-sample.csv' },
  { id: 'social-studies-history', name: '歴史', filename: 'social-studies-history-40.csv' },
  { id: 'social-studies-geography', name: '地理', filename: 'social-studies-geography-30.csv' },
  { id: 'social-studies-civics', name: '公民', filename: 'social-studies-civics-30.csv' },
] as const;

/**
 * データソースIDからファイル名を取得
 */
export function getSocialStudiesFilename(dataSourceId: string): string {
  const source = SOCIAL_STUDIES_DATA_SOURCES.find((s) => s.id === dataSourceId);
  return source?.filename || 'all-social-studies.csv';
}
