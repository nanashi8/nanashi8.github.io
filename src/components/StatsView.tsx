import { useState, useEffect } from 'react';
import {
  loadProgress,
  getStatsByCategory,
  getStatsByDifficulty,
  UserProgress,
} from '../progressStorage';
import { QuestionSet, Question } from '../types';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
}

function StatsView({ }: StatsViewProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // リアルタイム更新（学習中のデータを即座に反映）
  useEffect(() => {
    loadProgressData();
    
    if (autoRefresh) {
      // 5秒ごとにデータを再読み込み
      const interval = setInterval(() => {
        loadProgressData();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // storageイベントをリッスン（他のタブでの変更を検知）
  useEffect(() => {
    const handleStorageChange = () => {
      loadProgressData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadProgressData = () => {
    const data = loadProgress();
    setProgress(data);
  };

  if (!progress) {
    return <div className="stats-view">読み込み中...</div>;
  }

  const categoryStats = getStatsByCategory();
  const difficultyStats = getStatsByDifficulty();

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>📊 成績</h2>
      </div>

      {/* 分野別の成績 */}
      <div className="stats-section-new">
        <h3 className="section-title">
          <span className="title-icon">📚</span>
          分野別の成績
        </h3>
        {categoryStats.size > 0 ? (
          <div className="stats-table">
            <div className="stats-table-header">
              <div className="stats-table-cell">分野</div>
              <div className="stats-table-cell">正答率</div>
              <div className="stats-table-cell">回答数</div>
            </div>
            {Array.from(categoryStats.entries())
              .sort((a, b) => b[1].totalCount - a[1].totalCount)
              .map(([category, stats]) => (
                <div key={category} className="stats-table-row">
                  <div className="stats-table-cell stats-category-name">{category}</div>
                  <div className="stats-table-cell stats-accuracy">
                    {stats.accuracy.toFixed(1)}%
                  </div>
                  <div className="stats-table-cell stats-count">
                    {stats.correctCount}/{stats.totalCount}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="no-data-message">
            <p>まだ学習記録がありません</p>
            <p className="encourage-text">クイズに挑戦しよう！ 🚀</p>
          </div>
        )}
      </div>

      {/* 難易度別の成績 */}
      <div className="stats-section-new">
        <h3 className="section-title">
          <span className="title-icon">⭐</span>
          難易度別の成績
        </h3>
        {difficultyStats.size > 0 ? (
          <div className="stats-table">
            <div className="stats-table-header">
              <div className="stats-table-cell">難易度</div>
              <div className="stats-table-cell">正答率</div>
              <div className="stats-table-cell">回答数</div>
            </div>
            {Array.from(difficultyStats.entries())
              .sort((a, b) => {
                const order = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                return (order[a[0] as keyof typeof order] || 999) - (order[b[0] as keyof typeof order] || 999);
              })
              .map(([difficulty, stats]) => {
                const displayName = difficulty === 'beginner' ? '初級' : 
                                  difficulty === 'intermediate' ? '中級' : 
                                  difficulty === 'advanced' ? '上級' : difficulty;
                return (
                  <div key={difficulty} className="stats-table-row">
                    <div className="stats-table-cell stats-difficulty-name">{displayName}</div>
                    <div className="stats-table-cell stats-accuracy">
                      {stats.accuracy.toFixed(1)}%
                    </div>
                    <div className="stats-table-cell stats-count">
                      {stats.correctCount}/{stats.totalCount}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="no-data-message">
            <p>まだ学習記録がありません</p>
            <p className="encourage-text">クイズに挑戦しよう！ 🚀</p>
          </div>
        )}
      </div>

      {/* 自動更新の設定 */}
      <div className="stats-footer">
        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span>自動更新（5秒ごと）</span>
        </label>
      </div>
    </div>
  );
}

export default StatsView;
