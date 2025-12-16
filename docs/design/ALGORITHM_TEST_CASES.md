# アルゴリズムテストケース定義
**バージョン**: 1.0  
**作成日**: 2025年12月16日  
**目的**: フェーズ判定と記憶獲得アルゴリズムの包括的テストケース

---

## 1. フェーズ判定アルゴリズム - テストケース

### 1.1 ENCODING フェーズ判定（10ケース）

#### TC1.1: 初見単語
```typescript
test('初見単語はENCODINGフェーズ', () => {
  const status: QuestionStatus = {
    word: 'apple',
    reviewCount: 0,
    correctCount: 0,
    wrongCount: 0,
    lastReviewTime: 0,
    // ... その他のプロパティ
  };
  
  const result = detectPhaseWithReason('apple', status);
  
  expect(result.phase).toBe(LearningPhase.ENCODING);
  expect(result.matchedCondition).toBe(1);
  expect(result.reason).toContain('初見単語');
});
```

#### TC1.2: 作業記憶段階（30秒以内）
```typescript
test('30秒以内の単語はENCODINGフェーズ', () => {
  const now = Date.now();
  const status: QuestionStatus = {
    word: 'book',
    reviewCount: 1,
    correctCount: 1,
    wrongCount: 0,
    lastReviewTime: now - 15000, // 15秒前
    // ...
  };
  
  const result = detectPhaseWithReason('book', status);
  
  expect(result.phase).toBe(LearningPhase.ENCODING);
  expect(result.matchedCondition).toBe(2);
  expect(result.metrics.timeSinceLastReview).toBeLessThan(30000);
});
```

#### TC1.3: 未正答単語
```typescript
test('一度も正答していない単語はENCODINGフェーズ', () => {
  const now = Date.now();
  const status: QuestionStatus = {
    word: 'difficult',
    reviewCount: 5,
    correctCount: 0,
    wrongCount: 5,
    lastReviewTime: now - 86400000, // 1日前
    // ...
  };
  
  const result = detectPhaseWithReason('difficult', status);
  
  expect(result.phase).toBe(LearningPhase.ENCODING);
  expect(result.matchedCondition).toBe(3);
});
```

#### TC1.4: 完全忘却（1-7日、正答率50%未満）
```typescript
test('正答率50%未満でENCODINGにリセット', () => {
  const now = Date.now();
  const status: QuestionStatus = {
    word: 'forgotten',
    reviewCount: 10,
    correctCount: 3, // 30%
    wrongCount: 7,
    lastReviewTime: now - 172800000, // 2日前
    // ...
  };
  
  const result = detectPhaseWithReason('forgotten', status);
  
  expect(result.phase).toBe(LearningPhase.ENCODING);
  expect(result.matchedCondition).toBe(6);
  expect(result.metrics.correctRate).toBeLessThan(0.5);
});
```

#### TC1.5: 超長期放置（1000日以上）
```typescript
test('1000日以上放置された単語は完全リセット', () => {
  const now = Date.now();
  const status: QuestionStatus = {
    word: 'ancient',
    reviewCount: 50,
    correctCount: 40,
    wrongCount: 10,
    lastReviewTime: now - 86400000 * 1001, // 1001日前
    // ...
  };
  
  const result = detectPhaseWithReason('ancient', status);
  
  expect(result.phase).toBe(LearningPhase.ENCODING);
  expect(result.metrics.daysSinceLastReview).toBeGreaterThan(1000);
});
```

#### TC1.6-1.10: その他のエッジケース
```typescript
test('超高頻度誤答（100回以上連続）でリセット', () => {
  // TC1.6
});

test('応答時間0msの異常値処理', () => {
  // TC1.7
});

test('未来のタイムスタンプの異常値処理', () => {
  // TC1.8
});

test('境界値: 正確に30秒後', () => {
  // TC1.9
});

test('境界値: 正確に50%の正答率', () => {
  // TC1.10
});
```

---

### 1.2 INITIAL_CONSOLIDATION フェーズ判定（5ケース）

