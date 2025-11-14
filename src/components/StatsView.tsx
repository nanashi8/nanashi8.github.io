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
import { QuestionSet, Question } from '../types';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
}

function StatsView({ questionSets, allQuestions, categoryList }: StatsViewProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'radar' | 'weakwords' | 'charts'>('overview');

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
          className={activeSection === 'radar' ? 'active' : ''}
          onClick={() => setActiveSection('radar')}
        >
          分野別
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

      {/* 分野別レーダーチャート */}
      {activeSection === 'radar' && (
        <div className="stats-section">
          <h3>📊 関連分野別の学習状況</h3>
          <div className="radar-container">
            <div className="radar-chart">
              {(() => {
                // 主要な分野から上位8つを選択
                const majorCategories = ['動詞', '名詞', '形容詞', '評価', '動作', '概念', '社会', '自然'];
                const categoryStats = majorCategories.map(category => {
                  const categoryWords = allQuestions.filter(q => q.category === category);
                  const results = getRecentResults(100).filter(r => r.category === category);
                  const avgScore = results.length > 0
                    ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
                    : 0;
                  return {
                    category,
                    score: avgScore,
                    attempts: results.length,
                    totalWords: categoryWords.length
                  };
                });

                const maxScore = 100;
                const centerX = 150;
                const centerY = 150;
                const radius = 120;
                const angleStep = (Math.PI * 2) / categoryStats.length;

                // レーダーチャート用の座標計算
                const getPoint = (index: number, score: number) => {
                  const angle = angleStep * index - Math.PI / 2;
                  const r = (score / maxScore) * radius;
                  return {
                    x: centerX + r * Math.cos(angle),
                    y: centerY + r * Math.sin(angle)
                  };
                };

                // ポリゴンのパスを生成
                const polygonPath = categoryStats
                  .map((stat, index) => {
                    const point = getPoint(index, stat.score);
                    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
                  })
                  .join(' ') + ' Z';

                // グリッドライン用
                const gridLevels = [20, 40, 60, 80, 100];
                const gridPaths = gridLevels.map(level => {
                  return categoryStats
                    .map((_, index) => {
                      const point = getPoint(index, level);
                      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
                    })
                    .join(' ') + ' Z';
                });

                return (
                  <svg viewBox="0 0 300 300" className="radar-svg">
                    {/* グリッド */}
                    {gridPaths.map((path, i) => (
                      <path
                        key={i}
                        d={path}
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* 軸 */}
                    {categoryStats.map((_, index) => {
                      const endPoint = getPoint(index, 100);
                      return (
                        <line
                          key={index}
                          x1={centerX}
                          y1={centerY}
                          x2={endPoint.x}
                          y2={endPoint.y}
                          stroke="#ddd"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* データポリゴン */}
                    <path
                      d={polygonPath}
                      fill="rgba(102, 126, 234, 0.3)"
                      stroke="#667eea"
                      strokeWidth="2"
                    />

                    {/* データポイント */}
                    {categoryStats.map((stat, index) => {
                      const point = getPoint(index, stat.score);
                      return (
                        <circle
                          key={index}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#667eea"
                        />
                      );
                    })}

                    {/* ラベル */}
                    {categoryStats.map((stat, index) => {
                      const angle = angleStep * index - Math.PI / 2;
                      const labelRadius = radius + 30;
                      const labelX = centerX + labelRadius * Math.cos(angle);
                      const labelY = centerY + labelRadius * Math.sin(angle);
                      return (
                        <text
                          key={index}
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#333"
                        >
                          {stat.category}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>

          <div className="category-stats-table">
            <h4>分野別詳細</h4>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>分野</th>
                  <th>総語数</th>
                  <th>学習回数</th>
                  <th>平均正答率</th>
                </tr>
              </thead>
              <tbody>
                {categoryList.slice(0, 20).map(category => {
                  const categoryWords = allQuestions.filter(q => q.category === category);
                  const results = getRecentResults(100).filter(r => r.category === category);
                  const avgScore = results.length > 0
                    ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
                    : 0;
                  
                  return (
                    <tr key={category}>
                      <td>{category}</td>
                      <td>{categoryWords.length}語</td>
                      <td>{results.length}回</td>
                      <td>{avgScore > 0 ? `${avgScore.toFixed(1)}%` : '-'}</td>
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
          <h3>📋 最近の学習履歴</h3>
          <div className="history-table-container">
            <table className="stats-table history-table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>分野</th>
                  <th>難易度</th>
                  <th>モード</th>
                  <th>問題数</th>
                  <th>正解数</th>
                  <th>正答率</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                {getRecentResults(30).map((result: QuizResult) => {
                  const date = new Date(result.date);
                  const modeEmoji = result.mode === 'translation' ? '🇯🇵' : result.mode === 'spelling' ? '✍️' : '📖';
                  const minutes = Math.floor(result.timeSpent / 60);
                  const seconds = result.timeSpent % 60;
                  const scoreClass = result.percentage >= 80 ? 'score-high' : result.percentage >= 60 ? 'score-mid' : 'score-low';
                  
                  return (
                    <tr key={result.id}>
                      <td>{date.toLocaleDateString('ja-JP')} {date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{result.category || '-'}</td>
                      <td>{result.difficulty || '-'}</td>
                      <td>{modeEmoji}</td>
                      <td>{result.total}</td>
                      <td>{result.score}</td>
                      <td className={scoreClass}>{result.percentage.toFixed(0)}%</td>
                      <td>{minutes}:{seconds.toString().padStart(2, '0')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {getRecentResults(30).length === 0 && (
              <p className="no-data">まだ学習履歴がありません</p>
            )}
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
