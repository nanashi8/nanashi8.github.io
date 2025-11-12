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

  const handleRetry = () => {
    // リトライのためにページをリロードせず、次の問題に進んで戻る
    onNext();
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
            {choice}
          </button>
        ))}
      </div>

      {answered && (
        <>
          {/* 回答結果カード */}
          <div className="result-cards">
            <button className="result-card-btn retry-btn" onClick={handleRetry}>
              🔄 もう一度
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

          {/* 語源・関連語の表示 */}
          <div className="question-details">
            {question.etymology && (
              <div className="detail-item etymology">
                <div className="detail-label">📚 語源・解説</div>
                <div className="detail-content">{question.etymology}</div>
              </div>
            )}
            {question.relatedWords && (
              <div className="detail-item related-words">
                <div className="detail-label">🔗 関連語・熟語</div>
                <div className="detail-content">{question.relatedWords}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default QuestionCard;