#### TC2.1: 初回正答後30分
```typescript
test('初回正答後30分はINITIAL_CONSOLIDATION', () => {
  const now = Date.now();
  const status: QuestionStatus = {
    word: 'car',
    reviewCount: 2,
    correctCount: 1,
    wrongCount: 1,
    lastCorrectTime: now - 1800000, // 30分前
    lastReviewTime: now - 100000,
    // ...
  };
  
  const result = detectPhaseWithReason('car', status);
  
  expect(result.phase).toBe(LearningPhase.INITIAL_CONSOLIDATION);
  expect(result.matchedCondition).toBe(4);
});
```

#### TC2.2: 初回正答後59分59秒（境界値）
```typescript
test('初回正答後59分59秒はまだINITIAL_CONSOLIDATION', () => {
  // TC2.2
});
```

#### TC2.3: 初回正答後1時間1秒（境界値超え）
```typescript
test('初回正答後1時間1秒はINITIAL_CONSOLIDATION卒業', () => {
  // TC2.3
});
```

#### TC2.4-2.5: その他のケース
```typescript
test('1回正答でも1時間経過していればINITIAL_CONSOLIDATION卒業', () => {
  // TC2.4
});

test('correctCount=1でも同日内2回目の正答でINTRADAY_REVIEWへ', () => {
  // TC2.5
});
```

---

### 1.3 INTRADAY_REVIEW フェーズ判定（5ケース）

#### TC3.1: 同日内2回正答
```typescript
test('同日内2回正答でINTRADAY_REVIEW', () => {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const status: QuestionStatus = {
    word: 'learn',
    reviewCount: 3,
    correctCount: 2,
    wrongCount: 1,
    lastCorrectTime: today.getTime() + 3600000, // 今日の1時間後
    lastReviewTime: now,
    // ...
  };
  
  const result = detectPhaseWithReason('learn', status);
  
  expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
  expect(result.matchedCondition).toBe(5);
});
```

#### TC3.2: 同日内3回正答
```typescript
test('同日内3回正答でもINTRADAY_REVIEW（翌日まで）', () => {
  // TC3.2
});
```

#### TC3.3: 前日の正答（境界値）
```typescript
test('前日23:59の正答は今日0:00には同日扱いしない', () => {
  // TC3.3
});
```

#### TC3.4-3.5: その他のケース
```typescript
test('同日内でもcorrectCount=1ならINTRADAY_REVIEWではない', () => {
  // TC3.4
});

test('同日内5回正答でもINTRADAY_REVIEW（記憶獲得完了）', () => {
  // TC3.5
});
```

---

### 1.4 SHORT_TERM フェーズ判定（10ケース）

#### TC4.1: 1日後、正答率60%
```typescript
test('1日後、正答率60%でSHORT_TERM', () => {
  const now = Date.now();
  const status: QuestionStatus = {
    word: 'remember',
    reviewCount: 10,
    correctCount: 6,
    wrongCount: 4,
    lastReviewTime: now - 86400000, // 1日前
    // ...
  };
  
  const result = detectPhaseWithReason('remember', status);
  
  expect(result.phase).toBe(LearningPhase.SHORT_TERM);
  expect(result.matchedCondition).toBe(6);
  expect(result.metrics.daysSinceLastReview).toBeGreaterThanOrEqual(1);
  expect(result.metrics.correctRate).toBeGreaterThanOrEqual(0.5);
  expect(result.metrics.correctRate).toBeLessThan(0.8);
});
```

#### TC4.2: 3日後、正答率70%
```typescript
test('3日後、正答率70%でSHORT_TERM', () => {
  // TC4.2
});
```

#### TC4.3: 7日後、正答率75%
```typescript
test('7日後、正答率75%でSHORT_TERM', () => {
  // TC4.3
});
```

#### TC4.4: 境界値 - 正確に1日後
```typescript
test('正確に24時間後はSHORT_TERM', () => {
  // TC4.4
});
```

#### TC4.5: 境界値 - 正確に7日後
```typescript
test('正確に7日後、正答率79.9%はSHORT_TERM', () => {
  // TC4.5
});
```

