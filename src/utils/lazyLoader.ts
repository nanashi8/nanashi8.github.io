/**
 * 重いコンポーネントの初期化遅延を最小化するユーティリティ
 */
import type React from 'react';

// GrammarQuizView と ComprehensiveReadingView の初期化時間を削減
// キャッシュしてメモリにロード

let grammarQuizViewCache: React.ComponentType<object> | null = null;
let comprehensiveReadingViewCache: React.ComponentType<object> | null = null;

/**
 * GrammarQuizView を遅延ロード（キャッシュして再利用）
 */
export async function loadGrammarQuizView() {
  if (grammarQuizViewCache) {
    return grammarQuizViewCache;
  }
  const module = await import('../components/GrammarQuizView');
  grammarQuizViewCache = module.default;
  return grammarQuizViewCache;
}

/**
 * ComprehensiveReadingView を遅延ロード（キャッシュして再利用）
 */
export async function loadComprehensiveReadingView() {
  if (comprehensiveReadingViewCache) {
    return comprehensiveReadingViewCache;
  }
  const module = await import('../components/ComprehensiveReadingView');
  comprehensiveReadingViewCache = module.default;
  return comprehensiveReadingViewCache;
}

/**
 * アイドル時間にコンポーネントをプリロード
 */
export function preloadHeavyComponents() {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      loadGrammarQuizView();
      loadComprehensiveReadingView();
    });
  } else {
    // フォールバック
    setTimeout(() => {
      loadGrammarQuizView();
      loadComprehensiveReadingView();
    }, 2000);
  }
}
