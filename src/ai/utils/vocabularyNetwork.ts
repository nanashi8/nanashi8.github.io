import type { Question } from '@/types';
import type { WordRelationship, WordRelation } from '@/types/learningEfficiency';
import { loadWordRelations, saveWordRelations } from '@/storage/learningEfficiency';
import { logger } from '@/utils/logger';

const DEFAULT_TOP_K = 30;
const DEFAULT_NEIGHBORS_PER_GROUP = 12;
const DEFAULT_MIN_BASE_STRENGTH_FOR_PERSONAL_UPDATE = 45;

const MIN_STRENGTH_TO_KEEP = 18;
const MIN_STRENGTH_TO_KEEP_IF_BAD = 40;
const MIN_SAMPLES_FOR_PRUNE = 8;
const BAD_SUCCESS_RATE = 0.2;
const DECAY_INTERVAL_DAYS = 7;
const DECAY_STRENGTH_STEP = 1;

const PERSONAL_STRENGTH_DELTA_INCORRECT = 2;
const PERSONAL_STRENGTH_DELTA_CORRECT = -1;
const PERSONAL_SUCCESS_RATE_ALPHA = 0.12;

let cachedNetwork: WordRelationship[] | null = null;
let cachedIndex: Map<string, WordRelationship> | null = null;
let cachedLookup: Map<string, Map<string, number>> | null = null;
let precomputeScheduled = false;
let pendingSaveScheduled = false;
let dirtyNetwork = false;

let lastDecayAt = 0;

const PERF_KEY = 'debug_vocabulary_network_perf';
const PERF_HISTORY_MAX = 50;

type PerfEvent = 'lookup_build' | 'lookup_hit' | 'answer_update' | 'scheduler_reorder';

type VocabularyNetworkPerf = {
  updatedAt: number;
  counters: {
    lookupBuildCount: number;
    lookupHitCount: number;
    answerUpdateCount: number;
    answerUpdateTotalMs: number;
    answerUpdateMaxMs: number;
    schedulerReorderCount: number;
    schedulerReorderTotalMs: number;
    schedulerReorderMaxMs: number;
  };
  history: Array<{
    at: number;
    event: PerfEvent;
    ms?: number;
    meta?: Record<string, unknown>;
  }>;
};

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function createEmptyPerf(): VocabularyNetworkPerf {
  return {
    updatedAt: Date.now(),
    counters: {
      lookupBuildCount: 0,
      lookupHitCount: 0,
      answerUpdateCount: 0,
      answerUpdateTotalMs: 0,
      answerUpdateMaxMs: 0,
      schedulerReorderCount: 0,
      schedulerReorderTotalMs: 0,
      schedulerReorderMaxMs: 0,
    },
    history: [],
  };
}

function loadPerf(): VocabularyNetworkPerf {
  try {
    const raw = localStorage.getItem(PERF_KEY);
    if (!raw) return createEmptyPerf();
    const parsed = JSON.parse(raw) as VocabularyNetworkPerf;
    if (!parsed?.counters || !Array.isArray(parsed?.history)) return createEmptyPerf();
    return parsed;
  } catch {
    return createEmptyPerf();
  }
}

function savePerf(perf: VocabularyNetworkPerf): void {
  try {
    perf.updatedAt = Date.now();
    while (perf.history.length > PERF_HISTORY_MAX) perf.history.shift();
    localStorage.setItem(PERF_KEY, JSON.stringify(perf));
  } catch {
    // ignore
  }
}

function recordPerf(event: PerfEvent, ms?: number, meta?: Record<string, unknown>): void {
  const perf = loadPerf();

  if (event === 'lookup_build') perf.counters.lookupBuildCount += 1;
  if (event === 'lookup_hit') perf.counters.lookupHitCount += 1;

  if (event === 'answer_update') {
    perf.counters.answerUpdateCount += 1;
    if (typeof ms === 'number' && Number.isFinite(ms)) {
      perf.counters.answerUpdateTotalMs += ms;
      perf.counters.answerUpdateMaxMs = Math.max(perf.counters.answerUpdateMaxMs, ms);
    }
  }

  if (event === 'scheduler_reorder') {
    perf.counters.schedulerReorderCount += 1;
    if (typeof ms === 'number' && Number.isFinite(ms)) {
      perf.counters.schedulerReorderTotalMs += ms;
      perf.counters.schedulerReorderMaxMs = Math.max(perf.counters.schedulerReorderMaxMs, ms);
    }
  }

  perf.history.push({ at: Date.now(), event, ms, meta });
  savePerf(perf);
}

