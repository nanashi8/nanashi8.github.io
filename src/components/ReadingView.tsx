import { useState, useEffect } from 'react';
import { ReadingPassage, Question } from '../types';
import { saveQuestionSet, generateId } from '../utils';

function ReadingView() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初回読み込み: public/data/passages.json から読み込み
  useEffect(() => {
    fetch('/data/passages.json')
      .then((res) => res.json())
      .then((data: ReadingPassage[]) => {
        setPassages(data);
        setLoading(false);
        if (data.length > 0) {
          setSelectedPassageId(data[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load passages:', err);
        setPassages([]);
        setLoading(false);
      });
  }, []);

  const currentPassage = passages.find((p) => p.id === selectedPassageId);

  // 単語クリック（分からない単語マーク）
  const handleWordClick = (phraseIndex: number, wordIndex: number) => {
    if (showTranslation || !currentPassage) return;

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

  // 和訳表示（分からない単語を抽出して問題集として保存）
  const handleShowTranslation = () => {
    if (!currentPassage) return;

    // 分からない単語を収集
    const unknownWords: Question[] = [];
    currentPassage.phrases.forEach((phrase) => {
      phrase.segments.forEach((segment) => {
        if (segment.isUnknown) {
          unknownWords.push({
            word: segment.word,
            reading: '',
            meaning: segment.meaning,
            etymology: '',
            relatedWords: phrase.phraseMeaning,
            relatedFields: currentPassage.title,
            difficulty: '',
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

    setShowTranslation(true);
  };

  // リセット
  const handleReset = () => {
    setShowTranslation(false);
    if (currentPassage) {
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

  if (loading) {
    return <div className="reading-view"><p>📖 読み込み中...</p></div>;
  }

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
            setSelectedPassageId(e.target.value);
            setShowTranslation(false);
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

          {!showTranslation && (
            <div className="passage-instructions">
              <p>💡 分からない単語をタップして赤くマークしてください</p>
            </div>
          )}

          {/* 長文本文：節・句ごとにカード化 */}
          <div className="phrase-cards">
            {currentPassage.phrases.map((phrase, phraseIdx) => (
              <div key={phraseIdx} className="phrase-card">
                {/* 英文の単語カード */}
                <div className="phrase-words">
                  {phrase.segments.map((segment, segIdx) => (
                    <button
                      key={segIdx}
                      className={`word-card ${segment.isUnknown ? 'unknown' : ''} ${
                        showTranslation ? 'disabled' : ''
                      }`}
                      onClick={() => handleWordClick(phraseIdx, segIdx)}
                      disabled={showTranslation}
                    >
                      {segment.word}
                    </button>
                  ))}
                </div>

                {/* 和訳表示時：単語の意味と節・句の和訳 */}
                {showTranslation && (
                  <div className="phrase-translation">
                    {/* 各単語の意味 */}
                    <div className="word-meanings">
                      {phrase.segments.map((segment, segIdx) => (
                        <span key={segIdx} className="word-meaning">
                          {segment.meaning}
                        </span>
                      ))}
                    </div>
                    {/* 節・句全体の和訳 */}
                    <div className="phrase-meaning">
                      <strong>→</strong> {phrase.phraseMeaning}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 和訳表示時：全文の日本語訳 */}
          {showTranslation && (
            <div className="full-translation">
              <h4>📝 全文の日本語訳</h4>
              <p className="translation-text">{currentPassage.translation}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="reading-actions">
            {!showTranslation ? (
              <button className="btn-primary" onClick={handleShowTranslation}>
                ✅ 和訳を見る
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
