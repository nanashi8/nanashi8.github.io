import { useState } from 'react';
import { ReadingPassage, Question } from '../types';

interface ReadingViewProps {
  onAddUnknownWords: (words: Question[]) => void;
}

// サンプル長文データ（英米人が話す時の自然な区切り）
const samplePassages: ReadingPassage[] = [
  {
    id: 'passage1',
    title: 'The Power of Learning',
    phrases: [
      {
        words: ['Learning', 'is', 'a', 'lifelong', 'journey'],
        phraseMeaning: '学習は生涯の旅です',
        segments: [
          { word: 'Learning', meaning: '学習', isUnknown: false },
          { word: 'is', meaning: 'である', isUnknown: false },
          { word: 'a', meaning: '一つの', isUnknown: false },
          { word: 'lifelong', meaning: '生涯の', isUnknown: false },
          { word: 'journey', meaning: '旅', isUnknown: false },
        ],
        isUnknown: false,
      },
      {
        words: ['that', 'enriches', 'our', 'minds'],
        phraseMeaning: 'それは私たちの心を豊かにし',
        segments: [
          { word: 'that', meaning: 'それは', isUnknown: false },
          { word: 'enriches', meaning: '豊かにする', isUnknown: false },
          { word: 'our', meaning: '私たちの', isUnknown: false },
          { word: 'minds', meaning: '心', isUnknown: false },
        ],
        isUnknown: false,
      },
      {
        words: ['and', 'opens', 'doors'],
        phraseMeaning: 'そして扉を開きます',
        segments: [
          { word: 'and', meaning: 'そして', isUnknown: false },
          { word: 'opens', meaning: '開く', isUnknown: false },
          { word: 'doors', meaning: '扉', isUnknown: false },
        ],
        isUnknown: false,
      },
      {
        words: ['to', 'new', 'opportunities'],
        phraseMeaning: '新しい機会への',
        segments: [
          { word: 'to', meaning: 'へ', isUnknown: false },
          { word: 'new', meaning: '新しい', isUnknown: false },
          { word: 'opportunities', meaning: '機会', isUnknown: false },
        ],
        isUnknown: false,
      },
    ],
    translation:
      '学習は生涯の旅であり、私たちの心を豊かにし、新しい機会への扉を開きます。',
  },
  {
    id: 'passage2',
    title: 'Technology and Society',
    phrases: [
      {
        words: ['Modern', 'technology'],
        phraseMeaning: '現代の技術は',
        segments: [
          { word: 'Modern', meaning: '現代の', isUnknown: false },
          { word: 'technology', meaning: '技術', isUnknown: false },
        ],
        isUnknown: false,
      },
      {
        words: ['has', 'transformed'],
        phraseMeaning: '変革してきました',
        segments: [
          { word: 'has', meaning: 'have(助動詞)', isUnknown: false },
          { word: 'transformed', meaning: '変革する', isUnknown: false },
        ],
        isUnknown: false,
      },
      {
        words: ['how', 'we', 'communicate', 'and', 'work'],
        phraseMeaning: '私たちがコミュニケーションし働く方法を',
        segments: [
          { word: 'how', meaning: 'どのように', isUnknown: false },
          { word: 'we', meaning: '私たち', isUnknown: false },
          { word: 'communicate', meaning: 'コミュニケーションする', isUnknown: false },
          { word: 'and', meaning: 'と', isUnknown: false },
          { word: 'work', meaning: '働く', isUnknown: false },
        ],
        isUnknown: false,
      },
      {
        words: ['in', 'unprecedented', 'ways'],
        phraseMeaning: '前例のない方法で',
        segments: [
          { word: 'in', meaning: 'で', isUnknown: false },
          { word: 'unprecedented', meaning: '前例のない', isUnknown: false },
          { word: 'ways', meaning: '方法', isUnknown: false },
        ],
        isUnknown: false,
      },
    ],
    translation:
      '現代の技術は、私たちがコミュニケーションし、働く方法を前例のない方法で変革してきました。',
  },
];

