import { getStudyCalendarData } from '../progressStorage';
import { formatLocalYYYYMMDD } from '../utils';

// 簡易テスト: 学習カレンダーデータの日付キーがローカルYYYY-MM-DDで今日を含むこと
(function runCalendarDataTests() {
  try {
    const days = 14;
    const data = getStudyCalendarData(days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatLocalYYYYMMDD(today);

    const hasToday = data.some(d => d.date === todayStr);
    if (!hasToday) {
      console.error(`[TEST] 今日(${todayStr})が学習カレンダーに含まれていません`, { data });
    } else {
      console.log(`[TEST] OK: 学習カレンダーに今日(${todayStr})が含まれています`);
    }
  } catch (e) {
    console.error('[TEST] calendarDataTests 実行中に例外が発生:', e);
  }
})();
