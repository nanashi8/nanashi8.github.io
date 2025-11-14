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
  
  // 問題集リスト管理
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  
  // 和訳・スペルタブで選択中の問題集ID
  const [selectedQuizSetId, setSelectedQuizSetId] = useState<string | null>(null);
  
  // 難易度フィルター
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('all');
  
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

  // 初回読み込み: localStorage から問題集リストをロード
  useEffect(() => {
    const loadInitialData = async () => {
      const savedSets = loadQuestionSets();
      
      // 初回起動時（問題集が空）の場合、デフォルトCSVを読み込む
      if (savedSets.length === 0) {
        const defaultCSVs = [
          { path: '/data/basic-english.csv', name: '基礎英単語' },
          { path: '/data/animals.csv', name: '動物の英単語' },
          { path: '/data/food.csv', name: '食べ物の英単語' },
        ];
        
        const newSets: QuestionSet[] = [];
        
        for (const csv of defaultCSVs) {
          try {
            const response = await fetch(csv.path);
            const csvText = await response.text();
            const questions = parseCSV(csvText);
            
            if (questions.length > 0) {
              newSets.push({
                id: generateId(),
                name: csv.name,
                questions,
                createdAt: Date.now(),
                isBuiltIn: true,
                source: 'デフォルト問題集',
              });
            }
          } catch (error) {
            console.error(`${csv.name}の読み込みに失敗:`, error);
          }
        }
        
        if (newSets.length > 0) {
          setQuestionSets(newSets);
        }
      } else {
        setQuestionSets(savedSets);
      }
    };
    
    loadInitialData();
  }, []);

  // 問題集が変更されたら localStorage に保存
  useEffect(() => {
    if (questionSets.length > 0) {
      saveQuestionSets(questionSets);
    }
  }, [questionSets]);
  
  // 自動進行設定の保存
  useEffect(() => {
    localStorage.setItem('quiz-auto-advance', JSON.stringify(autoAdvance));
  }, [autoAdvance]);
  
  // 適応的学習モードの保存
  useEffect(() => {
    localStorage.setItem('quiz-adaptive-mode', JSON.stringify(adaptiveMode));
  }, [adaptiveMode]);

  // 難易度でフィルタリング
  const filterQuestionsByDifficulty = (questions: Question[]): Question[] => {
    if (selectedDifficulty === 'all') return questions;
    
    const difficultyMap: Record<DifficultyLevel, string> = {
      'all': '',
      'beginner': '初級',
      'intermediate': '中級',
      'advanced': '上級'
    };
    
    return questions.filter(q => q.difficulty === difficultyMap[selectedDifficulty]);
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

  // 問題集選択ハンドラ（和訳・スペル共通）
  const handleSelectQuestionSet = (setId: string) => {
    if (!setId) {
      setSelectedQuizSetId(null);
      setQuizState({
        questions: [],
        currentIndex: 0,
        score: 0,
        totalAnswered: 0,
        answered: false,
        selectedAnswer: null,
      });
      return;
    }

    const selectedSet = questionSets.find((s) => s.id === setId);
    if (!selectedSet) return;

    setSelectedQuizSetId(setId);
    
    // 難易度でフィルタリング
    let filteredQuestions = filterQuestionsByDifficulty(selectedSet.questions);
    
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

  // 難易度変更ハンドラー
  const handleDifficultyChange = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    
    // 現在問題集が選択されている場合は再フィルタリング
    if (selectedQuizSetId) {
      const selectedSet = questionSets.find((s) => s.id === selectedQuizSetId);
      if (selectedSet) {
        const difficultyMap: Record<DifficultyLevel, string> = {
          'all': '',
          'beginner': '初級',
          'intermediate': '中級',
          'advanced': '上級'
        };
        
        const filteredQuestions = level === 'all' 
          ? selectedSet.questions
          : selectedSet.questions.filter(q => q.difficulty === difficultyMap[level]);
        
        setQuizState({
          questions: filteredQuestions,
          currentIndex: 0,
          score: 0,
          totalAnswered: 0,
          answered: false,
          selectedAnswer: null,
        });
      }
    }
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
      if (newState.totalAnswered === prev.questions.length && selectedQuizSetId) {
        const selectedSet = questionSets.find((s) => s.id === selectedQuizSetId);
        if (selectedSet) {
          const timeSpent = Math.floor((Date.now() - quizStartTimeRef.current) / 1000);
          const percentage = (newState.score / newState.totalAnswered) * 100;
          
          addQuizResult({
            id: generateId(),
            questionSetId: selectedSet.id,
            questionSetName: selectedSet.name,
            score: newState.score,
            total: newState.totalAnswered,
            percentage,
            date: Date.now(),
            timeSpent,
            incorrectWords: incorrectWordsRef.current,
            mode: 'translation',
          });
          
          // 完了メッセージ
          setTimeout(() => {
            alert(`クイズ完了！\n正解: ${newState.score}/${newState.totalAnswered} (${percentage.toFixed(1)}%)\n成績タブで詳細を確認できます。`);
          }, 500);
        }
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
            questionSets={questionSets}
            selectedSetId={selectedQuizSetId}
            onSelectQuestionSet={handleSelectQuestionSet}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onDifficultyRate={handleDifficultyRate}
          />
        ) : activeTab === 'spelling' ? (
          <SpellingView
            questions={quizState.questions}
            questionSets={questionSets}
            selectedSetId={selectedQuizSetId}
            onSelectQuestionSet={handleSelectQuestionSet}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
          />
        ) : activeTab === 'reading' ? (
          <ReadingView />
        ) : activeTab === 'stats' ? (
          <StatsView
            questionSets={questionSets}
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
