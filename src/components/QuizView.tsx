import { QuizState, QuestionSet } from '../types';
import QuestionSetSelector, { DifficultyLevel } from './QuestionSetSelector';
import ScoreBoard from './ScoreBoard';
import QuestionCard from './QuestionCard';

interface QuizViewProps {
  quizState: QuizState;
  questionSets: QuestionSet[];
  selectedSetId: string | null;
  onSelectQuestionSet: (setId: string) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  onAnswer: (answer: string, correct: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onDifficultyRate?: (rating: number) => void;
}

function QuizView({
  quizState,
  questionSets,
  selectedSetId,
  onSelectQuestionSet,
  selectedDifficulty,
  onDifficultyChange,
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
      <QuestionSetSelector
        questionSets={questionSets}
        selectedSetId={selectedSetId}
        onSelect={onSelectQuestionSet}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={onDifficultyChange}
        label="問題集を選択"
      />

      {!hasQuestions ? (
        <div className="empty-state">
          <p>📂 上のメニューから問題集を選択してください</p>
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
