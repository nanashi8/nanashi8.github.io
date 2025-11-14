interface ScoreBoardProps {
  score: number;
  totalAnswered: number;
  totalQuestions: number;
}

function ScoreBoard({ score, totalAnswered, totalQuestions }: ScoreBoardProps) {
  const accuracy =
    totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  return (
    <div className="score-board-compact">
      <span className="score-stat-large">
        正答率: <strong className="correct">{accuracy}%</strong>
      </span>
      <span className="score-stat">
        解答: <strong>{totalAnswered}</strong> / 全: <strong>{totalQuestions}</strong>問
      </span>
    </div>
  );
}

export default ScoreBoard;
