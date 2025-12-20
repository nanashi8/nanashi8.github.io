import { Question } from '../types';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';
import { ErrorPrediction } from '@/ai/prediction/errorPredictionAI';
import { generateChoicesWithQuestions } from '../utils';
import { useState, useRef, useEffect, useMemo } from 'react';
import { generateAIComment, getTimeOfDay } from '../aiCommentGenerator';
import { calculateGoalProgress } from '../goalSimulator';
import {
  getConfusionPartners,
  generateConfusionAdvice,
  analyzeConfusionPatterns,
} from '@/features/analysis/confusionPairs';
import { generateTeacherInteraction, getTeacherReactionToStreak } from '../teacherInteractions';
import { getRelevantMistakeTip } from '../englishTrivia';
import { speakEnglish, isSpeechSynthesisSupported } from '@/features/speech/speechSynthesis';
import AddToCustomButton from './AddToCustomButton';
import { useAdaptiveNetwork } from '../hooks/useAdaptiveNetwork';
import { PriorityBadge } from './PriorityBadge';
import { useWordPriority } from '@/hooks/useWordPriority';

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
  customQuestionSets?: CustomQuestionSet[];
  onAddWordToCustomSet?: (setId: string, word: CustomWord) => void;
  onRemoveWordFromCustomSet?: (setId: string, word: CustomWord) => void;
  onOpenCustomSetManagement?: () => void;
  onFullscreen?: () => void;
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
  onDifficultyRate: _onDifficultyRate,
  customQuestionSets = [],
  onAddWordToCustomSet,
  onRemoveWordFromCustomSet,
  onOpenCustomSetManagement,
  onFullscreen,
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

  // 適応的AIネットワーク
  const {
    enabled: adaptiveEnabled,
    processQuestion: processAdaptiveQuestion,
    currentStrategy,
  } = useAdaptiveNetwork();

  // 優先度情報を取得
  const priorityExplanation = useWordPriority(question.word);

  // メタAI分析ヘルパー関数
  const processWithAdaptiveAI = async (word: string, isCorrect: boolean) => {
    if (!adaptiveEnabled) return;

    try {
      // コンテキスト情報を収集
      const calculateDifficulty = (q: Question): number => {
        const gradeWeight = (q.grade || 1) / 9;
        return Math.min(Math.max(gradeWeight, 0), 1);
      };

      const getRecentErrors = (): number => {
        const recentAnswers = JSON.parse(sessionStorage.getItem('recentAnswers') || '[]');
        return recentAnswers.filter((a: any) => !a.correct).length;
      };

      const getSessionLength = (): number => {
        const startTime = sessionStorage.getItem('sessionStartTime');
        if (!startTime) return 0;
        return Math.floor((Date.now() - parseInt(startTime)) / 60000);
      };

      const getConsecutiveCorrect = (): number => {
        return parseInt(sessionStorage.getItem('currentCorrectStreak') || '0');
      };

      const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        if (hour < 22) return 'evening';
        return 'night';
      };

      const recommendation = await processAdaptiveQuestion(
        word,
        isCorrect ? 'correct' : 'incorrect',
        {
          currentDifficulty: calculateDifficulty(question),
          timeOfDay: getTimeOfDay(),
          recentErrors: getRecentErrors(),
          sessionLength: getSessionLength(),
          consecutiveCorrect: getConsecutiveCorrect(),
        }
      );

      // デバッグログ
      console.log('[AdaptiveAI]', recommendation.reason, {
        strategy: recommendation.strategy,
        confidence: recommendation.confidence,
      });
    } catch (error) {
      console.error('[QuestionCard] Adaptive AI error:', error);
    }
  };

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
    setExpandedChoices((prev) => {
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

  // 不正解時に全ての選択肢の詳細を自動で開く（設定でON/OFF可能）
  useEffect(() => {
    const autoShowDetails = localStorage.getItem('autoShowDetails') !== 'false'; // デフォルトはtrue
    if (answered && selectedAnswer && selectedAnswer !== question.meaning && autoShowDetails) {
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
            additionalComments.push(
              `📈 このペースなら${goalProgress.estimatedDaysToAchieve}日で${goalProgress.goal.name}達成です！`
            );
          }
        }
      }

      // 2. 混同単語の警告（不正解時のみ、混同ペアが存在する場合）
      if (!isCorrect) {
        const confusionPartners = getConfusionPartners(question.word);
        if (confusionPartners.length > 0) {
          additionalComments.push(
            `💡 「${question.word}」と「${confusionPartners.join(', ')}」を混同しやすいので注意！`
          );
        }
      }

      // 3. 混同グループのアドバイス（不正解時のみ、5%の確率で表示）
      if (!isCorrect && Math.random() < 0.05) {
        const confusionGroups = analyzeConfusionPatterns();
        const relevantGroup = confusionGroups.find(
          (g) => g.words.includes(question.word.toLowerCase()) && g.needsReview
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

  const handleNextClick = () => {
    setExpandedChoices(new Set());
    setAttemptCount(0);
    onNext();
  };

  // スワイプジェスチャーのハンドラー
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 選択肢ボタンや詳細トグルボタン、question-text上でのタッチは無視
      const target = e.target as HTMLElement;
      if (
        target.closest('.choice-btn') ||
        target.closest('.toggle-details-btn') ||
        target.closest('.rating-btn') ||
        target.closest('.inline-nav-btn') ||
        target.closest('.question-text')
      ) {
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
  }, [answered, currentIndex, onNext, onPrevious]);

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
            setAttemptCount((prev) => prev + 1);
          }
          onAnswer(choice, question.meaning, choiceQuestion);

          // 適応的AI分析
          processWithAdaptiveAI(question.word, isCorrect);
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
    // Tailwindクラスによるスタイリング（レスポンシブで自動最適化）
    const baseClasses =
      'w-full min-h-11 sm:min-h-14 p-2 sm:p-4 text-sm sm:text-base rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center touch-manipulation select-none shadow-sm';
    const hoverClasses =
      'hover:border-blue-600 hover:bg-gray-100:bg-gray-800 hover:-translate-y-1 hover:shadow-lg';
    const activeClasses = 'active:bg-gray-200:bg-gray-700 active:translate-y-0';

    // 「分からない」選択肢は特別なスタイル
    if (choice === '分からない') {
      if (!answered) {
        return `${baseClasses} bg-gray-100 text-gray-600 border-gray-400 ${hoverClasses} ${activeClasses}`;
      }
      // 回答後に「分からない」を選択していた場合は不正解の色
      if (choice === selectedAnswer) {
        return `${baseClasses} bg-red-600 border-red-600 text-white`;
      }
      return `${baseClasses} bg-gray-100 text-gray-600 border-gray-400`;
    }

    if (!answered) {
      return `${baseClasses} bg-gray-50 text-gray-900 border-gray-300 ${hoverClasses} ${activeClasses}`;
    }

    if (choice === question.meaning) {
      return `${baseClasses} bg-green-600 border-green-600 text-white`;
    }
    if (choice === selectedAnswer && choice !== question.meaning) {
      return `${baseClasses} bg-red-600 border-red-600 text-white`;
    }
    return `${baseClasses} bg-gray-50 text-gray-900 border-gray-300`;
  };

  return (
    <div className="question-card" ref={cardRef}>
      {/* 全画面表示ボタン */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="absolute top-2 right-2 z-10 p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition shadow-md"
          aria-label="全画面表示"
          title="全画面表示"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
      )}
      <div className="question-nav-row">
        <button
          className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition flex items-center justify-center text-xl sm:text-2xl disabled:opacity-30 disabled:cursor-not-allowed"
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
            className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 break-words ${question.word.includes(' ') ? 'phrase-text' : ''} ${isSpeechSynthesisSupported() ? 'clickable-word' : ''}`}
          >
            {question.word}
            {isSpeechSynthesisSupported() && <span className="speaker-icon">🔊</span>}
          </div>
          {question.reading && (
            <div className="question-reading text-sm sm:text-base text-gray-600 mt-1">
              【{question.reading}】
            </div>
          )}
          {question.difficulty && (
            <div className={`difficulty-badge ${question.difficulty}`}>
              {question.difficulty === 'beginner'
                ? '初級'
                : question.difficulty === 'intermediate'
                  ? '中級'
                  : '上級'}
            </div>
          )}

          {/* 優先度バッジ */}
          {priorityExplanation && (
            <div className="mt-3 flex justify-center">
              <div className="inline-block">
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 ${priorityExplanation.priority >= 100 ? 'text-red-600 bg-red-50 border-red-200' : priorityExplanation.priority >= 75 ? 'text-orange-600 bg-orange-50 border-orange-200' : priorityExplanation.priority >= 50 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-blue-600 bg-blue-50 border-blue-200'}`}
                  title={priorityExplanation.userMessage}
                >
                  <span>{priorityExplanation.factors[0].icon}</span>
                  <span>{priorityExplanation.priority >= 100 ? '最優先' : priorityExplanation.priority >= 75 ? '優先' : priorityExplanation.priority >= 50 ? '通常' : '低'}</span>
                  <span className="font-bold">{priorityExplanation.priority.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 適応的AI戦略バッジ */}
          {adaptiveEnabled && currentStrategy && (
            <div className="adaptive-strategy-badge">🧠 適応中</div>
          )}

          {/* カスタムセットに追加ボタン */}
          {onAddWordToCustomSet &&
            onRemoveWordFromCustomSet &&
            onOpenCustomSetManagement &&
            customQuestionSets && (
              <div className="mt-3 flex justify-center">
                <AddToCustomButton
                  word={{
                    word: question.word,
                    meaning: question.meaning,
                    katakana: question.reading,
                    source: 'translation',
                  }}
                  sets={customQuestionSets}
                  onAddWord={onAddWordToCustomSet}
                  onRemoveWord={onRemoveWordFromCustomSet}
                  onOpenManagement={onOpenCustomSetManagement}
                  size="medium"
                  variant="both"
                />
              </div>
            )}
        </div>
        <button
          className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition flex items-center justify-center text-xl sm:text-2xl disabled:opacity-30 disabled:cursor-not-allowed"
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
                    setAttemptCount((prev) => prev + 1);
                  }
                  onAnswer(choice.text, question.meaning, choiceQuestion);

                  // 適応的AI分析
                  processWithAdaptiveAI(question.word, isCorrect);
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
