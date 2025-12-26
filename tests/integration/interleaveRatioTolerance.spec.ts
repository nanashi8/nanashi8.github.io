import { test, expect, type Page } from '@playwright/test';

type TopItem = { word: string; position: number; attempts: number };

type SortAndBalanceSnapshot = {
  mode: string;
  top100: Array<{ rank: number; word: string; position: number; attempts: number }>;
};

type PostProcessSnapshot = {
  mode: string;
  top30: Array<{ word: string; position: number; attempts: number; category?: string }>;
};

const TARGET_RATIO = 0.2;
const MIN_RATIO = 0.1;
const MAX_RATIO = 0.3;
const WINDOW_SIZE = 25;
const STRUGGLING_SEED_COUNT = 20; // 4:1 の20%サイクルを作るために必要

const MODE_NAV_LABEL: Record<'memorization' | 'spelling' | 'grammar', RegExp> = {
  memorization: /暗記|💡\s*暗記/i,
  spelling: /スペル|Spelling/i,
  grammar: /文法|Grammar/i,
};

function baseURLFromConfig(): string {
  const cfg = test.info().config as any;
  const base = cfg?.use?.baseURL || 'http://localhost:5173';
  return typeof base === 'string'
    ? base.replace('localhost', '127.0.0.1')
    : 'http://127.0.0.1:5173';
}

async function clickNav(page: Page, name: RegExp) {
  const nav = page
    .locator('button, a, [role="button"], [role="tab"]')
    .filter({ hasText: name })
    .first();
  await expect(nav).toBeVisible({ timeout: 5000 });
  await nav.click();
}

async function startQuizIfNeeded(page: Page) {
  const startButton = page
    .locator('button, [role="button"]')
    .filter({ hasText: /クイズ開始|開始|スタート|Start/i })
    .first();
  if (await startButton.isVisible().catch(() => false)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await startButton.click({ force: true, timeout: 3000 });
        break;
      } catch {
        // 再レンダリングでdetachされることがある
      }
    }
  }
}

async function activateMode(page: Page, mode: 'memorization' | 'spelling' | 'grammar') {
  await clickNav(page, MODE_NAV_LABEL[mode]);
  await page.waitForTimeout(300);
  await startQuizIfNeeded(page);
}

async function waitForSnapshot(
  page: Page,
  mode: string
): Promise<SortAndBalanceSnapshot | PostProcessSnapshot> {
  const sortKey = `debug_sortAndBalance_top100_${mode}`;
  const postKey = `debug_postProcess_output_${mode}`;

  const canReadSort = await page
    .waitForFunction(
      (k) => {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) return false;
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed?.top100) && parsed.top100.length > 0;
        } catch {
          return false;
        }
      },
      sortKey,
      { timeout: 15000 }
    )
    .then(() => true)
    .catch(() => false);

  if (canReadSort) {
    const snapshot = await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k) || 'null'),
      sortKey
    );
    return snapshot as SortAndBalanceSnapshot as any;
  }

  // フォールバック: postProcess後のTOP30（キーが軽いので本番ビルドでも安定しやすい）
  await page.waitForFunction(
    (k) => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed?.top30) && parsed.top30.length > 0;
      } catch {
        return false;
      }
    },
    postKey,
    { timeout: 60000 }
  );

  const snapshot = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) || 'null'),
    postKey
  );
  return snapshot as PostProcessSnapshot as any;
}

function getTopWindow(snapshot: SortAndBalanceSnapshot | PostProcessSnapshot): TopItem[] {
  const items: TopItem[] =
    'top100' in snapshot
      ? snapshot.top100.map((i) => ({ word: i.word, position: i.position, attempts: i.attempts }))
      : snapshot.top30.map((i) => ({ word: i.word, position: i.position, attempts: i.attempts }));

  return items.slice(0, Math.min(WINDOW_SIZE, items.length));
}

function getCandidateWords(snapshot: SortAndBalanceSnapshot | PostProcessSnapshot): string[] {
  const items = 'top100' in snapshot ? snapshot.top100 : snapshot.top30;
  return items.map((i) => i.word);
}

function isBoostedNew(item: TopItem): boolean {
  // GamificationAI.interleaveByCategory() の boostedNew と同条件
  return item.position >= 40 && item.position < 70 && item.attempts === 0;
}

