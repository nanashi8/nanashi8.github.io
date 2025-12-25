# 関連語グループ化機能の運用ガイド

## 概要

ABC順の単調な出題順序を改善し、語源・品詞・意味的関連性に基づいて関連語を近くに配置する機能です。

**重要な制約**: Position階層（復習優先度）は絶対に保持されます。

- 70-100: incorrect（分からない）← 最優先
- 60-69: still_learning（ブースト）
- 40-59: new（ブースト）
- 20-39: new（通常）
- 0-19: mastered

各Position範囲内でのみ並べ替えが行われ、範囲間の順序は変わりません。

## アーキテクチャ

### コアモジュール

1. **wordMetadata.ts**: オフラインメタ情報抽出
   - 10個の接頭辞（un-, re-, dis-, in-/im-, pre-, post-, mis-, over-, under-, sub-）
   - 12個の接尾辞（-tion/-sion, -ment, -ness, -ly, -ful, -less, -able/-ible, -er/-or, -ist, -ize, -ing, -ed）
   - 10個の語根（act, struct, dict, port, duct, scrib/script, spect, form, ject, miss/mit）
   - 自動品詞推定（意味テキストから推測）
   - 句パターン検出（前置詞句、動詞句、イディオム）

2. **wordMetadataCache.ts**: パフォーマンス最適化
   - メタ情報の抽出結果をキャッシュ（24時間TTL）
   - 再計算を避けてスケジューリング時間を短縮
   - 統計情報の提供（キャッシュサイズ、ヒット率）

3. **contextualLearningAI.ts**: 関連性検出とクラスタリング
   - `detectWordRelations()`: 語句間の関連性を7段階の強度で評価
     - 語根: 0.95（最強）
     - 反意語: 0.9
     - 類義語: 0.8
     - 句パターン: 0.75
     - 接頭辞: 0.7
     - 接尾辞: 0.65（同品詞のみ）
     - テーマ: 0.6（最弱）
   - `generateSemanticClusters()`: 意味的クラスターの生成
   - `generateContextualSequence()`: 最適な出題順序の生成

4. **QuestionScheduler.ts**: メインスケジューラ
   - `postProcess()`: Position範囲ごとに分割して並べ替え
   - `splitByPositionBands()`: 階層保持のための範囲分割
   - デバッグログ出力（関連性遷移、クラスター数）

5. **wordMetadataDebug.ts**: 開発用デバッグツール
   - メタ情報カバレッジの計算
   - 関連性強度分布の分析
   - Position階層の検証

6. **wordGroupingQualityMetrics.ts**: 品質測定
   - 近接率: 関連語がK個以内に配置されている割合
   - 多様性スコア: カテゴリのエントロピー
   - Position階層保持率: 違反がない割合（理想値100%）
   - 平均関連性強度: 連続する語句の関連度

## 新規語句の追加手順

### 1. 語句データの追加

通常通り `public/data/questions.json` に追加：

```json
{
  "word": "construction",
  "meaning": "建設、構造",
  "category": "noun",
  "ipa": "/kənˈstrʌkʃən/"
}
```

### 2. メタ情報の自動抽出

特別な作業は不要。システムが自動で以下を抽出：

- **接頭辞**: con-（共に）
- **語根**: struct（建てる）
- **接尾辞**: -tion（名詞化）
- **品詞**: noun（meaningから推定）

### 3. 関連語の自動グループ化

"construction"は以下と自動的にグループ化されます：

- **同語根**: structure, construct, destruction, instruction（語根: struct）
- **同接尾辞**: education, information, communication（接尾辞: -tion）
- **同テーマ**: building, architecture（テーマ: 建築）

### 4. 検証

開発モードで実行し、コンソールログを確認：

```javascript
[postProcess] 関連語グループ化適用:
  totalClusters: 15
  totalTransitions: 42
  sampleTransitions: [
    { from: "construct", to: "construction", reason: "同じ語根（struct）" },
    { from: "construction", to: "structure", reason: "同じ語根（struct）" }
  ]
```

