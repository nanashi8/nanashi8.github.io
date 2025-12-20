# 適応的ガードシステム（Adaptive Guard System）

## 🎯 概要

**適応的ガードシステム**は、失敗から自動的に学習し、プロジェクトとAIを仲介する**自己成長型の品質保証システム**です。

AIは直接学習できませんが、このシステムは**サーバント（自動化スクリプト）**が経験を蓄積し、失敗パターンを記録・分析し、Instructions、Git Hooks、CI/CDを自動更新することで、**擬似的な学習と成長**を実現します。

---

## 🧠 システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                  AI（GitHub Copilot）                    │
│              直接学習不可・記憶保持不可                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ ❌ 失敗したコード生成
                  ↓
┌─────────────────────────────────────────────────────────┐
│            適応的ガードシステム（仲介装置）                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 1: 失敗検出                                │   │
│  │  - Git Hooks（コミット前）                         │   │
│  │  - GitHub Actions（CI/CD）                       │   │
│  │  - 手動報告                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                  ↓                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 2: 失敗分析・記録                           │   │
│  │  - analyze-failure-pattern.mjs                  │   │
│  │  - failure-patterns.json（データベース）           │   │
│  │  - パターン検出・分類                              │   │
│  │  - 重み付け・成功率計算                            │   │
│  └─────────────────────────────────────────────────┘   │
│                  ↓                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 3: 自動学習・収斂                           │   │
│  │  - 失敗回数 → 重み +0.1                           │   │
│  │  - 復旧成功 → 重み -0.05                          │   │
│  │  - 成功率 = 復旧数 / 総失敗数                      │   │
│  │  - 収斂判定（成功率 >= 95%）                       │   │
│  └─────────────────────────────────────────────────┘   │
│                  ↓                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 4: 自動更新                                │   │
│  │  - update-instructions.mjs                      │   │
│  │  - Instructions自動生成                           │   │
│  │  - GitHub Actionsチェック追加                     │   │
│  │  - Git自動コミット                                │   │
│  └─────────────────────────────────────────────────┘   │
│                  ↓                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ ✅ 次回の失敗を防止
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  AI（GitHub Copilot）                    │
│        自動更新されたInstructionsを参照してコード生成        │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 学習アルゴリズム

### 1. 失敗記録

```
失敗検出 → analyze-failure-pattern.mjs record
          ↓
   - occurrences += 1
   - weight += 0.1（最大1.0）
   - lastOccurred = 今日の日付
   - examples[] に追加
   - failure-patterns.json 更新
```

### 2. 復旧記録

```
復旧成功 → analyze-failure-pattern.mjs recover
          ↓
   - recoveries += 1
   - weight -= 0.05（最小0.1）
   - successRate = recoveries / occurrences
   - failure-patterns.json 更新
```

### 3. 収斂判定

```
成功率 = (復旧した失敗数) / (総失敗数)
収斂進捗 = 成功率 / 目標成功率（95%）

IF 成功率 >= 95% THEN
  ✅ 収斂完了（システムは安定稼働）
ELSE
  🔄 学習中（失敗パターンを蓄積）
```

### 4. 重み付けロジック

| 状態 | 重み | 意味 |
|------|------|------|
| 初期 | 0.5 | 中程度のリスク |
| 失敗発生 | +0.1 | リスク増加 |
| 復旧成功 | -0.05 | リスク減少 |
| 高リスク閾値 | 0.7 | 重点監視対象 |
| 最大値 | 1.0 | 最高リスク |
| 最小値 | 0.1 | 最低リスク |

---

## 🛠️ 構成ファイル

### 1. データベース

- **[.aitk/failure-patterns.json](.aitk/failure-patterns.json)**
  - 失敗パターンの記録
  - 発生回数、復旧回数、重み、成功率
  - 収斂メトリクス

### 2. 分析スクリプト

