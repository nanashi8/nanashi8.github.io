import { useState, useEffect } from 'react';
import { getStrugglingWordsList } from '../storage/progress/statistics';
import { loadProgressSync } from '../storage/progress/progressStorage';
import { determineWordPosition } from '@/ai/utils/categoryDetermination';
import type { ScheduleMode } from '@/ai/scheduler/types';
import { DebugTracer } from '@/utils/DebugTracer';
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
  mode: ScheduleMode;
  currentIndex: number;
  totalQuestions: number;
  questions: Array<{
    word: string;
    difficulty?: string;
  }>;
  requeuedWords?: RequeuedWord[];
  initialExpanded?: boolean;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getModePosition(progress: any, mode: ScheduleMode): number | null {
  if (!progress) return null;
  switch (mode) {
    case 'memorization':
      return progress.memorizationPosition ?? null;
    case 'translation':
      return progress.translationPosition ?? null;
    case 'spelling':
      return progress.spellingPosition ?? null;
    case 'grammar':
      return progress.grammarPosition ?? null;
  }
}

function getModeAttempts(progress: any, mode: ScheduleMode): number {
  if (!progress) return 0;
  switch (mode) {
    case 'memorization':
      return toFiniteNumber(progress.memorizationAttempts, 0);
    case 'translation':
      return toFiniteNumber(progress.translationAttempts, 0);
    case 'spelling':
      return toFiniteNumber(progress.spellingAttempts, 0);
    case 'grammar':
      return toFiniteNumber(progress.grammarAttempts, 0);
  }
}

function getModeCorrect(progress: any, mode: ScheduleMode): number {
  if (!progress) return 0;
  switch (mode) {
    case 'memorization':
      return toFiniteNumber(progress.memorizationCorrect, 0);
    case 'translation':
      return toFiniteNumber(progress.translationCorrect, 0);
    case 'spelling':
      return toFiniteNumber(progress.spellingCorrect, 0);
    case 'grammar':
      return toFiniteNumber(progress.grammarCorrect, 0);
  }
}

function getModeStillLearning(progress: any, mode: ScheduleMode): number {
  if (!progress) return 0;
  // 「まだまだ」カウンタは暗記のみ
  if (mode !== 'memorization') return 0;
  return toFiniteNumber(progress.memorizationStillLearning, 0);
}

function readPostProcessTop30(): any[] {
  const raw = localStorage.getItem('debug_postProcess_output');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any;
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.top30)) return parsed.top30;
    return [];
  } catch {
    return [];
  }
}

function readPostProcessMeta(): any | null {
  const raw = localStorage.getItem('debug_postProcess_meta');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function RequeuingDebugPanel({
  mode,
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
    const words = getStrugglingWordsList(mode);
    setStrugglingWords(words);
  }, [currentIndex, mode]); // currentIndexが変わるたびに更新

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

    // progressCacheの健全性チェック（null/欠損の切り分け用）
    const progressEntries = Object.values(allProgress.wordProgress || {}) as any[];
    const missingMemPos = progressEntries.filter((p) => getModePosition(p, mode) == null).length;
    const missingCategory = progressEntries.filter((p) => p?.category == null).length;
    const missingLastStudied = progressEntries.filter((p) => p?.lastStudied == null).length;
    const missingCounts = progressEntries.filter(
      (p) => p?.correctCount == null || p?.incorrectCount == null || p?.consecutiveCorrect == null
    ).length;

    // schedulerと同じ判定（determineWordPosition）で暗記タブの統計を集計
    let masteredWords = 0;
    let stillLearningWords = 0;
    let incorrectWords = 0;
    let strugglingWordsCount = 0;
    let totalAttempts = 0;
    let totalCorrect = 0;
    let totalStillLearning = 0;

    for (const p of progressEntries) {
      const attempts = getModeAttempts(p, mode);
      const correct = getModeCorrect(p, mode);
      const stillLearning = getModeStillLearning(p, mode);
      const position = determineWordPosition(p, mode);

      totalAttempts += attempts;
      totalCorrect += correct;
      totalStillLearning += stillLearning;

      if (attempts === 0) continue;

      if (position >= 70) {
        incorrectWords++;
        strugglingWordsCount++;
      } else if (position >= 40) {
        stillLearningWords++;
        strugglingWordsCount++;
      } else if (position < 20) {
        masteredWords++;
      }
    }

    // 誤答（暗記タブ）: memorizationIncorrect は存在しないことがあるので導出
    const totalIncorrect = Math.max(0, totalAttempts - totalCorrect - totalStillLearning);
    const overallAccuracy =
      totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : '0.0';

    const safeParse = (raw: string | null) => {
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    // progressCache照合（隠しスペース/大小/Unicode差異を吸収）
    const progressMap = (allProgress.wordProgress || {}) as Record<string, any>;
    const normalizeWordKey = (w: string) =>
      String(w ?? '')
        .normalize('NFC')
        .replace(/[\s\u00A0]+/g, ' ')
        .trim();
    const normalizeLookupKey = (w: string) => normalizeWordKey(w).toLowerCase();
    const normalizedIndex = new Map<string, string>();
    for (const key of Object.keys(progressMap)) {
      const nk = normalizeLookupKey(key);
      if (!normalizedIndex.has(nk)) normalizedIndex.set(nk, key);
    }
    const resolveWordProgress = (word: string): any | null => {
      const raw = normalizeWordKey(word);
      if (!raw) return null;
      const direct = (progressMap as any)[raw];
      if (direct) return direct;
      const lower = (progressMap as any)[raw.toLowerCase()];
      if (lower) return lower;
      const actualKey = normalizedIndex.get(normalizeLookupKey(raw));
      return actualKey ? ((progressMap as any)[actualKey] ?? null) : null;
    };

    // 次10問の分析対象
    // - 期待される挙動（上位10問に混入）と一致させるため、可能なら postProcess() TOP10 を参照
    // - 取得できない場合のみ、props（現在位置の次10問）にフォールバック
    const postProcessTop30 = readPostProcessTop30();
    const postProcessTop10Words = postProcessTop30
      .slice(0, 10)
      .map((i: any) => String(i?.word ?? ''))
      .filter(Boolean);
    const fallbackNext10Words = questions
      .slice(currentIndex + 1, currentIndex + 11)
      .map((q) => String(q.word ?? ''))
      .filter(Boolean);
    const next10Words =
      postProcessTop10Words.length > 0 ? postProcessTop10Words : fallbackNext10Words;
    const next10Source =
      postProcessTop10Words.length > 0 ? 'postProcess() TOP10' : 'props（現在位置の次10問）';

    const computeWordSnapshot = (word: string) => {
      const wp = resolveWordProgress(word);
      const position = determineWordPosition(wp, mode);
      const attempts = getModeAttempts(wp, mode);
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
      return { position, attempts, status };
    };
    const allNext10Under40 =
      next10Words.length > 0 && next10Words.every((w) => computeWordSnapshot(w).position < 40);

    // AI評価テーブル生成
    const aiEvalTable =
      aiEvaluations.length === 0
        ? '_（データなし）_'
        : `| 単語 | Position | Category | 🧠 Memory | 💤 CogLoad | 🔮 Error | 📚 Linguistic | 🌍 Context | 🎯 Style | 🎮 Gamify |\n` +
          `|------|----------|----------|-----------|-----------|----------|--------------|-----------|----------|----------|\n` +
          aiEvaluations
            .map((evaluation) => {
              const categoryLabel = (() => {
                switch (evaluation.category) {
                  case 'incorrect':
                    return '❌ 分からない';
                  case 'still_learning':
                    return '🟡 まだまだ';
                  case 'mastered':
                    return '✅ 定着済';
                  case 'new':
                    return '⚪ 新規';
                  default:
                    return '⚪ 新規';
                }
              })();
              const position = (evaluation.position ?? 0).toFixed(0);
              const ai = evaluation.aiProposals || {};
              return `| **${evaluation.word}** | ${position} | ${categoryLabel} | ${(ai.memory ?? 0).toFixed(0)} | ${(ai.cognitiveLoad ?? 0).toFixed(0)} | ${(ai.errorPrediction ?? 0).toFixed(0)} | ${(ai.linguistic ?? 0).toFixed(0)} | ${(ai.contextual ?? 0).toFixed(0)} | ${(ai.learningStyle ?? 0).toFixed(0)} | ${(ai.gamification ?? 0).toFixed(0)} |`;
            })
            .join('\n');

    const debugText = `# 🔍 再出題デバッグレポート（詳細版）

**生成日時**: ${timestamp}
    **mode**: ${mode}
**現在位置**: ${currentIndex + 1} / ${totalQuestions} 問目

---

${DebugTracer.generateSummary()}

---

${(() => {
  // 🚨 まだまだ語検出状況（最優先表示）
  try {
    const weakWordsDetection = localStorage.getItem('debug_weak_words_detection');
    if (weakWordsDetection) {
      const detection = JSON.parse(weakWordsDetection);
      const detectedCount =
        (detection.allWeakWordsInLS || 0) - (detection.missingFromBase?.length || 0);
      const missingCount = detection.missingFromBase?.length || 0;

      let section = '## 🚨 まだまだ語検出状況\n\n';
      section += `**timestamp**: ${detection.timestamp || 'N/A'}\n\n`;
      section += `- 📊 LocalStorageのまだまだ語: **${detection.allWeakWordsInLS || 0}語**\n`;
      section += `- ✅ 検出成功（baseQuestionsに存在）: **${detectedCount}語**\n`;
      section += `- ❌ データ欠損（baseQuestionsに不在）: **${missingCount}語**\n`;
      section += `- 📁 baseQuestions総数: ${detection.baseQuestionsCount || 0}語\n`;
      section += `- 🔍 filtered総数: ${detection.filteredCount || 0}語\n\n`;

      if (missingCount > 0) {
        section += '### ❌ 致命的エラー: baseQuestionsに存在しないまだまだ語\n\n';
        if (detection.missingFromBase && detection.missingFromBase.length > 0) {
          section += '```\n';
          detection.missingFromBase.forEach((word: string, i: number) => {
            section += `${i + 1}. ${word}\n`;
          });
          section += '```\n\n';
          section +=
            '**原因**: これらの単語が元のJSONデータ（juniorWords.json等）に含まれていません。\n';
          section += '**対策**: データソースを確認し、これらの単語を追加してください。\n\n';
        }
      }

      if (detection.weakWordsList && detection.weakWordsList.length > 0) {
        section += '### 📋 LocalStorageのまだまだ語リスト\n\n';
        section += '| # | 単語 | Position | memPos | attempts |\n';
        section += '|---|------|----------|--------|----------|\n';
        detection.weakWordsList.slice(0, 20).forEach((w: any, i: number) => {
          section += `| ${i + 1} | **${w.word}** | ${w.position} | ${w.memPos ?? '-'} | ${w.attempts}回 |\n`;
        });
        if (detection.weakWordsList.length > 20) {
          section += `\n_…他${detection.weakWordsList.length - 20}語省略_\n`;
        }
        section += '\n';
      }

      if (detection.weakQuestionsWords && detection.weakQuestionsWords.length > 0) {
        section += '### ✅ 検出されたweakQuestions\n\n';
        section += '```\n';
        detection.weakQuestionsWords.slice(0, 10).forEach((word: string, i: number) => {
          section += `${i + 1}. ${word}\n`;
        });
        if (detection.weakQuestionsWords.length > 10) {
          section += `...他${detection.weakQuestionsWords.length - 10}語\n`;
        }
        section += '```\n\n';
      }

      section += '---\n\n';
      return section;
    }
  } catch (e) {
    return `## 🚨 まだまだ語検出状況\n\n⚠️ 検出データの読み込みエラー: ${e}\n\n---\n\n`;
  }
  return '';
})()}

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

