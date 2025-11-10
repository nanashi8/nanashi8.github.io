import { Question } from '../types';
import { generateChoices } from '../utils';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  allQuestions: Question[];
  currentIndex: number;
  answered: boolean;
  selectedAnswer: string | null;
  onAnswer: (answer: string, correct: string) => void;
  onNext: () => void;
}

function QuestionCard({
  question,
  questionNumber,
  allQuestions,
  currentIndex,
  answered,
  selectedAnswer,
  onAnswer,
  onNext,
}: QuestionCardProps) {
  const choices = generateChoices(question.meaning, allQuestions, currentIndex);

  const getButtonClass = (choice: string) => {
    if (!answered) return 'choice-btn';
    
    if (choice === question.meaning) {
      return 'choice-btn correct';
    }
    if (choice === selectedAnswer && choice !== question.meaning) {
      return 'choice-btn incorrect';
    }
    return 'choice-btn';
  };

  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-number">第{questionNumber}問</span>
      </div>
      
      <div className="question-text">{question.word}</div>
      
      {question.hint && (
        <div className="question-hint">({question.hint})</div>
      )}

      <div className="choices">
        {choices.map((choice, idx) => (
          <button
            key={idx}
            className={getButtonClass(choice)}
            onClick={() => onAnswer(choice, question.meaning)}
            disabled={answered}
          >
            {choice}
          </button>
        ))}
      </div>

      {answered && (
        <div className={`result ${selectedAnswer === question.meaning ? 'correct' : 'incorrect'}`}>
          {selectedAnswer === question.meaning ? (
            <span>🎉 正解！</span>
          ) : (
            <span>❌ 不正解。正解は「{question.meaning}」です。</span>
          )}
        </div>
      )}

      {answered && (
        <button className="next-btn" onClick={onNext}>
          次の問題へ →
        </button>
      )}
    </div>
  );
}

export default QuestionCard;
