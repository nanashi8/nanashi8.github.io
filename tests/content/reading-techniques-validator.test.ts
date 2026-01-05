import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

function loadJson<T = unknown>(relativePath: string): T {
  const raw = readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
  return JSON.parse(raw) as T;
}

function assertUniqueIds(items: Array<{ id: string }>, label: string) {
  const ids = items.map((x) => x.id);
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) dup.push(id);
    seen.add(id);
  }
  expect(dup, `${label}: duplicate ids`).toEqual([]);
}

describe('reading-techniques public data', () => {
  it('paragraph patterns are valid and stable', () => {
    const data = loadJson<any>('../../public/data/reading-techniques/paragraph_reading_patterns.json');
    expect(Array.isArray(data.patterns)).toBe(true);
    expect(data.patterns.length).toBe(100);
    assertUniqueIds(data.patterns, 'paragraph_reading_patterns');
  });

  it('sentence patterns are valid and stable', () => {
    const data = loadJson<any>('../../public/data/reading-techniques/sentence_reading_patterns.json');
    expect(Array.isArray(data.patterns)).toBe(true);
    expect(data.patterns.length).toBe(100);
    assertUniqueIds(data.patterns, 'sentence_reading_patterns');
  });

  it('question type strategies are valid and stable', () => {
    const data = loadJson<any>('../../public/data/reading-techniques/question_type_strategies.json');
    expect(Array.isArray(data.strategies)).toBe(true);
    expect(data.strategies.length).toBe(100);
    assertUniqueIds(data.strategies, 'question_type_strategies');
  });

  it('reading100 paraphrased techniques are valid and stable', () => {
    const data = loadJson<any>('../../public/data/reading-techniques/reading100_paraphrased.json');
    expect(Array.isArray(data.techniques)).toBe(true);
    expect(data.techniques.length).toBe(100);
    assertUniqueIds(data.techniques, 'reading100_paraphrased');
  });
});
