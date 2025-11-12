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
        <span className="score-stat-large">
          <strong>第{currentIndex + 1}問</strong>
        </span>
      )}
      <span className="score-stat-large">
        正答率: <strong className="correct">{accuracy}%</strong>
      </span>
      <span className="score-stat">
        (解答: {totalAnswered} / 全: {totalQuestions}問)
      </span>
    </div>
  );
}

export default ScoreBoard;