**progressCache健全性チェック**:
- tabPosition 未設定: ${missingMemPos} / ${totalWords}
- category 未設定: ${missingCategory} / ${totalWords}
- lastStudied 未設定: ${missingLastStudied} / ${totalWords}
- 主要カウント欠損（correct/incorrect/streak）: ${missingCounts} / ${totalWords}

---

## 🛠️ 起動時修復ログ（サマリー）

${(() => {
  const stored = localStorage.getItem('debug_progress_repair_summary');
  if (!stored)
    return '⚠️ 修復サマリーがありません（まだloadProgress()が走っていない/保存できていない可能性）';
  try {
    const s = JSON.parse(stored);
    const ts = s.timestamp ? String(s.timestamp) : '-';
    const categoryAdded = Number(s.categoryAdded ?? 0);
    const posRepaired = Number(s.memorizationPositionRepaired ?? 0);
    const saved = Boolean(s.saved);
    return (
      `**timestamp**: ${ts}\n` +
      `**categoryAdded**: ${categoryAdded}\n` +
      `**memorizationPositionRepaired**: ${posRepaired}\n` +
      `**saved**: ${saved ? 'true（修復を保存）' : 'false（修復なし or 保存不要）'}`
    );
  } catch {
    return '⚠️ 修復サマリーの解析に失敗しました';
  }
})()}

---

## 🎯 インターリーブ診断

### Position分布（まだまだ・分からない${strugglingWords.length}語）
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
**参照**: ${next10Source}

${next10Words
  .map((word, idx) => {
    const { position, attempts, status } = computeWordSnapshot(word);
    return `${idx + 1}. **${word}** - Position ${position.toFixed(0)} (${attempts}回) ${status}`;
  })
  .join('\n')}

**問題検出**:
${allNext10Under40 ? `❌ **全て新規（Position < 40）** → Position分散が機能していない可能性` : `✅ 新規とまだまだが混在 → Position分散が機能中`}

---

## 🎮 Position分散診断

