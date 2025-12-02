import { useState } from 'react';
import { QuizState } from '../types';
import { DifficultyLevel, WordPhraseFilter, PhraseTypeFilter, DataSource } from '../App';
import { ErrorPrediction } from '../errorPredictionAI';
import ScoreBoard from './ScoreBoard';
import QuestionCard from './QuestionCard';
import TimeBasedGreetingBanner from './TimeBasedGreetingBanner';
import LearningLimitsInput from './LearningLimitsInput';
import { useLearningLimits } from '../hooks/useLearningLimits';

interface QuizViewProps {
  quizState: QuizState;
  _categoryList: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  selectedWordPhraseFilter?: WordPhraseFilter;
  onWordPhraseFilterChange?: (filter: WordPhraseFilter) => void;
  selectedPhraseTypeFilter?: PhraseTypeFilter;
  onPhraseTypeFilterChange?: (filter: PhraseTypeFilter) => void;
  selectedDataSource?: DataSource;
  onDataSourceChange?: (source: DataSource) => void;
  onStartQuiz: () => void;
  onAnswer: (answer: string, correct: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void | Promise<void>;
  onDifficultyRate?: (rating: number) => void;
  onReviewFocus?: () => void;
  sessionStats?: {
    correct: number;
    incorrect: number;
    review: number;
    mastered: number;
  };
  isReviewFocusMode?: boolean;
  errorPrediction?: ErrorPrediction;
}

function QuizViewTailwind({
  quizState,
  _categoryList,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedWordPhraseFilter = 'all',
  onWordPhraseFilterChange,
  selectedPhraseTypeFilter = 'all',
  onPhraseTypeFilterChange,
  selectedDataSource = 'all',
  onDataSourceChange,
  onStartQuiz,
  onAnswer,
  onNext,
  onPrevious,
  onSkip,
  onDifficultyRate,
  onReviewFocus,
  sessionStats,
  isReviewFocusMode = false,
  errorPrediction,
}: QuizViewProps) {
  const { questions, currentIndex, answered, selectedAnswer } = quizState;
  const hasQuestions = questions.length > 0;
  const currentQuestion = hasQuestions ? questions[currentIndex] : null;

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());
  
  const { learningLimit, reviewLimit, setLearningLimit, setReviewLimit } = useLearningLimits('translation');
  
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoNext');
    return saved === 'true';
  });
  
  const [autoNextDelay, setAutoNextDelay] = useState<number>(() => {
    const saved = localStorage.getItem('autoNextDelay');
    return saved ? parseInt(saved, 10) : 1500;
  });
  
  const handleAnswer = (answer: string, correct: string) => {
    onAnswer(answer, correct);
    setLastAnswerTime(Date.now());
    
    if (autoNext && answer === correct) {
      setTimeout(() => {
        onNext();
      }, autoNextDelay);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-app p-4">
      {/* 時間帯別挨拶バナー */}
      <TimeBasedGreetingBanner />

      {/* スコアボード */}
      {hasQuestions && (
        <div className="mb-6">
          <ScoreBoard
            quizState={quizState}
            sessionStats={sessionStats}
            lastAnswerTime={lastAnswerTime}
            onReviewFocus={onReviewFocus}
            isReviewFocusMode={isReviewFocusMode}
          />
        </div>
      )}

      {/* クイズ設定画面 */}
      {!hasQuestions && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              クイズ設定
            </h2>

            {/* カテゴリ選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                カテゴリ
              </label>
              <select
                className="select"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
              >
                <option value="all">すべて</option>
                {_categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 難易度選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                難易度
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['all', 'easy', 'medium', 'hard'] as DifficultyLevel[]).map(level => (
                  <button
                    key={level}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedDifficulty === level
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => onDifficultyChange(level)}
                  >
                    {level === 'all' ? 'すべて' : level}
                  </button>
                ))}
              </div>
            </div>

            {/* 学習上限設定 */}
            <div className="mb-6">
              <LearningLimitsInput
                learningLimit={learningLimit}
                reviewLimit={reviewLimit}
                onLearningLimitChange={setLearningLimit}
                onReviewLimitChange={setReviewLimit}
              />
            </div>

            {/* 自動次へ設定 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  正解時に自動で次へ
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoNext}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setAutoNext(newValue);
                      localStorage.setItem('autoNext', String(newValue));
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {autoNext && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    待機時間: {autoNextDelay}ms
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={autoNextDelay}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setAutoNextDelay(newValue);
                      localStorage.setItem('autoNextDelay', String(newValue));
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              )}
            </div>

            {/* クイズ開始ボタン */}
            <button
              className="btn btn-primary w-full text-lg"
              onClick={onStartQuiz}
            >
              クイズ開始
            </button>
          </div>
        </div>
      )}

      {/* クイズ問題画面 */}
      {hasQuestions && currentQuestion && (
        <div className="max-w-4xl mx-auto">
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            answered={answered}
            selectedAnswer={selectedAnswer}
            onAnswer={handleAnswer}
            onNext={onNext}
            onPrevious={onPrevious}
            onSkip={onSkip}
            onDifficultyRate={onDifficultyRate}
            errorPrediction={errorPrediction}
          />
        </div>
      )}
    </div>
  );
}

export default QuizViewTailwind;
