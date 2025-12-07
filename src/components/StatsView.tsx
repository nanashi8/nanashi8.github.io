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
  createWeakWordsQuestionSet,
  saveCustomQuestionSet,
  getCustomQuestionSets,
} from '../progressStorage';
import { QuestionSet, Question } from '../types';
import { logger } from '../logger';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
  onResetComplete?: () => void;
  onQuestionSetsUpdated?: () => Promise<void>;
}

function StatsView({ onResetComplete, allQuestions, onQuestionSetsUpdated }: StatsViewProps) {
  const [autoRefresh, _setAutoRefresh] = useState<boolean>(true);
  const [storageInfo, setStorageInfo] = useState<{ totalMB: number; details: { key: string; sizeMB: number }[] } | null>(null);
  const [hasWeakWordsSet, setHasWeakWordsSet] = useState<boolean>(false);
  
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
      logger.error('ストレージサイズの取得エラー:', error);
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
    
    // 苦手単語に詳細情報を追加
    const weakWordsBase = getCurrentWeakWords(10);
    const weakWordsWithDetails = weakWordsBase.map(w => {
      const questionData = allQuestions.find(q => q.word.toLowerCase() === w.word.toLowerCase());
      return {
        ...w,
        etymology: questionData?.etymology,
        relatedWords: questionData?.relatedWords,
        difficulty: questionData?.difficulty,
      };
    });
    setWeakWords(weakWordsWithDetails);
    
    setOvercomeWords(getOvercomeWeakWords(10));
    setRecentlyMastered(getRecentlyMasteredWords(7, 5));
    
    const progress = loadProgressSync();
    setStreakDays(progress.statistics.streakDays);
    
    getStorageSize();
  };

  // リアルタイム更新
  useEffect(() => {
    loadData();
    
    // 苦手単語セットが存在するかチェック
    const checkWeakWordsSet = async () => {
      const sets = await getCustomQuestionSets();
      const hasSet = sets.some(s => s.source === 'weak-words');
      setHasWeakWordsSet(hasSet);
    };
    checkWeakWordsSet();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
        checkWeakWordsSet();
      }, 5000);
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
                  className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="flex items-center justify-center w-8 h-8 bg-orange-500 dark:bg-orange-600 text-white font-bold rounded-full text-sm">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          {w.word}
                        </span>
                        {w.meaning && (
                          <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {w.meaning}
                          </span>
                        )}
                        {w.reading && (
                          <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {w.reading}
                          </span>
                        )}
                        {w.etymology && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            📖 {w.etymology}
                          </span>
                        )}
                        {w.relatedWords && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                            🔗 {w.relatedWords}
                          </span>
                        )}
                      </div>
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
                  </div>
                </li>
              ))}
            </ul>
            {/* 苦手語句から問題セット生成ボタン */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  try {
                    const questionSet = await createWeakWordsQuestionSet(
                      `苦手語句集 ${new Date().toLocaleDateString('ja-JP')}`,
                      20,
                      3,
                      60,
                      allQuestions
                    );
                    await saveCustomQuestionSet(questionSet);
                    setHasWeakWordsSet(true);
                    
                    // 問題セット一覧を再読み込み
                    if (onQuestionSetsUpdated) {
                      await onQuestionSetsUpdated();
                    }
                    
                    alert(`✅ 問題セット「${questionSet.name}」を${hasWeakWordsSet ? '更新' : '作成'}しました！\n和訳・暗記・スペルタブで利用できます。`);
                  } catch (error) {
                    logger.error('問題セット作成エラー:', error);
                    alert('❌ 問題セットの作成に失敗しました');
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                📚 問題セットを{hasWeakWordsSet ? '更新' : '作成'}
                <span className="text-xs opacity-90">(上位20語)</span>
              </button>
              <button
                onClick={async () => {
                  const limit = prompt('取得する苦手語句の数を入力してください（1-100）', '30');
                  if (!limit) return;
                  
                  const numLimit = parseInt(limit);
                  if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
                    alert('1から100までの数値を入力してください');
                    return;
                  }
                  
                  try {
                    const questionSet = await createWeakWordsQuestionSet(
                      `苦手語句集 ${new Date().toLocaleDateString('ja-JP')} (${numLimit}語)`,
                      numLimit,
                      3,
                      60,
                      allQuestions
                    );
                    await saveCustomQuestionSet(questionSet);
                    setHasWeakWordsSet(true);
                    
                    // 問題セット一覧を再読み込み
                    if (onQuestionSetsUpdated) {
                      await onQuestionSetsUpdated();
                    }
                    
                    alert(`✅ 問題セット「${questionSet.name}」を${hasWeakWordsSet ? '更新' : '作成'}しました！\n和訳・暗記・スペルタブで利用できます。`);
                  } catch (error) {
                    logger.error('問題セット作成エラー:', error);
                    alert('❌ 問題セットの作成に失敗しました');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                ⚙️ カスタム
              </button>
            </div>
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

// カレンダーヒートマップコンポーネント（過去2週間）
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
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // 過去2週間（14日間）の日付を生成
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13); // 今日を含む14日間
  
  // データをマップに変換（日付がキー）
  const dataMap = new Map(data.map(d => [d.date, d]));
  
  // 2週間分のデータを曜日ごとに整理（月〜日の7列 × 2行）
  const weeks: Array<Array<{ date: string; count: number; accuracy: number; mastered: number } | null>> = [[], []];
  const currentDate = new Date(twoWeeksAgo);
  
  // 最初の週の開始曜日を月曜日に調整
  const startDayOfWeek = currentDate.getDay();
  const diffToMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  currentDate.setDate(currentDate.getDate() - diffToMonday);
  
  // 2週間分のデータを配置
  for (let week = 0; week < 2; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr);
      
      // 過去2週間の範囲外の日付はnullにする
      if (currentDate < twoWeeksAgo || currentDate > today) {
        weeks[week].push(null);
      } else {
        // 定着済み数を計算（正解率80%以上を定着済みとする）
        const mastered = dayData ? Math.round(dayData.count * dayData.accuracy / 100 * 0.8) : 0;
        weeks[week].push(dayData ? { ...dayData, mastered } : { date: dateStr, count: 0, accuracy: 0, mastered: 0 });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
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
    <div className="w-full max-w-5xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-blue-200 dark:border-gray-600">
      {/* グリッドレイアウト */}
      <div className="overflow-x-auto">
        <div className="min-w-max mx-auto w-fit">
          {/* 曜日ラベル */}
          <div className="flex gap-2 mb-2">
            {dayLabels.map((label, idx) => (
              <div key={idx} className="w-20 h-8 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">
                {label}
              </div>
            ))}
          </div>
          
          {/* カレンダーグリッド - 2週間 */}
          <div className="flex flex-col gap-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-2">
                {week.map((day, dayIdx) => {
                  if (!day) {
                    return <div key={dayIdx} className="w-20 h-20 rounded bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600"></div>;
                  }
                  
                  const date = new Date(day.date);
                  const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
                  const isToday = day.date === todayStr;
                  const colorClasses = {
                    'calendar-color-0': 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400',
                    'calendar-color-1': 'bg-blue-300 dark:bg-blue-800 text-blue-900 dark:text-blue-100',
                    'calendar-color-2': 'bg-blue-400 dark:bg-blue-700 text-white',
                    'calendar-color-3': 'bg-blue-500 dark:bg-blue-600 text-white',
                    'calendar-color-4': 'bg-blue-600 dark:bg-blue-500 text-white',
                  };
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`w-20 h-20 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer border-2 ${
                        colorClasses[getColorClass(day.count) as keyof typeof colorClasses]
                      } ${
                        isToday ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 shadow-2xl border-yellow-400' : 'border-transparent'
                      }`}
                      title={`${day.date} (${dayName})${isToday ? ' [今日]' : ''}: ${day.count}問 (正答率${day.accuracy.toFixed(0)}%)`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-base">{day.mastered}</span>
                        <span className="text-[10px] opacity-80">/</span>
                        <span className="text-sm">{day.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 凡例 */}
      <div className="flex flex-col gap-2 mt-6 text-sm">
        <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300">
          <span className="font-medium">学習量:</span>
          <span className="text-xs">少</span>
          <div className="w-8 h-8 rounded bg-blue-300 dark:bg-blue-800 border border-gray-300"></div>
          <div className="w-8 h-8 rounded bg-blue-400 dark:bg-blue-700 border border-gray-300"></div>
          <div className="w-8 h-8 rounded bg-blue-500 dark:bg-blue-600 border border-gray-300"></div>
          <div className="w-8 h-8 rounded bg-blue-600 dark:bg-blue-500 border border-gray-300"></div>
          <span className="text-xs">多</span>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold">表示:</span> 定着済/出題数 | 
          <span className="ml-2 inline-block w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 border-2 border-yellow-400 align-middle"></span>
          <span className="ml-1">= 今日</span>
        </div>
      </div>
    </div>
  );
}

export default StatsView;
