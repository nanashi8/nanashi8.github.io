import { useState, useEffect, useMemo, useCallback } from 'react';
import { ReadingPassage, Question, ReadingSegment } from '../types';
import { twoWordPhrases, commonPhrases } from '../utils/phrases';
import { speakEnglish, isSpeechSynthesisSupported, stopSpeaking, pauseSpeaking, resumeSpeaking, isSpeaking, isPaused } from '../speechSynthesis';

type DifficultyFilter = 'all' | '初級' | '中級' | '上級';

interface ComprehensiveReadingViewProps {
  onSaveUnknownWords?: (words: { word: string; meaning: string }[]) => void;
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

function ComprehensiveReadingView({ onSaveUnknownWords }: ComprehensiveReadingViewProps) {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [phraseTranslations, setPhraseTranslations] = useState<boolean[]>([]);
  const [wordMeaningsVisible, setWordMeaningsVisible] = useState<boolean[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordDictionary, setWordDictionary] = useState<Map<string, Question>>(new Map());
  const [readingDictionary, setReadingDictionary] = useState<Map<string, any>>(new Map());
  const [wordPopup, setWordPopup] = useState<WordPopup | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [showFullTranslation, setShowFullTranslation] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [readingStarted, setReadingStarted] = useState(false);
  const [readingSubTab, setReadingSubTab] = useState<'reading' | 'fullText' | 'fullTranslation'>('reading');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isFullTextSpeaking, setIsFullTextSpeaking] = useState(false);
  const [isFullTextPaused, setIsFullTextPaused] = useState(false);

