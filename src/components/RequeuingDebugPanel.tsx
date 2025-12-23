import { useState, useEffect } from 'react';
import { getStrugglingWordsList } from '../storage/progress/statistics';
import { loadProgressSync } from '../storage/progress/progressStorage';
// A/B集計用
import { aggregateAll } from '@/metrics/ab/aggregate';
import { exportSessionLogsAsJson, clearSessionLogs } from '@/metrics/ab/storage';
import type { OverallAggregateResult } from '@/metrics/ab/types';

interface RequeuedWord {
  word: string;
  reason: 'incorrect' | 'still_learning';
  insertAt: number;
  timestamp: number;
}

interface DebugPanelProps {
  currentIndex: number;
  totalQuestions: number;
  questions: Array<{
    word: string;
    difficulty?: string;
  }>;
  requeuedWords?: RequeuedWord[];
  initialExpanded?: boolean;
}

export function RequeuingDebugPanel({
  currentIndex,
  totalQuestions,
  questions,
  requeuedWords: _requeuedWords = [],
  initialExpanded = true, // デフォルトで展開状態
}: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [aiEvaluations, setAIEvaluations] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [strugglingWords, setStrugglingWords] = useState<ReturnType<typeof getStrugglingWordsList>>(
    []
  );
  const [interleavingDiag, setInterleavingDiag] = useState<any>(null);
  const [answerLogs, setAnswerLogs] = useState<any[]>([]);
  const [functionCalls, setFunctionCalls] = useState<any[]>([]);

  // A/B集計結果
  const [abAggregate, setAbAggregate] = useState<OverallAggregateResult | null>(null);

  // まだまだ・分からない単語リストを取得
  useEffect(() => {
    const words = getStrugglingWordsList();
    setStrugglingWords(words);
  }, [currentIndex]); // currentIndexが変わるたびに更新

  // A/B集計を更新
  useEffect(() => {
    if (isExpanded) {
      const aggregate = aggregateAll();
      setAbAggregate(aggregate);
    }
  }, [isExpanded, currentIndex]);

  // コピー機能（マークダウン形式で詳細に）
  const handleCopy = () => {
    const timestamp = new Date().toISOString();

    // スコアボード情報を取得
    const allProgress = loadProgressSync();
    const totalWords = Object.keys(allProgress.wordProgress || {}).length;
    const masteredWords = Object.values(allProgress.wordProgress || {}).filter(
      (p: any) => p.memorizationPosition < 20
    ).length;
    const strugglingWordsCount = Object.values(allProgress.wordProgress || {}).filter(
      (p: any) => p.memorizationPosition >= 40
    ).length;
    const incorrectWords = Object.values(allProgress.wordProgress || {}).filter(
      (p: any) => p.memorizationPosition >= 70
    ).length;
    const stillLearningWords = Object.values(allProgress.wordProgress || {}).filter(
      (p: any) => p.memorizationPosition >= 40 && p.memorizationPosition < 70 && p.totalAttempts > 0
    ).length;

    // 統計計算
    const totalAttempts = Object.values(allProgress.wordProgress || {}).reduce(
      (sum: number, p: any) => sum + (p.totalAttempts || 0),
      0
    );
    const totalCorrect = Object.values(allProgress.wordProgress || {}).reduce(
      (sum: number, p: any) => sum + (p.memorizationCorrect || 0),
      0
    );
    const totalIncorrect = Object.values(allProgress.wordProgress || {}).reduce(
      (sum: number, p: any) => sum + (p.memorizationIncorrect || 0),
      0
    );
    const overallAccuracy =
      totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : '0.0';

    // 次の出題予定を抽出（コピー時に使用）
    // 🔥 重要: questions配列は既にQuestionSchedulerで並び替え済みなので、
    // 現在位置から次の10問を直接取得すればOK
    const upcomingWords = questions.slice(currentIndex + 1, currentIndex + 11).map((q, idx) => ({
      word: q.word,
      position: currentIndex + idx + 2, // currentIndex + 1は現在の問題なので、+2から開始
    }));

    // AI評価テーブル生成
    const aiEvalTable =
      aiEvaluations.length === 0
        ? '_（データなし）_'
        : `| 単語 | Position | Category | 🧠 Memory | 💤 CogLoad | 🔮 Error | 📚 Linguistic | 🌍 Context | 🎯 Style | 🎮 Gamify |\n` +
          `|------|----------|----------|-----------|-----------|----------|--------------|-----------|----------|----------|\n` +
          aiEvaluations
            .map((evaluation) => {
              const categoryLabel =
                evaluation.category === 'incorrect'
                  ? '❌ 分からない'
                  : evaluation.category === 'still_learning'
                    ? '🟡 まだまだ'
                    : evaluation.category === 'mastered'
                      ? '✅ 定着済'
                      : '⚪ 新規';
              const position = (evaluation.position ?? 0).toFixed(0);
              const ai = evaluation.aiProposals || {};
              return `| **${evaluation.word}** | ${position} | ${categoryLabel} | ${(ai.memory ?? 0).toFixed(0)} | ${(ai.cognitiveLoad ?? 0).toFixed(0)} | ${(ai.errorPrediction ?? 0).toFixed(0)} | ${(ai.linguistic ?? 0).toFixed(0)} | ${(ai.contextual ?? 0).toFixed(0)} | ${(ai.learningStyle ?? 0).toFixed(0)} | ${(ai.gamification ?? 0).toFixed(0)} |`;
            })
            .join('\n');

    const debugText = `# 🔍 再出題デバッグレポート（詳細版）

**生成日時**: ${timestamp}
**現在位置**: ${currentIndex + 1} / ${totalQuestions} 問目

---

## 📊 スコアボード（学習状況）

**総合統計**:
- 📚 総単語数: ${totalWords}語
- ✅ 習得済み (Position < 20): ${masteredWords}語 (${totalWords > 0 ? ((masteredWords / totalWords) * 100).toFixed(1) : '0.0'}%)
- 🟡 まだまだ (Position 40-70, attempts>0): ${stillLearningWords}語
- 🔴 分からない (Position≥70): ${incorrectWords}語
- ⚠️ 苦手語合計 (Position≥40): ${strugglingWordsCount}語

**解答統計**:
- 総試行回数: ${totalAttempts}回
- 正答: ${totalCorrect}回
- 誤答: ${totalIncorrect}回
- 全体正答率: ${overallAccuracy}%

**進捗率**: ${((currentIndex / totalQuestions) * 100).toFixed(1)}% (${currentIndex} / ${totalQuestions}問)

---

## 🎯 インターリーブ診断

### Position分布（まだまだ・分からない58語）
${
  strugglingWords.length === 0
    ? '_（なし）_'
    : `
- **Position 85-100**: ${strugglingWords.filter((w) => w.position >= 85).length}語
- **Position 70-84**: ${strugglingWords.filter((w) => w.position >= 70 && w.position < 85).length}語
- **Position 40-69**: ${strugglingWords.filter((w) => w.position >= 40 && w.position < 70).length}語

**期待される動作**:
- まだまだ58語 → GamificationAI が新規の17% (約10語) をPosition +15
- 結果: Position 40-55の新規が上位10問中に混入するはず
`
}

### 次10問のPosition分析
${upcomingWords
  .map((item, idx) => {
    const question = questions[currentIndex + idx + 1];
    const word = question?.word || item.word;
    const allProgress = loadProgressSync();
    const wordProgress = allProgress.wordProgress?.[word];
    const position = wordProgress?.memorizationPosition ?? 0;
    const attempts = wordProgress?.totalAttempts ?? 0;
    const status =
      attempts === 0
        ? '⚪ 新規（未出題）'
        : position >= 70
          ? '🔴 分からない'
          : position >= 40
            ? '🟡 まだまだ'
            : position >= 20
              ? '⚪ 新規'
              : '✅ 定着済';
    return `${idx + 1}. **${word}** - Position ${position.toFixed(0)} (${attempts}回) ${status}`;
  })
  .join('\n')}

**問題検出**:
${
  upcomingWords.every((item) => {
    const word = questions[currentIndex + upcomingWords.indexOf(item) + 1]?.word || item.word;
    const allProgress = loadProgressSync();
    const wordProgress = allProgress.wordProgress?.[word];
    const position = wordProgress?.memorizationPosition ?? 0;
    return position < 40;
  })
    ? `❌ **全て新規（Position < 40）** → Position分散が機能していない！`
    : `✅ 新規とまだまだが混在 → Position分散が機能中`
}

---

## 🎮 Position分散診断

${
  interleavingDiag
    ? `**分散前**:
- まだまだ・分からない: ${interleavingDiag.before.struggling}語
- 新規: ${interleavingDiag.before.new}語
- 引き上げ候補(Position≥25): ${interleavingDiag.before.boostable || 0}語

**分散後**:
- まだまだ・分からない: ${interleavingDiag.after.struggling}語
- 新規 (Position引き上げ後): ${interleavingDiag.after.new}語
- 引き上げ候補(Position≥25): ${interleavingDiag.after.boostable || 0}語

**Position引き上げ**: ${interleavingDiag.summary.boosted}語 ${interleavingDiag.summary.working ? '✅' : '❌'}

<details>
<summary>引き上げられた単語リスト (最初10件)</summary>

${interleavingDiag.changed
  .slice(0, 10)
  .map((c: any) => {
    return (
      '- **' +
      c.word +
      '**: ' +
      c.before.toFixed(0) +
      ' → ' +
      c.after.toFixed(0) +
      ' (+' +
      (c.after - c.before).toFixed(0) +
      ')'
    );
  })
  .join('\n')}

${interleavingDiag.changed.length > 10 ? '\n_…他' + (interleavingDiag.changed.length - 10) + '語_' : ''}
</details>`
    : '⚠️ Position分散診断情報がありません（calculatePriorities()が呼ばれていない可能性）'
}

### 🎯 まだまだ語のブースト

${(() => {
  try {
    const boostStored = localStorage.getItem('debug_still_learning_boost');
    if (!boostStored) return '⚠️ まだまだ語ブースト情報がありません';

    const boostData = JSON.parse(boostStored);
    if (!boostData.working || boostData.boosted === 0) {
      return '❌ まだまだ語が0語 → ブーストなし';
    }

    return `**まだまだ語 (Position 40-70, attempts>0) を +15 引き上げ**: ${boostData.boosted}語 ✅

<details>
<summary>ブーストされた単語リスト (最初10件)</summary>

${boostData.changes
  .slice(0, 10)
  .map((c: any) => {
    return '- **' + c.word + '**: ' + c.before.toFixed(0) + ' → ' + c.after.toFixed(0) + ' (+15)';
  })
  .join('\n')}

${boostData.boosted > 10 ? '\n_…他' + (boostData.boosted - 10) + '語_' : ''}
</details>`;
  } catch {
    return '⚠️ まだまだ語ブースト情報の読み込みに失敗';
  }
})()}

### 🎮 カテゴリ別インターリーブ（交互配置）

${(() => {
  // TOP30のカテゴリパターンを視覚化
  const postProcessOutput = localStorage.getItem('debug_postProcess_output');
  if (!postProcessOutput) return '⚠️ インターリーブ情報がありません';

  try {
    const data = JSON.parse(postProcessOutput);
    const top30 = data.slice(0, 30);

    // カテゴリ判定
    const categorized = top30.map((item: any) => {
      if (item.attempts > 0 && item.position >= 40 && item.position < 70) return 'まだまだ';
      if (item.attempts === 0 && item.position >= 40 && item.position < 70) return '新規(引上)';
      if (item.position >= 70) return '分からない';
      if (item.position < 20) return '定着済';
      return '新規';
    });

    // 統計
    const stats = {
      まだまだ: categorized.filter((c: string) => c === 'まだまだ').length,
      新規引上: categorized.filter((c: string) => c === '新規(引上)').length,
      その他: categorized.filter((c: string) => !['まだまだ', '新規(引上)'].includes(c)).length,
    };

    // パターン視覚化（絵文字）
    const pattern = categorized
      .slice(0, 20)
      .map((c: string) => {
        switch (c) {
          case 'まだまだ':
            return '🟡';
          case '新規(引上)':
            return '🔵';
          case '分からない':
            return '🔴';
          case '定着済':
            return '✅';
          default:
            return '⚪';
        }
      })
      .join('');

    // 詳細リスト
    const details = top30
      .slice(0, 15)
      .map((item: any, idx: number) => {
        const cat = categorized[idx];
        const emoji =
          cat === 'まだまだ'
            ? '🟡'
            : cat === '新規(引上)'
              ? '🔵'
              : cat === '分からない'
                ? '🔴'
                : cat === '定着済'
                  ? '✅'
                  : '⚪';
        return `${idx + 1}. ${emoji} **${item.word}** (Pos ${item.position.toFixed(0)}, ${item.attempts}回) - ${cat}`;
      })
      .join('\n');

    let result = `**TOP30のカテゴリ分布**:
- 🟡 まだまだ: ${stats.まだまだ}語
- 🔵 新規(Position引上): ${stats.新規引上}語
- その他: ${stats.その他}語

**パターン視覚化** (TOP20):
${pattern}

**凡例**: 🟡まだまだ 🔵新規(引上) ⚪新規 🔴分からない ✅定着済

<details>
<summary>詳細リスト (TOP15)</summary>

${details}
</details>

**期待される動作**:
- まだまだ2-3問 → 新規1問のサイクルで交互配置
- 例: 🟡🟡🔵🟡🟡🟡🔵🟡🟡🔵...`;

    // インターリーブ品質チェック
    if (stats.まだまだ === 0 && stats.新規引上 === 0) {
      result += '\n\n⚠️ **インターリーブ対象なし**（まだまだ語・Position引き上げ新規語ともに0）';
    } else if (stats.まだまだ > 0 && stats.新規引上 === 0) {
      result += '\n\n⚠️ **Position引き上げ新規語なし** → まだまだ語のみ優先配置';
    } else if (stats.まだまだ === 0 && stats.新規引上 > 0) {
      result += '\n\n⚠️ **まだまだ語なし** → Position引き上げ新規語のみ優先配置';
    } else {
      // 交互配置の品質チェック
      let interleavingQuality = 0;
      for (let i = 0; i < categorized.length - 1; i++) {
        const current = categorized[i];
        const next = categorized[i + 1];
        if (current === 'まだまだ' && next === '新規(引上)') interleavingQuality++;
        if (current === '新規(引上)' && next === 'まだまだ') interleavingQuality++;
      }

      if (interleavingQuality >= 3) {
        result +=
          '\n\n✅ **交互配置が正常に機能しています**（切り替え回数: ' +
          interleavingQuality +
          '回）';
      } else {
        result +=
          '\n\n⚠️ **交互配置の頻度が低い可能性**（切り替え回数: ' + interleavingQuality + '回）';
      }
    }

    return result;
  } catch (e) {
    return '⚠️ データ解析エラー: ' + (e as Error).message;
  }
})()}

---

## �️ Position階層検証（「あっちを立てればこっちが立たず」防止）

${(() => {
  try {
    const validationStored = localStorage.getItem('debug_position_hierarchy_validation');
    const stillStored = localStorage.getItem('debug_position_hierarchy_still');
    const newStored = localStorage.getItem('debug_position_hierarchy_new');

    if (!validationStored && !stillStored && !newStored) {
      return '⚠️ Position階層検証データがありません';
    }

    let result = '**Position階層の不変条件**:\n';
    result += '```\n';
    result += '70-100: 分からない（第1優先）\n';
    result += '60-69:  まだまだ（第2優先・ブースト後）← 🔒 固定\n';
    result += '40-59:  新規（第3優先・ブースト後）    ← 🔒 固定\n';
    result += '20-39:  新規（第4優先・通常）\n';
    result += '0-19:   定着済（第5優先）\n';
    result += '```\n\n';

    let hasViolation = false;
    const violations: any[] = [];

    // QuestionSchedulerの検証結果
    if (validationStored) {
      const validation = JSON.parse(validationStored);
      if (validation.isValid) {
        result += '✅ **QuestionScheduler検証**: Position階層が正常です\n';
        result += '  - まだまだ語（60-69範囲内）: ' + validation.stillInBoostedZone + '語\n';
        result += '  - 新規語（40-59範囲内）: ' + validation.newInBoostedZone + '語\n\n';
      } else {
        hasViolation = true;
        result += '❌ **QuestionScheduler検証**: Position階層違反を検出\n';
        result += '  - 違反件数: ' + validation.violationCount + '語\n';
        violations.push(...validation.violations);
      }
    }

    // GamificationAI（まだまだ語）の検証結果
    if (stillStored) {
      const still = JSON.parse(stillStored);
      if (still.violationCount === 0) {
        result +=
          '✅ **GamificationAI（まだまだ語）**: 全' +
          still.totalStill +
          '語がPosition 60-69範囲内\n\n';
      } else {
        hasViolation = true;
        result += '❌ **GamificationAI（まだまだ語）**: Position 60-69範囲外の語を検出\n';
        result +=
          '  - 違反件数: ' + still.violationCount + '語（全' + still.totalStill + '語中）\n';
        violations.push(...still.violations);
      }
    }

    // GamificationAI（新規語）の検証結果
    if (newStored) {
      const newV = JSON.parse(newStored);
      if (newV.violationCount === 0) {
        result += '✅ **GamificationAI（新規語）**: 全' + newV.totalNew + '語がPosition 60未満\n\n';
      } else {
        hasViolation = true;
        result += '❌ **GamificationAI（新規語）**: Position 60以上の語を検出\n';
        result += '  - 違反件数: ' + newV.violationCount + '語（全' + newV.totalNew + '語中）\n';
        violations.push(...newV.violations);
      }
    }

    // 違反詳細
    if (hasViolation && violations.length > 0) {
      result += '\n**🚨 違反の詳細**:\n';
      violations.slice(0, 10).forEach((v: any, idx: number) => {
        const typeLabel =
          v.type === 'new_exceeds_60'
            ? '新規語がPosition 60以上'
            : v.type === 'still_below_60'
              ? 'まだまだ語がPosition 60未満'
              : v.type === 'still_above_70'
                ? 'まだまだ語がPosition 70以上'
                : '不明';
        result +=
          idx +
          1 +
          '. **' +
          v.word +
          '**: Position ' +
          v.position.toFixed(0) +
          ' ← ' +
          typeLabel +
          '\n';
      });
      if (violations.length > 10) {
        result += '\n_…他' + (violations.length - 10) + '件_\n';
      }

      result += '\n**📖 原因と対策**:\n';
      result += '- これは「あっちを立てればこっちが立たず」問題です\n';
      result += '- まだまだ語を優先させるために新規語のブースト量を削減していませんか？\n';
      result += '- 新規語を混ぜるためにまだまだ語のブースト量を削減していませんか？\n';
      result += '- Position階層の不変条件（60-69: まだまだ、40-59: 新規）を守ってください\n';
    } else if (!hasViolation) {
      result += '🎉 **Position階層は完璧に守られています！**\n';
      result += '- まだまだ語は確実に新規語より優先されます\n';
      result += '- 新規語はまだまだ語を邪魔しません\n';
    }

    return result;
  } catch (e) {
    return '⚠️ Position階層検証データの解析エラー: ' + (e as Error).message;
  }
})()}

