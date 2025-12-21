# 適応型学習AI統合計画書

**作成日**: 2025年12月17日  
**ステータス**: 計画策定中  
**目的**: 全モードへの適応型学習AI（useAdaptiveLearning）統合

---

## 📋 エグゼクティブサマリー

### 現状
- **完了**: 暗記モード（MemorizationView）への適応型学習AI統合
- **課題**: 他の3モード（スペル、和訳、文法）は`recordAnswer`でデータ記録のみ。`selectNextQuestion`が未使用

### 目標
適応型学習AIの`selectNextQuestion`を全モードで活用し、以下を実現：
- 学習フェーズ（獲得期/定着期/習熟期）に基づく最適な問題選択
- 個人パラメータ（学習速度、記憶保持力）の活用
- 記憶保持スケジュールに基づく復習タイミングの最適化

### 想定工数
**合計: 18-26時間**（3-4営業日相当）

---

## 🔍 現状分析

### 1. MemorizationView（暗記モード）✅ 完了

**統合済み内容**:
- 初期問題選択時に`selectNextQuestion`を使用
- 次の問題選択時に`selectNextQuestion`を使用
- ScoreBoardで`memorizationAttempts`を使用（モード別カウント修正済み）

**ファイル**: `src/components/MemorizationView.tsx`  
**実装箇所**:
- L216-217: 初期問題選択
- L771-789: 次の問題選択

---

### 2. SpellingView（スペルモード）❌ 未統合

**現状の問題選択ロジック**:
```typescript
// src/hooks/useSpellingGame.ts L202-209
const moveToNextQuestion = () => {
  setSpellingState((prev) => ({
    ...prev,
    currentIndex: prev.currentIndex + 1,  // 単純なインデックス増加
    answered: false,
  }));
};
```

**依存関係**:
- `useSpellingGame` フック（260行）- 文字シャッフル、正誤判定を管理
- `useLearningEngine` フック - 不正解問題の再追加を管理
- `useAdaptiveLearning` - データ記録のみ（L106, L291）

**複雑度**: ⭐⭐☆☆☆（低）
- 問題選択ロジックは単純なインデックス増加
- `useSpellingGame`は文字操作に特化、問題選択とは独立

**統合アプローチ**:
1. `moveToNextQuestion`内で適応型AIの`selectNextQuestion`を呼び出す
2. 選択された問題のインデックスを見つけて`currentIndex`を更新
3. 既存の文字シャッフルロジックはそのまま維持

**影響範囲**:
- 修正ファイル: `src/hooks/useSpellingGame.ts`（1ファイル）
- 影響コンポーネント: `SpellingView.tsx`のみ

---

### 3. QuizView（和訳モード）❌ 未統合

**現状の問題選択ロジック**:
```typescript
// src/App.tsx L1336-1363
const handleNext = () => {
  setQuizState((prev) => {
    const nextIndex = prev.currentIndex + 1;  // 単純なインデックス増加
    
    // 問題リストのクリーンアップ処理
    const cleanedQuestions = clearExpiredFlags(currentQuestions, nextIndex - 1);
    
    return {
      ...prev,
      questions: cleanedQuestions,
      currentIndex: nextIndex,  // インデックスを更新
      answered: false,
      selectedAnswer: null,
    };
  });
};
```

**依存関係**:
- 親コンポーネント（App.tsx）で問題選択を管理
- QuizView.tsxはpropsの`onNext`を呼び出すのみ
- `useAdaptiveLearning` - データ記録のみ（L102, L146）

**複雑度**: ⭐⭐⭐☆☆（中）
- 問題選択ロジックが親コンポーネントに存在
- App.tsxは1800行超の大規模ファイル
- 復習モード（reviewFocusMode）との連携が必要

**統合アプローチ**:
1. App.tsxの`handleNext`内で適応型AIの`selectNextQuestion`を呼び出す
2. 適応型学習AIインスタンスをApp.tsxに追加
3. 選択された問題のインデックスを見つけて状態を更新
4. 既存の復習モードロジックと統合

**影響範囲**:
- 修正ファイル: `src/App.tsx`（1ファイル）
- 影響コンポーネント: QuizView.tsx、翻訳モード全体
- リスク: App.tsxは多機能なため、回帰テストが必要

---

