import { useState, useEffect } from 'react';
import {
  loadProgress,
  getRecentResults,
  getStatsByMode,
  getWeakWords,
  getDailyStudyTime,
  exportProgress,
  importProgress,
  clearProgress,
  QuizResult,
  UserProgress,
} from '../progressStorage';
import { QuestionSet } from '../types';

interface StatsViewProps {
  questionSets: QuestionSet[];
}

function StatsView({ questionSets }: StatsViewProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'weakwords' | 'charts'>('overview');

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    const data = loadProgress();
    setProgress(data);
  };

  const handleExport = () => {
    try {
      const json = exportProgress();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('成績データをエクスポートしました。');
    } catch (error) {
      alert('エクスポートに失敗しました。');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          if (importProgress(json)) {
            loadProgressData();
            alert('成績データをインポートしました。');
          } else {
            alert('インポートに失敗しました。ファイル形式を確認してください。');
          }
        } catch (error) {
          alert('ファイルの読み込みに失敗しました。');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    clearProgress();
    loadProgressData();
  };

  if (!progress) {
    return <div className="stats-view">読み込み中...</div>;
  }

  const stats = progress.statistics;
  const translationStats = getStatsByMode('translation');
  const spellingStats = getStatsByMode('spelling');
  const readingStats = getStatsByMode('reading');

  return (
    <div className="stats-view">
      <h2>📊 学習成績</h2>

      {/* タブナビゲーション */}
      <div className="stats-tabs">
        <button
          className={activeSection === 'overview' ? 'active' : ''}
          onClick={() => setActiveSection('overview')}
        >
          概要
        </button>
        <button
          className={activeSection === 'history' ? 'active' : ''}
          onClick={() => setActiveSection('history')}
        >
          履歴
        </button>
        <button
          className={activeSection === 'weakwords' ? 'active' : ''}
          onClick={() => setActiveSection('weakwords')}
        >
          弱点単語
        </button>
        <button
          className={activeSection === 'charts' ? 'active' : ''}
          onClick={() => setActiveSection('charts')}
        >
          グラフ
        </button>
      </div>

      {/* 概要セクション */}
      {activeSection === 'overview' && (
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-label">総クイズ数</div>
              <div className="stat-value">{stats.totalQuizzes}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">総問題数</div>
              <div className="stat-value">{stats.totalQuestions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">平均正答率</div>
              <div className="stat-value">{stats.averageScore.toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">最高スコア</div>
              <div className="stat-value">{stats.bestScore.toFixed(0)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">連続学習日数</div>
              <div className="stat-value">{stats.streakDays}日 🔥</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">最終学習日</div>
              <div className="stat-value">
                {stats.lastStudyDate > 0
                  ? new Date(stats.lastStudyDate).toLocaleDateString('ja-JP')
                  : '-'}
              </div>
            </div>
          </div>

          {/* モード別統計 */}
          <div className="mode-stats">
            <h3>モード別統計</h3>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>モード</th>
                  <th>クイズ数</th>
                  <th>平均スコア</th>
                  <th>最高スコア</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🇯🇵 和訳クイズ</td>
                  <td>{translationStats.totalQuizzes}</td>
                  <td>{translationStats.averageScore.toFixed(1)}%</td>
                  <td>{translationStats.bestScore.toFixed(0)}%</td>
                </tr>
                <tr>
                  <td>✍️ スペルクイズ</td>
                  <td>{spellingStats.totalQuizzes}</td>
                  <td>{spellingStats.averageScore.toFixed(1)}%</td>
                  <td>{spellingStats.bestScore.toFixed(0)}%</td>
                </tr>
                <tr>
                  <td>📖 読解クイズ</td>
                  <td>{readingStats.totalQuizzes}</td>
                  <td>{readingStats.averageScore.toFixed(1)}%</td>
                  <td>{readingStats.bestScore.toFixed(0)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 問題集別統計 */}
          <div className="questionset-stats">
            <h3>問題集別統計</h3>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>問題集</th>
                  <th>挑戦回数</th>
                  <th>平均スコア</th>
                  <th>最高スコア</th>
                  <th>学習時間</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(progress.questionSetStats).map(([setId, setStats]) => {
                  const questionSet = questionSets.find(qs => qs.id === setId);
                  const setName = questionSet?.name || '削除済み問題集';
                  const totalMinutes = Math.floor(setStats.totalTimeSpent / 60);
                  
                  return (
                    <tr key={setId}>
                      <td>{setName}</td>
                      <td>{setStats.attempts}</td>
                      <td>{setStats.averageScore.toFixed(1)}%</td>
                      <td>{setStats.bestScore.toFixed(0)}%</td>
                      <td>{totalMinutes}分</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 履歴セクション */}
      {activeSection === 'history' && (
        <div className="stats-section">
          <h3>最近の学習履歴</h3>
          <div className="history-list">
            {getRecentResults(20).map((result: QuizResult) => {
              const questionSet = questionSets.find(qs => qs.id === result.questionSetId);
              const setName = questionSet?.name || result.questionSetName;
              const date = new Date(result.date);
              const modeEmoji = result.mode === 'translation' ? '🇯🇵' : result.mode === 'spelling' ? '✍️' : '📖';
              
              return (
                <div key={result.id} className="history-item">
                  <div className="history-header">
                    <span className="history-mode">{modeEmoji}</span>
                    <span className="history-setname">{setName}</span>
                    <span className="history-date">{date.toLocaleString('ja-JP')}</span>
                  </div>
                  <div className="history-details">
                    <span className="history-score">
                      {result.score}/{result.total} ({result.percentage.toFixed(0)}%)
                    </span>
                    <span className="history-time">
                      ⏱️ {Math.floor(result.timeSpent / 60)}分{result.timeSpent % 60}秒
                    </span>
                  </div>
                  {result.incorrectWords.length > 0 && (
                    <div className="history-incorrect">
                      間違えた単語: {result.incorrectWords.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 弱点単語セクション */}
      {activeSection === 'weakwords' && (
        <div className="stats-section">
          <h3>よく間違える単語 Top 20</h3>
          <div className="weak-words-list">
            {getWeakWords(20).map((item, index) => (
              <div key={item.word} className="weak-word-item">
                <span className="weak-word-rank">#{index + 1}</span>
                <span className="weak-word-text">{item.word}</span>
                <span className="weak-word-count">間違い: {item.mistakes}回</span>
              </div>
            ))}
            {getWeakWords(20).length === 0 && (
              <p className="no-data">まだデータがありません</p>
            )}
          </div>
        </div>
      )}

      {/* グラフセクション */}
      {activeSection === 'charts' && (
        <div className="stats-section">
          <h3>日別学習時間 (過去7日間)</h3>
          <div className="chart-container">
            {getDailyStudyTime(7).map((item) => {
              const minutes = Math.floor(item.timeSpent / 60);
              const maxMinutes = Math.max(...getDailyStudyTime(7).map(d => Math.floor(d.timeSpent / 60)), 1);
              const barHeightPercent = (minutes / maxMinutes) * 100;
              
              return (
                <div key={item.date} className="chart-bar-container">
                  <div className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      data-height={barHeightPercent}
                      title={`${minutes}分`}
                      style={{ '--bar-height': barHeightPercent } as React.CSSProperties}
                    ></div>
                  </div>
                  <div className="chart-label">{item.date.slice(5)}</div>
                  <div className="chart-value">{minutes}分</div>
                </div>
              );
            })}
            {getDailyStudyTime(7).length === 0 && (
              <p className="no-data">まだデータがありません</p>
            )}
          </div>
        </div>
      )}

      {/* データ管理ボタン */}
      <div className="data-management">
        <h3>データ管理</h3>
        <div className="management-buttons">
          <button onClick={handleExport} className="btn-export">
            📥 データをエクスポート
          </button>
          <button onClick={handleImport} className="btn-import">
            📤 データをインポート
          </button>
          <button onClick={handleClear} className="btn-clear">
            🗑️ すべてのデータをクリア
          </button>
        </div>
        <p className="management-note">
          ※ エクスポートしたデータは、別のデバイスやブラウザでインポートできます
        </p>
      </div>
    </div>
  );
}

export default StatsView;
