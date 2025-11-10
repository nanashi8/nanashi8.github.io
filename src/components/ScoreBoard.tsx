interface ScoreBoardProps {
  score: number;
  totalAnswered: number;
  totalQuestions: number;
}

function ScoreBoard({ score, totalAnswered, totalQuestions }: ScoreBoardProps) {
  const accuracy =
    totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  return (
    <div className="score-board">
      <div className="score-item">
        <span className="score-label">解答数</span>
        <span className="score-value">{totalAnswered}</span>
      </div>
      <div className="score-item">
        <span className="score-label">正解数</span>
        <span className="score-value correct">{score}</span>
      </div>
      <div className="score-item">
        <span className="score-label">正答率</span>
        <span className="score-value">{accuracy}%</span>
      </div>
      <div className="score-item">
        <span className="score-label">総問題数</span>
        <span className="score-value">{totalQuestions}</span>
      </div>
    </div>
  );
}

export default ScoreBoard;
