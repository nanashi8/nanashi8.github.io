interface ScoreBoardProps {
  score: number;
  totalAnswered: number;
  totalQuestions: number;
  currentIndex?: number; // 現在の問題番号（オプション）
}

function ScoreBoard({ score, totalAnswered, totalQuestions, currentIndex }: ScoreBoardProps) {
  const accuracy =
    totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  return (
    <div className="score-board-compact">
      {currentIndex !== undefined && (
        <span className="score-stat">
          <strong>第{currentIndex + 1}問</strong>
        </span>
      )}
      <span className="score-stat">
        解答: <strong>{totalAnswered}</strong>
      </span>
      <span className="score-stat">
        正解: <strong className="correct">{score}</strong>
      </span>
      <span className="score-stat">
        正答率: <strong>{accuracy}%</strong>
      </span>
      <span className="score-stat">
        全: <strong>{totalQuestions}</strong>問
      </span>
    </div>
  );
}

export default ScoreBoard;
