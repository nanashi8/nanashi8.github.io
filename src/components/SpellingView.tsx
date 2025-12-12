import { useState, useEffect, useRef } from 'react';
import { Question, SpellingState } from '../types';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';
import { DifficultyLevel, WordPhraseFilter, PhraseTypeFilter, OFFICIAL_CATEGORIES, DataSource } from '../App';
import ScoreBoard from './ScoreBoard';
import TimeBasedGreetingBanner from './TimeBasedGreetingBanner';
import LearningLimitsInput from './LearningLimitsInput';
import AddToCustomButton from './AddToCustomButton';
import { addQuizResult, updateWordProgress, recordWordSkip, loadProgress, addSessionHistory, getStudySettings, updateStudySettings } from '../progressStorage';
import { addToSkipGroup, handleSkippedWordIncorrect, handleSkippedWordCorrect } from '../learningAssistant';
import { generateId } from '../utils';
import { speakEnglish, isSpeechSynthesisSupported } from '../speechSynthesis';
import { logger } from '@/utils/logger';
import { useLearningLimits } from '../hooks/useLearningLimits';
import { useSpellingGame } from '../hooks/useSpellingGame';
import { useSessionStats } from '../hooks/useSessionStats';

interface SpellingViewProps {
  questions: Question[];
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
  onReviewFocus?: () => void;
  isReviewFocusMode?: boolean;
  customQuestionSets?: CustomQuestionSet[];
  onAddWordToCustomSet?: (setId: string, word: CustomWord) => void;
  onRemoveWordFromCustomSet?: (setId: string, word: CustomWord) => void;
  onOpenCustomSetManagement?: () => void;
}

