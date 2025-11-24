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
  onShowSettings
}: ScoreBoardProps) {
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'stats' | 'breakdown' | 'goals' | 'history' | 'settings'>('stats');
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

  // タブの配列（学習プラン、統計、学習状況、目標、履歴、設定）
  const tabs: Array<'plan' | 'stats' | 'breakdown' | 'goals' | 'history' | 'settings'> = 
    mode === 'translation' || mode === 'spelling' 
      ? ['plan', 'stats', 'breakdown', 'goals', 'history', 'settings'] 
      : ['plan', 'stats', 'breakdown', 'settings'];

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
          <button 
            className={`score-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 統計
          </button>
          {detailedStats.appearedWords > 0 && (
            <button 
              className={`score-tab ${activeTab === 'breakdown' ? 'active' : ''}`}
              onClick={() => setActiveTab('breakdown')}
            >
              📈 学習状況
            </button>
          )}
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveTab('goals')}
            >
              🎯 目標
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
              setActiveTab('settings');
              if (onShowSettings) {
                onShowSettings();
              }
            }}
          >
            設定
          </button>
        </div>
      )}

      {/* タブナビゲーション: モバイル版（タブ型） */}
      {isMobile && (
        <div className="score-board-tabs score-board-tabs-mobile">
          <button 
            className={`score-tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
            title="プラン"
          >
            📋
          </button>
          <button 
            className={`score-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
            title="統計"
          >
            📊
          </button>
          {detailedStats.appearedWords > 0 && (
            <button 
              className={`score-tab ${activeTab === 'breakdown' ? 'active' : ''}`}
              onClick={() => setActiveTab('breakdown')}
              title="学習状況"
            >
              📈
            </button>
          )}
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveTab('goals')}
              title="目標"
            >
              🎯
            </button>
          )}
          {(mode === 'translation' || mode === 'spelling') && (
            <button 
              className={`score-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              title="履歴"
            >
              📜
            </button>
          )}
          <button 
            className={`score-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              if (onShowSettings) {
                onShowSettings();
              }
            }}
            title="設定"
          >
            設
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
            <div className="plan-text-line">
              <span>📋 要復習: <strong>{planInfo.reviewWordsCount}</strong></span>
              <span>｜確認予定: <strong>{planInfo.scheduledWordsCount}</strong></span>
              <span>｜目標: <strong>{planTarget}</strong></span>
              <span>｜進捗: <strong>{totalAnswered}/{planTarget}</strong></span>
            </div>
          </div>
        </div>
      )}
      
      {/* 基本統計タブ */}
      {activeTab === 'stats' && (
        <div className="score-board-content">
          <div className="stats-text-compact">
            {totalAnswered > 0 && (
              <span className="stat-text-item">
                <span className="stat-text-label">現在:</span>
                <strong className="stat-text-value correct">{currentScore}/{totalAnswered}</strong>
                <span className="stat-text-sub">({currentAccuracy}%)</span>
                <span className="stat-text-divider">｜</span>
              </span>
            )}
            <span className="stat-text-item">
              <span className="stat-text-label">本日:</span>
              <strong className="stat-text-value correct">{todayAccuracy}%</strong>
              <span className="stat-text-sub">({todayTotalAnswered}問)</span>
            </span>
            <span className="stat-text-divider">｜</span>
            <span className="stat-text-item">
              <span className="stat-text-label">定着率:</span>
              <strong className="stat-text-value mastered">{retentionRate}%</strong>
              <span className="stat-text-sub">({masteredCount}/{appearedCount})</span>
            </span>
            <span className="stat-text-divider">｜</span>
            <span className="stat-text-item">
              <span className="stat-text-label">累計:</span>
              <strong className="stat-text-value">{totalAnsweredCount}問</strong>
            </span>
          </div>
        </div>
      )}
      
      {/* 学習状況タブ（詳細な定着率の内訳） */}
      {activeTab === 'breakdown' && detailedStats.appearedWords > 0 && (
        <div className="score-board-content">
          <div className="retention-breakdown-container">
            <div className="retention-progress-bar">
              {detailedStats.masteredPercentage > 0 && (
                <div 
                  className="retention-segment retention-mastered"
                  data-percentage={Math.round(detailedStats.masteredPercentage)}
                  title={`🟢 完全定着: ${detailedStats.masteredCount}語 (${detailedStats.masteredPercentage}%)`}
                >
                  {detailedStats.masteredPercentage >= 10 && (
                    <span>{detailedStats.masteredPercentage}%</span>
                  )}
                </div>
              )}
              {detailedStats.learningPercentage > 0 && (
                <div 
                  className="retention-segment retention-learning"
                  data-percentage={Math.round(detailedStats.learningPercentage)}
                  title={`🟡 学習中: ${detailedStats.learningCount}語 (${detailedStats.learningPercentage}%)`}
                >
                  {detailedStats.learningPercentage >= 10 && (
                    <span>{detailedStats.learningPercentage}%</span>
                  )}
                </div>
              )}
              {detailedStats.strugglingPercentage > 0 && (
                <div 
                  className="retention-segment retention-struggling"
                  data-percentage={Math.round(detailedStats.strugglingPercentage)}
                  title={`🔴 要復習: ${detailedStats.strugglingCount}語 (${detailedStats.strugglingPercentage}%)`}
                >
                  {detailedStats.strugglingPercentage >= 10 && (
                    <span>{detailedStats.strugglingPercentage}%</span>
                  )}
                </div>
              )}
            </div>
            <div className="retention-text-summary">
              🟢{detailedStats.masteredCount} 🟡{detailedStats.learningCount} 🔴{detailedStats.strugglingCount}
            </div>
          </div>
        </div>
      )}
      
      {/* 目標・進捗タブ */}
      {activeTab === 'goals' && (
        <div className="score-board-content">
          <div className="goals-compact">
            {/* 定着段階の統計 */}
            {nearMasteryStats.nearMasteryCount > 0 && (
              <span title={`あと1回正解で定着する単語が${nearMasteryStats.nearMasteryCount}個あります`}>
                🎯<strong>{nearMasteryStats.nearMasteryCount}</strong>定着間近
              </span>
            )}
            {nearMasteryStats.nearMasteryCount > 0 && <span className="goal-divider">｜</span>}
            {nearMasteryStats.longTermMemoryCount > 0 && (
              <span title={`連続5回以上正解で長期記憶に定着した単語が${nearMasteryStats.longTermMemoryCount}個あります`}>
                🧠<strong>{nearMasteryStats.longTermMemoryCount}</strong>長期記憶
              </span>
            )}
            {nearMasteryStats.longTermMemoryCount > 0 && <span className="goal-divider">｜</span>}
            {nearMasteryStats.superMemoryCount > 0 && (
              <span title={`連続7回以上正解で超長期記憶に定着した単語が${nearMasteryStats.superMemoryCount}個あります`}>
                ✨<strong>{nearMasteryStats.superMemoryCount}</strong>完全定着
              </span>
            )}
            {nearMasteryStats.superMemoryCount > 0 && <span className="goal-divider">｜</span>}
            
            {/* 達成済みまたは達成間近の目標のみ表示 */}
            {(() => {
              const allProgress = [
                { id: 'eiken5', name: '英検5級', icon: '🌱', required: 600 },
                { id: 'eiken4', name: '英検4級', icon: '🌿', required: 1300 },
                { id: 'eiken3', name: '英検3級', icon: '🌳', required: 2100 },
                { id: 'high-school', name: '高校入試', icon: '🎓', required: 2500 },
                { id: 'eiken-pre2', name: '英検準2級', icon: '📚', required: 3600 }
              ];
              
              const displayGoals = allProgress
                .map(g => ({
                  ...g,
                  progress: Math.min(100, Math.round((masteredCount / g.required) * 100)),
                  remaining: Math.max(0, g.required - masteredCount)
                }))
                .filter(g => g.progress >= 80 || (g.progress === 100 && masteredCount >= g.required));
              
              if (displayGoals.length === 0) {
                // 次の目標を1つだけ表示
                const nextGoal = allProgress.find(g => masteredCount < g.required);
                if (nextGoal) {
                  const remaining = nextGoal.required - masteredCount;
                  return (
                    <span title={`${nextGoal.name}レベルまであと${remaining}語`}>
                      📋 次の目標: <strong>{nextGoal.name}</strong> (あと{remaining}語)
                    </span>
                  );
                }
              }
              
              return displayGoals.map((g, idx) => (
                <span key={g.id}>
                  {idx > 0 && <span className="goal-divider">｜</span>}
                  <span title={g.progress === 100 ? `${g.name}レベル達成済み` : `${g.name}まであと${g.remaining}語`}>
                    {g.icon}
                    {g.progress === 100 ? (
                      <><strong>{g.name}</strong> 達成済み</>
                    ) : (
                      <><strong>{g.name}</strong> {g.progress}% (あと{g.remaining}語)</>
                    )}
                  </span>
                </span>
              ));
            })()}
            
            {alertSummary.todayReviewCount >= 1 && (
              <>
                <span className="goal-divider">｜</span>
                <span 
                  className={onReviewFocus ? 'alert-clickable' : ''}
                  title={onReviewFocus ? "クリックして要復習問題に集中" : "今日復習すべき単語があります"}
                  onClick={onReviewFocus}
                >
                  ⏰<strong>{alertSummary.todayReviewCount}</strong>要復習
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* 履歴タブ */}
      {activeTab === 'history' && (mode === 'translation' || mode === 'spelling') && (
        <div className="score-board-content">
          <div className="history-compact">
            <div className="history-text-line">
              <span>今回: <strong>{totalAnswered}問</strong></span>
              {totalAnswered > 0 && (
                <>
                  {sessionCorrect > 0 && <span> 🟩{sessionCorrect}</span>}
                  {sessionIncorrect > 0 && <span> 🟨{sessionIncorrect}</span>}
                  {sessionReview > 0 && <span> 🟧{sessionReview}</span>}
                  {sessionMastered > 0 && <span> ⭐{sessionMastered}</span>}
                </>
              )}
            </div>
            <div className="history-icons">
              {!Array.isArray(history) || history.length === 0 ? (
                <span className="history-empty">履歴なし</span>
              ) : (
                history.map((item, idx) => (
                  <span
                    key={idx}
                    className="history-icon"
                    title={`${item.word}`}
                  >
                    {item.status === 'correct' ? '🟩' : 
                     item.status === 'incorrect' ? '🟨' : 
                     item.status === 'review' ? '🟧' : '⭐'}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 設定タブ */}
      {activeTab === 'settings' && onShowSettings && (
        <div className="score-board-content">
          <div className="settings-tab-message">
            <button 
              onClick={onShowSettings}
              className="btn-back-to-settings"
            >
              ⚙️ 学習設定に戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScoreBoard;
