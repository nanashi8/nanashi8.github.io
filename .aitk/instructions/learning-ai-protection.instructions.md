````instructions
---
description: 学習AIシステム保護ガードレール - 最優先遵守事項
applyTo: 'src/ai/**,src/storage/progress/**,src/components/**/Memorization*,src/components/**/Question*'
---

# 🚨 学習AIシステム保護ガードレール（最優先遵守）

## ⚠️ 警告：生徒の学習に直接影響する領域

このシステムは生徒の学習成果に直結する重要なコンポーネントです。
**安易な修正は生徒の学習データを破壊し、学習効果を著しく低下させます。**

## 🔒 修正前の必須確認事項

### 1. 学習AIシステムの全体像を理解しているか？
- [ ] QuestionScheduler（出題スケジューリングAI）の役割
- [ ] MemoryAI（記憶定着予測AI）の役割
- [ ] learningAISimulator（学習シミュレーター）の役割
- [ ] progressStorage（進捗管理）との連携
- [ ] 4つのタブ（翻訳・スペル・文法・暗記）との関係

### 2. 影響範囲を完全に把握しているか？
- [ ] 修正が他のAIコンポーネントに与える影響
- [ ] カテゴリー判定ロジック（mastered/still_learning/incorrect）の整合性
- [ ] 優先度計算（priority）への影響
- [ ] 時間ベースの再出題（timeBoost）への影響
- [ ] 既存の学習データとの互換性

### 3. シミュレーションで検証したか？
- [ ] 設定タブの「学習AIシミュレート」で動作確認
- [ ] 少なくとも100回の試行で期待通りの結果が出るか
- [ ] カテゴリー分布が適切か（新規・学習中・定着済・要復習）

## 🛡️ 絶対に守るべきルール

### Rule 1: 単一ファイルの修正禁止
❌ **禁止**: progressStorage.ts だけを修正する
✅ **必須**: 関連する全AIコンポーネントの整合性を確認・同時修正

### Rule 2: カテゴリー判定ロジックの統一
以下のファイルでカテゴリー判定ロジックは**完全に統一**されていなければならない：
- `src/storage/progress/progressStorage.ts` (updateWordProgress, repairMissingCategories)
- `src/ai/simulation/learningAISimulator.ts` (calculatePriority)
- `src/ai/scheduler/QuestionScheduler.ts` (カテゴリー推測ロジック)

**現在の統一基準**:
```typescript
// 🟢 mastered（覚えてる・定着済）
- 1発正解: totalAttempts === 1 && correctCount === 1
- 連続3回正解: consecutiveCorrect >= 3

// 🔴 incorrect（分からない・要復習）
- incorrectCount > 0 && consecutiveCorrect < 2

// 🟡 still_learning（まだまだ・学習中）
- それ以外
```

### Rule 3: 修正前に必ず仕様書を確認
以下のドキュメントを**必ず**読んでから修正：
- `/docs/specifications/learning-ai-system-architecture.md` (学習AIアーキテクチャ)
- `/docs/development/ai-integration-test-guide.md` (AIテストガイド)
- `/docs/guidelines/ai-development-guidelines.md` (AI開発ガイドライン)

### Rule 4: 修正後は必ずシミュレーションで検証
```bash
# 設定タブ > 学習AI > シミュレート機能で検証
# 期待する結果：
# - 新規単語が適切に出題される
# - 定着済み単語は時間経過で再出題される
# - 要復習単語が優先される
```

## 📋 修正チェックリスト

修正を行う前に、以下をすべて確認してください：

### Phase 1: 理解
- [ ] 修正の目的を明確に定義できる
- [ ] 現在の動作を完全に理解している
- [ ] 期待する動作を明確に説明できる

### Phase 2: 設計
- [ ] 影響を受けるすべてのAIコンポーネントをリストアップ
- [ ] 各コンポーネントでの修正内容を明確化
- [ ] 既存データへの影響を評価

### Phase 3: 実装
- [ ] すべての関連ファイルを同時に修正
- [ ] カテゴリー判定ロジックの統一を維持
- [ ] デバッグログを追加して動作を追跡可能に

### Phase 4: 検証
- [ ] 設定タブのシミュレーターで検証
- [ ] 4つのタブすべてで動作確認
- [ ] カテゴリー分布が適切か確認
- [ ] 既存の学習データで問題が起きないか確認

### Phase 5: ドキュメント
- [ ] 変更内容を仕様書に反映
- [ ] CHANGELOG に記録
- [ ] 影響範囲をコメントで明記

## 🚫 やってはいけないこと

1. **思いつきでの修正**
   - 「これで動くはず」という推測での修正
   - 影響範囲を確認せずに1ファイルだけ修正

2. **統一性を破壊する修正**
   - カテゴリー判定基準を異なるファイルで別々に実装
   - 優先度計算ロジックの不整合

3. **検証なしのコミット**
   - シミュレーターで動作確認していない
   - 実際のデータで試していない

4. **ドキュメントの無視**
   - 仕様書を読まずに修正
   - 変更をドキュメントに反映しない

## 🔧 修正が必要な場合の正しいプロセス

1. **Issue作成**: 問題を明確に定義
2. **仕様確認**: 関連ドキュメントを熟読
3. **影響分析**: 全AIコンポーネントの関係を図示
4. **設計レビュー**: 修正内容をユーザーに確認
5. **実装**: すべての関連ファイルを統一的に修正
6. **テスト**: シミュレーターと実データで検証
7. **ドキュメント更新**: 仕様書とCHANGELOGを更新

## 📚 参考ドキュメント

- 学習AIシステムアーキテクチャ: `/docs/specifications/learning-ai-system-architecture.md`
- QuestionScheduler仕様: `/docs/specifications/question-scheduler-spec.md`
- MemoryAI仕様: `/docs/specifications/memory-ai-spec.md`
- テストガイド: `/docs/development/ai-integration-test-guide.md`

## ⚡ 緊急時の対応

学習データに問題が発生した場合：

1. **即座にロールバック**
2. **問題を報告**
3. **データベースのバックアップを確認**
4. **影響を受けた生徒のデータを復旧**

---

**このガードレールは生徒の学習を守るための最後の砦です。**
**軽視することは、生徒の学習成果を直接損なうことに他なりません。**

````