export function recordVocabularyNetworkSchedulerPerf(meta: {
  ms: number;
  topCount: number;
  buckets: number;
  usedReorder: boolean;
}): void {
  recordPerf('scheduler_reorder', meta.ms, meta);
}

function parseRelatedFields(q: Question): string[] {
  if (typeof q.relatedFields !== 'string') return ['その他'];
  const fields = q.relatedFields
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  return fields.length > 0 ? fields : ['その他'];
}

function addRelation(
  map: Map<string, Map<string, WordRelation>>,
  from: string,
  to: string,
  relation: WordRelation
): void {
  if (from === to) return;
  if (!map.has(from)) map.set(from, new Map());

  const inner = map.get(from)!;
  const existing = inner.get(to);

  if (!existing || relation.strength > existing.strength) {
    inner.set(to, relation);
  }
}

function buildSparseVocabularyNetwork(
  questions: Question[],
  options?: {
    topK?: number;
    neighborsPerGroup?: number;
  }
): WordRelationship[] {
  const topK = options?.topK ?? DEFAULT_TOP_K;
  const neighborsPerGroup = options?.neighborsPerGroup ?? DEFAULT_NEIGHBORS_PER_GROUP;

  const byCategory = new Map<string, string[]>();
  const byPrefix = new Map<string, string[]>();
  const bySuffix = new Map<string, string[]>();
  const byStem4 = new Map<string, string[]>();

  const words = questions.map((q) => q.word);

  // インデックス作成（O(n)）
  for (const q of questions) {
    const w = q.word;

    for (const cat of parseRelatedFields(q)) {
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(w);
    }

    const lower = w.toLowerCase();

    const prefixes = ['un', 're', 'dis', 'pre', 'post', 'anti', 'de'];
    for (const p of prefixes) {
      if (lower.startsWith(p) && lower.length > p.length + 2) {
        if (!byPrefix.has(p)) byPrefix.set(p, []);
        byPrefix.get(p)!.push(w);
      }
    }

    const suffixes = ['ing', 'ed', 'er', 'tion', 'ness', 'ly', 'ful', 'less'];
    for (const s of suffixes) {
      if (lower.endsWith(s) && lower.length > s.length + 2) {
        if (!bySuffix.has(s)) bySuffix.set(s, []);
        bySuffix.get(s)!.push(w);
      }
    }

    if (lower.length >= 4) {
      const stem = lower.slice(0, 4);
      if (!byStem4.has(stem)) byStem4.set(stem, []);
      byStem4.get(stem)!.push(w);
    }
  }

  const relationsMap = new Map<string, Map<string, WordRelation>>();

  // カテゴリー近傍（O(n * neighborsPerGroup)）
  for (const [, list] of byCategory) {
    for (let i = 0; i < list.length; i++) {
      const from = list[i];
      for (let j = i + 1; j < Math.min(list.length, i + 1 + neighborsPerGroup); j++) {
        const to = list[j];
        const relation: WordRelation = {
          relatedWord: to,
          relationType: 'category',
          strength: 70,
        };
        addRelation(relationsMap, from, to, relation);
        addRelation(relationsMap, to, from, { ...relation, relatedWord: from });
      }
    }
  }

  // 派生近傍（prefix/suffix/stem）（O(n * neighborsPerGroup)）
  const connectGroup = (
    group: string[],
    strength: number,
    relationType: WordRelation['relationType']
  ) => {
    for (let i = 0; i < group.length; i++) {
      const from = group[i];
      for (let j = i + 1; j < Math.min(group.length, i + 1 + neighborsPerGroup); j++) {
        const to = group[j];
        const relation: WordRelation = {
          relatedWord: to,
          relationType,
          strength,
        };
        addRelation(relationsMap, from, to, relation);
        addRelation(relationsMap, to, from, { ...relation, relatedWord: from });
      }
    }
  };

  for (const [, group] of byPrefix) connectGroup(group, 60, 'derivation');
  for (const [, group] of bySuffix) connectGroup(group, 55, 'derivation');
  for (const [, group] of byStem4) {
    if (group.length >= 4) connectGroup(group, 65, 'derivation');
  }

  // WordRelationship配列化（上位Kにスパース化）
  const now = Date.now();
  const network: WordRelationship[] = words.map((w) => {
    const rels = Array.from(relationsMap.get(w)?.values() ?? []);
    rels.sort((a, b) => b.strength - a.strength);

    return {
      word: w,
      relations: rels.slice(0, topK),
      updatedAt: now,
    };
  });

  return network;
}

