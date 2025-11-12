import { useState, useEffect } from 'react';
import { ReadingPassage, Question, ReadingPhrase, ReadingSegment } from '../types';
import {
  downloadPassagesJSON,
  importPassagesJSON,
  saveQuestionSet,
  generateId,
} from '../utils';

interface ReadingViewProps {
  onAddUnknownWords: (words: Question[]) => void;
}

function ReadingView({ onAddUnknownWords }: ReadingViewProps) {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初回読み込み: public/data/passages.json から読み込み
  useEffect(() => {
    fetch('/data/passages.json')
      .then((res) => res.json())
      .then((data: ReadingPassage[]) => {
        setPassages(data);
        setLoading(false);
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

  // 和訳表示（分からない単語を抽出してダイアログ表示）
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
            hint: phrase.phraseMeaning,
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
        onAddUnknownWords(unknownWords);
        alert(
          `問題集「${setName}」を作成しました！\n${unknownWords.length}個の単語が和訳・スペルタブで復習できます。`
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

  // パッセージ選択
  const handleSelectPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    setShowTranslation(false);
    setEditMode(false);
  };

  // エクスポート（JSON ダウンロード）
  const handleExport = () => {
    downloadPassagesJSON(passages, 'passages.json');
  };

  // インポート（JSON アップロード）
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          const imported = importPassagesJSON(text);
          setPassages(imported);
          alert(`${imported.length}個の長文をインポートしました`);
        } catch (error) {
          alert('インポートに失敗しました。JSON形式を確認してください。');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 新しいパッセージを追加
  const handleAddPassage = () => {
    const title = prompt('新しい長文のタイトルを入力:');
    if (!title) return;

    const newPassage: ReadingPassage = {
      id: generateId(),
      title,
      phrases: [],
      translation: '',
    };

    setPassages([...passages, newPassage]);
    setSelectedPassageId(newPassage.id);
    setEditMode(true);
  };

  // パッセージ削除
  const handleDeletePassage = (id: string) => {
    if (!confirm('この長文を削除しますか?')) return;
    setPassages(passages.filter((p) => p.id !== id));
    if (selectedPassageId === id) {
      setSelectedPassageId(null);
    }
  };

  // フレーズ追加
  const handleAddPhrase = () => {
    if (!currentPassage) return;

    const wordsInput = prompt('単語をスペース区切りで入力 (例: Modern technology):');
    if (!wordsInput) return;

    const words = wordsInput.split(/\s+/);
    const phraseMeaning = prompt('このフレーズの和訳を入力:') || '';

    const segments: ReadingSegment[] = words.map((word) => ({
      word,
      meaning: '',
      isUnknown: false,
    }));

    const newPhrase: ReadingPhrase = {
      words,
      phraseMeaning,
      segments,
      isUnknown: false,
    };

    setPassages((prev) =>
      prev.map((p) =>
        p.id === currentPassage.id
          ? { ...p, phrases: [...p.phrases, newPhrase] }
          : p
      )
    );
  };

  // フレーズ削除
  const handleDeletePhrase = (phraseIndex: number) => {
    if (!currentPassage || !confirm('このフレーズを削除しますか?')) return;

    setPassages((prev) =>
      prev.map((p) =>
        p.id === currentPassage.id
          ? { ...p, phrases: p.phrases.filter((_, i) => i !== phraseIndex) }
          : p
      )
    );
  };

  // セグメント（単語の意味）編集
  const handleEditSegment = (phraseIndex: number, wordIndex: number) => {
    if (!currentPassage) return;

    const segment = currentPassage.phrases[phraseIndex].segments[wordIndex];
    const newMeaning = prompt(`「${segment.word}」の意味を入力:`, segment.meaning);
    if (newMeaning === null) return;

    setPassages((prev) =>
      prev.map((p) =>
        p.id === currentPassage.id
          ? {
              ...p,
              phrases: p.phrases.map((phrase, pIdx) =>
                pIdx === phraseIndex
                  ? {
                      ...phrase,
                      segments: phrase.segments.map((seg, wIdx) =>
                        wIdx === wordIndex ? { ...seg, meaning: newMeaning } : seg
                      ),
                    }
                  : phrase
              ),
            }
          : p
      )
    );
  };

  // タイトル・和訳編集
  const handleEditPassageInfo = () => {
    if (!currentPassage) return;

    const newTitle = prompt('タイトルを編集:', currentPassage.title);
    if (newTitle === null) return;

    const newTranslation = prompt('全文和訳を編集:', currentPassage.translation);
    if (newTranslation === null) return;

    setPassages((prev) =>
      prev.map((p) =>
        p.id === currentPassage.id
          ? { ...p, title: newTitle, translation: newTranslation }
          : p
      )
    );
  };

  if (loading) {
    return <div className="reading-view">読み込み中...</div>;
  }

  return (
    <div className="reading-view">
      {/* 管理ツールバー */}
      <div className="reading-toolbar">
        <button onClick={handleAddPassage} className="btn-toolbar">
          ➕ 新規長文
        </button>
        <button onClick={handleExport} className="btn-toolbar">
          💾 エクスポート
        </button>
        <button onClick={handleImport} className="btn-toolbar">
          📂 インポート
        </button>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`btn-toolbar ${editMode ? 'active' : ''}`}
        >
          ✏️ {editMode ? '編集モード ON' : '編集モード OFF'}
        </button>
      </div>

      {/* パッセージ一覧 */}
      <div className="passage-selector">
        <h3>📖 長文を選択</h3>
        <div className="passage-list">
          {passages.map((passage) => (
            <div key={passage.id} className="passage-item">
              <button
                className={`passage-btn ${
                  selectedPassageId === passage.id ? 'active' : ''
                }`}
                onClick={() => handleSelectPassage(passage.id)}
              >
                {passage.title}
              </button>
              {editMode && (
                <button
                  className="delete-btn-small"
                  onClick={() => handleDeletePassage(passage.id)}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 選択された長文の表示 */}
      {!currentPassage ? (
        <div className="empty-state">
          <p>📖 上から長文を選択してください</p>
        </div>
      ) : (
        <div className="reading-content">
          <div className="passage-header">
            <h2 className="passage-title">{currentPassage.title}</h2>
            {editMode && (
              <button className="btn-edit" onClick={handleEditPassageInfo}>
                ✏️ 編集
              </button>
            )}
          </div>

          <div className="instructions">
            <p>
              💡 <strong>単語</strong>をタップすると、分からない単語として赤色表示されます。
              <br />
              「和訳へ」ボタンを押すと、分からない単語を問題集として保存できます。
            </p>
          </div>

          {/* フレーズリスト */}
          <div className="reading-chunks">
            {currentPassage.phrases.map((phrase, phraseIndex) => (
              <div key={phraseIndex} className="chunk-block">
                {/* 英文（単語ボタン） */}
                <div className="chunk-words">
                  {phrase.segments.map((segment, wordIndex) => (
                    <button
                      key={wordIndex}
                      className={`word-btn ${segment.isUnknown ? 'unknown' : ''} ${
                        showTranslation ? 'disabled' : ''
                      }`}
                      onClick={() =>
                        editMode
                          ? handleEditSegment(phraseIndex, wordIndex)
                          : handleWordClick(phraseIndex, wordIndex)
                      }
                      disabled={!editMode && showTranslation}
                    >
                      {segment.word}
                    </button>
                  ))}
                  {editMode && (
                    <button
                      className="delete-phrase-btn"
                      onClick={() => handleDeletePhrase(phraseIndex)}
                    >
                      🗑️
                    </button>
                  )}
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

                    {/* フレーズ和訳 */}
                    <div className="chunk-translation">{phrase.phraseMeaning}</div>
                  </>
                )}
              </div>
            ))}

            {editMode && (
              <button className="btn-add-phrase" onClick={handleAddPhrase}>
                ➕ フレーズを追加
              </button>
            )}
          </div>

          {/* アクションボタン */}
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
