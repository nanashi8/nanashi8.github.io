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
    return saved ? parseFloat(saved) : 0.9; // 高校入試リスニング速度
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
    <div className="w-full px-4 py-6 space-y-6">
      {/* 学習プラン設定 */}
      <LearningPlanView
        allQuestions={allQuestions}
        onStartSession={onStartSession}
      />

      {/* AI人格選択 */}
      <div className="bg-card-bg rounded-xl p-6 shadow-md border-2 border-card-border">
        <h3 className="text-xl font-bold text-text-color mb-4 flex items-center gap-2">
          <span>🎭</span>
          <span>AIの人格</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.entries(PERSONALITY_INFO) as [AIPersonality, typeof PERSONALITY_INFO[AIPersonality]][]).map(([key, info]) => (
            <button
              key={key}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                aiPersonality === key
                  ? 'bg-primary border-primary text-white shadow-lg scale-105'
                  : 'bg-bg-secondary border-border-color text-text-color hover:border-primary hover:shadow-md hover:scale-102'
              }`}
              onClick={() => handlePersonalityChange(key)}
            >
              <div className="text-3xl">{info.avatar}</div>
              <div className="font-semibold text-sm">{info.name}</div>
              <div className="text-xs opacity-80 text-center">{info.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 
        ダークモード切り替え - 将来実装予定
        ---
        ダークモード機能は完璧な実装が完成するまで非表示にしています。
        ロジック（darkMode state, applyDarkMode, handleDarkModeChange）は
        src/components/SettingsView.tsx に残されており、将来の完全実装時に
        このセクションを復活させるだけで使用できます。
        
        関連コード:
        - SettingsView.tsx (L71-115): darkMode state & logic
        - App.tsx (L273-287): applyDarkMode logic
        - main.tsx (L8-36): initialization logic
        - src/styles/themes/dark.css: CSS variables (will be used)
      */}

      {/* 音声設定 */}
      <div className="bg-card-bg rounded-xl p-6 shadow-md border-2 border-card-border">
        <h3 className="text-xl font-bold text-text-color mb-4 flex items-center gap-2">
          <span>🔊</span>
          <span>音声設定</span>
        </h3>
        
        {/* 声の種類 */}
        <div className="mb-6">
          <h4 className="text-base font-semibold text-text-color mb-3 flex items-center gap-2">
            <span>🎤</span>
            <span>声の種類</span>
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-all duration-200 ${
                voiceGender === 'female'
                  ? 'bg-primary border-primary text-white shadow-lg scale-105'
                  : 'bg-bg-secondary border-border-color text-text-color hover:border-primary hover:shadow-md'
              }`}
              onClick={() => handleVoiceGenderChange('female')}
            >
              <div className="text-3xl">👩</div>
              <div className="text-sm font-semibold">女性</div>
            </button>
            <button
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-all duration-200 ${
                voiceGender === 'male'
                  ? 'bg-primary border-primary text-white shadow-lg scale-105'
                  : 'bg-bg-secondary border-border-color text-text-color hover:border-primary hover:shadow-md'
              }`}
              onClick={() => handleVoiceGenderChange('male')}
            >
              <div className="text-3xl">👨</div>
              <div className="text-sm font-semibold">男性</div>
            </button>
          </div>
        </div>

        {/* 発音速度 */}
        <div>
          <h4 className="text-base font-semibold text-text-color mb-3 flex items-center gap-2">
            <span>⏱️</span>
            <span>発音速度</span>
            <span className="text-xs font-normal text-text-secondary">(WPM: Words Per Minute)</span>
          </h4>
          <div className="bg-bg-secondary rounded-lg p-6">
            {/* 現在の速度表示 */}
            <div className="text-center mb-6">
              <div className="font-bold text-primary text-4xl mb-1">{Math.round(speechRate * 150)}</div>
              <div className="text-sm text-text-secondary">WPM</div>
              <div className="text-xs text-text-secondary mt-2">
                {speechRate < 0.75 ? '🐢 ゆっくりと発音' : speechRate >= 0.95 ? '🚀 ネイティブ並の速度' : '🎯 高校入試リスニング相当'}
              </div>
            </div>

            {/* スライダー */}
            <div className="relative mb-8">
              <input
                type="range"
                min="0.6"
                max="1.0"
                step="0.05"
                value={speechRate}
                onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="発音速度"
              />
              {/* 目安マーカー */}
              <div className="absolute top-0 left-0 w-full h-3 pointer-events-none">
                {/* 0.6 (90 WPM) - 最低速度 (0%) */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-0.5 h-5 bg-gray-400"></div>
                {/* 0.75 (113 WPM) - 初学者向け (37.5%: (0.75-0.6)/(1.0-0.6) = 0.15/0.4 = 0.375) */}
                <div className="absolute top-1/2 left-[37.5%] -translate-y-1/2 w-0.5 h-5 bg-blue-500"></div>
                {/* 0.9 (135 WPM) - 高校入試 (75%: (0.9-0.6)/(1.0-0.6) = 0.3/0.4 = 0.75) */}
                <div className="absolute top-1/2 left-[75%] -translate-y-1/2 w-0.5 h-5 bg-green-500"></div>
                {/* 1.0 (150 WPM) - ネイティブ (100%) */}
                <div className="absolute top-1/2 left-full -translate-y-1/2 -translate-x-0.5 w-0.5 h-5 bg-orange-500"></div>
              </div>
            </div>

            {/* 目安ラベル */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <button
                onClick={() => handleSpeechRateChange(0.6)}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <div className="font-bold text-gray-600 dark:text-gray-400">90 WPM</div>
                <div className="text-gray-500 dark:text-gray-400 mt-1">最低速度</div>
              </button>
              <button
                onClick={() => handleSpeechRateChange(0.75)}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors cursor-pointer"
              >
                <div className="font-bold text-blue-600 dark:text-blue-400">113 WPM</div>
                <div className="text-blue-500 dark:text-blue-300 mt-1">初学者向け</div>
              </button>
              <button
                onClick={() => handleSpeechRateChange(0.9)}
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors cursor-pointer"
              >
                <div className="font-bold text-green-600 dark:text-green-400">135 WPM</div>
                <div className="text-green-500 dark:text-green-300 mt-1">高校入試</div>
              </button>
              <button
                onClick={() => handleSpeechRateChange(1.0)}
                className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors cursor-pointer"
              >
                <div className="font-bold text-orange-600 dark:text-orange-400">150 WPM</div>
                <div className="text-orange-500 dark:text-orange-300 mt-1">ネイティブ</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* プライバシーポリシー */}
      <div className="bg-card-bg rounded-xl p-6 shadow-md border-2 border-card-border">
        <h3 className="text-xl font-bold text-text-color mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>プライバシー</span>
        </h3>
        <div className="space-y-3">
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 bg-primary text-white text-center rounded-lg font-semibold hover:bg-btn-primary-hover transition-colors shadow-md"
          >
            📄 プライバシーポリシー
          </a>
          <p className="text-sm text-text-secondary bg-bg-secondary px-4 py-3 rounded-lg text-center">
            本アプリは個人情報を収集せず、学習データはブラウザ内にのみ保存されます。
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
