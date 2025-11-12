import { useState, useEffect } from 'react';
import { Question, SpellingState } from '../types';
import { generateSpellingPuzzle } from '../utils';
import FileSelector from './FileSelector';
import ScoreBoard from './ScoreBoard';

interface SpellingViewProps {
  questions: Question[];
  onLoadCSV: (filePath: string) => void;
  onLoadLocalFile: (file: File) => void;
}

function SpellingView({ questions, onLoadCSV, onLoadLocalFile }: SpellingViewProps) {
  const [spellingState, setSpellingState] = useState<SpellingState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    totalAnswered: 0,
    answered: false,
    selectedLetters: [],
    correctWord: '',
  });

  const [puzzle, setPuzzle] = useState<{
    displayWord: string[];
    missingIndices: number[];
    letterChoices: string[];
  }>({ displayWord: [], missingIndices: [], letterChoices: [] });

  // questionsが変更されたらスペルステートを初期化
  useEffect(() => {
    if (questions.length > 0) {
      setSpellingState({
        questions,
        currentIndex: 0,
        score: 0,
        totalAnswered: 0,
        answered: false,
        selectedLetters: [],
        correctWord: '',
      });
    }
  }, [questions]);

  // 現在の問題が変更されたらパズルを生成
  useEffect(() => {
    if (spellingState.questions.length > 0) {
      const currentQuestion = spellingState.questions[spellingState.currentIndex];
      const newPuzzle = generateSpellingPuzzle(currentQuestion.word);
      setPuzzle(newPuzzle);
      setSpellingState((prev) => ({
        ...prev,
        selectedLetters: new Array(newPuzzle.missingIndices.length).fill(null),
        correctWord: currentQuestion.word.toUpperCase(),
        answered: false,
      }));
    }
  }, [spellingState.currentIndex, spellingState.questions]);

  const handleLetterClick = (letter: string) => {
    if (spellingState.answered) return;

    // 次の空欄を探す
    const nextEmptyIndex = spellingState.selectedLetters.findIndex((l) => l === null);
    if (nextEmptyIndex === -1) return;

    const newSelectedLetters = [...spellingState.selectedLetters];
    newSelectedLetters[nextEmptyIndex] = letter;

    setSpellingState((prev) => ({
      ...prev,
      selectedLetters: newSelectedLetters,
    }));

    // 全ての空欄が埋まったら自動で答え合わせ
    if (!newSelectedLetters.includes(null)) {
      setTimeout(() => checkAnswer(newSelectedLetters), 300);
    }
  };

  const checkAnswer = (selectedLetters: (string | null)[]) => {
    const correctLetters = puzzle.missingIndices.map((idx) => puzzle.displayWord[idx]);
    const isCorrect =
      selectedLetters.length === correctLetters.length &&
      selectedLetters.every((letter, i) => letter === correctLetters[i]);

    setSpellingState((prev) => ({
      ...prev,
      answered: true,
      score: isCorrect ? prev.score + 1 : prev.score,
      totalAnswered: prev.totalAnswered + 1,
    }));
  };

  const handleNext = () => {
    setSpellingState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.questions.length,
    }));
  };

  const handleReset = () => {
    setSpellingState((prev) => ({
      ...prev,
      selectedLetters: new Array(puzzle.missingIndices.length).fill(null),
      answered: false,
    }));
  };

  const currentQuestion =
    spellingState.questions.length > 0
      ? spellingState.questions[spellingState.currentIndex]
      : null;

  const hasQuestions = spellingState.questions.length > 0;

  return (
    <div className="spelling-view">
      <FileSelector onLoadCSV={onLoadCSV} onLoadLocalFile={onLoadLocalFile} />

      {!hasQuestions ? (
        <div className="empty-state">
          <p>📂 上のメニューから問題集を選択してください</p>
        </div>
      ) : (
        <>
          <ScoreBoard
            score={spellingState.score}
            totalAnswered={spellingState.totalAnswered}
            totalQuestions={spellingState.questions.length}
          />

          {currentQuestion && (
            <div className="spelling-card">
              <div className="question-header">
                <span className="question-number">
                  問題 {spellingState.currentIndex + 1} / {spellingState.questions.length}
                </span>
              </div>

              <div className="meaning-display">
                <div className="meaning-label">意味:</div>
                <div className="meaning-text">{currentQuestion.meaning}</div>
              </div>

              {currentQuestion.hint && (
                <div className="hint-display">
                  <span className="hint-label">💡 ヒント:</span>
                  <span className="hint-text">{currentQuestion.hint}</span>
                </div>
              )}

              <div className="word-blanks">
                {puzzle.displayWord.map((letter, index) => {
                  const missingIndex = puzzle.missingIndices.indexOf(index);
                  const isMissing = missingIndex !== -1;

                  if (isMissing) {
                    const selectedLetter = spellingState.selectedLetters[missingIndex];
                    const correctLetter = puzzle.displayWord[index];
                    const isCorrect = selectedLetter === correctLetter;

                    return (
                      <div
                        key={index}
                        className={`letter-box blank ${
                          spellingState.answered
                            ? isCorrect
                              ? 'correct'
                              : 'incorrect'
                            : ''
                        }`}
                      >
                        {selectedLetter || '_'}
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="letter-box filled">
                        {letter}
                      </div>
                    );
                  }
                })}
              </div>

              <div className="letter-choices">
                {puzzle.letterChoices.map((letter, index) => {
                  const isUsed = spellingState.selectedLetters.includes(letter);
                  return (
                    <button
                      key={index}
                      className={`letter-btn ${isUsed ? 'used' : ''}`}
                      onClick={() => handleLetterClick(letter)}
                      disabled={spellingState.answered || isUsed}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {spellingState.answered && (
                <div className="result-display">
                  <div
                    className={`result-message ${
                      spellingState.selectedLetters.every(
                        (letter, i) =>
                          letter === puzzle.displayWord[puzzle.missingIndices[i]]
                      )
                        ? 'correct'
                        : 'incorrect'
                    }`}
                  >
                    {spellingState.selectedLetters.every(
                      (letter, i) =>
                        letter === puzzle.displayWord[puzzle.missingIndices[i]]
                    )
                      ? '✅ 正解！'
                      : '❌ 不正解'}
                  </div>
                  <div className="correct-answer">
                    正解: <strong>{spellingState.correctWord}</strong>
                  </div>
                  <div className="action-buttons">
                    <button className="btn-secondary" onClick={handleReset}>
                      もう一度
                    </button>
                    <button className="btn-primary" onClick={handleNext}>
                      次の問題
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SpellingView;