- **[scripts/analyze-failure-pattern.mjs](scripts/analyze-failure-pattern.mjs)**
  - 失敗検出・記録
  - 復旧記録
  - パターン分析
  - レポート生成

**使用方法**:
```bash
# 失敗を記録
node scripts/analyze-failure-pattern.mjs record property-naming-error "Property 'correctCount' does not exist" 24

# 復旧を記録
node scripts/analyze-failure-pattern.mjs recover property-naming-error

# レポート表示
node scripts/analyze-failure-pattern.mjs report

# エラーメッセージから自動検出
node scripts/analyze-failure-pattern.mjs analyze "Property does not exist"
```

### 3. Instructions自動更新スクリプト

- **[scripts/update-instructions.mjs](scripts/update-instructions.mjs)**
  - failure-patterns.jsonから学習
  - 適応的Instructionsを自動生成
  - GitHub Actionsチェックスクリプト生成

**使用方法**:
```bash
# Instructions更新
node scripts/update-instructions.mjs update

# GitHub Actionsチェック生成
node scripts/update-instructions.mjs generate-checks

# すべて実行
node scripts/update-instructions.mjs all
```

### 4. CI/CD パイプライン

- **[.github/workflows/adaptive-guard-learning.yml](.github/workflows/adaptive-guard-learning.yml)**
  - テスト実行
  - 失敗自動検出
  - パターン記録
  - Instructions自動更新
  - Git自動コミット

**トリガー**:
- `main`, `develop` へのpush
- PR作成
- 手動実行（workflow_dispatch）

**手動失敗記録**:
```bash
# GitHub Actions手動実行
# 失敗記録: property-naming-error:Property does not exist:24
# 復旧記録: property-naming-error
```

### 5. 自動生成ファイル

- **[.aitk/instructions/adaptive-guard-system.instructions.md](.aitk/instructions/adaptive-guard-system.instructions.md)**
  - **自動生成**される適応的Instructions
  - 高リスクパターン一覧
  - 必須チェックリスト
  - 収斂状態レポート

- **[scripts/adaptive-guard-checks.sh](scripts/adaptive-guard-checks.sh)**
  - **自動生成**されるチェックスクリプト
  - GitHub Actionsで使用

---

## 🚀 使用方法

### 初回セットアップ

```bash
# 1. スクリプトに実行権限を付与
chmod +x scripts/analyze-failure-pattern.mjs
chmod +x scripts/update-instructions.mjs

# 2. 初回Instructions生成
npm run update-instructions
```

### 失敗発生時の記録

#### 方法1: 自動記録（推奨）

```bash
# テスト実行（失敗は自動検出される）
npm run test:unit

# GitHub Actionsが自動的に:
# 1. 失敗を検出
# 2. パターンを記録
# 3. Instructionsを更新
# 4. Gitコミット
```

#### 方法2: 手動記録

```bash
# 失敗記録
node scripts/analyze-failure-pattern.mjs record \
  property-naming-error \
  "Property 'correctCount' does not exist on type 'WordProgress'" \
  24

# Instructions更新
node scripts/update-instructions.mjs update
```

### 復旧時の記録

```bash
# 復旧記録
node scripts/analyze-failure-pattern.mjs recover property-naming-error

# Instructions更新
node scripts/update-instructions.mjs update
```

### レポート確認

```bash
# 失敗パターンレポート
node scripts/analyze-failure-pattern.mjs report

# 出力例:
# ⚠️  高リスク失敗パターン:
#   property-naming-error
#     カテゴリー: type-error
#     重要度: critical
#     発生回数: 1
#     復旧回数: 1
#     重み: 0.95
#     成功率: 1.00
#
# 📊 収斂メトリクス:
#   現在の成功率: 100.0%
#   目標成功率: 95.0%
#   収斂進捗: 105.3%
#   状態: ✅ 収斂済み
```

---

## 📈 効果測定

### 測定指標