---

## �📞 関数呼び出し履歴 (最新30件)

${
  functionCalls.length > 0
    ? functionCalls
        .slice(-30)
        .reverse()
        .map((call: any, idx: number) => {
          return (
            idx +
            1 +
            '. **' +
            call.function +
            '** ' +
            JSON.stringify(call.params) +
            ' - ' +
            new Date(call.timestamp).toLocaleTimeString()
          );
        })
        .join('\n')
    : '⚠️ 関数呼び出し履歴がありません'
}

---

## 🔍 sortAndBalance() 出力検証

**sortAndBalance()後のTOP30（Position降順ソート後）**:
${(() => {
  const sortedOutput = localStorage.getItem('debug_sortAndBalance_output');
  if (!sortedOutput) return '⚠️ sortAndBalance()の出力が保存されていません';
  try {
    const data = JSON.parse(sortedOutput);
    return data
      .slice(0, 30)
      .map((item: any, idx: number) => {
        const status =
          item.attempts === 0
            ? '⚪ 新規(未出題)'
            : item.position >= 70
              ? '🔴 分からない'
              : item.position >= 40
                ? '🟡 まだまだ'
                : item.position >= 20
                  ? '⚪ 新規'
                  : '✅ 定着';
        return (
          idx +
          1 +
          '. **' +
          item.word +
          '** - Position ' +
          (item.position ?? 0).toFixed(0) +
          ' (' +
          item.attempts +
          '回) ' +
          status
        );
      })
      .join('\n');
  } catch {
    return '⚠️ データ解析エラー';
  }
})()}

