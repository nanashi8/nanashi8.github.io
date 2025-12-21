---
title: パイプラインリファクタリングログ
created: 2025-11-30
updated: 2025-12-07
status: deprecated
tags: [archive]
---

# パイプラインリファクタリングログ

## 実施日: 2025年11月30日

## 問題点の分析

### 重複コードの特定
開発中に以下の非効率な部分を発見：

1. **学習設定UIの重複**
   - QuizView.tsx
   - SpellingView.tsx
   - GrammarQuizView.tsx
   
   これら3つのファイルで、学習上限設定のUIコードが完全に重複していた。

1. **状態管理ロジックの重複**
   - 各ファイルで個別に`useState`を使用
   - localStorageアクセスが分散
   - デフォルト値の設定が各所に散在

1. **保守性の問題**
   - 変更時に3ファイル全てを更新する必要
   - コードの一貫性が保証されない
   - バグ修正時の漏れのリスク

## 実施した改善

### 1. カスタムフックの作成
**ファイル**: `src/hooks/useLearningLimits.ts`

**目的**:
- 学習上限の状態管理を一元化
- localStorageアクセスをカプセル化
- デフォルト値の管理を統一

**機能**:
```typescript
export function useLearningLimits(mode: 'translation' | 'spelling' | 'grammar'): LearningLimits {
  // 学習中上限: デフォルト30
  // 要復習上限: デフォルト10
  // 自動的にlocalStorageに永続化
}
```

### 2. 共通コンポーネントの作成
**ファイル**: `src/components/LearningLimitsInput.tsx`

**目的**:
- UIの重複を排除
- 一貫したユーザー体験を提供
- 保守性の向上

**機能**:
- 学習中上限入力フィールド
- 要復習上限入力フィールド
- ヘルプテキスト表示
- ID衝突を避けるプレフィックス対応

### 3. 既存コードのリファクタリング

#### QuizView.tsx
- `useLearningLimits('translation')`使用
- `LearningLimitsInput`コンポーネントで置換
- 重複コード削除: 約60行 → 10行

#### SpellingView.tsx
- `useLearningLimits('spelling')`使用
- `LearningLimitsInput`コンポーネントで置換
- 重複コード削除: 約60行 → 10行

#### GrammarQuizView.tsx
- `useLearningLimits('grammar')`使用
- `LearningLimitsInput`コンポーネントで置換
- 重複コード削除: 約60行 → 10行

## 改善効果

### コードメトリクス
- **削減した重複コード**: 約180行
- **新規追加コード**: 約100行（再利用可能）
- **実質的な削減**: 約80行
- **保守対象ファイル数**: 3ファイル → 2ファイル（フック + コンポーネント）

### 開発効率の向上
1. **変更の容易性**: 1箇所の修正で全体に反映
1. **バグの減少**: 重複がないため一貫性が保証される
1. **テスタビリティ**: フックとコンポーネントを独立してテスト可能
1. **可読性**: コードの意図が明確

### 今後の拡張性
- 新しいクイズモード追加時の開発コスト削減
- 学習設定の機能追加が容易
- 他の設定項目への適用可能

## ビルド結果
```
✓ 283 modules transformed.
dist/assets/index-Cv6aKqF4.js  465.91 kB │ gzip: 151.14 kB
✓ built in 2.25s
```

バンドルサイズ: 前回比 -3.43 kB（最適化効果）

## 学んだ教訓

### DRY原則の徹底
- Don't Repeat Yourself原則を守ることで保守性が大幅に向上
- 重複コードは早期に発見してリファクタリングすべき

### React設計パターン
- カスタムフックでロジックを分離
- プレゼンテーショナルコンポーネントでUIを統一
- 関心の分離が明確になる

### パイプライン改善の重要性
- 開発中に非効率を発見したら即座に対処
- リファクタリングは技術的負債の予防投資
- 長期的な開発効率に大きく影響

## 次のステップ

### 今後のリファクタリング候補
1. 自動次へ設定のカスタムフック化
1. フィルター設定の共通化
1. セッション統計管理の一元化

### パイプライン監視
- ビルド時間の継続的モニタリング
- バンドルサイズの追跡
- 重複コードの定期的なチェック

## 関連ファイル
- `src/hooks/useLearningLimits.ts` (新規)
- `src/components/LearningLimitsInput.tsx` (新規)
- `src/components/QuizView.tsx` (更新)
- `src/components/SpellingView.tsx` (更新)
- `src/components/GrammarQuizView.tsx` (更新)
