import { useState, useEffect } from 'react';
import type { Question, AIPersonality } from '../types';
import LearningPlanView from './LearningPlanView';
import { PERSONALITY_INFO } from '../aiCommentGenerator';

interface SettingsViewProps {
  allQuestions: Question[];
  onStartSession: (mode: 'morning' | 'afternoon' | 'evening', questions: Question[]) => void;
}

function SettingsView({
  allQuestions,
  onStartSession,
}: SettingsViewProps) {
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

        {/* 1日の学習単語数 */}
        <div className="simple-setting-section">
          <h3>🎯 1日の学習単語数</h3>
          <div className="slider-container">
            <input
              type="range"
              min="10"
              max={totalWords}
              step="5"
              value={batchSize}
              onChange={(e) => handleBatchSizeChange(Number(e.target.value))}
              className="setting-slider"
              aria-label="1日の学習単語数"
            />
            <div className="slider-value">{batchSize}語 / {totalWords}語</div>
            <div className="estimated-duration">{estimatedDaysText}で完了予定（1日{batchSize}語ペース）</div>
          </div>
        </div>

        {/* 学習プラン設定 */}
        <LearningPlanView
          allQuestions={allQuestions}
          onStartSession={onStartSession}
        />

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
