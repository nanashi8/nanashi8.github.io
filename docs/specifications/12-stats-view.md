# 統計・分析画面仕様書

## 📌 概要

学習進捗を可視化し、弱点を分析するための統計画面。

**作成日**: 2025年11月19日  
**最終更新**: 2025年11月19日

## 🎯 機能要件

### 表示項目

1. **全体統計**
   - 総クイズ数
   - 正答数/誤答数
   - 全体正答率
   - 習熟単語数（new / learning / mastered）

2. **カテゴリー別分析**
   - レーダーチャート表示
   - 各カテゴリーの正答率
   - 弱点カテゴリーの特定

3. **難易度別分析**
   - 初級/中級/上級の正答率
   - 各難易度の学習進捗

4. **学習履歴**
   - 最近の学習記録（10件）
   - 日別学習時間グラフ
   - 週別進捗

5. **弱点単語リスト**
   - 間違えた回数の多い単語
   - 復習推奨単語

## 📊 データ構造

### 統計データ型

```typescript
interface OverallStats {
  totalQuizzes: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  masteredWords: number;
  learningWords: number;
  newWords: number;
}

interface CategoryStats {
  category: string;
  totalStudied: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
}

interface DifficultyStats {
  difficulty: string;
  totalStudied: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
}

interface WeakWord {
  word: string;
  meaning: string;
  category: string;
  difficulty: string;
  mistakes: number;
  lastStudied: number;
}
```

## 🔧 実装詳細

### StatsView.tsx

```typescript
import { useState, useEffect } from 'react';
import { Question } from '../types';
import { loadProgress, getStatsByCategory, getStatsByDifficulty, getWeakWords } from '../progressStorage';
import CategoryRadarChart from './CategoryRadarChart';

interface StatsViewProps {
  allQuestions: Question[];
  categoryList: string[];
}

export default function StatsView({ allQuestions, categoryList }: StatsViewProps) {
  const [overallStats, setOverallStats] = useState({
    totalQuizzes: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    overallAccuracy: 0,
    masteredWords: 0,
    learningWords: 0,
    newWords: 0,
  });
  
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [difficultyStats, setDifficultyStats] = useState<DifficultyStats[]>([]);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = () => {
    const progress = loadProgress();
    
    // 全体統計
    const accuracy = progress.totalQuizzes > 0
      ? (progress.totalCorrect / (progress.totalCorrect + progress.totalIncorrect)) * 100
      : 0;
    
    // 習熟度別カウント
    let mastered = 0, learning = 0, newCount = 0;
    Object.values(progress.wordProgress).forEach(wp => {
      if (wp.masteryLevel === 'mastered') mastered++;
      else if (wp.masteryLevel === 'learning') learning++;
      else newCount++;
    });
    
    setOverallStats({
      totalQuizzes: progress.totalQuizzes,
      totalCorrect: progress.totalCorrect,
      totalIncorrect: progress.totalIncorrect,
      overallAccuracy: accuracy,
      masteredWords: mastered,
      learningWords: learning,
      newWords: newCount,
    });
    
    // カテゴリー別統計
    const catStats = getStatsByCategory();
    const catArray: CategoryStats[] = [];
    catStats.forEach((stats, category) => {
      catArray.push({
        category,
        totalStudied: stats.totalCount,
        correctCount: stats.correctCount,
        incorrectCount: stats.totalCount - stats.correctCount,
        accuracy: stats.accuracy,
      });
    });
    setCategoryStats(catArray.sort((a, b) => a.accuracy - b.accuracy));
    
    // 難易度別統計
    const diffStats = getStatsByDifficulty();
    const diffArray: DifficultyStats[] = [];
    diffStats.forEach((stats, difficulty) => {
      diffArray.push({
        difficulty,
        totalStudied: stats.totalCount,
        correctCount: stats.correctCount,
        incorrectCount: stats.totalCount - stats.correctCount,
        accuracy: stats.accuracy,
      });
    });
    setDifficultyStats(diffArray);
    
    // 弱点単語
    const weakWordsData = getWeakWords(10);
    const weakWordsWithMeaning = weakWordsData.map(ww => {
      const question = allQuestions.find(q => q.word === ww.word);
      return {
        ...ww,
        meaning: question?.meaning || '',
        category: question?.category || '',
        difficulty: question?.difficulty || '',
        lastStudied: progress.wordProgress[ww.word]?.lastStudied || 0,
      };
    });
    setWeakWords(weakWordsWithMeaning);
  };
  
  return (
    <div className="stats-view">
      <h2>📊 学習統計</h2>
      
      {/* 全体統計 */}
      <section className="stats-section">
        <h3>全体統計</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{overallStats.totalQuizzes}</div>
            <div className="stat-label">総クイズ数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{overallStats.totalCorrect}</div>
            <div className="stat-label">正答数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{overallStats.totalIncorrect}</div>
            <div className="stat-label">誤答数</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">{overallStats.overallAccuracy.toFixed(1)}%</div>
            <div className="stat-label">正答率</div>
          </div>
        </div>
        
        <div className="mastery-stats">
          <h4>習熟度別単語数</h4>
          <div className="mastery-grid">
            <div className="mastery-item">
              <span className="mastery-badge new">New</span>
              <span className="mastery-count">{overallStats.newWords}</span>
            </div>
            <div className="mastery-item">
              <span className="mastery-badge learning">Learning</span>
              <span className="mastery-count">{overallStats.learningWords}</span>
            </div>
            <div className="mastery-item">
              <span className="mastery-badge mastered">Mastered</span>
              <span className="mastery-count">{overallStats.masteredWords}</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* カテゴリー別分析 */}
      <section className="stats-section">
        <h3>カテゴリー別分析</h3>
        <CategoryRadarChart categoryStats={categoryStats} categoryList={categoryList} />
        
        <div className="category-list">
          {categoryStats.map(cs => (
            <div key={cs.category} className="category-stat-item">
              <div className="category-name">{cs.category}</div>
              <div className="category-progress">
                <div
                  className="category-progress-bar"
                  style={{ width: `${cs.accuracy}%` }}
                />
              </div>
              <div className="category-accuracy">
                {cs.accuracy.toFixed(1)}%
                <span className="category-count">
                  ({cs.correctCount}/{cs.totalStudied})
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* 難易度別分析 */}
      <section className="stats-section">
        <h3>難易度別分析</h3>
        <div className="difficulty-stats">
          {difficultyStats.map(ds => (
            <div key={ds.difficulty} className="difficulty-stat-card">
              <h4>{ds.difficulty}</h4>
              <div className="difficulty-accuracy">{ds.accuracy.toFixed(1)}%</div>
              <div className="difficulty-details">
                正解: {ds.correctCount} / {ds.totalStudied}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* 弱点単語 */}
      <section className="stats-section">
        <h3>復習推奨単語 Top 10</h3>
        <div className="weak-words-list">
          {weakWords.map((ww, index) => (
            <div key={ww.word} className="weak-word-item">
              <div className="weak-word-rank">#{index + 1}</div>
              <div className="weak-word-info">
                <div className="weak-word-word">{ww.word}</div>
                <div className="weak-word-meaning">{ww.meaning}</div>
                <div className="weak-word-meta">
                  <span className="weak-word-category">{ww.category}</span>
                  <span className="weak-word-difficulty">{ww.difficulty}</span>
                </div>
              </div>
              <div className="weak-word-mistakes">
                ❌ {ww.mistakes}回
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

## 🎨 スタイリング

### CSS（App.css内）

```css
/* 統計画面 */
.stats-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.stats-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