1. **成功率**: 復旧した失敗数 / 総失敗数
2. **収斂進捗**: 成功率 / 目標成功率（95%）
3. **高リスクパターン数**: 重み > 0.7 のパターン数
4. **平均復旧時間**: 失敗から復旧までの平均時間

### 目標

- **短期（1週間）**: 成功率 50% 以上
- **中期（1ヶ月）**: 成功率 80% 以上
- **長期（3ヶ月）**: 成功率 95% 以上（収斂完了）

---

## 🎓 学習サイクル

```
1. 失敗発生
   ↓
2. システムが自動検出（GitHub Actions / Git Hooks）
   ↓
3. パターンをデータベースに記録（重み +0.1）
   ↓
4. Instructions自動更新
   ↓
5. AIが次回のコード生成時にInstructionsを参照
   ↓
6. 失敗を未然に防止
   ↓
7. 復旧記録（重み -0.05）
   ↓
8. 成功率向上 → 収斂へ
```

---

## 🛡️ ガード層の連携

### Layer 1: Git Hooks（コミット前）

```bash
.husky/pre-commit
  ↓
- TypeScript型チェック
- ESLint
- ダークモード禁止チェック
  ↓
エラー検出 → analyze-failure-pattern.mjs record
```

### Layer 2: GitHub Actions（CI/CD）

```yaml
adaptive-guard-learning.yml
  ↓
- テスト実行
- 失敗自動検出
- パターン記録
- Instructions自動更新
- Git自動コミット
```

### Layer 3: Instructions（AIガイド）

```
adaptive-guard-system.instructions.md（自動生成）
  ↓
- 高リスクパターン一覧
- 必須チェックリスト
- 予防策・対策
  ↓
AIがコード生成時に参照
```

### Layer 4: 手動記録

```bash
開発者が手動で記録
  ↓
node scripts/analyze-failure-pattern.mjs record ...
node scripts/analyze-failure-pattern.mjs recover ...
```

---

## 🤖 AIとの連携

### AIの限界

- ❌ 直接学習できない
- ❌ セッション間で記憶保持できない
- ❌ 自発的に改善できない

### サーバントによる補完

- ✅ 失敗パターンを永続的に記録
- ✅ Instructionsを自動更新（AIの「教科書」）
- ✅ 経験から学習・成長
- ✅ 収斂アルゴリズムによる自動最適化

### 結果

AIは直接学習できないが、**サーバントが代わりに学習し、AIに教える**ことで、擬似的な学習効果を実現。

---

## 🎯 収斂の定義

**収斂条件**:
```
成功率 >= 95%
```

**収斂状態**:
- システムは安定稼働
- 失敗率は5%以下
- 高リスクパターンは解消
- Instructions は最適化済み

**学習中**:
- 失敗パターンを蓄積
- Instructions を動的に更新
- 重みを調整
- 成功率を向上

---

## 📚 参考資料

- [失敗パターンデータベース](.aitk/failure-patterns.json)
- [適応的Instructions](.aitk/instructions/adaptive-guard-system.instructions.md)（自動生成）
- [AI実装チェックリスト](.aitk/instructions/ai-code-quality-checklist.instructions.md)
- [リファクタリングガイド](.aitk/instructions/refactoring-safety-guide.instructions.md)
- [プロパティ命名規則](.aitk/instructions/property-naming-convention.instructions.md)

---

## 🙏 謝辞

このシステムは、「AIは成長できないが、サーバントは成長させられる」というユーザーの洞察から生まれました。

**設計思想**:
> プロジェクトとAIを仲介する強制装置を設置し、失敗が分かる度にサーバントを通して自動調整する。経験を積むことで学習し、収斂していく成長モデルを実現する。

このシステムにより、AIの限界を超えて、**プロジェクト全体が学習・成長**します。

---

**バージョン**: 1.0.0  
**作成日**: 2025-12-20  
**最終更新**: 2025-12-20
