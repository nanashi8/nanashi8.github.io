---
canonical: docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md
status: stable
lastUpdated: 2025-12-19
version: 1.0.0
diataxisCategory: reference
references:
  - .aitk/instructions/meta-ai-priority.instructions.md
  - docs/guidelines/META_AI_TROUBLESHOOTING.md
  - docs/guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md
  - docs/specifications/QUESTION_SCHEDULER_SPEC.md
doNotMove: true
---

# QuestionScheduler品質保証パイプライン

**バージョン**: 1.0.0  
**最終更新**: 2025-12-19  
**目的**: 出題機能の品質を保証し、メタAI（QuestionScheduler）の不具合を早期発見するプロセス

---

## 📋 目次

1. [パイプライン概要](#パイプライン概要)
2. [実施タイミング](#実施タイミング)
3. [品質チェックフロー](#品質チェックフロー)
4. [テストケース](#テストケース)
5. [デバッグログ検証](#デバッグログ検証)
6. [リグレッション防止](#リグレッション防止)
7. [継続的監視](#継続的監視)

---

## パイプライン概要

### 目的
- 出題機能の不具合を早期発見
- メタAI（QuestionScheduler）の動作を継続的に検証
- リグレッションを防止
- 品質基準を満たすことを保証

### 対象範囲
- QuestionScheduler（メタAI統合層）
- category管理システム（progressStorage.ts）
- 4タブの出題機能（暗記・和訳・スペル・文法）
- 型定義（types.ts）

---

## 実施タイミング

### 1. コード変更時（必須）
以下のファイルを変更した場合、必ずこのパイプラインを実行：
- `src/ai/scheduler/QuestionScheduler.ts`
- `src/ai/scheduler/types.ts`
- `src/utils/progressStorage.ts`
- `src/components/MemorizationView.tsx`
- `src/components/TranslationView.tsx`
- `src/components/SpellingView.tsx`
- `src/components/GrammarQuizView.tsx`

### 2. 出題不具合報告時（最優先）
ユーザーから以下の報告があった場合、即座に実行：
- 復習単語が出題されない
- 優先度が機能していない
- 出題順序がおかしい

### 3. 定期実施（推奨）
- 毎週1回: 全テストケースを実行
- 毎月1回: 長期動作テスト（セッション時間30分以上）

---

## 品質チェックフロー

```
┌─────────────────────────────────────────────────────┐
│ 1. 静的解析                                         │
│    - 型定義の整合性確認                             │
│    - コードレビュー（category管理、API使用）        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. ユニットテスト                                   │
│    - QuestionScheduler単体テスト                    │
│    - progressStorage単体テスト                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. 統合テスト                                       │
│    - 4タブでの出題動作確認                          │
│    - category管理の連携確認                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. デバッグログ検証                                 │
│    - ブラウザコンソールでログ確認                   │
│    - 優先度計算、category統計、確実性保証           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. 手動テスト                                       │
│    - 実際のユーザーフローでの動作確認               │
│    - 100問貯めてスキップ300回テスト                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. リグレッション確認                               │
│    - 既存の動作が壊れていないか確認                 │
│    - パフォーマンス劣化がないか確認                 │
└─────────────────────────────────────────────────────┘
                        ↓
                    ✅ 品質保証完了
```

---

## テストケース

### 1. QuestionScheduler単体テスト

#### 1.1 シグナル検出テスト
```typescript
describe('detectSignals', () => {
  test('疲労シグナルが正しく検出される', () => {
    const context = {
      sessionMinutes: 25,
      cognitiveLoad: 0.75,
      // ...
    };
    const signals = scheduler.detectSignals(context);
    expect(signals).toContainEqual(
      expect.objectContaining({ type: 'fatigue', confidence: 0.8 })
    );
  });

  test('苦戦シグナルが正しく検出される', () => {
    const context = {
      sessionStats: { errorRate: 0.45 },
      // ...
    };
    const signals = scheduler.detectSignals(context);
    expect(signals).toContainEqual(
      expect.objectContaining({ type: 'struggling', confidence: 0.9 })
    );
  });

  test('過学習シグナルが正しく検出される', () => {
    const context = {
      sessionStats: { consecutiveCorrect: 12 },
      // ...
    };
    const signals = scheduler.detectSignals(context);
    expect(signals).toContainEqual(
      expect.objectContaining({ type: 'overlearning', confidence: 0.75 })
    );
  });

  test('最適状態シグナルが正しく検出される', () => {
    const context = {
      sessionStats: { errorRate: 0.25 },
      // ...
    };
    const signals = scheduler.detectSignals(context);
    expect(signals).toContainEqual(
      expect.objectContaining({ type: 'optimal', confidence: 0.85 })
    );
  });
});
```

#### 1.2 優先度計算テスト
```typescript
describe('scheduleQuestions', () => {
  test('incorrect単語が最優先される', () => {
    const questions = [
      { word: 'abandon', category: 'incorrect' },
      { word: 'accept', category: 'mastered' },
    ];
    const result = scheduler.scheduleQuestions({ questions, ... });
    expect(result.scheduledQuestions[0].word).toBe('abandon');
  });

  test('DTAブーストが正しく適用される', () => {
    // forgettingRisk < 30の場合
    const wordProgress = { lastSeenAt: Date.now() - 1000 * 60 * 60 * 24 * 7 }; // 7日前
    const priority = scheduler.calculatePriority(wordProgress);
    expect(priority).toBeGreaterThanOrEqual(10.0); // DTAブースト10.0
  });

  test('シグナル反映が最大30%に制限される', () => {
    const basePriority = 10.0;
    const signals = [
      { type: 'struggling', confidence: 0.9, action: 'review' }
    ];
    const adjusted = scheduler.applySignals(basePriority, signals, question);
    expect(adjusted).toBeLessThanOrEqual(basePriority * 1.3); // 最大30%
  });
});
```

#### 1.3 確実性保証テスト
```typescript
describe('sortAndBalance', () => {
  test('incorrect単語が上位に強制配置される', () => {
    const questions = [
      { word: 'mastered1', category: 'mastered', priority: 10.0 },
      { word: 'incorrect1', category: 'incorrect', priority: 5.0 }, // 優先度が低くても
    ];
    const sorted = scheduler.sortAndBalance(questions);
    expect(sorted[0].word).toBe('incorrect1'); // incorrect優先
  });

  test('上位20%に復習単語が含まれる', () => {
    const questions = createMixedQuestions(100); // incorrect:10, still_learning:10, その他:80
    const sorted = scheduler.sortAndBalance(questions);
    const top20 = sorted.slice(0, 20);
    const reviewCount = top20.filter(q => 
      q.category === 'incorrect' || q.category === 'still_learning'
    ).length;
    expect(reviewCount).toBeGreaterThan(0); // 少なくとも1問は含まれる
  });
});
```

---

### 2. progressStorage単体テスト

#### 2.1 category初期化テスト
```typescript
describe('initializeWordProgress', () => {
  test('新規単語のcategoryがnewに設定される', () => {
    const wordProgress = initializeWordProgress('abandon');
    expect(wordProgress.category).toBe('new');
  });
});
```

#### 2.2 category更新テスト
```typescript
describe('updateWordProgress', () => {
  test('2回連続不正解でincorrectになる', () => {
    let wp = initializeWordProgress('abandon');
    wp = updateWordProgress(wp, { isCorrect: false });
    wp = updateWordProgress(wp, { isCorrect: false });
    expect(wp.category).toBe('incorrect');
  });

  test('不正解歴がある場合still_learningになる', () => {
    let wp = initializeWordProgress('abandon');
    wp = updateWordProgress(wp, { isCorrect: false });
    wp = updateWordProgress(wp, { isCorrect: true });
    expect(wp.category).toBe('still_learning');
  });

  test('定着判定でmasteredになる', () => {
    let wp = initializeWordProgress('abandon');
    // 定着条件を満たす（連続5回正解など）
    for (let i = 0; i < 5; i++) {
      wp = updateWordProgress(wp, { isCorrect: true });
    }
    expect(wp.category).toBe('mastered');
  });
});
```

#### 2.3 修復処理テスト
```typescript
describe('loadProgress', () => {
  test('categoryがない単語が修復される', () => {
    // categoryがないデータをlocalStorageに保存
    const oldData = { word: 'abandon', consecutiveIncorrect: 3 };
    localStorage.setItem('wordProgress', JSON.stringify([oldData]));
    
    const progress = loadProgress();
    expect(progress.get('abandon').category).toBe('incorrect');
  });
});
```

---

### 3. 統合テスト（4タブ）

#### 3.1 暗記タブ
```typescript
describe('MemorizationView integration', () => {
  test('QuestionSchedulerが正しく呼び出される', () => {
    const spy = jest.spyOn(questionScheduler, 'scheduleQuestions');
    render(<MemorizationView />);
    expect(spy).toHaveBeenCalled();
  });

  test('scheduledQuestionsが正しく使用される', () => {
    const result = questionScheduler.scheduleQuestions(...);
    expect(result).toHaveProperty('scheduledQuestions'); // ✅ 正しい
    expect(result).not.toHaveProperty('questions'); // ❌ 誤り
  });
});
```

#### 3.2 和訳タブ
```typescript
describe('TranslationView integration', () => {
  test('hybridModeで既存AIの順序が尊重される', () => {
    const existingOrder = ['word1', 'word2', 'word3'];
    const result = questionScheduler.scheduleHybridMode({
      questions: existingOrder.map(w => ({ word: w })),
      // ...
    });
    // メタAIは±20%調整のみなので、大幅な順序変更はない
    expect(result.scheduledQuestions[0].word).toBe('word1');
  });
});
```

#### 3.3 スペルタブ
```typescript
describe('SpellingView integration', () => {
  test('useEffect無限ループが発生しない', () => {
    const { rerender } = render(<SpellingView />);
    const renderCount = 0;
    
    // 複数回rerenderしても無限ループにならない
    for (let i = 0; i < 10; i++) {
      rerender(<SpellingView />);
    }
    expect(renderCount).toBeLessThan(20); // 無限ループでない
  });
});
```

#### 3.4 文法タブ
```typescript
describe('GrammarQuizView integration', () => {
  test('QuestionSchedulerが正しく初期化される', () => {
    const { container } = render(<GrammarQuizView />);
    expect(container.querySelector('.question-card')).not.toBeNull();
  });
});
```

---

## デバッグログ検証

### 必須ログの確認

#### 1. Category修復ログ
```
[Category Repair] 修復された単語数: X
```
**検証ポイント**:
- [ ] 初回起動時に表示される
- [ ] 修復数が妥当（既存データがある場合のみ）

#### 2. カテゴリー統計ログ
```
[QuestionScheduler] カテゴリー統計:
  incorrect: X
  still_learning: Y
  mastered: Z
  new: W
```
**検証ポイント**:
- [ ] 各カテゴリーの数が妥当
- [ ] incorrect/still_learningが0でない（不正解歴がある場合）

#### 3. 確実性保証ログ
```
[確実性保証] 強制カテゴリー優先配置:
  incorrect優先: X問
  still_learning優先: Y問
  その他: Z問
[確実性保証] 上位20問中、復習単語10問
```
**検証ポイント**:
- [ ] incorrect単語が上位に配置される
- [ ] 上位20%に復習単語が含まれる

#### 4. 優先度計算ログ
```
[QuestionScheduler] 優先度計算:
  単語: abandon
  基本優先度: 8.5
  DTA: 2.5
  シグナル反映後: 10.2
```
**検証ポイント**:
- [ ] incorrect単語の優先度が高い（7.0以上）
- [ ] DTAブーストが正しく適用される

---

## リグレッション防止

### チェックリスト

#### コード変更前
- [ ] 現在の動作を記録（スクリーンショット、ログ）
- [ ] 既存のテストケースが全てパスすることを確認

#### コード変更後
- [ ] 全てのテストケースが引き続きパスすることを確認
- [ ] デバッグログが変更前と同じ内容を出力することを確認
- [ ] パフォーマンスが劣化していないことを確認（ソート時間など）

#### 重要な不変条件
- [ ] incorrect単語は必ず上位に配置される
- [ ] category管理システムが機能している
- [ ] 4タブ全てでQuestionSchedulerが使用されている
- [ ] 型定義（types.ts）の整合性が保たれている

---

## 継続的監視

### 自動アラート設定

#### 1. エラーログ監視
```javascript
// ブラウザコンソールで以下のパターンを監視
window.addEventListener('error', (event) => {
  if (event.message.includes('scheduledQuestions')) {
    alert('出題機能のエラーを検出しました');
  }
});
```

#### 2. カテゴリー統計監視
```javascript
// incorrect/still_learningが常に0の場合アラート
if (categoryStats.incorrect === 0 && categoryStats.still_learning === 0) {
  console.warn('[監視] category更新が機能していない可能性があります');
}
```

#### 3. 優先度異常監視
```javascript
// mastered単語が最優先される場合アラート
if (sortedQuestions[0].category === 'mastered' && hasIncorrectQuestions) {
  console.error('[監視] 確実性保証が機能していません');
}
```

---

## 品質基準

### 合格基準
- [ ] 全てのユニットテストがパス（100%）
- [ ] 全ての統合テストがパス（100%）
- [ ] デバッグログが正しく出力される
- [ ] 手動テストで復習単語が優先出題される
- [ ] リグレッションが発生していない

### 不合格基準（即座に修正）
- [ ] テストが1つでもfail
- [ ] デバッグログが出力されない
- [ ] 復習単語が出題されない
- [ ] リグレッションが発生

---

## 手動テスト手順

### 復習単語優先出題テスト

#### 手順
1. ブラウザでアプリを開く
2. 暗記タブで以下を実行：
   - 「まだまだ」を100回押す（100単語を不正解にする）
   - 「分からない」を100回押す（別の100単語を不正解にする）
3. F12でコンソールを開き、以下のログを確認：
   ```
   [QuestionScheduler] カテゴリー統計:
     incorrect: 200
     still_learning: 0
     mastered: X
     new: Y
   ```
4. スキップボタンを300回押す
5. 出題された単語を記録

#### 期待結果
- 上位200問に不正解単語が含まれる
- 正解した単語（mastered）は下位に配置される
- デバッグログに`[確実性保証]`が表示される

#### 不合格の場合
- QuestionScheduler.tsのsortAndBalance()を確認
- progressStorage.tsのupdateWordProgress()を確認
- デバッグログで問題箇所を特定

---

## 参照ドキュメント

- `.aitk/instructions/meta-ai-priority.instructions.md` - AIアシスタント用指示書
- `docs/guidelines/META_AI_TROUBLESHOOTING.md` - トラブルシューティングガイド
- `docs/specifications/QUESTION_SCHEDULER_SPEC.md` - QuestionScheduler詳細仕様

---

**このパイプラインを厳格に実施することで、出題機能の品質を保証し、ユーザー体験を向上させます。**
