import { logger } from '@/utils/logger';
import type {
  ParagraphReadingPatternsFileV1,
  SentenceReadingPatternsFileV1,
  QuestionTypeStrategiesFileV1,
  Reading100ParaphrasedFileV1,
} from '@/types/readingTechniques';

type CacheKey =
  | 'paragraph_reading_patterns'
  | 'sentence_reading_patterns'
  | 'question_type_strategies'
  | 'reading100_paraphrased';

const cache = new Map<CacheKey, Promise<unknown | null>>();

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    logger.warn(`[readingTechniquesLoader] Failed to load ${path}:`, err);
    return null;
  }
}

function cached<T>(key: CacheKey, path: string): Promise<T | null> {
  if (!cache.has(key)) {
    cache.set(key, fetchJson<T>(path));
  }
  return cache.get(key) as Promise<T | null>;
}

function parseTrailingNumber(id: string): number | null {
  const match = id.match(/(\d+)$/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function sortByIdNumber<T extends { id: string }>(items: T[]): T[] {
  return items
    .slice()
    .sort((a, b) => (parseTrailingNumber(a.id) ?? Number.POSITIVE_INFINITY) - (parseTrailingNumber(b.id) ?? Number.POSITIVE_INFINITY));
}

export function loadParagraphReadingPatterns(): Promise<ParagraphReadingPatternsFileV1 | null> {
  return cached<ParagraphReadingPatternsFileV1>(
    'paragraph_reading_patterns',
    '/data/reading-techniques/paragraph_reading_patterns.json'
  ).then((data) => {
    if (!data) return null;
    return { ...data, patterns: sortByIdNumber(data.patterns) };
  });
}

export function loadSentenceReadingPatterns(): Promise<SentenceReadingPatternsFileV1 | null> {
  return cached<SentenceReadingPatternsFileV1>(
    'sentence_reading_patterns',
    '/data/reading-techniques/sentence_reading_patterns.json'
  ).then((data) => {
    if (!data) return null;
    return { ...data, patterns: sortByIdNumber(data.patterns) };
  });
}

export function loadQuestionTypeStrategies(): Promise<QuestionTypeStrategiesFileV1 | null> {
  return cached<QuestionTypeStrategiesFileV1>(
    'question_type_strategies',
    '/data/reading-techniques/question_type_strategies.json'
  ).then((data) => {
    if (!data) return null;
    return { ...data, strategies: sortByIdNumber(data.strategies) };
  });
}

export function loadReading100Paraphrased(): Promise<Reading100ParaphrasedFileV1 | null> {
  return cached<Reading100ParaphrasedFileV1>(
    'reading100_paraphrased',
    '/data/reading-techniques/reading100_paraphrased.json'
  ).then((data) => {
    if (!data) return null;
    return {
      ...data,
      techniques: data.techniques
        .slice()
        .sort((a, b) => (a.originIndex ?? parseTrailingNumber(a.id) ?? 0) - (b.originIndex ?? parseTrailingNumber(b.id) ?? 0)),
    };
  });
}
