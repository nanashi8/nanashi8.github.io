import { 
  getTodayStats, 
  getTotalAnsweredCount, 
  getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount,
  getRetentionRateWithAI
} from '../progressStorage';
import { calculateGoalProgress, generateGoalMessage } from '../goalSimulator';
import { getAlertSummary } from '../forgettingAlert';

interface ScoreBoardProps {
  mode?: 'translation' | 'spelling' | 'reading'; // クイズモードを追加
  currentScore?: number; // 現在のスコア
  totalAnswered?: number; // 現在の回答数
}

function ScoreBoard({ 
  mode = 'translation', // デフォルトは和訳モード
  currentScore = 0,
  totalAnswered = 0
}: ScoreBoardProps) {
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

  // 目標達成情報を取得
  const goalProgress = calculateGoalProgress();
  const goalMessage = generateGoalMessage(false);
  
  // 忘却アラートサマリーを取得
  const alertSummary = getAlertSummary();

  // 現在のセッションの正答率を計算
  const currentAccuracy = totalAnswered > 0 ? Math.round((currentScore / totalAnswered) * 100) : 0;

  return (
    <div className="score-board-compact">
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
      
      {/* 目標達成情報 */}
      <span className="score-stat-divider">|</span>
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
      
      {/* 忘却アラート */}
      {alertSummary.todayReviewCount > 0 && (
        <>
          <span className="score-stat-divider">|</span>
          <span className="score-stat alert-stat" title="今日復習すべき単語があります">
            ⏰ <strong className="alert-count">{alertSummary.todayReviewCount}</strong>
            <span className="score-stat-sub">要復習</span>
          </span>
        </>
      )}
    </div>
  );
}

export default ScoreBoard;
