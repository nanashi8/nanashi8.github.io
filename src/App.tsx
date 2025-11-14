import { useState, useEffect, useRef } from 'react';
import { QuizState, QuestionSet, Question } from './types';
import {
  parseCSV,
  loadQuestionSets,
  saveQuestionSets,
  generateId,
  selectAdaptiveQuestions,
} from './utils';
import { addQuizResult, updateWordProgress } from './progressStorage';
import QuizView from './components/QuizView';
import SpellingView from './components/SpellingView';
import ReadingView from './components/ReadingView';
import QuestionEditorView from './components/QuestionEditorView';
import StatsView from './components/StatsView';
import './App.css';

type Tab = 'translation' | 'spelling' | 'reading' | 'stats' | 'settings';
export type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

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
            name: '中学受験英単語',
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
  };

  // 難易度変更ハンドラー
  const handleDifficultyChange = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
  };

  const handleAnswer = (answer: string, correct: string) => {
    if (quizState.answered) return;

    const isCorrect = answer === correct;
    const currentQuestion = quizState.questions[quizState.currentIndex];
    
    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // 単語進捗を更新
    if (currentQuestion) {
      updateWordProgress(currentQuestion.word, isCorrect, responseTime);
      
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
        }, 1500);
      }
      
      // 全問題に回答したら進捗を保存
      if (newState.totalAnswered === prev.questions.length) {
        const timeSpent = Math.floor((Date.now() - quizStartTimeRef.current) / 1000);
        const percentage = (newState.score / newState.totalAnswered) * 100;
        
        addQuizResult({
          id: generateId(),
          questionSetId: 'main-set',
          questionSetName: '中学受験英単語',
          score: newState.score,
          total: newState.totalAnswered,
          percentage,
          date: Date.now(),
          timeSpent,
          incorrectWords: incorrectWordsRef.current,
          mode: 'translation',
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        });
        
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
      <header className="header">
        <h1>🎯 英単語3択クイズ</h1>
      </header>

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
          長文
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
          問題設定
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
            onStartQuiz={handleStartQuiz}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
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
            onStartQuiz={handleStartQuiz}
          />
        ) : activeTab === 'reading' ? (
          <ReadingView />
        ) : activeTab === 'stats' ? (
          <StatsView
            questionSets={questionSets}
            allQuestions={allQuestions}
            categoryList={categoryList}
          />
        ) : (
          <QuestionEditorView
            questionSets={questionSets}
            onQuestionSetsChange={setQuestionSets}
            onLoadCSV={handleLoadCSV}
            onLoadLocalFile={handleLoadLocalFile}
            autoAdvance={autoAdvance}
            onAutoAdvanceChange={setAutoAdvance}
            adaptiveMode={adaptiveMode}
            onAdaptiveModeChange={setAdaptiveMode}
          />
        )}
      </div>
    </div>
  );
}

export default App;
