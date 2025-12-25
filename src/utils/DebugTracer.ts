/**
 * 分散トレーシングシステム（OpenTelemetryライク）
 * まだまだ語のデータフロー追跡用
 *
 * 業界標準のスパンモデルを採用：
 * - traceId: 全体の処理を識別する一意のID
 * - spanId: 各処理単位を識別する一意のID
 * - parentSpanId: 親スパンのID（階層構造）
 */

interface SpanAttributes {
  weakWordsCount: number;
  totalCount: number;
  weakWords?: string[];
  [key: string]: any;
}

interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: SpanAttributes;
  events: SpanEvent[];
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, any>;
}

interface TraceContext {
  traceId: string;
  spans: Map<string, Span>;
  activeSpanId?: string;
}

export class DebugTracer {
  private static STORAGE_KEY = 'debug_trace_context';
  private static currentContext: TraceContext | null = null;

  /**
   * 新しいトレースを開始
   */
  static startTrace(traceName: string = 'weak-words-flow'): string {
    if (!import.meta.env.DEV) return '';

    const traceId = `trace_${traceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentContext = {
      traceId,
      spans: new Map(),
    };

    this.saveContext();
    console.log(`🎫 [Tracer] 新しいトレース開始: ${traceId}`);
    return traceId;
  }

  /**
   * スパンを開始
   * @param name スパン名（例: "MemorizationView.filterWeakWords"）
   * @param attributes スパンの属性
   * @param parentSpanId 親スパンのID（省略時は現在のアクティブスパン）
   */
  static startSpan(name: string, attributes: SpanAttributes, parentSpanId?: string): string {
    if (!import.meta.env.DEV) return '';

    // トレースが開始されていない場合は自動開始
    if (!this.currentContext) {
      this.startTrace();
    }

    const spanId = `span_${name.replace(/\./g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const span: Span = {
      traceId: this.currentContext!.traceId,
      spanId,
      parentSpanId: parentSpanId || this.currentContext!.activeSpanId,
      name,
      startTime: performance.now(),
      attributes,
      events: [],
    };

    this.currentContext!.spans.set(spanId, span);
    this.currentContext!.activeSpanId = spanId;

    const timeStr = new Date().toISOString().split('T')[1];
    console.log(
      `🎫 [${name}] スパン開始 (${spanId.split('_').pop()}) - ` +
        `まだまだ語: ${attributes.weakWordsCount}語 / ${attributes.totalCount}語 @ ${timeStr}`
    );

    if (attributes.weakWords && attributes.weakWords.length > 0) {
      console.log(`   単語リスト (TOP5):`, attributes.weakWords.slice(0, 5));
    }

    this.saveContext();
    return spanId;
  }

  /**
   * スパンを終了
   */
  static endSpan(spanId: string, attributes?: Partial<SpanAttributes>): void {
    if (!import.meta.env.DEV || !this.currentContext) return;

    const span = this.currentContext.spans.get(spanId);
    if (!span) {
      console.warn(`⚠️ [Tracer] スパンが見つかりません: ${spanId}`);
      return;
    }

    span.endTime = performance.now();
    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes };
    }

    const duration = span.endTime - span.startTime;
    const timeStr = new Date().toISOString().split('T')[1];
    console.log(
      `🎫 [${span.name}] スパン終了 (${spanId.split('_').pop()}) - ` +
        `所要時間: ${duration.toFixed(2)}ms @ ${timeStr}`
    );

    // アクティブスパンを親スパンに戻す
    if (this.currentContext.activeSpanId === spanId) {
      this.currentContext.activeSpanId = span.parentSpanId;
    }

    this.saveContext();
  }

  /**
   * スパンにイベントを追加
   */
  static addEvent(spanId: string, eventName: string, attributes?: Record<string, any>): void {
    if (!import.meta.env.DEV || !this.currentContext) return;

    const span = this.currentContext.spans.get(spanId);
    if (!span) return;

    span.events.push({
      name: eventName,
      timestamp: performance.now(),
      attributes,
    });

    console.log(`   📌 [${span.name}] イベント: ${eventName}`, attributes);
    this.saveContext();
  }

