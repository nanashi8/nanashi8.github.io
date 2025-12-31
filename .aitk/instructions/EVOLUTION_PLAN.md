---
title: Instructions体系の進化計画
description: 業界標準に基づく自動化・統合・簡略化のロードマップ
date: 2025-12-30
status: PROPOSAL
---

# 📈 Instructions体系の進化計画

## 🎯 目的

現在の40+のinstructionsファイルを、業界標準のデザインパターンと品質管理手法を用いて、より保守しやすく、発見しやすく、自動化可能な形に進化させる。

---

## 🌍 業界標準の適用

### 1. **Architecture Decision Records (ADR)**

**概要**: 重要な設計判断を記録する標準フォーマット

**適用**:
```markdown
# ADR-001: バッチ方式の採用

## Status
Accepted

## Context
2語連続出題（振動）が発生し、ユーザー体験を損なっていた。

## Decision
バッチ確定後は配列を一切変更しない方式を採用する。

## Consequences
### Positive
- 振動が完全に防止される
- 予測可能な学習体験

### Negative
- 間違った語句の即座の再出題ができない

## Implementation
- batch-system-enforcement.instructions.md
- MemorizationView.tsx の実装

## Date
2025-12-30
```

**メリット**:
- 「なぜこの判断をしたか」が明確
- 時系列での追跡が可能
- 新しいメンバーへのオンボーディングが容易

---

### 2. **Policy as Code**

**概要**: ポリシーをコードとして実装し、自動検証

**適用例**:

#### 2.1 Open Policy Agent (OPA) 風のルール定義

```rego
# policy/batch-system.rego

package batch_system

# ルール: バッチ確定後は配列を変更してはならない
deny_array_modification[msg] {
    input.useCategorySlots == true
    input.operation == "setQuestions"
    input.context == "after_batch_confirmed"
    msg := "バッチ確定後の配列変更は禁止されています"
}

# ルール: Position階層の範囲チェック
deny_position_violation[msg] {
    question := input.questions[_]
    question.category == "still_learning"
    not (question.position >= 60 and question.position < 70)
    msg := sprintf("still_learning語のPosition範囲違反: %s (Position=%d)", [question.word, question.position])
}
```

#### 2.2 ESLint カスタムルール

```typescript
// eslint-plugin-nanashi8/rules/batch-immutability.js

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce batch immutability in category slots mode',
      category: 'Best Practices',
    },
    messages: {
      batchModification: 'バッチ確定後の配列変更は禁止されています（batch-system-enforcement.instructions.md を参照）',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        // setQuestions() の呼び出しを検出
        if (node.callee.name === 'setQuestions') {
          // useCategorySlots=true のコンテキストで呼ばれているか確認
          const scope = context.getScope();
          const useCategorySlotsVar = scope.variables.find(v => v.name === 'useCategorySlots');
          
          if (useCategorySlotsVar && isTrue(useCategorySlotsVar)) {
            // さらに詳細な静的解析...
            context.report({
              node,
              messageId: 'batchModification',
            });
          }
        }
      },
    };
  },
};
```

**メリット**:
- CI/CDパイプラインで自動チェック
- コミット前に違反を検出
- 人的ミスを防止

---

### 3. **Quality Gates**

**概要**: CI/CDパイプラインでの自動品質チェック

**実装例**:

```yaml
# .github/workflows/enforcement.yml

name: Enforcement Checks

on: [push, pull_request]

jobs:
  batch-system-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run batch system enforcement
        run: |
          npm run enforce:batch-system
          npm run enforce:position-hierarchy
          npm run enforce:category-slots
      
      - name: Check for violations
        run: |
          if grep -r "バッチ途中での配列変更" src/; then
            echo "❌ バッチ方式違反を検出"
            exit 1
          fi
```

**メリット**:
- プルリクエスト時に自動チェック
- マージ前に問題を検出
- 品質の自動保証

---

### 4. **Decision Trees as Code**

**概要**: 意思決定ツリーを実行可能なコードに変換

**実装例**:

