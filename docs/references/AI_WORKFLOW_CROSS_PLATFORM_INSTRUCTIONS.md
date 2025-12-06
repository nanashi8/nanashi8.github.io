# AI開発ワークフロー: クロスプラットフォーム実装指示

## AIアシスタントへの重要な指示

### プラットフォーム言及の解釈ルール

**ユーザーが以下のいずれかに言及した場合、全てのプラットフォームへの指示として解釈すること:**

```
モバイル版 → 全プラットフォーム
デスクトップ版 → 全プラットフォーム  
Windows版 → 全プラットフォーム
Mac版 → 全プラットフォーム
iOS版 → 全プラットフォーム
Android版 → 全プラットフォーム
その他任意の版 → 全プラットフォーム
```

### 実装パイプライン

#### ステップ1: 要求分析

ユーザーの要求を受け取ったら:

1. **プラットフォーム中立的な機能要求として解釈**
   - 「モバイル版で○○を実装」→「全プラットフォームで○○を実装」
   - 「デスクトップ版の△△を修正」→「全プラットフォームの△△を修正」

1. **機能仕様の確認**
   - データ構造: 全プラットフォーム共通か？
   - ビジネスロジック: プラットフォーム非依存か？
   - UI/UX: レスポンシブ対応可能か？

#### ステップ2: モバイル例外の判定

以下の条件を**全て満たす場合のみ**、モバイル固有実装を検討:

```typescript
// 例外判定フローチャート
const shouldApplyMobileException = (requirement: Requirement): boolean => {
  // 条件1: 物理的制約があるか？
  const hasPhysicalConstraint = 
    requirement.needsSmallScreenLayout || 
    requirement.needsTouchOptimization;
  
  // 条件2: 機能的同等性は保たれるか？
  const maintainsFunctionalParity = 
    requirement.provideSameFeatures && 
    requirement.achieveSameTasks;
  
  // 条件3: ユーザビリティ向上があるか？
  const improvesUsability = 
    requirement.betterMobileUX && 
    !requirement.degradeDesktopUX;
  
  return hasPhysicalConstraint && 
         maintainsFunctionalParity && 
         improvesUsability;
};
```

#### ステップ3: 実装方針の決定

```typescript
// 推奨実装パターン
interface ImplementationStrategy {
  // 1. データ層: 完全統一
  storage: {
    structure: 'unified',  // 全プラットフォーム同一
    keys: 'common',        // 共通のキー名
    validation: 'shared'   // 共通のバリデーション
  };
  
  // 2. ビジネスロジック層: 完全統一  
  logic: {
    calculations: 'platform-agnostic',  // プラットフォーム非依存
    algorithms: 'unified',               // 統一されたアルゴリズム
    stateManagement: 'common'            // 共通の状態管理
  };
  
  // 3. プレゼンテーション層: レスポンシブ
  ui: {
    layout: 'responsive-css',      // CSSメディアクエリで対応
    interactions: 'unified',       // 統一された操作
    styling: 'mobile-first-with-desktop-enhancements'
  };
}
```

#### ステップ4: コード実装

**必須チェック項目:**

- [ ] TypeScriptの型定義に`isMobile`等の分岐がない
- [ ] LocalStorage関数が全プラットフォーム共通
- [ ] 計算ロジックにプラットフォーム依存がない
- [ ] CSSのみで表示差異を実現（可能な限り）
- [ ] モバイル例外がある場合、コメントで理由を明記

**実装テンプレート:**

```typescript
// ✅ 推奨: プラットフォーム統一実装
export const saveUserProgress = (progress: Progress): void => {
  // 全プラットフォーム共通のストレージ処理
  localStorage.setItem('user-progress', JSON.stringify(progress));
};

export const calculateRetentionRate = (stats: Stats): number => {
  // プラットフォーム非依存の計算ロジック
  return stats.correct / stats.total * 100;
};

// ✅ 許容: 表示最適化のみのモバイル例外
export const ScoreBoard = ({ data }: Props) => {
  const isMobile = window.innerWidth <= 768;
  
  return (
    <div className={`score-board ${isMobile ? 'mobile' : ''}`}>
      {/* 機能は全プラットフォーム同一 */}
      <Tabs tabs={allTabs} />
    </div>
  );
};

// CSS側で表示差異を実現
// .score-board.mobile { /* モバイル最適化 */ }
```

#### ステップ5: レビューと検証

**自動チェック項目:**

```typescript
// 実装後に確認すべきアンチパターン
const antiPatterns = [
  /if.*isMobile.*return.*different.*feature/,  // 機能分岐
  /platform === 'mobile' \? .*Data : .*Data/,  // データ構造分岐
  /mobile.*StorageKey.*desktop.*StorageKey/,   // ストレージキー分岐
];

// これらのパターンが見つかった場合は設計を見直す
```

**手動チェック項目:**

1. デスクトップブラウザで動作確認
1. モバイルブラウザ（実機またはDevTools）で動作確認
1. 両方で同じタスクが同じ手順で達成できるか確認
1. LocalStorageの内容が同一か確認

### エラーハンドリング

#### パターン1: 機能分岐を求められた場合

```
ユーザー: 「モバイル版では統計タブを非表示にしてください」

AI応答: 
「承知しました。ただし、クロスプラットフォーム開発ガイドラインに従い、
全プラットフォームで統計タブを非表示にします。

もしモバイルのみでの非表示が必要な場合は、その理由を教えていただけますか？
画面スペースの制約であれば、タブをスクロール可能にするなど、
機能を維持したまま表示を最適化する方法を提案します。」
```

#### パターン2: データ構造変更を求められた場合

```
ユーザー: 「モバイル版のストレージキーを変更してください」

AI応答:
「ストレージキーの変更は全プラットフォームに適用されます。
これにより、デスクトップ版とモバイル版でデータが共有されなくなりますが、
それは意図された動作でしょうか？

もし意図されている場合は、データ移行ロジックも実装します。」
```

### 実装例外の文書化

モバイル固有実装が必要な場合、以下の形式でコメントを追加:

```typescript
/**
 * MOBILE EXCEPTION - Display Optimization Only
 * 
 * Reason: Screen width constraint (≤768px) requires vertical tab layout
 * with icon + label for better touch target size and readability.
 * 
 * Functional Parity: ✅ All tabs and features identical across platforms
 * Desktop UX Impact: ✅ No degradation (desktop uses horizontal icon-only layout)
 * Mobile UX Improvement: ✅ Better accessibility and usability
 * 
 * Implementation: CSS media query (@media max-width: 768px)
 * Date: 2025-11-29
 * Approved by: Cross-platform development guideline §2.2
 */
```

## まとめ

### AI実装時の思考プロセス

1. **ユーザー要求を受け取る**
   - 「モバイル版」と言われても「全プラットフォーム」と解釈

1. **機能を分析する**
   - データ/ロジック/UIの3層で考える
   - データとロジックは必ず統一
   - UIはレスポンシブ優先、例外は最小限

1. **実装する**
   - プラットフォーム分岐を避ける
   - CSS で表示差異を実現
   - 共通のデータ構造とロジック

1. **検証する**
   - 全プラットフォームでテスト
   - 機能の完全一致を確認
   - 例外がある場合は文書化

### 最優先事項

**「ユーザーがどのプラットフォームについて言及しても、全てのプラットフォームで同じ機能を提供する」**

これが当プロジェクトの根幹原則です。

---

*最終更新: 2025年11月29日*
*適用対象: 全AI開発ワークフロー*
