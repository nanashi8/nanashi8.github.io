import { useState, useEffect, useRef } from 'react';
import { Question, SpellingState } from '../types';
import { DifficultyLevel, WordPhraseFilter, PhraseTypeFilter } from '../App';
import ScoreBoard from './ScoreBoard';
import TimeBasedGreetingBanner from './TimeBasedGreetingBanner';
import { addQuizResult, updateWordProgress, recordWordSkip, loadProgress, addSessionHistory, getStudySettings, updateStudySettings } from '../progressStorage';
import { addToSkipGroup, handleSkippedWordIncorrect, handleSkippedWordCorrect } from '../learningAssistant';
import { generateId } from '../utils';

interface SpellingViewProps {
  questions: Question[];
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
  onReviewFocus?: () => void;
  isReviewFocusMode?: boolean;
}

function SpellingView({ 
  questions, 
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
  onReviewFocus,
  isReviewFocusMode = false
}: SpellingViewProps) {
  const [spellingState, setSpellingState] = useState<SpellingState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    totalAnswered: 0,
    answered: false,
    selectedLetters: [],
    correctWord: '',
  });

  // シャッフルされたアルファベットカード
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  // ユーザーが選択した順番のアルファベット
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  // 熟語の場合の各単語（スペース区切り）
  const [phraseWords, setPhraseWords] = useState<string[]>([]);
  // 現在入力中の単語インデックス
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  // 各単語の入力結果
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  
  // セッション統計
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    review: 0,
    mastered: 0,
  });
  
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
  
  // letter-cardsのrefを追加
  const letterCardsRef = useRef<HTMLDivElement>(null);
  
  // 進捗追跡用
  const quizStartTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0); // 各問題の開始時刻
  const incorrectWordsRef = useRef<string[]>([]);

  // questionsが変更されたらスペルステートを初期化
  useEffect(() => {
    if (questions.length > 0) {
      setSpellingState({
        questions,
        currentIndex: 0,
        score: 0,
        totalAnswered: 0,
        answered: false,
        selectedLetters: [],
        correctWord: '',
      });
      
      // セッション統計をリセット
      setSessionStats({
        correct: 0,
        incorrect: 0,
        review: 0,
        mastered: 0,
      });
      
      // クイズ開始時刻を記録
      quizStartTimeRef.current = Date.now();
      incorrectWordsRef.current = [];
    }
  }, [questions]);

  // 現在の問題が変更されたらアルファベットをシャッフル
  useEffect(() => {
    if (spellingState.questions.length > 0) {
      const currentQuestion = spellingState.questions[spellingState.currentIndex];
      const word = currentQuestion.word.toLowerCase();
      
      // 熟語かどうかを判定（スペースが含まれているか）
      if (word.includes(' ')) {
        // 熟語の場合：単語ごとに分割
        const words = word.split(/\s+/);
        setPhraseWords(words);
        setCurrentWordIndex(0);
        setCompletedWords([]);
        
        // 最初の単語をシャッフル
        const firstWordLetters = words[0].split('');
        const shuffled = [...firstWordLetters].sort(() => Math.random() - 0.5);
        setShuffledLetters(shuffled);
        
        setSpellingState((prev) => ({
          ...prev,
          correctWord: word.replace(/\s+/g, ''),
          answered: false,
        }));
      } else {
        // 単語の場合：従来通り
        setPhraseWords([]);
        setCurrentWordIndex(0);
        setCompletedWords([]);
        
        const letters = word.split('');
        const shuffled = [...letters].sort(() => Math.random() - 0.5);
        setShuffledLetters(shuffled);
        
        setSpellingState((prev) => ({
          ...prev,
          correctWord: word,
          answered: false,
        }));
      }
      
      setSelectedSequence([]);
      
      // 問題開始時刻を記録
      questionStartTimeRef.current = Date.now();
    }
  }, [spellingState.currentIndex, spellingState.questions]);

  // letter-cardsに自動フォーカス（問題変更時とマウント時）
  useEffect(() => {
    if (!spellingState.answered && letterCardsRef.current) {
      // タイマーで確実にフォーカス
      const timer = setTimeout(() => {
        letterCardsRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [spellingState.answered, spellingState.currentIndex, spellingState.questions.length]);

  // カードをタップして選択
  const handleLetterClick = (_letter: string, index: number) => {
    // 回答後は練習モード（選択のみ、答え合わせはしない）
    if (spellingState.answered) {
      // 選択/選択解除のトグル
      if (selectedSequence.includes(`${index}`)) {
        setSelectedSequence(selectedSequence.filter(idx => idx !== `${index}`));
      } else {
        const newSequence = [...selectedSequence, `${index}`];
        setSelectedSequence(newSequence);
      }
      return;
    }
    
    // まだ選択されていないカードのみ選択可能
    if (selectedSequence.includes(`${index}`)) return;

    const newSequence = [...selectedSequence, `${index}`];
    setSelectedSequence(newSequence);

    // 全てのカードが選択されたら自動で答え合わせ
    if (newSequence.length === shuffledLetters.length) {
      setTimeout(() => checkAnswer(newSequence), 300);
    }
  };

  const checkAnswer = (sequence: string[]) => {
    const userWord = sequence.map((idx) => shuffledLetters[parseInt(idx)]).join('');
    const currentQuestion = spellingState.questions[spellingState.currentIndex];
    
    // 熟語の場合：現在の単語が正しいか確認
    if (phraseWords.length > 0) {
      const currentTargetWord = phraseWords[currentWordIndex];
      const isCorrect = userWord === currentTargetWord;
      
      if (isCorrect) {
        // 正解：次の単語へ
        const newCompletedWords = [...completedWords, userWord];
        setCompletedWords(newCompletedWords);
        
        if (currentWordIndex < phraseWords.length - 1) {
          // まだ次の単語がある：次の単語をシャッフル
          const nextWordIndex = currentWordIndex + 1;
          setCurrentWordIndex(nextWordIndex);
          
          const nextWordLetters = phraseWords[nextWordIndex].split('');
          const shuffled = [...nextWordLetters].sort(() => Math.random() - 0.5);
          setShuffledLetters(shuffled);
          setSelectedSequence([]);
        } else {
          // 全ての単語が完成：最終判定
          const fullUserWord = newCompletedWords.join('');
          const isFullCorrect = fullUserWord === spellingState.correctWord;
          processAnswer(fullUserWord, isFullCorrect, currentQuestion);
        }
      } else {
        // 不正解：現在の単語が間違っている
        const fullUserWord = [...completedWords, userWord].join('');
        processAnswer(fullUserWord, false, currentQuestion);
      }
    } else {
      // 単語の場合：従来通り
      const isCorrect = userWord === spellingState.correctWord;
      processAnswer(userWord, isCorrect, currentQuestion);
    }
  };

  // 共通の答え合わせ処理
  const processAnswer = (_userWord: string, isCorrect: boolean, currentQuestion: Question | null) => {
    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;

    // 単語進捗を更新
    if (currentQuestion) {
      updateWordProgress(currentQuestion.word, isCorrect, responseTime, undefined, 'spelling');
      
      // AI学習アシスタント: スキップした単語の検証
      const progress = loadProgress();
      const wordProgress = progress.wordProgress[currentQuestion.word];
      
      // セッション履歴に追加
      let status: 'correct' | 'incorrect' | 'review' | 'mastered' = isCorrect ? 'correct' : 'incorrect';
      
      // 定着判定
      if (wordProgress && wordProgress.masteryLevel === 'mastered') {
        status = 'mastered';
      } else if (!isCorrect && wordProgress && wordProgress.incorrectCount >= 2) {
        // 2回以上間違えた場合は要復習
        status = 'review';
      }
      
      // セッション統計を更新
      setSessionStats(prev => ({
        ...prev,
        correct: prev.correct + (status === 'correct' ? 1 : 0),
        incorrect: prev.incorrect + (status === 'incorrect' ? 1 : 0),
        review: prev.review + (status === 'review' ? 1 : 0),
        mastered: prev.mastered + (status === 'mastered' ? 1 : 0),
      }));
      
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

    setSpellingState((prev) => {
      const newState = {
        ...prev,
        answered: true,
        score: isCorrect ? prev.score + 1 : prev.score,
        totalAnswered: prev.totalAnswered + 1,
      };
      
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
      
      // 全問題に回答したら完了メッセージを表示（次の問題がない場合のみ）
      if (newState.totalAnswered === prev.questions.length && newState.currentIndex >= prev.questions.length - 1) {
        const percentage = (newState.score / newState.totalAnswered) * 100;
        
        // 完了メッセージ
        setTimeout(() => {
          alert(`スペルクイズ完了！\n正解: ${newState.score}/${newState.totalAnswered} (${percentage.toFixed(1)}%)\n成績タブで詳細を確認できます。`);
        }, 500);
      }
      
      return newState;
    });
  };

  const handleNext = () => {
    setSelectedSequence([]); // 選択シーケンスをクリア
    setCurrentWordIndex(0); // 熟語のインデックスをリセット
    setCompletedWords([]); // 完成した単語をクリア
    setSpellingState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1 < prev.questions.length ? prev.currentIndex + 1 : prev.currentIndex,
      answered: false, // 回答状態をリセット
    }));
    // 次の問題の開始時刻を記録
    questionStartTimeRef.current = Date.now();
  };

  const handleSkip = () => {
    const currentQuestion = spellingState.questions[spellingState.currentIndex];
    if (!currentQuestion) return;

    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;

    // スキップ処理（30日間除外、AI学習アシスタントが後日検証）
    recordWordSkip(currentQuestion.word, 30);
    
    // AI学習アシスタント: スキップグループに追加
    addToSkipGroup(currentQuestion.word);
    
    // 単語進捗を更新（正解として記録）
    updateWordProgress(currentQuestion.word, true, responseTime, undefined, 'spelling');
    
    // スコアに反映（正解扱い）
    // 選択シーケンスをクリアして、正解を表示できるようにする
    setSelectedSequence([]);
    setCurrentWordIndex(0); // 熟語のインデックスをリセット
    setCompletedWords([]); // 完成した単語をクリア
    setSpellingState((prev) => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      score: prev.score + 1, // スキップは正解扱い
      answered: true,
    }));

    // セッション統計を更新（正解扱い）
    setSessionStats((prev) => ({
      ...prev,
      correct: prev.correct + 1,
      mastered: prev.mastered + 1, // スキップは定着扱い
    }));
    
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
    setCurrentWordIndex(0); // 熟語のインデックスをリセット
    setCompletedWords([]); // 完成した単語をクリア
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

  const currentQuestion =
    spellingState.questions.length > 0
      ? spellingState.questions[spellingState.currentIndex]
      : null;

  const hasQuestions = spellingState.questions.length > 0;
  
  // ユーザーが選択した単語
  const userWord = selectedSequence.map((idx) => shuffledLetters[parseInt(idx)]).join('');

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
            <label htmlFor="category-select-spelling">📚 関連分野:</label>
            <select
              id="category-select-spelling"
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
            <label htmlFor="max-study-count-spelling">📊 学習数上限:</label>
            <input
              id="max-study-count-spelling"
              type="number"
              min="1"
              value={maxStudyCount}
              onChange={(e) => handleMaxStudyCountChange(parseInt(e.target.value, 10))}
              className="select-input number-input-small"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="max-review-count-spelling">🔄 要復習上限:</label>
            <input
              id="max-review-count-spelling"
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
            mode="spelling"
            currentScore={spellingState.score}
            totalAnswered={spellingState.totalAnswered}
            sessionCorrect={sessionStats.correct}
            sessionIncorrect={sessionStats.incorrect}
            sessionReview={sessionStats.review}
            sessionMastered={sessionStats.mastered}
            onReviewFocus={onReviewFocus}
            isReviewFocusMode={isReviewFocusMode}
          />

          {currentQuestion && (
            <div className="question-card">
              {/* 意味表示とナビゲーションボタンの行 */}
              <div className="question-nav-row meaning-row">
                <button 
                  className="inline-nav-btn prev-inline-btn" 
                  onClick={handlePrevious}
                  disabled={spellingState.currentIndex === 0}
                  title="前へ"
                >
                  ←
                </button>
                <div className="meaning-display">
                  <div className="meaning-label">意味:</div>
                  <div className="meaning-text">{currentQuestion.meaning}</div>
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
                <button 
                  className="inline-nav-btn next-inline-btn" 
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
                    <strong>{currentQuestion?.word || spellingState.correctWord}</strong>
                  </div>
                  
                  {/* 詳細情報の表示（常に表示） */}
                  <div className="question-details-spelling">
                    {currentQuestion.reading && (
                      <div className="detail-row">
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
                      <div className="detail-row">
                        <span className="detail-label">難易度:</span>
                        <span className="detail-content">{currentQuestion.difficulty}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 次へ進むボタン */}
                  <div className="spelling-next-button-container">
                    <button 
                      className="btn-next-question"
                      onClick={handleNext}
                      disabled={spellingState.currentIndex >= spellingState.questions.length - 1}
                    >
                      {spellingState.currentIndex >= spellingState.questions.length - 1 ? '最後の問題です' : '次の問題へ →'}
                    </button>
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
