---
description: プロジェクトの品質基準と遵守すべき基準
version: 1.0.0
created: 2025-12-19
applyTo: '**'
priority: critical
phase: 1
---

# 品質基準認識システム

**目的**: プロジェクトで遵守すべき品質基準を明確に定義

---

## 🎯 品質の3原則

```
1. Zero Tolerance（ゼロトレランス）
   → TypeScript エラー 0、ESLint 警告 0、Markdown エラー 0

2. Test First（テストファースト）
   → 実装前にテストケースを考える

3. Document Everything（すべて記録）
   → 変更理由、判断根拠を記録
```

---

## 📊 品質基準一覧

### レベル P0: 絶対厳守（CI/CD で自動チェック）

| 項目 | 基準 | 検証方法 | 許容値 |
|------|------|---------|--------|
| TypeScript エラー | 0件 | `npx tsc --noEmit` | 0 |
| ESLint エラー | 0件 | `npm run lint` | 0 |
| ESLint 警告 | 0件 | `npm run lint` | 0 |
| Markdown エラー | 0件 | `markdownlint` | 0 |
| ビルド成功 | 必須 | `npm run build` | 成功 |
| テスト成功 | 必須 | `npm test` | 100% |

### レベル P1: 強く推奨

| 項目 | 基準 | 目標値 |
|------|------|--------|
| テストカバレッジ | ユニットテスト | 95%+ |
| E2E テストパス率 | 主要フロー | 100% |
| ビルド時間 | - | <30秒 |
| バンドルサイズ | - | <500KB |
| Lighthouse Score | パフォーマンス | 90+ |

### レベル P2: ベストプラクティス

| 項目 | 基準 |
|------|------|
| コメント | 複雑なロジックには必須 |
| ドキュメント | 公開APIにはすべて記載 |
| コミットメッセージ | Conventional Commits 準拠 |
| PR説明 | 変更理由と影響範囲を明記 |

---

## 🔍 TypeScript 品質基準

### strict mode 設定（変更禁止）

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 型定義のベストプラクティス

```typescript
// ❌ BAD: any を使用
function processData(data: any) {
  return data.value; // 型安全性なし
}

// ✅ GOOD: 適切な型定義
interface ProcessedData {
  value: number;
  timestamp: number;
}

function processData(data: ProcessedData): number {
  return data.value; // 型安全
}

// ❌ BAD: optional chaining 乱用
const result = data?.maybe?.deep?.nested?.value;

// ✅ GOOD: 適切な型ガード
if (data && data.maybe && data.maybe.deep) {
  const result = data.maybe.deep.nested?.value;
}

// ❌ BAD: as キャストの乱用
const value = data as MyType;

// ✅ GOOD: 型ガード関数
function isMyType(data: unknown): data is MyType {
  return typeof data === 'object' && 
         data !== null && 
         'requiredField' in data;
}

if (isMyType(data)) {
  const value = data; // 型安全
}
```

---

## 🧪 テスト品質基準

### テストカバレッジ目標

```markdown
全体: 95%+
├── Statements: 95%+
├── Branches: 90%+
├── Functions: 95%+
└── Lines: 95%+

重要ファイル: 100%必須
├── src/ai/scheduler/QuestionScheduler.ts
├── src/strategies/memoryAcquisitionAlgorithm.ts
├── src/storage/progress/progressStorage.ts
└── src/strategies/hybridQuestionSelector.ts
```

### テストの構成（AAA パターン）

```typescript
describe('QuestionScheduler', () => {
  test('should prioritize urgent questions', () => {
    // Arrange（準備）
    const scheduler = new QuestionScheduler();
    const questions: Question[] = [
      { id: 1, urgency: 0.9, difficulty: 0.5 },
      { id: 2, urgency: 0.3, difficulty: 0.8 },
    ];

    // Act（実行）
    const result = scheduler.selectNext(questions);

    // Assert（検証）
    expect(result.id).toBe(1);
    expect(result.urgency).toBe(0.9);
  });
});
```