**postProcess()後のTOP30（実際の出題キュー）**:
${(() => {
  const postProcessOutput = localStorage.getItem('debug_postProcess_output');
  if (!postProcessOutput) return '⚠️ postProcess()の出力が保存されていません';
  try {
    const data = JSON.parse(postProcessOutput);
    return data
      .slice(0, 30)
      .map((item: any, idx: number) => {
        const status =
          item.attempts === 0
            ? '⚪ 新規(未出題)'
            : item.position >= 70
              ? '🔴 分からない'
              : item.position >= 40
                ? '🟡 まだまだ'
                : item.position >= 20
                  ? '⚪ 新規'
                  : '✅ 定着';
        return (
          idx +
          1 +
          '. **' +
          item.word +
          '** - Position ' +
          (item.position ?? 0).toFixed(0) +
          ' (' +
          item.attempts +
          '回) ' +
          status
        );
      })
      .join('\n');
  } catch {
    return '⚠️ データ解析エラー';
  }
})()}

**🚨 重要**: sortAndBalance()とpostProcess()の出力が異なる場合、postProcess()が順序を破壊しています！

**🔍 まだまだ語のランキング分析**:
${(() => {
  const top100Data = localStorage.getItem('debug_sortAndBalance_top100');
  if (!top100Data) return '⚠️ TOP100データが保存されていません';
  try {
    const data = JSON.parse(top100Data);

    let result = '';

    // Position 50の新規が何語あるか
    result += `📊 **Position 50の新規**: ${data.position50Count}語（これがまだまだ語より優先されている）\n\n`;

    // TOP100内のまだまだ語
    if (data.stillLearningInTop100 === 0) {
      result += '❌ **まだまだ語（Position 40-70, attempts>0）がTOP100に1つも入っていません！**\n';
    } else {
      result +=
        '✅ まだまだ語が**' +
        data.stillLearningInTop100 +
        '語**、TOP100内にあります:\n' +
        data.stillLearningWordsInTop100.slice(0, 10).join('\n') +
        (data.stillLearningWordsInTop100.length > 10
          ? '\n_…他' + (data.stillLearningWordsInTop100.length - 10) + '語_'
          : '') +
        '\n\n';
    }

    // TOP600内のまだまだ語
    if (data.stillLearningInTop600 > 0) {
      result += '📍 **TOP600内のまだまだ語**: ' + data.stillLearningInTop600 + '語\n';
      if (data.stillLearningWordsInTop600 && data.stillLearningWordsInTop600.length > 0) {
        result += data.stillLearningWordsInTop600.slice(0, 5).join('\n');
        if (data.stillLearningWordsInTop600.length > 5) {
          result += '\n_…他' + (data.stillLearningWordsInTop600.length - 5) + '語_';
        }
      }
    } else {
      result += '❌ **TOP600内にもまだまだ語が見つかりません**';
    }

    result +=
      '\n\n**🚨 結論**: Position 50の新規' +
      data.position50Count +
      '語 > Position 45のまだまだ15語\n';
    result +=
      '→ Position降順ソートで新規が優先され、まだまだが' +
      (data.position50Count + 1) +
      '位以降に追いやられている！';

    return result;
  } catch {
    return '⚠️ データ解析エラー';
  }
})()}

