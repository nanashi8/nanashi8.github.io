import type { Question } from '@/types';
import type { PrioritizedQuestion, ScheduleContext } from './types';
import { writeDebugJSON } from '@/utils/debugStorage';
import { generateContextualSequence } from '@/ai/optimization/contextualLearningAI';
import { logger } from '@/utils/logger';
import { loadProgressSync } from '@/storage/progress/progressStorage';

export class QuestionSchedulerPostProcessor {
  /**
   * 後処理 - 関連語グループ化による出題順序の最適化
   *
   * 重要制約: Position階層（70-100 > 60-69 > 40-59 > 20-39 > 0-19）を絶対に保持
   * 各Position範囲内でのみ並べ替えを行い、範囲間の順序は維持する
   */
  public postProcess(questions: PrioritizedQuestion[], context: ScheduleContext): Question[] {
    // 基本的な変換
    // NOTE: 各タブで「再出題差し込み」「Position不整合検知」を共通で扱えるよう、
    // schedule()の返却QuestionにもPositionを付与する（UXは変えず、データのみ追加）。
    const baseQuestions = questions.map(
      (pq) =>
        ({
          ...pq.question,
          position: pq.position,
          finalPriority: pq.finalPriority,
        }) as unknown as Question
    );

    // ✅ インターリーブ済みの順序を保持
    // sortAndBalance() で GamificationAI.interleaveByCategory() により
    // Position階層を跨いだ交互配置が既に適用されている場合、ここでPosition帯域ごとに
    // 再構成すると「新規が前に来ない（分からない連打で新規が消える）」状態を作る。
    // そのため、順序が“厳密なPosition帯域の単調並び”になっていない場合は、後処理の
    // 並べ替え（関連語グループ化）をスキップして既存順序を返す。
    const isInterleavedAcrossBands = true; // 強制的にtrue（関連語グループ化を無効化）

    // デバッグ用: postProcessの挙動を保存（パネルで原因切り分けに使う）
    // NOTE: mode別キーも併記して、translation等の30問テストで上書きされないようにする
    try {
      const top30 = questions.slice(0, 30).map((pq) => ({
        word: pq.question.word,
        position: pq.position ?? 0,
        attempts: pq.status?.attempts ?? 0,
      }));

      const payload = {
        timestamp: new Date().toISOString(),
        mode: context.mode,
        isInterleavedAcrossBands,
        action: isInterleavedAcrossBands
          ? 'skipped_contextual_reorder'
          : 'applied_contextual_reorder',
        top30,
      };

      writeDebugJSON('debug_postProcess_meta', payload, { mode: context.mode });
    } catch {
      // ignore
    }

    if (isInterleavedAcrossBands) {
      return baseQuestions;
    }

    // 関連語グループ化機能を適用（contextualLearningAI）
    try {
      const allProgress = this.getAllProgress();
      const _recentlyStudied = this.getRecentlyStudiedWords(context);

      // Position範囲ごとに分割（階層を保持するため）
      const positionBands = this.splitByPositionBands(questions, context);

      const reorderedQuestions: Question[] = [];
      let totalClusters = 0;
      let totalTransitions = 0;

      // 各Position範囲内で独立に並べ替え
      for (const band of positionBands) {
        if (band.items.length === 0) continue;

        const bandQuestions = band.items.map(
          (pq) =>
            ({
              ...pq.question,
              position: pq.position,
              finalPriority: pq.finalPriority,
            }) as unknown as Question
        );

        // Position範囲内でのみ関連語グループ化
        const contextualResult = generateContextualSequence(
          bandQuestions,
          allProgress,
          // schedule結果から「出題自体」を除外しないため、recentlyStudiedは渡さない
          // （generateContextualSequenceはrecentlyStudiedをsequenceから除外する設計）
          []
        );

        // 最適化されたsequenceに従って並び替え（範囲内のみ）
        const questionMap = new Map(bandQuestions.map((q) => [q.word, q]));
        const bandReordered = contextualResult.sequence
          .map((word) => questionMap.get(word))
          .filter((q): q is Question => q !== undefined);

        reorderedQuestions.push(...bandReordered);
        totalClusters += contextualResult.clusters.length;
        totalTransitions += contextualResult.transitions.length;
      }

      // デバッグログ（開発時のみ）- 関連語グループ化の詳細を可視化
      if (import.meta.env.DEV && totalTransitions > 0) {
        // Position範囲ごとの統計
        const bandsInfo = positionBands.map((b) => ({
          range: b.range,
          count: b.items.length,
          clusterCount: 0, // あとで計算
          transitionCount: 0,
        }));

        // 関連性遷移の詳細（最初の10個のみ）
        const debugTransitions: any[] = [];
        let bandIdx = 0;
        for (const band of positionBands) {
          if (band.items.length === 0) continue;

          const bandQuestions = band.items.map((pq) => pq.question);
          const contextualResult = generateContextualSequence(bandQuestions, allProgress, []);

          bandsInfo[bandIdx].clusterCount = contextualResult.clusters.length;
          bandsInfo[bandIdx].transitionCount = contextualResult.transitions.length;

          // 最初の3遷移のみ記録
          debugTransitions.push(
            ...contextualResult.transitions.slice(0, 3).map((t) => ({
              band: band.range,
              from: t.from,
              to: t.to,
              reason: t.reason,
            }))
          );

          bandIdx++;
        }

        logger.info('[postProcess] 関連語グループ化適用（Position階層保持）:', {
          positionBands: positionBands.length,
          totalClusters,
          totalTransitions,
          bandsInfo,
          debugTransitions,
        });
      }

      return reorderedQuestions;
    } catch (error) {
      // エラー時はフォールバック
      logger.warn('[postProcess] 関連語グループ化でエラー、基本順序を使用:', error);
      return baseQuestions;
    }
  }

