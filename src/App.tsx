import { useState, useEffect } from 'react';
import { QuizState, Question, QuestionSet } from './types';
import {
  parseCSV,
  loadQuestionSets,
  saveQuestionSets,
  deleteQuestionSet as utilDeleteQuestionSet,
  generateId,
} from './utils';
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

  // 問題集リスト管理
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [unknownWords, setUnknownWords] = useState<Question[]>([]);

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

  // 選択中の問題集を選択して問題をロード
  const handleSelectQuestionSet = (setId: string) => {
    const set = questionSets.find((s) => s.id === setId);
    if (!set) return;

    setSelectedSetId(setId);
    const allQuestions = [...set.questions, ...unknownWords];

    setQuizState({
      questions: allQuestions,
      currentIndex: 0,
      score: 0,
      totalAnswered: 0,
      answered: false,
      selectedAnswer: null,
    });
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
      handleSelectQuestionSet(newSet.id);
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
        handleSelectQuestionSet(newSet.id);
      } catch (error) {
        console.error('CSVの解析エラー:', error);
        alert('ファイルの解析に失敗しました');
      }
    };
    reader.readAsText(file);
  };

  // 問題集を削除
  const handleDeleteSet = (id: string) => {
    const set = questionSets.find((s) => s.id === id);
    if (!set) return;

    if (set.isBuiltIn) {
      alert('組み込みの問題集は削除できません');
      return;
    }

    if (!confirm(`問題集「${set.name}」を削除しますか?`)) return;

    const success = utilDeleteQuestionSet(id);
    if (success) {
      setQuestionSets((prev) => prev.filter((s) => s.id !== id));
      if (selectedSetId === id) {
        setSelectedSetId(null);
        setQuizState({
          questions: [],
          currentIndex: 0,
          score: 0,
          totalAnswered: 0,
          answered: false,
          selectedAnswer: null,
        });
      }
    }
  };

  // 空の問題集を追加
  const handleAddEmptySet = () => {
    const name = prompt('新しい問題集の名前を入力:');
    if (!name) return;

    const newSet: QuestionSet = {
      id: generateId(),
      name,
      questions: [],
      createdAt: Date.now(),
      isBuiltIn: false,
      source: '手動作成',
    };

    setQuestionSets((prev) => [...prev, newSet]);
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

      {/* 問題集管理パネル（和訳・スペルタブのみ表示） */}
      {(activeTab === 'translation' || activeTab === 'spelling') && (
        <div className="question-sets-panel">
          <h3>📚 問題集一覧</h3>
          <div className="question-sets-toolbar">
            <button onClick={handleAddEmptySet} className="btn-add-set">
              ➕ 空の問題集を追加
            </button>
          </div>
          <div className="question-sets-list">
            {questionSets.length === 0 ? (
              <p className="empty-message">
                問題集がありません。CSV を読み込むか、空の問題集を追加してください。
              </p>
            ) : (
              questionSets.map((set) => (
                <div
                  key={set.id}
                  className={`question-set-item ${
                    selectedSetId === set.id ? 'active' : ''
                  }`}
                >
                  <button
                    className="set-name-btn"
                    onClick={() => handleSelectQuestionSet(set.id)}
                  >
                    <div className="set-name">{set.name}</div>
                    <div className="set-info">
                      {set.questions.length}問
                      {set.source && ` • ${set.source}`}
                    </div>
                  </button>
                  {!set.isBuiltIn && (
                    <button
                      className="delete-set-btn"
                      onClick={() => handleDeleteSet(set.id)}
                      title="削除"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
            questions={quizState.questions}
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
