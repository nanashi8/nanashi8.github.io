import { useState, useEffect } from 'react';
import './GrammarQuizView.css';
import ScoreBoard from './ScoreBoard';
import { getStudySettings, updateStudySettings } from '../progressStorage';

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
type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface GrammarQuizViewProps {
  onSaveProgress?: (data: any) => void;
}

function GrammarQuizView({ }: GrammarQuizViewProps) {
  const [quizType, setQuizType] = useState<QuizType>('verb-form');
  const [grade, setGrade] = useState<Grade>('all');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('all');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, mastered: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);

  // 学習数上限の設定
  const [maxStudyCount, setMaxStudyCount] = useState<number>(() => getStudySettings().maxStudyCount);
  const [maxReviewCount, setMaxReviewCount] = useState<number>(() => getStudySettings().maxReviewCount);

  const handleMaxStudyCountChange = (newCount: number) => {
    setMaxStudyCount(newCount);
    updateStudySettings({ maxStudyCount: newCount });
  };

  const handleMaxReviewCountChange = (newCount: number) => {
    setMaxReviewCount(newCount);
    updateStudySettings({ maxReviewCount: newCount });
  };

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const isSentenceOrdering = quizType === 'sentence-ordering';

  // 問題が変わるたびに並び替え用の単語をシャッフル
  useEffect(() => {
    if (isSentenceOrdering && currentQuestion && currentQuestion.words) {
      const shuffled = [...currentQuestion.words].sort(() => Math.random() - 0.5);
      setRemainingWords(shuffled);
      setSelectedWords([]);
      setAnswered(false);
      setShowHint(false);
    }
  }, [currentQuestionIndex, currentQuestions, isSentenceOrdering]);

  // 問題が変わるたびにリセット
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setShowHint(false);
    setUserRating(null);
  }, [currentQuestionIndex]);

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

      // 難易度フィルター適用
      if (difficulty !== 'all') {
        questions = questions.filter(q => q.difficulty === difficulty);
      }
      
      if (questions.length === 0) {
        throw new Error('選択された条件に該当する問題がありません');
      }
      
      // シャッフル
      questions = questions.sort(() => Math.random() - 0.5);
      
      setCurrentQuestions(questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setRemainingWords([]);
      setAnswered(false);
      setShowHint(false);
      setScore(0);
      setTotalAnswered(0);
      setSessionStats({ correct: 0, incorrect: 0, mastered: 0 });
      setQuizStarted(true);
      setLoading(false);
    } catch (err: any) {
      console.error('データ読み込みエラー:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // 選択肢クリック時に即座に判定（和訳・スペルタブと同じ）
  const handleAnswerSelect = (answer: string) => {
    if (answered || isSentenceOrdering) return;
    
    setSelectedAnswer(answer);
    setAnswered(true);
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    setTotalAnswered(prev => prev + 1);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      // 連続3回正解で定着とみなす（簡易判定）
      const isMastered = currentQuestion && score >= 2;
      setSessionStats(prev => ({ 
        ...prev, 
        correct: prev.correct + 1,
        mastered: isMastered ? prev.mastered + 1 : prev.mastered
      }));
    } else {
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
  };

  const handleWordClick = (word: string, fromRemaining: boolean) => {
    if (answered || !isSentenceOrdering) return;

    if (fromRemaining) {
      setRemainingWords(prev => prev.filter(w => w !== word));
      setSelectedWords(prev => {
        const newWords = [...prev, word];
        
        // 全ての単語を選択したら自動で判定
        if (newWords.length === currentQuestion.words.length) {
          setTimeout(() => {
            setAnswered(true);
            const userAnswer = newWords.join(' ');
            const correctAnswer = currentQuestion.words.join(' ');
            const isCorrect = userAnswer === correctAnswer;
            
            setTotalAnswered(prevTotal => prevTotal + 1);
            
            if (isCorrect) {
              setScore(prevScore => prevScore + 1);
              // 連続3回正解で定着とみなす（簡易判定）
              const isMastered = score >= 2;
              setSessionStats(prev => ({ 
                ...prev, 
                correct: prev.correct + 1,
                mastered: isMastered ? prev.mastered + 1 : prev.mastered
              }));
            } else {
              setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
            }
          }, 100);
        }
        
        return newWords;
      });
    } else {
      setSelectedWords(prev => prev.filter(w => w !== word));
      setRemainingWords(prev => [...prev, word]);
    }
  };

  const handleRatingChange = (rating: number) => {
    setUserRating(rating);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setAnswered(false);
      setShowHint(false);
      setUserRating(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setAnswered(false);
      setShowHint(false);
      setUserRating(null);
    }
  };

  const isCorrect = () => {
    if (!currentQuestion || !answered) return false;
    if (isSentenceOrdering) {
      return selectedWords.join(' ') === currentQuestion.words.join(' ');
    }
    return selectedAnswer === currentQuestion.correctAnswer;
  };

  if (loading) {
    return <div className="grammar-quiz-view"><div className="loading">読み込み中...</div></div>;
  }

  return (
    <div className="quiz-view">
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
                <label htmlFor="difficulty-select">⭐ 難易度:</label>
                <select
                  id="difficulty-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="select-input"
                >
                  <option value="all">全てのレベル</option>
                  <option value="beginner">初級</option>
                  <option value="intermediate">中級</option>
                  <option value="advanced">上級</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="max-study-count">📊 学習数上限:</label>
                <input
                  id="max-study-count"
                  type="number"
                  min="1"
                  value={maxStudyCount}
                  onChange={(e) => handleMaxStudyCountChange(parseInt(e.target.value, 10))}
                  className="select-input number-input-small"
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="max-review-count">🔄 要復習上限:</label>
                <input
                  id="max-review-count"
                  type="number"
                  min="0"
                  value={maxReviewCount}
                  onChange={(e) => handleMaxReviewCountChange(parseInt(e.target.value, 10))}
                  className="select-input number-input-small"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          )}

          {!error && (
            <div className="empty-state">
              <p>📖 条件を選択して「クイズ開始」ボタンを押してください</p>
            </div>
          )}
        </>
      )}

      {quizStarted && currentQuestion && (
        <>
          <ScoreBoard
            mode="grammar"
            currentScore={score}
            totalAnswered={totalAnswered}
            sessionCorrect={sessionStats.correct}
            sessionIncorrect={sessionStats.incorrect}
            sessionMastered={sessionStats.mastered}
            onShowSettings={() => setShowSettings(true)}
          />

          <div className="question-container">
            <div className="question-card">
              {/* コメントバーエリア（固定高さ） */}
              <div className="comment-bar-container">
                {/* 将来的にAIコメント等を追加可能 */}
              </div>

              {/* インラインナビゲーション */}
              <div className="question-nav-row">
                <button 
                  className="inline-nav-btn prev-inline-btn" 
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  title="前へ"
                >
                  ←
                </button>
                <div className="question-content-inline">
                  <div 
                    className={`question-text ${showHint ? 'hint-active' : ''} ${!answered ? 'clickable' : ''}`}
                    onClick={!answered ? toggleHint : undefined}
                    title={!answered ? 'タップしてヒントを表示 💡' : ''}
                  >
                    {currentQuestion.japanese}
                    {!answered && (
                      <span className="hint-icon">💡</span>
                    )}
                  </div>
                  {currentQuestion.difficulty && (
                    <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                      {currentQuestion.difficulty === 'beginner' ? '初級' : 
                       currentQuestion.difficulty === 'intermediate' ? '中級' : '上級'}
                    </div>
                  )}
                </div>
                <button 
                  className="inline-nav-btn next-inline-btn" 
                  onClick={handleNext}
                  disabled={currentQuestionIndex >= currentQuestions.length - 1}
                  title="次へ"
                >
                  →
                </button>
              </div>

              {/* 文法ポイント */}
              {currentQuestion.grammarPoint && (
                <div className="grammar-point">
                  <span className="tag">文法ポイント</span> {currentQuestion.grammarPoint}
                </div>
              )}
              
              {/* ヒント表示 */}
              {showHint && !answered && (
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
                          disabled={answered}
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
                          disabled={answered}
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
                    {currentQuestion.choices.map((choice: string, index: number) => {
                      const isSelected = selectedAnswer === choice;
                      const isCorrectChoice = choice === currentQuestion.correctAnswer;
                      const showCorrect = answered && isCorrectChoice;
                      const showIncorrect = answered && isSelected && !isCorrectChoice;
                      
                      return (
                        <button
                          key={index}
                          className={`choice-button ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showIncorrect ? 'incorrect' : ''}`}
                          onClick={() => handleAnswerSelect(choice)}
                          disabled={answered}
                        >
                          {choice}
                          {showCorrect && ' ✓'}
                          {showIncorrect && ' ✗'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 結果表示 */}
              {answered && (
                <>
                  {isSentenceOrdering ? (
                    <div className={`result-box ${isCorrect() ? 'correct' : 'incorrect'}`}>
                      <div className="result-header">
                        {isCorrect() ? '✅ 正解！' : '❌ 不正解'}
                      </div>
                      <div className="result-content">
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
                      </div>
                    </div>
                  ) : (
                    <>
                      {currentQuestion.explanation && (
                        <div className="explanation-box">
                          <div className="explanation">
                            <strong>解説:</strong><br />
                            {currentQuestion.explanation}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* 難易度評価ボタン */}
                  <div className="difficulty-rating-buttons">
                    <div className="rating-label-compact">
                      この問題の難易度:
                    </div>
                    <div className="rating-button-group">
                      <button 
                        className={`rating-btn easy ${userRating === 3 ? 'active' : ''}`}
                        onClick={() => handleRatingChange(3)}
                        aria-label="簡単"
                      >
                        😊 簡単
                      </button>
                      <button 
                        className={`rating-btn medium ${userRating === 5 ? 'active' : ''}`}
                        onClick={() => handleRatingChange(5)}
                        aria-label="普通"
                      >
                        😐 普通
                      </button>
                      <button 
                        className={`rating-btn hard ${userRating === 8 ? 'active' : ''}`}
                        onClick={() => handleRatingChange(8)}
                        aria-label="難しい"
                      >
                        😰 難しい
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GrammarQuizView;
