# アーキテクチャ設計原則

> **プロジェクト全体の設計指針**
>
> 最終更新: 2025年12月22日

## 🎯 設計哲学

このプロジェクトは以下の原則に基づいて設計されています：

### 1. Single Source of Truth (SSOT)

**原則**: すべてのデータ・ロジックは唯一の正式な定義元を持つ

**実装例**:
- 学習段階（Position）判定: `src/ai/utils/categoryDetermination.ts` の `determineWordPosition()`
- データ永続化: `src/storage/progress/progressStorage.ts`
- AI評価: `src/ai/scheduler/QuestionScheduler.ts`

**禁止事項**:
- ❌ 同じロジックを複数箇所にコピー&ペースト
- ❌ 微妙に異なる判定基準の複製
- ❌ "とりあえずここでも書いておく"

### 2. 責任分離（Separation of Concerns）

```
📊 データ定義層 (types/)
    ↓ 依存（import）
🧠 ビジネスロジック層 (ai/, strategies/)
    ↓ 依存（import）
💾 データ永続化層 (storage/)
    ↓ 依存（import）
🎨 プレゼンテーション層 (components/)
```

**依存の方向**: 上位レイヤーから下位レイヤーへの一方向のみ

#### 各レイヤーの責任

##### 📊 データ定義層（types/）
- TypeScript型定義
- インターフェース定義
- 定数定義
- **依存**: なし

##### 🧠 ビジネスロジック層（ai/, strategies/）
- AI判定ロジック
- 学習アルゴリズム
- 出題戦略
- **依存**: types/

##### 💾 データ永続化層（storage/）
- localStorage操作
- データ保存・読み込み
- キャッシュ管理
- **依存**: types/, ai/, strategies/

##### 🎨 プレゼンテーション層（components/）
- UI描画
- ユーザー操作
- 状態管理（React state）
- **依存**: 全レイヤー

### 3. DRY（Don't Repeat Yourself）

**原則**: 同じロジックは1箇所にのみ書く

**実装方法**:
1. 共通ロジックを関数化
2. ユーティリティモジュールに配置
3. 必要な場所でimport

**例**:
```typescript
// ❌ 悪い例: 重複
function componentA() {
  const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

function componentB() {
  const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24); // 重複！
}

// ✅ 良い例: 共通化
// utils/dateUtils.ts
export function daysSince(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

// 使用側
import { daysSince } from './utils/dateUtils';
const days = daysSince(timestamp);
```

### 4. Open/Closed Principle（開放/閉鎖原則）

**原則**: 拡張に対して開いている、修正に対して閉じている

**実装方法**:
- 抽象化・インターフェース化
- Strategy パターン
- Dependency Injection

**例**:
```typescript
// ✅ 良い設計: 新しいAIを追加しても既存コードを変更しない
interface LearningAI {
  evaluate(progress: WordProgress): number;
}

class MemoryAI implements LearningAI { /* ... */ }
class CognitiveLoadAI implements LearningAI { /* ... */ }
class NewAI implements LearningAI { /* ... */ } // 追加しても既存コードは不変
```

### 5. Dependency Inversion Principle（依存性逆転原則）

**原則**: 具象ではなく抽象に依存する

```typescript
// ❌ 悪い例: 具象に依存
class Scheduler {
  private storage = new LocalStorage(); // 具象クラスに依存
}

// ✅ 良い例: 抽象に依存
interface StorageInterface {
  save(key: string, value: any): void;
  load(key: string): any;
}

class Scheduler {
  constructor(private storage: StorageInterface) {} // 抽象に依存
}
```

---

## 📁 ディレクトリ構造

```
src/
├── types/              # 📊 データ定義層
│   ├── question.ts     # Question型定義
│   └── storage.ts      # Storage型定義
│
├── ai/                 # 🧠 ビジネスロジック層
│   ├── utils/
│   │   └── categoryDetermination.ts  # 学習段階判定（SSOT）
│   └── scheduler/
│       └── QuestionScheduler.ts      # メタAI
│
├── strategies/         # 🧠 ビジネスロジック層
│   ├── memoryAcquisitionAlgorithm.ts
│   └── spaceRepetitionAlgorithm.ts
│
├── storage/            # 💾 データ永続化層
│   └── progress/
│       └── progressStorage.ts        # データ保存（SSOT）
│
└── components/         # 🎨 プレゼンテーション層
    └── MemorizationView.tsx
```

---

## 🔧 実装ガイドライン

### 新機能追加時の手順

1. **責任の所在を決定**
   - この機能はどのレイヤーに属するか？
   - 既存のモジュールで対応可能か？

2. **既存コードを確認**
   ```bash
   # 類似機能を検索
   grep -r "function.*similar" src/
   
   # セマンティック検索
   # VS Code: Cmd+Shift+F で検索
   ```

3. **Single Source of Truth を確認**
   - 同じ責任を持つコードが既に存在しないか？
   - 存在する場合 → それを使用・拡張
   - 存在しない場合 → 新規作成（ドキュメント化）

4. **依存関係を確認**
   - 下位レイヤーから上位レイヤーへの依存はないか？
   - 循環依存は発生していないか？

5. **テスト追加**
   - ユニットテスト
   - 統合テスト（必要な場合）

### コードレビューチェックリスト

#### 設計原則
- [ ] Single Source of Truth を守っているか
- [ ] 責任分離が適切か
- [ ] DRY原則を守っているか
- [ ] 依存の方向が正しいか

#### 実装品質
- [ ] 関数・変数名が意図を明確に表しているか
- [ ] JSDocでドキュメント化されているか
- [ ] エッジケースを考慮しているか
- [ ] エラーハンドリングが適切か

#### 保守性
- [ ] 対症療法ではなく根本治療か
- [ ] 将来の拡張を考慮しているか
- [ ] テストが書かれているか
- [ ] ドキュメントが更新されているか

---

## 🚨 アンチパターン

### 1. God Object（神オブジェクト）

**問題**: 1つのクラスが多すぎる責任を持つ

```typescript
// ❌ 悪い例
class QuizManager {
  loadQuestions() {}
  saveProgress() {}
  calculateScore() {}
  renderUI() {}
  handleNetwork() {}
  // ... 200行以上
}

// ✅ 良い例: 責任を分割
class QuestionLoader {}
class ProgressStorage {}
class ScoreCalculator {}
class QuizUI {}
class NetworkHandler {}
```

### 2. Shotgun Surgery（散弾銃手術）

**問題**: 1つの変更が多数のファイルの修正を必要とする

```typescript
// ❌ 悪い例: 判定ロジックが10箇所に散在
// 変更時に10箇所全て修正が必要

// ✅ 良い例: 1箇所に集約
// determineWordPosition() のみ修正すれば全体に反映
```

### 3. Copy & Paste Programming

**問題**: コードをコピー&ペーストして修正

```typescript
// ❌ 絶対禁止
// 他の場所からコピーして微修正

// ✅ 正しい: 共通部分を関数化
```

---

## 📚 参考資料

### 書籍
- "Clean Architecture" by Robert C. Martin
- "Design Patterns" by Gang of Four
- "Refactoring" by Martin Fowler

### プロジェクト内ドキュメント
- [対症療法禁止ポリシー](../guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md)
- [開発ガイドライン](../../.github/CONTRIBUTING.md)
- [AI修正ガイドライン](../../.aitk/instructions/ai-modification-guard.instructions.md)

---

**このアーキテクチャ原則は全プロジェクトに適用されます。**
