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
        {choices.map((choice, idx) => {
          // この選択肢に対応する問題を見つける
          const choiceQuestion = allQuestions.find(q => q.meaning === choice) || question;
          
          return (
            <button
              key={idx}
              className={getButtonClass(choice)}
              onClick={() => onAnswer(choice, question.meaning)}
              disabled={answered}
            >
              <div className="choice-text">{choice}</div>
              {answered && (
                <div className="choice-details">
                  <div className="choice-detail-item">
                    <span className="detail-label">語句:</span>
                    <span className="detail-text">{choiceQuestion.word}</span>
                  </div>
                  {choiceQuestion.reading && (
                    <div className="choice-detail-item">
                      <span className="detail-label">読み:</span>
                      <span className="detail-text">{choiceQuestion.reading}</span>
                    </div>
                  )}
                  {choiceQuestion.etymology && (
                    <div className="choice-detail-item">
                      <span className="detail-label">📚 語源等:</span>
                      <span className="detail-text">{choiceQuestion.etymology}</span>
                    </div>
                  )}
                  {choiceQuestion.relatedWords && (
                    <div className="choice-detail-item">
                      <span className="detail-label">🔗 関連語:</span>
                      <span className="detail-text">{choiceQuestion.relatedWords}</span>
                    </div>
                  )}
                  {choiceQuestion.relatedFields && (
                    <div className="choice-detail-item">
                      <span className="detail-label">🏷️ 分野:</span>
                      <span className="detail-text">{choiceQuestion.relatedFields}</span>
                    </div>
                  )}
                  {choiceQuestion.difficulty && (
                    <div className="choice-detail-item">
                      <span className="detail-label">難易度:</span>
                      <span className="detail-text">{choiceQuestion.difficulty}</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
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
