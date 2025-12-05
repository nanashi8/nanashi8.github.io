import { Question } from '../types';
import { ErrorPrediction } from '../errorPredictionAI';
import { generateChoicesWithQuestions } from '../utils';
import { useState, useRef, useEffect, useMemo } from 'react';
import { generateAIComment, getTimeOfDay } from '../aiCommentGenerator';
import { calculateGoalProgress } from '../goalSimulator';
import { getConfusionPartners, generateConfusionAdvice, analyzeConfusionPatterns } from '../confusionPairs';
import { generateTeacherInteraction, getTeacherReactionToStreak } from '../teacherInteractions';
import { getRelevantMistakeTip } from '../englishTrivia';
import { speakEnglish, isSpeechSynthesisSupported } from '../speechSynthesis';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  allQuestions: Question[];
  currentIndex: number;
  answered: boolean;
  selectedAnswer: string | null;
  onAnswer: (answer: string, correct: string, selectedQuestion?: Question | null) => void;
  onNext: () => void;
  onPrevious: () => void;
  onDifficultyRate?: (rating: number) => void;
  errorPrediction?: ErrorPrediction;
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
  
  const [_userRating, setUserRating] = useState<number | null>(null);
  const [expandedChoices, setExpandedChoices] = useState<Set<number>>(new Set());
  const [_aiComment, setAiComment] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [, setCorrectStreak] = useState<number>(() => {
    const saved = sessionStorage.getItem('currentCorrectStreak');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // スワイプジェスチャー用
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const isTouchingRef = useRef<boolean>(false);
  
  // 問題が変わった時にステートをリセット
  useEffect(() => {
    setUserRating(null);
    setExpandedChoices(new Set());
    setAiComment('');
    setAttemptCount(0);
  }, [currentIndex]);
  
  const toggleChoiceDetails = (index: number) => {
    setExpandedChoices(prev => {
      const newSet = new Set(prev);
      // 回答後は、1つの選択肢をタップすると全ての選択肢の詳細をトグル
      if (answered) {
        // いずれかが開いていれば全て閉じる、全て閉じていれば全て開く
        if (newSet.size > 0) {
          return new Set();
        } else {
          return new Set(choicesWithQuestions.map((_, idx) => idx));
        }
      } else {
        // 回答前は個別にトグル
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      }
    });
  };

  // 不正解時に全ての選択肢の詳細を自動で開く
  useEffect(() => {
    if (answered && selectedAnswer && selectedAnswer !== question.meaning) {
      // 全ての選択肢を開く
      setExpandedChoices(new Set(choicesWithQuestions.map((_, idx) => idx)));
    }
  }, [answered, selectedAnswer, question.meaning, choicesWithQuestions]);

  // 回答時にAIコメントを生成
  useEffect(() => {
    if (answered && selectedAnswer) {
      const personality = (localStorage.getItem('aiPersonality') || 'kind-teacher') as any;
      const isCorrect = selectedAnswer === question.meaning;
      
      // 現在の連続正解数を取得
      const currentStreak = parseInt(sessionStorage.getItem('currentCorrectStreak') || '0', 10);
      
      // 基本のAIコメント
      let comment = generateAIComment(personality, {
        isCorrect,
        word: question.word,
        difficulty: 'intermediate',
        category: '',
        attemptCount: attemptCount + 1,
        responseTime: 0,
        correctStreak: 0,
        incorrectStreak: 0,
        userAccuracy: 0,
        categoryAccuracy: 0,
        isWeakCategory: false,
        hasSeenBefore: false,
        previousAttempts: 0,
        todayQuestions: 0,
        todayAccuracy: 0,
        planProgress: 0,
        timeOfDay: getTimeOfDay(),
      });
      
      // 追加情報を付加
      const additionalComments: string[] = [];
      
      // 1. 目標達成情報（正解時のみ、10%の確率で表示）
      if (isCorrect && Math.random() < 0.1) {
        const goalProgress = calculateGoalProgress();
        if (goalProgress.estimatedDaysToAchieve > 0 && goalProgress.estimatedDaysToAchieve <= 30) {
          if (goalProgress.overallProgress >= 90) {
            additionalComments.push(`🎯 ${goalProgress.goal.name}まであと少し！`);
          } else if (goalProgress.overallProgress >= 75) {
            additionalComments.push(`📈 このペースなら${goalProgress.estimatedDaysToAchieve}日で${goalProgress.goal.name}達成です！`);
          }
        }
      }
      
      // 2. 混同単語の警告（不正解時のみ、混同ペアが存在する場合）
      if (!isCorrect) {
        const confusionPartners = getConfusionPartners(question.word);
        if (confusionPartners.length > 0) {
          additionalComments.push(`💡 「${question.word}」と「${confusionPartners.join(', ')}」を混同しやすいので注意！`);
        }
      }
      
      // 3. 混同グループのアドバイス（不正解時のみ、5%の確率で表示）
      if (!isCorrect && Math.random() < 0.05) {
        const confusionGroups = analyzeConfusionPatterns();
        const relevantGroup = confusionGroups.find(g => 
          g.words.includes(question.word.toLowerCase()) && g.needsReview
        );
        if (relevantGroup) {
          additionalComments.push(generateConfusionAdvice(relevantGroup));
        }
      }
      
      // 4. 教師間のやりとり（正解・不正解両方で10%の確率で表示）
      const interaction = generateTeacherInteraction(personality, isCorrect, currentStreak);
      if (interaction) {
        additionalComments.push(interaction.message);
      }
      
      // 5. 連続正解時の特別リアクション（正解時のみ、特定の連続数で発火）
      if (isCorrect) {
        const streakReaction = getTeacherReactionToStreak(currentStreak + 1); // 次の連続数で判定
        if (streakReaction) {
          additionalComments.push(streakReaction);
        }
      }
      
      // 6. 英語あるある・豆知識（正解・不正解両方で8%の確率で表示）
      const trivia = getRelevantMistakeTip(isCorrect);
      if (trivia) {
        additionalComments.push(trivia);
      }
      
      // 連続正解数を更新（リアクション取得後に更新）
      if (isCorrect) {
        const newStreak = currentStreak + 1;
        setCorrectStreak(newStreak);
        sessionStorage.setItem('currentCorrectStreak', String(newStreak));
      } else {
        setCorrectStreak(0);
        sessionStorage.setItem('currentCorrectStreak', '0');
      }
      
      // コメントを結合
      if (additionalComments.length > 0) {
        comment = `${comment} ${additionalComments[0]}`; // 最初の1つだけ表示
      }
      
      setAiComment(comment);
    } else {
      setAiComment('');
    }
  }, [answered, selectedAnswer, question, attemptCount]);
  
  // スワイプジェスチャーのハンドラー
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 選択肢ボタンや詳細トグルボタン、question-text上でのタッチは無視
      const target = e.target as HTMLElement;
      if (target.closest('.choice-btn') || target.closest('.toggle-details-btn') || 
          target.closest('.rating-btn') || target.closest('.inline-nav-btn') ||
          target.closest('.question-text')) {
        return;
      }
      touchStartX.current = e.touches[0].clientX;
      isTouchingRef.current = true;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === 0) return; // タッチ開始が記録されていない場合は無視
      touchEndX.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = () => {
      if (touchStartX.current === 0) {
        // タッチ開始が記録されていない場合は何もしない
        isTouchingRef.current = false;
        return;
      }
      
      const swipeDistance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 80; // iOSブラウザジェスチャーとの競合回避のため増加
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // 左スワイプ → 次へ
          if (!answered) {
            // 回答前のスワイプはスキップ（handleSkipが呼ばれる）
            onNext();
          } else {
            handleNextClick();
          }
        } else {
          // 右スワイプ → 前へ
          if (currentIndex > 0) {
            onPrevious();
          }
        }
      }
      
      touchStartX.current = 0;
      touchEndX.current = 0;
      setTimeout(() => {
        isTouchingRef.current = false;
      }, 300);
    };
    
    const card = cardRef.current;
    if (card) {
      card.addEventListener('touchstart', handleTouchStart, { passive: true });
      card.addEventListener('touchmove', handleTouchMove, { passive: true });
      card.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        card.removeEventListener('touchstart', handleTouchStart);
        card.removeEventListener('touchmove', handleTouchMove);
        card.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [answered, currentIndex, onNext, onPrevious]); // handleNextClickを依存配列に追加

  // キーボード入力ハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1-4キー: 選択肢を選択（回答前のみ）
      if (!answered && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index < choicesWithQuestions.length) {
          e.preventDefault();
          const choice = choicesWithQuestions[index].text;
          const choiceQuestion = choicesWithQuestions[index].question;
          const isCorrect = choice === question.meaning;
          if (!isCorrect) {
            setAttemptCount(prev => prev + 1);
          }
          onAnswer(choice, question.meaning, choiceQuestion);
        }
      }
      // スペースキー: スキップ（回答前のみ）
      else if (!answered && e.key === ' ') {
        e.preventDefault();
        onNext(); // handleSkipが呼ばれる
      }
      // Enterキー: 次へ進む（回答後）またはスキップ（回答前）
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (answered) {
          handleNextClick();
        } else {
          onNext(); // handleSkipが呼ばれる
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [answered, choicesWithQuestions, question, onAnswer, attemptCount]);

  const getButtonClass = (choice: string) => {
    // Tailwindクラスによるスタイリング
    const baseClasses = 'w-full min-h-[56px] p-4 text-base rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center touch-manipulation select-none shadow-sm';
    const hoverClasses = 'hover:border-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-1 hover:shadow-lg';
    const activeClasses = 'active:bg-gray-200 dark:active:bg-gray-700 active:translate-y-0';
    
    // 「分からない」選択肢は特別なスタイル
    if (choice === '分からない') {
      if (!answered) {
        return `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-500 ${hoverClasses} ${activeClasses}`;
      }
      // 回答後に「分からない」を選択していた場合は不正解の色
      if (choice === selectedAnswer) {
        return `${baseClasses} bg-red-600 border-red-600 text-white`;
      }
      return `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-500`;
    }
    
    if (!answered) {
      return `${baseClasses} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${hoverClasses} ${activeClasses}`;
    }
    
    if (choice === question.meaning) {
      return `${baseClasses} bg-green-600 border-green-600 text-white`;
    }
    if (choice === selectedAnswer && choice !== question.meaning) {
      return `${baseClasses} bg-red-600 border-red-600 text-white`;
    }
    return `${baseClasses} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`;
  };
  
  const handleNextClick = () => {
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
          className="flex-shrink-0 w-11 h-11 rounded-full text-xl font-bold border-2 border-primary bg-secondary text-primary cursor-pointer transition-all duration-300 flex items-center justify-center p-0 hover:bg-primary hover:text-white hover:scale-110 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:border-border disabled:text-muted dark:bg-secondary dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-white" 
          onClick={onPrevious}
          disabled={currentIndex === 0}
          title="前へ"
        >
          ←
        </button>
        <div 
          className={`question-content-inline ${isSpeechSynthesisSupported() ? 'clickable-pronunciation' : ''}`}
          onClick={(e) => {
            if (isSpeechSynthesisSupported()) {
              e.preventDefault();
              e.stopPropagation();
              speakEnglish(question.word, { rate: 0.85 });
            }
          }}
          onTouchEnd={(e) => {
            if (isSpeechSynthesisSupported()) {
              e.preventDefault();
              e.stopPropagation();
              speakEnglish(question.word, { rate: 0.85 });
            }
          }}
          title={isSpeechSynthesisSupported() ? 'タップして発音を聞く 🔊' : ''}
        >
          <div 
            className={`question-text ${question.word.includes(' ') ? 'phrase-text text-2xl' : ''} ${isSpeechSynthesisSupported() ? 'clickable-word' : ''}`}
          >
            {question.word}
            {isSpeechSynthesisSupported() && (
              <span className="speaker-icon">🔊</span>
            )}
          </div>
          {question.reading && (
            <div className="question-reading">【{question.reading}】</div>
          )}
          {question.difficulty && (
            <div className={`difficulty-badge ${question.difficulty}`}>
              {question.difficulty === 'beginner' ? '初級' : 
               question.difficulty === 'intermediate' ? '中級' : '上級'}
            </div>
          )}
        </div>
        <button 
          className="flex-shrink-0 w-11 h-11 rounded-full text-xl font-bold border-2 border-primary bg-primary text-white cursor-pointer transition-all duration-300 flex items-center justify-center p-0 hover:bg-primary-hover hover:scale-110 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:border-border disabled:text-muted dark:bg-primary dark:border-primary dark:hover:bg-primary-hover" 
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
                onClick={(e) => {
                  if (answered) {
                    // 回答済みの場合は詳細をトグル
                    e.preventDefault();
                    e.stopPropagation();
                    if (choiceQuestion) {
                      toggleChoiceDetails(idx);
                    }
                    return;
                  }
                  
                  const isCorrect = choice.text === question.meaning;
                  if (!isCorrect) {
                    setAttemptCount(prev => prev + 1);
                  }
                  onAnswer(choice.text, question.meaning, choiceQuestion);
                }}
                disabled={false}
              >
                <div className="choice-content">
                  <div className="choice-text">{choice.text}</div>
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
                  {choiceQuestion.meaning && (
                    <div className="choice-detail-item">
                      <span className="detail-label">意味:</span>
                      <span className="detail-text">{choiceQuestion.meaning}</span>
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
    </div>
  );
}

export default QuestionCard;