#### TC4.6: 10日後、正答率60%（7日超え）
```typescript
test('10日後、正答率60%でもSHORT_TERM（80%未満）', () => {
  // TC4.6
});
```

#### TC4.7-4.10: その他のケース
```typescript
test('30日後、正答率70%でもSHORT_TERM', () => {
  // TC4.7
});

test('1日後、正答率50%ちょうどでSHORT_TERM', () => {
  // TC4.8
});

test('7日後、正答率80%ちょうどならLONG_TERM候補', () => {
  // TC4.9
});

test('デフォルト判定でSHORT_TERM', () => {
  // TC4.10
});
```

---

### 1.5 LONG_TERM フェーズ判定（10ケース）

#### TC5.1: 10日後、正答率90%、応答1秒
```typescript
test('10日後、正答率90%、応答1秒でLONG_TERM', () => {
  const now = Date.now();
  const status: QuestionStatus = {
    word: 'master',
    reviewCount: 20,
    correctCount: 18,
    wrongCount: 2,
    lastReviewTime: now - 86400000 * 10, // 10日前
    averageResponseTime: 1000, // 1秒
    // ...
  };
  
  const result = detectPhaseWithReason('master', status);
  
  expect(result.phase).toBe(LearningPhase.LONG_TERM);
  expect(result.matchedCondition).toBe(7);
  expect(result.metrics.daysSinceLastReview).toBeGreaterThan(7);
  expect(result.metrics.correctRate).toBeGreaterThanOrEqual(0.8);
  expect(result.metrics.averageResponseTime).toBeLessThan(1500);
});
```

#### TC5.2: 30日後、正答率95%、応答0.5秒
```typescript
test('30日後、正答率95%、応答0.5秒でLONG_TERM', () => {
  // TC5.2
});
```

#### TC5.3: 100日後、正答率85%、応答1.2秒
```typescript
test('100日後、正答率85%、応答1.2秒でLONG_TERM', () => {
  // TC5.3
});
```

#### TC5.4: 境界値 - 正確に7日1秒後
```typescript
test('7日1秒後、正答率80%、応答1.4秒でLONG_TERM', () => {
  // TC5.4
});
```

#### TC5.5: 境界値 - 応答時間1.5秒（ギリギリアウト）
```typescript
test('7日後、正答率80%でも応答1.5秒以上はSHORT_TERM', () => {
  // TC5.5
});
```

#### TC5.6: 超高頻度正答（100回連続）
```typescript
test('100回連続正答で確実にLONG_TERM', () => {
  // TC5.6
});
```

#### TC5.7-5.10: その他のケース
```typescript
test('365日後、正答率100%でLONG_TERM', () => {
  // TC5.7
});

test('10日後、正答率80%ちょうど、応答1.49秒でLONG_TERM', () => {
  // TC5.8
});

test('7日後、正答率85%でも応答3秒ならSHORT_TERM', () => {
  // TC5.9
});

test('10日後、正答率75%でSHORT_TERM（80%未満）', () => {
  // TC5.10
});
```

---

### 1.6 フェーズ遷移テスト（5ケース）

#### TC6.1: 正常な学習フロー
```typescript
test('正常な学習フロー: ENCODING → ... → LONG_TERM', () => {
  // 初見
  let result = detectPhase('word1', createStatus(0, 0, 0, now));
  expect(result.phase).toBe(LearningPhase.ENCODING);
  
  // 1回正答後30分
  result = detectPhase('word1', createStatus(1, 1, 0, now - 1800000));
  expect(result.phase).toBe(LearningPhase.INITIAL_CONSOLIDATION);
  
  // 同日2回正答
  result = detectPhase('word1', createStatus(2, 2, 0, now));
  expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
  
  // 3日後、正答率70%
  result = detectPhase('word1', createStatus(10, 7, 3, now - 86400000 * 3));
  expect(result.phase).toBe(LearningPhase.SHORT_TERM);
  
  // 30日後、正答率90%、応答1秒
  result = detectPhase('word1', createStatus(20, 18, 2, now - 86400000 * 30, 1000));
  expect(result.phase).toBe(LearningPhase.LONG_TERM);
});
```

