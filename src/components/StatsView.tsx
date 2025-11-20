import { useState, useEffect } from 'react';
import {
  getStatsByModeDifficulty,
  resetStatsByModeDifficulty,
  resetAllProgress,
  loadProgressSync,
  getStudyCalendarData,
  getWeeklyStats,
  getMonthlyStats,
  getCumulativeProgressData,
  getRetentionTrend,
  getWeakWords,
  getCurrentWeakWords,
  getOvercomeWeakWords,
  getRecentlyMasteredWords,
} from '../progressStorage';
import { QuestionSet, Question } from '../types';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
}

interface DifficultyStats {
  labels: string[];
  accuracyData: number[];
  retentionData: number[];
}

function StatsView({ }: StatsViewProps) {
  const [translationStats, setTranslationStats] = useState<DifficultyStats>({ labels: [], accuracyData: [], retentionData: [] });
  const [spellingStats, setSpellingStats] = useState<DifficultyStats>({ labels: [], accuracyData: [], retentionData: [] });
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [storageInfo, setStorageInfo] = useState<{ totalMB: number; details: { key: string; sizeMB: number }[] } | null>(null);
  
  // 新しい統計データ
  const [calendarData, setCalendarData] = useState<Array<{ date: string; count: number; accuracy: number }>>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [cumulativeData, setCumulativeData] = useState<any[]>([]);
  const [retentionTrend, setRetentionTrend] = useState<any>(null);
  const [weakWords, setWeakWords] = useState<any[]>([]);
  const [overcomeWords, setOvercomeWords] = useState<any[]>([]);
  const [recentlyMastered, setRecentlyMastered] = useState<any[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);

  // LocalStorageサイズを取得
  const getStorageSize = () => {
    try {
      let totalSize = 0;
      const details: { key: string; sizeMB: number }[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;
            details.push({ key, sizeMB: size / (1024 * 1024) });
          }
        }
      }
      
      details.sort((a, b) => b.sizeMB - a.sizeMB);
      setStorageInfo({ totalMB: totalSize / (1024 * 1024), details: details.slice(0, 5) });
    } catch (error) {
      console.error('ストレージサイズの取得エラー:', error);
    }
  };

  // データ読み込み
  const loadData = () => {
    const translationData = getStatsByModeDifficulty('translation');
    const spellingData = getStatsByModeDifficulty('spelling');
    setTranslationStats(translationData);
    setSpellingStats(spellingData);
    
    // 新しい統計データを読み込み
    setCalendarData(getStudyCalendarData(90));
    setWeeklyStats(getWeeklyStats());
    setMonthlyStats(getMonthlyStats());
    setCumulativeData(getCumulativeProgressData(12));
    setRetentionTrend(getRetentionTrend());
    setWeakWords(getCurrentWeakWords(10));
    setOvercomeWords(getOvercomeWeakWords(10));
    setRecentlyMastered(getRecentlyMasteredWords(7, 5));
    
    const progress = loadProgressSync();
    setStreakDays(progress.statistics.streakDays);
    
    getStorageSize();
  };

  // リアルタイム更新
  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // 難易度別リセット
  const handleResetByDifficulty = (mode: 'translation' | 'spelling', difficulty: string) => {
    const modeName = mode === 'translation' ? '和訳タブ' : 'スペルタブ';
    const difficultyName = difficulty === 'beginner' ? '初級' : difficulty === 'intermediate' ? '中級' : '上級';
    
    if (confirm(`${modeName}の${difficultyName}の成績をリセットしますか？この操作は元に戻せません。`)) {
      resetStatsByModeDifficulty(mode, difficulty);
      alert('成績をリセットしました');
      loadData();
    }
  };

  // 全成績リセット
  const handleResetAll = () => {
    if (confirm('本当にすべての学習記録を削除しますか？この操作は元に戻せません。')) {
      // resetAllProgressを使用して完全リセット
      resetAllProgress();
      
      // UIを即座に更新
      setTranslationStats({ labels: [], accuracyData: [], retentionData: [] });
      setSpellingStats({ labels: [], accuracyData: [], retentionData: [] });
      setCalendarData([]);
      setWeeklyStats(null);
      setMonthlyStats(null);
      setCumulativeData([]);
      setRetentionTrend(null);
      setWeakWords([]);
      setOvercomeWords([]);
      setRecentlyMastered([]);
      setStreakDays(0);
      
      alert('学習記録をリセットしました');
      loadData(); // データを再読み込み
    }
  };

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>📊 成績</h2>
        <div className="stats-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            自動更新
          </label>
        </div>
      </div>

      {/* ダッシュボード */}
      <div className="stats-dashboard">
        <div className="dashboard-card">
          <div className="dashboard-icon">🔥</div>
          <div className="dashboard-content">
            <div className="dashboard-label">連続学習日数</div>
            <div className="dashboard-value">{streakDays}日</div>
          </div>
        </div>
        
        {weeklyStats && (
          <div className="dashboard-card">
            <div className="dashboard-icon">📅</div>
            <div className="dashboard-content">
              <div className="dashboard-label">今週の学習</div>
              <div className="dashboard-value">{weeklyStats.studyDays}/{weeklyStats.totalDays}日</div>
              <div className="dashboard-sub">{weeklyStats.totalAnswered}問回答</div>
            </div>
          </div>
        )}
        
        {monthlyStats && (
          <div className="dashboard-card">
            <div className="dashboard-icon">📊</div>
            <div className="dashboard-content">
              <div className="dashboard-label">今月の進捗</div>
              <div className="dashboard-value">{monthlyStats.studyDays}/{monthlyStats.totalDays}日</div>
              <div className="dashboard-sub">定着+{monthlyStats.newMastered}語</div>
            </div>
          </div>
        )}
        
        {retentionTrend && (
          <div className="dashboard-card">
            <div className="dashboard-icon">📈</div>
            <div className="dashboard-content">
              <div className="dashboard-label">定着率トレンド</div>
              <div className="dashboard-value">{retentionTrend.allTime.toFixed(1)}%</div>
              <div className="dashboard-sub">
                7日: {retentionTrend.last7Days.toFixed(1)}% / 30日: {retentionTrend.last30Days.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 週次サマリー */}
      {weeklyStats && (
        <div className="stats-section-summary">
          <h3>📅 今週の成果</h3>
          <div className="weekly-summary">
            <div className="summary-item">
              <span className="summary-label">✅ 学習日数</span>
              <span className="summary-value">{weeklyStats.studyDays}/7日</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">📝 総回答数</span>
              <span className="summary-value">{weeklyStats.totalAnswered}問</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">🎯 正答率</span>
              <span className="summary-value">
                {weeklyStats.accuracy.toFixed(1)}%
                {weeklyStats.previousWeekAccuracy > 0 && (
                  <span className={weeklyStats.accuracy >= weeklyStats.previousWeekAccuracy ? 'trend-up' : 'trend-down'}>
                    {' '}({weeklyStats.accuracy >= weeklyStats.previousWeekAccuracy ? '▲' : '▼'}
                    {Math.abs(weeklyStats.accuracy - weeklyStats.previousWeekAccuracy).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">🌟 新規定着</span>
              <span className="summary-value">{weeklyStats.newMastered}語</span>
            </div>
            {recentlyMastered.length > 0 && (
              <div className="summary-item">
                <span className="summary-label">💪 克服した単語</span>
                <span className="summary-value">{recentlyMastered.length}語</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 学習カレンダーヒートマップ */}
      <div className="stats-section-calendar">
        <h3>📆 学習カレンダー（過去12週間）</h3>
        <CalendarHeatmap data={calendarData} />
      </div>

      {/* 累積成長グラフ */}
      {cumulativeData.length > 0 && (
        <div className="stats-section-growth">
          <h3>📈 累積成長グラフ（週別）</h3>
          <CumulativeGrowthChart data={cumulativeData} />
        </div>
      )}

      {/* 苦手単語 & 克服した単語 */}
      <div className="stats-section-words">
        <div className="words-column">
          <h3>😰 苦手単語トップ10（要復習）</h3>
          {weakWords.length > 0 ? (
            <ul className="word-list">
              {weakWords.map((w, idx) => (
                <li key={idx} className="word-item weak">
                  <span className="word-rank">#{idx + 1}</span>
                  <span className="word-text">{w.word}</span>
                  <span className="word-stats">
                    ❌{w.mistakes}回
                    {w.recentAccuracy > 0 && (
                      <span className="word-accuracy"> ({w.recentAccuracy}%)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">苦手な単語はありません！🎉</p>
          )}
        </div>
        
        <div className="words-column">
          <h3>✨ 克服した苦手単語</h3>
          {overcomeWords.length > 0 ? (
            <ul className="word-list">
              {overcomeWords.map((w, idx) => (
                <li key={idx} className="word-item overcome">
                  <span className="word-text">{w.word}</span>
                  <span className="word-stats overcome-stats">
                    <span className="overcome-before">❌{w.totalMistakes}回</span>
                    <span className="overcome-arrow">→</span>
                    <span className="overcome-after">📈{w.recentAccuracy}%</span>
                    <span className="overcome-badge">🎉</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">まだ克服した苦手単語はありません</p>
          )}
        </div>
        
        <div className="words-column">
          <h3>🎉 最近克服した単語</h3>
          {recentlyMastered.length > 0 ? (
            <ul className="word-list">
              {recentlyMastered.map((w, idx) => (
                <li key={idx} className="word-item mastered">
                  <span className="word-text">{w.word}</span>
                  <span className="word-stats">
                    {new Date(w.masteredDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    <span className="word-attempts">({w.totalAttempts}回)</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">データがありません</p>
          )}
        </div>
      </div>

      {/* 和訳タブの統計 */}
      <div className="stats-section-mode">
        <h3>📖 和訳タブ</h3>
        
        <div className="stats-charts-row">
          {/* 正答率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 正答率</h4>
            <SimpleRadarChart
              labels={translationStats.labels}
              data={translationStats.accuracyData}
              maxValue={100}
              color="rgba(102, 126, 234, 0.6)"
            />
          </div>

          {/* 定着率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 定着率</h4>
            <SimpleRadarChart
              labels={translationStats.labels}
              data={translationStats.retentionData}
              maxValue={100}
              color="rgba(76, 175, 80, 0.6)"
            />
          </div>
        </div>

        {/* リセットボタン */}
        <div className="stats-reset-buttons">
          <button onClick={() => handleResetByDifficulty('translation', 'beginner')} className="btn-reset-difficulty">
            初級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('translation', 'intermediate')} className="btn-reset-difficulty">
            中級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('translation', 'advanced')} className="btn-reset-difficulty">
            上級をリセット
          </button>
        </div>
      </div>

      {/* スペルタブの統計 */}
      <div className="stats-section-mode">
        <h3>✍️ スペルタブ</h3>
        
        <div className="stats-charts-row">
          {/* 正答率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 正答率</h4>
            <SimpleRadarChart
              labels={spellingStats.labels}
              data={spellingStats.accuracyData}
              maxValue={100}
              color="rgba(255, 152, 0, 0.6)"
            />
          </div>

          {/* 定着率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 定着率</h4>
            <SimpleRadarChart
              labels={spellingStats.labels}
              data={spellingStats.retentionData}
              maxValue={100}
              color="rgba(233, 30, 99, 0.6)"
            />
          </div>
        </div>

        {/* リセットボタン */}
        <div className="stats-reset-buttons">
          <button onClick={() => handleResetByDifficulty('spelling', 'beginner')} className="btn-reset-difficulty">
            初級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('spelling', 'intermediate')} className="btn-reset-difficulty">
            中級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('spelling', 'advanced')} className="btn-reset-difficulty">
            上級をリセット
          </button>
        </div>
      </div>

      {/* 全体リセット */}
      <div className="stats-section-reset">
        <button onClick={handleResetAll} className="btn-reset-all">
          ⚠️ すべての成績をリセット
        </button>
      </div>

      {/* ストレージ情報 */}
      {storageInfo && (
        <div className="stats-section-storage">
          <h3>💾 ストレージ使用量</h3>
          <div className="storage-info">
            <p className={storageInfo.totalMB > 4 ? 'storage-warning' : ''}>
              <strong>合計:</strong> {storageInfo.totalMB.toFixed(2)} MB / 約 5-10 MB
              {storageInfo.totalMB > 4 && ' ⚠️ 容量が不足しています'}
            </p>
            <details>
              <summary>詳細を表示</summary>
              <ul>
                {storageInfo.details.map((item, idx) => (
                  <li key={idx}>
                    <code>{item.key}</code>: {item.sizeMB.toFixed(2)} MB
                  </li>
                ))}
              </ul>
              <p className="storage-note">
                💡 ヒント: データが大きくなりすぎた場合は、古い成績を削除すると容量を節約できます。
              </p>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

// カレンダーヒートマップコンポーネント
function CalendarHeatmap({ data }: { data: Array<{ date: string; count: number; accuracy: number }> }) {
  if (data.length === 0) {
    return <div className="calendar-empty">データがありません</div>;
  }

  // 過去12週間のデータを週ごとにグループ化
  const weeks: Array<Array<{ date: string; count: number; accuracy: number }>> = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // 色の濃さを決定
  const getColorClass = (count: number) => {
    if (count === 0) return 'calendar-color-0';
    if (count < 10) return 'calendar-color-1';
    if (count < 20) return 'calendar-color-2';
    if (count < 30) return 'calendar-color-3';
    return 'calendar-color-4';
  };

  return (
    <div className="calendar-heatmap">
      <div className="calendar-grid">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="calendar-week">
            {week.map((day, dayIdx) => {
              const date = new Date(day.date);
              const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
              return (
                <div
                  key={dayIdx}
                  className={`calendar-day ${getColorClass(day.count)}`}
                  title={`${day.date} (${dayName}): ${day.count}問 (${day.accuracy.toFixed(0)}%)`}
                >
                  {day.count > 0 && <span className="calendar-day-count">{day.count}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="calendar-legend">
        <span>少ない</span>
        <div className="legend-box legend-box-color-1"></div>
        <div className="legend-box legend-box-color-2"></div>
        <div className="legend-box legend-box-color-3"></div>
        <div className="legend-box legend-box-color-4"></div>
        <div className="legend-box legend-box-color-5"></div>
        <span>多い</span>
      </div>
    </div>
  );
}

// 累積成長グラフコンポーネント
function CumulativeGrowthChart({ data }: {
  data: Array<{
    weekLabel: string;
    cumulativeMastered: number;
    weeklyMastered: number;
    cumulativeAnswered: number;
    weeklyAnswered: number;
  }>
}) {
  if (data.length === 0) {
    return <div className="chart-empty">データがありません</div>;
  }

  const maxMastered = Math.max(...data.map(d => d.cumulativeMastered), 1);
  const maxAnswered = Math.max(...data.map(d => d.cumulativeAnswered), 1);
  
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = 40;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  return (
    <div className="cumulative-chart">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* グリッド線 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + plotHeight * (1 - ratio);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={y}
                textAnchor="end"
                fontSize="10"
                fill="#666"
              >
                {Math.round(maxMastered * ratio)}
              </text>
            </g>
          );
        })}

        {/* 定着数の線グラフ */}
        <polyline
          points={data.map((d, i) => {
            const x = padding + (plotWidth / (data.length - 1)) * i;
            const y = padding + plotHeight * (1 - d.cumulativeMastered / maxMastered);
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#ff6b35"
          strokeWidth="3"
        />

        {/* データポイント */}
        {data.map((d, i) => {
          const x = padding + (plotWidth / (data.length - 1)) * i;
          const y = padding + plotHeight * (1 - d.cumulativeMastered / maxMastered);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#ff6b35" />
              {i % 2 === 0 && (
                <text
                  x={x}
                  y={chartHeight - padding + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#666"
                >
                  {d.weekLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* ラベル */}
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
        >
          週
        </text>
        <text
          x={15}
          y={chartHeight / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          transform={`rotate(-90 15 ${chartHeight / 2})`}
        >
          累積定着数
        </text>
      </svg>
      
      <div className="chart-summary">
        <div className="chart-summary-item">
          <span className="summary-label">開始時:</span>
          <span className="summary-value">{data[0]?.cumulativeMastered || 0}語</span>
        </div>
        <div className="chart-summary-item">
          <span className="summary-label">現在:</span>
          <span className="summary-value">{data[data.length - 1]?.cumulativeMastered || 0}語</span>
        </div>
        <div className="chart-summary-item">
          <span className="summary-label">増加:</span>
          <span className="summary-value">
            +{(data[data.length - 1]?.cumulativeMastered || 0) - (data[0]?.cumulativeMastered || 0)}語
          </span>
        </div>
      </div>
    </div>
  );
}

// シンプルなレーダーチャートコンポーネント
function SimpleRadarChart({ labels, data, maxValue, color }: {
  labels: string[];
  data: number[];
  maxValue: number;
  color: string;
}) {
  const size = 300;
  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const numPoints = labels.length;
  
  // ダークモード判定
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  if (numPoints === 0) {
    return <div className="radar-chart-empty">データがありません</div>;
  }

  // 各頂点の座標を計算
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = (value / maxValue) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  // 背景のグリッド線
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPaths = gridLevels.map(level => {
    const points = Array.from({ length: numPoints }, (_, i) => {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const radius = maxRadius * level;
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
    });
    return points.join(' ');
  });

  // データのパス
  const dataPoints = data.map((value, i) => getPoint(i, value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <div className="radar-chart-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* グリッド */}
        {gridPaths.map((path, i) => (
          <polygon
            key={i}
            points={path}
            fill="none"
            stroke={isDarkMode ? "#555" : "#ddd"}
            strokeWidth="1"
          />
        ))}

        {/* 軸線 */}
        {Array.from({ length: numPoints }, (_, i) => {
          const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angle)}
              y2={center + maxRadius * Math.sin(angle)}
              stroke={isDarkMode ? "#555" : "#ddd"}
              strokeWidth="1"
            />
          );
        })}

        {/* データエリア */}
        <path
          d={dataPath}
          fill={color}
          stroke={color.replace('0.6', '1')}
          strokeWidth="2"
        />

        {/* データポイント */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color.replace('0.6', '1')}
          />
        ))}

        {/* ラベル */}
        {labels.map((label, i) => {
          const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
          const labelRadius = maxRadius + 25;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="bold"
              fill={isDarkMode ? "#e0e0e0" : "#333"}
            >
              {label}
              <tspan x={x} dy="15" fontSize="12" fill={isDarkMode ? "#b0b0b0" : "#666"}>
                {data[i].toFixed(1)}%
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default StatsView;