function SpellingView({ 
  questions, 
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
  onReviewFocus,
  isReviewFocusMode = false,
  customQuestionSets = [],
  onAddWordToCustomSet,
  onRemoveWordFromCustomSet,
  onOpenCustomSetManagement,
}: SpellingViewProps) {
  // スペリングゲームのコアロジック（カスタムフック）
  const {
    spellingState,
    setSpellingState,
    shuffledLetters,
    selectedSequence,
    setSelectedSequence,
    phraseWords,
    currentWordIndex,
    completedWords,
    handleLetterClick: handleLetterClickCore,
    checkAnswer,
    moveToNextQuestion,
    updateScore,
    resetAnswer,
  } = useSpellingGame(questions);

  // セッション統計（カスタムフック）
  const { sessionStats, resetStats, updateStats } = useSessionStats();
  
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // 回答時刻を記録（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());
  
  // 学習中・要復習の上限設定（カスタムフック使用）
  const { learningLimit, reviewLimit, setLearningLimit, setReviewLimit } = useLearningLimits('spelling');
  
  // 自動次への設定
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoNext');
    return saved === 'true';
  });
  
  const [autoNextDelay, setAutoNextDelay] = useState<number>(() => {
    const saved = localStorage.getItem('autoNextDelay');
    return saved ? parseInt(saved, 10) : 1500;
  });
  
  // letter-cardsのrefを追加
  const letterCardsRef = useRef<HTMLDivElement>(null);
  
  // 進捗追跡用
  const quizStartTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0); // 各問題の開始時刻
  const incorrectWordsRef = useRef<string[]>([]);

  // questionsが変更されたらクイズ開始時刻とセッション統計をリセット
  useEffect(() => {
    if (questions.length > 0) {
      // クイズ開始時刻を記録
      quizStartTimeRef.current = Date.now();
      incorrectWordsRef.current = [];
      
      // セッション統計をリセット
      resetStats();
    }
  }, [questions, resetStats]);

  // letter-cardsに自動フォーカス
  useEffect(() => {
    if (!spellingState.answered && letterCardsRef.current) {
      const timer = setTimeout(() => {
        letterCardsRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [spellingState.answered, spellingState.currentIndex, spellingState.questions.length]);

  // カードをタップして選択（カスタムフックのロジックを使用）
  const handleLetterClick = (_letter: string, index: number) => {
    const result = handleLetterClickCore(index);
    
    // 全てのカードが選択されたら自動で答え合わせ
    if (result && result.length === shuffledLetters.length) {
      setTimeout(() => handleCheckAnswer(result), 300);
    }
  };

  // 答え合わせ処理（カスタムフックのcheckAnswerを使用）
  const handleCheckAnswer = async (sequence: string[]) => {
    const result = checkAnswer(sequence);
    
    if (!result) return;
    
    // 部分的に正解で、まだ続きがある場合は次の単語へ
    if (result.isPartialCorrect && !result.isComplete) {
      return; // useSpellingGameが次の単語を自動セットアップ
    }
    
    // 完了した場合は進捗処理
    if (result.isComplete) {
      await processAnswer(result.userWord, result.isCorrect || false, result.responseTime);
    }
  };

  // 共通の答え合わせ処理
  const processAnswer = async (_userWord: string, isCorrect: boolean, responseTime: number) => {
    const currentQuestion = spellingState.questions[spellingState.currentIndex];

    // 単語進捗を更新
    if (currentQuestion) {
      await updateWordProgress(currentQuestion.word, isCorrect, responseTime, undefined, 'spelling');
      
      // 回答時刻を更新（ScoreBoard更新用）- updateWordProgressの完了後に更新
      setLastAnswerTime(Date.now());
      
      // AI学習アシスタント: スキップした単語の検証
      const progress = await loadProgress();
      const wordProgress = progress.wordProgress?.[currentQuestion.word];
      
      // セッション履歴に追加
      let status: 'correct' | 'incorrect' | 'review' | 'mastered' = isCorrect ? 'correct' : 'incorrect';
      
      // 定着判定
      if (wordProgress && wordProgress.masteryLevel === 'mastered') {
        status = 'mastered';
      } else if (!isCorrect && wordProgress && wordProgress.incorrectCount >= 2) {
        // 2回以上間違えた場合は要復習
        status = 'review';
      }
      
      // セッション統計を更新（カスタムフック使用）
      updateStats(status);
      
      addSessionHistory({
        status,
        word: currentQuestion.word,
        timestamp: Date.now()
      }, 'spelling');
      
      if (wordProgress && wordProgress.skippedCount && wordProgress.skippedCount > 0) {
        if (isCorrect) {
          handleSkippedWordCorrect(currentQuestion.word);
        } else {
          handleSkippedWordIncorrect(currentQuestion.word);
        }
      }
    }

    // 間違えた単語を記録
    if (!isCorrect && currentQuestion) {
      incorrectWordsRef.current.push(currentQuestion.word);
    }

    // スコア更新（カスタムフック使用）
    updateScore(isCorrect);

    // 回答ごとに小さなQuizResultを記録（統計用）
    if (currentQuestion) {
      addQuizResult({
        id: generateId(),
        questionSetId: 'spelling-quiz-single',
        questionSetName: 'スペルクイズ',
        score: isCorrect ? 1 : 0,
        total: 1,
        percentage: isCorrect ? 100 : 0,
        date: Date.now(),
        timeSpent: Math.floor(responseTime / 1000),
        incorrectWords: isCorrect ? [] : [currentQuestion.word],
        mode: 'spelling',
      });
    }
  };

  const handleNext = () => {
    // 次の問題へ移動（カスタムフック使用）
    moveToNextQuestion();
  };

  const handleSkip = async () => {
    const currentQuestion = spellingState.questions[spellingState.currentIndex];
    if (!currentQuestion) return;

    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;

    // スキップ処理（30日間除外、AI学習アシスタントが後日検証）
    recordWordSkip(currentQuestion.word, 30);
    
    // AI学習アシスタント: スキップグループに追加
    addToSkipGroup(currentQuestion.word);
    
    // 単語進捗を更新（正解として記録）
    await updateWordProgress(currentQuestion.word, true, responseTime, undefined, 'spelling');
    
    // 回答時刻を更新（ScoreBoard更新用）- updateWordProgressの完了後に更新
    setLastAnswerTime(Date.now());
    
    // スコアに反映（正解扱い）
    // 選択シーケンスをクリアして、正解を表示できるようにする
    setSelectedSequence([]);
    setSpellingState((prev) => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      score: prev.score + 1, // スキップは正解扱い
      answered: true,
    }));

    // セッション統計を更新（正解扱い）
    updateStats('correct');
    
    // セッション履歴に記録（正解として）
    addSessionHistory({
      status: 'correct',
      word: currentQuestion.word,
      timestamp: Date.now()
    }, 'spelling');

    // スコアボードのために回答を記録（正解として）
    addQuizResult({
      id: generateId(),
      questionSetId: 'spelling-quiz-single',
      questionSetName: 'スペルクイズ',
      score: 1, // スキップは正解扱い
      total: 1,
      percentage: 100,
      date: Date.now(),
      timeSpent: Math.floor(responseTime / 1000),
      incorrectWords: [], // スキップは正解扱いなので空配列
      mode: 'spelling',
      difficulty: currentQuestion.difficulty,
    });
  };

  const handlePrevious = () => {
    setSelectedSequence([]); // 選択シーケンスをクリア
    setSpellingState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : 0,
      answered: false, // 回答状態をリセット
    }));
    // 問題の開始時刻を記録
    questionStartTimeRef.current = Date.now();
  };

  // 選択中の最後の1文字を削除
  const handleBackspace = () => {
    if (selectedSequence.length > 0) {
      const newSequence = selectedSequence.slice(0, -1);
      setSelectedSequence(newSequence);
    }
  };

  const hasQuestions = spellingState.questions.length > 0;
  const currentQuestion = hasQuestions ? spellingState.questions[spellingState.currentIndex] : null;
  
  // ユーザーが選択した単語
  const userWord = selectedSequence.map((idx) => shuffledLetters[parseInt(idx)]).join('');

  // カスタムセット用のCustomWordオブジェクトを生成
  const customWord: CustomWord | null = currentQuestion ? {
    word: currentQuestion.word,
    meaning: currentQuestion.meaning,
    katakana: currentQuestion.reading,
    source: 'spelling' as const,
  } : null;

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

  return (
    <div className="spelling-view">
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
            onClick={onStartQuiz} 
            className="w-64 px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-xl dark:bg-primary dark:hover:bg-primary-hover"
          >
            🎯 クイズ開始
          </button>
        </div>
      )}

      {!hasQuestions ? (
        <div className="empty-state">
          <p>📖 条件を選択して「クイズ開始」ボタンを押してください</p>
        </div>
      ) : (
        <>
          <ScoreBoard
            mode="spelling"
            currentScore={spellingState.score}
            totalAnswered={spellingState.totalAnswered}
            sessionCorrect={sessionStats.correct}
            sessionIncorrect={sessionStats.incorrect}
            sessionReview={sessionStats.review}
            sessionMastered={sessionStats.mastered}
            onReviewFocus={onReviewFocus}
            isReviewFocusMode={isReviewFocusMode}
            onShowSettings={() => setShowSettings(true)}
            currentWord={spellingState.questions[spellingState.currentIndex]?.word}
            onAnswerTime={lastAnswerTime}
            dataSource={selectedDataSource === 'all' ? '全問題集' : selectedDataSource === 'junior' ? '高校受験' : '高校受験標準'}
            category={selectedCategory === '全分野' ? '全分野' : selectedCategory}
            difficulty={selectedDifficulty}
            wordPhraseFilter={selectedWordPhraseFilter}
          />

          {/* スペルクイズ中の学習設定パネル */}
          {showSettings && (
            <div className="study-settings-panel">
              <div className="settings-header">
                <h3>📊 学習設定</h3>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 text-sm shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:border-gray-500"
                >
                  ✕ 閉じる
                </button>
              </div>
              
              <div className="filter-group">
                <label htmlFor="category-select-spelling">📚 関連分野:</label>
                <select
                  id="category-select-spelling"
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
                <label htmlFor="difficulty-select-spelling">⭐ 難易度:</label>
                <select
                  id="difficulty-select-spelling"
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
                  <label htmlFor="data-source-select-spelling">📚 問題集:</label>
                  <select
                    id="data-source-select-spelling"
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
                  <label htmlFor="word-phrase-filter-spelling">📖 単語/熟語:</label>
                  <select
                    id="word-phrase-filter-spelling"
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
                  <label htmlFor="phrase-type-filter-spelling">🏷️ 熟語タイプ:</label>
                  <select
                    id="phrase-type-filter-spelling"
                    value={selectedPhraseTypeFilter}
                    onChange={(e) => {
                      if (onPhraseTypeFilterChange) {
                        onPhraseTypeFilterChange(e.target.value as PhraseTypeFilter);
                      }
                    }}
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
                idPrefix="spelling-quiz-"
              />
            </div>
          )}

          {currentQuestion && (
            <div className="question-card">
              {/* 意味表示とナビゲーションボタンの行 */}
              <div className="question-nav-row meaning-row">
                <button 
                  className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition flex items-center justify-center text-2xl disabled:opacity-30 disabled:cursor-not-allowed" 
                  onClick={handlePrevious}
                  disabled={spellingState.currentIndex === 0}
                  title="前へ"
                >
                  ←
                </button>
                <div className="meaning-display">
                  <div className="meaning-line">
                    <span className="text-xl text-gray-600 dark:text-gray-300">意味:</span>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white ml-2">{currentQuestion.meaning}</span>
                  </div>
                  
                  {/* カスタムセットに追加ボタン */}
                  {customWord && 
                   onAddWordToCustomSet && 
                   onRemoveWordFromCustomSet && 
                   onOpenCustomSetManagement && 
                   customQuestionSets && (
                    <div className="mt-3 flex justify-center">
                      <AddToCustomButton
                        word={customWord}
                        sets={customQuestionSets}
                        onAddWord={onAddWordToCustomSet}
                        onRemoveWord={onRemoveWordFromCustomSet}
                        onOpenManagement={onOpenCustomSetManagement}
                        size="medium"
                        variant="both"
                      />
                    </div>
                  )}
                  
                  <div className="meaning-meta">
                    {currentQuestion.difficulty && (
                      <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                        {currentQuestion.difficulty === 'beginner' ? '初級' : 
                         currentQuestion.difficulty === 'intermediate' ? '中級' : '上級'}
                      </div>
                    )}
                    {currentQuestion.word.includes(' ') && (
                      <div className="phrase-hint">
                        💡 熟語({phraseWords.length}語): 単語ごとに入力してください
                        {completedWords.length > 0 && (
                          <span className="phrase-progress">
                            {' '}(完成: {completedWords.join(' ')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition flex items-center justify-center text-2xl disabled:opacity-30 disabled:cursor-not-allowed" 
                  onClick={handleNext}
                  disabled={spellingState.currentIndex >= spellingState.questions.length - 1}
                  title="次へ"
                >
                  →
                </button>
              </div>

              {/* ユーザーの答え表示と入力モード説明 */}
              <div className="question-content-inline">
                <div className="user-word-display">
                  <div className="user-word-label">あなたの答え:</div>
                  <div className="user-word-text">
                    {phraseWords.length > 0 ? (
                      <>
                        {completedWords.join(' ')}
                        {completedWords.length > 0 && ' '}
                        {userWord || '（並び替え）'}
                      </>
                    ) : (
                      userWord || '（並び替え）'
                    )}
                  </div>
                </div>
              </div>

              {/* シャッフルされたアルファベットカード（常に表示） */}
              <div 
                className="letter-cards"
                ref={letterCardsRef}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (!spellingState.answered) {
                    // キーボード入力でカードを選択
                    const key = e.key.toLowerCase();
                    if (key.length === 1 && key >= 'a' && key <= 'z') {
                      e.preventDefault();
                      // 該当する未選択のカードを探す
                      const availableIndex = shuffledLetters.findIndex((letter, idx) => 
                        letter === key && !selectedSequence.includes(`${idx}`)
                      );
                      if (availableIndex !== -1) {
                        handleLetterClick(key, availableIndex);
                      }
                    } else if (e.key === 'Backspace') {
                      e.preventDefault();
                      handleBackspace();
                    } else if (e.key === ' ') {
                      // スペースキー: 分からない（スキップ）
                      e.preventDefault();
                        // スキップのみ実行、次へは自動遷移しない
                        handleSkip();
                    } else if (e.key === 'Enter') {
                      // Enterキー: スキップ（正解扱い・定着済）
                      e.preventDefault();
                      handleSkip();
                    }
                  } else if (e.key === 'Enter') {
                    // 回答後のEnterで次へ進む
                    e.preventDefault();
                    handleNext();
                  }
                }}
              >
                {shuffledLetters.map((letter, index) => {
                  const isSelected = selectedSequence.includes(`${index}`);
                  const selectionOrder = selectedSequence.indexOf(`${index}`) + 1;
                  
                  // 回答後の正解・不正解クラスを追加
                  let answerClass = '';
                  if (spellingState.answered && isSelected) {
                    const userWord = selectedSequence.map(i => shuffledLetters[parseInt(i)]).join('');
                    const isCorrect = userWord === spellingState.correctWord;
                    answerClass = isCorrect ? 'correct' : 'incorrect';
                  }

                  return (
                    <button
                      key={index}
                      className={`letter-card ${isSelected ? 'selected' : ''} ${
                        spellingState.answered ? 'practice-mode' : ''
                      } ${answerClass}`}
                      onClick={() => handleLetterClick(letter, index)}
                    >
                      {letter}
                      {isSelected && <span className="selection-number">{selectionOrder}</span>}
                    </button>
                  );
                })}
              </div>

              {/* 1文字戻すボタンとスキップボタン */}
              {!spellingState.answered && (
                <div className="spelling-reset-button-container">
                  {selectedSequence.length > 0 && (
                    <button className="btn-reset-selection" onClick={handleBackspace}>
                      ⌫ 1文字戻す
                    </button>
                  )}
                  <button className="btn-skip-word" onClick={handleSkip}>
                      ⏭️ 分からない (スペースキー)
                  </button>
                </div>
              )}

              {spellingState.answered && (
                <div className="result-display">
                  <div className="correct-answer">
                    {userWord === spellingState.correctWord 
                      ? '✅ 正解: ' 
                      : userWord === '' 
                        ? '⏭️ スキップ - 正解: '
                        : '❌ 不正解 - 正解: '
                    }
                    <strong 
                      className={isSpeechSynthesisSupported() ? 'clickable-word' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSpeechSynthesisSupported() && currentQuestion) {
                          speakEnglish(currentQuestion.word, { rate: 0.85 });
                        }
                      }}
                      title={isSpeechSynthesisSupported() ? 'タップして発音を聞く 🔊' : undefined}
                    >
                      {currentQuestion?.word || spellingState.correctWord}
                      {isSpeechSynthesisSupported() && (
                        <span className="speaker-icon">🔊</span>
                      )}
                      {currentQuestion?.reading && (
                        <span className="pronunciation-hint">
                          ({currentQuestion.reading})
                        </span>
                      )}
                    </strong>
                  </div>
                  
                  {/* 詳細情報の表示（常に表示） */}
                  <div className="question-details-spelling">
                    {currentQuestion.reading && (
                      <div className="detail-row clickable-row" onClick={() => isSpeechSynthesisSupported() && speakEnglish(currentQuestion.word, { rate: 0.85 })} title="タップして発音 🔊">
                        <span className="detail-label">読み:</span>
                        <span className="detail-content">{currentQuestion.reading}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">意味:</span>
                      <span className="detail-content">{currentQuestion.meaning}</span>
                    </div>
                    {currentQuestion.etymology && (
                      <div className="detail-row">
                        <span className="detail-label">📚 語源等解説:</span>
                        <span className="detail-content">{currentQuestion.etymology}</span>
                      </div>
                    )}
                    {currentQuestion.relatedWords && (
                      <div className="detail-row">
                        <span className="detail-label">🔗 関連語:</span>
                        <span className="detail-content">{currentQuestion.relatedWords}</span>
                      </div>
                    )}
                    {currentQuestion.relatedFields && (
                      <div className="detail-row">
                        <span className="detail-label">🏷️ 関連分野:</span>
                        <span className="detail-content">{currentQuestion.relatedFields}</span>
                      </div>
                    )}
                    {currentQuestion.difficulty && (
                      <div className="detail-row clickable-row" onClick={() => isSpeechSynthesisSupported() && speakEnglish(currentQuestion.word, { rate: 0.85 })} title="タップして発音 🔊">
                        <span className="detail-label">難易度:</span>
                        <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                          {currentQuestion.difficulty === 'beginner' ? '初級' : 
                           currentQuestion.difficulty === 'intermediate' ? '中級' : '上級'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SpellingView;
