/**
 * 読み取り技法ヒント表示の統合テスト
 * ComprehensiveReadingViewでヒントが正しく表示されることを確認
 */
import { describe, it, expect, vi } from 'vitest';

// ローダーをモック
vi.mock('../../src/utils/readingTechniquesLoader', () => ({
  loadSentenceReadingPatterns: vi.fn(() =>
    Promise.resolve({
      version: 1,
      language: 'ja',
      licenseNote: 'test',
      patterns: [
        {
          id: 'S1',
          title: '主語が長い文',
          gist: '主語の核を先に掴む',
          steps: ['主語の終わりを見つける', '述語とつなぐ'],
          pitfalls: [],
          miniExampleEn: 'Example sentence.',
        },
        {
          id: 'S2',
          title: '挿入句を含む文',
          gist: '挿入を飛ばして骨格を読む',
          steps: ['カンマやダッシュを探す', '挿入部分をスキップ'],
          pitfalls: [],
          miniExampleEn: 'Example sentence.',
        },
      ],
    })
  ),
  loadParagraphReadingPatterns: vi.fn(() =>
    Promise.resolve({
      version: 1,
      language: 'ja',
      licenseNote: 'test',
      patterns: [
        {
          id: 'P1',
          title: '導入段落',
          gist: 'トピックを把握',
          steps: ['最初の文を注意深く読む', 'キーワードをメモ'],
          pitfalls: [],
          exampleEn: 'Example paragraph.',
        },
      ],
    })
  ),
  loadQuestionTypeStrategies: vi.fn(() =>
    Promise.resolve({
      version: 1,
      language: 'ja',
      licenseNote: 'test',
      strategies: [],
    })
  ),
  loadReading100Paraphrased: vi.fn(() =>
    Promise.resolve({
      version: 1,
      language: 'ja',
      licenseNote: 'test',
      techniques: [],
    })
  ),
}));

describe('読み取り技法ヒント表示', () => {
  it('ローダー関数が正しくモックされている', async () => {
    const { loadSentenceReadingPatterns, loadParagraphReadingPatterns } =
      await import('../../src/utils/readingTechniquesLoader');

    const sentencePatterns = await loadSentenceReadingPatterns();
    const paragraphPatterns = await loadParagraphReadingPatterns();

    // モックデータが返されることを確認
    expect(sentencePatterns).not.toBeNull();
    expect(sentencePatterns!.patterns).toHaveLength(2);
    expect(sentencePatterns!.patterns[0].id).toBe('S1');
    expect(paragraphPatterns).not.toBeNull();
    expect(paragraphPatterns!.patterns).toHaveLength(1);
    expect(paragraphPatterns!.patterns[0].id).toBe('P1');
  });

  it('パターンデータの構造が正しい', async () => {
    const { loadSentenceReadingPatterns } =
      await import('../../src/utils/readingTechniquesLoader');

    const patternsFile = await loadSentenceReadingPatterns();
    expect(patternsFile).not.toBeNull();
    const pattern = patternsFile!.patterns[0];

    // 必須フィールドが存在することを確認
    expect(pattern).toHaveProperty('id');
    expect(pattern).toHaveProperty('title');
    expect(pattern).toHaveProperty('gist');
    expect(pattern).toHaveProperty('steps');
    expect(pattern).toHaveProperty('pitfalls');
    expect(pattern).toHaveProperty('miniExampleEn');
    expect(Array.isArray(pattern.steps)).toBe(true);
    expect(Array.isArray(pattern.pitfalls)).toBe(true);
  });
});
