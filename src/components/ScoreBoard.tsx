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
} from '../progressStorage';
import { useState, useEffect, useMemo, useRef } from 'react';
import { AIPersonality } from '../types';
import { generateTimeBasedGreeting } from '../timeBasedGreeting';
import { getTimeBasedTeacherChat, getSpecialDayChat } from '../teacherInteractions';
import { getBreatherTrivia } from '../englishTrivia';

interface ScoreBoardProps {
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar' | 'memorization'; // クイズモードを追加
  currentScore?: number; // 現在のスコア
  totalAnswered?: number; // 現在の回答数
  sessionCorrect?: number; // セッション内の正解数
  sessionIncorrect?: number; // セッション内の不正解数
  sessionReview?: number; // セッション内の要復習数
  sessionMastered?: number; // セッション内の定着数
  onReviewFocus?: () => void; // 要復習タップ時のコールバック
  isReviewFocusMode?: boolean; // 補修モード中かどうか
  onShowSettings?: () => void; // 学習設定を開くコールバック
  currentWord?: string; // 現在表示中の単語
  onAnswerTime?: number; // 回答時刻(更新トリガー用)
  // 学習設定情報
  dataSource?: string; // 問題集
  category?: string; // 関連分野
  difficulty?: string; // 難易度
  wordPhraseFilter?: string; // 単語・熟語フィルター
  // 文法モード用の設定
  grammarUnit?: string; // 現在出題中の文法単元（例: "g1-unit0"）
}

