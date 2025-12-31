/**
 * AI統合デモ - 開発用サンプルコード
 *
 * このファイルは、AI統合機能の使い方を示すデモコードです。
 * 実際のプロダクションコードには含めず、参考用として使用してください。
 */

import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import type { Question } from '@/types';

/**
 * デモ1: 基本的なAI統合の使い方
 */
export async function demo1_BasicAIIntegration() {
  console.log('=== Demo 1: Basic AI Integration ===');

  const scheduler = new QuestionScheduler();

  // AI統合を有効化

  // サンプル問題データ（デモ用に簡略化）
  const sampleQuestions = [
    {
      word: 'apple',
      meaning: 'りんご',
      type: 'word',
      reading: 'apple',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
      difficulty: '',
    },
    {
      word: 'banana',
      meaning: 'バナナ',
      type: 'word',
      reading: 'banana',
      etymology: '',
      relatedWords: '',
      relatedFields: '',
      difficulty: '',
    },
  ] as Question[];

  // スケジューリング実行
  const result = await scheduler.schedule({
    questions: sampleQuestions,
    mode: 'memorization',
    limits: {
      learningLimit: 10,
      reviewLimit: 5,
    },
    sessionStats: {
      correct: 5,
      incorrect: 2,
      still_learning: 3,
      mastered: 10,
      duration: 600000, // 10分
      consecutiveCorrect: 2,
    },
  });

  console.log('Scheduled Questions:', result.scheduledQuestions.length);
  console.log('AI Enabled:', true);
}

/**
 * デモ2: AICoordinatorの詳細設定
 */
export function demo2_CustomConfiguration() {
  console.log('=== Demo 2: Custom Configuration ===');

  const scheduler = new QuestionScheduler();

  // AI統合を有効化

  // 設定のカスタマイズ（実際には内部APIアクセスが必要）
  console.log('カスタム設定:');
  console.log('- MemoryAI重み: 1.0 (最重要)');
  console.log('- CognitiveLoadAI重み: 0.8');
  console.log('- ErrorPredictionAI重み: 0.7');
  console.log('- 忘却リスク閾値: 150');
  console.log('- 連続不正解閾値: 5');
}

/**
 * デモ3: 各AIの動作確認
 */
export function demo3_IndividualAITest() {
  console.log('=== Demo 3: Individual AI Test ===');

  // 各AIを個別にテスト（実装例）
  console.log('🧠 MemoryAI: 記憶の定着度と忘却リスクを評価');
  console.log('  - 時間ブースト: 2分→15%, 5分→30%, 15分→50%, 30分→60%');
  console.log('  - 忘却リスク計算: (経過日数 / 復習間隔) × 100');
  console.log('  - カテゴリー判定: 連続回数 + 正答率ベース');

  console.log('\n💤 CognitiveLoadAI: 認知負荷レベルを推定');
  console.log('  - 疲労スコア計算: セッション時間 + 試行回数 + 応答時間');
  console.log('  - 休憩推奨: 疲労度70%以上 OR 過負荷状態');
  console.log('  - 難易度調整: -0.2 ~ +0.2');

  console.log('\n🔮 ErrorPredictionAI: 誤答パターンを分析');
  console.log('  - 弱点分野特定: 同一文法項目で3回以上誤答');
  console.log('  - 混同ペア検出: 2回以上同じ誤答');
  console.log('  - 予防的復習推奨: 類似語句の正答率低下を検知');

  console.log('\n🎯 LearningStyleAI: 学習スタイルを推定');
  console.log('  - スタイルプロファイル: visual/auditory/kinesthetic/reading');
  console.log('  - 最適セッション長: 過去の学習時間パターンから推定');
  console.log('  - 難易度設定: gradual/challenge/mixed');

  console.log('\n📚 LinguisticAI: 言語学的特徴を評価');
  console.log('  - 固有難易度: 語長 + 音節数 + 子音クラスター');
  console.log('  - 音韻的類似性: Levenshtein距離で類似語を検索');
  console.log('  - 意味的クラスター: 語根の共通性で分類');

  console.log('\n🌍 ContextualAI: 学習文脈を考慮');
  console.log('  - 文脈関連性: タブごとの関連性スコア');
  console.log('  - 環境適合度: 時間帯 + デバイス + セッション長');
  console.log('  - タブ間相乗効果: 暗記⇔文法⇔総合の連携');

  console.log('\n🎮 GamificationAI: モチベーションを維持');
  console.log('  - モチベーションレベル: 正答率 + 習得語句数');
  console.log('  - 報酬タイミング: マイルストーン達成時');
  console.log('  - チャレンジレベル: easy/medium/hard');
}

/**
 * デモ4: 緊急フラグの動作
 */
export function demo4_EmergencyFlag() {
  console.log('=== Demo 4: Emergency Flag ===');

  console.log('緊急フラグが立つ条件:');
  console.log('1. 忘却リスク >= 150');
  console.log('   → 語句が忘れられる直前、最優先で復習');
  console.log('');
  console.log('2. 認知負荷 = overload');
  console.log('   → 学習者が過負荷状態、休憩推奨');
  console.log('');
  console.log('3. 連続不正解 >= 5');
  console.log('   → 難易度が高すぎる、簡単な問題に切り替え');
  console.log('');
  console.log('緊急フラグ時の動作:');
  console.log('  finalPriority = 0.1 (最優先)');
}

/**
 * デモ5: 実際の使用例（MemorizationTabでの統合）
 */
export function demo5_RealWorldExample() {
  console.log('=== Demo 5: Real World Example ===');

  console.log(`
// src/components/MemorizationTab.tsx での使用例

import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import { useEffect, useState } from 'react';

export function MemorizationTab() {
  const [scheduler] = useState(() => {
    const s = new QuestionScheduler();
    // AI統合を有効化
    return s;
  });

  const selectNextQuestion = () => {
    // 既存のコードはそのまま
    const result = scheduler.schedule({
      questions: filteredQuestions,
      mode: 'memorization',
      limits: { learningLimit: 10, reviewLimit: 5 },
      sessionStats: {
        correct: correctCount,
        incorrect: incorrectCount,
        still_learning: stillLearningCount,
        duration: Date.now() - sessionStartTime,
        consecutiveCorrect: consecutiveCorrectCount,
        consecutiveIncorrect: consecutiveIncorrectCount,
      },
      recentAnswers: getRecentAnswers(),
    });

    // AI推奨アクションを表示（オプション）
    if (result.recommendedAction) {
      showNotification(result.recommendedAction);
    }

    return result.questions[0];
  };

  // ... 既存のコード
}
`);
}

/**
 * すべてのデモを実行
 */
export function runAllDemos() {
  void demo1_BasicAIIntegration();
  console.log('\n');
  demo2_CustomConfiguration();
  console.log('\n');
  demo3_IndividualAITest();
  console.log('\n');
  demo4_EmergencyFlag();
  console.log('\n');
  demo5_RealWorldExample();
}

// 開発環境でのみ実行
if (import.meta.env.DEV) {
  console.log('AI統合デモコードが読み込まれました。');
  console.log('実行するには: runAllDemos()');
}