---

## 📝 解答処理ログ (最新10件)
${
  answerLogs.length > 0
    ? answerLogs
        .map((log: any, idx: number) => {
          const changed = Math.abs(log.positionAfter - log.positionBefore) > 1;
          const arrow = changed ? (log.positionAfter > log.positionBefore ? '🔺' : '🔻') : '→';

          // LocalStorageから実際の履歴を取得して検証
          const allProgress = loadProgressSync();
          const actualProgress = allProgress.wordProgress?.[log.word];
          const actualCorrect = actualProgress?.memorizationCorrect ?? 0;
          const actualStillLearning = actualProgress?.memorizationStillLearning ?? 0;
          const actualAttempts = actualProgress?.memorizationAttempts ?? 0;
          const actualIncorrect = actualAttempts - actualCorrect - actualStillLearning;

          // 実際の値を常に表示（不一致があれば⚠️マーク）
          const mismatch =
            actualCorrect !== log.progress.correctCount ||
            actualIncorrect !== log.progress.incorrectCount;
          const actualInfo =
            ' | **実際のLS**: 正解' +
            actualCorrect +
            '/まだまだ' +
            actualStillLearning +
            '/誤答' +
            actualIncorrect +
            ' (計' +
            actualAttempts +
            '回)' +
            (mismatch ? ' ⚠️**不一致**' : '');

          return (
            idx +
            1 +
            '. **' +
            log.word +
            '**: Position ' +
            log.positionBefore.toFixed(0) +
            ' ' +
            arrow +
            ' ' +
            log.positionAfter.toFixed(0) +
            ' (' +
            log.category +
            ') [ログ: 正解' +
            log.progress.correctCount +
            '/' +
            log.progress.incorrectCount +
            '誤答]' +
            actualInfo
          );
        })
        .join('\n')
    : '⚠️ 解答ログがありません（まだ解答していない可能性）'
}

---

## 🔄 まだまだ・分からない (${strugglingWords.length}語)

**⚠️ 重要**: この表は**LocalStorageの生Positionデータ**を表示しています。
GamificationAIによるブースト後のPosition（スケジューリング時）は、次の「まだまだ語のブースト」セクションを確認してください。

| # | 単語 | Position (LS) | 状態 | 試行回数 | 最終学習 | 連続誤答 |
|---|------|---------------|------|----------|----------|----------|
${strugglingWords
  .slice(0, 30)
  .map((item, idx) => {
    const lastStudied = item.lastStudied ? new Date(item.lastStudied).toLocaleDateString() : '-';
    const category = item.position >= 70 ? '🔴 分からない' : '🟡 まだまだ';
    const allProgress = loadProgressSync();
    const wordProgress = allProgress.wordProgress?.[item.word];
    const consecutiveIncorrect = wordProgress?.consecutiveIncorrect ?? 0;
    return `| ${idx + 1} | **${item.word}** | ${item.position.toFixed(0)} | ${category} | ${item.attempts}回 | ${lastStudied} | ${consecutiveIncorrect}回 |`;
  })
  .join('\n')}

_…他${Math.max(0, strugglingWords.length - 30)}語省略_

### 📊 スケジューリング後のPosition（ブースト後）

${(() => {
  try {
    const boostStored = localStorage.getItem('debug_still_learning_boost');
    if (!boostStored) return '⚠️ まだまだ語ブースト情報がありません';

    const boostData = JSON.parse(boostStored);
    if (!boostData.working || boostData.boosted === 0) {
      return '❌ まだまだ語が0語 → ブーストなし';
    }

    return `**まだまだ語のブースト結果**: ${boostData.boosted}語が Position 60-69 に引き上げ ✅

| # | 単語 | Before | After | 増加量 |
|---|------|--------|-------|--------|
${boostData.changes
  .slice(0, 20)
  .map((c: any, idx: number) => {
    return `| ${idx + 1} | **${c.word}** | ${c.before.toFixed(0)} | ${c.after.toFixed(0)} | +${(c.after - c.before).toFixed(0)} |`;
  })
  .join('\n')}

${boostData.changes.length > 20 ? '_…他' + (boostData.changes.length - 20) + '語_' : ''}

**🎯 重要**: この表の「After」カラムが、実際のスケジューリングで使われるPosition値です。`;
  } catch {
    return '⚠️ まだまだ語ブースト情報の読み込みに失敗';
  }
})()}

---

## 📋 次の出題予定 (30問）

**⚠️ 重要**: この表示は元のJSON順序ではなく、**実際のスケジューリング結果**（postProcess()出力）を表示します。

