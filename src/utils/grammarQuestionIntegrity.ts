export type IntegrityIssue =
  | 'missing_id'
  | 'missing_japanese'
  | 'missing_type'
  | 'missing_correct_answer'
  | 'missing_words'
  | 'choices_missing'
  | 'choices_missing_correct_answer'
  | 'answer_leaks_in_passage'
  | 'answer_leaks_in_sentence'
  | 'answer_leaks_in_sentence_auto_masked'
  | 'ordering_answer_mismatch_words'
  | 'ordering_answer_missing_punctuation_only';

export interface IntegrityReport {
  ok: boolean;
  fatalIssues: IntegrityIssue[];
  warnings: IntegrityIssue[];
}

function stripTerminalPunctuation(text: string): string {
  return text.replace(/[\s]*[.,!?;:]+\s*$/g, '').trim();
}

function tokenizeForWordSet(text: string): string[] {
  const base = stripTerminalPunctuation(String(text || '').trim());
  if (!base) return [];
  const cleanToken = (t: string): string => {
    // Remove surrounding punctuation but keep apostrophes (aren't, I'm).
    return t.replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, '');
  };

  return base
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => cleanToken(t).toLowerCase())
    .filter(Boolean);
}

function multisetCounts(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) {
    m.set(t, (m.get(t) || 0) + 1);
  }
  return m;
}

function multisetEquals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const ma = multisetCounts(a);
  const mb = multisetCounts(b);
  if (ma.size !== mb.size) return false;
  for (const [k, va] of ma.entries()) {
    if (mb.get(k) !== va) return false;
  }
  return true;
}

function multisetContains(container: string[], subset: string[]): boolean {
  const mc = multisetCounts(container);
  const ms = multisetCounts(subset);
  for (const [k, vs] of ms.entries()) {
    const vc = mc.get(k) || 0;
    if (vc < vs) return false;
  }
  return true;
}

function includesAsWholeWordCaseInsensitive(haystack: string, needle: string): boolean {
  const n = String(needle || '').trim();
  if (!n) return false;
  // Very short answers (e.g., is/am/are) are common substrings in passages; don't treat as leak.
  if (n.length < 3) return false;

  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // NOTE: When building RegExp from string, the string must contain "\\b" (backslash+b).
  // In a JS string literal/template, that means writing "\\\\b".
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  return re.test(String(haystack || ''));
}

function lastIndexOfCaseInsensitive(haystack: string, needle: string): number {
  return haystack.toLowerCase().lastIndexOf(needle.toLowerCase());
}

function maskLastOccurrence(passage: string, phrase: string, mask = '____'): string {
  const idx = lastIndexOfCaseInsensitive(passage, phrase);
  if (idx < 0) return passage;
  return passage.slice(0, idx) + mask + passage.slice(idx + phrase.length);
}

export function getSentenceOrderingCorrectAnswer(q: any): string | undefined {
  if (!q) return undefined;
  const correctOrder = q?.correctOrder;
  const correctOrderStr =
    typeof correctOrder === 'string'
      ? correctOrder
      : Array.isArray(correctOrder)
        ? correctOrder.join(' ')
        : undefined;
  // NOTE: sentenceOrdering の words は通常「シャッフル済み選択肢」なので、正解文の推定には使わない
  return (
    (q?.correctAnswer || correctOrderStr || q?.sentence || q?.question || '')
      .trim()
      .replace(/\s+/g, ' ') || undefined
  );
}

/**
 * 強制装置: 文法問題が「問題として成立」しているか検査し、必要なら最小限の自動修正（漏れマスク）を行う。
 * - 壊れている（致命的）: 出題から除外できるよう fatalIssues を返す
 * - 不具合だが自動で守れる: warnings を返す（例: passage に正解文が含まれる）
 */
