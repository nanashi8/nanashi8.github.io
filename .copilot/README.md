# SimpleWord - AI 作業効率化ガイド

**最終更新: 2025-10-19**

## 最近の主要な更新（2025-10-19）
- Workspace Instructions に `.copilot/` への参照を全面的に追加
- アニメーション・カード分離の実装パターンを明記
- 作業規模別（小・中・大）の参照フローを明確化
- トラブルシューティング導線を整備
- 仕様書を「復元ガイド」から「編集ガイド」に全面改訂

---

## GitHub Copilot Chat Settings との連携

### 1. Copilot Instructions (Global)
**場所**: `~/.github/copilot-instructions.md` (グローバル設定)
**用途**: すべてのプロジェクトに適用される基本的なコーディング規約
**内容例**:
- コーディングスタイル（インデント、命名規則）
- 言語固有のベストプラクティス
- セキュリティガイドライン

### 2. Copilot Instructions (Current Workspace)
**場所**: `.github/instructions/CustumInstruction.instructions.md`
**用途**: このプロジェクト固有のルールと設計原則
**内容**:
- プロジェクト概要
- アーキテクチャ原則（Feature-First, 責務分離）
- Swift コーディング規約
- **`.copilot/` への参照を含める**

### 3. Custom Instructions
**用途**: セッション単位の特定タスクに対する指示
**使用例**:
- 「QuizView のリファクタリング中は `.copilot/components/` を優先参照」
- 「バグ修正時は `.copilot/changelog.md` で履歴確認」

### 4. Prompt Files
**場所**: `.copilot/prompts/` (任意)
**用途**: 繰り返し使用するタスク用のプロンプトテンプレート
**例**:
- `refactor-component.md` - コンポーネント分割用
- `add-feature.md` - 新機能追加用
- `fix-bug.md` - バグ修正用

## `.copilot/` ディレクトリ構成

```
.copilot/
├── README.md                    # このファイル（全体ガイド）
├── structure-map.md             # アーキテクチャマップ
├── quick-ref.md                 # クイックリファレンス
├── changelog.md                 # 変更履歴
├── task-template.md             # タスク分割テンプレート
├── components/                  # コンポーネント仕様書
│   ├── QuizStatisticsView.md
│   ├── QuestionCardView.md
│   ├── ChoiceCardView.md
│   ├── DontKnowCardView.md
│   └── QuizNavigationButtonsView.md
└── prompts/                     # プロンプトテンプレート（任意）
    ├── refactor-component.md
    ├── add-feature.md
    └── fix-bug.md
```

## トークン効率化戦略

### レベル1: 小規模変更（単一ファイル、100行以内）
```
1. quick-ref.md を参照
2. 直接実装
3. changelog.md に記録
```
**トークン使用量**: 低

### レベル2: 中規模変更（複数ファイル、または新機能追加）
```
1. structure-map.md で影響範囲確認
2. 関連する components/*.md を参照
3. task-template.md で段階的実装
4. changelog.md に記録
```
**トークン使用量**: 中

### レベル3: 大規模リファクタリング
```
1. structure-map.md で全体像把握
2. task-template.md で作業を分割
3. 各タスクごとに components/*.md 参照
4. 段階的に実装・検証
5. changelog.md に詳細記録
```
**トークン使用量**: 高（分割により最適化）

## AI への指示方法

### 作業開始時の基本フロー
```markdown
1. 「`.copilot/structure-map.md` を確認してください」
2. 「影響範囲を特定し、関連する `.copilot/components/` の仕様を確認してください」
3. 「`.copilot/task-template.md` に従って段階的に実装してください」
4. 「完了後、`.copilot/changelog.md` に変更を記録してください」
```

### タスク別の指示例

#### 新機能追加
```
「`.copilot/structure-map.md` で影響範囲を確認し、
新しいコンポーネント仕様を `.copilot/components/` に作成してから実装してください」
```

#### バグ修正
```
「`.copilot/changelog.md` で関連する過去の変更を確認し、
`.copilot/quick-ref.md` のパターンに従って修正してください」
```

#### リファクタリング
```
「`.copilot/structure-map.md` の分割推奨に従い、
Phase 1 から順に `.copilot/task-template.md` を使って段階的に実装してください」
```

## ファイルの更新頻度

| ファイル | 更新頻度 | 更新タイミング |
|---------|---------|--------------|
| README.md | 低 | 構成変更時 |
| structure-map.md | 低 | 大規模リファクタリング時 |
| quick-ref.md | 中 | 新パターン追加時 |
| changelog.md | 高 | 毎変更時 |
| task-template.md | 低 | ワークフロー変更時 |
| components/*.md | 中 | コンポーネント分割・変更時 |
| prompts/*.md | 低 | 新しいタスクタイプ追加時 |

## ベストプラクティス

### ✅ 推奨
- 変更前に必ず関連ファイルを確認
- 小さな変更でも changelog に記録
- 新しいパターンが出たら quick-ref に追加
- コンポーネント分割時は仕様書を先に作成

### ❌ 非推奨
- `.copilot/` を参照せずに大規模変更
- changelog の更新を忘れる
- 仕様書なしでコンポーネントを分割
- structure-map と実装の不整合を放置

## メンテナンス

### 月次レビュー
- [ ] changelog から頻繁な変更箇所を特定
- [ ] structure-map の分割計画を更新
- [ ] quick-ref に新パターンを追加
- [ ] 使われていないコンポーネント仕様を削除

### リリース前チェック
- [ ] 全ての変更が changelog に記録されている
- [ ] structure-map が現在の実装と一致している
- [ ] コンポーネント仕様が最新である
- [ ] 不要なファイルを削除
