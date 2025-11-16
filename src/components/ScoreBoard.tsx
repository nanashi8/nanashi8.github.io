import { Question } from '../types';
import { loadProgress } from '../progressStorage';

interface ScoreBoardProps {
  score: number;
  totalAnswered: number;
  totalQuestions: number;
  questions: Question[];
  currentIndex: number;
  answered: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip?: () => void;
}

function ScoreBoard({ 
  score, 
  totalAnswered, 
  totalQuestions, 
  questions, 
  currentIndex,
  answered,
  onPrevious,
  onNext,
  onSkip
}: ScoreBoardProps) {
  const accuracy =
    totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  // 新規単語数を計算（学習履歴がない単語）
  const progress = loadProgress();
  const newWordsCount = questions.filter(q => {
    const wordProgress = progress.wordProgress[q.word];
    return !wordProgress || (wordProgress.correctCount === 0 && wordProgress.incorrectCount === 0);
  }).length;

  const handleNextClick = () => {
    if (!answered && onSkip) {
      // 回答前に次へボタンを押した場合はスキップ
      onSkip();
    } else {
      onNext();
    }
  };

  return (
    <div className="score-board-with-nav">
      <button 
        className="nav-btn prev-btn" 
        onClick={onPrevious}
        disabled={currentIndex === 0}
      >
        ← 前へ
      </button>
      
      <div className="score-board-compact">
        <span className="score-stat-large">
          正答率<strong className="correct">{accuracy}%</strong>
        </span>
        <span className="score-stat">
          回答数<strong>{totalAnswered}</strong>
        </span>
        <span className="score-stat-divider">/</span>
        <span className="score-stat">
          出題数<strong>{totalQuestions}</strong>
        </span>
        <span className="score-stat-divider">|</span>
        <span className="score-stat">
          新規数<strong>{newWordsCount}</strong>
        </span>
      </div>
      
      <button 
        className="nav-btn next-btn" 
        onClick={handleNextClick}
      >
        次へ →
      </button>
    </div>
  );
}

export default ScoreBoard;
