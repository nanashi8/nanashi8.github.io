/**
 * 学習効率評価システム - 型定義
 *
 * 生徒の学習効率を測定・記録し、最適な学習方法を提案する
 */

/**
 * 学習効率指標
 */
export interface LearningEfficiencyMetrics {
  /** 定着率（0-1）: 学習した単語のうち定着した割合 */
  retentionRate: number;

  /** 学習速度（語/時間）: 単位時間あたりの定着語数 */
  learningSpeed: number;

  /** 忘却率（0-1）: 一度定着した単語を忘れる割合 */
  forgettingRate: number;

  /** 平均試行回数: 1語を定着させるのに必要な平均試行回数 */
  averageAttempts: number;

  /** 効率スコア（0-100）: 総合的な学習効率 */
  efficiencyScore: number;

  /** 測定日時 */
  measuredAt: number;
}

/**
 * 分野別学習効率
 */
export interface CategoryEfficiency {
  /** 分野名（食べ物、スポーツ、科学など） */
  category: string;

  /** この分野での定着率 */
  retentionRate: number;

  /** この分野での学習速度 */
  learningSpeed: number;

  /** 定着語数 */
  masteredCount: number;

  /** 総出題数 */
  totalAttempts: number;

  /** 得意度（0-100）: この分野の得意具合 */
  proficiency: number;
}

/**
 * いもづる式学習の効果測定
 */
export interface ChainLearningEffect {
  /** チェーン学習を使用したか */
  usedChainLearning: boolean;

  /** チェーン学習での定着率 */
  chainRetentionRate: number;

  /** ランダム学習での定着率 */
  randomRetentionRate: number;

  /** 効果の差（chain - random） */
  effectDifference: number;

  /** 測定期間の開始日時 */
  periodStart: number;

  /** 測定期間の終了日時 */
  periodEnd: number;
}

/**
 * 関連語の強度
 */
export interface WordRelation {
  /** 関連する単語 */
  relatedWord: string;

  /** 関連タイプ */
  relationType:
    | 'synonym' // 同義語
    | 'antonym' // 反意語
    | 'category' // 同じカテゴリー
    | 'derivation' // 派生語
    | 'context' // 文脈的関連
    | 'collocation'; // 連語

  /** 関連度の強さ（0-100） */
  strength: number;

  /** この関連を使った学習での成功率 */
  successRate?: number;

  /** この関連を更新した最終時刻（epoch ms） */
  lastUpdatedAt?: number;

  /** 成功率の推定に使ったサンプル数（概算でも可） */
  sampleCount?: number;
}

/**
 * 単語の関連情報
 */
export interface WordRelationship {
  /** 単語 */
  word: string;

  /** 関連する単語のリスト */
  relations: WordRelation[];

  /** 最終更新日時 */
  updatedAt: number;
}

/**
 * いもづる式学習クラスター
 */
export interface SemanticCluster {
  /** クラスターID */
  clusterId: string;

  /** クラスター名（テーマ） */
  clusterName: string;

  /** クラスター内の単語リスト */
  words: string[];

  /** クラスターの中心単語 */
  centerWord: string;

  /** クラスターの凝集度（0-100） */
  cohesion: number;

  /** このクラスターでの学習効率 */
  efficiency?: number;
}

/**
 * 学習履歴エントリー
 */
export interface LearningHistoryEntry {
  /** 単語 */
  word: string;

  /** 正解したか */
  correct: boolean;

  /** 回答時刻 */
  timestamp: number;

  /** この単語の前に出題された単語 */
  previousWord?: string;

  /** 関連学習として出題されたか */
  wasChainedLearning: boolean;

  /** どのクラスターから出題されたか */
  clusterId?: string;

  /** 応答時間（ミリ秒） */
  responseTime: number;
}

/**
 * 学習効率プロファイル（生徒ごとに保存）
 */
export interface LearningEfficiencyProfile {
  /** 全体の学習効率指標 */
  overallMetrics: LearningEfficiencyMetrics;

  /** 分野別の学習効率 */
  categoryEfficiencies: CategoryEfficiency[];

  /** いもづる式学習の効果 */
  chainLearningEffect: ChainLearningEffect;

  /** 得意分野（上位5つ） */
  strongCategories: string[];

  /** 苦手分野（下位5つ） */
  weakCategories: string[];

  /** 学習履歴（最新1000件） */
  recentHistory: LearningHistoryEntry[];

  /** プロファイル作成日時 */
  createdAt: number;

  /** 最終更新日時 */
  updatedAt: number;
}

/**
 * 学習効率分析結果
 */
export interface EfficiencyAnalysis {
  /** 現在の効率スコア */
  currentScore: number;

  /** 前回からの変化 */
  scoreChange: number;

  /** 改善された点 */
  improvements: string[];

  /** 注意が必要な点 */
  concerns: string[];

  /** 推奨アクション */
  recommendations: string[];

  /** いもづる式学習の推奨度（0-100） */
  chainLearningRecommendation: number;
}

/**
 * 最適クラスター推薦
 */
export interface ClusterRecommendation {
  /** 推薦するクラスター */
  cluster: SemanticCluster;

  /** 推薦理由 */
  reason: string;

  /** 期待される定着率 */
  expectedRetentionRate: number;

  /** 優先度（0-100） */
  priority: number;
}
