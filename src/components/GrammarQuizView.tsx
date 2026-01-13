import { useState, useEffect, useRef, useCallback } from 'react';
import './GrammarQuizView.css';
import ScoreBoard from './ScoreBoard';
import { useSessionStats } from '../hooks/useSessionStats';
import { logger } from '@/utils/logger';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';
import { useAdaptiveNetwork } from '../hooks/useAdaptiveNetwork';
import { QuestionCategory } from '../strategies/memoryAcquisitionAlgorithm';
import { sessionKpi } from '../metrics/sessionKpi';
import { useQuestionRequeue } from '../hooks/useQuestionRequeue';
import { QuestionScheduler } from '@/ai/scheduler';
import { RequeuingDebugPanel } from './RequeuingDebugPanel';

function buildPunctuationAwareBlankTemplate(answer: string | undefined | null): string | null {
  if (!answer) return null;

  // Keep common punctuation visible while hiding words as blanks.
  const tokens = answer.match(
    /[A-Za-z0-9]+(?:[’'][A-Za-z0-9]+)*(?:-[A-Za-z0-9]+(?:[’'][A-Za-z0-9]+)*)*|[.,!?;:()]/g
  );
  if (!tokens || tokens.length === 0) return null;

  const out: string[] = [];
  for (const token of tokens) {
    const isWordLike = /[A-Za-z0-9]/.test(token);
    if (isWordLike) {
      out.push('____');
      continue;
    }

    // Attach punctuation to the previous blank/token (no extra spaces)
    if (/^[.,!?;:]$/.test(token)) {
      if (out.length === 0) {
        out.push(`____${token}`);
      } else {
        out[out.length - 1] = `${out[out.length - 1]}${token}`;
      }
      continue;
    }

    // Parentheses: keep readable spacing
    if (token === '(') {
      out.push('(');
      continue;
    }
    if (token === ')') {
      if (out.length === 0) {
        out.push(')');
      } else {
        out[out.length - 1] = `${out[out.length - 1]})`;
      }
      continue;
    }
  }

  return out
    .join(' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

function fillBlankSentence(sentence: string, filled: string): string {
  const replacement = filled.trim();
  if (!replacement) return sentence;
  return sentence
    .replace(/____+/g, replacement)
    .replace(/\s+/g, ' ')
    .trim();
}

interface VerbFormQuestion {
  id: string;
  japanese: string;
  sentence: string;
  verb: string;
  choices: string[];
  correctAnswer: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation: string;
  hint: string;
  // パッセージ対応 (Grade 2/3)
  passage?: string; // 問題の文脈となる短いパッセージ
  passageJapanese?: string; // パッセージの日本語訳
}

interface FillInBlankQuestion {
  id: string;
  japanese: string;
  sentence: string;
  choices: string[];
  correctAnswer: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation: string;
  hint: string;
  // パッセージ対応 (Grade 2/3)
  passage?: string; // 問題の文脈となる短いパッセージ
  passageJapanese?: string; // パッセージの日本語訳
}

interface SentenceOrderingQuestion {
  id: string;
  japanese: string;
  words: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  grammarPoint: string;
  wordCount: number;
  hint: string;
  // パッセージ対応 (Grade 2/3)
  passage?: string; // 問題の文脈となる短いパッセージ
  passageJapanese?: string; // パッセージの日本語訳
}

interface _Category {
  category: string;
  grammarPoint: string;
  questions: VerbFormQuestion[] | FillInBlankQuestion[];
}

interface _Unit {
  unit: string;
  title: string;
  sentenceOrdering?: SentenceOrderingQuestion[];
  verbForm?: VerbFormQuestion[];
  fillInBlank?: FillInBlankQuestion[];
  questions?: SentenceOrderingQuestion[]; // 後方互換性のため一時的に保持
}

type QuizType = 'all' | 'random' | 'verb-form' | 'fill-in-blank' | 'sentence-ordering';
type Grade = 'all' | '1' | '2' | '3' | '1-all' | '2-all' | '3-all' | string; // 'g1-u0', 'g1-u1' など

// 全ての型のプロパティを含む包括的な型定義
interface GrammarQuestion {
  id: string;
  // QuestionScheduler/ProgressStorageと整合させるためのキー
  word?: string;
  // QuestionSchedulerで計算されたPosition（0-100）
  position?: number;
  finalPriority?: number;
  japanese: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hint: string;
  // VerbFormQuestion / FillInBlankQuestion固有
  sentence?: string;
  verb?: string;
  choices?: string[];
  correctAnswer?: string;
  explanation?: string;
  // SentenceOrderingQuestion固有
  words?: string[];
  grammarPoint?: string;
  wordCount?: number;
  // パッセージ対応 (Grade 2/3)
  passage?: string; // 問題の文脈となる短いパッセージ
  passageJapanese?: string; // パッセージの日本語訳
  // その他
  type?: string;
  question?: string;
  // セッション優先度管理
  sessionPriority?: number; // 再追加時の優先度
  reAddedCount?: number; // 再追加回数
}

interface GrammarQuizViewProps {
  onSaveProgress?: (data: Record<string, unknown>) => void;
}

function GrammarQuizView(_props: GrammarQuizViewProps) {
  const [quizType, setQuizType] = useState<QuizType>(() => {
    const saved = localStorage.getItem('grammar-quiz-type');
    return (saved as QuizType) || 'verb-form';
  });
  const [grade, setGrade] = useState<Grade>(() => {
    const saved = localStorage.getItem('grammar-grade');
    return (saved as Grade) || 'all';
  });
  const [availableUnits, setAvailableUnits] = useState<{ value: string; label: string }[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [_isFullscreen, _setIsFullscreen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 適応型学習フック（問題選択と記録に使用）
  const adaptiveLearning = useAdaptiveLearning(QuestionCategory.GRAMMAR);

  // 適応的学習AIネットワーク（常時有効）
  const { processQuestion: processAdaptiveQuestion, currentStrategy: _currentStrategy } =
    useAdaptiveNetwork();

  // 統一問題スケジューラー（DTA + 振動防止 + メタAI統合）
  const [scheduler] = useState(() => {
    const s = new QuestionScheduler();
    // 🤖 Phase 2: AI統合を有効化（オプトイン）
    const enableAI =
      import.meta.env.DEV || localStorage.getItem('enable-ai-coordination') === 'true';
    if (enableAI) {
      logger.info('🤖 [GrammarQuizView] AI統合が有効化されました');
    }
    return s;
  });

  // 問題再出題管理フック
  const {
    reAddQuestion,
    clearExpiredFlags,
    updateRequeueStats,
    getRequeuedWords,
    checkPositionMismatch,
  } = useQuestionRequeue<GrammarQuestion>();

  // 回答時刻を記録（ScoreBoard更新用）
  const [lastAnswerTime, setLastAnswerTime] = useState<number>(Date.now());

  // 回答結果を追跡（動的AIコメント用）
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | undefined>(undefined);
  const [lastAnswerWord, setLastAnswerWord] = useState<string | undefined>(undefined);
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [incorrectStreak, setIncorrectStreak] = useState<number>(0);

  // 🆕 バッチ数設定（LocalStorageから読み込み）
  const batchSize = (() => {
    try {
      const saved = localStorage.getItem('grammar-batch-size');
      return saved ? parseInt(saved) : null;
    } catch {
      return null;
    }
  })();

  // 🆕 不正解の上限比率（10-50%）
  const reviewRatioLimit = (() => {
    try {
      const saved = localStorage.getItem('grammar-review-ratio-limit');
      return saved ? parseInt(saved) : 20; // デフォルト20%
    } catch {
      return 20;
    }
  })();

  // 復習モード
  const [isReviewFocusMode, setIsReviewFocusMode] = useState(false);

  // 🎯 暗記タブ同等: 途中の再吸引（再スケジュール）トリガー
  const [answerCountSinceSchedule, setAnswerCountSinceSchedule] = useState(0);
  const [needsRescheduling, setNeedsRescheduling] = useState(false);

  // 復習モードトグル
  const handleReviewFocus = () => {
    setIsReviewFocusMode(!isReviewFocusMode);
  };

  // デバッグハンドラー
  const handleResetProgress = async () => {
    if (!confirm('本当にすべての学習記録を削除しますか？この操作は元に戻せません。')) return;

    try {
      // resetAllProgressを使用して完全リセット（成績タブと同じ処理）
      const { resetAllProgress } = await import('../progressStorage');
      await resetAllProgress();

      // 画面上のセッション状態もリセット
      setQuizStarted(false);
      setCurrentQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setRemainingWords([]);
      setTextInput('');
      setAnswered(false);
      setShowHint(false);
      setScore(0);
      setTotalAnswered(0);
      resetSessionStats();
      setCorrectStreak(0);
      setIncorrectStreak(0);
      console.log('✅ [文法タブ] 学習記録をリセットしました');
      alert('学習記録をリセットしました');
    } catch (error) {
      console.error('❌ [文法タブ] 成績リセット失敗', error);
      alert('リセットに失敗しました');
    }
  };

  const handleDebugRequeue = () => {
    setShowDebugPanel(true);
  };

  // 適応的AI分析ヘルパー関数（常時有効）
  const processWithAdaptiveAI = async (questionId: string, isCorrect: boolean) => {
    try {
      const calculateDifficulty = (q: GrammarQuestion): number => {
        if (q.difficulty === 'beginner') return 0.3;
        if (q.difficulty === 'intermediate') return 0.6;
        if (q.difficulty === 'advanced') return 0.9;
        return 0.5;
      };

      const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        if (hour < 22) return 'evening';
        return 'night';
      };

      await processAdaptiveQuestion(questionId, isCorrect ? 'correct' : 'incorrect', {
        currentDifficulty: calculateDifficulty(currentQuestion),
        timeOfDay: getTimeOfDay(),
        recentErrors: sessionStats.incorrect,
        sessionLength: Math.floor((Date.now() - questionStartTimeRef.current) / 60000),
        consecutiveCorrect: correctStreak,
      });
    } catch (error) {
      console.error('[GrammarQuizView] Adaptive AI error:', error);
    }
  };

  // 自動次への設定
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoNext-grammar');
    return saved === 'true';
  });

  const [autoNextDelay, setAutoNextDelay] = useState<number>(() => {
    const saved = localStorage.getItem('autoNextDelay-grammar');
    return saved ? parseInt(saved, 10) : 1500;
  });

  // 回答時自動読み上げ設定
  const [autoReadAloud, setAutoReadAloud] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoReadAloud-grammar');
    return saved === 'true';
  });

  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [currentQuestions, setCurrentQuestions] = useState<GrammarQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [textInput, setTextInput] = useState<string>(''); // テキスト入力用
  const [answered, setAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  // セッション統計（カスタムフック）- 文法タブ専用
  const { sessionStats, setSessionStats, resetStats: resetSessionStats } = useSessionStats('grammar');
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const isSentenceOrdering =
    currentQuestion?.type === 'sentenceOrdering' || quizType === 'sentence-ordering';

  const sentenceOrderingCorrectAnswer: string | undefined = isSentenceOrdering
    ? ((currentQuestion as any)?.correctAnswer || (currentQuestion as any)?.correctOrder)
    : undefined;
  const sentenceOrderingPunctuationTemplate = isSentenceOrdering
    ? buildPunctuationAwareBlankTemplate(sentenceOrderingCorrectAnswer)
    : null;
  const shouldShowSentenceOrderingPunctuationTemplate =
    isSentenceOrdering &&
    typeof sentenceOrderingCorrectAnswer === 'string' &&
    /[.,!?;:]/.test(sentenceOrderingCorrectAnswer) &&
    !!sentenceOrderingPunctuationTemplate;

  // 現在の問題から単元を抽出（履歴表示用）
  const currentGrammarUnit = currentQuestion?.id
    ? (() => {
        // 問題IDの形式: g1-u0-fib-001 または g1-u1-so-002
        const match = currentQuestion.id.match(/^g(\d+)-u(\d+)/);
        if (match) {
          return `g${match[1]}-unit${match[2]}`;
        }
        return undefined;
      })()
    : undefined;

  // Refs（useEffect前に定義）
  const prevSettingsRef = useRef({ quizType, grade });
  const questionStartTimeRef = useRef<number>(Date.now());

  // ハンドラー関数（useEffect前に定義）
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;

      // セッション優先フラグのクリーン処理：5問経過したらクリア
      const cleanedQuestions = clearExpiredFlags(currentQuestions, nextIndex - 1);

      if (cleanedQuestions !== currentQuestions) {
        setCurrentQuestions(cleanedQuestions);
      }

      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setAnswered(false);
      setShowHint(false);
      questionStartTimeRef.current = Date.now(); // 次の問題の開始時刻を記録
      // 次の問題に移動したのlastAnswerWordをリセット（解答前に解答後コメントが表示されるのを防ぐ）
      setLastAnswerWord(undefined);
    }
  }, [currentQuestionIndex, currentQuestions]);

  const handleStartQuiz = useCallback(async () => {
    // 🚨 パフォーマンス改善: 既に問題がロード済みの場合はスキップ
    if (loading) {
      if (import.meta.env.DEV) {
        console.log('[GrammarQuizView] Already loading, skip duplicate call');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 学年フィルターの解析
      let gradesToLoad: string[] = [];
      let selectedUnitIndex: number | null = null;

      if (grade === 'all') {
        gradesToLoad = ['1', '2', '3'];
      } else if (grade.match(/^[123]$/)) {
        // '1', '2', '3' の場合
        gradesToLoad = [grade];
      } else if (grade.endsWith('-all')) {
        // '1-all', '2-all', '3-all' の場合
        gradesToLoad = [grade.charAt(0)];
      } else if (grade.match(/^g\d+-unit\d+$/)) {
        // 'g1-unit0' のような特定のUnit
        const gradeNum = grade.match(/^g(\d+)-unit(\d+)$/)?.[1];
        const unitNum = grade.match(/^g(\d+)-unit(\d+)$/)?.[2];
        if (gradeNum && unitNum !== undefined) {
          gradesToLoad = [gradeNum];
          selectedUnitIndex = parseInt(unitNum);
        }
      }

      const allGrammarFiles: Array<{
        enabled?: boolean;
        disabledReason?: string;
        questions?: GrammarQuestion[];
      }> = [];

      // 新しいgrammar_grade{N}_unit{X}.json形式のファイルを読み込む
      for (const g of gradesToLoad) {
        for (let unitIdx = 0; unitIdx < 10; unitIdx++) {
          // 特定のunitが選択されている場合はそれだけを読み込む
          if (selectedUnitIndex !== null && unitIdx !== selectedUnitIndex) {
            continue;
          }

          try {
            const res = await fetch(`/data/grammar/grade${g}/unit${unitIdx}.json`);
            if (res.ok) {
              const data = await res.json();

              // enabledフラグをチェック (デフォルトはtrue)
              if (data.enabled === false) {
                logger.log(
                  `grammar_grade${g}_unit${unitIdx}.json is disabled: ${data.disabledReason || 'No reason provided'}`
                );
                continue; // 無効化されたユニットはスキップ
              }

              allGrammarFiles.push(data);
            } else {
              // ファイルが見つからない場合(404など)はデバッグモードでのみログ出力
              logger.log(
                `grammar_grade${g}_unit${unitIdx}.json returned status ${res.status}, skipping...`
              );
            }
          } catch (err) {
            // ネットワークエラーなど、fetch自体が失敗した場合
            logger.log(`Failed to fetch grammar_grade${g}_unit${unitIdx}.json:`, err);
          }
        }
      }

      if (allGrammarFiles.length === 0) {
        throw new Error(`問題データが見つかりません（学年: ${grade}, 形式: ${quizType}）`);
      }

      // 全ての問題を収集
      const questions: GrammarQuestion[] = [];

      // 新しいgrammar形式から問題を収集
      allGrammarFiles.forEach((grammarFile) => {
        const allQuestions = grammarFile.questions || [];

        // quizTypeをデータのtype形式に変換
        const typeMapping: { [key: string]: string } = {
          'verb-form': 'verbForm',
          'fill-in-blank': 'fillInBlank',
          'sentence-ordering': 'sentenceOrdering',
        };

        // 問題形式でフィルタリング
        if (quizType === 'all' || quizType === 'random') {
          // 全形式を含める
          questions.push(...allQuestions);
        } else {
          // 特定の形式のみ (quizTypeをデータ形式に変換)
          const targetType = typeMapping[quizType] || quizType;
          const filtered = allQuestions.filter((q: GrammarQuestion) => q.type === targetType);
          questions.push(...filtered);
        }
      });

      if (questions.length === 0) {
        throw new Error('選択された条件に該当する問題がありません');
      }

      logger.log(`Total questions: ${questions.length}`);

      if (questions.length === 0) {
        throw new Error(`問題データが見つかりません`);
      }

      // QuestionSchedulerで出題順序を決定（シャッフルは内部で実施）
      // 🔥 重要: 前回セッションの統計データも引き継ぐ（より良い初期出題順序）
      const toProgressKey = (q: GrammarQuestion): string => {
        if (q.word) return q.word;
        if (q.id) return `grammar_${q.id}`;
        if (q.question) {
          return `grammar_${q.question.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
        const fallback = q.japanese || q.sentence || 'unknown';
        return `grammar_${String(fallback)
          .slice(0, 50)
          .replace(/[^a-zA-Z0-9]/g, '_')}`;
      };

      const scheduleInputs = questions.map((q) => {
        const word = toProgressKey(q);
        return {
          word,
          meaning: q.japanese || '',
          reading: '',
          grade: 1,
          category: 'grammar',
          etymology: '',
          relatedWords: '',
          relatedFields: '',
          difficulty: q.difficulty || 'beginner',
        };
      });

      const scheduleResult = await scheduler.schedule({
        questions: scheduleInputs,
        mode: 'grammar',
        useCategorySlots: true,
        sessionStats: {
          correct: sessionStats.correct,
          incorrect: sessionStats.incorrect,
          still_learning: sessionStats.review || 0,
          mastered: sessionStats.mastered || 0,
          duration: 0,
        },
        isReviewFocusMode: isReviewFocusMode,
      });

      // スケジュールされたID順序にGrammarQuestionを並べ替え
      const wordToQuestion = new Map(
        questions.map((q) => {
          const key = toProgressKey(q);
          return [key, q] as const;
        })
      );
      const scheduledQuestions = scheduleResult.scheduledQuestions
        .map((q) => {
          const original = wordToQuestion.get(q.word);
          if (!original) return undefined;
          return {
            ...original,
            word: q.word,
            position: (q as any).position,
            finalPriority: (q as any).finalPriority,
          } as GrammarQuestion;
        })
        .filter((q): q is GrammarQuestion => q !== undefined);

      // 振動スコア監視
      if (scheduleResult.vibrationScore > 50) {
        logger.warn('[GrammarQuizView] 高い振動スコア検出', {
          score: scheduleResult.vibrationScore,
          processingTime: scheduleResult.processingTime,
        });
      }

      logger.log('[GrammarQuizView] QuestionScheduler適用完了', {
        total: scheduledQuestions.length,
        vibrationScore: scheduleResult.vibrationScore,
      });

      setCurrentQuestions(scheduledQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setRemainingWords([]);
      setAnswered(false);
      setShowHint(false);
      setScore(0);
      setTotalAnswered(0);
      setSessionStats({
        correct: 0,
        incorrect: 0,
        review: 0,
        mastered: 0,
        newQuestions: 0,
        reviewQuestions: 0,
        consecutiveNew: 0,
        consecutiveReview: 0,
      });
      setAnswerCountSinceSchedule(0);
      setNeedsRescheduling(false);
      setQuizStarted(true);
      setLoading(false);
    } catch (err) {
      logger.error('データ読み込みエラー:', err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, [quizType, grade]);

  // 🎯 暗記タブ同等: 途中の自動再スケジューリング（現在位置以降のみ）
  useEffect(() => {
    if (!needsRescheduling) return;
    if (currentQuestions.length === 0) return;

    const currentIndexAtSchedule = currentQuestionIndex;

    const toProgressKey = (q: GrammarQuestion): string => {
      if (q.word) return q.word;
      if (q.id) return `grammar_${q.id}`;
      if (q.question) {
        return `grammar_${q.question.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      const fallback = q.japanese || q.sentence || 'unknown';
      return `grammar_${String(fallback)
        .slice(0, 50)
        .replace(/[^a-zA-Z0-9]/g, '_')}`;
    };

    const performRescheduling = async () => {
      try {
        const remaining = currentQuestions.slice(currentIndexAtSchedule);
        if (remaining.length === 0) {
          setNeedsRescheduling(false);
          return;
        }

        const scheduleInputs = remaining.map((q) => {
          const word = toProgressKey(q);
          return {
            word,
            meaning: q.japanese || '',
            reading: '',
            grade: 1,
            category: 'grammar',
            etymology: '',
            relatedWords: '',
            relatedFields: '',
            difficulty: q.difficulty || 'beginner',
          };
        });

        const wordToQuestion = new Map(
          remaining.map((q) => {
            const key = toProgressKey(q);
            return [key, q] as const;
          })
        );

        logger.info('[GrammarQuizView] 自動再スケジューリング開始', {
          answerCount: answerCountSinceSchedule,
          currentIndex: currentIndexAtSchedule,
          remaining: remaining.length,
        });

        const scheduleResult = await scheduler.schedule({
          questions: scheduleInputs,
          mode: 'grammar',
          useCategorySlots: true,
          sessionStats: {
            correct: sessionStats.correct,
            incorrect: sessionStats.incorrect,
            still_learning: sessionStats.review || 0,
            mastered: sessionStats.mastered || 0,
            duration: 0,
          },
          isReviewFocusMode: isReviewFocusMode,
        });

        const newRemaining = scheduleResult.scheduledQuestions
          .map((q) => {
            const original = wordToQuestion.get(q.word);
            if (!original) return undefined;
            return {
              ...original,
              word: q.word,
              position: (q as any).position,
              finalPriority: (q as any).finalPriority,
            } as GrammarQuestion;
          })
          .filter((q): q is GrammarQuestion => q !== undefined);

        setCurrentQuestions((prev) => {
          if (prev.length === 0) return prev;
          if (currentQuestionIndex !== currentIndexAtSchedule) return prev;
          return [...prev.slice(0, currentIndexAtSchedule), ...newRemaining];
        });

        setAnswerCountSinceSchedule(0);
        setNeedsRescheduling(false);

        logger.info('[GrammarQuizView] 自動再スケジューリング完了', {
          newRemaining: newRemaining.length,
        });
      } catch (error) {
        logger.error('[GrammarQuizView] 再スケジューリングエラー:', error);
        setNeedsRescheduling(false);
      }
    };

    performRescheduling();
  }, [
    needsRescheduling,
    currentQuestions,
    currentQuestionIndex,
    scheduler,
    sessionStats,
    isReviewFocusMode,
    answerCountSinceSchedule,
  ]);

  const handleSkip = useCallback(async () => {
    if (!answered) {
      // スキップは正解として扱い、定着済みとしてカウント
      setScore((prev) => prev + 1);
      setTotalAnswered((prev) => prev + 1);
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        mastered: prev.mastered + 1,
      }));

      // 進捗データに記録（正解として）
      const responseTime = Date.now() - questionStartTimeRef.current;
      const { updateWordProgress, addSessionHistory } = await import('../progressStorage');
      // ID生成を統一: id優先、なければquestion、それもなければunknown
      const questionId = currentQuestion.id
        ? `grammar_${currentQuestion.id}`
        : currentQuestion.question
          ? `grammar_${currentQuestion.question.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`
          : `grammar_unknown_${Date.now()}`;
      await updateWordProgress(
        questionId,
        true, // スキップは正解として記録
        responseTime,
        undefined,
        'grammar'
      );

      // セッション履歴に追加（翻訳タブと同様に正解として記録）
      const status: 'correct' | 'incorrect' | 'review' | 'mastered' = 'correct';

      addSessionHistory(
        {
          status,
          word: questionId,
          timestamp: Date.now(),
        },
        'grammar'
      );

      // 進捗データ更新完了後に回答時刻を更新（ScoreBoard更新用）
      setLastAnswerTime(Date.now());

      // 即座に次の問題へ遷移（answered状態を設定せず、正解表示をスキップ）
      if (currentQuestionIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setSelectedWords([]);
        setAnswered(false);
        setShowHint(false);
        questionStartTimeRef.current = Date.now();
      } else {
        // 末尾の場合はそのまま終了状態を維持（本番UIは最終画面のまま）
        // 開発時のみKPIサマリを出力
        if (!window.location.hostname.includes('github.io')) {
          try {
            const summary = sessionKpi.summarize();
            logger.log('🧪 KPI Summary (grammar):', summary);
          } catch {
            // KPI集計失敗は無視（開発用機能のため）
          }
        }
        setAnswered(false);
      }

      // 🎯 暗記タブ同等: スキップも「解答」としてカウントし、定期再スケジューリング対象に含める
      setAnswerCountSinceSchedule((prev) => {
        const next = prev + 1;
        if (next >= 50) {
          setNeedsRescheduling(true);
          return 0;
        }
        if (next % 10 === 0) {
          const mismatchResult = checkPositionMismatch(currentQuestions, 'grammar');
          if (mismatchResult.needsRescheduling) {
            setNeedsRescheduling(true);
          }
        }
        return next;
      });
    } else {
      // 回答済みの場合は通常の次へ処理
      handleNext();
    }
  }, [
    answered,
    currentQuestionIndex,
    currentQuestions,
    currentQuestion,
    handleNext,
    checkPositionMismatch,
  ]);

  // 設定をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('grammar-quiz-type', quizType);
  }, [quizType]);

  useEffect(() => {
    localStorage.setItem('grammar-grade', grade);
  }, [grade]);

  // 学年やクイズタイプが変更されたときにUnit一覧を更新
  useEffect(() => {
    const loadUnits = async () => {
      const units: { value: string; label: string }[] = [];
      // gradeから学年番号を抽出（'1', '2', '3', 'g1-unit0' -> '1', '2-all' -> '2'）
      const gradeMatch = grade.match(/^g?(\d+)/);
      const gradeNum = gradeMatch ? gradeMatch[1] : null;

      if (!gradeNum || grade === 'all') {
        setAvailableUnits([]);
        return;
      }

      // 新しいgrammar_grade{N}_unit{X}.json形式から単元一覧を読み込む
      for (let unitIdx = 0; unitIdx < 10; unitIdx++) {
        try {
          const res = await fetch(`/data/grammar/grade${gradeNum}/unit${unitIdx}.json`);
          if (res.ok) {
            const data = await res.json();

            // enabledフラグをチェック (デフォルトはtrue)
            if (data.enabled === false) {
              continue; // 無効化されたユニットは一覧に表示しない
            }

            units.push({
              value: `g${gradeNum}-unit${unitIdx}`,
              label: `中${gradeNum}_Unit${unitIdx}_${data.title}`,
            });
          }
          // ファイルが存在しない場合は静かにスキップ
        } catch {
          // ファイル読み込みエラーは無視(存在しないファイルは正常)
        }
      }

      setAvailableUnits(units);
    };

    loadUnits();
  }, [grade, quizType]);

  // 設定が変更されたらクイズをリロード（クイズ開始中のみ）
  // 🚨 パフォーマンス改善: handleStartQuizを依存配列から削除して無限ループを防ぐ
  useEffect(() => {
    const prevSettings = prevSettingsRef.current;
    const settingsChanged = prevSettings.quizType !== quizType || prevSettings.grade !== grade;

    if (quizStarted && settingsChanged) {
      // 設定が変わったらクイズを再ロード
      handleStartQuiz();
    }

    prevSettingsRef.current = { quizType, grade };
  }, [quizType, grade, quizStarted, handleStartQuiz]);

  // 問題が変わるたびに並べ替え用の単語をシャッフル
  useEffect(() => {
    if (isSentenceOrdering && currentQuestion && currentQuestion.words) {
      const shuffled = [...currentQuestion.words].sort(() => Math.random() - 0.5);
      setRemainingWords(shuffled);
      setSelectedWords([]);
      setAnswered(false);
      setShowHint(false);
    }
  }, [currentQuestionIndex, currentQuestions, isSentenceOrdering, currentQuestion]);

  // 問題が変わるたびにリセット
  useEffect(() => {
    setSelectedAnswer(null);
    setTextInput('');
    setAnswered(false);
    setShowHint(false);
  }, [currentQuestionIndex]);

  // Enterキーでスキップ機能（未回答時のみ）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // クイズ開始中かつ未回答時のみEnterキーでスキップ
      if (quizStarted && !answered && event.key === 'Enter') {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quizStarted, answered, handleSkip]);

  // 選択肢クリック時に即座に判定（和訳・スペルタブと同じ）
  const handleAnswerSelect = async (answer: string) => {
    if (answered || isSentenceOrdering) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    // 「分からない」は不正解として扱い、要復習にカウント
    const isCorrect = answer === currentQuestion.correctAnswer;
    const isDontKnow = answer === '分からない';

    // 回答結果を記録（動的AIコメント用）
    setLastAnswerCorrect(isCorrect);
    setLastAnswerWord(currentQuestion.question || currentQuestion.sentence);
    if (isCorrect) {
      setCorrectStreak((prev) => prev + 1);
      setIncorrectStreak(0);
    } else {
      setIncorrectStreak((prev) => prev + 1);
      setCorrectStreak(0);
    }

    // 🔥 新規枯渇防止: 不正解連打（「分からない」含む）時は残りキューを再スケジューリングして
    // インターリーブ（[苦手語4, 新規1]）を回復させる
    const nextIncorrectStreak = isCorrect ? 0 : incorrectStreak + 1;
    if (!needsRescheduling && nextIncorrectStreak >= 5) {
      setNeedsRescheduling(true);
    }

    // 自動読み上げが有効な場合、正解時は穴埋め済みの英文を読み上げ
    const baseSentenceToRead =
      (currentQuestion as any).question ||
      (currentQuestion as any).targetSentence ||
      currentQuestion.sentence;

    if (autoReadAloud && baseSentenceToRead) {
      setTimeout(() => {
        const textToRead = isCorrect
          ? fillBlankSentence(String(baseSentenceToRead), answer)
          : String(baseSentenceToRead);
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }, 300);
    }

    setTotalAnswered((prev) => prev + 1);

    // 応答時間を計算
    const responseTime = Date.now() - questionStartTimeRef.current;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      // 連続3回正解で定着とみなす（簡易判定）
      const isMastered = currentQuestion && score >= 2;
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        mastered: isMastered ? prev.mastered + 1 : prev.mastered,
      }));
    } else if (isDontKnow) {
      // 「分からない」は要復習として扱う
      setSessionStats((prev) => ({
        ...prev,
        incorrect: prev.incorrect + 1,
        review: prev.review + 1,
      }));
    } else {
      setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    // 進捗データに記録（ScoreBoard統計用）- updateWordProgressを使用
    // 問題IDを使用して文法問題の進捗を記録（単語と区別するためgrammar_プレフィックスを追加）
    const { updateWordProgress, loadProgress, addSessionHistory, addQuizResult } =
      await import('../progressStorage');
    // ID生成を統一: id優先、なければquestion、それもなければunknown
    const questionId = currentQuestion.id
      ? `grammar_${currentQuestion.id}`
      : currentQuestion.question
        ? `grammar_${currentQuestion.question.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`
        : `grammar_unknown_${Date.now()}`;

    // 学習カレンダー用に回答を記録
    const { generateId } = await import('../utils');
    await addQuizResult({
      id: generateId(),
      questionSetId: 'grammar-set',
      questionSetName: '文法問題',
      score: isCorrect ? 1 : 0,
      total: 1,
      percentage: isCorrect ? 100 : 0,
      date: Date.now(),
      timeSpent: Math.floor(responseTime / 1000),
      incorrectWords: isCorrect ? [] : [questionId],
      mode: 'grammar',
      category: undefined,
      difficulty: currentQuestion.difficulty,
    });

    await updateWordProgress(questionId, isCorrect, responseTime, undefined, 'grammar');

    // 適応型学習への記録
    adaptiveLearning.recordAnswer(questionId, isCorrect, responseTime);

    // 適応的学習AIネットワークによる分析
    await processWithAdaptiveAI(questionId, isCorrect);

    // セッション履歴に追加
    const progress = await loadProgress();
    const wordProgress = progress.wordProgress?.[questionId];
    let status: 'correct' | 'incorrect' | 'review' | 'mastered' = isCorrect
      ? 'correct'
      : 'incorrect';

    // 定着判定
    if (wordProgress && wordProgress.masteryLevel === 'mastered') {
      status = 'mastered';
    } else if (!isCorrect && wordProgress && wordProgress.incorrectCount >= 2) {
      // 2回以上間違えた場合は要復習
      status = 'review'
    }

    addSessionHistory(
      {
        status,
        word: questionId,
        timestamp: Date.now(),
      },
      'grammar'
    );

    // 進捗データ更新完了後に回答時刻を更新（ScoreBoard更新用）
    setLastAnswerTime(Date.now());

    // 🔒 暗記タブ同等: 不正解は近い将来に再出題として差し込み
    let questionsAfterRequeue = currentQuestions;
    if (!isCorrect && currentQuestion) {
      const updated = reAddQuestion(
        currentQuestion,
        currentQuestions,
        currentQuestionIndex,
        'grammar',
        { outcome: 'incorrect' }
      );
      questionsAfterRequeue = updated;
      if (updated !== currentQuestions) {
        setCurrentQuestions(updated);
      }
    }

    // 🎯 暗記タブ同等: 50回ごと再吸引 + 10回ごとPosition不整合チェック
    setAnswerCountSinceSchedule((prev) => {
      const next = prev + 1;
      if (next >= 50) {
        setNeedsRescheduling(true);
        return 0;
      }
      if (next % 10 === 0) {
        const mismatchResult = checkPositionMismatch(questionsAfterRequeue, 'grammar');
        if (mismatchResult.needsRescheduling) {
          setNeedsRescheduling(true);
        }
      }
      return next;
    });

    // KPIロギング + 新規/復習の統計を更新
    {
      const qid = String((currentQuestion as any).word);
      sessionKpi.onShown(qid);
      sessionKpi.onAnswer(qid, isCorrect);
    }
    updateRequeueStats(currentQuestion, sessionStats, setSessionStats);
  };

  const handleWordClick = (word: string, fromRemaining: boolean) => {
    if (answered || !isSentenceOrdering) return;

    if (fromRemaining) {
      setRemainingWords((prev) => prev.filter((w) => w !== word));
      setSelectedWords((prev) => {
        const newWords = [...prev, word];

        // 全ての単語を選択したら自動で判定
        if (newWords.length === currentQuestion.words?.length && !answered) {
          setTimeout(async () => {
            setAnswered(true);

            const userAnswer = newWords.join(' ');
            // 正解は correctAnswer, correctOrder, sentence のいずれかに格納されている
            const correctAnswer = (
              (currentQuestion as any).correctAnswer ||
              (currentQuestion as any).correctOrder ||
              currentQuestion.sentence ||
              ''
            )
              .replace(/[.!?]/g, '')
              .trim(); // ピリオドなどを除去して比較
            const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

            setTotalAnswered((prevTotal) => prevTotal + 1);

            // 応答時間を計算
            const responseTime = Date.now() - questionStartTimeRef.current;

            // 自動読み上げが有効な場合、正解の英文を読み上げ
            if (autoReadAloud) {
              setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(correctAnswer);
                utterance.lang = 'en-US';
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
              }, 300);
            }

            if (isCorrect) {
              setScore((prevScore) => prevScore + 1);
              // 連続3回正解で定着とみなす（簡易判定）
              const isMastered = score >= 2;
              setSessionStats((prev) => ({
                ...prev,
                correct: prev.correct + 1,
                mastered: isMastered ? prev.mastered + 1 : prev.mastered,
              }));
            } else {
              setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
            }

            // 進捗データに記録（ScoreBoard統計用）- updateWordProgressを使用
            // 問題IDを使用して文法問題の進捗を記録（単語と区別するためgrammar_プレフィックスを追加）
            const { updateWordProgress, loadProgress, addSessionHistory } =
              await import('../progressStorage');
            // ID生成を統一: id優先、なければquestion、それもなければunknown
            const questionId = currentQuestion.id
              ? `grammar_${currentQuestion.id}`
              : currentQuestion.question
                ? `grammar_${currentQuestion.question.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`
                : `grammar_unknown_${Date.now()}`;
            await updateWordProgress(questionId, isCorrect, responseTime, undefined, 'grammar');

            // セッション履歴に追加
            const progress = await loadProgress();
            const wordProgress = progress.wordProgress?.[questionId];
            let status: 'correct' | 'incorrect' | 'review' | 'mastered' = isCorrect
              ? 'correct'
              : 'incorrect';

            // 定着判定
            if (wordProgress && wordProgress.masteryLevel === 'mastered') {
              status = 'mastered';
            } else if (!isCorrect && wordProgress && wordProgress.incorrectCount >= 2) {
              // 2回以上間違えた場合は要復習
              status = 'review';
            }

            addSessionHistory(
              {
                status,
                word: questionId,
                timestamp: Date.now(),
              },
              'grammar'
            );

            // 適応的学習AIネットワークによる分析
            await processWithAdaptiveAI(questionId, isCorrect);

            // 進捗データ更新完了後に回答時刻を更新（ScoreBoard更新用）
            setLastAnswerTime(Date.now());
          }, 100);
        }

        return newWords;
      });
    } else {
      setSelectedWords((prev) => prev.filter((w) => w !== word));
      setRemainingWords((prev) => [...prev, word]);
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setSelectedWords([]);
      setAnswered(false);
      setShowHint(false);
      questionStartTimeRef.current = Date.now(); // 前の問題の開始時刻を記録
    }
  };

  const isCorrect = () => {
    if (!currentQuestion || !answered) return false;
    if (isSentenceOrdering) {
      return selectedWords.join(' ') === currentQuestion.words?.join(' ');
    }
    return selectedAnswer === currentQuestion.correctAnswer;
  };

  // コンポーネントマウント時に自動でクイズ開始
  useEffect(() => {
    if (!quizStarted) {
      handleStartQuiz();
    }
  }, [quizStarted, handleStartQuiz]);

  return (
    <div className="quiz-view">
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button
            onClick={handleStartQuiz}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      )}

      {!error && quizStarted && currentQuestion && (
        <>
          {/* スコアボード */}
          <div className="mb-4 flex justify-center">
            <div className="w-full max-w-4xl">
              <ScoreBoard
                mode="grammar"
                currentScore={score}
                totalAnswered={totalAnswered}
                sessionCorrect={sessionStats.correct}
                sessionIncorrect={sessionStats.incorrect}
                sessionReview={sessionStats.review}
                sessionMastered={sessionStats.mastered}
                onReviewFocus={handleReviewFocus}
                isReviewFocusMode={isReviewFocusMode}
                onShowSettings={() => setShowSettings(true)}
                onResetProgress={handleResetProgress}
                onDebugRequeue={handleDebugRequeue}
                currentWord={
                  currentQuestion?.id
                    ? `grammar_${currentQuestion.id}`
                    : currentQuestion?.question
                      ? `grammar_${currentQuestion.question.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`
                      : undefined
                }
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
                dataSource={
                  grade.startsWith('g') && grade.includes('-unit')
                    ? `文法問題集｜${grade.replace('g', '').replace('-unit', '-unit')}`
                    : grade === 'all'
                      ? '全学年の内容'
                      : `${grade}年の内容`
                }
                category={
                  quizType === 'all'
                    ? '全ての種類'
                    : quizType === 'verb-form'
                      ? '動詞変化'
                      : quizType === 'fill-in-blank'
                        ? '穴埋め'
                        : quizType === 'sentence-ordering'
                          ? '並び替え'
                          : '全ての種類'
                }
                difficulty=""
                wordPhraseFilter="all"
                grammarUnit={currentGrammarUnit}
              />
            </div>
          </div>

          {/* 文法クイズ中の学習設定パネル */}
          {showSettings && (
            <div className="study-settings-panel">
              <div className="settings-header">
                <h3>📊 学習設定</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-300:bg-gray-600"
                >
                  ✕ 閉じる
                </button>
              </div>

              <div className="filter-group">
                <label htmlFor="grade-select-active">📚 学年・単元:</label>
                <select
                  id="grade-select-active"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="select-input"
                >
                  <option value="all">全学年の内容</option>
                  <option value="1">1年の内容</option>
                  {availableUnits
                    .filter((u) => u.value.startsWith('g1-'))
                    .map((u) => (
                      <option key={u.value} value={u.value}>
                        1年_{u.label.replace(/^中\d+_/, '')}
                      </option>
                    ))}
                  <option value="2">2年の内容</option>
                  {availableUnits
                    .filter((u) => u.value.startsWith('g2-'))
                    .map((u) => (
                      <option key={u.value} value={u.value}>
                        2年_{u.label.replace(/^中\d+_/, '')}
                      </option>
                    ))}
                  <option value="3">3年の内容</option>
                  {availableUnits
                    .filter((u) => u.value.startsWith('g3-'))
                    .map((u) => (
                      <option key={u.value} value={u.value}>
                        3年_{u.label.replace(/^中\d+_/, '')}
                      </option>
                    ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="quiz-type-select-active">📝 問題の種類:</label>
                <select
                  id="quiz-type-select-active"
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as QuizType)}
                  className="select-input"
                >
                  <option value="all">全ての種類</option>
                  <option value="verb-form">動詞変化</option>
                  <option value="fill-in-blank">穴埋め</option>
                  <option value="sentence-ordering">並び替え</option>
                </select>
              </div>

              {/* バッチ数設定 */}
              <div className="filter-group filter-group--section">
                <label htmlFor="grammar-batch-size">📦 バッチ数:</label>
                <select
                  id="grammar-batch-size"
                  value={batchSize ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value);
                    try {
                      if (value === null) {
                        localStorage.removeItem('grammar-batch-size');
                      } else {
                        localStorage.setItem('grammar-batch-size', String(value));
                      }
                      window.location.reload();
                    } catch {
                      // ignore storage errors
                    }
                  }}
                  className="select-input"
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
              <div className="filter-group">
                <label htmlFor="grammar-review-ratio-limit">❌ 不正解の上限:</label>
                <select
                  id="grammar-review-ratio-limit"
                  value={reviewRatioLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    try {
                      localStorage.setItem('grammar-review-ratio-limit', String(value));
                      window.location.reload();
                    } catch {
                      // ignore storage errors
                    }
                  }}
                  className="select-input"
                >
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                  <option value="40">40%</option>
                  <option value="50">50%</option>
                </select>
              </div>

              {/* 自動次へ設定 */}
              <div className="filter-group">
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="auto-next-toggle-grammar-quiz"
                    checked={autoNext}
                    onChange={(e) => {
                      setAutoNext(e.target.checked);
                      localStorage.setItem('autoNext-grammar', e.target.checked.toString());
                    }}
                  />
                  <label htmlFor="auto-next-toggle-grammar-quiz" className="checkbox-label">
                    正解時自動で次へ：{autoNext ? '有効' : '無効'}
                  </label>
                </div>
              </div>

              {autoNext && (
                <div className="filter-group">
                  <label htmlFor="auto-next-delay-grammar-quiz">⏱️ 次への遅延時間：</label>
                  <div className="slider-row">
                    <input
                      type="range"
                      id="auto-next-delay-grammar-quiz"
                      min="500"
                      max="3000"
                      step="100"
                      value={autoNextDelay}
                      onChange={(e) => {
                        const delay = parseInt(e.target.value, 10);
                        setAutoNextDelay(delay);
                        localStorage.setItem('autoNextDelay-grammar', delay.toString());
                      }}
                      className="slider-input"
                    />
                    <span className="slider-value">{(autoNextDelay / 1000).toFixed(1)}秒</span>
                  </div>
                </div>
              )}

              {/* 自動読み上げ設定 */}
              <div className="filter-group">
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="auto-read-aloud-toggle-grammar-quiz"
                    checked={autoReadAloud}
                    onChange={(e) => {
                      setAutoReadAloud(e.target.checked);
                      localStorage.setItem('autoReadAloud-grammar', e.target.checked.toString());
                    }}
                  />
                  <label htmlFor="auto-read-aloud-toggle-grammar-quiz" className="checkbox-label">
                    回答時自動で読み上げ：{autoReadAloud ? '有効' : '無効'}
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="question-container">
            <div className="question-card relative">
              {/* 全画面表示ボタン */}
              <button
                onClick={() => _setIsFullscreen(true)}
                className="absolute top-2 right-2 z-10 p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition shadow-md"
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
              {/* インラインナビゲーション */}
              <div className="question-nav-row">
                <button
                  className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition flex items-center justify-center text-2xl disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  title="前へ"
                >
                  ←
                </button>
                <div className="question-content-inline">
                  <div
                    className={`question-text ${showHint ? 'hint-active' : ''} ${!answered ? 'clickable' : ''}`}
                    onClick={!answered ? toggleHint : undefined}
                    title={!answered ? 'タップしてヒントを表示 💡' : ''}
                  >
                    {currentQuestion.japanese}
                    {!answered && <span className="hint-icon">💡</span>}
                  </div>
                  {currentQuestion.difficulty && (
                    <div className={`difficulty-badge ${currentQuestion.difficulty}`}>
                      {currentQuestion.difficulty === 'beginner'
                        ? '初級'
                        : currentQuestion.difficulty === 'intermediate'
                          ? '中級'
                          : '上級'}
                    </div>
                  )}
                </div>
                <button
                  className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition flex items-center justify-center text-2xl disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={handleSkip}
                  disabled={currentQuestionIndex >= currentQuestions.length - 1}
                  title={answered ? '次へ' : 'スキップ (Enter)'}
                >
                  →
                </button>
              </div>

              {/* ヒント表示 */}
              {showHint && !answered && <div className="hint-box">{currentQuestion.hint}</div>}

              {/* パッセージ表示 (Grade 2/3) */}
              {currentQuestion.passage && (
                <div className="passage-context">
                  <div className="passage-label">📖 文脈</div>
                  <div className="passage-content">
                    <div className="passage-english">{currentQuestion.passage}</div>
                    {currentQuestion.passageJapanese && (
                      <div className="passage-japanese">{currentQuestion.passageJapanese}</div>
                    )}
                  </div>
                </div>
              )}

              {isSentenceOrdering ? (
                <div className="word-area">
                  {shouldShowSentenceOrderingPunctuationTemplate && (
                    <div className="selected-words-area">
                      <div className="area-label">文の形（句読点つき）</div>
                      <div className="sentence-display">{sentenceOrderingPunctuationTemplate}</div>
                    </div>
                  )}
                  <div className="selected-words-area">
                    <div className="area-label-with-reset">
                      <span className="area-label">選択した単語 ({selectedWords.length}語)</span>
                      {!answered && (
                        <button
                          className={`reset-ordering-button ${selectedWords.length === 0 ? 'disabled' : ''}`}
                          onClick={() => {
                            if (selectedWords.length > 0) {
                              // 最後に選択した単語を1つだけ戻す
                              const lastWord = selectedWords[selectedWords.length - 1];
                              setSelectedWords((prev) => prev.slice(0, -1));
                              setRemainingWords((prev) => [...prev, lastWord]);
                            }
                          }}
                          disabled={selectedWords.length === 0}
                          title={
                            selectedWords.length === 0
                              ? '単語を選択してください'
                              : '最後の単語を戻す'
                          }
                        >
                          ↶ 1つ戻る
                        </button>
                      )}
                    </div>
                    <div className="word-container">
                      {selectedWords.map((word, index) => (
                        <button
                          key={`selected-${index}`}
                          className="word-button selected"
                          onClick={() => handleWordClick(word, false)}
                          disabled={answered}
                        >
                          {word}
                        </button>
                      ))}
                      {selectedWords.length === 0 && (
                        <div className="placeholder">ここに単語を並べてください</div>
                      )}
                    </div>
                  </div>

                  <div className="remaining-words-area">
                    <div className="area-label">使える単語 ({remainingWords.length}語)</div>
                    <div className="word-container">
                      {remainingWords.map((word, index) => (
                        <button
                          key={`remaining-${index}`}
                          className="word-button remaining"
                          onClick={() => handleWordClick(word, true)}
                          disabled={answered}
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="choices-area">
                  {/* 会話形式の問題 */}
                  {(currentQuestion as any).conversation ? (
                    <>
                      {/* 日本語の会話も分割表示 */}
                      {currentQuestion.japanese &&
                        currentQuestion.japanese.includes('A:') &&
                        currentQuestion.japanese.includes('B:') && (
                          <div className="japanese-conversation">
                            {currentQuestion.japanese.split(/([AB]:)/).map((part, idx) => {
                              if (part === 'A:' || part === 'B:') {
                                return (
                                  <span key={idx} className="conversation-speaker">
                                    {part}
                                  </span>
                                );
                              }
                              if (part.trim()) {
                                return (
                                  <span key={idx} className="conversation-text">
                                    {part.trim()}
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      <div className="conversation-display">
                        {(
                          (currentQuestion as any).conversation ||
                          (currentQuestion as any).dialogue?.map(
                            (d: { speaker: string; text: string }) => `${d.speaker}: ${d.text}`
                          ) ||
                          []
                        ).map((line: string, idx: number) => (
                          <div key={idx} className="conversation-line">
                            {line.split('____').map((part, index, array) => (
                              <span key={index}>
                                {part}
                                {index < array.length - 1 && (
                                  <span className="fill-in-blank-space">_______</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (currentQuestion as any).originalSentence ||
                    (currentQuestion as any).targetSentence ? (
                    /* 言い換え問題 (paraphrase) */
                    <div className="paraphrase-display">
                      <div className="paraphrase-label">📝 元の文:</div>
                      <div className="sentence-display original">
                        {(currentQuestion as any).originalSentence || currentQuestion.sentence}
                      </div>
                      <div className="paraphrase-arrow">↓ 言い換え</div>
                      <div className="paraphrase-label">✏️ 書き換え後:</div>
                      <div className="sentence-display target">
                        {(
                          (currentQuestion as any).question ||
                          (currentQuestion as any).targetSentence
                        )
                          ?.split('____')
                          .map((part: string, index: number, array: string[]) => (
                            <span key={index}>
                              {part}
                              {index < array.length - 1 && (
                                <span className="fill-in-blank-space">_______</span>
                              )}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : (
                    /* 通常の1文問題 */
                    <div className="sentence-display">
                      {currentQuestion.sentence?.split('____').map((part, index, array) => (
                        <span key={index}>
                          {part}
                          {index < array.length - 1 && (
                            <span className="fill-in-blank-space">_______</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 選択肢がある場合 */}
                  {currentQuestion.choices && currentQuestion.choices.length > 0 ? (
                    <div className="choices-grid">
                      {/* 3択 + 分からない */}
                      {currentQuestion.choices.map((choice: string, index: number) => {
                        const isSelected = selectedAnswer === choice;
                        const isCorrectChoice = choice === currentQuestion.correctAnswer;
                        const showCorrect = answered && isCorrectChoice;
                        const showIncorrect = answered && isSelected && !isCorrectChoice;

                        return (
                          <button
                            key={index}
                            className={`choice-button ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showIncorrect ? 'incorrect' : ''}`}
                            onClick={() => handleAnswerSelect(choice)}
                            disabled={answered}
                          >
                            {choice}
                            {showCorrect && ' ✓'}
                            {showIncorrect && ' ✗'}
                          </button>
                        );
                      })}
                      {/* 「分からない」ボタン */}
                      <button
                        className={`choice-button dont-know ${selectedAnswer === '分からない' ? 'selected' : ''} ${answered && selectedAnswer === '分からない' ? 'incorrect' : ''}`}
                        onClick={() => handleAnswerSelect('分からない')}
                        disabled={answered}
                      >
                        分からない
                        {answered && selectedAnswer === '分からない' && ' ✗'}
                      </button>
                    </div>
                  ) : (
                    /* 選択肢がない場合：テキスト入力式 */
                    <div className="text-input-container">
                      <input
                        type="text"
                        className="text-answer-input"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && textInput.trim()) {
                            handleAnswerSelect(textInput.trim());
                          }
                        }}
                        placeholder="答えを入力してください..."
                        disabled={answered}
                        autoFocus
                      />
                      <button
                        className="submit-answer-button"
                        onClick={() => handleAnswerSelect(textInput.trim())}
                        disabled={answered || !textInput.trim()}
                      >
                        回答する
                      </button>
                      <button
                        className={`choice-button dont-know ${selectedAnswer === '分からない' ? 'selected' : ''}`}
                        onClick={() => handleAnswerSelect('分からない')}
                        disabled={answered}
                      >
                        分からない
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 結果表示 */}
              {answered && (
                <>
                  {isSentenceOrdering ? (
                    <>
                      <div className={`result-box ${isCorrect() ? 'correct' : 'incorrect'}`}>
                        <div className="result-header">
                          {isCorrect() ? '✅ 正解！' : '❌ 不正解'}
                        </div>
                        <div className="result-content">
                          <div className="answer-comparison">
                            <div className="user-answer">
                              <strong>あなたの回答:</strong>
                              <br />
                              {selectedWords.join(' ')}
                            </div>
                            {!isCorrect() && (
                              <div className="correct-answer">
                                <strong>正解:</strong>
                                <br />
                                {(currentQuestion as any).correctAnswer ||
                                  (currentQuestion as any).correctOrder ||
                                  currentQuestion.sentence ||
                                  ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {currentQuestion.explanation && (
                        <div className="explanation-box">
                          <div className="explanation">
                            <strong>解説:</strong>
                            <br />
                            {currentQuestion.explanation}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {currentQuestion.explanation && (
                        <div className="explanation-box">
                          <div className="explanation">
                            <strong>解説:</strong>
                            <br />
                            {currentQuestion.explanation}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* デバッグパネル */}
      {showDebugPanel && (
        <RequeuingDebugPanel
          mode="grammar"
          currentIndex={currentQuestionIndex}
          totalQuestions={currentQuestions.length}
          questions={currentQuestions.map((q) => ({ word: q.id, difficulty: q.difficulty }))}
          requeuedWords={getRequeuedWords(currentQuestions, currentQuestionIndex)}
        />
      )}
    </div>
  );
}

export default GrammarQuizView;
