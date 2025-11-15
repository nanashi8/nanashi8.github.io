import { useState } from 'react';
import type { Question } from '../types';
import { DifficultyLevel, WordPhraseFilter, PhraseTypeFilter } from '../App';
import LearningPlanView from './LearningPlanView';

interface SettingsViewProps {
  allQuestions: Question[];
  categoryList: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  selectedWordPhraseFilter: WordPhraseFilter;
  onWordPhraseFilterChange: (filter: WordPhraseFilter) => void;
  selectedPhraseTypeFilter: PhraseTypeFilter;
  onPhraseTypeFilterChange: (filter: PhraseTypeFilter) => void;
  onStartSession: (mode: 'morning' | 'afternoon' | 'evening', questions: Question[]) => void;
}

function SettingsView({
  allQuestions,
  categoryList,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedWordPhraseFilter,
  onWordPhraseFilterChange,
  selectedPhraseTypeFilter,
  onPhraseTypeFilterChange,
  onStartSession,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<'filters' | 'plan' | 'advanced'>('filters');
  
  // localStorageからバッチサイズを読み込み
  const [batchSize, setBatchSize] = useState<number>(() => {
    const saved = localStorage.getItem('batchSize');
    return saved ? parseInt(saved, 10) : 20;
  });

  // バッチサイズ変更時にlocalStorageに保存
  const handleBatchSizeChange = (newSize: number) => {
    setBatchSize(newSize);
    localStorage.setItem('batchSize', newSize.toString());
  };

  return (
    <div className="settings-view">
      {/* セクション選択タブ */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeSection === 'filters' ? 'active' : ''}`}
          onClick={() => setActiveSection('filters')}
        >
          📚 問題の絞り込み
        </button>
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

      {/* 問題の絞り込みセクション */}
      {activeSection === 'filters' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>📚 出題範囲の選択</h2>
            <p className="section-description">
              カテゴリーやレベルを選んで、自分に合った問題に絞り込めるよ！
            </p>
          </div>

          <div className="settings-grid">
            {/* カテゴリー選択 */}
            <div className="setting-card">
              <div className="setting-icon">📂</div>
              <div className="setting-content">
                <h3>分野を選ぶ</h3>
                <p>学校や日常生活など、テーマで絞り込み</p>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="setting-select"
                  aria-label="分野を選択"
                >
                  <option value="all">全ての分野</option>
                  {categoryList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 難易度選択 */}
            <div className="setting-card">
              <div className="setting-icon">⭐</div>
              <div className="setting-content">
                <h3>レベルを選ぶ</h3>
                <p>初級・中級・上級から選んで挑戦</p>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
                  className="setting-select"
                  aria-label="レベルを選択"
                >
                  <option value="all">全てのレベル</option>
                  <option value="beginner">初級（基礎）</option>
                  <option value="intermediate">中級（標準）</option>
                  <option value="advanced">上級（難関）</option>
                </select>
              </div>
            </div>

            {/* 単語/熟語フィルター */}
            <div className="setting-card">
              <div className="setting-icon">📝</div>
              <div className="setting-content">
                <h3>単語か熟語か</h3>
                <p>単語だけ、熟語だけ、または両方</p>
                <select
                  value={selectedWordPhraseFilter}
                  onChange={(e) => onWordPhraseFilterChange(e.target.value as WordPhraseFilter)}
                  className="setting-select"
                  aria-label="単語か熟語かを選択"
                >
                  <option value="all">単語+熟語</option>
                  <option value="words-only">単語のみ</option>
                  <option value="phrases-only">熟語のみ</option>
                </select>
              </div>
            </div>

            {/* 熟語タイプフィルター */}
            {selectedWordPhraseFilter !== 'words-only' && (
              <div className="setting-card">
                <div className="setting-icon">🔤</div>
                <div className="setting-content">
                  <h3>熟語の種類</h3>
                  <p>句動詞・慣用句・コロケーション</p>
                  <select
                    value={selectedPhraseTypeFilter}
                    onChange={(e) => onPhraseTypeFilterChange(e.target.value as PhraseTypeFilter)}
                    className="setting-select"
                    aria-label="熟語の種類を選択"
                  >
                    <option value="all">全ての熟語</option>
                    <option value="phrasal-verb">句動詞</option>
                    <option value="idiom">慣用句</option>
                    <option value="collocation">コロケーション</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 現在の出題範囲サマリー */}
          <div className="filter-summary">
            <h4>📊 現在の出題範囲</h4>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">対象問題数:</span>
                <span className="stat-value">
                  {allQuestions.filter(q => {
                    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
                    if (selectedDifficulty !== 'all') {
                      const diffMap = { 'beginner': '初級', 'intermediate': '中級', 'advanced': '上級' };
                      if (q.difficulty !== diffMap[selectedDifficulty]) return false;
                    }
                    if (selectedWordPhraseFilter === 'words-only' && q.word.includes(' ')) return false;
                    if (selectedWordPhraseFilter === 'phrases-only' && !q.word.includes(' ')) return false;
                    return true;
                  }).length}問
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