  // passagesが更新されたらLocalStorageに保存（エラーハンドリング追加）
  useEffect(() => {
    if (passages.length > 0) {
      const readingDataKey = 'reading-passages-data';
      try {
        localStorage.setItem(readingDataKey, JSON.stringify(passages));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('長文読解データの保存に失敗（容量超過）');
          // 既存のデータを削除して再試行
          localStorage.removeItem(readingDataKey);
          try {
            localStorage.setItem(readingDataKey, JSON.stringify(passages));
            console.log('古いデータを削除して再保存しました。');
          } catch (retryError) {
            console.error('再保存も失敗:', retryError);
            // 長文読解データは次回読み込み時に再取得されるため、警告のみ
            console.warn('長文読解の進捗は保存されませんでしたが、次回読み込み時に復元されます。');
          }
        } else {
          console.error('長文読解データの保存エラー:', error);
        }
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
  const groupSegmentsByPhrases = (segments: ReadingSegment[]): PhraseGroup[] => {
    const groups: PhraseGroup[] = [];
    let i = 0;

    while (i < segments.length) {
      // 3単語フレーズをチェック
      if (i + 2 < segments.length) {
        const threeWords = [
          segments[i].word.toLowerCase(),
          segments[i + 1].word.toLowerCase(),
          segments[i + 2].word.toLowerCase()
        ].join(' ');
        
        if (commonPhrases.includes(threeWords)) {
          groups.push({
            type: 'phrase',
            words: [segments[i].word, segments[i + 1].word, segments[i + 2].word],
            segments: [segments[i], segments[i + 1], segments[i + 2]],
            isUnknown: segments[i].isUnknown || segments[i + 1].isUnknown || segments[i + 2].isUnknown
          });
          i += 3;
          continue;
        }
      }

      // 2単語フレーズをチェック
      if (i + 1 < segments.length) {
        const twoWords = [
          segments[i].word.toLowerCase(),
          segments[i + 1].word.toLowerCase()
        ].join(' ');
        
        if (twoWordPhrases.includes(twoWords)) {
          groups.push({
            type: 'phrase',
            words: [segments[i].word, segments[i + 1].word],
            segments: [segments[i], segments[i + 1]],
            isUnknown: segments[i].isUnknown || segments[i + 1].isUnknown
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
        isUnknown: segments[i].isUnknown
      });
      i += 1;
    }

    return groups;
  };

  // 単語集データの読み込み
  useEffect(() => {
    // メイン辞書（CSV）の読み込み
    fetch('/data/junior-high-entrance-words.csv')
      .then((res) => res.text())
      .then((csvText) => {
        const lines = csvText.split('\n');
        const dictionary = new Map<string, Question>();
        
        // ヘッダー行をスキップして処理
        lines.slice(1).forEach((line) => {
          if (!line.trim()) return;
          
          // CSVをパース（簡易版）
          const row = line.split(',').map(cell => cell.trim());
          
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
        
        setWordDictionary(dictionary);
      })
      .catch((err) => {
        console.error('Error loading word dictionary:', err);
      });
    
    // 長文読解専用辞書（JSON）の読み込み
    fetch('/data/reading-passages-dictionary.json')
      .then((res) => res.json())
      .then((dictData) => {
        const readingDict = new Map<string, any>();
        
        Object.entries(dictData).forEach(([word, info]: [string, any]) => {
          readingDict.set(word.toLowerCase(), info);
        });
        
        setReadingDictionary(readingDict);
        console.log(`長文読解辞書: ${readingDict.size}単語を読み込みました`);
      })
      .catch((err) => {
        console.error('Error loading reading dictionary:', err);
      });
  }, []);

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
      return;
    }
    
    // まずLocalStorageから保存済みデータを確認
    const readingDataKey = 'reading-passages-data';
    const storedData = localStorage.getItem(readingDataKey);
    
    fetch('/data/reading-passages-comprehensive.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load passages');
        return res.json();
      })
      .then((data: ReadingPassage[]) => {
        console.log('Loaded passages:', data); // デバッグ用
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No passages available');
        }
        
        // データを変換: words配列からsegments配列を生成（存在しない場合）
        let processedData = data.map(passage => ({
          ...passage,
          phrases: passage.phrases?.map(phrase => {
            if (phrase.segments && phrase.segments.length > 0) {
              // segmentsが既に存在する場合はそのまま使用
              return phrase;
            }
            
            // words配列とwordMeaningsからsegmentsを生成
            const segments: ReadingSegment[] = [];
            const wordMeanings = (phrase as any).wordMeanings || {}; // wordMeaningsオブジェクト（もしあれば）
            
            phrase.words?.forEach((word, idx) => {
              // 句読点を検出
              const punctuationMatch = word.match(/([.,!?;:])$/);
              
              if (punctuationMatch) {
                // 句読点が単語に含まれている場合は分離
                const cleanWord = word.replace(/[.,!?;:]$/, '');
                const punctuation = punctuationMatch[1];
                
                // まずwordMeaningsから取得を試みる
                let meaning = wordMeanings[cleanWord] || '';
                // wordMeaningsになければ辞書から取得
                if (!meaning) {
                  const lemma = getLemma(cleanWord);
                  const wordData = wordDictionary.get(lemma);
                  const readingWord = readingDictionary.get(lemma);
                  meaning = wordData?.meaning || readingWord?.meaning || '';
                }
                // '-'は設定しない（空文字列にする）
                if (meaning === '-') meaning = '';
                
                // 単語を追加（句読点なし）
                segments.push({
                  word: cleanWord,
                  meaning,
                  isUnknown: false
                });
                
                // 句読点を独立した要素として追加
                segments.push({
                  word: punctuation,
                  meaning: '',
                  isUnknown: false
                });
              } else {
                // 句読点がない通常の単語
                // まずwordMeaningsから取得を試みる
                let meaning = wordMeanings[word] || '';
                // wordMeaningsになければ辞書から取得
                if (!meaning) {
                  const lemma = getLemma(word);
                  const wordData = wordDictionary.get(lemma);
                  const readingWord = readingDictionary.get(lemma);
                  meaning = wordData?.meaning || readingWord?.meaning || '';
                }
                // '-'は設定しない（空文字列にする）
                if (meaning === '-') meaning = '';
                
                segments.push({
                  word,
                  meaning,
                  isUnknown: false
                });
              }
            });
            
            return {
              ...phrase,
              segments
            };
          }) || []
        }));
        
        // LocalStorageに保存済みデータがあればマージ
        if (storedData) {
          try {
            const savedPassages = JSON.parse(storedData);
            processedData = processedData.map(passage => {
              const saved = savedPassages.find((p: ReadingPassage) => p.id === passage.id);
              if (saved) {
                // 保存済みのisUnknown状態をマージ
                return {
                  ...passage,
                  phrases: passage.phrases.map((phrase, pIdx) => ({
                    ...phrase,
                    segments: phrase.segments.map((seg, sIdx) => ({
                      ...seg,
                      isUnknown: saved.phrases?.[pIdx]?.segments?.[sIdx]?.isUnknown || false
                    }))
                  }))
                };
              }
              return passage;
            });
          } catch (err) {
            console.error('LocalStorageデータの読み込みエラー:', err);
          }
        }
        
        setPassages(processedData);
        setLoading(false);
        if (processedData.length > 0) {
          setSelectedPassageId(processedData[0].id);
          setPhraseTranslations(new Array(processedData[0].phrases?.length || 0).fill(false));
          setWordMeaningsVisible(new Array(processedData[0].phrases?.length || 0).fill(false));
        }
      })
      .catch((err) => {
        console.error('Error loading passages:', err);
        setError('パッセージの読み込みに失敗しました: ' + err.message);
        setLoading(false);
      });
  }, [wordDictionary]); // 辞書が読み込まれたら再実行

  // 現在のパッセージをメモ化
  const currentPassage = useMemo(
    () => passages.find((p) => p.id === selectedPassageId),
    [passages, selectedPassageId]
  );

  // フィルタリングされたパッセージをメモ化
  const filteredPassages = useMemo(
    () => difficultyFilter === 'all' 
      ? passages 
      : passages.filter(p => p.level === difficultyFilter),
    [passages, difficultyFilter]
  );

  // 原形変換をメモ化（辞書が変わらない限りキャッシュ）
  const getLemma = useCallback((word: string): string => {
    const normalized = word.toLowerCase().replace(/[.,!?;:"']/g, '').trim();
    
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
  }, [wordDictionary, readingDictionary]);

  // 単語の意味を辞書から取得（メモ化）
  const getMeaning = useCallback((word: string, existingMeaning?: string): string => {
    // existingMeaningがあり、'-'でない場合はそれを使用
    if (existingMeaning && existingMeaning.trim() && existingMeaning !== '-') {
      return existingMeaning;
    }
    
    // 辞書から取得
    const lemma = getLemma(word);
    
    // メイン辞書をチェック
    const wordData = wordDictionary.get(lemma);
    if (wordData?.meaning) {
      return wordData.meaning;
    }
    
    // 長文読解辞書をチェック
    const readingWord = readingDictionary.get(lemma);
    if (readingWord?.meaning) {
      return readingWord.meaning;
    }
    
    // どちらもない場合は空文字列を返す（句読点や辞書にない単語）
    return '';
  }, [getLemma, wordDictionary, readingDictionary]);

  // パッセージ選択（メモ化）
  const handleSelectPassage = useCallback((passageId: string) => {
    setSelectedPassageId(passageId);
    const passage = passages.find(p => p.id === passageId);
    if (passage) {
      setPhraseTranslations(new Array(passage.phrases?.length || 0).fill(false));
      setWordMeaningsVisible(new Array(passage.phrases?.length || 0).fill(false));
    }
  }, [passages]);

  // 学習設定モーダル
  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
  };

  // 読解開始
  const handleStartReading = () => {
    if (!selectedPassageId) {
      alert('パッセージを選択してください');
      return;
    }
    setReadingStarted(true);
    setCurrentPhraseIndex(0); // 最初のフレーズから開始
  };

  // フレーズナビゲーション
  const handlePreviousPhrase = () => {
    setCurrentPhraseIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPhrase = () => {
    if (currentPassage && currentPassage.phrases) {
      setCurrentPhraseIndex(prev => Math.min(currentPassage.phrases.length - 1, prev + 1));
    }
  };

  // フレーズ全体を発音する（メモ化）
  const handlePhraseSpeak = useCallback((phraseIdx: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentPassage || !isSpeechSynthesisSupported()) return;
    
    const phrase = currentPassage.phrases[phraseIdx];
    const phraseText = phrase.segments
      .filter(seg => seg.word && seg.word.trim() !== '')
      .map(seg => seg.word)
      .join(' ');
    
    speakEnglish(phraseText, { rate: 0.85 });
    
    // ビジュアルフィードバック
    const element = event.currentTarget as HTMLElement;
    element.classList.add('speaking');
    setTimeout(() => {
      element.classList.remove('speaking');
    }, 600);
  }, [currentPassage]);

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
    const normalizedWord = word.toLowerCase().replace(/[.,!?;:"']/g, '').trim();
    
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
        console.warn(`Word not found in dictionary: ${normalizedWord}`);
      }
    }
  };

  // 単語を「分からない」としてマーク
  const handleMarkUnknown = (phraseIndex: number, segmentIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation(); // ポップアップ表示を防ぐ
    if (!currentPassage) return;

    setPassages(prev =>
      prev.map(passage =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map((phrase, pIdx) =>
                pIdx === phraseIndex
                  ? {
                      ...phrase,
                      segments: phrase.segments.map((seg, sIdx) =>
                        sIdx === segmentIndex
                          ? { ...seg, isUnknown: !seg.isUnknown }
                          : seg
                      ),
                    }
                  : phrase
              ),
            }
          : passage
      )
    );
  };

