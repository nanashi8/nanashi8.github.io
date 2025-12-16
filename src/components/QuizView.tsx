import { useState, useEffect } from 'react';
import { QuizState, QuestionSet } from '../types';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';
import {
  DifficultyLevel,
  WordPhraseFilter,
  PhraseTypeFilter,
  OFFICIAL_CATEGORIES,
  DataSource,
} from '../App';
import { ErrorPrediction } from '@/ai/prediction/errorPredictionAI';
import ScoreBoard from './ScoreBoard';
import QuestionCard from './QuestionCard';
import LearningLimitsInput from './LearningLimitsInput';
import { useLearningLimits } from '../hooks/useLearningLimits';
import { logger } from '@/utils/logger';
import { TranslationStrategy } from '../strategies/TranslationStrategy';

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
  questionSets?: QuestionSet[];
  onStartQuiz: () => void;
  onAnswer: (answer: string, correct: string) => void | Promise<void>;
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
  customQuestionSets?: CustomQuestionSet[];
  onAddWordToCustomSet?: (setId: string, word: CustomWord) => void;
  onRemoveWordFromCustomSet?: (setId: string, word: CustomWord) => void;
  onOpenCustomSetManagement?: () => void;
}

function QuizView({
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
  questionSets = [],
  onStartQuiz: _onStartQuiz,
  onAnswer,
  onNext,
  onPrevious,
  onSkip,
  onDifficultyRate,
  onReviewFocus,
  sessionStats,
  isReviewFocusMode = false,
  errorPrediction,
  customQuestionSets = [],
  onAddWordToCustomSet,
  onRemoveWordFromCustomSet,
  onOpenCustomSetManagement,
}: QuizViewProps) {
  const { questions, currentIndex, answered, selectedAnswer } = quizState;

  const hasQuestions = questions.length > 0;
  const currentQuestion = hasQuestions ? questions[currentIndex] : null;

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 回答時刻を記録（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());

  // 回答結果を追跡（動的AIコメント用）
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | undefined>(undefined);
  const [lastAnswerWord, setLastAnswerWord] = useState<string | undefined>(undefined);
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [incorrectStreak, setIncorrectStreak] = useState<number>(0);

  // 学習中・要復習の上限設定（カスタムフック使用）
  const { learningLimit, reviewLimit, setLearningLimit, setReviewLimit } =
    useLearningLimits('translation');

  // 自動次への設定
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoNext');
    return saved === 'true';
  });

  const [autoNextDelay, setAutoNextDelay] = useState<number>(() => {
    const saved = localStorage.getItem('autoNextDelay');
    return saved ? parseInt(saved, 10) : 1500;
  });

  // 不正解時詳細自動表示の設定
  const [autoShowDetails, setAutoShowDetails] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoShowDetails');
    return saved !== 'false'; // デフォルトはtrue
  });

  // 回答処理をラップ（回答時刻更新用）
  const handleAnswer = async (answer: string, correct: string) => {
    const isCorrect = answer === correct;

    // 回答結果を記録
    setLastAnswerCorrect(isCorrect);
    setLastAnswerWord(currentQuestion?.word);
    if (isCorrect) {
      setCorrectStreak((prev) => prev + 1);
      setIncorrectStreak(0);
    } else {
      setIncorrectStreak((prev) => prev + 1);
      setCorrectStreak(0);
    }

    await onAnswer(answer, correct);
    // 回答処理完了後にタイムスタンプを更新（履歴表示用）
    setLastAnswerTime(Date.now());

    // 正解した場合、自動次へが有効なら次の問題に進む
    if (autoNext && isCorrect) {
      setTimeout(() => {
        // 次の問題に移動する前にlastAnswerWordをリセット
        setLastAnswerWord(undefined);
        onNext();
      }, autoNextDelay);
    }
  };

  // onNextをラップしてlastAnswerWordをリセット
  const handleNextWrapper = () => {
    setLastAnswerWord(undefined);
    onNext();
  };

  // スキップ処理をラップ（回答時刻更新用）
  const handleSkipWrapper = async () => {
    if (onSkip) {
      await onSkip();
      setLastAnswerTime(Date.now());
    }
  };

  // 学習プランの状態をチェック
  const learningPlan = localStorage.getItem('learning-schedule-90days');
  const hasPlan = !!learningPlan;
  let planStatus = null;
  if (hasPlan) {
    try {
      const schedule = JSON.parse(learningPlan);
      const daysPassed = Math.floor((Date.now() - schedule.startDate) / (1000 * 60 * 60 * 24));
      const currentDay = Math.min(daysPassed + 1, schedule.totalDays);
      const progressPercent = Math.round((currentDay / schedule.totalDays) * 100);
      planStatus = {
        currentDay,
        totalDays: schedule.totalDays,
        progressPercent,
        phase: schedule.phase,
      };
    } catch (e) {
      logger.error('Failed to parse learning plan:', e);
    }
  }

  // 全画面モードの切り替え
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 全画面モード時はクイズカードのみ表示
  if (isFullscreen && hasQuestions && currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center py-8">
          {/* 全画面終了ボタン */}
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700:bg-gray-600 transition"
            aria-label="全画面終了"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="w-full max-w-4xl px-4">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              allQuestions={questions}
              currentIndex={currentIndex}
              answered={answered}
              selectedAnswer={selectedAnswer}
              onAnswer={handleAnswer}
              onNext={
                onSkip ? (answered ? handleNextWrapper : handleSkipWrapper) : handleNextWrapper
              }
              onPrevious={onPrevious}
              onDifficultyRate={onDifficultyRate}
              errorPrediction={errorPrediction}
              customQuestionSets={customQuestionSets}
              onAddWordToCustomSet={onAddWordToCustomSet}
              onRemoveWordFromCustomSet={onRemoveWordFromCustomSet}
              onOpenCustomSetManagement={onOpenCustomSetManagement}
              onFullscreen={toggleFullscreen}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-view">
      {/* 学習プラン進行状況表示 */}
      {hasPlan && planStatus && (
        <div className="plan-progress-banner">
          <div className="plan-progress-content">
            <span className="plan-progress-icon">📚</span>
            <div className="plan-progress-info">
              <div className="plan-progress-title">学習プラン進行中</div>
              <div className="plan-progress-detail">
                {planStatus.currentDay}日目 / {planStatus.totalDays}日 (Phase {planStatus.phase}) -{' '}
                {planStatus.progressPercent}%完了
              </div>
            </div>
          </div>
        </div>
      )}

      {hasQuestions && (
        <>
          {/* スコアボード */}
          <div className="mb-4 flex justify-center">
            <div className="w-full max-w-4xl">
              <ScoreBoard
                mode="translation"
                currentScore={quizState.score}
                totalAnswered={quizState.totalAnswered}
                sessionCorrect={sessionStats?.correct}
                sessionIncorrect={sessionStats?.incorrect}
                sessionReview={sessionStats?.review}
                sessionMastered={sessionStats?.mastered}
                sessionStats={sessionStats}
                onReviewFocus={onReviewFocus}
                isReviewFocusMode={isReviewFocusMode}
                onShowSettings={() => setShowSettings(true)}
                currentWord={currentQuestion?.word}
                onAnswerTime={lastAnswerTime}
                lastAnswerCorrect={lastAnswerCorrect}
                lastAnswerWord={lastAnswerWord}
                lastAnswerDifficulty={currentQuestion?.difficulty}
                correctStreak={correctStreak}
                incorrectStreak={incorrectStreak}
                dataSource={
                  questionSets?.find((qs) => qs.id === selectedDataSource)?.name || '全問題集'
                }
                category={selectedCategory === '全分野' ? '全分野' : selectedCategory}
                difficulty={selectedDifficulty}
                wordPhraseFilter={selectedWordPhraseFilter}
              />
            </div>
          </div>

          {/* クイズ中の学習設定パネル */}
          {showSettings && (
            <div className="study-settings-panel">
              <div className="settings-header">
                <h3>📊 学習設定</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm shadow-sm:bg-gray-600"
                >
                  ✕ 閉じる
                </button>
              </div>

              <div className="filter-group">
                <label htmlFor="category-select-quiz">📚 関連分野:</label>
                <select
                  id="category-select-quiz"
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="select-input"
                >
                  <option value="all">全ての分野</option>
                  {OFFICIAL_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="difficulty-select-quiz">⭐ 難易度:</label>
                <select
                  id="difficulty-select-quiz"
                  value={selectedDifficulty}
                  onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
                  className="select-input"
                >
                  <option value="all">全てのレベル</option>
                  <option value="beginner">初級</option>
                  <option value="intermediate">中級</option>
                  <option value="advanced">上級</option>
                </select>
              </div>

              {onDataSourceChange && questionSets && (
                <div className="filter-group">
                  <label htmlFor="data-source-select-quiz">📚 出題元:</label>
                  <select
                    id="data-source-select-quiz"
                    value={selectedDataSource}
                    onChange={(e) => onDataSourceChange(e.target.value as DataSource)}
                    className="select-input"
                  >
                    {questionSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onWordPhraseFilterChange && (
                <div className="filter-group">
                  <label htmlFor="word-phrase-filter-quiz">📖 単語/熟語:</label>
                  <select
                    id="word-phrase-filter-quiz"
                    value={selectedWordPhraseFilter}
                    onChange={(e) => onWordPhraseFilterChange(e.target.value as WordPhraseFilter)}
                    className="select-input"
                  >
                    <option value="all">すべて</option>
                    <option value="words-only">単語のみ</option>
                    <option value="phrases-only">熟語のみ</option>
                  </select>
                </div>
              )}

              {onPhraseTypeFilterChange && selectedWordPhraseFilter === 'phrases-only' && (
                <div className="filter-group">
                  <label htmlFor="phrase-type-filter-quiz">🏷️ 熟語タイプ:</label>
                  <select
                    id="phrase-type-filter-quiz"
                    value={selectedPhraseTypeFilter}
                    onChange={(e) => onPhraseTypeFilterChange(e.target.value as PhraseTypeFilter)}
                    className="select-input"
                  >
                    <option value="all">すべて</option>
                    <option value="phrasal-verb">句動詞</option>
                    <option value="idiom">イディオム</option>
                    <option value="collocation">コロケーション</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              )}

              <LearningLimitsInput
                learningLimit={learningLimit}
                reviewLimit={reviewLimit}
                onLearningLimitChange={setLearningLimit}
                onReviewLimitChange={setReviewLimit}
                idPrefix="quiz-"
              />

              {/* 自動次へ設定 */}
              <div className="filter-group">
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="auto-next-toggle"
                    checked={autoNext}
                    onChange={(e) => {
                      setAutoNext(e.target.checked);
                      localStorage.setItem('autoNext', e.target.checked.toString());
                    }}
                  />
                  <label htmlFor="auto-next-toggle" className="checkbox-label">
                    正解時自動で次へ：{autoNext ? '有効' : '無効'}
                  </label>
                </div>
              </div>

              {autoNext && (
                <div className="filter-group">
                  <label htmlFor="auto-next-delay">⏱️ 次への遅延時間：</label>
                  <div className="slider-row">
                    <input
                      type="range"
                      id="auto-next-delay"
                      min="500"
                      max="3000"
                      step="100"
                      value={autoNextDelay}
                      onChange={(e) => {
                        const delay = parseInt(e.target.value, 10);
                        setAutoNextDelay(delay);
                        localStorage.setItem('autoNextDelay', delay.toString());
                      }}
                      className="slider-input"
                    />
                    <span className="slider-value">{(autoNextDelay / 1000).toFixed(1)}秒</span>
                  </div>
                </div>
              )}

              {/* 不正解時詳細自動表示設定 */}
              <div className="filter-group">
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="auto-show-details-toggle"
                    checked={autoShowDetails}
                    onChange={(e) => {
                      setAutoShowDetails(e.target.checked);
                      localStorage.setItem('autoShowDetails', e.target.checked.toString());
                    }}
                  />
                  <label htmlFor="auto-show-details-toggle" className="checkbox-label">
                    不正解時自動で詳細を開く：{autoShowDetails ? '有効' : '無効'}
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="question-container">
            {currentQuestion && (
              <>
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  allQuestions={questions}
                  currentIndex={currentIndex}
                  answered={answered}
                  selectedAnswer={selectedAnswer}
                  onAnswer={handleAnswer}
                  onNext={
                    onSkip ? (answered ? handleNextWrapper : handleSkipWrapper) : handleNextWrapper
                  }
                  onPrevious={onPrevious}
                  onDifficultyRate={onDifficultyRate}
                  errorPrediction={errorPrediction}
                  customQuestionSets={customQuestionSets}
                  onAddWordToCustomSet={onAddWordToCustomSet}
                  onRemoveWordFromCustomSet={onRemoveWordFromCustomSet}
                  onOpenCustomSetManagement={onOpenCustomSetManagement}
                  onFullscreen={toggleFullscreen}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default QuizView;
