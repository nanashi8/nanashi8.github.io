/**
 * パッセージデータのロードユーティリティ
 * ReadingPassageView 用の CompletePassageData を組み立てる。
 */

import type { CompletePassageData, DependencyParsedPassage } from '@/types/passage';
import { loadDependencyParsedPassage } from '@/utils/dependencyParseLoader';
import { logger } from '@/utils/logger';

const PASSAGE_FILE_BASE_BY_ID: Record<string, string> = {
  'beginner-morning-routine': 'beginner_50_Morning-Routine',
};

const PHRASE_WORK_MARKER = '< < < ASTERISK > > >';

function splitIntoBlocks(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/g)
    .map((b) => b.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean);
}

/**
 * passages-originalから元テキストを読み、段落情報を抽出する
 * 空白行で区切られた段落の最初の文を特定
 */
function detectParagraphStarts(text: string, sentences: Array<{ english: string }>): Set<number> {
  const paragraphStarts = new Set<number>();

  // 空白行で段落を分割
  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    // 段落が1つだけなら段落分けなし
    return paragraphStarts;
  }

  // 各段落の最初の文を特定
  let sentenceIndex = 0;
  for (const para of paragraphs) {
    if (sentenceIndex >= sentences.length) break;

    // この段落の最初の文を見つける
    const paraStart = para.substring(0, 100).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

    for (let i = sentenceIndex; i < sentences.length; i++) {
      const sentStart = sentences[i].english.substring(0, 100).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
      if (paraStart.includes(sentStart.substring(0, 30)) || sentStart.includes(paraStart.substring(0, 30))) {
        paragraphStarts.add(i + 1); // sentenceのidは1-based
        sentenceIndex = i + 1;
        break;
      }
    }
  }

  return paragraphStarts;
}

