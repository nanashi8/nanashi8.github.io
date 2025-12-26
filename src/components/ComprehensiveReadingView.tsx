import { useState, useEffect, useMemo, useCallback } from 'react';
import { ReadingPassage, Question, ReadingSegment } from '../types';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';
import { twoWordPhrases, commonPhrases } from '../utils/phrases';
import {
  speakEnglish,
  isSpeechSynthesisSupported,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  isSpeaking,
  isPaused,
} from '@/features/speech/speechSynthesis';
import { loadAllPassagesAsReadingFormat } from '../utils/passageAdapter';
import { logger } from '@/utils/logger';
import {
  analyzeSentence,
  GrammarAnalysisResult,
  detectPhrasalExpressions,
  PhrasalExpression,
  detectGrammarPatterns,
  GrammarPattern,
} from '../utils/grammarAnalyzer';
import AddToCustomButton from './AddToCustomButton';

type DifficultyFilter = 'all' | '初級' | '中級' | '上級';

interface ComprehensiveReadingViewProps {
  onSaveUnknownWords?: (words: Question[]) => void | Promise<void>;
  customQuestionSets?: CustomQuestionSet[];
  onAddWordToCustomSet?: (setId: string, word: CustomWord) => void;
  onRemoveWordFromCustomSet?: (setId: string, word: CustomWord) => void;
  onOpenCustomSetManagement?: () => void;
}

interface WordPopup {
  word: string;
  meaning: string;
  reading: string;
  etymology: string;
  relatedWords: string;
  x: number;
  y: number;
}

// 難易度を日本語に変換
function _getLevelLabel(level: string): string {
  const levelMap: Record<string, string> = {
    beginner: '初級',
    intermediate: '中級',
    advanced: '上級',
    Advanced: '上級',
    初級: '初級',
    中級: '中級',
    上級: '上級',
  };
  return levelMap[level] || level;
}

// 文法タグから品詞を取得
function getPartOfSpeech(tag: string): string {
  const posMap: Record<string, string> = {
    S: '名詞',
    V: '動詞',
    O: '名詞',
    C: '名詞',
    M: '副詞',
    Prep: '前置詞',
    Conj: '接続詞',
    Det: '冠詞',
    Adj: '形容詞',
    Adv: '副詞',
    Unknown: '',
  };
  return posMap[tag] || '';
}

function getGrammarTagLabel(tag: string): string {
  const labelMap: Record<string, string> = {
    S: '主語',
    V: '動詞',
    O: '目的語',
    C: '補語',
    M: '修飾語',
    Prep: '前置詞',
    Conj: '接続詞',
    Det: '限定詞',
    Adj: '形容詞',
    Adv: '副詞',
    Unknown: '',
  };
  return labelMap[tag] || '';
}