```typescript
// enforcement/decision-tree-executor.ts

export class ModificationDecisionTree {
  execute(context: ModificationContext): Decision {
    // Phase 1: 仕様書確認
    if (!this.hasReadSpecifications(context)) {
      return {
        action: 'REJECT',
        reason: 'modification-enforcement.instructions.md Phase 1 未完了',
        nextStep: 'READ_SPECIFICATIONS',
      };
    }
    
    // Phase 2: ユーザー意図確認
    if (!this.hasUserIntent(context)) {
      return {
        action: 'ASK_USER',
        reason: 'ユーザー意図が不明確',
        nextStep: 'CLARIFY_INTENT',
      };
    }
    
    // Phase 3: 影響範囲分析
    const impact = this.analyzeImpact(context);
    
    if (impact.affectsCorePrinciples) {
      return {
        action: 'REQUIRE_APPROVAL',
        reason: '設計原則に影響',
        affectedPrinciples: impact.principles,
        nextStep: 'GET_USER_APPROVAL',
      };
    }
    
    // Phase 4: リスク評価
    const risk = this.evaluateRisk(context);
    
    if (risk.level === 'HIGH') {
      return {
        action: 'REQUIRE_APPROVAL',
        reason: '高リスク修正',
        risks: risk.details,
        nextStep: 'GET_USER_APPROVAL',
      };
    }
    
    // 承認: 実装可能
    return {
      action: 'APPROVE',
      reason: '影響範囲限定・リスク低',
      nextStep: 'IMPLEMENT',
    };
  }
}
```

**メリット**:
- 判断の自動化
- 一貫性の保証
- デバッグ可能

---

## 🚀 進化のロードマップ

### Phase 1: 統合・整理（1-2週間）

**目標**: 既存のinstructionsを整理し、重複を削減

#### 1.1 READMEの整備 ✅
- [x] `.aitk/instructions/README.md` 作成（完了）
- [x] Category Index追加（完了）
- [x] Quick Reference追加（完了）
- [x] Search Index追加（完了）

#### 1.2 重複の削減
```
□ 共通部分を extracted-common.instructions.md に抽出
□ 各ファイルから共通部分への参照に変更
□ 重複率を 5% → 2% に削減
```

#### 1.3 階層化
```
□ core/ ディレクトリ作成（Core Enforcement）
□ domain/ ディレクトリ作成（Domain-Specific）
□ quality/ ディレクトリ作成（Quality Enforcement）
```

---

### Phase 2: 自動化基盤（2-3週間）

**目標**: 基本的な自動チェックの実装

#### 2.1 ESLint カスタムルール
```typescript
// eslint-plugin-nanashi8/index.js

module.exports = {
  rules: {
    'batch-immutability': require('./rules/batch-immutability'),
    'position-hierarchy': require('./rules/position-hierarchy'),
    'category-slots': require('./rules/category-slots'),
    'user-approval-required': require('./rules/user-approval-required'),
  },
};
```

#### 2.2 Pre-commit Hooks
```bash
#!/bin/sh
# .husky/pre-commit

echo "🔍 Enforcement checks..."

# 1. バッチ方式チェック
npm run enforce:batch-system || exit 1

# 2. Position階層チェック
npm run enforce:position-hierarchy || exit 1

# 3. 型エラーチェック
npm run type-check || exit 1

echo "✅ All checks passed"
```

#### 2.3 GitHub Actions
```yaml
# .github/workflows/quality-gate.yml

name: Quality Gate

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  enforcement:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Enforcement Checks
        run: npm run enforce:all
      
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Code Quality
        run: npm run quality:check
```

---

### Phase 3: Policy as Code（3-4週間）

**目標**: ポリシーをコードとして実装

#### 3.1 Policyファイル作成
```
policy/
├── batch-system.rego
├── position-hierarchy.rego
├── category-slots.rego
└── modification-approval.rego
```

#### 3.2 Policy Executor
```typescript
// enforcement/policy-executor.ts

import * as opa from '@open-policy-agent/opa-wasm';

export class PolicyExecutor {
  async evaluate(policy: string, input: any): Promise<PolicyResult> {
    const result = await opa.evaluate(policy, input);
    
    if (result.violations.length > 0) {
      return {
        allowed: false,
        violations: result.violations,
        recommendations: this.getRecommendations(result.violations),
      };
    }
    
    return { allowed: true };
  }
}
```

---

### Phase 4: ADR統合（2-3週間）

**目標**: Architecture Decision Recordsの導入

#### 4.1 ADRディレクトリ構造
```
.aitk/decisions/
├── README.md
├── 0001-batch-system-adoption.md
├── 0002-position-hierarchy-design.md
├── 0003-category-slots-implementation.md
└── template.md
```

#### 4.2 ADRテンプレート
```markdown
# ADR-XXXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[背景・問題]

## Decision
[決定内容]

## Consequences
### Positive
- [利点1]
- [利点2]

### Negative
- [欠点1]
- [欠点2]

## Alternatives Considered
- [代替案1]: [却下理由]
- [代替案2]: [却下理由]

## Implementation
- [関連ファイル1]
- [関連ファイル2]

## References
- [関連ドキュメント]

## Date
YYYY-MM-DD
```

