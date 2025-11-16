import { useState, useEffect } from 'react';
import { ReadingPassage } from '../types';

type DifficultyFilter = 'all' | '初級' | '中級' | '上級';

interface ComprehensiveReadingViewProps {
  onSaveUnknownWords?: (words: { word: string; meaning: string }[]) => void;
}

function ComprehensiveReadingView({ onSaveUnknownWords }: ComprehensiveReadingViewProps) {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [phraseTranslations, setPhraseTranslations] = useState<boolean[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ読み込み
  useEffect(() => {
    fetch('/data/reading-passages-comprehensive.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load passages');
        return res.json();
      })
      .then((data: ReadingPassage[]) => {
        setPassages(data);
        setLoading(false);
        if (data.length > 0) {
          setSelectedPassageId(data[0].id);
          setPhraseTranslations(new Array(data[0].phrases.length).fill(false));
        }
      })
      .catch((err) => {
        console.error('Error loading passages:', err);
        setError('パッセージの読み込みに失敗しました');
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
      setPhraseTranslations(new Array(passage.phrases.length).fill(false));
    }
  };

  // 単語を「分からない」としてマーク
  const handleMarkUnknown = (phraseIndex: number, segmentIndex: number) => {
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

  // 個別フレーズの訳を表示
  const handleShowPhraseTranslation = (phraseIndex: number) => {
    setPhraseTranslations(prev => {
      const newState = [...prev];
      newState[phraseIndex] = true;
      return newState;
    });
  };

  // 全訳を表示
  const handleShowAllTranslations = () => {
    if (!currentPassage) return;
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

  const unknownCount = currentPassage?.phrases.reduce(
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

        {/* 統計情報 */}
        {currentPassage && (
          <div className="passage-stats">
            <span className="stat-badge">{currentPassage.level}</span>
            <span className="stat-badge">{currentPassage.actualWordCount}語</span>
            <span className="stat-badge">テーマ: {currentPassage.theme}</span>
            {unknownCount > 0 && (
              <span className="stat-badge unknown-count">
                分からない単語: {unknownCount}
              </span>
            )}
          </div>
        )}

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

      {/* パッセージ本文 */}
      {currentPassage && (
        <div className="passage-content">
          <h3 className="passage-title">{currentPassage.title}</h3>
          
          <div className="passage-body">
            {currentPassage.phrases.map((phrase, phraseIdx) => (
              <div key={phrase.id} className="phrase-block">
                {/* 英文 */}
                <div className="phrase-english">
                  {phrase.segments.map((segment, segIdx) => (
                    <span
                      key={segIdx}
                      className={`word-segment ${segment.isUnknown ? 'unknown' : ''}`}
                      onClick={() => handleMarkUnknown(phraseIdx, segIdx)}
                      title={segment.isUnknown ? 'クリックで解除' : 'クリックで「分からない」としてマーク'}
                    >
                      {segment.word}
                    </span>
                  ))}
                </div>

                {/* 和訳（表示/非表示） */}
                {phraseTranslations[phraseIdx] ? (
                  <div className="phrase-translation visible">
                    <div className="translation-text">{phrase.phraseMeaning}</div>
                    <div className="word-meanings">
                      {phrase.segments.filter(s => s.meaning).map((seg, idx) => (
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
                    訳を表示 ▼
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
          line-height: 2;
        }

        .phrase-block {
          margin-bottom: 25px;
          padding: 15px;
          background: #f8f9fa;
          border-left: 4px solid #007bff;
          border-radius: 4px;
        }

        .phrase-english {
          font-size: 18px;
          line-height: 1.8;
          margin-bottom: 10px;
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
      `}</style>
    </div>
  );
}

export default ComprehensiveReadingView;