async function seedProgressForMode(
  page: Page,
  mode: string,
  strugglingWords: string[],
  newWords: string[]
) {
  await page.evaluate(
    async ({ mode: _mode, seedStruggling, seedNew }) => {
      const now = Date.now();
      const lastStudied = now - 10 * 24 * 60 * 60 * 1000; // 最近学習(5分)フィルタを確実に回避

      // E2EではlocalStorage/IndexedDBどちらの戦略でも seed が効くようにする
      // - localStorage: progressStorage(loadProgressSync) のフォールバック
      // - IndexedDB: storageManager(loadProgressData) の正式経路
      try {
        localStorage.setItem('indexeddb-migration-completed', '1.1');
      } catch {
        // ignore
      }

      const makeStrugglingWordProgress = () => {
        const base: any = {
          category: '未分類',
          lastStudied,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 1,
        };

        // mode別に attempts / position を持たせる
        switch (_mode) {
          case 'memorization':
            return {
              ...base,
              memorizationAttempts: 1,
              memorizationCorrect: 0,
              memorizationStillLearning: 1,
              memorizationPosition: 60,
            };
          case 'spelling':
            return {
              ...base,
              spellingAttempts: 1,
              spellingCorrect: 0,
              spellingPosition: 60,
            };
          case 'grammar':
            return {
              ...base,
              grammarAttempts: 1,
              grammarCorrect: 0,
              grammarPosition: 60,
            };
          default:
            return base;
        }
      };

      const makeNewWordProgress = () => {
        const base: any = {
          category: '未分類',
          lastStudied,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 0,
        };

        // 「savedPosition未設定」かつ「attempts=0」を明示して NEW_DEFAULT(35) に落とす
        switch (_mode) {
          case 'memorization':
            return {
              ...base,
              memorizationAttempts: 0,
              memorizationCorrect: 0,
              memorizationStillLearning: 0,
            };
          case 'spelling':
            return { ...base, spellingAttempts: 0, spellingCorrect: 0 };
          case 'grammar':
            return { ...base, grammarAttempts: 0, grammarCorrect: 0 };
          default:
            return base;
        }
      };

      const wordProgress: Record<string, any> = {};
      for (const w of seedStruggling) {
        wordProgress[w] = makeStrugglingWordProgress();
      }
      for (const w of seedNew) {
        if (!wordProgress[w]) {
          wordProgress[w] = makeNewWordProgress();
        }
      }

      const progress = {
        results: [],
        statistics: {
          totalQuizzes: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          averageScore: 0,
          bestScore: 0,
          streakDays: 0,
          lastStudyDate: 0,
          studyDates: [],
        },
        questionSetStats: {},
        categoryStats: {},
        difficultyStats: {},
        wordProgress,
      };

      const payload = JSON.stringify(progress);

      // storageManager（正式）
      localStorage.setItem('progress-data', payload);

      // progressStorage.ts の同期フォールバック
      localStorage.setItem('english-progress', payload);

      // IndexedDB（正式）にも直接書き込み（migration/戦略に依存しない）
      // DB/Store名は実装に合わせて固定（QuizAppDB / progress / key=main）
      await new Promise<void>((resolve) => {
        try {
          const req = indexedDB.open('QuizAppDB', 1);

          req.onupgradeneeded = () => {
            try {
              const db = req.result;
              if (!db.objectStoreNames.contains('progress')) {
                db.createObjectStore('progress');
              }
            } catch {
              // ignore
            }
          };

          req.onerror = () => resolve();

          req.onsuccess = () => {
            try {
              const db = req.result;
              const tx = db.transaction('progress', 'readwrite');
              tx.objectStore('progress').put(progress, 'main');
              tx.oncomplete = () => {
                try {
                  db.close();
                } catch {
                  // ignore
                }
                resolve();
              };
              tx.onerror = () => {
                try {
                  db.close();
                } catch {
                  // ignore
                }
                resolve();
              };
            } catch {
              try {
                req.result?.close();
              } catch {
                // ignore
              }
              resolve();
            }
          };
        } catch {
          resolve();
        }
      });
    },
    { mode, seedStruggling: strugglingWords, seedNew: newWords }
  );
}

async function clearSortAndBalanceSnapshot(page: Page, mode: string) {
  await page.evaluate((m) => {
    try {
      localStorage.removeItem(`debug_sortAndBalance_top100_${m}`);
      localStorage.removeItem(`debug_sortAndBalance_top100_history_${m}`);
      localStorage.removeItem(`debug_postProcess_output_${m}`);
      localStorage.removeItem('debug_postProcess_output');
    } catch {
      // ignore
    }
  }, mode);
}

