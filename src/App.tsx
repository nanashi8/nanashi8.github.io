import { useState, useEffect, useRef } from 'react';
import { QuizState, QuestionSet } from './types';
import {
  parseCSV,
  loadQuestionSets,
  saveQuestionSets,
  generateId,
} from './utils';
import { addQuizResult } from './progressStorage';
import QuizView from './components/QuizView';
import SpellingView from './components/SpellingView';
import ReadingView from './components/ReadingView';
import QuestionEditorView from './components/QuestionEditorView';
import StatsView from './components/StatsView';
import './App.css';

type Tab = 'translation' | 'spelling' | 'reading' | 'stats' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('translation');
  
  // 問題集リスト管理
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  
  // 和訳・スペルタブで選択中の問題集ID
  const [selectedQuizSetId, setSelectedQuizSetId] = useState<string | null>(null);
  
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
  const incorrectWordsRef = useRef<string[]>([]);
  
  // 設定
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    const saved = localStorage.getItem('quiz-auto-advance');
    return saved ? JSON.parse(saved) : false;
  });

  // 初回読み込み: localStorage から問題集リストをロード
  useEffect(() => {
    const savedSets = loadQuestionSets();
    setQuestionSets(savedSets);
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
    setQuizState({
      questions: selectedSet.questions,
      currentIndex: 0,
      score: 0,
      totalAnswered: 0,
      answered: false,
      selectedAnswer: null,
    });
    
    // クイズ開始時刻を記録
    quizStartTimeRef.current = Date.now();
    incorrectWordsRef.current = [];
  };

  const handleAnswer = (answer: string, correct: string) => {
    if (quizState.answered) return;

    const isCorrect = answer === correct;
    
    // 間違えた単語を記録
    if (!isCorrect && quizState.questions[quizState.currentIndex]) {
      incorrectWordsRef.current.push(quizState.questions[quizState.currentIndex].word);
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
  };

  const handlePrevious = () => {
    setQuizState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : 0,
      answered: false,
      selectedAnswer: null,
    }));
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
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        ) : activeTab === 'spelling' ? (
          <SpellingView
            questions={quizState.questions}
            questionSets={questionSets}
            selectedSetId={selectedQuizSetId}
            onSelectQuestionSet={handleSelectQuestionSet}
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
          />
        )}
      </div>
    </div>
  );
}

export default App;
