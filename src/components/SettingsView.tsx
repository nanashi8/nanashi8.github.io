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

  // 学習記録のリセット
  const handleResetProgress = () => {
    if (confirm('本当にすべての学習記録を削除しますか？この操作は元に戻せません。')) {
      // 学習記録のみクリア（プランと設定は保持）
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('quiz-result-') || key === 'progress-data')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      alert('学習記録をリセットしました');
      window.location.reload();
    }
  };

  // 学習プランのリセット
  const handleResetPlan = () => {
    if (confirm('学習プランをリセットしますか？学習記録は保持されます。')) {
      localStorage.removeItem('learning-schedule-90days');
      alert('学習プランをリセットしました');
      window.location.reload();
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-section">
        <div className="section-header">
          <h1>📚 学習プランナー</h1>
          <p className="section-description">
            期間と1日の語数、AIの人格を設定してください
          </p>
        </div>

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

        {/* 1日の学習単語数 */}
        <div className="simple-setting-section">
          <h3>🎯 1日の学習単語数</h3>
          <div className="slider-container">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={batchSize}
              onChange={(e) => handleBatchSizeChange(Number(e.target.value))}
              className="setting-slider"
              aria-label="1日の学習単語数"
            />
            <div className="slider-value">{batchSize}語</div>
          </div>
        </div>

        <div className="settings-divider"></div>

        {/* リセットボタン */}
        <div className="simple-setting-section">
          <h3>🔄 リセット</h3>
          <div className="reset-buttons">
            <button
              className="setting-button danger"
              onClick={handleResetProgress}
            >
              学習記録をリセット
            </button>
            <button
              className="setting-button danger"
              onClick={handleResetPlan}
            >
              プランをリセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
