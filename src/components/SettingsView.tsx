import { useState, useEffect } from 'react';
import type { Question, AIPersonality } from '../types';
import type { DataSource } from '../App';
import LearningPlanView from './LearningPlanView';
import { PERSONALITY_INFO } from '../aiCommentGenerator';

interface SettingsViewProps {
  allQuestions: Question[];
  onStartSession: (mode: 'morning' | 'afternoon' | 'evening', questions: Question[]) => void;
  _selectedDataSource?: DataSource;
  _onDataSourceChange?: (source: DataSource) => void;
}

function SettingsView({
  allQuestions,
  onStartSession,
  _selectedDataSource = 'all',
  _onDataSourceChange,
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

  // 以下で利用できるように保持
  void handleBatchSizeChange; // ESLintエラー回避

  // AI人格変更時にlocalStorageに保存
  const handlePersonalityChange = (personality: AIPersonality) => {
    setAIPersonality(personality);
    localStorage.setItem('aiPersonality', personality);
  };

  // 音声設定の読み込み
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(() => {
    const saved = localStorage.getItem('voiceGender');
    return (saved === 'female' || saved === 'male') ? saved : 'female'; // 初期値を女性に設定
  });

  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('speechRate');
    return saved ? parseFloat(saved) : 0.85;
  });

  // 音声性別変更時にlocalStorageに保存
  const handleVoiceGenderChange = (gender: 'female' | 'male') => {
    setVoiceGender(gender);
    localStorage.setItem('voiceGender', gender);
  };

  // 発音速度変更時にlocalStorageに保存
  const handleSpeechRateChange = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem('speechRate', rate.toString());
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

  // システムのダークモード設定を検出（Tailwindのdarkクラスを使用）
  const applyDarkMode = (mode: 'light' | 'dark' | 'system') => {
    let isDark = false;
    if (mode === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = mode === 'dark';
    }
    // Tailwind用のdarkクラスに変更
    document.documentElement.classList.toggle('dark', isDark);
  };

  // ダークモード変更時にlocalStorageに保存
  const handleDarkModeChange = (mode: 'light' | 'dark' | 'system') => {
    setDarkMode(mode);
    localStorage.setItem('darkMode', mode);
    applyDarkMode(mode);
  };

  // 初回レンダリング時とダークモード変更時に適用
  useEffect(() => {
    // main.tsxで初期化済みだが、ユーザーが設定変更した場合は再適用
    applyDarkMode(darkMode);
    
    // システム設定の変更を監視（systemモードの場合のみ）
    if (darkMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyDarkMode('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [darkMode]);

  const totalWords = allQuestions.length;
  const estimatedDays = Math.ceil(totalWords / batchSize);
  const _estimatedDaysText = `約${estimatedDays}日間`;

  return (
    <div className="settings-view">
      <div className="settings-container">
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

        {/* データソース選択 */}
        {/* ダークモード切り替え */}
        <div className="simple-setting-section">
          <h3>🌙 表示モード</h3>
          <div className="theme-toggle-grid">
            <button
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                darkMode === 'light' 
                  ? 'bg-primary border-primary text-white dark:bg-primary dark:border-primary dark:text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-primary hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary dark:hover:bg-gray-700'
              }`}
              onClick={() => handleDarkModeChange('light')}
            >
              <div className="text-2xl">☀️</div>
              <div className="text-sm font-medium">ライト</div>
            </button>
            <button
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                darkMode === 'dark' 
                  ? 'bg-primary border-primary text-white dark:bg-primary dark:border-primary dark:text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-primary hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary dark:hover:bg-gray-700'
              }`}
              onClick={() => handleDarkModeChange('dark')}
            >
              <div className="text-2xl">🌙</div>
              <div className="text-sm font-medium">ダーク</div>
            </button>
            <button
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                darkMode === 'system' 
                  ? 'bg-primary border-primary text-white dark:bg-primary dark:border-primary dark:text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-primary hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary dark:hover:bg-gray-700'
              }`}
              onClick={() => handleDarkModeChange('system')}
            >
              <div className="text-2xl">💻</div>
              <div className="text-sm font-medium">システム</div>
            </button>
          </div>
          <div className="theme-description">
            {darkMode === 'system' && '💡 デバイスの設定に自動的に合わせます'}
            {darkMode === 'light' && '☀️ 明るい表示モード'}
            {darkMode === 'dark' && '🌙 目に優しい暗い表示モード'}
          </div>
        </div>

        {/* 音声設定 */}
        <div className="simple-setting-section">
          <h3>🔊 音声設定</h3>
          
          {/* 声の種類 */}
          <div className="voice-setting-group">
            <h4>🎤 声の種類</h4>
            <div className="theme-toggle-grid">
              <button
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  voiceGender === 'female' 
                    ? 'bg-primary border-primary text-white dark:bg-primary dark:border-primary dark:text-white' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-primary hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary dark:hover:bg-gray-700'
                }`}
                onClick={() => handleVoiceGenderChange('female')}
              >
                <div className="text-2xl">👩</div>
                <div className="text-sm font-medium">女性</div>
              </button>
              <button
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  voiceGender === 'male' 
                    ? 'bg-primary border-primary text-white dark:bg-primary dark:border-primary dark:text-white' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-primary hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary dark:hover:bg-gray-700'
                }`}
                onClick={() => handleVoiceGenderChange('male')}
              >
                <div className="text-2xl">👨</div>
                <div className="text-sm font-medium">男性</div>
              </button>
            </div>
          </div>

          {/* 発音速度 */}
          <div className="voice-setting-group">
            <h4>⏱️ 発音速度</h4>
            <div className="speech-rate-slider">
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={speechRate}
                onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                className="slider"
                aria-label="発音速度"
              />
              <div className="slider-labels">
                <span>遅い (0.5x)</span>
                <span className="current-rate">{speechRate.toFixed(2)}x</span>
                <span>速い (1.5x)</span>
              </div>
            </div>
            <div className="theme-description">
              💡 {speechRate < 0.8 ? 'ゆっくりと発音します' : speechRate > 1.1 ? '速めに発音します' : '標準的な速度で発音します'}
            </div>
          </div>
        </div>

        {/* プライバシーポリシー */}
        <div className="simple-setting-section">
          <h3>📋 プライバシー</h3>
          <div className="privacy-links">
            <a 
              href="/privacy.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="privacy-link"
            >
              📄 プライバシーポリシー
            </a>
            <p className="privacy-note">
              本アプリは個人情報を収集せず、学習データはブラウザ内にのみ保存されます。
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsView;
