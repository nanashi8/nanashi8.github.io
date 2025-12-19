/**
 * AISimulator - 適応的学習AIシミュレーター
 * パスワード保護されたシミュレーター機能
 */

import React, { useState, useRef, useEffect } from 'react';
import './AISimulator.css';

const _PASSWORD = '0614';

interface SimulationInput {
  mastered: number;
  incorrect: number;
  still_learning: number;
}

interface SimulationResult {
  profileName: string;
  steps: number;
  finalState: {
    mastered: number;
    incorrect: number;
    still_learning: number;
    new: number;
  };
  chartData: {
    steps: number[];
    mastered: number[];
    incorrect: number[];
    still_learning: number[];
    new: number[];
  };
  aiDecisions: {
    [aiName: string]: Array<{
      decision: string;
      count: number;
      percentage: number;
    }>;
  };
}

export const AISimulator: React.FC = () => {
  const [inputValues, setInputValues] = useState<SimulationInput>({
    mastered: 50,
    incorrect: 20,
    still_learning: 30,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  // タブの数が変わったらgridTemplateColumnsを更新
  useEffect(() => {
    if (tabsRef.current && results.length > 0) {
      tabsRef.current.style.gridTemplateColumns = `repeat(${results.length}, 1fr)`;
    }
  }, [results.length]);

  const handleInputChange = (field: keyof SimulationInput, value: string) => {
    const numValue = parseInt(value) || 0;
    setInputValues((prev) => ({ ...prev, [field]: numValue }));
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setResults([]);

    try {
      // 5つの生徒プロファイルをシミュレート
      const profiles = [
        { name: '勉強時間多い', errorRate: 0.1 },
        { name: '勉強時間標準', errorRate: 0.25 },
        { name: '勉強時間少ない', errorRate: 0.35 },
        { name: '勉強が苦手', errorRate: 0.5 },
        { name: '部活で疲弊', errorRate: 0.4 },
      ];

      const simulationResults: SimulationResult[] = [];

      for (const profile of profiles) {
        const result = await simulateStudent(profile, inputValues);
        simulationResults.push(result);
      }

      setResults(simulationResults);
      setActiveTab(0);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const simulateStudent = async (
    profile: { name: string; errorRate: number },
    input: SimulationInput
  ): Promise<SimulationResult> => {
    const steps = 100;
    const totalWords = input.mastered + input.incorrect + input.still_learning;

    // 初期状態
    let state = {
      mastered: input.mastered,
      incorrect: input.incorrect,
      still_learning: input.still_learning,
      new: Math.max(0, 100 - totalWords),
    };

    // チャートデータ
    const chartData = {
      steps: [0],
      mastered: [state.mastered],
      incorrect: [state.incorrect],
      still_learning: [state.still_learning],
      new: [state.new],
    };

    // AI判断追跡
    const aiDecisionsTracker: {
      [key: string]: { [decision: string]: number };
    } = {
      memoryAI: {},
      cognitiveLoadAI: {},
      errorPredictionAI: {},
      learningStyleAI: {},
      linguisticAI: {},
      contextualAI: {},
      gamificationAI: {},
      metaAI: {},
    };

    // シミュレーションステップ
    for (let step = 1; step <= steps; step++) {
      // AI判断をシミュレート
      simulateAIDecisions(aiDecisionsTracker, profile.errorRate);

      // 状態遷移をシミュレート
      const transitions = calculateTransitions(state, profile.errorRate);
      state = transitions;

      // データ記録（全ステップを記録）
      chartData.steps.push(step);
      chartData.mastered.push(state.mastered);
      chartData.incorrect.push(state.incorrect);
      chartData.still_learning.push(state.still_learning);
      chartData.new.push(state.new);

      // 少し待機（UIの応答性のため）
      if (step % 20 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // AI判断サマリー生成
    const aiDecisions: SimulationResult['aiDecisions'] = {};
    for (const [aiName, decisions] of Object.entries(aiDecisionsTracker)) {
      aiDecisions[aiName] = Object.entries(decisions)
        .map(([decision, count]) => ({
          decision,
          count,
          percentage: (count / steps) * 100,
        }))
        .sort((a, b) => b.count - a.count);
    }

    return {
      profileName: profile.name,
      steps,
      finalState: state,
      chartData,
      aiDecisions,
    };
  };

  const simulateAIDecisions = (
    tracker: { [key: string]: { [decision: string]: number } },
    errorRate: number
  ) => {
    // 記憶AI
    const memoryDecision =
      errorRate > 0.4 ? '短期記憶重視' : errorRate > 0.25 ? '長期記憶移行' : '完全定着';
    tracker.memoryAI[memoryDecision] = (tracker.memoryAI[memoryDecision] || 0) + 1;

    // 認知負荷AI
    const cognitiveDecision =
      errorRate > 0.4 ? '休憩推奨' : errorRate > 0.25 ? '負荷注意' : '最適状態';
    tracker.cognitiveLoadAI[cognitiveDecision] =
      (tracker.cognitiveLoadAI[cognitiveDecision] || 0) + 1;

    // エラー予測AI
    const errorDecision =
      errorRate > 0.4 ? '高リスク検出' : errorRate > 0.25 ? '中リスク検出' : '低リスク';
    tracker.errorPredictionAI[errorDecision] =
      (tracker.errorPredictionAI[errorDecision] || 0) + 1;

    // 学習スタイルAI
    const hour = new Date().getHours();
    const styleDecision = hour < 12 ? '朝型学習推奨' : hour < 18 ? '午後集中型' : '夜型学習推奨';
    tracker.learningStyleAI[styleDecision] = (tracker.learningStyleAI[styleDecision] || 0) + 1;

    // 言語関連AI
    const linguisticDecision = Math.random() > 0.5 ? '語源関連提示' : '類義語展開';
    tracker.linguisticAI[linguisticDecision] = (tracker.linguisticAI[linguisticDecision] || 0) + 1;

    // 文脈AI
    const contextDecision =
      Math.random() > 0.6
        ? 'テーマ別学習'
        : Math.random() > 0.3
          ? '文脈グループ化'
          : 'ランダム配置';
    tracker.contextualAI[contextDecision] = (tracker.contextualAI[contextDecision] || 0) + 1;

    // ゲーミフィケーションAI
    const gamificationDecision =
      errorRate < 0.3 ? '達成感強化' : errorRate < 0.5 ? 'バランス維持' : '励まし重視';
    tracker.gamificationAI[gamificationDecision] =
      (tracker.gamificationAI[gamificationDecision] || 0) + 1;

    // メタAI
    const metaDecision =
      errorRate > 0.4
        ? '復習優先出題'
        : errorRate > 0.3
          ? '易問出題'
          : errorRate < 0.2
            ? '難問出題'
            : '通常出題';
    tracker.metaAI[metaDecision] = (tracker.metaAI[metaDecision] || 0) + 1;
  };

  const calculateTransitions = (
    state: { mastered: number; incorrect: number; still_learning: number; new: number },
    errorRate: number
  ) => {
    const newState = { ...state };

    // 🤖 メタAI領域: 双方向状態遷移モデル
    // incorrect ⇄ still_learning ⇄ mastered の双方向遷移を実装

    // 🔴→🟡 incorrect → still_learning (改善)
    if (newState.incorrect > 0) {
      const successRate = Math.max(0.1, 1 - errorRate);
      const toImprove = Math.max(1, Math.floor(newState.incorrect * successRate * 0.25));
      newState.incorrect = Math.max(0, newState.incorrect - toImprove);
      newState.still_learning += toImprove;
    }

    // 🟡→🔴 still_learning → incorrect (逆戻り: エラー率高い場合)
    if (errorRate > 0.4 && newState.still_learning > 0) {
      const toRegress = Math.max(1, Math.floor(newState.still_learning * errorRate * 0.3));
      newState.still_learning = Math.max(0, newState.still_learning - toRegress);
      newState.incorrect += toRegress;
    }

    // 🟡→🟢 still_learning → mastered (定着)
    if (newState.still_learning > 0 && errorRate < 0.3) {
      const toMaster = Math.max(1, Math.floor(newState.still_learning * (1 - errorRate) * 0.15));
      newState.still_learning = Math.max(0, newState.still_learning - toMaster);
      newState.mastered += toMaster;
    }

    // 🟢→🟡 mastered → still_learning (忘却による逆戻り)
    if (newState.mastered > 0 && errorRate > 0.25) {
      const toForget = Math.floor(newState.mastered * errorRate * 0.05);
      newState.mastered = Math.max(0, newState.mastered - toForget);
      newState.still_learning += toForget;
    }

    // 🆕→🟡 new → still_learning (新規学習: incorrect<10の時のみ)
    if (newState.new > 0 && newState.incorrect < 10) {
      const toLearn = Math.min(newState.new, 2);
      newState.new -= toLearn;
      newState.still_learning += toLearn;
    }

    return newState;
  };

  return (
    <div className="ai-simulator">
      <div className="simulator-header">
        <h3>🎮 学習AIシミュレーター</h3>
        <p className="simulator-description">
          初期状態の単語数を設定して、5つの異なる生徒プロファイルでシミュレーションを実行します
        </p>
      </div>

      <div className="input-section">
        <h4>初期状態の設定</h4>
        <div className="input-grid">
          <div className="input-field">
            <label>
              <span className="label-icon">✅</span>
              定着済 (mastered)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={inputValues.mastered}
              onChange={(e) => handleInputChange('mastered', e.target.value)}
              aria-label="定着済単語数"
            />
          </div>
          <div className="input-field">
            <label>
              <span className="label-icon">📖</span>
              学習中 (still_learning)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={inputValues.still_learning}
              onChange={(e) => handleInputChange('still_learning', e.target.value)}
              aria-label="学習中単語数"
            />
          </div>
          <div className="input-field">
            <label>
              <span className="label-icon">❌</span>
              要復習 (incorrect)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={inputValues.incorrect}
              onChange={(e) => handleInputChange('incorrect', e.target.value)}
              aria-label="要復習単語数"
            />
          </div>
        </div>
        <button className="simulate-button" onClick={runSimulation} disabled={isSimulating}>
          {isSimulating ? '⏳ シミュレーション実行中...' : '🚀 シミュレーション開始'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="results-section">
          <h4>シミュレーション結果</h4>
          <div
            ref={tabsRef}
            className="score-board-tabs grid gap-1 sm:gap-2"
          >
            {results.map((result, index) => (
              <button
                key={index}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
                  activeTab === index
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
                }`}
                onClick={() => setActiveTab(index)}
              >
                {result.profileName}
              </button>
            ))}
          </div>
          <div className="tab-content">
            <StudentSimulationResult result={results[activeTab]} />
          </div>
        </div>
      )}
    </div>
  );
};

interface StudentSimulationResultProps {
  result: SimulationResult;
}

const StudentSimulationResult: React.FC<StudentSimulationResultProps> = ({ result }) => {
  const aiNames: { [key: string]: string } = {
    memoryAI: '🧠 記憶AI',
    cognitiveLoadAI: '💤 認知負荷AI',
    errorPredictionAI: '⚠️ エラー予測AI',
    learningStyleAI: '🎯 学習スタイルAI',
    linguisticAI: '📚 言語関連AI',
    contextualAI: '🔗 文脈AI',
    gamificationAI: '🎮 ゲーミフィケーションAI',
    metaAI: '🤖 メタAI',
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

  return (
    <div className="student-result">
      <div className="chart-section">
        <h6>学習進捗グラフ</h6>
        <SimpleLineChart data={result.chartData} />
      </div>

      <div className="ai-decisions-section">
        <h6>8つのAIシステムの判断内訳</h6>
        <div className="ai-grid">
          {Object.entries(result.aiDecisions).map(([aiKey, decisions]) => (
            <div key={aiKey} className="ai-card">
              <h6>{aiNames[aiKey]}</h6>
              <div className="decision-bars">
                {decisions.map((decision, idx) => (
                  <div key={idx} className="decision-item">
                    <div className="decision-label">
                      <span>{decision.decision}</span>
                      <span className="decision-percentage">{decision.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        data-ai-key={aiKey}
                        ref={(el) => {
                          if (el) {
                            el.style.width = `${decision.percentage}%`;
                            el.style.backgroundColor = aiColors[aiKey];
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SimpleLineChartProps {
  data: {
    steps: number[];
    mastered: number[];
    incorrect: number[];
    still_learning: number[];
    new: number[];
  };
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data }) => {
  const maxValue = 100;
  const height = 400;
  const width = 1000;
  const padding = 60;

  const xScale = (index: number) =>
    padding + (index / (data.steps.length - 1)) * (width - 2 * padding);
  const yScale = (value: number) => height - padding - (value / maxValue) * (height - 2 * padding);

  const createPath = (values: number[]) => {
    return values
      .map((value, index) => {
        const x = xScale(index);
        const y = yScale(value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart">
      {/* 背景 */}
      <rect
        x={padding}
        y={padding}
        width={width - 2 * padding}
        height={height - 2 * padding}
        fill="#fafafa"
        stroke="#e5e7eb"
        strokeWidth="2"
      />

      {/* Y軸グリッド線 */}
      {[0, 25, 50, 75, 100].map((value) => (
        <g key={value}>
          <line
            x1={padding}
            y1={yScale(value)}
            x2={width - padding}
            y2={yScale(value)}
            stroke="#d1d5db"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
          <text x={padding - 15} y={yScale(value) + 5} fontSize="13" textAnchor="end" fill="#374151" fontWeight="500">
            {value}
          </text>
        </g>
      ))}

      {/* X軸グリッド線（10ステップごと） */}
      {data.steps.filter((_, i) => i % 10 === 0).map((step, _index) => {
        const xPos = xScale(data.steps.indexOf(step));
        return (
          <g key={step}>
            <line
              x1={xPos}
              y1={padding}
              x2={xPos}
              y2={height - padding}
              stroke="#d1d5db"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text
              x={xPos}
              y={height - padding + 20}
              fontSize="13"
              textAnchor="middle"
              fill="#374151"
              fontWeight="500"
            >
              {step}
            </text>
          </g>
        );
      })}

      {/* データライン（太く、シャドウ付き） */}
      <path
        d={createPath(data.mastered)}
        stroke="#10b981"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))"
      />
      <path
        d={createPath(data.incorrect)}
        stroke="#ef4444"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))"
      />
      <path
        d={createPath(data.still_learning)}
        stroke="#f59e0b"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))"
      />
      <path
        d={createPath(data.new)}
        stroke="#6366f1"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))"
      />

      {/* 軸ラベル */}
      <text
        x={width / 2}
        y={height - 8}
        fontSize="15"
        textAnchor="middle"
        fill="#111827"
        fontWeight="700"
      >
        ステップ数
      </text>
      <text
        x={20}
        y={height / 2}
        fontSize="15"
        textAnchor="middle"
        fill="#111827"
        fontWeight="700"
        transform={`rotate(-90, 20, ${height / 2})`}
      >
        単語数
      </text>

      {/* 凡例（右上に配置） */}
      <g transform={`translate(${width - 380}, ${padding + 10})`}>
        <rect x="-10" y="-15" width="370" height="45" fill="white" opacity="0.95" rx="8" />
        <circle cx="5" cy="0" r="6" fill="#10b981" />
        <text x="18" y="5" fontSize="14" fill="#111827" fontWeight="600">
          定着済
        </text>
        <circle cx="95" cy="0" r="6" fill="#ef4444" />
        <text x="108" y="5" fontSize="14" fill="#111827" fontWeight="600">
          要復習
        </text>
        <circle cx="185" cy="0" r="6" fill="#f59e0b" />
        <text x="198" y="5" fontSize="14" fill="#111827" fontWeight="600">
          学習中
        </text>
        <circle cx="275" cy="0" r="6" fill="#6366f1" />
        <text x="288" y="5" fontSize="14" fill="#111827" fontWeight="600">
          未学習
        </text>
      </g>
    </svg>
  );
};