/* 全体統計グリッド */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.stat-card.highlight {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: white;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 習熟度統計 */
.mastery-stats {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
}

.mastery-stats h4 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.mastery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.mastery-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border-radius: 6px;
}

.mastery-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
}

.mastery-badge.new {
  background: #e3f2fd;
  color: #1976d2;
}

.mastery-badge.learning {
  background: #fff3e0;
  color: #f57c00;
}

.mastery-badge.mastered {
  background: #e8f5e9;
  color: #388e3c;
}

.mastery-count {
  font-size: 1.5rem;
  font-weight: bold;
}

/* カテゴリー統計 */
.category-list {
  margin-top: 2rem;
}

.category-stat-item {
  display: grid;
  grid-template-columns: 150px 1fr 100px;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.category-stat-item:last-child {
  border-bottom: none;
}

.category-name {
  font-weight: 600;
}

.category-progress {
  background: var(--bg-secondary);
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
}

.category-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color));
  transition: width 0.3s;
}

.category-accuracy {
  text-align: right;
  font-weight: 600;
}

.category-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

/* 難易度統計 */
.difficulty-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.difficulty-stat-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.difficulty-stat-card h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.difficulty-accuracy {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.difficulty-details {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 弱点単語リスト */
.weak-words-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.weak-word-item {
  display: grid;
  grid-template-columns: 50px 1fr 100px;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border-left: 4px solid var(--danger-color);
}

.weak-word-rank {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-align: center;
}

.weak-word-info {
  flex: 1;
}

.weak-word-word {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.weak-word-meaning {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.weak-word-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}

.weak-word-category,
.weak-word-difficulty {
  padding: 0.25rem 0.5rem;
  background: var(--primary-light);
  border-radius: 4px;
}

.weak-word-mistakes {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--danger-color);
  text-align: right;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .mastery-grid {
    grid-template-columns: 1fr;
  }
  
  .category-stat-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .weak-word-item {
    grid-template-columns: 1fr;
  }
}
```

## 🔄 App.tsx統合

```typescript
import StatsView from './components/StatsView';

// タブ型にstatsを追加
type Tab = 'translation' | 'spelling' | 'reading' | 'settings' | 'stats';

// タブメニュー
<button
  className={activeTab === 'stats' ? 'active' : ''}
  onClick={() => setActiveTab('stats')}
>
  📊 統計
</button>

// コンテンツ
{activeTab === 'stats' && (
  <StatsView
    allQuestions={allQuestions}
    categoryList={categoryList}
  />
)}
```

## 🔄 機能復元手順

1. `src/components/StatsView.tsx` を作成
2. レーダーチャートコンポーネント `CategoryRadarChart.tsx` を作成
3. `App.css` にスタイルを追加
4. `App.tsx` に統合
5. 進捗データが正しく表示されることを確認

## 📝 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-11-19 | 初版作成 |
