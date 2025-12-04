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
      <div className="w-full max-w-5xl mx-auto mb-4 px-2">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
          📆 学習カレンダー
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">（過去12週間）</span>
        </h3>
        <CalendarHeatmap data={calendarData} />
      </div>

      {/* 苦手単語トップ10 */}
      <div className="w-full max-w-5xl mx-auto mb-4 px-2">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
          😰 苦手単語トップ10
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">（要復習）</span>
        </h3>
        {weakWords.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-orange-200 dark:border-orange-700 p-6">
            <ul className="space-y-3">
              {weakWords.map((w, idx) => (
                <li 
                  key={idx} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="flex items-center justify-center w-8 h-8 bg-orange-500 dark:bg-orange-600 text-white font-bold rounded-full text-sm">
                      {idx + 1}
                    </span>
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {w.word}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full font-medium">
                      ❌ {w.mistakes}回
                    </span>
                    {w.recentAccuracy > 0 && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                        正解率 {w.recentAccuracy}%
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700 p-8 text-center">
            <p className="text-xl font-semibold text-green-700 dark:text-green-300">苦手な単語はありません！🎉</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">順調に学習が進んでいます</p>
          </div>
        )}
      </div>

      {/* 全体リセット */}
      <div className="w-full max-w-5xl mx-auto mb-4 px-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-red-200 dark:border-red-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                ⚠️ データのリセット
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                すべての学習記録を削除します。この操作は元に戻せません。
              </p>
            </div>
            <button 
              onClick={handleResetAll} 
              className="px-8 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              🗑️ リセット実行
            </button>
          </div>
        </div>
      </div>

      {/* ストレージ情報 */}
      {storageInfo && (
        <div className="w-full max-w-5xl mx-auto mb-4 px-2">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            💾 ストレージ使用量
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-purple-200 dark:border-purple-700 p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  合計使用量
                </span>
                <span className={`text-xl font-bold ${storageInfo.totalMB > 4 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {storageInfo.totalMB.toFixed(2)} MB <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ 約 5-10 MB</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 absolute left-0 top-0 ${
                    storageInfo.totalMB > 8 ? 'bg-red-600 w-full' :
                    storageInfo.totalMB > 4 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  data-progress={Math.min((storageInfo.totalMB / 10) * 100, 100)}
                />
              </div>
              {storageInfo.totalMB > 4 && (
                <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                  ⚠️ 容量が不足しています
                </p>
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2">
                📊 詳細を表示
              </summary>
              <ul className="mt-4 space-y-2">
                {storageInfo.details.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">{item.key}</code>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.sizeMB.toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span>ヒント: データが大きくなりすぎた場合は、古い成績を削除すると容量を節約できます。</span>
                </p>
              </div>
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
    return (
      <div className="w-full max-w-5xl mx-auto p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">📊 データがありません</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">学習を開始するとヒートマップが表示されます</p>
      </div>
    );
  }

  // 今日の日付を取得（YYYY-MM-DD形式）
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // データを日付順にソート（古い順）
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // データをマップに変換（日付がキー）
  const dataMap = new Map(sortedData.map(d => [d.date, d]));
  
  // 最も古い日付と最も新しい日付を取得
  const oldestDate = sortedData.length > 0 ? new Date(sortedData[0].date) : new Date();
  const newestDate = sortedData.length > 0 ? new Date(sortedData[sortedData.length - 1].date) : new Date();
  
  // 最も古い日付の週の月曜日を開始日とする
  const startDate = new Date(oldestDate);
  const dayOfWeek = startDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 日曜の場合は6日戻す、それ以外は月曜まで戻す
  startDate.setDate(startDate.getDate() - diffToMonday);
  
  // 週ごとにデータを整理（各週が列、各曜日が行）
  const weeks: Array<Array<{ date: string; count: number; accuracy: number } | null>> = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= newestDate) {
    const week: Array<{ date: string; count: number; accuracy: number } | null> = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr);
      week.push(dayData || { date: dateStr, count: 0, accuracy: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }
  
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
    <div className="w-full max-w-5xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-blue-200 dark:border-gray-600">
      {/* グリッドレイアウト */}
      <div className="overflow-x-auto">
        <div className="min-w-max mx-auto w-fit">
          {/* カレンダーグリッド - 横スクロール対応 */}
          <div className="flex gap-1">
            {/* 曜日ラベル列 */}
            <div className="flex flex-col gap-0.5">
              {dayLabels.map((label, idx) => (
                <div key={idx} className="w-8 h-8 flex items-center justify-end pr-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {label}
                </div>
              ))}
            </div>
            
            {/* 週ごとの列 */}
            <div className="flex gap-0.5">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-0.5">
                  {week.map((day, dayIdx) => {
                    if (!day) return <div key={dayIdx} className="w-8 h-8"></div>;
                    
                    const date = new Date(day.date);
                    const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
                    const isToday = day.date === todayStr;
                    const colorClasses = {
                      'calendar-color-0': 'bg-gray-300 dark:bg-gray-600',
                      'calendar-color-1': 'bg-blue-400 dark:bg-blue-700',
                      'calendar-color-2': 'bg-blue-500 dark:bg-blue-600',
                      'calendar-color-3': 'bg-blue-600 dark:bg-blue-500',
                      'calendar-color-4': 'bg-blue-700 dark:bg-blue-400',
                    };
                    return (
                      <div
                        key={dayIdx}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer ${
                          colorClasses[getColorClass(day.count) as keyof typeof colorClasses]
                        } text-white ${
                          isToday ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 shadow-lg' : ''
                        }`}
                        title={`${day.date} (${dayName})${isToday ? ' [今日]' : ''}: ${day.count}問 (${day.accuracy.toFixed(0)}%)`}
                      >
                        <span>{day.count}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 凡例 */}
      <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium">少ない</span>
        <div className="w-6 h-6 rounded bg-blue-400 dark:bg-blue-700 border border-gray-300 dark:border-gray-600"></div>
        <div className="w-6 h-6 rounded bg-blue-500 dark:bg-blue-600 border border-gray-300 dark:border-gray-600"></div>
        <div className="w-6 h-6 rounded bg-blue-600 dark:bg-blue-500 border border-gray-300 dark:border-gray-600"></div>
        <div className="w-6 h-6 rounded bg-blue-700 dark:bg-blue-400 border border-gray-300 dark:border-gray-600"></div>
        <span className="font-medium">多い</span>
        <div className="ml-4 w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 border-2 border-yellow-400 shadow-md"></div>
        <span className="font-medium">← 今日</span>
      </div>
    </div>
  );
}

export default StatsView;