  /**
   * トレースを終了してサマリーを生成
   */
  static endTrace(): string {
    if (!import.meta.env.DEV || !this.currentContext) return '';

    const context = this.currentContext;
    const spans = Array.from(context.spans.values()).sort((a, b) => a.startTime - b.startTime);

    console.log(`\n🎫 [Tracer] トレース終了: ${context.traceId}`);
    console.log(`   総スパン数: ${spans.length}`);

    // 消失検出
    const lostWords = this.detectLostWords(spans);
    if (lostWords.length > 0) {
      console.warn(`\n❌ [Tracer] 消失した単語を検出:`);
      lostWords.forEach((lost) => {
        console.warn(
          `   - ${lost.word}: 最後に確認 → ${lost.lastSeenSpan} ` + `(${lost.lastSeenCount}語中)`
        );
      });
    }

    const summary = this.generateSummary();
    this.saveContext();

    return summary;
  }

  /**
   * 消失した単語を検出
   */
  private static detectLostWords(spans: Span[]): Array<{
    word: string;
    lastSeenSpan: string;
    lastSeenCount: number;
  }> {
    if (spans.length === 0) return [];

    const lost: Array<{ word: string; lastSeenSpan: string; lastSeenCount: number }> = [];
    const wordTracking = new Map<string, { span: string; count: number }>();

    // 各スパンでどの単語が確認されたかを追跡
    for (const span of spans) {
      const words = span.attributes.weakWords || [];
      for (const word of words) {
        wordTracking.set(word, {
          span: span.name,
          count: span.attributes.weakWordsCount,
        });
      }
    }

    // 最初のスパンにあって最後のスパンにない単語を検出
    if (spans.length >= 2) {
      const firstWords = new Set(spans[0].attributes.weakWords || []);
      const lastWords = new Set(spans[spans.length - 1].attributes.weakWords || []);

      for (const word of firstWords) {
        if (!lastWords.has(word)) {
          const lastSeen = wordTracking.get(word);
          if (lastSeen) {
            lost.push({
              word,
              lastSeenSpan: lastSeen.span,
              lastSeenCount: lastSeen.count,
            });
          }
        }
      }
    }

    return lost;
  }