## トラブルシューティング

### Position階層が崩れる

**症状**: 新規単語が復習単語より先に出題される

**原因**: `postProcess()`のバグまたは`splitByPositionBands()`の実装ミス

**解決策**:

1. デバッグユーティリティで検証：

   ```typescript
   import { validatePositionHierarchy } from '@/ai/optimization/wordMetadataDebug';

   const violation = validatePositionHierarchy(questions, positionMap);
   if (violation) {
     console.error('Position階層違反:', violation);
   }
   ```

2. `splitByPositionBands()`の範囲定義を確認：
   - 70-100, 60-69, 40-59, 20-39, 0-19が正しく定義されているか
   - 各範囲が重複していないか

3. フォールバック動作を確認：
   - エラー時は元の順序を返す（`catch`ブロック）

### メタ情報のカバレッジが低い

**症状**: ほとんどの語句で語根・接頭辞が検出されない

**原因**: データベースに登録されていない語根・接頭辞・接尾辞

**解決策**:

1. カバレッジ統計を確認：

   ```typescript
   import { calculateMetadataCoverage } from '@/ai/optimization/wordMetadataDebug';

   const stats = calculateMetadataCoverage(questions);
   console.log('カバレッジ:', stats);
   // 期待値: wordFamilyCoverage > 0.5（50%以上）
   ```

2. [wordMetadata.ts](../src/ai/optimization/wordMetadata.ts)に語根・接頭辞を追加：

   ```typescript
   const COMMON_PREFIXES: PrefixInfo[] = [
     // 既存のエントリ
     { prefix: 'trans-', meaning: '超えて', examples: ['transport', 'translate'] }, // 追加
   ];
   ```

3. キャッシュをクリア：
   ```typescript
   import { metadataCache } from '@/ai/optimization/wordMetadataCache';
   metadataCache.clear();
   ```

### 関連性が弱すぎる

**症状**: ほとんどの遷移が「同じクラスター」で、具体的な関連性が表示されない

**原因**: `detectWordRelations()`が関連性を検出できていない

**解決策**:

1. 関連性強度分布を確認：

   ```typescript
   import { analyzeRelationStrengthDistribution } from '@/ai/optimization/wordMetadataDebug';

   const dist = analyzeRelationStrengthDistribution(transitions);
   console.log('強度分布:', dist);
   // 期待値: veryStrong + strong > 30%
   ```

2. テーマ・類義語・反意語を追加：
   [contextualLearningAI.ts](../src/ai/optimization/contextualLearningAI.ts)の`SEMANTIC_THEMES`、`SYNONYM_GROUPS`、`ANTONYM_PAIRS`を拡張

3. 語根データベースを拡充：
   より多くの語根を`WORD_ROOTS`に追加

### パフォーマンスが遅い

**症状**: スケジューリングに3秒以上かかる

**原因**: メタ情報の抽出が毎回実行されている

**解決策**:

1. キャッシュ統計を確認：

   ```typescript
   import { metadataCache } from '@/ai/optimization/wordMetadataCache';

   const stats = metadataCache.getStats();
   console.log('キャッシュサイズ:', stats.size);
   // 期待値: size > questions.length / 2（50%以上ヒット）
   ```

2. TTLを延長（開発時のみ）：

   ```typescript
   metadataCache.setTTL(7 * 24 * 60 * 60 * 1000); // 7日間
   ```

3. 期限切れエントリを削除：
   ```typescript
   const removed = metadataCache.purgeExpired();
   console.log('削除:', removed);
   ```

## 品質測定

### 基本メトリクス

```typescript
import { calculateQualityMetrics } from '@/ai/optimization/wordGroupingQualityMetrics';

const metrics = calculateQualityMetrics(questions, positionMap);
console.log(formatQualityMetrics(metrics));
```

期待値：

- 近接率: 70%以上（関連語が5問以内に配置）
- 多様性: 60%以上（カテゴリが偏らない）
- 階層保持: 100%（違反ゼロ）
- 平均関連度: 70%以上

