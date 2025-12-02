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
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem(`daily-plan-visible-${mode}`);
    return saved !== 'false';
  });

  useEffect(() => {
    const info = getDailyPlanInfo();
    setPlanInfo(info);
  }, []);

  const handleTargetChange = (newTarget: number) => {
    setTargetCount(newTarget);
    localStorage.setItem(`daily-plan-target-${mode}`, newTarget.toString());
  };

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem(`daily-plan-visible-${mode}`, newVisibility.toString());
  };

  if (!planInfo || !isVisible) {
    return isVisible === false ? (
      <div className="daily-plan-collapsed">
        <button onClick={toggleVisibility} className="w-full px-6 py-3 text-base font-medium bg-info text-white border-2 border-info rounded-xl transition-all duration-300 hover:bg-info-hover hover:shadow-lg dark:bg-info dark:hover:bg-info-hover">
          📅 今日の学習プランを表示
        </button>
      </div>
    ) : null;
  }

  const { reviewWordsCount, scheduledWordsCount, totalPlannedCount } = planInfo;
  
  // 学習履歴があるかチェック
  const hasStudyHistory = () => {
    const progress = localStorage.getItem('progress-data');
    if (!progress) return false;
    
    try {
      const data = JSON.parse(progress);
      // 過去の学習結果があるか、または単語の学習履歴があるか
      const hasResults = data.results && data.results.length > 0;
      const hasWordProgress = data.wordProgress && Object.keys(data.wordProgress).length > 0;
      return hasResults || hasWordProgress;
    } catch {
      return false;
    }
  };
  
  // 学習プラン提案
  const getRecommendation = () => {
    if (reviewWordsCount === 0 && scheduledWordsCount === 0) {
      // 学習履歴がない場合は初回メッセージ
      if (!hasStudyHistory()) {
        return {
          icon: '🎓',
          message: '今日から学習を始めましょう！'
        };
      }
      // 学習履歴があり復習なしの場合
      return {
        icon: '✨',
        message: '素晴らしい！今日の復習はありません'
      };
    }
    
    if (reviewWordsCount === 0) {
      return {
        icon: '📅',
        message: `確認予定: ${scheduledWordsCount}語`
      };
    }
    
    if (reviewWordsCount <= 10) {
      return {
        icon: '🎯',
        message: `要復習: ${reviewWordsCount}語（今日中に完了可能！）`
      };
    }
    
    if (reviewWordsCount <= 30) {
      return {
        icon: '⏰',
        message: `要復習: ${reviewWordsCount}語（集中して取り組もう）`
      };
    }
    
    return {
      icon: '🔥',
      message: `要復習: ${reviewWordsCount}語（無理せず${targetCount}語ずつ進めよう）`
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
        <div className="daily-plan-actions">
          <button 
            className="px-3 py-2 text-base font-medium bg-secondary text-secondary border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-secondary-hover hover:shadow-md dark:bg-secondary dark:text-secondary-text dark:hover:bg-secondary-hover"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="学習プラン設定"
          >
            ⚙️
          </button>
          <button 
            className="px-3 py-2 text-base font-medium bg-gray-200 text-gray-700 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            onClick={toggleVisibility}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
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
