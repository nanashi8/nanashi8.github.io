import type { ClauseSegment, SVOCMComponent } from '@/types/passage';

export type SvocmToken = {
  word: string;
  component?: SVOCMComponent;
  /** bracket/marker tokens we inject for display */
  isMarker?: boolean;
};

export type SvocmChunk = {
  text: string;
  component?: SVOCMComponent;
};

const PUNCT = /^[.,!?;:]$/;
const CLOSE_BRACKET = /^[)\]>]$/;
const OPEN_BRACKET = /^[[(<]$/;

function isPunct(word: string): boolean {
  return PUNCT.test(word);
}

function isClose(word: string): boolean {
  return CLOSE_BRACKET.test(word);
}

function isOpen(word: string): boolean {
  return OPEN_BRACKET.test(word);
}

function shouldPrefixSpace(prev: SvocmToken | null, cur: SvocmToken): boolean {
  if (!prev) return false;

  // phrase markers: "< at seven >" のように常にスペースを入れる
  if (prev.isMarker && prev.word === '<') return true;
  if (cur.isMarker && cur.word === '>') return true;

  // 基本: 句読点の前にはスペースを入れない
  if (isPunct(cur.word)) {
    // ただし直前がマーカー閉じ（> や )）のときは読みやすさのためスペースを入れる
    if (prev.isMarker && isClose(prev.word)) return true;
    return false;
  }
  // 閉じ括弧の前にはスペースを入れない
  if (isClose(cur.word)) return false;
  // 開き括弧の直後（prevが開き括弧）にはスペースを入れない
  if (isOpen(prev.word)) return false;
  return true;
}

/**
 * ClauseSegment 構造を表示用トークン列にフラット化する。
 * - subordinate-clause: ( ... )
 * - phrase: < ... >
 */
export function flattenClauseSegments(segments: ClauseSegment[]): SvocmToken[] {
  const out: SvocmToken[] = [];

  const visit = (seg: ClauseSegment) => {
    if (seg.type === 'subordinate-clause') {
      out.push({ word: '(', isMarker: true });
      (seg.children ?? []).forEach(visit);
      out.push({ word: ')', isMarker: true });
      return;
    }

    if (seg.type === 'phrase') {
      out.push({ word: '<', isMarker: true });
      seg.words.forEach((w) => out.push({ word: w.word, component: w.component }));
      out.push({ word: '>', isMarker: true });
      return;
    }

    if (seg.children && seg.children.length > 0) {
      seg.children.forEach(visit);
      return;
    }

    seg.words.forEach((w) => out.push({ word: w.word, component: w.component }));
  };

  segments.forEach(visit);
  return out;
}

/**
 * トークン列を「スペース込みのテキスト」に変換し、
 * 連続する同一SVOCM component を1チャンクにマージする。
 */
export function mergeSvocmChunks(tokens: SvocmToken[]): SvocmChunk[] {
  const chunks: SvocmChunk[] = [];
  let prev: SvocmToken | null = null;

  for (const t of tokens) {
    const prefix = shouldPrefixSpace(prev, t) ? ' ' : '';
    const pieceText = `${prefix}${t.word}`;

    const component = t.isMarker ? undefined : t.component;
    const last = chunks[chunks.length - 1];

    if (last && last.component === component) {
      last.text += pieceText;
    } else {
      chunks.push({ text: pieceText, component });
    }

    prev = t;
  }

  return chunks;
}
