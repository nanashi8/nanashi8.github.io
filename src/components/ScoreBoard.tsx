import { 
  getTodayStats, 
  getTotalAnsweredCount, 
  getUniqueQuestionedWordsCount,
  getTotalMasteredWordsCount 
} from '../progressStorage';

interface ScoreBoardProps {
  mode?: 'translation' | 'spelling' | 'reading'; // クイズモードを追加
}

function ScoreBoard({ 
  mode = 'translation' // デフォルトは和訳モード
}: ScoreBoardProps) {
  // 本日の統計を取得
  const { todayAccuracy, todayTotalAnswered } = getTodayStats(mode);

  // 累計回答数を取得
  const totalAnsweredCount = getTotalAnsweredCount(mode);

  // 定着数を取得（全体から）
  const masteredCount = getTotalMasteredWordsCount();

  // 出題数を取得（重複除外、全4700問のうち実際に出題された数）
  const uniqueQuestionedCount = getUniqueQuestionedWordsCount();

  return (
    <div className="score-board-compact">
      <span className="score-stat-large">
        本日正答率<strong className="correct">{todayAccuracy}%</strong>
      </span>
      <span className="score-stat-divider">|</span>
      <span className="score-stat">
        本日回答数<strong>{todayTotalAnswered}</strong>
      </span>
      <span className="score-stat-divider">|</span>
      <span className="score-stat">
        累計回答数<strong>{totalAnsweredCount}</strong>
      </span>
      <span className="score-stat-divider">|</span>
      <span className="score-stat">
        定着数<strong>{masteredCount}</strong>
      </span>
      <span className="score-stat-divider">|</span>
      <span className="score-stat">
        出題数<strong>{uniqueQuestionedCount}</strong>
      </span>
    </div>
  );
}

export default ScoreBoard;
