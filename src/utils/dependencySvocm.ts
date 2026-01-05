import type { DependencyToken, SVOCMComponent } from '@/types/passage';

export function mapDependencyTokensToSVOCMByStartIndex(
  tokens: DependencyToken[]
): Map<number, SVOCMComponent> {
  const byId = new Map<number, DependencyToken>();
  const childrenByHead = new Map<number, number[]>();
  const roleById = new Map<number, SVOCMComponent>();

  for (const t of tokens) {
    byId.set(t.id, t);
    const head = typeof t.head === 'number' ? t.head : 0;
    const arr = childrenByHead.get(head) ?? [];
    arr.push(t.id);
    childrenByHead.set(head, arr);
  }

  const deprelLower = (t: DependencyToken) => (t.deprel ?? '').toLowerCase();
  const uposUpper = (t: DependencyToken) => (t.upos ?? '').toUpperCase();
  const isPunct = (t: DependencyToken) => uposUpper(t) === 'PUNCT' || deprelLower(t) === 'punct';

  const root = tokens.find((t) => (t.head ?? 0) === 0) ?? tokens[0];
  if (!root) return new Map();

  const findChild = (headId: number, deprel: string): DependencyToken | undefined => {
    const kids = childrenByHead.get(headId) ?? [];
    for (const id of kids) {
      const tok = byId.get(id);
      if (tok && deprelLower(tok) === deprel) return tok;
    }
    return undefined;
  };

  const collectSubtree = (headId: number, excludeDeprels?: Set<string>): number[] => {
    const out: number[] = [];
    const stack = [headId];
    while (stack.length) {
      const cur = stack.pop()!;
      out.push(cur);
      const kids = childrenByHead.get(cur) ?? [];
      for (const k of kids) {
        const tok = byId.get(k);
        if (!tok) continue;
        if (excludeDeprels && excludeDeprels.has(deprelLower(tok))) continue;
        stack.push(k);
      }
    }
    return out;
  };

  const cop = findChild(root.id, 'cop');
  const isCopular = !!cop && ['NOUN', 'PROPN', 'ADJ'].includes(uposUpper(root));

  // S (主語)
  for (const t of tokens) {
    const rel = deprelLower(t);
    if (rel === 'nsubj' || rel === 'nsubj:pass' || rel === 'csubj') {
      for (const id of collectSubtree(t.id)) {
        const tok = byId.get(id);
        if (!tok || isPunct(tok)) continue;
        roleById.set(id, 'S');
      }
    }
  }

  // O (目的語)
  for (const t of tokens) {
    const rel = deprelLower(t);
    if (rel === 'obj' || rel === 'iobj') {
      for (const id of collectSubtree(t.id)) {
        const tok = byId.get(id);
        if (!tok || isPunct(tok)) continue;
        roleById.set(id, 'O');
      }
    }
  }

  // C (補語)
  if (isCopular) {
    const exclude = new Set<string>(['cop', 'punct']);
    for (const id of collectSubtree(root.id, exclude)) {
      const tok = byId.get(id);
      if (!tok || isPunct(tok)) continue;
      // 既に主語(S)や目的語(O)などが付いている場合は上書きしない
      if (!roleById.has(id)) roleById.set(id, 'C');
    }
  }

  // V (動詞)
  if (isCopular && cop) {
    roleById.set(cop.id, 'V');
  } else {
    if (!isPunct(root)) roleById.set(root.id, 'V');

    // 句動詞の一部（compound:prt）も動詞として扱う
    // 例: wake up, get up, put on など
    for (const t of tokens) {
      const rel = deprelLower(t);
      if (rel === 'compound:prt') {
        roleById.set(t.id, 'V');
      }
    }
  }

  // C (補語/補部) - B方針: 結果補語・目的語補語もCとして扱う
  // 例: get my bag ready / make him happy / keep the door open
  // UDでは ready/happy/open が xcomp (ADJ/NOUN 等) になりやすい
  if (!isCopular) {
    for (const t of tokens) {
      const rel = deprelLower(t);
      if (rel !== 'xcomp') continue;

      const upos = uposUpper(t);
      // 動詞のxcomp（to do等）まで広げると誤爆しやすいので、まずは形容詞/名詞系に限定
      const looksLikeComplement = upos === 'ADJ' || upos === 'NOUN' || upos === 'PROPN';
      if (!looksLikeComplement) continue;

      for (const id of collectSubtree(t.id)) {
        const tok = byId.get(id);
        if (!tok || isPunct(tok)) continue;
        // 既にS/O/V等が付いている場合は上書きしない
        if (!roleById.has(id)) roleById.set(id, 'C');
      }
    }
  }

  // その他はM（句読点は除外）
  for (const t of tokens) {
    if (isPunct(t)) continue;
    if (!roleById.has(t.id)) roleById.set(t.id, 'M');
  }

  const out = new Map<number, SVOCMComponent>();
  for (const t of tokens) {
    const role = roleById.get(t.id);
    if (!role) continue;
    out.set(t.start, role);
  }
  return out;
}
