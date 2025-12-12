import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { ReadingPassage, Question } from '../types';
import { saveQuestionSet, generateId } from '../utils';
import { speakEnglish, stopSpeaking } from '../speechSynthesis';

function ReadingView() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [phraseTranslations, setPhraseTranslations] = useState<boolean[]>([]);
  const [speakingPhraseIndex, setSpeakingPhraseIndex] = useState<number | null>(null);

  // 初回読み込み: public/data/dictionaries/passages.json から読み込み
  useEffect(() => {
    fetch('/data/dictionaries/passages.json')
      .then((res) => res.json())
      .then((data: ReadingPassage[]) => {
        setPassages(data);
        if (data.length > 0) {
          setSelectedPassageId(data[0].id);
          setPhraseTranslations(new Array(data[0].phrases.length).fill(false));
        }
      })
      .catch((err) => {
        logger.error('Failed to load passages:', err);
        setPassages([]);
      });
  }, []);

  const currentPassage = passages.find((p) => p.id === selectedPassageId);

  // 単語クリック（分からない単語マーク）
  const handleWordClick = (phraseIndex: number, wordIndex: number) => {
    const anyTranslationShown = phraseTranslations.some(shown => shown);
    if (anyTranslationShown || !currentPassage) return;

    setPassages((prev) =>
      prev.map((passage) =>
        passage.id === currentPassage.id
          ? {
              ...passage,
              phrases: passage.phrases.map((phrase, pIdx) =>
                pIdx === phraseIndex
                  ? {
                      ...phrase,
                      segments: phrase.segments.map((seg, wIdx) =>
                        wIdx === wordIndex ? { ...seg, isUnknown: !seg.isUnknown } : seg
                      ),
                    }
                  : phrase
              ),
            }
          : passage
      )
    );
  };

  // フレーズごとの和訳表示
  const handleShowPhraseTranslation = (phraseIndex: number) => {
    setPhraseTranslations(prev => {
      const newState = [...prev];
      newState[phraseIndex] = true;
      return newState;
    });
  };

  // 全フレーズの和訳を表示（分からない単語を抽出して問題集として保存）
  const handleShowAllTranslations = () => {
    if (!currentPassage) return;

    // 全フレーズの和訳を表示
    setPhraseTranslations(new Array(currentPassage.phrases.length).fill(true));

    // 分からない単語を収集
    const unknownWords: Question[] = [];
    currentPassage.phrases.forEach((phrase) => {
      phrase.segments.forEach((segment) => {
        if (segment.isUnknown) {
          unknownWords.push({
            word: segment.lemma || segment.word, // 原形を優先、なければ表示形
            reading: segment.reading || '',
            meaning: segment.meaning || '',
            etymology: segment.etymology || '',
            relatedWords: segment.relatedWords || '',
            relatedFields: segment.relatedFields || currentPassage.theme || currentPassage.title,
            difficulty: segment.difficulty || 'intermediate',
          });
        }
      });
    });

    if (unknownWords.length > 0) {
      // ダイアログで問題集名を入力
      const setName = prompt(
        `${unknownWords.length}個の分からない単語が選択されています。\n問題集の名前を入力してください:`,
        `${currentPassage.title}の単語`
      );

      if (setName) {
        // 問題集として保存
        const newSet = {
          id: generateId(),
          name: setName,
          questions: unknownWords,
          createdAt: Date.now(),
          isBuiltIn: false,
          source: `長文抽出: ${currentPassage.title}`,
        };
        saveQuestionSet(newSet);
        alert(
          `問題集「${setName}」を作成しました!\n${unknownWords.length}個の単語が和訳・スペルタブで復習できます。`
        );
      }
    }
  };

  // フレーズの音声再生
  const handleSpeakPhrase = (phraseIndex: number) => {
    if (!currentPassage) return;
    
    const phrase = currentPassage.phrases[phraseIndex];
    const phraseText = phrase.segments.map(seg => seg.word).join(' ');
    
    // 既に再生中の場合は停止
    if (speakingPhraseIndex === phraseIndex) {
      stopSpeaking();
      setSpeakingPhraseIndex(null);
      return;
    }
    
    // 新しいフレーズを再生
    stopSpeaking();
    setSpeakingPhraseIndex(phraseIndex);
    
    speakEnglish(phraseText, {
      rate: 0.85,
      pitch: 1.0,
      volume: 1.0
    });
    
    // 再生終了後にstateをリセット
    setTimeout(() => {
      setSpeakingPhraseIndex(null);
    }, phraseText.split(' ').length * 600); // 概算の再生時間
  };

  // リセット
  const handleReset = () => {
    if (currentPassage) {
      setPhraseTranslations(new Array(currentPassage.phrases.length).fill(false));
      setPassages((prev) =>
        prev.map((passage) =>
          passage.id === currentPassage.id
            ? {
                ...passage,
                phrases: passage.phrases.map((phrase) => ({
                  ...phrase,
                  segments: phrase.segments.map((segment) => ({
                    ...segment,
                    isUnknown: false,
                  })),
                })),
              }
            : passage
        )
      );
    }
  };

  if (passages.length === 0) {
    return (
      <div className="reading-view">
        <div className="empty-state">
          <p>📖 長文が見つかりませんでした</p>
          <p className="hint">問題設定タブから長文を追加してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-view">
      {/* 長文選択プルダウン */}
      <div className="passage-selector">
        <label htmlFor="passage-select" className="selector-label">
          📖 長文を選択
        </label>
        <select
          id="passage-select"
          className="passage-select"
          value={selectedPassageId || ''}
          onChange={(e) => {
            const newPassageId = e.target.value;
            setSelectedPassageId(newPassageId);
            const newPassage = passages.find(p => p.id === newPassageId);
            if (newPassage) {
              setPhraseTranslations(new Array(newPassage.phrases.length).fill(false));
            }
          }}
        >
          <option value="" disabled>
            -- 問題文を選択してください --
          </option>
          {passages.map((passage) => (
            <option key={passage.id} value={passage.id}>
              {passage.title}
            </option>
          ))}
        </select>
      </div>

      {currentPassage && (
        <div className="reading-content">
          <h3 className="passage-title">{currentPassage.title}</h3>

          {!phraseTranslations.some(shown => shown) && (
            <div className="passage-instructions">
              <p>💡 分からない単語をタップして赤くマークしてください</p>
              <p className="hint-text">🔊 各フレーズの発音ボタンで英語を聞けます</p>
            </div>
          )}

          {/* 長文本文：節・句ごとに改行して表示 */}
          <div className="phrase-lines">
            {currentPassage.phrases.map((phrase, phraseIdx) => (
              <div key={phraseIdx} className="phrase-line">
                {/* フレーズ音声ボタン */}
                <button
                  className={`phrase-speaker-btn ${
                    speakingPhraseIndex === phraseIdx ? 'speaking' : ''
                  }`}
                  onClick={() => handleSpeakPhrase(phraseIdx)}
                  title="フレーズを読み上げ"
                >
                  🔊 {speakingPhraseIndex === phraseIdx ? '停止' : '発音'}
                </button>
                
                {/* 英文の単語を横並びで表示 */}
                <div className="phrase-words-row">
                  {phrase.segments.map((segment, segIdx) => (
                    <button
                      key={segIdx}
                      className={`word-card ${segment.isUnknown ? 'unknown' : ''} ${
                        phraseTranslations[phraseIdx] ? 'disabled' : ''
                      }`}
                      onClick={() => handleWordClick(phraseIdx, segIdx)}
                      disabled={phraseTranslations[phraseIdx]}
                    >
                      <span className="word-text">{segment.word}</span>
                      {phraseTranslations[phraseIdx] && segment.meaning && segment.meaning !== '-' && (
                        <span className="word-meaning-inline">{segment.meaning}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 和訳ボタンと和訳表示 */}
                {!phraseTranslations[phraseIdx] ? (
                  <button 
                    className="phrase-translation-btn"
                    onClick={() => handleShowPhraseTranslation(phraseIdx)}
                  >
                    和訳
                  </button>
                ) : (
                  <div className="phrase-translation">
                    {/* 節・句全体の和訳 */}
                    <div className="phrase-meaning">
                      <strong>→</strong> {phrase.phraseMeaning}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 全文の日本語訳（全フレーズの和訳表示時） */}
          {phraseTranslations.every(shown => shown) && (
            <div className="full-translation">
              <h4>📝 全文の日本語訳</h4>
              <p className="translation-text">{currentPassage.translation}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="reading-actions">
            {!phraseTranslations.some(shown => shown) ? (
              <button className="btn-primary" onClick={handleShowAllTranslations}>
                ✅ すべて和訳を見る
              </button>
            ) : (
              <button className="btn-secondary" onClick={handleReset}>
                🔄 リセットして最初から
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadingView;