export function validateAndSanitizeGrammarQuestion(input: any): {
  question: any;
  report: IntegrityReport;
} {
  const q = { ...input };
  const fatalIssues: IntegrityIssue[] = [];
  const warnings: IntegrityIssue[] = [];

  if (!q?.id) fatalIssues.push('missing_id');
  if (!q?.japanese) fatalIssues.push('missing_japanese');
  if (!q?.type) warnings.push('missing_type');

  const type = String(q?.type || '');

  // Type-specific validation
  if (type === 'sentenceOrdering') {
    const words = q?.words;
    if (!Array.isArray(words) || words.length === 0) fatalIssues.push('missing_words');

    const correctAnswer = getSentenceOrderingCorrectAnswer(q);
    if (!correctAnswer) {
      fatalIssues.push('missing_correct_answer');
    } else {
      // Check passage leak (data defect). UI masks it, but keep warning.
      if (typeof q?.passage === 'string' && q.passage.trim()) {
        const base = correctAnswer.trim();
        const baseNoPunct = stripTerminalPunctuation(base);
        const leaks =
          lastIndexOfCaseInsensitive(q.passage, base) >= 0 ||
          (baseNoPunct && lastIndexOfCaseInsensitive(q.passage, baseNoPunct) >= 0);
        if (leaks) warnings.push('answer_leaks_in_passage');
      }

      // Check consistency: words should contain the same tokens as the correct answer (order doesn't matter).
      // The words array is typically shuffled for display.
      if (Array.isArray(words) && words.length > 0) {
        const answerTokens = tokenizeForWordSet(correctAnswer);
        const wordTokens = words
          .map((w: any) => String(w ?? '').trim())
          .filter(Boolean)
          .map((w) => w.replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, '').toLowerCase())
          .filter(Boolean);

        if (answerTokens.length > 0 && wordTokens.length > 0) {
          const unusedWords =
            typeof (q as any)?.unusedWords === 'number' ? (q as any).unusedWords : 0;

          // Some sentenceOrdering questions intentionally include distractor words (unusedWords > 0).
          // In that case, we only require that the answer tokens are a multiset-subset of the provided words.
          if (unusedWords > 0) {
            const contains = multisetContains(wordTokens, answerTokens);
            const extraCount = wordTokens.length - answerTokens.length;
            if (!contains || (Number.isFinite(unusedWords) && extraCount !== unusedWords)) {
              warnings.push('ordering_answer_mismatch_words');
            }
          } else {
            if (!multisetEquals(answerTokens, wordTokens)) {
              warnings.push('ordering_answer_mismatch_words');
            }
          }
        }
      }
    }

    // Ensure we don't accidentally display an English answer in a Japanese prompt
    if (typeof q?.japanese === 'string') {
      const ca = getSentenceOrderingCorrectAnswer(q);
      if (ca && lastIndexOfCaseInsensitive(q.japanese, ca) >= 0) {
        warnings.push('answer_leaks_in_sentence');
      }
    }
  } else if (type === 'fillInBlank' || type === 'verbForm') {
    const correctAnswer = String(q?.correctAnswer || '').trim();
    if (!correctAnswer) fatalIssues.push('missing_correct_answer');

    const choices = q?.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      fatalIssues.push('choices_missing');
    } else if (correctAnswer && !choices.includes(correctAnswer)) {
      fatalIssues.push('choices_missing_correct_answer');
    }

    // Leak guard: if the sentence contains the correct answer (and no blank), mask it.
    if (typeof q?.sentence === 'string' && correctAnswer) {
      const hasBlank = /_{2,}/.test(q.sentence);
      const containsAnswer = lastIndexOfCaseInsensitive(q.sentence, correctAnswer) >= 0;
      if (containsAnswer && !hasBlank) {
        warnings.push('answer_leaks_in_sentence');
        q.sentence = maskLastOccurrence(q.sentence, correctAnswer, '____');
        warnings.push('answer_leaks_in_sentence_auto_masked');
      }
    }

    // Passage leak is also possible; warn only when it looks like a whole-word leak.
    if (typeof q?.passage === 'string' && q.passage.trim() && correctAnswer) {
      const base = correctAnswer.trim();
      const baseNoPunct = stripTerminalPunctuation(base);
      const leaks =
        includesAsWholeWordCaseInsensitive(q.passage, base) ||
        (baseNoPunct && includesAsWholeWordCaseInsensitive(q.passage, baseNoPunct));
      if (leaks) warnings.push('answer_leaks_in_passage');
    }
  } else {
    // Unknown types: require at least a correctAnswer if it exists in schema.
    if (q?.correctAnswer == null && q?.words == null) {
      warnings.push('missing_correct_answer');
    }
  }

  return {
    question: q,
    report: {
      ok: fatalIssues.length === 0,
      fatalIssues,
      warnings,
    },
  };
}
