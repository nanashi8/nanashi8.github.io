import { useState, useEffect } from 'react';
import type { LearningSchedule, DailyStudyPlan, Question } from '../types';
import { 
  generateLearningPlan,
  generateDailyPlan, 
  calculateProgress,
  calculateWeeklyAchievement 
} from '../utils';

interface LearningPlanViewProps {
  allQuestions: Question[];
  onStartSession: (mode: 'morning' | 'afternoon' | 'evening', questions: Question[]) => void;
}

function LearningPlanView({ allQuestions, onStartSession }: LearningPlanViewProps) {
  const [schedule, setSchedule] = useState<LearningSchedule | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyStudyPlan | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number>(3);
  const [progress, setProgress] = useState({
    totalLearned: 0,
    totalReviewed: 0,
    averageAccuracy: 0,
    estimatedCompletion: 90,
  });
  
  useEffect(() => {
    // ローカルストレージからプランを読み込み
    const saved = localStorage.getItem('learning-schedule-90days');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LearningSchedule;
        
        // 日数を更新
        const daysPassed = Math.floor((Date.now() - parsed.startDate) / (1000 * 60 * 60 * 24));
        const totalDays = parsed.totalDays;
        parsed.currentDay = Math.min(daysPassed + 1, totalDays);
        
        // フェーズを動的に計算
        const phase1End = Math.floor(totalDays / 3);
        const phase2End = Math.floor(totalDays * 2 / 3);
        parsed.phase = parsed.currentDay <= phase1End ? 1 : parsed.currentDay <= phase2End ? 2 : 3;
        
        setSchedule(parsed);
        setDailyPlan(generateDailyPlan(parsed, allQuestions));
      } catch (error) {
        console.error('Failed to load schedule:', error);
      }
    }
  }, [allQuestions]);
  
  useEffect(() => {
    if (schedule) {
      setProgress(calculateProgress(schedule));
      
      // プログレスバーのwidthを設定
      const progressBar = document.querySelector('.progress-bar') as HTMLElement;
      if (progressBar) {
        const dayNumber = schedule.currentDay;
        const totalDays = schedule.totalDays;
        const progressPercent = (dayNumber / totalDays) * 100;
        progressBar.style.width = `${progressPercent}%`;
      }
    }
  }, [schedule]);
  
  const handleStartPlan = () => {
    const newSchedule = generateLearningPlan(allQuestions, selectedMonths);
    setSchedule(newSchedule);
    localStorage.setItem('learning-schedule-90days', JSON.stringify(newSchedule));
    setDailyPlan(generateDailyPlan(newSchedule, allQuestions));
  };
  
  const handleResetPlan = () => {
    const monthsLabel = schedule?.planDurationMonths === 1 ? '1ヶ月' : 
                       schedule?.planDurationMonths === 2 ? '2ヶ月' :
                       schedule?.planDurationMonths === 6 ? '6ヶ月' : '3ヶ月';
    if (confirm(`${monthsLabel}プランをリセットしますか？これまでの進捗は保持されますが、プランは最初からになります。`)) {
      localStorage.removeItem('learning-schedule-90days');
      setSchedule(null);
      setDailyPlan(null);
    }
  };
  
  if (!schedule) {
    const monthsOptions = [1, 2, 3, 6];
    const totalWords = allQuestions.length;
    
    return (
      <div className="learning-plan-start">
        <div className="plan-hero">
          <h1>🎯 学習マスタープラン</h1>
          <p className="plan-description">
            脳科学に基づいた学習プランで、<br/>
            約{totalWords.toLocaleString()}語を効率的に習得！
          </p>
          
          <div className="plan-duration-selector">
            <h3>📅 学習期間を選択</h3>
            <div className="duration-buttons">
              {monthsOptions.map(months => {
                const days = months * 30;
                const dailyWords = Math.ceil(totalWords / days);
                const isSelected = selectedMonths === months;
                
                return (
                  <button
                    key={months}
                    className={`duration-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMonths(months)}
                  >
                    <div className="duration-label">{months}ヶ月</div>
                    <div className="duration-stats">
                      <div>{days}日間</div>
                      <div>約{dailyWords}語/日</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="duration-note">
              ※ 選択期間に応じて1日の学習量が調整されます
            </p>
          </div>
          
          <button onClick={handleStartPlan} className="btn-start-plan">
            🚀 {selectedMonths}ヶ月プランを開始する
          </button>
          
          <div className="plan-details">
            <h3>📋 学習プランの詳細</h3>
            <ul>
              <li><strong>Phase 1（最初の1/3）</strong>: 基礎固め期 - 初級単語を中心に</li>
              <li><strong>Phase 2（中盤の1/3）</strong>: 応用拡大期 - 初級+中級単語</li>
              <li><strong>Phase 3（最後の1/3）</strong>: 完成・定着期 - 中級+上級単語</li>
            </ul>
            
            <h3>⏰ 1日の学習スケジュール</h3>
            <ul>
              <li><strong>朝（35%）</strong>: 新規単語を学習</li>
              <li><strong>昼（30%）</strong>: 苦手な単語を復習</li>
              <li><strong>夜（35%）</strong>: 総合演習（新規+復習）</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  const phaseNames = ['基礎固め期', '応用拡大期', '完成・定着期'];
  const phase = schedule.phase;
  const dayNumber = schedule.currentDay;
  const totalDays = schedule.totalDays;
  const progressPercent = (dayNumber / totalDays) * 100;
  const weeklyAchievement = calculateWeeklyAchievement(schedule);
  
  return (
    <div className="learning-plan-dashboard">
      {/* プログレスヘッダー */}
      <div className="dashboard-header">
        <div className="day-counter">
          <span className="day-number">{dayNumber}</span>
          <span className="day-label">/ {totalDays}日目</span>
        </div>
        
        <div className="phase-indicator">
          <span className={`phase-badge phase-${phase}`}>
            Phase {phase}
          </span>
          <span className="phase-name">{phaseNames[phase - 1]}</span>
        </div>
        
        <div className="progress-bar-container">
          <div className={`progress-bar phase-${phase}`} />
          <span className="progress-label">{progressPercent.toFixed(1)}%</span>
        </div>
      </div>
      
      {/* 統計サマリー */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{progress.totalLearned}</div>
          <div className="stat-label">学習済み単語</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{progress.averageAccuracy.toFixed(1)}%</div>
          <div className="stat-label">平均正答率</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{weeklyAchievement > 0 ? weeklyAchievement.toFixed(0) : 0}%</div>
          <div className="stat-label">今週の達成率</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{progress.estimatedCompletion}</div>
          <div className="stat-label">完了まで（日）</div>
        </div>
      </div>
      
      {/* 今日の学習プラン */}
      {dailyPlan && (
        <div className="today-plan">
          <h2>📖 今日の学習プラン（Day {dayNumber}）</h2>
          
          <div className="session-cards">
            {/* 朝セッション */}
            <div className="session-card morning">
              <div className="session-header">
                <span className="session-icon">🌅</span>
                <div className="session-info">
                  <h3>朝：新規学習</h3>
                  <p>{dailyPlan.morning.newWords.length}語 · 20分</p>
                </div>
              </div>
              <button 
                onClick={() => onStartSession('morning', dailyPlan.morning.newWords)}
                className="btn-start-session"
                disabled={dailyPlan.morning.newWords.length === 0}
              >
                {dailyPlan.morning.newWords.length === 0 ? '単語なし' : '開始する'}
              </button>
            </div>
            
            {/* 昼セッション */}
            <div className="session-card afternoon">
              <div className="session-header">
                <span className="session-icon">☀️</span>
                <div className="session-info">
                  <h3>昼：弱点復習</h3>
                  <p>{dailyPlan.afternoon.reviewWords.length}語 · 15分</p>
                </div>
              </div>
              <button 
                onClick={() => onStartSession('afternoon', dailyPlan.afternoon.reviewWords)}
                className="btn-start-session"
                disabled={dailyPlan.afternoon.reviewWords.length === 0}
              >
                {dailyPlan.afternoon.reviewWords.length === 0 ? '単語なし' : '開始する'}
              </button>
            </div>
            
            {/* 夜セッション */}
            <div className="session-card evening">
              <div className="session-header">
                <span className="session-icon">🌙</span>
                <div className="session-info">
                  <h3>夜：総合演習</h3>
                  <p>{dailyPlan.evening.mixedWords.length}語 · 20分</p>
                </div>
              </div>
              <button 
                onClick={() => onStartSession('evening', dailyPlan.evening.mixedWords)}
                className="btn-start-session"
                disabled={dailyPlan.evening.mixedWords.length === 0}
              >
                {dailyPlan.evening.mixedWords.length === 0 ? '単語なし' : '開始する'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* マイルストーン */}
      <div className="milestones">
        <h2>🏆 マイルストーン</h2>
        <div className="milestone-list">
          {schedule.milestones.map((milestone, index) => {
            const isPassed = dayNumber > milestone.day;
            const isCurrent = dayNumber === milestone.day;
            const isAchieved = progress.totalLearned >= milestone.wordsTarget;
            
            return (
              <div 
                key={index}
                className={`milestone-item ${isAchieved ? 'achieved' : ''} ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
              >
                <div className="milestone-day">Day {milestone.day}</div>
                <div className="milestone-title">{milestone.title}</div>
                <div className="milestone-target">{milestone.wordsTarget}語</div>
                {isAchieved && <span className="check-mark">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* リセットボタン */}
      <div className="plan-actions">
        <button onClick={handleResetPlan} className="btn-reset-plan">
          🔄 プランをリセット
        </button>
      </div>
    </div>
  );
}

export default LearningPlanView;