${
  interleavingDiag
    ? `**分散前**:
- まだまだ・分からない: ${(interleavingDiag.before?.stillLearning || 0) + (interleavingDiag.before?.incorrect || 0)}語
- 新規: ${interleavingDiag.before?.new || 0}語
- 引き上げ候補(Position≥25): ${interleavingDiag.before?.boostable || 0}語

**分散後**:
- まだまだ・分からない: ${(interleavingDiag.after?.stillLearning || 0) + (interleavingDiag.after?.incorrect || 0)}語
- 新規 (Position引き上げ後): ${interleavingDiag.after?.new || 0}語
- 引き上げ候補(Position≥25): ${interleavingDiag.after?.boostable || 0}語

**Position引き上げ**: ${interleavingDiag.summary?.newBoosted || 0}語 ${(interleavingDiag.summary?.working ?? false) ? '✅' : '❌'}

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

    return `**まだまだ語 (Position 40-70, attempts>0) を引き上げ**: ${boostData.boosted}語 ✅

<details>
<summary>ブーストされた単語リスト (最初10件)</summary>

${boostData.changes
  .slice(0, 10)
  .map((c: any) => {
    const delta = Number(c.after) - Number(c.before);
    return (
      '- **' +
      c.word +
      '**: ' +
      c.before.toFixed(0) +
      ' → ' +
      c.after.toFixed(0) +
      ' (+' +
      (Number.isFinite(delta) ? delta.toFixed(0) : '0') +
      ')'
    );
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
  const top30 = readPostProcessTop30().slice(0, 30);
  if (top30.length === 0) return '⚠️ インターリーブ情報がありません';

  try {
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
        .slice(-10)
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
  const meta = readPostProcessMeta();
  const data = readPostProcessTop30();
  if (!data || data.length === 0) return '⚠️ postProcess()の出力が保存されていません';

  const metaLine = meta
    ? `\n(メタ) action=${meta.action}, interleavedAcrossBands=${Boolean(meta.isInterleavedAcrossBands)}\n`
    : '';

  return (
    metaLine +
    data
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
      .join('\n')
  );
})()}

**🚨 重要**: sortAndBalance()とpostProcess()の出力が異なる場合、postProcess()が順序を破壊しています！

**🔍 まだまだ語のランキング分析**:
${(() => {
  // アクティブタブのmodeのスナップショットを優先して読む
  const desiredMode = mode;
  const expectedQuestionsCount = totalQuestions;

  const safeParse = (raw: string | null) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const pickBestSnapshot = (candidates: any[], requireMode: boolean = false) => {
    const arr = candidates.filter(Boolean);
    if (arr.length === 0) return null;

    const asNum = (v: any) => {
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const asTime = (v: any) => {
      const t = Date.parse(String(v ?? ''));
      return Number.isFinite(t) ? t : 0;
    };

    // 🔥 重要: mode一致を最優先（translation 30問 vs memorization 4549問の混同を防止）
    if (requireMode) {
      const modeMatched = arr.filter((s) => String(s?.mode ?? '') === desiredMode);
      if (modeMatched.length === 0) return null;
      // mode一致の中で、totalQuestions一致 > 最大questionsCount > 最新timestamp の優先順位
      const exact = modeMatched.filter((s) => asNum(s?.questionsCount) === expectedQuestionsCount);
      if (exact.length > 0) {
        exact.sort((a, b) => asTime(b?.timestamp) - asTime(a?.timestamp));
        return exact[0];
      }
      const sorted = [...modeMatched].sort((a, b) => {
        const qa = asNum(a?.questionsCount) ?? -1;
        const qb = asNum(b?.questionsCount) ?? -1;
        if (qb !== qa) return qb - qa;
        return asTime(b?.timestamp) - asTime(a?.timestamp);
      });
      return sorted[0];
    }

    // requireMode=false（後方互換）: totalQuestions一致を最優先
    const exact = arr.filter((s) => asNum(s?.questionsCount) === expectedQuestionsCount);
    if (exact.length > 0) {
      exact.sort((a, b) => asTime(b?.timestamp) - asTime(a?.timestamp));
      return exact[0];
    }

    // questionsCount が大きい（=本番実行の可能性が高い）ものを優先し、同値なら新しいtimestamp
    const sorted = [...arr].sort((a, b) => {
      const qa = asNum(a?.questionsCount) ?? -1;
      const qb = asNum(b?.questionsCount) ?? -1;
      if (qb !== qa) return qb - qa;
      return asTime(b?.timestamp) - asTime(a?.timestamp);
    });
    return sorted[0];
  };

  // 🔥 mode一致を最優先: mode別履歴 → mode別最新 → legacy（最後の手段）
  const historyKey = `debug_sortAndBalance_top100_history_${desiredMode}`;
  const history = safeParse(localStorage.getItem(historyKey));
  const historyArr = Array.isArray(history) ? history : [];
  const bestFromHistory = pickBestSnapshot(historyArr, true); // requireMode=true

  const byModeKey = `debug_sortAndBalance_top100_${desiredMode}`;
  const byModeSnapshot = safeParse(localStorage.getItem(byModeKey));
  const bestFromByMode =
    byModeSnapshot && String(byModeSnapshot?.mode ?? '') === desiredMode ? byModeSnapshot : null;

  const legacy = safeParse(localStorage.getItem('debug_sortAndBalance_top100'));
  const legacyIfModeMatch = legacy && String(legacy?.mode ?? '') === desiredMode ? legacy : null;

  // mode一致を優先、なければlegacy（警告付き）
  const data = bestFromHistory ?? bestFromByMode ?? legacyIfModeMatch ?? legacy;
  if (!data) return '⚠️ TOP100データが保存されていません';
  try {
    const selectedFrom = bestFromHistory
      ? `history:${historyKey}`
      : bestFromByMode
        ? `byMode:${byModeKey}`
        : 'legacy:debug_sortAndBalance_top100';

    const top100 = Array.isArray(data?.top100) ? data.top100 : [];
    const top600 = Array.isArray(data?.top600) ? data.top600 : [];

    const snapshotTimestamp = typeof data?.timestamp === 'string' ? data.timestamp : null;
    const snapshotMode = typeof data?.mode === 'string' ? data.mode : null;
    const snapshotQuestionsCount = Number.isFinite(Number(data?.questionsCount))
      ? Number(data.questionsCount)
      : null;
    const snapshotInterleavedCount = Number.isFinite(Number(data?.interleavedCount))
      ? Number(data.interleavedCount)
      : null;
    const snapshotStillLearningTop100 = Number.isFinite(Number(data?.stillLearningInTop100))
      ? Number(data.stillLearningInTop100)
      : null;
    const snapshotStillLearningTop600 = Number.isFinite(Number(data?.stillLearningInTop600))
      ? Number(data.stillLearningInTop600)
      : null;

    // attemptsは保存側が壊れることがあるので、progressCache（memorizationAttempts）をSSOTとして再計算
    const allProgress = loadProgressSync();
    const progressMap = allProgress.wordProgress || {};
    const normalizeWordKey = (w: string) =>
      String(w ?? '')
        .normalize('NFC')
        .replace(/[\s\u00A0]+/g, ' ')
        .trim();
    const normalizeLookupKey = (w: string) => normalizeWordKey(w).toLowerCase();

    // 正規化キー → 実キー のインデックス（隠しスペース/大小/Unicode差異を吸収）
    const normalizedIndex = new Map<string, string>();
    for (const key of Object.keys(progressMap)) {
      const nk = normalizeLookupKey(key);
      if (!normalizedIndex.has(nk)) normalizedIndex.set(nk, key);
    }

    const resolveProgressKey = (
      word: string
    ): { key: string | null; wp: any | null; hit: string } => {
      const raw = normalizeWordKey(word);
      if (!raw) return { key: null, wp: null, hit: 'empty' };

      const direct = (progressMap as any)[raw];
      if (direct) return { key: raw, wp: direct, hit: 'direct' };

      const lowerKey = raw.toLowerCase();
      const lower = (progressMap as any)[lowerKey];
      if (lower) return { key: lowerKey, wp: lower, hit: 'lower' };

      const nk = normalizeLookupKey(raw);
      const actualKey = normalizedIndex.get(nk) ?? null;
      if (actualKey)
        return { key: actualKey, wp: (progressMap as any)[actualKey] ?? null, hit: 'normalized' };

      return { key: null, wp: null, hit: 'miss' };
    };

    const getWordProgress = (word: string) => resolveProgressKey(word).wp;
    const toFiniteNumber = (v: any, defaultValue: number = 0) => {
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : defaultValue;
    };
    const getAttempts = (word: string, fallback: any) => {
      const wp = getWordProgress(word);
      if (wp) {
        const a = toFiniteNumber((wp as any)?.memorizationAttempts, NaN);
        if (Number.isFinite(a)) return a;
      }
      return toFiniteNumber(fallback, 0);
    };
    const getPosition = (word: string, fallback: any) => {
      const wp = getWordProgress(word);
      if (wp) {
        const pos = toFiniteNumber(determineWordPosition(wp, mode), NaN);
        if (Number.isFinite(pos)) return pos;
      }
      return toFiniteNumber(fallback, 0);
    };

    const stillLearningInTop100 = top100.filter((item: any) => {
      const word = String(item.word ?? '');
      const pos = getPosition(word, item.position);
      const attempts = getAttempts(word, item.attempts);
      return pos >= 40 && pos < 70 && attempts > 0;
    });
    const stillLearningInTop600 = top600.filter((item: any) => {
      const word = String(item.word ?? '');
      const pos = getPosition(word, item.position);
      const attempts = getAttempts(word, item.attempts);
      return pos >= 40 && pos < 70 && attempts > 0;
    });
    const position50Count = top600.filter((item: any) => {
      const word = String(item.word ?? '');
      const pos = getPosition(word, item.position);
      const attempts = getAttempts(word, item.attempts);
      return pos === 50 && attempts === 0;
    }).length;

    let result = '';

    if (snapshotTimestamp) {
      result += `🕒 **snapshot timestamp**: ${snapshotTimestamp}\n\n`;
    }

    result += `🧭 **snapshot selectedFrom**: ${selectedFrom}\n\n`;

    // スナップショットメタ情報（モード不一致/古いデータ判定用）
    result += '**📦 snapshot meta**\n';
    result += `- mode: ${snapshotMode ?? '-'}\n`;
    result += `- questionsCount: ${snapshotQuestionsCount ?? '-'}\n`;
    result += `- interleavedCount: ${snapshotInterleavedCount ?? '-'}\n`;
    result += `- top100Count: ${top100.length}\n`;
    result += `- top600Count: ${top600.length}\n`;
    result += `- stillLearningInTop100 (snapshot): ${snapshotStillLearningTop100 ?? '-'}\n`;
    result += `- stillLearningInTop600 (snapshot): ${snapshotStillLearningTop600 ?? '-'}\n\n`;

    // モード不一致は、ランキング分析（暗記SSOT）とスナップショットが別物なので最重要の警告
    if (snapshotMode && snapshotMode !== desiredMode) {
      result +=
        `⚠️ **モード不一致**: このスナップショットは \`${snapshotMode}\` です。` +
        `暗記タブの分析には \`${desiredMode}\` のスナップショットが必要です。\n` +
        `→ translation/spelling等の「30問テスト実行」が上書きしても壊れないよう、mode別キーを読み取るように修正済みです。\n\n`;
    }

    // TOP100のキー命中率（progressCacheとの照合）
    const hitStats = { direct: 0, lower: 0, normalized: 0, miss: 0, empty: 0 } as Record<
      string,
      number
    >;
    for (const item of top100) {
      const word = String((item as any)?.word ?? '');
      const r = resolveProgressKey(word);
      hitStats[r.hit] = (hitStats[r.hit] || 0) + 1;
    }
    result += '**🔑 progressCache照合（TOP100）**\n';
    result += `- direct: ${hitStats.direct}\n`;
    result += `- lower: ${hitStats.lower}\n`;
    result += `- normalized: ${hitStats.normalized}\n`;
    result += `- miss: ${hitStats.miss}\n\n`;

    // 苦手語（暗記）とTOP100の交差（スナップショットが別モード/別データならここが崩れる）
    const struggling = getStrugglingWordsList(mode);
    const strugglingSet = new Set(struggling.map((w) => normalizeLookupKey(w.word)));
    const top100Set = new Set(top100.map((i: any) => normalizeLookupKey(String(i?.word ?? ''))));
    const intersection: string[] = [];
    for (const k of strugglingSet) {
      if (top100Set.has(k)) intersection.push(k);
    }
    result += '**🟡 苦手語×TOP100（暗記SSOT）**\n';
    result += `- strugglingWords: ${struggling.length}\n`;
    result += `- inTop100: ${intersection.length}\n\n`;

    if (top100.length === 0) {
      result += '⚠️ TOP100配列が空です（古い/壊れたスナップショットの可能性）\n\n';
    }

    // Position 50の新規が何語あるか
    if (position50Count > 0) {
      result += `📊 **Position 50の新規**: ${position50Count}語（これがまだまだ語より優先されている可能性）\n\n`;
    } else {
      result += '📊 **Position 50の新規**: 0語（該当なし）\n\n';
    }

    // TOP100内のまだまだ語
    if (stillLearningInTop100.length === 0) {
      result += '❌ **まだまだ語（Position 40-70, attempts>0）がTOP100に1つも入っていません！**\n';

      // 失敗時の自己診断（コピペしやすい最小限）
      if (top100.length > 0) {
        const sample = top100.slice(0, 10).map((item: any) => {
          const word = String(item.word ?? '');
          const resolved = resolveProgressKey(word);
          const cacheHit = Boolean(resolved.wp);
          const usedAttempts = getAttempts(word, item.attempts);
          const usedPos = getPosition(word, item.position);
          const snapshotAttempts = toFiniteNumber(item.attempts, 0);
          const snapshotPos = toFiniteNumber(item.position, 0);
          return {
            word,
            matchedKey: resolved.key,
            hitType: resolved.hit,
            cacheHit,
            usedPos,
            usedAttempts,
            snapshotPos,
            snapshotAttempts,
          };
        });

        result +=
          '\n**🧪 判定デバッグ（TOP10サンプル）**\n' +
          sample
            .map((s: any, idx: number) => {
              const hit = s.cacheHit ? s.hitType : 'miss';
              const keyInfo = s.matchedKey ? ` key:${s.matchedKey}` : '';
              return (
                `${idx + 1}. ${s.word} | cache:${hit}${keyInfo} | pos used:${s.usedPos} (snap:${s.snapshotPos}) | ` +
                `attempts used:${s.usedAttempts} (snap:${s.snapshotAttempts})`
              );
            })
            .join('\n') +
          '\n';
      }
    } else {
      result +=
        '✅ まだまだ語が**' +
        stillLearningInTop100.length +
        '語**、TOP100内にあります:\n' +
        stillLearningInTop100
          .slice(0, 10)
          .map((item: any) => {
            const word = String(item.word ?? '');
            const attempts = getAttempts(word, item.attempts);
            const pos = getPosition(word, item.position);
            return `${item.rank ?? ''}位: ${word} (Position ${pos}, ${attempts}回)`;
          })
          .join('\n') +
        (stillLearningInTop100.length > 10
          ? '\n_…他' + (stillLearningInTop100.length - 10) + '語_'
          : '') +
        '\n\n';
    }

    // TOP600内のまだまだ語
    if (top600.length === 0) {
      result += '⚠️ TOP600配列が保存されていません（最新のスケジューラ出力待ち）';
    } else if (stillLearningInTop600.length > 0) {
      result += '📍 **TOP600内のまだまだ語**: ' + stillLearningInTop600.length + '語\n';
      result += stillLearningInTop600
        .slice(0, 5)
        .map((item: any) => {
          const word = String(item.word ?? '');
          const attempts = getAttempts(word, item.attempts);
          const pos = getPosition(word, item.position);
          return `${item.rank ?? ''}位: ${word} (Position ${pos}, ${attempts}回)`;
        })
        .join('\n');
      if (stillLearningInTop600.length > 5) {
        result += '\n_…他' + (stillLearningInTop600.length - 5) + '語_';
      }
    } else {
      result += '❌ **TOP600内にもまだまだ語が見つかりません**';
    }

    if (position50Count > 0 && stillLearningInTop100.length === 0) {
      result +=
        '\n\n**🚨 結論**: Position 50の新規' +
        position50Count +
        '語が先行し、まだまだ語が押し出されている可能性があります\n';
      result +=
        '→ Position降順ソートで新規が優先され、まだまだが' +
        (position50Count + 1) +
        '位以降に追いやられている可能性';
    }

    return result;
  } catch {
    return '⚠️ データ解析エラー';
  }
})()}

---

### 🎯 現在のキュー内Position分布（リアルタイム）

${(() => {
  if (!questions || questions.length === 0) {
    return '⚠️ キューが空です。';
  }

  // currentIndexから先の未出題問題を分析
  const remaining = questions.slice(currentIndex);

  if (remaining.length === 0) {
    return '✅ すべての問題が出題済みです。';
  }

  // 🔧 Position再計算: questions配列のpositionは古い可能性があるため、LocalStorageから取得
  const progress = loadProgressSync();
  const getAttemptsForMode = (wp: any | undefined | null) => {
    if (!wp) return 0;
    switch (mode) {
      case 'memorization':
        return wp.memorizationAttempts ?? 0;
      case 'translation':
        return wp.translationAttempts ?? 0;
      case 'spelling':
        return wp.spellingAttempts ?? 0;
      case 'grammar':
        return wp.grammarAttempts ?? 0;
      default:
        return wp.totalAttempts ?? 0;
    }
  };
  const remainingWithRealPosition = remaining.map((q: any) => {
    const wordKey = String(q.word ?? '');
    const wp = progress.wordProgress[wordKey];
    const originalPosition = Number.isFinite(q.position) ? q.position : null;
    if (wp) {
      const realPosition = determineWordPosition(wp, mode);
      return {
        ...q,
        position: realPosition,
        _originalPosition: originalPosition,
        _wpMissing: false,
        _attempts: getAttemptsForMode(wp),
      };
    }
    // WordProgress未作成の単語は、新規のSSOT初期値(35)として扱う（Position 0の誤表示を防ぐ）
    return {
      ...q,
      position: 35,
      _originalPosition: originalPosition,
      _wpMissing: true,
      _attempts: 0,
    };
  });

  // 🚨 Position不整合検出
  const positionMismatches = remainingWithRealPosition
    .filter((q: any) => {
      // positionが元々付与されていない場合は不整合判定しない（0扱いの誤検出を防ぐ）
      if (!Number.isFinite(q._originalPosition)) return false;
      const orig = q._originalPosition as number;
      const real = q.position ?? 0;
      return Math.abs(orig - real) > 5; // 5以上の差があれば不整合
    })
    .slice(0, 20); // 最大20件

  let result = '**📊 未出題キュー分析（残り' + remaining.length + '問）**:\n\n';

  // Position不整合の警告
  if (positionMismatches.length > 0) {
    result += '🚨 **Position不整合検出**: ' + positionMismatches.length + '語\n';
    result += '→ questions配列のPositionがLocalStorageと一致しません！\n\n';
    result += '**不整合リスト（差分≥5）**:\n';
    result += positionMismatches
      .map((q: any) => {
        const orig = q._originalPosition ?? 0;
        const real = q.position ?? 0;
        const diff = real - orig;
        const icon = real >= 70 ? '🔴' : real >= 40 ? '🟡' : '⚪';
        const arrow = diff > 0 ? '🔺' : diff < 0 ? '🔻' : '→';
        return (
          '  ' +
          icon +
          ' **' +
          q.word +
          '**: ' +
          orig +
          ' ' +
          arrow +
          ' ' +
          real +
          ' (差分: ' +
          (diff > 0 ? '+' : '') +
          diff +
          ')'
        );
      })
      .join('\n');
    result += '\n\n**原因候補**:\n';
    result += '- questions配列が古いスナップショットから作成された\n';
    result += '- 解答後にPositionが更新されたが、キューに反映されていない\n';
    result += '- QuestionSchedulerの呼び出しタイミングが不適切\n\n';
  }

  const positionGroups = {
    incorrect: remainingWithRealPosition.filter((q: any) => (q.position ?? 0) >= 70),
    stillLearning: remainingWithRealPosition.filter((q: any) => {
      const pos = q.position ?? 0;
      const attempts = q._attempts ?? 0;
      return pos >= 40 && pos < 70 && attempts > 0;
    }),
    newBoosted: remainingWithRealPosition.filter((q: any) => {
      const pos = q.position ?? 0;
      const attempts = q._attempts ?? 0;
      return pos >= 40 && pos < 60 && attempts === 0;
    }),
    newNormal: remainingWithRealPosition.filter((q: any) => {
      const pos = q.position ?? 0;
      return pos >= 20 && pos < 40;
    }),
    mastered: remainingWithRealPosition.filter((q: any) => (q.position ?? 0) < 20),
  };

  result += '**Position別内訳**:\n';
  result += '- 🔴 分からない（70-100）: ' + positionGroups.incorrect.length + '語\n';
  result += '- 🟡 まだまだ（40-69, attempts>0）: ' + positionGroups.stillLearning.length + '語\n';
  result += '- 🔵 新規引上（40-59, attempts=0）: ' + positionGroups.newBoosted.length + '語\n';
  result += '- ⚪ 新規通常（20-39）: ' + positionGroups.newNormal.length + '語\n';
  result += '- ✅ 定着済（0-19）: ' + positionGroups.mastered.length + '語\n\n';

  // 次の30問の詳細（再計算されたPositionを使用）
  const next30 = remainingWithRealPosition.slice(0, 30);
  const next30High = next30.filter((q: any) => (q.position ?? 0) >= 40);

  result += '**次の30問の構成**:\n';
  result += '- 高Position語（≥40）: ' + next30High.length + '語 / ' + next30.length + '問\n';
  result += '- 割合: ' + ((next30High.length / next30.length) * 100).toFixed(1) + '%\n\n';

  if (next30High.length > 0) {
    result += '**次の30問内の高Position語**（LocalStorage再計算済み）:\n';
    result += next30High
      .slice(0, 10)
      .map((q: any, _idx: number) => {
        const pos = q.position ?? 0;
        const origPos = q._originalPosition;
        const icon = pos >= 70 ? '🔴' : '🟡';
        const label = pos >= 70 ? '分からない' : 'まだまだ';
        const requeued = (q as any).reAddedCount > 0 ? ' 🔄×' + (q as any).reAddedCount : '';
        const posChange = origPos !== undefined && origPos !== pos ? ' (元:' + origPos + ')' : '';
        return (
          '  ' + icon + ' ' + q.word + ' (Pos ' + pos + posChange + ', ' + label + ')' + requeued
        );
      })
      .join('\n');
    if (next30High.length > 10) {
      result += '\n  _...他' + (next30High.length - 10) + '語_';
    }
  } else {
    result += '⚠️ 次の30問に高Position語が含まれていません（LocalStorage再計算後）。';
  }

  // 警告判定
  const totalHigh = positionGroups.incorrect.length + positionGroups.stillLearning.length;
  if (totalHigh > 10 && next30High.length < 5) {
    result +=
      '\n\n❌ **警告**: 高Position語が' +
      totalHigh +
      '語存在しますが、次の30問には' +
      next30High.length +
      '語しか含まれていません！';
    result +=
      '\n→ Position降順ソートが機能していない、またはフォーク並びが不十分な可能性があります。';
  } else if (totalHigh > 0 && next30High.length >= Math.min(totalHigh, 15)) {
    result += '\n\n✅ **良好**: 高Position語が適切に前方に配置されています。';
  }

  return result;
})()}

---

## 🔄 スケジューリング状態診断

${(() => {
  const _progress = loadProgressSync();
  const functionCalls = JSON.parse(localStorage.getItem('debug_function_calls') || '[]');
  const answerLogs = JSON.parse(localStorage.getItem('debug_answer_logs') || '[]');
  const rescheduleEvents = JSON.parse(localStorage.getItem('debug_reschedule_events') || '[]');

  const normalizeCall = (f: any) => {
    const name = f?.function ?? f?.name ?? f?.functionName ?? 'unknown';
    const params = f?.params ?? f?.args ?? f?.parameters ?? null;
    const ts = f?.timestamp ?? null;
    return { name, params, ts };
  };

  const calls = Array.isArray(functionCalls) ? functionCalls.map(normalizeCall) : [];
  const events = Array.isArray(rescheduleEvents) ? rescheduleEvents : [];

  // 最後のsortAndBalance呼び出しを探す（初期スケジュール/途中再スケジュール両方）
  const lastSchedule = calls.filter((c: any) => c.name === 'sortAndBalance').slice(-1)[0];

  // 再スケジュールイベント（MemorizationViewが記録）
  const lastTriggered = events
    .filter((e: any) => e?.mode === mode && e?.phase === 'triggered')
    .slice(-1)[0];
  const lastApplied = events
    .filter((e: any) => e?.mode === mode && e?.phase === 'applied')
    .slice(-1)[0];

  // 最後の解答を探す
  const lastAnswer = answerLogs.slice(-1)[0];

  let result = '**📋 現在のキュー生成情報**:\n';

  // 再スケジュールの可視化（通知を消した代わり）
  result += '\n**🔄 再スケジュール（debug_reschedule_events）**:\n';
  if (lastApplied) {
    const t = new Date(lastApplied.timestamp).toLocaleTimeString('ja-JP');
    result += `- 最後の適用: ${t} (${lastApplied.reason || '理由なし'})\n`;
    if (lastApplied.details) {
      const before = (lastApplied.details as any).remainingBefore;
      const after = (lastApplied.details as any).remainingAfter;
      if (before != null || after != null) {
        result += `- 残りキュー: ${before ?? '不明'} → ${after ?? '不明'}\n`;
      }
    }
  } else {
    result += '- まだ適用ログがありません\n';
  }
  if (lastTriggered) {
    const t = new Date(lastTriggered.timestamp).toLocaleTimeString('ja-JP');
    result += `- 最後のトリガー: ${t} (${lastTriggered.reason || '理由なし'})\n`;
  }
  result += '\n';

  if (lastSchedule) {
    const scheduleTime = new Date(lastSchedule.ts).toLocaleTimeString('ja-JP');
    result += '- 最後のスケジューリング: ' + scheduleTime + '\n';
    result += '- 問題数: ' + ((lastSchedule.params as any)?.questionsCount || '不明') + '問\n';
  } else {
    result += '⚠️ スケジューリング履歴が見つかりません\n';
  }

  if (lastAnswer) {
    const answerTime = new Date(lastAnswer.timestamp).toLocaleTimeString('ja-JP');
    result += '- 最後の解答: ' + answerTime + ' (' + lastAnswer.word + ')\n';
    result +=
      '- Position変化: ' + lastAnswer.positionBefore + ' → ' + lastAnswer.positionAfter + '\n';
  }

  result += '\n';

  // スケジューリング後に解答があったかチェック
  if (lastSchedule && lastAnswer) {
    const scheduleTs = new Date(lastSchedule.ts).getTime();
    const answerTs = new Date(lastAnswer.timestamp).getTime();

    if (answerTs > scheduleTs) {
      const answersSinceSchedule = answerLogs.filter(
        (a: any) => new Date(a.timestamp).getTime() > scheduleTs
      ).length;

      result += '🚨 **警告**: スケジューリング後に' + answersSinceSchedule + '回解答されました\n';
      result += '→ questions配列のPositionが古くなっている可能性が高いです！\n\n';

      // Position変化のあった単語をリスト
      const positionChanges = answerLogs
        .filter(
          (a: any) =>
            new Date(a.timestamp).getTime() > scheduleTs &&
            Math.abs(a.positionAfter - a.positionBefore) >= 10
        )
        .slice(-10);

      if (positionChanges.length > 0) {
        result += '**スケジューリング後のPosition大幅変化（±10以上）**:\n';
        result += positionChanges
          .map((a: any) => {
            const diff = a.positionAfter - a.positionBefore;
            const arrow = diff > 0 ? '🔺' : '🔻';
            return (
              '  ' +
              arrow +
              ' ' +
              a.word +
              ': ' +
              a.positionBefore +
              ' → ' +
              a.positionAfter +
              ' (' +
              (diff > 0 ? '+' : '') +
              diff +
              ')'
            );
          })
          .join('\n');
        result += '\n\n';
      }

      result += '**推奨対応**:\n';
      result += '- 再スケジューリングを実行（データソース選択をやり直す）\n';
      result += '- または、useQuestionRequeuのPosition-aware機能が自動調整します\n';
    } else {
      result += '✅ スケジューリングは最新です（解答後に再スケジューリング済み）\n';
    }
  }

  return result;
})()}

---

## 🧠 finalPriorityモード（variant C）スナップショット

${(() => {
  const stored = localStorage.getItem('debug_finalPriority_output');
  const statsStored = localStorage.getItem('debug_finalPriority_sessionStats');
  if (!stored && !statsStored)
    return '⚠️ finalPriorityスナップショットがありません（finalPriorityModeが未使用 or まだ実行されていない）';

  let header = '';
  if (statsStored) {
    try {
      const s = JSON.parse(statsStored);
      header += `**currentTab**: ${s.currentTab}\n`;
      header += `**allProgressCount**: ${s.allProgressCount}\n`;
      header += `**totalQuestions**: ${s.totalQuestions}\n`;
      header += `**timestamp**: ${s.timestamp}\n\n`;
      header += `**aiSessionStats**: ${JSON.stringify(s.aiSessionStats)}\n\n`;
    } catch {
      header += '⚠️ sessionStats解析に失敗\n\n';
    }
  }

  if (!stored) return header + '⚠️ debug_finalPriority_output がありません';
  try {
    const rows = JSON.parse(stored);
    if (!Array.isArray(rows) || rows.length === 0) return header + '⚠️ finalPriority TOPが空です';

    const table =
      '| # | 単語 | finalPriority | position | attempts | category |\n' +
      '|---|------|--------------|----------|----------|----------|\n' +
      rows
        .slice(0, 30)
        .map((r: any) => {
          const fp = Number(r.finalPriority ?? 0);
          const pos = Number(r.position ?? 0);
          const at = Number(r.attempts ?? 0);
          const cat = r.category ?? '';
          return `| ${r.rank ?? ''} | **${r.word}** | ${fp.toFixed(3)} | ${pos.toFixed(0)} | ${at} | ${cat} |`;
        })
        .join('\n');

    return header + table;
  } catch {
    return header + '⚠️ finalPriority解析に失敗';
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
          const actual = (() => {
            if (!actualProgress) return { attempts: 0, correct: 0, stillLearning: 0, incorrect: 0 };
            const attempts = (() => {
              switch (log.mode) {
                case 'memorization':
                  return actualProgress.memorizationAttempts ?? 0;
                case 'translation':
                  return actualProgress.translationAttempts ?? 0;
                case 'spelling':
                  return actualProgress.spellingAttempts ?? 0;
                case 'grammar':
                  return actualProgress.grammarAttempts ?? 0;
                default:
                  return actualProgress.totalAttempts ?? 0;
              }
            })();
            const correct = (() => {
              switch (log.mode) {
                case 'memorization':
                  return actualProgress.memorizationCorrect ?? 0;
                case 'translation':
                  return actualProgress.translationCorrect ?? 0;
                case 'spelling':
                  return actualProgress.spellingCorrect ?? 0;
                case 'grammar':
                  return actualProgress.grammarCorrect ?? 0;
                default:
                  return actualProgress.correctCount ?? 0;
              }
            })();
            const stillLearning =
              log.mode === 'memorization' ? (actualProgress.memorizationStillLearning ?? 0) : 0;
            const incorrect = attempts - correct - stillLearning;
            return { attempts, correct, stillLearning, incorrect };
          })();

          const loggedMode = (() => {
            const attempts = Number(log.progress?.modeAttempts ?? 0);
            const correct = Number(log.progress?.modeCorrect ?? 0);
            const stillLearning = Number(log.progress?.modeStillLearning ?? 0);
            const incorrect = attempts - correct - stillLearning;
            return { attempts, correct, stillLearning, incorrect };
          })();

          // 実際の値を常に表示（不一致があれば⚠️マーク）
          const mismatch =
            actual.correct !== loggedMode.correct ||
            actual.stillLearning !== loggedMode.stillLearning ||
            actual.incorrect !== loggedMode.incorrect;
          const actualInfo =
            ' | **実際のLS**: 正解' +
            actual.correct +
            '/まだまだ' +
            actual.stillLearning +
            '/誤答' +
            actual.incorrect +
            ' (計' +
            actual.attempts +
            '回)' +
            (mismatch ? ' ⚠️**不一致**' : '');

          const saved = (log as any).savedPositionDebug;
          const savedPos = saved?.savedPosition;
          const savedDecision = saved?.decision;
          const savedReason = saved?.reason;
          const posWithSaved = (log as any).positionWithSavedPosition;
          const debugCalcInfo =
            savedPos !== undefined || posWithSaved !== undefined
              ? ' | **savedPosition**: ' +
                (savedPos ?? '-') +
                ' | **calc(saved有り)**: ' +
                (posWithSaved ?? '-') +
                ' | **calc(saved無視/解答直後)**: ' +
                (log.positionAfter ?? '-') +
                (savedDecision
                  ? ' | **saved判定**: ' +
                    savedDecision +
                    (savedReason ? ' (' + savedReason + ')' : '')
                  : '')
              : '';

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
            ') [ログ(mode): 正解' +
            loggedMode.correct +
            '/まだまだ' +
            loggedMode.stillLearning +
            '/誤答' +
            loggedMode.incorrect +
            ']' +
            actualInfo +
            debugCalcInfo
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

## 📋 postProcess()後のTOP30（スナップショット）

**⚠️ 重要**: **debug_postProcess_output** は **postProcess()後のTOP30のみ**を保存しています。
現在位置（currentIndex）に追従する「次の30問」ではありません。

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
          const position = wordProgress ? determineWordPosition(wordProgress, mode) : 35;
          const attempts = (() => {
            if (!wordProgress) return 0;
            switch (mode) {
              case 'memorization':
                return wordProgress.memorizationAttempts ?? 0;
              case 'translation':
                return wordProgress.translationAttempts ?? 0;
              case 'spelling':
                return wordProgress.spellingAttempts ?? 0;
              case 'grammar':
                return wordProgress.grammarAttempts ?? 0;
              default:
                return wordProgress.totalAttempts ?? 0;
            }
          })();
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

---

## 📋 現在のキュー：次の出題予定 (30問）

**⚠️ 重要**: これは「いま保持しているキュー（questions）」の「currentIndex+1..+30」を表示します。
Positionは LocalStorage から再計算した値です（determineWordPosition()）。

${(() => {
  if (!questions || questions.length === 0) return '⚠️ キューが空です。';

  const progress = loadProgressSync();
  const nextWindow = questions.slice(currentIndex + 1, currentIndex + 31);
  if (nextWindow.length === 0) return '✅ すべての問題が出題済みです。';

  return (
    '| # | 問題位置 | 単語 | Position | 出題回数 | 難易度 | 状態 |\n' +
    '|---|----------|------|----------|----------|--------|------|\n' +
    nextWindow
      .map((q: any, idx: number) => {
        const word = String(q?.word ?? '');
        const wp = progress.wordProgress?.[word];
        const position = wp ? determineWordPosition(wp, mode) : 35;
        const attempts = (() => {
          if (!wp) return 0;
          switch (mode) {
            case 'memorization':
              return wp.memorizationAttempts ?? 0;
            case 'translation':
              return wp.translationAttempts ?? 0;
            case 'spelling':
              return wp.spellingAttempts ?? 0;
            case 'grammar':
              return wp.grammarAttempts ?? 0;
            default:
              return wp.totalAttempts ?? 0;
          }
        })();
        const difficulty = q?.difficulty ?? '不明';
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
      .join('\n')
  );
})()}

**🔍 分析**:
- まだまだ(Position 45)が上位に来ているか？ → ✅ 正常
- Position 50の引き上げ単語が混入しているか？ → ✅ 正常
- Position 0の新規が上位独占していないか？ → ❌ 問題あり

---

## 📋 残りキュー（LocalStorage Position降順 TOP30）

この表示は、残り問題を LocalStorage の生Positionで **降順ソートしたTOP30** です（参考）。

| # | 問題位置 | 単語 | Position | 出題回数 | 難易度 | 状態 |
|---|----------|------|----------|----------|--------|------|
${(() => {
  const allProgress = loadProgressSync();
  // 現在位置より後ろの問題を取得し、Position降順でソート
  const remainingQuestions = questions
    .slice(currentIndex + 1)
    .map((question) => {
      const word = question?.word;
      const wordProgress = allProgress.wordProgress?.[word];
      const position = wordProgress ? determineWordPosition(wordProgress, mode) : 35;
      const attempts = (() => {
        if (!wordProgress) return 0;
        switch (mode) {
          case 'memorization':
            return wordProgress.memorizationAttempts ?? 0;
          case 'translation':
            return wordProgress.translationAttempts ?? 0;
          case 'spelling':
            return wordProgress.spellingAttempts ?? 0;
          case 'grammar':
            return wordProgress.grammarAttempts ?? 0;
          default:
            return wordProgress.totalAttempts ?? 0;
        }
      })();
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
      return { word, position, attempts, difficulty, status, originalQuestion: question };
    })
    .sort((a, b) => b.position - a.position) // Position降順
    .slice(0, 30); // 上位30問

  return remainingQuestions
    .map((item, idx) => {
      return `| ${idx + 1} | - | **${item.word}** | ${item.position.toFixed(0)} | ${item.attempts}回 | ${item.difficulty} | ${item.status} |`;
    })
    .join('\n');
})()}

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
- **次30問中の状態別**（キュー順／PositionはLocalStorageから再計算）:
  - 🔴 分からない: ${(() => {
    const progress = loadProgressSync();
    const nextWindow = questions.slice(currentIndex + 1, currentIndex + 31);
    return nextWindow.filter((q: any) => {
      const word = String(q?.word ?? '');
      const wp = progress.wordProgress?.[word];
      const pos = wp ? determineWordPosition(wp, mode) : 35;
      return pos >= 70;
    }).length;
  })()}問
  - 🟡 まだまだ: ${(() => {
    const progress = loadProgressSync();
    const nextWindow = questions.slice(currentIndex + 1, currentIndex + 31);
    return nextWindow.filter((q: any) => {
      const word = String(q?.word ?? '');
      const wp = progress.wordProgress?.[word];
      const pos = wp ? determineWordPosition(wp, mode) : 35;
      return pos >= 40 && pos < 70;
    }).length;
  })()}問
  - ⚪ 新規: ${(() => {
    const progress = loadProgressSync();
    const nextWindow = questions.slice(currentIndex + 1, currentIndex + 31);
    return nextWindow.filter((q: any) => {
      const word = String(q?.word ?? '');
      const wp = progress.wordProgress?.[word];
      const attempts = (() => {
        if (!wp) return 0;
        switch (mode) {
          case 'memorization':
            return wp.memorizationAttempts ?? 0;
          case 'translation':
            return wp.translationAttempts ?? 0;
          case 'spelling':
            return wp.spellingAttempts ?? 0;
          case 'grammar':
            return wp.grammarAttempts ?? 0;
          default:
            return wp.totalAttempts ?? 0;
        }
      })();
      const pos = wp ? determineWordPosition(wp, mode) : 35;
      return attempts === 0 || (pos >= 20 && pos < 40);
    }).length;
  })()}問
  - ✅ 定着済: ${(() => {
    const progress = loadProgressSync();
    const nextWindow = questions.slice(currentIndex + 1, currentIndex + 31);
    return nextWindow.filter((q: any) => {
      const word = String(q?.word ?? '');
      const wp = progress.wordProgress?.[word];
      const attempts = (() => {
        if (!wp) return 0;
        switch (mode) {
          case 'memorization':
            return wp.memorizationAttempts ?? 0;
          case 'translation':
            return wp.translationAttempts ?? 0;
          case 'spelling':
            return wp.spellingAttempts ?? 0;
          case 'grammar':
            return wp.grammarAttempts ?? 0;
          default:
            return wp.totalAttempts ?? 0;
        }
      })();
      const pos = wp ? determineWordPosition(wp, mode) : 35;
      return attempts > 0 && pos < 20;
    }).length;
  })()}問

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

## 🎯 実データ検証（まだまだ・分からない吸引確認）

${(() => {
  // 実際の出題キュー（postProcess output）を分析して、まだまだ・分からない語が確実に上位に来ているか検証
  const postProcessData = readPostProcessTop30();
  if (!postProcessData || postProcessData.length === 0) {
    return '⚠️ postProcess出力が取得できません。スケジューリング後に再度確認してください。';
  }

  const struggling = getStrugglingWordsList(mode);
  const strugglingWords = new Set(struggling.map((w) => normalizeLookupKey(w.word)));

  const top30Analysis = postProcessData.slice(0, 30).map((item: any, idx: number) => {
    const word = String(item?.word ?? '');
    const normalizedWord = normalizeLookupKey(word);
    const isStruggling = strugglingWords.has(normalizedWord);
    const position = Number(item?.position ?? 0);
    const attempts = Number(item?.attempts ?? 0);
    return {
      rank: idx + 1,
      word,
      position,
      attempts,
      isStruggling,
    };
  });

  const strugglingInTop30 = top30Analysis.filter((item) => item.isStruggling).length;
  const strugglingInTop10 = top30Analysis.slice(0, 10).filter((item) => item.isStruggling).length;

  const expectedInTop30 = Math.min(struggling.length, 30);
  const coveragePercent =
    struggling.length > 0 ? ((strugglingInTop30 / struggling.length) * 100).toFixed(1) : '0.0';

  let result = '**📊 実データ分析結果（postProcess出力）**:\n';
  result += '- 全まだまだ・分からない: ' + struggling.length + '語\n';
  result += '- TOP30内に存在: ' + strugglingInTop30 + '語 / ' + expectedInTop30 + '語（期待値）\n';
  result += '- TOP10内に存在: ' + strugglingInTop10 + '語\n';
  result += '- カバー率: ' + coveragePercent + '%\n\n';

  if (struggling.length === 0) {
    result += '✅ **まだまだ・分からない語はありません** → 学習が進んでいます！\n';
  } else if (strugglingInTop30 >= Math.min(struggling.length, 20)) {
    result +=
      '✅ **吸引成功**: TOP30に' +
      strugglingInTop30 +
      '語が含まれています。確実に優先出題されています！\n';
  } else if (strugglingInTop30 >= Math.ceil(struggling.length * 0.5)) {
    result +=
      '⚠️ **部分的吸引**: TOP30に' +
      strugglingInTop30 +
      '語が含まれていますが、期待値（' +
      expectedInTop30 +
      '語）より少ないです。\n';
  } else {
    result += '❌ **吸引失敗**: TOP30に' + strugglingInTop30 + '語しか含まれていません！\n';
    result +=
      '→ Position降順ソートが機能していない、またはPosition値が不正確な可能性があります。\n';
  }

  result += '\n**TOP10の内訳**:\n';
  result += top30Analysis
    .slice(0, 10)
    .map((item) => {
      const icon = item.isStruggling
        ? '🔴'
        : item.position >= 40
          ? '🔵'
          : item.position >= 20
            ? '⚪'
            : '✅';
      const label = item.isStruggling
        ? 'まだまだ/分からない'
        : item.position >= 40
          ? '新規(引上)'
          : item.position >= 20
            ? '新規'
            : '定着済';
      return (
        item.rank +
        '. ' +
        icon +
        ' **' +
        item.word +
        '** (Pos ' +
        item.position +
        ', ' +
        item.attempts +
        '回) - ' +
        label
      );
    })
    .join('\n');

  return result;
})()}

---

### 🎯 Position-aware Insertion（フォーク並び）検証

${(() => {
  const stored = localStorage.getItem('debug_position_aware_insertions');
  if (!stored) {
    return '⚠️ Position-aware挿入ログが記録されていません。\n→ まだまだ・分からない語が再出題されると記録されます。';
  }

  try {
    const logs = JSON.parse(stored);
    if (!Array.isArray(logs) || logs.length === 0) {
      return '⚠️ Position-aware挿入ログが空です。';
    }

    let result = `**📊 挿入調整の実行履歴（最新${logs.length}件）**:\n\n`;

    const recentLogs = logs.slice(-10); // 最新10件を表示
    recentLogs.forEach((log: any, _idx: number) => {
      const timeStr = new Date(log.timestamp).toLocaleTimeString('ja-JP');
      const adjusted = log.adjustedInsert !== log.originalInsert;
      const icon = adjusted ? '🎯' : '⚪';

      result += `${icon} **${log.word}** (Position ${log.position})\n`;
      result += `  - 時刻: ${timeStr}\n`;
      result += `  - 元の挿入位置: index ${log.originalInsert} (現在位置+${log.originalInsert - log.currentIndex})\n`;

      if (adjusted) {
        result += `  - 🎯 調整後: index ${log.adjustedInsert} (現在位置+${log.adjustedInsert - log.currentIndex})\n`;
        result += `  - 理由: 高Position単語群に割り込み\n`;
        if (log.nearbyHighPositions && log.nearbyHighPositions.length > 0) {
          const nearby = log.nearbyHighPositions
            .slice(0, 3)
            .map((w: any) => `${w.word}(${w.position})`)
            .join(', ');
          result += `  - 近隣の高Position語: ${nearby}${log.nearbyHighPositions.length > 3 ? '...' : ''}\n`;
        }
      } else {
        result += `  - 調整なし（近くに高Position語が見つからなかった）\n`;
      }
      result += '\n';
    });

    // 統計サマリ
    const adjustedCount = logs.filter(
      (log: any) => log.adjustedInsert !== log.originalInsert
    ).length;
    const adjustRate = ((adjustedCount / logs.length) * 100).toFixed(1);

    result += '**📈 統計サマリ**:\n';
    result += `- 総挿入回数: ${logs.length}回\n`;
    result += `- Position-aware調整: ${adjustedCount}回 (${adjustRate}%)\n`;
    result += `- 通常挿入: ${logs.length - adjustedCount}回\n\n`;

    if (adjustedCount > 0) {
      result += '✅ **フォーク並びが正常に機能しています**\n';
      result += '→ まだまだ・分からない語が既存の高Position語の近くに配置されています。\n';
    } else {
      result += '⚠️ **調整が1度も発生していません**\n';
      result +=
        '→ キュー内に高Position語が少ないか、再出題がまだ実行されていない可能性があります。\n';
    }

    return result;
  } catch (error) {
    return `⚠️ Position-aware挿入ログの解析に失敗: ${error}`;
  }
})()}

---

### 🔄 再出題差し込みログ（useQuestionRequeue）

${(() => {
  const stored = localStorage.getItem('debug_requeue_events');
  if (!stored) {
    return '⚠️ debug_requeue_events がありません（まだ再出題差し込みが発生していない可能性）';
  }

  try {
    const logs = JSON.parse(stored);
    if (!Array.isArray(logs) || logs.length === 0) {
      return '⚠️ debug_requeue_events が空です';
    }

    const byMode = logs.filter((l: any) => String(l?.mode ?? '') === mode);
    const recent = (byMode.length > 0 ? byMode : logs).slice(-30);

    const inserted = recent.filter((l: any) => l?.decision === 'inserted').length;
    const skipped = recent.filter((l: any) =>
      String(l?.decision ?? '').startsWith('skipped')
    ).length;

    let result = `**📊 サマリ**: inserted=${inserted}, skipped=${skipped}（表示: ${
      byMode.length > 0 ? mode : '全モード'
    } / 最新${recent.length}件）\n\n`;

    result += recent
      .map((l: any, idx: number) => {
        const time = l?.timestamp ? new Date(l.timestamp).toLocaleTimeString('ja-JP') : '-';
        const word = String(l?.word ?? l?.qid ?? '(unknown)');
        const decision = String(l?.decision ?? 'unknown');
        const reason = String(l?.reason ?? '');
        const plannedOffset = Number.isFinite(Number(l?.plannedOffset))
          ? Number(l.plannedOffset)
          : null;
        const insertAt = Number.isFinite(Number(l?.insertAt)) ? Number(l.insertAt) : null;
        const currentIndex = Number.isFinite(Number(l?.currentIndex))
          ? Number(l.currentIndex)
          : null;

        const qPos = l?.questionPosition ?? null;
        const ssotPos = l?.ssotPosition ?? null;
        const effPos = l?.effectivePosition ?? null;
        const posInfo = `pos(q)=${qPos ?? '-'}, pos(ssot)=${ssotPos ?? '-'}, pos(used)=${effPos ?? '-'}`;

        const where =
          decision === 'inserted' && insertAt != null && currentIndex != null
            ? `insert@index ${insertAt} (現在位置+${insertAt - currentIndex})`
            : decision.startsWith('skipped')
              ? `skip (windowEnd=${l?.windowEnd ?? '-'})`
              : '';

        const offsetInfo = plannedOffset != null ? `offset=${plannedOffset}` : '';

        return `${idx + 1}. ${time} [${decision}] **${word}** (${reason}) ${offsetInfo} ${where} | ${posInfo}`;
      })
      .join('\n');

    return result;
  } catch (e) {
    return `⚠️ debug_requeue_events の解析に失敗: ${String(e)}`;
  }
})()}

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

    // Position分散診断情報を読み込み（暗記タブなので memorization を優先）
    {
      const desiredMode = 'memorization';
      const expectedQuestionsCount = totalQuestions;

      const safeParse = (raw: string | null) => {
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };
      const asNum = (v: any) => {
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const asTime = (v: any) => {
        const t = Date.parse(String(v ?? ''));
        return Number.isFinite(t) ? t : 0;
      };
      const pickBestSnapshot = (candidates: any[]) => {
        const arr = candidates.filter(Boolean);
        if (arr.length === 0) return null;
        const exact = arr.filter((s) => asNum(s?.questionsCount) === expectedQuestionsCount);
        if (exact.length > 0) {
          exact.sort((a, b) => asTime(b?.timestamp) - asTime(a?.timestamp));
          return exact[0];
        }
        const sorted = [...arr].sort((a, b) => {
          const qa = asNum(a?.questionsCount) ?? -1;
          const qb = asNum(b?.questionsCount) ?? -1;
          if (qb !== qa) return qb - qa;
          return asTime(b?.timestamp) - asTime(a?.timestamp);
        });
        return sorted[0];
      };

      const historyKey = `debug_position_interleaving_history_${desiredMode}`;
      const history = safeParse(localStorage.getItem(historyKey));
      const historyArr = Array.isArray(history) ? history : [];
      const bestFromHistory = pickBestSnapshot(historyArr);

      const byModeKey = `debug_position_interleaving_${desiredMode}`;
      const bestFromByMode = safeParse(localStorage.getItem(byModeKey));

      const legacy = safeParse(localStorage.getItem('debug_position_interleaving'));
      const selected = bestFromHistory ?? bestFromByMode ?? legacy;
      if (selected) setInterleavingDiag(selected);
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
    return null;
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
        {/* 🧪 A/Bテスト情報（JSON形式でコピペしやすく） */}
        {(() => {
          try {
            const abInfo = localStorage.getItem('debug_ab_session_info');
            if (!abInfo) return null;

            const parsed = JSON.parse(abInfo);
            const jsonStr = JSON.stringify(parsed, null, 2);

            return (
              <div className="bg-orange-50 p-3 rounded border-2 border-orange-300">
                <p className="font-semibold text-orange-800">🧪 A/Bテスト情報（コピペ用）</p>
                <p className="text-xs text-gray-600 mt-1">クリックでJSONをコピー</p>
                <pre
                  className="mt-2 bg-white p-2 rounded text-xs cursor-pointer whitespace-pre-wrap break-words"
                  onClick={() => {
                    navigator.clipboard.writeText(jsonStr);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 1500);
                  }}
                  title="クリックしてコピー"
                >
                  {jsonStr}
                </pre>
              </div>
            );
          } catch {
            return null;
          }
        })()}

        {/* データフロー追跡 */}
        {(() => {
          const flowSummary = DebugTracer.generateSummary();
          if (flowSummary === 'トレースデータなし' || flowSummary === 'スパンデータなし') {
            return (
              <div className="bg-gray-50 p-3 rounded border-2 border-gray-300">
                <p className="font-semibold text-gray-800">🎫 データフロー追跡</p>
                <p className="text-xs text-gray-600 mt-2">
                  トレースデータなし（学習を開始してください）
                </p>
              </div>
            );
          }

          // マークダウンテーブルをHTMLに変換
          const lines = flowSummary.split('\n').filter((line) => line.trim());
          const tableLines = lines.filter((line) => line.startsWith('|'));

          if (tableLines.length === 0) {
            return null;
          }

          // ヘッダーとデータ行を分離
          const [headerLine, _separatorLine, ...dataLines] = tableLines;
          const headers = headerLine
            .split('|')
            .filter((h) => h.trim())
            .map((h) => h.trim());
          const rows = dataLines.map((line) =>
            line
              .split('|')
              .filter((cell) => cell.trim())
              .map((cell) => cell.trim())
          );

          return (
            <div className="bg-purple-50 p-3 rounded border-2 border-purple-300">
              <p className="font-semibold text-purple-800">🎫 データフロー追跡（スパンベース）</p>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-purple-100">
                      {headers.map((header, idx) => (
                        <th key={idx} className="px-2 py-1 text-left font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-2 py-1">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* スコアボード */}
        {(() => {
          const allProgress = loadProgressSync();
          const totalWords = Object.keys(allProgress.wordProgress || {}).length;
          const progressEntries = Object.values(allProgress.wordProgress || {}) as any[];

          let masteredWords = 0;
          let stillLearningWords = 0;
          let incorrectWords = 0;
          let totalAttempts = 0;
          let totalCorrect = 0;
          let totalStillLearning = 0;

          for (const p of progressEntries) {
            const attempts = getModeAttempts(p, mode);
            const correct = getModeCorrect(p, mode);
            const stillLearning = getModeStillLearning(p, mode);
            const position = determineWordPosition(p, mode);

            totalAttempts += attempts;
            totalCorrect += correct;
            totalStillLearning += stillLearning;

            if (attempts === 0) continue;
            if (position >= 70) incorrectWords++;
            else if (position >= 40) stillLearningWords++;
            else if (position < 20) masteredWords++;
          }

          const totalIncorrect = Math.max(0, totalAttempts - totalCorrect - totalStillLearning);
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
                  <progress
                    className="w-full h-2 rounded-full mt-2 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600"
                    value={currentIndex}
                    max={Math.max(1, totalQuestions)}
                  />
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
                        {(() => {
                          const badge = (() => {
                            switch (log.category) {
                              case 'incorrect':
                                return {
                                  className: 'bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs',
                                  label: '🔴 分からない',
                                };
                              case 'still_learning':
                                return {
                                  className:
                                    'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs',
                                  label: '🟡 まだまだ',
                                };
                              case 'new':
                                return {
                                  className:
                                    'bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs',
                                  label: '⚪ 新規',
                                };
                              case 'mastered':
                                return {
                                  className:
                                    'bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs',
                                  label: '✅ 定着済',
                                };
                              default:
                                return {
                                  className:
                                    'bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs',
                                  label: String(log.category ?? ''),
                                };
                            }
                          })();

                          return <span className={badge.className}>{badge.label}</span>;
                        })()}
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-gray-600">
                        <span>正答: {log.progress.correctCount}</span>
                        <span>誤答: {log.progress.incorrectCount}</span>
                        <span>連続正答: {log.progress.consecutiveCorrect}</span>
                        <span>連続誤答: {log.progress.consecutiveIncorrect}</span>
                        <span>正答率: {(log.progress.accuracy * 100).toFixed(0)}%</span>
                      </div>

                      {(() => {
                        const saved = (log as any).savedPositionDebug;
                        const savedPos = saved?.savedPosition;
                        const savedDecision = saved?.decision;
                        const savedReason = saved?.reason;
                        const posWithSaved = (log as any).positionWithSavedPosition;
                        if (savedPos === undefined && posWithSaved === undefined && !savedDecision)
                          return null;
                        return (
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                            <span>savedPosition: {savedPos ?? '-'}</span>
                            <span>calc(saved有り): {posWithSaved ?? '-'}</span>
                            <span>
                              calc(saved無視/解答直後): {log.positionAfter?.toFixed?.(0) ?? '-'}
                            </span>
                            {savedDecision && (
                              <span>
                                saved判定: {String(savedDecision)}
                                {savedReason ? ` (${String(savedReason)})` : ''}
                              </span>
                            )}
                          </div>
                        );
                      })()}
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
                const badge = (() => {
                  switch (evaluation.category) {
                    case 'incorrect':
                      return { className: 'bg-red-100 text-red-800', label: '分からない' };
                    case 'still_learning':
                      return { className: 'bg-yellow-100 text-yellow-800', label: 'まだまだ' };
                    case 'mastered':
                      return { className: 'bg-green-100 text-green-800', label: '定着済' };
                    case 'new':
                      return { className: 'bg-gray-100 text-gray-800', label: '未学習' };
                    default:
                      return { className: 'bg-gray-100 text-gray-800', label: '未学習' };
                  }
                })();
                return (
                  <li key={idx} className="text-xs bg-white p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#{idx + 1}</span>
                        <span className="font-mono font-bold text-base text-blue-600">{word}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${badge.className}`}>
                        {badge.label}
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