function estimateWordCount(sentences: string[]): number {
  // ざっくりで良い（表示用）。アスタリスク注釈や記号は除外。
  const joined = sentences.join(' ');
  const cleaned = joined
    .replace(/\*+/g, '')
    .replace(/[“”"']/g, ' ')
    .replace(/[^A-Za-z0-9\s-]/g, ' ');
  const words = cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return words.length;
}

function normalizePhraseLine(line: string): string {
  return line
    .replace(/\s+/g, ' ')
    // "don ' t" -> "don't", "it ' s" -> "it's"
    .replace(/\b(\w+)\s+'\s+(\w+)\b/g, "$1'$2")
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s+"/g, '"')
    .replace(/"\s+/g, '"')
    .trim();
}

function looksLikeEndOfSentence(phrase: string): boolean {
  const s = phrase.trim();
  return /[.!?](?:"|')?$/.test(s);
}

function extractEndPunctuation(text: string): string | null {
  const s = normalizePhraseLine(text).trim();
  const m = s.match(/[.!?](?:"|')?$/);
  if (!m) return null;
  // 末尾が引用符つきの場合も、句点記号そのものだけを返す
  const punct = m[0].match(/[.!?]/);
  return punct ? punct[0] : null;
}

function splitJapaneseParagraphIntoSentences(text: string): string[] {
  const compact = text.replace(/\r?\n/g, '').trim();
  if (!compact) return [];

  const out: string[] = [];
  let buf = '';

  for (const ch of compact) {
    buf += ch;
    if (ch === '。' || ch === '！' || ch === '？') {
      const s = buf.trim();
      if (s) out.push(s);
      buf = '';
    }
  }

  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

function resolvePassageFileBase(passageId: string): string {
  return PASSAGE_FILE_BASE_BY_ID[passageId] ?? passageId;
}

async function loadJapaneseSentenceBlocks(
  passageId: string
): Promise<string[]> {
  const fileBase = resolvePassageFileBase(passageId);

  // 1) 文単位ファイル（存在する場合）
  try {
    const res = await fetch(`/data/passages/2_passages-sentences/${fileBase}_sentences.txt`);
    if (res.ok) {
      const text = await res.text();
      // 日本語文が含まれている場合のみ採用
      if (/[ぁ-んァ-ン一-龯]/.test(text)) {
        return splitIntoBlocks(text);
      }
    }
  } catch {
    // ignore
  }

  // 2) 全訳ファイルから文分割
  try {
    const fullCandidates = [
      `/data/passages/4_passages-translations/${fileBase}_full.txt`,
      `/data/passages/4_passages-translations/${fileBase}.txt`,
    ];
    for (const path of fullCandidates) {
      const res = await fetch(path);
      if (!res.ok) continue;
      const text = await res.text();
      if (!/[ぁ-んァ-ン一-龯]/.test(text)) continue;
      return splitJapaneseParagraphIntoSentences(text);
    }
  } catch {
    // ignore
  }

  return [];
}

function buildSentenceJapaneseFromPhrases(
  sentences: CompletePassageData['sentences'],
  phrases: CompletePassageData['phrases']
): CompletePassageData['sentences'] {
  if (phrases.length === 0) return sentences;

  const japaneseById = new Map(phrases.map((p) => [p.id, p.japanese]));
  return sentences.map((s) => {
    if (s.japanese && s.japanese.trim().length > 0) return s;
    if (!s.phraseIds || s.phraseIds.length === 0) return s;
    const joined = s.phraseIds
      .map((id) => japaneseById.get(id) ?? '')
      .join('')
      .replace(/\//g, '')
      .replace(/\n?\n/g, '')
      .trim();
    return { ...s, japanese: joined };
  });
}

function numberWordToDigit(word: string): string | null {
  const w = word.toLowerCase();
  const map: Record<string, string> = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
    eleven: '11',
    twelve: '12',
  };
  return map[w] ?? null;
}

function splitBeginnerPhraseIfNeeded(englishRaw: string): Array<{ english: string; japanese: string }> {
  const english = normalizePhraseLine(englishRaw);
  const lower = english.toLowerCase();

  // 要件対応: "at seven every morning." を "at seven" + "every morning." に分割
  // 日本語は UI での表示用途として "7時に" と "毎朝に" を生成。
  const m = lower.match(/^at\s+([a-z]+)\s+every\s+morning\.?$/);
  if (m) {
    const digit = numberWordToDigit(m[1]) ?? m[1];
    return [
      { english: `at ${m[1]}`, japanese: `${digit}時に` },
      { english: 'every morning', japanese: '毎朝に' },
    ];
  }

  return [{ english, japanese: '' }];
}

async function _loadBeginnerMorningRoutine(passageId: string): Promise<CompletePassageData> {
  type PhraseLearningJson = {
    phrases: Array<{ id: number; english: string; japanese: string }>;
  };

  const fileBase = resolvePassageFileBase(passageId);

  const [phraseRes, jaRes] = await Promise.all([
    fetch(`/data/passages/6_passages-phrase-learning/${fileBase}.json`),
    fetch(`/data/passages/4_passages-translations/${fileBase}.txt`),
  ]);

  if (!phraseRes.ok) {
    logger.warn(`フレーズ学習データが見つかりません: ${passageId} - 依存解析データから構築します`);
    // フレーズ学習データがない場合は通常のフローへフォールバック
    return loadCompletePassageFromDependencyParse(passageId);
  }

  const phraseJson = (await phraseRes.json()) as PhraseLearningJson;
  const phraseItems = Array.isArray(phraseJson.phrases) ? phraseJson.phrases : [];
  if (phraseItems.length === 0) {
    throw new Error(`フレーズ学習データが空です: ${passageId}`);
  }

  const jaText = jaRes.ok ? await jaRes.text() : '';
  const jaSentences = splitJapaneseParagraphIntoSentences(jaText);

  const phrases: CompletePassageData['phrases'] = [];
  const endsSentenceByPhraseId = new Map<string, boolean>();
  const endPunctuationByPhraseId = new Map<string, string>();
  let phraseSeq = 0;
  for (const p of phraseItems) {
    const splits = splitBeginnerPhraseIfNeeded(p.english);
    const originalEndsSentence = looksLikeEndOfSentence(p.english);
    const originalPunct = extractEndPunctuation(p.english);
    if (splits.length === 1) {
      phraseSeq++;
      const id = `${passageId}-p${phraseSeq}`;
      phrases.push({ id, english: splits[0].english, japanese: (p.japanese ?? '').trim() });
      endsSentenceByPhraseId.set(id, looksLikeEndOfSentence(splits[0].english));
      if (looksLikeEndOfSentence(splits[0].english)) {
        const punct = extractEndPunctuation(splits[0].english);
        if (punct) endPunctuationByPhraseId.set(id, punct);
      }
      continue;
    }

    // 分割した場合は、元の日本語ではなく split 側の日本語（表示用）を優先
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      phraseSeq++;
      const id = `${passageId}-p${phraseSeq}`;
      phrases.push({ id, english: normalizePhraseLine(s.english), japanese: (s.japanese ?? '').trim() });

      // 分割元が文末だった場合、最後の分割要素で文を閉じる（句点は sentence 側に付与）
      if (originalEndsSentence && i === splits.length - 1) {
        endsSentenceByPhraseId.set(id, true);
        if (originalPunct) endPunctuationByPhraseId.set(id, originalPunct);
      } else {
        endsSentenceByPhraseId.set(id, looksLikeEndOfSentence(s.english));
        const punct = extractEndPunctuation(s.english);
        if (punct) endPunctuationByPhraseId.set(id, punct);
      }
    }
  }

  const sentences: CompletePassageData['sentences'] = [];
  let currentPhraseIds: string[] = [];
  let currentEnglishParts: string[] = [];
  let sentenceIndex = 0;

  for (const phrase of phrases) {
    currentPhraseIds.push(phrase.id);
    currentEnglishParts.push(phrase.english);

    const shouldEnd = endsSentenceByPhraseId.get(phrase.id) ?? looksLikeEndOfSentence(phrase.english);
    if (shouldEnd) {
      sentenceIndex++;
      const joined = currentEnglishParts.join(' ');
      const punct = endPunctuationByPhraseId.get(phrase.id) ?? '';
      const english = normalizePhraseLine(
        punct && !looksLikeEndOfSentence(joined) ? `${joined}${punct}` : joined
      );
      const japanese = jaSentences[sentenceIndex - 1] ?? '';

      sentences.push({
        id: sentenceIndex,
        english,
        japanese,
        phraseIds: currentPhraseIds,
      });

      currentPhraseIds = [];
      currentEnglishParts = [];
    }
  }

  // 末尾が句点で終わらないケースのフォールバック
  if (currentEnglishParts.length > 0) {
    sentenceIndex++;
    sentences.push({
      id: sentenceIndex,
      english: normalizePhraseLine(currentEnglishParts.join(' ')),
      japanese: jaSentences[sentenceIndex - 1] ?? '',
      phraseIds: currentPhraseIds,
    });
  }

  const wordCount = estimateWordCount(sentences.map((s) => s.english));
  const sentenceCount = sentences.length;

  return {
    passageId,
    sentences,
    phrases,
    keyPhrases: [],
    annotatedWords: [],
    metadata: {
      wordCount,
      sentenceCount,
    },
  };
}

function splitPhraseWorkBodyAndGlossary(raw: string): { body: string; glossary: string } {
  const idx = raw.lastIndexOf(PHRASE_WORK_MARKER);
  if (idx === -1) return { body: raw, glossary: '' };

  const tail = raw.slice(idx);
  // 末尾の注釈は日本語（かな/漢字）を含むことが多い。そうでない場合は本文扱い。
  const looksLikeGlossary = /[ぁ-んァ-ン一-龯]/.test(tail);
  if (!looksLikeGlossary) return { body: raw, glossary: '' };

  return {
    body: raw.slice(0, idx),
    glossary: tail,
  };
}

function extractAnnotatedWordsFromGlossary(
  glossary: string
): Array<{ word: string; inText: string; meaning: string }> {
  // 末尾にある "< < < ASTERISK > > > word meaning" 形式を抽出
  if (!glossary) return [];

  const parts = glossary
    .split(PHRASE_WORK_MARKER)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: Array<{ word: string; inText: string; meaning: string }> = [];

  for (const part of parts) {
    // 例: "farm product （ s ） 農作物" / "cause （ s ） 原因"
    const compact = part.replace(/\s+/g, ' ').trim();
    if (!compact) continue;

    // 英語側は先頭の連続した英単語（括弧や記号に当たるまで）
    const m = compact.match(/^([A-Za-z][A-Za-z\s-]*[A-Za-z])\s+(.*)$/);
    if (!m) continue;

    const word = m[1].trim();
    const meaning = m[2].trim();
    if (!word || !meaning) continue;

    out.push({
      word,
      inText: word,
      meaning,
    });
  }

  // 重複除去（wordで）
  const seen = new Set<string>();
  return out.filter((w) => {
    const key = w.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 依存解析データから完全なパッセージデータを構築する（フレーズ学習データがない場合）
 */
async function loadCompletePassageFromDependencyParse(passageId: string): Promise<CompletePassageData> {
  const parsed = await loadDependencyParsedPassage(passageId);

  // 依存解析データが無い場合は空で返す
  if (!parsed || !parsed.sentences || parsed.sentences.length === 0) {
    logger.warn(`[passageDataLoader] No dependency parse found for ${passageId}`);
    return {
      passageId,
      sentences: [],
      phrases: [],
      keyPhrases: [],
      annotatedWords: [],
      metadata: {
        wordCount: 0,
        sentenceCount: 0,
      },
    };
  }

  // 日本語（文単位）
  const japaneseBlocks = await loadJapaneseSentenceBlocks(passageId);

  // 英語（文単位）はUDパースの text を正とする
  const sentences: CompletePassageData['sentences'] = parsed.sentences.map((s, idx) => {
    const id = typeof s.id === 'number' ? s.id : idx + 1;
    const japanese = japaneseBlocks[idx] ?? '';
    return {
      id,
      english: s.text,
      japanese,
      phraseIds: [] as string[],
      isParagraphStart: false,
    };
  });

  const wordCount = estimateWordCount(sentences.map((s) => s.english));
  const sentenceCount = sentences.length;

  return {
    passageId,
    sentences,
    phrases: [],
    keyPhrases: [],
    annotatedWords: [],
    metadata: { wordCount, sentenceCount },
  };
}

/**
 * 完全なパッセージデータを読み込む
 *
 * 注意: これは仮実装です。実際のデータ構造に合わせて調整が必要です。
 * 現在は最小限のモックデータを返します。
 */
export async function loadCompletePassage(
  passageId: string,
  dependencyParsedPassage?: DependencyParsedPassage | null
): Promise<CompletePassageData> {
  logger.log(`[passageDataLoader] Loading passage: ${passageId}`);

  const parsed =
    dependencyParsedPassage ?? (await loadDependencyParsedPassage(passageId));

  // 依存解析データが無い場合は空で返す（UI側でエラーメッセージ表示）
  if (!parsed || !parsed.sentences || parsed.sentences.length === 0) {
    logger.warn(`[passageDataLoader] No dependency parse found for ${passageId}`);
    return {
      passageId,
      sentences: [],
      phrases: [],
      keyPhrases: [],
      annotatedWords: [],
      metadata: {
        wordCount: 0,
        sentenceCount: 0,
      },
    };
  }

  // 日本語（文単位）
  const japaneseBlocks = await loadJapaneseSentenceBlocks(passageId);

  // 英語（文単位）はUDパースの text を正とする（句点を含む複文もこの単位で扱う）
  const sentences: CompletePassageData['sentences'] = parsed.sentences.map((s, idx) => {
    const id = typeof s.id === 'number' ? s.id : idx + 1;
    const japanese = japaneseBlocks[idx] ?? '';
    return {
      id,
      english: s.text,
      japanese,
      phraseIds: [] as string[],
      isParagraphStart: false,
    };
  });

  // passages-originalから段落情報を取得
  let paragraphStarts = new Set<number>();
  try {
    const fileBase = resolvePassageFileBase(passageId);
    const origRes = await fetch(`/data/passages/1_passages-original/${fileBase}.txt`);
    if (origRes.ok) {
      const origText = await origRes.text();
      // 最初の行（パッセージID行）を除去
      const withoutId = origText.replace(/^[^\n]*\n/, '').trim();
      paragraphStarts = detectParagraphStarts(withoutId, sentences);
    }
  } catch {
    // ignore
  }

  // 段落開始フラグを適用
  sentences.forEach(s => {
    s.isParagraphStart = paragraphStarts.has(s.id);
  });

  // フレーズ（任意）: phrase-work（英）と phrases（和）が揃っていれば構築
  let phraseEnLines: string[] = [];
  let phraseJaLines: string[] = [];
  let annotatedWords: CompletePassageData['annotatedWords'] = [];

  try {
    const fileBase = resolvePassageFileBase(passageId);
    const [enRes, jaRes] = await Promise.all([
      fetch(`/data/passages/3_passages-for-phrase-work/${fileBase}.txt`),
      fetch(`/data/passages/5_passages-for-phrase-work-ja/${fileBase}.txt`),
    ]);

    if (enRes.ok) {
      const raw = await enRes.text();
      const { body, glossary } = splitPhraseWorkBodyAndGlossary(raw);
      // 注釈語句は末尾のグロッサリーからのみ抽出
      annotatedWords = extractAnnotatedWordsFromGlossary(glossary);

      phraseEnLines = body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        // 本文中のマーカーは除去して保持（行自体は落とさない）
        .map((l) => l.split(PHRASE_WORK_MARKER).join('').trim())
        .filter(Boolean);
    }

    if (jaRes.ok) {
      phraseJaLines = (await jaRes.text())
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    }
  } catch {
    // ignore
  }

  const phrases: CompletePassageData['phrases'] = [];
  if (phraseEnLines.length > 0 && phraseJaLines.length > 0) {
    const n = Math.min(phraseEnLines.length, phraseJaLines.length);
    for (let i = 0; i < n; i++) {
      phrases.push({
        id: `${passageId}-p${i + 1}`,
        english: normalizePhraseLine(phraseEnLines[i]),
        japanese: phraseJaLines[i],
      });
    }

    // sentence.phraseIds を推定（phrase末尾の句読点で文境界）
    let sentenceIdx = 0;
    for (let i = 0; i < phrases.length; i++) {
      if (sentenceIdx >= sentences.length) break;
      const pid = phrases[i].id;
      sentences[sentenceIdx].phraseIds?.push(pid);
      if (looksLikeEndOfSentence(phrases[i].english)) {
        sentenceIdx++;
      }
    }
  }

  const finalizedSentences = buildSentenceJapaneseFromPhrases(sentences, phrases);

  const wordCount = estimateWordCount(finalizedSentences.map((s) => s.english));
  const sentenceCount = finalizedSentences.length;

  return {
    passageId,
    sentences: finalizedSentences,
    phrases,
    keyPhrases: [],
    annotatedWords,
    metadata: {
      wordCount,
      sentenceCount,
    },
  };
}

/**
 * 完全なパッセージデータを安全に読み込む（例外時は依存解析ベースへフォールバック）
 */
export async function loadCompletePassageSafely(
  passageId: string,
  dependencyParsedPassage?: DependencyParsedPassage | null
): Promise<CompletePassageData> {
  try {
    return await loadCompletePassage(passageId, dependencyParsedPassage);
  } catch (err) {
    logger.error(`[passageDataLoader] Failed to load passage: ${passageId}`, err);
    return loadCompletePassageFromDependencyParse(passageId);
  }
}