#### TC6.2: 忘却による退行フロー
```typescript
test('忘却による退行: LONG_TERM → ENCODING', () => {
  // TC6.2
});
```

#### TC6.3-6.5: その他のフロー
```typescript
test('高速学習フロー（スキップあり）', () => {
  // TC6.3
});

test('停滞フロー（INTRADAY_REVIEWで長期停滞）', () => {
  // TC6.4
});

test('ジグザグフロー（進んだり戻ったり）', () => {
  // TC6.5
});
```

---

## 2. 記憶獲得アルゴリズム - テストケース

### 2.1 キューエンキュー処理（10ケース）

#### TC7.1: 新規単語の即時キュー追加（難易度4）
```typescript
test('難易度4の新規単語は即時キューに追加', () => {
  const manager = new AcquisitionQueueManager();
  manager.enqueueNewWord('difficult', 4, QuestionCategory.MEMORIZATION);
  
  const stats = manager.getQueueStatistics();
  
  expect(stats.immediate.size).toBe(1);
  expect(stats.early.size).toBe(0);
});
```

#### TC7.2: 新規単語の即時キュー追加（難易度2）
```typescript
test('難易度2の新規単語はキュー追加をスキップ', () => {
  // TC7.2
});
```

#### TC7.3: 即時復習成功後の早期キュー追加
```typescript
test('即時復習で正答すると早期キューに自動昇格', () => {
  const manager = new AcquisitionQueueManager();
  manager.enqueueNewWord('word1', 4, QuestionCategory.MEMORIZATION);
  
  // 即時復習で正答
  manager.handleCorrectAnswer('word1', QueueType.IMMEDIATE);
  
  const stats = manager.getQueueStatistics();
  expect(stats.immediate.size).toBe(0);
  expect(stats.early.size).toBe(1);
});
```

#### TC7.4: 早期復習成功後の中期キュー追加
```typescript
test('早期復習で正答すると中期キューに自動昇格', () => {
  // TC7.4
});
```

#### TC7.5: 中期復習成功後の終了時キュー追加
```typescript
test('中期復習で正答すると終了時キューに自動昇格', () => {
  // TC7.5
});
```

#### TC7.6-7.10: その他のエンキューケース
```typescript
test('キューサイズ上限到達時の古いエントリ削除', () => {
  // TC7.6
});

test('重複エンキューの防止', () => {
  // TC7.7
});

test('難易度による間隔調整', () => {
  // TC7.8
});

test('カテゴリによる間隔調整', () => {
  // TC7.9
});

test('個人パラメータによる間隔調整', () => {
  // TC7.10
});
```

---

### 2.2 キューデキュー処理（10ケース）

#### TC8.1: 即時キューから問題数ベースでデキュー
```typescript
test('3問経過で即時キューからデキュー', () => {
  const manager = new AcquisitionQueueManager();
  manager.enqueueNewWord('word1', 3, QuestionCategory.MEMORIZATION);
  
  // 3問出題
  manager.incrementQuestionNumber();
  manager.incrementQuestionNumber();
  manager.incrementQuestionNumber();
  
  const next = manager.getNextReviewQuestion();
  
  expect(next).not.toBeNull();
  expect(next!.word).toBe('word1');
  expect(next!.queueType).toBe(QueueType.IMMEDIATE);
});
```

#### TC8.2: 即時キューから時間ベースでデキュー
```typescript
test('1分経過で即時キューからデキュー', async () => {
  // TC8.2（モックタイマー使用）
});
```

#### TC8.3: 優先度順のデキュー
```typescript
test('複数キューに候補がある場合、優先度順にデキュー', () => {
  const manager = new AcquisitionQueueManager();
  
  // 即時キュー（優先度100）
  manager.queues.immediate.push(createQueueEntry('word1', QueueType.IMMEDIATE, 100));
  
  // 早期キュー（優先度80）
  manager.queues.early.push(createQueueEntry('word2', QueueType.EARLY, 80));
  
  const next = manager.getNextReviewQuestion();
  
  expect(next!.word).toBe('word1'); // 優先度が高い方
});
```

