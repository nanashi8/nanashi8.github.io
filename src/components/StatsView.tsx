import { useState, useEffect } from 'react';
import {
  getStatsByModeDifficulty,
  resetStatsByModeDifficulty,
} from '../progressStorage';
import { QuestionSet, Question } from '../types';

interface StatsViewProps {
  questionSets: QuestionSet[];
  allQuestions: Question[];
  categoryList: string[];
}

interface DifficultyStats {
  labels: string[];
  accuracyData: number[];
  retentionData: number[];
}

function StatsView({ }: StatsViewProps) {
  const [translationStats, setTranslationStats] = useState<DifficultyStats>({ labels: [], accuracyData: [], retentionData: [] });
  const [spellingStats, setSpellingStats] = useState<DifficultyStats>({ labels: [], accuracyData: [], retentionData: [] });
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [storageInfo, setStorageInfo] = useState<{ totalMB: number; details: { key: string; sizeMB: number }[] } | null>(null);

  // LocalStorageサイズを取得
  const getStorageSize = () => {
    try {
      let totalSize = 0;
      const details: { key: string; sizeMB: number }[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;
            details.push({ key, sizeMB: size / (1024 * 1024) });
          }
        }
      }
      
      details.sort((a, b) => b.sizeMB - a.sizeMB);
      setStorageInfo({ totalMB: totalSize / (1024 * 1024), details: details.slice(0, 5) });
    } catch (error) {
      console.error('ストレージサイズの取得エラー:', error);
    }
  };

  // データ読み込み
  const loadData = () => {
    const translationData = getStatsByModeDifficulty('translation');
    const spellingData = getStatsByModeDifficulty('spelling');
    setTranslationStats(translationData);
    setSpellingStats(spellingData);
    getStorageSize();
  };

  // リアルタイム更新
  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // 難易度別リセット
  const handleResetByDifficulty = (mode: 'translation' | 'spelling', difficulty: string) => {
    const modeName = mode === 'translation' ? '和訳タブ' : 'スペルタブ';
    const difficultyName = difficulty === 'beginner' ? '初級' : difficulty === 'intermediate' ? '中級' : '上級';
    
    if (confirm(`${modeName}の${difficultyName}の成績をリセットしますか？この操作は元に戻せません。`)) {
      resetStatsByModeDifficulty(mode, difficulty);
      alert('成績をリセットしました');
      loadData();
    }
  };

  // 全成績リセット
  const handleResetAll = () => {
    if (confirm('本当にすべての学習記録を削除しますか？この操作は元に戻せません。')) {
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

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>📊 成績</h2>
        <div className="stats-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            自動更新
          </label>
        </div>
      </div>

      {/* 和訳タブの統計 */}
      <div className="stats-section-mode">
        <h3>📖 和訳タブ</h3>
        
        <div className="stats-charts-row">
          {/* 正答率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 正答率</h4>
            <SimpleRadarChart
              labels={translationStats.labels}
              data={translationStats.accuracyData}
              maxValue={100}
              color="rgba(102, 126, 234, 0.6)"
            />
          </div>

          {/* 定着率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 定着率</h4>
            <SimpleRadarChart
              labels={translationStats.labels}
              data={translationStats.retentionData}
              maxValue={100}
              color="rgba(76, 175, 80, 0.6)"
            />
          </div>
        </div>

        {/* リセットボタン */}
        <div className="stats-reset-buttons">
          <button onClick={() => handleResetByDifficulty('translation', 'beginner')} className="btn-reset-difficulty">
            初級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('translation', 'intermediate')} className="btn-reset-difficulty">
            中級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('translation', 'advanced')} className="btn-reset-difficulty">
            上級をリセット
          </button>
        </div>
      </div>

      {/* スペルタブの統計 */}
      <div className="stats-section-mode">
        <h3>✍️ スペルタブ</h3>
        
        <div className="stats-charts-row">
          {/* 正答率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 正答率</h4>
            <SimpleRadarChart
              labels={spellingStats.labels}
              data={spellingStats.accuracyData}
              maxValue={100}
              color="rgba(255, 152, 0, 0.6)"
            />
          </div>

          {/* 定着率レーダーチャート */}
          <div className="stats-chart-container">
            <h4>難易度別 定着率</h4>
            <SimpleRadarChart
              labels={spellingStats.labels}
              data={spellingStats.retentionData}
              maxValue={100}
              color="rgba(233, 30, 99, 0.6)"
            />
          </div>
        </div>

        {/* リセットボタン */}
        <div className="stats-reset-buttons">
          <button onClick={() => handleResetByDifficulty('spelling', 'beginner')} className="btn-reset-difficulty">
            初級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('spelling', 'intermediate')} className="btn-reset-difficulty">
            中級をリセット
          </button>
          <button onClick={() => handleResetByDifficulty('spelling', 'advanced')} className="btn-reset-difficulty">
            上級をリセット
          </button>
        </div>
      </div>

      {/* 全体リセット */}
      <div className="stats-section-reset">
        <button onClick={handleResetAll} className="btn-reset-all">
          ⚠️ すべての成績をリセット
        </button>
      </div>

      {/* ストレージ情報 */}
      {storageInfo && (
        <div className="stats-section-storage">
          <h3>💾 ストレージ使用量</h3>
          <div className="storage-info">
            <p className={storageInfo.totalMB > 4 ? 'storage-warning' : ''}>
              <strong>合計:</strong> {storageInfo.totalMB.toFixed(2)} MB / 約 5-10 MB
              {storageInfo.totalMB > 4 && ' ⚠️ 容量が不足しています'}
            </p>
            <details>
              <summary>詳細を表示</summary>
              <ul>
                {storageInfo.details.map((item, idx) => (
                  <li key={idx}>
                    <code>{item.key}</code>: {item.sizeMB.toFixed(2)} MB
                  </li>
                ))}
              </ul>
              <p className="storage-note">
                💡 ヒント: データが大きくなりすぎた場合は、古い成績を削除すると容量を節約できます。
              </p>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

// シンプルなレーダーチャートコンポーネント
function SimpleRadarChart({ labels, data, maxValue, color }: {
  labels: string[];
  data: number[];
  maxValue: number;
  color: string;
}) {
  const size = 300;
  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const numPoints = labels.length;
  
  if (numPoints === 0) {
    return <div className="radar-chart-empty">データがありません</div>;
  }

  // 各頂点の座標を計算
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = (value / maxValue) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  // 背景のグリッド線
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPaths = gridLevels.map(level => {
    const points = Array.from({ length: numPoints }, (_, i) => {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const radius = maxRadius * level;
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
    });
    return points.join(' ');
  });

  // データのパス
  const dataPoints = data.map((value, i) => getPoint(i, value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <div className="radar-chart-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* グリッド */}
        {gridPaths.map((path, i) => (
          <polygon
            key={i}
            points={path}
            fill="none"
            stroke="#ddd"
            strokeWidth="1"
          />
        ))}

        {/* 軸線 */}
        {Array.from({ length: numPoints }, (_, i) => {
          const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angle)}
              y2={center + maxRadius * Math.sin(angle)}
              stroke="#ddd"
              strokeWidth="1"
            />
          );
        })}

        {/* データエリア */}
        <path
          d={dataPath}
          fill={color}
          stroke={color.replace('0.6', '1')}
          strokeWidth="2"
        />

        {/* データポイント */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color.replace('0.6', '1')}
          />
        ))}

        {/* ラベル */}
        {labels.map((label, i) => {
          const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
          const labelRadius = maxRadius + 25;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="bold"
            >
              {label}
              <tspan x={x} dy="15" fontSize="12" fill="#666">
                {data[i].toFixed(1)}%
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default StatsView;
