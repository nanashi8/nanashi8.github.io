import { Question } from '../types';
import { generateChoicesWithQuestions, classifyPhraseType, getPhraseTypeLabel } from '../utils';
import { recordWordSkip } from '../progressStorage';
import { useState, useRef, useEffect, useMemo } from 'react';
import { generateAIComment } from '../aiCommentGenerator';

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
  const [aiComment, setAiComment] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState<number>(0);
  
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

  // 回答時にAIコメントを生成
  useEffect(() => {
    if (answered && selectedAnswer) {
      const personality = (localStorage.getItem('aiPersonality') || 'kind-teacher') as any;
      const isCorrect = selectedAnswer === question.meaning;
      const comment = generateAIComment(personality, {
        isCorrect,
        word: question.word,
        userAnswer: selectedAnswer,
        correctAnswer: question.meaning,
        attemptNumber: attemptCount + 1,
        timeSpent: 0,
      });
      setAiComment(comment);
    } else {
      setAiComment('');
    }
  }, [answered, selectedAnswer, question, attemptCount]);
  
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
      const minSwipeDistance = 80; // iOSブラウザジェスチャーとの競合回避のため増加
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // 左スワイプ → 次へ
          if (!answered) {
            // 回答前のスワイプはスキップとして記録（定着扱い）
            recordWordSkip(question.word, 7); // 7日間除外
            // スコアボードに反映（正解扱い）
            onAnswer(question.meaning, question.meaning);
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

  // キーボード入力ハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1-4キー: 選択肢を選択（回答前のみ）
      if (!answered && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index < choicesWithQuestions.length) {
          e.preventDefault();
          const choice = choicesWithQuestions[index].text;
          const isCorrect = choice === question.meaning;
          if (!isCorrect) {
            setAttemptCount(prev => prev + 1);
          }
          onAnswer(choice, question.meaning);
        }
      }
      // スペースキー: 「分からない」選択肢を選択（回答前のみ）
      else if (!answered && e.key === ' ') {
        e.preventDefault();
        // 最後の選択肢（「分からない」）を選択
        if (choicesWithQuestions.length > 0) {
          const lastChoice = choicesWithQuestions[choicesWithQuestions.length - 1].text;
          const isCorrect = lastChoice === question.meaning;
          if (!isCorrect) {
            setAttemptCount(prev => prev + 1);
          }
          onAnswer(lastChoice, question.meaning);
        }
      }
      // Enterキー: 次へ進む（回答後）またはスキップ（回答前）
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (!answered) {
          recordWordSkip(question.word, 7);
          onAnswer(question.meaning, question.meaning);
        }
        handleNextClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [answered, choicesWithQuestions, question, onAnswer, attemptCount]);

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
    // 回答前に次へボタンを押した場合はスキップ扱い
    if (!answered) {
      recordWordSkip(question.word, 7);
      // スコアボードに反映（正解扱い）
      onAnswer(question.meaning, question.meaning);
    }
    setUserRating(null); // 次の問題へ行く前にリセット
    setExpandedChoices(new Set()); // 開閉状態をリセット
    setAttemptCount(0); // 試行回数をリセット
    onNext();
  };

  return (
    <div 
      className="question-card"
      ref={cardRef}
    >
      <div className="question-nav-row">
        <button 
          className="inline-nav-btn prev-inline-btn" 
          onClick={onPrevious}
          disabled={currentIndex === 0}
          title="前へ"
        >
          ←
        </button>
        <div className="question-content-inline">
          <div className={`question-text ${question.word.includes(' ') ? 'phrase-text' : ''}`}>
            {question.word}
          </div>
          {question.reading && (
            <div className="question-reading">【{question.reading}】</div>
          )}
        </div>
        <button 
          className="inline-nav-btn next-inline-btn" 
          onClick={handleNextClick}
          title="次へ"
        >
          →
        </button>
      </div>

      <div className="choices">
        {choicesWithQuestions.map((choice, idx) => {
          const isExpanded = expandedChoices.has(idx);
          const choiceQuestion = choice.question;
          
          return (
            <div key={idx} className="choice-wrapper">
              <button
                className={getButtonClass(choice.text)}
                onClick={() => {
                  if (!answered) {
                    const isCorrect = choice.text === question.meaning;
                    if (!isCorrect) {
                      setAttemptCount(prev => prev + 1);
                    }
                    onAnswer(choice.text, question.meaning);
                  }
                }}
                disabled={false}
              >
                <div className="choice-content">
                  <div className="choice-text">{choice.text}</div>
                  {answered && choiceQuestion && (
                    <button 
                      className="toggle-details-btn-inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChoiceDetails(idx);
                      }}
                      title={isExpanded ? '詳細を閉じる' : '詳細を見る'}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </button>
              {answered && choiceQuestion && isExpanded && (
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
          );
        })}
      </div>

      {/* AIコメント行 - 選択肢の下に配置 */}
      {answered && aiComment && (
        <div className="ai-comment-bar">
          <span className="ai-comment-icon">💬</span>
          <span className="ai-comment-text">{aiComment}</span>
        </div>
      )}

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
        </>
      )}
    </div>
  );
}

export default QuestionCard;
