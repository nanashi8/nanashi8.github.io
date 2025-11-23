import { useState, useEffect } from 'react';
import './GrammarQuizView.css';

interface VerbFormQuestion {
  id: string;
  japanese: string;
  sentence: string;
  verb: string;
  choices: string[];
  correctAnswer: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation: string;
  hint: string;
}

interface FillInBlankQuestion {
  id: string;
  japanese: string;
  sentence: string;
  choices: string[];
  correctAnswer: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation: string;
  hint: string;
}

interface SentenceOrderingQuestion {
  id: string;
  japanese: string;
  words: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  grammarPoint: string;
  wordCount: number;
  hint: string;
}

interface Category {
  category: string;
  grammarPoint: string;
  questions: VerbFormQuestion[] | FillInBlankQuestion[];
}

interface Unit {
  unit: string;
  title: string;
  questions: SentenceOrderingQuestion[];
}

interface QuizData {
  grade: number;
  totalQuestions: number;
  categories?: Category[];
  units?: Unit[];
}

type QuizType = 'verb-form' | 'fill-in-blank' | 'sentence-ordering';
type Grade = 'all' | '1' | '2' | '3';

interface GrammarQuizViewProps {
  onSaveProgress?: (data: any) => void;
}

function GrammarQuizView({ }: GrammarQuizViewProps) {
  const [quizType, setQuizType] = useState<QuizType>('verb-form');
  const [grade, setGrade] = useState<Grade>('all');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  
  const [allQuizData, setAllQuizData] = useState<QuizData[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const isSentenceOrdering = quizType === 'sentence-ordering';

  // 問題が変わるたびに並び替え用の単語をシャッフル
  useEffect(() => {
    if (isSentenceOrdering && currentQuestion && currentQuestion.words) {
      const shuffled = [...currentQuestion.words].sort(() => Math.random() - 0.5);
      setRemainingWords(shuffled);
      setSelectedWords([]);
      setShowResult(false);
      setShowHint(false);
    }
  }, [currentQuestionIndex, currentQuestions, isSentenceOrdering]);

  const handleStartQuiz = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const gradesToLoad = grade === 'all' ? ['1', '2', '3'] : [grade];
      const allData: QuizData[] = [];
      
      for (const g of gradesToLoad) {
        let filename = '';
        if (quizType === 'verb-form') {
          filename = `verb-form-questions-grade${g}.json`;
        } else if (quizType === 'fill-in-blank') {
          filename = `fill-in-blank-questions-grade${g}.json`;
        } else if (quizType === 'sentence-ordering') {
          filename = `sentence-ordering-grade${g}.json`;
        }
        
        try {
          const res = await fetch(`/data/${filename}`);
          if (res.ok) {
            const data = await res.json();
            allData.push(data);
          }
        } catch (err) {
          console.warn(`${filename} not found, skipping...`);
        }
      }
      
      if (allData.length === 0) {
        throw new Error('問題データが見つかりません');
      }
      
      // 全ての問題を収集
      let questions: any[] = [];
      if (quizType === 'sentence-ordering') {
        allData.forEach(data => {
          if (data.units) {
            data.units.forEach(unit => {
              // 1語だけの問題を除外
              const validQuestions = unit.questions.filter(q => q.wordCount > 1);
              questions.push(...validQuestions);
            });
          }
        });
      } else {
        allData.forEach(data => {
          if (data.categories) {
            data.categories.forEach(category => {
              questions.push(...category.questions);
            });
          }
        });
      }
      
      if (questions.length === 0) {
        throw new Error('選択された条件に該当する問題がありません');
      }
      
      // シャッフル
      questions = questions.sort(() => Math.random() - 0.5);
      
      setAllQuizData(allData);
      setCurrentQuestions(questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setRemainingWords([]);
      setShowResult(false);
      setShowHint(false);
      setScore({ correct: 0, total: 0 });
      setQuizStarted(true);
      setLoading(false);
    } catch (err: any) {
      console.error('データ読み込みエラー:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult || isSentenceOrdering) return;
    setSelectedAnswer(answer);
  };

  const handleWordClick = (word: string, fromRemaining: boolean) => {
    if (showResult || !isSentenceOrdering) return;

    if (fromRemaining) {
      setRemainingWords(prev => prev.filter(w => w !== word));
      setSelectedWords(prev => [...prev, word]);
    } else {
      setSelectedWords(prev => prev.filter(w => w !== word));
      setRemainingWords(prev => [...prev, word]);
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;
    
    if (isSentenceOrdering) {
      if (selectedWords.length === 0) return;
    } else {
      if (!selectedAnswer) return;
    }
    
    setShowResult(true);
    
    let isCorrect = false;
    if (isSentenceOrdering) {
      const userAnswer = selectedWords.join(' ');
      const correctAnswer = currentQuestion.words.join(' ');
      isCorrect = userAnswer === correctAnswer;
    } else {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      alert(`クイズ完了！\n正解: ${score.correct}/${score.total}\n正解率: ${Math.round((score.correct / score.total) * 100)}%`);
      setQuizStarted(false);
      setCurrentQuestions([]);
      setCurrentQuestionIndex(0);
      setScore({ correct: 0, total: 0 });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    }
  };

  const handleReset = () => {
    if (isSentenceOrdering && currentQuestion && currentQuestion.words) {
      const shuffled = [...currentQuestion.words].sort(() => Math.random() - 0.5);
      setRemainingWords(shuffled);
      setSelectedWords([]);
    } else {
      setSelectedAnswer(null);
    }
    setShowResult(false);
    setShowHint(false);
  };

  const isCorrect = () => {
    if (!currentQuestion) return false;
    if (isSentenceOrdering) {
      return selectedWords.join(' ') === currentQuestion.words.join(' ');
    }
    return selectedAnswer === currentQuestion.correctAnswer;
  };

  if (loading) {
    return <div className="grammar-quiz-view"><div className="loading">読み込み中...</div></div>;
  }

  return (
    <div className="grammar-quiz-view">
      {!quizStarted && (
        <>
          <div className="quiz-controls">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className="settings-toggle-btn"
            >
              ⚙️ {showSettings ? '設定を閉じる' : '学習設定'}
            </button>
            <button onClick={handleStartQuiz} className="start-btn">
              🎯 クイズ開始
            </button>
          </div>

          {showSettings && (
            <div className="study-settings-panel">
              <h3>📊 学習設定</h3>
              
              <div className="filter-group">
                <label htmlFor="grade-select">📚 学年:</label>
                <select
                  id="grade-select"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="select-input"
                >
                  <option value="all">全学年</option>
                  <option value="1">1年の内容</option>
                  <option value="2">2年の内容</option>
                  <option value="3">3年の内容</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="quiz-type-select">📝 問題の種類:</label>
                <select
                  id="quiz-type-select"
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as QuizType)}
                  className="select-input"
                >
                  <option value="verb-form">動詞変化</option>
                  <option value="fill-in-blank">穴埋め</option>
                  <option value="sentence-ordering">並び替え</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          )}
        </>
      )}

      {quizStarted && currentQuestion && (
        <div className="quiz-area">
          <div className="progress-info">
            <div className="question-counter">
              問題 {currentQuestionIndex + 1} / {currentQuestions.length}
            </div>
            <div className="score-info">
              正解率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
              ({score.correct}/{score.total})
            </div>
          </div>

          <div className="question-card">
            <div className="japanese-sentence">
              <strong>日本語:</strong> {currentQuestion.japanese}
            </div>
            
            {currentQuestion.grammarPoint && (
              <div className="grammar-point">
                <span className="tag">文法ポイント</span> {currentQuestion.grammarPoint}
              </div>
            )}
            
            {!showResult && (
              <button 
                className="hint-button"
                onClick={() => setShowHint(!showHint)}
              >
                💡 ヒント {showHint ? '▼' : '▶'}
              </button>
            )}
            
            {showHint && !showResult && (
              <div className="hint-box">
                {currentQuestion.hint}
              </div>
            )}

            {isSentenceOrdering ? (
              <div className="word-area">
                <div className="selected-words-area">
                  <div className="area-label">選択した単語 ({selectedWords.length}語)</div>
                  <div className="word-container">
                    {selectedWords.map((word, index) => (
                      <button
                        key={`selected-${index}`}
                        className="word-button selected"
                        onClick={() => handleWordClick(word, false)}
                      >
                        {word}
                      </button>
                    ))}
                    {selectedWords.length === 0 && (
                      <div className="placeholder">ここに単語を並べてください</div>
                    )}
                  </div>
                </div>

                <div className="remaining-words-area">
                  <div className="area-label">使える単語 ({remainingWords.length}語)</div>
                  <div className="word-container">
                    {remainingWords.map((word, index) => (
                      <button
                        key={`remaining-${index}`}
                        className="word-button remaining"
                        onClick={() => handleWordClick(word, true)}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="choices-area">
                <div className="sentence-display">
                  {currentQuestion.sentence}
                </div>
                <div className="choices-grid">
                  {currentQuestion.choices.map((choice: string, index: number) => (
                    <button
                      key={index}
                      className={`choice-button ${selectedAnswer === choice ? 'selected' : ''}`}
                      onClick={() => handleAnswerSelect(choice)}
                      disabled={showResult}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showResult && (
              <div className={`result-box ${isCorrect() ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  {isCorrect() ? '✅ 正解！' : '❌ 不正解'}
                </div>
                <div className="result-content">
                  {isSentenceOrdering ? (
                    <div className="answer-comparison">
                      <div className="user-answer">
                        <strong>あなたの回答:</strong><br />
                        {selectedWords.join(' ')}
                      </div>
                      {!isCorrect() && (
                        <div className="correct-answer">
                          <strong>正解:</strong><br />
                          {currentQuestion.words.join(' ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="answer-comparison">
                        <div className="user-answer">
                          <strong>あなたの回答:</strong> {selectedAnswer}
                        </div>
                        {!isCorrect() && (
                          <div className="correct-answer">
                            <strong>正解:</strong> {currentQuestion.correctAnswer}
                          </div>
                        )}
                      </div>
                      {currentQuestion.explanation && (
                        <div className="explanation">
                          <strong>解説:</strong><br />
                          {currentQuestion.explanation}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="action-buttons">
              {!showResult ? (
                <>
                  <button 
                    className="previous-button"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    ← 戻る
                  </button>
                  <button 
                    className="submit-button"
                    onClick={handleSubmit}
                    disabled={isSentenceOrdering ? selectedWords.length === 0 : !selectedAnswer}
                  >
                    回答する
                  </button>
                  <button 
                    className="reset-button"
                    onClick={handleReset}
                  >
                    リセット
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="previous-button"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    ← 戻る
                  </button>
                  <button 
                    className="next-button"
                    onClick={handleNext}
                  >
                    次の問題へ →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GrammarQuizView;
