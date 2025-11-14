import { QuizState } from '../types';
import { DifficultyLevel } from '../App';
import ScoreBoard from './ScoreBoard';
import QuestionCard from './QuestionCard';

interface QuizViewProps {
  quizState: QuizState;
  categoryList: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  onStartQuiz: () => void;
  onAnswer: (answer: string, correct: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onDifficultyRate?: (rating: number) => void;
}

function QuizView({
  quizState,
  categoryList,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  onStartQuiz,
  onAnswer,
  onNext,
  onPrevious,
  onDifficultyRate,
}: QuizViewProps) {
  const { questions, currentIndex, score, totalAnswered, answered, selectedAnswer } =
    quizState;

  const hasQuestions = questions.length > 0;
  const currentQuestion = hasQuestions ? questions[currentIndex] : null;

  return (
    <div className="quiz-view">
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
            score={score}
            totalAnswered={totalAnswered}
            totalQuestions={questions.length}
            currentIndex={currentIndex}
          />
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              allQuestions={questions}
              currentIndex={currentIndex}
              answered={answered}
              selectedAnswer={selectedAnswer}
              onAnswer={onAnswer}
              onNext={onNext}
              onPrevious={onPrevious}
              onDifficultyRate={onDifficultyRate}
            />
          )}
        </>
      )}
    </div>
  );
}

export default QuizView;