### ABC順との比較

```typescript
import { compareOrderingQuality } from '@/ai/optimization/wordGroupingQualityMetrics';

const comparison = compareOrderingQuality(abcQuestions, contextualQuestions, positionMap);
console.log('改善度:', comparison.improvement);
```

期待値：

- 近接率: +20%以上の改善
- 平均関連度: +30%以上の改善

## メンテナンス

### 定期メンテナンス（月次）

1. **カバレッジ確認**:
   - メタ情報カバレッジが50%以上を維持しているか
   - 新規語句で語根が検出されない場合は語根DBを拡充

2. **品質測定**:
   - 近接率・多様性・階層保持率を測定
   - 目標値を下回る場合は関連性検出ロジックを調整

3. **キャッシュ管理**:
   - 期限切れエントリを削除（`purgeExpired()`）
   - 必要に応じてキャッシュをクリア

### アップグレード時の注意

1. **Question型の変更**:
   - `Question`型にフィールドを追加した場合、`wordMetadataCache.ts`の`getCacheKey()`を更新

2. **Position計算ロジックの変更**:
   - Position値の範囲が変わった場合、`splitByPositionBands()`の範囲定義を更新

3. **関連性検出ロジックの変更**:
   - 強度値を変更した場合、品質メトリクスの期待値も更新

## テストケース

### 単体テスト

```typescript
import { extractWordMetadata } from '@/ai/optimization/wordMetadata';

describe('wordMetadata', () => {
  test('接頭辞の検出', () => {
    const meta = extractWordMetadata('unhappy', '不幸な');
    expect(meta.family?.prefix).toBe('un-');
  });

  test('語根の検出', () => {
    const meta = extractWordMetadata('construction', '建設');
    expect(meta.family?.root).toBe('struct');
  });

  test('接尾辞の検出', () => {
    const meta = extractWordMetadata('happiness', '幸福');
    expect(meta.family?.suffix).toBe('-ness');
  });
});
```

### 統合テスト

```typescript
import { detectWordRelations } from '@/ai/optimization/contextualLearningAI';

describe('contextualLearningAI', () => {
  test('語根による関連性検出', () => {
    const relation = detectWordRelations('construct', 'construction');
    expect(relation?.relationType).toBe('word_family');
    expect(relation?.strength).toBe(0.95);
  });

  test('反意語の検出', () => {
    const relation = detectWordRelations('happy', 'sad');
    expect(relation?.relationType).toBe('antonym');
    expect(relation?.strength).toBe(0.9);
  });
});
```

### Position階層テスト

```typescript
import { validatePositionHierarchy } from '@/ai/optimization/wordMetadataDebug';

describe('QuestionScheduler', () => {
  test('Position階層が保持される', () => {
    const questions = [
      { word: 'a', position: 80 },
      { word: 'b', position: 70 },
      { word: 'c', position: 60 },
    ];
    const positionMap = new Map([
      ['a', 80],
      ['b', 70],
      ['c', 60],
    ]);

    const violation = validatePositionHierarchy(questions, positionMap);
    expect(violation).toBeNull();
  });

  test('Position階層違反を検出', () => {
    const questions = [
      { word: 'a', position: 60 },
      { word: 'b', position: 80 }, // 違反
    ];
    const positionMap = new Map([
      ['a', 60],
      ['b', 80],
    ]);

    const violation = validatePositionHierarchy(questions, positionMap);
    expect(violation).not.toBeNull();
    expect(violation?.violationIndex).toBe(0);
  });
});
```

## 今後の拡張

### Phase 2: 外部辞書連携

- Oxford Dictionary APIやWordNetとの連携
- より正確な語源・品詞情報の取得

### Phase 3: 埋め込みベクトル

- Sentence-BERTによる意味的類似度の計算
- より細かい意味的関連性の検出

### Phase 4: LLM活用

- GPT-4による動的な関連性判定
- ユーザーの学習履歴に基づくパーソナライズ

---

**更新日**: 2025-01-XX  
**作成者**: QuestionScheduler AI Team
