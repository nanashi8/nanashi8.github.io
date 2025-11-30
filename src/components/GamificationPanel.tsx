import { useState, useEffect } from 'react';
import {
  loadGamificationStats,
  GamificationStats,
  getNextMilestone,
  getBadgeCompletionRate,
  BADGE_DEFINITIONS,
} from '../gamificationAI';
import './GamificationPanel.css';

interface GamificationPanelProps {
  onClose?: () => void;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ onClose }) => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'milestones'>('overview');

  useEffect(() => {
    const loadedStats = loadGamificationStats();
    setStats(loadedStats);
  }, []);

  const nextMilestone = getNextMilestone();
  const badgeCompletionRate = getBadgeCompletionRate();
  const xpProgress = (stats.level.currentXP / stats.level.requiredXP) * 100;

  return (
    <div className="gamification-panel">
      {onClose && (
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      )}

      {/* レベル・経験値表示 */}
      <div className="level-section">
        <div className="level-badge">
          <div className="level-number">Lv.{stats.level.level}</div>
          <div className="level-label">レベル</div>
        </div>
        <div className="xp-info">
          <div className="xp-text">
            {stats.level.currentXP} / {stats.level.requiredXP} XP
          </div>
          <div className="xp-bar">
            <div className="xp-fill" data-width={Math.round(xpProgress)} />
          </div>
          <div className="xp-next">
            次のレベルまで {stats.level.requiredXP - stats.level.currentXP} XP
          </div>
        </div>
      </div>

      {/* ストリーク表示 */}
      <div className="streak-section">
        <div className="streak-card">
          <div className="streak-icon">🔥</div>
          <div className="streak-info">
            <div className="streak-current">{stats.streak.current}日</div>
            <div className="streak-label">連続学習</div>
          </div>
        </div>
        <div className="streak-card">
          <div className="streak-icon">🏆</div>
          <div className="streak-info">
            <div className="streak-current">{stats.streak.longest}日</div>
            <div className="streak-label">最長記録</div>
          </div>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="stats-summary">
        <div className="stat-item">
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">セッション数</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.totalWordsLearned}</div>
          <div className="stat-label">学習単語数</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.averageAccuracy.toFixed(1)}%</div>
          <div className="stat-label">平均正答率</div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          概要
        </button>
        <button
          className={`tab-button ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          バッジ ({stats.badges.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          マイルストーン
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <h3>🎯 次のマイルストーン</h3>
            {nextMilestone ? (
              <div className="milestone-card featured">
                <div className="milestone-header">
                  <span className="milestone-title">{nextMilestone.title}</span>
                  <span className="milestone-reward">+{nextMilestone.reward.xp} XP</span>
                </div>
                <div className="milestone-description">{nextMilestone.description}</div>
                <div className="milestone-progress-bar">
                  <div
                    className="milestone-progress-fill"
                    data-width={Math.round((nextMilestone.current / nextMilestone.target) * 100)}
                  />
                </div>
                <div className="milestone-progress-text">
                  {nextMilestone.current} / {nextMilestone.target}
                </div>
              </div>
            ) : (
              <p>すべてのマイルストーン達成！</p>
            )}

            <h3>🎖️ 最近のバッジ</h3>
            <div className="recent-badges">
              {stats.badges.length > 0 ? (
                stats.badges
                  .slice(-5)
                  .reverse()
                  .map((badge, index) => (
                    <div key={index} className={`badge-item rarity-${badge.rarity}`}>
                      <span className="badge-icon">{badge.icon}</span>
                      <div className="badge-info">
                        <div className="badge-name">{badge.name}</div>
                        <div className="badge-earned">
                          {badge.earnedAt
                            ? new Date(badge.earnedAt).toLocaleDateString('ja-JP')
                            : ''}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p>まだバッジを獲得していません</p>
              )}
            </div>

            <div className="badge-completion">
              バッジコレクション: {badgeCompletionRate.toFixed(1)}% 完了
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="badges-content">
            <div className="badges-grid">
              {Object.values(BADGE_DEFINITIONS).map((badgeDef) => {
                const earned = stats.badges.find((b) => b.type === badgeDef.type);
                return (
                  <div
                    key={badgeDef.type}
                    className={`badge-card rarity-${badgeDef.rarity} ${
                      earned ? 'earned' : 'locked'
                    }`}
                  >
                    <div className="badge-icon-large">{badgeDef.icon}</div>
                    <div className="badge-card-name">{badgeDef.name}</div>
                    <div className="badge-card-description">{badgeDef.description}</div>
                    {earned && earned.earnedAt && (
                      <div className="badge-card-date">
                        {new Date(earned.earnedAt).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="milestones-content">
            {stats.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`milestone-card ${milestone.completed ? 'completed' : ''}`}
              >
                <div className="milestone-header">
                  <span className="milestone-title">
                    {milestone.completed && '✓ '}
                    {milestone.title}
                  </span>
                  <span className="milestone-reward">+{milestone.reward.xp} XP</span>
                </div>
                <div className="milestone-description">{milestone.description}</div>
                <div className="milestone-progress-bar">
                  <div
                    className="milestone-progress-fill"
                    data-width={Math.min(Math.round((milestone.current / milestone.target) * 100), 100)}
                  />
                </div>
                <div className="milestone-progress-text">
                  {milestone.current} / {milestone.target}
                </div>
                {milestone.completed && milestone.completedAt && (
                  <div className="milestone-completed-date">
                    達成日: {new Date(milestone.completedAt).toLocaleDateString('ja-JP')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamificationPanel;
