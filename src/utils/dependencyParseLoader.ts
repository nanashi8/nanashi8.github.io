import { logger } from '@/utils/logger';
import type { DependencyParsedPassage, DependencyParsedSentence } from '@/types/passage';

function normalizeSentenceKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s.,?!]+/g, ' ')
    .trim();
}

export async function loadDependencyParsedPassage(
  passageId: string
): Promise<DependencyParsedPassage | null> {
  try {
    const res = await fetch(`/data/passage-parses/${passageId}.json`);
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as DependencyParsedPassage;
  } catch (err) {
    logger.warn(`[UD] Failed to load dependency parse for ${passageId}:`, err);
    return null;
  }
}

export function findDependencySentenceByText(
  parsed: DependencyParsedPassage,
  sentenceText: string
): DependencyParsedSentence | null {
  const key = normalizeSentenceKey(sentenceText);
  const exact = parsed.sentences.find((s) => normalizeSentenceKey(s.text) === key);
  if (exact) return exact;

  // フォールバック: 空白正規化のみで比較
  const softKey = sentenceText.toLowerCase().replace(/\s+/g, ' ').trim();
  const soft = parsed.sentences.find(
    (s) => s.text.toLowerCase().replace(/\s+/g, ' ').trim() === softKey
  );
  return soft ?? null;
}
