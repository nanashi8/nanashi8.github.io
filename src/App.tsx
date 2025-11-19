import { useState, useEffect, useRef } from 'react';
import { QuizState, QuestionSet, Question } from './types';
import {
  parseCSV,
  loadQuestionSets,
  saveQuestionSets,
  generateId,
  selectAdaptiveQuestions,
} from './utils';
import { addQuizResult, updateWordProgress, filterSkippedWords, recordWordSkip, getTodayIncorrectWords, loadProgress, addSessionHistory, getStudySettings } from './progressStorage';
import { addToSkipGroup, handleSkippedWordIncorrect, handleSkippedWordCorrect, prioritizeVerificationWords, generateAssistantMessage } from './learningAssistant';
import { 
  generateSpacedRepetitionSchedule, 
  SpacedRepetitionSchedule,
  calculateMemoryRetention 
} from './adaptiveLearningAI';
import {
  analyzeRadarChart,
  prioritizeWeakCategoryQuestions,
  saveImprovementProgress,
  updateImprovementProgress,
  getImprovementProgress
} from './radarChartAI';
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

// LocalStorageサイズを確認する関数
function checkLocalStorageSize() {
  try {
    let totalSize = 0;
    const details: { key: string; size: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          details.push({ key, size });
        }
      }
    }
    
    const totalMB = totalSize / (1024 * 1024);
    console.log(`📊 LocalStorage使用量: ${totalMB.toFixed(2)}MB`);
    
    // 大きいデータをログ出力
    details.sort((a, b) => b.size - a.size);
    details.slice(0, 5).forEach(d => {
      const sizeMB = d.size / (1024 * 1024);
      console.log(`  - ${d.key}: ${sizeMB.toFixed(2)}MB`);
    });
    
    // 警告表示（4MB以上で警告）
    if (totalMB > 4) {
      console.warn('⚠️ LocalStorageの使用量が多いため、古いデータを自動削除しています。');
      // 進捗データを再読み込みして自動圧縮を実行
      const progress = loadProgress();
      console.log('自動圧縮が完了しました。');
    }
  } catch (error) {
    console.error('LocalStorageサイズの確認エラー:', error);
  }
}

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
  
  // 間隔反復スケジューラー用
  const recentAnswersRef = useRef<Array<{ word: string; wasCorrect: boolean; timestamp: number }>>([]);
  const spacedRepetitionScheduleRef = useRef<SpacedRepetitionSchedule[]>([]);
  
  // 言語学的関連性追跡用(最近学習した単語を記録)
  const recentlyStudiedWordsRef = useRef<string[]>([]);
  
  // 設定
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    const saved = localStorage.getItem('quiz-auto-advance');
    return saved ? JSON.parse(saved) : false;
  });

  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState<number>(() => {
    const saved = localStorage.getItem('quiz-auto-advance-delay');
    return saved ? JSON.parse(saved) : 1.0;
  });

  // ダークモード初期化
  useEffect(() => {
    const applyDarkMode = (mode: 'light' | 'dark' | 'system') => {
      const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark-mode', isDark);
    };

    const savedDarkMode = localStorage.getItem('darkMode') as 'light' | 'dark' | 'system' | null;
    const darkMode = savedDarkMode || 'system';
    applyDarkMode(darkMode);

    // システム設定の変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentMode = localStorage.getItem('darkMode') as 'light' | 'dark' | 'system' | null;
      if (!currentMode || currentMode === 'system') {
        applyDarkMode('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 初回読み込み: junior-high-entrance-words.csvと高校受験英熟語を読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // LocalStorageサイズの確認
        checkLocalStorageSize();
        
        // 単語データを読み込み
        const wordsResponse = await fetch('/data/junior-high-entrance-words.csv');
        const wordsText = await wordsResponse.text();
        const wordsQuestions = parseCSV(wordsText);
        
        // 熟語データを読み込み
        let phrasesQuestions: Question[] = [];
        try {
          const phrasesResponse = await fetch('/data/junior-high-entrance-phrases.csv');
          const phrasesText = await phrasesResponse.text();
          phrasesQuestions = parseCSV(phrasesText);
          console.log(`📚 高校受験英熟語を読み込みました: ${phrasesQuestions.length}個`);
        } catch (error) {
          console.warn('高校受験英熟語データの読み込みに失敗:', error);
          // 熟語データの読み込みに失敗しても続行
        }
        
        // 単語と熟語を結合
        const allQuestions = [...wordsQuestions, ...phrasesQuestions];
        
        if (allQuestions.length > 0) {
          setAllQuestions(allQuestions);
          
          // 関連分野のリストを抽出
          const categories = Array.from(new Set(allQuestions.map(q => q.category || '').filter(c => c)));
          setCategoryList(categories.sort());
          
          // 問題集形式で保存（後方互換性のため）
          const mainSet: QuestionSet = {
            id: 'main-set',
            name: '高校受験英単語・熟語',
            questions: allQuestions,
            createdAt: Date.now(),
            isBuiltIn: true,
            source: 'junior-high-entrance-words.csv + junior-high-entrance-phrases.csv',
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
    // 学習設定を取得
    const studySettings = getStudySettings();
    
    let filteredQuestions = getFilteredQuestions();
    
    if (filteredQuestions.length === 0) {
      alert('指定された条件の問題が見つかりません');
      return;
    }
    
    // レーダーチャートAI: 弱点分野を分析
    const radarAnalysis = analyzeRadarChart(allQuestions, categoryList);
    
    // 改善進捗を更新
    const improvementProgress = getImprovementProgress();
    if (improvementProgress) {
      updateImprovementProgress(radarAnalysis);
      console.log(`📊 改善進捗: ${improvementProgress.currentDay}日目 - 全体進捗${improvementProgress.overallProgress.toFixed(1)}%`);
    } else if (radarAnalysis.weakCategories.length > 0) {
      // 初回の場合は改善プランを開始
      saveImprovementProgress(radarAnalysis);
      console.log('🎯 レーダーチャート改善プランを開始しました');
    }
    
    // AI推奨メッセージをコンソールに表示
    if (radarAnalysis.aiRecommendations.length > 0) {
      console.log('🧠 AI学習アシスタント からの推奨:');
      radarAnalysis.aiRecommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    // 弱点分野からの出題を優先(AIが自動調整)
    if (radarAnalysis.weakCategories.length > 0 && selectedCategory === 'all') {
      filteredQuestions = prioritizeWeakCategoryQuestions(
        filteredQuestions,
        radarAnalysis.weakCategories,
        Math.min(30, filteredQuestions.length)
      );
      console.log(`💡 弱点分野を優先出題: ${radarAnalysis.weakCategories.slice(0, 3).map(w => w.category).join(', ')}`);
    }
    
    // 言語学的関連性による出題(最近学習した単語の関連語を優先)
    if (recentlyStudiedWordsRef.current.length > 0 && selectedCategory === 'all') {
      const relatedQuestions = selectRelatedQuestions(
        recentlyStudiedWordsRef.current,
        filteredQuestions,
        Math.min(5, Math.floor(filteredQuestions.length * 0.3)) // 全体の30%程度を関連語にする
      );
      
      if (relatedQuestions.length > 0) {
        // 関連語を優先的に配置(最初の方に)
        const nonRelatedQuestions = filteredQuestions.filter(q => 
          !relatedQuestions.some(rq => rq.word === q.word)
        );
        filteredQuestions = [...relatedQuestions, ...nonRelatedQuestions];
        console.log(`🔗 言語学的関連性: ${relatedQuestions.length}問の関連語を優先出題`);
      }
    }
    
    // 当日の誤答単語を取得
    const todayIncorrect = getTodayIncorrectWords();
    
    // 誤答単語を要復習上限に基づいて制限
    let reviewQuestions: Question[] = [];
    if (todayIncorrect.length > 0) {
      const incorrectQuestions = filteredQuestions.filter(q => 
        todayIncorrect.some(word => word.toLowerCase() === q.word.toLowerCase())
      );
      
      // 要復習上限を適用（0の場合は復習問題なし）
      reviewQuestions = studySettings.maxReviewCount > 0 
        ? incorrectQuestions.slice(0, studySettings.maxReviewCount)
        : [];
      
      const correctQuestions = filteredQuestions.filter(q => 
        !todayIncorrect.some(word => word.toLowerCase() === q.word.toLowerCase())
      );
      
      // 誤答問題を前に、正解済み問題を後ろに配置
      filteredQuestions = [...reviewQuestions, ...correctQuestions];
      
      if (reviewQuestions.length > 0) {
        console.log(`🔄 要復習問題: ${reviewQuestions.length}問（上限: ${studySettings.maxReviewCount}問）`);
      }
    }
    
    // 学習数上限を適用（適応的学習モードの有無に関わらず）
    const maxQuestions = studySettings.maxStudyCount;
    
    // 適応的学習モードが有効な場合、出題順を最適化
    if (adaptiveMode && filteredQuestions.length > 0) {
      filteredQuestions = selectAdaptiveQuestions(filteredQuestions, Math.min(maxQuestions, filteredQuestions.length));
    } else {
      // 通常モードでも学習数上限を適用
      filteredQuestions = filteredQuestions.slice(0, maxQuestions);
    }
    
    console.log(`📚 学習数: ${filteredQuestions.length}問（上限: ${studySettings.maxStudyCount}問）`);
    
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
      
      // セッション履歴に追加
      const wordProgress = loadProgress().wordProgress[currentQuestion.word];
      let status: 'correct' | 'incorrect' | 'review' | 'mastered' = isCorrect ? 'correct' : 'incorrect';
      
      // 定着判定
      if (wordProgress && wordProgress.masteryLevel === 'mastered') {
        status = 'mastered';
      } else if (!isCorrect && wordProgress && wordProgress.incorrectCount >= 2) {
        // 2回以上間違えた場合は要復習
        status = 'review';
      }
      
      addSessionHistory({
        status,
        word: currentQuestion.word,
        timestamp: Date.now()
      }, 'translation');
      
      // 言語学的関連性AI: 学習した単語を記録
      recentlyStudiedWordsRef.current.push(currentQuestion.word);
      // 最新10件のみ保持
      if (recentlyStudiedWordsRef.current.length > 10) {
        recentlyStudiedWordsRef.current = recentlyStudiedWordsRef.current.slice(-10);
      }
      
      // 間隔反復スケジューラー: 回答履歴を記録
      recentAnswersRef.current.push({
        word: currentQuestion.word,
        wasCorrect: isCorrect,
        timestamp: Date.now()
      });
      
      // 最新20件のみ保持（メモリ節約）
      if (recentAnswersRef.current.length > 20) {
        recentAnswersRef.current = recentAnswersRef.current.slice(-20);
      }
      
      // スケジュールを生成
      const progress = loadProgress();
      spacedRepetitionScheduleRef.current = generateSpacedRepetitionSchedule(
        recentAnswersRef.current,
        progress.wordProgress,
        quizState.currentIndex,
        quizState.questions.length
      );
      
      // AI学習メッセージ（デバッグ用）
      if (spacedRepetitionScheduleRef.current.length > 0) {
        const latestSchedule = spacedRepetitionScheduleRef.current[spacedRepetitionScheduleRef.current.length - 1];
        const retention = calculateMemoryRetention(currentQuestion.word, progress.wordProgress[currentQuestion.word]);
        console.log(`🧠 AI学習: ${currentQuestion.word} - 定着度${retention.retentionScore.toFixed(1)}% - ${latestSchedule.reason} (${latestSchedule.nextQuestionIndex - quizState.currentIndex}問後に再出題)`);
      }
      
      // AI学習アシスタント: スキップした単語の検証
      const skipWordProgress = progress.wordProgress[currentQuestion.word];
      
      if (skipWordProgress && skipWordProgress.skippedCount && skipWordProgress.skippedCount > 0) {
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
      
      // 自動で次へ進む機能を無効化（ユーザーが解答を確認できるように）
      // autoAdvanceが有効でも、解答表示を確認してから手動で次へ進む
      
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
          長文読解
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
