## モバイル自動最適化の実装ガイド

作成されたフック、CSSメディアクエリ、実装パターンを使って、すべてのコンポーネントを自動最適化できます。

### 📚 作成済みの基盤

#### 1. **useMediaQuery フック** (`src/hooks/useMediaQuery.ts`)
```typescript
import { useIsMobile } from '../hooks/useMediaQuery';

const MyComponent = () => {
  const isMobile = useIsMobile(768); // 768px以下 = モバイル
  // または
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  
  if (isMobile) {
    // モバイル専用UI
  }
};
```

#### 2. **useResponsiveClick フック** (`src/hooks/useResponsiveClick.ts`)
```typescript
import { useResponsiveClick } from '../hooks/useResponsiveClick';

const Button = () => {
  const props = useResponsiveClick(() => handleClick());
  return <button {...props}>クリック</button>;
  // 自動でタップ・クリック両対応、ホバー残存防止
};
```

#### 3. **CSSメディアクエリ** (`src/index.css`)
```css
/* マウス: ホバー効果を有効 */
@media (hover: hover) {
  button:hover { /* ホバーエフェクト */ }
}

/* タッチ: アクティブ状態を強化 */
@media (hover: none) {
  button:active { /* タップフィードバック */ }
}
```

### 🎯 実装パターン

#### パターン1: Tailwindのレスポンシブクラスで統一対応（推奨）

```tsx
// ❌ 従来: isMobileで条件分岐
{isMobile ? <MobileUI /> : <DesktopUI />}

// ✅ 改善: Tailwindで自動調整
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
  {/* モバイル: 2列、デスクトップ: 4列に自動調整 */}
</div>

<button className="w-full md:w-auto px-3 md:px-6 py-2 md:py-3 text-sm md:text-base">
  {/* モバイルで全幅、デスクトップで自動幅 */}
</button>
```

#### パターン2: 大きく異なる場合のみコンポーネント分割

```tsx
import { useIsMobile } from '../hooks/useMediaQuery';

const MyComponent = () => {
  const isMobile = useIsMobile();
  
  // 本当に大きく異なる場合のみ分割
  if (isMobile) {
    return <MobileOnlyComponent />;
  }
  
  return <DesktopOnlyComponent />;
};
```

#### パターン3: タッチ対応の統一フック

```tsx
import { useResponsiveClick } from '../hooks/useResponsiveClick';

const QuizButton = ({ choice, onAnswer }) => {
  const props = useResponsiveClick(() => onAnswer(choice));
  
  return (
    <button 
      {...props}
      className="w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95"
    >
      {choice}
    </button>
  );
};
```

### 📋 実装チェックリスト

#### 基本ルール
- [ ] 条件分岐なしで1つのコンポーネントで両対応
- [ ] Tailwindの`sm:`, `md:`, `lg:`ブレークポイントを活用
- [ ] `:hover`は`@media (hover: hover)`で条件付け
- [ ] `:active`でタップフィードバックを提供

#### レイアウト最適化
- [ ] グリッド列数: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [ ] ボタンサイズ: `w-full sm:w-auto`
- [ ] 間隔調整: `gap-2 sm:gap-4 md:gap-6`
- [ ] パディング: `p-2 sm:p-4 md:p-6`

#### タッチ対応
- [ ] クリック・タップ両対応: `useResponsiveClick`フックを使用
- [ ] ホバー残存防止: `@media (hover: none)`で制御
- [ ] ターゲットサイズ: 最小44px × 44px

#### テキスト最適化
- [ ] フォントサイズ: `text-sm sm:text-base md:text-lg`
- [ ] 表示切り替え: `hidden sm:inline` / `sm:hidden`
- [ ] テキストオーバーフロー: `truncate`で対応

### 🚀 実装ステップ

#### ステップ1: フックをインポート
```tsx
import { useIsMobile } from '../hooks/useMediaQuery';
import { useResponsiveClick } from '../hooks/useResponsiveClick';
```

#### ステップ2: Tailwindクラスに置き換え
```tsx
// ❌ 前
<div className={isMobile ? 'w-full' : 'w-96'}>

// ✅ 後
<div className="w-full md:w-96">
```

#### ステップ3: アクティブ状態の実装
```tsx
// ❌ 前
<button className="hover:bg-blue-600">Click</button>

// ✅ 後
<button className="hover:bg-blue-600 active:bg-blue-700 active:scale-95">
  Click
</button>
```

### 💡 よくある修正例

#### 例1: ScoreBoard のタブUI

```tsx
// ❌ 従来
{!isMobile && <div className="grid grid-cols-4">...</div>}
{isMobile && <div className="grid grid-cols-2">...</div>}

// ✅ 改善
<div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
  <button className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
    <span className="hidden sm:inline">📋 プラン</span>
    <span className="sm:hidden">📋</span>
  </button>
  {/* 他のタブも同様 */}
</div>
```

#### 例2: FloatingPanel（モーダル）

```tsx
// ❌ 従来
<div className="max-w-4xl w-full">

// ✅ 改善
<div className="max-w-2xl sm:max-w-4xl w-full mx-auto">
```

#### 例3: フォームレイアウト

```tsx
// ❌ 従来
<div className="flex justify-between gap-4">
  <input className="w-1/2" />
  <input className="w-1/2" />
</div>

// ✅ 改善
<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
  <input className="flex-1" />
  <input className="flex-1" />
</div>
```

### 🔧 トラブルシューティング

#### 問題: モバイルで文字が小さすぎる
```tsx
// 解決: Tailwindブレークポイント追加
<p className="text-xs sm:text-sm md:text-base">
```

#### 問題: ボタンが押しづらい（タッチターゲット小さい）
```tsx
// 解決: 最小44px × 44px確保
<button className="w-full px-4 py-3">
  {/* 最小: 44px × 48px */}
</button>
```

#### 問題: ホバー状態がモバイルで残存
```tsx
// 解決: メディアクエリで条件付け（src/index.cssで既設定）
@media (hover: none) {
  button:focus { outline: 2px solid; }
}
```

### 📊 Tailwindブレークポイント対応表

| ブレークポイント | デバイス | クラスプレフィックス |
|------------------|----------|----------------------|
| < 640px | モバイル | なし（デフォルト） |
| 640px～767px | 小タブレット | `sm:` |
| 768px～1023px | タブレット | `md:` |
| 1024px～ | デスクトップ | `lg:` |

### 🎬 次のステップ

1. **既存コンポーネントの修正優先順**
   - ScoreBoard（タブUI）
   - FloatingPanel（モーダル）
   - QuestionCard（クイズ表示）
   - GrammarQuizView（文法クイズ）

1. **新規コンポーネント開発時**
   - 最初からTailwindのレスポンシブクラスで実装
   - `isMobile`条件分岐なし
   - `useResponsiveClick`フック使用

1. **全体最適化**
   - CSS: `:hover`を`@media (hover: hover)`で条件付け
   - 全ボタンにアクティブ状態を追加
   - タッチターゲットサイズ確認

---

**これらの基盤が整備されているため、各コンポーネントの修正は最小限で実現できます。**
