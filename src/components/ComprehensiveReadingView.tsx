import { useState, useEffect } from 'react';
import { ReadingPassage, Question, ReadingSegment } from '../types';
import { twoWordPhrases, commonPhrases } from '../utils/phrases';

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
  const [wordPopup, setWordPopup] = useState<WordPopup | null>(null);

  // passagesが更新されたらLocalStorageに保存
  useEffect(() => {
    if (passages.length > 0) {
      const readingDataKey = 'reading-passages-data';
      localStorage.setItem(readingDataKey, JSON.stringify(passages));
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
  }, []);

  // データ読み込み
  useEffect(() => {
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
          phrases: passage.phrases?.map(phrase => ({
            ...phrase,
            segments: phrase.segments || phrase.words?.map(word => ({
              word,
              meaning: '', // 意味は後で単語辞書から取得
              isUnknown: false
            })) || []
          })) || []
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
  }, []);

  const currentPassage = passages.find((p) => p.id === selectedPassageId);

  // 難易度でフィルタリングされたパッセージ
  const filteredPassages = difficultyFilter === 'all'
    ? passages
    : passages.filter(p => p.level === difficultyFilter);

  // パッセージ選択
  const handleSelectPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    const passage = passages.find(p => p.id === passageId);
    if (passage) {
      setPhraseTranslations(new Array(passage.phrases?.length || 0).fill(false));
      setWordMeaningsVisible(new Array(passage.phrases?.length || 0).fill(false));
    }
  };

  // 単語をクリックして辞書から意味を表示
  const handleWordClick = (word: string, event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    // 既存のポップアップを閉じる
    if (wordPopup && wordPopup.word === word) {
      setWordPopup(null);
      return;
    }

    // 単語を正規化（小文字、記号除去）
    const normalizedWord = word.toLowerCase().replace(/[.,!?;:"']/g, '').trim();
    const wordInfo = wordDictionary.get(normalizedWord);

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
      // 辞書にない単語は表示しない（エラーメッセージを出さない）
      console.warn(`Word not found in dictionary: ${normalizedWord}`);
      const rect = event.currentTarget.getBoundingClientRect();
      setWordPopup({
        word: word,
        meaning: '辞書に見つかりませんでした',
        reading: '',
        etymology: '',
        relatedWords: '',
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5,
      });
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

  // 全訳を表示
  const handleShowAllTranslations = () => {
    if (!currentPassage) return;
    setWordMeaningsVisible(new Array(currentPassage.phrases.length).fill(true));
    setPhraseTranslations(new Array(currentPassage.phrases.length).fill(true));
  };

  // 分からない単語を保存
  const handleSaveUnknownWords = () => {
    if (!currentPassage) return;

    const unknownWords: { word: string; meaning: string }[] = [];
    currentPassage.phrases.forEach(phrase => {
      phrase.segments.forEach(segment => {
        if (segment.isUnknown && segment.word.trim() !== '') {
          unknownWords.push({
            word: segment.word,
            meaning: segment.meaning,
          });
        }
      });
    });

    if (unknownWords.length === 0) {
      alert('分からない単語が選択されていません。\n単語をクリックしてマークしてください。');
      return;
    }

    if (onSaveUnknownWords) {
      onSaveUnknownWords(unknownWords);
    }

    alert(`${unknownWords.length}個の単語を保存しました！`);
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
          <h2>📖 長文読解</h2>
          <div className="filter-controls">
            <label htmlFor="difficulty-filter">難易度: </label>
            <select 
              id="difficulty-filter"
              value={difficultyFilter} 
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              title="難易度を選択"
            >
              <option value="all">全て</option>
              <option value="初級">初級 (500-800語)</option>
              <option value="中級">中級 (800-3000語)</option>
              <option value="上級">上級 (3000語)</option>
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
        <h2>📖 長文読解</h2>
        
        {/* 難易度フィルター */}
        <div className="filter-controls">
          <label htmlFor="difficulty-filter">難易度: </label>
          <select 
            id="difficulty-filter"
            value={difficultyFilter} 
            onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
            title="難易度を選択"
          >
            <option value="all">全て</option>
            <option value="初級">初級 (500-800語)</option>
            <option value="中級">中級 (800-3000語)</option>
            <option value="上級">上級 (3000語)</option>
          </select>
        </div>

        {/* パッセージ選択 */}
        <div className="passage-selector">
          <label htmlFor="passage-select">パッセージ: </label>
          <select 
            id="passage-select"
            value={selectedPassageId || ''} 
            onChange={(e) => handleSelectPassage(e.target.value)}
            title="パッセージを選択"
          >
            {filteredPassages.map(passage => (
              <option key={passage.id} value={passage.id}>
                {passage.title} ({passage.level} - {passage.actualWordCount}語)
              </option>
            ))}
          </select>
        </div>

        {/* 操作ボタン */}
        <div className="action-buttons">
          <button 
            onClick={handleShowAllTranslations}
            className="btn-primary"
          >
            📝 全訳を表示
          </button>
          <button 
            onClick={handleSaveUnknownWords}
            className="btn-success"
            disabled={unknownCount === 0}
          >
            💾 単語を保存 ({unknownCount})
          </button>
          <button 
            onClick={handleReset}
            className="btn-secondary"
          >
            🔄 リセット
          </button>
        </div>
      </div>

      {/* 単語ポップアップ */}
      {wordPopup && (
        <>
          <div className="word-popup-overlay" onClick={() => setWordPopup(null)} />
          <div 
            className="word-popup"
            style={{ 
              left: `${wordPopup.x}px`, 
              top: `${wordPopup.y}px` 
            }}
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
      {currentPassage && currentPassage.phrases && currentPassage.phrases.length > 0 && (
        <div className="passage-content">
          <h3 className="passage-title">{currentPassage.title}</h3>
          
          <div className="passage-body">
            {currentPassage.phrases.map((phrase, phraseIdx) => (
              <div key={phrase.id} className="phrase-block">
                {/* 英文 - 単語/フレーズをカード形式で表示（意味も含む） */}
                <div className="phrase-english">
                  {(() => {
                    const groups = groupSegmentsByPhrases(phrase.segments || []);
                    return groups.map((group, groupIdx) => {
                      if (group.type === 'phrase') {
                        // フレーズカード
                        const phraseText = group.words.join(' ');
                        const phraseMeanings = group.segments
                          .map(seg => {
                            const wordData = wordDictionary.get(seg.word.toLowerCase().replace(/[.,!?;:]$/, ''));
                            return wordData?.meaning || seg.meaning || '';
                          })
                          .filter(m => m);
                        const combinedMeaning = phraseMeanings.join('・');

                        return (
                          <div
                            key={`group-${groupIdx}`}
                            className={`word-card phrase-card ${group.isUnknown ? 'unknown' : ''}`}
                            onClick={(e) => handleWordClick(phraseText, e)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              // フレーズ内の全セグメントのisUnknownをトグル
                              const newValue = !group.isUnknown;
                              const updated = currentPassage.phrases.map((p, pIdx) => {
                                if (pIdx === phraseIdx) {
                                  const newSegments = [...p.segments];
                                  // このグループのセグメントを更新
                                  let segmentOffset = 0;
                                  for (let i = 0; i < groupIdx; i++) {
                                    segmentOffset += groups[i].segments.length;
                                  }
                                  for (let i = 0; i < group.segments.length; i++) {
                                    newSegments[segmentOffset + i] = {
                                      ...newSegments[segmentOffset + i],
                                      isUnknown: newValue
                                    };
                                  }
                                  return { ...p, segments: newSegments };
                                }
                                return p;
                              });
                              setPassages(passages.map(passage =>
                                passage.id === currentPassage.id
                                  ? { ...passage, phrases: updated }
                                  : passage
                              ));
                            }}
                            title="タップ: 詳細を表示 / ダブルタップ: 分からない熟語としてマーク（再度タップで解除）"
                          >
                            <div className="word-card-word phrase-word">{phraseText}</div>
                            {wordMeaningsVisible[phraseIdx] && combinedMeaning && (
                              <div className="word-card-meaning">{combinedMeaning}</div>
                            )}
                          </div>
                        );
                      } else {
                        // 単語カード
                        const segment = group.segments[0];
                        const segIdx = phrase.segments.findIndex(s => s === segment);
                        const wordData = wordDictionary.get(segment.word.toLowerCase().replace(/[.,!?;:]$/, ''));
                        const meaning = wordData?.meaning || segment.meaning || '';

                        return (
                          <div
                            key={`group-${groupIdx}`}
                            className={`word-card ${segment.isUnknown ? 'unknown' : ''}`}
                            onClick={(e) => handleWordClick(segment.word, e)}
                            onDoubleClick={(e) => handleMarkUnknown(phraseIdx, segIdx, e)}
                            title="タップ: 詳細を表示 / ダブルタップ: 分からない単語としてマーク（再度タップで解除）"
                          >
                            <div className="word-card-word">{segment.word}</div>
                            {wordMeaningsVisible[phraseIdx] && meaning && (
                              <div className="word-card-meaning">{meaning}</div>
                            )}
                          </div>
                        );
                      }
                    });
                  })()}
                </div>

                {/* 和訳（表示/非表示） */}
                {phraseTranslations[phraseIdx] ? (
                  <div className="phrase-translation visible">
                    <div className="translation-text">{phrase.phraseMeaning}</div>
                    <div className="word-meanings">
                      {phrase.segments?.filter(s => s.meaning).map((seg, idx) => (
                        <span key={idx} className="word-meaning-pair">
                          <strong>{seg.word}</strong>: {seg.meaning}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    className="show-translation-btn"
                    onClick={() => handleShowPhraseTranslation(phraseIdx)}
                  >
                    {!wordMeaningsVisible[phraseIdx] ? '単語の意味を表示 ▼' : 'フレーズの訳を表示 ▼'}
                  </button>
                )}
              </div>
            ))}
          </div>
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
      `}</style>
    </div>
  );
}

export default ComprehensiveReadingView;
