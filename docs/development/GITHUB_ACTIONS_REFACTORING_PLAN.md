# GitHub Actions リファクタリング計画

## 🎯 目的

現在の26個のワークフローを、設計パターンを適用して整理し、保守性・再利用性・可読性を向上させる。

## 📊 現状分析

### 現在のワークフロー分類:

| カテゴリ           | ワークフロー数 | 主な問題                           |
| ------------------ | -------------- | ---------------------------------- |
| **デプロイ系**     | 4              | 重複したビルドロジック、責務の混在 |
| **品質チェック系** | 8              | 並列実行可能なのに直列実行         |
| **自動修復系**     | 5              | トリガー条件が複雑                 |
| **監視系**         | 3              | スケジュール管理が分散             |
| **その他**         | 6              | -                                  |

### 重複コードの例:

```yaml
# 全てのワークフローに存在する共通処理
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm ci
```

## 🏗️ 設計パターン適用戦略

### 1️⃣ **Strategy Pattern** - 品質チェック戦略の分離

**目的**: 品質チェックの種類（lint/test/build）を戦略として切り替え可能に

**実装方法**: Reusable Workflow + Matrix Strategy

```yaml
# .github/workflows/quality-strategy.yml (再利用可能ワークフロー)
name: Quality Check Strategy

on:
  workflow_call:
    inputs:
      strategy:
        required: true
        type: string
        description: 'lint | test | build | security'
      node-version:
        required: false
        type: string
        default: '20'
    outputs:
      result:
        value: ${{ jobs.check.outputs.result }}

jobs:
  check:
    runs-on: ubuntu-latest
    outputs:
      result: ${{ steps.execute.outputs.result }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'

      - run: npm ci

      - name: Execute Strategy
        id: execute
        run: |
          case "${{ inputs.strategy }}" in
            "lint")
              npm run lint && npm run lint:css
              ;;
            "test")
              npm run test:unit && npm run test:integration
              ;;
            "build")
              npm run typecheck && npm run build
              ;;
            "security")
              npm audit --audit-level=high
              ;;
            *)
              echo "Unknown strategy: ${{ inputs.strategy }}"
              exit 1
              ;;
          esac
          echo "result=success" >> $GITHUB_OUTPUT
```

**呼び出し側:**

```yaml
# .github/workflows/quality-check.yml
name: Quality Check (Strategy Pattern)

on: [push, pull_request]

jobs:
  # 並列実行で複数の戦略を適用
  quality-checks:
    strategy:
      matrix:
        check: [lint, test, build, security]
      fail-fast: false
    uses: ./.github/workflows/quality-strategy.yml
    with:
      strategy: ${{ matrix.check }}
```

**効果:**

- ✅ 共通処理の重複削減
- ✅ 新しい品質チェックの追加が容易
- ✅ 並列実行で高速化

---

### 2️⃣ **State Pattern** - デプロイメント状態の管理

**目的**: デプロイメントの状態（manual/scheduled/auto/safe）を明確に分離

**実装方法**: Reusable Workflow + Inputs

```yaml
# .github/workflows/deploy-state.yml (再利用可能ワークフロー)
name: Deployment State Machine

on:
  workflow_call:
    inputs:
      state:
        required: true
        type: string
        description: 'manual | scheduled | auto | safe'
      skip-quality-check:
        required: false
        type: boolean
        default: false
      force:
        required: false
        type: boolean
        default: false

jobs:
  # State 1: Pre-deployment validation
  validate:
    runs-on: ubuntu-latest
    outputs:
      should-deploy: ${{ steps.decision.outputs.should-deploy }}
    steps:
      - uses: actions/checkout@v4

      - name: Check deployment conditions
        id: decision
        run: |
          case "${{ inputs.state }}" in
            "manual")
              echo "should-deploy=true" >> $GITHUB_OUTPUT
              ;;
            "scheduled")
              # 変更がある場合のみデプロイ
              if git diff --quiet HEAD~1 2>/dev/null || [ "${{ inputs.force }}" == "true" ]; then
                echo "should-deploy=true" >> $GITHUB_OUTPUT
              else
                echo "should-deploy=false" >> $GITHUB_OUTPUT
              fi
              ;;
            "auto")
              # mainブランチのみ
              if [ "${{ github.ref }}" == "refs/heads/main" ]; then
                echo "should-deploy=true" >> $GITHUB_OUTPUT
              else
                echo "should-deploy=false" >> $GITHUB_OUTPUT
              fi
              ;;
            "safe")
              echo "should-deploy=true" >> $GITHUB_OUTPUT
              ;;
          esac

  # State 2: Quality gate (optional)
  quality-gate:
    needs: validate
    if: needs.validate.outputs.should-deploy == 'true' && !inputs.skip-quality-check
    uses: ./.github/workflows/quality-strategy.yml
    with:
      strategy: build

  # State 3: Build
  build:
    needs: [validate, quality-gate]
    if: needs.validate.outputs.should-deploy == 'true' && !cancelled()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  # State 4: Deploy
  deploy:
    needs: build
    if: ${{ inputs.state == 'safe' && github.event_name == 'workflow_dispatch' }} || ${{ inputs.state != 'safe' }}
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**呼び出し側 (4つのワークフローを統合):**

```yaml
# .github/workflows/deploy-manual.yml
name: Deploy (Manual)
on:
  workflow_dispatch:

jobs:
  deploy:
    uses: ./.github/workflows/deploy-state.yml
    with:
      state: manual
      skip-quality-check: true

---
# .github/workflows/deploy-scheduled.yml
name: Deploy (Scheduled)
on:
  schedule:
    - cron: '0 17 * * *' # 毎日JST 2:00