function ReadingView({ onAddUnknownWords }: ReadingViewProps) {
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [passages, setPassages] = useState<ReadingPassage[]>(samplePassages);
  const [showTranslation, setShowTranslation] = useState(false);

  const currentPassage = passages.find((p) => p.id === selectedPassageId);

  const handleWordClick = (passageId: string, phraseIndex: number, wordIndex?: number) => {
    if (showTranslation) return; // 和訳表示後はクリック無効

    setPassages((prev) =>
      prev.map((passage) =>
        passage.id === passageId
          ? {
              ...passage,
              phrases: passage.phrases.map((phrase, pIdx) =>
                pIdx === phraseIndex
                  ? wordIndex !== undefined
                    ? {
                        // 単語カードのクリック
                        ...phrase,
                        segments: phrase.segments.map((seg, wIdx) =>
                          wIdx === wordIndex
                            ? { ...seg, isUnknown: !seg.isUnknown }
                            : seg
                        ),
                      }
                    : {
                        // 文節カード全体のクリック
                        ...phrase,
                        isUnknown: !phrase.isUnknown,
                      }
                  : phrase
              ),
            }
          : passage
      )
    );
  };

  const handleShowTranslation = () => {
    setShowTranslation(true);

    // 分からない文節と単語を収集してクイズ用に記録
    if (currentPassage) {
      const unknownWords: Question[] = [];
      
      currentPassage.phrases.forEach((phrase) => {
        // 文節全体が分からない場合、その文節内の全単語を追加
        if (phrase.isUnknown) {
          phrase.segments.forEach((segment) => {
            unknownWords.push({
              word: segment.word,
              reading: '',
              meaning: segment.meaning,
              etymology: '',
              relatedWords: phrase.phraseMeaning,
              relatedFields: currentPassage.title,
              difficulty: '',
              hint: phrase.phraseMeaning,
            });
          });
        } else {
          // 個別の単語が分からない場合のみ追加
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
                hint: phrase.phraseMeaning,
              });
            }
          });
        }
      });

      if (unknownWords.length > 0) {
        onAddUnknownWords(unknownWords);
        alert(
          `${unknownWords.length}個の単語を長文補習問題として記録しました！\n和訳・スペルタブで復習できます。`
        );
      }
    }
  };

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
                  isUnknown: false,
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

  const handleSelectPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    setShowTranslation(false);
  };

  return (
    <div className="reading-view">
      <div className="passage-selector">
        <h3>📖 長文を選択</h3>
        <div className="passage-list">
          {passages.map((passage) => (
            <button
              key={passage.id}
              className={`passage-btn ${
                selectedPassageId === passage.id ? 'active' : ''
              }`}
              onClick={() => handleSelectPassage(passage.id)}
            >
              {passage.title}
            </button>
          ))}
        </div>
      </div>

      {!currentPassage ? (
        <div className="empty-state">
          <p>📖 上から長文を選択してください</p>
        </div>
      ) : (
        <div className="reading-content">
          <h2 className="passage-title">{currentPassage.title}</h2>

          <div className="instructions">
            <p>
              💡 <strong>単語カード</strong>をタップすると、分からない単語として赤色表示されます。
              <br />
              「和訳へ」ボタンを押すと、各チャンク（節・句）の和訳と単語の意味が表示され、選択した単語がクイズ用に記録されます。
            </p>
          </div>

          <div className="reading-chunks">
            {currentPassage.phrases.map((phrase, phraseIndex) => (
              <div key={phraseIndex} className="chunk-block">
                {/* 英文（単語カード） */}
                <div className="chunk-words">
                  {phrase.segments.map((segment, wordIndex) => (
                    <button
                      key={wordIndex}
                      className={`word-btn ${
                        segment.isUnknown ? 'unknown' : ''
                      } ${showTranslation ? 'disabled' : ''}`}
                      onClick={() =>
                        handleWordClick(currentPassage.id, phraseIndex, wordIndex)
                      }
                      disabled={showTranslation}
                    >
                      {segment.word}
                    </button>
                  ))}
                </div>

                {/* 和訳表示時 */}
                {showTranslation && (
                  <>
                    {/* 単語の意味 */}
                    <div className="chunk-word-meanings">
                      {phrase.segments.map((segment, wordIndex) => (
                        <span key={wordIndex} className="word-meaning-item">
                          {segment.meaning}
                        </span>
                      ))}
                    </div>

                    {/* チャンク（節・句）の和訳 */}
                    <div className="chunk-translation">
                      {phrase.phraseMeaning}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {!showTranslation ? (
            <div className="action-buttons">
              <button className="btn-primary" onClick={handleShowTranslation}>
                和訳へ
              </button>
            </div>
          ) : (
            <div className="translation-section">
              <div className="translation-box">
                <h4>全文和訳:</h4>
                <p>{currentPassage.translation}</p>
              </div>
              <div className="action-buttons">
                <button className="btn-secondary" onClick={handleReset}>
                  もう一度
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedPassageId(null);
                    setShowTranslation(false);
                  }}
                >
                  長文選択に戻る
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReadingView;
