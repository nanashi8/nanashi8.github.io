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
  onPrevious: () => void;
}

function QuestionCard({
  question,
  allQuestions,
  currentIndex,
  answered,
  selectedAnswer,
  onAnswer,
  onNext,
  onPrevious,
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
      <div className="question-text">{question.word}</div>
      
      {question.reading && (
        <div className="question-reading">【{question.reading}】</div>
      )}

      <div className="choices">
        {choices.map((choice, idx) => (
          <button
            key={idx}
            className={getButtonClass(choice)}
            onClick={() => onAnswer(choice, question.meaning)}
            disabled={answered}
          >
            <div className="choice-text">{choice}</div>
            {answered && choice === question.meaning && (
              <div className="choice-details">
                {question.etymology && (
                  <div className="choice-detail-item">
                    <span className="detail-icon">📚</span>
                    <span className="detail-text">{question.etymology}</span>
                  </div>
                )}
                {question.relatedWords && (
                  <div className="choice-detail-item">
                    <span className="detail-icon">🔗</span>
                    <span className="detail-text">{question.relatedWords}</span>
                  </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {answered && (
        <>
          {/* 回答結果カード */}
          <div className="result-cards">
            <button 
              className="result-card-btn prev-btn" 
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              ← 前の問題へ
            </button>
            <div className={`result-card ${selectedAnswer === question.meaning ? 'correct' : 'incorrect'}`}>
              {selectedAnswer === question.meaning ? (
                <span className="result-icon">🎉 正解！</span>
              ) : (
                <span className="result-icon">❌ 不正解</span>
              )}
            </div>
            <button className="result-card-btn next-btn" onClick={onNext}>
              次の問題へ →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default QuestionCard;