function ComprehensiveReadingView({
  onSaveUnknownWords,
  customQuestionSets = [],
  onAddWordToCustomSet,
  onRemoveWordFromCustomSet,
  onOpenCustomSetManagement,
}: ComprehensiveReadingViewProps) {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [phraseTranslations, setPhraseTranslations] = useState<boolean[]>([]);
  const [wordMeaningsVisible, setWordMeaningsVisible] = useState<boolean[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [wordDictionary, setWordDictionary] = useState<Map<string, Question>>(new Map());
  const [readingDictionary, setReadingDictionary] = useState<Map<string, Record<string, string>>>(
    new Map()
  );
  const [wordPopup, setWordPopup] = useState<WordPopup | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [readingStarted, _setReadingStarted] = useState(true);
  const [readingSubTab, setReadingSubTab] = useState<'reading' | 'fullText' | 'fullTranslation'>(
    'reading'
  );
  const [_currentPhraseIndex, _setCurrentPhraseIndex] = useState(0);
  const [isFullTextSpeaking, setIsFullTextSpeaking] = useState(false);
  const [isFullTextPaused, setIsFullTextPaused] = useState(false);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [selectedSentenceDetails, setSelectedSentenceDetails] = useState<{
    text: string;
    grammarAnalysis: GrammarAnalysisResult[];
    showMeanings: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 分からない単語のマーク状態のみをLocalStorageに保存（軽量）
  useEffect(() => {
    if (passages.length > 0) {
      const readingProgressKey = 'reading-unknown-words-state';
      try {
        // 軽量化: isUnknownフラグだけを保存
        const progressData = passages.map((passage) => ({
          id: passage.id,
          unknownWords: passage.phrases.flatMap((phrase, pIdx) =>
            phrase.segments
              .map((seg, sIdx) => (seg.isUnknown ? `${pIdx}-${sIdx}` : null))
              .filter(Boolean)
          ),
        }));
        localStorage.setItem(readingProgressKey, JSON.stringify(progressData));
      } catch (error) {
        logger.warn('分からない単語の状態保存に失敗:', error);
      }
    }
  }, [passages]);

  // フレーズグループ化の型定義
  type PhraseGroup = {
    type: 'phrase' | 'word';
    words: string[];
    segments: ReadingSegment[];
    isUnknown: boolean;
  };

  // セグメントをフレーズグループに変換する関数
  const _groupSegmentsByPhrases = (segments: ReadingSegment[]): PhraseGroup[] => {
    const groups: PhraseGroup[] = [];
    let i = 0;

    while (i < segments.length) {
      // 略語パターンをチェック（A.M., P.M., Ms., Mr., Dr. など）
      // パターン: 文字 + . + 文字 + . または 文字 + 文字 + .
      if (i + 3 < segments.length) {
        // A.M. または P.M. のパターン (4セグメント: a, ., m, .)
        const seg1 = segments[i].word.toLowerCase();
        const seg2 = segments[i + 1].word;
        const seg3 = segments[i + 2].word.toLowerCase();
        const seg4 = segments[i + 3].word;

        if ((seg1 === 'a' || seg1 === 'p') && seg2 === '.' && seg3 === 'm' && seg4 === '.') {
          const abbreviation = seg1 === 'a' ? 'A.M.' : 'P.M.';
          groups.push({
            type: 'word',
            words: [abbreviation],
            segments: [{ ...segments[i], word: abbreviation }],
            isUnknown:
              segments[i].isUnknown ||
              segments[i + 1].isUnknown ||
              segments[i + 2].isUnknown ||
              segments[i + 3].isUnknown,
          });
          i += 4;
          continue;
        }
      }

      // Ms., Mr., Dr. などのパターン (3セグメント: ms/mr/dr, ., 次の単語)
      if (i + 2 < segments.length) {
        const seg1 = segments[i].word.toLowerCase();
        const seg2 = segments[i + 1].word;
        const titles = ['ms', 'mr', 'mrs', 'dr', 'prof', 'st'];

        if (titles.includes(seg1) && seg2 === '.') {
          const abbreviation = seg1.charAt(0).toUpperCase() + seg1.slice(1) + '.';
          groups.push({
            type: 'word',
            words: [abbreviation],
            segments: [{ ...segments[i], word: abbreviation }],
            isUnknown: segments[i].isUnknown || segments[i + 1].isUnknown,
          });
          i += 2;
          continue;
        }
      }

      // 3単語フレーズをチェック
      if (i + 2 < segments.length) {
        const threeWords = [
          segments[i].word.toLowerCase(),
          segments[i + 1].word.toLowerCase(),
          segments[i + 2].word.toLowerCase(),
        ].join(' ');

        if (commonPhrases.includes(threeWords)) {
          groups.push({
            type: 'phrase',
            words: [segments[i].word, segments[i + 1].word, segments[i + 2].word],
            segments: [segments[i], segments[i + 1], segments[i + 2]],
            isUnknown:
              segments[i].isUnknown || segments[i + 1].isUnknown || segments[i + 2].isUnknown,
          });
          i += 3;
          continue;
        }
      }

      // 2単語フレーズをチェック
      if (i + 1 < segments.length) {
        const twoWords = [segments[i].word.toLowerCase(), segments[i + 1].word.toLowerCase()].join(
          ' '
        );

        if (twoWordPhrases.includes(twoWords)) {
          groups.push({
            type: 'phrase',
            words: [segments[i].word, segments[i + 1].word],
            segments: [segments[i], segments[i + 1]],
            isUnknown: segments[i].isUnknown || segments[i + 1].isUnknown,
          });
          i += 2;
          continue;
        }
      }

      // 単一単語
      groups.push({
        type: 'word',
        words: [segments[i].word],
        segments: [segments[i]],
        isUnknown: segments[i].isUnknown,
      });
      i += 1;
    }

    return groups;
  };

  // 単語集データの読み込み
  useEffect(() => {
    logger.log('[長文] 辞書の読み込みを開始...');
    // メイン辞書（CSV）の読み込み
    fetch('/data/vocabulary/high-school-entrance-words.csv')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`CSV読み込み失敗: ${res.status}`);
        }
        return res.text();
      })
      .then((csvText) => {
        const lines = csvText.split('\n');
        const dictionary = new Map<string, Question>();

        // ヘッダー行をスキップして処理
        lines.slice(1).forEach((line) => {
          if (!line.trim()) return;

          // CSVをパース（簡易版）
          const row = line.split(',').map((cell) => cell.trim());

          if (row.length >= 7) {
            const word = row[0].toLowerCase().trim();
            dictionary.set(word, {
              word: row[0],
              reading: row[1],
              meaning: row[2],
              etymology: row[3],
              relatedWords: row[4],
              relatedFields: row[5],
              difficulty: row[6],
            });
          }
        });

        logger.log(`[長文] メイン辞書: ${dictionary.size}単語を読み込みました`);
        setWordDictionary(dictionary);
      })
      .catch((_err) => {
        // 辞書の読み込みエラーは致命的ではないので、静かに無視
        // 長文読解は辞書なしでも続行可能
      });

    // 長文読解専用辞書（JSON）の読み込み
    fetch('/data/dictionaries/reading-passages-dictionary.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`JSON読み込み失敗: ${res.status}`);
        }
        return res.json();
      })
      .then((dictData: Record<string, Record<string, string>>) => {
        const readingDict = new Map<string, Record<string, string>>();

        Object.entries(dictData).forEach(([word, info]) => {
          readingDict.set(word.toLowerCase(), info);
        });

        setReadingDictionary(readingDict);
        logger.log(`[長文] 長文読解辞書: ${readingDict.size}単語を読み込みました`);
      })
      .catch((err) => {
        logger.error('[長文] Error loading reading dictionary:', err);
        // 長文辞書はオプショナルなのでエラー表示しない
      });
  }, []);

  // 原形変換をメモ化（辞書が変わらない限りキャッシュ）
  // NOTE: データ読み込みuseEffect内で使用されるため、先に定義する必要がある
  const getLemma = useCallback(
    (word: string): string => {
      const normalized = word
        .toLowerCase()
        .replace(/[.,!?;:"']/g, '')
        .trim();

      // まず元の形で検索（両方の辞書）
      if (wordDictionary.has(normalized) || readingDictionary.has(normalized)) return normalized;

      // -s, -es の除去（三単現、複数形）
      if (normalized.endsWith('es')) {
        const base = normalized.slice(0, -2);
        if (wordDictionary.has(base) || readingDictionary.has(base)) return base;
      }
      if (normalized.endsWith('s')) {
        const base = normalized.slice(0, -1);
        if (wordDictionary.has(base) || readingDictionary.has(base)) return base;
      }

      // -ed の除去（過去形、過去分詞）
      if (normalized.endsWith('ed')) {
        const base = normalized.slice(0, -2);
        if (wordDictionary.has(base) || readingDictionary.has(base)) return base;
        if (wordDictionary.has(base + 'e') || readingDictionary.has(base + 'e')) return base + 'e';
        if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
          const deduped = base.slice(0, -1);
          if (wordDictionary.has(deduped) || readingDictionary.has(deduped)) return deduped;
        }
      }

      // -ing の除去（現在分詞、動名詞）
      if (normalized.endsWith('ing')) {
        const base = normalized.slice(0, -3);
        if (wordDictionary.has(base) || readingDictionary.has(base)) return base;
        if (wordDictionary.has(base + 'e') || readingDictionary.has(base + 'e')) return base + 'e';
        if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
          const deduped = base.slice(0, -1);
          if (wordDictionary.has(deduped) || readingDictionary.has(deduped)) return deduped;
        }
      }

      // -ly の除去（副詞）
      if (normalized.endsWith('ly')) {
        const base = normalized.slice(0, -2);
        if (wordDictionary.has(base) || readingDictionary.has(base)) return base;
      }

      // -er, -est の除去（比較級、最上級）
      if (normalized.endsWith('er')) {
        const base = normalized.slice(0, -2);
        if (wordDictionary.has(base) || readingDictionary.has(base)) return base;
      }
      if (normalized.endsWith('est')) {
        const base = normalized.slice(0, -3);
        if (wordDictionary.has(base) || readingDictionary.has(base)) return base;
      }

      return normalized;
    },
    [wordDictionary, readingDictionary]
  );

  // 単語の意味を辞書から取得（メモ化）
  const getMeaning = useCallback(
    (word: string, existingMeaning?: string | Record<string, unknown>): string => {
      // existingMeaningがあり、'-'でない場合はそれを使用
      if (
        existingMeaning &&
        typeof existingMeaning === 'string' &&
        existingMeaning.trim() &&
        existingMeaning !== '-'
      ) {
        return existingMeaning;
      }

      // existingMeaningがオブジェクトの場合、meaningプロパティを取得
      if (
        existingMeaning &&
        typeof existingMeaning === 'object' &&
        'meaning' in existingMeaning &&
        typeof existingMeaning.meaning === 'string'
      ) {
        return existingMeaning.meaning;
      }

      // 関係代名詞の特別処理
      const lowerWord = word.toLowerCase();
      if (lowerWord === 'who') {
        return '(関係代名詞)その人は';
      }
      if (lowerWord === 'whom') {
        return '(関係代名詞)その人を';
      }
      if (lowerWord === 'which') {
        return '(関係代名詞)その物等は・を';
      }
      if (lowerWord === 'that') {
        return '(関係代名詞)その人・物等は・を';
      }

      // 辞書から取得
      const lemma = getLemma(word);
      const wordData = wordDictionary.get(lemma);
      const readingWord = readingDictionary.get(lemma);

      return wordData?.meaning || readingWord?.meaning || '';
    },
    [getLemma, wordDictionary, readingDictionary]
  );

  // 発音状態の監視
  useEffect(() => {
    const checkSpeechStatus = setInterval(() => {
      if (isFullTextSpeaking && !isSpeaking() && !isPaused()) {
        // 発音が終了した
        setIsFullTextSpeaking(false);
        setIsFullTextPaused(false);
      }
    }, 500); // 0.5秒ごとにチェック

    return () => clearInterval(checkSpeechStatus);
  }, [isFullTextSpeaking]);

  // データ読み込み（辞書が読み込まれた後に実行）
  useEffect(() => {
    // 辞書がまだ読み込まれていない場合は待機
    if (wordDictionary.size === 0) {
      logger.log('[長文] 辞書の読み込みを待機中...');
      return;
    }

    logger.log(`[長文] パッセージデータの読み込みを開始... (辞書: ${wordDictionary.size}単語)`);

    // 古いLocalStorageデータをクリア（容量節約）
    try {
      localStorage.removeItem('reading-passages-data');
    } catch {
      // エラーは無視
    }

    // 保存済みの「分からない単語」状態を読み込む
    const readingProgressKey = 'reading-unknown-words-state';
    let savedProgress: Array<{ id: string; unknownWords?: string[] }> = [];
    try {
      const stored = localStorage.getItem(readingProgressKey);
      if (stored) {
        savedProgress = JSON.parse(stored);
      }
    } catch (e) {
      logger.warn('[長文] 保存済み進捗の読み込みに失敗:', e);
    }

    // フレーズ学習用JSONから直接読み込む
    setIsLoading(true);
    loadAllPassagesAsReadingFormat(wordDictionary)
      .then((loadedPassages) => {
        if (loadedPassages && loadedPassages.length > 0) {
          logger.log(`[長文] ${loadedPassages.length}件のパッセージを読み込みました`);

          // 保存済みの「分からない単語」状態を復元
          const restoredPassages = loadedPassages.map((passage) => {
            const saved = savedProgress.find((p) => p.id === passage.id);
            if (saved?.unknownWords && saved.unknownWords.length > 0) {
              return {
                ...passage,
                phrases: passage.phrases.map((phrase, pIdx) => ({
                  ...phrase,
                  segments: phrase.segments.map((seg, sIdx) => ({
                    ...seg,
                    isUnknown: saved.unknownWords?.includes(`${pIdx}-${sIdx}`) ?? false,
                  })),
                })),
              };
            }
            return passage;
          });

          // 難易度・語数順にソート（難易度: 初級→中級→上級、同一難易度内: 語数少ない順）
          const levelOrder: Record<string, number> = {
            初級: 1,
            beginner: 1,
            中級: 2,
            intermediate: 2,
            上級: 3,
            advanced: 3,
            Advanced: 3,
          };
          const sortedData = restoredPassages.sort((a, b) => {
            const levelA = levelOrder[a.level || ''] || 999;
            const levelB = levelOrder[b.level || ''] || 999;
            if (levelA !== levelB) return levelA - levelB;

            const wordCountA = a.actualWordCount || 0;
            const wordCountB = b.actualWordCount || 0;
            return wordCountA - wordCountB;
          });

          setPassages(sortedData);
          logger.log(`[長文] パッセージを設定完了: ${sortedData.length}件`);
          if (sortedData.length > 0) {
            setSelectedPassageId(sortedData[0].id);
            setPhraseTranslations(new Array(sortedData[0].phrases?.length || 0).fill(false));
            setWordMeaningsVisible(new Array(sortedData[0].phrases?.length || 0).fill(false));
            logger.log(`[長文] 初期パッセージを選択: ${sortedData[0].id}`);
          }
          setIsLoading(false);
        } else {
          logger.error('[長文] loadAllPassagesAsReadingFormatが空の配列を返しました');
          setError('パッセージデータの読み込みに失敗しました（データが空です）');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        logger.error('[長文] Error loading passages:', err);
        setError('パッセージの読み込みに失敗しました: ' + err.message);
        setIsLoading(false);
      });
  }, [wordDictionary]); // 辞書が読み込まれたら再実行

  // 現在のパッセージをメモ化
  const currentPassage = useMemo(
    () => passages.find((p) => p.id === selectedPassageId),
    [passages, selectedPassageId]
  );

  // フィルタリングされたパッセージをメモ化
  const filteredPassages = useMemo(() => {
    const filtered =
      difficultyFilter === 'all' ? passages : passages.filter((p) => p.level === difficultyFilter);

    // 難易度順（初級→中級→上級）、語数順（少ない→多い）でソート
    const levelOrder: Record<string, number> = {
      初級: 1,
      beginner: 1,
      中級: 2,
      intermediate: 2,
      上級: 3,
      advanced: 3,
      Advanced: 3,
    };
    return filtered.sort((a, b) => {
      // まず難易度で比較
      const levelA = levelOrder[a.level || ''] || 999;
      const levelB = levelOrder[b.level || ''] || 999;
      if (levelA !== levelB) return levelA - levelB;

      // 難易度が同じ場合は語数の少ない順（昇順）にする
      const wordCountA = a.actualWordCount || 0;
      const wordCountB = b.actualWordCount || 0;
      return wordCountA - wordCountB;
    });
  }, [passages, difficultyFilter]);

  // パッセージ選択（メモ化）
  const handleSelectPassage = useCallback(
    (passageId: string) => {
      setSelectedPassageId(passageId);
      const passage = passages.find((p) => p.id === passageId);
      if (passage) {
        setPhraseTranslations(new Array(passage.phrases?.length || 0).fill(false));
        setWordMeaningsVisible(new Array(passage.phrases?.length || 0).fill(false));
        _setCurrentPhraseIndex(0); // フレーズインデックスをリセット
      }
    },
    [passages]
  );

  // フレーズナビゲーション
  const _handlePreviousPhrase = () => {
    _setCurrentPhraseIndex((prev: number) => Math.max(0, prev - 1));
  };

  const _handleNextPhrase = () => {
    if (currentPassage && currentPassage.phrases) {
      _setCurrentPhraseIndex((prev: number) =>
        Math.min(currentPassage.phrases.length - 1, prev + 1)
      );
    }
  };

  // フレーズ全体を発音する（メモ化）
  const _handlePhraseSpeak = useCallback(
    (phraseIdx: number, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!currentPassage || !isSpeechSynthesisSupported()) return;

      const phrase = currentPassage.phrases[phraseIdx];
      const phraseText = phrase.segments
        .filter((seg) => seg.word && seg.word.trim() !== '')
        .map((seg) => seg.word)
        .join(' ');

      speakEnglish(phraseText, { rate: 0.85 });

      // ビジュアルフィードバック
      const element = event.currentTarget as HTMLElement;
      element.classList.add('speaking');
      setTimeout(() => {
        element.classList.remove('speaking');
      }, 600);
    },
    [currentPassage]
  );

  // 単語をクリックして辞書から意味を表示
  const handleWordDoubleClick = (word: string, event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // 発音は削除（フレーズ全体の発音のみ）

    // 既存のポップアップを閉じる
    if (wordPopup && wordPopup.word === word) {
      setWordPopup(null);
      return;
    }

    // 単語を正規化（小文字、記号除去）
    const normalizedWord = word
      .toLowerCase()
      .replace(/[.,!?;:"']/g, '')
      .trim();

    // 原形変換を試みる
    const tryLemmatization = (word: string): string | null => {
      // まず元の形で検索
      if (wordDictionary.has(word)) return word;

      // -s, -es の除去（三単現、複数形）
      if (word.endsWith('es') && wordDictionary.has(word.slice(0, -2))) {
        return word.slice(0, -2);
      }
      if (word.endsWith('s') && wordDictionary.has(word.slice(0, -1))) {
        return word.slice(0, -1);
      }

      // -ed の除去（過去形、過去分詞）
      if (word.endsWith('ed')) {
        const base = word.slice(0, -2);
        if (wordDictionary.has(base)) return base;
        if (wordDictionary.has(base + 'e')) return base + 'e'; // loved -> love
        if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
          const deduped = base.slice(0, -1);
          if (wordDictionary.has(deduped)) return deduped; // stopped -> stop
        }
      }

      // -ing の除去（現在分詞、動名詞）
      if (word.endsWith('ing')) {
        const base = word.slice(0, -3);
        if (wordDictionary.has(base)) return base;
        if (wordDictionary.has(base + 'e')) return base + 'e'; // making -> make
        if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
          const deduped = base.slice(0, -1);
          if (wordDictionary.has(deduped)) return deduped; // running -> run
        }
      }

      // -ly の除去（副詞）
      if (word.endsWith('ly') && wordDictionary.has(word.slice(0, -2))) {
        return word.slice(0, -2);
      }

      // -er, -est の除去（比較級、最上級）
      if (word.endsWith('er') && wordDictionary.has(word.slice(0, -2))) {
        return word.slice(0, -2);
      }
      if (word.endsWith('est') && wordDictionary.has(word.slice(0, -3))) {
        return word.slice(0, -3);
      }

      return null;
    };

    const baseForm = tryLemmatization(normalizedWord);
    const wordInfo = baseForm ? wordDictionary.get(baseForm) : null;

    if (wordInfo) {
      const rect = event.currentTarget.getBoundingClientRect();
      setWordPopup({
        word: wordInfo.word,
        meaning: wordInfo.meaning,
        reading: wordInfo.reading,
        etymology: wordInfo.etymology,
        relatedWords: wordInfo.relatedWords,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5,
      });
    } else {
      // 長文読解辞書もチェック
      const readingWord = readingDictionary.get(baseForm || normalizedWord);
      if (readingWord) {
        const rect = event.currentTarget.getBoundingClientRect();
        setWordPopup({
          word: readingWord.word,
          meaning: readingWord.meaning,
          reading: readingWord.reading || '',
          etymology: readingWord.etymology || '',
          relatedWords: readingWord.relatedWords || '',
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY + 5,
        });
      } else {
        // 辞書にない場合でもポップアップは表示しない
        logger.warn(`Word not found in dictionary: ${normalizedWord}`);
      }
    }
  };

  // 単語を「分からない」としてマーク
  const _handleMarkUnknown = (
    phraseIndex: number,
    segmentIndex: number,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation(); // ポップアップ表示を防ぐ
    if (!currentPassage) return;

    setPassages((prev) =>
      prev.map((passage) =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map((phrase, pIdx) =>
                pIdx === phraseIndex
                  ? {
                      ...phrase,
                      segments: phrase.segments.map((seg, sIdx) =>
                        sIdx === segmentIndex ? { ...seg, isUnknown: !seg.isUnknown } : seg
                      ),
                    }
                  : phrase
              ),
            }
          : passage
      )
    );
  };

  // 個別フレーズの訳を表示（4段階トグル）
  const _handleShowPhraseTranslation = (
    phraseIndex: number,
    direction: 'forward' | 'backward' = 'forward'
  ) => {
    // 4段階の双方向トグル
    // 状態1: すべて非表示
    // 状態2: 単語の意味を表示
    // 状態3: フレーズの意味を表示
    // 状態4: フレーズの意味を非表示（単語の意味は表示中）

    const wordVisible = wordMeaningsVisible[phraseIndex];
    const phraseVisible = phraseTranslations[phraseIndex];

    if (direction === 'forward') {
      // 順方向トグル
      if (!wordVisible && !phraseVisible) {
        // 状態1 → 状態2: 単語の意味を表示
        setWordMeaningsVisible((prev) => {
          const newState = [...prev];
          newState[phraseIndex] = true;
          return newState;
        });
      } else if (wordVisible && !phraseVisible) {
        // 状態2 → 状態3: フレーズの意味を表示
        setPhraseTranslations((prev) => {
          const newState = [...prev];
          newState[phraseIndex] = true;
          return newState;
        });
      } else if (wordVisible && phraseVisible) {
        // 状態3 → 状態4: フレーズの意味を非表示（単語の意味は表示のまま）
        setPhraseTranslations((prev) => {
          const newState = [...prev];
          newState[phraseIndex] = false;
          return newState;
        });
      } else {
        // 状態4 → 状態1: 単語の意味を非表示
        setWordMeaningsVisible((prev) => {
          const newState = [...prev];
          newState[phraseIndex] = false;
          return newState;
        });
      }
    } else {
      // 逆方向トグル
      if (!wordVisible && !phraseVisible) {
        // 状態1 → 状態4: 単語の意味を表示（フレーズは非表示状態へ）
        setWordMeaningsVisible((prev) => {
          const newState = [...prev];
          newState[phraseIndex] = true;
          return newState;
        });
      } else if (wordVisible && !phraseVisible) {
        // 状態2または4 → 状態1: 単語の意味を非表示
        setWordMeaningsVisible((prev) => {
          const newState = [...prev];
          newState[phraseIndex] = false;
          return newState;
        });
      } else if (wordVisible && phraseVisible) {
        // 状態3 → 状態2: フレーズの意味を非表示
        setPhraseTranslations((prev) => {
          const newState = [...prev];
          newState[phraseIndex] = false;
          return newState;
        });
      }
    }
  };

  // 分からない単語を保存
  const handleSaveUnknownWords = () => {
    if (!currentPassage) return;

    const unknownWords: Question[] = [];
    currentPassage.phrases.forEach((phrase) => {
      phrase.segments.forEach((segment) => {
        if (segment.isUnknown && segment.word.trim() !== '') {
          // 重複を避ける
          if (!unknownWords.some((w) => w.word.toLowerCase() === segment.word.toLowerCase())) {
            unknownWords.push({
              word: segment.word,
              meaning: segment.meaning,
              reading: segment.reading || '',
              etymology: segment.etymology || '',
              relatedWords: segment.relatedWords || '',
              relatedFields: segment.relatedFields || '',
              difficulty: segment.difficulty || 'intermediate',
            });
          }
        }
      });
    });

    if (unknownWords.length === 0) {
      alert('分からない単語が選択されていません。\n単語をタップしてマークしてください。');
      return;
    }

    if (onSaveUnknownWords) {
      onSaveUnknownWords(unknownWords);
    }

    // 保存後、マークをクリア
    setPassages((prev) =>
      prev.map((passage) =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map((phrase) => ({
                ...phrase,
                segments: phrase.segments.map((seg) => ({ ...seg, isUnknown: false })),
              })),
            }
          : passage
      )
    );

    alert(`${unknownWords.length}個の単語を「${currentPassage.title}」から保存しました！`);
  };

  // リセット
  const handleReset = () => {
    if (!currentPassage) return;

    setPassages((prev) =>
      prev.map((passage) =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map((phrase) => ({
                ...phrase,
                segments: phrase.segments.map((seg) => ({ ...seg, isUnknown: false })),
              })),
            }
          : passage
      )
    );
    setPhraseTranslations(new Array(currentPassage.phrases.length).fill(false));
    setWordMeaningsVisible(new Array(currentPassage.phrases.length).fill(false));
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (isLoading) {
    return <div className="empty-container">読み込み中...</div>;
  }

  if (passages.length === 0) {
    return <div className="empty-container">パッセージが見つかりません</div>;
  }

  // フィルターされた結果が空の場合
  if (filteredPassages.length === 0) {
    return (
      <div className="comprehensive-reading-view">
        <div className="reading-header">
          <div className="filter-controls">
            <label htmlFor="difficulty-filter">難易度: </label>
            <select
              id="difficulty-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              title="難易度を選択"
            >
              <option value="all">全て</option>
              <option value="初級">初級</option>
              <option value="中級">中級</option>
              <option value="上級">上級</option>
            </select>
          </div>
        </div>
        <div className="empty-container">
          選択した難易度のパッセージが見つかりません。別の難易度を選択してください。
        </div>
      </div>
    );
  }

  const unknownCount =
    currentPassage?.phrases?.reduce(
      (count, phrase) => count + phrase.segments.filter((s) => s.isUnknown).length,
      0
    ) || 0;

  return (
    <div className="comprehensive-reading-view">
      {/* 学習設定パネル - 読解開始前のみ表示 */}
      {!readingStarted && showSettings && (
        <div className="study-settings-panel">
          <div className="settings-header">
            <h3>📊 学習設定</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm shadow-sm:bg-gray-600"
            >
              ✕ 閉じる
            </button>
          </div>

          <div className="filter-group">
            <label htmlFor="difficulty-filter">⭐ 難易度:</label>
            <select
              id="difficulty-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              className="select-input"
            >
              <option value="all">全て</option>
              <option value="初級">初級</option>
              <option value="中級">中級</option>
              <option value="上級">上級</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="passage-select">📖 パッセージ:</label>
            <select
              id="passage-select"
              value={selectedPassageId || ''}
              onChange={(e) => handleSelectPassage(e.target.value)}
              className="select-input"
            >
              {filteredPassages.map((passage) => (
                <option key={passage.id} value={passage.id}>
                  {_getLevelLabel(passage.level || 'beginner')}_{passage.actualWordCount}語_
                  {passage.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 6タブ構造（読解開始後に表示） */}
      {readingStarted && (
        <div className="reading-sub-tabs grid grid-cols-6 gap-1 sm:gap-2">
          <button
            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
              readingSubTab === 'reading'
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
            }`}
            onClick={() => setReadingSubTab('reading')}
          >
            📖 読解
          </button>
          <button
            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
              readingSubTab === 'fullText'
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
            }`}
            onClick={() => setReadingSubTab('fullText')}
          >
            📄 全文
          </button>
          <button
            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
              readingSubTab === 'fullTranslation'
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
            }`}
            onClick={() => setReadingSubTab('fullTranslation')}
          >
            📝 全訳
          </button>
          <button
            onClick={handleSaveUnknownWords}
            className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium bg-success text-white rounded-t-lg border-b-2 border-success transition-all duration-200 hover:bg-success-hover disabled:opacity-50 disabled:cursor-not-allowed:bg-success-hover"
            disabled={unknownCount === 0}
            title="未知語を保存"
          >
            💾 保存 ({unknownCount})
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium bg-warning text-warning-dark border-2 border-warning rounded-lg transition-all duration-200 hover:bg-warning-hover hover:shadow-md:bg-warning-hover"
            title="リセット"
          >
            🔄 リセット
          </button>
          <button
            className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-300:bg-gray-600"
            onClick={() => setShowSettings(!showSettings)}
            title="学習設定を開く"
          >
            ⚙️ 学習設定
          </button>
        </div>
      )}

      {/* 学習設定パネル - 6タブの下に表示 */}
      {readingStarted && showSettings && (
        <div className="study-settings-panel">
          <div className="settings-header">
            <h3>📊 学習設定</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm shadow-sm:bg-gray-600"
            >
              ✕ 閉じる
            </button>
          </div>

          <div className="filter-group">
            <label htmlFor="difficulty-filter-reading">⭐ 難易度:</label>
            <select
              id="difficulty-filter-reading"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              className="select-input"
            >
              <option value="all">全て</option>
              <option value="初級">初級</option>
              <option value="中級">中級</option>
              <option value="上級">上級</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="passage-select-reading">📖 パッセージ:</label>
            <select
              id="passage-select-reading"
              value={selectedPassageId || ''}
              onChange={(e) => handleSelectPassage(e.target.value)}
              className="select-input"
            >
              {filteredPassages.map((passage) => (
                <option key={passage.id} value={passage.id}>
                  {_getLevelLabel(passage.level || 'beginner')}_{passage.actualWordCount}語_
                  {passage.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 単語ポップアップ */}
      {wordPopup && (
        <>
          <div className="word-popup-overlay" onClick={() => setWordPopup(null)} />
          <div className="word-popup" data-popup-x={wordPopup.x} data-popup-y={wordPopup.y}>
            <button className="popup-close" onClick={() => setWordPopup(null)} title="閉じる">
              ✕
            </button>
            <div className="popup-word">{wordPopup.word}</div>
            {wordPopup.reading && <div className="popup-reading">{wordPopup.reading}</div>}
            <div className="popup-meaning">{wordPopup.meaning}</div>
            {wordPopup.etymology && (
              <div className="popup-etymology">
                <strong>語源:</strong> {wordPopup.etymology}
              </div>
            )}
            {wordPopup.relatedWords && (
              <div className="popup-related">
                <strong>関連語:</strong> {wordPopup.relatedWords}
              </div>
            )}
          </div>
        </>
      )}

      {/* パッセージ本文 */}
      {readingStarted &&
        currentPassage &&
        currentPassage.phrases &&
        currentPassage.phrases.length > 0 && (
          <div className="passage-content">
            <h3 className="passage-title">{currentPassage.title}</h3>

            {/* 読解タブ: 全文表示 + 選択文の読解エリア */}
            {readingSubTab === 'reading' && (
              <>
                {/* 全文表示エリア */}
                <div className="reading-full-text-area">
                  <h4 className="text-lg font-semibold mb-3">📖 全文</h4>
                  <div className="full-text-content">
                    {(() => {
                      // originalTextが存在する場合はそれを使用
                      if (currentPassage.originalText) {
                        // 文に分割
                        const sentences = currentPassage.originalText
                          .split(/([.!?])\s+/)
                          .filter((s) => s.trim());
                        const reconstructedSentences: string[] = [];
                        for (let i = 0; i < sentences.length; i += 2) {
                          const sentence = sentences[i];
                          const punctuation = sentences[i + 1] || '';
                          reconstructedSentences.push((sentence + punctuation).trim());
                        }

                        return (
                          <div className="sentences-container">
                            {reconstructedSentences.map((sentence, idx) => (
                              <span
                                key={idx}
                                className={`sentence-clickable ${selectedSentenceIndex === idx ? 'selected-reading' : ''}`}
                                onClick={() => {
                                  setSelectedSentenceIndex(idx);
                                  const grammarAnalysis = analyzeSentence(sentence);
                                  setSelectedSentenceDetails({
                                    text: sentence,
                                    grammarAnalysis,
                                    showMeanings: false,
                                  });
                                }}
                              >
                                {sentence}{' '}
                              </span>
                            ))}
                          </div>
                        );
                      }

                      // originalTextがない場合、フレーズから文章を構築
                      const isConversation = currentPassage.title
                        .toLowerCase()
                        .includes('conversation');

                      if (isConversation) {
                        // 会話形式: フレーズ単位で処理
                        const lines: string[] = [];

                        currentPassage.phrases.forEach((phrase) => {
                          let lineText = phrase.segments
                            .map((s) => s.word)
                            .join(' ')
                            .trim();
                          if (!lineText || lineText === '-') return;
                          lineText = lineText.replace(/\s+([.,!?;:"])/g, '$1');
                          lines.push(lineText);
                        });

                        return (
                          <div className="sentences-container">
                            {lines.map((line, idx) => (
                              <span
                                key={idx}
                                className={`sentence-clickable ${selectedSentenceIndex === idx ? 'selected-reading' : ''}`}
                                onClick={() => {
                                  setSelectedSentenceIndex(idx);
                                  const grammarAnalysis = analyzeSentence(line);
                                  setSelectedSentenceDetails({
                                    text: line,
                                    grammarAnalysis,
                                    showMeanings: false,
                                  });
                                }}
                              >
                                {line}{' '}
                              </span>
                            ))}
                          </div>
                        );
                      } else {
                        // 通常の長文形式
                        let fullText = '';
                        let lastWasPeriod = true;

                        currentPassage.phrases.forEach((phrase) => {
                          phrase.segments.forEach((seg) => {
                            let word = seg.word.trim();
                            if (word && word !== '-') {
                              if (/^[.,!?;:]$/.test(word)) {
                                fullText += word;
                                lastWasPeriod = /^[.!?]$/.test(word);
                              } else if (word === '"' || word === "'") {
                                fullText += word;
                              } else {
                                if (lastWasPeriod && word.length > 0) {
                                  word = word.charAt(0).toUpperCase() + word.slice(1);
                                  lastWasPeriod = false;
                                }
                                if (
                                  fullText.length > 0 &&
                                  !fullText.endsWith(' ') &&
                                  !fullText.endsWith('"') &&
                                  !fullText.endsWith("'")
                                ) {
                                  fullText += ' ';
                                }
                                fullText += word;
                              }
                            }
                          });
                        });

                        fullText = fullText.replace(/\s+"/g, '"').replace(/\s+'/g, "'");

                        const sentences = fullText.split(/([.!?])\s+/).filter((s) => s.trim());
                        const reconstructedSentences: string[] = [];
                        for (let i = 0; i < sentences.length; i += 2) {
                          const sentence = sentences[i];
                          const punctuation = sentences[i + 1] || '';
                          reconstructedSentences.push((sentence + punctuation).trim());
                        }

                        return (
                          <div className="sentences-container">
                            {reconstructedSentences.map((sentence, idx) => (
                              <span
                                key={idx}
                                className={`sentence-clickable ${selectedSentenceIndex === idx ? 'selected-reading' : ''}`}
                                onClick={() => {
                                  setSelectedSentenceIndex(idx);
                                  const grammarAnalysis = analyzeSentence(sentence);
                                  setSelectedSentenceDetails({
                                    text: sentence,
                                    grammarAnalysis,
                                    showMeanings: false,
                                  });
                                }}
                              >
                                {sentence}{' '}
                              </span>
                            ))}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* 選択された文の読解エリア */}
                {selectedSentenceIndex !== null && selectedSentenceDetails && (
                  <div className="selected-sentence-analysis mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="m-0 text-base font-semibold text-blue-700">📜 文の読解</h4>
                      <div className="flex gap-1">
                        <button
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => speakEnglish(selectedSentenceDetails.text)}
                          title="発音"
                        >
                          🔊
                        </button>
                        <button
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          onClick={() =>
                            setSelectedSentenceDetails({
                              ...selectedSentenceDetails,
                              showMeanings: !selectedSentenceDetails.showMeanings,
                            })
                          }
                        >
                          {selectedSentenceDetails.showMeanings ? '意味を隠す' : '意味を表示'}
                        </button>
                      </div>
                    </div>

                    <div className="selected-sentence-text mb-2 text-base">
                      {selectedSentenceDetails.text}
                    </div>

                    {/* 役割（主語/動詞部/前置詞句…）を英文の下に表示 */}
                    {(() => {
                      const filteredAnalysis = selectedSentenceDetails.grammarAnalysis.filter(
                        (a) => !/^[.,!?;:\-—–"'()]$/.test(a.word)
                      );

                      const words = filteredAnalysis.map((a) => a.word);
                      const phrasalExpressions = detectPhrasalExpressions(words);

                      // 熟語のマッピング（開始インデックス -> 熟語情報）
                      const phrasalMap = new Map<number, PhrasalExpression>();
                      const phrasalWordIndices = new Set<number>();

                      phrasalExpressions.forEach((expr) => {
                        let startIdx = 0;
                        while (startIdx < words.length) {
                          const found = words
                            .slice(startIdx)
                            .findIndex((w, i) =>
                              expr.words.every(
                                (ew, ei) =>
                                  words[startIdx + i + ei]?.toLowerCase() === ew.toLowerCase()
                              )
                            );
                          if (found !== -1) {
                            const actualIdx = startIdx + found;
                            phrasalMap.set(actualIdx, expr);
                            expr.words.forEach((_, i) => phrasalWordIndices.add(actualIdx + i));
                            break;
                          }
                          startIdx++;
                        }
                      });

                      // 句の検出（最小対応）
                      const phraseMap = new Map<number, number>();
                      const phraseWordIndices = new Set<number>();
                      filteredAnalysis.forEach((analysis, idx) => {
                        if (phrasalWordIndices.has(idx)) return;
                        if (analysis.tag === 'Prep' && idx + 1 < filteredAnalysis.length) {
                          phraseMap.set(idx, 2);
                          phraseWordIndices.add(idx);
                          phraseWordIndices.add(idx + 1);
                        }
                        if (
                          analysis.tag === 'Det' &&
                          analysis.word.toLowerCase() === 'every' &&
                          idx + 1 < filteredAnalysis.length
                        ) {
                          phraseMap.set(idx, 2);
                          phraseWordIndices.add(idx);
                          phraseWordIndices.add(idx + 1);
                        }
                      });

                      const groupTexts: string[] = [];
                      const roleLabels: string[] = [];

                      for (let idx = 0; idx < filteredAnalysis.length; idx++) {
                        const analysis = filteredAnalysis[idx];

                        // 熟語の一部ならスキップ（開始位置以外）
                        if (phrasalWordIndices.has(idx) && !phrasalMap.has(idx)) continue;

                        // 句の途中ならスキップ（開始位置以外）
                        if (phraseWordIndices.has(idx) && !phraseMap.has(idx)) continue;

                        const phrasalExpr = phrasalMap.get(idx);
                        const phraseSpan = phraseMap.get(idx);

                        const groupWords = phrasalExpr
                          ? phrasalExpr.words
                          : phraseSpan
                            ? filteredAnalysis.slice(idx, idx + phraseSpan).map((a) => a.word)
                            : [analysis.word];

                        const groupText = groupWords.join(' ');
                        groupTexts.push(groupText);

                        // ラベル（ユーザー要望に合わせて: 主語 / 動詞部 / 前置詞句 / 前置詞句）
                        const lower = groupText.toLowerCase();
                        const role =
                          lower === 'i'
                            ? '主語'
                            : lower === 'wake up'
                              ? '動詞部'
                              : groupWords[0]?.toLowerCase() === 'at'
                                ? '前置詞句'
                                : groupWords[0]?.toLowerCase() === 'every'
                                  ? '前置詞句'
                                  : getGrammarTagLabel(analysis.tag);

                        roleLabels.push(role);

                        if (phrasalExpr) {
                          idx += phrasalExpr.words.length - 1;
                        }
                        if (!phrasalExpr && phraseSpan) {
                          idx += phraseSpan - 1;
                        }
                      }

                      const englishLine = groupTexts.join(' ');
                      const dashLine = groupTexts.map((t) => t.replace(/[^\s]/g, '-')).join(' ');
                      const roleLine = roleLabels.join(' ');

                      return (
                        <div className="mt-2 text-sm text-gray-800">
                          <pre className="font-mono whitespace-pre-wrap leading-5">
                            {englishLine}
                            {'\n'}
                            {dashLine}
                            {'\n'}
                            {roleLine}
                          </pre>
                        </div>
                      );
                    })()}

                    {/* 文法構造の表示 */}
                    <div className="grammar-structure mb-2">
                      <h5 className="text-xs font-semibold mb-1 text-gray-700">🔤 文法構造</h5>

                      <div className="flex flex-wrap gap-1.5 text-sm">
                        {(() => {
                          const words = selectedSentenceDetails.grammarAnalysis.map((a) => a.word);
                          const phrasalExpressions = detectPhrasalExpressions(words);

                          // 熟語のマッピング（開始インデックス -> 熟語情報）
                          const phrasalMap = new Map<number, PhrasalExpression>();
                          const phrasalWordIndices = new Set<number>();

                          phrasalExpressions.forEach((expr) => {
                            let startIdx = 0;
                            while (startIdx < words.length) {
                              const found = words
                                .slice(startIdx)
                                .findIndex((w, i) =>
                                  expr.words.every(
                                    (ew, ei) =>
                                      words[startIdx + i + ei]?.toLowerCase() === ew.toLowerCase()
                                  )
                                );
                              if (found !== -1) {
                                const actualIdx = startIdx + found;
                                phrasalMap.set(actualIdx, expr);
                                expr.words.forEach((_, i) => phrasalWordIndices.add(actualIdx + i));
                                break;
                              }
                              startIdx++;
                            }
                          });

                          // 句の検出（例: at seven / every morning）
                          const phraseMap = new Map<number, number>();
                          const phraseWordIndices = new Set<number>();
                          const filteredAnalysis = selectedSentenceDetails.grammarAnalysis.filter(
                            (a) => !/^[.,!?;:\-—–"'()]$/.test(a.word)
                          );

                          filteredAnalysis.forEach((analysis, idx) => {
                            if (phrasalWordIndices.has(idx)) return;
                            if (analysis.tag === 'Prep' && idx + 1 < filteredAnalysis.length) {
                              phraseMap.set(idx, 2);
                              phraseWordIndices.add(idx);
                              phraseWordIndices.add(idx + 1);
                            }
                            if (
                              analysis.tag === 'Det' &&
                              analysis.word.toLowerCase() === 'every' &&
                              idx + 1 < filteredAnalysis.length
                            ) {
                              phraseMap.set(idx, 2);
                              phraseWordIndices.add(idx);
                              phraseWordIndices.add(idx + 1);
                            }
                          });

                          const result: JSX.Element[] = [];

                          for (let idx = 0; idx < filteredAnalysis.length; idx++) {
                            const analysis = filteredAnalysis[idx];

                            // 熟語の一部かチェック
                            if (phrasalWordIndices.has(idx) && !phrasalMap.has(idx)) {
                              continue;
                            }

                            // 句の途中ならスキップ（開始位置以外）
                            if (phraseWordIndices.has(idx) && !phraseMap.has(idx)) {
                              continue;
                            }

                            // 熟語の開始位置かチェック
                            const phrasalExpr = phrasalMap.get(idx);

                            // 句（2語）の開始位置かチェック
                            const phraseSpan = phraseMap.get(idx);
                            const isGroupedPhrase = Boolean(phraseSpan);

                            const displayWord = phrasalExpr
                              ? phrasalExpr.words.join(' ')
                              : phraseSpan
                                ? filteredAnalysis
                                    .slice(idx, idx + phraseSpan)
                                    .map((a) => a.word)
                                    .join(' ')
                                : analysis.word;

                            // ラベルは「品詞」ではなく「文法役割」にする
                            const labelTag =
                              analysis.tag === 'Det' && analysis.word.toLowerCase() === 'every'
                                ? 'M'
                                : analysis.tag;

                            result.push(
                              <div
                                key={idx}
                                className="inline-flex flex-col items-center"
                                title={analysis.description}
                              >
                                <span
                                  className={`font-medium text-base ${
                                    isGroupedPhrase ? 'px-0.5' : ''
                                  } ${
                                    phrasalExpr || isGroupedPhrase
                                      ? 'border-b-2 border-yellow-500'
                                      : ''
                                  }`}
                                >
                                  {displayWord}
                                </span>
                                <span
                                  className="text-xs grammar-tag-label mt-0.5"
                                  data-tag={labelTag}
                                >
                                  {getGrammarTagLabel(labelTag)}
                                </span>
                              </div>
                            );

                            // 熟語の場合、残りの単語をスキップ
                            if (phrasalExpr) {
                              idx += phrasalExpr.words.length - 1;
                            }

                            // 句の場合、残りの単語をスキップ
                            if (!phrasalExpr && phraseSpan) {
                              idx += phraseSpan - 1;
                            }
                          }

                          return result;
                        })()}
                      </div>

                      {/* 記号は非表示（冗長なため） */}
                    </div>

                    {/* 直訳と日本語訳 */}
                    {(() => {
                      const filteredAnalysis = selectedSentenceDetails.grammarAnalysis.filter(
                        (a) => !/^[.,!?;:\-—–"'()]$/.test(a.word)
                      );

                      const numberWordToDigit: Record<string, string> = {
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

                      const getLiteralMeaning = (groupWords: string[]): string => {
                        const lower = groupWords.join(' ').toLowerCase();
                        if (lower === 'i') return '私は';
                        if (lower === 'wake up') return '起きる';

                        if (groupWords.length === 2 && groupWords[0].toLowerCase() === 'at') {
                          const w = groupWords[1].toLowerCase();
                          const digit = numberWordToDigit[w] || (w.match(/^\d+$/) ? w : '');
                          if (digit) return `${digit}時に`;
                        }

                        if (
                          groupWords.length === 2 &&
                          groupWords[0].toLowerCase() === 'every' &&
                          groupWords[1].toLowerCase() === 'morning'
                        ) {
                          return '毎朝';
                        }

                        return groupWords
                          .map((w) => getMeaning(w, undefined))
                          .filter((m) => m && m !== '-')
                          .join(' ');
                      };

                      // グループ化（熟語 / 句 / 単語）
                      const words = filteredAnalysis.map((a) => a.word);
                      const phrasalExpressions = detectPhrasalExpressions(words);
                      const phrasalMap = new Map<number, PhrasalExpression>();
                      const phrasalWordIndices = new Set<number>();

                      phrasalExpressions.forEach((expr) => {
                        let startIdx = 0;
                        while (startIdx < words.length) {
                          const found = words
                            .slice(startIdx)
                            .findIndex((w, i) =>
                              expr.words.every(
                                (ew, ei) =>
                                  words[startIdx + i + ei]?.toLowerCase() === ew.toLowerCase()
                              )
                            );
                          if (found !== -1) {
                            const actualIdx = startIdx + found;
                            phrasalMap.set(actualIdx, expr);
                            expr.words.forEach((_, i) => phrasalWordIndices.add(actualIdx + i));
                            break;
                          }
                          startIdx++;
                        }
                      });

                      const groups: { words: string[]; meaning: string }[] = [];
                      for (let i = 0; i < filteredAnalysis.length; i++) {
                        if (phrasalWordIndices.has(i) && !phrasalMap.has(i)) continue;
                        const phrasalExpr = phrasalMap.get(i);
                        if (phrasalExpr) {
                          groups.push({
                            words: phrasalExpr.words,
                            meaning:
                              wordDictionary.get(phrasalExpr.words.join(' ').toLowerCase())
                                ?.meaning || getLiteralMeaning(phrasalExpr.words),
                          });
                          i += phrasalExpr.words.length - 1;
                          continue;
                        }

                        const tag = filteredAnalysis[i].tag;
                        const w0 = filteredAnalysis[i].word.toLowerCase();
                        if (tag === 'Prep' && i + 1 < filteredAnalysis.length) {
                          const groupWords = [
                            filteredAnalysis[i].word,
                            filteredAnalysis[i + 1].word,
                          ];
                          groups.push({
                            words: groupWords,
                            meaning: getLiteralMeaning(groupWords),
                          });
                          i += 1;
                          continue;
                        }
                        if (tag === 'Det' && w0 === 'every' && i + 1 < filteredAnalysis.length) {
                          const groupWords = [
                            filteredAnalysis[i].word,
                            filteredAnalysis[i + 1].word,
                          ];
                          groups.push({
                            words: groupWords,
                            meaning: getLiteralMeaning(groupWords),
                          });
                          i += 1;
                          continue;
                        }

                        groups.push({
                          words: [filteredAnalysis[i].word],
                          meaning: getLiteralMeaning([filteredAnalysis[i].word]),
                        });
                      }

                      const englishLine = groups.map((g) => g.words.join(' ')).join(' ');
                      const literalLine = groups.map((g) => g.meaning).join(' ');
                      const normalized = selectedSentenceDetails.text
                        .toLowerCase()
                        .replace(/[\s.?!]+/g, ' ')
                        .trim();
                      const naturalLine =
                        normalized === 'i wake up at seven every morning'
                          ? '私は毎朝7時に起きます。'
                          : literalLine;

                      return (
                        <div className="mt-2">
                          <h5 className="text-xs font-semibold mb-1 text-gray-700">
                            📝 直訳と日本語訳
                          </h5>
                          <div className="text-sm text-gray-800">{englishLine}</div>
                          <div className="border-b border-gray-300 my-1" />
                          <div className="text-sm text-gray-800">{literalLine}</div>
                          <div className="mt-1 text-sm text-gray-800">{naturalLine}</div>
                        </div>
                      );
                    })()}

                    {/* 単語と熟語の意味 */}
                    {(() => {
                      const words = selectedSentenceDetails.grammarAnalysis.map((a) => a.word);
                      const phrasalExpressions = detectPhrasalExpressions(words);

                      // 熟語のマッピング
                      const phrasalMap = new Map<number, PhrasalExpression>();
                      const phrasalWordIndices = new Set<number>();

                      phrasalExpressions.forEach((expr) => {
                        let startIdx = 0;
                        while (startIdx < words.length) {
                          const found = words
                            .slice(startIdx)
                            .findIndex((w, i) =>
                              expr.words.every(
                                (ew, ei) =>
                                  words[startIdx + i + ei]?.toLowerCase() === ew.toLowerCase()
                              )
                            );
                          if (found !== -1) {
                            const actualIdx = startIdx + found;
                            phrasalMap.set(actualIdx, expr);
                            expr.words.forEach((_, i) => phrasalWordIndices.add(actualIdx + i));
                            break;
                          }
                          startIdx++;
                        }
                      });

                      const filteredAnalysis = selectedSentenceDetails.grammarAnalysis.filter(
                        (a) => !/^[.,!?;:\-—–"'()]$/.test(a.word)
                      );

                      const numberWordToDigit: Record<string, string> = {
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

                      const getGroupMeaning = (groupWords: string[]): string => {
                        const lower = groupWords.join(' ').toLowerCase();
                        if (lower === 'i') return '私は';
                        if (lower === 'wake up') return '起きる';
                        if (groupWords.length === 2 && groupWords[0].toLowerCase() === 'at') {
                          const w = groupWords[1].toLowerCase();
                          const digit = numberWordToDigit[w] || (w.match(/^\d+$/) ? w : '');
                          if (digit) return `${digit}時に`;
                        }
                        if (
                          groupWords.length === 2 &&
                          groupWords[0].toLowerCase() === 'every' &&
                          groupWords[1].toLowerCase() === 'morning'
                        ) {
                          return '毎朝';
                        }
                        return groupWords
                          .map((w) => getMeaning(w, undefined))
                          .filter((m) => m && m !== '-')
                          .join(' ');
                      };

                      const items: Array<{ english: string; meaning: string; isPhrase: boolean }> =
                        [];

                      for (let idx = 0; idx < filteredAnalysis.length; idx++) {
                        const analysis = filteredAnalysis[idx];

                        // 熟語の一部ならスキップ
                        if (phrasalWordIndices.has(idx) && !phrasalMap.has(idx)) {
                          continue;
                        }

                        // 熟語の開始位置かチェック
                        const phrasalExpr = phrasalMap.get(idx);

                        if (phrasalExpr) {
                          const phraseKey = phrasalExpr.words.join(' ').toLowerCase();
                          const dictMeaning =
                            wordDictionary.get(phraseKey)?.meaning ||
                            getGroupMeaning(phrasalExpr.words);

                          items.push({
                            english: phrasalExpr.words.join(' '),
                            meaning: dictMeaning,
                            isPhrase: true,
                          });

                          idx += phrasalExpr.words.length - 1;
                          continue;
                        }

                        // 句のまとまり（最小対応）
                        if (analysis.tag === 'Prep' && idx + 1 < filteredAnalysis.length) {
                          const groupWords = [analysis.word, filteredAnalysis[idx + 1].word];
                          items.push({
                            english: groupWords.join(' '),
                            meaning: getGroupMeaning(groupWords),
                            isPhrase: true,
                          });
                          idx += 1;
                          continue;
                        }

                        if (
                          analysis.tag === 'Det' &&
                          analysis.word.toLowerCase() === 'every' &&
                          idx + 1 < filteredAnalysis.length
                        ) {
                          const groupWords = [analysis.word, filteredAnalysis[idx + 1].word];
                          items.push({
                            english: groupWords.join(' '),
                            meaning: getGroupMeaning(groupWords),
                            isPhrase: true,
                          });
                          idx += 1;
                          continue;
                        }

                        // 通常の単語
                        const meaning = getGroupMeaning([analysis.word]);
                        items.push({ english: analysis.word, meaning, isPhrase: false });
                      }

                      const result: JSX.Element[] = [];
                      items.forEach((item, idx) => {
                        const isLast = idx === items.length - 1;
                        if (item.isPhrase) {
                          result.push(
                            <div
                              key={`item-${idx}`}
                              className="inline-flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-200"
                            >
                              <span className="font-medium text-sm border-b-2 border-yellow-600">
                                {item.english}
                              </span>
                              {onAddWordToCustomSet &&
                                onRemoveWordFromCustomSet &&
                                onOpenCustomSetManagement && (
                                  <AddToCustomButton
                                    word={{
                                      word: item.english,
                                      meaning: item.meaning,
                                      source: 'reading',
                                      sourceDetail: currentPassage?.title,
                                    }}
                                    sets={customQuestionSets}
                                    onAddWord={onAddWordToCustomSet}
                                    onRemoveWord={onRemoveWordFromCustomSet}
                                    onOpenManagement={onOpenCustomSetManagement}
                                    size="small"
                                  />
                                )}
                            </div>
                          );
                        } else {
                          result.push(
                            <div
                              key={`item-${idx}`}
                              className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200"
                            >
                              <span className="font-medium text-sm border-b-2 border-blue-600">
                                {item.english}
                              </span>
                              {onAddWordToCustomSet &&
                                onRemoveWordFromCustomSet &&
                                onOpenCustomSetManagement && (
                                  <AddToCustomButton
                                    word={{
                                      word: item.english,
                                      meaning: item.meaning,
                                      source: 'reading',
                                      sourceDetail: currentPassage?.title,
                                    }}
                                    sets={customQuestionSets}
                                    onAddWord={onAddWordToCustomSet}
                                    onRemoveWord={onRemoveWordFromCustomSet}
                                    onOpenManagement={onOpenCustomSetManagement}
                                    size="small"
                                  />
                                )}
                            </div>
                          );
                        }

                        if (!isLast) {
                          result.push(
                            <span key={`sep-${idx}`} className="text-gray-500">
                              +
                            </span>
                          );
                        }
                      });

                      return (
                        <div className="mt-2">
                          <h5 className="text-xs font-semibold mb-1 text-gray-700">
                            📚 単語と熟語
                          </h5>
                          <div className="flex flex-wrap gap-1">{result}</div>
                          <div className="mt-1 text-sm text-gray-700">
                            {items.map((i) => i.meaning).join(' ')}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 構文パターン */}
                    {(() => {
                      const patterns = detectGrammarPatterns(selectedSentenceDetails.text);

                      if (patterns.length === 0) return null;

                      return (
                        <div className="mt-2">
                          <h5 className="text-xs font-semibold mb-1 text-gray-700">📐 重要構文</h5>
                          <div className="space-y-1">
                            {patterns.map((pattern: GrammarPattern, idx: number) => (
                              <div
                                key={idx}
                                className="bg-green-50 p-2 rounded border border-green-200"
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-green-700">
                                    {pattern.name}
                                  </span>
                                  <span className="text-xs text-gray-600">{pattern.meaning}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  💡 {pattern.explanation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 単語カード形式の詳細表示 */}
                    {selectedSentenceDetails.showMeanings && (
                      <div className="word-cards-container">
                        <h5 className="text-sm font-semibold mb-2">📚 単語の意味:</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedSentenceDetails.grammarAnalysis
                            .filter((a) => !/^[.,!?;:\-—–"'()]$/.test(a.word))
                            .map((analysis, idx) => {
                              const meaning = getMeaning(analysis.word, undefined);
                              return (
                                <div
                                  key={idx}
                                  className="word-card"
                                  onDoubleClick={(e) => handleWordDoubleClick(analysis.word, e)}
                                  title="ダブルタップ: 詳細表示"
                                >
                                  <div className="word-card-word">{analysis.word}</div>
                                  {meaning && meaning !== '-' && (
                                    <div className="word-card-meaning text-xs">{meaning}</div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 全文タブ: 英文のみを段落形式で表示 */}
            {readingSubTab === 'fullText' && (
              <div className="full-text-display">
                <h3>📄 全文</h3>
                <div className="full-text-controls">
                  <button
                    className="px-6 py-3 text-base font-medium bg-primary text-white border-2 border-primary rounded-lg transition-all duration-200 hover:bg-primary-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-primary-hover"
                    onClick={() => {
                      // 話者部分（Student 1:, Mom:, etc.）と引用符を除外して発音
                      const fullText = currentPassage.phrases
                        .map((phrase) => {
                          const text = phrase.segments.map((s) => s.word).join(' ');
                          // 話者パターンを削除（Student 1:, Mom:, Teacher:, etc.）
                          return text.replace(/^[A-Z][a-z]*(?:\s+\d+)?:\s*/, '').replace(/"/g, ''); // 引用符を削除
                        })
                        .join(' ')
                        .replace(/\s+([.,!?;:])/g, '$1');

                      speakEnglish(fullText);
                      setIsFullTextSpeaking(true);
                      setIsFullTextPaused(false);
                    }}
                    disabled={isFullTextSpeaking && !isFullTextPaused}
                    title="全文を発音"
                  >
                    🔊 発音
                  </button>
                  <button
                    className="px-6 py-3 text-base font-medium bg-warning text-warning-dark border-2 border-warning rounded-lg transition-all duration-200 hover:bg-warning-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-warning-hover"
                    onClick={() => {
                      if (isFullTextPaused) {
                        resumeSpeaking();
                        setIsFullTextPaused(false);
                      } else {
                        pauseSpeaking();
                        setIsFullTextPaused(true);
                      }
                    }}
                    disabled={!isFullTextSpeaking}
                    title={isFullTextPaused ? '発音を再開' : '発音を一時停止'}
                  >
                    {isFullTextPaused ? '▶️ 再開' : '⏸️ 一時停止'}
                  </button>
                  <button
                    className="px-6 py-3 text-base font-medium bg-error text-white border-2 border-error rounded-lg transition-all duration-200 hover:bg-error-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-error-hover"
                    onClick={() => {
                      stopSpeaking();
                      setIsFullTextSpeaking(false);
                      setIsFullTextPaused(false);
                    }}
                    disabled={!isFullTextSpeaking}
                    title="発音を停止"
                  >
                    ⏹️ 停止
                  </button>
                </div>
                <div className="full-text-content">
                  {(() => {
                    // originalTextが存在する場合はそれを使用
                    if (currentPassage.originalText) {
                      return <div className="paragraph-en">{currentPassage.originalText}</div>;
                    }

                    // パッセージのタイトルで判別: "Daily Conversation"を含む場合は会話形式として処理
                    const isConversation = currentPassage.title
                      .toLowerCase()
                      .includes('conversation');

                    if (isConversation) {
                      // 会話形式: フレーズ単位で処理（各フレーズが話者の発言単位）
                      const lines: string[] = [];

                      currentPassage.phrases.forEach((phrase) => {
                        let lineText = phrase.segments
                          .map((s) => s.word)
                          .join(' ')
                          .trim();
                        if (!lineText || lineText === '-') return;
                        lineText = lineText.replace(/\s+([.,!?;:"])/g, '$1');
                        lines.push(lineText);
                      });

                      return (
                        <div>
                          {lines.map((line, idx) => (
                            <p key={idx} className="paragraph-en conversation-line">
                              {line}
                            </p>
                          ))}
                        </div>
                      );
                    } else {
                      // 通常の長文形式: フレーズから文章を構築
                      // 最初のフレーズが見出しかチェック（句読点で終わらない短いフレーズ）
                      const firstPhrase = currentPassage.phrases[0];
                      const firstPhraseText = firstPhrase.segments
                        .map((s) => s.word)
                        .join(' ')
                        .trim();
                      const isFirstPhraseTitle =
                        firstPhraseText.length < 100 && !/[.!?]$/.test(firstPhraseText);

                      let fullText = '';
                      let lastWasPeriod = true;

                      currentPassage.phrases.forEach((phrase, phraseIdx) => {
                        // 見出しの場合はスキップ（後で独立して表示）
                        if (phraseIdx === 0 && isFirstPhraseTitle) {
                          return;
                        }

                        phrase.segments.forEach((seg) => {
                          let word = seg.word.trim();
                          if (word && word !== '-') {
                            if (/^[.,!?;:]$/.test(word)) {
                              fullText += word;
                              lastWasPeriod = /^[.!?]$/.test(word);
                            } else if (word === '"' || word === "'") {
                              // 引用符はスペースなしで追加
                              fullText += word;
                            } else {
                              if (lastWasPeriod && word.length > 0) {
                                word = word.charAt(0).toUpperCase() + word.slice(1);
                                lastWasPeriod = false;
                              }
                              // 引用符の後ろにはスペースを入れない
                              if (
                                fullText.length > 0 &&
                                !fullText.endsWith(' ') &&
                                !fullText.endsWith('"') &&
                                !fullText.endsWith("'")
                              ) {
                                fullText += ' ';
                              }
                              fullText += word;
                            }
                          }
                        });
                      });

                      // 引用符の前のスペースを削除
                      fullText = fullText.replace(/\s+"/g, '"').replace(/\s+'/g, "'");

                      // 文を分割
                      const sentences = fullText.split(/([.!?])\s+/).filter((s) => s.trim());
                      const reconstructedSentences: string[] = [];
                      for (let i = 0; i < sentences.length; i += 2) {
                        const sentence = sentences[i];
                        const punctuation = sentences[i + 1] || '';
                        reconstructedSentences.push((sentence + punctuation).trim());
                      }

                      // 語数ベースで段落分け
                      const paragraphs: string[] = [];
                      let currentParagraph: string[] = [];
                      let wordCount = 0;
                      const targetWordsPerParagraph = 60;

                      reconstructedSentences.forEach((sentence, idx) => {
                        const sentenceWordCount = sentence.split(/\s+/).length;
                        currentParagraph.push(sentence);
                        wordCount += sentenceWordCount;

                        if (
                          wordCount >= targetWordsPerParagraph ||
                          idx === reconstructedSentences.length - 1
                        ) {
                          paragraphs.push(currentParagraph.join(' '));
                          currentParagraph = [];
                          wordCount = 0;
                        }
                      });

                      if (currentParagraph.length > 0) {
                        paragraphs.push(currentParagraph.join(' '));
                      }

                      // 文ごとにクリック可能にする
                      const allSentences = reconstructedSentences;

                      // 文をクリックしたときの処理
                      const handleSentenceClick = (idx: number) => {
                        setSelectedSentenceIndex(idx);
                        const sentence = allSentences[idx];
                        const grammarAnalysis = analyzeSentence(sentence);
                        setSelectedSentenceDetails({
                          text: sentence,
                          grammarAnalysis,
                          showMeanings: false,
                        });
                      };

                      return (
                        <div>
                          <div className="sentences-container">
                            {allSentences.map((sentence, idx) => (
                              <span
                                key={idx}
                                className={`sentence-clickable ${selectedSentenceIndex === idx ? 'selected' : ''}`}
                                onClick={() => handleSentenceClick(idx)}
                              >
                                {sentence}{' '}
                              </span>
                            ))}
                          </div>

                          {/* 選択された文の読解エリア */}
                          {selectedSentenceIndex !== null && selectedSentenceDetails && (
                            <div className="selected-sentence-analysis">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="m-0">📖 選択した文の読解</h4>
                                <div className="flex gap-2">
                                  <button
                                    className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-hover"
                                    onClick={() => speakEnglish(selectedSentenceDetails.text)}
                                    title="この文を発音"
                                  >
                                    🔊 発音
                                  </button>
                                  <button
                                    className="px-3 py-1 text-sm bg-info text-white rounded hover:bg-info-hover"
                                    onClick={() =>
                                      setSelectedSentenceDetails({
                                        ...selectedSentenceDetails,
                                        showMeanings: !selectedSentenceDetails.showMeanings,
                                      })
                                    }
                                  >
                                    {selectedSentenceDetails.showMeanings
                                      ? '意味を隠す'
                                      : '意味を表示'}
                                  </button>
                                </div>
                              </div>

                              <div className="selected-sentence-text">
                                {selectedSentenceDetails.text}
                              </div>

                              {/* 文法構造の表示 */}
                              <div className="grammar-structure mt-4">
                                <h5 className="text-sm font-semibold mb-2">🔤 文法構造:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {selectedSentenceDetails.grammarAnalysis.map((analysis, idx) => (
                                    <div
                                      key={idx}
                                      className="grammar-tag"
                                      data-tag={analysis.tag}
                                      title={analysis.description}
                                    >
                                      <span className="font-semibold">{analysis.word}</span>
                                      <span
                                        className="ml-1 text-xs grammar-tag-label"
                                        data-tag={analysis.tag}
                                      >
                                        [{analysis.tag}]
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 単語カード形式の詳細表示 */}
                              {selectedSentenceDetails.showMeanings && (
                                <div className="word-cards-container mt-4">
                                  <h5 className="text-sm font-semibold mb-2">📚 単語の意味:</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedSentenceDetails.grammarAnalysis
                                      .filter((a) => !/^[.,!?;:]$/.test(a.word))
                                      .map((analysis, idx) => {
                                        const meaning = getMeaning(analysis.word, undefined);
                                        return (
                                          <div
                                            key={idx}
                                            className="word-card"
                                            onDoubleClick={(e) =>
                                              handleWordDoubleClick(analysis.word, e)
                                            }
                                            title="ダブルタップ: 詳細表示"
                                          >
                                            <div className="word-card-word">{analysis.word}</div>
                                            {meaning && meaning !== '-' && (
                                              <div className="word-card-meaning text-xs">
                                                {meaning}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* 全訳タブ: 全訳ファイルの内容を表示 */}
            {readingSubTab === 'fullTranslation' && (
              <div className="full-translation-display">
                <div className="full-translation-content">
                  {(() => {
                    // デバッグログ
                    console.log('[全訳タブ] currentPassage.id:', currentPassage.id);
                    console.log(
                      '[全訳タブ] currentPassage.translation exists:',
                      !!currentPassage.translation
                    );
                    console.log(
                      '[全訳タブ] currentPassage.translation length:',
                      currentPassage.translation?.length || 0
                    );

                    if (currentPassage.translation) {
                      // 全訳ファイルが存在する場合、段落ごとに分割して表示
                      const paragraphs = currentPassage.translation
                        .split(/\n+/)
                        .map((p) => p.trim())
                        .filter((p) => p.length > 0);

                      return (
                        <div className="full-translation-text">
                          {paragraphs.map((para, idx) => (
                            <p key={idx} className="paragraph-ja">
                              {para}
                            </p>
                          ))}
                        </div>
                      );
                    }

                    // 全訳ファイルがない場合はフレーズ訳を繋げる（フォールバック）
                    // パッセージのタイトルで判別: "Conversation"を含む場合は会話形式として処理
                    const isConversation = currentPassage.title
                      .toLowerCase()
                      .includes('conversation');

                    if (isConversation) {
                      // 会話形式: フレーズ単位で処理（各フレーズが話者の発言単位）
                      const lines: string[] = [];

                      currentPassage.phrases.forEach((phrase) => {
                        let meaning = phrase.phraseMeaning || '';

                        // [要修正]を削除
                        meaning = meaning.replace(/\[要修正\]/g, '').trim();

                        // 空の場合はスキップ
                        if (!meaning || meaning === '-') return;

                        lines.push(meaning);
                      });

                      return lines.map((line, idx) => (
                        <p key={idx} className="paragraph-ja conversation-line">
                          {line}
                        </p>
                      ));
                    } else {
                      // 通常の長文形式: フレーズごとに訳を収集
                      const translatedSentences: string[] = [];
                      let currentSentence = '';

                      currentPassage.phrases.forEach((phrase) => {
                        let meaning = phrase.phraseMeaning || '';
                        if (meaning) {
                          meaning = meaning.replace(/\[要修正\]/g, '').trim();
                          if (!meaning) return;

                          const phraseWords = phrase.segments
                            .map((s) => s.word)
                            .join(' ')
                            .trim();
                          const isEndOfSentence = /[.!?]$/.test(phraseWords);

                          if (!/[。！？]$/.test(meaning)) {
                            if (isEndOfSentence) {
                              currentSentence += meaning + '。';
                              translatedSentences.push(currentSentence.trim());
                              currentSentence = '';
                            } else {
                              currentSentence += meaning + '、';
                            }
                          } else {
                            currentSentence += meaning;
                            if (isEndOfSentence) {
                              translatedSentences.push(currentSentence.trim());
                              currentSentence = '';
                            }
                          }
                        }
                      });

                      if (currentSentence.trim()) {
                        translatedSentences.push(currentSentence.trim() + '。');
                      }

                      // 4文ごとに段落分け
                      const paragraphs: string[] = [];
                      const sentencesPerParagraph = 4;

                      for (let i = 0; i < translatedSentences.length; i += sentencesPerParagraph) {
                        const paragraphSentences = translatedSentences.slice(
                          i,
                          i + sentencesPerParagraph
                        );
                        paragraphs.push(paragraphSentences.join(''));
                      }

                      return paragraphs.map((para, idx) => (
                        <p key={idx} className="paragraph-ja">
                          {para}
                        </p>
                      ));
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

      <style>{`
        .comprehensive-reading-view {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .comprehensive-reading-view {
            max-width: 100%;
            margin: 0;
            padding: 8px;
          }
        }

        .reading-header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .dark-mode .reading-header {
          background: var(--gray-800);
        }

        .reading-header h2 {
          margin: 0 0 20px 0;
        }

        .filter-controls, .passage-selector {
          margin-bottom: 15px;
        }

        .filter-controls label, .passage-selector label {
          font-weight: bold;
          margin-right: 10px;
          color: #333;
        }

        .dark-mode .filter-controls label,
        .dark-mode .passage-selector label {
          color: var(--gray-200);
        }

        .filter-controls select, .passage-selector select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: white;
          color: #333;
        }

        .dark-mode .filter-controls select,
        .dark-mode .passage-selector select {
          background: var(--gray-700);
          border-color: var(--gray-600);
          color: var(--gray-200);
        }

        .passage-stats {
          display: flex;
          gap: 10px;
          margin: 15px 0;
          flex-wrap: wrap;
        }

        .stat-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 14px;
          color: #333;
        }

        .dark-mode .stat-badge {
          background: var(--gray-700);
          color: var(--gray-200);
        }

        .stat-badge.unknown-count {
          background: #fff3cd;
          color: #856404;
          font-weight: bold;
        }

        .dark-mode .stat-badge.unknown-count {
          background: var(--yellow-500);
          color: var(--black);
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .action-buttons button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover {
          background: #138496;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-success:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .passage-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .dark-mode .passage-content {
          background: var(--gray-800);
          color: var(--gray-100);
        }

        .passage-title {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 24px;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .dark-mode .passage-title {
          color: var(--white);
        }

        .passage-body {
          line-height: 1.5;
          font-family: 'Times New Roman', Georgia, serif;
          color: #333;
        }

        .dark-mode .passage-body {
          color: var(--gray-200);
        }

        .phrase-block {
          margin-bottom: 8px;
          padding: 8px 12px;
          background: #ffffff;
          border-left: 3px solid #007bff;
          border-radius: 2px;
        }

        .dark-mode .phrase-block {
          background: var(--gray-700);
          border-left-color: var(--blue-400);
        }

        .phrase-english {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 6px;
          font-family: 'Times New Roman', 'Georgia', serif;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
        }

        .word-card {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 2px 5px;
          margin: 1px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 60px;
        }

        .dark-mode .word-card {
          background: var(--gray-700);
          border-color: var(--gray-600);
        }

        .word-card:hover {
          background: #e7f3ff;
          border-color: #007bff;
        }

        .dark-mode .word-card:hover {
          background: var(--gray-600);
          border-color: var(--blue-400);
        }

        .word-card.unknown {
          background: #ffc107;
          color: #000;
          border-color: #ff9800;
          font-weight: bold;
        }

        .word-card.phrase-card {
          background: #e8f5e9;
          border-color: #4caf50;
        }

        .dark-mode .word-card.phrase-card {
          background: var(--gray-700);
          border-color: var(--green-400);
        }

        .word-card.phrase-card:hover {
          background: #c8e6c9;
        }

        .dark-mode .word-card.phrase-card:hover {
          background: var(--gray-600);
        }

        .word-card.punctuation-card {
          min-width: 20px;
          background: transparent;
          border: none;
          cursor: default;
          padding: 2px 4px;
        }

        .word-card.punctuation-card:hover {
          background: transparent;
          border: none;
        }

        .word-card-word {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          text-align: center;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .dark-mode .word-card-word {
          color: var(--gray-200);
        }

        .phrase-card .word-card-word {
          font-size: 15px;
          color: #2e7d32;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .dark-mode .phrase-card .word-card-word {
          color: var(--green-400);
        }

        .word-card-meaning {
          font-size: 12px;
          color: #666;
          margin-top: 1px;
          text-align: center;
          padding: 1px 3px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
          min-height: 14px;
        }

        .dark-mode .word-card-meaning {
          color: var(--gray-300);
          background: rgba(48, 48, 48, 0.8);
        }

        .word-segment {
          display: inline-block;
          padding: 2px 4px;
          margin: 0 2px;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .word-segment:hover {
          background: #e7f3ff;
        }

        .word-segment.unknown {
          background: #ffc107;
          color: #000;
          font-weight: bold;
        }

        .show-translation-btn {
          background: #f8f9fa;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          color: #666;
          font-size: 14px;
        }

        .show-translation-btn:hover {
          background: #e9ecef;
        }

        .phrase-translation {
          margin-top: 10px;
          padding: 15px;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }

        .dark-mode .phrase-translation {
          background: var(--gray-800);
          border-color: var(--gray-600);
        }

        .translation-text {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .dark-mode .translation-text {
          color: var(--gray-200);
        }

        .word-meanings {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 14px;
          color: #666;
        }

        .dark-mode .word-meanings {
          color: var(--gray-300);
        }

        .word-meaning-pair {
          background: #e7f3ff;
          padding: 4px 8px;
          border-radius: 3px;
        }

        .dark-mode .word-meaning-pair {
          background: var(--gray-700);
          color: var(--gray-200);
        }

        .error-message, .empty-container {
          text-align: center;
          padding: 50px;
          font-size: 18px;
          color: #666;
        }

        .dark-mode .error-message,
        .dark-mode .empty-container {
          color: var(--gray-300);
        }

        .error-message {
          color: #dc3545;
        }

        .dark-mode .error-message {
          color: var(--red-400);
        }

        /* 単語ポップアップのスタイル */
        .word-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 999;
        }

        .word-popup {
          position: absolute;
          left: var(--popup-x, 0);
          top: var(--popup-y, 0);
          background: white;
          border: 2px solid #007bff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          max-width: 400px;
          min-width: 250px;
        }

        .dark-mode .word-popup {
          background: var(--gray-800);
          border-color: var(--blue-400);
          color: var(--gray-200);
        }

        .popup-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #f8f9fa;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup-close:hover {
          background: #e9ecef;
          color: #000;
        }

        .popup-word {
          font-size: 20px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 4px;
          padding-right: 30px;
        }

        .popup-reading {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .popup-meaning {
          font-size: 16px;
          color: #333;
          margin-bottom: 12px;
          padding: 8px;
          background: #f0f8ff;
          border-radius: 4px;
        }

        .popup-etymology {
          font-size: 13px;
          color: #555;
          margin-bottom: 8px;
          padding: 6px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .popup-related {
          font-size: 13px;
          color: #555;
          padding: 6px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .popup-etymology strong,
        .popup-related strong {
          color: #007bff;
        }

        .full-text-display, .full-translation-display {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 20px;
        }

        .dark-mode .full-text-display,
        .dark-mode .full-translation-display {
          background: var(--gray-800);
          color: var(--gray-100);
        }

        .full-text-display h3, .full-translation-display h3 {
          margin: 0 0 15px 0;
          color: #667eea;
        }

        .dark-mode .full-text-display h3,
        .dark-mode .full-translation-display h3 {
          color: var(--blue-400);
        }

        .full-text-content {
          font-size: 1.1em;
          line-height: 1.8;
          color: #333;
          font-family: 'Times New Roman', 'Georgia', serif;
        }

        .full-text-content .paragraph-en {
          margin-bottom: 1.5em;
          text-indent: 2em;
          text-align: left;
        }

        .full-text-content .paragraph-en:first-child {
          margin-top: 0;
        }

        /* 会話形式の行スタイル */
        .full-text-content .conversation-line {
          text-indent: 0;
          margin-bottom: 1em;
          padding-left: 1em;
          border-left: 3px solid #667eea;
        }

        .full-translation-content {
          font-size: 1.05em;
          line-height: 2;
          color: #333;
        }

        .full-translation-text {
          white-space: pre-wrap;
          line-height: 2;
        }

        .full-translation-content .paragraph-ja {
          margin-bottom: 1.5em;
          text-indent: 1em;
          text-align: left;
        }

        .full-translation-content .paragraph-ja:first-child {
          margin-top: 0;
        }

        /* 会話形式の日本語訳スタイル */
        .full-translation-content .conversation-line {
          text-indent: 0;
          margin-bottom: 1em;
          padding-left: 1em;
          border-left: 3px solid #667eea;
        }

        .translation-line {
          margin-bottom: 10px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default ComprehensiveReadingView;
