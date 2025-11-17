import { 
  getDifficultyStatsForRadar
} from '../progressStorage';
import ScoreRadarChart from './ScoreRadarChart';

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
  // 難易度別の統計を取得
  const { labels, answeredData, correctData } = getDifficultyStatsForRadar(mode);

  // モード名を取得
  const modeNames: Record<string, string> = {
    translation: '和訳クイズ',
    spelling: 'スペルクイズ',
    reading: '長文読解'
  };

  return (
    <div className="score-board-radar">
      <ScoreRadarChart
        labels={labels}
        answeredData={answeredData}
        correctData={correctData}
        title={`${modeNames[mode]} - 難易度別成績`}
      />
      {currentScore > 0 && totalAnswered > 0 && (
        <div className="current-session-info">
          <p>現在のセッション: {currentScore}/{totalAnswered} ({Math.round((currentScore / totalAnswered) * 100)}%)</p>
        </div>
      )}
    </div>
  );
}

export default ScoreBoard;
