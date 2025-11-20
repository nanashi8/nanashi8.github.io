import { 
  getTodayStats, 
  getTotalAnsweredCount, 
  getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount,
  getRetentionRateWithAI,
  getDetailedRetentionStats,
  getNearMasteryStats,
  getSessionHistory,
  SessionHistoryItem,
  getDailyPlanInfo
} from '../progressStorage';
import { calculateGoalProgress, generateGoalMessage } from '../goalSimulator';
import { getAlertSummary } from '../forgettingAlert';
import { useState, useEffect } from 'react';

interface ScoreBoardProps {
  mode?: 'translation' | 'spelling' | 'reading'; // クイズモードを追加
  currentScore?: number; // 現在のスコア
  totalAnswered?: number; // 現在の回答数
  sessionCorrect?: number; // セッション内の正解数
  sessionIncorrect?: number; // セッション内の不正解数
  sessionReview?: number; // セッション内の要復習数
  sessionMastered?: number; // セッション内の定着数
  onReviewFocus?: () => void; // 要復習タップ時のコールバック
  isReviewFocusMode?: boolean; // 補修モード中かどうか
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
  isReviewFocusMode = false
}: ScoreBoardProps) {
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'stats' | 'goals' | 'history'>('stats');
  const [statSubTab, setStatSubTab] = useState<'accuracy' | 'retention' | 'total'>('accuracy');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const historyLimit = isMobile ? 10 : 20;
  
  // 学習プラン目標設定
  const [planTarget, setPlanTarget] = useState(() => {
    const saved = localStorage.getItem(`daily-plan-target-${mode}`);
    return saved ? parseInt(saved) : 20;
  });

  // ウィンドウサイズ変更を監視
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 履歴を取得（リアルタイム更新用）
  useEffect(() => {
    if (mode === 'translation' || mode === 'spelling') {
      const loadHistory = () => {
        const h = getSessionHistory(mode, historyLimit);
        setHistory(h);
      };
      
      loadHistory();
      
      // 1秒ごとに更新（新しい回答があった場合に反映）
      const interval = setInterval(loadHistory, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, historyLimit]);

  // 本日の統計を取得
  const { todayAccuracy, todayTotalAnswered } = getTodayStats(mode);

  // 累計回答数を取得
  const totalAnsweredCount = getTotalAnsweredCount(mode);

  // 定着数を取得（全体から）
  const masteredCount = getTotalMasteredWordsCount();

  // 出題数を取得（重複除外、全4700問のうち実際に出題された数）
  const uniqueQuestionedCount = getUniqueQuestionedWordsCount();

  // 定着率をAIで計算
  const { retentionRate, appearedCount } = getRetentionRateWithAI();
  
  // 詳細な定着率統計を取得（3段階分類）
  const detailedStats = getDetailedRetentionStats();

  // 定着予測統計を取得
  const nearMasteryStats = getNearMasteryStats();

  // 学習プラン情報を取得
  const planInfo = getDailyPlanInfo(mode);
  
  // 学習プラン目標変更ハンドラー
  const handlePlanTargetChange = (value: number) => {
    setPlanTarget(value);
    localStorage.setItem(`daily-plan-target-${mode}`, value.toString());
  };

  // 目標達成情報を取得
  const goalProgress = calculateGoalProgress();
  const goalMessage = generateGoalMessage(false);
  
  // 忘却アラートサマリーを取得
  const alertSummary = getAlertSummary();

  // 現在のセッションの正答率を計算
  const currentAccuracy = totalAnswered > 0 ? Math.round((currentScore / totalAnswered) * 100) : 0;

  // タブの配列（学習プラン、統計、目標、履歴）
  const tabs: Array<'plan' | 'stats' | 'goals' | 'history'> = 
    mode === 'translation' || mode === 'spelling' 
      ? ['plan', 'stats', 'goals', 'history'] 
      : ['plan', 'stats', 'goals'];

  // タブ切り替え関数
  const handlePrevTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    setActiveTab(tabs[prevIndex]);
  };

  const handleNextTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    setActiveTab(tabs[nextIndex]);
  };

  // タブ名の取得
  const getTabName = (tab: 'plan' | 'stats' | 'goals' | 'history') => {
    switch (tab) {
      case 'plan': return '📋 学習プラン';
      case 'stats': return '📊 基本統計';
      case 'goals': return '🎯 目標・進捗';
      case 'history': return '📜 履歴';
    }
  };

  return (
    <div className="score-board-compact">
      {/* タブナビゲーション: デスクトップ版（全タブ表示） */}
      {!isMobile && (
        <div className="score-board-tabs">
          <button 
            className={`score-tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            📋 学習プラン
          </button>
          <button 
            className={`score-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 基本統計
          </button>
          <button 
            className={`score-tab ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            🎯 目標・進捗
          </button>
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📜 履歴
            </button>
          )}
        </div>
      )}

      {/* タブナビゲーション: モバイル版（左右ボタンで切り替え） */}
      {isMobile && (
        <div className="score-board-tabs-mobile">
          <button 
            className="tab-nav-btn tab-nav-prev"
            onClick={handlePrevTab}
            title="前のタブ"
          >
            ◀
          </button>
          <div className="current-tab-name">
            {getTabName(activeTab)}
          </div>
          <button 
            className="tab-nav-btn tab-nav-next"
            onClick={handleNextTab}
            title="次のタブ"
          >
            ▶
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
          <div className="plan-tab-content">
            {/* プラン概要 */}
            <div className="plan-summary">
              <div className="plan-item">
                <span className="plan-label">要復習:</span>
                <span className="plan-count">{planInfo.reviewWordsCount}語</span>
              </div>
              <div className="plan-item">
                <span className="plan-label">確認予定:</span>
                <span className="plan-count">{planInfo.scheduledWordsCount}語</span>
              </div>
              <div className="plan-item">
                <span className="plan-label">本日の目標:</span>
                <span className="plan-count">{planTarget}語</span>
              </div>
            </div>

            {/* 進捗バー */}
            <div className="plan-progress-bar">
              <div 
                className="plan-progress-fill" 
                style={{ width: `${Math.min(100, (totalAnswered / planTarget) * 100)}%` }}
              />
            </div>

            {/* 推奨メッセージ */}
            <div className="plan-recommendation">
              {totalAnswered >= planTarget 
                ? `🎉 本日の目標達成！ お疲れ様でした` 
                : `💪 あと${planTarget - totalAnswered}語で目標達成`}
            </div>

            {/* 目標調整スライダー */}
            <div className="plan-target-adjust">
              <label>日次目標: {planTarget}語</label>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="5" 
                value={planTarget}
                onChange={(e) => handlePlanTargetChange(parseInt(e.target.value))}
                className="plan-slider"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 基本統計タブ */}
      {activeTab === 'stats' && (
        <div className="score-board-content">
          {/* デスクトップ版: 横並びレイアウト */}
          {!isMobile && (
            <div className="stats-grid-container">
              {/* 現在のスコア（セッション中のみ） */}
              {totalAnswered > 0 && (
                <div className="stat-card stat-current">
                  <div className="stat-label">現在</div>
                  <div className="stat-value">
                    <strong className="correct">{currentScore}/{totalAnswered}</strong>
                  </div>
                  <div className="stat-sub">({currentAccuracy}%)</div>
                </div>
              )}
              
              {/* 本日の正答率 */}
              <div className="stat-card stat-accuracy">
                <div className="stat-label">本日正答率</div>
                <div className="stat-value">
                  <strong className="correct">{todayAccuracy}%</strong>
                </div>
                <div className="stat-sub">({todayTotalAnswered}問)</div>
              </div>
              
              {/* 定着率 */}
              <div className="stat-card stat-retention">
                <div className="stat-label">定着率</div>
                <div className="stat-value">
                  <strong className="mastered">{retentionRate}%</strong>
                </div>
                <div className="stat-sub">({masteredCount}/{appearedCount})</div>
              </div>
              
              {/* 累計回答 */}
              <div className="stat-card stat-total">
                <div className="stat-label">累計回答</div>
                <div className="stat-value">
                  <strong>{totalAnsweredCount}</strong>
                </div>
                <div className="stat-sub">問</div>
              </div>
            </div>
          )}
          
          {/* モバイル版: タブ切り替え */}
          {isMobile && (
            <>
              <div className="stat-subtabs-mobile">
                <button 
                  className={`stat-subtab ${statSubTab === 'accuracy' ? 'active' : ''}`}
                  onClick={() => setStatSubTab('accuracy')}
                >
                  正答率
                </button>
                <button 
                  className={`stat-subtab ${statSubTab === 'retention' ? 'active' : ''}`}
                  onClick={() => setStatSubTab('retention')}
                >
                  定着率
                </button>
                <button 
                  className={`stat-subtab ${statSubTab === 'total' ? 'active' : ''}`}
                  onClick={() => setStatSubTab('total')}
                >
                  累計
                </button>
              </div>
              
              <div className="stat-mobile-content">
                {statSubTab === 'accuracy' && (
                  <div className="stat-mobile-card">
                    {totalAnswered > 0 && (
                      <>
                        <div className="stat-mobile-item">
                          <span className="stat-mobile-label">現在:</span>
                          <span className="stat-mobile-value correct">
                            {currentScore}/{totalAnswered} ({currentAccuracy}%)
                          </span>
                        </div>
                        <div className="stat-mobile-divider"></div>
                      </>
                    )}
                    <div className="stat-mobile-item">
                      <span className="stat-mobile-label">本日正答率:</span>
                      <span className="stat-mobile-value correct">
                        {todayAccuracy}% ({todayTotalAnswered}問)
                      </span>
                    </div>
                  </div>
                )}
                
                {statSubTab === 'retention' && (
                  <div className="stat-mobile-card">
                    <div className="stat-mobile-item">
                      <span className="stat-mobile-label">定着率:</span>
                      <span className="stat-mobile-value mastered">
                        {retentionRate}% ({masteredCount}/{appearedCount})
                      </span>
                    </div>
                  </div>
                )}
                
                {statSubTab === 'total' && (
                  <div className="stat-mobile-card">
                    <div className="stat-mobile-item">
                      <span className="stat-mobile-label">累計回答:</span>
                      <span className="stat-mobile-value">
                        {totalAnsweredCount}問
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* 詳細な定着率の内訳（横長棒グラフ） */}
          {detailedStats.appearedWords > 0 && (
            <div className="retention-breakdown-container">
              <div className="retention-breakdown-label">
                📊 学習状況の内訳
              </div>
              <div className="retention-progress-bar">
                {detailedStats.masteredPercentage > 0 && (
                  <div 
                    className="retention-segment retention-mastered"
                    data-percentage={detailedStats.masteredPercentage}
                    title={`🟢 完全定着: ${detailedStats.masteredCount}語 (${detailedStats.masteredPercentage}%)`}
                  >
                    {detailedStats.masteredPercentage >= 15 && (
                      <span className="retention-segment-label">
                        🟢 {detailedStats.masteredPercentage}%
                      </span>
                    )}
                  </div>
                )}
                {detailedStats.learningPercentage > 0 && (
                  <div 
                    className="retention-segment retention-learning"
                    data-percentage={detailedStats.learningPercentage}
                    title={`🟡 学習中: ${detailedStats.learningCount}語 (${detailedStats.learningPercentage}%)`}
                  >
                    {detailedStats.learningPercentage >= 15 && (
                      <span className="retention-segment-label">
                        🟡 {detailedStats.learningPercentage}%
                      </span>
                    )}
                  </div>
                )}
                {detailedStats.strugglingPercentage > 0 && (
                  <div 
                    className="retention-segment retention-struggling"
                    data-percentage={detailedStats.strugglingPercentage}
                    title={`🔴 要復習: ${detailedStats.strugglingCount}語 (${detailedStats.strugglingPercentage}%)`}
                  >
                    {detailedStats.strugglingPercentage >= 15 && (
                      <span className="retention-segment-label">
                        🔴 {detailedStats.strugglingPercentage}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="retention-breakdown-details">
                <span className="retention-detail-item retention-detail-mastered">
                  🟢 完全定着 {detailedStats.masteredCount}語
                </span>
                <span className="retention-detail-item retention-detail-learning">
                  🟡 学習中 {detailedStats.learningCount}語
                </span>
                <span className="retention-detail-item retention-detail-struggling">
                  🔴 要復習 {detailedStats.strugglingCount}語
                </span>
              </div>
              {detailedStats.weightedRetentionRate !== detailedStats.basicRetentionRate && (
                <div className="retention-weighted-rate">
                  💡 加重定着率: <strong>{detailedStats.weightedRetentionRate}%</strong>
                  <span className="retention-weighted-hint">（学習中を半分評価）</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 目標・進捗タブ */}
      {activeTab === 'goals' && (
        <div className="score-board-content goals-tab-content">
          {/* 定着予測情報 */}
          {nearMasteryStats.nearMasteryCount > 0 && (
            <span className="score-stat near-mastery-stat" title={`あと1回正解で定着する単語が${nearMasteryStats.nearMasteryCount}個あります`}>
              🎯 <strong className="near-mastery-count">{nearMasteryStats.nearMasteryCount}</strong>
              <span className="score-stat-sub">定着間近</span>
            </span>
          )}
          
          {nearMasteryStats.nearMasteryCount > 0 && (
            <span className="score-stat-divider">|</span>
          )}
          
          {/* 長期記憶達成 */}
          {nearMasteryStats.longTermMemoryCount > 0 && (
            <span className="score-stat long-term-memory-stat" title={`連続5回以上正解で長期記憶に定着した単語が${nearMasteryStats.longTermMemoryCount}個あります（30日〜90日間隔で復習）`}>
              🧠 <strong className="long-term-count">{nearMasteryStats.longTermMemoryCount}</strong>
              <span className="score-stat-sub">長期記憶</span>
            </span>
          )}
          
          {nearMasteryStats.longTermMemoryCount > 0 && (
            <span className="score-stat-divider">|</span>
          )}
          
          {/* 超長期記憶達成 */}
          {nearMasteryStats.superMemoryCount > 0 && (
            <span className="score-stat super-memory-stat" title={`連続7回以上正解で超長期記憶に定着した単語が${nearMasteryStats.superMemoryCount}個あります（半年〜1年間隔で復習）`}>
              ✨ <strong className="super-memory-count">{nearMasteryStats.superMemoryCount}</strong>
              <span className="score-stat-sub">完全定着</span>
            </span>
          )}
          
          {nearMasteryStats.superMemoryCount > 0 && (
            <span className="score-stat-divider">|</span>
          )}
          
          {/* 目標達成情報 */}
          <span className="score-stat-large goal-progress" title={goalMessage}>
            {goalProgress.goal.icon} <strong className={goalProgress.overallProgress >= 80 ? 'goal-near' : 'goal-far'}>
              {goalProgress.overallProgress}%
            </strong>
            <span className="score-stat-sub">
              ({goalProgress.goal.name}
              {goalProgress.estimatedDaysToAchieve > 0 && goalProgress.estimatedDaysToAchieve <= 30 && (
                <> · あと{goalProgress.estimatedDaysToAchieve}日</>
              )}
              )
            </span>
          </span>
          
          {/* 忘却アラート - 1個以上の場合に表示 */}
          {alertSummary.todayReviewCount >= 1 && (
            <span className="score-stat-divider">|</span>
          )}
          {alertSummary.todayReviewCount >= 1 && (
            <span 
              className={`score-stat alert-stat ${onReviewFocus ? 'clickable' : ''}`}
              title={onReviewFocus ? "クリックして要復習問題に集中" : "今日復習すべき単語があります"}
              onClick={onReviewFocus}
            >
              ⏰ <strong className="alert-count">{alertSummary.todayReviewCount}</strong>
              <span className="score-stat-sub">要復習</span>
            </span>
          )}
        </div>
      )}
      
      {/* 履歴タブ */}
      {activeTab === 'history' && (mode === 'translation' || mode === 'spelling') && (
        <div className="score-board-content history-tab-content">
          <div className="session-indicator">
            <div className="session-stats">
              <span className="session-label">今回:</span>
              <span className="session-count">{totalAnswered}問</span>
              {totalAnswered > 0 && (
                <span className="session-breakdown">
                  {sessionCorrect > 0 && <span className="stat-correct">🟩{sessionCorrect}</span>}
                  {sessionIncorrect > 0 && <span className="stat-incorrect">🟨{sessionIncorrect}</span>}
                  {sessionReview > 0 && <span className="stat-review">🟧{sessionReview}</span>}
                  {sessionMastered > 0 && <span className="stat-mastered">⭐️{sessionMastered}</span>}
                </span>
              )}
            </div>
            <div className="history-indicator">
              <span className="history-label">履歴:</span>
              <div className="history-items">
                {history.length === 0 ? (
                  <span className="history-empty">データなし</span>
                ) : (
                history.map((item, idx) => (
                  <span
                    key={idx}
                    className={`history-item history-${item.status}`}
                    title={`${item.word} (${item.status === 'correct' ? '正解' : item.status === 'incorrect' ? '不正解' : item.status === 'review' ? '要復習' : '定着'})`}
                  >
                    {item.status === 'correct' ? '🟩' : 
                     item.status === 'incorrect' ? '🟨' : 
                     item.status === 'review' ? '🟧' : '⭐️'}
                  </span>
                ))
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScoreBoard;
