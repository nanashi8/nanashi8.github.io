import { useState, useEffect } from 'react';
import { Question, SpellingState, QuestionSet } from '../types';
import QuestionSetSelector from './QuestionSetSelector';
import ScoreBoard from './ScoreBoard';

interface SpellingViewProps {
  questions: Question[];
  questionSets: QuestionSet[];
  selectedSetId: string | null;
  onSelectQuestionSet: (setId: string) => void;
}

function SpellingView({ 
  questions, 
  questionSets,
  selectedSetId,
  onSelectQuestionSet 
}: SpellingViewProps) {
  const [spellingState, setSpellingState] = useState<SpellingState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    totalAnswered: 0,
    answered: false,
    selectedLetters: [],
    correctWord: '',
  });

  // シャッフルされたアルファベットカード
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  // ユーザーが選択した順番のアルファベット
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);

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

  // 現在の問題が変更されたらアルファベットをシャッフル
  useEffect(() => {
    if (spellingState.questions.length > 0) {
      const currentQuestion = spellingState.questions[spellingState.currentIndex];
      const word = currentQuestion.word.toUpperCase();
      const letters = word.split('');
      
      // シャッフル
      const shuffled = [...letters].sort(() => Math.random() - 0.5);
      
      setShuffledLetters(shuffled);
      setSelectedSequence([]);
      setSpellingState((prev) => ({
        ...prev,
        correctWord: word,
        answered: false,
      }));
    }
  }, [spellingState.currentIndex, spellingState.questions]);

  // カードをタップして選択
  const handleLetterClick = (_letter: string, index: number) => {
    if (spellingState.answered) return;
    
    // まだ選択されていないカードのみ選択可能
    if (selectedSequence.includes(`${index}`)) return;

    const newSequence = [...selectedSequence, `${index}`];
    setSelectedSequence(newSequence);

    // 全てのカードが選択されたら自動で答え合わせ
    if (newSequence.length === shuffledLetters.length) {
      setTimeout(() => checkAnswer(newSequence), 300);
    }
  };

  const checkAnswer = (sequence: string[]) => {
    const userWord = sequence.map((idx) => shuffledLetters[parseInt(idx)]).join('');
    const isCorrect = userWord === spellingState.correctWord;

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
    setSelectedSequence([]);
    setSpellingState((prev) => ({
      ...prev,
      answered: false,
    }));
  };

  const currentQuestion =
    spellingState.questions.length > 0
      ? spellingState.questions[spellingState.currentIndex]
      : null;

  const hasQuestions = spellingState.questions.length > 0;
  
  // ユーザーが選択した単語
  const userWord = selectedSequence.map((idx) => shuffledLetters[parseInt(idx)]).join('');

  return (
    <div className="spelling-view">
      <QuestionSetSelector
        questionSets={questionSets}
        selectedSetId={selectedSetId}
        onSelect={onSelectQuestionSet}
        label="📚 問題集を選択"
      />

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
            currentIndex={spellingState.currentIndex}
          />

          {currentQuestion && (
            <div className="spelling-card">
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

              {/* ユーザーが選択中の単語表示 */}
              <div className="user-word-display">
                <div className="user-word-label">あなたの答え:</div>
                <div className="user-word-text">
                  {userWord || '（タップして並べてください）'}
                </div>
              </div>

              {/* シャッフルされたアルファベットカード */}
              <div className="letter-cards">
                {shuffledLetters.map((letter, index) => {
                  const isSelected = selectedSequence.includes(`${index}`);
                  const selectionOrder = selectedSequence.indexOf(`${index}`) + 1;

                  return (
                    <button
                      key={index}
                      className={`letter-card ${isSelected ? 'selected' : ''} ${
                        spellingState.answered ? 'disabled' : ''
                      }`}
                      onClick={() => handleLetterClick(letter, index)}
                      disabled={spellingState.answered || isSelected}
                    >
                      {letter}
                      {isSelected && <span className="selection-number">{selectionOrder}</span>}
                    </button>
                  );
                })}
              </div>

              {spellingState.answered && (
                <div className="result-display">
                  <div
                    className={`result-message ${
                      userWord === spellingState.correctWord ? 'correct' : 'incorrect'
                    }`}
                  >
                    {userWord === spellingState.correctWord ? '✅ 正解！' : '❌ 不正解'}
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
