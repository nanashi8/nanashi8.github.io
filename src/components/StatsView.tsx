import { useState, useEffect } from 'react';
import {
  loadProgress,
  getRecentResults,
  getStatsByMode,
  getWeakWords,
  getDailyStudyTime,
  QuizResult,
  UserProgress,
} from '../progressStorage';
import { QuestionSet, Question } from '../types';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
}

function StatsView({ questionSets, allQuestions, categoryList }: StatsViewProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'daily' | 'quiz' | 'category' | 'weak'>('overview');

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    const data = loadProgress();
    setProgress(data);
  };

  if (!progress) {
    return <div className="stats-view">読み込み中...</div>;
  }

  const stats = progress.statistics;
  const recentResults = getRecentResults(50);
  
  // 日別の統計を計算
  const getDailyStats = () => {
    const dailyMap = new Map<string, { quizCount: number; totalScore: number; totalQuestions: number; correctAnswers: number }>();
    
    recentResults.forEach(result => {
      const dateKey = new Date(result.date).toLocaleDateString('ja-JP');
      const existing = dailyMap.get(dateKey) || { quizCount: 0, totalScore: 0, totalQuestions: 0, correctAnswers: 0 };
      
      dailyMap.set(dateKey, {
        quizCount: existing.quizCount + 1,
        totalScore: existing.totalScore + result.percentage,
        totalQuestions: existing.totalQuestions + result.total,
        correctAnswers: existing.correctAnswers + result.score
      });
    });
    
    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        quizCount: data.quizCount,
        avgScore: data.totalScore / data.quizCount,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 14); // 最近14日分
  };

  const dailyStats = getDailyStats();
  
  // 今日の学習状況を取得
  const getTodayStats = () => {
    const today = new Date().toLocaleDateString('ja-JP');
    const todayResults = recentResults.filter(r => new Date(r.date).toLocaleDateString('ja-JP') === today);
    
    if (todayResults.length === 0) {
      return { quizCount: 0, avgScore: 0, totalQuestions: 0, correctAnswers: 0, studyTime: 0 };
    }
    
    return {
      quizCount: todayResults.length,
      avgScore: todayResults.reduce((sum, r) => sum + r.percentage, 0) / todayResults.length,
      totalQuestions: todayResults.reduce((sum, r) => sum + r.total, 0),
      correctAnswers: todayResults.reduce((sum, r) => sum + r.score, 0),
      studyTime: todayResults.reduce((sum, r) => sum + r.timeSpent, 0)
    };
  };
  
  const todayStats = getTodayStats();
  
  // 今週の学習状況
  const getWeekStats = () => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekResults = recentResults.filter(r => r.date >= weekAgo);
    
    if (weekResults.length === 0) {
      return { quizCount: 0, avgScore: 0, studyDays: 0 };
    }
    
    const uniqueDays = new Set(weekResults.map(r => new Date(r.date).toLocaleDateString('ja-JP')));
    
    return {
      quizCount: weekResults.length,
      avgScore: weekResults.reduce((sum, r) => sum + r.percentage, 0) / weekResults.length,
      studyDays: uniqueDays.size
    };
  };
  
  const weekStats = getWeekStats();

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>🎯 がんばり記録</h2>
        <div className="streak-badge">
          <span className="streak-flame">🔥</span>
          <span className="streak-number">{stats.streakDays}</span>
          <span className="streak-label">日連続</span>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="stats-tabs-new">
        <button
          className={`stats-tab-new ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-label">ホーム</span>
        </button>
        <button
          className={`stats-tab-new ${activeSection === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveSection('daily')}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">日別</span>
        </button>
        <button
          className={`stats-tab-new ${activeSection === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveSection('quiz')}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-label">クイズ別</span>
        </button>
        <button
          className={`stats-tab-new ${activeSection === 'category' ? 'active' : ''}`}
          onClick={() => setActiveSection('category')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">分野別</span>
        </button>
        <button
          className={`stats-tab-new ${activeSection === 'weak' ? 'active' : ''}`}
          onClick={() => setActiveSection('weak')}
        >
          <span className="tab-icon">💪</span>
          <span className="tab-label">弱点克服</span>
        </button>
      </div>

      {/* ホーム（概要）セクション */}
      {activeSection === 'overview' && (
        <div className="stats-section-new">
          {/* 今日の学習 */}
          <div className="today-section">
            <h3 className="section-title">
              <span className="title-icon">☀️</span>
              今日の学習
            </h3>
            {todayStats.quizCount > 0 ? (
              <div className="today-cards">
                <div className="today-card">
                  <div className="today-card-icon">📚</div>
                  <div className="today-card-value">{todayStats.quizCount}</div>
                  <div className="today-card-label">クイズ</div>
                </div>
                <div className="today-card">
                  <div className="today-card-icon">✨</div>
                  <div className="today-card-value">{todayStats.avgScore.toFixed(0)}%</div>
                  <div className="today-card-label">正答率</div>
                </div>
                <div className="today-card">
                  <div className="today-card-icon">⏱️</div>
                  <div className="today-card-value">{Math.floor(todayStats.studyTime / 60)}</div>
                  <div className="today-card-label">分</div>
                </div>
                <div className="today-card">
                  <div className="today-card-icon">✅</div>
                  <div className="today-card-value">{todayStats.correctAnswers}/{todayStats.totalQuestions}</div>
                  <div className="today-card-label">正解数</div>
                </div>
              </div>
            ) : (
              <div className="no-study-today">
                <p className="no-study-message">今日はまだ学習していません</p>
                <p className="no-study-encourage">さあ、クイズに挑戦しよう！ 💪</p>
              </div>
            )}
          </div>

          {/* 今週の学習 */}
          <div className="week-section">
            <h3 className="section-title">
              <span className="title-icon">📈</span>
              今週の学習（最近7日間）
            </h3>
            <div className="week-stats">
              <div className="week-stat-item">
                <div className="week-stat-label">学習日数</div>
                <div className="week-stat-value">{weekStats.studyDays}<span className="week-stat-unit">日</span></div>
              </div>
              <div className="week-stat-item">
                <div className="week-stat-label">クイズ回数</div>
                <div className="week-stat-value">{weekStats.quizCount}<span className="week-stat-unit">回</span></div>
              </div>
              <div className="week-stat-item">
                <div className="week-stat-label">平均正答率</div>
                <div className="week-stat-value">{weekStats.avgScore.toFixed(0)}<span className="week-stat-unit">%</span></div>
              </div>
            </div>
          </div>

          {/* 全体の記録 */}
          <div className="overall-section">
            <h3 className="section-title">
              <span className="title-icon">🏆</span>
              全体の記録
            </h3>
            <div className="overall-stats">
              <div className="overall-stat-card">
                <div className="overall-stat-icon">📝</div>
                <div className="overall-stat-content">
                  <div className="overall-stat-value">{stats.totalQuizzes}</div>
                  <div className="overall-stat-label">総クイズ数</div>
                </div>
              </div>
              <div className="overall-stat-card">
                <div className="overall-stat-icon">❓</div>
                <div className="overall-stat-content">
                  <div className="overall-stat-value">{stats.totalQuestions}</div>
                  <div className="overall-stat-label">総問題数</div>
                </div>
              </div>
              <div className="overall-stat-card">
                <div className="overall-stat-icon">📊</div>
                <div className="overall-stat-content">
                  <div className="overall-stat-value">{stats.averageScore.toFixed(0)}%</div>
                  <div className="overall-stat-label">平均正答率</div>
                </div>
              </div>
              <div className="overall-stat-card">
                <div className="overall-stat-icon">📆</div>
                <div className="overall-stat-content">
                  <div className="overall-stat-value">
                    {stats.lastStudyDate > 0
                      ? new Date(stats.lastStudyDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
                      : '-'}
                  </div>
                  <div className="overall-stat-label">最終学習日</div>
                </div>
              </div>
            </div>
          </div>

          {/* モード別の得意・苦手 */}
          <div className="mode-section">
            <h3 className="section-title">
              <span className="title-icon">🎮</span>
              モード別
            </h3>
            <div className="mode-cards">
              {[
                { mode: 'translation', emoji: '🇯🇵', name: '和訳クイズ', stats: getStatsByMode('translation') },
                { mode: 'spelling', emoji: '✍️', name: 'スペルクイズ', stats: getStatsByMode('spelling') },
                { mode: 'reading', emoji: '📖', name: '読解クイズ', stats: getStatsByMode('reading') }
              ].map(({ mode, emoji, name, stats: modeStats }) => (
                <div key={mode} className="mode-card">
                  <div className="mode-card-header">
                    <span className="mode-emoji">{emoji}</span>
                    <span className="mode-name">{name}</span>
                  </div>
                  <div className="mode-card-stats">
                    <div className="mode-stat">
                      <span className="mode-stat-value">{modeStats.totalQuizzes}</span>
                      <span className="mode-stat-label">回</span>
                    </div>
                    <div className="mode-stat-divider"></div>
                    <div className="mode-stat">
                      <span className="mode-stat-value">{modeStats.averageScore.toFixed(0)}%</span>
                      <span className="mode-stat-label">正答率</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 日別セクション */}
      {activeSection === 'daily' && (
        <div className="stats-section-new">
          <h3 className="section-title">
            <span className="title-icon">📅</span>
            日別の学習記録
          </h3>
          {dailyStats.length > 0 ? (
            <div className="daily-list">
              {dailyStats.map((day, index) => {
                const isToday = day.date === new Date().toLocaleDateString('ja-JP');
                return (
                  <div key={index} className={`daily-item ${isToday ? 'today' : ''}`}>
                    <div className="daily-date">
                      {isToday && <span className="today-badge">今日</span>}
                      <span className="date-text">{day.date}</span>
                    </div>
                    <div className="daily-stats-grid">
                      <div className="daily-stat">
                        <span className="daily-stat-icon">📚</span>
                        <span className="daily-stat-value">{day.quizCount}回</span>
                      </div>
                      <div className="daily-stat">
                        <span className="daily-stat-icon">✨</span>
                        <span className="daily-stat-value">{day.avgScore.toFixed(0)}%</span>
                      </div>
                      <div className="daily-stat">
                        <span className="daily-stat-icon">✅</span>
                        <span className="daily-stat-value">{day.correctAnswers}/{day.totalQuestions}</span>
                      </div>
                    </div>
                    <div className="daily-progress-bar">
                      <div 
                        className="daily-progress-fill"
                        style={{ width: `${day.avgScore}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-data-message">
              <p>まだ学習記録がありません</p>
              <p className="encourage-text">クイズに挑戦して記録を作ろう！ 🚀</p>
            </div>
          )}
        </div>
      )}

      {/* クイズ別セクション */}
      {activeSection === 'quiz' && (
        <div className="stats-section-new">
          <h3 className="section-title">
            <span className="title-icon">📝</span>
            最近のクイズ結果
          </h3>
          {recentResults.length > 0 ? (
            <div className="quiz-list">
              {recentResults.slice(0, 20).map((result) => {
                const date = new Date(result.date);
                const modeEmoji = result.mode === 'translation' ? '🇯🇵' : result.mode === 'spelling' ? '✍️' : '📖';
                const scoreClass = result.percentage >= 80 ? 'excellent' : result.percentage >= 60 ? 'good' : 'needswork';
                
                return (
                  <div key={result.id} className="quiz-result-card">
                    <div className="quiz-result-header">
                      <span className="quiz-mode-emoji">{modeEmoji}</span>
                      <span className="quiz-date">
                        {date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                        {' '}
                        {date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="quiz-result-body">
                      <div className={`quiz-score ${scoreClass}`}>
                        <div className="quiz-score-value">{result.percentage.toFixed(0)}%</div>
                        <div className="quiz-score-label">
                          {result.score}/{result.total}問正解
                        </div>
                      </div>
                      <div className="quiz-details">
                        {result.category && (
                          <span className="quiz-tag">{result.category}</span>
                        )}
                        {result.difficulty && (
                          <span className="quiz-tag">{result.difficulty}</span>
                        )}
                        <span className="quiz-time">
                          ⏱️ {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    {result.percentage >= 90 && result.percentage < 100 && (
                      <div className="quiz-badge">🏅 すごい！</div>
                    )}
                    {result.percentage === 100 && (
                      <div className="quiz-badge perfect">🎉 パーフェクト！</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-data-message">
              <p>まだクイズ結果がありません</p>
              <p className="encourage-text">最初のクイズに挑戦しよう！ 💪</p>
            </div>
          )}
        </div>
      )}

      {/* 分野別セクション */}
      {activeSection === 'category' && (
        <div className="stats-section-new">
          <h3 className="section-title">
            <span className="title-icon">📊</span>
            関連分野別の成績
          </h3>
          <div className="category-list">
            {categoryList.map(category => {
              const categoryWords = allQuestions.filter(q => q.category === category);
              const results = getRecentResults(100).filter(r => r.category === category);
              const avgScore = results.length > 0
                ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
                : 0;
              
              const getGrade = (score: number) => {
                if (score >= 90) return { label: 'とても良い', emoji: '🌟', class: 'excellent' };
                if (score >= 75) return { label: '良い', emoji: '😊', class: 'good' };
                if (score >= 60) return { label: 'まあまあ', emoji: '🙂', class: 'ok' };
                if (score > 0) return { label: 'がんばろう', emoji: '💪', class: 'needswork' };
                return { label: '未学習', emoji: '📝', class: 'not-started' };
              };
              
              const grade = getGrade(avgScore);
              
              return (
                <div key={category} className={`category-card ${grade.class}`}>
                  <div className="category-header">
                    <h4 className="category-name">{category}</h4>
                    <span className="category-grade-emoji">{grade.emoji}</span>
                  </div>
                  <div className="category-body">
                    <div className="category-progress-bar">
                      <div 
                        className="category-progress-fill"
                        style={{ width: `${avgScore}%` }}
                      ></div>
                    </div>
                    <div className="category-stats-row">
                      <span className="category-stat">
                        📖 {categoryWords.length}語
                      </span>
                      <span className="category-stat">
                        ✨ {results.length}回
                      </span>
                      <span className="category-stat">
                        {avgScore > 0 ? `${avgScore.toFixed(0)}%` : '-'}
                      </span>
                    </div>
                    <div className="category-grade-label">{grade.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 弱点克服セクション */}
      {activeSection === 'weak' && (
        <div className="stats-section-new">
          <h3 className="section-title">
            <span className="title-icon">💪</span>
            弱点を克服しよう
          </h3>
          {getWeakWords(15).length > 0 ? (
            <>
              <p className="weak-intro">よく間違える単語を復習して、苦手を克服しよう！</p>
              <div className="weak-words-grid">
                {getWeakWords(15).map((item, index) => (
                  <div key={item.word} className="weak-word-card">
                    <div className="weak-word-rank">
                      {index + 1}
                      {index === 0 && <span className="rank-badge">👑</span>}
                    </div>
                    <div className="weak-word-content">
                      <div className="weak-word-text">{item.word}</div>
                      <div className="weak-word-mistakes">
                        {Array.from({ length: Math.min(item.mistakes, 5) }).map((_, i) => (
                          <span key={i} className="mistake-dot">❌</span>
                        ))}
                        {item.mistakes > 5 && <span className="mistake-count">+{item.mistakes - 5}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="weak-encouragement">
                <p>💡 これらの単語を集中して復習すると、成績がぐんと上がるよ！</p>
              </div>
            </>
          ) : (
            <div className="no-data-message">
              <p>素晴らしい！ 🎉</p>
              <p className="encourage-text">まだ苦手な単語がありません</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default StatsView;