  // 個別フレーズの訳を表示（2段階）
  const handleShowPhraseTranslation = (phraseIndex: number) => {
    // 最初のクリック: 単語の意味を表示
    if (!wordMeaningsVisible[phraseIndex]) {
      setWordMeaningsVisible(prev => {
        const newState = [...prev];
        newState[phraseIndex] = true;
        return newState;
      });
    } else if (!phraseTranslations[phraseIndex]) {
      // 2回目のクリック: フレーズ全体の訳を表示
      setPhraseTranslations(prev => {
        const newState = [...prev];
        newState[phraseIndex] = true;
        return newState;
      });
    }
  };

  // 全文を表示トグル（サブタブ切り替えに変更）
  const handleToggleFullText = () => {
    setReadingSubTab(prev => prev === 'fullText' ? 'reading' : 'fullText');
  };

  // 全訳を表示トグル（サブタブ切り替えに変更）
  const handleToggleFullTranslation = () => {
    setReadingSubTab(prev => prev === 'fullTranslation' ? 'reading' : 'fullTranslation');
  };

  // 分からない単語を保存
  const handleSaveUnknownWords = () => {
    if (!currentPassage) return;

    const unknownWords: { word: string; meaning: string }[] = [];
    currentPassage.phrases.forEach(phrase => {
      phrase.segments.forEach(segment => {
        if (segment.isUnknown && segment.word.trim() !== '') {
          // 重複を避ける
          if (!unknownWords.some(w => w.word.toLowerCase() === segment.word.toLowerCase())) {
            unknownWords.push({
              word: segment.word,
              meaning: segment.meaning,
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
    setPassages(prev =>
      prev.map(passage =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map(phrase => ({
                ...phrase,
                segments: phrase.segments.map(seg => ({ ...seg, isUnknown: false })),
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
    
    setPassages(prev =>
      prev.map(passage =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map(phrase => ({
                ...phrase,
                segments: phrase.segments.map(seg => ({ ...seg, isUnknown: false })),
              })),
            }
          : passage
      )
    );
    setPhraseTranslations(new Array(currentPassage.phrases.length).fill(false));
    setWordMeaningsVisible(new Array(currentPassage.phrases.length).fill(false));
  };

  if (loading) {
    return <div className="loading-container">読み込み中...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
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

  const unknownCount = currentPassage?.phrases?.reduce(
    (count, phrase) => count + phrase.segments.filter(s => s.isUnknown).length,
    0
  ) || 0;

  return (
    <div className="comprehensive-reading-view">

      <div className="reading-header">
        
        {/* 学習設定・読解開始ボタン */}
        <div className="reading-action-buttons">
          <button 
            onClick={handleOpenSettings}
            className="btn-settings"
          >
            ⚙️ 学習設定
          </button>
          <button 
            onClick={handleStartReading}
            className="btn-start-reading"
            disabled={!selectedPassageId}
          >
            📖 読解開始
          </button>
        </div>

        {/* 難易度とパッセージを横並び（学習設定モーダル内に移動予定） */}
        {showSettingsModal && (
          <>
            <div className="modal-overlay" onClick={handleCloseSettings} />
            <div className="settings-modal">
              <div className="modal-header">
                <h3>学習設定</h3>
                <button onClick={handleCloseSettings} className="modal-close">✕</button>
              </div>
              <div className="modal-body">
                <div className="reading-selectors">
                  <div className="filter-controls">
                    <label htmlFor="difficulty-filter">難易度: </label>
                    <select 
                      id="difficulty-filter"
                      value={difficultyFilter} 
                      onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                      title="難易度を選択"
                      className="compact-select"
                    >
                      <option value="all">全て</option>
                      <option value="初級">初級</option>
                      <option value="中級">中級</option>
                      <option value="上級">上級</option>
                    </select>
                  </div>

                  <div className="passage-selector">
                    <label htmlFor="passage-select">パッセージ: </label>
                    <select 
                      id="passage-select"
                      value={selectedPassageId || ''} 
                      onChange={(e) => handleSelectPassage(e.target.value)}
                      title="パッセージを選択"
                      className="compact-select"
                    >
                      {filteredPassages.map(passage => (
                        <option key={passage.id} value={passage.id}>
                          {passage.title} ({passage.level} - {passage.actualWordCount}語)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={handleCloseSettings} className="btn-confirm">確定</button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* 4タブ構造 + 操作ボタン（読解開始後に表示） */}
      {readingStarted && (
        <div className="reading-sub-tabs">
          <button
            className={`sub-tab-btn ${readingSubTab === 'reading' ? 'active' : ''}`}
            onClick={() => setReadingSubTab('reading')}
          >
            📖 読解
          </button>
          <button
            className={`sub-tab-btn ${readingSubTab === 'fullText' ? 'active' : ''}`}
            onClick={() => setReadingSubTab('fullText')}
          >
            📄 全文
          </button>
          <button
            className={`sub-tab-btn ${readingSubTab === 'fullTranslation' ? 'active' : ''}`}
            onClick={() => setReadingSubTab('fullTranslation')}
          >
            📝 全訳
          </button>
          <button
            className="sub-tab-btn"
            onClick={handleOpenSettings}
            title="学習設定を開く"
          >
            ⚙️ 学習設定
          </button>
          <div className="sub-tab-divider"></div>
          <button 
            onClick={handleSaveUnknownWords}
            className="sub-tab-btn sub-tab-action"
            disabled={unknownCount === 0}
            title="未知語を保存"
          >
            💾 保存 ({unknownCount})
          </button>
          <button 
            onClick={handleReset}
            className="sub-tab-btn sub-tab-action"
            title="リセット"
          >
            🔄 リセット
          </button>
        </div>
      )}

      {/* 単語ポップアップ */}
      {wordPopup && (
        <>
          <div className="word-popup-overlay" onClick={() => setWordPopup(null)} />
          <div 
            className="word-popup"
            data-popup-x={wordPopup.x}
            data-popup-y={wordPopup.y}
          >
            <button 
              className="popup-close" 
              onClick={() => setWordPopup(null)}
              title="閉じる"
            >
              ✕
            </button>
            <div className="popup-word">{wordPopup.word}</div>
            {wordPopup.reading && (
              <div className="popup-reading">{wordPopup.reading}</div>
            )}
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
      {readingStarted && currentPassage && currentPassage.phrases && currentPassage.phrases.length > 0 && (
        <div className="passage-content">
          <h3 className="passage-title">{currentPassage.title}</h3>
          
          {/* 読解タブ: フレーズ単位で表示 */}
          {readingSubTab === 'reading' && (
          <>
            {/* フレーズナビゲーション */}
            <div className="phrase-navigation">
              <button 
                className="nav-btn prev-btn"
                onClick={handlePreviousPhrase}
                disabled={currentPhraseIndex === 0}
                title="前のフレーズ"
              >
                ←
              </button>
              {isSpeechSynthesisSupported() && (
                <button
                  className="phrase-speaker-btn-compact"
                  onClick={(e) => handlePhraseSpeak(currentPhraseIndex, e)}
                  title={`フレーズ全体を発音 (${currentPhraseIndex + 1}/${currentPassage.phrases.length})`}
                >
                  🔊
                </button>
              )}
              <button 
                className="nav-btn next-btn"
                onClick={handleNextPhrase}
                disabled={currentPhraseIndex === currentPassage.phrases.length - 1}
                title="次のフレーズ"
              >
                →
              </button>
            </div>

            <div className="passage-body">
            {currentPassage.phrases.map((phrase, phraseIdx) => {
              // 現在のフレーズのみ表示
              if (phraseIdx !== currentPhraseIndex) return null;
              
              return (
              <div key={phrase.id} className={`phrase-block ${phraseIdx === currentPhraseIndex ? 'current-phrase' : ''}`}>
                {/* 英文 - 単語/フレーズをカード形式で表示（意味も含む） */}
                <div className="phrase-english">
                  {(() => {
                    const groups = groupSegmentsByPhrases(phrase.segments || []);
                    return groups.map((group, groupIdx) => {
                      if (group.type === 'phrase') {
                        // フレーズカード
                        const phraseText = group.words.join(' ');
                        const phraseMeanings = group.segments
                          .map(seg => getMeaning(seg.word, seg.meaning))
                          .filter(m => m && m !== '-'); // '-'も除外
                        const combinedMeaning = phraseMeanings.join('・');

                        return (
                          <div
                            key={`group-${groupIdx}`}
                            className={`word-card phrase-card ${group.isUnknown ? 'unknown' : ''}`}
                            onDoubleClick={(e) => handleWordDoubleClick(phraseText, e)}
                            title="ダブルタップ: 詳細表示"
                          >
                            <div className="word-card-word phrase-word">
                              {phraseText}
                            </div>
                            {wordMeaningsVisible[phraseIdx] && combinedMeaning && (
                              <div className="word-card-meaning">{combinedMeaning}</div>
                            )}
                          </div>
                        );
                      } else {
                        // 単語カード
                        const segment = group.segments[0];
                        
                        // 空の単語をスキップ
                        if (!segment || !segment.word || segment.word.trim() === '') {
                          return null;
                        }
                        
                        const segIdx = phrase.segments.findIndex(s => s === segment);
                        const isPunctuation = /^[.,!?;:]$/.test(segment.word);
                        
                        // 句読点の場合
                        if (isPunctuation) {
                          return (
                            <div
                              key={`group-${groupIdx}`}
                              className="word-card punctuation-card"
                            >
                              <div className="word-card-word">{segment.word}</div>
                            </div>
                          );
                        }
                        
                        // 通常の単語カード
                        const meaning = getMeaning(segment.word, segment.meaning);

                        return (
                          <div
                            key={`group-${groupIdx}`}
                            className={`word-card ${segment.isUnknown ? 'unknown' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleMarkUnknown(phraseIdx, segIdx, e);
                            }}
                            onDoubleClick={(e) => handleWordDoubleClick(segment.word, e)}
                            title="タップ: 保存対象マーク / ダブルタップ: 詳細表示"
                          >
                            <div className="word-card-word">
                              {segment.word}
                            </div>
                            {wordMeaningsVisible[phraseIdx] && meaning && meaning !== '-' && (
                              <div className="word-card-meaning">{meaning}</div>
                            )}
                          </div>
                        );
                      }
                    }).filter(Boolean);
                  })()}
                </div>

                {/* 和訳（表示/非表示） */}
                {phraseTranslations[phraseIdx] ? (
                  <div className="phrase-translation visible">
                    <div className="translation-text">{phrase.phraseMeaning}</div>
                  </div>
                ) : (
                  <button
                    className="show-translation-btn"
                    onClick={() => handleShowPhraseTranslation(phraseIdx)}
                  >
                    {!wordMeaningsVisible[phraseIdx] ? '単語の意味を表示 ▼' : 'フレーズの意味を表示 ▼'}
                  </button>
                )}
              </div>
            );
            })}
          </div>
          </>
          )}

          {/* 全文タブ: 英文のみを段落形式で表示 */}
          {readingSubTab === 'fullText' && (
            <div className="full-text-display">
              <h3>📄 全文</h3>
              <div className="full-text-controls">
                <button
                  className="full-text-speaker-btn"
                  onClick={() => {
                    const fullText = currentPassage.phrases
                      .map(phrase => phrase.segments.map(s => s.word).join(' '))
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
                  className="full-text-pause-btn"
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
                  title={isFullTextPaused ? "発音を再開" : "発音を一時停止"}
                >
                  {isFullTextPaused ? '▶️ 再開' : '⏸️ 一時停止'}
                </button>
                <button
                  className="full-text-stop-btn"
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
                  // フレーズから自然な文章を構築
                  let fullText = '';
                  currentPassage.phrases.forEach((phrase) => {
                    phrase.segments.forEach((seg) => {
                      const word = seg.word.trim();
                      if (word && word !== '-') {
                        // 句読点の前にスペースを入れない
                        if (/^[.,!?;:]$/.test(word)) {
                          fullText += word;
                        } else {
                          // 単語の前にスペースを追加（文頭以外）
                          if (fullText.length > 0 && !fullText.endsWith(' ')) {
                            fullText += ' ';
                          }
                          fullText += word;
                        }
                      }
                    });
                  });

                  // ピリオド、感嘆符、疑問符で文を分割
                  const sentences = fullText.split(/([.!?])\s+/).filter(s => s.trim());
                  
                  // 文を再構築して段落に分ける
                  const reconstructedSentences: string[] = [];
                  for (let i = 0; i < sentences.length; i += 2) {
                    const sentence = sentences[i];
                    const punctuation = sentences[i + 1] || '';
                    reconstructedSentences.push((sentence + punctuation).trim());
                  }

                  // 3〜5文ごとに段落を作成
                  const paragraphs: string[] = [];
                  const sentencesPerParagraph = Math.max(3, Math.ceil(reconstructedSentences.length / 3));
                  
                  for (let i = 0; i < reconstructedSentences.length; i += sentencesPerParagraph) {
                    const paragraphSentences = reconstructedSentences.slice(i, i + sentencesPerParagraph);
                    paragraphs.push(paragraphSentences.join(' '));
                  }

                  return paragraphs.map((para, idx) => (
                    <p key={idx} className="paragraph-en">
                      {para}
                    </p>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* 全訳タブ: 日本語訳のみを段落形式で表示 */}
          {readingSubTab === 'fullTranslation' && (
            <div className="full-translation-display">
              <div className="full-translation-content">
                {(() => {
                  // フレーズごとに訳を収集（文の区切りを保持）
                  const translatedSentences: string[] = [];
                  let currentSentence = '';
                  
                  currentPassage.phrases.forEach((phrase, idx) => {
                    let meaning = phrase.phraseMeaning || '';
                    if (meaning) {
                      // [要修正]を削除
                      meaning = meaning.replace(/\[要修正\]/g, '').trim();
                      
                      // 空になった場合はスキップ
                      if (!meaning) return;
                      
                      // 英文のフレーズが文の終わりかチェック
                      const phraseWords = phrase.segments
                        .map(s => s.word)
                        .join(' ')
                        .trim();
                      const isEndOfSentence = /[.!?]$/.test(phraseWords);
                      
                      // 既に句読点で終わっていない場合
                      if (!/[。！？]$/.test(meaning)) {
                        if (isEndOfSentence) {
                          // 文の終わり
                          currentSentence += meaning + '。';
                          translatedSentences.push(currentSentence.trim());
                          currentSentence = '';
                        } else {
                          // 文の途中
                          currentSentence += meaning + '、';
                        }
                      } else {
                        // 既に句読点がある場合
                        currentSentence += meaning;
                        if (isEndOfSentence) {
                          translatedSentences.push(currentSentence.trim());
                          currentSentence = '';
                        }
                      }
                    }
                  });
                  
                  // 残りの文があれば追加
                  if (currentSentence.trim()) {
                    translatedSentences.push(currentSentence.trim() + '。');
                  }

                  // 3〜5文ごとに段落を作成（全文タブと同じロジック）
                  const paragraphs: string[] = [];
                  const sentencesPerParagraph = Math.max(3, Math.ceil(translatedSentences.length / 3));
                  
                  for (let i = 0; i < translatedSentences.length; i += sentencesPerParagraph) {
                    const paragraphSentences = translatedSentences.slice(i, i + sentencesPerParagraph);
                    paragraphs.push(paragraphSentences.join(''));
                  }

                  return paragraphs.map((para, idx) => (
                    <p key={idx} className="paragraph-ja">
                      {para}
                    </p>
                  ));
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
        }

        .reading-header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
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
        }

        .filter-controls select, .passage-selector select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
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
        }

        .stat-badge.unknown-count {
          background: #fff3cd;
          color: #856404;
          font-weight: bold;
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

        .passage-title {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 24px;
        }

        .passage-body {
          line-height: 1.5;
          font-family: 'Times New Roman', 'Noto Serif JP', 'Yu Mincho', '游明朝', YuMincho, serif;
        }

        .phrase-block {
          margin-bottom: 8px;
          padding: 8px 12px;
          background: #ffffff;
          border-left: 3px solid #007bff;
          border-radius: 2px;
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
          padding: 6px 10px;
          margin: 2px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 60px;
        }

        .word-card:hover {
          background: #e7f3ff;
          border-color: #007bff;
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

        .word-card.phrase-card:hover {
          background: #c8e6c9;
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
        }

        .phrase-card .word-card-word {
          font-size: 15px;
          color: #2e7d32;
        }

        .word-card-meaning {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
          text-align: center;
          padding: 2px 4px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
          min-height: 16px;
        }

        .word-segment {
          display: inline-block;
          padding: 2px 4px;
          margin: 0 2px;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s;
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

        .translation-text {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .word-meanings {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 14px;
          color: #666;
        }

        .word-meaning-pair {
          background: #e7f3ff;
          padding: 4px 8px;
          border-radius: 3px;
        }

        .loading-container, .error-container, .empty-container {
          text-align: center;
          padding: 50px;
          font-size: 18px;
          color: #666;
        }

        .error-container {
          color: #dc3545;
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

        .full-text-display h3, .full-translation-display h3 {
          margin: 0 0 15px 0;
          color: #667eea;
        }

        .full-text-content {
          font-size: 1.1em;
          line-height: 1.8;
          color: #333;
          font-family: 'Times New Roman', 'Georgia', serif;
        }

        .full-text-content .paragraph {
          margin-bottom: 1.5em;
          text-indent: 2em;
          text-align: justify;
        }

        .full-text-content .paragraph:first-child {
          margin-top: 0;
        }

        .full-translation-content {
          font-size: 1.05em;
          line-height: 2;
          color: #333;
        }

        .full-translation-content .paragraph-ja {
          margin-bottom: 1.5em;
          text-indent: 1em;
        }

        .full-translation-content .paragraph-ja:first-child {
          margin-top: 0;
        }

        .full-translation-content {
          font-size: 1em;
          line-height: 1.8;
          color: #333;
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
