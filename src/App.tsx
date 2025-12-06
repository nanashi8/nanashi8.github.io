import { useState, useEffect, useRef } from 'react';
import { QuizState, QuestionSet, Question } from './types';
import {
  parseCSV,
  saveQuestionSets,
  generateId,
  selectAdaptiveQuestions,
  classifyPhraseType,
} from './utils';
import { addQuizResult, updateWordProgress, filterSkippedWords, getTodayIncorrectWords, loadProgress, addSessionHistory, getStudySettings, recordWordSkip, updateProgressCache, recordConfusion, getConfusedWords } from './progressStorage';
import { addToSkipGroup, handleSkippedWordIncorrect, handleSkippedWordCorrect } from './learningAssistant';
import {
  analyzeRadarChart,
  prioritizeWeakCategoryQuestions,
  saveImprovementProgress,
  updateImprovementProgress,
  getImprovementProgress
} from './radarChartAI';
import {
  analyzeLearningHistory,
  calculateQuestionPriorities,
  planConsolidationSequence,
  WordLearningHistory,
  LearningAttempt
} from './learningCurveAI';
import {
  calculateCognitiveLoad,
  adjustDifficultyByCognitiveLoad,
  generateFatigueMessage,
  CognitiveLoadMonitor,
  SessionResponse
} from './cognitiveLoadAI';
import {
  analyzeErrorPatterns,
  batchPredictErrors,
  ErrorPrediction,
  ErrorAnalysis
} from './errorPredictionAI';
import {
  generateContextualSequence
} from './contextualLearningAI';
import {
  recordSessionStats,
  saveSessionToHistory,
  loadSessionHistory,
  generateLearningStyleProfile,
  generateRecommendationMessage,
  getTimeOfDay as getTimeOfDayStyle
} from './learningStyleAI';
import {
  processSessionEnd,
  getMotivationalMessage
} from './gamificationAI';
import QuizView from './components/QuizView';
import SpellingView from './components/SpellingView';
import ComprehensiveReadingView from './components/ComprehensiveReadingView';
import GrammarQuizView from './components/GrammarQuizView';
import DictionaryView from './components/DictionaryView';
import StatsView from './components/StatsView';
import SettingsView from './components/SettingsView';
import './App.css';

// IndexedDB移行関連
import { migrateToIndexedDB } from './dataMigration';
import { initStorageStrategy } from './storageManager';

type Tab = 'translation' | 'spelling' | 'grammar' | 'reading' | 'dictionary' | 'stats' | 'settings';
export type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type WordPhraseFilter = 'all' | 'words-only' | 'phrases-only';
export type PhraseTypeFilter = 'all' | 'phrasal-verb' | 'idiom' | 'collocation' | 'other';
export type DataSource = 'all' | 'junior' | 'intermediate';

