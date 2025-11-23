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

interface Category {
  category: string;
  grammarPoint: string;
  questions: VerbFormQuestion[] | FillInBlankQuestion[];
}

interface QuizData {
  grade: number;
  totalQuestions: number;
  categories: Category[];
}

type QuizType = 'verb-form' | 'fill-in-blank';
type Grade = 1 | 2 | 3;

interface GrammarQuizViewProps {
  onSaveProgress?: (data: any) => void;
}

function GrammarQuizView({ }: GrammarQuizViewProps) {
  const [quizType, setQuizType] = useState<QuizType>('verb-form');
  const [grade, setGrade] = useState<Grade>(1);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ読み込み
  useEffect(() => {
    const filename = quizType === 'verb-form' 
      ? `verb-form-questions-grade${grade}.json`
      : `fill-in-blank-questions-grade${grade}.json`;
    
    setLoading(true);
    setError(null);
    
    fetch(`/data/${filename}`)
      .then(res => {
        if (!res.ok) throw new Error(`ファイルが見つかりません: ${filename}`);
        return res.json();
      })
      .then((data: QuizData) => {
        setQuizData(data);
        setCurrentCategoryIndex(0);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setShowHint(false);
        setLoading(false);
      })
      .catch(err => {
        console.error('データ読み込みエラー:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [quizType, grade]);

  const currentCategory = quizData?.categories[currentCategoryIndex];
  const currentQuestion = currentCategory?.questions[currentQuestionIndex] as VerbFormQuestion | FillInBlankQuestion;

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return; // 既に回答済み
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    setShowResult(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleNext = () => {
    if (!currentCategory) return;
    
    // 次の問題へ
    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    } else if (currentCategoryIndex < (quizData?.categories.length || 0) - 1) {
      // 次のカテゴリへ
      setCurrentCategoryIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      // 全問題完了
      alert(`完了！正解率: ${Math.round((score.correct / score.total) * 100)}%`);
    }
  };

  const toggleHint = () => {
    setShowHint(prev => !prev);
  };

  if (loading) {
    return <div className="grammar-quiz-loading">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="grammar-quiz-error">
        <p>エラー: {error}</p>
        <p>1年生の動詞変化問題と穴埋め問題のみ利用可能です。</p>
      </div>
    );
  }

  if (!quizData || !currentQuestion) {
    return <div className="grammar-quiz-error">問題データがありません</div>;
  }

  const isCorrect = showResult && selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="grammar-quiz-container">
      <div className="grammar-quiz-header">
        <h2>文法問題</h2>
        
        {/* タイプ選択 */}
        <div className="quiz-type-selector">
          <button
            className={quizType === 'verb-form' ? 'active' : ''}
            onClick={() => setQuizType('verb-form')}
          >
            動詞変化
          </button>
          <button
            className={quizType === 'fill-in-blank' ? 'active' : ''}
            onClick={() => setQuizType('fill-in-blank')}
          >
            穴埋め
          </button>
        </div>

        {/* 学年選択 */}
        <div className="grade-selector">
          {[1, 2, 3].map(g => (
            <button
              key={g}
              className={grade === g ? 'active' : ''}
              onClick={() => setGrade(g as Grade)}
            >
              {g}年生
            </button>
          ))}
        </div>

        {/* 進捗表示 */}
        <div className="progress-info">
          <p>カテゴリ: {currentCategory?.category}</p>
          <p>問題 {currentQuestionIndex + 1} / {currentCategory?.questions.length}</p>
          <p>正解率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%</p>
        </div>
      </div>

      <div className="grammar-quiz-content">
        {/* 問題文 */}
        <div className="question-section">
          <p className="japanese-sentence">{currentQuestion.japanese}</p>
          <p className="english-sentence">
            {currentQuestion.sentence.split('____').map((part, idx, arr) => (
              <span key={idx}>
                {part}
                {idx < arr.length - 1 && (
                  <span className="blank-placeholder">____</span>
                )}
              </span>
            ))}
          </p>
          {'verb' in currentQuestion && (
            <p className="verb-hint">動詞: {currentQuestion.verb}</p>
          )}
        </div>

        {/* 選択肢 */}
        <div className="choices-section">
          {currentQuestion.choices.map((choice, idx) => (
            <button
              key={idx}
              className={`choice-button ${
                selectedAnswer === choice ? 'selected' : ''
              } ${
                showResult && choice === currentQuestion.correctAnswer ? 'correct' : ''
              } ${
                showResult && selectedAnswer === choice && choice !== currentQuestion.correctAnswer ? 'incorrect' : ''
              }`}
              onClick={() => handleAnswerSelect(choice)}
              disabled={showResult}
            >
              {choice}
            </button>
          ))}
        </div>

        {/* ヒント */}
        <div className="hint-section">
          <button onClick={toggleHint} className="hint-toggle">
            {showHint ? 'ヒントを隠す' : 'ヒントを見る'}
          </button>
          {showHint && (
            <p className="hint-text">💡 {currentQuestion.hint}</p>
          )}
        </div>

        {/* 結果表示 */}
        {showResult && (
          <div className={`result-section ${isCorrect ? 'correct' : 'incorrect'}`}>
            <p className="result-title">
              {isCorrect ? '✅ 正解！' : '❌ 不正解'}
            </p>
            <p className="correct-answer">
              正解: {currentQuestion.correctAnswer}
            </p>
            <p className="explanation">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="action-buttons">
          {!showResult ? (
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              回答する
            </button>
          ) : (
            <button className="next-button" onClick={handleNext}>
              次の問題へ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default GrammarQuizView;
