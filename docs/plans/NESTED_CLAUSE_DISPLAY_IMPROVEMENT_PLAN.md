# 節句分割の入れ子表示改善計画

## 📋 プロジェト概要

**作成日**: 2026年1月2日  
**優先度**: 高  
**推定工数**: 中規模（2-4日）  
**影響範囲**: clauseParser.ts, ExplanationBoard.tsx, 型定義

---

## 🎯 目標

従属節の中に句が入れ子になる形式で正しく表示する。

### 期待される表示形式
```
He learned ( that people < around the world > can't get food < to eat > ) .
           ↑従属節開始  ↑句1↑        続き           ↑句2↑    終了↑
```

### 現在の表示形式（問題あり）
```
He learned ( that people ) < around the world > < can't get food > < to eat > .
           ↑従属節↑        ↑句1として独立↑      ↑句2として独立↑
```

---

## 🔍 問題の詳細分析

### 根本原因
`clauseParser.ts`の`createSegments()`関数（218-285行）が、境界情報に基づいてフラットな配列を返すため、従属節の範囲情報が失われる。

### 技術的課題

#### 1. データ構造の問題
```typescript
// 現在の型定義 (src/types/passage.ts:75-79)
export interface ClauseSegment {
  text: string;
  type: 'main-clause' | 'subordinate-clause' | 'phrase';
  words: WordWithSVOCM[];
}

// 問題点: 親子関係を表現できない
// segments = [
//   {type: 'main-clause', text: 'He learned'},
//   {type: 'subordinate-clause', text: 'that people'},
//   {type: 'phrase', text: 'around the world'},  // ← どの節の中？
//   {type: 'phrase', text: "can't get food"},
//   {type: 'phrase', text: 'to eat'}
// ]
```

#### 2. セグメント作成ロジックの問題
- `detectBoundaries()`（140-215行）は境界位置のみを検出
- 従属節の**開始位置**は分かるが、**終了位置**を判定するロジックがない
- 結果として、従属節内の句を識別できない

#### 3. 表示ロジックの問題
```typescript
// ExplanationBoard.tsx:262-300 (ClauseTab)
switch (segment.type) {
  case 'subordinate-clause':
    return <span>( {words})</span>;  // ← 独立した要素として表示
  case 'phrase':
    return <span>&lt; {words}&gt;</span>;  // ← 独立した要素として表示
}
```

---

## 💡 解決策の選択肢

### オプションA: ネスト型データ構造への完全改修 ⭐（推奨）

#### 概要
型定義を変更し、セグメントが子セグメントを持てるようにする。

#### 新しい型定義案
```typescript
export interface ClauseSegment {
  text: string;
  type: 'main-clause' | 'subordinate-clause' | 'phrase';
  words: WordWithSVOCM[];
  children?: ClauseSegment[];  // ← 追加
  parentId?: string;           // ← 追加（オプション）
}
```

#### 実装箇所
1. **型定義変更**: `src/types/passage.ts`（1ファイル）
2. **パーサー改修**: `src/utils/clauseParser.ts`
   - `createSegments()`を完全書き換え
   - 従属節の終了位置を判定するロジック追加
   - 括弧の深さ（depth）をトラッキング
3. **表示ロジック改修**: `ExplanationBoard.tsx`
   - ClauseTabを再帰的レンダリングに変更

#### メリット
- ✅ データ構造が問題の本質に適合
- ✅ 将来的な拡張性が高い（多段ネストにも対応可能）
- ✅ 表示ロジックがシンプルになる

#### デメリット
- ❌ 既存コードへの影響が大きい
- ❌ テストケースの追加が必要
- ❌ 工数が大きい（2-4日）

#### リスク評価
- **中リスク**: 型変更に伴うバグが混入する可能性
- **既存機能への影響**: 他のタブ（フレーズ訳、日本語訳、語句確認）は影響なし
- **テスト必須箇所**: 
  - 多段ネスト（従属節の中に従属節がある場合）
  - 句のみの文
  - 従属節のみの文

---

### オプションB: 表示レイヤーでの動的判定

#### 概要
データ構造は変更せず、表示時にboundary情報から括弧の開閉を計算する。

#### 実装アプローチ
1. `parseClausesAndPhrases()`の戻り値に`boundaries`配列を追加
2. ClauseTabで、各segmentの位置とboundariesを比較
3. 「このphraseは従属節の範囲内か？」を動的判定

#### メリット
- ✅ 最小変更で実装可能
- ✅ 型定義の変更不要
- ✅ 工数が小さい（1日）

#### デメリット
- ❌ 表示ロジックが複雑になる
- ❌ パフォーマンスへの影響（毎回計算）
- ❌ バグが入りやすい（条件分岐が多い）

#### リスク評価
- **低リスク**: 既存のデータ構造を変更しない
- **保守性**: 表示ロジックの可読性が低下

---

### オプションC: ハイブリッド案（段階的実装）

#### 概要
オプションBで迅速に対応し、後でオプションAに移行する。

#### 実装ステップ
1. **Phase 1（即日対応）**: 表示レイヤーで暫定対応
2. **Phase 2（1週間後）**: データ構造を改修

#### メリット
- ✅ ユーザーへの迅速なフィードバック
- ✅ リスク分散

#### デメリット
- ❌ 二度手間
- ❌ コードの一時的な複雑化

---

## 📊 推奨案の選定

### 最終推奨: **オプションA（ネスト型データ構造）**

#### 選定理由
1. **長期的な保守性**: データ構造が問題の本質に適合しており、将来的なバグを防げる
2. **拡張性**: 多段ネスト（従属節の中に従属節）にも対応可能
3. **コードの可読性**: 表示ロジックが再帰的でシンプルになる
4. **工数対効果**: 2-4日の投資で、堅牢な実装が得られる

