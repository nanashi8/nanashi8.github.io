import { 
  getTodayStats, 
  getTotalAnsweredCount, 
  getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount,
  getRetentionRateWithAI,
  getDetailedRetentionStats,
  getNearMasteryStats,
  getSessionHistory,
  SessionHistoryItem
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
  const [activeTab, setActiveTab] = useState<'stats' | 'goals' | 'history'>('stats');

  // モバイル判定
  const isMobile = window.innerWidth <= 768;
  const historyLimit = isMobile ? 10 : 20;

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

  // 目標達成情報を取得
  const goalProgress = calculateGoalProgress();
  const goalMessage = generateGoalMessage(false);
  
  // 忘却アラートサマリーを取得
  const alertSummary = getAlertSummary();

  // 現在のセッションの正答率を計算
  const currentAccuracy = totalAnswered > 0 ? Math.round((currentScore / totalAnswered) * 100) : 0;

  return (
    <div className="score-board-compact">
      {/* タブナビゲーション */}
      <div className="score-board-tabs">
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

      {/* 補修モードインジケーター */}
      {isReviewFocusMode && (
        <div className="review-focus-indicator">
          🎯 <strong>補修モード</strong> - 要復習問題を繰り返し出題中
        </div>
      )}
      
      {/* 基本統計タブ */}
      {activeTab === 'stats' && (
        <>
          {totalAnswered > 0 && (
            <>
              <span className="score-stat-large">
                現在<strong className="correct">{currentScore}/{totalAnswered} ({currentAccuracy}%)</strong>
              </span>
              <span className="score-stat-divider">|</span>
            </>
          )}
          <span className="score-stat-large">
            本日正答率<strong className="correct">{todayAccuracy}%</strong>
            <span className="score-stat-sub">({todayTotalAnswered}問)</span>
          </span>
          <span className="score-stat-divider">|</span>
          <span className="score-stat-large">
            定着率<strong className="mastered">{retentionRate}%</strong>
            <span className="score-stat-sub">({masteredCount}/{appearedCount})</span>
          </span>
          <span className="score-stat-divider">|</span>
          <span className="score-stat">
            累計回答<strong>{totalAnsweredCount}</strong>
          </span>
          
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
        </>
      )}
      
      {/* 目標・進捗タブ */}
      {activeTab === 'goals' && (
        <>
          {/* 定着予測情報 */}
          {nearMasteryStats.nearMasteryCount > 0 && (
            <>
              <span className="score-stat near-mastery-stat" title={`あと1回正解で定着する単語が${nearMasteryStats.nearMasteryCount}個あります`}>
                🎯 <strong className="near-mastery-count">{nearMasteryStats.nearMasteryCount}</strong>
                <span className="score-stat-sub">定着間近</span>
              </span>
              <span className="score-stat-divider">|</span>
            </>
          )}
          
          {/* 長期記憶達成 */}
          {nearMasteryStats.longTermMemoryCount > 0 && (
            <>
              <span className="score-stat long-term-memory-stat" title={`連続5回以上正解で長期記憶に定着した単語が${nearMasteryStats.longTermMemoryCount}個あります（30日〜90日間隔で復習）`}>
                🧠 <strong className="long-term-count">{nearMasteryStats.longTermMemoryCount}</strong>
                <span className="score-stat-sub">長期記憶</span>
              </span>
              <span className="score-stat-divider">|</span>
            </>
          )}
          
          {/* 超長期記憶達成 */}
          {nearMasteryStats.superMemoryCount > 0 && (
            <>
              <span className="score-stat super-memory-stat" title={`連続7回以上正解で超長期記憶に定着した単語が${nearMasteryStats.superMemoryCount}個あります（半年〜1年間隔で復習）`}>
                ✨ <strong className="super-memory-count">{nearMasteryStats.superMemoryCount}</strong>
                <span className="score-stat-sub">完全定着</span>
              </span>
              <span className="score-stat-divider">|</span>
            </>
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
            <>
              <span className="score-stat-divider">|</span>
              <span 
                className={`score-stat alert-stat ${onReviewFocus ? 'clickable' : ''}`}
                title={onReviewFocus ? "クリックして要復習問題に集中" : "今日復習すべき単語があります"}
                onClick={onReviewFocus}
              >
                ⏰ <strong className="alert-count">{alertSummary.todayReviewCount}</strong>
                <span className="score-stat-sub">要復習</span>
              </span>
            </>
          )}
        </>
      )}
      
      {/* 履歴タブ */}
      {activeTab === 'history' && (mode === 'translation' || mode === 'spelling') && (
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
      )}
    </div>
  );
}

export default ScoreBoard;
