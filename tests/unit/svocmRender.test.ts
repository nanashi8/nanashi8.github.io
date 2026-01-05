import { describe, it, expect } from 'vitest';
import type { SVOCMComponent } from '@/types/passage';
import { mergeSvocmChunks } from '@/utils/svocmRender';

describe('svocmRender.mergeSvocmChunks', () => {
  it('merges consecutive tokens of same SVOCM component into continuous underlined chunks', () => {
    const tokens = [
      { word: 'I', component: 'S' as SVOCMComponent },
      { word: 'wake', component: 'V' as SVOCMComponent },
      { word: 'up', component: 'V' as SVOCMComponent },
      { word: '<', isMarker: true },
      { word: 'at', component: 'M' as SVOCMComponent },
      { word: 'seven', component: 'M' as SVOCMComponent },
      { word: '>', isMarker: true },
      { word: '.', isMarker: true },
    ];

    const chunks = mergeSvocmChunks(tokens as any);
    const texts = chunks.map((c) => c.text);

    // spacing sanity
    expect(texts.join('')).toBe('I wake up < at seven > .');

    // SVOCM chunk merging: V should contain " wake up"
    const vChunk = chunks.find((c) => c.component === 'V');
    expect(vChunk?.text).toBe(' wake up');

    const mChunk = chunks.find((c) => c.component === 'M');
    expect(mChunk?.text).toBe(' at seven');
  });

  it('does not insert a space before punctuation, except after closing markers', () => {
    const tokens = [
      { word: 'morning', component: 'M' as SVOCMComponent },
      { word: '>', isMarker: true },
      { word: '.', isMarker: true },
      { word: 'First', component: undefined },
      { word: ',', isMarker: true },
      { word: 'I', component: 'S' as SVOCMComponent },
    ];
    const chunks = mergeSvocmChunks(tokens as any);
    expect(chunks.map((c) => c.text).join('')).toBe('morning > . First, I');
  });
});
