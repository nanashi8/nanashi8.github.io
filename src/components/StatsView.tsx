import { useState, useEffect } from 'react';
import {
  loadProgress,
  getStatsByCategory,
  getStatsByDifficulty,
  getCategoryDifficultyStats,
  UserProgress,
} from '../progressStorage';
import { QuestionSet, Question, ReadingPassage } from '../types';
import ReadingRadarChart from './ReadingRadarChart';
import CategoryRadarChart from './CategoryRadarChart';

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

  // 分野別・難易度別のデータを取得
  const translationCategoryStats = getCategoryDifficultyStats('translation');
  const spellingCategoryStats = getCategoryDifficultyStats('spelling');

  // 長文読解用のレーダーチャートデータを生成
  const [readingPassages, setReadingPassages] = useState<ReadingPassage[]>([]);
  
  useEffect(() => {
    fetch('/data/reading-passages-comprehensive.json')
      .then(res => res.json())
      .then((data: ReadingPassage[]) => {
        setReadingPassages(data);
      })
      .catch(err => console.error('長文パッセージの読み込みエラー:', err));
  }, []);

  const generateReadingRadarData = () => {
    const labels: string[] = [];
    const savedWordsData: number[] = [];
    const totalWordsData: number[] = [];

    readingPassages.forEach(passage => {
      const savedWords = passage.phrases?.reduce(
        (count, phrase) => count + (phrase.segments?.filter(s => s.isUnknown).length || 0),
        0
      ) || 0;
      const totalWords = passage.actualWordCount || 0;

      labels.push(passage.title.replace(/パッセージ\d+:\s*/, '').substring(0, 15));
      savedWordsData.push(savedWords);
      totalWordsData.push(totalWords);
    });

    return { labels, savedWordsData, totalWordsData };
  };

  const readingRadar = generateReadingRadarData();

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>📊 成績</h2>
      </div>

      {/* レーダーチャート - 和訳クイズ */}
      <div className="stats-section-new">
        <CategoryRadarChart
          labels={translationCategoryStats.labels}
          accuracyData={translationCategoryStats.accuracyData}
          progressData={translationCategoryStats.progressData}
          title="和訳クイズ - 分野別正答率"
          chartType="accuracy"
        />
      </div>

      <div className="stats-section-new">
        <CategoryRadarChart
          labels={translationCategoryStats.labels}
          accuracyData={translationCategoryStats.accuracyData}
          progressData={translationCategoryStats.progressData}
          title="和訳クイズ - 分野別進捗率（定着数/総単語数）"
          chartType="progress"
        />
      </div>

      {/* レーダーチャート - スペルクイズ */}
      <div className="stats-section-new">
        <CategoryRadarChart
          labels={spellingCategoryStats.labels}
          accuracyData={spellingCategoryStats.accuracyData}
          progressData={spellingCategoryStats.progressData}
          title="スペルクイズ - 分野別正答率"
          chartType="accuracy"
        />
      </div>

      <div className="stats-section-new">
        <CategoryRadarChart
          labels={spellingCategoryStats.labels}
          accuracyData={spellingCategoryStats.accuracyData}
          progressData={spellingCategoryStats.progressData}
          title="スペルクイズ - 分野別進捗率（定着数/総単語数）"
          chartType="progress"
        />
      </div>

      {/* レーダーチャート - 長文読解 */}
      {readingPassages.length > 0 && (
        <div className="stats-section-new">
          <ReadingRadarChart
            labels={readingRadar.labels}
            savedWordsData={readingRadar.savedWordsData}
            totalWordsData={readingRadar.totalWordsData}
            title="長文読解 - パッセージ別保存単語数"
          />
        </div>
      )}

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