### 4. GrammarQuizView（文法モード）❌ 未統合

**現状の問題選択ロジック**:
```typescript
// src/components/GrammarQuizView.tsx L256-277
const handleNext = useCallback(() => {
  if (currentQuestionIndex < currentQuestions.length - 1) {
    const nextIndex = currentQuestionIndex + 1;  // 単純なインデックス増加
    
    // フラグのクリーンアップ
    const cleanedQuestions = clearExpiredFlags(currentQuestions, nextIndex - 1);
    
    setCurrentQuestionIndex(nextIndex);  // インデックスを更新
    setSelectedAnswer(null);
    setAnswered(false);
    setShowHint(false);
    questionStartTimeRef.current = Date.now();
    setLastAnswerWord(undefined);
  }
}, [currentQuestionIndex, currentQuestions]);
```

**依存関係**:
- `useLearningEngine` フック - 不正解問題の再追加を管理
- `useAdaptiveLearning` - データ記録のみ（L119, L673）
- 独自の問題取得ロジック（JSONファイルから動的読み込み）

**複雑度**: ⭐⭐⭐⭐☆（高）
- 文法問題は動的にJSONから読み込まれる
- 学年・単元フィルタリングが複雑
- 単元別統計の管理が必要
- 1400行超の大規模コンポーネント

**統合アプローチ**:
1. `handleNext`内で適応型AIの`selectNextQuestion`を呼び出す
2. 選択された問題のインデックスを見つけて状態を更新
3. 既存の単元フィルタリングロジックと統合
4. 文法専用の統計処理を維持

**影響範囲**:
- 修正ファイル: `src/components/GrammarQuizView.tsx`（1ファイル）
- 影響: 文法モード全体、単元別統計
- リスク: 複雑な問題取得ロジックとの相互作用

---

## 📊 統合パターン設計

### パターンA: 最小変更アプローチ（推奨）

**概要**: 既存のインデックス増加ロジックを適応型AI選択に置き換える

**実装例**（MemorizationViewの成功パターン）:
```typescript
// Before: 単純なインデックス増加
const nextIndex = currentIndex + 1;
setCurrentQuestion(questions[nextIndex]);
setCurrentIndex(nextIndex);

// After: 適応型AI選択
const remainingQuestions = questions.slice(currentIndex + 1);
const nextQuestion = adaptiveLearning.selectNextQuestion(remainingQuestions);

if (nextQuestion) {
  const selectedIndex = questions.findIndex((q) => q.word === nextQuestion.word);
  const nextIndex = selectedIndex !== -1 ? selectedIndex : currentIndex + 1;
  
  setCurrentQuestion(nextQuestion);
  setCurrentIndex(nextIndex);
}
```

**メリット**:
- 既存コードへの影響が最小
- テスト範囲が限定的
- 段階的なロールアウトが可能

**デメリット**:
- 各コンポーネントで個別実装が必要

---

### パターンB: 統一フックアプローチ（将来的）

**概要**: `useLearningEngine`に適応型AI統合を追加

**実装イメージ**:
```typescript
export function useLearningEngine<T>(config: LearningEngineConfig) {
  const adaptiveLearning = useAdaptiveLearning(config.category);
  
  const selectNextQuestion = useCallback((questions: T[], currentIndex: number) => {
    const remaining = questions.slice(currentIndex + 1);
    return adaptiveLearning.selectNextQuestion(remaining);
  }, [adaptiveLearning]);
  
  return {
    selectNextQuestion,
    updateQuestionsAfterAnswer,
  };
}
```

**メリット**:
- コードの一元化
- 保守性の向上
- 統一された動作

**デメリット**:
- 大規模リファクタリングが必要
- 既存コードへの影響が大きい
- テスト範囲が広範

**判断**: Phase 1ではパターンA、Phase 2でパターンBへ移行

---

## 📅 実装計画

### Phase 1: スペルモード統合（優先度：高）

**期間**: 4-6時間  
**理由**: 
- 最もシンプルな構造
- 成功パターンの検証に最適
- ユーザー影響度が高い

**作業内容**:
1. `useSpellingGame.ts`の`moveToNextQuestion`を修正（1-2時間）
   - 適応型AIの`selectNextQuestion`を統合
   - 選択された問題のインデックス解決ロジック追加
   
