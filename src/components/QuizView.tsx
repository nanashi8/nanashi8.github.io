import { useState } from 'react';
import { QuizState } from '../types';
import { DifficultyLevel, WordPhraseFilter, PhraseTypeFilter } from '../App';
import { ErrorPrediction } from '../errorPredictionAI';
import ScoreBoard from './ScoreBoard';
import QuestionCard from './QuestionCard';
import DailyPlanBanner from './DailyPlanBanner';
import TimeBasedGreetingBanner from './TimeBasedGreetingBanner';
import { getStudySettings, updateStudySettings } from '../progressStorage';

interface QuizViewProps {
  quizState: QuizState;
  categoryList: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  selectedWordPhraseFilter?: WordPhraseFilter;
  onWordPhraseFilterChange?: (filter: WordPhraseFilter) => void;
  selectedPhraseTypeFilter?: PhraseTypeFilter;
  onPhraseTypeFilterChange?: (filter: PhraseTypeFilter) => void;
  onStartQuiz: () => void;
  onAnswer: (answer: string, correct: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
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
  onShowSettings?: () => void;
}

function QuizView({
  quizState,
  categoryList,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedWordPhraseFilter = 'all',
  onWordPhraseFilterChange,
  selectedPhraseTypeFilter = 'all',
  onPhraseTypeFilterChange,
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
  onShowSettings,
}: QuizViewProps) {
  const { questions, currentIndex, answered, selectedAnswer } =
    quizState;

  const hasQuestions = questions.length > 0;
  const currentQuestion = hasQuestions ? questions[currentIndex] : null;

  // 学習数・要復習上限の設定
  const [maxStudyCount, setMaxStudyCount] = useState<number>(() => getStudySettings().maxStudyCount);
  const [maxReviewCount, setMaxReviewCount] = useState<number>(() => getStudySettings().maxReviewCount);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handleMaxStudyCountChange = (newCount: number) => {
    setMaxStudyCount(newCount);
    updateStudySettings({ maxStudyCount: newCount });
  };

  const handleMaxReviewCountChange = (newCount: number) => {
    setMaxReviewCount(newCount);
    updateStudySettings({ maxReviewCount: newCount });
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
      console.error('Failed to parse learning plan:', e);
    }
  }

  return (
    <div className="quiz-view">
      {/* 時間帯別AI挨拶 */}
      <TimeBasedGreetingBanner />
      
      {/* 学習プラン進行状況表示 */}
      {hasPlan && planStatus && (
        <div className="plan-progress-banner">
          <div className="plan-progress-content">
            <span className="plan-progress-icon">📚</span>
            <div className="plan-progress-info">
              <div className="plan-progress-title">学習プラン進行中</div>
              <div className="plan-progress-detail">
                {planStatus.currentDay}日目 / {planStatus.totalDays}日 (Phase {planStatus.phase}) - {planStatus.progressPercent}%完了
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!hasQuestions && (
        <div className="quiz-controls">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="settings-toggle-btn"
          >
            ⚙️ {showSettings ? '設定を閉じる' : '学習設定'}
          </button>
          <button onClick={onStartQuiz} className="start-btn">
            🎯 クイズ開始
          </button>
        </div>
      )}

      {/* 学習設定パネル */}
      {!hasQuestions && showSettings && (
        <div className="study-settings-panel">
          <h3>📊 学習設定</h3>
          
          <div className="filter-group">
            <label htmlFor="category-select">📚 関連分野:</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="select-input"
            >
              <option value="all">全ての分野</option>
              {categoryList.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="difficulty-select">⭐ 難易度:</label>
            <select
              id="difficulty-select"
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

          {onWordPhraseFilterChange && (
            <div className="filter-group">
              <label htmlFor="word-phrase-filter">📖 単語/熟語:</label>
              <select
                id="word-phrase-filter"
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
              <label htmlFor="phrase-type-filter">🏷️ 熟語タイプ:</label>
              <select
                id="phrase-type-filter"
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

          <div className="filter-group">
            <label htmlFor="max-study-count">📊 学習数上限:</label>
            <input
              id="max-study-count"
              type="number"
              min="1"
              value={maxStudyCount}
              onChange={(e) => handleMaxStudyCountChange(parseInt(e.target.value, 10))}
              className="select-input number-input-small"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="max-review-count">🔄 要復習上限:</label>
            <input
              id="max-review-count"
              type="number"
              min="0"
              value={maxReviewCount}
              onChange={(e) => handleMaxReviewCountChange(parseInt(e.target.value, 10))}
              className="select-input number-input-small"
            />
          </div>
        </div>
      )}

      {!hasQuestions ? (
        <div className="empty-state">
          <p>📖 条件を選択して「クイズ開始」ボタンを押してください</p>
        </div>
      ) : (
        <>
          <ScoreBoard
            mode="translation"
            currentScore={quizState.score}
            totalAnswered={quizState.totalAnswered}
            sessionCorrect={sessionStats?.correct}
            sessionIncorrect={sessionStats?.incorrect}
            sessionReview={sessionStats?.review}
            sessionMastered={sessionStats?.mastered}
            onReviewFocus={onReviewFocus}
            isReviewFocusMode={isReviewFocusMode}
            onShowSettings={onShowSettings}
          />
          <div className="question-container">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                allQuestions={questions}
                currentIndex={currentIndex}
                answered={answered}
                selectedAnswer={selectedAnswer}
                onAnswer={onAnswer}
                onNext={onSkip ? (answered ? onNext : onSkip) : onNext}
                onPrevious={onPrevious}
                onDifficultyRate={onDifficultyRate}
                errorPrediction={errorPrediction}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default QuizView;