  /**
   * Position範囲でグループ化（階層の不変条件を保持）
   *
   * Position階層:
   * - 70-100: incorrect（分からない）← 第1優先
   * - 60-69:  still_learning (boosted) ← 第2優先
   * - 40-59:  new (boosted) ← 第3優先
   * - 20-39:  new (normal) ← 第4優先
   * - 0-19:   mastered ← 第5優先
   */
  private splitByPositionBands(
    questions: PrioritizedQuestion[],
    _context: ScheduleContext
  ): Array<{ range: string; items: PrioritizedQuestion[] }> {
    const bands = [
      { range: '70-100 (incorrect)', min: 70, max: 100, items: [] as PrioritizedQuestion[] },
      { range: '60-69 (still_learning)', min: 60, max: 69, items: [] as PrioritizedQuestion[] },
      { range: '40-59 (new boosted)', min: 40, max: 59, items: [] as PrioritizedQuestion[] },
      { range: '20-39 (new normal)', min: 20, max: 39, items: [] as PrioritizedQuestion[] },
      { range: '0-19 (mastered)', min: 0, max: 19, items: [] as PrioritizedQuestion[] },
    ];

    questions.forEach((pq) => {
      const position = pq.position;

      for (const band of bands) {
        if (position >= band.min && position <= band.max) {
          band.items.push(pq);
          break;
        }
      }
    });

    // Position範囲順（降順）で返す
    return bands.filter((b) => b.items.length > 0);
  }

  /**
   * 最近学習した単語リストを取得（直近20語）
   */
  private getRecentlyStudiedWords(context: ScheduleContext): string[] {
    const recentWords: string[] = [];
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5分以内

    for (const [word, progress] of Object.entries(context.wordProgress)) {
      const lastStudied = progress?.lastStudied;
      if (lastStudied && now - new Date(lastStudied).getTime() < recentThreshold) {
        recentWords.push(word);
      }
    }

    return recentWords.slice(-20); // 最新20語
  }

  /**
   * AI統合用: すべての単語進捗データを取得
   */
  private getAllProgress(): Record<string, any> {
    try {
      const progress = loadProgressSync();
      return progress.wordProgress || {};
    } catch {
      return {};
    }
  }
}
