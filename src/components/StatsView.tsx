import { useState, useEffect, useCallback } from 'react';
import {
  getStatsByModeDifficulty as _getStatsByModeDifficulty,
  resetStatsByModeDifficulty,
  resetAllProgress,
  loadProgressSync,
  getStudyCalendarByMode,
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
import { logger } from '@/utils/logger';
import { formatLocalYYYYMMDD, QUIZ_RESULT_EVENT } from '../utils';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
  onResetComplete?: () => void;
  onQuestionSetsUpdated?: () => Promise<void>;
}

interface WeakWord {
  word: string;
  meaning?: string;
  reading?: string;
  etymology?: string;
  relatedWords?: string;
  difficulty?: string;
  mistakes: number;
  recentAccuracy: number;
}

function StatsView({ onResetComplete, allQuestions, onQuestionSetsUpdated }: StatsViewProps) {
  const [autoRefresh, _setAutoRefresh] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<{
    totalMB: number;
    details: { key: string; sizeMB: number }[];
  } | null>(null);
  const [hasWeakWordsSet, setHasWeakWordsSet] = useState<boolean>(false);

  // 新しい統計データ
  const [_weeklyStats, setWeeklyStats] = useState<Record<string, unknown> | null>(null);
  const [_monthlyStats, setMonthlyStats] = useState<Record<string, unknown> | null>(null);
  const [_cumulativeData, setCumulativeData] = useState<Record<string, unknown>[]>([]);
  const [_retentionTrend, setRetentionTrend] = useState<Record<string, unknown> | null>(null);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [_overcomeWords, setOvercomeWords] = useState<Record<string, unknown>[]>([]);
  const [_recentlyMastered, setRecentlyMastered] = useState<Record<string, unknown>[]>([]);
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
  const loadData = useCallback(() => {
    // 新しい統計データを読み込み
    setWeeklyStats(getWeeklyStats());
    setMonthlyStats(getMonthlyStats());
    setCumulativeData(getCumulativeProgressData(12));
    setRetentionTrend(getRetentionTrend());

    // 苦手単語に詳細情報を追加
    const weakWordsBase = getCurrentWeakWords(10);
    const weakWordsWithDetails = weakWordsBase.map((w) => {
      const questionData = allQuestions.find(
        (q) => q.word && w.word && q.word.toLowerCase() === w.word.toLowerCase()
      );
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
  }, [allQuestions]);

  // リアルタイム更新
  useEffect(() => {
    loadData();

    // 苦手単語セットが存在するかチェック
    const checkWeakWordsSet = async () => {
      const sets = await getCustomQuestionSets();
      const hasSet = sets.some((s) => s.source === 'weak-words');
      setHasWeakWordsSet(hasSet);
    };
    checkWeakWordsSet();

    // 解答直後イベントで即時更新
    const onQuizResultAdded = () => {
      loadData();
      checkWeakWordsSet();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(QUIZ_RESULT_EVENT, onQuizResultAdded as EventListener);
    }

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
        checkWeakWordsSet();
      }, 1000); // 1秒ごとに更新（リアルタイム表示）
      return () => {
        clearInterval(interval);
        if (typeof window !== 'undefined') {
          window.removeEventListener(QUIZ_RESULT_EVENT, onQuizResultAdded as EventListener);
        }
      };
    }

    // autoRefreshが無効の場合でもクリーンアップは必要
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(QUIZ_RESULT_EVENT, onQuizResultAdded as EventListener);
      }
    };
  }, [autoRefresh, loadData]);

  // 難易度別リセット
  const _handleResetByDifficulty = (mode: 'translation' | 'spelling', difficulty: string) => {
    const modeName = mode === 'translation' ? '和訳タブ' : 'スペルタブ';
    const difficultyName =
      difficulty === 'beginner' ? '初級' : difficulty === 'intermediate' ? '中級' : '上級';

    if (
      confirm(`${modeName}の${difficultyName}の成績をリセットしますか？この操作は元に戻せません。`)
    ) {
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
      {/* 学習カレンダー */}
      <div className="w-full mb-4 px-2">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          📆 学習カレンダー
          <span className="text-sm font-normal text-gray-500">（過去7日間）</span>
        </h3>
        <LearningCalendarProgress streakDays={_streakDays} />
      </div>

      {/* 苦手単語トップ10 */}
      <div className="w-full mb-4 px-2">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          😰 苦手単語トップ10
          <span className="text-sm font-normal text-gray-500">（要復習）</span>
        </h3>
        {weakWords.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
            <ul className="space-y-3">
              {weakWords.map((w, idx) => (
                <li
                  key={idx}
                  className="p-4 bg-gradient-to-r from-orange-50 to-red-50/30/30 rounded-lg border border-orange-200 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white font-bold rounded-full text-sm">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-gray-800">{w.word}</span>
                        {w.meaning && (
                          <span className="text-sm text-gray-600 mt-1">{w.meaning}</span>
                        )}
                        {w.reading && (
                          <span className="text-xs text-gray-500 mt-0.5">{w.reading}</span>
                        )}
                        {w.etymology && (
                          <span className="text-xs text-blue-600 mt-1">📖 {w.etymology}</span>
                        )}
                        {w.relatedWords && (
                          <span className="text-xs text-purple-600 mt-0.5">
                            🔗 {w.relatedWords}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-3 py-1 bg-red-100/50 text-red-700 rounded-full font-medium">
                        ❌ {w.mistakes}回
                      </span>
                      {w.recentAccuracy > 0 && (
                        <span className="px-3 py-1 bg-blue-100/50 text-blue-700 rounded-full font-medium">
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

                    alert(
                      `✅ 問題セット「${questionSet.name}」を${hasWeakWordsSet ? '更新' : '作成'}しました！\n和訳・暗記・スペルタブで利用できます。`
                    );
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

                    alert(
                      `✅ 問題セット「${questionSet.name}」を${hasWeakWordsSet ? '更新' : '作成'}しました！\n和訳・暗記・スペルタブで利用できます。`
                    );
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
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/20/20 rounded-xl border-2 border-dashed border-green-300 p-8 text-center">
            <p className="text-xl font-semibold text-green-700">苦手な単語はありません！🎉</p>
            <p className="text-sm text-green-600 mt-2">順調に学習が進んでいます</p>
          </div>
        )}
      </div>

      {/* 全体リセット */}
      <div className="w-full mb-4 px-2">
        <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                ⚠️ データのリセット
              </h3>
              <p className="text-sm text-gray-600">
                すべての学習記録を削除します。この操作は元に戻せません。
              </p>
            </div>
            <button
              onClick={handleResetAll}
              className="px-8 py-3 bg-red-600 hover:bg-red-700:bg-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              🗑️ リセット実行
            </button>
          </div>
        </div>
      </div>

      {/* ストレージ情報 */}
      {storageInfo && (
        <div className="w-full mb-4 px-2">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            💾 ストレージ使用量
          </h3>
          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-800">合計使用量</span>
                <span
                  className={`text-xl font-bold ${storageInfo.totalMB > 4 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {storageInfo.totalMB.toFixed(2)} MB{' '}
                  <span className="text-sm font-normal text-gray-500">/ 約 5-10 MB</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 absolute left-0 top-0 ${
                    storageInfo.totalMB > 8
                      ? 'bg-red-600 w-full'
                      : storageInfo.totalMB > 4
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  data-progress={Math.min((storageInfo.totalMB / 10) * 100, 100)}
                />
              </div>
              {storageInfo.totalMB > 4 && (
                <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
                  ⚠️ 容量が不足しています
                </p>
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-700:text-blue-300 font-medium flex items-center gap-2">
                📊 詳細を表示
              </summary>
              <ul className="mt-4 space-y-2">
                {storageInfo.details.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <code className="text-sm text-gray-700 font-mono">{item.key}</code>
                    <span className="text-sm font-semibold text-gray-800">
                      {item.sizeMB.toFixed(2)} MB
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-4 bg-blue-50/20 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span>
                    ヒント: データが大きくなりすぎた場合は、古い成績を削除すると容量を節約できます。
                  </span>
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
// モード別の1日分データ型定義
interface DayProgressByMode {
  date: string;
  memorization: { count: number; correct: number };
  translation: { count: number; correct: number };
  spelling: { count: number; correct: number };
  grammar: { count: number; correct: number };
  total: number;
}

// スタック型プログレスバーコンポーネント
function LearningCalendarProgress({ streakDays }: { streakDays: number }) {
  const [modeCalendarData, setModeCalendarData] = useState<DayProgressByMode[]>([]);

  useEffect(() => {
    // モード別データを14日分取得
    const data = getStudyCalendarByMode(14);
    setModeCalendarData(data);
  }, []);

  if (modeCalendarData.length === 0) {
    return (
      <div className="w-full p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
        <p className="text-gray-500 text-lg">📊 データがありません</p>
        <p className="text-gray-400 text-sm mt-2">学習を開始すると進捗が表示されます</p>
      </div>
    );
  }

  // 過去7日分を取得（最新7日）
  const last7Days = modeCalendarData.slice(-7);

  // モード別の色定義
  const modeColors = {
    memorization: { bg: 'bg-green-500', text: '🟢 暗記' },
    translation: { bg: 'bg-blue-500', text: '🔵 和訳' },
    spelling: { bg: 'bg-yellow-500', text: '🟡 スペル' },
    grammar: { bg: 'bg-red-500', text: '🔴 文法' },
  };

  return (
    <div className="w-full p-3 sm:p-6 bg-white rounded-xl shadow-lg border-2 border-blue-200">
      {/* ストリーク表示 */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border-2 border-orange-300 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl sm:text-3xl">🔥</span>
          <span className="text-lg sm:text-2xl font-bold text-orange-600">
            {streakDays}日連続学習中！
          </span>
        </div>
        {streakDays > 0 && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">この調子で頑張ろう！</p>
        )}
      </div>

      {/* 曜日ラベル */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {last7Days.map((day, idx) => {
          // 各日付の実際の曜日を計算
          const date = new Date(day.date);
          const dayOfWeek = date.getDay(); // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
          const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
          const label = dayLabels[dayOfWeek];

          return (
            <div key={idx} className="text-center">
              <div className="text-xs sm:text-sm font-bold text-gray-700 mb-1">{label}</div>
            </div>
          );
        })}
      </div>

      {/* プログレスバー */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {last7Days.map((day, idx) => {
          const modes = [
            { key: 'memorization' as const, data: day.memorization },
            { key: 'translation' as const, data: day.translation },
            { key: 'spelling' as const, data: day.spelling },
            { key: 'grammar' as const, data: day.grammar },
          ];

          const totalCorrect = modes.reduce((sum, m) => sum + m.data.correct, 0);
          const totalCount = modes.reduce((sum, m) => sum + m.data.count, 0);
          const date = new Date(day.date);
          const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
          const isToday = day.date === formatLocalYYYYMMDD(new Date());

          // ホバー詳細情報を生成
          const tooltipContent = modes
            .filter((m) => m.data.count > 0)
            .map((m) => {
              const accuracy =
                m.data.count > 0 ? Math.round((m.data.correct / m.data.count) * 100) : 0;
              return `${modeColors[m.key].text}: ${m.data.correct}/${m.data.count}問 (${accuracy}%)`;
            })
            .join('\n');

          return (
            <div key={idx} className="flex flex-col items-center group">
              {/* スタック型バー */}
              <div
                className={`relative w-full h-24 sm:h-32 bg-gray-200 rounded-lg overflow-hidden flex flex-col-reverse border-2 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 ${
                  isToday
                    ? 'border-orange-400 ring-2 ring-orange-300 ring-offset-1'
                    : 'border-gray-300'
                }`}
                title={
                  totalCount > 0
                    ? `${day.date}${isToday ? ' [今日]' : ''}\n${tooltipContent}`
                    : `${day.date}: 未学習`
                }
              >
                {totalCorrect === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    未学習
                  </div>
                ) : (
                  <>
                    {modes.map(
                      (mode) =>
                        mode.data.correct > 0 && (
                          <div
                            key={mode.key}
                            className={`mode-progress-bar w-full ${modeColors[mode.key].bg} flex items-center justify-center text-white text-xs font-bold transition-all duration-500 ease-out hover:brightness-110`}
                            {...{
                              style: {
                                '--height-percent': (mode.data.correct / totalCorrect) * 100,
                                '--animation-delay': idx * 0.1,
                              } as React.CSSProperties,
                            }}
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {mode.data.correct}
                            </span>
                          </div>
                        )
                    )}
                    {/* ホバー時の詳細オーバーレイ（デスクトップのみ） */}
                    <div className="hidden sm:flex absolute inset-0 bg-black/80 text-white p-2 text-[10px] leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex-col justify-center">
                      {modes
                        .filter((m) => m.data.count > 0)
                        .map((m) => {
                          const accuracy = Math.round((m.data.correct / m.data.count) * 100);
                          return (
                            <div key={m.key} className="mb-1">
                              <div className="font-bold">{modeColors[m.key].text}</div>
                              <div>
                                {m.data.correct}/{m.data.count}問 ({accuracy}%)
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
              {/* 日付と合計 */}
              <div className="mt-1 sm:mt-2 text-center">
                <div
                  className={`text-[10px] sm:text-xs ${isToday ? 'text-orange-600 font-bold' : 'text-gray-500'}`}
                >
                  {dayLabel}
                  {isToday && ' 🎯'}
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-800">{totalCorrect}問</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* アニメーション定義とスタイル */}
      <style>{`
        @keyframes slideUp {
          from {
            height: 0%;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .mode-progress-bar {
          height: calc(var(--height-percent, 0) * 1%);
          animation: slideUp 0.6s ease-out calc(var(--animation-delay, 0) * 1s) both;
        }
      `}</style>

      {/* 凡例 */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
          {Object.entries(modeColors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1 sm:gap-2">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 ${value.bg} rounded`}></div>
              <span className="text-gray-700">{value.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsView;
