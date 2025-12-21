# CSS色指定のベストプラクティス

## 目次
1. [直接色指定とCSS変数の違い](#直接色指定とcss変数の違い)
1. [なぜCSS変数を使うべきか](#なぜcss変数を使うべきか)
1. [具体例：問題のあるコードと修正後](#具体例問題のあるコードと修正後)
1. [例外ケース：直接色指定が許容される場合](#例外ケース直接色指定が許容される場合)
1. [チェックリスト](#チェックリスト)

---

## 直接色指定とCSS変数の違い

### 直接色指定（❌ 非推奨）
```css
.dark-mode .my-card {
  background: #2a2a2a;      /* 暗い灰色をハードコード */
  color: #e0e0e0;           /* 明るい灰色をハードコード */
  border-color: #444;       /* 中間灰色をハードコード */
}
```

**問題点:**
- 色の値が**コード内に直接埋め込まれている**（ハードコード）
- 同じ色を使う場所が増えると、変更時に**全箇所を修正**しなければならない
- ライトモード/ダークモードで**意図しない色が表示される**リスク
- ブラウザやシステム設定による**予期しない挙動**が発生する可能性

### CSS変数（✅ 推奨）
```css
.dark-mode .my-card {
  background: var(--bg-secondary);    /* 二次背景色（変数参照） */
  color: var(--text-color);           /* 主要テキスト色（変数参照） */
  border-color: var(--border-color);  /* ボーダー色（変数参照） */
}
```

**メリット:**
- 色の定義が**一箇所に集約**されている（`:root`と`.dark-mode`）
- テーマ変更時に**変数の値を変えるだけ**で全体に反映
- **意味のある名前**（`--bg-secondary`）で役割が明確
- ライトモード/ダークモードの**一貫性が保証**される

---

## なぜCSS変数を使うべきか

### 1. **保守性の向上**
```css
/* ❌ 悪い例：50箇所で同じ色を使っている */
.header { background: #2a2a2a; }
.sidebar { background: #2a2a2a; }
.footer { background: #2a2a2a; }
/* ... あと47箇所 ... */

/* ✅ 良い例：変数で一元管理 */
.header { background: var(--bg-secondary); }
.sidebar { background: var(--bg-secondary); }
.footer { background: var(--bg-secondary); }
```

色を変更する場合：
- **直接色指定**: 50箇所すべてを検索・置換（漏れのリスク）
- **CSS変数**: `:root`で1箇所だけ変更

### 2. **ダークモード対応の簡潔さ**
```css
/* ===== ライトモードの定義 ===== */
:root {
  --bg-secondary: #f8f9fa;    /* 明るい灰色 */
  --text-color: #333333;      /* 暗いテキスト */
}

/* ===== ダークモードの定義 ===== */
.dark-mode {
  --bg-secondary: #2a2a2a;    /* 暗い灰色 */
  --text-color: #e0e0e0;      /* 明るいテキスト */
}

/* ===== コンポーネントのスタイル ===== */
/* モード切替は自動的に適用される！ */
.my-card {
  background: var(--bg-secondary);
  color: var(--text-color);
}
```

`.dark-mode`クラスが追加されると、**自動的に変数の値が切り替わる**ため、コンポーネント側で何も変更する必要がありません。

### 3. **ブラウザ間の一貫性**
VS Codeのシンプルブラウザは、システムのカラースキーム設定（macOSのダークモードなど）を検出することがあります。

```css
/* ❌ 問題が起きる例 */
.dark-mode .empty-state {
  background: #2a2a2a;  /* 直接指定 */
}
```

**症状**: 
- Safariではライトモードで表示（背景が白）
- シンプルブラウザではダークモードで表示（背景が黒）
- 理由：ブラウザがシステム設定を検出して`.dark-mode`を自動適用

```css
/* ✅ 解決策 */
.dark-mode .empty-state {
  background: var(--bg-secondary);  /* 変数参照 */
}
```

変数を使えば、**明示的に定義された値**が使われるため、ブラウザによる自動判定の影響を受けません。

---

## 具体例：問題のあるコードと修正後

### 例1: 統計テーブル

#### ❌ 修正前（直接色指定）
```css
.dark-mode .stats-table {
  background: #2a2a2a;
  color: #e0e0e0;
}

.dark-mode .stats-table tbody tr {
  border-color: #444;
}

.dark-mode .stats-table tbody tr:hover {
  background: #333;
}
```

**問題点:**
- `#2a2a2a`, `#444`, `#333`が複数箇所に散在
- 色を変更する場合、全箇所を探して修正が必要
- 意図しない色の不一致が発生する可能性

#### ✅ 修正後（CSS変数）
```css
.dark-mode .stats-table {
  background: var(--bg-secondary);
  color: var(--text-color);
}

.dark-mode .stats-table tbody tr {
  border-color: var(--border-color);
}

.dark-mode .stats-table tbody tr:hover {
  background: var(--bg-tertiary);
}
```

**改善点:**
- 意味のある名前で役割が明確（`--bg-secondary` = 二次背景色）
- 色の変更は`:root`と`.dark-mode`の定義だけで完了
- 将来的なテーマ変更にも柔軟に対応可能

### 例2: ボタン

#### ❌ 修正前
```css
.dark-mode .choice-button {
  background: #3a3a3a;
  color: #ffffff;
  border-color: #777;
}

.dark-mode .choice-button:hover {
  background: #4a4a4a;
}
```

#### ✅ 修正後
```css
.dark-mode .choice-button {
  background: var(--bg-tertiary);
  color: var(--text-color);
  border-color: var(--border-color);
}

.dark-mode .choice-button:hover {
  background: var(--bg-tertiary);  /* または独自のホバー色変数 */
}
```

### 例3: カード

#### ❌ 修正前
```css
.dark-mode .gamification-panel {
  background: var(--background);
  color: #e0e0e0;  /* ← 混在している！ */
}

.dark-mode .stat-item {
  background: #2a2a2a;  /* ← 直接指定 */
  border-color: #444;
}
```

**問題点**: 変数と直接指定が**混在**していて統一感がない

#### ✅ 修正後
```css
.dark-mode .gamification-panel {
  background: var(--background);
  color: var(--text-color);  /* ← 統一 */
}

.dark-mode .stat-item {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}
```

---

## 例外ケース：直接色指定が許容される場合

CSS変数を使うのが基本ですが、以下のケースでは**直接色指定が許容**されます。

### 1. セマンティックカラー（意味を持つ色）

成功・エラー・警告など、特定の意味を持つ色は直接指定してもOKです。

```css
/* ✅ OK: 成功メッセージの背景色 */
.dark-mode .choice-button.correct {
  background: #1e5a28;          /* 成功の緑（暗い背景） */
  color: #d1fae5;               /* 成功の緑（明るいテキスト） */
  border-color: #4ade80;        /* 成功の緑（ボーダー） */
}

/* ✅ OK: エラーメッセージの背景色 */
.dark-mode .choice-button.incorrect {
  background: #5a1e1e;          /* エラーの赤（暗い背景） */
  color: #fecaca;               /* エラーの赤（明るいテキスト） */
  border-color: #f87171;        /* エラーの赤（ボーダー） */
}

/* ✅ OK: 警告メッセージの背景色 */
.dark-mode .hint-box {
  background: #78350f;          /* 警告の黄色（暗い背景） */
  color: #fef3c7;               /* 警告の黄色（明るいテキスト） */
}
```

**理由**: これらの色は**視覚的な意味**を持っており、テーマが変わっても変更すべきではないため。

### 2. ブランドカラー

アプリのブランドカラーは直接指定してもOKです。

```css
/* ✅ OK: ブランドカラーのグラデーション */
.dark-mode .stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;  /* グラデーション背景に対する白文字 */
}

/* ✅ OK: ブランドカラーのボタン */
.dark-mode .stats-table thead {
  background: #667eea;  /* ブランド色 */
  color: white;
}

/* ✅ OK: ブランドカラーのボーダー */
.dark-mode .setting-hint {
  border-left-color: #667eea;  /* ブランド色 */
}
```

**理由**: ブランドアイデンティティを保つため、特定の色を使う必要がある。

### 3. グラデーション

グラデーションは直接色指定が必要です。

```css
/* ✅ OK: グラデーション背景 */
.review-focus-indicator {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dark-mode .plan-progress-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**理由**: グラデーションはCSS変数で表現が難しく、デザインの一部として固定すべき。

### 4. 透明度やエフェクト

`rgba()`や`box-shadow`などのエフェクトは直接指定が一般的です。

```css
/* ✅ OK: 透明度を持つ色 */
.dark-mode .milestone-progress-bar {
  background: rgba(255, 255, 255, 0.1);  /* 10%の白 */
}

.dark-mode .grammar-point .tag {
  background: rgba(255, 255, 255, 0.3);  /* 30%の白 */
}

/* ✅ OK: ボックスシャドウ */
.dark-mode .choice-button.correct {
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.4);  /* 緑の光彩 */
}
```

**理由**: 透明度やエフェクトは、背景色に依存した視覚効果であり、変数化のメリットが少ない。

---

## CSS変数の定義場所

### ライトモードの色定義（`src/index.css`）

```css
:root {
  /* 基本カラー */
  --text-color: #333333;          /* 主要テキスト色（暗い灰色） */
  --text-secondary: #666666;      /* 副次テキスト色（中間灰色） */
  --text-tertiary: #999999;       /* 三次テキスト色（明るい灰色） */
  --background: #ffffff;          /* 主要背景色（白） */
  --bg-secondary: #f8f9fa;        /* 二次背景色（明るい灰色） */
  --bg-tertiary: #e9ecef;         /* 三次背景色（やや暗い灰色） */
  --border-color: #dddddd;        /* ボーダー色 */
  --border-color-light: #f0f0f0;  /* 薄いボーダー色 */
  
  /* セマンティックカラー */
  --success-color: #10b981;       /* 成功の緑 */
  --error-color: #ef4444;         /* エラーの赤 */
  --warning-color: #f59e0b;       /* 警告のオレンジ */
  --info-color: #3b82f6;          /* 情報の青 */
  
  /* ブランドカラー */
  --primary-color: #667eea;       /* プライマリ色（紫） */
  --secondary-color: #764ba2;     /* セカンダリ色（濃い紫） */
}
```

### ダークモードの色定義（`src/App.css`）

```css
.dark-mode {
  /* 基本カラー */
  --text-color: #e0e0e0;          /* 主要テキスト色（明るい灰色） */
  --text-secondary: #b0b0b0;      /* 副次テキスト色（中間灰色） */
  --text-tertiary: #888888;       /* 三次テキスト色（暗い灰色） */
  --background: #1a1a1a;          /* 主要背景色（ほぼ黒） */
  --bg-secondary: #2a2a2a;        /* 二次背景色（暗い灰色） */
  --bg-tertiary: #3a3a3a;         /* 三次背景色（やや明るい灰色） */
  --border-color: #555555;        /* ボーダー色 */
  --border-color-light: #444444;  /* 薄いボーダー色 */
  
  /* セマンティックカラー（ダークモード用） */
  --success-color: #4ade80;       /* 成功の緑（明るめ） */
  --error-color: #f87171;         /* エラーの赤（明るめ） */
  --warning-color: #fbbf24;       /* 警告のオレンジ（明るめ） */
  --info-color: #60a5fa;          /* 情報の青（明るめ） */
  
  /* ブランドカラーは同じ */
  /* --primary-color と --secondary-color は変更なし */
}
```

---

## チェックリスト

新しいスタイルを追加する際は、以下をチェックしてください。

### ✅ CSS変数を使うべきケース
- [ ] 背景色（`background`）
- [ ] テキスト色（`color`）
- [ ] ボーダー色（`border-color`）
- [ ] 複数箇所で使う色
- [ ] ライトモード/ダークモードで変わる色

### ✅ 直接色指定が許容されるケース
- [ ] セマンティックカラー（成功=緑、エラー=赤など）
- [ ] ブランドカラー（`#667eea`など）
- [ ] グラデーション（`linear-gradient`）
- [ ] 透明度を持つ色（`rgba()`）
- [ ] エフェクト（`box-shadow`など）

### ❌ 避けるべきパターン
- [ ] `.dark-mode`ブロック内で`#2a2a2a`のような直接色指定
- [ ] 同じ色コードが複数箇所に散在
- [ ] 変数と直接指定が混在

---

## 自動チェックコマンド

プロジェクトルートで以下のコマンドを実行すると、問題のある色指定を検出できます。

```bash
# ダークモード内の直接色指定を検出（ブランド色・セマンティック色を除外）
grep -rn "\.dark-mode" src/**/*.css | \
  while read line; do 
    num=$(echo "$line" | cut -d: -f1,2)
    sed -n "$(echo $num | cut -d: -f2),$(($(echo $num | cut -d: -f2)+10))p" $(echo $num | cut -d: -f1)
  done | \
  grep -E "(background|color|border):\s*#[0-9a-fA-F]{3,6}" | \
  grep -v "667eea\|764ba2\|1e5a28\|5a1e1e\|78350f\|1e4d2b\|4d1e23\|4ade80\|f87171"
```

出力がある場合は修正が必要です。

---

## まとめ

| 項目 | 直接色指定 | CSS変数 |
|------|-----------|---------|
| **保守性** | ❌ 低い（複数箇所を修正） | ✅ 高い（1箇所で完結） |
| **一貫性** | ❌ 低い（色の不一致リスク） | ✅ 高い（定義が統一） |
| **可読性** | ❌ 低い（`#2a2a2a`の意味不明） | ✅ 高い（`--bg-secondary`で意味明確） |
| **ダークモード対応** | ❌ 複雑（各要素に`.dark-mode`定義が必要） | ✅ 簡潔（変数の値だけ変更） |
| **ブラウザ互換性** | ❌ 予期しない挙動の可能性 | ✅ 一貫した挙動 |

**結論**: 基本的に**CSS変数を使う**ことを推奨。例外的に、セマンティックカラー、ブランドカラー、グラデーション、エフェクトのみ直接色指定が許容されます。

---

## 関連ドキュメント

- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) - デザインシステム全体のルール
- [UI_DEVELOPMENT_GUIDELINES.md](./UI_DEVELOPMENT_GUIDELINES.md) - UI開発ガイドライン
- [AI_WORKFLOW_INSTRUCTIONS.md](../guidelines/AI_WORKFLOW_INSTRUCTIONS.md) - AI開発ワークフロー
