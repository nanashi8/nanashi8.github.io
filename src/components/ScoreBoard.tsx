import {
  getTodayStats,
  getTotalAnsweredCount,
  getUniqueQuestionedWordsCount as _getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount,
  getRetentionRateWithAI,
  getDetailedRetentionStats,
  getGrammarRetentionRateWithAI,
  getGrammarDetailedRetentionStats,
  getMemorizationDetailedRetentionStats,
  getGrammarUnitStatsWithTitles,
  getDailyPlanInfo as _getDailyPlanInfo,
  getWordDetailedData,
  loadProgressSync,
} from '../progressStorage';
import { useState, useEffect, useMemo, useRef } from 'react';
import { AIPersonality, CommentContext } from '../types';
import { generateTimeBasedGreeting } from '../timeBasedGreeting';
import { getTimeBasedTeacherChat, getSpecialDayChat } from '../teacherInteractions';
import { getBreatherTrivia } from '../englishTrivia';
import { generateAIComment, getTimeOfDay } from '../aiCommentGenerator';
import { computeAttemptCounts } from './scoreBoard/attemptCounts';
import { loadEfficiencyProfile } from '../storage/learningEfficiency';

interface ScoreBoardProps {
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization'; // クイズモードを追加
  currentScore?: number; // 現在のスコア
  totalAnswered?: number; // 現在の回答数
  sessionCorrect?: number; // セッション内の正解数
  sessionIncorrect?: number; // セッション内の不正解数
  _sessionIncorrect?: number; // 未使用(互換性のため)
  sessionReview?: number; // セッション内の要復習数
  _sessionReview?: number; // 未使用(互換性のため)
  sessionMastered?: number; // セッション内の定着数
  onReviewFocus?: () => void; // 要復習タップ時のコールバック
  isReviewFocusMode?: boolean; // 補修モード中かどうか
  onShowSettings?: () => void; // 学習設定を開くコールバック
  // 和訳・スペルタブ用のセッション統計（上限達成時の自動復習モード用）
  sessionStats?: {
    correct: number;
    incorrect: number;
    review: number;
    mastered: number;
  };
  currentWord?: string; // 現在表示中の単語
  onAnswerTime?: number; // 回答時刻(更新トリガー用)
  // 回答結果情報（動的AIコメント用）
  lastAnswerCorrect?: boolean; // 最後の回答が正解だったか
  lastAnswerWord?: string; // 最後に回答した単語
  lastAnswerDifficulty?: string; // 最後に回答した単語の難易度
  correctStreak?: number; // 現在の連続正解数
  incorrectStreak?: number; // 現在の連続不正解数
  // 適応型学習情報（AIコメント用）
  learningPhase?: 'ENCODING' | 'INITIAL_CONSOLIDATION' | 'LONG_TERM_RETENTION' | 'MASTERED';
  estimatedSpeed?: number; // 学習速度パラメータ
  forgettingRate?: number; // 忘却率パラメータ
  // 学習設定情報
  dataSource?: string; // 問題集
  category?: string; // 関連分野
  difficulty?: string; // 難易度
  wordPhraseFilter?: string; // 単語・熟語フィルター
  // 文法モード用の設定
  grammarUnit?: string; // 現在出題中の文法単元（例: "g1-unit0"）
  // 現在の問題の出題回数
  _currentQuestionTimesShown?: number; // 現在表示中の問題の出題回数
  // デバッグ機能
  onResetProgress?: () => void; // 成績リセットボタンのコールバック
  onDebugRequeue?: () => void; // 再出題デバッグボタンのコールバック

  // UX: 再スケジューリングが走ったことを示すため、学習状況タブ文字を一時的に光らせる
  learningStatusTabPulseKey?: number; // 値が変わるたびにパルス
}

