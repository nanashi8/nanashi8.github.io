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
import { useSessionStats } from '../hooks/useSessionStats';
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
import { isReviewWordCategory } from '@/ai/utils/wordCategoryPredicates';
import { loadProgressSync } from '@/storage/progress/progressStorage';
import { loadSocialStudiesProgressSync, updateSocialStudiesProgress } from '@/storage/progress/socialStudiesProgress';
import type { AIAnalysisInput, SessionStats as AISessionStats } from '@/ai/types';
import { PerformanceMonitor } from '@/utils/performance-monitor';
import { QualityMonitor } from '@/utils/quality-monitor';
import { RequeuingDebugPanel } from './RequeuingDebugPanel';
import { DebugTracer } from '@/utils/DebugTracer';
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
// import {
//   detectAIPositionDivergence,
//   updateConsecutiveDivergence,
//   logDivergence,
// } from '@/metrics/ab/divergenceGuard';

interface MemorizationViewProps {
  subject?: 'english' | 'social' | 'japanese';
  allDataSourceLabel?: string;
  allQuestions: Question[];
  questionSets: QuestionSet[];
  customQuestionSets?: CustomQuestionSet[];
  onAddWordToCustomSet?: (setId: string, word: CustomWord) => void;
  onRemoveWordFromCustomSet?: (setId: string, word: CustomWord) => void;
  onOpenCustomSetManagement?: () => void;
  initialBatchSize?: number;
  initialIncorrectLimit?: number;
}

const classicalJapaneseDataSources = [
  { id: 'all', name: '古文総合' },
  { id: 'vocabulary', name: '古文単語' },
  { id: 'knowledge', name: '古文知識' },
  { id: 'grammar', name: '古文文法' },
  { id: 'kanbun', name: '漢文総合' },
  { id: 'kanbun-practice', name: '漢文実践' },
] as const;

