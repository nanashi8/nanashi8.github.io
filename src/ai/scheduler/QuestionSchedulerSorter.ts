import type { PrioritizedQuestion, ScheduleContext, ScheduleParams } from './types';
import { GamificationAI } from '@/ai/specialists/GamificationAI';
import { logger } from '@/utils/logger';
import {
  getStrengthLookupForScheduling,
  getVocabularyNetworkForScheduling,
  recordVocabularyNetworkSchedulerPerf,
  startVocabularyNetworkPrecomputeIfNeeded,
} from '@/ai/utils/vocabularyNetwork';

type QuestionSchedulerSorterDeps = {
  recordFunctionCall: (funcName: string, params: any) => void;
  isVerboseDebug: () => boolean;
};

export class QuestionSchedulerSorter {
  constructor(private readonly deps: QuestionSchedulerSorterDeps) {}

  /**
   * ソート・バランス調整（ScheduleHelpersに委譲）
   *
   * TODO: 工程6で共通ヘルパーに抽出
   */
  public sortAndBalance(
    questions: PrioritizedQuestion[],
    _params: ScheduleParams,
    _context: ScheduleContext
  ): PrioritizedQuestion[] {
    // � 関数呼び出しトレース
    this.deps.recordFunctionCall('sortAndBalance', { questionsCount: questions.length });

    // �🔍 デバッグ: TOP20のPosition確認
    if (import.meta.env.DEV && questions.length > 0) {
      const top20 = questions.slice(0, Math.min(20, questions.length));
      console.log(
        '🔍 [sortAndBalance] TOP20 Position確認:',
        top20.map((pq) => ({
          word: pq.question.word,
          position: pq.position,
          statusPosition: pq.status?.position,
        }))
      );
    }

    // 学習状態（習得度）別に分類
    // ⚠️ 重要: pq.positionを使用（pq.status?.positionではない）
    const incorrectQuestions = questions.filter((pq) => pq.position >= 70); // 分からない
    const stillLearningQuestions = questions.filter(
      (pq) => pq.position >= 40 && pq.position < 70 // まだまだ
    );
    const otherQuestions = questions.filter(
      (pq) => pq.position < 40 // 未学習 or 定着済
    );

    // 🔍 デバッグ: カテゴリ分類結果
    if (this.deps.isVerboseDebug()) {
      console.log('🔍 [sortAndBalance] カテゴリ分類結果:', {
        incorrect: incorrectQuestions.length,
        stillLearning: stillLearningQuestions.length,
        other: otherQuestions.length,
        incorrectWords: incorrectQuestions.slice(0, 5).map((pq) => pq.question.word),
        stillLearningWords: stillLearningQuestions.slice(0, 5).map((pq) => pq.question.word),
      });
    }

    // デバッグ: 学習状態別の統計
    const learningStatusStats = questions.reduce(
      (acc, pq) => {
        const status = pq.status?.category || 'null'; // 学習状態（分からない/まだまだ/未学習/定着済）
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // 学習状態統計（ログ削減のため出力なし）

    // 🚨 警告: すべての単語の学習状態がnullの場合、学習履歴が読み取れていない
    if (learningStatusStats['null'] === questions.length) {
      if (import.meta.env.DEV) {
        logger.warn(
          '[QuestionScheduler] 全単語の学習段階がnull - localStorageから学習履歴を読み取れていない可能性があります'
        );
      }
    }

    // 各カテゴリ内でPosition順ソート（降順: Positionが高い順）
    // NOTE: 視覚回帰（スナップショット）と学習体験の安定性のため、同順位のランダム化は行わない。
    const sortByPosition = (a: PrioritizedQuestion, b: PrioritizedQuestion) => {
      if (a.position !== b.position) {
        return b.position - a.position; // ✅ 降順（Positionが高い順）
      }

      // 同一Positionは入力順（originalIndex）で安定化
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    };

    incorrectQuestions.sort(sortByPosition);
    stillLearningQuestions.sort(sortByPosition);
    otherQuestions.sort(sortByPosition);

    // 🎲 GamificationAI: Position分散適用済み（calculatePriorities内）
    // Position降順ソート + カテゴリ別インターリーブで自然に交互出題を実現
    const sorted = [...questions].sort((a, b) => {
      if (a.position !== b.position) {
        return b.position - a.position; // 降順（高い方が優先）
      }
      // 同一Positionは入力順（originalIndex）で安定化
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    });

    // 🎮 GamificationAI: カテゴリ別インターリーブ（苦手語4問→新規1問）
    // 重要: Position降順ソートを前提に、ランダム化は行わない（テスト/UXの安定性）
    const interleaved = new GamificationAI().interleaveByCategory(sorted);

    // 🎯 吸引確認: まだまだ・分からない語がTOP30に何語含まれるか検証
    if (this.deps.isVerboseDebug()) {
      const strugglingInSorted = sorted.filter(
        (pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0
      ).length;
      const strugglingInTop30 = interleaved
        .slice(0, 30)
        .filter((pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0).length;
      const strugglingInTop10 = interleaved
        .slice(0, 10)
        .filter((pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0).length;

      console.log('🎯 [吸引確認] まだまだ・分からない語の分布', {
        total: strugglingInSorted,
        top30: strugglingInTop30,
        top10: strugglingInTop10,
        coverage:
          strugglingInSorted > 0
            ? `${((strugglingInTop30 / strugglingInSorted) * 100).toFixed(1)}%`
            : '-',
      });

      if (strugglingInSorted > 0 && strugglingInTop30 === 0) {
        console.warn(
          '⚠️ [吸引失敗] まだまだ・分からない語がTOP30に1つも含まれていません！Position降順ソートが機能していない可能性があります。'
        );
      }
    }

    // デバッグ: 学習段階分布（開発環境のみ）
    if (this.deps.isVerboseDebug()) {
      const top20 = interleaved.slice(0, Math.min(20, interleaved.length));
      const positionDistribution = {
        分からない: top20.filter((pq) => pq.position >= 70).length,
        まだまだ: top20.filter((pq) => pq.position >= 40 && pq.position < 70).length,
        未学習or定着済: top20.filter((pq) => pq.position < 40).length,
      };
      console.log('🔀 [出題順序] インターリーブ後の学習段階分布', positionDistribution);

      const top20Categories = top20
        .map((pq) => {
          const word = pq.question.word;
          const attempts = pq.attempts ?? 0;
          const category =
            attempts > 0 && pq.position >= 40 && pq.position < 70
              ? 'まだまだ'
              : pq.position >= 40 && pq.position < 70
                ? '新規(引上)'
                : pq.position >= 70
                  ? '分からない'
                  : '新規';
          return `${word}(${category})`;
        })
        .join(', ');
      console.log('🎮 [インターリーブ] TOP20:', top20Categories);
    }

    // 📊 localStorage保存: sortAndBalance出力のTOP30
    try {
      const top30 = interleaved.slice(0, 30).map((pq) => ({
        word: pq.question.word,
        position: pq.position,
        category: pq.status?.category,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      if (this.deps.isVerboseDebug()) {
        localStorage.setItem('debug_sortAndBalance_output', JSON.stringify(top30));
      }

      // 📊 追加: TOP100も保存して、まだまだ語が何位にいるか確認
      const top100 = interleaved.slice(0, 100).map((pq, idx) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        category: pq.status?.category,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      // ⚠️ まだまだ語の定義: Position 40-70 かつ attempts > 0
      const stillLearningInTop100 = top100.filter(
        (item) => item.position >= 40 && item.position < 70 && item.attempts > 0
      );

      // 📊 TOP516位も確認（Position 50の新規516語の後にまだまだ語が来るはず）
      const top600 = interleaved.slice(0, 600).map((pq, idx) => ({
        rank: idx + 1,
        word: pq.question.word,
        position: pq.position,
        attempts: pq.attempts ?? pq.status?.attempts ?? 0,
      }));
      const stillLearningInTop600 = top600.filter(
        (item) => item.position >= 40 && item.position < 70 && item.attempts > 0
      );

      if (this.deps.isVerboseDebug()) {
        const snapshot = {
          timestamp: new Date().toISOString(),
          mode: _params.mode,
          questionsCount: questions.length,
          interleavedCount: interleaved.length,
          top100,
          top600,
          top600Count: top600.length,
          stillLearningInTop100: stillLearningInTop100.length,
          stillLearningInTop600: stillLearningInTop600.length,
          stillLearningWordsInTop100: stillLearningInTop100.map(
            (item) => `${item.rank}位: ${item.word} (Position ${item.position}, ${item.attempts}回)`
          ),
          stillLearningWordsInTop600: stillLearningInTop600
            .slice(0, 20)
            .map(
              (item) =>
                `${item.rank}位: ${item.word} (Position ${item.position}, ${item.attempts}回)`
            ),
          position50Count: top600.filter((item) => item.position === 50 && item.attempts === 0)
            .length,
        };

        // 旧キー（互換用）: 最新の1件（モード混在で上書きされ得るので、読む側はmode別キー推奨）
        localStorage.setItem('debug_sortAndBalance_top100', JSON.stringify(snapshot));

        // 新キー: mode別に保存（モード違いの上書きを防止）
        const byModeKey = `debug_sortAndBalance_top100_${_params.mode}`;
        localStorage.setItem(byModeKey, JSON.stringify(snapshot));

        // 新キー: mode別に短い履歴を保持（同一mode内のミニ実行(30問など)でも、必要なスナップショットを選べる）
        const historyKey = `debug_sortAndBalance_top100_history_${_params.mode}`;
        try {
          const existingRaw = localStorage.getItem(historyKey);
          const existing = JSON.parse(existingRaw || '[]');
          const arr = Array.isArray(existing) ? existing : [];
          arr.push(snapshot);
          while (arr.length > 5) arr.shift();
          localStorage.setItem(historyKey, JSON.stringify(arr));
        } catch {
          // ignore
        }
      }
    } catch {
      // localStorage失敗は無視
    }

    if (_params.useChainLearning) {
      return this.applyChainLearningWithinTopN(interleaved, _params);
    }

    return interleaved;
  }

  /**
   * いもづる式（語彙ネットワーク）による“局所的な並べ替え”
   * - Position降順/インターリーブの大枠は維持
   * - TOP数十問のみ、同一Position帯の範囲内で関連語が近くなるように並べ替える
   * - ネットワークが未保存でも軽量に生成し、保存はアイドル時に回す
   */
  private applyChainLearningWithinTopN(
    interleaved: PrioritizedQuestion[],
    params: ScheduleParams
  ): PrioritizedQuestion[] {
    const t0 =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

    const maxReorder = 80;
    const topCount = Math.min(maxReorder, interleaved.length);
    if (topCount <= 2) return interleaved;

    getVocabularyNetworkForScheduling(params.questions);
    startVocabularyNetworkPrecomputeIfNeeded(params.questions);
    const lookup = getStrengthLookupForScheduling(params.questions);

    const top = interleaved.slice(0, topCount);
    const tail = interleaved.slice(topCount);

    const bucketOf = (pq: PrioritizedQuestion) => Math.floor(pq.position / 10);
    const getStrength = (a: string, b: string): number => {
      const s1 = lookup.get(a)?.get(b) ?? 0;
      const s2 = lookup.get(b)?.get(a) ?? 0;
      return Math.max(s1, s2);
    };

    const reordered: PrioritizedQuestion[] = [];
    let i = 0;
    const touchedBuckets = new Set<number>();
    let usedReorder = false;
    while (i < top.length) {
      const bucket = bucketOf(top[i]);
      touchedBuckets.add(bucket);
      let j = i + 1;
      while (j < top.length && bucketOf(top[j]) === bucket) {
        j++;
      }

      const segment = top.slice(i, j);
      if (segment.length <= 2) {
        reordered.push(...segment);
        i = j;
        continue;
      }

      // まずは元の先頭を起点に、貪欲に“次に最も関係が強い語”を繋ぐ
      const remaining = segment.slice(1);
      const segmentOut: PrioritizedQuestion[] = [segment[0]];

      let totalLink = 0;
      while (remaining.length > 0) {
        const prev = segmentOut[segmentOut.length - 1].question.word;
        let bestIdx = 0;
        let bestStrength = -1;

        for (let k = 0; k < remaining.length; k++) {
          const cand = remaining[k].question.word;
          const strength = getStrength(prev, cand);
          if (strength > bestStrength) {
            bestStrength = strength;
            bestIdx = k;
          }
        }

        totalLink += Math.max(0, bestStrength);
        segmentOut.push(remaining.splice(bestIdx, 1)[0]);
      }

      // 関連が全く取れない場合は、元の順序を維持
      if (totalLink === 0) {
        reordered.push(...segment);
      } else {
        usedReorder = true;
        reordered.push(...segmentOut);
      }

      i = j;
    }

    const out = [...reordered, ...tail];

    const t1 =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    recordVocabularyNetworkSchedulerPerf({
      ms: t1 - t0,
      topCount,
      buckets: touchedBuckets.size,
      usedReorder,
    });

    return out;
  }
}
