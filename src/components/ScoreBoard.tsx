import { 
  getTodayStats, 
  getTotalAnsweredCount, 
  getUniqueQuestionedWordsCount as _getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount,
  getRetentionRateWithAI,
  getDetailedRetentionStats,
  getGrammarRetentionRateWithAI,
  getGrammarDetailedRetentionStats,
  getGrammarUnitStatsWithTitles,
  getDailyPlanInfo as _getDailyPlanInfo,
  getWordDetailedData
} from '../progressStorage';
import { useState, useEffect, useMemo, useRef } from 'react';

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
  isReviewFocusMode = false,
  onReviewFocus,
  onShowSettings,
  currentWord,
  onAnswerTime,
  dataSource = '',
  category = '',
  difficulty = '',
  wordPhraseFilter = '',
  grammarUnit
}: ScoreBoardProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'breakdown' | 'history' | 'settings'>('plan');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
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

  // ウィンドウサイズ変更を監視
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  
  const [detailedStatsData, setDetailedStatsData] = useState(() => 
    mode === 'grammar' ? getGrammarDetailedRetentionStats() : getDetailedRetentionStats()
  );
  
  // 履歴タブ用の単語データ
  const [currentWordData, setCurrentWordData] = useState<ReturnType<typeof getWordDetailedData>>(null);
  
  // 文法モード用の単元別統計（タイトル付き）
  const [grammarUnitStats, setGrammarUnitStats] = useState<Awaited<ReturnType<typeof getGrammarUnitStatsWithTitles>>>([]);

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
            const filtered = stats.filter(stat => stat.unit === targetUnit);
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

  // Update progress bar widths using CSS variables
  useEffect(() => {
    if (masteredRef.current) {
      masteredRef.current.style.setProperty('--segment-width', String(Math.round(detailedStatsData.masteredPercentage)));
    }
    if (learningRef.current) {
      // 暗記タブでは learning + struggling の合算値を設定
      const learningWidth = mode === 'memorization' 
        ? Math.round(detailedStatsData.learningPercentage + detailedStatsData.strugglingPercentage)
        : Math.round(detailedStatsData.learningPercentage);
      learningRef.current.style.setProperty('--segment-width', String(learningWidth));
    }
    if (strugglingRef.current) {
      strugglingRef.current.style.setProperty('--segment-width', String(Math.round(detailedStatsData.strugglingPercentage)));
    }
  }, [detailedStatsData, activeTab, mode]); // modeも依存に追加

  // 本日の統計を取得（メモ化 - modeで更新）
  const { todayAccuracy: _todayAccuracy, todayTotalAnswered: _todayTotalAnswered } = useMemo(() => getTodayStats(mode), [mode]);

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
    () => totalAnswered > 0 ? Math.round((currentScore / totalAnswered) * 100) : 0,
    [currentScore, totalAnswered]
  );

  // タブの配列（学習プラン、学習状況、履歴、設定）- 全モード共通
  const _tabs: Array<'plan' | 'breakdown' | 'history' | 'settings'> = ['plan', 'breakdown', 'history', 'settings'];

  return (
    <div className="score-board-compact">
      {/* タブナビゲーション: デスクトップ版（全タブ表示） */}
      {!isMobile && (
        <div className="score-board-tabs grid grid-cols-4 gap-2">
          <button 
            className={`px-4 py-2 font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
              activeTab === 'plan' 
                ? 'bg-primary text-white border-primary dark:bg-primary dark:text-white dark:border-primary' 
                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('plan')}
          >
            📋 プラン
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
              activeTab === 'breakdown' 
                ? 'bg-primary text-white border-primary dark:bg-primary dark:text-white dark:border-primary' 
                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('breakdown')}
          >
            📈 学習状況
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
              activeTab === 'history' 
                ? 'bg-primary text-white border-primary dark:bg-primary dark:text-white dark:border-primary' 
                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            📜 履歴
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
              activeTab === 'settings' 
                ? 'bg-primary text-white border-primary dark:bg-primary dark:text-white dark:border-primary' 
                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => {
              if (onShowSettings) {
                onShowSettings();
              } else {
                setActiveTab('settings');
              }
            }}
          >
            ⚙️ 学習設定
          </button>
        </div>
      )}

      {/* タブナビゲーション: モバイル版（アイコンのみコンパクト表示） */}
      {isMobile && (
        <div className={`score-board-tabs score-board-tabs-mobile ${(mode === 'translation' || mode === 'spelling') ? 'grid grid-cols-4 gap-1' : 'grid grid-cols-3 gap-1'}`}>
          <button 
            className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-all duration-200 rounded-lg ${
              activeTab === 'plan' 
                ? 'bg-primary text-white dark:bg-primary dark:text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('plan')}
            title="プラン"
          >
            <span className="text-base">📋</span>
            <span className="leading-tight">プラン</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-all duration-200 rounded-lg ${
              activeTab === 'breakdown' 
                ? 'bg-primary text-white dark:bg-primary dark:text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('breakdown')}
            title="学習状況"
          >
            <span className="text-base">📈</span>
            <span className="leading-tight">学習状況</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-all duration-200 rounded-lg ${
              activeTab === 'history' 
                ? 'bg-primary text-white dark:bg-primary dark:text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
            title="履歴"
          >
            <span className="text-base">📜</span>
            <span className="leading-tight">履歴</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-all duration-200 rounded-lg ${
              activeTab === 'settings' 
                ? 'bg-primary text-white dark:bg-primary dark:text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
            <span className="text-base">⚙️</span>
            <span className="leading-tight">学習設定</span>
          </button>
        </div>
      )}

      {/* 学習プランタブ */}
      {activeTab === 'plan' && (
        <div className="score-board-content">
          <div className="plan-tab-compact">
            {/* 全モード共通のプラン詳細表示 */}
            <div className="plan-text-line">
              <span className="stat-text-label">📚 {dataSource || '全問題集'}</span>
              <span className="stat-text-divider">｜</span>
              <span className="stat-text-label">{category || '全分野'}</span>
              <span className="stat-text-divider">｜</span>
              <span className="stat-text-label">{difficulty === 'all' ? '全難易度' : difficulty === 'basic' ? '基礎' : difficulty === 'standard' ? '標準' : difficulty === 'advanced' ? '発展' : difficulty}</span>
              {wordPhraseFilter && (
                <>
                  <span className="stat-text-divider">｜</span>
                  <span className="stat-text-label">{wordPhraseFilter === 'all' ? '単語・熟語' : wordPhraseFilter === 'word' ? '単語のみ' : wordPhraseFilter === 'phrase' ? '熟語のみ' : '単語・熟語'}</span>
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
          <div className="retention-breakdown-container">
            <div className="retention-breakdown-header">
              <div className="retention-title">📊 学習状況の内訳</div>
              {detailedStats.appearedWords > 0 ? (
                <div className="retention-subtitle">
                  {mode === 'memorization' ? (
                    <>
                      {detailedStats.appearedWords}語確認：
                      🟢覚えた {detailedStats.masteredCount}語 
                      🟡覚えていない {detailedStats.learningCount + detailedStats.strugglingCount}語
                    </>
                  ) : mode === 'grammar' ? (
                    <>
                      {detailedStats.appearedWords}問出題：
                      🟢定着 {detailedStats.masteredCount}問 
                      🟡学習中 {detailedStats.learningCount}問 
                      🔴要復習 {detailedStats.strugglingCount}問
                    </>
                  ) : (
                    <>
                      {detailedStats.appearedWords}問出題：
                      🟢定着 {detailedStats.masteredCount}語 
                      🟡学習中 {detailedStats.learningCount}語 
                      🔴要復習 {detailedStats.strugglingCount}語
                      {(mode === 'translation' || mode === 'spelling') && onReviewFocus && (
                        <span 
                          className={`review-mode-icon ${isReviewFocusMode ? 'active' : ''}`}
                          onClick={onReviewFocus}
                          title={isReviewFocusMode ? "復習モード解除" : "復習モード開始"}
                        >
                          🔥
                        </span>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="retention-subtitle">
                  {mode === 'memorization' ? 'まだ語句を確認していません' : 'まだ問題に取り組んでいません'}
                </div>
              )}
            </div>
            {detailedStats.appearedWords > 0 && (
              <>
            <div className="retention-progress-bar">
              {mode === 'memorization' ? (
                <>
                  {/* 暗記タブ用: 覚えた/覚えていない（2種類のみ） */}
                  {detailedStats.masteredPercentage > 0 && (
                    <div 
                      ref={masteredRef}
                      className="retention-segment retention-mastered"
                      data-width={Math.round(detailedStats.masteredPercentage)}
                      title={`🟢 覚えた: ${detailedStats.masteredCount}語 (${Math.round(detailedStats.masteredPercentage)}%)`}
                    >
                      {detailedStats.masteredPercentage >= 10 && (
                        <span>{Math.round(detailedStats.masteredPercentage)}%</span>
                      )}
                    </div>
                  )}
                  {(detailedStats.learningPercentage + detailedStats.strugglingPercentage) > 0 && (
                    <div 
                      ref={learningRef}
                      className="retention-segment retention-learning"
                      data-width={Math.round(detailedStats.learningPercentage + detailedStats.strugglingPercentage)}
                      title={`🟡 覚えていない: ${detailedStats.learningCount + detailedStats.strugglingCount}語 (${Math.round(detailedStats.learningPercentage + detailedStats.strugglingPercentage)}%)`}
                    >
                      {(detailedStats.learningPercentage + detailedStats.strugglingPercentage) >= 10 && (
                        <span>{Math.round(detailedStats.learningPercentage + detailedStats.strugglingPercentage)}%</span>
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
      )}
      
      {/* 履歴タブ */}
      {activeTab === 'history' && (
        <div className="score-board-content">
          <div className="history-compact">
            {mode === 'grammar' ? (
              <div className="word-detail-container">
                {grammarUnitStats.length > 0 ? (
                  <div className="grammar-units-list">
                    {grammarUnitStats.map((stat) => {
                      const totalAttempts = stat.correctCount + stat.incorrectCount;
                      const retentionRate = stat.answeredQuestions > 0 ? Math.round((stat.masteredCount / stat.answeredQuestions) * 100) : 0;
                      
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
                      
                      return (
                        <div key={stat.unit} className="grammar-unit-card">
                          <div className="word-detail-title">
                            📊 {stat.unit}_{stat.title} の学習データ
                            <span className="word-status-badge">
                              {statusIcon} {statusLabel}
                            </span>
                          </div>
                          <div className="word-detail-stats">
                            <span className="word-stat-label">正解:</span>
                            <strong className="word-stat-value">{stat.correctCount}/{totalAttempts}回</strong>
                            <span className="word-stat-divider">｜</span>
                            {historyIcons && (
                              <>
                                <span className="word-stat-label">履歴:</span>
                                <span className="word-history-icons">{historyIcons}</span>
                                <span className="word-stat-divider">｜</span>
                              </>
                            )}
                            <span className="word-stat-label">定着率:</span>
                            <strong className="word-stat-value word-retention-rate">{retentionRate}%</strong>
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
                  <strong className="word-stat-value">{currentWordData.correctCount}/{currentWordData.totalCount}回</strong>
                  <span className="word-stat-divider">｜</span>
                  {currentWordData.accuracyHistory && currentWordData.accuracyHistory.length > 0 && (
                    <>
                      <span className="word-stat-label">履歴:</span>
                      <span className="word-history-icons">{currentWordData.accuracyHistory}</span>
                      <span className="word-stat-divider">｜</span>
                    </>
                  )}
                  <span className="word-stat-label">定着率:</span>
                  <strong className="word-stat-value word-retention-rate">{currentWordData.retentionRate}%</strong>
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
      )}
      
      {/* 設定タブ */}
      {activeTab === 'settings' && (
        <div className="score-board-content">
          <div className="settings-tab-container">
            <div className="word-detail-empty">
              <p>このタブの設定は学習設定パネルから行えます</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ScoreBoard;
