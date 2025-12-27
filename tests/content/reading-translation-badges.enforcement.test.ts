import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

// 🔒 強制装置: 長文タブ「文の読解」内の直訳/日本語訳バッジと訳品質文言を必須化
// UI変更で誤って削除されないよう、ソースに対して検査する（巨大コンポーネントの描画テストを避ける）。

describe('🔒 enforcement: ComprehensiveReadingView translation badges', () => {
  it('contains literal/Japanese badges and translation-quality note', async () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/ComprehensiveReadingView.tsx'
    );
    const content = await fs.readFile(filePath, 'utf8');

    expect(content).toContain('data-testid="literal-translation-badge"');
    expect(content).toContain('data-testid="japanese-translation-badge"');

    // 品質文言（日本語）の存在を強制
    expect(content).toContain('訳の品質:');
    expect(content).toContain('英語のニュアンス');
  });
});