// 10個の正式カテゴリ（docs/19-junior-high-vocabulary.md参照）
export const OFFICIAL_CATEGORIES = [
  '言語基本',
  '学校・学習',
  '日常生活',
  '人・社会',
  '自然・環境',
  '食・健康',
  '運動・娯楽',
  '場所・移動',
  '時間・数量',
  '科学・技術',
] as const;

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
      loadProgress();
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

  // テスト用モジュール（開発環境のみ）
  useEffect(() => {
    // 開発環境かどうかをチェック（本番では無効化）
    const isDevelopment = !window.location.hostname.includes('github.io');
    if (isDevelopment) {
      import('./tests/scoreBoardTests').then(() => {
        console.log('✅ スコアボードテストモジュールを読み込みました');
        console.log('   使い方: window.runScoreBoardTests()');
        console.log('   または: window.checkCurrentScoreBoardDisplay("translation")');
      }).catch(err => {
        console.error('テストモジュールの読み込みエラー:', err);
      });
    }
  }, []);
  
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
  
  // データソース選択
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>(() => {
    const saved = localStorage.getItem('selectedDataSource');
    return (saved as DataSource) || 'all';
  });
  
  // 問題集リスト管理（後方互換性のため残す）
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  
  // 適応的学習モード
  const [adaptiveMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('quiz-adaptive-mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // 要復習集中モード（補修モード）
  const [reviewFocusMode, setReviewFocusMode] = useState<boolean>(false);
  const [reviewQuestionPool, setReviewQuestionPool] = useState<Question[]>([]); // 補修モード用の問題プール
  const [reviewCorrectStreak, setReviewCorrectStreak] = useState<Map<string, number>>(new Map()); // 補修モードの連続正解数
  
  // セッション統計（和訳タブ用）
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    review: 0,
    mastered: 0,
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
  
  // 学習曲線 AI: セッション内の進捗を追跡
  const sessionQuestionIndexRef = useRef<number>(0);
  
  // 認知負荷 AI: セッション内の応答を追跡
  const sessionResponsesRef = useRef<SessionResponse[]>([]);
  const cognitiveLoadRef = useRef<CognitiveLoadMonitor | null>(null);
  
  // エラー予測 AI: 誤答パターンと予測結果を追跡
  const errorAnalysisRef = useRef<ErrorAnalysis | null>(null);
  const errorPredictionsRef = useRef<Map<string, ErrorPrediction>>(new Map());
  const recentAnswersRef = useRef<Array<{ word: string; wasCorrect: boolean; userAnswer?: string }>>([]);
  
  // 言語学的関連性追跡用(最近学習した単語を記録)
  const recentlyStudiedWordsRef = useRef<string[]>([]);
  
  // 設定
  const [autoAdvance] = useState<boolean>(() => {
    const saved = localStorage.getItem('quiz-auto-advance');
    return saved ? JSON.parse(saved) : false;
  });

  const [autoAdvanceDelay] = useState<number>(() => {
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
        // IndexedDB移行を実行（初回のみ）
        console.log('🔄 データ移行チェック中...');
        try {
          await migrateToIndexedDB();
        } catch (migrationError) {
          console.error('Migration error (continuing):', migrationError);
        }
        
        // ストレージ戦略を初期化
        initStorageStrategy();
        
        // 進捗データを明示的にロード・初期化
        let progressLoaded = false;
        try {
          const progress = await loadProgress();
          // データ検証
          if (progress && progress.wordProgress && progress.statistics && progress.questionSetStats) {
            updateProgressCache(progress);
            console.log('✅ Progress data loaded successfully');
            progressLoaded = true;
          } else {
            console.warn('⚠️ Progress data incomplete, reinitializing');
          }
        } catch (progressError) {
          console.error('Progress load error:', progressError);
        }
        
        // ロード失敗または不完全な場合は初期化
        if (!progressLoaded) {
          console.log('🔧 Initializing fresh progress data');
          const initialProgress = {
            results: [],
            statistics: {
              totalQuizzes: 0,
              totalQuestions: 0,
              totalCorrect: 0,
              averageScore: 0,
              bestScore: 0,
              streakDays: 0,
              lastStudyDate: 0,
              studyDates: [],
            },
            questionSetStats: {},
            wordProgress: {},
          };
          updateProgressCache(initialProgress);
          // LocalStorageにも保存
          try {
            localStorage.setItem('progress-data', JSON.stringify(initialProgress));
          } catch (e) {
            console.warn('Failed to save initial progress:', e);
          }
        }
        
        // LocalStorageサイズの確認
        checkLocalStorageSize();
        
        // 高校受験単語データを読み込み
        const juniorWordsResponse = await fetch('/data/vocabulary/junior-high-entrance-words.csv');
        const juniorWordsText = await juniorWordsResponse.text();
        const juniorWordsQuestions = parseCSV(juniorWordsText).map(q => ({ ...q, source: 'junior' as const }));
        
        // 高校受験熟語データを読み込み
        let juniorPhrasesQuestions: Question[] = [];
        try {
          const juniorPhrasesResponse = await fetch('/data/vocabulary/junior-high-entrance-phrases.csv');
          const juniorPhrasesText = await juniorPhrasesResponse.text();
          juniorPhrasesQuestions = parseCSV(juniorPhrasesText).map(q => ({ ...q, source: 'junior' as const }));
          console.log(`📚 高校受験英熟語を読み込みました: ${juniorPhrasesQuestions.length}個`);
        } catch (error) {
          console.warn('高校受験英熟語データの読み込みに失敗:', error);
        }
        
        // 中級1800単語データを読み込み
        let intermediateWordsQuestions: Question[] = [];
        try {
          const intermediateWordsResponse = await fetch('/data/vocabulary/intermediate-1800-words.csv');
          const intermediateWordsText = await intermediateWordsResponse.text();
          intermediateWordsQuestions = parseCSV(intermediateWordsText).map(q => ({ ...q, source: 'intermediate' as const }));
          console.log(`📚 中級1800単語を読み込みました: ${intermediateWordsQuestions.length}個`);
        } catch (error) {
          console.warn('中級1800単語データの読み込みに失敗:', error);
        }
        
        // 中級1800熟語データを読み込み
        let intermediatePhrasesQuestions: Question[] = [];
        try {
          const intermediatePhrasesResponse = await fetch('/data/vocabulary/intermediate-1800-phrases.csv');
          const intermediatePhrasesText = await intermediatePhrasesResponse.text();
          intermediatePhrasesQuestions = parseCSV(intermediatePhrasesText).map(q => ({ ...q, source: 'intermediate' as const }));
          console.log(`📚 中級1800熟語を読み込みました: ${intermediatePhrasesQuestions.length}個`);
        } catch (error) {
          console.warn('中級1800熟語データの読み込みに失敗:', error);
        }
        
        // 並び替え問題・文法問題のJSONファイルを読み込んでUnit情報を取得
        const unitTitleMap = new Map<string, string>();
        try {
          // 各学年の並び替え問題を読み込み
          for (const grade of [1, 2, 3]) {
            try {
              const response = await fetch(`/data/sentence-ordering-grade${grade}.json`);
              const data = await response.json();
              if (data.units) {
                data.units.forEach((unit: { unit: string; title: string }) => {
                  // カテゴリ文字列は `"1年 Unit 0"` などの形式で来るため、
                  // keyも同じフォーマットに合わせて保存する（ハイフン->スペース）
                  const key = `${grade}年 ${unit.unit}`;
                  unitTitleMap.set(unit.unit, `${unit.unit}: ${unit.title}`);
                  unitTitleMap.set(key, `${grade}年 ${unit.unit}: ${unit.title}`);
                });
              }
            } catch (err) {
              console.warn(`Grade ${grade} sentence ordering data not found:`, err);
            }
          }
        } catch (error) {
          console.warn('Unit title mapping failed:', error);
        }
        
        // 全データソースを統合
        const allQuestions = [
          ...juniorWordsQuestions,
          ...juniorPhrasesQuestions,
          ...intermediateWordsQuestions,
          ...intermediatePhrasesQuestions
        ];
        
        if (allQuestions.length > 0) {
          setAllQuestions(allQuestions);
          
          // 難易度別リセット機能のために、全問題のキャッシュを保存
          try {
            const questionsCache = allQuestions.map(q => ({
              word: q.word,
              difficulty: q.difficulty || 'beginner'
            }));
            localStorage.setItem('all-questions-cache', JSON.stringify(questionsCache));
          } catch (e) {
            console.warn('Questions cache save failed:', e);
          }
          
          // 関連分野のリストを抽出
          const categories = Array.from(new Set(allQuestions.map(q => q.category || '').filter(c => c)));
          
          // カテゴリ名をタイトル付きに変換
          const categoriesWithTitles = categories.map(cat => {
            // unitTitleMapにマッピングがあれば使用
            if (unitTitleMap.has(cat)) {
              return unitTitleMap.get(cat)!;
            }
            // マッピングがない場合はそのまま
            return cat;
          });
          
          // カテゴリを学年別・学習順にソート
          const sortedCategories = categoriesWithTitles.sort((a, b) => {
            // 学年パターンを抽出 (例: "1年 Unit 0: ...")
            const gradeRegex = /(\d+)年\s+Unit\s+(\d+)/i;
            const matchA = a.match(gradeRegex);
            const matchB = b.match(gradeRegex);
            
            // 両方とも学年+Unit形式の場合
            if (matchA && matchB) {
              const gradeA = parseInt(matchA[1], 10);
              const gradeB = parseInt(matchB[1], 10);
              if (gradeA !== gradeB) {
                return gradeA - gradeB; // 学年順
              }
              const unitA = parseInt(matchA[2], 10);
              const unitB = parseInt(matchB[2], 10);
              return unitA - unitB; // ユニット順
            }
            
            // Unitパターンのみ (例: "Unit 0: ...")
            const unitRegex = /Unit\s+(\d+)/i;
            const unitMatchA = a.match(unitRegex);
            const unitMatchB = b.match(unitRegex);
            
            if (unitMatchA && unitMatchB) {
              const numA = parseInt(unitMatchA[1], 10);
              const numB = parseInt(unitMatchB[1], 10);
              return numA - numB;
            }
            
            // それ以外は辞書順
            return a.localeCompare(b, 'ja');
          });
          
          setCategoryList(sortedCategories);
          
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
  
  // データソース選択の保存
  useEffect(() => {
    localStorage.setItem('selectedDataSource', selectedDataSource);
  }, [selectedDataSource]);

  // 関連分野と難易度でフィルタリング
  const getFilteredQuestions = (): Question[] => {
    let filtered = allQuestions;
    
    // データソースでフィルター
    if (selectedDataSource !== 'all') {
      filtered = filtered.filter(q => (q as any).source === selectedDataSource);
    }
    
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
          return classifyPhraseType(q.word) === selectedPhraseTypeFilter;
        });
      }
    }
    
    // スキップされた単語を除外
    filtered = filterSkippedWords(filtered);
    
    return filtered;
  };

  // クイズ開始ハンドラー
  const handleStartQuiz = async () => {
    // ゲーミフィケーションAI: モチベーションメッセージ表示
    const motivationMsg = getMotivationalMessage();
    console.log('🎮 ゲーミフィケーション:', motivationMsg);

    // 学習設定を取得
    const studySettings = getStudySettings();
    
    let filteredQuestions = getFilteredQuestions();
    
    if (filteredQuestions.length === 0) {
      alert('指定された条件の問題が見つかりません');
      return;
    }
    
    // 要復習集中モード（補修モード）の場合、要復習問題のみに絞る
    if (reviewFocusMode) {
      const todayIncorrect = getTodayIncorrectWords();
      filteredQuestions = filteredQuestions.filter(q => 
        todayIncorrect.some(word => word.toLowerCase() === q.word.toLowerCase())
      );
      
      if (filteredQuestions.length === 0) {
        alert('要復習問題が見つかりません');
        setReviewFocusMode(false); // モードをリセット
        setReviewQuestionPool([]);
        return;
      }
      
      // 補修モード用の問題プールを設定（繰り返し出題用）
      setReviewQuestionPool([...filteredQuestions]);
      console.log(`🎯 補修モード開始: ${filteredQuestions.length}問を繰り返し出題`);
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
    // TODO: selectRelatedQuestions関数を実装する必要があります
    /*
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
    */
    
    // 当日の誤答単語を取得
    const todayIncorrect = getTodayIncorrectWords();
    
    // 混同された単語を取得（優先的に出題）
    const confusedWordsProgress = getConfusedWords(10);
    const confusedWords = confusedWordsProgress.map(wp => wp.word);
    
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
    
    // 混同された単語を優先的に出題（出題範囲内に含まれている場合）
    if (confusedWords.length > 0) {
      const confusedQuestions = filteredQuestions.filter(q =>
        confusedWords.some(word => word.toLowerCase() === q.word.toLowerCase())
      );
      
      if (confusedQuestions.length > 0) {
        const nonConfusedQuestions = filteredQuestions.filter(q =>
          !confusedWords.some(word => word.toLowerCase() === q.word.toLowerCase())
        );
        
        // 混同された単語を優先的に配置（要復習の次）
        filteredQuestions = [...confusedQuestions, ...nonConfusedQuestions];
        console.log(`🔗 混同履歴: ${confusedQuestions.length}問を優先出題`);
      }
    }
    
    // 学習曲線AI: 最適な出題順序を決定
    // NOTE: 出題数は学習中・要復習の上限で制御されるため、ここでは制限しない
    if (!reviewFocusMode && filteredQuestions.length > 0) {
      const progress = await loadProgress();
      
      // 学習履歴を構築
      const learningHistories = new Map<string, WordLearningHistory>();
      filteredQuestions.forEach(q => {
        const wp = progress.wordProgress[q.word];
        if (wp && wp.learningHistory && wp.learningHistory.length > 0) {
          // LearningAttempt形式に変換
          const attempts: LearningAttempt[] = wp.learningHistory.map(h => ({
            timestamp: h.timestamp,
            wasCorrect: h.wasCorrect,
            responseTime: h.responseTime,
            userAnswer: h.userAnswer,
            confidenceLevel: h.responseTime < 2000 ? 'instant' : h.responseTime < 5000 ? 'hesitant' : 'guessed',
            sessionContext: {
              questionIndex: h.sessionIndex || 0,
              previousQuestions: [],
              sessionFatigue: 0
            }
          }));
          
          const history = analyzeLearningHistory(q.word, wp, attempts);
          learningHistories.set(q.word, history);
        }
      });
      
      // 学習曲線AIで優先度を計算
      const priorities = calculateQuestionPriorities(
        filteredQuestions,
        progress.wordProgress,
        learningHistories
      );
      
      // 定着転換戦略を適用（苦手な単語を戦略的に配置）
      const optimizedSequence = planConsolidationSequence(priorities, filteredQuestions.length);
      
      // 認知負荷AIで優先度を調整
      const currentLoad = calculateCognitiveLoad(sessionResponsesRef.current, quizStartTimeRef.current);
      cognitiveLoadRef.current = currentLoad;
      
      const adjustedSequence = adjustDifficultyByCognitiveLoad(
        optimizedSequence,
        currentLoad
      );
      
      // 優先度順に並べ替え
      const wordToPriority = new Map(adjustedSequence.map(p => [p.word, p]));
      filteredQuestions = filteredQuestions
        .filter(q => wordToPriority.has(q.word))
        .sort((a, b) => {
          const priorityA = wordToPriority.get(a.word)!.priority;
          const priorityB = wordToPriority.get(b.word)!.priority;
          return priorityB - priorityA;
        });
      
      console.log('🧠 学習曲線AI: 最適な出題順序を決定');
      console.log('  出題戦略:', adjustedSequence.slice(0, 5).map(p => 
        `${p.word}(${p.strategy}, 成功率${p.estimatedSuccessRate.toFixed(0)}%)`
      ).join(', '));
      
      // 認知負荷メッセージを表示
      if (currentLoad.fatigueLevel > 40) {
        const message = generateFatigueMessage(currentLoad);
        console.log(`⚡ 認知負荷: ${currentLoad.fatigueLevel.toFixed(0)}% - ${message}`);
      }
      
      // 文脈学習AI: 意味的に関連する単語を近くに配置
      const contextualSeq = generateContextualSequence(
        filteredQuestions,
        progress.wordProgress,
        recentlyStudiedWordsRef.current
      );
      
      // 文脈ベースの順序に並べ替え（優先度は維持）
      const contextualOrder = new Map<string, number>();
      contextualSeq.sequence.forEach((word, index) => {
        contextualOrder.set(word, index);
      });
      
      filteredQuestions = filteredQuestions.sort((a, b) => {
        const orderA = contextualOrder.get(a.word) ?? 999;
        const orderB = contextualOrder.get(b.word) ?? 999;
        return orderA - orderB;
      });
      
      console.log('🔗 文脈学習AI: 意味的クラスタリング完了');
      console.log(`  クラスター数: ${contextualSeq.clusters.length}`);
      if (contextualSeq.transitions.length > 0) {
        const sample = contextualSeq.transitions[0];
        console.log(`  例: ${sample.from} → ${sample.to} (${sample.reason})`);
      }
    }
    // NOTE: 学習曲線AI+文脈学習AIが上記のifブロックで実行されるため、
    // 従来の適応的学習(selectAdaptiveQuestions)は使用されない
    
    if (reviewFocusMode) {
      console.log(`🎯 補修モード: ${filteredQuestions.length}問を繰り返し出題中`);
    } else {
      console.log(`📚 学習数: ${filteredQuestions.length}問`);
    }
    
    setQuizState({
      questions: filteredQuestions,
      currentIndex: 0,
      score: 0,
      totalAnswered: 0,
      answered: false,
      selectedAnswer: null,
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
    questionStartTimeRef.current = Date.now();
    incorrectWordsRef.current = [];
    
    // 認知負荷AIのセッション応答をリセット
    sessionResponsesRef.current = [];
    cognitiveLoadRef.current = null;
    
    // エラー予測AI: セッション開始時にエラーパターンを分析
    const progress = await loadProgress();
    const errorAnalysis = analyzeErrorPatterns(
      progress.wordProgress,
      recentAnswersRef.current
    );
    errorAnalysisRef.current = errorAnalysis;
    
    // 全問題のエラーリスクを事前予測
    const words = filteredQuestions.map(q => q.word);
    const currentFatigue = (cognitiveLoadRef.current as CognitiveLoadMonitor | null)?.fatigueLevel ?? 0;
    const predictions = batchPredictErrors(
      words,
      progress.wordProgress,
      errorAnalysis,
      currentFatigue,
      0 // 開始時は直近エラー数0
    );
    errorPredictionsRef.current = predictions;
    
    console.log('🔮 エラー予測AI: 誤答リスク分析完了');
    const highRisk = Array.from(predictions.values())
      .filter(p => p.warningLevel === 'high' || p.warningLevel === 'critical')
      .sort((a, b) => b.errorRisk - a.errorRisk);
    if (highRisk.length > 0) {
      console.log(`  高リスク問題: ${highRisk.length}問`);
      console.log(`  最高リスク: ${highRisk[0].word} (${highRisk[0].errorRisk.toFixed(0)}% - ${highRisk[0].primaryPattern})`);
    }
  };

  // 要復習集中モード（補修モード）切り替えハンドラー
  const handleReviewFocus = () => {
    setReviewFocusMode(true);
    setReviewCorrectStreak(new Map()); // 連続正解数をリセット
    handleStartQuiz();
  };
  
  // スペルタブ用の補修モードハンドラー
  const handleSpellingReviewFocus = () => {
    setReviewFocusMode(true);
    setReviewCorrectStreak(new Map()); // 連続正解数をリセット
    handleStartQuiz();
  };

  // 関連分野変更ハンドラー
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // 補修モードを解除
    setReviewFocusMode(false);
    setReviewQuestionPool([]);
    // フィルター変更時にクイズを再開（既に開始している場合）
    if (quizState.questions.length > 0) {
      handleStartQuiz();
    }
  };

  // 難易度変更ハンドラー
  const handleDifficultyChange = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    // 補修モードを解除
    setReviewFocusMode(false);
    setReviewQuestionPool([]);
    // フィルター変更時にクイズを再開（既に開始している場合）
    if (quizState.questions.length > 0) {
      handleStartQuiz();
    }
  };

  const handleAnswer = async (answer: string, correct: string, selectedQuestion?: Question | null) => {
    if (quizState.answered) return;

    // 「分からない」を選択した場合は不正解扱い
    const isDontKnow = answer === '分からない';
    
    // 安全な比較のため、両者をtrim()で正規化
    const normalizedAnswer = answer.trim();
    const normalizedCorrect = correct.trim();
    const isCorrect = !isDontKnow && normalizedAnswer === normalizedCorrect;
    const currentQuestion = quizState.questions[quizState.currentIndex];
    
    // 不正解時、選択した選択肢の単語を「混同した単語」として記録
    if (!isCorrect && selectedQuestion && selectedQuestion.word) {
      await recordConfusion(selectedQuestion.word, currentQuestion.word);
      console.log(`🔗 混同を記録: ${selectedQuestion.word} ← ${currentQuestion.word}`);
    }
    
    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // 認知負荷AI: セッション応答を記録
    if (currentQuestion) {
      const progress = await loadProgress();
      const wordProgress = progress.wordProgress?.[currentQuestion.word];
      
      // 問題の難易度を推定（成功率の逆数）
      const successRate = wordProgress 
        ? (wordProgress.correctCount / (wordProgress.correctCount + wordProgress.incorrectCount)) 
        : 0.5;
      const difficulty = 1 - successRate;
      
      sessionResponsesRef.current.push({
        timestamp: Date.now(),
        wasCorrect: isCorrect,
        responseTime,
        questionDifficulty: difficulty
      });
      
      // 認知負荷を計算して更新
      const currentLoad = calculateCognitiveLoad(sessionResponsesRef.current, quizStartTimeRef.current);
      cognitiveLoadRef.current = currentLoad;
      
      // 休憩推奨をチェック
      if (currentLoad.breakRecommendation?.shouldBreak) {
        console.log(`💤 休憩推奨: ${currentLoad.breakRecommendation.reason}`);
      }
      
      // エラー予測AI: 回答を記録
      recentAnswersRef.current.push({
        word: currentQuestion.word,
        wasCorrect: isCorrect,
        userAnswer: normalizedAnswer
      });
      // 最新50件のみ保持
      if (recentAnswersRef.current.length > 50) {
        recentAnswersRef.current = recentAnswersRef.current.slice(-50);
      }
    }
    
    // 単語進捗を更新
    if (currentQuestion) {
      await updateWordProgress(currentQuestion.word, isCorrect, responseTime, undefined, 'translation');
      
      // セッション履歴に追加
      const progress = await loadProgress();
      const wordProgress = progress.wordProgress?.[currentQuestion.word];
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
      }, 'translation');
      
      // 言語学的関連性AI: 学習した単語を記録
      recentlyStudiedWordsRef.current.push(currentQuestion.word);
      // 最新10件のみ保持
      if (recentlyStudiedWordsRef.current.length > 10) {
        recentlyStudiedWordsRef.current = recentlyStudiedWordsRef.current.slice(-10);
      }
      
      // 学習曲線 AI: 試行記録を追加（progressStorageで自動記録される）
      sessionQuestionIndexRef.current++;
      
      // AI学習アシスタント: スキップした単語の検証
      const currentProgress = await loadProgress();
      const skipWordProgress = currentProgress.wordProgress?.[currentQuestion.word];
      
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
      
      // 補修モード: 連続正解数を更新
      if (reviewFocusMode) {
        const newStreak = new Map(reviewCorrectStreak);
        if (isCorrect) {
          const currentStreak = newStreak.get(currentQuestion.word) || 0;
          newStreak.set(currentQuestion.word, currentStreak + 1);
          
          // 2回連続正解したら問題プールから除外
          if (currentStreak + 1 >= 2) {
            const newPool = reviewQuestionPool.filter(q => q.word !== currentQuestion.word);
            setReviewQuestionPool(newPool);
            console.log(`✅ ${currentQuestion.word} を補修対象から除外 (2回連続正解)`);
            
            // 問題プールが空になったら補修モード終了
            if (newPool.length === 0) {
              alert('🎉 すべての要復習問題をクリアしました！');
              setReviewFocusMode(false);
              setReviewCorrectStreak(new Map());
            }
          }
        } else {
          // 不正解の場合はリセット
          newStreak.set(currentQuestion.word, 0);
        }
        setReviewCorrectStreak(newStreak);
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
      
      return newState;
    });
  };

  const handleNext = () => {
    setQuizState((prev) => {
      // 補修モードの場合、問題プールを使用
      const currentQuestions = reviewFocusMode ? reviewQuestionPool : prev.questions;
      const nextIndex = prev.currentIndex + 1;
      
      // セッション終了を検出（最終問題の後）
      if (!reviewFocusMode && nextIndex >= currentQuestions.length) {
        // 学習スタイルAI: セッション統計を記録
        const sessionEndTime = Date.now();
        const totalResponseTime = sessionResponsesRef.current.reduce((sum, r) => sum + r.responseTime, 0);
        const avgResponseTime = sessionResponsesRef.current.length > 0 
          ? totalResponseTime / sessionResponsesRef.current.length 
          : 0;
        
        const currentFatigue = (cognitiveLoadRef.current as CognitiveLoadMonitor | null)?.fatigueLevel ?? 0;
        
        const newSessionStats = recordSessionStats(
          quizStartTimeRef.current,
          sessionEndTime,
          prev.totalAnswered,
          prev.score,
          avgResponseTime,
          currentFatigue,
          sessionStats.correct + sessionStats.mastered,
          sessionStats.review
        );
        
        saveSessionToHistory(newSessionStats);
        
        // プロファイル生成と推奨メッセージ
        const history = loadSessionHistory();
        if (history.length >= 3) {
          const profile = generateLearningStyleProfile('user', history);
          const currentTime = getTimeOfDayStyle();
          const message = generateRecommendationMessage(profile, currentTime);
          console.log('📊 学習スタイルAI:', message);
        }

        // ゲーミフィケーションAI: セッション終了処理
        const sessionDurationMinutes = (sessionEndTime - quizStartTimeRef.current) / (1000 * 60);
        const gamificationResult = processSessionEnd(
          prev.score,
          prev.totalAnswered,
          avgResponseTime,
          sessionDurationMinutes,
          sessionStats.correct + sessionStats.mastered,
          currentFatigue
        );

        // フィードバックメッセージをログ出力
        console.log('🎮 ゲーミフィケーション結果:');
        console.log(`  獲得XP: ${gamificationResult.xpGained}`);
        if (gamificationResult.leveledUp) {
          console.log(`  🎉 レベルアップ! Lv.${gamificationResult.newLevel}`);
        }
        gamificationResult.feedback.forEach(fb => {
          console.log(`  ${fb.icon} ${fb.message}`);
        });
      }
      
      // 補修モードの場合、最後の問題に到達したら最初に戻る
      if (reviewFocusMode && nextIndex >= currentQuestions.length) {
        console.log('🔄 補修モード: 問題を繰り返します');
        return {
          ...prev,
          questions: currentQuestions,
          currentIndex: 0,
          answered: false,
          selectedAnswer: null,
        };
      }
      
      return {
        ...prev,
        questions: currentQuestions,
        currentIndex: nextIndex % currentQuestions.length,
        answered: false,
        selectedAnswer: null,
      };
    });
    
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
  const handleSkip = async () => {
    const currentQuestion = quizState.questions[quizState.currentIndex];
    if (currentQuestion) {
      // 応答時間を計算
      const responseTime = Date.now() - questionStartTimeRef.current;
      
      // スキップ記録(30日間除外、AI学習アシスタントが後日検証)
      await recordWordSkip(currentQuestion.word, 30);
      
      // AI学習アシスタント: スキップグループに追加
      addToSkipGroup(currentQuestion.word);
      
      // 単語進捗を更新（正解として記録し、定着率をカウント）
      await updateWordProgress(currentQuestion.word, true, responseTime, undefined, 'translation');
      
      // スキップでもスコアボードに反映(正解扱い)
      setQuizState((prev) => ({
        ...prev,
        score: prev.score + 1,
        totalAnswered: prev.totalAnswered + 1,
        currentIndex: (prev.currentIndex + 1) % prev.questions.length,
        answered: false,
        selectedAnswer: null,
      }));
      
      // セッション統計を更新（正解扱い）
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        mastered: prev.mastered + 1, // スキップは定着扱い
      }));
      
      // セッション履歴に記録
      addSessionHistory({
        status: 'correct',
        word: currentQuestion.word,
        timestamp: Date.now()
      }, 'translation');
      
      // 回答を記録
      await addQuizResult({
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
      updateWordProgress(currentQuestion.word, quizState.selectedAnswer === currentQuestion.meaning, responseTime, rating, 'translation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* タブメニュー - 中学生向け親しみやすいデザイン */}
      <div className="flex gap-0 bg-gray-100 dark:bg-gray-900 shadow-md py-2">
        <button
          className={`flex-1 py-4 px-3 text-base font-semibold transition-all duration-200 border-b-4 ${
            activeTab === 'translation'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-transparent hover:bg-blue-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('translation')}
        >
          📝 和訳
        </button>
        <button
          className={`flex-1 py-4 px-3 text-base font-semibold transition-all duration-200 border-b-4 ${
            activeTab === 'spelling'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-transparent hover:bg-blue-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('spelling')}
        >
          ✏️ スペル
        </button>
        <button
          className={`flex-1 py-4 px-3 text-base font-semibold transition-all duration-200 border-b-4 ${
            activeTab === 'grammar'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-transparent hover:bg-blue-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('grammar')}
        >
          📚 文法
        </button>
        <button
          className={`flex-1 py-4 px-3 text-base font-semibold transition-all duration-200 border-b-4 ${
            activeTab === 'reading'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-transparent hover:bg-blue-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('reading')}
        >
          📖 長文
        </button>
        <button
          className={`flex-1 py-4 px-3 text-base font-semibold transition-all duration-200 border-b-4 ${
            activeTab === 'dictionary'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-transparent hover:bg-blue-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('dictionary')}
        >
          📕 辞書
        </button>
        <button
          className={`flex-1 py-4 px-3 text-base font-semibold transition-all duration-200 border-b-4 ${
            activeTab === 'stats'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-transparent hover:bg-blue-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          📊 成績
        </button>
        <button
          className={`flex-1 py-4 px-3 text-base font-semibold transition-all duration-200 border-b-4 ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-transparent hover:bg-blue-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 設定
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-black">
        {activeTab === 'translation' ? (
          <QuizView
            quizState={quizState}
            _categoryList={categoryList}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            selectedWordPhraseFilter={selectedWordPhraseFilter}
            onWordPhraseFilterChange={setSelectedWordPhraseFilter}
            selectedPhraseTypeFilter={selectedPhraseTypeFilter}
            onPhraseTypeFilterChange={setSelectedPhraseTypeFilter}
            selectedDataSource={selectedDataSource}
            onDataSourceChange={setSelectedDataSource}
            onStartQuiz={handleStartQuiz}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onDifficultyRate={handleDifficultyRate}
            onReviewFocus={handleReviewFocus}
            sessionStats={sessionStats}
            isReviewFocusMode={reviewFocusMode}
            errorPrediction={quizState.questions.length > 0 && quizState.currentIndex < quizState.questions.length
              ? errorPredictionsRef.current.get(quizState.questions[quizState.currentIndex].word)
              : undefined}
          />
        ) : activeTab === 'spelling' ? (
          <SpellingView
            questions={quizState.questions}
            _categoryList={categoryList}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            selectedWordPhraseFilter={selectedWordPhraseFilter}
            onWordPhraseFilterChange={setSelectedWordPhraseFilter}
            selectedPhraseTypeFilter={selectedPhraseTypeFilter}
            onPhraseTypeFilterChange={setSelectedPhraseTypeFilter}
            selectedDataSource={selectedDataSource}
            onDataSourceChange={setSelectedDataSource}
            onStartQuiz={handleStartQuiz}
            onReviewFocus={handleSpellingReviewFocus}
            isReviewFocusMode={reviewFocusMode}
          />
        ) : activeTab === 'reading' ? (
          <ComprehensiveReadingView 
            onSaveUnknownWords={(words) => {
              // 分からない単語を問題集として保存
              if (words.length === 0) return;
              
              // デフォルトの問題集名を生成（日時付き）
              const now = new Date();
              const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
              const defaultName = `長文単語集 (${dateStr})`;
              
              const setName = prompt(`${words.length}個の単語が選択されています。\n問題集の名前を入力してください:`, defaultName);
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
                alert(`問題集「${setName}」を保存しました！\n和訳・スペルタブで利用できます。`);
              }
            }}
          />
        ) : activeTab === 'grammar' ? (
          <GrammarQuizView />
        ) : activeTab === 'dictionary' ? (
          <DictionaryView />
        ) : activeTab === 'stats' ? (
          <StatsView
            questionSets={questionSets}
            allQuestions={allQuestions}
            categoryList={categoryList}
            onResetComplete={() => setActiveTab('stats')}
          />
        ) : (
          <SettingsView
            allQuestions={allQuestions}
            _selectedDataSource={selectedDataSource}
            _onDataSourceChange={setSelectedDataSource}
            onStartSession={(_mode, questions) => {
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
