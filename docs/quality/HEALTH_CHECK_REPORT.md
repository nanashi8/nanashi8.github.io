# システム健康診断レポート

実行日時: 2025年12月6日

## 🏥 診断結果サマリー

**検出された問題: 6件**

---

## 📋 詳細レポート

### 1. ⚠️ localStorage キーの不統一

**問題:**
- `autoNext` と `autoNext-grammar` が併存
- `autoNextDelay` と `autoNextDelay-grammar` が併存

**影響:**
- 文法クイズだけ別キーを使用しているため、設定が共有されない
- 意図的な分離の可能性もあるが、統一を検討すべき

**推奨対応:**
- 全モード共通: `autoNext`, `autoNextDelay`
- モード別に分けるなら: `autoNext-{mode}` 形式で統一
- 現状維持なら: ドキュメント化して意図を明確にする

---

### 2. ⚠️ handleStartQuiz の重複定義

**問題:**
- `App.tsx` と `GrammarQuizView.tsx` に同名関数が存在

**影響:**
- コンポーネント内部で完結しているため実害はないが、混乱の元

**推奨対応:**
- GrammarQuizViewの方を `handleStartGrammarQuiz` に改名
- または `handleStart` など短縮名に変更

**状態:** 問題なし（スコープが分離されているため）

---

### 3. ⚠️ CSS クラスの重複定義

**問題:**
重複定義されているクラス:
- `.dark-mode` (18回)
- `.milestone-progress-fill` (89回!)
- `.phrase-block` (3回)
- `.phrase-english` (3回)
- その他6クラス

**影響:**
- スタイルの上書きによる予期しない表示
- メンテナンス困難

**推奨対応:**
1. `.milestone-progress-fill` の大量重複を調査
2. メディアクエリ内での再定義か確認
3. 可能なら統合・整理

---

### 4. ⚠️ コンソール出力が多すぎる (261箇所)

**問題:**
- デバッグ用のconsole.logが大量に残留

**影響:**
- 本番環境でのパフォーマンス低下
- ユーザーのコンソールが汚れる

**推奨対応:**
1. 環境変数で制御する仕組みを導入
```typescript
const DEBUG = import.meta.env.DEV;
if (DEBUG) console.log(...);
```

2. または専用のロガー関数を作成
```typescript
const logger = {
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) console.log(...args);
  }
};
```

3. 本番ビルド時に自動削除するbabelプラグイン導入

**優先度:** 中

---

### 5. ⚠️ 型定義の重複

**問題:**
重複定義されている型:
- `DifficultyLevel` (3回)
- `WordPhraseFilter` (2回)
- `DetailedRetentionStats` (2回)
- `WordProgress` (2回)
- その他2型

**影響:**
- 型の不一致によるバグの可能性
- メンテナンス困難

**推奨対応:**
1. `src/types.ts` に集約
2. 各ファイルからは import のみ
3. 重複を削除

**優先度:** 高

---

### 6. ⚠️ 大きすぎるファイル

**問題:**
1000行超のファイル:
- `progressStorage.ts` (2891行) ← **最大**
- `ComprehensiveReadingView.tsx` (1993行)
- `App.tsx` (1433行)
- `utils.ts` (1072行)

**影響:**
- 可読性低下
- メンテナンス困難
- レビュー負荷増大

**推奨対応:**

#### progressStorage.ts (2891行)
分割案:
- `progressStorage/core.ts` - 基本的な読み書き
- `progressStorage/stats.ts` - 統計計算
- `progressStorage/retention.ts` - 定着率関連
- `progressStorage/export.ts` - データエクスポート

#### ComprehensiveReadingView.tsx (1993行)
分割案:
- `ComprehensiveReading/index.tsx` - メインコンポーネント
- `ComprehensiveReading/PassageSelector.tsx`
- `ComprehensiveReading/DictionaryPopup.tsx`
- `ComprehensiveReading/PhraseCard.tsx`

#### App.tsx (1433行)
分割案:
- `App/index.tsx` - メインレイアウト
- `App/quizHandlers.ts` - クイズ関連ハンドラー
- `App/aiHandlers.ts` - AI関連処理
- `App/settingsHandlers.ts` - 設定関連

**優先度:** 中

---

## ✅ 良好な項目

1. **useEffect 依存配列** - exhaustive-depsの無効化は1箇所のみ（適切）
2. **未使用変数** - 10個で適切な範囲
3. **コメントアウトコード** - ほぼ無し（0箇所）
4. **import文** - 整理されている

---

## 📊 推奨アクション優先順位

### 優先度: 高 🔴
1. **型定義の重複を解消** → `types.ts` に集約

### 優先度: 中 🟡
2. **コンソール出力を環境変数で制御**
3. **大きすぎるファイルを分割** (特に progressStorage.ts)
4. **CSS重複を整理** (特に .milestone-progress-fill)

### 優先度: 低 🟢
5. **localStorage キーの命名規則統一** (ドキュメント化でも可)
6. **関数名の重複を解消** (実害なし)

---

## 🛠️ メンテナンス推奨サイクル

- **毎週**: 軽量な診断実行 (`npm run health-check`)
- **毎月**: 詳細レポート作成とリファクタリング計画
- **四半期**: 大規模リファクタリング実施

---

## 📝 次のステップ

1. このレポートをチーム内で共有
2. 優先度の高い項目から順次対応
3. 対応後に再度診断を実行して効果を確認
4. 継続的改善のサイクルを確立

---

**診断ツール:** `scripts/health-check.sh`
**実行方法:** `npm run health-check` (package.jsonに追加推奨)