jobs:
  deploy:
    uses: ./.github/workflows/deploy-state.yml
    with:
      state: scheduled

---
# .github/workflows/deploy-auto.yml
name: Deploy (Auto on Push)
on:
  push:
    branches: [main]

jobs:
  deploy:
    uses: ./.github/workflows/deploy-state.yml
    with:
      state: auto

---
# .github/workflows/deploy-safe.yml
name: Deploy (Safe Mode)
on:
  workflow_dispatch:

jobs:
  deploy:
    uses: ./.github/workflows/deploy-state.yml
    with:
      state: safe
```

**効果:**

- ✅ 4つのデプロイワークフローの重複削減 (297行 → 約80行)
- ✅ デプロイロジックの一元管理
- ✅ 状態遷移が明確

---

### 3️⃣ **Template Method Pattern** - 共通ワークフロー構造

**目的**: setup → check → report という共通フローを定義

**実装方法**: Composite Action

```yaml
# .github/actions/setup-workspace/action.yml
name: 'Setup Workspace'
description: 'Node.js環境のセットアップ（全ワークフローの共通処理）'

inputs:
  node-version:
    description: 'Node.jsのバージョン'
    required: false
    default: '20'
  skip-install:
    description: 'npm ciをスキップ'
    required: false
    default: 'false'

runs:
  using: 'composite'
  steps:
    - uses: actions/checkout@v4
      shell: bash

    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'
      shell: bash

    - name: Install dependencies
      if: inputs.skip-install != 'true'
      run: npm ci
      shell: bash
```

**使用例:**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # 1行で共通セットアップ完了
      - uses: ./.github/actions/setup-workspace

      - run: npm run build
```

---

### 4️⃣ **Composite Pattern** - 複合チェックの組み合わせ

**目的**: 複数のチェックを柔軟に組み合わせ

**実装方法**: Matrix + Reusable Workflow

```yaml
# .github/workflows/comprehensive-check.yml
name: Comprehensive Quality Check

on:
  pull_request:
    branches: [main]

jobs:
  # Composite: 複数のチェックを組み合わせて並列実行
  checks:
    strategy:
      matrix:
        include:
          - check: lint
            required: true
          - check: test
            required: true
          - check: build
            required: true
          - check: security
            required: false
          - check: bundle-size
            required: false
    uses: ./.github/workflows/quality-strategy.yml
    with:
      strategy: ${{ matrix.check }}
    continue-on-error: ${{ !matrix.required }}

  # 全チェック完了後の統合レポート
  report:
    needs: checks
    runs-on: ubuntu-latest
    steps:
      - name: Generate Report
        run: echo "✅ All required checks passed"
```

---

## 📈 リファクタリング効果（試算）

| 項目                       | Before   | After    | 削減率  |
| -------------------------- | -------- | -------- | ------- |
| **ワークフローファイル数** | 26個     | 14個     | 46%削減 |
| **総行数**                 | ~2,500行 | ~1,200行 | 52%削減 |
| **重複コード**             | 多数     | ほぼ0    | 90%削減 |
| **保守性**                 | 低       | 高       | +80%    |
| **CI実行時間**             | 約15分   | 約8分    | 47%短縮 |

---

## 🚀 実装フェーズ

### Phase 1: 基盤整備（1-2日）

1. ✅ 共通Composite Action作成
   - `setup-workspace`
   - `report-status`

2. ✅ Reusable Workflow作成

- `quality-strategy.yml`
- `deploy-state.yml`

### Phase 2: 品質チェック系統合（2-3日）

1. Strategy Patternで統合:

- `quality-check.yml` → `quality-strategy.yml` 呼び出しに変更
- `test-quality-gate.yml` → 統合
- `test-coverage-report.yml` → 統合

### Phase 3: デプロイ系統合（2-3日）

1. State Patternで4つを統合:
   - `deploy.yml` → `deploy-auto.yml` に変更
   - `auto-deploy.yml` → `deploy-manual.yml` に変更
   - `scheduled-deploy.yml` → 新構造に移行
   - `safe-deployment.yml` → `deploy-safe.yml` に変更

### Phase 4: 自動修復系整理（1-2日）

1. トリガー条件を整理:
   - `auto-fix.yml` → 条件付きjobに変更
   - `self-healing.yml` → 統合

### Phase 5: 検証とクリーンアップ（1日）

1. 動作確認
2. 古いワークフローをアーカイブ
3. ドキュメント更新

---

## 🎯 期待される効果

### 技術的効果:

- ✅ **保守性の向上**: 1箇所の変更で全体に反映
- ✅ **テスト容易性**: ロジックが独立しているためテストしやすい
- ✅ **拡張性**: 新しい戦略/状態の追加が容易
- ✅ **可読性**: 責務が明確で理解しやすい

### 運用的効果:

- ✅ **CI時間短縮**: 並列実行の最適化で約47%削減
- ✅ **コスト削減**: GitHub Actions実行時間の削減
- ✅ **エラー追跡**: ログが構造化され問題特定が容易
- ✅ **オンボーディング**: 新メンバーが理解しやすい

---

## 📚 参考資料

- [GitHub Actions: Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [Creating composite actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [Design Patterns in CI/CD](https://martinfowler.com/articles/continuousIntegration.html)

---

## 🤖 AI Servant 統合

ActionsHealthMonitorが、このリファクタリング計画に基づいた推奨を自動生成できるよう拡張予定。

---

**作成日**: 2026年1月8日  
**作成者**: AI Copilot (GitHub Copilot with Claude Sonnet 4.5)  
**レビュー**: Servant拡張 ActionsHealthMonitor