function ScoreBoard({
  mode = 'translation', // デフォルトは和訳モード
  currentScore = 0,
  totalAnswered = 0,
  sessionCorrect = 0,
  sessionIncorrect = 0,
  sessionReview = 0,
  isReviewFocusMode = false,
  onReviewFocus,
  onShowSettings,
  currentWord,
  onAnswerTime,
  dataSource = '',
  category = '',
  difficulty = '',
  wordPhraseFilter = '',
  grammarUnit,
}: ScoreBoardProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'plan' | 'breakdown' | 'history' | 'settings'>(
    'ai'
  );

  // AIコメント用のstate
  const [aiComment, setAiComment] = useState<string>('');

  useEffect(() => {
    // AIコメントを生成
    const generateComment = () => {
      // 現在のAI人格を取得
      const personality = (localStorage.getItem('aiPersonality') ||
        'kind-teacher') as AIPersonality;

      // 3%の確率で英語豆知識を表示（AI人格に応じたメッセージ）
      if (Math.random() < 0.03) {
        return getBreatherTrivia(personality);
      }

      // 特別な日の会話をチェック
      const specialChat = getSpecialDayChat();
      if (specialChat) {
        return specialChat;
      }

      // 時間帯別の教師の会話をチェック
      const teacherChat = getTimeBasedTeacherChat();
      if (teacherChat) {
        return teacherChat;
      }

      // 挨拶メッセージを生成
      return generateTimeBasedGreeting(personality) || 'こんにちは！一緒に学習しましょう。';
    };

    setAiComment(generateComment());
  }, []);

  // Progress bar refs
  const masteredRef = useRef<HTMLDivElement>(null);
  const learningRef = useRef<HTMLDivElement>(null);
  const strugglingRef = useRef<HTMLDivElement>(null);

  // 学習プラン設定
  const [learningLimit, setLearningLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem(`learning-limit-${mode}`);
    return saved ? parseInt(saved) : null;
  });

  const [reviewLimit, setReviewLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem(`review-limit-${mode}`);
    return saved ? parseInt(saved) : null;
  });

  const [showPlanSettings, setShowPlanSettings] = useState(false);

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
      // 暗記モードは専用の統計関数を使用
      setDetailedStatsData(getMemorizationDetailedRetentionStats());
      // retentionRateは詳細統計から取得
      const stats = getMemorizationDetailedRetentionStats();
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
    [mode]
  );

  // 累計回答数を取得（メモ化 - modeで更新）
  const _totalAnsweredCount = useMemo(() => getTotalAnsweredCount(mode), [mode]);

  // 定着数を取得（全体から）（メモ化）
  const _masteredCount = useMemo(() => getTotalMasteredWordsCount(), []);

  // 定着率をstateから取得
  const { retentionRate: _retentionRate } = retentionData;

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
      {/* タブナビゲーション: Tailwind レスポンシブで自動最適化 */}
      <div className="score-board-tabs grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">
        <button
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'ai'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('ai')}
          title="AIコメント"
        >
          <span className="hidden sm:inline">🤖 AI</span>
          <span className="sm:hidden">🤖</span>
        </button>
        <button
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'plan'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('plan')}
          title="プラン"
        >
          <span className="hidden sm:inline">📋 プラン</span>
          <span className="sm:hidden">📋</span>
        </button>
        <button
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'breakdown'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('breakdown')}
          title="学習状況"
        >
          <span className="hidden sm:inline">📈 学習状況</span>
          <span className="sm:hidden">📈</span>
        </button>
        <button
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
            activeTab === 'history'
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('history')}
          title="履歴"
        >
          <span className="hidden sm:inline">📜 履歴</span>
          <span className="sm:hidden">📜</span>
        </button>
        <button
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
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
          title="学習設定"
        >
          <span className="hidden sm:inline">⚙️ 学習設定</span>
          <span className="sm:hidden">⚙️</span>
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
                    {aiComment
                      .replace(/^[😃👹😼🤖🧙]「|」$/gu, '')
                      .replace(/^[😃👹😼🤖🧙]|」$/gu, '')}
                  </div>
                </div>
              </div>
            </div>

            {/* 学習統計カード（暗記タブ専用） */}
            {mode === 'memorization' && totalAnswered > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-4 text-sm sm:text-base text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🟢</span>
                    <span>覚えてる {sessionCorrect}語</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🟡</span>
                    <span>まだまだ {sessionReview}語</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔴</span>
                    <span>分からない {sessionIncorrect}語</span>
                  </div>
                </div>
              </div>
            )}
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
            {showPlanSettings && (mode === 'translation' || mode === 'spelling') && (
              <div className="plan-settings-modal">
                <div className="plan-settings-content">
                  <h4>🎯 出題繰り返し設定</h4>
                  <p className="plan-settings-description">未入力はどこまでも出題します</p>
                  <div className="plan-setting-item">
                    <label>学習中の語数上限:</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="未入力=無制限"
                      value={learningLimit || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        setLearningLimit(value);
                        if (value === null) {
                          localStorage.removeItem(`learning-limit-${mode}`);
                        } else {
                          localStorage.setItem(`learning-limit-${mode}`, value.toString());
                        }
                      }}
                    />
                    <p className="setting-help">この数に達したら繰り返し復習モードに入ります</p>
                  </div>
                  <div className="plan-setting-item">
                    <label>要復習の語数上限:</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="未入力=無制限"
                      value={reviewLimit || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        setReviewLimit(value);
                        if (value === null) {
                          localStorage.removeItem(`review-limit-${mode}`);
                        } else {
                          localStorage.setItem(`review-limit-${mode}`, value.toString());
                        }
                      }}
                    />
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
                <div className="retention-title">📊 学習状況の内訳</div>
                {detailedStats.appearedWords > 0 ? (
                  <div className="retention-subtitle">
                    {mode === 'memorization' ? (
                      <>
                        {detailedStats.appearedWords}語確認： 🟢覚えてる{' '}
                        {detailedStats.masteredCount}語 🟡まだまだ {detailedStats.learningCount}語
                        🔴分からない {detailedStats.strugglingCount}語
                      </>
                    ) : mode === 'grammar' ? (
                      <>
                        {detailedStats.appearedWords}問出題： 🟢定着 {detailedStats.masteredCount}問
                        🟡学習中 {detailedStats.learningCount}問 🔴要復習{' '}
                        {detailedStats.strugglingCount}問
                      </>
                    ) : (
                      <>
                        {detailedStats.appearedWords}問出題： 🟢定着 {detailedStats.masteredCount}語
                        🟡学習中 {detailedStats.learningCount}語 🔴要復習{' '}
                        {detailedStats.strugglingCount}語
                        {(mode === 'translation' || mode === 'spelling') && onReviewFocus && (
                          <span
                            className={`review-mode-icon ${isReviewFocusMode ? 'active' : ''}`}
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
                        {detailedStats.learningPercentage > 0 && (
                          <div
                            ref={learningRef}
                            className="retention-segment retention-learning"
                            data-width={Math.round(detailedStats.learningPercentage)}
                            title={`🟡 まだまだ: ${detailedStats.learningCount}語 (${Math.round(detailedStats.learningPercentage)}%)`}
                          >
                            {detailedStats.learningPercentage >= 10 && (
                              <span>{Math.round(detailedStats.learningPercentage)}%</span>
                            )}
                          </div>
                        )}
                        {detailedStats.strugglingPercentage > 0 && (
                          <div
                            ref={strugglingRef}
                            className="retention-segment retention-struggling"
                            data-width={Math.round(detailedStats.strugglingPercentage)}
                            title={`🔴 分からない: ${detailedStats.strugglingCount}語 (${Math.round(detailedStats.strugglingPercentage)}%)`}
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
                            className="retention-segment retention-learning"
                            data-width={Math.round(detailedStats.learningPercentage)}
                            title={`🟡 学習中: ${detailedStats.learningCount}語 (${Math.round(detailedStats.learningPercentage)}%)`}
                          >
                            {detailedStats.learningPercentage >= 10 && (
                              <span>{Math.round(detailedStats.learningPercentage)}%</span>
                            )}
                          </div>
                        )}
                        {detailedStats.strugglingPercentage > 0 && (
                          <div
                            ref={strugglingRef}
                            className="retention-segment retention-struggling"
                            data-width={Math.round(detailedStats.strugglingPercentage)}
                            title={`🔴 要復習: ${detailedStats.strugglingCount}語 (${Math.round(detailedStats.strugglingPercentage)}%)`}
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
                        const totalAttempts = stat.correctCount + stat.incorrectCount;
                        const retentionRate =
                          stat.answeredQuestions > 0
                            ? Math.round((stat.masteredCount / stat.answeredQuestions) * 100)
                            : 0;

                        // 履歴アイコン生成（最近の10回分）
                        const historyIcons = Array(Math.min(totalAttempts, 10)).fill('🟩').join('');

                        // ステータス判定
                        let statusIcon = '🟢';
                        let statusLabel = '定着済';
                        if (stat.masteredCount === 0 && stat.answeredQuestions > 0) {
                          statusIcon = '🔴';
                          statusLabel = '要復習';
                        } else if (retentionRate < 80 && stat.answeredQuestions > 0) {
                          statusIcon = '🟡';
                          statusLabel = '学習中';
                        }

                        // unit表示を「中1_Unit0_〜」から「1年_Unit0_〜」に変換
                        const gradeMatch = stat.unit.match(/中(\d+)/);
                        const gradeDisplay = gradeMatch ? `${gradeMatch[1]}年` : stat.unit;
                        const unitMatch = stat.unit.match(/Unit(\d+)/);
                        const unitDisplay = unitMatch ? `Unit${unitMatch[1]}` : '';
                        const planDisplay = unitDisplay
                          ? `${gradeDisplay}_${unitDisplay}_${stat.title}`
                          : `${gradeDisplay}_${stat.title}`;

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
                  </div>
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
