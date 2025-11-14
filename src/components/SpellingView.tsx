import { useState, useEffect, useRef } from 'react';
import { Question, SpellingState } from '../types';
import { DifficultyLevel } from '../App';
import ScoreBoard from './ScoreBoard';
import { addQuizResult } from '../progressStorage';
import { generateId } from '../utils';

interface SpellingViewProps {
  questions: Question[];
  categoryList: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  onStartQuiz: () => void;
}

function SpellingView({ 
  questions, 
  categoryList,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  onStartQuiz
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
  
  // 進捗追跡用
  const quizStartTimeRef = useRef<number>(0);
  const incorrectWordsRef = useRef<string[]>([]);

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
      
      // クイズ開始時刻を記録
      quizStartTimeRef.current = Date.now();
      incorrectWordsRef.current = [];
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

    // 間違えた単語を記録
    if (!isCorrect && spellingState.questions[spellingState.currentIndex]) {
      incorrectWordsRef.current.push(spellingState.questions[spellingState.currentIndex].word);
    }

    setSpellingState((prev) => {
      const newState = {
        ...prev,
        answered: true,
        score: isCorrect ? prev.score + 1 : prev.score,
        totalAnswered: prev.totalAnswered + 1,
      };
      
      // 全問題に回答したら進捗を保存
      if (newState.totalAnswered === prev.questions.length && selectedSetId) {
        const selectedSet = questionSets.find((s) => s.id === selectedSetId);
        if (selectedSet) {
          const timeSpent = Math.floor((Date.now() - quizStartTimeRef.current) / 1000);
          const percentage = (newState.score / newState.totalAnswered) * 100;
          
          addQuizResult({
            id: generateId(),
            questionSetId: selectedSet.id,
            questionSetName: selectedSet.name,
            score: newState.score,
            total: newState.totalAnswered,
            percentage,
            date: Date.now(),
            timeSpent,
            incorrectWords: incorrectWordsRef.current,
            mode: 'spelling',
          });
          
          // 完了メッセージ
          setTimeout(() => {
            alert(`スペルクイズ完了！\n正解: ${newState.score}/${newState.totalAnswered} (${percentage.toFixed(1)}%)\n成績タブで詳細を確認できます。`);
          }, 500);
        }
      }
      
      return newState;
    });
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
      <div className="quiz-filter-section">
        <div className="filter-group">
          <label htmlFor="category-select">📚 関連分野:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="select-input"
          >
            <option value="all">全ての分野</option>
            {categoryList.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="difficulty-select">⭐ 難易度:</label>
          <select
            id="difficulty-select"
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
            className="select-input"
          >
            <option value="all">全てのレベル</option>
            <option value="beginner">初級</option>
            <option value="intermediate">中級</option>
            <option value="advanced">上級</option>
          </select>
        </div>

        {!hasQuestions && (
          <button onClick={onStartQuiz} className="start-btn">
            🎯 クイズを開始
          </button>
        )}
      </div>

      {!hasQuestions ? (
        <div className="empty-state">
          <p>📖 条件を選択して「クイズを開始」ボタンを押してください</p>
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
                  
                  {/* 詳細情報の表示 */}
                  <div className="question-details-spelling">
                    {currentQuestion.reading && (
                      <div className="detail-row">
                        <span className="detail-label">読み:</span>
                        <span className="detail-content">{currentQuestion.reading}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">意味:</span>
                      <span className="detail-content">{currentQuestion.meaning}</span>
                    </div>
                    {currentQuestion.etymology && (
                      <div className="detail-row">
                        <span className="detail-label">📚 語源等解説:</span>
                        <span className="detail-content">{currentQuestion.etymology}</span>
                      </div>
                    )}
                    {currentQuestion.relatedWords && (
                      <div className="detail-row">
                        <span className="detail-label">🔗 関連語:</span>
                        <span className="detail-content">{currentQuestion.relatedWords}</span>
                      </div>
                    )}
                    {currentQuestion.relatedFields && (
                      <div className="detail-row">
                        <span className="detail-label">🏷️ 関連分野:</span>
                        <span className="detail-content">{currentQuestion.relatedFields}</span>
                      </div>
                    )}
                    {currentQuestion.difficulty && (
                      <div className="detail-row">
                        <span className="detail-label">難易度:</span>
                        <span className="detail-content">{currentQuestion.difficulty}</span>
                      </div>
                    )}
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