2. SpellingView.tsxの統合確認（1時間）
   - 問題選択フローの動作確認
   - エラーハンドリング追加
   
3. ScoreBoardの修正確認（0.5時間）
   - `spellingAttempts`が正しく使用されているか確認
   - 既存の修正で対応済みの可能性が高い
   
4. テストとデバッグ（1.5-2.5時間）
   - 型チェック
   - 手動テスト（初回選択、次の問題選択、再出題）
   - エッジケース検証（問題リスト終了時など）

**成果物**:
- ✅ 修正済み `useSpellingGame.ts`
- ✅ 動作確認済みスペルモード
- ✅ テストレポート

**リスク**:
- 低: 問題選択ロジックが単純

---

### Phase 2: 文法モード統合（優先度：中）

**期間**: 6-8時間  
**理由**:
- 独立したコンポーネント
- スペルモードの成功パターンを適用可能
- 単元別統計との連携が必要

**作業内容**:
1. GrammarQuizView.tsxの`handleNext`を修正（2-3時間）
   - 適応型AIの`selectNextQuestion`を統合
   - 選択された問題のインデックス解決ロジック追加
   - 単元フィルタリングとの統合
   
2. 問題取得ロジックとの連携確認（1-2時間）
   - JSON読み込みと適応型AI選択の相互作用確認
   - 学年・単元フィルタとの整合性確認
   
3. 単元別統計の動作確認（1時間）
   - `grammarAttempts`が正しくカウントされるか確認
   - 単元別進捗との連携確認
   
4. テストとデバッグ（2-3時間）
   - 型チェック
   - 手動テスト（各学年・単元）
   - 複雑な問題フィルタリングシナリオのテスト

**成果物**:
- ✅ 修正済み `GrammarQuizView.tsx`
- ✅ 単元別統計との統合確認
- ✅ テストレポート

**リスク**:
- 中: 複雑な問題取得ロジック、単元別管理

---

### Phase 3: 和訳モード統合（優先度：中）

**期間**: 8-12時間  
**理由**:
- App.tsxの大規模修正が必要
- 他機能への影響リスクが高い
- 慎重なテストが必要

**作業内容**:
1. App.tsxへの適応型AI追加（2-3時間）
   - `useAdaptiveLearning`インスタンスを追加
   - カテゴリ設定（TRANSLATION）
   
2. `handleNext`の修正（2-3時間）
   - 適応型AIの`selectNextQuestion`を統合
   - 復習モード（reviewFocusMode）との連携
   - 既存の問題プールロジックとの統合
   
3. 状態管理の整合性確認（2-3時間）
   - `quizState`の更新ロジック確認
   - セッション管理との連携
   - KPI記録との統合
   
4. 回帰テスト（2-3時間）
   - 和訳モード全体の動作確認
   - 他モード（スペル、文法、暗記）への影響確認
   - 復習モードのテスト

**成果物**:
- ✅ 修正済み `App.tsx`
- ✅ 回帰テストレポート
- ✅ 統合ドキュメント

**リスク**:
- 高: App.tsxは多機能、他機能への影響大

---

## 🧪 テスト戦略

### 単体テスト
各Phaseで以下を確認:
1. **型チェック**: `npm run typecheck`
2. **ビルド**: `npm run build`
3. **問題選択ロジック**:
   - 初回問題選択
   - 次の問題選択
   - 問題リスト終了時の処理
   - 不正解問題の再出題

### 統合テスト
1. **モード間の独立性**: 各モードが他モードの統合に影響されない
2. **ScoreBoard統計**: モード別の出題回数が正しくカウントされる
3. **適応型学習AIの動作**:
   - 学習フェーズの遷移
   - 個人パラメータの更新（20問ごと）
   - 記憶保持スケジュールの適用

### 受け入れテスト
1. **ユーザー体験**: 問題選択が自然で違和感がない
2. **パフォーマンス**: 問題選択の遅延がない
3. **データ整合性**: 進捗データが正しく保存される

---

## ⚠️ リスクと対策

### リスク1: App.tsx修正による回帰（高）
**対策**:
- Phase 3を最後に実施
- 修正前にgitブランチを作成
- 段階的コミットで変更を追跡可能に
- 全モードの回帰テストを実施

