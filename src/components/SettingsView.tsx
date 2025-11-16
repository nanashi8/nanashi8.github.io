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
  const [activeSection, setActiveSection] = useState<'plan' | 'advanced'>('plan');
  
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

  return (
    <div className="settings-view">
      {/* セクション選択タブ */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeSection === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveSection('plan')}
        >
          🎯 学習プラン
        </button>
        <button
          className={`settings-tab ${activeSection === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveSection('advanced')}
        >
          ⚙️ 詳細設定
        </button>
      </div>

      {/* 学習プランセクション */}
      {activeSection === 'plan' && (
        <div className="settings-section">
          <LearningPlanView
            allQuestions={allQuestions}
            onStartSession={onStartSession}
          />
        </div>
      )}

      {/* 詳細設定セクション */}
      {activeSection === 'advanced' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>⚙️ 学習の詳細設定</h2>
            <p className="section-description">
              繰り返し学習の設定や、自分に合った学習方法をカスタマイズできるよ！
            </p>
          </div>

          <div className="settings-grid">
            {/* AI人格選択 */}
            <div className="setting-card">
              <div className="setting-icon">🎭</div>
              <div className="setting-content">
                <h3>AIの人格</h3>
                <p>学習を応援するAIの性格を選べます</p>
                
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
            </div>

            {/* バッチサイズ設定 */}
            <div className="setting-card">
              <div className="setting-icon">🎯</div>
              <div className="setting-content">
                <h3>1回の学習単語数</h3>
                <p>一度に挑戦する問題の数（10〜100問）</p>
                <div className="slider-container">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={batchSize}
                    onChange={(e) => handleBatchSizeChange(Number(e.target.value))}
                    className="setting-slider"
                    aria-label="1回の学習単語数"
                  />
                  <div className="slider-value">{batchSize}問</div>
                </div>
                <div className="setting-hint">
                  💡 おすすめ: 初めは20問から始めよう！
                </div>
              </div>
            </div>

            {/* 自動提案機能（将来実装） */}
            <div className="setting-card disabled">
              <div className="setting-icon">🤖</div>
              <div className="setting-content">
                <h3>AIおすすめ設定</h3>
                <p>あなたの学習記録から最適な設定を提案</p>
                <button className="setting-button" disabled>
                  🚧 近日公開予定
                </button>
                <div className="setting-hint">
                  💭 学習データが溜まったら、あなたに最適な設定を提案します
                </div>
              </div>
            </div>

            {/* データリセット */}
            <div className="setting-card">
              <div className="setting-icon">🗑️</div>
              <div className="setting-content">
                <h3>学習記録のリセット</h3>
                <p>すべての進捗データを削除して最初からやり直す</p>
                <button
                  className="setting-button danger"
                  onClick={() => {
                    if (confirm('本当にすべての学習記録を削除しますか？この操作は元に戻せません。')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  ⚠️ すべてリセット
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;
