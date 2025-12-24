import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Question, MemorizationCardState, MemorizationBehavior, QuestionSet } from '../types';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';
import {
  getMemorizationCardSettings,
  saveMemorizationCardSettings,
  recordMemorizationBehavior,
  getMemorizationSettings,
  saveMemorizationSettings,
  loadProgress,
  updateWordProgress,
  calculateSessionStats,
} from '../progressStorage';
import { speakEnglish, isSpeechSynthesisSupported } from '@/features/speech/speechSynthesis';
import { logger } from '@/utils/logger';
import ScoreBoard from './ScoreBoard';
import AddToCustomButton from './AddToCustomButton';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';
import { useAdaptiveNetwork } from '../hooks/useAdaptiveNetwork';
import { QuestionCategory } from '../strategies/memoryAcquisitionAlgorithm';
// import { sortQuestionsByPriority as sortByPriorityCommon } from '../utils/questionPrioritySorter'; // QuestionSchedulerに統合済み
import { useQuestionRequeue } from '../hooks/useQuestionRequeue';
import { QuestionScheduler } from '@/ai/scheduler';
import { determineWordPosition, positionToCategory } from '@/ai/utils/categoryDetermination';
import { loadProgressSync } from '@/storage/progress/progressStorage';
import type { AIAnalysisInput, SessionStats as AISessionStats } from '@/ai/types';
import { PerformanceMonitor } from '@/utils/performance-monitor';
import { QualityMonitor } from '@/utils/quality-monitor';
import { RequeuingDebugPanel } from './RequeuingDebugPanel';
// A/Bテストログ
import { createSessionId, getOrCreateAnonymousUserId } from '@/metrics/ab/identity';
import { assignVariant } from '@/metrics/ab/variant';
import type { SessionLog } from '@/metrics/ab/types';
import {
  captureMasteredSet,
  calculateAcquiredWords,
  calculateAcquisitionRate,
  calculateUniqueWordCount,
  extractWordList,
} from '@/metrics/ab/snapshot';
import { appendSessionLog } from '@/metrics/ab/storage';
import {
  evaluateVibrationScore,
  updateConsecutiveCritical,
  logVibrationScore,
} from '@/metrics/ab/vibrationGuard';
import {
  detectAIPositionDivergence,
  updateConsecutiveDivergence,
  logDivergence,
} from '@/metrics/ab/divergenceGuard';

interface MemorizationViewProps {
  allQuestions: Question[];
  questionSets: QuestionSet[];
  customQuestionSets?: CustomQuestionSet[];
  onAddWordToCustomSet?: (setId: string, word: CustomWord) => void;
  onRemoveWordFromCustomSet?: (setId: string, word: CustomWord) => void;
  onOpenCustomSetManagement?: () => void;
}

