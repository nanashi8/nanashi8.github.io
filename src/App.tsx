import { useState } from 'react';
import { QuizState, Question } from './types';
import { parseCSV } from './utils';
import QuizView from './components/QuizView';
import SpellingView from './components/SpellingView';
import ReadingView from './components/ReadingView';
import CreateView from './components/CreateView';
import './App.css';

type Tab = 'translation' | 'spelling' | 'reading' | 'create';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('translation');
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    totalAnswered: 0,
    answered: false,
    selectedAnswer: null,
  });
  
  // 長文補習問題用の単語リスト
  const [unknownWords, setUnknownWords] = useState<Question[]>([]);

  const handleLoadCSV = async (filePath: string) => {
    try {
      const response = await fetch(filePath);
      const csvText = await response.text();
      const questions = parseCSV(csvText);

      if (questions.length === 0) {
        alert('問題データが見つかりませんでした');
        return;
      }

      // 長文補習問題も含める
      const allQuestions = [...questions, ...unknownWords];

      setQuizState({
        questions: allQuestions,
        currentIndex: 0,
        score: 0,
        totalAnswered: 0,
        answered: false,
        selectedAnswer: null,
      });
    } catch (error) {
      console.error('CSVの読み込みエラー:', error);
      alert('ファイルの読み込みに失敗しました');
    }
  };

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

        // 長文補習問題も含める
        const allQuestions = [...questions, ...unknownWords];

        setQuizState({
          questions: allQuestions,
          currentIndex: 0,
          score: 0,
          totalAnswered: 0,
          answered: false,
          selectedAnswer: null,
        });
      } catch (error) {
        console.error('CSVの解析エラー:', error);
        alert('ファイルの解析に失敗しました');
      }
    };
    reader.readAsText(file);
  };

  const handleAnswer = (answer: string, correct: string) => {
    if (quizState.answered) return;

    const isCorrect = answer === correct;
    setQuizState((prev) => ({
      ...prev,
      answered: true,
      selectedAnswer: answer,
      score: isCorrect ? prev.score + 1 : prev.score,
      totalAnswered: prev.totalAnswered + 1,
    }));
  };

  const handleNext = () => {
    setQuizState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.questions.length,
      answered: false,
      selectedAnswer: null,
    }));
  };

  // 長文から分からない単語を追加
  const handleAddUnknownWords = (words: Question[]) => {
    setUnknownWords((prev) => {
      // 重複を避けて追加
      const newWords = words.filter(
        (word) => !prev.some((w) => w.word === word.word)
      );
      return [...prev, ...newWords];
    });
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
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          問題作成
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'translation' ? (
          <QuizView
            quizState={quizState}
            onLoadCSV={handleLoadCSV}
            onLoadLocalFile={handleLoadLocalFile}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        ) : activeTab === 'spelling' ? (
          <SpellingView
            questions={[...quizState.questions, ...unknownWords]}
            onLoadCSV={handleLoadCSV}
            onLoadLocalFile={handleLoadLocalFile}
          />
        ) : activeTab === 'reading' ? (
          <ReadingView onAddUnknownWords={handleAddUnknownWords} />
        ) : (
          <CreateView />
        )}
      </div>
    </div>
  );
}

export default App;