#### 緊急度が高い場合の代替案
- オプションC（ハイブリッド案）を採用
- Phase 1で暫定対応→即座にユーザーへフィードバック
- Phase 2で本格改修→技術的負債を解消

---

## 🚀 実装計画（オプションA採用時）

### Step 1: 型定義の拡張 ⏱️ 30分
**ファイル**: `src/types/passage.ts`

```typescript
export interface ClauseSegment {
  text: string;
  type: 'main-clause' | 'subordinate-clause' | 'phrase';
  words: WordWithSVOCM[];
  children?: ClauseSegment[];  // 子セグメント
}
```

### Step 2: パーサーの改修 ⏱️ 4-6時間
**ファイル**: `src/utils/clauseParser.ts`

#### 2-1. 従属節の終了位置を判定する関数を追加
```typescript
function findSubordinateClauseEnd(
  words: Array<{ word: string; index: number }>,
  startIndex: number
): number {
  // 括弧、コンマ、ピリオドで終了を判定
  // または次の従属接続詞・関係詞で終了
}
```

#### 2-2. `createSegments()`を完全書き換え
- 従属節を検出したら、その範囲内の句を`children`に格納
- 再帰的にネスト構造を構築

#### 2-3. テストケース追加
```typescript
// test/clauseParser.test.ts
describe('parseClausesAndPhrases with nested structure', () => {
  it('should parse subordinate clause with nested phrases', () => {
    const result = parseClausesAndPhrases(
      'He learned that people around the world can\'t get food to eat.'
    );
    
    expect(result.segments).toHaveLength(2); // 'He learned' + subordinate clause
    expect(result.segments[1].children).toHaveLength(3); // 'that people' + 2 phrases
  });
});
```

### Step 3: 表示ロジックの改修 ⏱️ 2-3時間
**ファイル**: `ExplanationBoard.tsx`

```typescript
const ClauseTab = ({ parsed }: { parsed: ClauseParsedSentence }) => {
  const renderSegment = (segment: ClauseSegment, depth: number = 0): JSX.Element => {
    const words = segment.words.map((w, i) => (
      <span key={i} className={getSVOCMClass(w.component)}>
        {w.word}{' '}
      </span>
    ));

    if (segment.type === 'subordinate-clause') {
      return (
        <span>
          ( {words}
          {segment.children?.map((child, i) => renderSegment(child, depth + 1))}
          )
        </span>
      );
    } else if (segment.type === 'phrase') {
      return <span>&lt; {words}&gt;</span>;
    } else {
      return <span>{words}</span>;
    }
  };

  return (
    <div className="clause-display">
      {parsed.segments.map((segment, i) => (
        <React.Fragment key={i}>{renderSegment(segment)}</React.Fragment>
      ))}
    </div>
  );
};
```

### Step 4: 動作確認 ⏱️ 2時間
1. 開発サーバーで`J_2022_5`を表示
2. 期待される形式で表示されるか確認
3. エッジケースのテスト:
   - 従属節のみの文
   - 句のみの文
   - 多段ネスト

### Step 5: ドキュメント更新 ⏱️ 1時間
- `docs/features/READING_PASSAGE_CLAUSE_DISPLAY.md`を作成
- 実装の詳細を記録

---

## 📅 スケジュール

| タスク | 工数 | 担当 | 期限 |
|--------|------|------|------|
| Step 1: 型定義 | 0.5h | AI | 即日 |
| Step 2: パーサー改修 | 6h | AI | +1日 |
| Step 3: 表示ロジック | 3h | AI | +1日 |
| Step 4: 動作確認 | 2h | Human | +1日 |
| Step 5: ドキュメント | 1h | AI | +1日 |
| **合計** | **12.5h** | - | **2-3日** |

---

## ⚠️ リスクと対策

### リスク1: 型変更に伴うバグ
**対策**: 
- TypeScriptの厳密な型チェックを活用
- テストケースを事前に作成

### リスク2: パフォーマンス低下
**対策**: 
- `useMemo`で再帰的レンダリングを最適化
- 100文以上のパッセージでパフォーマンステスト

### リスク3: エッジケースの見落とし
**対策**: 
- 複雑な構文のテストケースを用意
  - `"Because he knew that people who live in poor countries can't get food, he decided to help."`
  - 多段ネスト、複数の従属節

---

## ✅ 成功基準

### 必須要件
- ✅ `J_2022_5`の文が期待される形式で表示される
- ✅ SVOCM下線が正しく表示される
- ✅ 既存のタブ（フレーズ訳等）に影響なし

### 推奨要件
- ✅ 多段ネストに対応
- ✅ パフォーマンス劣化なし（100ms以内）
- ✅ ユニットテストカバレッジ80%以上

---

## 📝 代替案の評価まとめ

| 項目 | オプションA | オプションB | オプションC |
|------|------------|------------|------------|
| 工数 | 12.5h | 8h | 16h（合計） |
| リスク | 中 | 低 | 中 |
| 保守性 | 高 | 低 | 高 |
| 拡張性 | 高 | 低 | 高 |
| 即効性 | 低 | 高 | 高 |
| **推奨度** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎬 次のアクション

### 即座に実施
1. この計画をユーザーにレビュー依頼
2. 承認後、Step 1から着手

### ユーザーへの質問
- [ ] オプションA（本格改修）で進めてよいか？
- [ ] 緊急度が高い場合、オプションC（段階的実装）を希望するか？
- [ ] 工数2-3日は許容範囲か？

---

**作成者**: GitHub Copilot  
**レビュー必須**: この計画を実装前にユーザーと合意すること
