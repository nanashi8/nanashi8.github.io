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
  static startSpan(
    name: string,
    attributes: SpanAttributes,
    parentSpanId?: string
  ): string {
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
      lostWords.forEach(lost => {
        console.warn(
          `   - ${lost.word}: 最後に確認 → ${lost.lastSeenSpan} ` +
          `(${lost.lastSeenCount}語中)`
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
    
    let summary = '## 🎫 データフロー追跡（スパンベース）\n\n';
    summary += '| スパン | 開始時刻 | 所要時間 | まだまだ語 | 状態 |\n';
    summary += '|---|---|---|---|---|\n';
    
    let prevCount = -1;
    for (const span of spans) {
      const duration = span.endTime ? `${(span.endTime - span.startTime).toFixed(2)}ms` : '実行中';
      const timeStr = new Date(Date.now() - performance.now() + span.startTime)
        .toISOString()
        .split('T')[1];
      const count = span.attributes.weakWordsCount;
      
      let status = '✅ 正常';
      if (prevCount !== -1) {
        if (count === 0 && prevCount > 0) {
          status = '❌ 消失';
        } else if (count < prevCount) {
          status = '⚠️ 減少';
        }
      }
      prevCount = count;
      
      summary += `| ${span.name} | ${timeStr} | ${duration} | ${count}語 | ${status} |\n`;
    }
    
    // 消失した単語のリスト
    const lostWords = this.detectLostWords(spans);
    if (lostWords.length > 0) {
      summary += '\n### ❌ 消失した単語\n\n';
      lostWords.slice(0, 10).forEach(lost => {
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
      summary += '以下の単語が処理中に消失しました：\n\n';
      
      // スパン間の差分を計算
      for (let i = 0; i < spans.length - 1; i++) {
        const currentWords = new Set(spans[i].attributes.weakWords || []);
        const nextWords = new Set(spans[i + 1].attributes.weakWords || []);
        
        const disappeared = [...currentWords].filter(w => !nextWords.has(w));
        if (disappeared.length > 0) {
          summary += `\n**${spans[i].name} → ${spans[i + 1].name}**:\n`;
          summary += `- 消失: ${disappeared.slice(0, 5).join(', ')}`;
          if (disappeared.length > 5) {
            summary += ` (+${disappeared.length - 5}語)`;
          }
          summary += '\n';
        }
      }
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