### テストケースの網羅性

```typescript
// ✅ 必須テストケース

// 1. 正常系（Happy Path）
test('works with valid input', () => { ... });

// 2. エッジケース
test('handles empty array', () => { ... });
test('handles single item', () => { ... });
test('handles large dataset (1000+ items)', () => { ... });

// 3. エラーケース
test('throws error on invalid input', () => { ... });
test('handles undefined gracefully', () => { ... });
test('handles null gracefully', () => { ... });

// 4. 境界値
test('handles minimum value', () => { ... });
test('handles maximum value', () => { ... });
test('handles zero', () => { ... });

// 5. 統合テスト
test('integrates with other components', () => { ... });
```

---

## 📝 コード品質基準

### ESLint ルール（厳格）

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // エラーレベル（修正必須）
      'no-console': 'error', // 本番コードでconsole禁止
      'no-unused-vars': 'error', // 未使用変数禁止
      '@typescript-eslint/no-explicit-any': 'error', // any禁止
      '@typescript-eslint/explicit-function-return-type': 'error', // 戻り値の型必須
      
      // 警告レベル（修正推奨）
      'max-lines-per-function': ['warn', 50], // 関数は50行以内
      'complexity': ['warn', 10], // 循環的複雑度10以下
    }
  }
];
```

### コードスタイル

```typescript
// ✅ GOOD: 読みやすい関数

/**
 * 問題の優先度を計算します
 * @param question - 対象の問題
 * @param userProgress - ユーザーの進捗
 * @returns 優先度スコア (0-1)
 */
function calculatePriority(
  question: Question,
  userProgress: UserProgress
): number {
  const urgency = calculateUrgency(question, userProgress);
  const difficulty = question.difficulty;
  const importance = question.importance;

  return urgency * 0.4 + difficulty * 0.3 + importance * 0.3;
}

// ❌ BAD: 読みにくい関数

function calc(q: any, p: any) {
  return q.u * 0.4 + q.d * 0.3 + q.i * 0.3; // 何をしているか不明
}
```

### 命名規則

```typescript
// ✅ GOOD: 意味のある名前

const MEMORY_RETENTION_THRESHOLD = 0.7; // 定数: UPPER_SNAKE_CASE
const userProgress: UserProgress = {}; // 変数: camelCase
function calculatePriority(): number { } // 関数: camelCase
interface UserProgress { } // インターフェース: PascalCase
class QuestionScheduler { } // クラス: PascalCase
type QuestionType = 'memorization' | 'grammar'; // 型: PascalCase

// ❌ BAD: 意味不明な名前

const t = 0.7; // t って何？
const data = {}; // data って何のデータ？
function process() { } // 何を処理？
```

---

## 📄 ドキュメント品質基準

### Markdown Linting

```markdown
<!-- ✅ GOOD: 適切なMarkdown -->

# 見出し1

## 見出し2

- リスト項目1
- リスト項目2

```typescript
// コードブロックには言語指定必須
const example = true;
```

<!-- ❌ BAD: ルール違反 -->

#見出し（スペース不足）

- リスト
-リスト（スペース不足）

```
// 言語指定なし
const example = true;
```
```

### ドキュメントの必須要素

```markdown
すべてのドキュメントに以下を含める:

1. メタデータ
---
description: ドキュメントの目的
version: 1.0.0
created: 2025-12-19
---

2. 目的セクション
## 目的
このドキュメントの目的を簡潔に説明

3. 使用例（5個以上）
## 例
実際の使用例を豊富に提供

4. トラブルシューティング
## Troubleshooting
よくある問題と解決策

5. 関連ドキュメント
## 関連ドキュメント
- [リンク1](path/to/doc1.md)
- [リンク2](path/to/doc2.md)

6. 更新履歴
**最終更新**: 2025-12-19
**バージョン**: 1.0.0
```

---

## 🔄 Commit Message 基準

### Conventional Commits 準拠

```bash
# ✅ GOOD: 適切なコミットメッセージ

