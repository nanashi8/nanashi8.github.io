import { 
  getTodayStats, 
  getTotalAnsweredCount, 
  getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount,
  getRetentionRateWithAI,
  getDetailedRetentionStats,
  getDailyPlanInfo,
  getWordDetailedData
} from '../progressStorage';
import { useState, useEffect, useMemo } from 'react';

interface ScoreBoardProps {
  mode?: 'translation' | 'spelling' | 'reading' | 'grammar'; // クイズモードを追加
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
  onAnswerTime?: number; // 回答時刻（更新トリガー用）
}

function ScoreBoard({ 
  mode = 'translation', // デフォルトは和訳モード
  currentScore = 0,
  totalAnswered = 0,
  sessionCorrect = 0,
  sessionIncorrect = 0,
  sessionReview = 0,
  sessionMastered = 0,
  onReviewFocus,
  isReviewFocusMode = false,
  onShowSettings,
  currentWord,
  onAnswerTime
}: ScoreBoardProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'breakdown' | 'history' | 'settings'>('plan');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
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
    const { retentionRate, appearedCount } = getRetentionRateWithAI();
    return { retentionRate, appearedCount };
  });
  
  const [detailedStatsData, setDetailedStatsData] = useState(() => getDetailedRetentionStats());

  // 定着率と詳細統計を更新（回答時のみ - onAnswerTimeが変化した時）
  useEffect(() => {
    if (!onAnswerTime) return; // 初回マウント時はスキップ
    
    const { retentionRate, appearedCount } = getRetentionRateWithAI();
    setRetentionData({ retentionRate, appearedCount });
    setDetailedStatsData(getDetailedRetentionStats());
  }, [onAnswerTime]); // 回答時のみ更新

  // 本日の統計を取得（メモ化 - onAnswerTimeで更新）
  const { todayAccuracy, todayTotalAnswered } = useMemo(() => getTodayStats(mode), [mode, onAnswerTime]);

  // 累計回答数を取得（メモ化 - onAnswerTimeで更新）
  const totalAnsweredCount = useMemo(() => getTotalAnsweredCount(mode), [mode, onAnswerTime]);

  // 定着数を取得（全体から）（メモ化 - onAnswerTimeで更新）
  const masteredCount = useMemo(() => getTotalMasteredWordsCount(), [onAnswerTime]);

  // 出題数を取得（重複除外、全4700問のうち実際に出題された数）（メモ化 - onAnswerTimeで更新）
  const uniqueQuestionedCount = useMemo(() => getUniqueQuestionedWordsCount(), [onAnswerTime]);

  // 定着率をstateから取得
  const { retentionRate, appearedCount } = retentionData;
  
  // 詳細な定着率統計をstateから取得
  const detailedStats = detailedStatsData;

  // 学習プラン情報を取得（メモ化 - onAnswerTimeで更新）
  const planInfo = useMemo(() => getDailyPlanInfo(mode), [mode, onAnswerTime]);

  // 現在のセッションの正答率を計算（メモ化）
  const currentAccuracy = useMemo(
    () => totalAnswered > 0 ? Math.round((currentScore / totalAnswered) * 100) : 0,
    [currentScore, totalAnswered]
  );

  // タブの配列（学習プラン、学習状況、履歴、設定）
  const tabs: Array<'plan' | 'breakdown' | 'history' | 'settings'> = 
    mode === 'translation' || mode === 'spelling' 
      ? ['plan', 'breakdown', 'history', 'settings'] 
      : ['plan', 'breakdown', 'settings'];

  return (
    <div className="score-board-compact">
      {/* タブナビゲーション: デスクトップ版（全タブ表示） */}
      {!isMobile && (
        <div className="score-board-tabs">
          <button 
            className={`score-tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            📋 プラン
          </button>
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'breakdown' ? 'active' : ''}`}
              onClick={() => setActiveTab('breakdown')}
            >
              📈 学習状況
            </button>
          )}
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📜 履歴
            </button>
          )}
          <button 
            className={`score-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              if (onShowSettings) {
                onShowSettings();
              }
            }}
          >
            ⚙️ 設定
          </button>
        </div>
      )}

      {/* タブナビゲーション: モバイル版（アイコン+テキスト） */}
      {isMobile && (
        <div className="score-board-tabs score-board-tabs-mobile">
          <button 
            className={`score-tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
            title="プラン"
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">プラン</span>
          </button>
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'breakdown' ? 'active' : ''}`}
              onClick={() => setActiveTab('breakdown')}
              title="学習状況"
            >
              <span className="tab-icon">📈</span>
              <span className="tab-label">学習</span>
            </button>
          )}
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              title="履歴"
            >
              <span className="tab-icon">📜</span>
              <span className="tab-label">履歴</span>
            </button>
          )}
          <button 
            className={`score-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              if (onShowSettings) {
                onShowSettings();
              }
            }}
            title="学習設定"
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-label">設定</span>
          </button>
        </div>
      )}

      {/* 補修モードインジケーター */}
      {isReviewFocusMode && (
        <div className="review-focus-indicator">
          🎯 <strong>補修モード</strong> - 要復習問題を繰り返し出題中
        </div>
      )}
      
      {/* 学習プランタブ */}
      {activeTab === 'plan' && (
        <div className="score-board-content">
          <div className="plan-tab-compact">
            {/* 和訳・スペルタブのみプラン詳細を表示 */}
            {(mode === 'translation' || mode === 'spelling') ? (
              <>
                <div className="plan-text-line">
                  <span className="stat-text-label">🟢 定着済:</span>
                  <strong className="stat-text-value mastered">{detailedStats.masteredCount}語</strong>
                  <span className="stat-text-divider">｜</span>
                  <span className="stat-text-label">🟡 学習中:</span>
                  <strong className="stat-text-value learning">{detailedStats.learningCount}語</strong>
                  <span className="stat-text-divider">｜</span>
                  <span className="stat-text-label">🔴 要復習:</span>
                  <strong className="stat-text-value review">{detailedStats.strugglingCount}語</strong>
                </div>
                <div className="plan-text-line plan-text-line-secondary">
                  <span 
                    className="plan-setting-clickable"
                    onClick={() => setShowPlanSettings(!showPlanSettings)}
                    title="クリックして設定"
                  >
                    🎯 学習中上限: <strong>{learningLimit === null ? '無制限' : `${learningLimit}語まで`}</strong>
                  </span>
                  <span>｜</span>
                  <span 
                    className="plan-setting-clickable"
                    onClick={() => setShowPlanSettings(!showPlanSettings)}
                    title="クリックして設定"
                  >
                    ⚠️ 要復習上限: <strong>{reviewLimit === null ? '無制限' : `${reviewLimit}語まで`}</strong>
                  </span>
                </div>
              </>
            ) : (
              /* 文法・長文タブは簡易表示 */
              <div className="plan-text-line">
                {totalAnswered > 0 && (
                  <>
                    <span className="stat-text-label">現在:</span>
                    <strong className="stat-text-value correct">{currentScore}/{totalAnswered}</strong>
                    <span className="stat-text-sub">({currentAccuracy}%)</span>
                    <span className="stat-text-divider">｜</span>
                  </>
                )}
                <span className="stat-text-label">正解:</span>
                <strong className="stat-text-value correct">{sessionCorrect}問</strong>
                <span className="stat-text-divider">｜</span>
                <span className="stat-text-label">不正解:</span>
                <strong className="stat-text-value incorrect">{sessionIncorrect}問</strong>
                <span className="stat-text-divider">｜</span>
                <span className="stat-text-label">定着:</span>
                <strong className="stat-text-value mastered">{sessionMastered}問</strong>
              </div>
            )}
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
      
      {/* 学習状況タブ（詳細な定着率の内訳） - 和訳・スペルのみ */}
      {activeTab === 'breakdown' && (mode === 'translation' || mode === 'spelling') && (
        <div className="score-board-content">
          <div className="retention-breakdown-container">
            <div className="retention-breakdown-header">
              <div className="retention-title">📊 学習状況の内訳</div>
              {detailedStats.appearedWords > 0 ? (
                <div className="retention-subtitle">
                  {detailedStats.appearedWords}問出題：
                  🟢定着 {detailedStats.masteredCount}語 
                  🟡学習中 {detailedStats.learningCount}語 
                  🔴要復習 {detailedStats.strugglingCount}語
                </div>
              ) : (
                <div className="retention-subtitle">
                  まだ問題に取り組んでいません
                </div>
              )}
            </div>
            {detailedStats.appearedWords > 0 && (
              <>
                <div className="retention-breakdown-stats">
              <div className="stat-row">
                <span className="stat-label">本日正答率:</span>
                <strong className="stat-value">{todayAccuracy}%</strong>
                <span className="stat-detail">({todayTotalAnswered}問)</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">本日定着率:</span>
                <strong className="stat-value">{retentionRate}%</strong>
                <span className="stat-detail">({masteredCount}語定着)</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">累計出題語句数:</span>
                <strong className="stat-value">{totalAnsweredCount}問</strong>
              </div>
            </div>
            <div className="retention-progress-bar">
              {detailedStats.masteredPercentage > 0 && (
                <div 
                  className="retention-segment retention-mastered"
                  data-percentage={Math.round(detailedStats.masteredPercentage)}
                  title={`🟢 定着: ${detailedStats.masteredCount}語 (${Math.round(detailedStats.masteredPercentage)}%)`}
                >
                  {detailedStats.masteredPercentage >= 10 && (
                    <span>{Math.round(detailedStats.masteredPercentage)}%</span>
                  )}
                </div>
              )}
              {detailedStats.learningPercentage > 0 && (
                <div 
                  className="retention-segment retention-learning"
                  data-percentage={Math.round(detailedStats.learningPercentage)}
                  title={`🟡 学習中: ${detailedStats.learningCount}語 (${Math.round(detailedStats.learningPercentage)}%)`}
                >
                  {detailedStats.learningPercentage >= 10 && (
                    <span>{Math.round(detailedStats.learningPercentage)}%</span>
                  )}
                </div>
              )}
              {detailedStats.strugglingPercentage > 0 && (
                <div 
                  className="retention-segment retention-struggling"
                  data-percentage={Math.round(detailedStats.strugglingPercentage)}
                  title={`🔴 要復習: ${detailedStats.strugglingCount}語 (${Math.round(detailedStats.strugglingPercentage)}%)`}
                >
                  {detailedStats.strugglingPercentage >= 10 && (
                    <span>{Math.round(detailedStats.strugglingPercentage)}%</span>
                  )}
                </div>
              )}
            </div>
            </>
            )}
          </div>
        </div>
      )}
      
      {/* 履歴タブ */}
      {activeTab === 'history' && (mode === 'translation' || mode === 'spelling') && (
        <div className="score-board-content">
          <div className="history-compact">
            {currentWord ? (
              (() => {
                const wordData = getWordDetailedData(currentWord);
                if (!wordData) {
                  return (
                    <div className="word-detail-empty">
                      <p>この単語のデータがまだありません</p>
                    </div>
                  );
                }
                return (
                  <div className="word-detail-container">
                    <div className="word-detail-title">📊 {currentWord} の学習データ</div>
                    <div className="word-detail-stats">
                      <div className="word-stat-item">
                        <span className="word-stat-label">正解回数:</span>
                        <strong className="word-stat-value">{wordData.correctCount}回正解 / {wordData.totalCount}回出題</strong>
                      </div>
                      {wordData.accuracyHistory && (
                        <div className="word-stat-item">
                          <span className="word-stat-label">正誤履歴:</span>
                          <span className="word-history-icons">{wordData.accuracyHistory}</span>
                        </div>
                      )}
                      <div className="word-stat-item">
                        <span className="word-stat-label">定着率（試験中）:</span>
                        <strong className="word-stat-value word-retention-rate">{wordData.retentionRate}%</strong>
                      </div>
                      <div className="word-stat-description">
                        💡 定着率100%は何回出題しても間違わない状態。0%は全く正解できない状態。70%なら10問中7問正解できる予測です。
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="word-detail-empty">
                <p>問題を開始すると、現在の単語のデータが表示されます</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default ScoreBoard;