function normalizeRelatedFields(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function getSocialFallbackField(question: Question): string {
  const related = normalizeRelatedFields((question as any).relatedFields);
  if (related.length > 0) return related[0];

  const src = String((question as any).source || '');
  if (src === 'history') return '歴史-現代';
  if (src === 'geography') return '地理-日本';
  if (src === 'civics') return '公民-政治';
  return '歴史-現代';
}

function MemorizationView({
  subject = 'english',
  allDataSourceLabel,
  allQuestions,
  questionSets,
  customQuestionSets = [],
  onAddWordToCustomSet,
  onRemoveWordFromCustomSet,
  onOpenCustomSetManagement,
  initialBatchSize: _initialBatchSize,
  initialIncorrectLimit: _initialIncorrectLimit,
}: MemorizationViewProps) {
  const isSocial = subject === 'social' || subject === 'japanese';

  const classicalSourceStorageKey = 'japanese-classical-source';
  const [classicalSourceId, setClassicalSourceId] = useState<string>(() => {
    if (subject !== 'japanese') return 'all';
    try {
      return localStorage.getItem(classicalSourceStorageKey) || 'all';
    } catch {
      return 'all';
    }
  });

  // 出題方式（SSOT）: カテゴリースロット方式を使用
  // NOTE: useQuestionRequeue によるバッチ内重複を避けるため、再出題差し込みはこのフラグに同期させる
  const useCategorySlots = true;

  // デバッグ用: useCategorySlots状態をlocalStorageに保存（デバッグパネルで表示）
  useEffect(() => {
    try {
      localStorage.setItem(
        'debug_useCategorySlots',
        JSON.stringify({ enabled: useCategorySlots, source: 'hardcoded', timestamp: Date.now() })
      );
    } catch {
      // ignore storage errors
    }
  }, [useCategorySlots]);

  // 学習設定
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedWordPhraseFilter, setSelectedWordPhraseFilter] = useState<string>('all');

  // 🆕 バッチ数設定（LocalStorageから読み込み、ScoreBoardで設定）
  const batchSize = (() => {
    try {
      const key = subject === 'japanese' ? 'japanese-memorization-batch-size' : 'memorization-batch-size';
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved) : null;
    } catch {
      return null;
    }
  })();

  // 🆕 分からない・まだまだの上限比率（10-50%、ScoreBoardで設定）
  const reviewRatioLimit = (() => {
    try {
      const key =
        subject === 'japanese'
          ? 'japanese-memorization-review-ratio-limit'
          : 'memorization-review-ratio-limit';
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved) : 20; // デフォルト20%
    } catch {
      return 20;
    }
  })();

  // 廃止: 学習上限設定（バッチ数設定に統合）
  // const [stillLearningLimit, setStillLearningLimit] = useState<number | null>(() => {
  //   const saved = localStorage.getItem('memorization-still-learning-limit');
  //   return saved ? parseInt(saved) : null;
  // });

  // const [incorrectLimit, setIncorrectLimit] = useState<number | null>(() => {
  //   const saved = localStorage.getItem('memorization-incorrect-limit');
  //   return saved ? parseInt(saved) : null;
  // });

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
  const [questions, setQuestionsRaw] = useState<Question[]>([]);

  // 🛡️ 安全なsetQuestions: 連続重複を検出してthrow
  const setQuestions = useCallback(
    (value: Question[] | ((prev: Question[]) => Question[])) => {
      const newQuestions = typeof value === 'function' ? value(questions) : value;

      // DEVモードかつuseCategorySlotsが有効な場合のみ検証
      if (import.meta.env.DEV && useCategorySlots && newQuestions.length > 1) {
        for (let i = 0; i < newQuestions.length - 1; i++) {
          if (newQuestions[i].word === newQuestions[i + 1].word) {
            const errorMsg = `🚨🚨🚨 [setQuestions] 連続重複を検出: "${newQuestions[i].word}" が位置${i}と${i + 1}で連続！`;
            console.error(errorMsg);
            console.error('[setQuestions] 呼び出し元スタックトレース:', new Error().stack);
            logger.error('[MemorizationView] setQuestions連続重複', {
              word: newQuestions[i].word,
              position1: i,
              position2: i + 1,
              arrayLength: newQuestions.length,
            });
            throw new Error(errorMsg);
          }
        }
      }

      setQuestionsRaw(newQuestions);
    },
    [questions, useCategorySlots]
  );

  // セッション管理（セキュアな乱数生成）
  const [sessionId] = useState(() => `session-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`);
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
  const [_abConsecutiveDivergence, _setAbConsecutiveDivergence] = useState<number>(0);
  // 🧪 Week 4: MLは常時ON（UIスイッチ撤去に伴い固定）
  const abMlEnabled = true;

  // 復習モード
  const [isReviewFocusMode, setIsReviewFocusMode] = useState(false);

  // セッション統計（カスタムフック）- 暗記タブ専用
  const { sessionStats, setSessionStats, resetStats: _resetSessionStats } = useSessionStats('memorization');

  // 回答時刻（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(0);

  // 再スケジューリングトリガー（カテゴリ変化時に更新）- 現在未使用だが将来の拡張のため残す
  const [_rescheduleCounter, _setRescheduleCounter] = useState(0);

  // 🎯 自動再スケジューリング管理
  const [answerCountSinceSchedule, setAnswerCountSinceSchedule] = useState(0);
  const [needsRescheduling, setNeedsRescheduling] = useState(false);
  const [reschedulingNotification, setReschedulingNotification] = useState<string | null>(null);

  // UX: 再スケジュールが働いたことをScoreBoardで示す（学習状況タブの文字をパルス）
  const [learningStatusTabPulseKey, setLearningStatusTabPulseKey] = useState<number>(0);

  // デバッグ: 再スケジュールイベントをlocalStorageへ記録
  const recordRescheduleEvent = (
    phase: 'triggered' | 'applied' | 'skipped' | 'error',
    reason: string,
    details?: Record<string, unknown>
  ) => {
    try {
      const stored = localStorage.getItem('debug_reschedule_events');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push({
        timestamp: new Date().toISOString(),
        mode: 'memorization',
        phase,
        reason,
        details: details ?? {},
      });
      // 最新30件のみ保持
      if (logs.length > 30) logs.shift();
      localStorage.setItem('debug_reschedule_events', JSON.stringify(logs));
    } catch {
      // ignore
    }
  };

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
  // バッチ再生成フラグ（バッチ完全消化後に次バッチ生成をトリガー）
  const [needsBatchRegeneration, setNeedsBatchRegeneration] = useState(false);

  // タッチ開始位置とカード要素のref
  const touchStartX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousQuestionId = useRef<string | null>(null); // 前回のカードID

  // 全画面表示モード
  const [isFullscreen, setIsFullscreen] = useState(false);

  // デバッグパネル表示（LocalStorageから復元、開発環境のみ）
  const [showDebugPanel, setShowDebugPanel] = useState(() => {
    if (!import.meta.env.DEV) return false;
    try {
      return localStorage.getItem('debug_panel_visible') === 'true';
    } catch {
      return false;
    }
  });

  // 📊 回答履歴（デバッグパネル用）
  interface AnswerHistory {
    word: string;
    answer: 'correct' | 'still_learning' | 'incorrect';
    countedAs: 'mastered' | 'still_learning' | 'incorrect';
    position: number;
    timestamp: number;
  }
  const [answerHistory, setAnswerHistory] = useState<AnswerHistory[]>([]);

  // デバッグパネルの状態をLocalStorageに保存
  useEffect(() => {
    if (import.meta.env.DEV) {
      try {
        localStorage.setItem('debug_panel_visible', showDebugPanel.toString());
      } catch {
        // ignore
      }
    }
  }, [showDebugPanel]);

  // キーボードショートカット：Cmd/Ctrl + D でデバッグパネル切り替え
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setShowDebugPanel((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 回答履歴のクリア
  const clearAnswerHistory = useCallback(() => {
    setAnswerHistory([]);
  }, []);

  // 回答履歴の最大件数制限（100件）
  useEffect(() => {
    if (answerHistory.length > 100) {
      setAnswerHistory((prev) => prev.slice(-100));
    }
  }, [answerHistory]);

  // 適応型学習フック（問題選択と記録に使用）
  const adaptiveLearning = useAdaptiveLearning(QuestionCategory.MEMORIZATION);

  // 適応的学習AIネットワーク（常時有効）
  const { processQuestion: processAdaptiveQuestion, currentStrategy: _currentStrategy } =
    useAdaptiveNetwork();

  // 統一問題スケジューラー（DTA + 振動防止 + メタAI統合）
  const [scheduler] = useState(() => {
    const s = new QuestionScheduler();
    return s;
  });

  // 🔒 途中再スケジューリングの安全装置（最新の現在位置/問題を参照するためのref）
  const currentIndexRef = useRef<number>(0);
  const currentQuestionWordRef = useRef<string | null>(null);
  const sessionStatsRef = useRef(sessionStats);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    currentQuestionWordRef.current = currentQuestion?.word ?? null;
    sessionStatsRef.current = sessionStats;

    // 🐛 DEBUG: sessionStats更新を記録
    if (import.meta.env.DEV && localStorage.getItem('debug-verbose') === 'true') {
      console.log(
        '🔄 [Ref更新] currentIndex:',
        currentIndex,
        'currentQuestion:',
        currentQuestion?.word
      );
    }
  }, [currentIndex, currentQuestion?.word, sessionStats]);

  // 🚨 オブザーバーパターン: 「まだまだ・分からない」発生時の監視
  // Position >= 60の語が発生したら、即座に再スケジューリングをトリガー
  useEffect(() => {
    const handleWeakWordDetected = (event: Event) => {
      const customEvent = event as CustomEvent<{
        word: string;
        position: number;
        mode: string;
        isIncorrect: boolean;
        timestamp: number;
      }>;
      const { word, position, mode: eventMode } = customEvent.detail;

      // 暗記モード以外は無視
      if (eventMode !== 'memorization') return;

      if (import.meta.env.DEV && localStorage.getItem('debug-verbose') === 'true') {
        console.log(
          `🚨 [MemorizationView] 弱点語検出: ${word} (Position=${position}) → 再スケジューリング準備`
        );
      }

      // 即座に再スケジューリングをトリガー
      setNeedsRescheduling(true);
      setReschedulingNotification(`弱点語検出: ${word} (Position=${position})`);
    };

    window.addEventListener('weak-word-detected', handleWeakWordDetected);
    return () => {
      window.removeEventListener('weak-word-detected', handleWeakWordDetected);
    };
  }, []);

  // 問題再出題管理フック
  const {
    reAddQuestion: _reAddQuestion,
    clearExpiredFlags,
    updateRequeueStats,
    getRequeuedWords,
    checkPositionMismatch,
  } = useQuestionRequeue<Question>();

  // ═══════════════════════════════════════════════════════════
  // 🔒 再出題「予約枠」(15–30% / 30問先まで) + FIFO
  // - 目的: 分からない/まだまだが固まって出る「振動」を抑える
  // - 実装: 次の30問のうち 15–30% をランダムなスロットとして確保し、誤答/まだまだの順で投入
  // - 注意: 実際の minGap は useQuestionRequeue 側が最終決定（近すぎれば後ろへ調整される）
  const requeueSlotsRef = useRef<number[] | null>(null);
  const requeueSlotsMetaRef = useRef<{
    ratio: number;
    lookahead: number;
    minOffset: number;
  } | null>(null);

  const ensureRequeueSlots = useCallback((currentIndex: number, questionsLength: number) => {
    const lookahead = 30;
    const minOffset = 3;
    const ratio = requeueSlotsMetaRef.current?.ratio ?? 0.15 + Math.random() * (0.3 - 0.15);

    const windowEnd = Math.min(currentIndex + lookahead, questionsLength);
    const candidateStart = Math.min(currentIndex + minOffset, windowEnd);

    const candidates: number[] = [];
    for (let i = candidateStart; i <= windowEnd; i++) candidates.push(i);
    if (candidates.length === 0) {
      requeueSlotsRef.current = [];
      requeueSlotsMetaRef.current = { ratio, lookahead, minOffset };
      return;
    }

    const desiredCount = Math.max(1, Math.round(candidates.length * ratio));
    const targetCount = Math.min(desiredCount, candidates.length);

    const picked = new Set<number>();
    while (picked.size < targetCount) {
      const idx = candidates[Math.floor(Math.random() * candidates.length)];
      picked.add(idx);
    }

    requeueSlotsRef.current = Array.from(picked).sort((a, b) => a - b);
    requeueSlotsMetaRef.current = { ratio, lookahead, minOffset };
  }, []);

  const claimRequeueSlotIndex = useCallback(
    (currentIndex: number, questionsLength: number): number | null => {
      const existing = requeueSlotsRef.current ?? [];
      const pruned = existing.filter((idx) => idx > currentIndex);
      requeueSlotsRef.current = pruned;

      if (pruned.length === 0) {
        ensureRequeueSlots(currentIndex, questionsLength);
      }

      const slots = requeueSlotsRef.current ?? [];
      const next = slots.shift();
      requeueSlotsRef.current = slots;
      return typeof next === 'number' ? next : null;
    },
    [ensureRequeueSlots]
  );

  const restoreRequeueSlotIndex = useCallback((slotIndex: number) => {
    const slots = requeueSlotsRef.current ?? [];
    if (slots.includes(slotIndex)) return;
    slots.push(slotIndex);
    slots.sort((a, b) => a - b);
    requeueSlotsRef.current = slots;
  }, []);

  const shiftRequeueSlotsAfterInsertion = useCallback((minShiftFromIndex: number) => {
    const slots = requeueSlotsRef.current;
    if (!slots || slots.length === 0) return;
    requeueSlotsRef.current = slots.map((idx) => (idx >= minShiftFromIndex ? idx + 1 : idx));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🚀 Phase 1 Pattern 3: 計算結果のメモ化拡大
  // ═══════════════════════════════════════════════════════════

  // カテゴリー別統計をメモ化（sessionStats変更時のみ再計算）
  const _categoryStats = useMemo(() => {
    PerformanceMonitor.start('calculate-category-stats');
    const total = sessionStats.total ?? 0;
    const stats = {
      incorrect: sessionStats.incorrect,
      still_learning: sessionStats.still_learning ?? 0,
      correct: sessionStats.correct,
      mastered: sessionStats.mastered,
      total: total,
      incorrectRate: total > 0 ? sessionStats.incorrect / total : 0,
      correctRate: total > 0 ? sessionStats.correct / total : 0,
    };
    const duration = PerformanceMonitor.end('calculate-category-stats');

    // ⚡ デバッグログは20ms超過時のみ
    if (import.meta.env.DEV && duration > 20) {
      console.warn('⚠️ [MemorizationView] カテゴリー統計計算が遅い', {
        duration: `${duration.toFixed(2)}ms`,
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

  // ✅ 解答後にlocalStorageから統計を再計算（正確な分からない/まだまだカウント）
  // ⚡ パフォーマンス最適化: 5秒間キャッシュ、デバッグログはフラグで制御
  const statsCache = useRef<{
    data: ReturnType<typeof calculateSessionStats>;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (lastAnswerTime === 0) return; // 初回スキップ
    if (isSocial) return; // 社会は別進捗ストレージのため、英語用再計算は行わない

    const recalculate = () => {
      const now = Date.now();

      // ⚡ 5秒間キャッシュ（頻繁な再計算を防ぐ）
      if (statsCache.current && now - statsCache.current.timestamp < 5000) {
        const cached = statsCache.current.data;
        setSessionStats((prev) => ({
          ...prev,
          incorrect: cached.incorrect,
          still_learning: cached.still_learning,
          mastered: cached.mastered,
          correct: prev.correct,
        }));
        return;
      }

      const newStats = calculateSessionStats(questions, 'memorization');
      statsCache.current = { data: newStats, timestamp: now };

      // 🔍 デバッグログは localStorage フラグで制御
      if (import.meta.env.DEV && localStorage.getItem('debug-stats-verbose') === 'true') {
        console.log('🔄 [MemorizationView] 統計再計算', {
          incorrect: newStats.incorrect,
          still_learning: newStats.still_learning,
          mastered: newStats.mastered,
        });
      }

      setSessionStats((prev) => ({
        ...prev,
        incorrect: newStats.incorrect,
        still_learning: newStats.still_learning,
        mastered: newStats.mastered,
        correct: prev.correct,
      }));
    };

    // localStorage書き込み完了を待つため、少し遅延
    const timer = setTimeout(recalculate, 100);
    return () => clearTimeout(timer);
  }, [lastAnswerTime]);

  // 関連分野リストをメモ化（allQuestions変更時のみ再計算）
  const _availableCategories = useMemo(() => {
    PerformanceMonitor.start('get-available-categories');
    const categories = new Set<string>();
    allQuestions.forEach((q) => {
      normalizeRelatedFields((q as any).relatedFields).forEach((field) => categories.add(field));
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

    // 不正データ（wordが存在しない等）を除外してクラッシュを防止
    filtered = filtered.filter((q) => typeof (q as any)?.word === 'string');

    // データソース（問題セットID / 既存source）フィルター
    if (selectedDataSource !== 'all') {
      const set = questionSets.find((qs) => qs.id === selectedDataSource);
      if (set) {
        filtered = set.questions.filter((q) => typeof (q as any)?.word === 'string');
      } else {
        filtered = filtered.filter((q) => (q as any).source === selectedDataSource);
      }
    }

    // 難易度フィルター
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    // 関連分野フィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (q) =>
          normalizeRelatedFields((q as any).relatedFields).includes(selectedCategory)
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
    questionSets,
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
      normalizeRelatedFields((q as any).relatedFields).forEach((field) => categories.add(field));
    });
    return Array.from(categories).sort();
  };

  // 出題する語句を選択（シンプルな実装、後でAI最適化）
  // 🐛 DEBUG: 前回の依存配列の値を保存
  const prevDepsRef = useRef<{
    selectedDifficulty?: string;
    selectedCategory?: string;
    selectedWordPhraseFilter?: string;
    selectedDataSource?: string;
    allQuestionsCount?: number;
    isReviewFocusMode?: boolean;
  }>({});

  const selectQuestionsCountRef = useRef(0);

  useEffect(() => {
    // バッチ再生成フラグがtrueの場合は、isLoadingチェックをスキップ
    if (isLoading && !needsBatchRegeneration) return;

    selectQuestionsCountRef.current += 1;
    const currentCount = selectQuestionsCountRef.current;

    // 🐛 DEBUG: useEffect実行回数と変更された依存配列を記録（verbose時のみ）
    if (import.meta.env.DEV && localStorage.getItem('debug-verbose') === 'true') {
      const changes: string[] = [];

      if (prevDepsRef.current.selectedDifficulty !== selectedDifficulty) {
        changes.push(
          `selectedDifficulty: ${prevDepsRef.current.selectedDifficulty} → ${selectedDifficulty}`
        );
      }
      if (prevDepsRef.current.selectedCategory !== selectedCategory) {
        changes.push(
          `selectedCategory: ${prevDepsRef.current.selectedCategory} → ${selectedCategory}`
        );
      }
      if (prevDepsRef.current.selectedWordPhraseFilter !== selectedWordPhraseFilter) {
        changes.push(
          `selectedWordPhraseFilter: ${prevDepsRef.current.selectedWordPhraseFilter} → ${selectedWordPhraseFilter}`
        );
      }
      if (prevDepsRef.current.selectedDataSource !== selectedDataSource) {
        changes.push(
          `selectedDataSource: ${prevDepsRef.current.selectedDataSource} → ${selectedDataSource}`
        );
      }
      if (prevDepsRef.current.allQuestionsCount !== allQuestions.length) {
        changes.push(
          `allQuestionsCount: ${prevDepsRef.current.allQuestionsCount} → ${allQuestions.length}`
        );
      }
      if (prevDepsRef.current.isReviewFocusMode !== isReviewFocusMode) {
        changes.push(
          `isReviewFocusMode: ${prevDepsRef.current.isReviewFocusMode} → ${isReviewFocusMode}`
        );
      }

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔄 [selectQuestions useEffect] 実行回数: ${currentCount}`);
      console.log(`⏰ タイムスタンプ: ${new Date().toISOString()}`);

      if (changes.length > 0) {
        console.log(`🔍 変更された依存配列:`);
        changes.forEach((change) => console.log(`   - ${change}`));
      } else {
        console.log(`⚠️  変更なし（初回実行またはReact再マウント）`);
      }

      console.log(`📊 現在の値:`, {
        selectedDifficulty,
        selectedCategory,
        selectedWordPhraseFilter,
        selectedDataSource,
        allQuestionsCount: allQuestions.length,
        isReviewFocusMode,
      });
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // 前回の値を保存
      prevDepsRef.current = {
        selectedDifficulty,
        selectedCategory,
        selectedWordPhraseFilter,
        selectedDataSource,
        allQuestionsCount: allQuestions.length,
        isReviewFocusMode,
      };
    }

    const selectQuestions = async () => {
      try {
        // バッチ再生成フラグをリセット
        if (needsBatchRegeneration) {
          setNeedsBatchRegeneration(false);
          if (import.meta.env.DEV && localStorage.getItem('debug-verbose') === 'true') {
            console.log('🔄 [バッチ再生成] フラグをリセットしました');
          }
        }

        // データソース（問題セットID / 既存source）に基づいて問題を取得
        let baseQuestions = allQuestions;
        if (selectedDataSource !== 'all') {
          const set = questionSets.find((qs) => qs.id === selectedDataSource);
          if (set) {
            baseQuestions = set.questions;
          } else {
            baseQuestions = allQuestions.filter((q) => (q as any).source === selectedDataSource);
          }
        }

        if (baseQuestions.length === 0) {
          logger.warn('[MemorizationView] 問題が見つかりません');
          return;
        }

        // 学習設定に基づいてフィルタリング
        let filtered = baseQuestions;

        // 不正データ（wordが存在しない等）を除外してクラッシュを防止
        filtered = filtered.filter((q) => typeof (q as any)?.word === 'string');

        // 難易度フィルター
        if (selectedDifficulty !== 'all') {
          filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
        }

        // 関連分野フィルター
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((q) =>
            normalizeRelatedFields((q as any).relatedFields).includes(selectedCategory)
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

        // ✅ progressCacheを用意（英語はprogressStorage、社会はsocialStudiesProgress）
        let wordProgress: Record<string, any> = {};
        if (isSocial) {
          const social = loadSocialStudiesProgressSync();
          const termProgress = (social as any).termProgress || {};
          for (const [term, termData] of Object.entries<any>(termProgress)) {
            const correctCount = termData.correctCount ?? 0;
            const incorrectCount = termData.incorrectCount ?? 0;
            const attempts = correctCount + incorrectCount;
            wordProgress[term] = {
              word: term,
              correctCount,
              incorrectCount,
              totalAttempts: attempts,
              memorizationAttempts: attempts,
              memorizationCorrect: correctCount,
              memorizationPosition: termData.position ?? 35,
              lastStudied: termData.lastAnswered ? new Date(termData.lastAnswered).getTime() : 0,
              nextReviewDate: termData.nextReviewDate
                ? new Date(termData.nextReviewDate).getTime()
                : undefined,
              streak: 0,
            };
          }
        } else {
          await loadProgress();
          const progress = loadProgressSync();
          wordProgress = progress.wordProgress || {};
        }

        // 🔥 復習/ブースト時に「弱点語がフィルタで落ちて再出題されない」を防ぐ
        // filtered（ユーザー設定）に、現在の進捗上の弱点語（Position>=40 & attempts>0）を必ず含める
        const weakQuestions: Question[] = [];

        // 🐛 DEBUG: LocalStorageのまだまだ語を全て列挙
        const allWeakWordsInLS = Object.entries(wordProgress)
          .filter(([_word, wp]) => {
            const attempts = wp.memorizationAttempts ?? wp.totalAttempts ?? 0;
            if (attempts <= 0) return false;
            const pos = isSocial
              ? (wp.memorizationPosition ?? 35)
              : determineWordPosition(wp, 'memorization');
            return pos >= 40;
          })
          .map(([word, wp]) => ({
            word,
            position: isSocial
              ? (wp.memorizationPosition ?? 35)
              : determineWordPosition(wp, 'memorization'),
            memPos: wp.memorizationPosition,
            attempts: wp.memorizationAttempts ?? wp.totalAttempts ?? 0,
          }));

        if (import.meta.env.DEV) {
          console.log(`🚨 [LocalStorageのまだまだ語] 合計: ${allWeakWordsInLS.length}語`);
          if (allWeakWordsInLS.length > 0) {
            console.log(`🚨 [まだまだ語リスト]:`, allWeakWordsInLS);
          }
        }

        // baseQuestionsに存在するか確認
        const baseQuestionsWords = new Set(baseQuestions.map((q) => q.word));
        const missingFromBase = allWeakWordsInLS.filter((w) => !baseQuestionsWords.has(w.word));

        // 🔍 DEBUG: 検出結果をlocalStorageに保存（デバッグパネル用）
        try {
          localStorage.setItem(
            'debug_weak_words_detection',
            JSON.stringify({
              timestamp: new Date().toISOString(),
              allWeakWordsInLS: allWeakWordsInLS.length,
              weakWordsList: allWeakWordsInLS,
              missingFromBase: missingFromBase.map((w) => w.word),
              baseQuestionsCount: baseQuestions.length,
              filteredCount: filtered.length,
            })
          );
        } catch {
          // LocalStorageアクセスエラーを無視
        }

        if (import.meta.env.DEV && missingFromBase.length > 0) {
          console.error(
            `❌ [致命的エラー] まだまだ語${missingFromBase.length}語がbaseQuestionsに存在しません:`,
            missingFromBase.map((w) => w.word)
          );
        }

        for (const q of baseQuestions) {
          const wp = wordProgress[q.word];
          if (!wp) continue;
          const attempts = wp.memorizationAttempts ?? wp.totalAttempts ?? 0;
          if (attempts <= 0) continue;
          const pos = isSocial
            ? (wp.memorizationPosition ?? 35)
            : determineWordPosition(wp, 'memorization');

          // 🐛 DEBUG: まだまだ語が吸引されない問題のデバッグ
          if (import.meta.env.DEV && pos >= 40) {
            console.log(
              `🔍 [WeakQuestion検出] ${q.word}: Position=${pos}, memPos=${wp.memorizationPosition}, stillLearning=${wp.memorizationStillLearning}, attempts=${attempts}`
            );
          }

          if (pos >= 40) {
            weakQuestions.push(q);
          }
        }

        // 🐛 DEBUG: 弱点語のサマリー
        if (import.meta.env.DEV) {
          console.log(
            `🔍 [WeakQuestions] 検出数: ${weakQuestions.length}語 / LocalStorage: ${allWeakWordsInLS.length}語, 候補: ${baseQuestions.length}語`
          );
          if (weakQuestions.length > 0) {
            console.log(
              `🔍 [WeakQuestions] TOP5:`,
              weakQuestions.slice(0, 5).map((q) => q.word)
            );
          }
          if (weakQuestions.length < allWeakWordsInLS.length) {
            console.error(
              `❌ [データ欠損] baseQuestionsに${allWeakWordsInLS.length - weakQuestions.length}語のまだまだ語が見つかりません`
            );
          }
        }

        // 🔍 DEBUG: weakQuestionsの内容もlocalStorageに追加保存
        try {
          const prevData = JSON.parse(localStorage.getItem('debug_weak_words_detection') || '{}');
          localStorage.setItem(
            'debug_weak_words_detection',
            JSON.stringify({
              ...prevData,
              weakQuestionsCount: weakQuestions.length,
              weakQuestionsWords: weakQuestions.map((q) => q.word),
            })
          );
        } catch {
          // LocalStorageアクセスエラーを無視
        }

        // 🔍 DEBUG: weakQuestions検出結果をlocalStorageに保存（デバッグパネル用）
        try {
          const detectionResult = JSON.parse(
            localStorage.getItem('debug_weak_words_detection') || '{}'
          );
          detectionResult.weakQuestionsDetected = weakQuestions.length;
          detectionResult.weakQuestionsWords = weakQuestions.map((q) => q.word);
          detectionResult.dataMissing = allWeakWordsInLS.length - weakQuestions.length;
          localStorage.setItem('debug_weak_words_detection', JSON.stringify(detectionResult));
        } catch {
          // LocalStorageアクセスエラーを無視
        }

        let candidateQuestions = filtered;
        if (weakQuestions.length > 0) {
          const dedup = new Map<string, Question>();
          for (const q of filtered) dedup.set(q.word, q);
          for (const q of weakQuestions) dedup.set(q.word, q);
          candidateQuestions = Array.from(dedup.values());
        }

        // 🐛 DEBUG: scheduler.schedule()に渡す直前の状態を確認
        let prepareSpanId: string | undefined;
        if (import.meta.env.DEV) {
          // 🧪 A/Bテスト情報をlocalStorageに保存（デバッグパネル表示用）
          try {
            localStorage.setItem(
              'debug_ab_session_info',
              JSON.stringify({
                variant: abVariant,
                sessionId: abSessionId,
                timestamp: new Date().toISOString(),
              })
            );
          } catch {
            // LocalStorageアクセスエラーを無視
          }

          const weakWordsInCandidates = candidateQuestions.filter((q) => {
            const wp = wordProgress[q.word];
            if (!wp) return false;
            const attempts = wp.memorizationAttempts ?? wp.totalAttempts ?? 0;
            if (attempts <= 0) return false;
            const pos = isSocial
              ? (wp.memorizationPosition ?? 35)
              : determineWordPosition(wp, 'memorization');
            return pos >= 40;
          });

          // 🎫 トレース開始
          DebugTracer.startTrace('weak-words-flow');
          prepareSpanId = DebugTracer.startSpan('MemorizationView.prepareScheduling', {
            weakWordsCount: weakWordsInCandidates.length,
            totalCount: candidateQuestions.length,
            weakWords: weakWordsInCandidates.map((q) => q.word),
          });
        }

        if (import.meta.env.DEV) {
          console.log(`📞 [scheduler.schedule呼び出し] 初回スケジューリング`, {
            candidateQuestionsCount: candidateQuestions.length,
            sessionStats: sessionStatsRef.current,
            timestamp: new Date().toISOString(),
          });
        }

        const scheduleResult = await scheduler.schedule({
          questions: candidateQuestions,
          mode: 'memorization',
          useCategorySlots,
          // 🆕 バッチ数設定（設定なしの場合は全語出題）
          batchSize: batchSize || undefined,
          // 廃止: limits（バッチ数設定と動的上限システムに統合）
          // limits: {
          //   learningLimit: stillLearningLimit,
          //   reviewLimit: incorrectLimit,
          // },
          sessionStats: {
            correct: sessionStatsRef.current.correct,
            incorrect: sessionStatsRef.current.incorrect,
            still_learning: sessionStatsRef.current.still_learning || 0,
            mastered: sessionStatsRef.current.mastered || 0, // 定着済みも反映
            duration: Date.now() - cardDisplayTimeRef.current,
          },
          isReviewFocusMode,
          hybridMode: abVariant === 'B', // 🧪 B: Position主軸+AI小補正
          finalPriorityMode: abVariant === 'C', // 🧪 C: AI主軸（finalPriority主因）
          progressOverride: isSocial ? wordProgress : undefined,
        });

        if (!scheduleResult || !scheduleResult.scheduledQuestions) {
          logger.error('[MemorizationView] スケジュール結果が無効です', { scheduleResult });
          return;
        }

        const sortedQuestions = scheduleResult.scheduledQuestions;

        // 🚨 強制検証: スケジューラーから受け取ったバッチの連続重複チェック
        if (import.meta.env.DEV && useCategorySlots) {
          for (let i = 0; i < sortedQuestions.length - 1; i++) {
            if (sortedQuestions[i].word === sortedQuestions[i + 1].word) {
              const errorMsg = `🚨🚨🚨 [MemorizationView] スケジューラーから連続重複バッチを受信: "${sortedQuestions[i].word}" が位置${i}と${i + 1}で連続！`;
              console.error(errorMsg);
              logger.error('[MemorizationView] スケジューラーバッチ連続重複', {
                word: sortedQuestions[i].word,
                position1: i,
                position2: i + 1,
                batchSize: sortedQuestions.length,
              });
              throw new Error(errorMsg);
            }
          }

          const allWords = sortedQuestions.map((q) => q.word);
          const uniqueWords = new Set(allWords);
          if (allWords.length !== uniqueWords.size) {
            const duplicates = allWords.filter((word, index) => allWords.indexOf(word) !== index);
            console.error(
              `🚨 [MemorizationView] スケジューラーバッチに重複語あり（非連続）: ${[...new Set(duplicates)].join(', ')}`
            );
          } else {
            console.log(
              `✅ [MemorizationView] スケジューラーバッチ検証成功（${sortedQuestions.length}問、全ユニーク）`
            );
          }
        }

        // 🎫 スパン終了（スケジュール完了）
        if (import.meta.env.DEV && prepareSpanId) {
          const weakWordsAfterScheduling = sortedQuestions.filter((q) => {
            const wp = wordProgress[q.word];
            if (!wp) return false;
            const attempts = wp.memorizationAttempts ?? wp.totalAttempts ?? 0;
            if (attempts <= 0) return false;
            const pos = isSocial
              ? (wp.memorizationPosition ?? 35)
              : determineWordPosition(wp, 'memorization');
            return pos >= 40;
          });

          DebugTracer.endSpan(prepareSpanId, {
            weakWordsCountAfter: weakWordsAfterScheduling.length,
            totalCountAfter: sortedQuestions.length,
            weakWordsAfter: weakWordsAfterScheduling.map((q) => q.word),
          });
        }

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
          // 📊 1問目の出題カウントは解答時に更新（setSessionStats削除で無限ループ防止）
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
    isReviewFocusMode,
    needsBatchRegeneration, // バッチ再生成トリガー
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
        review: 0,
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
      _setAbConsecutiveDivergence(0);

      logger.info('[MemorizationView] 成績リセット完了');
      alert('学習記録をリセットしました');
    } catch (error) {
      logger.error('[MemorizationView] 成績リセット失敗', error);
      alert('リセットに失敗しました');
    }
  };

  // デバッグ: 再出題ロジック（デバッグパネル表示/トグル）
  const handleDebugRequeue = () => {
    if (import.meta.env.DEV) {
      setShowDebugPanel((prev) => !prev);
    }
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

  // 廃止: 上限達成時の自動復習モード（バッチ数設定と動的上限システムで管理）
  // useEffect(() => {
  //   if (
  //     (stillLearningLimit !== null && sessionStats.still_learning >= stillLearningLimit) ||
  //     (incorrectLimit !== null && sessionStats.incorrect >= incorrectLimit)
  //   ) {
  //     if (!isReviewFocusMode) {
  //       setIsReviewFocusMode(true);
  //     }
  //   }
  // }, [sessionStats, stillLearningLimit, incorrectLimit, isReviewFocusMode]);

  // 🔒 強制装置削除: questions依存配列により無限ループを引き起こすため削除
  // sessionStatsの再計算は解答時（handleAnswer）に実施

  // calculateOptimalInterval, calculateForgettingRisk: QuestionSchedulerに統合済み

  // ローカルソート関数は削除: QuestionSchedulerに統合済み

  // 🎯 自動再スケジューリング実行
  const reschedulingCountRef = useRef(0);

  useEffect(() => {
    // 🚫 バッチ方式: useCategorySlots=true の場合、バッチ途中での再スケジューリングは禁止
    // バッチ完全消化後、次のバッチ生成時に最新のPosition情報を反映
    if (useCategorySlots) {
      if (needsRescheduling && import.meta.env.DEV) {
        console.log(
          '⏸️ [バッチ方式] バッチ途中の再スケジューリング要求を保留（次のバッチ生成時に反映）'
        );
      }
      return;
    }

    if (!needsRescheduling || isLoading || questions.length === 0) return;

    const performRescheduling = async () => {
      try {
        reschedulingCountRef.current += 1;

        if (import.meta.env.DEV) {
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`🔄 [自動再スケジューリング] 実行回数: ${reschedulingCountRef.current}`);
          console.log(`⏰ タイムスタンプ: ${new Date().toISOString()}`);
          console.log(`📊 状態:`, {
            answerCount: answerCountSinceSchedule,
            reason: reschedulingNotification,
            questionsLength: questions.length,
          });
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        }

        logger.info('[MemorizationView] 自動再スケジューリング開始', {
          answerCount: answerCountSinceSchedule,
          reason: reschedulingNotification,
        });

        // ✅ 暗記タブ同等: 現在位置以降のみ再スケジューリング（再出題キュー破壊を防ぐ）
        // currentQuestion を UI で保持しているため、現在表示中は固定し「次以降」を対象にする
        const currentIndexAtSchedule = currentIndexRef.current;
        const currentWordAtSchedule = currentQuestionWordRef.current;

        const lockedPrefixCount = Math.min(currentIndexAtSchedule + 1, questions.length);

        // 🔧 再スケジューリング時に、LocalStorageから最新のProgressを読み込み、Positionを更新
        const progress = loadProgressSync();
        const wordProgress = progress.wordProgress || {};

        // questions配列のPositionを最新に更新
        const updatedQuestions = questions.map((q) => {
          const wp = wordProgress[q.word];
          if (!wp) return q;
          const latestPosition = determineWordPosition(wp, 'memorization');
          if (latestPosition !== (q as any).position) {
            if (import.meta.env.DEV) {
              console.log(
                `🔄 [再スケジューリング] Position更新: ${q.word} ${(q as any).position} → ${latestPosition}`
              );
            }
            return { ...q, position: latestPosition };
          }
          return q;
        });

        const remaining = updatedQuestions.slice(lockedPrefixCount);

        // 🔥 再スケジューリング時に、現在のprogressから新たにまだまだ語を検出
        const weakQuestions: Question[] = [];

        // 全問題リストからまだまだ語を検出
        for (const q of allQuestions) {
          const wp = wordProgress[q.word];
          if (!wp) continue;
          const attempts = wp.memorizationAttempts ?? wp.totalAttempts ?? 0;
          if (attempts <= 0) continue;
          const pos = determineWordPosition(wp, 'memorization');

          if (pos >= 40) {
            // remainingに既に含まれていない場合のみ追加
            if (!remaining.find((rq) => rq.word === q.word)) {
              weakQuestions.push(q);
            }
          }
        }

        // weakQuestionsをremainingに追加
        let rescheduleTarget = remaining;
        if (weakQuestions.length > 0) {
          if (import.meta.env.DEV) {
            console.log(`🔥 [再スケジューリング] まだまだ語を追加: ${weakQuestions.length}語`);
            console.log(
              `   単語:`,
              weakQuestions.map((q) => q.word)
            );
          }
          const dedup = new Map<string, Question>();
          for (const q of remaining) dedup.set(q.word, q);
          for (const q of weakQuestions) dedup.set(q.word, q);
          rescheduleTarget = Array.from(dedup.values());
        }

        if (rescheduleTarget.length === 0) {
          logger.warn('[MemorizationView] 再スケジューリング対象なし');
          setAnswerCountSinceSchedule(0);
          setNeedsRescheduling(false);
          setReschedulingNotification(null);
          recordRescheduleEvent('skipped', '再スケジューリング対象なし', {
            lockedPrefixCount,
            total: questions.length,
          });
          return;
        }

        // QuestionSchedulerで再スケジューリング
        const result = await scheduler.schedule({
          questions: rescheduleTarget,
          mode: 'memorization',
          useCategorySlots,
          // 🆕 バッチ数設定（設定なしの場合は全語出題）
          batchSize: batchSize || undefined,
          // 廃止: limits（バッチ数設定と動的上限システムに統合）
          // limits: {
          //   learningLimit: stillLearningLimit ?? null,
          //   reviewLimit: incorrectLimit ?? null,
          // },
          sessionStats: {
            correct: sessionStats.correct,
            incorrect: sessionStats.incorrect,
            still_learning: sessionStats.still_learning ?? 0,
            mastered: sessionStats.mastered,
            duration: 0,
          },
          isReviewFocusMode,
          hybridMode: abVariant === 'A' || abVariant === 'B',
          finalPriorityMode: abVariant === 'C',
        });

        setQuestions((prev) => {
          // スケジュール中に現在位置が進んだ場合は適用しない
          if (currentIndexRef.current !== currentIndexAtSchedule) return prev;
          if (currentQuestionWordRef.current !== currentWordAtSchedule) return prev;

          const prefix = prev.slice(0, lockedPrefixCount);
          return [...prefix, ...result.scheduledQuestions];
        });

        // UI: 通知文言は出さず、ScoreBoardの「学習状況」タブをパルスさせる
        setLearningStatusTabPulseKey(Date.now());
        recordRescheduleEvent('applied', reschedulingNotification ?? '自動再スケジューリング', {
          lockedPrefixCount,
          remainingBefore: rescheduleTarget.length,
          remainingAfter: result.scheduledQuestions.length,
        });

        // カウンターとフラグをリセット
        setAnswerCountSinceSchedule(0);
        setNeedsRescheduling(false);

        // 理由はデバッグに残すが、UI通知は出さないため即時クリア
        setReschedulingNotification(null);

        logger.info('[MemorizationView] 自動再スケジューリング完了', {
          newLength: result.scheduledQuestions.length,
        });
      } catch (error) {
        logger.error('[MemorizationView] 再スケジューリングエラー:', error);
        setNeedsRescheduling(false);
        setReschedulingNotification(null);
        recordRescheduleEvent('error', '再スケジューリングエラー', {
          error: String(error),
        });
      }
    };

    performRescheduling();
  }, [
    needsRescheduling,
    isLoading,
    questions,
    batchSize, // 🆕 バッチ数設定
    reviewRatioLimit, // 🆕 上限比率
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
      const answeredIndexSnapshot = currentIndex;

      // ═══════════════════════════════════════════════════════════
      // 🚀 即座のUI更新（ステップ1: 同期処理のみ）
      // ═══════════════════════════════════════════════════════════

      // 回答結果を記録（動的AIコメント用）
      setLastAnswerCorrect(isCorrect);
      setLastAnswerWord(currentQuestion.word);

      // 🔥 新規枯渇防止: 「分からない」連打時は残りキューを再スケジューリングして
      // GamificationAIの新規混入（[苦手語4, 新規1]）を回復させる
      // 🚫 バッチ方式: useCategorySlots=true の場合は無効化（バッチ完全消化まで再計算しない）
      const nextIncorrectStreak = !isCorrect && !isStillLearning ? incorrectStreak + 1 : 0;
      if (!useCategorySlots && !needsRescheduling && nextIncorrectStreak >= 5) {
        setNeedsRescheduling(true);
        setReschedulingNotification('不正解連打で新規枯渇を回避');
        recordRescheduleEvent('triggered', '不正解連打で新規枯渇を回避', {
          word: currentQuestion.word,
          incorrectStreak: nextIncorrectStreak,
        });
      }
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
        let newStillLearning = prev.still_learning ?? 0;

        // ✅ 修正: 再出題語の解消処理（正解時のみ減算）
        if (isCorrect && wasIncorrect) {
          if (newIncorrect > 0) {
            newIncorrect = Math.max(0, newIncorrect - 1);
          } else if (newStillLearning > 0) {
            newStillLearning = Math.max(0, newStillLearning - 1);
          }
        }

        // ✅ 修正: 「分からない」は必ず+1、「まだまだ」は必ず+1（減算済みの値に追加）
        const newStats = {
          correct: isCorrect ? prev.correct + 1 : prev.correct,
          still_learning: isStillLearning ? (newStillLearning ?? 0) + 1 : (newStillLearning ?? 0),
          incorrect: !isCorrect && !isStillLearning ? newIncorrect + 1 : newIncorrect,
          review: prev.review,
          mastered: isCorrect ? prev.mastered + 1 : prev.mastered,
          total: prev.total ?? 0,
          newQuestions: prev.newQuestions,
          reviewQuestions: prev.reviewQuestions,
          consecutiveNew: prev.consecutiveNew,
          consecutiveReview: prev.consecutiveReview,
        };

        // 🐛 DEBUG: sessionStats更新を記録（フラグで制御）
        if (import.meta.env.DEV && localStorage.getItem('debug-stats-verbose') === 'true') {
          console.log('📊 [setSessionStats] 解答後の統計更新', {
            word: currentQuestion.word,
            isCorrect,
            isStillLearning,
            before: { incorrect: prev.incorrect, still_learning: prev.still_learning },
            after: { incorrect: newStats.incorrect, still_learning: newStats.still_learning },
          });
        }

        return newStats;
      });

      // � Phase 1 Pattern 2: 即座のカテゴリー判定（10-50ms目標）
      // UI応答を最優先し、詳細分析は後回し
      PerformanceMonitor.start('quick-category-determination');
      const position = (() => {
        if (isSocial) {
          const social = loadSocialStudiesProgressSync();
          const termData = (social as any).termProgress?.[answeredQuestion.word];
          return termData?.position ?? 35;
        }

        const progressCache = loadProgressSync();
        const wordProgress = progressCache.wordProgress?.[answeredQuestion.word];
        return determineWordPosition(wordProgress, 'memorization');
      })();
      const categoryBefore = positionToCategory(position);

      const categoryDuration = PerformanceMonitor.end('quick-category-determination');

      if (categoryDuration > 50) {
        PerformanceMonitor.warnIfSlow('quick-category-determination', categoryDuration, 50);
      }

      QualityMonitor.recordCategoryDetermination(categoryBefore, 1.0, categoryDuration);

      // 📊 デバッグパネル用: 回答履歴を記録
      // ✅ 修正: 押したボタンに基づいて直接カウント（Position判定に依存しない）
      const answerType = isCorrect ? 'correct' : isStillLearning ? 'still_learning' : 'incorrect';
      const countedCategory = isCorrect
        ? 'mastered'
        : isStillLearning
          ? 'still_learning'
          : 'incorrect';
      setAnswerHistory((prev) => [
        ...prev,
        {
          word: answeredQuestion.word,
          answer: answerType,
          countedAs: countedCategory,
          position: position,
          timestamp: Date.now(),
        },
      ]);

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
          if (isSocial) {
            const field = getSocialFallbackField(answeredQuestion);
            updateSocialStudiesProgress(answeredQuestion.word, field, isCorrect);

            // 🔧 解答後に、questions配列のPositionを即時更新（振動防止）
            try {
              const socialAfter = loadSocialStudiesProgressSync();
              const termData = (socialAfter as any).termProgress?.[answeredQuestion.word];
              const posAfter = termData?.position ?? 35;
              if (posAfter !== (answeredQuestion as any).position) {
                setQuestions((prev) =>
                  prev.map((q) =>
                    q.word === answeredQuestion.word ? { ...q, position: posAfter } : q
                  )
                );
              }
            } catch {
              // 社会進捗更新後の同期取得に失敗しても学習体験を阻害しない
            }
          } else {
            await updateWordProgress(
              answeredQuestion.word,
              isCorrect,
              answeredViewDuration * 1000, // ミリ秒に変換
              undefined,
              'memorization', // 暗記タブは独立したモードとして記録
              isStillLearning // まだまだフラグを渡す
            );

            // ✅ 学習状態の“新規悪化”を検知したら、残りキューを再吸引（再スケジューリング）
            // 目的: 「新たに発生したまだまだ/分からない」を学習AIが感知して反映できるようにする
            try {
              const progressCacheAfter = loadProgressSync();
              const wpAfter = progressCacheAfter.wordProgress?.[answeredQuestion.word];
              const posAfter = determineWordPosition(wpAfter, 'memorization');
              const categoryAfter = positionToCategory(posAfter);

              const becameHarderNow =
                isReviewWordCategory(categoryAfter) && categoryAfter !== categoryBefore;

              // 🔧 解答後に、questions配列のPositionを即時更新（振動防止）
              if (posAfter !== (answeredQuestion as any).position) {
                if (import.meta.env.DEV) {
                  console.log(
                    `🔄 [解答後Position更新] ${answeredQuestion.word}: ${(answeredQuestion as any).position} → ${posAfter}`
                  );
                }

                setQuestions((prev) => {
                  return prev.map((q) => {
                    if (q.word === answeredQuestion.word) {
                      return { ...q, position: posAfter };
                    }
                    return q;
                  });
                });
              }

              // 📸 解答直後のスナップショットを保存（デバッグ用）
              if (import.meta.env.DEV && (!isCorrect || isStillLearning)) {
                try {
                  const answerSnapshot = {
                    timestamp: new Date().toISOString(),
                    word: answeredQuestion.word,
                    answerType: isCorrect
                      ? 'correct'
                      : isStillLearning
                        ? 'still_learning'
                        : 'incorrect',
                    positionBefore: (answeredQuestion as any).position,
                    positionAfter: posAfter,
                    categoryBefore,
                    categoryAfter,
                    currentIndex: answeredIndexSnapshot,
                    totalQuestions: questions.length,
                  };

                  // LocalStorageに保存（最新10件のみ保持）
                  const existingSnapshots = JSON.parse(
                    localStorage.getItem('debug_answer_snapshots') || '[]'
                  );
                  const newSnapshots = [answerSnapshot, ...existingSnapshots].slice(0, 10);
                  localStorage.setItem('debug_answer_snapshots', JSON.stringify(newSnapshots));

                  console.log('📸 [解答スナップショット保存]', answerSnapshot);
                } catch (error) {
                  console.error('❌ スナップショット保存失敗:', error);
                }
              }

              if (becameHarderNow) {
                // 🚫 バッチ方式: useCategorySlots=true の場合は無効化
                if (!useCategorySlots) {
                  setNeedsRescheduling(true);
                  setReschedulingNotification(`学習状態変化: ${categoryBefore}→${categoryAfter}`);
                  recordRescheduleEvent(
                    'triggered',
                    `学習状態変化: ${categoryBefore}→${categoryAfter}`,
                    {
                      word: answeredQuestion.word,
                      categoryBefore,
                      categoryAfter,
                      posAfter,
                    }
                  );
                }
              }
            } catch (error) {
              logger.error('[MemorizationView] カテゴリ変化検知エラー:', error);
            }

            // ✅ 覚えてる化（Position < 40）後は、未来の再出題コピー(reAddedCount>0)を残さない
            // これで「覚えてる/定着後に古いキューが残って再出題され続ける」ループを遮断
            if (isCorrect) {
              try {
                const progressCacheAfter = loadProgressSync();
                const wpAfter = progressCacheAfter.wordProgress?.[answeredQuestion.word];
                const posAfter = determineWordPosition(wpAfter, 'memorization');
                const isRememberedNow = posAfter < 40;

                if (isRememberedNow) {
                  setQuestions((prev) => {
                    if (!Array.isArray(prev) || prev.length === 0) return prev;
                    const pivot = Math.min(answeredIndexSnapshot, prev.length - 1);

                    return prev.filter((q, idx) => {
                      if (idx <= pivot) return true;
                      if (q.word !== answeredQuestion.word) return true;
                      return !(((q as any).reAddedCount || 0) > 0);
                    });
                  });
                }
              } catch {
                // 失敗しても学習体験を阻害しない
              }
            }
          }
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
      // 🚫 バッチ方式: useCategorySlots=true の場合は無効化（バッチ完全消化まで再計算しない）
      if (!useCategorySlots) {
        setAnswerCountSinceSchedule((prev) => {
          const newCount = prev + 1;

          // トリガー条件1: 50回解答ごと
          if (newCount >= 50) {
            setNeedsRescheduling(true);
            setReschedulingNotification('50回解答に達しました');
            recordRescheduleEvent('triggered', '50回解答に達しました', {
              answerCountSinceSchedule: newCount,
            });
            return newCount;
          }

          // トリガー条件2: 10回ごとにPosition不整合チェック（初回30回はスキップ）
          if (newCount >= 30 && newCount % 10 === 0) {
            try {
              const mismatchResult = checkPositionMismatch(questions, 'memorization');
              if (mismatchResult.needsRescheduling) {
                setNeedsRescheduling(true);
                setReschedulingNotification(mismatchResult.reason);
                recordRescheduleEvent('triggered', mismatchResult.reason, {
                  answerCountSinceSchedule: newCount,
                });
              }
            } catch (error) {
              logger.error('[MemorizationView] Position不整合チェックエラー:', error);
            }
          }

          return newCount;
        });
      }

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
      // 📌 重要: useCategorySlots=true の時は無効化（バッチ内で各語1回のみ保証）
      // 不正解またはまだまだの場合に再追加
      let questionsForNextIndex = questions; // 次のインデックス計算用

      if ((!isCorrect || isStillLearning) && !useCategorySlots) {
        const slotIndex = claimRequeueSlotIndex(currentIndex, questions.length);
        const updatedQuestions = _reAddQuestion(
          currentQuestion,
          questions,
          currentIndex,
          'memorization',
          {
            insertAtIndex: slotIndex ?? undefined,
            outcome: !isCorrect ? 'incorrect' : 'still_learning',
          }
        );
        if (updatedQuestions !== questions) {
          // 挿入により配列長が増えた場合、残スロットのズレを軽減するため後ろへシフト
          if (slotIndex !== null && updatedQuestions.length > questions.length) {
            shiftRequeueSlotsAfterInsertion(slotIndex);
          }
          questionsForNextIndex = updatedQuestions; // 更新後の配列を使用
          setQuestions(updatedQuestions);
          if (import.meta.env.DEV) {
            const reason = !isCorrect ? '分からない' : 'まだまだ';
            console.log(`✅ [再出題] キュー追加 (${reason})`, {
              word: currentQuestion.word,
              requestedInsertAt: slotIndex,
              newLength: updatedQuestions.length,
            });
          }
        } else if (slotIndex !== null) {
          // 実際に再追加されなかった場合は、予約枠を消費しない
          restoreRequeueSlotIndex(slotIndex);
        }
      } else if ((!isCorrect || isStillLearning) && useCategorySlots) {
        if (import.meta.env.DEV) {
          console.log(`⏭️ [再出題スキップ] useCategorySlots=true のため再出題無効`, {
            word: currentQuestion.word,
            outcome: !isCorrect ? 'incorrect' : 'still_learning',
          });
        }
      }

      // 次の語句へ（再出題キュー追加後の配列を使用）
      let nextIndex = currentIndex + 1;

      // 🚫 連続出題防止: 直前に回答した問題をスキップ（最大20問先までチェック）
      // 📌 バッチ内で同語が連続出題されないよう、広範囲でスキャン
      const maxSkip = Math.min(nextIndex + 20, questionsForNextIndex.length);
      let skippedCount = 0;
      while (
        nextIndex < maxSkip &&
        questionsForNextIndex[nextIndex].word === currentQuestion.word
      ) {
        skippedCount++;
        logger.warn('[MemorizationView] 連続出題を検出、スキップ', {
          word: questionsForNextIndex[nextIndex].word,
          nextIndex,
          skippedCount,
        });
        nextIndex++;
      }
      if (skippedCount > 0 && import.meta.env.DEV) {
        console.log(`🚫 [連続出題防止] ${currentQuestion.word} を${skippedCount}問スキップ`);
      }

      if (nextIndex < questionsForNextIndex.length) {
        // 🚫 バッチ方式: useCategorySlots=true の場合、バッチ確定後は配列を一切変更しない
        // セッション優先フラグのクリーン処理も無効化（バッチの同一性を保つ）
        if (!useCategorySlots) {
          const clearedQuestions = clearExpiredFlags(questionsForNextIndex, currentIndex);
          if (clearedQuestions !== questionsForNextIndex) {
            setQuestions(clearedQuestions);
          }
        }

        const nextQuestion = questionsForNextIndex[nextIndex];

        // 🚨 振動検出: 直前と同じ単語の場合、詳細ログを出力
        if (import.meta.env.DEV && nextQuestion.word === currentQuestion.word) {
          const errorMsg = `🚨🚨🚨 [振動検出] 連続出題防止をすり抜けて振動が発生: "${nextQuestion.word}"`;
          console.error(errorMsg);
          console.error('[振動詳細]', {
            currentWord: currentQuestion.word,
            nextWord: nextQuestion.word,
            currentIndex,
            nextIndex,
            skippedCount,
            arrayLength: questionsForNextIndex.length,
            useCategorySlots,
            近隣10問: questionsForNextIndex
              .slice(Math.max(0, nextIndex - 5), nextIndex + 5)
              .map((q, i) => `${nextIndex - 5 + i}: ${q.word}`),
          });
          logger.error('[MemorizationView] 振動検出', {
            word: nextQuestion.word,
            currentIndex,
            nextIndex,
            skippedCount,
          });

          // 強制的に次の異なる単語へスキップ
          let safeIndex = nextIndex + 1;
          while (
            safeIndex < questionsForNextIndex.length &&
            questionsForNextIndex[safeIndex].word === currentQuestion.word
          ) {
            console.error(`🚨 [振動修正] ${safeIndex}番目も同じ単語、さらにスキップ`);
            safeIndex++;
          }

          if (safeIndex < questionsForNextIndex.length) {
            console.log(
              `✅ [振動修正] ${safeIndex}番目へ強制移動: ${questionsForNextIndex[safeIndex].word}`
            );
            nextIndex = safeIndex;
          } else {
            console.error('❌ [振動修正失敗] これ以上スキップできません');
          }
        }

        // nextIndexが変更された可能性があるため、再度nextQuestionを取得
        const finalNextQuestion = questionsForNextIndex[nextIndex];

        // 再出題確認ログ
        if (import.meta.env.DEV && (finalNextQuestion as any).reAddedCount > 0) {
          console.log('🔄 [再出題] 問題表示', {
            word: finalNextQuestion.word,
            reAddedCount: (finalNextQuestion as any).reAddedCount,
            nextIndex,
          });
        }

        setCurrentQuestion(finalNextQuestion);
        setCurrentIndex(nextIndex);
        cardDisplayTimeRef.current = Date.now();
        // 📊 新しい問題の出題カウントは解答時に更新（setSessionStats削除で無限ループ防止）
        // 次の問題に移動したのlastAnswerWordをリセット（解答前に解答後コメントが表示されるのを防ぐ）
        setLastAnswerWord(undefined);
      } else {
        // 🎯 バッチ完全消化: 次のバッチを生成（バッチ方式の原則）
        if (useCategorySlots) {
          console.log('🔄 [バッチ方式] バッチ完全消化 → 次のバッチを生成します');
          // 次のバッチ生成をトリガー（初回スケジューリングと同じロジック）
          setQuestions([]);
          setCurrentQuestion(null);
          setCurrentIndex(0);
          setNeedsBatchRegeneration(true); // バッチ再生成フラグを設定
          return;
        }

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
              mlEnabled: true, // 🧪 Week 4: MLは固定ON
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
      batchSize, // 🆕 バッチ数設定
      reviewRatioLimit, // 🆕 上限比率
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
                        <div className="flex-1 text-base sm:text-lg text-gray-900 break-words text-overflow-safe">
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
                            <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
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
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
                            {currentQuestion.relatedWords}
                          </div>
                        )}
                      </div>
                    </button>
                  )}

                  {/* 例文1 */}
                  {currentQuestion.example1 && currentQuestion.example1.trim() !== '' && (
                    <button
                      onClick={() => toggleCardField('showExample')}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                            例文1
                          </span>
                          <span className="text-gray-500 flex-shrink-0">
                            {cardState.showExample ? '▼' : '▶'}
                          </span>
                        </div>
                        {cardState.showExample && (
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
                            {currentQuestion.example1}
                          </div>
                        )}
                      </div>
                    </button>
                  )}

                  {/* 例文2 */}
                  {currentQuestion.example2 && currentQuestion.example2.trim() !== '' && (
                    <button
                      onClick={() => toggleCardField('showExample')}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                            例文2
                          </span>
                          <span className="text-gray-500 flex-shrink-0">
                            {cardState.showExample ? '▼' : '▶'}
                          </span>
                        </div>
                        {cardState.showExample && (
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
                            {currentQuestion.example2}
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
                storageKeyPrefix={subject === 'japanese' ? 'japanese' : undefined}
                sessionCorrect={sessionStats.correct}
                sessionReview={sessionStats.still_learning}
                sessionIncorrect={sessionStats.incorrect}
                totalAnswered={sessionStats.total}
                currentWord={currentQuestion?.word}
                onAnswerTime={lastAnswerTime}
                learningStatusTabPulseKey={learningStatusTabPulseKey}
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
                {subject === 'japanese' && (
                  <div>
                    <label
                      htmlFor="japanese-classical-datasource"
                      className="block text-sm font-medium mb-2 text-gray-700"
                    >
                      📖 出題元:
                    </label>
                    <select
                      id="japanese-classical-datasource"
                      value={classicalSourceId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setClassicalSourceId(nextId);
                        try {
                          localStorage.setItem(classicalSourceStorageKey, nextId);
                        } catch {
                          // ignore
                        }
                        window.dispatchEvent(new Event('japanese-classical-source-changed'));
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {classicalJapaneseDataSources.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {subject !== 'japanese' && (
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
                      <option value="all">{allDataSourceLabel || '高校受験総合'}</option>
                      {questionSets
                        .filter((qs) => qs.id !== 'all')
                        .map((set) => (
                          <option key={set.id} value={set.id}>
                            {set.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* 単語・熟語フィルター（英語のみ） */}
                {subject === 'english' && (
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
                )}

                {/* 関連分野フィルター（英語と社会科のみ） */}
                {subject !== 'japanese' && (
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
                )}

                {/* 難易度フィルター（英語のみ） */}
                {subject === 'english' && (
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
                )}

                {/* バッチ数設定 */}
                <div className="border-t pt-4">
                  <label
                    htmlFor="memorization-batch-size"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    📦 バッチ数:
                  </label>
                  <select
                    id="memorization-batch-size"
                    value={batchSize ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value);
                      try {
                        const key =
                          subject === 'japanese'
                            ? 'japanese-memorization-batch-size'
                            : 'memorization-batch-size';
                        if (value === null) {
                          localStorage.removeItem(key);
                        } else {
                          localStorage.setItem(key, String(value));
                        }
                        window.location.reload();
                      } catch {
                        // ignore storage errors
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">制限なし</option>
                    <option value="10">10問</option>
                    <option value="20">20問</option>
                    <option value="30">30問</option>
                    <option value="50">50問</option>
                    <option value="100">100問</option>
                    <option value="200">200問</option>
                  </select>
                </div>

                {/* 不正解の上限 */}
                <div>
                  <label
                    htmlFor="memorization-review-ratio-limit"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    ❌ 不正解の上限:
                  </label>
                  <select
                    id="memorization-review-ratio-limit"
                    value={reviewRatioLimit}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      try {
                        const key =
                          subject === 'japanese'
                            ? 'japanese-memorization-review-ratio-limit'
                            : 'memorization-review-ratio-limit';
                        localStorage.setItem(key, String(value));
                        window.location.reload();
                      } catch {
                        // ignore storage errors
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                  </select>
                </div>

                {/* 自動発音設定（英語のみ） */}
                {subject === 'english' && (
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
                )}

                {/* MLは常時ON（UIスイッチ撤去） */}
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
                        <div className="flex-1 text-base sm:text-lg text-gray-900 break-words text-overflow-safe">
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
                            <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
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
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
                            {currentQuestion.relatedWords}
                          </div>
                        )}
                      </div>
                    </button>
                  )}

                  {/* 例文1 */}
                  {currentQuestion.example1 && currentQuestion.example1.trim() !== '' && (
                    <button
                      onClick={() => toggleCardField('showExample')}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                            例文1
                          </span>
                          <span className="text-gray-500 flex-shrink-0">
                            {cardState.showExample ? '▼' : '▶'}
                          </span>
                        </div>
                        {cardState.showExample && (
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
                            {currentQuestion.example1}
                          </div>
                        )}
                      </div>
                    </button>
                  )}

                  {/* 例文2 */}
                  {currentQuestion.example2 && currentQuestion.example2.trim() !== '' && (
                    <button
                      onClick={() => toggleCardField('showExample')}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                            例文2
                          </span>
                          <span className="text-gray-500 flex-shrink-0">
                            {cardState.showExample ? '▼' : '▶'}
                          </span>
                        </div>
                        {cardState.showExample && (
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 break-words text-overflow-safe">
                            {currentQuestion.example2}
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

      {/* デバッグパネル（開発環境のみ） */}
      {import.meta.env.DEV && showDebugPanel && (
        <RequeuingDebugPanel
          subject={subject}
          allDataSourceLabel={allDataSourceLabel}
          mode="memorization"
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          questions={questions}
          requeuedWords={getRequeuedWords(questions, currentIndex)}
          answerHistory={answerHistory}
          onClose={() => setShowDebugPanel(false)}
          onClearHistory={clearAnswerHistory}
        />
      )}
    </div>
  );
}

export default MemorizationView;