---

### Phase 5: 可視化ダッシュボード（4-5週間）

**目標**: リアルタイムな品質監視

#### 5.1 Metrics収集
```typescript
// enforcement/metrics-collector.ts

export class MetricsCollector {
  collectEnforcementMetrics(): EnforcementMetrics {
    return {
      batchSystemViolations: this.countViolations('batch-system'),
      positionHierarchyViolations: this.countViolations('position-hierarchy'),
      categorysSlotsViolations: this.countViolations('category-slots'),
      userApprovalsRequired: this.countPendingApprovals(),
      automatedChecksRun: this.countAutomatedChecks(),
      passRate: this.calculatePassRate(),
    };
  }
}
```

#### 5.2 Dashboard UI
```tsx
// src/components/EnforcementDashboard.tsx

export const EnforcementDashboard: React.FC = () => {
  const metrics = useEnforcementMetrics();
  
  return (
    <div className="dashboard">
      <MetricCard
        title="バッチ方式違反"
        value={metrics.batchSystemViolations}
        status={metrics.batchSystemViolations === 0 ? 'success' : 'error'}
      />
      <MetricCard
        title="自動チェック実行"
        value={metrics.automatedChecksRun}
        status="info"
      />
      <MetricCard
        title="合格率"
        value={`${metrics.passRate}%`}
        status={metrics.passRate >= 95 ? 'success' : 'warning'}
      />
    </div>
  );
};
```

---

## 📊 期待される効果

### 定量的効果

```
現状:
- Instructions数: 40+
- 重複率: 5%
- 手動確認時間: 30分/修正
- 違反検出率: 60%（人的レビュー）

目標（Phase 5完了後）:
- Instructions数: 30（統合により削減）
- 重複率: 2%
- 手動確認時間: 5分/修正（自動化により）
- 違反検出率: 95%（自動チェック）
```

### 定性的効果

```
✅ 発見可能性の向上
  - READMEで状況別にガイド
  - Quick Referenceで即座にアクセス
  
✅ 保守性の向上
  - 重複削減により更新が容易
  - 階層化により影響範囲が明確
  
✅ 一貫性の保証
  - 自動チェックにより人的ミス防止
  - Policy as Codeで明確な基準
  
✅ オンボーディングの短縮
  - 新しいAIアシスタントが30分で理解可能
  - Decision Treesで判断フローが明確
```

---

## 🎯 Next Steps（優先順位）

### 最優先（今週）
```
□ README.md の広報（このファイルを他のinstructionsから参照）
□ Quick Referenceの周知
□ 実際の使用での改善点収集
```

### 高優先（来週）
```
□ 重複削減の実施
□ 階層化ディレクトリ構造の実装
□ ESLintカスタムルールのプロトタイプ
```

### 中優先（来月）
```
□ Pre-commit hooksの実装
□ GitHub Actionsの設定
□ ADRテンプレートの作成
```

### 低優先（将来）
```
□ Policy as Codeの完全実装
□ 可視化ダッシュボードの開発
□ VSCode Extension開発
```

---

## 📚 参考文献・ツール

### Architecture Decision Records
- [ADR GitHub](https://adr.github.io/)
- [ADR Tools](https://github.com/npryce/adr-tools)
- [Markdown Architectural Decision Records](https://github.com/joelparkerhenderson/architecture-decision-record)

### Policy as Code
- [Open Policy Agent](https://www.openpolicyagent.org/)
- [Conftest](https://www.conftest.dev/)
- [Kyverno](https://kyverno.io/)

### Quality Gates & Automation
- [ESLint](https://eslint.org/)
- [Husky](https://typicode.github.io/husky/)
- [GitHub Actions](https://github.com/features/actions)
- [SonarQube](https://www.sonarqube.org/)

### Documentation Frameworks
- [Diátaxis](https://diataxis.fr/)
- [Docs as Code](https://www.writethedocs.org/guide/docs-as-code/)
- [Arc42](https://arc42.org/)

---

## 💬 Discussion Points

ユーザーへの質問：

1. **Phase 1の統合・整理**: すぐに開始してよいでしょうか？
2. **ESLintカスタムルール**: 優先度は高いでしょうか？
3. **ADRの導入**: 過去の設計判断も記録すべきでしょうか？
4. **自動化の範囲**: どこまで自動化を進めるべきでしょうか？

---

**Status**: PROPOSAL  
**Created**: 2025-12-30  
**Author**: AI Assistant  
**Reviewers**: User