### リスク2: 適応型AI選択の予期しない動作（中）
**対策**:
- 各Phaseで十分なテスト時間を確保
- ログ出力で問題選択プロセスを可視化
- フォールバック処理を実装（AI選択失敗時は従来のインデックス増加）

### リスク3: パフォーマンス劣化（低）
**対策**:
- 適応型AI選択は既にMemorizationViewで実証済み
- 必要に応じてメモ化（useMemo）を追加

### リスク4: 統合後のバグ発見（中）
**対策**:
- 各Phase完了後に必ずmainブランチにマージ
- ユーザーフィードバックを収集
- 次のPhaseに進む前に安定化期間を設ける

---

## 📈 成功指標

### 定量指標
1. **統合完了率**: 4モード中4モード完了（100%）
2. **バグ数**: Phase完了時に重大バグ0件
3. **テストカバレッジ**: 修正箇所の手動テスト実施率100%
4. **パフォーマンス**: 問題選択時間が従来の1.5倍以内

### 定性指標
1. **コード品質**: 統一されたパターンで実装
2. **保守性**: 適応型AI統合パターンがドキュメント化
3. **ユーザー体験**: 問題選択が学習状況に適応

---

## 🎯 マイルストーン

| Phase | 期間 | 完了日目標 | 成果物 |
|-------|------|-----------|--------|
| Phase 0 | 完了 | 2025-12-17 | MemorizationView統合完了 |
| Phase 1 | 4-6h | 2025-12-18 | SpellingView統合完了 |
| Phase 2 | 6-8h | 2025-12-19 | GrammarQuizView統合完了 |
| Phase 3 | 8-12h | 2025-12-20 | App.tsx（QuizView）統合完了 |
| 統合テスト | 2-4h | 2025-12-20 | 全モード動作確認完了 |

**合計工数**: 20-30時間（2.5-4営業日）

---

## 📝 実装チェックリスト

### Phase 1: SpellingView
- [ ] `useSpellingGame.ts`の`moveToNextQuestion`修正
- [ ] 適応型AI`selectNextQuestion`統合
- [ ] インデックス解決ロジック追加
- [ ] 型チェック通過
- [ ] 手動テスト実施
- [ ] テストレポート作成
- [ ] コミット & プッシュ

### Phase 2: GrammarQuizView
- [ ] `GrammarQuizView.tsx`の`handleNext`修正
- [ ] 適応型AI`selectNextQuestion`統合
- [ ] 単元フィルタとの統合確認
- [ ] 単元別統計の動作確認
- [ ] 型チェック通過
- [ ] 手動テスト実施（各学年・単元）
- [ ] テストレポート作成
- [ ] コミット & プッシュ

### Phase 3: QuizView（App.tsx）
- [ ] App.tsxへ`useAdaptiveLearning`追加
- [ ] `handleNext`修正
- [ ] 復習モードとの統合
- [ ] 状態管理の整合性確認
- [ ] 型チェック通過
- [ ] 和訳モード全体テスト
- [ ] 他モード回帰テスト
- [ ] テストレポート作成
- [ ] コミット & プッシュ

### 統合テスト
- [ ] 全モードの問題選択動作確認
- [ ] ScoreBoard統計の正確性確認
- [ ] 適応型AIのデータ記録確認
- [ ] パフォーマンス測定
- [ ] ドキュメント更新

---

## 🚀 次のステップ

1. **即座実行**: このドキュメントをレビュー
2. **Phase 1開始判断**: スペルモード統合を開始するか確認
3. **ブランチ戦略**: `feature/adaptive-ai-integration`ブランチを作成
4. **進捗トラッキング**: 各Phase完了時にこのドキュメントを更新

---

## 📚 参考資料

- [CHANGELOG_ADAPTIVE_LEARNING.md](../../CHANGELOG_ADAPTIVE_LEARNING.md) - 適応型学習AI仕様
- [ADAPTIVE_LEARNING_API.md](../specifications/ADAPTIVE_LEARNING_API.md) - API仕様書
- [MemorizationView.tsx](../../src/components/MemorizationView.tsx) - 成功事例（Phase 0）
- [useAdaptiveLearning.ts](../../src/hooks/useAdaptiveLearning.ts) - フック実装

---

**策定者**: GitHub Copilot  
**承認**: 待機中  
**最終更新**: 2025年12月17日