${(() => {
  const postProcessOutput = localStorage.getItem('debug_postProcess_output');
  if (!postProcessOutput) {
    return (
      '⚠️ スケジューリング結果が保存されていません。ページを再読み込みしてください。\n\n**元のJSON順序（参考情報のみ）**:\n' +
      questions
        .slice(currentIndex + 1, currentIndex + 31)
        .map((q, idx) => {
          const allProgress = loadProgressSync();
          const wordProgress = allProgress.wordProgress?.[q.word];
          const position = wordProgress?.memorizationPosition ?? 0;
          const attempts = wordProgress?.totalAttempts ?? 0;
          const status =
            attempts === 0
              ? '⚪ 新規（未出題）'
              : position >= 70
                ? '🔴 分からない'
                : position >= 40
                  ? '🟡 まだまだ'
                  : position >= 20
                    ? '⚪ 新規'
                    : '✅ 定着';
          return (
            '| ' +
            (idx + 1) +
            ' | ' +
            (currentIndex + idx + 2) +
            '問目 | **' +
            q.word +
            '** | ' +
            position.toFixed(0) +
            ' | ' +
            attempts +
            '回 | ' +
            (q.difficulty || 'unknown') +
            ' | ' +
            status +
            ' |'
          );
        })
        .join('\n')
    );
  }

  try {
    const scheduledQueue = JSON.parse(postProcessOutput);
    if (!Array.isArray(scheduledQueue) || scheduledQueue.length === 0) {
      return '⚠️ スケジューリングキューが空です';
    }

    return (
      '| # | 単語 | Position | 出題回数 | 状態 |\n' +
      '|---|------|----------|----------|------|\n' +
      scheduledQueue
        .map((item: any, idx: number) => {
          const status =
            item.attempts === 0
              ? '⚪ 新規(未出題)'
              : item.position >= 70
                ? '🔴 分からない'
                : item.position >= 40
                  ? '🟡 まだまだ'
                  : item.position >= 20
                    ? '⚪ 新規'
                    : '✅ 定着';
          return (
            '| ' +
            (idx + 1) +
            ' | **' +
            item.word +
            '** | ' +
            (item.position ?? 0).toFixed(0) +
            ' | ' +
            item.attempts +
            '回 | ' +
            status +
            ' |'
          );
        })
        .join('\n')
    );
  } catch {
    return '⚠️ データ解析エラー';
  }
})()}

**🔍 分析**:
- まだまだ(Position 45)が上位に来ているか？ → ✅ 正常
- Position 50の引き上げ単語が混入しているか？ → ✅ 正常
- Position 0の新規が上位独占していないか？ → ❌ 問題あり

---

## 📋 元のJSON順序（参考情報）

この表示は**QuestionScheduler通過前**の元データ順序です。

| # | 問題位置 | 単語 | Position | 出題回数 | 難易度 | 状態 |
|---|----------|------|----------|----------|--------|------|
${questions
  .slice(currentIndex + 1, currentIndex + 31)
  .map((question, idx) => {
    const word = question?.word;
    const allProgress = loadProgressSync();
    const wordProgress = allProgress.wordProgress?.[word];
    const position = wordProgress?.memorizationPosition ?? 0;
    const attempts = wordProgress?.totalAttempts ?? 0;
    const difficulty = question?.difficulty ?? '不明';
    const status =
      attempts === 0
        ? '⚪ 新規（未出題）'
        : position >= 70
          ? '🔴 分からない'
          : position >= 40
            ? '🟡 まだまだ'
            : position >= 20
              ? '⚪ 新規'
              : '✅ 定着';
    return `| ${idx + 1} | ${currentIndex + idx + 2}問目 | **${word}** | ${position.toFixed(0)} | ${attempts}回 | ${difficulty} | ${status} |`;
  })
  .join('\n')}

---

## 🤖 AI評価履歴 (最新${Math.max(aiEvaluations.length, 20)}件)

${aiEvalTable}

---

## 📊 統計サマリー

- **総問題数**: ${totalQuestions}問
- **現在進捗**: ${(((currentIndex + 1) / totalQuestions) * 100).toFixed(1)}%
- **LocalStorage保存中（まだまだ・分からない）**: ${strugglingWords.length}語
  - 分からない (Position≥70): ${strugglingWords.filter((w) => w.position >= 70).length}語
  - まだまだ (Position≥40): ${strugglingWords.filter((w) => w.position >= 40 && w.position < 70).length}語
- **次30問中の状態別**:
  - 🔴 分からない: ${
    questions.slice(currentIndex + 1, currentIndex + 31).filter((q) => {
      const wp = loadProgressSync().wordProgress?.[q.word];
      return (wp?.memorizationPosition ?? 0) >= 70;
    }).length
  }問
  - 🟡 まだまだ: ${
    questions.slice(currentIndex + 1, currentIndex + 31).filter((q) => {
      const wp = loadProgressSync().wordProgress?.[q.word];
      const pos = wp?.memorizationPosition ?? 0;
      return pos >= 40 && pos < 70;
    }).length
  }問
  - ⚪ 新規: ${
    questions.slice(currentIndex + 1, currentIndex + 31).filter((q) => {
      const wp = loadProgressSync().wordProgress?.[q.word];
      const attempts = wp?.totalAttempts ?? 0;
      const pos = wp?.memorizationPosition ?? 0;
      return attempts === 0 || (pos >= 20 && pos < 40);
    }).length
  }問
  - ✅ 定着済: ${
    questions.slice(currentIndex + 1, currentIndex + 31).filter((q) => {
      const wp = loadProgressSync().wordProgress?.[q.word];
      const attempts = wp?.totalAttempts ?? 0;
      return attempts > 0 && (wp?.memorizationPosition ?? 0) < 20;
    }).length
  }問

## 🔍 デバッグヒント

**期待される動作**:
1. まだまだ58語 → GamificationAI が新規をPosition引き上げ
2. 新規の17% (約10語) が Position +15 → 40-55ゾーンに混入
3. Position降順ソート → まだまだ5問 → 新規1問の比率で出題

**確認ポイント**:
- [ ] calculatePriorities() が呼ばれているか？
- [ ] applyInterleavingAdjustment() が実行されているか？
- [ ] 新規のPositionが +15 されているか？（コンソールログ確認）
- [ ] sortAndBalance() がPosition降順ソートしているか？

---

