import { Question } from '../types';
import { generateChoices } from '../utils';
import { useState } from 'react';

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
  onDifficultyRate?: (rating: number) => void;
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
  onDifficultyRate,
}: QuestionCardProps) {
  const choices = generateChoices(question.meaning, allQuestions, currentIndex);
  const [userRating, setUserRating] = useState<number | null>(null);

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
  
  const handleRatingChange = (rating: number) => {
    setUserRating(rating);
    if (onDifficultyRate) {
      onDifficultyRate(rating);
    }
  };
  
  const handleNextClick = () => {
    setUserRating(null); // 次の問題へ行く前にリセット
    onNext();
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
          {/* 難易度評価スライダー */}
          {onDifficultyRate && (
            <div className="difficulty-rating">
              <div className="rating-label">
                この問題の難易度を評価してください (1: 簡単 ↔ 10: 難しい)
              </div>
              <div className="rating-slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={userRating || 5}
                  onChange={(e) => handleRatingChange(Number(e.target.value))}
                  className="rating-slider"
                  aria-label="難易度評価スライダー"
                  title="この問題の難易度を1〜10で評価"
                />
                <div className="rating-value">
                  {userRating || 5}
                </div>
              </div>
              <div className="rating-labels">
                <span>簡単</span>
                <span>普通</span>
                <span>難しい</span>
              </div>
            </div>
          )}
          
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
            <button className="result-card-btn next-btn" onClick={handleNextClick}>
              次の問題へ →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default QuestionCard;
