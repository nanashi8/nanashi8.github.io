import { useState, useEffect, useRef } from 'react';
import { Question, SpellingState } from '../types';
import { DifficultyLevel, WordPhraseFilter, PhraseTypeFilter } from '../App';
import ScoreBoard from './ScoreBoard';
import { addQuizResult, updateWordProgress } from '../progressStorage';
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
  onStartQuiz
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
  // 詳細表示の開閉状態
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // タイピング入力用の状態
  const [typingInput, setTypingInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<'click' | 'typing'>('click');
  
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
      const letters = word.split('');
      
      // シャッフル
      const shuffled = [...letters].sort(() => Math.random() - 0.5);
      
      setShuffledLetters(shuffled);
      setSelectedSequence([]);
      setShowDetails(false);
      setSpellingState((prev) => ({
        ...prev,
        correctWord: word,
        answered: false,
      }));
      
      // 問題開始時刻を記録
      questionStartTimeRef.current = Date.now();
    }
  }, [spellingState.currentIndex, spellingState.questions]);

  // カードをタップして選択
  const handleLetterClick = (_letter: string, index: number) => {
    if (spellingState.answered) return;
    
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
    const isCorrect = userWord === spellingState.correctWord;
    const currentQuestion = spellingState.questions[spellingState.currentIndex];

    processAnswer(userWord, isCorrect, currentQuestion);
  };

  // タイピング入力用の答え合わせ
  const checkTypingAnswer = (input: string) => {
    const isCorrect = input === spellingState.correctWord;
    const currentQuestion = spellingState.questions[spellingState.currentIndex];

    processAnswer(input, isCorrect, currentQuestion);
  };

  // 共通の答え合わせ処理
  const processAnswer = (userWord: string, isCorrect: boolean, currentQuestion: Question | null) => {
    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;

    // 単語進捗を更新
    if (currentQuestion) {
      updateWordProgress(currentQuestion.word, isCorrect, responseTime);
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
      
      // 全問題に回答したら完了メッセージを表示
      if (newState.totalAnswered === prev.questions.length) {
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
    setShowDetails(false);
    setSelectedSequence([]); // 選択シーケンスをクリア
    setSpellingState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1 < prev.questions.length ? prev.currentIndex + 1 : prev.currentIndex,
      answered: false, // 回答状態をリセット
    }));
    // 次の問題の開始時刻を記録
    questionStartTimeRef.current = Date.now();
  };

  const handlePrevious = () => {
    setShowDetails(false);
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
      setSelectedSequence(prev => prev.slice(0, -1));
    }
  };

  const currentQuestion =
    spellingState.questions.length > 0
      ? spellingState.questions[spellingState.currentIndex]
      : null;

  const hasQuestions = spellingState.questions.length > 0;
  
  // ユーザーが選択した単語（クリックモード）またはタイピング入力
  const userWord = inputMode === 'typing' 
    ? typingInput 
    : selectedSequence.map((idx) => shuffledLetters[parseInt(idx)]).join('');

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
      
      <div className="quiz-filter-section">
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

        {!hasQuestions && (
          <button onClick={onStartQuiz} className="start-btn">
            🎯 クイズを開始
          </button>
        )}
      </div>

      {!hasQuestions ? (
        <div className="empty-state">
          <p>📖 条件を選択して「クイズを開始」ボタンを押してください</p>
        </div>
      ) : (
        <>
          <ScoreBoard
            mode="spelling"
            currentScore={spellingState.score}
            totalAnswered={spellingState.totalAnswered}
          />

          {currentQuestion && (
            <div className="question-card">
              <div className="question-nav-row">
                <button 
                  className="inline-nav-btn prev-inline-btn" 
                  onClick={handlePrevious}
                  disabled={spellingState.currentIndex === 0}
                  title="前へ"
                >
                  ←
                </button>
                <div className="question-content-inline">
                  <div className="spelling-question-content">
                    <div className="meaning-display">
                      <div className="meaning-label">意味:</div>
                      <div className="meaning-text">{currentQuestion.meaning}</div>
                      {currentQuestion.word.includes(' ') && (
                        <div className="phrase-hint">
                          💡 ヒント: {currentQuestion.word.split(' ').length}つの単語で構成された熟語です
                        </div>
                      )}
                    </div>

                    {/* ユーザーが選択中の単語表示 */}
                    <div className="user-word-display">
                      <div className="user-word-label">あなたの答え:</div>
                      <div className="user-word-text">
                        {inputMode === 'typing' ? typingInput : userWord || '（クリックまたはタイピングで入力）'}
                      </div>
                    </div>

                    {/* 入力モード切り替え */}
                    <div className="input-mode-toggle">
                      <button
                        className={`mode-btn ${inputMode === 'click' ? 'active' : ''}`}
                        onClick={() => {
                          setInputMode('click');
                          setTypingInput('');
                          setSelectedSequence([]);
                        }}
                      >
                        🖱️ クリック
                      </button>
                      <button
                        className={`mode-btn ${inputMode === 'typing' ? 'active' : ''}`}
                        onClick={() => {
                          setInputMode('typing');
                          setSelectedSequence([]);
                          setTypingInput('');
                        }}
                      >
                        ⌨️ タイピング
                      </button>
                    </div>
                  </div>
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

              {/* タイピングモードの入力フィールド */}
              {inputMode === 'typing' && !spellingState.answered && (
                <div className="typing-input-container">
                  <input
                    type="text"
                    className="typing-input"
                    value={typingInput}
                    onChange={(e) => setTypingInput(e.target.value.toLowerCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && typingInput.trim()) {
                        checkTypingAnswer(typingInput.trim());
                      }
                    }}
                    placeholder="スペルを入力してEnterキー"
                    autoFocus
                  />
                  <button
                    className="btn-submit-typing"
                    onClick={() => checkTypingAnswer(typingInput.trim())}
                    disabled={!typingInput.trim()}
                  >
                    回答する
                  </button>
                </div>
              )}

              {/* シャッフルされたアルファベットカード（クリックモードのみ表示） */}
              {inputMode === 'click' && (
                <div className="letter-cards">
                {shuffledLetters.map((letter, index) => {
                  const isSelected = selectedSequence.includes(`${index}`);
                  const selectionOrder = selectedSequence.indexOf(`${index}`) + 1;

                  return (
                    <button
                      key={index}
                      className={`letter-card ${isSelected ? 'selected' : ''} ${
                        spellingState.answered ? 'disabled' : ''
                      }`}
                      onClick={() => handleLetterClick(letter, index)}
                      disabled={spellingState.answered || isSelected}
                    >
                      {letter}
                      {isSelected && <span className="selection-number">{selectionOrder}</span>}
                    </button>
                  );
                })}
              </div>
              )}

              {/* 1文字戻すボタン（クリックモードのみ） */}
              {inputMode === 'click' && !spellingState.answered && selectedSequence.length > 0 && (
                <div className="spelling-reset-button-container">
                  <button className="btn-reset-selection" onClick={handleBackspace}>
                    ⌫ 1文字戻す
                  </button>
                </div>
              )}

              {spellingState.answered && (
                <div className="result-display">
                  <div className="correct-answer">
                    {userWord === spellingState.correctWord ? '✅ 正解: ' : '❌ 不正解 - 正解: '}
                    <strong>{spellingState.correctWord}</strong>
                  </div>
                  
                  {/* 詳細を見るボタン */}
                  <button 
                    className="btn-toggle-details"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? '📖 詳細を閉じる' : '📖 詳細を見る'}
                  </button>
                  
                  {/* 詳細情報の表示（折りたたみ式） */}
                  {showDetails && (
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
                  )}
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
