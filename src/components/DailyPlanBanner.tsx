import { useState, useEffect } from 'react';
import { getDailyPlanInfo, DailyPlanInfo } from '../progressStorage';

interface DailyPlanBannerProps {
  mode: 'translation' | 'spelling' | 'reading';
}

function DailyPlanBanner({ mode }: DailyPlanBannerProps) {
  const [planInfo, setPlanInfo] = useState<DailyPlanInfo | null>(null);
  const [targetCount, setTargetCount] = useState<number>(() => {
    const saved = localStorage.getItem(`daily-plan-target-${mode}`);
    return saved ? parseInt(saved, 10) : 20;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const info = getDailyPlanInfo();
    setPlanInfo(info);
  }, []);

  const handleTargetChange = (newTarget: number) => {
    setTargetCount(newTarget);
    localStorage.setItem(`daily-plan-target-${mode}`, newTarget.toString());
  };

  if (!planInfo) return null;

  const { reviewWordsCount, scheduledWordsCount, totalPlannedCount } = planInfo;
  
  // 学習プラン提案
  const getRecommendation = () => {
    if (reviewWordsCount === 0 && scheduledWordsCount === 0) {
      return {
        icon: '✨',
        message: '素晴らしい！今日の復習はありません',
        color: '#10b981'
      };
    }
    
    if (reviewWordsCount === 0) {
      return {
        icon: '📅',
        message: `確認予定: ${scheduledWordsCount}語`,
        color: '#3b82f6'
      };
    }
    
    if (reviewWordsCount <= 10) {
      return {
        icon: '🎯',
        message: `要復習: ${reviewWordsCount}語（今日中に完了可能！）`,
        color: '#f59e0b'
      };
    }
    
    if (reviewWordsCount <= 30) {
      return {
        icon: '⏰',
        message: `要復習: ${reviewWordsCount}語（集中して取り組もう）`,
        color: '#ef4444'
      };
    }
    
    return {
      icon: '🔥',
      message: `要復習: ${reviewWordsCount}語（無理せず${targetCount}語ずつ進めよう）`,
      color: '#dc2626'
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className={`daily-plan-banner plan-color-${recommendation.icon === '✨' ? 'success' : recommendation.icon === '📅' ? 'info' : recommendation.icon === '🎯' ? 'warning' : 'danger'}`}>
      <div className="daily-plan-header">
        <div className="daily-plan-icon">
          {recommendation.icon}
        </div>
        <div className="daily-plan-content">
          <div className="daily-plan-title">今日の学習プラン</div>
          <div className="daily-plan-message">
            {recommendation.message}
          </div>
          {scheduledWordsCount > 0 && reviewWordsCount > 0 && (
            <div className="daily-plan-breakdown">
              要復習 {reviewWordsCount}語 + 確認予定 {scheduledWordsCount}語 = 合計 {totalPlannedCount}語
            </div>
          )}
        </div>
        <button 
          className="daily-plan-settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="学習プラン設定"
        >
          ⚙️
        </button>
      </div>
      
      {showSettings && (
        <div className="daily-plan-settings">
          <div className="plan-target-setting">
            <label htmlFor="target-count">今日の目標語数:</label>
            <div className="target-slider-container">
              <input
                id="target-count"
                type="range"
                min="5"
                max={Math.max(50, totalPlannedCount)}
                step="5"
                value={targetCount}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="target-slider"
              />
              <div className="target-value">{targetCount}語</div>
            </div>
          </div>
          
          <div className="plan-recommendations">
            <div className="plan-recommendation-item">
              💡 <strong>おすすめ:</strong> 
              {totalPlannedCount <= 20 && ' 全て完了を目指しましょう！'}
              {totalPlannedCount > 20 && totalPlannedCount <= 40 && ' 20〜30語ずつ取り組むと効果的です'}
              {totalPlannedCount > 40 && ' 無理せず分散学習がおすすめです（1日20〜30語）'}
            </div>
            <div className="plan-recommendation-item">
              🧠 <strong>脳科学的には:</strong> 集中力が続く20〜30分で学習し、休憩を挟むのが最適
            </div>
            {reviewWordsCount === 0 && scheduledWordsCount > 0 && (
              <div className="plan-recommendation-item plan-success">
                ✨ <strong>完璧！</strong> 要復習が0です。確認予定の単語を軽くチェックしましょう
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyPlanBanner;
