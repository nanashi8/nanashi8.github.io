/**
 * AI評価デバッグユーティリティ
 *
 * ブラウザのコンソールで以下を実行してAI評価を確認:
 * - window.showAIEvaluations() // すべての評価を表示
 * - window.showAIEvaluations('yellow') // 特定の単語の評価を表示
 * - window.clearAIEvaluations() // 評価データをクリア
 */

interface AIEvaluation {
  category: string;
  basePriority: number;
  timeBoost: number;
  finalPriority: number;
  aiEvaluations: Record<string, number>;
  timestamp: string;
}

/**
 * すべてのAI評価を表示
 */
export function showAIEvaluations(wordFilter?: string): void {
  try {
    const stored = localStorage.getItem('debug_ai_evaluations');
    if (!stored) {
      console.log('📊 AI評価データが見つかりません');
      return;
    }

    const evaluations: Record<string, AIEvaluation> = JSON.parse(stored);
    const entries = Object.entries(evaluations);

    if (wordFilter) {
      const filtered = entries.filter(([word]) =>
        word.toLowerCase().includes(wordFilter.toLowerCase())
      );
      displayEvaluations(filtered);
    } else {
      displayEvaluations(entries);
    }
  } catch (e) {
    console.error('❌ AI評価データの読み込みに失敗:', e);
  }
}

/**
 * 評価データを整形して表示
 */
function displayEvaluations(entries: [string, AIEvaluation][]): void {
  console.log(`\n📊 AI評価データ (${entries.length}件)\n`);
  console.log('形式: 総合評価[記憶/認知負荷/誤答予測/定着度/難易度/間隔反復/忘却]\n');

  entries
    .sort((a, b) => b[1].finalPriority - a[1].finalPriority)
    .forEach(([word, evaluation]) => {
      const scores = [
        evaluation.aiEvaluations.memory,
        evaluation.aiEvaluations.cognitiveLoad,
        evaluation.aiEvaluations.errorPrediction,
        evaluation.aiEvaluations.retention,
        evaluation.aiEvaluations.difficulty,
        evaluation.aiEvaluations.spaceRepetition,
        evaluation.aiEvaluations.forgetting,
      ]
        .map((v) => v.toFixed(1))
        .join('/');

      const categoryEmoji = (() => {
        switch (evaluation.category) {
          case 'incorrect':
            return '🔴';
          case 'still_learning':
            return '🟡';
          case 'mastered':
            return '🟢';
          case 'new':
            return '⚪';
          default:
            return '⚪';
        }
      })();

      console.log(
        `${categoryEmoji} ${word.padEnd(20)} ${evaluation.finalPriority.toFixed(1).padStart(6)}[${scores}] (${evaluation.category})`
      );
    });

  console.log('\n凡例:');
  console.log('  🔴 incorrect (要復習)');
  console.log('  🟡 still_learning (学習中)');
  console.log('  🟢 mastered (定着済)');
  console.log('  ⚪ new (未学習)\n');
}

/**
 * AI評価データをクリア
 */
export function clearAIEvaluations(): void {
  try {
    localStorage.removeItem('debug_ai_evaluations');
    console.log('✅ AI評価データをクリアしました');
  } catch (e) {
    console.error('❌ AI評価データのクリアに失敗:', e);
  }
}

/**
 * 特定の単語の詳細な評価を表示
 */
export function showDetailedEvaluation(word: string): void {
  try {
    const stored = localStorage.getItem('debug_ai_evaluations');
    if (!stored) {
      console.log('📊 AI評価データが見つかりません');
      return;
    }

    const evaluations: Record<string, AIEvaluation> = JSON.parse(stored);
    const evaluation = evaluations[word];

    if (!evaluation) {
      console.log(`❌ "${word}" の評価データが見つかりません`);
      return;
    }

    console.log(`\n📊 "${word}" の詳細AI評価\n`);
    console.log(`カテゴリー: ${evaluation.category}`);
    console.log(`ベース優先度: ${evaluation.basePriority.toFixed(1)}`);
    console.log(`時間ブースト: +${evaluation.timeBoost.toFixed(1)}`);
    console.log(`最終優先度: ${evaluation.finalPriority.toFixed(1)}`);
    console.log(`\n各AI担当の評価 (0-100):`);
    console.log(`  記憶AI (Memory):          ${evaluation.aiEvaluations.memory.toFixed(1)}`);
    console.log(
      `  認知負荷AI (CognitiveLoad): ${evaluation.aiEvaluations.cognitiveLoad.toFixed(1)}`
    );
    console.log(
      `  誤答予測AI (ErrorPrediction): ${evaluation.aiEvaluations.errorPrediction.toFixed(1)}`
    );
    console.log(`  定着度AI (Retention):      ${evaluation.aiEvaluations.retention.toFixed(1)}`);
    console.log(`  難易度AI (Difficulty):     ${evaluation.aiEvaluations.difficulty.toFixed(1)}`);
    console.log(
      `  間隔反復AI (SpaceRepetition): ${evaluation.aiEvaluations.spaceRepetition.toFixed(1)}`
    );
    console.log(`  忘却リスクAI (Forgetting): ${evaluation.aiEvaluations.forgetting.toFixed(1)}`);
    console.log(`\n更新日時: ${evaluation.timestamp}\n`);
  } catch (e) {
    console.error('❌ AI評価データの読み込みに失敗:', e);
  }
}

// グローバルに公開（ブラウザコンソールから使用可能にする）
if (typeof window !== 'undefined') {
  (window as any).showAIEvaluations = showAIEvaluations;
  (window as any).clearAIEvaluations = clearAIEvaluations;
  (window as any).showDetailedEvaluation = showDetailedEvaluation;
}