function scheduleIdle(fn: () => void): void {
  // Safari等のためにフォールバック
  const ric = (window as any).requestIdleCallback as
    | ((cb: (deadline: { timeRemaining: () => number }) => void) => number)
    | undefined;

  if (typeof ric === 'function') {
    ric(() => fn());
  } else {
    window.setTimeout(() => fn(), 0);
  }
}

function clampStrength(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function findOrCreateRelation(
  rel: WordRelationship,
  relatedWord: string,
  relationType: WordRelation['relationType'],
  strengthFallback: number
): WordRelation {
  const existing = rel.relations.find((r) => r.relatedWord === relatedWord);
  if (existing) return existing;

  const created: WordRelation = {
    relatedWord,
    relationType,
    strength: clampStrength(strengthFallback),
    lastUpdatedAt: Date.now(),
    sampleCount: 0,
  };
  rel.relations.push(created);
  return created;
}

function trimTopK(rel: WordRelationship, topK: number): void {
  rel.relations.sort((a, b) => b.strength - a.strength);
  if (rel.relations.length > topK) rel.relations = rel.relations.slice(0, topK);
}

function ensureIndex(): Map<string, WordRelationship> {
  if (cachedIndex) return cachedIndex;
  const index = new Map<string, WordRelationship>();
  for (const rel of cachedNetwork ?? []) {
    index.set(rel.word, rel);
  }
  cachedIndex = index;
  return index;
}

function ensureLookup(): Map<string, Map<string, number>> {
  if (cachedLookup) return cachedLookup;
  const t0 = nowMs();
  const lookup = buildStrengthLookup(cachedNetwork ?? []);
  const t1 = nowMs();
  cachedLookup = lookup;
  recordPerf('lookup_build', t1 - t0, { words: cachedNetwork?.length ?? 0 });
  return lookup;
}

function updateLookupEdge(from: string, to: string, strength: number): void {
  if (!cachedLookup) return;
  if (!cachedLookup.has(from)) cachedLookup.set(from, new Map());
  cachedLookup.get(from)!.set(to, strength);
}

function getPairStrength(a: string, b: string): number {
  // 既にlookupがあるならO(1)
  if (cachedLookup) {
    const s1 = cachedLookup.get(a)?.get(b) ?? 0;
    const s2 = cachedLookup.get(b)?.get(a) ?? 0;
    return Math.max(s1, s2);
  }

  const index = ensureIndex();
  const ra = index.get(a);
  const rb = index.get(b);
  const s1 = ra?.relations.find((r) => r.relatedWord === b)?.strength ?? 0;
  const s2 = rb?.relations.find((r) => r.relatedWord === a)?.strength ?? 0;
  return Math.max(s1, s2);
}

function applyDecayAndPrune(rel: WordRelationship, now: number, topK: number): void {
  const since = lastDecayAt === 0 ? now : lastDecayAt;
  const days = (now - since) / (1000 * 60 * 60 * 24);
  if (days < DECAY_INTERVAL_DAYS) return;

  const decaySteps = Math.floor(days / DECAY_INTERVAL_DAYS);
  if (decaySteps <= 0) return;

  const pruned: WordRelation[] = [];
  for (const r of rel.relations) {
    const sr = r.successRate;
    const samples = r.sampleCount ?? 0;

    // 更新されていないリンクは徐々に減衰
    if (r.lastUpdatedAt && now - r.lastUpdatedAt > 1000 * 60 * 60 * 24 * DECAY_INTERVAL_DAYS) {
      let step = DECAY_STRENGTH_STEP * decaySteps;
      if (sr !== undefined && samples >= MIN_SAMPLES_FOR_PRUNE && sr <= BAD_SUCCESS_RATE) {
        step *= 2;
      }
      r.strength = clampStrength(r.strength - step);
    }

    // ノイズ剪定: 十分なサンプルがあり成功率が低いリンクは落とす
    if (sr !== undefined && samples >= MIN_SAMPLES_FOR_PRUNE && sr <= BAD_SUCCESS_RATE) {
      if (r.strength < MIN_STRENGTH_TO_KEEP_IF_BAD) continue;
    }

    if (r.strength < MIN_STRENGTH_TO_KEEP) continue;
    pruned.push(r);
  }

  rel.relations = pruned;
  trimTopK(rel, topK);
}

function scheduleSaveIfDirty(): void {
  if (!dirtyNetwork) return;
  if (pendingSaveScheduled) return;
  pendingSaveScheduled = true;

  scheduleIdle(() => {
    try {
      if (cachedNetwork && dirtyNetwork) {
        saveWordRelations(cachedNetwork);
        dirtyNetwork = false;
        logger.debug('[VocabularyNetwork] 個人別更新の保存完了', {
          words: cachedNetwork.length,
        });
      }
    } catch (e) {
      logger.warn('[VocabularyNetwork] 個人別更新の保存に失敗', e);
    } finally {
      pendingSaveScheduled = false;
    }
  });
}

/**
 * スケジューリング用（軽量・同期）に語彙ネットワークを取得
 * - 既に保存済みならそれを使用
 * - 未保存なら軽量ネットをその場で生成（スパース＆高速）
 */
export function getVocabularyNetworkForScheduling(questions: Question[]): WordRelationship[] {
  if (cachedNetwork) return cachedNetwork;

  const saved = loadWordRelations();
  if (saved.length > 0) {
    cachedNetwork = saved;
    cachedIndex = null;
    cachedLookup = null;
    return saved;
  }

  cachedNetwork = buildSparseVocabularyNetwork(questions);
  cachedIndex = null;
  cachedLookup = null;
  return cachedNetwork;
}

/**
 * 未保存の場合、アイドル時に保存して次回以降を高速化
 */
export function startVocabularyNetworkPrecomputeIfNeeded(questions: Question[]): void {
  if (precomputeScheduled) return;

  const saved = loadWordRelations();
  if (saved.length > 0) {
    cachedNetwork = saved;
    cachedIndex = null;
    cachedLookup = null;
    return;
  }

  precomputeScheduled = true;

  scheduleIdle(() => {
    try {
      const network = cachedNetwork ?? buildSparseVocabularyNetwork(questions);
      saveWordRelations(network);
      cachedNetwork = network;
      cachedIndex = null;
      cachedLookup = null;
      logger.info('[VocabularyNetwork] ネットワーク保存完了', {
        words: network.length,
        topK: network[0]?.relations?.length ?? 0,
      });
    } catch (e) {
      logger.warn('[VocabularyNetwork] ネットワーク保存に失敗', e);
    } finally {
      precomputeScheduled = false;
    }
  });
}

/**
 * 回答イベントから語彙ネットワークを“個人別に微調整”する（軽量）
 * - 直前の単語とのペアを対象に、強度/成功率を少しだけ更新
 * - ベース強度が十分ある（=元々関連がある）場合のみ更新し、誤った関連を増やしにくくする
 * - 保存はアイドル時にまとめて実行
 */
export function updateVocabularyNetworkFromAnswer(params: {
  word: string;
  previousWord?: string;
  isCorrect: boolean;
}): void {
  const t0 = nowMs();
  const { word, previousWord, isCorrect } = params;
  if (!previousWord) return;
  if (word === previousWord) return;

  // ネットワークがない場合は、まず構築/保存（別経路）に任せる
  if (!cachedNetwork) {
    const saved = loadWordRelations();
    if (saved.length > 0) {
      cachedNetwork = saved;
      cachedIndex = null;
      cachedLookup = null;
    }
  }
  if (!cachedNetwork) return;

  const topK = DEFAULT_TOP_K;
  const baseStrength = getPairStrength(previousWord, word);

  if (baseStrength < DEFAULT_MIN_BASE_STRENGTH_FOR_PERSONAL_UPDATE) {
    return;
  }

  const delta = isCorrect ? PERSONAL_STRENGTH_DELTA_CORRECT : PERSONAL_STRENGTH_DELTA_INCORRECT;

  const index = ensureIndex();
  const prevRel = index.get(previousWord);
  const currRel = index.get(word);
  if (!prevRel || !currRel) return;

  const aToB = findOrCreateRelation(prevRel, word, 'context', baseStrength);
  const bToA = findOrCreateRelation(currRel, previousWord, 'context', baseStrength);

  aToB.strength = clampStrength(aToB.strength + delta);
  bToA.strength = clampStrength(bToA.strength + delta);

  const now = Date.now();
  aToB.lastUpdatedAt = now;
  bToA.lastUpdatedAt = now;

  const target = isCorrect ? 1 : 0;
  aToB.successRate =
    aToB.successRate === undefined
      ? target
      : aToB.successRate * (1 - PERSONAL_SUCCESS_RATE_ALPHA) + target * PERSONAL_SUCCESS_RATE_ALPHA;
  bToA.successRate =
    bToA.successRate === undefined
      ? target
      : bToA.successRate * (1 - PERSONAL_SUCCESS_RATE_ALPHA) + target * PERSONAL_SUCCESS_RATE_ALPHA;

  aToB.sampleCount = (aToB.sampleCount ?? 0) + 1;
  bToA.sampleCount = (bToA.sampleCount ?? 0) + 1;

  prevRel.updatedAt = now;
  currRel.updatedAt = now;

  trimTopK(prevRel, topK);
  trimTopK(currRel, topK);

  // キャッシュ済みlookupがある場合のみ更新（無ければ次回以降に遅延構築）
  updateLookupEdge(previousWord, word, aToB.strength);
  updateLookupEdge(word, previousWord, bToA.strength);

  // ノイズ抑制/減衰（週1程度にまとめて適用）
  applyDecayAndPrune(prevRel, now, topK);
  applyDecayAndPrune(currRel, now, topK);
  if (now - lastDecayAt >= 1000 * 60 * 60 * 24 * DECAY_INTERVAL_DAYS) {
    lastDecayAt = now;
  }

  dirtyNetwork = true;
  scheduleSaveIfDirty();

  const t1 = nowMs();
  recordPerf('answer_update', t1 - t0, { isCorrect, baseStrength });
}

/**
 * スケジューラ向けに強度ルックアップを取得（キャッシュ）
 * - QuestionScheduler側で毎回全件ルックアップを作るコストを避ける
 */
export function getStrengthLookupForScheduling(questions: Question[]): Map<string, Map<string, number>> {
  getVocabularyNetworkForScheduling(questions);
  if (cachedLookup) {
    recordPerf('lookup_hit');
    return cachedLookup;
  }
  return ensureLookup();
}

/**
 * 参照のために強度ルックアップを構築（上位K前提なので軽量）
 */
export function buildStrengthLookup(
  network: WordRelationship[]
): Map<string, Map<string, number>> {
  const lookup = new Map<string, Map<string, number>>();
  for (const rel of network) {
    if (!lookup.has(rel.word)) lookup.set(rel.word, new Map());
    const inner = lookup.get(rel.word)!;
    for (const r of rel.relations) {
      inner.set(r.relatedWord, r.strength);
    }
  }
  return lookup;
}
