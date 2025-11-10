import { QuizState } from '../types';
import FileSelector from './FileSelector';
import ScoreBoard from './ScoreBoard';
import QuestionCard from './QuestionCard';

interface QuizViewProps {
  quizState: QuizState;
  onLoadCSV: (filePath: string) => void;
  onLoadLocalFile: (file: File) => void;
  onAnswer: (answer: string, correct: string) => void;
  onNext: () => void;
}

function QuizView({
  quizState,
  onLoadCSV,
  onLoadLocalFile,
  onAnswer,
  onNext,
}: QuizViewProps) {
  const { questions, currentIndex, score, totalAnswered, answered, selectedAnswer } =
    quizState;

  const hasQuestions = questions.length > 0;
  const currentQuestion = hasQuestions ? questions[currentIndex] : null;

  return (
    <div className="quiz-view">
      <FileSelector onLoadCSV={onLoadCSV} onLoadLocalFile={onLoadLocalFile} />

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
            />
          )}
        </>
      )}
    </div>
  );
}

export default QuizView;
