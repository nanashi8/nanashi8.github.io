import { Question } from '../types';
import { generateChoicesWithQuestions, classifyPhraseType, getPhraseTypeLabel } from '../utils';
import { recordWordSkip } from '../progressStorage';
import { useState, useRef, useEffect, useMemo } from 'react';

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
  // 選択肢をuseMemoで固定（currentIndexが変わった時だけ再生成）
  const choicesWithQuestions = useMemo(
    () => generateChoicesWithQuestions(question, allQuestions, currentIndex),
    [question.word, allQuestions, currentIndex]
  );
  
  const [userRating, setUserRating] = useState<number | null>(null);
  const [expandedChoices, setExpandedChoices] = useState<Set<number>>(new Set());
  
  // スワイプジェスチャー用
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const toggleChoiceDetails = (index: number) => {
    setExpandedChoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  
  // スワイプジェスチャーのハンドラー
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = () => {
      const swipeDistance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50; // 最小スワイプ距離
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // 左スワイプ → 次へ
          if (!answered) {
            // 回答前のスワイプはスキップとして記録
            recordWordSkip(question.word, 7); // 7日間除外
          }
          handleNextClick();
        } else {
          // 右スワイプ → 前へ
          if (currentIndex > 0) {
            onPrevious();
          }
        }
      }
      
      touchStartX.current = 0;
      touchEndX.current = 0;
    };
    
    const card = cardRef.current;
    if (card) {
      card.addEventListener('touchstart', handleTouchStart);
      card.addEventListener('touchmove', handleTouchMove);
      card.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        card.removeEventListener('touchstart', handleTouchStart);
        card.removeEventListener('touchmove', handleTouchMove);
        card.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [answered, currentIndex, onPrevious]); // handleNextClickは依存配列に含めない

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
    setExpandedChoices(new Set()); // 開閉状態をリセット
    onNext();
  };

  return (
    <div 
      className={`question-card ${answered ? (selectedAnswer === question.meaning ? 'answered-correct' : 'answered-incorrect') : ''}`}
      ref={cardRef}
    >
      <div className="question-number-badge">第{currentIndex + 1}問</div>
      
      {/* ナビゲーションボタン（上部） */}
      {answered && (
        <div className="navigation-buttons navigation-buttons-top">
          <button 
            className="nav-btn prev-btn" 
            onClick={onPrevious}
            disabled={currentIndex === 0}
          >
            ← 前へ
          </button>
          <button className="nav-btn next-btn" onClick={handleNextClick}>
            次へ →
          </button>
        </div>
      )}
      
      <div className="question-header-row">
        <div className="question-main">
          <div className={`question-text ${question.word.includes(' ') ? 'phrase-text' : ''}`}>
            {question.word}
          </div>
          {question.reading && (
            <div className="question-reading">【{question.reading}】</div>
          )}
          {question.word.includes(' ') && (
            <div className="phrase-info">
              <span className="phrase-badge">📖 熟語</span>
              <span className="phrase-type-badge">
                {getPhraseTypeLabel(classifyPhraseType(question.word))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="choices">
        {choicesWithQuestions.map((choice, idx) => {
          const isExpanded = expandedChoices.has(idx);
          const choiceQuestion = choice.question;
          
          return (
            <div key={idx} className="choice-wrapper">
              <button
                className={getButtonClass(choice.text)}
                onClick={() => onAnswer(choice.text, question.meaning)}
                disabled={answered}
              >
                <div className="choice-text">{choice.text}</div>
              </button>
              {answered && choiceQuestion && (
                <div className="choice-controls">
                  <button 
                    className="toggle-details-btn"
                    onClick={() => toggleChoiceDetails(idx)}
                  >
                    {isExpanded ? '閉じる ▲' : '詳細を見る ▼'}
                  </button>
                  {isExpanded && (
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
                </div>
              )}
            </div>
          );
        })}
      </div>

      {answered && (
        <>
          {/* 難易度評価ボタン（コンパクト版） */}
          {onDifficultyRate && (
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
          )}
          
          {/* ナビゲーションボタン */}
          <div className="navigation-buttons">
            <button 
              className="nav-btn prev-btn" 
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              ← 前へ
            </button>
            <button className="nav-btn next-btn" onClick={handleNextClick}>
              次へ →
            </button>
          </div>
          
          {/* スワイプヒント */}
          <div className="swipe-hint">
            💡 左右にスワイプして問題を移動できます
          </div>
        </>
      )}
    </div>
  );
}

export default QuestionCard;