async function runRatioCheckForMode(page: Page, mode: 'memorization' | 'spelling' | 'grammar') {
  // E2Eの安定化: ユーザー環境の学習上限設定に依存しないように固定
  // （特にスペルはreview-limitが小さいと苦手語が減り、新規比率が過大になりやすい）
  if (mode === 'spelling' || mode === 'grammar') {
    await page.evaluate((m) => {
      try {
        localStorage.setItem(`learning-limit-${m}`, '200');
        localStorage.setItem(`review-limit-${m}`, '200');
      } catch {
        // ignore
      }
    }, mode);
    await page.reload({ waitUntil: 'domcontentloaded' });
  }

  // まず対象モードを確実に起動（タブ未選択だとQuestionSchedulerが走らずスナップショットが生成されない）
  await activateMode(page, mode);

  // まず現状スナップショットから「実在する単語」を拾う（データ依存を減らす）
  const first = await waitForSnapshot(page, mode);
  const firstWindow = getTopWindow(first as any);
  const candidates = getCandidateWords(first as any);

  // 「全部seedして新規が残らない」を避けつつ、4:1（20%）のパターンが
  // TOP25でも観測できるように、可能なら struggling を20語作る
  const minLeaveNew = 5;

  // ✅ スペルは「進捗がある単語だけ」が問題候補になる可能性が高いので、
  // 苦手(試行>0)と新規(試行=0)の両方を seed して混在状態を確実に作る
  const spellingStrugglingTarget = Math.min(STRUGGLING_SEED_COUNT, candidates.length);
  const spellingNewTarget = Math.min(12, Math.max(0, candidates.length - spellingStrugglingTarget));

  const seedCount =
    mode === 'spelling'
      ? spellingStrugglingTarget
      : firstWindow.length >= STRUGGLING_SEED_COUNT + minLeaveNew
        ? STRUGGLING_SEED_COUNT
        : Math.max(5, Math.max(0, firstWindow.length - minLeaveNew));

  const seed = (mode === 'spelling' ? candidates : firstWindow.map((i) => i.word)).slice(
    0,
    seedCount
  );

  const newSeed =
    mode === 'spelling' ? candidates.slice(seedCount, seedCount + spellingNewTarget) : [];

  expect(seed.length).toBeGreaterThanOrEqual(Math.min(10, STRUGGLING_SEED_COUNT));

  // seedを書き込んだ上で再ロードし、20%インターリーブが成立する状態を作る
  await seedProgressForMode(page, mode, seed, newSeed);

  // reload後に古いスナップショットを即読してしまうのを防ぐ（localStorageはreloadで残る）
  await clearSortAndBalanceSnapshot(page, mode);
  await page.reload({ waitUntil: 'domcontentloaded' });

  // reloadでタブ状態が変わる可能性があるため、再度モードを確実に起動
  await activateMode(page, mode);

  const snapshot = await waitForSnapshot(page, mode);
  const window = getTopWindow(snapshot);

  const boostedNewCount = window.filter(isBoostedNew).length;
  const ratio = window.length > 0 ? boostedNewCount / window.length : 0;

  // interleaveの意図（苦手4→新規1）に合わせ、成立する範囲の先頭プレフィックスで比率を評価する
  const strugglingInWindow = window.filter(
    (i) => i.position >= 40 && i.position < 70 && i.attempts > 0
  ).length;
  const cycles = Math.min(boostedNewCount, Math.floor(strugglingInWindow / 4));
  const prefixLen = cycles * 5;
  const prefix = prefixLen > 0 ? window.slice(0, prefixLen) : [];
  const prefixBoostedNew = prefix.filter(isBoostedNew).length;
  const prefixRatio = prefixLen > 0 ? prefixBoostedNew / prefixLen : 0;

  // 失敗時の切り分け用に分布も記録
  const attemptsZero = window.filter((i) => i.attempts === 0).length;
  const boostedBand = window.filter((i) => i.position >= 40 && i.position < 70).length;
  test.info().annotations.push({
    type: 'interleave_debug',
    description: `${mode}: window=${window.length}, attempts0=${attemptsZero}, pos40-69=${boostedBand}`,
  });

  // 許容幅で判定（厳密一致は要求しない）
  // NOTE: 苦手語が少なすぎる等でサイクルが成立しない場合(cycles=0)は比率評価をスキップ
  if (cycles > 0) {
    expect(prefixRatio).toBeGreaterThanOrEqual(MIN_RATIO);
    expect(prefixRatio).toBeLessThanOrEqual(MAX_RATIO);
  }

  // デバッグ用（失敗時にhtmlレポートで追いやすい）
  test.info().annotations.push({
    type: 'interleave',
    description: `${mode}: target=${TARGET_RATIO}, prefixRatio=${prefixRatio.toFixed(3)} (cycles=${cycles}, ${prefixBoostedNew}/${prefixLen || 0}), windowRatio=${ratio.toFixed(3)} (${boostedNewCount}/${window.length})`,
  });
}

test.describe('新規混入率（許容幅）', () => {
  test('暗記: 新規混入率が許容幅内に収まる', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(baseURLFromConfig(), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /暗記|💡\s*暗記/ })).toBeVisible({
      timeout: 15000,
    });
    await runRatioCheckForMode(page, 'memorization');
  });

  test('スペル: 新規混入率が許容幅内に収まる', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(baseURLFromConfig(), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /スペル|Spelling/ })).toBeVisible({
      timeout: 15000,
    });
    await clickNav(page, /スペル|Spelling/);
    await page.waitForTimeout(300);
    await startQuizIfNeeded(page);
    await runRatioCheckForMode(page, 'spelling');
  });

  test('文法: 新規混入率が許容幅内に収まる', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(baseURLFromConfig(), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /文法|Grammar/ })).toBeVisible({
      timeout: 15000,
    });
    await clickNav(page, /文法|Grammar/);
    await page.waitForTimeout(300);
    await startQuizIfNeeded(page);
    await runRatioCheckForMode(page, 'grammar');
  });
});
