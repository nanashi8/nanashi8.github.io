/**
 * プログレスバー可視化機能
 *
 * シミュレーション結果をプログラスバーとグラフで可視化します。
 */

import type { SimulationResult, SimulationSnapshot } from './simulationEngine';

/**
 * プログレスバーのHTML生成
 */
export function generateProgressBarHTML(
  categoryName: string,
  startValue: number,
  endValue: number,
  totalWords: number,
  colorClass: string
): string {
  const startPercent = (startValue / totalWords) * 100;
  const endPercent = (endValue / totalWords) * 100;
  const change = endValue - startValue;
  const changeSymbol = change > 0 ? '↑' : change < 0 ? '↓' : '→';
  const changeClass = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no-change';

  return `
    <div class="progress-section">
      <div class="progress-header">
        <span class="category-name">${categoryName}</span>
        <span class="change ${changeClass}">${changeSymbol} ${Math.abs(change)}</span>
        <span class="values">${startValue} → ${endValue}</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-bg">
          <div class="progress-bar ${colorClass}"
               style="width: ${endPercent}%"
               data-start="${startPercent}">
            <span class="progress-label">${endPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * シミュレーション結果の完全なHTML生成
 */
export function generateSimulationHTML(result: SimulationResult): string {
  const { profile, initialState, finalState, summary, progressSnapshots } = result;

  // カテゴリーごとのプログレスバー
  const incorrectBar = generateProgressBarHTML(
    '間違えた (incorrect)',
    summary.categoryChanges.incorrect.start,
    summary.categoryChanges.incorrect.end,
    profile.totalWords,
    'incorrect'
  );

  const stillLearningBar = generateProgressBarHTML(
    '学習中 (still_learning)',
    summary.categoryChanges.still_learning.start,
    summary.categoryChanges.still_learning.end,
    profile.totalWords,
    'still-learning'
  );

  const masteredBar = generateProgressBarHTML(
    '定着 (mastered)',
    summary.categoryChanges.mastered.start,
    summary.categoryChanges.mastered.end,
    profile.totalWords,
    'mastered'
  );

  const newBar = generateProgressBarHTML(
    '未学習 (new)',
    summary.categoryChanges.new.start,
    summary.categoryChanges.new.end,
    profile.totalWords,
    'new'
  );

  // 時系列チャートデータ生成
  const chartData = generateChartData(initialState, progressSnapshots, finalState);

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>シミュレーション結果: ${profile.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }

    .header p {
      font-size: 1.2em;
      opacity: 0.9;
    }

    .content {
      padding: 40px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }

    .progress-section {
      margin-bottom: 30px;
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 1.1em;
    }

    .category-name {
      font-weight: bold;
    }

    .change {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: bold;
    }

    .change.increase {
      background: #d4edda;
      color: #155724;
    }

    .change.decrease {
      background: #f8d7da;
      color: #721c24;
    }

    .change.no-change {
      background: #e2e3e5;
      color: #6c757d;
    }

    .values {
      color: #666;
      font-family: 'Courier New', monospace;
    }

    .progress-bar-container {
      background: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
      height: 40px;
      position: relative;
    }

    .progress-bar-bg {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      transition: width 2s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 12px;
      position: relative;
      overflow: hidden;
    }

    .progress-bar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.3) 50%,
        rgba(255, 255, 255, 0) 100%);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .progress-bar.incorrect {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .progress-bar.still-learning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .progress-bar.mastered {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .progress-bar.new {
      background: linear-gradient(90deg, #6366f1, #4f46e5);
    }

    .progress-label {
      color: white;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      z-index: 1;
      position: relative;
    }

    .chart-section {
      margin-top: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .chart-title {
      font-size: 1.5em;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }

    .chart-container {
      position: relative;
      height: 400px;
      background: white;
      border-radius: 8px;
      padding: 20px;
    }

    .signals-section {
      margin-top: 40px;
      padding: 20px;
      background: #fff3cd;
      border-radius: 12px;
      border-left: 4px solid #ffc107;
    }

    .signals-title {
      font-size: 1.3em;
      font-weight: bold;
      margin-bottom: 15px;
      color: #856404;
    }

    .signal-item {
      display: flex;
      align-items: center;
      padding: 10px;
      margin: 8px 0;
      background: white;
      border-radius: 8px;
    }

    .signal-icon {
      font-size: 1.5em;
      margin-right: 12px;
    }

    .signal-count {
      font-weight: bold;
      color: #856404;
      margin-left: auto;
    }

    /* 8つのAIシステムの判断セクション */
    .ai-decisions-section {
      margin: 40px 0;
      padding: 20px;
      background: #f3f4f6;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .ai-decisions-section h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 1.5em;
    }

    .ai-decisions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .ai-decision-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .ai-decision-card h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.1em;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-decision-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ai-progress-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .ai-progress-label {
      font-size: 0.9em;
      color: #666;
      display: flex;
      justify-content: space-between;
    }

    .ai-progress-bar-bg {
      background: #e5e7eb;
      border-radius: 6px;
      height: 24px;
      overflow: hidden;
    }

    .ai-progress-bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 1s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      color: white;
      font-size: 0.85em;
      font-weight: 600;
    }

    .footer {
      background: #f8f9fa;
      padding: 20px 40px;
      text-align: center;
      color: #666;
      border-top: 1px solid #dee2e6;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 シミュレーション結果</h1>
      <p>${profile.name} - ${profile.description}</p>
    </div>

    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">総ステップ数</div>
          <div class="stat-value">${summary.totalSteps}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">総出題数</div>
          <div class="stat-value">${summary.totalQuestionsAsked}問</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">incorrect出題数</div>
          <div class="stat-value">${summary.questionsToResolve.incorrect}問</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">still_learning出題数</div>
          <div class="stat-value">${summary.questionsToResolve.still_learning}問</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">正解率</div>
          <div class="stat-value">${summary.correctAnswerRate.toFixed(1)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均優先度</div>
          <div class="stat-value">${summary.averagePriority.toFixed(2)}</div>
        </div>
      </div>

      <div class="resolution-summary" style="background: #e8f5e9; padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #4caf50;">
        <h3 style="color: #2e7d32; margin-bottom: 15px;">📊 問題解消サマリー</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">まだまだ・覚えていない (incorrect)</div>
            <div style="font-size: 1.5em; font-weight: bold; color: #ef4444;">${summary.categoryChanges.incorrect.start}語 → ${summary.categoryChanges.incorrect.end}語</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">出題数: ${summary.questionsToResolve.incorrect}問</div>
            <div style="font-size: 0.9em; color: ${summary.categoryChanges.incorrect.change < 0 ? '#4caf50' : '#f44336'}; font-weight: bold;">
              ${summary.categoryChanges.incorrect.change < 0 ? '✅ ' + Math.abs(summary.categoryChanges.incorrect.change) + '語解消' : '⚠️ ' + summary.categoryChanges.incorrect.change + '語増加'}
            </div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">学習中・要復習 (still_learning)</div>
            <div style="font-size: 1.5em; font-weight: bold; color: #f59e0b;">${summary.categoryChanges.still_learning.start}語 → ${summary.categoryChanges.still_learning.end}語</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">出題数: ${summary.questionsToResolve.still_learning}問</div>
            <div style="font-size: 0.9em; color: ${summary.categoryChanges.still_learning.change < 0 ? '#4caf50' : '#666'}; font-weight: bold;">
              ${summary.categoryChanges.still_learning.change < 0 ? '✅ ' + Math.abs(summary.categoryChanges.still_learning.change) + '語解消' : '➡️ ' + summary.categoryChanges.still_learning.change + '語変化'}
            </div>
          </div>
        </div>
      </div>

      <h2 style="margin-bottom: 20px; color: #667eea;">📈 カテゴリー変化</h2>

      ${incorrectBar}
      ${stillLearningBar}
      ${masteredBar}
      ${newBar}

      ${generateAIDecisionsHTML(summary.aiDecisionsSummary)}

      <div class="chart-section">
        <div class="chart-title">時系列変化グラフ</div>
        <div class="chart-container">
          <canvas id="timelineChart"></canvas>
        </div>
      </div>

      <div class="signals-section">
        <div class="signals-title">🎯 検出されたシグナル</div>
        <div class="signal-item">
          <span class="signal-icon">😓</span>
          <span>疲労シグナル (Fatigue)</span>
          <span class="signal-count">${summary.signalsDetected.fatigue}回</span>
        </div>
        <div class="signal-item">
          <span class="signal-icon">😰</span>
          <span>苦戦シグナル (Struggling)</span>
          <span class="signal-count">${summary.signalsDetected.struggling}回</span>
        </div>
        <div class="signal-item">
          <span class="signal-icon">😴</span>
          <span>過学習シグナル (Overlearning)</span>
          <span class="signal-count">${summary.signalsDetected.overlearning}回</span>
        </div>
        <div class="signal-item">
          <span class="signal-icon">😊</span>
          <span>最適状態シグナル (Optimal)</span>
          <span class="signal-count">${summary.signalsDetected.optimal}回</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
      <p>QuestionScheduler シミュレーションシステム v1.0</p>
    </div>
  </div>

  <script>
    // チャート描画
    const ctx = document.getElementById('timelineChart').getContext('2d');
    const chartData = ${chartData};

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'incorrect',
            data: chartData.incorrect,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          },
          {
            label: 'still_learning',
            data: chartData.still_learning,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4
          },
          {
            label: 'mastered',
            data: chartData.mastered,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          },
          {
            label: 'new',
            data: chartData.new,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '単語数'
            }
          },
          x: {
            title: {
              display: true,
              text: 'ステップ'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
}

/**
 * 8つのAIシステムの判断内訳HTML生成
 */
function generateAIDecisionsHTML(aiSummary: any): string {
  const aiNames: { [key: string]: string } = {
    memoryAI: '🧠 記憶AI',
    cognitiveLoadAI: '💤 認知負荷AI',
    errorPredictionAI: '⚠️ エラー予測AI',
    learningStyleAI: '🎯 学習スタイルAI',
    linguisticAI: '📚 言語関連AI',
    contextualAI: '🔗 文脈AI',
    gamificationAI: '🎮 ゲーミフィケーションAI',
    metaAI: '🤖 QuestionScheduler（メタAI統合層）',
  };

  const aiColors: { [key: string]: string } = {
    memoryAI: '#9c27b0',
    cognitiveLoadAI: '#3f51b5',
    errorPredictionAI: '#f44336',
    learningStyleAI: '#ff9800',
    linguisticAI: '#4caf50',
    contextualAI: '#00bcd4',
    gamificationAI: '#e91e63',
    metaAI: '#607d8b',
  };

  let html = '<div class="ai-decisions-section">';
  html += '<h2>🤖 8つのAIシステムの判断内訳</h2>';
  html += '<div class="ai-decisions-grid">';

  for (const [aiKey, decisions] of Object.entries(aiSummary)) {
    const aiName = aiNames[aiKey] || aiKey;
    const color = aiColors[aiKey] || '#666';

    html += '<div class="ai-decision-card">';
    html += '<h3>' + aiName + '</h3>';
    html += '<div class="ai-decision-bars">';

    for (const decision of decisions as any[]) {
      html += '<div class="ai-progress-item">';
      html += '<div class="ai-progress-label">';
      html += '<span>' + decision.decision + '</span>';
      html += '<span>' + decision.count + '回 (' + decision.percentage.toFixed(1) + '%)</span>';
      html += '</div>';
      html += '<div class="ai-progress-bar-bg">';
      html +=
        '<div class="ai-progress-bar-fill" style="width: ' +
        decision.percentage +
        '%; background: ' +
        color +
        ';">';
      html += decision.percentage > 15 ? decision.percentage.toFixed(0) + '%' : '';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * チャートデータを生成
 */
function generateChartData(
  initialState: SimulationSnapshot,
  progressSnapshots: SimulationSnapshot[],
  _finalState: SimulationSnapshot
): string {
  const allSnapshots = [initialState, ...progressSnapshots];

  const data = {
    labels: allSnapshots.map((s) => 'Step ' + s.step),
    incorrect: allSnapshots.map((s) => s.categoryDistribution.incorrect),
    still_learning: allSnapshots.map((s) => s.categoryDistribution.still_learning),
    mastered: allSnapshots.map((s) => s.categoryDistribution.mastered),
    new: allSnapshots.map((s) => s.categoryDistribution.new),
  };

  return JSON.stringify(data);
}

/**
 * ターミナル用のプログレスバー
 */
export function printProgressBar(
  label: string,
  current: number,
  total: number,
  barLength: number = 40
): void {
  const progress = current / total;
  const filledLength = Math.round(barLength * progress);
  const emptyLength = barLength - filledLength;

  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  const percentage = (progress * 100).toFixed(1);

  console.log(
    label.padEnd(20) +
      ' [' +
      filled +
      empty +
      '] ' +
      percentage +
      '% (' +
      current +
      '/' +
      total +
      ')'
  );
}

/**
 * シミュレーション進捗を表示
 */
export function displaySimulationProgress(snapshot: SimulationSnapshot, totalWords: number): void {
  console.clear();
  console.log('\n' + '='.repeat(60));
  console.log('ステップ ' + snapshot.step + ' の進捗');
  console.log('='.repeat(60) + '\n');

  printProgressBar('incorrect', snapshot.categoryDistribution.incorrect, totalWords);

  printProgressBar('still_learning', snapshot.categoryDistribution.still_learning, totalWords);

  printProgressBar('mastered', snapshot.categoryDistribution.mastered, totalWords);

  printProgressBar('new', snapshot.categoryDistribution.new, totalWords);

  if (snapshot.detectedSignals.length > 0) {
    console.log('\n検出されたシグナル:');
    snapshot.detectedSignals.forEach((signal: any) => {
      console.log(
        '  🎯 ' + signal.type + ': ' + signal.action + ' (confidence: ' + signal.confidence + ')'
      );
    });
  }

  console.log();
}