function MemorizationView({
  allQuestions,
  questionSets: _questionSets, // 将来の拡張のため引数として残すが現在未使用
  customQuestionSets = [],
  onAddWordToCustomSet,
  onRemoveWordFromCustomSet,
  onOpenCustomSetManagement,
}: MemorizationViewProps) {
  // 学習設定
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedWordPhraseFilter, setSelectedWordPhraseFilter] = useState<string>('all');

  // 学習上限設定（LocalStorageから読み込み）
  const [stillLearningLimit, setStillLearningLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem('memorization-still-learning-limit');
    return saved ? parseInt(saved) : null;
  });

  const [incorrectLimit, setIncorrectLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem('memorization-incorrect-limit');
    return saved ? parseInt(saved) : null;
  });

  // カード表示設定（永続化）
  const [cardState, setCardState] = useState<MemorizationCardState>({
    showWord: true,
    showMeaning: true,
    showPronunciation: false,
    showExample: false,
    showEtymology: false,
    showRelated: false,
  });

  // 音声設定
  const [autoVoice, setAutoVoice] = useState(false);
  const [voiceWord, setVoiceWord] = useState(true); // 語句を読み上げ
  const [voiceMeaning, setVoiceMeaning] = useState(false); // 意味も読み上げ
  const [voiceDelay, setVoiceDelay] = useState(1.5); // 語句と意味の間の待機時間（秒）

  // 現在表示中の語句
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);

  // セッション管理
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [consecutiveViews, setConsecutiveViews] = useState(0);

  // A/Bテストセッション管理
  const [abSessionId] = useState(() => createSessionId());
  const [abVariant] = useState(() => assignVariant(abSessionId));
  const [abSessionStartedAt] = useState(() => Date.now());
  const [abStartMasteredWords, setAbStartMasteredWords] = useState<string[]>([]);
  const [abQuestionWords, setAbQuestionWords] = useState<string[]>([]);
  const [abVibrationScore, setAbVibrationScore] = useState<number>(0);
  const [abConsecutiveCritical, setAbConsecutiveCritical] = useState<number>(0);
  const [abFallbackApplied, setAbFallbackApplied] = useState<boolean>(false);
  const [abConsecutiveDivergence, setAbConsecutiveDivergence] = useState<number>(0);
  const [abMlEnabled, setAbMlEnabled] = useState<boolean>(() => {
    // ML有効化フラグ（localStorage設定から取得、デフォルトfalse）
    try {
      return localStorage.getItem('ab_ml_enabled') === 'true';
    } catch {
      return false;
    }
  });

  // 復習モード
  const [isReviewFocusMode, setIsReviewFocusMode] = useState(false);

  // セッション統計
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    still_learning: 0, // まだまだ
    incorrect: 0,
    mastered: 0, // 定着済み（覚えてる）
    total: 0,
    newQuestions: 0, // 新規問題の出題数
    reviewQuestions: 0, // 復習問題の出題数
    consecutiveNew: 0, // 連続新規出題カウント
    consecutiveReview: 0, // 連続復習出題カウント
  });

  // 回答時刻（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(0);

  // 再スケジューリングトリガー（カテゴリ変化時に更新）- 現在未使用だが将来の拡張のため残す
  const [_rescheduleCounter, _setRescheduleCounter] = useState(0);

  // 🎯 自動再スケジューリング管理
  const [answerCountSinceSchedule, setAnswerCountSinceSchedule] = useState(0);
  const [needsRescheduling, setNeedsRescheduling] = useState(false);
  const [reschedulingNotification, setReschedulingNotification] = useState<string | null>(null);

  // 回答結果を追跡（動的AIコメント用）
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | undefined>(undefined);
  const [lastAnswerWord, setLastAnswerWord] = useState<string | undefined>(undefined);
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [incorrectStreak, setIncorrectStreak] = useState<number>(0);

  // 直前に回答した問題（連続出題防止用）
  const [_lastAnsweredQuestionId, setLastAnsweredQuestionId] = useState<string | null>(null);

  // 滞在時間計測
  const cardDisplayTimeRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // タッチ開始位置とカード要素のref
  const touchStartX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousQuestionId = useRef<string | null>(null); // 前回のカードID

  // 全画面表示モード
  const [isFullscreen, setIsFullscreen] = useState(false);

  // デバッグパネル表示
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 適応型学習フック（問題選択と記録に使用）
  const adaptiveLearning = useAdaptiveLearning(QuestionCategory.MEMORIZATION);

  // 適応的学習AIネットワーク（常時有効）
  const { processQuestion: processAdaptiveQuestion, currentStrategy } = useAdaptiveNetwork();

  // 統一問題スケジューラー（DTA + 振動防止 + メタAI統合）
  const [scheduler] = useState(() => {
    const s = new QuestionScheduler();
    // 🤖 Phase 2: AI統合を有効化（オプトイン）
    // 開発環境でAI統合をテストする場合はtrueに設定
    const enableAI =
      import.meta.env.DEV || localStorage.getItem('enable-ai-coordination') === 'true';
    if (enableAI) {
      s.enableAICoordination(true);
      logger.info('🤖 [MemorizationView] AI統合が有効化されました');
    }
    return s;
  });

  // 問題再出題管理フック
  const {
    reAddQuestion: _reAddQuestion,
    clearExpiredFlags,
    updateRequeueStats,
    getRequeuedWords,
    checkPositionMismatch,
  } = useQuestionRequeue<Question>();

  // ═══════════════════════════════════════════════════════════
  // 🚀 Phase 1 Pattern 3: 計算結果のメモ化拡大
  // ═══════════════════════════════════════════════════════════

  // カテゴリー別統計をメモ化（sessionStats変更時のみ再計算）
  const _categoryStats = useMemo(() => {
    PerformanceMonitor.start('calculate-category-stats');
    const stats = {
      incorrect: sessionStats.incorrect,
      still_learning: sessionStats.still_learning,
      correct: sessionStats.correct,
      mastered: sessionStats.mastered,
      total: sessionStats.total,
      incorrectRate: sessionStats.total > 0 ? sessionStats.incorrect / sessionStats.total : 0,
      correctRate: sessionStats.total > 0 ? sessionStats.correct / sessionStats.total : 0,
    };
    const duration = PerformanceMonitor.end('calculate-category-stats');

    if (import.meta.env.DEV && duration > 10) {
      console.log('📊 [MemorizationView] カテゴリー統計計算', {
        duration: `${duration.toFixed(2)}ms`,
        stats,
      });
    }

    return stats;
  }, [
    sessionStats.incorrect,
    sessionStats.still_learning,
    sessionStats.correct,
    sessionStats.mastered,
    sessionStats.total,
  ]);

  // 関連分野リストをメモ化（allQuestions変更時のみ再計算）
  const _availableCategories = useMemo(() => {
    PerformanceMonitor.start('get-available-categories');
    const categories = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.relatedFields && Array.isArray(q.relatedFields)) {
        q.relatedFields.forEach((field) => categories.add(field));
      }
    });
    const result = Array.from(categories).sort();
    const duration = PerformanceMonitor.end('get-available-categories');

    if (import.meta.env.DEV && duration > 10) {
      console.log('📂 [MemorizationView] カテゴリーリスト計算', {
        duration: `${duration.toFixed(2)}ms`,
        count: result.length,
      });
    }

    return result;
  }, [allQuestions]);

  // フィルター済み問題リストをメモ化
  const _filteredQuestions = useMemo(() => {
    PerformanceMonitor.start('filter-questions');

    let filtered = allQuestions;

    // データソースフィルター
    if (selectedDataSource !== 'all') {
      // 将来的なデータ増加に対応
    }

    // 難易度フィルター
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    // 関連分野フィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (q) =>
          q.relatedFields &&
          Array.isArray(q.relatedFields) &&
          q.relatedFields.includes(selectedCategory)
      );
    }

    // 単語・熟語フィルター
    if (selectedWordPhraseFilter === 'words') {
      filtered = filtered.filter((q) => !q.word.includes(' ') || q.word.split(' ').length <= 2);
    } else if (selectedWordPhraseFilter === 'phrases') {
      filtered = filtered.filter((q) => q.word.includes(' ') && q.word.split(' ').length > 2);
    }

    const duration = PerformanceMonitor.end('filter-questions');

    if (import.meta.env.DEV && duration > 20) {
      console.log('🔍 [MemorizationView] 問題フィルタリング', {
        duration: `${duration.toFixed(2)}ms`,
        total: allQuestions.length,
        filtered: filtered.length,
      });
    }

    return filtered;
  }, [
    allQuestions,
    selectedDataSource,
    selectedDifficulty,
    selectedCategory,
    selectedWordPhraseFilter,
  ]);

  // 初期化: カード表示設定と音声設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedCardSettings = await getMemorizationCardSettings();
        if (savedCardSettings) {
          setCardState(savedCardSettings);
        }

        const memSettings = await getMemorizationSettings();
        if (memSettings) {
          setAutoVoice(memSettings.autoVoice || false);
          setVoiceWord(memSettings.voiceWord !== undefined ? memSettings.voiceWord : true);
          setVoiceMeaning(memSettings.voiceMeaning || false);
          setVoiceDelay(memSettings.voiceDelay !== undefined ? memSettings.voiceDelay : 1.5);
        }

        setIsLoading(false);
      } catch (error) {
        logger.error('設定の読み込みエラー:', error);
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 関連分野のリストを取得
  const getAvailableCategories = (): string[] => {
    const categories = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.relatedFields && Array.isArray(q.relatedFields)) {
        q.relatedFields.forEach((field) => categories.add(field));
      }
    });
    return Array.from(categories).sort();
  };

  // 出題する語句を選択（シンプルな実装、後でAI最適化）
  useEffect(() => {
    if (isLoading) return;

    const selectQuestions = async () => {
      try {
        // データソースに基づいて問題を取得
        const baseQuestions = allQuestions;

        // データソースフィルター（現在はsource プロパティが 'junior' しかないため、実質的なフィルタリングは行わない）
        // 将来的にデータが増えた場合、ここでフィルタリングを実装
        if (selectedDataSource !== 'all') {
          // 現在は全て junior なので、フィルタリングなし
          // 将来: standard/advanced/comprehensiveに対応
        }

        if (baseQuestions.length === 0) {
          logger.warn('[MemorizationView] 問題が見つかりません');
          return;
        }

        // 学習設定に基づいてフィルタリング
        let filtered = baseQuestions;

        // 難易度フィルター
        if (selectedDifficulty !== 'all') {
          filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
        }

        // 関連分野フィルター
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(
            (q) =>
              q.relatedFields &&
              Array.isArray(q.relatedFields) &&
              q.relatedFields.includes(selectedCategory)
          );
        }

        // 単語・熟語フィルター
        if (selectedWordPhraseFilter === 'words') {
          filtered = filtered.filter((q) => !q.word.includes(' ') || q.word.split(' ').length <= 2);
        } else if (selectedWordPhraseFilter === 'phrases') {
          filtered = filtered.filter((q) => q.word.includes(' ') && q.word.split(' ').length > 2);
        }

        if (filtered.length === 0) {
          logger.warn('[MemorizationView] フィルター後の問題が0件です');
          return;
        }

        // デバッグ: フィルター後の単語数を確認
        logger.info('[MemorizationView] フィルター後の単語数', {
          totalFiltered: filtered.length,
          sessionStats: {
            correct: sessionStats.correct,
            incorrect: sessionStats.incorrect,
            still_learning: sessionStats.still_learning || 0,
          },
        });

        // 適応的出題順序（統一スケジューラー: DTA + 振動防止 + メタAI統合）
        // スケジューリング開始（ログ削減のため出力なし）

        // 🔧 再スケジューリングは現在無効（filtered問題のみを使用）
        const questionsToSchedule = filtered;

        // 🧪 variant別のスケジューリング設定
        if (abVariant === 'B') {
          scheduler.enableAICoordination(true); // B: 小補正
        } else if (abVariant === 'C') {
          scheduler.enableAICoordination(true); // C: finalPriority主因
        } else {
          scheduler.enableAICoordination(false); // A: Position中心
        }

        // ✅ progressCacheを先に温める（loadProgressSyncが空の初期値を掴むのを防ぐ）
        await loadProgress();

        const scheduleResult = await scheduler.schedule({
          questions: questionsToSchedule,
          mode: 'memorization',
          limits: {
            learningLimit: stillLearningLimit,
            reviewLimit: incorrectLimit,
          },
          sessionStats: {
            correct: sessionStats.correct,
            incorrect: sessionStats.incorrect,
            still_learning: sessionStats.still_learning || 0,
            mastered: sessionStats.mastered || 0, // 定着済みも反映
            duration: Date.now() - cardDisplayTimeRef.current,
          },
          useMetaAI: true, // ✅ 学習AIは常に有効（カテゴリー別優先順位）
          isReviewFocusMode: false,
          hybridMode: abVariant === 'B', // 🧪 B: Position主軸+AI小補正
          finalPriorityMode: abVariant === 'C', // 🧪 C: AI主軸（finalPriority主因）
        });

        if (!scheduleResult || !scheduleResult.scheduledQuestions) {
          logger.error('[MemorizationView] スケジュール結果が無効です', { scheduleResult });
          return;
        }

        const sortedQuestions = scheduleResult.scheduledQuestions;

        // デバッグ: スケジュール後の単語を確認
        const debugInfo = {
          totalScheduled: sortedQuestions.length,
          top10Words: sortedQuestions.slice(0, 10).map((q) => q.word),
          timestamp: new Date().toISOString(),
        };

        // スケジュール完了（ログ削減のため出力なし）

        // localStorage に保存（デバッグ用）
        try {
          localStorage.setItem('debug_memorization_latest', JSON.stringify(debugInfo));
        } catch {
          // ignore
        }

        // 振動スコア監視（🧪 A/Bテスト品質ガード）
        const vibrationScore = scheduleResult.vibrationScore;
        const userId = getOrCreateAnonymousUserId();
        const guardResult = evaluateVibrationScore(vibrationScore, abConsecutiveCritical);

        // 連続悪化カウント更新
        const updatedConsecutiveCritical = updateConsecutiveCritical(
          userId,
          abVariant,
          guardResult.level === 'critical'
        );
        setAbConsecutiveCritical(updatedConsecutiveCritical);

        // 振動スコアログ記録
        logVibrationScore(
          abSessionId,
          abVariant,
          vibrationScore,
          guardResult.level,
          guardResult.shouldFallback
        );

        // N=20フォールバック（variant=B/Cのみ、悪化時）
        if (
          guardResult.shouldFallback &&
          !abFallbackApplied &&
          (abVariant === 'B' || abVariant === 'C')
        ) {
          logger.warn('[MemorizationView] 振動スコア悪化: N=20フォールバック適用', {
            score: vibrationScore,
            variant: abVariant,
            consecutiveCritical: updatedConsecutiveCritical,
          });
          setAbFallbackApplied(true);
          // 出題数を20問に制限（sortedQuestionsを切り詰め）
          sortedQuestions.splice(20);
        }

        // variant=A切戻し推奨（連続2回以上の悪化）
        if (guardResult.shouldSwitchToA) {
          logger.error('[MemorizationView] variant=A切戻し推奨', {
            score: vibrationScore,
            variant: abVariant,
            consecutiveCritical: updatedConsecutiveCritical,
            message: guardResult.message,
          });
        }

        if (scheduleResult.vibrationScore > 50) {
          logger.warn('[MemorizationView] 高い振動スコア検出', {
            score: scheduleResult.vibrationScore,
            processingTime: scheduleResult.processingTime,
          });
        }

        // 🧪 variant=C: AI-Position乖離監視
        if (abVariant === 'C') {
          // 乖離検知はscheduleFinalPriorityMode内でfinalPriorityが設定されている前提
          // ここでは簡易的にログ記録のみ実施（実際の検知はschedule内部で実施すべき）
          // TODO: scheduleFinalPriorityMode内でdetectAIPositionDivergence()を呼び出し、
          //       DivergenceGuardResultを返すように改修
          if (import.meta.env.DEV) {
            logger.info('[MemorizationView] variant=C 乖離監視未実装（TODO）', {
              variant: abVariant,
            });
          }
        }

        setQuestions(sortedQuestions);

        // 🧪 A/Bテスト: セッション開始時フック
        if (sortedQuestions.length > 0 && currentIndex === 0 && !currentQuestion) {
          const wordList = extractWordList(sortedQuestions);
          setAbQuestionWords(wordList);
          setAbVibrationScore(scheduleResult.vibrationScore);

          // 開始時スナップショット（mastered語集合を記録）
          const startMastered = captureMasteredSet(wordList);
          setAbStartMasteredWords(startMastered);

          if (import.meta.env.DEV) {
            console.log('[AB Session Start]', {
              sessionId: abSessionId,
              variant: abVariant,
              questionCount: sortedQuestions.length,
              uniqueWords: calculateUniqueWordCount(wordList),
              startMastered: startMastered.length,
              vibrationScore: scheduleResult.vibrationScore,
            });
          }
        }

        // 🔧 初回表示時のみインデックスをリセット
        // 再スケジューリング時(rescheduleCounter変更時)は、現在の問題を継続
        if (sortedQuestions.length > 0 && currentIndex === 0 && !currentQuestion) {
          const firstQuestion = sortedQuestions[0];
          setCurrentQuestion(firstQuestion);
          setCurrentIndex(0);
          cardDisplayTimeRef.current = Date.now();
          // 📊 1問目の出題をカウント
          setSessionStats((prev) => ({
            ...prev,
            total: prev.total + 1,
          }));
        }
      } catch (error) {
        logger.error('[MemorizationView] 問題選択エラー:', error);
        // エラー時もローディングを解除
        setIsLoading(false);
      }
    };

    void selectQuestions();
  }, [
    selectedDataSource,
    selectedDifficulty,
    selectedCategory,
    selectedWordPhraseFilter,
    allQuestions,
    isLoading,
    // questionsとschedulerは除外（無限ループ防止）
    // sessionStatsも除外（内部で更新されるため）
    // rescheduleCounterも除外（現在未使用のため）
  ]);

  // 復習モードトグル
  const handleReviewFocus = () => {
    setIsReviewFocusMode(!isReviewFocusMode);
  };

  // デバッグ: 成績リセット
  const handleResetProgress = async () => {
    if (!confirm('本当にすべての学習記録を削除しますか？この操作は元に戻せません。')) return;

    try {
      // resetAllProgressを使用して完全リセット（成績タブと同じ処理）
      const { resetAllProgress } = await import('../progressStorage');
      await resetAllProgress();

      // セッション統計をリセット
      setSessionStats({
        correct: 0,
        still_learning: 0,
        incorrect: 0,
        mastered: 0,
        total: 0,
        newQuestions: 0,
        reviewQuestions: 0,
        consecutiveNew: 0,
        consecutiveReview: 0,
      });

      // 連続記録をリセット
      setCorrectStreak(0);
      setIncorrectStreak(0);

      // 問題リストを再生成
      setCurrentIndex(0);

      // ABテスト記録をリセット
      setAbVibrationScore(0);
      setAbConsecutiveCritical(0);
      setAbConsecutiveDivergence(0);

      logger.info('[MemorizationView] 成績リセット完了');
      alert('学習記録をリセットしました');
    } catch (error) {
      logger.error('[MemorizationView] 成績リセット失敗', error);
      alert('リセットに失敗しました');
    }
  };

  // デバッグ: 再出題ロジック（デバッグパネル表示）
  const handleDebugRequeue = () => {
    setShowDebugPanel(true);
  };

  // 適応的AI分析ヘルパー関数（常時有効）
  const processWithAdaptiveAI = async (word: string, isCorrect: boolean) => {
    try {
      const calculateDifficulty = (q: Question): number => {
        const gradeWeight = (q.grade || 1) / 9;
        return Math.min(Math.max(gradeWeight, 0), 1);
      };

      const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        if (hour < 22) return 'evening';
        return 'night';
      };

      if (currentQuestion) {
        await processAdaptiveQuestion(word, isCorrect ? 'correct' : 'incorrect', {
          currentDifficulty: calculateDifficulty(currentQuestion),
          timeOfDay: getTimeOfDay(),
          recentErrors: sessionStats.incorrect,
          sessionLength: Math.floor((Date.now() - cardDisplayTimeRef.current) / 60000),
          consecutiveCorrect: correctStreak,
        });
      }
    } catch (error) {
      console.error('[MemorizationView] Adaptive AI error:', error);
    }
  };

  // 上限達成時に自動的に復習モードをオンにする
  useEffect(() => {
    if (
      (stillLearningLimit !== null && sessionStats.still_learning >= stillLearningLimit) ||
      (incorrectLimit !== null && sessionStats.incorrect >= incorrectLimit)
    ) {
      if (!isReviewFocusMode) {
        setIsReviewFocusMode(true);
      }
    }
  }, [sessionStats, stillLearningLimit, incorrectLimit, isReviewFocusMode]);

  // 🔒 強制装置: 回答後にprogressStorageから正確な統計を再計算
  useEffect(() => {
    if (lastAnswerTime === 0) return; // 初回ロード時はスキップ
    if (questions.length === 0) return;

    // updateWordProgress完了後に呼び出されることを期待
    setTimeout(() => {
      const actualStats = calculateSessionStats(questions, 'memorization');
      setSessionStats((prev) => ({
        ...prev,
        incorrect: actualStats.incorrect,
        still_learning: actualStats.still_learning,
        mastered: actualStats.mastered,
        // correct, totalは手動カウントを維持（セッション中の正解数）
      }));

      if (import.meta.env.DEV) {
        console.log('🔒 [強制装置] 統計を再計算:', actualStats);
      }
    }, 100); // 100ms待機してupdateWordProgressの完了を待つ
  }, [lastAnswerTime, questions]);

  // calculateOptimalInterval, calculateForgettingRisk: QuestionSchedulerに統合済み

  // ローカルソート関数は削除: QuestionSchedulerに統合済み

  // 🎯 自動再スケジューリング実行
  useEffect(() => {
    if (!needsRescheduling || isLoading || questions.length === 0) return;

    const performRescheduling = async () => {
      try {
        logger.info('[MemorizationView] 自動再スケジューリング開始', {
          answerCount: answerCountSinceSchedule,
          reason: reschedulingNotification,
        });

        // 現在のフィルタ条件で再スケジューリング
        const baseQuestions = allQuestions;
        let filtered = baseQuestions;

        // 難易度フィルター
        if (selectedDifficulty !== 'all') {
          filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
        }

        // 関連分野フィルター
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(
            (q) =>
              q.relatedFields &&
              Array.isArray(q.relatedFields) &&
              q.relatedFields.includes(selectedCategory)
          );
        }

        // 単語・熟語フィルター
        if (selectedWordPhraseFilter === 'words') {
          filtered = filtered.filter((q) => !q.word.includes(' ') || q.word.split(' ').length <= 2);
        } else if (selectedWordPhraseFilter === 'phrases') {
          filtered = filtered.filter((q) => q.word.includes(' ') && q.word.split(' ').length > 2);
        }

        if (filtered.length === 0) {
          logger.warn('[MemorizationView] 再スケジューリング対象なし');
          setNeedsRescheduling(false);
          setReschedulingNotification(null);
          return;
        }

        // QuestionSchedulerで再スケジューリング
        const result = await scheduler.schedule({
          questions: filtered,
          mode: 'memorization',
          limits: {
            learningLimit: stillLearningLimit ?? null,
            reviewLimit: incorrectLimit ?? null,
          },
          sessionStats: {
            correct: sessionStats.correct,
            incorrect: sessionStats.incorrect,
            still_learning: sessionStats.still_learning,
            mastered: sessionStats.mastered,
            duration: 0,
          },
          useMetaAI: true,
          hybridMode: abVariant === 'A' || abVariant === 'B',
        });

        setQuestions(result.scheduledQuestions);

        // カウンターとフラグをリセット
        setAnswerCountSinceSchedule(0);
        setNeedsRescheduling(false);

        // 3秒後に通知を消す
        setTimeout(() => {
          setReschedulingNotification(null);
        }, 3000);

        logger.info('[MemorizationView] 自動再スケジューリング完了', {
          newLength: result.scheduledQuestions.length,
        });
      } catch (error) {
        logger.error('[MemorizationView] 再スケジューリングエラー:', error);
        setNeedsRescheduling(false);
        setReschedulingNotification(null);
      }
    };

    performRescheduling();
  }, [
    needsRescheduling,
    isLoading,
    questions.length,
    allQuestions,
    selectedDifficulty,
    selectedCategory,
    selectedWordPhraseFilter,
    stillLearningLimit,
    incorrectLimit,
    sessionStats,
    abVariant,
    scheduler,
    answerCountSinceSchedule,
    reschedulingNotification,
  ]);

  // 音声読み上げ（カード表示時）
  useEffect(() => {
    if (!currentQuestion || !autoVoice) return;

    // カードが実際に変わった時だけ発音（設定変更時は発音しない）
    if (previousQuestionId.current === currentQuestion.word) {
      return;
    }
    previousQuestionId.current = currentQuestion.word;

    const speakCard = async () => {
      // 語句を読み上げ（設定がONの場合）
      if (voiceWord) {
        speakEnglish(currentQuestion.word, { rate: 0.85 });
      }

      // 意味も読み上げ（設定がONの場合）
      if (voiceMeaning && currentQuestion.meaning) {
        await new Promise((resolve) => setTimeout(resolve, voiceDelay * 1000)); // 設定された秒数待機
        // 日本語の意味を読み上げ
        const utterance = new SpeechSynthesisUtterance(currentQuestion.meaning);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    };

    speakCard();
    // voiceWord, voiceMeaning, voiceDelayを依存配列から除外（設定変更時の音声再生を防ぐ）
    // autoVoiceも依存配列に含めるが、カードIDチェックで設定変更時の発音を防ぐ
  }, [currentQuestion, autoVoice, voiceWord, voiceMeaning, voiceDelay]);

  // 全画面モードの切り替え
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // カード表示設定の切り替え（永続化）
  const toggleCardField = async (field: keyof MemorizationCardState) => {
    if (field === 'showWord') return; // 単語は常に表示

    const newState = {
      ...cardState,
      [field]: !cardState[field],
    };

    setCardState(newState);
    await saveMemorizationCardSettings(newState);
  };

  // 音声設定の保存
  const updateVoiceSettings = async (
    autoVoiceVal: boolean,
    voiceWordVal: boolean,
    voiceMeaningVal: boolean,
    voiceDelayVal?: number
  ) => {
    setAutoVoice(autoVoiceVal);
    setVoiceWord(voiceWordVal);
    setVoiceMeaning(voiceMeaningVal);
    if (voiceDelayVal !== undefined) {
      setVoiceDelay(voiceDelayVal);
    }

    await saveMemorizationSettings({
      autoVoice: autoVoiceVal,
      voiceWord: voiceWordVal,
      voiceMeaning: voiceMeaningVal,
      voiceDelay: voiceDelayVal !== undefined ? voiceDelayVal : voiceDelay,
      interleavingMode: 'off',
      cardDisplaySettings: cardState,
    });
  };

  // スワイプ処理（useCallbackで最適化）- 3段階評価対応
  // 🎯 UI/UX第一原則: 生徒の学習を妨げない即座のレスポンス
  const handleSwipe = useCallback(
    async (direction: 'left' | 'center' | 'right') => {
      if (!currentQuestion) return;

      // 滞在時間を記録
      const viewDuration = (Date.now() - cardDisplayTimeRef.current) / 1000; // 秒単位

      // right: 覚えてる(正解)、center: まだまだ(復習中)、left: 分からない(不正解)
      const isCorrect = direction === 'right';
      const isStillLearning = direction === 'center';

      // 現在の問題を保存（非同期処理で使用）
      const answeredQuestion = currentQuestion;
      const answeredViewDuration = viewDuration;

      // ═══════════════════════════════════════════════════════════
      // 🚀 即座のUI更新（ステップ1: 同期処理のみ）
      // ═══════════════════════════════════════════════════════════

      // 回答結果を記録（動的AIコメント用）
      setLastAnswerCorrect(isCorrect);
      setLastAnswerWord(currentQuestion.word);
      if (isCorrect) {
        setCorrectStreak((prev) => prev + 1);
        setIncorrectStreak(0);
      } else if (!isStillLearning) {
        // 分からない場合のみincorrectStreak増加
        setIncorrectStreak((prev) => prev + 1);
        setCorrectStreak(0);
      } else {
        // まだまだの場合はストリークをリセットしない（中立）
        setCorrectStreak(0);
        setIncorrectStreak(0);
      }

      // 統計を3段階で更新（totalは問題表示時に既にカウント済み）
      // 🔒 強制装置: progressStorageから実際のcategoryを計算
      setSessionStats((prev) => {
        // updateWordProgressの完了を待ってからcalculateSessionStatsを呼び出すべきだが、
        // UIのレスポンスを優先するため、ここでは簡易的に手動カウント
        // 後でlastAnswerTime変更時に再計算される

        const wasIncorrect = currentQuestion.reAddedCount && currentQuestion.reAddedCount > 0;

        let newIncorrect = prev.incorrect;
        let newStillLearning = prev.still_learning;

        if (isCorrect && wasIncorrect) {
          if (newIncorrect > 0) {
            newIncorrect = Math.max(0, newIncorrect - 1);
          } else if (newStillLearning > 0) {
            newStillLearning = Math.max(0, newStillLearning - 1);
          }
        }

        return {
          correct: isCorrect ? prev.correct + 1 : prev.correct,
          still_learning: isStillLearning ? newStillLearning + 1 : newStillLearning,
          incorrect: !isCorrect && !isStillLearning ? newIncorrect + 1 : newIncorrect,
          mastered: isCorrect ? prev.mastered + 1 : prev.mastered,
          total: prev.total,
          newQuestions: prev.newQuestions,
          reviewQuestions: prev.reviewQuestions,
          consecutiveNew: prev.consecutiveNew,
          consecutiveReview: prev.consecutiveReview,
        };
      });

      // � Phase 1 Pattern 2: 即座のカテゴリー判定（10-50ms目標）
      // UI応答を最優先し、詳細分析は後回し
      PerformanceMonitor.start('quick-category-determination');
      const progressCache = loadProgressSync();
      const wordProgress = progressCache.wordProgress?.[answeredQuestion.word];
      const position = determineWordPosition(wordProgress, 'memorization');
      const category = positionToCategory(position);

      const categoryDuration = PerformanceMonitor.end('quick-category-determination');

      if (categoryDuration > 50) {
        PerformanceMonitor.warnIfSlow('quick-category-determination', categoryDuration, 50);
      }

      QualityMonitor.recordCategoryDetermination(category, 1.0, categoryDuration);

      // Debug log removed to reduce console noise

      // 📊 カテゴリ変化時の再スケジューリングを無効化
      // 理由: 再スケジューリングが再出題キューを破壊する問題を回避
      // カテゴリ変化は次のセッション開始時に自動的に反映される
      // if (!isCorrect) {
      //   setRescheduleCounter((prev) => prev + 1);
      // }

      // ═══════════════════════════════════════════════════════════
      // 🎨 バックグラウンド処理（ステップ2: 非同期・非ブロッキング）
      // ═══════════════════════════════════════════════════════════
      // 💡 UI更新を待たずに即座にバックグラウンド実行
      // 💡 データ保存の完了を待たない = 学習体験を妨げない

      // 16秒以上は放置とみなしてカウントしない
      if (answeredViewDuration < 16) {
        // 🎯 最優先: updateWordProgress を先に実行してlocalStorageを更新
        PerformanceMonitor.start('data-save');
        try {
          await updateWordProgress(
            answeredQuestion.word,
            isCorrect,
            answeredViewDuration * 1000, // ミリ秒に変換
            undefined,
            'memorization', // 暗記タブは独立したモードとして記録
            isStillLearning // まだまだフラグを渡す
          );
          const duration = PerformanceMonitor.end('data-save');
          QualityMonitor.recordDataSave(true, duration);
        } catch (error) {
          const duration = PerformanceMonitor.end('data-save');
          QualityMonitor.recordDataSave(false, duration, String(error));
          logger.error('[MemorizationView] 学習データ記録エラー:', error);
        } finally {
          // ✅ 成功/失敗に関わらず回答時刻を更新（ScoreBoard再計算のトリガー）
          setLastAnswerTime(Date.now());
        }

        // 🔥 その他の処理はバックグラウンドで実行
        Promise.all([
          // 行動記録の保存
          (async () => {
            try {
              const behavior: MemorizationBehavior = {
                word: answeredQuestion.word,
                timestamp: Date.now(),
                viewDuration: answeredViewDuration,
                swipeDirection: direction === 'center' ? 'left' : direction,
                sessionId,
                consecutiveViews: consecutiveViews + 1,
              };
              await recordMemorizationBehavior(behavior);
              setConsecutiveViews((prev) => prev + 1);
            } catch (error) {
              logger.error('[MemorizationView] 行動記録エラー:', error);
            }
          })(),

          // 追加の統計記録
          (async () => {
            try {
              adaptiveLearning.recordAnswer(
                answeredQuestion.word,
                isCorrect,
                answeredViewDuration * 1000
              );
            } catch (error) {
              logger.error('[MemorizationView] 統計記録エラー:', error);
            }
          })(),

          // 🔬 Phase 1 Pattern 2: AI分析の段階的実行
          // 即座: カテゴリー判定（既に完了）
          // 遅延: 詳細AI分析（常時有効、1秒後）
          (async () => {
            // 1秒待機してから詳細分析
            await new Promise((resolve) => setTimeout(resolve, 1000));

            PerformanceMonitor.start('ai-detailed-analysis');
            try {
              await processWithAdaptiveAI(answeredQuestion.word, isCorrect);
              const duration = PerformanceMonitor.end('ai-detailed-analysis');

              if (import.meta.env.DEV) {
                console.log('🔬 [MemorizationView] 詳細AI分析完了', {
                  word: answeredQuestion.word,
                  duration: `${duration.toFixed(2)}ms`,
                });
              }
            } catch (error) {
              PerformanceMonitor.end('ai-detailed-analysis');
              logger.error('[MemorizationView] AI分析エラー:', error);
            }
          })(),
        ]).catch((error) => {
          // 全体のエラーハンドリング（個別エラーは既にキャッチ済み）
          logger.error('[MemorizationView] バックグラウンド処理エラー:', error);
        });
      }

      // KPIロギング + 新規/復習の統計を更新

      updateRequeueStats(currentQuestion, sessionStats, setSessionStats);

      // 直前に回答した問題IDを記録（連続出題防止）
      setLastAnsweredQuestionId(currentQuestion.word);

      // 🎯 自動再スケジューリング: 解答カウンター増加と不整合チェック
      setAnswerCountSinceSchedule((prev) => {
        const newCount = prev + 1;

        // トリガー条件1: 50回解答ごと
        if (newCount >= 50) {
          setNeedsRescheduling(true);
          setReschedulingNotification('50回解答に達しました');
          return newCount;
        }

        // トリガー条件2: 10回ごとにPosition不整合チェック
        if (newCount % 10 === 0) {
          try {
            const mismatchResult = checkPositionMismatch(questions, 'memorization');
            if (mismatchResult.needsRescheduling) {
              setNeedsRescheduling(true);
              setReschedulingNotification(mismatchResult.reason);
            }
          } catch (error) {
            logger.error('[MemorizationView] Position不整合チェックエラー:', error);
          }
        }

        return newCount;
      });

      // 🧪 Week 5: ML learn()導線（回答後にモデル更新）
      if (abMlEnabled && scheduler.aiCoordinator) {
        try {
          // AIAnalysisInputを構築してlearn()に渡す（AICoordinator/各専門AIの前提に合わせる）
          const progressCache = loadProgressSync();
          const allProgress = (progressCache?.wordProgress ?? {}) as Record<string, any>;
          const progress =
            (allProgress[currentQuestion.word] as any) ??
            (progressCache?.wordProgress?.[currentQuestion.word] as any) ??
            null;

          // 学習段階の分布（AIの推定で利用）
          let masteredCount = 0;
          let stillLearningCount = 0;
          let incorrectCount = 0;
          let newCount = 0;
          for (const wp of Object.values(allProgress)) {
            const pos = determineWordPosition(wp as any, 'memorization');
            if (pos >= 70) incorrectCount++;
            else if (pos >= 40) stillLearningCount++;
            else if (pos >= 20) newCount++;
            else masteredCount++;
          }

          const totalAttempts =
            (sessionStats.correct || 0) +
            (sessionStats.incorrect || 0) +
            (sessionStats.still_learning || 0) +
            (sessionStats.mastered || 0);

          const aiSessionStats: AISessionStats = {
            totalAttempts,
            correctAnswers: sessionStats.correct || 0,
            incorrectAnswers: sessionStats.incorrect || 0,
            stillLearningAnswers: sessionStats.still_learning || 0,
            sessionStartTime: abSessionStartedAt,
            sessionDuration: Date.now() - abSessionStartedAt,
            consecutiveIncorrect: 0,
            masteredCount,
            stillLearningCount,
            incorrectCount,
            newCount,
            consecutiveCorrect: (sessionStats as any).consecutiveCorrect || 0,
          };

          const aiInput: AIAnalysisInput = {
            word: {
              word: currentQuestion.word,
              meaning: currentQuestion.meaning,
              reading: (currentQuestion as any).reading,
              difficulty: (currentQuestion as any).difficulty,
              category: (currentQuestion as any).category,
              source: (currentQuestion as any).source,
              type: (currentQuestion as any).type,
              isPhraseOnly: (currentQuestion as any).isPhraseOnly,
            },
            progress,
            sessionStats: aiSessionStats,
            currentTab: 'memorization',
            allProgress,
          };

          // MLLearningOutcome型に準拠
          const outcome = {
            wasCorrect: isCorrect,
            responseTime: Math.round(answeredViewDuration * 1000),
            timestamp: Date.now(),
            features: [], // 必要なら特徴量を設定
          };

          scheduler.aiCoordinator.learn(aiInput, outcome).catch((error) => {
            console.warn('[ML] learn() failed', error);
          });
          if (import.meta.env.DEV) {
            console.log('[ML] learn() called', { word: currentQuestion.word, isCorrect });
          }
        } catch (error) {
          console.warn('[ML] learn() error', error);
        }
      }

      // 🔄 再出題メカニズム: useQuestionRequeueフックを使用
      // 不正解またはまだまだの場合に再追加
      let questionsForNextIndex = questions; // 次のインデックス計算用
      if (!isCorrect || isStillLearning) {
        const updatedQuestions = _reAddQuestion(currentQuestion, questions, currentIndex);
        if (updatedQuestions !== questions) {
          questionsForNextIndex = updatedQuestions; // 更新後の配列を使用
          setQuestions(updatedQuestions);
          if (import.meta.env.DEV) {
            const reason = !isCorrect ? '分からない' : 'まだまだ';
            console.log(`✅ [再出題] キュー追加 (${reason})`, {
              word: currentQuestion.word,
              insertAt: currentIndex + 2,
              newLength: updatedQuestions.length,
            });
          }
        }
      }

      // 次の語句へ（再出題キュー追加後の配列を使用）
      let nextIndex = currentIndex + 1;

      // 🚫 連続出題防止: 直前に回答した問題をスキップ（最大5問先までチェック）
      const maxSkip = Math.min(nextIndex + 5, questionsForNextIndex.length);
      while (
        nextIndex < maxSkip &&
        questionsForNextIndex[nextIndex].word === currentQuestion.word
      ) {
        logger.warn('[MemorizationView] 連続出題を検出、スキップ', {
          word: questionsForNextIndex[nextIndex].word,
          nextIndex,
        });
        nextIndex++;
      }

      if (nextIndex < questionsForNextIndex.length) {
        // セッション優先フラグのクリーン処理：5問経過後にクリア
        const clearedQuestions = clearExpiredFlags(questionsForNextIndex, currentIndex);
        if (clearedQuestions !== questionsForNextIndex) {
          setQuestions(clearedQuestions);
        }

        const nextQuestion = questionsForNextIndex[nextIndex];

        // 再出題確認ログ
        if (import.meta.env.DEV && (nextQuestion as any).reAddedCount > 0) {
          console.log('🔄 [再出題] 問題表示', {
            word: nextQuestion.word,
            reAddedCount: (nextQuestion as any).reAddedCount,
            nextIndex,
          });
        }

        setCurrentQuestion(nextQuestion);
        setCurrentIndex(nextIndex);
        cardDisplayTimeRef.current = Date.now();
        // 📊 新しい問題の出題をカウント
        setSessionStats((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
        // 次の問題に移動したのlastAnswerWordをリセット（解答前に解答後コメントが表示されるのを防ぐ）
        setLastAnswerWord(undefined);
      } else {
        // 全て終了

        // 🧪 A/Bテスト: セッション終了時フック
        if (abQuestionWords.length > 0) {
          try {
            // 終了時スナップショット（mastered語集合を取得）
            const endMastered = captureMasteredSet(abQuestionWords);

            // KPI計算
            const acquiredWords = calculateAcquiredWords(abStartMasteredWords, endMastered);
            const uniqueWords = calculateUniqueWordCount(abQuestionWords);
            const acquisitionRate = calculateAcquisitionRate(acquiredWords, uniqueWords);
            const endedAt = Date.now();
            const durationSec = Math.round((endedAt - abSessionStartedAt) / 1000);

            // ログ保存
            const log: SessionLog = {
              sessionId: abSessionId,
              variant: abVariant,
              mode: 'memorization',
              sessionLength: abQuestionWords.length,
              questionWords: abQuestionWords,
              uniqueWordCount: uniqueWords,
              startMasteredWords: abStartMasteredWords,
              endMasteredWords: endMastered,
              acquiredWordCount: acquiredWords,
              acquisitionRate,
              vibrationScore: abVibrationScore,
              startedAt: abSessionStartedAt,
              endedAt,
              durationSec,
              mlEnabled: abMlEnabled, // 🧪 Week 4: ML有効フラグを記録
            };

            appendSessionLog(log);

            if (import.meta.env.DEV) {
              console.log('[AB Session End]', {
                sessionId: abSessionId,
                variant: abVariant,
                acquiredWords,
                acquisitionRate: (acquisitionRate * 100).toFixed(1) + '%',
                vibrationScore: abVibrationScore,
                durationSec,
              });
            }
          } catch (error) {
            console.error('[AB Session End] Failed to save log:', error);
          }
        }

        setCurrentQuestion(null);
        setLastAnswerWord(undefined);
      }
    },
    [
      currentQuestion,
      currentIndex,
      questions,
      sessionId,
      consecutiveViews,
      sessionStats,
      stillLearningLimit,
      incorrectLimit,
    ]
  );

  // スワイプイベントリスナー追加（handleSwipeの後に配置）
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX.current;

      // 100px以上のスワイプで判定（左右のみ、中央は上下スワイプやボタンクリックで対応）
      if (Math.abs(diff) > 100) {
        if (diff > 0) {
          // 右スワイプ（覚えてる）
          handleSwipe('right');
        } else {
          // 左スワイプ（分からない）
          handleSwipe('left');
        }
      }
    };

    // キーボードイベント追加（カーソルキー対応：3つのボタンに対応）
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === '1') {
        // 左カーソルキーまたは1キー（分からない）
        e.preventDefault();
        handleSwipe('left');
      } else if (e.key === 'ArrowDown' || e.key === '2') {
        // 下カーソルキーまたは2キー（まだまだ）
        e.preventDefault();
        handleSwipe('center');
      } else if (e.key === 'ArrowRight' || e.key === '3') {
        // 右カーソルキーまたは3キー（覚えてる）
        e.preventDefault();
        handleSwipe('right');
      }
    };

    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSwipe]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  // currentQuestionが未設定の場合は待機表示
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="quiz-view">
      {/* 🎯 自動再スケジューリング通知 */}
      {reschedulingNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-medium">
              📊 学習状況を最新化しました（{reschedulingNotification}）
            </span>
          </div>
        </div>
      )}

      {/* 全画面モード時は暗記カードのみ表示 */}
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center py-8">
            {/* 全画面終了ボタン */}
            <button
              onClick={toggleFullscreen}
              className="fixed top-4 right-4 z-50 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700:bg-gray-600 transition"
              aria-label="全画面終了"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* 暗記カード */}
            <div className="w-full max-w-4xl px-4 h-[90vh] flex items-center">
              <div
                ref={cardRef}
                className="question-card h-[600px] sm:h-[650px] md:h-[700px] flex flex-col w-full"
              >
                {/* 語句表示部 */}
                <div className="py-8 flex flex-col items-center justify-center h-[200px] flex-shrink-0">
                  <div
                    className={`flex flex-col items-center ${isSpeechSynthesisSupported() ? 'clickable-pronunciation' : ''}`}
                    onClick={(e) => {
                      if (isSpeechSynthesisSupported()) {
                        e.preventDefault();
                        e.stopPropagation();
                        speakEnglish(currentQuestion.word, { rate: 0.85 });
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (isSpeechSynthesisSupported()) {
                        e.preventDefault();
                        e.stopPropagation();
                        speakEnglish(currentQuestion.word, { rate: 0.85 });
                      }
                    }}
                    title={isSpeechSynthesisSupported() ? 'タップして発音を聞く 🔊' : ''}
                  >
                    <div
                      className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 break-words text-center px-4 ${currentQuestion.word.includes(' ') ? 'phrase-text' : ''} ${isSpeechSynthesisSupported() ? 'clickable-word' : ''}`}
                    >
                      {currentQuestion.word}
                      {isSpeechSynthesisSupported() && <span className="speaker-icon">🔊</span>}
                    </div>
                    {currentQuestion.reading && (
                      <div className="question-reading text-base sm:text-lg md:text-xl text-gray-600 mt-3 text-center">
                        【{currentQuestion.reading}】
                      </div>
                    )}

                    {/* 難易度とカスタムセット追加ボタンを横並び */}
                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                      {currentQuestion.difficulty && (
                        <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                          {currentQuestion.difficulty === 'beginner'
                            ? '初級'
                            : currentQuestion.difficulty === 'intermediate'
                              ? '中級'
                              : '上級'}
                        </div>
                      )}
                      {onAddWordToCustomSet &&
                        onRemoveWordFromCustomSet &&
                        onOpenCustomSetManagement && (
                          <AddToCustomButton
                            word={{
                              word: currentQuestion.word,
                              meaning: currentQuestion.meaning,
                              ipa: currentQuestion.reading,
                              source: 'memorization',
                            }}
                            sets={customQuestionSets}
                            onAddWord={onAddWordToCustomSet}
                            onRemoveWord={onRemoveWordFromCustomSet}
                            onOpenManagement={onOpenCustomSetManagement}
                            size="medium"
                            variant="both"
                          />
                        )}
                    </div>
                  </div>
                </div>

                {/* 3つの大きなボタン */}
                <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="flex flex-col items-center justify-center py-6 px-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    aria-label="分からない"
                  >
                    <span className="text-3xl mb-2">❌</span>
                    <span className="text-sm sm:text-base">分からない</span>
                  </button>
                  <button
                    onClick={() => handleSwipe('center')}
                    className="flex flex-col items-center justify-center py-6 px-2 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    aria-label="まだまだ"
                  >
                    <span className="text-3xl mb-2">🤔</span>
                    <span className="text-sm sm:text-base">まだまだ</span>
                  </button>
                  <button
                    onClick={() => handleSwipe('right')}
                    className="flex flex-col items-center justify-center py-6 px-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    aria-label="覚えてる"
                  >
                    <span className="text-3xl mb-2">✅</span>
                    <span className="text-sm sm:text-base">覚えてる</span>
                  </button>
                </div>

                {/* カスタムセットに追加ボタン */}
                {onAddWordToCustomSet && onRemoveWordFromCustomSet && onOpenCustomSetManagement && (
                  <div className="mb-2 flex justify-center flex-shrink-0">
                    <AddToCustomButton
                      word={{
                        word: currentQuestion.word,
                        meaning: currentQuestion.meaning,
                        ipa: currentQuestion.reading,
                        source: 'memorization',
                      }}
                      sets={customQuestionSets}
                      onAddWord={onAddWordToCustomSet}
                      onRemoveWord={onRemoveWordFromCustomSet}
                      onOpenManagement={onOpenCustomSetManagement}
                      size="medium"
                      variant="both"
                    />
                  </div>
                )}

                {/* 詳細情報 */}
                <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
                  {/* 意味 */}
                  <button
                    onClick={() => toggleCardField('showMeaning')}
                    className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                          意味
                        </span>
                        <span className="text-gray-500 flex-shrink-0">
                          {cardState.showMeaning ? '▼' : '▶'}
                        </span>
                      </div>
                      {cardState.showMeaning && (
                        <div className="flex-1 text-base sm:text-lg text-gray-900 break-words">
                          {currentQuestion.meaning}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* 語源 */}
                  {currentQuestion.etymology &&
                    currentQuestion.etymology.trim() !== '' &&
                    currentQuestion.etymology !== '中学英語で重要な単語です。' && (
                      <button
                        onClick={() => toggleCardField('showEtymology')}
                        className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="font-semibold text-gray-700 w-20 sm:w-24 flex-shrink-0 text-sm sm:text-base">
                              語源・解説
                            </span>
                            <span className="text-gray-500 flex-shrink-0">
                              {cardState.showEtymology ? '▼' : '▶'}
                            </span>
                          </div>
                          {cardState.showEtymology && (
                            <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words">
                              {currentQuestion.etymology}
                            </div>
                          )}
                        </div>
                      </button>
                    )}

                  {/* 関連語 */}
                  {currentQuestion.relatedWords && currentQuestion.relatedWords.trim() !== '' && (
                    <button
                      onClick={() => toggleCardField('showRelated')}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                            関連語
                          </span>
                          <span className="text-gray-500 flex-shrink-0">
                            {cardState.showRelated ? '▼' : '▶'}
                          </span>
                        </div>
                        {cardState.showRelated && (
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words">
                            {currentQuestion.relatedWords}
                          </div>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* スコアボード */}
          <div className="mb-4 flex justify-center">
            <div className="w-full max-w-4xl">
              <ScoreBoard
                mode="memorization"
                sessionCorrect={sessionStats.correct}
                sessionReview={sessionStats.still_learning}
                sessionIncorrect={sessionStats.incorrect}
                totalAnswered={sessionStats.total}
                currentWord={currentQuestion?.word}
                onAnswerTime={lastAnswerTime}
                lastAnswerCorrect={lastAnswerCorrect}
                lastAnswerWord={lastAnswerWord}
                lastAnswerDifficulty={currentQuestion?.difficulty}
                correctStreak={correctStreak}
                incorrectStreak={incorrectStreak}
                learningPhase={
                  (adaptiveLearning.state.currentPhase as unknown as
                    | 'ENCODING'
                    | 'INITIAL_CONSOLIDATION'
                    | 'LONG_TERM_RETENTION'
                    | 'MASTERED'
                    | undefined) ?? undefined
                }
                estimatedSpeed={adaptiveLearning.state.personalParams?.learningSpeed}
                onShowSettings={() => setShowSettings(true)}
                dataSource={selectedDataSource}
                category={selectedCategory === 'all' ? '全分野' : selectedCategory}
                difficulty={selectedDifficulty}
                wordPhraseFilter={selectedWordPhraseFilter}
                onReviewFocus={handleReviewFocus}
                isReviewFocusMode={isReviewFocusMode}
                onResetProgress={handleResetProgress}
                onDebugRequeue={handleDebugRequeue}
              />
            </div>
          </div>

          {/* 学習設定パネル */}
          {showSettings && (
            <div className="mb-4 bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">📊 学習設定</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300:bg-gray-600"
                >
                  ✕ 閉じる
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="memorization-datasource"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    📖 出題元:
                  </label>
                  <select
                    id="memorization-datasource"
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">全問題集</option>
                    <option value="standard">高校受験標準</option>
                    <option value="advanced">高校受験上級</option>
                    <option value="comprehensive">高校受験総合</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="memorization-difficulty"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    📊 難易度:
                  </label>
                  <select
                    id="memorization-difficulty"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">全難易度</option>
                    <option value="beginner">初級</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">上級</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="memorization-category"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    🏷️ 関連分野:
                  </label>
                  <select
                    id="memorization-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">全分野</option>
                    {getAvailableCategories().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="memorization-filter"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    📝 単語・熟語:
                  </label>
                  <select
                    id="memorization-filter"
                    value={selectedWordPhraseFilter}
                    onChange={(e) => setSelectedWordPhraseFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">単語＋熟語</option>
                    <option value="words">単語のみ</option>
                    <option value="phrases">熟語のみ</option>
                  </select>
                </div>

                {/* 出題上限設定 */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    🎯 出題繰り返し設定:
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    未入力の場合は無制限に出題します（推奨：Leitnerシステム方式）
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={stillLearningLimit !== null}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStillLearningLimit(50);
                              localStorage.setItem('memorization-still-learning-limit', '50');
                            } else {
                              setStillLearningLimit(null);
                              localStorage.removeItem('memorization-still-learning-limit');
                            }
                          }}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-sm">🟡 まだまだの語数上限を設定</span>
                      </label>
                      {stillLearningLimit !== null && (
                        <div className="ml-6">
                          <select
                            value={stillLearningLimit}
                            title="まだまだの語数上限"
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setStillLearningLimit(value);
                              localStorage.setItem(
                                'memorization-still-learning-limit',
                                value.toString()
                              );
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                          >
                            {[5, 10, 20, 30, 50, 100, 150, 200].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            この数に達したら、復習モードに自動で切り替わります
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={incorrectLimit !== null}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setIncorrectLimit(30);
                              localStorage.setItem('memorization-incorrect-limit', '30');
                            } else {
                              setIncorrectLimit(null);
                              localStorage.removeItem('memorization-incorrect-limit');
                            }
                          }}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-sm">🔴 分からないの語数上限を設定</span>
                      </label>
                      {incorrectLimit !== null && (
                        <div className="ml-6">
                          <select
                            value={incorrectLimit}
                            title="分からないの語数上限"
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setIncorrectLimit(value);
                              localStorage.setItem(
                                'memorization-incorrect-limit',
                                value.toString()
                              );
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                          >
                            {[5, 10, 20, 30, 50, 100, 150, 200].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            この数に達したら、復習モードに自動で切り替わります
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    🔊 自動発音設定:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={autoVoice}
                        onChange={(e) =>
                          updateVoiceSettings(e.target.checked, voiceWord, voiceMeaning)
                        }
                        className="mr-2 w-4 h-4"
                      />
                      <span>自動で発音する</span>
                    </label>
                    {autoVoice && (
                      <div className="ml-6 space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={voiceWord}
                            onChange={(e) =>
                              updateVoiceSettings(autoVoice, e.target.checked, voiceMeaning)
                            }
                            className="mr-2 w-4 h-4"
                          />
                          <span>語句を読み上げ</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={voiceMeaning}
                            onChange={(e) =>
                              updateVoiceSettings(autoVoice, voiceWord, e.target.checked)
                            }
                            className="mr-2 w-4 h-4"
                          />
                          <span>意味を読み上げ</span>
                        </label>
                        {voiceMeaning && (
                          <div className="ml-6 mt-2">
                            <label className="block text-sm text-gray-600 mb-1">
                              ⏱️ 語句と意味の間隔: {voiceDelay.toFixed(1)}秒
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="5.0"
                              step="0.5"
                              value={voiceDelay}
                              onChange={(e) => {
                                const newDelay = parseFloat(e.target.value);
                                setVoiceDelay(newDelay);
                                updateVoiceSettings(autoVoice, voiceWord, voiceMeaning, newDelay);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              aria-label="語句と意味の間隔"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0.5秒</span>
                              <span>5.0秒</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 🧪 Week 4: ML ON/OFF切替 */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🤖 機械学習（ML）
                      </label>
                      <p className="text-xs text-gray-500">
                        個人の学習パターンに適応（実験的機能）
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        try {
                          const newValue = !abMlEnabled;
                          localStorage.setItem('ab_ml_enabled', String(newValue));
                          setAbMlEnabled(newValue);
                          alert(
                            newValue
                              ? 'ML機能を有効にしました。設定を反映するにはページをリロードしてください。'
                              : 'ML機能を無効にしました。設定を反映するにはページをリロードしてください。'
                          );
                        } catch (error) {
                          alert('設定の保存に失敗しました');
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        abMlEnabled
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {abMlEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 暗記カード */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-4xl">
              {/* 全画面表示ボタン */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 z-10 p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300:bg-gray-600 transition shadow-md"
                aria-label="全画面表示"
                title="全画面表示"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>

              <div
                ref={cardRef}
                className="question-card w-full h-[600px] sm:h-[650px] md:h-[700px] flex flex-col"
              >
                {/* 語句表示部 */}
                <div className="py-8 flex flex-col items-center justify-center h-[200px] flex-shrink-0">
                  <div
                    className={`flex flex-col items-center ${isSpeechSynthesisSupported() ? 'clickable-pronunciation' : ''}`}
                    onClick={(e) => {
                      if (isSpeechSynthesisSupported()) {
                        e.preventDefault();
                        e.stopPropagation();
                        speakEnglish(currentQuestion.word, { rate: 0.85 });
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (isSpeechSynthesisSupported()) {
                        e.preventDefault();
                        e.stopPropagation();
                        speakEnglish(currentQuestion.word, { rate: 0.85 });
                      }
                    }}
                    title={isSpeechSynthesisSupported() ? 'タップして発音を聞く 🔊' : ''}
                  >
                    <div
                      className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 break-words text-center px-4 ${currentQuestion.word.includes(' ') ? 'phrase-text' : ''} ${isSpeechSynthesisSupported() ? 'clickable-word' : ''}`}
                    >
                      {currentQuestion.word}
                      {isSpeechSynthesisSupported() && <span className="speaker-icon">🔊</span>}
                    </div>
                    {currentQuestion.reading && (
                      <div className="question-reading text-base sm:text-lg md:text-xl text-gray-600 mt-3 text-center">
                        【{currentQuestion.reading}】
                      </div>
                    )}

                    {/* 難易度とカスタムセット追加ボタンを横並び */}
                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                      {currentQuestion.difficulty && (
                        <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                          {currentQuestion.difficulty === 'beginner'
                            ? '初級'
                            : currentQuestion.difficulty === 'intermediate'
                              ? '中級'
                              : '上級'}
                        </div>
                      )}
                      {onAddWordToCustomSet &&
                        onRemoveWordFromCustomSet &&
                        onOpenCustomSetManagement && (
                          <AddToCustomButton
                            word={{
                              word: currentQuestion.word,
                              meaning: currentQuestion.meaning,
                              ipa: currentQuestion.reading,
                              source: 'memorization',
                            }}
                            sets={customQuestionSets}
                            onAddWord={onAddWordToCustomSet}
                            onRemoveWord={onRemoveWordFromCustomSet}
                            onOpenManagement={onOpenCustomSetManagement}
                            size="medium"
                            variant="both"
                          />
                        )}
                    </div>
                  </div>
                </div>

                {/* 3つの大きなボタン */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {/* 分からないボタン */}
                  <button
                    onClick={() => handleSwipe('left')}
                    className="flex flex-col items-center justify-center py-6 px-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    aria-label="分からない"
                  >
                    <span className="text-3xl mb-2">❌</span>
                    <span className="text-sm sm:text-base">分からない</span>
                  </button>

                  {/* まだまだボタン */}
                  <button
                    onClick={() => handleSwipe('center')}
                    className="flex flex-col items-center justify-center py-6 px-2 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    aria-label="まだまだ"
                  >
                    <span className="text-3xl mb-2">🤔</span>
                    <span className="text-sm sm:text-base">まだまだ</span>
                  </button>

                  {/* 覚えてるボタン */}
                  <button
                    onClick={() => handleSwipe('right')}
                    className="flex flex-col items-center justify-center py-6 px-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    aria-label="覚えてる"
                  >
                    <span className="text-3xl mb-2">✅</span>
                    <span className="text-sm sm:text-base">覚えてる</span>
                  </button>
                </div>

                {/* 詳細情報 */}
                <div className="space-y-3">
                  {/* 意味 */}
                  <button
                    onClick={() => toggleCardField('showMeaning')}
                    className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                          意味
                        </span>
                        <span className="text-gray-500 flex-shrink-0">
                          {cardState.showMeaning ? '▼' : '▶'}
                        </span>
                      </div>
                      {cardState.showMeaning && (
                        <div className="flex-1 text-base sm:text-lg text-gray-900 break-words">
                          {currentQuestion.meaning}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* 語源 */}
                  {currentQuestion.etymology &&
                    currentQuestion.etymology.trim() !== '' &&
                    currentQuestion.etymology !== '中学英語で重要な単語です。' && (
                      <button
                        onClick={() => toggleCardField('showEtymology')}
                        className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="font-semibold text-gray-700 w-20 sm:w-24 flex-shrink-0 text-sm sm:text-base">
                              語源・解説
                            </span>
                            <span className="text-gray-500 flex-shrink-0">
                              {cardState.showEtymology ? '▼' : '▶'}
                            </span>
                          </div>
                          {cardState.showEtymology && (
                            <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words">
                              {currentQuestion.etymology}
                            </div>
                          )}
                        </div>
                      </button>
                    )}

                  {/* 関連語 */}
                  {currentQuestion.relatedWords && currentQuestion.relatedWords.trim() !== '' && (
                    <button
                      onClick={() => toggleCardField('showRelated')}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                            関連語
                          </span>
                          <span className="text-gray-500 flex-shrink-0">
                            {cardState.showRelated ? '▼' : '▶'}
                          </span>
                        </div>
                        {cardState.showRelated && (
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words">
                            {currentQuestion.relatedWords}
                          </div>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* デバッグパネル */}
      {showDebugPanel && (
        <RequeuingDebugPanel
          mode="memorization"
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          questions={questions}
          requeuedWords={getRequeuedWords(questions, currentIndex)}
        />
      )}
    </div>
  );
}

export default MemorizationView;
