// 時間帯別AI挨拶バナーコンポーネント
import { useState, useEffect } from 'react';
import { AIPersonality } from '../types';
import { 
  generateTimeBasedGreeting, 
  updateConsecutiveDays,
  getTodayStudyStats 
} from '../timeBasedGreeting';
import { getTimeBasedTeacherChat, getSpecialDayChat } from '../teacherInteractions';
import { getBreatherTrivia } from '../englishTrivia';

interface TimeBasedGreetingBannerProps {
  onDismiss?: () => void;
}

function TimeBasedGreetingBanner({ onDismiss }: TimeBasedGreetingBannerProps) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // 連続ログイン日数を更新
    updateConsecutiveDays();
    
    // 3%の確率で英語豆知識を表示
    if (Math.random() < 0.03) {
      const trivia = getBreatherTrivia();
      setGreeting(trivia);
      return;
    }
    
    // 特別な日の会話をチェック
    const specialChat = getSpecialDayChat();
    if (specialChat) {
      setGreeting(specialChat);
      return;
    }
    
    // 時間帯別の教師の会話をチェック
    const teacherChat = getTimeBasedTeacherChat();
    if (teacherChat) {
      setGreeting(teacherChat);
      return;
    }
    
    // 挨拶メッセージを生成
    const personality = (localStorage.getItem('aiPersonality') || 'kind-teacher') as AIPersonality;
    const message = generateTimeBasedGreeting(personality);
    
    if (message) {
      // セッションストレージで今日すでに表示したかチェック
      const today = new Date().toISOString().split('T')[0];
      const shownToday = sessionStorage.getItem(`greeting-shown-${today}`);
      
      if (!shownToday) {
        setGreeting(message);
        sessionStorage.setItem(`greeting-shown-${today}`, 'true');
      }
    }
  }, []);
  
  // 学習進捗が変わったらstatsを更新
  useEffect(() => {
    const updateStats = () => {
      getTodayStudyStats();
      // 学習数が変わったら再度挨拶を生成することも可能
      // ただし、うるさくならないよう初回のみ表示
    };
    
    // 定期的に更新（オプション）
    const interval = setInterval(updateStats, 60000); // 1分ごと
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!greeting || isDismissed) {
    return null;
  }

  return (
    <div className="time-greeting-banner">
      <div className="time-greeting-content">
        <div className="time-greeting-message">{greeting}</div>
        <button 
          className="time-greeting-dismiss"
          onClick={handleDismiss}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default TimeBasedGreetingBanner;
