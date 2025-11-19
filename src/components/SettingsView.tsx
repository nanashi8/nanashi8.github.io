import { useState, useEffect } from 'react';
import type { Question, AIPersonality } from '../types';
import LearningPlanView from './LearningPlanView';
import { PERSONALITY_INFO } from '../aiCommentGenerator';
import { getStudySettings, updateStudySettings } from '../progressStorage';

interface SettingsViewProps {
  allQuestions: Question[];
  onStartSession: (mode: 'morning' | 'afternoon' | 'evening', questions: Question[]) => void;
}

function SettingsView({
  allQuestions,
  onStartSession,
}: SettingsViewProps) {
  // 学習数上限と要復習上限の設定
  const [maxStudyCount, setMaxStudyCount] = useState<number>(() => {
    return getStudySettings().maxStudyCount;
  });
  
  const [maxReviewCount, setMaxReviewCount] = useState<number>(() => {
    return getStudySettings().maxReviewCount;
  });

  // localStorageからバッチサイズを読み込み
  const [batchSize, setBatchSize] = useState<number>(() => {
    const saved = localStorage.getItem('batchSize');
    return saved ? parseInt(saved, 10) : 20;
  });

  // AI人格の読み込み
  const [aiPersonality, setAIPersonality] = useState<AIPersonality>(() => {
    const saved = localStorage.getItem('aiPersonality');
    return (saved as AIPersonality) || 'kind-teacher';
  });

  // バッチサイズ変更時にlocalStorageに保存
  const handleBatchSizeChange = (newSize: number) => {
    setBatchSize(newSize);
    localStorage.setItem('batchSize', newSize.toString());
  };

  // 学習数上限の変更
  const handleMaxStudyCountChange = (newCount: number) => {
    setMaxStudyCount(newCount);
    updateStudySettings({ maxStudyCount: newCount });
  };

  // 要復習上限の変更
  const handleMaxReviewCountChange = (newCount: number) => {
    setMaxReviewCount(newCount);
    updateStudySettings({ maxReviewCount: newCount });
  };

  // AI人格変更時にlocalStorageに保存
  const handlePersonalityChange = (personality: AIPersonality) => {
    setAIPersonality(personality);
    localStorage.setItem('aiPersonality', personality);
  };

  // ダークモードの読み込み
  const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'system' || saved === 'light' || saved === 'dark') {
      return saved;
    }
    // 旧形式（boolean）からの移行
    if (saved === 'true') return 'dark';
    if (saved === 'false') return 'light';
    return 'system';
  });

  // システムのダークモード設定を検出
  const applyDarkMode = (mode: 'light' | 'dark' | 'system') => {
    let isDark = false;
    if (mode === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = mode === 'dark';
    }
    document.documentElement.classList.toggle('dark-mode', isDark);
  };

  // ダークモード変更時にlocalStorageに保存
  const handleDarkModeChange = (mode: 'light' | 'dark' | 'system') => {
    setDarkMode(mode);
    localStorage.setItem('darkMode', mode);
    applyDarkMode(mode);
  };

  // 初回レンダリング時にdark-modeクラスを適用
  useEffect(() => {
    applyDarkMode(darkMode);
    
    // システム設定の変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (darkMode === 'system') {
        applyDarkMode('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [darkMode]);

  const totalWords = allQuestions.length;
  const estimatedDays = Math.ceil(totalWords / batchSize);
  const estimatedDaysText = `約${estimatedDays}日間`;

  return (
    <div className="settings-view">
      <div className="settings-container">
        <div className="section-header">
          <h1>📚 学習プランナー</h1>
        </div>

        {/* 学習プラン設定 */}
        <LearningPlanView
          allQuestions={allQuestions}
          onStartSession={onStartSession}
        />

        {/* 学習数・要復習上限設定 */}
        <div className="simple-setting-section">
          <h3>📊 学習数・要復習上限</h3>
          <div className="study-limits-container">
            <div className="limit-setting">
              <label htmlFor="max-study-count">
                学習数上限
                <span className="limit-description">1セッションあたりの最大学習数</span>
              </label>
              <input
                id="max-study-count"
                type="number"
                min="5"
                max="100"
                value={maxStudyCount}
                onChange={(e) => handleMaxStudyCountChange(parseInt(e.target.value, 10))}
                className="limit-input"
              />
              <span className="limit-unit">問</span>
            </div>
            <div className="limit-setting">
              <label htmlFor="max-review-count">
                要復習上限
                <span className="limit-description">繰り返される復習問題の上限数</span>
              </label>
              <input
                id="max-review-count"
                type="number"
                min="0"
                max="50"
                value={maxReviewCount}
                onChange={(e) => handleMaxReviewCountChange(parseInt(e.target.value, 10))}
                className="limit-input"
              />
              <span className="limit-unit">問</span>
            </div>
          </div>
          <div className="limits-info">
            💡 学習中に足りないと感じたら、いつでも変更できます。要復習上限は、記憶が定着していない語を無理に定着させようとしても効果が薄いため、生徒さんに合わせて調整してください。
          </div>
        </div>

        {/* AI人格選択 */}
        <div className="simple-setting-section">
          <h3>🎭 AIの人格</h3>
          <div className="personality-grid">
            {(Object.entries(PERSONALITY_INFO) as [AIPersonality, typeof PERSONALITY_INFO[AIPersonality]][]).map(([key, info]) => (
              <button
                key={key}
                className={`personality-card ${aiPersonality === key ? 'active' : ''}`}
                onClick={() => handlePersonalityChange(key)}
              >
                <div className="personality-avatar">{info.avatar}</div>
                <div className="personality-name">{info.name}</div>
                <div className="personality-desc">{info.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ダークモード切り替え */}
        <div className="simple-setting-section">
          <h3>🌙 表示モード</h3>
          <div className="theme-toggle-grid">
            <button
              className={`theme-btn ${darkMode === 'light' ? 'active' : ''}`}
              onClick={() => handleDarkModeChange('light')}
            >
              <div className="theme-icon">☀️</div>
              <div className="theme-label">ライト</div>
            </button>
            <button
              className={`theme-btn ${darkMode === 'dark' ? 'active' : ''}`}
              onClick={() => handleDarkModeChange('dark')}
            >
              <div className="theme-icon">🌙</div>
              <div className="theme-label">ダーク</div>
            </button>
            <button
              className={`theme-btn ${darkMode === 'system' ? 'active' : ''}`}
              onClick={() => handleDarkModeChange('system')}
            >
              <div className="theme-icon">💻</div>
              <div className="theme-label">システム</div>
            </button>
          </div>
          <div className="theme-description">
            {darkMode === 'system' && '💡 デバイスの設定に自動的に合わせます'}
            {darkMode === 'light' && '☀️ 明るい表示モード'}
            {darkMode === 'dark' && '🌙 目に優しい暗い表示モード'}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsView;
