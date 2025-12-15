import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function exists(p: string) {
  return fs.existsSync(path.resolve(p));
}

describe('Docs integrity and relocation safety', () => {
  it('keeps integrated quality pipeline at new location', () => {
    expect(
      exists('/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/docs/quality/INTEGRATED_QUALITY_PIPELINE.md')
    ).toBe(true);
  });

  it('old path removed after relocation', () => {
    const oldPath = '/Users/yuichinakamura/Documents/nanashi8-github-io-git/docs/INTEGRATED_QUALITY_PIPELINE.md';
    expect(exists(oldPath)).toBe(false);
  });

  it('core guides remain present', () => {
    // Keep TDD guide and testing summaries
    expect(
      exists('/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/docs/processes/TDD_GUIDE.md')
    ).toBe(true);
    expect(
      exists('/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/docs/reports/PYTHON_TEST_IMPLEMENTATION_SUMMARY.md')
    ).toBe(true);
  });
});