feat(ai): QuestionScheduler に優先度計算機能を追加

- 緊急度、難易度、重要度を考慮
- 重み付けは 0.4, 0.3, 0.3
- テストカバレッジ 100%

Closes #123

# ❌ BAD: 不適切なコミットメッセージ

update files
fix bug
WIP
```

### Commit Type

| Type | 用途 | 例 |
|------|------|-----|
| feat | 新機能 | `feat(ai): 新しい学習モード追加` |
| fix | バグ修正 | `fix(scheduler): null参照エラー修正` |
| docs | ドキュメント | `docs(readme): インストール手順追加` |
| style | フォーマット | `style: Prettier適用` |
| refactor | リファクタリング | `refactor(storage): データアクセス最適化` |
| test | テスト | `test(scheduler): エッジケース追加` |
| chore | その他 | `chore(deps): 依存関係更新` |

---

## 🎯 品質チェックフロー

### コミット前（必須）

```bash
# 1. TypeScript チェック
npx tsc --noEmit
# 期待: 出力なし（0エラー）

# 2. ESLint チェック
npm run lint
# 期待: 0 errors, 0 warnings

# 3. テスト実行
npm test
# 期待: All tests passed

# 4. ビルド確認
npm run build
# 期待: Build completed successfully
```

### Pre-commit フック（自動）

```bash
# Husky が自動実行

1. ダークモード禁止チェック
2. 仕様書遵守チェック
3. Prettier フォーマット
4. TypeScript 型チェック
5. プロジェクト構造検証

すべてパス → コミット許可
1つでも失敗 → コミット拒否
```

### CI/CD（自動）

```yaml
# GitHub Actions が自動実行

1. Install dependencies
2. TypeScript check
3. ESLint check
4. Unit tests
5. Integration tests
6. E2E tests
7. Build
8. Deploy (mainブランチのみ)

すべてパス → デプロイ
1つでも失敗 → デプロイ中止
```

---

## 📊 品質メトリクスの追跡

### 現在の品質状態

```markdown
プロジェクト品質ダッシュボード:

## コード品質
- TypeScript エラー: 0 ✅
- ESLint 警告: 0 ✅
- Markdown エラー: 0 ✅

## テスト
- ユニットテストカバレッジ: 90%+ 🟡 (目標: 95%+)
- E2E テストパス率: 100% ✅
- テスト実行時間: <10秒 ✅

## ビルド
- ビルド時間: ~20秒 ✅ (目標: <30秒)
- バンドルサイズ: ~350KB ✅ (目標: <500KB)
- ビルド成功率: 100% ✅

## デプロイ
- デプロイ成功率: 100% ✅
- デプロイ時間: ~3分 ✅
- ロールバック回数: 0回/月 ✅
```

---

## 🚨 品質違反への対応

### レベル P0: 即座に修正

```markdown
以下は**絶対に**許容されない:

❌ TypeScript エラーが残っている
❌ ESLint エラー/警告が残っている
❌ テストが失敗している
❌ ビルドが失敗している
❌ CI/CD が壊れている

対応:
1. 作業を中断
2. 即座に修正
3. 修正完了まで次の作業に進まない
```

### レベル P1: 計画的に修正

```markdown
以下は計画的に改善:

⚠️ テストカバレッジが95%未満
⚠️ 複雑度が10を超える関数
⚠️ 50行を超える関数
⚠️ ドキュメントが不足

対応:
1. Issue を作成
2. 優先度を設定
3. スプリント計画に含める
```

---

## 📚 関連ドキュメント

- [QUALITY_SYSTEM.md](../../../docs/quality/QUALITY_SYSTEM.md) - 品質システム全体
- [INTEGRATED_QUALITY_PIPELINE.md](../../../docs/quality/INTEGRATED_QUALITY_PIPELINE.md) - 品質パイプライン
- [core-principles.instructions.md](../core-principles.instructions.md) - コア原則

---

**最終更新**: 2025-12-19  
**バージョン**: 1.0.0  
**適用**: すべてのコード変更