  /**
   * サマリーを生成（デバッグパネル用）
   */
  static generateSummary(): string {
    if (!this.currentContext) return 'トレースデータなし';

    const spans = Array.from(this.currentContext.spans.values()).sort(
      (a, b) => a.startTime - b.startTime
    );

    if (spans.length === 0) return 'スパンデータなし';

    let summary = '';

    // 🧪 A/Bテスト情報を表示（localStorageから取得）
    try {
      const lastSession = localStorage.getItem('debug_ab_session_info');
      if (lastSession) {
        const sessionInfo = JSON.parse(lastSession);
        summary += '## 🧪 A/Bテスト情報\n\n';
        summary += `**現在のVariant**: ${sessionInfo.variant}\n`;
        summary += `- **A**: 通常モード（calculatePriorities）\n`;
        summary += `- **B**: ハイブリッドモード（Position主軸+AI小補正）\n`;
        summary += `- **C**: AI主軸モード（finalPriorityMode、GamificationAIブースト）\n\n`;

        if (sessionInfo.variant === 'A') {
          summary += `⚠️ **警告**: 現在はVariant Aです。まだまだ語のブーストは適用されません。\n`;
          summary += `→ Variant Cでテストするには、LocalStorageをクリアして再読み込みしてください（3分の1の確率でVariant Cになります）。\n\n`;
        } else if (sessionInfo.variant === 'B') {
          summary += `⚠️ **警告**: 現在はVariant Bです。GamificationAIブーストは部分的にしか適用されません。\n`;
          summary += `→ Variant Cでテストするには、LocalStorageをクリアして再読み込みしてください（3分の1の確率でVariant Cになります）。\n\n`;
        } else if (sessionInfo.variant === 'C') {
          summary += `✅ **正常**: Variant Cが適用されています。GamificationAIブーストが有効です。\n\n`;
        }
      }
    } catch {
      // LocalStorageアクセスエラーを無視
    }

    summary += '## 🎫 データフロー追跡（スパンベース）\n\n';
    summary += '| スパン | 開始時刻 | 所要時間 | まだまだ語 | 総単語数 | 状態 |\n';
    summary += '|---|---|---|---|---|---|\n';

    let prevCount = -1;
    for (const span of spans) {
      const duration = span.endTime ? `${(span.endTime - span.startTime).toFixed(2)}ms` : '実行中';
      const timeStr = new Date(Date.now() - performance.now() + span.startTime)
        .toISOString()
        .split('T')[1];
      const weakCount = span.attributes.weakWordsCount ?? span.attributes.weakWordsCountAfter ?? 0;
      const totalCount = span.attributes.totalCount ?? span.attributes.totalCountAfter ?? 0;

      let status = '✅ 正常';
      let changeInfo = '';
      if (prevCount !== -1) {
        const diff = weakCount - prevCount;
        if (weakCount === 0 && prevCount > 0) {
          status = '❌ 消失';
          changeInfo = ` (-${prevCount}語)`;
        } else if (diff < 0) {
          status = '⚠️ 減少';
          changeInfo = ` (${diff}語)`;
        } else if (diff > 0) {
          status = '📈 増加';
          changeInfo = ` (+${diff}語)`;
        }
      }
      prevCount = weakCount;

      summary += `| ${span.name} | ${timeStr} | ${duration} | ${weakCount}語${changeInfo} | ${totalCount}語 | ${status} |\n`;
    }

    // 📊 スケジュール前後の比較（MemorizationView.prepareScheduling）
    const prepareSpan = spans.find((s) => s.name === 'MemorizationView.prepareScheduling');
    if (prepareSpan) {
      const beforeCount = prepareSpan.attributes.weakWordsCount ?? 0;
      const afterCount = prepareSpan.attributes.weakWordsCountAfter ?? 0;
      const beforeTotal = prepareSpan.attributes.totalCount ?? 0;
      const afterTotal = prepareSpan.attributes.totalCountAfter ?? 0;

      summary += '\n### 📊 スケジュール前後の比較\n\n';
      summary += '**MemorizationView.prepareScheduling**:\n';
      summary += `- スケジュール前: ${beforeCount}語のまだまだ語 / ${beforeTotal}語の候補\n`;
      summary += `- スケジュール後: ${afterCount}語のまだまだ語 / ${afterTotal}語の結果\n`;

      if (beforeCount > afterCount) {
        const lost = beforeCount - afterCount;
        const percentage = ((lost / beforeCount) * 100).toFixed(1);
        summary += `- **変化**: ${lost}語減少（${percentage}%消失） ⚠️\n`;
      } else if (beforeCount < afterCount) {
        const gained = afterCount - beforeCount;
        summary += `- **変化**: ${gained}語増加 📈\n`;
      } else {
        summary += `- **変化**: 変化なし ✅\n`;
      }

      // スケジュール前後の単語リスト比較
      const beforeWords = new Set((prepareSpan.attributes.weakWords as string[]) || []);
      const afterWords = new Set((prepareSpan.attributes.weakWordsAfter as string[]) || []);
      const disappeared = [...beforeWords].filter((w) => !afterWords.has(w));
      const appeared = [...afterWords].filter((w) => !beforeWords.has(w));

      if (disappeared.length > 0) {
        summary += `\n**消失した単語（${disappeared.length}語）**:\n`;
        summary += `- ${disappeared.slice(0, 10).join(', ')}`;
        if (disappeared.length > 10) {
          summary += ` (+${disappeared.length - 10}語)`;
        }
        summary += '\n';
      }

      if (appeared.length > 0) {
        summary += `\n**新たに追加された単語（${appeared.length}語）**:\n`;
        summary += `- ${appeared.slice(0, 10).join(', ')}`;
        if (appeared.length > 10) {
          summary += ` (+${appeared.length - 10}語)`;
        }
        summary += '\n';
      }
    }

    // 消失した単語のリスト
    const lostWords = this.detectLostWords(spans);
    if (lostWords.length > 0) {
      summary += '\n### ❌ 消失した単語\n\n';
      lostWords.slice(0, 10).forEach((lost) => {
        summary += `- **${lost.word}**: 最後に確認 → ${lost.lastSeenSpan}\n`;
      });
      if (lostWords.length > 10) {
        summary += `\n_...他${lostWords.length - 10}語_\n`;
      }
    } else {
      summary += '\n### ✅ 消失した単語なし\n\n';
    }

    // 📊 スパンごとの単語リスト変化（TOP5表示）
    summary += '\n### 📊 スパンごとの単語リスト変化\n\n';
    for (const span of spans) {
      const words = span.attributes.weakWords || [];
      if (words.length > 0) {
        const top5 = words.slice(0, 5).join(', ');
        const remaining = words.length > 5 ? ` (+${words.length - 5}語)` : '';
        summary += `- **${span.name}**: ${words.length}語 → [${top5}${remaining}]\n`;
      } else {
        summary += `- **${span.name}**: 0語\n`;
      }
    }

    // 🔍 消失の詳細分析
    if (lostWords.length > 0) {
      summary += '\n### 🔍 消失の詳細分析\n\n';
      summary += `**総消失数**: ${lostWords.length}語\n\n`;

      // スパン間の差分を計算
      for (let i = 0; i < spans.length - 1; i++) {
        const currentWords = new Set(
          (spans[i].attributes.weakWords as string[]) ||
            (spans[i].attributes.weakWordsAfter as string[]) ||
            []
        );
        const nextWords = new Set((spans[i + 1].attributes.weakWords as string[]) || []);

        const disappeared = [...currentWords].filter((w) => !nextWords.has(w));
        const appeared = [...nextWords].filter((w) => !currentWords.has(w));

        if (disappeared.length > 0 || appeared.length > 0) {
          const currentCount = currentWords.size;
          const nextCount = nextWords.size;
          const diff = nextCount - currentCount;
          const percentage =
            currentCount > 0 ? ((Math.abs(diff) / currentCount) * 100).toFixed(1) : '0.0';

          summary += `\n**${spans[i].name} → ${spans[i + 1].name}**:\n`;
          summary += `- 単語数変化: ${currentCount}語 → ${nextCount}語`;
          if (diff < 0) {
            summary += ` (${diff}語、-${percentage}%) ⚠️`;
          } else if (diff > 0) {
            summary += ` (+${diff}語、+${percentage}%) 📈`;
          }
          summary += '\n';

          if (disappeared.length > 0) {
            summary += `- 消失（${disappeared.length}語）: ${disappeared.slice(0, 5).join(', ')}`;
            if (disappeared.length > 5) {
              summary += ` (+${disappeared.length - 5}語)`;
            }
            summary += '\n';
          }

          if (appeared.length > 0) {
            summary += `- 追加（${appeared.length}語）: ${appeared.slice(0, 5).join(', ')}`;
            if (appeared.length > 5) {
              summary += ` (+${appeared.length - 5}語)`;
            }
            summary += '\n';
          }
        }
      }
    }

    // 🧠 finalPriorityモードの詳細情報
    try {
      const finalPriorityOutput = localStorage.getItem('debug_finalPriority_output');
      const finalPrioritySessionStats = localStorage.getItem('debug_finalPriority_sessionStats');

      if (finalPriorityOutput && finalPrioritySessionStats) {
        const top30 = JSON.parse(finalPriorityOutput) as Array<{
          rank: number;
          word: string;
          position: number;
          finalPriority: number;
          category?: string;
          attempts: number;
        }>;
        const sessionStats = JSON.parse(finalPrioritySessionStats) as {
          currentTab: string;
          totalQuestions: number;
          allProgressCount: number;
          timestamp: string;
        };

        summary += '\n### 🧠 finalPriorityモード（AI主軸）の詳細\n\n';
        summary += `**スケジューリング情報**:\n`;
        summary += `- タブ: ${sessionStats.currentTab}\n`;
        summary += `- 総問題数: ${sessionStats.totalQuestions}問\n`;
        summary += `- 進捗データ: ${sessionStats.allProgressCount}語\n`;
        summary += `- タイムスタンプ: ${sessionStats.timestamp}\n\n`;

        summary += `**TOP10の問題（finalPriority降順）**:\n\n`;
        summary += `| ランク | 単語 | Position | finalPriority | カテゴリ | 出題回数 |\n`;
        summary += `|---|---|---|---|---|---|\n`;

        top30.slice(0, 10).forEach((item) => {
          const posEmoji =
            item.position >= 70
              ? '🔴'
              : item.position >= 40
                ? '🟡'
                : item.position >= 20
                  ? '⚪'
                  : '✅';
          summary += `| ${item.rank} | **${item.word}** | ${item.position} ${posEmoji} | ${item.finalPriority.toFixed(3)} | ${item.category || '-'} | ${item.attempts}回 |\n`;
        });

        // まだまだ語のランキング分析
        const weakWordsInTop30 = top30.filter((item) => item.position >= 40 && item.attempts > 0);
        summary += `\n**まだまだ語のランキング**:\n`;
        summary += `- TOP10に含まれるまだまだ語: ${weakWordsInTop30.slice(0, 10).length}語\n`;
        summary += `- TOP30に含まれるまだまだ語: ${weakWordsInTop30.length}語\n`;

        if (weakWordsInTop30.length > 0) {
          summary += `\n**まだまだ語TOP5**:\n`;
          weakWordsInTop30.slice(0, 5).forEach((item) => {
            summary += `- **${item.word}** (ランク${item.rank}, Position ${item.position}, finalPriority ${item.finalPriority.toFixed(3)})\n`;
          });
        } else {
          summary += `\n⚠️ **警告**: TOP30にまだまだ語が含まれていません！\n`;
          summary += `→ GamificationAIのブースト処理が適用されていない可能性があります。\n`;
        }
      } else {
        summary += '\n### ⚠️ finalPriorityモードのスナップショットがありません\n\n';
        summary += `finalPriorityModeが使用されていないか、スナップショットの保存に失敗しています。\n`;
      }
    } catch (e) {
      summary += '\n### ⚠️ finalPriorityモードのスナップショット読み取りエラー\n\n';
      summary += `エラー: ${e}\n`;
    }

    // 🔍 postProcess後のTOP30情報
    try {
      const postProcessOutput = localStorage.getItem('debug_postProcess_output');
      const sortAndBalanceOutput = localStorage.getItem('debug_sortAndBalance_output');

      if (postProcessOutput || sortAndBalanceOutput) {
        summary += '\n### 🔍 sortAndBalance → postProcess の順序検証\n\n';

        if (sortAndBalanceOutput) {
          const sortAndBalanceData = JSON.parse(sortAndBalanceOutput) as Array<{
            word: string;
            position: number;
            category?: string;
            attempts: number;
          }>;

          summary += `**sortAndBalance後のTOP10**:\n\n`;
          summary += `| ランク | 単語 | Position | カテゴリ | 出題回数 |\n`;
          summary += `|---|---|---|---|---|\n`;

          sortAndBalanceData.slice(0, 10).forEach((item, idx) => {
            const posEmoji =
              item.position >= 70
                ? '🔴'
                : item.position >= 60
                  ? '🟡'
                  : item.position >= 40
                    ? '🔵'
                    : item.position >= 20
                      ? '⚪'
                      : '✅';
            summary += `| ${idx + 1} | **${item.word}** | ${item.position} ${posEmoji} | ${item.category || '-'} | ${item.attempts}回 |\n`;
          });

          // Position分布を表示
          const sortAndBalanceDistribution = {
            incorrect: sortAndBalanceData.filter((item) => item.position >= 70).length,
            stillLearning: sortAndBalanceData.filter(
              (item) => item.position >= 60 && item.position < 70 && item.attempts > 0
            ).length,
            newBoosted: sortAndBalanceData.filter(
              (item) => item.position >= 40 && item.position < 60 && item.attempts === 0
            ).length,
            newNormal: sortAndBalanceData.filter(
              (item) => item.position >= 20 && item.position < 40
            ).length,
            mastered: sortAndBalanceData.filter((item) => item.position < 20).length,
          };

          summary += `\n**Position分布（TOP30）**:\n`;
          summary += `- 🔴 分からない (Position≥70): ${sortAndBalanceDistribution.incorrect}語\n`;
          summary += `- 🟡 まだまだ (Position 60-69, attempts>0): ${sortAndBalanceDistribution.stillLearning}語\n`;
          summary += `- 🔵 新規ブースト (Position 40-59, attempts=0): ${sortAndBalanceDistribution.newBoosted}語\n`;
          summary += `- ⚪ 新規通常 (Position 20-39): ${sortAndBalanceDistribution.newNormal}語\n`;
          summary += `- ✅ 定着済 (Position <20): ${sortAndBalanceDistribution.mastered}語\n\n`;
        }

        if (postProcessOutput) {
          const postProcessData = JSON.parse(postProcessOutput) as {
            timestamp: string;
            top30: Array<{
              rank: number;
              word: string;
              position: number;
              attempts: number;
            }>;
            positionDistribution: {
              incorrect: number;
              stillLearning: number;
              newBoosted: number;
              newNormal: number;
              mastered: number;
            };
            totalQuestions: number;
          };

          summary += `**postProcess後のTOP10**:\n\n`;
          summary += `| ランク | 単語 | Position | 状態 |\n`;
          summary += `|---|---|---|---|\n`;

          postProcessData.top30.slice(0, 10).forEach((item) => {
            const posEmoji =
              item.position >= 70
                ? '🔴'
                : item.position >= 60
                  ? '🟡'
                  : item.position >= 40
                    ? '🔵'
                    : item.position >= 20
                      ? '⚪'
                      : '✅';
            const stateText =
              item.position >= 70
                ? '分からない'
                : item.position >= 60
                  ? 'まだまだ'
                  : item.position >= 40
                    ? '新規ブースト'
                    : item.position >= 20
                      ? '新規'
                      : '定着済';
            summary += `| ${item.rank} | **${item.word}** | ${item.position} ${posEmoji} | ${stateText} |\n`;
          });

          summary += `\n**Position分布（TOP30）**:\n`;
          summary += `- 🔴 分からない: ${postProcessData.positionDistribution.incorrect}語\n`;
          summary += `- 🟡 まだまだ: ${postProcessData.positionDistribution.stillLearning}語\n`;
          summary += `- 🔵 新規ブースト: ${postProcessData.positionDistribution.newBoosted}語\n`;
          summary += `- ⚪ 新規通常: ${postProcessData.positionDistribution.newNormal}語\n`;
          summary += `- ✅ 定着済: ${postProcessData.positionDistribution.mastered}語\n\n`;

          // sortAndBalanceとpostProcessの比較
          if (sortAndBalanceOutput) {
            const sortAndBalanceData = JSON.parse(sortAndBalanceOutput) as Array<{ word: string }>;
            const sortTop10Words = sortAndBalanceData.slice(0, 10).map((item) => item.word);
            const postTop10Words = postProcessData.top30.slice(0, 10).map((item) => item.word);

            const orderChanged = sortTop10Words.some((word, idx) => word !== postTop10Words[idx]);

            if (orderChanged) {
              summary += `⚠️ **警告**: sortAndBalanceとpostProcessでTOP10の順序が変わっています！\n`;
              summary += `→ postProcess()の関連語グループ化がPosition階層を破壊している可能性があります。\n\n`;
            } else {
              summary += `✅ **順序保持**: sortAndBalanceとpostProcessでTOP10の順序が一致しています。\n\n`;
            }
          }
        } else {
          summary += `⚠️ postProcess後のスナップショットがありません。\n`;
        }
      }
    } catch (e) {
      summary += '\n### ⚠️ postProcess情報の読み取りエラー\n\n';
      summary += `エラー: ${e}\n`;
    }

    return summary;
  }

  /**
   * コンテキストを保存
   */
  private static saveContext(): void {
    if (!this.currentContext) return;

    try {
      const data = {
        traceId: this.currentContext.traceId,
        spans: Array.from(this.currentContext.spans.entries()),
        activeSpanId: this.currentContext.activeSpanId,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage失敗は無視
    }
  }

  /**
   * コンテキストを復元
   */
  static restoreContext(): TraceContext | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      this.currentContext = {
        traceId: data.traceId,
        spans: new Map(data.spans),
        activeSpanId: data.activeSpanId,
      };

      return this.currentContext;
    } catch {
      return null;
    }
  }

  /**
   * トレースをクリア
   */
  static clearTrace(): void {
    this.currentContext = null;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // localStorage失敗は無視
    }
  }
}
