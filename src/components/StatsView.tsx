import { useState, useEffect } from 'react';
import {
  getStatsByModeDifficulty as _getStatsByModeDifficulty,
  resetStatsByModeDifficulty,
  resetAllProgress,
  loadProgressSync,
  getStudyCalendarData,
  getWeeklyStats,
  getMonthlyStats,
  getCumulativeProgressData,
  getRetentionTrend,
  getWeakWords as _getWeakWords,
  getCurrentWeakWords,
  getOvercomeWeakWords,
  getRecentlyMasteredWords,
} from '../progressStorage';
import { QuestionSet, Question } from '../types';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
  onResetComplete?: () => void;
}

function StatsView({ onResetComplete }: StatsViewProps) {
  const [autoRefresh, _setAutoRefresh] = useState<boolean>(true);
  const [storageInfo, setStorageInfo] = useState<{ totalMB: number; details: { key: string; sizeMB: number }[] } | null>(null);
  
  // 新しい統計データ
  const [calendarData, setCalendarData] = useState<Array<{ date: string; count: number; accuracy: number }>>([]);
  const [_weeklyStats, setWeeklyStats] = useState<any>(null);
  const [_monthlyStats, setMonthlyStats] = useState<any>(null);
  const [_cumulativeData, setCumulativeData] = useState<any[]>([]);
  const [_retentionTrend, setRetentionTrend] = useState<any>(null);
  const [weakWords, setWeakWords] = useState<any[]>([]);
  const [_overcomeWords, setOvercomeWords] = useState<any[]>([]);
  const [_recentlyMastered, setRecentlyMastered] = useState<any[]>([]);
  const [_streakDays, setStreakDays] = useState<number>(0);

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
  const _handleResetByDifficulty = (mode: 'translation' | 'spelling', difficulty: string) => {
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
      
      // 成績タブを表示
      if (onResetComplete) {
        onResetComplete();
      }
    }
  };

  return (
    <div className="stats-view">
      {/* 学習カレンダーヒートマップ */}
      <div className="stats-section-calendar">
        <h3>📆 学習カレンダー（過去12週間）</h3>
        <CalendarHeatmap data={calendarData} />
      </div>

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
      </div>

      {/* 全体リセット */}
      <div className="stats-section-reset">
        <button onClick={handleResetAll} className="btn-reset-all">
          成績をリセット
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

  // データを日付順にソート（古い順）
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // データを曜日ごとにグループ化（各行が同じ曜日）
  const dayRows: Array<Array<{ date: string; count: number; accuracy: number; dayOfWeek: number }>> = [[], [], [], [], [], [], []];
  
  sortedData.forEach(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay(); // 0=日曜, 1=月曜, ..., 6=土曜
    dayRows[dayOfWeek].push({ ...day, dayOfWeek });
  });
  
  // 月曜始まりに並び替え（月火水木金土日）
  const reorderedRows = [
    dayRows[1], // 月曜
    dayRows[2], // 火曜
    dayRows[3], // 水曜
    dayRows[4], // 木曜
    dayRows[5], // 金曜
    dayRows[6], // 土曜
    dayRows[0]  // 日曜
  ];

  // 色の濃さを決定
  const getColorClass = (count: number) => {
    if (count === 0) return 'calendar-color-0';
    if (count < 10) return 'calendar-color-1';
    if (count < 20) return 'calendar-color-2';
    if (count < 30) return 'calendar-color-3';
    return 'calendar-color-4';
  };

  const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className="calendar-heatmap">
      <div className="calendar-grid">
        {reorderedRows.map((row, rowIdx) => (
          <div key={rowIdx} className="calendar-week">
            <div className="calendar-day-label">{dayLabels[rowIdx]}</div>
            {row.map((day, dayIdx) => {
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

export default StatsView;
