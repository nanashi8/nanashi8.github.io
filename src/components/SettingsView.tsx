import { useState } from 'react';
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
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // ダークモード変更時にlocalStorageに保存
  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', JSON.stringify(enabled));
    document.documentElement.classList.toggle('dark-mode', enabled);
  };

  // 初回レンダリング時にdark-modeクラスを適用
  useState(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    }
    return darkMode;
  });

  const totalWords = allQuestions.length;
  const estimatedMonths = Math.ceil(totalWords / (batchSize * 30));
  const estimatedMonthsText = estimatedMonths === 1 ? '約1ヶ月' : `約${estimatedMonths}ヶ月`;

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
            <div className="estimated-duration">{estimatedMonthsText}で完了予定（1日{batchSize}語ペース）</div>
          </div>
        </div>

        <div className="settings-divider"></div>

        {/* 学習プラン設定 */}
        <LearningPlanView
          allQuestions={allQuestions}
          onStartSession={onStartSession}
        />

        <div className="settings-divider"></div>

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

        <div className="settings-divider"></div>

        {/* ダークモード切り替え */}
        <div className="simple-setting-section">
          <h3>🌙 表示モード</h3>
          <div className="theme-toggle">
            <button
              className={`theme-btn ${!darkMode ? 'active' : ''}`}
              onClick={() => handleDarkModeChange(false)}
            >
              ☀️ ライトモード
            </button>
            <button
              className={`theme-btn ${darkMode ? 'active' : ''}`}
              onClick={() => handleDarkModeChange(true)}
            >
              🌙 ダークモード
            </button>
          </div>
        </div>


      </div>
    </div>
  );
}

export default SettingsView;
