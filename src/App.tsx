import { useState, useEffect, useRef } from 'react';
import { QuizState, QuestionSet, Question } from './types';
import {
  parseCSV,
  loadQuestionSets,
  saveQuestionSets,
  generateId,
  selectAdaptiveQuestions,
} from './utils';
import { addQuizResult, updateWordProgress, filterSkippedWords, recordWordSkip, getTodayIncorrectWords, loadProgress } from './progressStorage';
import { addToSkipGroup, handleSkippedWordIncorrect, handleSkippedWordCorrect, prioritizeVerificationWords, generateAssistantMessage } from './learningAssistant';
import QuizView from './components/QuizView';
import SpellingView from './components/SpellingView';
import ComprehensiveReadingView from './components/ComprehensiveReadingView';
import StatsView from './components/StatsView';
import SettingsView from './components/SettingsView';
import './App.css';

type Tab = 'translation' | 'spelling' | 'reading' | 'settings' | 'stats';
export type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type WordPhraseFilter = 'all' | 'words-only' | 'phrases-only';
export type PhraseTypeFilter = 'all' | 'phrasal-verb' | 'idiom' | 'collocation' | 'other';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('translation');
  
  // 全問題データ（junior-high-entrance-words.csvから読み込み）
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  
  // 関連分野リスト
  const [categoryList, setCategoryList] = useState<string[]>([]);
  
  // 選択中の関連分野
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // 難易度フィルター
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('all');
  
  // 単語/熟語フィルター
  const [selectedWordPhraseFilter, setSelectedWordPhraseFilter] = useState<WordPhraseFilter>('all');
  
  // 熟語タイプフィルター
  const [selectedPhraseTypeFilter, setSelectedPhraseTypeFilter] = useState<PhraseTypeFilter>('all');
  
  // 問題集リスト管理（後方互換性のため残す）
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  
  // 適応的学習モード
  const [adaptiveMode, setAdaptiveMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('quiz-adaptive-mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // 和訳タブ用のクイズ状態
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    totalAnswered: 0,
    answered: false,
    selectedAnswer: null,
  });

  // 進捗追跡用
  const quizStartTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0); // 各問題の開始時刻
  const incorrectWordsRef = useRef<string[]>([]);
  
  // 設定
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    const saved = localStorage.getItem('quiz-auto-advance');
    return saved ? JSON.parse(saved) : false;
  });

  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState<number>(() => {
    const saved = localStorage.getItem('quiz-auto-advance-delay');
    return saved ? JSON.parse(saved) : 1.0;
  });

  // 初回読み込み: junior-high-entrance-words.csvを読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/data/junior-high-entrance-words.csv');
        const csvText = await response.text();
        const questions = parseCSV(csvText);
        
        if (questions.length > 0) {
          setAllQuestions(questions);
          
          // 関連分野のリストを抽出
          const categories = Array.from(new Set(questions.map(q => q.category || '').filter(c => c)));
          setCategoryList(categories.sort());
          
          // 問題集形式で保存（後方互換性のため）
          const mainSet: QuestionSet = {
            id: 'main-set',
            name: '高校受験英単語',
            questions,
            createdAt: Date.now(),
            isBuiltIn: true,
            source: 'junior-high-entrance-words.csv',
          };
          setQuestionSets([mainSet]);
        }
      } catch (error) {
        console.error('英単語データの読み込みに失敗:', error);
        alert('英単語データの読み込みに失敗しました');
      }
    };
    
    loadInitialData();
  }, []);

  // 問題集が変更されたら localStorage に保存（削除）
  // useEffect(() => {
  //   if (questionSets.length > 0) {
  //     saveQuestionSets(questionSets);
  //   }
  // }, [questionSets]);
  
  // 自動進行設定の保存
  useEffect(() => {
    localStorage.setItem('quiz-auto-advance', JSON.stringify(autoAdvance));
  }, [autoAdvance]);

  useEffect(() => {
    localStorage.setItem('quiz-auto-advance-delay', JSON.stringify(autoAdvanceDelay));
  }, [autoAdvanceDelay]);
  
  // 適応的学習モードの保存
  useEffect(() => {
    localStorage.setItem('quiz-adaptive-mode', JSON.stringify(adaptiveMode));
  }, [adaptiveMode]);

  // 関連分野と難易度でフィルタリング
  const getFilteredQuestions = (): Question[] => {
    let filtered = allQuestions;
    
    // 関連分野でフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    
    // 難易度でフィルター
    if (selectedDifficulty !== 'all') {
      const difficultyMap: Record<DifficultyLevel, string> = {
        'all': '',
        'beginner': '初級',
        'intermediate': '中級',
        'advanced': '上級'
      };
      filtered = filtered.filter(q => q.difficulty === difficultyMap[selectedDifficulty]);
    }
    
    // 単語/熟語でフィルター
    if (selectedWordPhraseFilter === 'words-only') {
      filtered = filtered.filter(q => !q.word.includes(' '));
    } else if (selectedWordPhraseFilter === 'phrases-only') {
      filtered = filtered.filter(q => q.word.includes(' '));
      
      // 熟語タイプでフィルター（熟語のみが選択されている場合）
      if (selectedPhraseTypeFilter !== 'all') {
        filtered = filtered.filter(q => {
          const { classifyPhraseType } = require('./utils');
          return classifyPhraseType(q.word) === selectedPhraseTypeFilter;
        });
      }
    }
    
    // スキップされた単語を除外
    filtered = filterSkippedWords(filtered);
    
    return filtered;
  };

  // CSV ファイルから問題集を作成
  const handleLoadCSV = async (filePath: string) => {
    try {
      const response = await fetch(filePath);
      const csvText = await response.text();
      const questions = parseCSV(csvText);

      if (questions.length === 0) {
        alert('問題データが見つかりませんでした');
        return;
      }

      // 新しい問題集として保存
      const setName = prompt('問題集の名前を入力:', 'サンプル問題集');
      if (!setName) return;

      const newSet: QuestionSet = {
        id: generateId(),
        name: setName,
        questions,
        createdAt: Date.now(),
        isBuiltIn: false,
        source: 'CSV読み込み',
      };

      setQuestionSets((prev) => [...prev, newSet]);
      alert(`問題集「${setName}」を追加しました`);
    } catch (error) {
      console.error('CSVの読み込みエラー:', error);
      alert('ファイルの読み込みに失敗しました');
    }
  };

  // ローカル CSV ファイルを読み込み
  const handleLoadLocalFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const questions = parseCSV(csvText);

        if (questions.length === 0) {
          alert('問題データが見つかりませんでした');
          return;
        }

        // 新しい問題集として保存
        const setName = prompt('問題集の名前を入力:', file.name.replace('.csv', ''));
        if (!setName) return;

        const newSet: QuestionSet = {
          id: generateId(),
          name: setName,
          questions,
          createdAt: Date.now(),
          isBuiltIn: false,
          source: 'ローカルCSV',
        };

        setQuestionSets((prev) => [...prev, newSet]);
        alert(`問題集「${setName}」を追加しました`);
      } catch (error) {
        console.error('CSVの解析エラー:', error);
        alert('ファイルの解析に失敗しました');
      }
    };
    reader.readAsText(file);
  };

  // クイズ開始ハンドラー
  const handleStartQuiz = () => {
    let filteredQuestions = getFilteredQuestions();
    
    if (filteredQuestions.length === 0) {
      alert('指定された条件の問題が見つかりません');
      return;
    }
    
    // 当日の誤答単語を取得
    const todayIncorrect = getTodayIncorrectWords();
    
    // 誤答単語がある場合、優先的に出題
    if (todayIncorrect.length > 0) {
      const incorrectQuestions = filteredQuestions.filter(q => 
        todayIncorrect.some(word => word.toLowerCase() === q.word.toLowerCase())
      );
      const correctQuestions = filteredQuestions.filter(q => 
        !todayIncorrect.some(word => word.toLowerCase() === q.word.toLowerCase())
      );
      
      // 誤答問題を前に、正解済み問題を後ろに配置
      filteredQuestions = [...incorrectQuestions, ...correctQuestions];
    }
    
    // 適応的学習モードが有効な場合、出題順を最適化
    if (adaptiveMode && filteredQuestions.length > 0) {
      filteredQuestions = selectAdaptiveQuestions(filteredQuestions, Math.min(20, filteredQuestions.length));
    }
    
    setQuizState({
      questions: filteredQuestions,
      currentIndex: 0,
      score: 0,
      totalAnswered: 0,
      answered: false,
      selectedAnswer: null,
    });
    
    // クイズ開始時刻を記録
    quizStartTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
    incorrectWordsRef.current = [];
  };

  // 関連分野変更ハンドラー
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // フィルター変更時にクイズを再開（既に開始している場合）
    if (quizState.questions.length > 0) {
      handleStartQuiz();
    }
  };

  // 難易度変更ハンドラー
  const handleDifficultyChange = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    // フィルター変更時にクイズを再開（既に開始している場合）
    if (quizState.questions.length > 0) {
      handleStartQuiz();
    }
  };

  const handleAnswer = (answer: string, correct: string) => {
    if (quizState.answered) return;

    // 安全な比較のため、両者をtrim()で正規化
    const normalizedAnswer = answer.trim();
    const normalizedCorrect = correct.trim();
    const isCorrect = normalizedAnswer === normalizedCorrect;
    const currentQuestion = quizState.questions[quizState.currentIndex];
    
    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // 単語進捗を更新
    if (currentQuestion) {
      updateWordProgress(currentQuestion.word, isCorrect, responseTime);
      
      // AI学習アシスタント: スキップした単語の検証
      const progress = loadProgress();
      const wordProgress = progress.wordProgress[currentQuestion.word];
      
      if (wordProgress && wordProgress.skippedCount && wordProgress.skippedCount > 0) {
        // この単語は以前スキップされていた
        if (isCorrect) {
          handleSkippedWordCorrect(currentQuestion.word);
        } else {
          handleSkippedWordIncorrect(currentQuestion.word);
          console.log('🤔 AI学習アシスタント: スキップした単語が不正解でした。同時期の単語を再確認します。');
        }
      }
      
      // 回答ごとに小さなQuizResultを記録（統計用）
      addQuizResult({
        id: generateId(),
        questionSetId: 'main-set-single',
        questionSetName: '高校受験英単語',
        score: isCorrect ? 1 : 0,
        total: 1,
        percentage: isCorrect ? 100 : 0,
        date: Date.now(),
        timeSpent: Math.floor(responseTime / 1000),
        incorrectWords: isCorrect ? [] : [currentQuestion.word],
        mode: 'translation',
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
      });
      
      // 間違えた単語を記録
      if (!isCorrect) {
        incorrectWordsRef.current.push(currentQuestion.word);
      }
    }
    
    setQuizState((prev) => {
      const newState = {
        ...prev,
        answered: true,
        selectedAnswer: answer,
        score: isCorrect ? prev.score + 1 : prev.score,
        totalAnswered: prev.totalAnswered + 1,
      };
      
      // 自動で次へ進む（正解時のみ）
      if (autoAdvance && isCorrect) {
        setTimeout(() => {
          handleNext();
        }, autoAdvanceDelay * 1000);
      }
      
      // 全問題に回答したら完了メッセージを表示
      if (newState.totalAnswered === prev.questions.length) {
        const percentage = (newState.score / newState.totalAnswered) * 100;
        
        // 完了メッセージ
        setTimeout(() => {
          alert(`クイズ完了！\n正解: ${newState.score}/${newState.totalAnswered} (${percentage.toFixed(1)}%)\n成績タブで詳細を確認できます。`);
        }, 500);
      }
      
      return newState;
    });
  };

  const handleNext = () => {
    setQuizState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.questions.length,
      answered: false,
      selectedAnswer: null,
    }));
    
    // 次の問題の開始時刻を記録
    questionStartTimeRef.current = Date.now();
  };

  const handlePrevious = () => {
    setQuizState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : 0,
      answered: false,
      selectedAnswer: null,
    }));
  };
  
  // スキップハンドラー(回答前に次へボタンを押した場合)
  const handleSkip = () => {
    const currentQuestion = quizState.questions[quizState.currentIndex];
    if (currentQuestion) {
      // スキップ記録(30日間除外、AI学習アシスタントが後日検証)
      recordWordSkip(currentQuestion.word, 30);
      
      // AI学習アシスタント: スキップグループに追加
      addToSkipGroup(currentQuestion.word);
      
      // スキップでもスコアボードに反映(正解扱い)
      setQuizState((prev) => ({
        ...prev,
        score: prev.score + 1,
        totalAnswered: prev.totalAnswered + 1,
        currentIndex: (prev.currentIndex + 1) % prev.questions.length,
        answered: false,
        selectedAnswer: null,
      }));
      
      // 回答を記録
      addQuizResult({
        id: generateId(),
        questionSetId: 'translation-quiz-single',
        questionSetName: '和訳クイズ',
        score: 1, // スキップは正解扱い
        total: 1,
        percentage: 100,
        date: Date.now(),
        timeSpent: 0,
        incorrectWords: [],
        mode: 'translation',
        difficulty: currentQuestion.difficulty,
      });
    } else {
      // 問題がない場合は通常の次へ
      setQuizState((prev) => ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.questions.length,
        answered: false,
        selectedAnswer: null,
      }));
    }
    
    // 次の問題の開始時刻を記録
    questionStartTimeRef.current = Date.now();
  };
  
  // 難易度評価のハンドラー
  const handleDifficultyRate = (rating: number) => {
    const currentQuestion = quizState.questions[quizState.currentIndex];
    if (currentQuestion) {
      // 応答時間を再計算（評価時点での時間）
      const responseTime = Date.now() - questionStartTimeRef.current;
      updateWordProgress(currentQuestion.word, quizState.selectedAnswer === currentQuestion.meaning, responseTime, rating);
    }
  };

  return (
    <div className="app">
      <div className="tab-menu">
        <button
          className={`tab-btn ${activeTab === 'translation' ? 'active' : ''}`}
          onClick={() => setActiveTab('translation')}
        >
          和訳
        </button>
        <button
          className={`tab-btn ${activeTab === 'spelling' ? 'active' : ''}`}
          onClick={() => setActiveTab('spelling')}
        >
          スペル
        </button>
        <button
          className={`tab-btn ${activeTab === 'reading' ? 'active' : ''}`}
          onClick={() => setActiveTab('reading')}
        >
          読解
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          成績
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 設定
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'translation' ? (
          <QuizView
            quizState={quizState}
            categoryList={categoryList}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            selectedWordPhraseFilter={selectedWordPhraseFilter}
            onWordPhraseFilterChange={setSelectedWordPhraseFilter}
            selectedPhraseTypeFilter={selectedPhraseTypeFilter}
            onPhraseTypeFilterChange={setSelectedPhraseTypeFilter}
            onStartQuiz={handleStartQuiz}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onDifficultyRate={handleDifficultyRate}
          />
        ) : activeTab === 'spelling' ? (
          <SpellingView
            questions={quizState.questions}
            categoryList={categoryList}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            selectedWordPhraseFilter={selectedWordPhraseFilter}
            onWordPhraseFilterChange={setSelectedWordPhraseFilter}
            selectedPhraseTypeFilter={selectedPhraseTypeFilter}
            onPhraseTypeFilterChange={setSelectedPhraseTypeFilter}
            onStartQuiz={handleStartQuiz}
          />
        ) : activeTab === 'reading' ? (
          <ComprehensiveReadingView 
            onSaveUnknownWords={(words) => {
              // 分からない単語を問題集として保存
              const setName = prompt(`${words.length}個の単語が選択されています。\n問題集の名前を入力してください:`, '長文から抽出した単語');
              if (setName) {
                const newSet: QuestionSet = {
                  id: generateId(),
                  name: setName,
                  questions: words.map(w => ({
                    word: w.word,
                    reading: '',
                    meaning: w.meaning,
                    etymology: '',
                    relatedWords: '',
                    relatedFields: '',
                    difficulty: ''
                  })),
                  createdAt: Date.now(),
                  isBuiltIn: false,
                  source: '長文読解'
                };
                const updatedSets = [...questionSets, newSet];
                setQuestionSets(updatedSets);
                saveQuestionSets(updatedSets);
              }
            }}
          />
        ) : activeTab === 'stats' ? (
          <StatsView
            questionSets={questionSets}
            allQuestions={allQuestions}
            categoryList={categoryList}
          />
        ) : (
          <SettingsView
            allQuestions={allQuestions}
            onStartSession={(mode, questions) => {
              // セッションの単語でクイズを開始
              setQuizState({
                questions,
                currentIndex: 0,
                score: 0,
                totalAnswered: 0,
                answered: false,
                selectedAnswer: null,
              });
              quizStartTimeRef.current = Date.now();
              questionStartTimeRef.current = Date.now();
              incorrectWordsRef.current = [];
              setActiveTab('translation');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
