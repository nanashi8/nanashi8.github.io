import { useState } from 'react';
import { QuizState } from '../types';
import { DifficultyLevel, WordPhraseFilter, PhraseTypeFilter, OFFICIAL_CATEGORIES, DataSource } from '../App';
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
  const { questions, currentIndex, answered, selectedAnswer } =
    quizState;

  const hasQuestions = questions.length > 0;
  const currentQuestion = hasQuestions ? questions[currentIndex] : null;

  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // 回答時刻を記録（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());
  
  // 学習中・要復習の上限設定（カスタムフック使用）
  const { learningLimit, reviewLimit, setLearningLimit, setReviewLimit } = useLearningLimits('translation');
  
  // 自動次への設定
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoNext');
    return saved === 'true';
  });
  
  const [autoNextDelay, setAutoNextDelay] = useState<number>(() => {
    const saved = localStorage.getItem('autoNextDelay');
    return saved ? parseInt(saved, 10) : 1500;
  });
  
  // 回答処理をラップ（回答時刻更新用）
  const handleAnswer = (answer: string, correct: string) => {
    onAnswer(answer, correct);
    setLastAnswerTime(Date.now());
    
    // 正解した場合、自動次へが有効なら次の問題に進む
    if (autoNext && answer === correct) {
      setTimeout(() => {
        onNext();
      }, autoNextDelay);
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
            className="px-6 py-3 bg-secondary text-secondary-text rounded-lg hover:bg-secondary-hover transition-colors duration-300 font-medium shadow-md dark:bg-secondary dark:text-secondary-text dark:hover:bg-secondary-hover"
          >
            ⚙️ {showSettings ? '設定を閉じる' : '学習設定'}
          </button>
          <button 
            onClick={onStartQuiz} 
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-300 font-medium shadow-md dark:bg-primary dark:hover:bg-primary-hover"
          >
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
              {OFFICIAL_CATEGORIES.map((category) => (
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

          {onDataSourceChange && (
            <div className="filter-group">
              <label htmlFor="data-source-select">📚 問題集:</label>
              <select
                id="data-source-select"
                value={selectedDataSource}
                onChange={(e) => onDataSourceChange(e.target.value as DataSource)}
                className="select-input"
              >
                <option value="all">すべて</option>
                <option value="junior">高校受験</option>
                <option value="intermediate">高校受験標準</option>
              </select>
            </div>
          )}

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

      <LearningLimitsInput
        learningLimit={learningLimit}
        reviewLimit={reviewLimit}
        onLearningLimitChange={setLearningLimit}
        onReviewLimitChange={setReviewLimit}
        idPrefix=""
      />

      {/* 自動次へ設定 */}
      <div className="filter-group">
        <label htmlFor="auto-next-toggle-pre">✅ 正解時自動次へ:</label>
        <div className="auto-next-controls">
          <input
            type="checkbox"
            id="auto-next-toggle-pre"
            checked={autoNext}
            onChange={(e) => {
              setAutoNext(e.target.checked);
              localStorage.setItem('autoNext', e.target.checked.toString());
            }}
          />
          <label htmlFor="auto-next-toggle-pre" className="checkbox-label">
            {autoNext ? '有効' : '無効'}
          </label>
        </div>
      </div>

      {autoNext && (
        <div className="filter-group">
          <label htmlFor="auto-next-delay-pre">⏱️ 次への遅延時間:</label>
          <select
            id="auto-next-delay-pre"
            value={autoNextDelay}
            onChange={(e) => {
              const delay = parseInt(e.target.value);
              setAutoNextDelay(delay);
              localStorage.setItem('autoNextDelay', delay.toString());
            }}
            className="select-input"
          >
            <option value="500">0.5秒</option>
            <option value="1000">1秒</option>
            <option value="1500">1.5秒</option>
            <option value="2000">2秒</option>
            <option value="3000">3秒</option>
          </select>
        </div>
      )}
    </div>
  )}      {!hasQuestions ? (
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
            onShowSettings={() => setShowSettings(true)}
            currentWord={currentQuestion?.word}
            onAnswerTime={lastAnswerTime}
            dataSource={selectedDataSource === 'all' ? '全問題集' : selectedDataSource === 'junior' ? '中学重要語句' : '中級編'}
            category={selectedCategory === '全分野' ? '全分野' : selectedCategory}
            difficulty={selectedDifficulty}
            wordPhraseFilter={selectedWordPhraseFilter}
          />
          
          {/* クイズ中の学習設定パネル */}
          {showSettings && (
            <div className="study-settings-panel">
              <div className="settings-header">
                <h3>📊 学習設定</h3>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm shadow-sm dark:bg-gray-700 dark:hover:bg-gray-600"
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

              {onDataSourceChange && (
                <div className="filter-group">
                  <label htmlFor="data-source-select-quiz">📚 問題集:</label>
                  <select
                    id="data-source-select-quiz"
                    value={selectedDataSource}
                    onChange={(e) => onDataSourceChange(e.target.value as DataSource)}
                    className="select-input"
                  >
                    <option value="all">すべて</option>
                    <option value="junior">高校受験</option>
                    <option value="intermediate">高校受験標準</option>
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
                <label htmlFor="auto-next-toggle">✅ 正解時自動次へ:</label>
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
                    {autoNext ? '有効' : '無効'}
                  </label>
                </div>
              </div>
              
              {autoNext && (
                <div className="filter-group">
                  <label htmlFor="auto-next-delay">⏱️ 次への遅延時間:</label>
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
            </div>
          )}
          
          <div className="question-container">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                allQuestions={questions}
                currentIndex={currentIndex}
                answered={answered}
                selectedAnswer={selectedAnswer}
                onAnswer={handleAnswer}
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