#### TC8.4-8.10: その他のデキューケース
```typescript
test('キューが空の場合はnullを返す', () => {
  // TC8.4
});

test('デキュー後はキューから削除される', () => {
  // TC8.5
});

test('早期キューから問題数ベースでデキュー', () => {
  // TC8.6
});

test('中期キューから時間ベースでデキュー', () => {
  // TC8.7
});

test('複数の候補から最も緊急度の高いものを選択', () => {
  // TC8.8
});

test('終了時キューはセッション終了時のみデキュー', () => {
  // TC8.9
});

test('期限切れエントリの自動削除', () => {
  // TC8.10
});
```

---

### 2.3 復習結果トラッキング（10ケース）

#### TC9.1: 正答時の進捗更新
```typescript
test('正答時にtodayCorrectCountが増加', () => {
  const manager = new AcquisitionQueueManager();
  const progress = manager.getAcquisitionProgress('word1');
  
  manager.handleCorrectAnswer('word1', QueueType.IMMEDIATE);
  
  const updatedProgress = manager.getAcquisitionProgress('word1');
  expect(updatedProgress.todayCorrectCount).toBe(progress.todayCorrectCount + 1);
});
```

#### TC9.2: 誤答時の進捗更新
```typescript
test('誤答時にtodayWrongCountが増加', () => {
  // TC9.2
});
```

#### TC9.3: 記憶獲得完了判定（3回正答）
```typescript
test('3回正答で記憶獲得完了', () => {
  const manager = new AcquisitionQueueManager();
  
  manager.handleCorrectAnswer('word1', QueueType.IMMEDIATE);
  expect(manager.getAcquisitionProgress('word1').isAcquisitionComplete).toBe(false);
  
  manager.handleCorrectAnswer('word1', QueueType.EARLY);
  expect(manager.getAcquisitionProgress('word1').isAcquisitionComplete).toBe(false);
  
  manager.handleCorrectAnswer('word1', QueueType.MID);
  expect(manager.getAcquisitionProgress('word1').isAcquisitionComplete).toBe(true);
});
```

#### TC9.4: 誤答時の即時キュー再追加
```typescript
test('誤答すると即時キューに戻される', () => {
  // TC9.4
});
```

#### TC9.5-9.10: その他のトラッキングケース
```typescript
test('todayReviews配列に正答が記録される', () => {
  // TC9.5
});

test('todayReviews配列に誤答が記録される', () => {
  // TC9.6
});

test('3つの異なるキューを通過して記憶獲得完了', () => {
  // TC9.7
});

test('最後の2回が連続正答で記憶獲得完了', () => {
  // TC9.8
});

test('個人パラメータによる完了閾値調整', () => {
  // TC9.9
});

test('同じキューでの複数回正答でも昇格', () => {
  // TC9.10
});
```

---

### 2.4 セッション終了時処理（5ケース）

#### TC10.1: 終了時復習の実施
```typescript
test('終了時復習キューの問題を全て出題', () => {
  const manager = new AcquisitionQueueManager();
  
  manager.queues.end.push(createQueueEntry('word1', QueueType.END, 40));
  manager.queues.end.push(createQueueEntry('word2', QueueType.END, 40));
  
  const endReview = manager.startSessionEndReview();
  
  expect(endReview.length).toBe(2);
});
```

#### TC10.2-10.5: その他の終了時処理
```typescript
test('記憶獲得レポート生成', () => {
  // TC10.2
});

test('未完了単語のリスト表示', () => {
  // TC10.3
});

test('完了率の計算', () => {
  // TC10.4
});

test('終了時キューが空の場合の処理', () => {
  // TC10.5
});
```

---

### 2.5 エラーハンドリングとエッジケース（10ケース）

#### TC11.1: 無限ループの防止
```typescript
test('同じ単語を10回以上試行できない', () => {
  const manager = new AcquisitionQueueManager();
  
  for (let i = 0; i < 10; i++) {
    manager.handleWrongAnswer('difficult', QueueType.IMMEDIATE);
  }
  
  // 11回目は無視される
  const canContinue = manager.trackWordAttempts('difficult');
  expect(canContinue).toBe(false);
});
```

