import { useState, useEffect, useRef, useCallback } from 'react';
import { Question, MemorizationCardState, MemorizationBehavior, QuestionSet } from '../types';
import type { CustomWord, CustomQuestionSet } from '../types/customQuestions';
import {
  getMemorizationCardSettings,
  saveMemorizationCardSettings,
  recordMemorizationBehavior,
  getMemorizationSettings,
  saveMemorizationSettings,
} from '../progressStorage';
import { speakEnglish, isSpeechSynthesisSupported } from '@/features/speech/speechSynthesis';
import { logger } from '@/utils/logger';
import ScoreBoard from './ScoreBoard';
import AddToCustomButton from './AddToCustomButton';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';
import { useAdaptiveNetwork } from '../hooks/useAdaptiveNetwork';
import { QuestionCategory } from '../strategies/memoryAcquisitionAlgorithm';
import { sortQuestionsByPriority as sortByPriorityCommon } from '../utils/questionPrioritySorter';
import { useQuestionRequeue } from '../hooks/useQuestionRequeue';

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
  questionSets,
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

  // 復習モード
  const [isReviewFocusMode, setIsReviewFocusMode] = useState(false);

  // セッション統計
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    still_learning: 0, // まだまだ
    incorrect: 0,
    total: 0,
    newQuestions: 0, // 新規問題の出題数
    reviewQuestions: 0, // 復習問題の出題数
    consecutiveNew: 0, // 連続新規出題カウント
    consecutiveReview: 0, // 連続復習出題カウント
  });

  // 回答時刻（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(0);

  // 回答結果を追跡（動的AIコメント用）
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | undefined>(undefined);
  const [lastAnswerWord, setLastAnswerWord] = useState<string | undefined>(undefined);
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [incorrectStreak, setIncorrectStreak] = useState<number>(0);

  // 滞在時間計測
  const cardDisplayTimeRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // タッチ開始位置とカード要素のref
  const touchStartX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousQuestionId = useRef<string | null>(null); // 前回のカードID

  // 全画面表示モード
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 適応型学習フック（問題選択と記録に使用）
  const adaptiveLearning = useAdaptiveLearning(QuestionCategory.MEMORIZATION);

  // 適応的学習AIネットワーク
  const {
    enabled: adaptiveEnabled,
    processQuestion: processAdaptiveQuestion,
    currentStrategy,
  } = useAdaptiveNetwork();

  // 問題再出題管理フック
  const { reAddQuestion, clearExpiredFlags, updateRequeueStats } = useQuestionRequeue<Question>();

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

    const selectQuestions = () => {
      // データソースに基づいて問題を取得
      const baseQuestions = allQuestions;

      // データソースフィルター（現在はsource プロパティが 'junior' しかないため、実質的なフィルタリングは行わない）
      // 将来的にデータが増えた場合、ここでフィルタリングを実装
      if (selectedDataSource !== 'all') {
        // 現在は全て junior なので、フィルタリングなし
        // 将来: standard/advanced/comprehensiveに対応
      }

      if (baseQuestions.length === 0) return;

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

      // 適応的出題順序（Leitnerシステム + 間隔反復）
      const sortedQuestions = sortQuestionsByPriority(filtered, stillLearningLimit, incorrectLimit);

      setQuestions(sortedQuestions);
      if (sortedQuestions.length > 0) {
        setCurrentQuestion(sortedQuestions[0]);
        setCurrentIndex(0);
        cardDisplayTimeRef.current = Date.now();
      }
    };

    selectQuestions();
  }, [
    questionSets,
    selectedDataSource,
    selectedDifficulty,
    selectedCategory,
    selectedWordPhraseFilter,
    allQuestions,
    isLoading,
    // isReviewFocusMode を削除：復習モード切り替え時に問題をリセットしない
  ]);

  // 復習モードトグル
  const handleReviewFocus = () => {
    setIsReviewFocusMode(!isReviewFocusMode);
  };

  // 適応的AI分析ヘルパー関数
  const processWithAdaptiveAI = async (word: string, isCorrect: boolean) => {
    if (!adaptiveEnabled) return;

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

  // 適応型間隔反復学習：個人の学習速度に最適化
  const calculateOptimalInterval = (streak: number, easinessFactor: number = 2.5): number => {
    // 連続正解数に基づく基本間隔（日数）
    if (streak === 0) return 0; // 即座に再出題
    if (streak === 1) return 1; // 1日後
    if (streak === 2) return 3; // 3日後
    if (streak === 3) return 7; // 7日後

    // 4回目以降：前回の間隔 × 難易度係数（個人最適化）
    const baseInterval = 7;
    return Math.round(baseInterval * Math.pow(easinessFactor, streak - 3));
  };

  // 忘却リスクスコアの計算：今復習すべき度合い
  const calculateForgettingRisk = (
    lastStudied: number,
    reviewInterval: number,
    accuracy: number
  ): number => {
    const now = Date.now();
    const daysSinceStudy = (now - lastStudied) / (1000 * 60 * 60 * 24);
    const expectedInterval = reviewInterval || 1;

    // 時間リスク：経過時間 / 推奨間隔（100%を超えると忘却の危険）
    const timeRisk = (daysSinceStudy / expectedInterval) * 100;

    // 正答率リスク：低いほど忘れやすい
    const accuracyRisk = (1 - accuracy / 100) * 50;

    return timeRisk + accuracyRisk;
  };

  // 適応的な出題順序を構築（Leitnerシステム + 適応型間隔反復）
  const sortQuestionsByPriority = (
    questions: Question[],
    stillLearningLimit: number | null,
    incorrectLimit: number | null
  ): Question[] => {
    // progressStorageから暗記モードの統計情報を取得
    const getWordStatus = (word: string) => {
      const key = 'english-progress';
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      try {
        const progress = JSON.parse(stored);
        const wordProgress = progress.wordProgress?.[word];
        if (!wordProgress) return null;

        const attempts = wordProgress.memorizationAttempts || 0;
        const correct = wordProgress.memorizationCorrect || 0;
        const stillLearning = wordProgress.memorizationStillLearning || 0;
        const streak = wordProgress.memorizationStreak || 0;
        const lastStudied = wordProgress.lastStudied || 0;

        // 間隔反復学習用データ
        const easinessFactor = wordProgress.easinessFactor || 2.5;
        const reviewInterval =
          wordProgress.reviewInterval || calculateOptimalInterval(streak, easinessFactor);
        const _avgResponseSpeed = wordProgress.avgResponseSpeed || 0;

        if (attempts === 0) {
          return {
            category: 'new',
            priority: 3,
            lastStudied,
            attempts,
            correct,
            streak,
            forgettingRisk: 0,
            reviewInterval: 0,
          };
        }

        // まだまだを0.5回の正解として計算（正答率50%以上になるように）
        const effectiveCorrect = correct + stillLearning * 0.5;
        const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;

        // 忘却リスクを計算
        const forgettingRisk = calculateForgettingRisk(lastStudied, reviewInterval, accuracy);

        // 🟢 覚えてる: 連続3回以上 or 正答率80%以上で連続2回
        if (streak >= 3 || (streak >= 2 && accuracy >= 80)) {
          return {
            category: 'mastered',
            priority: 5,
            lastStudied,
            attempts,
            correct,
            streak,
            forgettingRisk,
            reviewInterval,
          };
        }
        // 🟡 まだまだ: 正答率50%以上 or まだまだボタンを押したことがある
        else if (accuracy >= 50 || stillLearning > 0) {
          return {
            category: 'still_learning',
            priority: 2,
            lastStudied,
            attempts,
            correct,
            streak,
            forgettingRisk,
            reviewInterval,
          };
        }
        // 🔴 分からない: 正答率50%未満 and まだまだボタンを押したことがない
        else {
          return {
            category: 'incorrect',
            priority: 1,
            lastStudied,
            attempts,
            correct,
            streak,
            forgettingRisk,
            reviewInterval,
          };
        }
      } catch (error) {
        logger.error('統計情報の取得エラー:', error);
        return null;
      }
    };

    // 各語句の状態を取得
    const questionsWithStatus = questions.map((q) => ({
      question: q,
      status: getWordStatus(q.word),
    }));

    // カテゴリ別にカウント
    const counts = {
      mastered: questionsWithStatus.filter((q) => q.status?.category === 'mastered').length,
      still_learning: questionsWithStatus.filter((q) => q.status?.category === 'still_learning')
        .length,
      incorrect: questionsWithStatus.filter((q) => q.status?.category === 'incorrect').length,
      new: questionsWithStatus.filter((q) => q.status?.category === 'new').length,
    };

    // 上限チェックと優先度調整
    const shouldFocusOnStillLearning =
      stillLearningLimit !== null && counts.still_learning >= stillLearningLimit;
    const shouldFocusOnIncorrect = incorrectLimit !== null && counts.incorrect >= incorrectLimit;

    // 学習状況を分析：まだまだ+分からないの割合を計算
    const totalStudied = counts.mastered + counts.still_learning + counts.incorrect;
    const needsReview = counts.still_learning + counts.incorrect;
    const reviewRatio = totalStudied > 0 ? needsReview / totalStudied : 0;

    // フラッシュカード学習の原則：復習が20%以上なら新規を大幅に抑制
    const shouldSuppressNew = reviewRatio >= 0.2;

    // 段階的解消戦略：分からない問題を早期に解消
    // 10語溜まったら即座に集中モード、5語以下で新規再開
    const effectiveLimit = incorrectLimit !== null ? incorrectLimit : 50;

    // 集中モード閾値：10語で発動（放置しない）
    const concentrationThreshold = 10;

    // 新規導入閾値：5語以下で再開
    const newQuestionThreshold = 5;

    const hasLargeIncorrectBacklog = counts.incorrect > concentrationThreshold;
    const canIntroduceNewQuestions = counts.incorrect <= newQuestionThreshold;

    // 上限の80%を超えたら自動的に復習モード発動
    const autoReviewMode =
      (stillLearningLimit !== null && counts.still_learning >= stillLearningLimit * 0.8) ||
      (incorrectLimit !== null && counts.incorrect >= incorrectLimit * 0.8);
    const effectiveReviewMode = isReviewFocusMode || autoReviewMode;

    // ソート: 優先度 > 最終学習時刻（古い順） > ランダム
    const sorted = questionsWithStatus.sort((a, b) => {
      const statusA = a.status;
      const statusB = b.status;

      // 上限に達した場合の優先度調整
      let priorityA = statusA?.priority || 3;
      let priorityB = statusB?.priority || 3;

      // 🔥 復習モード（手動or自動）が有効な場合: 分からないとまだまだを集中的に出題
      if (effectiveReviewMode) {
        // 分からない（incorrect）を最優先（約70%の出現率）
        if (statusA?.category === 'incorrect') priorityA = 0;
        if (statusB?.category === 'incorrect') priorityB = 0;

        // まだまだ（still_learning）を次に優先（約25%の出現率）
        if (statusA?.category === 'still_learning' && priorityA !== 0) priorityA = 0.5;
        if (statusB?.category === 'still_learning' && priorityB !== 0) priorityB = 0.5;

        // 覚えてる（mastered）と新規は完全に出題しない
        if (statusA?.category === 'mastered' && priorityA > 1) priorityA = 999;
        if (statusB?.category === 'mastered' && priorityB > 1) priorityB = 999;
        if (statusA?.category === 'new' && priorityA > 1) priorityA = 999;
        if (statusB?.category === 'new' && priorityB > 1) priorityB = 999;
      } else {
        // 通常モード: 適応型間隔反復 + 忘却リスクベースの優先度

        // 忘却リスクによる緊急度判定
        const riskA = statusA?.forgettingRisk || 0;
        const riskB = statusB?.forgettingRisk || 0;

        // 🚨 忘却リスク150+: 緊急（忘れる直前）→ 最優先
        if (riskA >= 150) priorityA = 0.1;
        if (riskB >= 150) priorityB = 0.1;

        // ⚠️ 忘却リスク100-149: 高リスク → 優先
        if (riskA >= 100 && riskA < 150) priorityA = 0.2;
        if (riskB >= 100 && riskB < 150) priorityB = 0.2;

        // 🔴 分からないは常に高優先（記憶の定着が最重要）
        // 大量の覚えていない語句がある場合：最近間違えた語句を最優先
        if (statusA?.category === 'incorrect' && priorityA > 0.2) {
          if (hasLargeIncorrectBacklog) {
            // 最近間違えた語句（1日以内）を超優先
            const isRecentA = statusA.lastStudied && Date.now() - statusA.lastStudied < 86400000;
            priorityA = isRecentA ? 0.1 : 0.3;
          } else {
            priorityA = 0.3;
          }
        }
        if (statusB?.category === 'incorrect' && priorityB > 0.2) {
          if (hasLargeIncorrectBacklog) {
            const isRecentB = statusB.lastStudied && Date.now() - statusB.lastStudied < 86400000;
            priorityB = isRecentB ? 0.1 : 0.3;
          } else {
            priorityB = 0.3;
          }
        }

        // 🟡 まだまだも高優先（定着させることが重要）
        if (statusA?.category === 'still_learning' && priorityA > 0.3) priorityA = 0.8;
        if (statusB?.category === 'still_learning' && priorityB > 0.3) priorityB = 0.8;

        // 🟢 覚えてる: 忘却リスクに応じて出題タイミングを調整
        if (statusA?.category === 'mastered') {
          if (riskA >= 50 && priorityA > 1)
            priorityA = 2.0; // 中リスク → 適度に復習
          else if (priorityA > 2) priorityA = 4.5; // 低リスク → 後回し
        }
        if (statusB?.category === 'mastered') {
          if (riskB >= 50 && priorityB > 1) priorityB = 2.0;
          else if (priorityB > 2) priorityB = 4.5;
        }

        // 🆕 新規問題は復習状況に応じて段階的に導入
        // フラッシュカード学習では、復習が優先で新規は少しずつ追加
        if (statusA?.category === 'new' && priorityA > 3) {
          if (hasLargeIncorrectBacklog) {
            // 覚えていない語句が50個超：新規は完全に停止
            priorityA = 10;
          } else if (canIntroduceNewQuestions) {
            // 覚えていない語句が30個以下：新規を適度に導入（10%程度）
            priorityA = 3.5;
          } else {
            // 中間状態（31-50個）：新規は後回し
            priorityA = shouldSuppressNew ? 5 : 3.5;
          }
        }
        if (statusB?.category === 'new' && priorityB > 3) {
          if (hasLargeIncorrectBacklog) {
            priorityB = 10;
          } else if (canIntroduceNewQuestions) {
            priorityB = 3.5;
          } else {
            priorityB = shouldSuppressNew ? 5 : 3.5;
          }
        }

        // 上限に達した場合はさらに優先度を上げる
        if (shouldFocusOnIncorrect) {
          if (statusA?.category === 'incorrect') priorityA = 0;
          if (statusB?.category === 'incorrect') priorityB = 0;
        }
        if (shouldFocusOnStillLearning) {
          if (statusA?.category === 'still_learning') priorityA = 0.05;
          if (statusB?.category === 'still_learning') priorityB = 0.05;
        }
      }

      // 優先度順
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 最終学習時刻順（古い方を優先）
      const lastStudiedA = statusA?.lastStudied || 0;
      const lastStudiedB = statusB?.lastStudied || 0;
      if (lastStudiedA !== lastStudiedB) {
        return lastStudiedA - lastStudiedB;
      }

      // ランダム（同じ優先度・同じ学習時刻の場合）
      return Math.random() - 0.5;
    });

    return sorted.map((item) => item.question);
  };

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
  const handleSwipe = useCallback(
    async (direction: 'left' | 'center' | 'right') => {
      if (!currentQuestion) return;

      // 滞在時間を記録
      const viewDuration = (Date.now() - cardDisplayTimeRef.current) / 1000; // 秒単位

      // right: 覚えてる(正解)、center: まだまだ(復習中)、left: 分からない(不正解)
      const isCorrect = direction === 'right';
      const isStillLearning = direction === 'center';

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

      // 統計を3段階で更新
      setSessionStats((prev) => ({
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        still_learning: isStillLearning ? prev.still_learning + 1 : prev.still_learning,
        incorrect: !isCorrect && !isStillLearning ? prev.incorrect + 1 : prev.incorrect,
        total: prev.total + 1,
        newQuestions: prev.newQuestions,
        reviewQuestions: prev.reviewQuestions,
        consecutiveNew: prev.consecutiveNew,
        consecutiveReview: prev.consecutiveReview,
      }));

      // 16秒以上は放置とみなしてカウントしない
      if (viewDuration < 16) {
        const behavior: MemorizationBehavior = {
          word: currentQuestion.word,
          timestamp: Date.now(),
          viewDuration,
          swipeDirection: direction === 'center' ? 'left' : direction,
          sessionId,
          consecutiveViews: consecutiveViews + 1,
        };

        await recordMemorizationBehavior(behavior);
        setConsecutiveViews((prev) => prev + 1);

        // 暗記タブ専用の進捗データを記録（和訳・スペルとは分離）
        const { updateWordProgress } = await import('../progressStorage');
        await updateWordProgress(
          currentQuestion.word,
          isCorrect,
          viewDuration * 1000, // ミリ秒に変換
          undefined,
          'memorization', // 暗記タブは独立したモードとして記録
          isStillLearning // まだまだフラグを渡す
        );

        // 適応型学習への記録
        adaptiveLearning.recordAnswer(currentQuestion.word, isCorrect, viewDuration * 1000);

        // 適応的学習AIネットワークによる分析
        await processWithAdaptiveAI(currentQuestion.word, isCorrect);
      }

      // データ保存後に回答時刻を更新（ScoreBoard再計算のトリガー）
      setLastAnswerTime(Date.now());

      // 不正解・まだまだの処理: 再追加→再ソートの順で単一の状態更新にまとめる
      if (!isCorrect || isStillLearning) {
        setQuestions((prevQuestions) => {
          // ステップ1: 問題を再追加（次の3-5問内）
          const questionsWithReAdd = reAddQuestion(currentQuestion, prevQuestions, currentIndex);

          // ステップ2: 定期的な再ソート（3問ごとまたは上限到達時）
          const shouldResort =
            sessionStats.total % 3 === 0 ||
            (stillLearningLimit !== null && sessionStats.still_learning >= stillLearningLimit) ||
            (incorrectLimit !== null && sessionStats.incorrect >= incorrectLimit);

          if (shouldResort && questionsWithReAdd.length > 1) {
            const remainingQuestions = questionsWithReAdd.slice(currentIndex + 1);

            if (remainingQuestions.length > 1) {
              const resorted = sortByPriorityCommon(remainingQuestions, {
                isReviewFocusMode: false,
                learningLimit: stillLearningLimit,
                reviewLimit: incorrectLimit,
                mode: 'memorization',
              });

              return [...questionsWithReAdd.slice(0, currentIndex + 1), ...resorted];
            }
          }

          return questionsWithReAdd;
        });
      }

      // KPIロギング + 新規/復習の統計を更新

      updateRequeueStats(currentQuestion, sessionStats, setSessionStats);

      // 次の語句へ
      const nextIndex = currentIndex + 1;

      if (nextIndex < questions.length) {
        // セッション優先フラグのクリーン処理：5問経過後にクリア
        const clearedQuestions = clearExpiredFlags(questions, currentIndex);
        if (clearedQuestions !== questions) {
          setQuestions(clearedQuestions);
        }

        setCurrentQuestion(questions[nextIndex]);
        setCurrentIndex(nextIndex);
        cardDisplayTimeRef.current = Date.now();
        // 次の問題に移動したのlastAnswerWordをリセット（解答前に解答後コメントが表示されるのを防ぐ）
        setLastAnswerWord(undefined);
      } else {
        // 全て終了
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  // currentQuestionが未設定の場合は待機表示
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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
            <div className="w-full max-w-4xl px-4">
              <div ref={cardRef} className="question-card">
                {/* 語句表示部 */}
                <div className="mb-8 py-8 flex flex-col items-center justify-center min-h-[200px]">
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
                    {currentQuestion.difficulty && (
                      <div className="flex justify-center mt-4">
                        <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                          {currentQuestion.difficulty === 'beginner'
                            ? '初級'
                            : currentQuestion.difficulty === 'intermediate'
                              ? '中級'
                              : '上級'}
                        </div>
                      </div>
                    )}
                    {/* 適応的AI戦略バッジ */}
                    {adaptiveEnabled && currentStrategy && (
                      <div className="flex justify-center mt-2">
                        <div className="adaptive-strategy-badge">🧠 適応中</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3つの大きなボタン */}
                <div className="grid grid-cols-3 gap-3 mb-6">
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
                  <div className="mb-4 flex justify-center">
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

                  {/* 読み */}
                  <button
                    onClick={() => toggleCardField('showPronunciation')}
                    className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                          読み
                        </span>
                        <span className="text-gray-500 flex-shrink-0">
                          {cardState.showPronunciation ? '▼' : '▶'}
                        </span>
                      </div>
                      {cardState.showPronunciation && (
                        <div className="flex-1 text-sm sm:text-base text-gray-700 break-words">
                          {currentQuestion.reading}
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
              </div>
            </div>
          )}

          {/* 暗記カード */}
          <div className="flex-1 flex items-center justify-center">
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

              <div ref={cardRef} className="question-card w-full">
                {/* 語句表示部 */}
                <div className="mb-8 py-8 flex flex-col items-center justify-center min-h-[200px]">
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
                    {currentQuestion.difficulty && (
                      <div className="flex justify-center mt-4">
                        <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                          {currentQuestion.difficulty === 'beginner'
                            ? '初級'
                            : currentQuestion.difficulty === 'intermediate'
                              ? '中級'
                              : '上級'}
                        </div>
                      </div>
                    )}
                    {/* 適応的AI戦略バッジ */}
                    {adaptiveEnabled && currentStrategy && (
                      <div className="flex justify-center mt-2">
                        <div className="adaptive-strategy-badge">🧠 適応中</div>
                      </div>
                    )}
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

                {/* カスタムセットに追加ボタン */}
                {onAddWordToCustomSet && onRemoveWordFromCustomSet && onOpenCustomSetManagement && (
                  <div className="mb-4 flex justify-center">
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

                  {/* 読み */}
                  <button
                    onClick={() => toggleCardField('showPronunciation')}
                    className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100:bg-gray-600 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="font-semibold text-gray-700 w-16 sm:w-24 flex-shrink-0">
                          読み
                        </span>
                        <span className="text-gray-500 flex-shrink-0">
                          {cardState.showPronunciation ? '▼' : '▶'}
                        </span>
                      </div>
                      {cardState.showPronunciation && (
                        <div className="flex-1 text-sm sm:text-base text-gray-700 break-words">
                          {currentQuestion.reading}
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
    </div>
  );
}

export default MemorizationView;