function ScoreBoard({
  mode = 'translation', // デフォルトは和訳モード
  currentScore = 0,
  totalAnswered = 0,
  sessionCorrect = 0,
  _sessionIncorrect = 0,
  _sessionReview = 0,
  isReviewFocusMode = false,
  onReviewFocus,
  onShowSettings,
  currentWord,
  onAnswerTime,
  lastAnswerCorrect,
  lastAnswerWord,
  lastAnswerDifficulty,
  correctStreak = 0,
  incorrectStreak = 0,
  learningPhase,
  estimatedSpeed,
  forgettingRate,
  dataSource = '',
  category = '',
  difficulty = '',
  wordPhraseFilter = '',
  grammarUnit,
  sessionStats,
  _currentQuestionTimesShown,
  onResetProgress,
  onDebugRequeue,
  learningStatusTabPulseKey,
}: ScoreBoardProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'plan' | 'breakdown' | 'history' | 'settings'>(
    'ai'
  );

  const efficiencyProfile = useMemo(() => {
    try {
      if (typeof window === 'undefined') return null;
      return loadEfficiencyProfile();
    } catch {
      return null;
    }
  }, [onAnswerTime]);

  const [isLearningTabPulsing, setIsLearningTabPulsing] = useState(false);
  const pulseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!learningStatusTabPulseKey) return;

    setIsLearningTabPulsing(true);
    if (pulseTimerRef.current) {
      window.clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => {
      setIsLearningTabPulsing(false);
      pulseTimerRef.current = null;
    }, 1600);

    return () => {
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    };
  }, [learningStatusTabPulseKey]);

  // 出題時コメント（解答前）と解答後コメントを分離
  const [questionComment, setQuestionComment] = useState<string>(() => {
    const personality = (localStorage.getItem('aiPersonality') || 'kind-teacher') as AIPersonality;
    return generateTimeBasedGreeting(personality) || 'こんにちは！一緒に学習しましょう。';
  });
  const [answerComment, setAnswerComment] = useState<string>('');

  // 新しい問題が表示された時に、その問題の履歴情報を表示し、解答後コメントをクリア
  useEffect(() => {
    if (currentWord) {
      const personality = (localStorage.getItem('aiPersonality') ||
        'kind-teacher') as AIPersonality;

      // 暗記モードではフラッシュカードとして使うため、語源や豆知識を表示
      if (mode === 'memorization') {
        const trivia = getBreatherTrivia(personality, currentWord);
        setQuestionComment(trivia || '');
        setAnswerComment('');
        return;
      }

      const wordData = getWordDetailedData(currentWord);

      // 問題の履歴情報に基づいてコメントを生成
      let comment = '';

      if (wordData) {
        const { totalCount, correctCount } = wordData;
        const incorrectCount = totalCount - correctCount;
        const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

        if (totalCount === 0) {
          // 初出題
          switch (personality) {
            case 'drill-sergeant':
              comment = '新しい単語だ！気合を入れて覚えろ！';
              break;
            case 'kind-teacher':
              comment = '初めての単語ですね。じっくり考えてみましょう';
              break;
            case 'analyst':
              comment = '新規単語。データなし。初回測定を開始します';
              break;
            case 'enthusiastic-coach':
              comment = '新しいチャレンジだ！思い切って行こう！';
              break;
            case 'wise-sage':
              comment = '初めて出会う単語じゃな。焦らず向き合おう';
              break;
            default:
              comment = '初めての単語です';
          }
        } else if (totalCount === 1) {
          // 2回目の出題
          const wasCorrect = correctCount === 1;
          switch (personality) {
            case 'drill-sergeant':
              comment = wasCorrect
                ? '2回目だ！前回は正解したぞ。またやれ！'
                : '2回目だ！前回は間違えた。今度こそ決めろ！';
              break;
            case 'kind-teacher':
              comment = wasCorrect
                ? '2回目の出題です。前回は正解できましたね'
                : '2回目の出題です。前回は間違えてしまいましたが、大丈夫です';
              break;
            case 'analyst':
              comment = `2回目の出題。前回: ${wasCorrect ? '正解' : '不正解'}`;
              break;
            case 'enthusiastic-coach':
              comment = wasCorrect
                ? '2回目！前回は完璧だったな！'
                : '2回目のチャンス！前回のリベンジだ！';
              break;
            case 'wise-sage':
              comment = wasCorrect
                ? '2度目の出会いじゃ。前回はうまくいったのう'
                : '2度目じゃな。前回の経験を活かそう';
              break;
            default:
              comment = '2回目の出題です';
          }
        } else {
          // 3回目以降
          switch (personality) {
            case 'drill-sergeant':
              if (accuracy >= 80) {
                comment = `${totalCount}回目だ。正答率${accuracy}%！いい調子だ！`;
              } else if (accuracy >= 50) {
                comment = `${totalCount}回目。正答率${accuracy}%。もっと上げろ！`;
              } else {
                comment = `${totalCount}回目。正答率${accuracy}%！覚えが悪いぞ！`;
              }
              break;
            case 'kind-teacher':
              if (accuracy >= 80) {
                comment = `${totalCount}回目の出題です。正答率${accuracy}%、よく覚えていますね`;
              } else if (accuracy >= 50) {
                comment = `${totalCount}回目の出題です。正答率${accuracy}%、少しずつ覚えてきています`;
              } else {
                comment = `${totalCount}回目の出題です。正答率${accuracy}%、繰り返し練習しましょう`;
              }
              break;
            case 'analyst':
              comment = `${totalCount}回目の出題。正答率: ${accuracy}% (正解${correctCount}/不正解${incorrectCount})`;
              break;
            case 'enthusiastic-coach':
              if (accuracy >= 80) {
                comment = `${totalCount}回目！正答率${accuracy}%！完璧に近いぞ！`;
              } else {
                comment = `${totalCount}回目のチャレンジ！正答率${accuracy}%、まだ伸びるぞ！`;
              }
              break;
            case 'wise-sage':
              if (accuracy >= 80) {
                comment = `${totalCount}回目じゃな。正答率${accuracy}%、よく定着しておる`;
              } else {
                comment = `${totalCount}回目じゃ。正答率${accuracy}%、焦らず着実にな`;
              }
              break;
            default:
              comment = `${totalCount}回目の出題です。正答率${accuracy}%`;
          }
        }
      } else {
        // データが取得できない場合は初出題として扱う
        comment = '新しい問題です';
      }

      setQuestionComment(comment);
      setAnswerComment('');
    }
  }, [currentWord]);

  // 回答時に動的なAIコメントを生成
  useEffect(() => {
    // 暗記モードではフラッシュカードとして使うため、コメント不要
    if (mode === 'memorization') {
      setAnswerComment('');
      return;
    }

    // 回答情報がない場合はスキップ
    if (lastAnswerCorrect === undefined || !lastAnswerWord) {
      return;
    }

    // 最も重要なチェック: 解答した問題と現在表示中の問題が一致する場合のみコメント生成
    // これにより、前の問題の回答コメントが新しい問題に表示されることを防ぐ
    if (!currentWord || lastAnswerWord !== currentWord) {
      return;
    }

    const personality = (localStorage.getItem('aiPersonality') || 'kind-teacher') as AIPersonality;

    // 今日の統計を取得
    const todayStats = getTodayStats(mode || 'translation');
    const todayQuestions = todayStats.todayTotalAnswered;
    const todayAccuracy = todayStats.todayAccuracy;

    // 全体の正答率を計算
    const userAccuracy = totalAnswered > 0 ? ((sessionCorrect || 0) / totalAnswered) * 100 : 0;

    // カテゴリー正答率（簡易計算）
    const categoryAccuracy = userAccuracy; // 実際はカテゴリー別に集計する必要があるが、簡易版として全体を使用

    // 動的なAIコメントのコンテキストを作成
    const context: CommentContext = {
      isCorrect: lastAnswerCorrect,
      word: lastAnswerWord,
      difficulty: (lastAnswerDifficulty || difficulty || 'intermediate') as
        | 'beginner'
        | 'intermediate'
        | 'advanced',
      category: category || '全分野',
      attemptCount: 1, // スコアボードレベルでは試行回数は1として扱う
      responseTime: 0, // スコアボードでは応答時間は測定しない
      correctStreak: correctStreak,
      incorrectStreak: incorrectStreak,
      userAccuracy: userAccuracy,
      categoryAccuracy: categoryAccuracy,
      isWeakCategory: false, // 簡易版では判定しない
      hasSeenBefore: false, // 簡易版では判定しない
      previousAttempts: 0,
      todayQuestions: todayQuestions,
      todayAccuracy: todayAccuracy,
      planProgress: 0,
      timeOfDay: getTimeOfDay(),
      learningPhase: learningPhase,
      estimatedSpeed: estimatedSpeed,
      forgettingRate: forgettingRate,
    };

    // 動的なAIコメントを生成
    let comment = generateAIComment(personality, context);

    // 時々、特別なメッセージを混ぜる
    if (Math.random() < 0.15) {
      // 15%の確率で追加メッセージ
      const additionalMessages = [];

      // 英語豆知識（5%）
      if (Math.random() < 0.33) {
        const trivia = getBreatherTrivia(personality, currentWord);
        if (trivia) additionalMessages.push(trivia);
      }
      // 特別な日の会話（5%）
      else if (Math.random() < 0.5) {
        const specialChat = getSpecialDayChat();
        if (specialChat) additionalMessages.push(specialChat);
      }
      // 時間帯別の会話（5%）
      else {
        const teacherChat = getTimeBasedTeacherChat();
        if (teacherChat) additionalMessages.push(teacherChat);
      }

      if (additionalMessages.length > 0) {
        comment = `${comment}\n\n${additionalMessages[0]}`;
      }
    }

    setAnswerComment(comment);
  }, [
    onAnswerTime,
    lastAnswerCorrect,
    lastAnswerWord,
    lastAnswerDifficulty,
    correctStreak,
    incorrectStreak,
    mode,
    totalAnswered,
    sessionCorrect,
    category,
    difficulty,
  ]);

  // Progress bar refs
  const masteredRef = useRef<HTMLDivElement>(null);
  const learningRef = useRef<HTMLDivElement>(null);
  const strugglingRef = useRef<HTMLDivElement>(null);
  const retentionGoalProgressRef = useRef<HTMLDivElement>(null);

  // 学習プラン設定（和訳・スペル用）
  const [learningLimit, setLearningLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem(`learning-limit-${mode}`);
    return saved ? parseInt(saved) : null;
  });

  const [reviewLimit, setReviewLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem(`review-limit-${mode}`);
    return saved ? parseInt(saved) : null;
  });

  // 暗記タブ用の学習プラン設定
  const [stillLearningLimit, setStillLearningLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem('memorization-still-learning-limit');
    return saved ? parseInt(saved) : null;
  });

  const [incorrectLimit, setIncorrectLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem('memorization-incorrect-limit');
    return saved ? parseInt(saved) : null;
  });

  const [showPlanSettings, setShowPlanSettings] = useState(false);

  // 和訳・スペル・文法タブ用: 上限達成時に自動的に復習モードをオンにする
  useEffect(() => {
    if (
      (mode === 'translation' || mode === 'spelling' || mode === 'grammar') &&
      sessionStats &&
      onReviewFocus
    ) {
      const { incorrect, review } = sessionStats;
      const totalNeedReview = incorrect + review;

      if (
        (learningLimit !== null && totalNeedReview >= learningLimit) ||
        (reviewLimit !== null && review >= reviewLimit)
      ) {
        if (!isReviewFocusMode) {
          onReviewFocus();
        }
      }
    }
  }, [sessionStats, learningLimit, reviewLimit, isReviewFocusMode, mode, onReviewFocus]);

  // 定着率と統計データをstateで管理
  const [retentionData, setRetentionData] = useState(() => {
    if (mode === 'grammar') {
      const { retentionRate, appearedCount } = getGrammarRetentionRateWithAI();
      return { retentionRate, appearedCount };
    } else {
      const { retentionRate, appearedCount } = getRetentionRateWithAI();
      return { retentionRate, appearedCount };
    }
  });

  const [detailedStatsData, setDetailedStatsData] = useState(() => {
    if (mode === 'grammar') {
      return getGrammarDetailedRetentionStats();
    } else if (mode === 'memorization') {
      return getMemorizationDetailedRetentionStats();
    } else {
      return getDetailedRetentionStats();
    }
  });

  // 履歴タブ用の単語データ
  const [currentWordData, setCurrentWordData] =
    useState<ReturnType<typeof getWordDetailedData>>(null);

  // 出題回数別の統計
  const attemptCounts = useMemo(() => {
    const progress = loadProgressSync();
    const wordProgress = progress.wordProgress || {};
    return computeAttemptCounts({
      mode,
      currentWord,
      wordProgress,
    });
  }, [mode, currentWord, onAnswerTime]);

  // 文法モード用の単元別統計（タイトル付き）
  const [grammarUnitStats, setGrammarUnitStats] = useState<
    Awaited<ReturnType<typeof getGrammarUnitStatsWithTitles>>
  >([]);

  // 文法モード用の単元別統計をタイトル付きで読み込む
  useEffect(() => {
    if (mode === 'grammar') {
      getGrammarUnitStatsWithTitles().then((stats) => {
        // grammarUnitが指定されている場合、その単元のみをフィルタリング
        if (grammarUnit) {
          // grammarUnit: "g1-unit0" → 中1_Unit0 にマッチさせる
          // パターン: g{数字}-unit{数字} または g{数字}-u{数字}
          const match = grammarUnit.match(/g(\d+)-(?:unit|u)(\d+)/);
          if (match) {
            const targetUnit = `中${match[1]}_Unit${match[2]}`;
            const filtered = stats.filter((stat) => stat.unit === targetUnit);
            setGrammarUnitStats(filtered);
          } else {
            setGrammarUnitStats(stats);
          }
        } else {
          setGrammarUnitStats(stats);
        }
      });
    }
  }, [mode, onAnswerTime, grammarUnit]);

  // 定着率と詳細統計を更新（回答時のみ - onAnswerTimeが変化した時）
  useEffect(() => {
    // onAnswerTimeが0の場合は初期状態なのでスキップしない（暗記タブ対応）
    if (mode === 'grammar') {
      const { retentionRate, appearedCount } = getGrammarRetentionRateWithAI();
      setRetentionData({ retentionRate, appearedCount });
      setDetailedStatsData(getGrammarDetailedRetentionStats());
    } else if (mode === 'memorization') {
      // ✅ 暗記モードは専用の統計関数を1回だけ呼び出す
      const stats = getMemorizationDetailedRetentionStats();
      setDetailedStatsData(stats);
      setRetentionData({
        retentionRate: stats.basicRetentionRate,
        appearedCount: stats.appearedWords,
      });
    } else {
      const { retentionRate, appearedCount } = getRetentionRateWithAI();
      setRetentionData({ retentionRate, appearedCount });
      setDetailedStatsData(getDetailedRetentionStats());
    }
  }, [onAnswerTime, mode]); // 回答時のみ更新

  // 履歴タブ用: 現在の単語データを更新
  useEffect(() => {
    if (currentWord) {
      setCurrentWordData(getWordDetailedData(currentWord));
    } else {
      setCurrentWordData(null);
    }
  }, [currentWord, onAnswerTime]); // currentWordまたはonAnswerTimeが変わったら更新

  // Update progress bar widths using CSS variables and data attributes
  useEffect(() => {
    if (masteredRef.current) {
      const masteredWidth = Math.round(detailedStatsData.masteredPercentage);
      masteredRef.current.style.setProperty('--segment-width', String(masteredWidth));
      masteredRef.current.setAttribute('data-width', String(masteredWidth));
    }
    if (learningRef.current) {
      const learningWidth = Math.round(detailedStatsData.learningPercentage);
      learningRef.current.style.setProperty('--segment-width', String(learningWidth));
      learningRef.current.setAttribute('data-width', String(learningWidth));
    }
    if (strugglingRef.current) {
      const strugglingWidth = Math.round(detailedStatsData.strugglingPercentage);
      strugglingRef.current.style.setProperty('--segment-width', String(strugglingWidth));
      strugglingRef.current.setAttribute('data-width', String(strugglingWidth));
    }
  }, [detailedStatsData, activeTab, mode]); // modeも依存に追加

  // 本日の統計を取得（メモ化 - modeで更新）
  const { todayAccuracy: _todayAccuracy, todayTotalAnswered: _todayTotalAnswered } = useMemo(
    () => getTodayStats(mode),
    [mode, onAnswerTime]
  );

  // 🔥 暗記タブの「まだまだブースト」判定はUI表示と一致させる
  // - 分からないが0
  // - まだまだが残っている
  // - 復習モードOFF（復習モード時は別の点滅仕様）
  const isBoostMode =
    mode === 'memorization' &&
    !isReviewFocusMode &&
    (detailedStatsData?.learningCount ?? 0) > 0 &&
    (detailedStatsData?.strugglingCount ?? 0) === 0;

  // 累計回答数を取得（メモ化 - modeで更新）
  const _totalAnsweredCount = useMemo(() => getTotalAnsweredCount(mode), [mode, onAnswerTime]);

  // 定着数を取得（全体から）（メモ化）
  const _masteredCount = useMemo(() => getTotalMasteredWordsCount(), [onAnswerTime]);

  // 定着率をstateから取得
  const { retentionRate: _retentionRate } = retentionData;

  // 計画タブ: 定着率の目標（UI仕様）
  const retentionGoalPercent = 80;
  const retentionPercent = retentionData.retentionRate;
  const retentionProgressToGoalPercent = Math.min(
    100,
    Math.round((retentionPercent / retentionGoalPercent) * 100)
  );

  useEffect(() => {
    if (!retentionGoalProgressRef.current) return;
    const clamped = Math.max(0, Math.min(100, retentionProgressToGoalPercent));
    retentionGoalProgressRef.current.style.width = `${clamped}%`;
  }, [retentionProgressToGoalPercent]);

  const relatedFieldEffectPercent = useMemo(() => {
    if (!efficiencyProfile) return null;
    if (!category || category === '全分野') return null;

    const categoryEfficiency = efficiencyProfile.categoryEfficiencies.find(
      (ce) => ce.category === category
    );
    if (!categoryEfficiency) return null;

    const diff =
      (categoryEfficiency.retentionRate - efficiencyProfile.overallMetrics.retentionRate) * 100;
    if (!Number.isFinite(diff)) return null;
    return Math.round(diff);
  }, [efficiencyProfile, category]);

  const chainLearningEffectPercent = useMemo(() => {
    if (!efficiencyProfile) return null;
    if (!efficiencyProfile.chainLearningEffect?.usedChainLearning) return null;
    const diff = efficiencyProfile.chainLearningEffect.effectDifference * 100;
    if (!Number.isFinite(diff)) return null;
    return Math.round(diff);
  }, [efficiencyProfile]);

  // 詳細な定着率統計をstateから取得
  const detailedStats = detailedStatsData;

  // 現在のセッションの正答率を計算（メモ化）
  const _currentAccuracy = useMemo(
    () => (totalAnswered > 0 ? Math.round((currentScore / totalAnswered) * 100) : 0),
    [currentScore, totalAnswered]
  );

  // タブの配列（AI、学習プラン、学習状況、履歴、学習設定）- 全モード共通
  const _tabs: Array<'ai' | 'plan' | 'breakdown' | 'history' | 'settings'> = [
    'ai',
    'plan',
    'breakdown',
    'history',
    'settings',
  ];

  return (
    <div className="score-board-compact">
      {/* タブナビゲーション: モバイルでも横一列に並べる */}
      <div className="score-board-tabs grid grid-cols-5 gap-0.5 sm:gap-2">
        <button
          className={`px-1 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'ai'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('ai')}
          title="AIコメント"
        >
          <span className="hidden sm:inline">🤖 AI</span>
          <span className="sm:hidden">AI</span>
        </button>
        <button
          className={`px-1 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'plan'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('plan')}
          title="計画"
        >
          <span className="hidden sm:inline">📋 計画</span>
          <span className="sm:hidden">計画</span>
        </button>
        <button
          className={`px-1 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'history'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('history')}
          title="履歴"
        >
          <span className="hidden sm:inline">📜 履歴</span>
          <span className="sm:hidden">履歴</span>
        </button>
        <button
          className={`px-1 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'breakdown'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('breakdown')}
          title="効率"
        >
          <span
            className={`hidden sm:inline ${
              isLearningTabPulsing
                ? 'animate-pulse drop-shadow-sm ' +
                  (activeTab === 'breakdown' ? '' : 'text-primary')
                : ''
            }`}
          >
            効率
          </span>
          <span
            className={`sm:hidden ${
              isLearningTabPulsing
                ? 'animate-pulse drop-shadow-sm ' +
                  (activeTab === 'breakdown' ? '' : 'text-primary')
                : ''
            }`}
          >
            効率
          </span>
        </button>
        <button
          className={`px-1 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'settings'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => {
            if (onShowSettings) {
              onShowSettings();
            } else {
              setActiveTab('settings');
            }
          }}
          title="設定"
        >
          <span className="hidden sm:inline">⚙️ 設定</span>
          <span className="sm:hidden">設定</span>
        </button>
      </div>

      {/* AIタブ */}
      {activeTab === 'ai' && (
        <div className="score-board-content">
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
            <div className="ai-comment-container">
              <div className="flex items-center gap-2 w-full">
                <div className="text-2xl flex-shrink-0">
                  {(() => {
                    const personality = (localStorage.getItem('aiPersonality') ||
                      'kind-teacher') as AIPersonality;
                    const avatars = {
                      'kind-teacher': '😃',
                      'drill-sergeant': '👹',
                      'enthusiastic-coach': '😼',
                      analyst: '🤖',
                      'wise-sage': '🧙',
                    };
                    return avatars[personality] || '😃';
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 leading-snug break-words">
                    {(answerComment || questionComment)
                      .replace(/^[😃👹😼🤖🧙]+「?/gu, '')
                      .replace(/」$/gu, '')
                      .replace(/[✨🌸😊🌱💪🔥📊🏆]/gu, '')
                      .trim()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学習プランタブ */}
      {activeTab === 'plan' && (
        <div className="score-board-content">
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
            {/* 全モード共通のプラン詳細表示 */}
            <div className="plan-text-line">
              <span className="stat-text-label">📚 {dataSource || '全問題集'}</span>
              <span className="stat-text-divider">｜</span>
              <span className="stat-text-label">{category || '全分野'}</span>
              <span className="stat-text-divider">｜</span>
              <span className="stat-text-label">
                {difficulty === 'all'
                  ? '全難易度'
                  : difficulty === 'basic'
                    ? '基礎'
                    : difficulty === 'standard'
                      ? '標準'
                      : difficulty === 'advanced'
                        ? '発展'
                        : difficulty}
              </span>
              {(mode === 'translation' || mode === 'spelling' || mode === 'memorization') && (
                <>
                  <span className="stat-text-divider">｜</span>
                  <button
                    onClick={() => setShowPlanSettings(true)}
                    className="stat-text-label cursor-pointer hover:text-primary transition-colors"
                    title="出題繰り返し設定"
                  >
                    ⚙️ 上限設定
                  </button>
                </>
              )}
              {wordPhraseFilter && (
                <>
                  <span className="stat-text-divider">｜</span>
                  <span className="stat-text-label">
                    {wordPhraseFilter === 'all'
                      ? '単語・熟語'
                      : wordPhraseFilter === 'word'
                        ? '単語のみ'
                        : wordPhraseFilter === 'phrase'
                          ? '熟語のみ'
                          : '単語・熟語'}
                  </span>
                </>
              )}
            </div>

            {/* 計画タブ: 定着率 + 目標バー（UI仕様） */}
            <div className="plan-text-line">
              <span className="stat-text-label">📈 定着率: {retentionPercent}%</span>
              <span className="stat-text-divider">｜</span>
              <span className="stat-text-label">{retentionGoalPercent}%目標</span>
            </div>
            <div className="mt-1 mb-2">
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="bg-primary h-2 rounded"
                  ref={retentionGoalProgressRef}
                />
              </div>
            </div>

            {/* 計画タブ: 学習効率（ユーザー指示により表示） */}
            <div className="plan-text-line">
              {typeof relatedFieldEffectPercent === 'number' && (
                <span className="stat-text-label">
                  ✨関連分野別の効果:{relatedFieldEffectPercent >= 0 ? '+' : ''}
                  {relatedFieldEffectPercent}%
                </span>
              )}
              {typeof relatedFieldEffectPercent === 'number' &&
                typeof chainLearningEffectPercent === 'number' && (
                  <span className="stat-text-divider">｜</span>
                )}
              {typeof chainLearningEffectPercent === 'number' && (
                <span className="stat-text-label">
                  いもづる式学習の効果:{chainLearningEffectPercent >= 0 ? '+' : ''}
                  {chainLearningEffectPercent}%
                </span>
              )}
            </div>

            {/* 計画タブ: 推定指標（既存） */}
            <div className="plan-text-line">
              {typeof estimatedSpeed === 'number' && (
                <>
                  <span className="stat-text-label">推定速度: {estimatedSpeed.toFixed(2)}</span>
                </>
              )}
              {typeof forgettingRate === 'number' && (
                <>
                  {typeof estimatedSpeed === 'number' && (
                    <span className="stat-text-divider">｜</span>
                  )}
                  <span className="stat-text-label">忘却率: {forgettingRate.toFixed(2)}</span>
                </>
              )}
              {learningPhase && (
                <>
                  {(typeof estimatedSpeed === 'number' || typeof forgettingRate === 'number') && (
                    <span className="stat-text-divider">｜</span>
                  )}
                  <span className="stat-text-label">フェーズ: {learningPhase}</span>
                </>
              )}
            </div>
            {showPlanSettings && (mode === 'translation' || mode === 'spelling') && (
              <div className="plan-settings-modal">
                <div className="plan-settings-content">
                  <h4>🎯 出題繰り返し設定</h4>
                  <p className="plan-settings-description">0を選択すると無制限に出題します</p>
                  <div className="plan-setting-item">
                    <label>学習中の語数上限:</label>
                    <select
                      aria-label="学習中の語数上限"
                      value={learningLimit || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const finalValue = value === 0 ? null : value;
                        setLearningLimit(finalValue);
                        if (finalValue === null) {
                          localStorage.removeItem(`learning-limit-${mode}`);
                        } else {
                          localStorage.setItem(`learning-limit-${mode}`, finalValue.toString());
                        }
                      }}
                      className="select-input"
                    >
                      <option value={0}>設定無し</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={150}>150</option>
                      <option value={200}>200</option>
                    </select>
                    <p className="setting-help">この数に達したら繰り返し復習モードに入ります</p>
                  </div>
                  <div className="plan-setting-item">
                    <label>要復習の語数上限:</label>
                    <select
                      aria-label="要復習の語数上限"
                      value={reviewLimit || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const finalValue = value === 0 ? null : value;
                        setReviewLimit(finalValue);
                        if (finalValue === null) {
                          localStorage.removeItem(`review-limit-${mode}`);
                        } else {
                          localStorage.setItem(`review-limit-${mode}`, finalValue.toString());
                        }
                      }}
                      className="select-input"
                    >
                      <option value={0}>設定無し</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={150}>150</option>
                      <option value={200}>200</option>
                    </select>
                    <p className="setting-help">この数に達したら繰り返し復習モードに入ります</p>
                  </div>
                  <button
                    className="plan-settings-close"
                    onClick={() => setShowPlanSettings(false)}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
            {showPlanSettings && mode === 'memorization' && (
              <div className="plan-settings-modal">
                <div className="plan-settings-content">
                  <h4>🎯 出題繰り返し設定</h4>
                  <p className="plan-settings-description">0を選択すると無制限に出題します</p>
                  <div className="plan-setting-item">
                    <label>まだまだの語数上限:</label>
                    <select
                      aria-label="まだまだの語数上限"
                      value={stillLearningLimit || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const finalValue = value === 0 ? null : value;
                        setStillLearningLimit(finalValue);
                        if (finalValue === null) {
                          localStorage.removeItem('memorization-still-learning-limit');
                        } else {
                          localStorage.setItem(
                            'memorization-still-learning-limit',
                            finalValue.toString()
                          );
                        }
                      }}
                      className="select-input"
                    >
                      <option value={0}>設定無し</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={150}>150</option>
                      <option value={200}>200</option>
                    </select>
                    <p className="setting-help">この数に達したら繰り返し復習モードに入ります</p>
                  </div>
                  <div className="plan-setting-item">
                    <label>分からないの語数上限:</label>
                    <select
                      aria-label="分からないの語数上限"
                      value={incorrectLimit || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const finalValue = value === 0 ? null : value;
                        setIncorrectLimit(finalValue);
                        if (finalValue === null) {
                          localStorage.removeItem('memorization-incorrect-limit');
                        } else {
                          localStorage.setItem(
                            'memorization-incorrect-limit',
                            finalValue.toString()
                          );
                        }
                      }}
                      className="select-input"
                    >
                      <option value={0}>設定無し</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={150}>150</option>
                      <option value={200}>200</option>
                    </select>
                    <p className="setting-help">この数に達したら繰り返し復習モードに入ります</p>
                  </div>
                  <button
                    className="plan-settings-close"
                    onClick={() => setShowPlanSettings(false)}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 学習状況タブ（詳細な定着率の内訳） */}
      {activeTab === 'breakdown' && (
        <div className="score-board-content">
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
            <div className="retention-breakdown-container">
              <div className="retention-breakdown-header">
                <div className="flex items-center justify-between gap-2">
                  <div className="attempt-counts-summary flex-1">
                    出題数：1回 {attemptCounts.once}問 2回 {attemptCounts.twice}問 3回{' '}
                    {attemptCounts.three}問 4回 {attemptCounts.four}問 5回 {attemptCounts.five}問
                    6回以上 {attemptCounts.sixOrMore}問
                  </div>
                  {/* デバッグボタン */}
                  {import.meta.env.DEV && (
                    <div className="flex gap-1">
                      {onResetProgress && (
                        <button
                          onClick={onResetProgress}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors whitespace-nowrap"
                          title="現在のモードの成績をリセット"
                        >
                          🔄 リセット
                        </button>
                      )}
                      {onDebugRequeue && (
                        <button
                          onClick={onDebugRequeue}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                          title="再出題ロジックのデバッグ情報を表示"
                        >
                          🐛 デバッグ
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {detailedStats.appearedWords > 0 ? (
                  <div className="retention-subtitle">
                    {mode === 'memorization' ? (
                      <>
                        {detailedStats.appearedWords}語確認： 🟢覚えてる{' '}
                        {detailedStats.masteredCount}語{' '}
                        <span
                          className="retention-label"
                          title={
                            isReviewFocusMode
                              ? '📚 復習モード中'
                              : isBoostMode
                                ? '🔥 まだまだブースト中'
                                : undefined
                          }
                        >
                          🟡まだまだ {detailedStats.learningCount}語
                        </span>{' '}
                        <span
                          className="retention-label"
                          title={isReviewFocusMode ? '📚 復習モード中' : undefined}
                        >
                          🔴分からない {detailedStats.strugglingCount}語
                        </span>
                        {onReviewFocus && (
                          <span
                            className={`review-mode-icon ${isReviewFocusMode ? 'active animate-pulse' : ''}`}
                            onClick={onReviewFocus}
                            title={isReviewFocusMode ? '復習モード解除' : '復習モード開始'}
                          >
                            🔥
                          </span>
                        )}
                      </>
                    ) : mode === 'grammar' ? (
                      <>
                        {detailedStats.appearedWords}問出題： 🟢定着 {detailedStats.masteredCount}問
                        🟡学習中 {detailedStats.learningCount}問 🔴要復習{' '}
                        {detailedStats.strugglingCount}問
                        {onReviewFocus && (
                          <span
                            className={`review-mode-icon ${isReviewFocusMode ? 'active animate-pulse' : ''}`}
                            onClick={onReviewFocus}
                            title={isReviewFocusMode ? '復習モード解除' : '復習モード開始'}
                          >
                            🔥
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {detailedStats.appearedWords}問出題： 🟢定着 {detailedStats.masteredCount}語
                        🟡学習中 {detailedStats.learningCount}語 🔴要復習{' '}
                        {detailedStats.strugglingCount}語
                        {(mode === 'translation' || mode === 'spelling') && onReviewFocus && (
                          <span
                            className={`review-mode-icon ${isReviewFocusMode ? 'active animate-pulse' : ''}`}
                            onClick={onReviewFocus}
                            title={isReviewFocusMode ? '復習モード解除' : '復習モード開始'}
                          >
                            🔥
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="retention-subtitle">
                    {mode === 'memorization'
                      ? 'まだ語句を確認していません'
                      : 'まだ問題に取り組んでいません'}
                  </div>
                )}
              </div>
              {detailedStats.appearedWords > 0 && (
                <>
                  <div className="retention-progress-bar">
                    {mode === 'memorization' ? (
                      <>
                        {/* 暗記タブ用: 覚えてる/まだまだ/分からない（3種類） */}
                        {detailedStats.masteredPercentage > 0 && (
                          <div
                            ref={masteredRef}
                            className="retention-segment retention-mastered"
                            data-width={Math.round(detailedStats.masteredPercentage)}
                            title={`🟢 覚えてる: ${detailedStats.masteredCount}語 (${Math.round(detailedStats.masteredPercentage)}%)`}
                          >
                            {detailedStats.masteredPercentage >= 10 && (
                              <span>{Math.round(detailedStats.masteredPercentage)}%</span>
                            )}
                          </div>
                        )}
                        {detailedStats.learningCount > 0 && (
                          <div
                            ref={learningRef}
                            className={`retention-segment retention-learning ${
                              isReviewFocusMode || isBoostMode ? 'pulsing' : ''
                            }`}
                            data-width={Math.round(detailedStats.learningPercentage)}
                            title={`🟡 まだまだ: ${detailedStats.learningCount}語 (${Math.round(detailedStats.learningPercentage)}%) ${
                              isReviewFocusMode ? '📚 復習中' : isBoostMode ? '🔥 ブースト中' : ''
                            }`}
                          >
                            {detailedStats.learningPercentage >= 10 && (
                              <span>{Math.round(detailedStats.learningPercentage)}%</span>
                            )}
                          </div>
                        )}
                        {detailedStats.strugglingCount > 0 && (
                          <div
                            ref={strugglingRef}
                            className={`retention-segment retention-struggling ${
                              isReviewFocusMode ? 'pulsing' : ''
                            }`}
                            data-width={Math.round(detailedStats.strugglingPercentage)}
                            title={`🔴 分からない: ${detailedStats.strugglingCount}語 (${Math.round(detailedStats.strugglingPercentage)}%) ${
                              isReviewFocusMode ? '📚 復習中' : ''
                            }`}
                          >
                            {detailedStats.strugglingPercentage >= 10 && (
                              <span>{Math.round(detailedStats.strugglingPercentage)}%</span>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* 和訳・スペル・文法タブ用: 定着/学習中/要復習 */}
                        {detailedStats.masteredPercentage > 0 && (
                          <div
                            ref={masteredRef}
                            className="retention-segment retention-mastered"
                            data-width={Math.round(detailedStats.masteredPercentage)}
                            title={`🟢 定着: ${detailedStats.masteredCount}語 (${Math.round(detailedStats.masteredPercentage)}%)`}
                          >
                            {detailedStats.masteredPercentage >= 10 && (
                              <span>{Math.round(detailedStats.masteredPercentage)}%</span>
                            )}
                          </div>
                        )}
                        {detailedStats.learningPercentage > 0 && (
                          <div
                            ref={learningRef}
                            className={`retention-segment retention-learning ${
                              isBoostMode || isReviewFocusMode ? 'pulsing' : ''
                            }`}
                            data-width={Math.round(detailedStats.learningPercentage)}
                            title={`🟡 学習中: ${detailedStats.learningCount}語 (${Math.round(detailedStats.learningPercentage)}%) ${
                              isBoostMode ? '🔥 ブースト中' : isReviewFocusMode ? '📚 復習中' : ''
                            }`}
                          >
                            {detailedStats.learningPercentage >= 10 && (
                              <span>{Math.round(detailedStats.learningPercentage)}%</span>
                            )}
                          </div>
                        )}
                        {detailedStats.strugglingPercentage > 0 && (
                          <div
                            ref={strugglingRef}
                            className={`retention-segment retention-struggling ${
                              isReviewFocusMode ? 'pulsing' : ''
                            }`}
                            data-width={Math.round(detailedStats.strugglingPercentage)}
                            title={`🔴 要復習: ${detailedStats.strugglingCount}語 (${Math.round(detailedStats.strugglingPercentage)}%) ${
                              isReviewFocusMode ? '📚 復習中' : ''
                            }`}
                          >
                            {detailedStats.strugglingPercentage >= 10 && (
                              <span>{Math.round(detailedStats.strugglingPercentage)}%</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 履歴タブ */}
      {activeTab === 'history' && (
        <div className="score-board-content">
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
            <div className="history-compact">
              {mode === 'grammar' ? (
                <div className="word-detail-container">
                  {grammarUnitStats.length > 0 ? (
                    <div className="grammar-units-list">
                      {grammarUnitStats.map((stat) => {
                        const totalAttempts = (stat.correctCount || 0) + (stat.incorrectCount || 0);
                        const masteredCount = stat.masteredCount || 0;
                        const answeredQuestions = stat.answeredQuestions || 0;
                        const retentionRate =
                          answeredQuestions > 0
                            ? Math.round((masteredCount / answeredQuestions) * 100)
                            : 0;

                        // 履歴アイコン生成（実際の正誤履歴から生成、重複なし）
                        const historyIcons = stat.historyIcons || '';

                        // ステータス判定
                        let statusIcon = '🟢';
                        let statusLabel = '定着済';
                        if (masteredCount === 0 && answeredQuestions > 0) {
                          statusIcon = '🔴';
                          statusLabel = '要復習';
                        } else if (retentionRate < 80 && answeredQuestions > 0) {
                          statusIcon = '🟡';
                          statusLabel = '学習中';
                        }

                        // unit表示を「中1_Unit0_〜」から「1年 Unit0：〜」に変換
                        const gradeMatch = stat.unit.match(/中(\d+)/);
                        const gradeDisplay = gradeMatch ? `${gradeMatch[1]}年` : stat.unit;
                        const unitMatch = stat.unit.match(/Unit(\d+)/);
                        const unitDisplay = unitMatch ? `Unit${unitMatch[1]}` : '';
                        const planDisplay = unitDisplay
                          ? `${gradeDisplay} ${unitDisplay}：${stat.title}`
                          : `${gradeDisplay}：${stat.title}`;

                        return (
                          <div key={stat.unit} className="grammar-unit-card">
                            <div className="word-detail-title">
                              📊 {planDisplay} の学習データ
                              <span className="word-status-badge">
                                {statusIcon} {statusLabel}
                              </span>
                            </div>
                            <div className="word-detail-stats">
                              <span className="word-stat-label">正解:</span>
                              <strong className="word-stat-value">
                                {stat.correctCount}/{totalAttempts}回
                              </strong>
                              <span className="word-stat-divider">｜</span>
                              {historyIcons && (
                                <>
                                  <span className="word-stat-label">履歴:</span>
                                  <span className="word-history-icons">{historyIcons}</span>
                                  <span className="word-stat-divider">｜</span>
                                </>
                              )}
                              <span className="word-stat-label">定着率:</span>
                              <strong className="word-stat-value word-retention-rate">
                                {retentionRate}%
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="word-detail-empty">
                      <p>まだ文法問題の解答データがありません</p>
                      <p className="stat-text-sub">問題を解くと単元ごとの成績が表示されます</p>
                    </div>
                  )}
                </div>
              ) : currentWord && currentWordData ? (
                <div className="word-detail-container">
                  <div className="word-detail-title">
                    📊 {currentWord} の学習データ
                    <span className="word-status-badge">
                      {currentWordData.statusIcon} {currentWordData.statusLabel}
                    </span>
                  </div>
                  <div className="word-detail-stats">
                    <span className="word-stat-label">正解:</span>
                    <strong className="word-stat-value">
                      {currentWordData.correctCount}/{currentWordData.totalCount}回
                    </strong>
                    <span className="word-stat-divider">｜</span>
                    {currentWordData.accuracyHistory &&
                      currentWordData.accuracyHistory.length > 0 && (
                        <>
                          <span className="word-stat-label">履歴:</span>
                          <span className="word-history-icons">
                            {currentWordData.accuracyHistory}
                          </span>
                          <span className="word-stat-divider">｜</span>
                        </>
                      )}
                    <span className="word-stat-label">定着率:</span>
                    <strong className="word-stat-value word-retention-rate">
                      {currentWordData.retentionRate}%
                    </strong>
                    {currentWordData.position !== undefined && (
                      <>
                        <span className="word-stat-divider">｜</span>
                        <span className="word-stat-label">Position:</span>
                        <strong className="word-stat-value">
                          {currentWordData.position.toFixed(0)}
                        </strong>
                      </>
                    )}
                  </div>
                  {/* タブ別Position表示 */}
                  {(currentWordData.memorizationPosition !== undefined ||
                    currentWordData.translationPosition !== undefined ||
                    currentWordData.spellingPosition !== undefined ||
                    currentWordData.grammarPosition !== undefined) && (
                    <div className="word-detail-stats">
                      {currentWordData.memorizationPosition !== undefined && (
                        <>
                          <span className="word-stat-label">暗記:</span>
                          <strong className="word-stat-value">
                            {currentWordData.memorizationPosition.toFixed(0)}
                          </strong>
                          <span className="word-stat-divider">｜</span>
                        </>
                      )}
                      {currentWordData.translationPosition !== undefined && (
                        <>
                          <span className="word-stat-label">和訳:</span>
                          <strong className="word-stat-value">
                            {currentWordData.translationPosition.toFixed(0)}
                          </strong>
                          <span className="word-stat-divider">｜</span>
                        </>
                      )}
                      {currentWordData.spellingPosition !== undefined && (
                        <>
                          <span className="word-stat-label">スペル:</span>
                          <strong className="word-stat-value">
                            {currentWordData.spellingPosition.toFixed(0)}
                          </strong>
                          <span className="word-stat-divider">｜</span>
                        </>
                      )}
                      {currentWordData.grammarPosition !== undefined && (
                        <>
                          <span className="word-stat-label">文法:</span>
                          <strong className="word-stat-value">
                            {currentWordData.grammarPosition.toFixed(0)}
                          </strong>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : currentWord && !currentWordData ? (
                <div className="word-detail-empty">
                  <p>この単語のデータがまだありません</p>
                </div>
              ) : (
                <div className="word-detail-empty">
                  <p>問題を開始すると、現在の単語のデータが表示されます</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 学習設定タブ */}
      {activeTab === 'settings' && (
        <div className="score-board-content">
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
            <div className="settings-tab-container">
              <div className="word-detail-empty">
                <p>このタブの設定は学習設定パネルから行えます</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScoreBoard;