#### TC11.2-11.10: その他のエラーケース
```typescript
test('重複エンキューの防止', () => {
  // TC11.2
});

test('期限切れエントリの自動削除', () => {
  // TC11.3
});

test('キューサイズ上限超過時の処理', () => {
  // TC11.4
});

test('存在しない単語のデキュー試行', () => {
  // TC11.5
});

test('負の難易度値の処理', () => {
  // TC11.6
});

test('未来のタイムスタンプの処理', () => {
  // TC11.7
});

test('NaN応答時間の処理', () => {
  // TC11.8
});

test('localStorage容量超過時の処理', () => {
  // TC11.9
});

test('データ破損時のリカバリー', () => {
  // TC11.10
});
```

---

## 3. 統合テストシナリオ（5ケース）

### 3.1 30問学習フロー - 正常パターン
```typescript
test('30問学習フロー: 10語新規、20語復習', () => {
  const manager = new AcquisitionQueueManager();
  
  // 10語の新規単語を順次出題
  for (let i = 1; i <= 10; i++) {
    manager.enqueueNewWord(`word${i}`, 3, QuestionCategory.MEMORIZATION);
    manager.presentQuestion(`word${i}`);
    manager.handleCorrectAnswer(`word${i}`, QueueType.IMMEDIATE);
  }
  
  // 復習問題が自動的に出題される
  let reviewCount = 0;
  for (let i = 11; i <= 30; i++) {
    const next = manager.getNextReviewQuestion();
    if (next) {
      manager.presentQuestion(next.word);
      manager.handleCorrectAnswer(next.word, next.queueType);
      reviewCount++;
    }
  }
  
  expect(reviewCount).toBeGreaterThanOrEqual(15);
  
  // 記憶獲得レポート
  const report = manager.generateAcquisitionReport();
  expect(report.completed).toBeGreaterThanOrEqual(5);
});
```

### 3.2-3.5: その他の統合シナリオ
```typescript
test('30問学習フロー: 高難易度単語が多い', () => {
  // TC3.2
});

test('30問学習フロー: 誤答が多いパターン', () => {
  // TC3.3
});

test('50問学習フロー: 長時間セッション', () => {
  // TC3.4
});

test('10問学習フロー: 短時間セッション', () => {
  // TC3.5
});
```

---

## 4. パフォーマンステスト（5ケース）

### 4.1: 大量データでの性能
```typescript
test('1000語同時管理でも1秒以内に処理', () => {
  const manager = new AcquisitionQueueManager();
  const start = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    manager.enqueueNewWord(`word${i}`, 3, QuestionCategory.MEMORIZATION);
  }
  
  for (let i = 0; i < 1000; i++) {
    manager.getNextReviewQuestion();
  }
  
  const elapsed = performance.now() - start;
  expect(elapsed).toBeLessThan(1000);
});
```

### 4.2-4.5: その他のパフォーマンステスト
```typescript
test('フェーズ判定が1ms以内', () => {
  // TC4.2
});

test('キューデキューが10ms以内', () => {
  // TC4.3
});

test('メモリ使用量が100KB以下', () => {
  // TC4.4
});

test('localStorage読み書きが50ms以内', () => {
  // TC4.5
});
```

---

## 5. テスト実行計画

### 5.1 単体テスト
- フェーズ判定: 45ケース
- 記憶獲得: 45ケース
- **合計**: 90ケース
- **目標カバレッジ**: 95%以上

### 5.2 統合テスト
- 学習フローシナリオ: 5ケース
- **目標**: 全シナリオ成功

### 5.3 パフォーマンステスト
- 5ケース
- **目標**: 全てのパフォーマンス要件達成

### 5.4 手動テスト
- UI統合テスト: 10パターン
- ユーザビリティテスト: 5名

---

**総計**: 110ケース（自動化90 + 統合5 + パフォーマンス5 + 手動10）

**承認**: テストケース定義完了、プロトタイプ実装へ