_このレポートをコピーしてGitHub Copilot Chatで分析できます_
`.trim();

    navigator.clipboard.writeText(debugText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  useEffect(() => {
    // localStorage から AI評価を読み込み
    const stored = localStorage.getItem('debug_ai_evaluations');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setAIEvaluations(Object.values(data).slice(-10)); // 最新10件
      } catch {
        // 無視
      }
    }

    // Position分散診断情報を読み込み
    const diagStored = localStorage.getItem('debug_position_interleaving');
    if (diagStored) {
      try {
        setInterleavingDiag(JSON.parse(diagStored));
      } catch {
        // 無視
      }
    }

    // 解答ログを読み込み
    const answerStored = localStorage.getItem('debug_answer_logs');
    if (answerStored) {
      try {
        setAnswerLogs(JSON.parse(answerStored));
      } catch {
        // 無視
      }
    }

    // 関数呼び出し履歴を読み込み
    const callsStored = localStorage.getItem('debug_function_calls');
    if (callsStored) {
      try {
        setFunctionCalls(JSON.parse(callsStored));
      } catch {
        // 無視
      }
    }

    // 🛡️ Position階層検証結果を読み込み（デバッグパネル用）
    const validationStored = localStorage.getItem('debug_position_hierarchy_validation');
    const stillStored = localStorage.getItem('debug_position_hierarchy_still');
    const newStored = localStorage.getItem('debug_position_hierarchy_new');

    if (import.meta.env.DEV && (validationStored || stillStored || newStored)) {
      console.log('🛡️ [デバッグパネル] Position階層検証結果を読み込みました');
      if (validationStored) {
        const validation = JSON.parse(validationStored);
        if (!validation.isValid) {
          console.warn(`⚠️ [デバッグパネル] Position階層違反: ${validation.violationCount}件`);
        }
      }
    }
  }, [currentIndex]);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-50"
      >
        🔍 再出題デバッグ
      </button>
    );
  }

  // 次の出題予定を抽出
  // const upcomingWords = questions
  //   .slice(currentIndex + 1, currentIndex + 11)
  //   .map((q, idx) => ({
  //     word: q.word,
  //     position: currentIndex + idx + 1,
  //   }));

  // 再出題予定のワードをハイライト
  // const requeuedSet = new Set(requeuedWords.map((r) => r.word));

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white rounded-lg shadow-2xl overflow-auto z-50 border-2 border-blue-500">
      {/* ヘッダー */}
      <div className="sticky top-0 bg-blue-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-bold">🔍 再出題デバッグパネル</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`px-3 py-1 rounded ${copySuccess ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-700'}`}
            title="マークダウン形式でコピー"
          >
            {copySuccess ? '✓ コピー完了' : '📋 コピー'}
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-blue-700 px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* スコアボード */}
        {(() => {
          const allProgress = loadProgressSync();
          const totalWords = Object.keys(allProgress.wordProgress || {}).length;
          const masteredWords = Object.values(allProgress.wordProgress || {}).filter(
            (p: any) => p.memorizationPosition < 20
          ).length;
          const stillLearningWords = Object.values(allProgress.wordProgress || {}).filter(
            (p: any) =>
              p.memorizationPosition >= 40 && p.memorizationPosition < 70 && p.totalAttempts > 0
          ).length;
          const incorrectWords = Object.values(allProgress.wordProgress || {}).filter(
            (p: any) => p.memorizationPosition >= 70
          ).length;

          const totalAttempts = Object.values(allProgress.wordProgress || {}).reduce(
            (sum: number, p: any) => sum + (p.totalAttempts || 0),
            0
          );
          const totalCorrect = Object.values(allProgress.wordProgress || {}).reduce(
            (sum: number, p: any) => sum + (p.memorizationCorrect || 0),
            0
          );
          const totalIncorrect = Object.values(allProgress.wordProgress || {}).reduce(
            (sum: number, p: any) => sum + (p.memorizationIncorrect || 0),
            0
          );
          const overallAccuracy =
            totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : '0.0';
          const masteryRate =
            totalWords > 0 ? ((masteredWords / totalWords) * 100).toFixed(1) : '0.0';

          return (
            <div className="bg-green-50 p-3 rounded border-2 border-green-300">
              <p className="font-semibold text-green-800">スコアボード（学習状況）</p>
              <div className="mt-2 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-600">総単語数</p>
                    <p className="text-lg font-bold">{totalWords}語</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-600">習得済み</p>
                    <p className="text-lg font-bold text-green-600">{masteredWords}語</p>
                    <p className="text-xs text-gray-500">({masteryRate}%)</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-600">まだまだ</p>
                    <p className="text-lg font-bold text-yellow-600">{stillLearningWords}語</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-600">分からない</p>
                    <p className="text-lg font-bold text-red-600">{incorrectWords}語</p>
                  </div>
                </div>

                <div className="bg-white p-2 rounded">
                  <div className="flex justify-between">
                    <span className="text-gray-600">全体正答率:</span>
                    <span className="font-bold">{overallAccuracy}%</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">総試行回数:</span>
                    <span>{totalAttempts}回</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-green-600">正答: {totalCorrect}回</span>
                    <span className="text-red-600">誤答: {totalIncorrect}回</span>
                  </div>
                </div>

                <div className="bg-white p-2 rounded">
                  <div className="flex justify-between">
                    <span className="text-gray-600">進捗率:</span>
                    <span className="font-bold">
                      {((currentIndex / totalQuestions) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentIndex} / {totalQuestions} 問目
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 関数呼び出し履歴 */}
        {functionCalls.length > 0 && (
          <div className="bg-blue-50 p-3 rounded border-2 border-blue-300">
            <p className="font-semibold text-blue-800">
              📞 関数呼び出し履歴 (最新{functionCalls.length}件)
            </p>
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {functionCalls
                .slice()
                .reverse()
                .map((call: any, idx: number) => (
                  <div
                    key={idx}
                    className="text-xs bg-white p-2 rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600">{call.function}</span>
                      <span className="ml-2 text-gray-600">{JSON.stringify(call.params)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* �📝 解答直後のPosition計算ログ */}
        {answerLogs.length > 0 && (
          <div className="bg-green-50 p-3 rounded border-2 border-green-300">
            <p className="font-semibold text-green-800">
              📝 解答直後のPosition計算 (最新{answerLogs.length}件)
            </p>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {answerLogs
                .slice()
                .reverse()
                .map((log: any, idx: number) => {
                  const changed = Math.abs(log.positionAfter - log.positionBefore) > 1;
                  const increased = log.positionAfter > log.positionBefore;
                  return (
                    <div key={idx} className="text-xs bg-white p-2 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold">{log.word}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <div>
                          <span className="text-gray-600">Position: </span>
                          <span
                            className={
                              changed
                                ? increased
                                  ? 'text-red-600 font-bold'
                                  : 'text-green-600 font-bold'
                                : ''
                            }
                          >
                            {log.positionBefore.toFixed(0)} → {log.positionAfter.toFixed(0)}
                          </span>
                          {changed && (
                            <span className="ml-2">
                              {increased ? '🔺' : '🔻'}
                              {Math.abs(log.positionAfter - log.positionBefore).toFixed(0)}
                            </span>
                          )}
                        </div>
                        <span
                          className={
                            log.category === 'incorrect'
                              ? 'bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs'
                              : log.category === 'still_learning'
                                ? 'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs'
                                : log.category === 'new'
                                  ? 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs'
                                  : 'bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs'
                          }
                        >
                          {log.category === 'incorrect'
                            ? '🔴 分からない'
                            : log.category === 'still_learning'
                              ? '🟡 まだまだ'
                              : log.category === 'new'
                                ? '⚪ 新規'
                                : '✅ 定着済'}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-gray-600">
                        <span>正答: {log.progress.correctCount}</span>
                        <span>誤答: {log.progress.incorrectCount}</span>
                        <span>連続正答: {log.progress.consecutiveCorrect}</span>
                        <span>連続誤答: {log.progress.consecutiveIncorrect}</span>
                        <span>正答率: {(log.progress.accuracy * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 🎮 Position分散診断 */}
        {interleavingDiag && (
          <div className="bg-purple-50 p-3 rounded border-2 border-purple-300">
            <p className="font-semibold text-purple-800">🎮 Position分散診断</p>
            <div className="mt-2 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>分散前:</span>
                <span>
                  まだまだ{interleavingDiag.before.struggling}語 / 新規{interleavingDiag.before.new}
                  語
                </span>
              </div>
              <div className="flex justify-between">
                <span>分散後:</span>
                <span>
                  まだまだ{interleavingDiag.after.struggling}語 / 新規{interleavingDiag.after.new}語
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Position引き上げ:</span>
                <span
                  className={interleavingDiag.summary.working ? 'text-green-600' : 'text-red-600'}
                >
                  {interleavingDiag.summary.boosted}語
                  {interleavingDiag.summary.working ? ' ✅' : ' ❌'}
                </span>
              </div>
              {interleavingDiag.changed.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-purple-700">
                    引き上げられた単語 ({interleavingDiag.changed.length}語)
                  </summary>
                  <ul className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                    {interleavingDiag.changed.slice(0, 10).map((item: any, idx: number) => (
                      <li key={idx} className="text-xs bg-white p-1 rounded">
                        <span className="font-mono">{item.word}</span>:{' '}
                        <span className="text-gray-500">
                          {item.before.toFixed(0)} → {item.after.toFixed(0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {!interleavingDiag.summary.working && (
                <div className="text-red-600 font-bold mt-2">
                  ⚠️ インターリーブが機能していません！
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎮 カテゴリ別インターリーブ（交互配置） */}
        {(() => {
          const postProcessOutput = localStorage.getItem('debug_postProcess_output');
          if (!postProcessOutput) return null;

          try {
            const data = JSON.parse(postProcessOutput);
            const top30 = data.slice(0, 30);

            // カテゴリ判定
            const categorized = top30.map((item: any) => {
              if (item.attempts > 0 && item.position >= 40 && item.position < 70) return 'まだまだ';
              if (item.attempts === 0 && item.position >= 40 && item.position < 70)
                return '新規(引上)';
              if (item.position >= 70) return '分からない';
              if (item.position < 20) return '定着済';
              return '新規';
            });

            // 統計
            const stats = {
              まだまだ: categorized.filter((c: string) => c === 'まだまだ').length,
              新規引上: categorized.filter((c: string) => c === '新規(引上)').length,
              その他: categorized.filter((c: string) => !['まだまだ', '新規(引上)'].includes(c))
                .length,
            };

            // パターン視覚化（絵文字）
            const pattern = categorized
              .slice(0, 20)
              .map((c: string) => {
                switch (c) {
                  case 'まだまだ':
                    return '🟡';
                  case '新規(引上)':
                    return '🔵';
                  case '分からない':
                    return '🔴';
                  case '定着済':
                    return '✅';
                  default:
                    return '⚪';
                }
              })
              .join('');

            // 交互配置の品質チェック
            let interleavingQuality = 0;
            for (let i = 0; i < categorized.length - 1; i++) {
              const current = categorized[i];
              const next = categorized[i + 1];
              if (current === 'まだまだ' && next === '新規(引上)') interleavingQuality++;
              if (current === '新規(引上)' && next === 'まだまだ') interleavingQuality++;
            }

            const isWorking = interleavingQuality >= 3;

            return (
              <div className="bg-blue-50 p-3 rounded border-2 border-blue-300">
                <p className="font-semibold text-blue-800">
                  🎮 カテゴリ別インターリーブ（交互配置）
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>🟡 まだまだ:</span>
                    <span className="font-bold">{stats.まだまだ}語</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔵 新規(引上):</span>
                    <span className="font-bold">{stats.新規引上}語</span>
                  </div>
                  <div className="flex justify-between">
                    <span>その他:</span>
                    <span>{stats.その他}語</span>
                  </div>

                  <div className="mt-3 p-2 bg-white rounded">
                    <p className="text-xs font-semibold mb-1">パターン視覚化 (TOP20):</p>
                    <div className="text-lg leading-relaxed break-all">{pattern}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      🟡まだまだ 🔵新規(引上) ⚪新規 🔴分からない ✅定着済
                    </p>
                  </div>

                  <div
                    className={`mt-2 p-2 rounded ${isWorking ? 'bg-green-100' : 'bg-yellow-100'}`}
                  >
                    <p className="font-semibold">
                      {isWorking ? '✅ 交互配置が正常に機能' : '⚠️ 交互配置の頻度が低い'}
                    </p>
                    <p className="text-xs mt-1">
                      切り替え回数: {interleavingQuality}回
                      {isWorking ? ' (期待: まだまだ2-3問 → 新規1問)' : ''}
                    </p>
                  </div>

                  {stats.まだまだ === 0 && stats.新規引上 === 0 && (
                    <div className="text-gray-600 mt-2">ℹ️ インターリーブ対象なし（正常動作）</div>
                  )}
                </div>
              </div>
            );
          } catch {
            return null;
          }
        })()}

        {/* 現在位置 */}
        <div className="bg-gray-100 p-3 rounded">
          <p className="font-semibold">📍 現在位置</p>
          <p className="text-lg">
            {currentIndex + 1} / {totalQuestions} 問目
          </p>
        </div>

        {/* まだまだ・分からない単語リスト（LocalStorage） */}
        <div className="bg-yellow-50 p-3 rounded">
          <p className="font-semibold text-yellow-800">
            🔄 まだまだ・分からない ({strugglingWords.length}語)
          </p>
          <p className="text-xs text-gray-600 mt-1">
            LocalStorageに保存されている苦手単語（Position ≥ 40）
          </p>
          {strugglingWords.length === 0 ? (
            <p className="text-gray-600 mt-2">（なし）</p>
          ) : (
            <ul className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {strugglingWords.slice(0, 20).map((item, idx) => (
                <li key={idx} className="text-xs bg-white p-2 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold">{item.word}</span>
                    <span
                      className={
                        item.position >= 70
                          ? 'bg-red-100 text-red-800 px-2 py-0.5 rounded'
                          : 'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded'
                      }
                    >
                      {item.position >= 70 ? '🔴 分からない' : '🟡 まだまだ'}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>Position: {item.position.toFixed(0)}</span>
                    <span>試行: {item.attempts}回</span>
                    <span>最終: {new Date(item.lastStudied).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {strugglingWords.length > 20 && (
            <p className="text-xs text-gray-500 mt-2">
              ※ 最初の20語のみ表示（全{strugglingWords.length}語）
            </p>
          )}
        </div>

        {/* 次の10問 */}
        <div className="bg-blue-50 p-3 rounded">
          <p className="font-semibold text-blue-800">📋 次の30問（Position分散診断用）</p>
          <p className="text-xs text-gray-600 mt-1">
            まだまだ58語 → 新規の17% (約10語) がPosition +15されているはず
          </p>
          <ul className="mt-2 space-y-1 max-h-80 overflow-y-auto">
            {questions.slice(currentIndex + 1, currentIndex + 31).map((question, idx) => {
              const word = question?.word;

              // LocalStorageからWordProgressを取得
              const allProgress = loadProgressSync();
              const wordProgress = allProgress.wordProgress?.[word];
              const position = wordProgress?.memorizationPosition ?? 0;
              const attempts = wordProgress?.totalAttempts ?? 0;
              const difficulty = question?.difficulty ?? '不明';
              const isStrugglingWord = position >= 40;

              // 状態ラベル
              const statusLabel =
                position >= 70
                  ? '🔴 分からない'
                  : position >= 40
                    ? '🟡 まだまだ'
                    : position >= 20
                      ? '⚪ 新規'
                      : '✅ 定着済';

              return (
                <li
                  key={idx}
                  className={`text-xs p-2 rounded ${
                    isStrugglingWord ? 'bg-yellow-200 font-bold' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-500">{currentIndex + idx + 2}問目</span>{' '}
                      <span className="font-mono font-bold">{word}</span>
                    </div>
                    <div className="text-xs">{statusLabel}</div>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-600">
                    <span>Position: {position.toFixed(0)}</span>
                    <span>出題: {attempts}回</span>
                    <span>{difficulty}</span>
                    {isStrugglingWord && (
                      <span className="text-yellow-800 font-bold">
                        {position >= 70 ? '🔴 分からない' : '🟡 まだまだ'}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* AI評価（最新10件） */}
        <div className="bg-purple-50 p-3 rounded">
          <p className="font-semibold text-purple-800">🤖 AI評価（最新10件）</p>
          {aiEvaluations.length === 0 ? (
            <p className="text-gray-600">（なし）</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {aiEvaluations.slice(-10).map((evaluation: any, idx) => {
                const word = evaluation.word || '(単語名なし)';
                return (
                  <li key={idx} className="text-xs bg-white p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#{idx + 1}</span>
                        <span className="font-mono font-bold text-base text-blue-600">{word}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          evaluation.category === 'incorrect'
                            ? 'bg-red-100 text-red-800'
                            : evaluation.category === 'still_learning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : evaluation.category === 'mastered'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {evaluation.category === 'incorrect'
                          ? '分からない'
                          : evaluation.category === 'still_learning'
                            ? 'まだまだ'
                            : evaluation.category === 'mastered'
                              ? '定着済'
                              : '未学習'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-gray-600">
                      <div>
                        <span className="font-semibold">
                          Position: {(evaluation.position ?? 0).toFixed(0)}
                        </span>
                        <span className="ml-2 text-xs">
                          (連続正解: {evaluation.consecutiveCorrect ?? 0}, 連続不正解:{' '}
                          {evaluation.consecutiveIncorrect ?? 0})
                        </span>
                      </div>
                      <div className="text-xs">
                        <span>正解率: {((evaluation.accuracy ?? 0) * 100).toFixed(0)}%</span>
                        <span className="ml-2">試行: {evaluation.attempts ?? 0}回</span>
                        <span className="ml-2">経過: {evaluation.daysSince ?? 0}日</span>
                      </div>
                      {evaluation.aiProposals && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="text-xs font-semibold mb-1">🤖 7つのAI提案:</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span>
                              🧠 Memory: {(evaluation.aiProposals.memory ?? 0).toFixed(0)}
                            </span>
                            <span>
                              💤 CogLoad: {(evaluation.aiProposals.cognitiveLoad ?? 0).toFixed(0)}
                            </span>
                            <span>
                              🔮 Error: {(evaluation.aiProposals.errorPrediction ?? 0).toFixed(0)}
                            </span>
                            <span>
                              📚 Linguistic: {(evaluation.aiProposals.linguistic ?? 0).toFixed(0)}
                            </span>
                            <span>
                              🌍 Context: {(evaluation.aiProposals.contextual ?? 0).toFixed(0)}
                            </span>
                            <span>
                              🎯 Style: {(evaluation.aiProposals.learningStyle ?? 0).toFixed(0)}
                            </span>
                            <span className="col-span-2">
                              🎮 Gamify: {(evaluation.aiProposals.gamification ?? 0).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* クリアボタン */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              localStorage.removeItem('debug_ai_evaluations');
              setAIEvaluations([]);
            }}
            className="flex-1 bg-red-100 text-red-800 px-3 py-2 rounded hover:bg-red-200"
          >
            🗑️ AI評価クリア
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('debug_memorization_latest');
            }}
            className="flex-1 bg-gray-100 text-gray-800 px-3 py-2 rounded hover:bg-gray-200"
          >
            🗑️ デバッグログクリア
          </button>
        </div>

        {/* A/B集計ビュー */}
        <div className="mt-6 border-t-2 border-blue-300 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">📊 A/Bテスト集計</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const aggregate = aggregateAll();
                  setAbAggregate(aggregate);
                }}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200"
              >
                🔄 更新
              </button>
              <button
                onClick={() => {
                  const json = exportSessionLogsAsJson();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ab-session-logs-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200"
              >
                💾 JSONエクスポート
              </button>
              <button
                onClick={() => {
                  if (window.confirm('すべてのA/Bセッションログを削除しますか？')) {
                    clearSessionLogs();
                    setAbAggregate(null);
                  }
                }}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
              >
                🗑️ クリア
              </button>
            </div>
          </div>

          {abAggregate && abAggregate.totalSessions > 0 ? (
            <div className="space-y-4">
              <div className="bg-gray-100 p-3 rounded">
                <div className="text-sm">
                  <strong>総セッション数:</strong> {abAggregate.totalSessions}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  最終更新: {new Date(abAggregate.lastUpdated).toLocaleString('ja-JP')}
                </div>
              </div>

              {/* variant別の集計テーブル */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-2 py-1">Variant</th>
                      <th className="border border-gray-300 px-2 py-1">N</th>
                      <th className="border border-gray-300 px-2 py-1">
                        取得語数
                        <br />
                        (平均)
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        取得語数
                        <br />
                        (中央値)
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        取得率
                        <br />
                        (平均)
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        振動スコア
                        <br />
                        (平均)
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        所要時間
                        <br />
                        (平均)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['A', 'B', 'C'] as const).map((variant) => {
                      const data = abAggregate.byVariant[variant];
                      if (!data) {
                        return (
                          <tr key={variant}>
                            <td className="border border-gray-300 px-2 py-1 text-center font-bold">
                              {variant}
                            </td>
                            <td
                              colSpan={6}
                              className="border border-gray-300 px-2 py-1 text-center text-gray-500"
                            >
                              データなし
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={variant}>
                          <td className="border border-gray-300 px-2 py-1 text-center font-bold">
                            {variant}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {data.sessionCount}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {data.avgAcquiredWords.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {data.medianAcquiredWords.toFixed(0)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {(data.avgAcquisitionRate * 100).toFixed(1)}%
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {data.avgVibrationScore.toFixed(1)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {Math.round(data.avgDurationSec)}秒
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Week 5: ML統計表示 */}
              {(() => {
                // ML ONのセッション数を正しくカウント（mlEnabled=trueのみ）
                try {
                  const allLogs = JSON.parse(localStorage.getItem('ab_session_logs') || '[]');
                  const mlSessions = allLogs.filter((log: any) => log.mlEnabled === true).length;

                  if (mlSessions > 0) {
                    return (
                      <div className="bg-blue-50/20 p-3 rounded border border-blue-300">
                        <div className="text-sm font-semibold mb-2">🤖 ML統計</div>
                        <div className="text-xs space-y-1">
                          <div>ML ONセッション数: {mlSessions}</div>
                          <div className="text-gray-600">
                            ※ ML有効化後のセッションデータは各variantに含まれています
                          </div>
                        </div>
                      </div>
                    );
                  }
                } catch {
                  // ログ読み込み失敗時は非表示
                }
                return null;
              })()}

              {/* 合否判定（暫定） */}
              {abAggregate.byVariant.A && (
                <div className="bg-yellow-50/20 p-3 rounded border border-yellow-300">
                  <div className="text-sm font-semibold mb-2">📈 判定基準（暫定）</div>
                  <div className="text-xs space-y-1">
                    <div>
                      ✅ <strong>合格:</strong> B or C が A に対して「取得語数/セッション
                      +10%」かつ振動スコア悪化なし
                    </div>
                    <div>
                      ❌ <strong>不合格:</strong> 改善なし or 振動スコア &gt; 50
                    </div>
                  </div>
                  {abAggregate.byVariant.B && abAggregate.byVariant.A && (
                    <div className="mt-2 text-xs">
                      <strong>B vs A:</strong>{' '}
                      {abAggregate.byVariant.B.avgAcquiredWords >=
                        abAggregate.byVariant.A.avgAcquiredWords * 1.1 &&
                      abAggregate.byVariant.B.avgVibrationScore <=
                        abAggregate.byVariant.A.avgVibrationScore + 5
                        ? '✅ 合格（+10%達成）'
                        : '⏳ 継続測定'}
                    </div>
                  )}
                  {abAggregate.byVariant.C && abAggregate.byVariant.A && (
                    <div className="mt-1 text-xs">
                      <strong>C vs A:</strong>{' '}
                      {abAggregate.byVariant.C.avgAcquiredWords >=
                        abAggregate.byVariant.A.avgAcquiredWords * 1.1 &&
                      abAggregate.byVariant.C.avgVibrationScore <=
                        abAggregate.byVariant.A.avgVibrationScore + 5
                        ? '✅ 合格（+10%達成）'
                        : '⏳ 継続測定'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              セッション完了後にデータが表示されます
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
