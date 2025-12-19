---
description: プロジェクトのコア原則とアーキテクチャ方針
applyTo: '**'
---

# コア原則

このプロジェクトの基本方針とコーディング原則を定義します。すべての開発作業はこれらの原則に従う必要があります。

## 🎯 プロジェクトビジョン

TypeScript + Reactで構築された、モダンで保守性の高い英語学習アプリケーション。

### 主要目標

1. **型安全性**: TypeScript strict modeで完全な型付け
2. **保守性**: モジュラーアーキテクチャと明確な責任分離
3. **品質**: エラーゼロポリシーと自動化された品質チェック
4. **拡張性**: 機能追加が容易な設計

## 🏗️ アーキテクチャ原則

### 1. モジュラーアーキテクチャ

**原則**: 機能ごとにディレクトリとモジュールを分離する

```
src/
├── types/           # 型定義（ドメイン、UI、AI等）
├── constants/       # 定数定義
├── hooks/           # カスタムフック（ロジックの再利用）
├── ai/              # AI機能モジュール（8-AIシステム）
│   ├── scheduler/   # QuestionScheduler（メタAI統合層）
│   ├── coordinator/ # AICoordinator（7AI信号統合）
│   └── specialists/ # 7つの専門AI
├── storage/         # ストレージ管理
├── features/        # 機能モジュール
├── components/      # UIコンポーネント
└── utils/           # ユーティリティ関数
```

**理由**:
- ファイルの発見性が向上
- 依存関係が明確になる
- テストが容易になる
- コードレビューが効率化
- AI機能の責任分離が明確

### 1.1 8-AIシステムアーキテクチャ

**原則**: 7つの専門AIとメタAI統合層による階層アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│         QuestionScheduler（メタAI - 第8のAI）          │
│  - 7つの専門AIのシグナル統合                              │
│  - DTA（Dynamic Time-based Adjustment）                 │
│  - 振動防止（直近正解の除外）                              │
│  - category優先制御（incorrect > still_learning > new）  │
└─────────────────────────────────────────────────────────┘
          ↑ シグナル統合（AICoordinator経由）
┌──────────┬──────────┬──────────┬──────────┐
│ Memory   │Cognitive │  Error   │ Learning │
│   AI     │ Load AI  │Prediction│ Style AI │
└──────────┴──────────┴──────────┴──────────┘
┌──────────┬──────────┬──────────┐
│Linguistic│Contextual│Gamifica- │
│   AI     │   AI     │ tion AI  │
└──────────┴──────────┴──────────┘
```

**実装ファイル**:
- `src/ai/scheduler/QuestionScheduler.ts` - メタAI（第8のAI）
- `src/ai/coordinator/AICoordinator.ts` - 7AIシグナル統合
- `src/ai/specialists/*.ts` - 7つの専門AI

**設計原則**:
- **単一責任**: 各AIは1つの専門領域のみ担当
- **疎結合**: AICoordinator経由でのみ通信
- **並列処理**: Promise.allで7AIを同時実行
- **オプトイン**: localStorage経由で有効化（`enable-ai-coordination`）

**参照**:
- [メタAI優先指示](./meta-ai-priority.instructions.md)
- [QuestionScheduler仕様書](../../docs/specifications/QUESTION_SCHEDULER_SPEC.md)

### 2. 関心事の分離

**原則**: ビジネスロジック、UI、データ管理を分離する

```typescript
// ✅ Good: ロジックはカスタムフックに
function useQuizLogic() {
  // ビジネスロジック
}

function QuizComponent() {
  const logic = useQuizLogic();
  // UIのみ
}

// ❌ Bad: すべてを1つのコンポーネントに
function QuizComponent() {
  // ロジック + UI が混在
}
```

### 3. パスエイリアスの使用

**原則**: 相対パスではなく `@/*` エイリアスを使用する

```typescript
// ✅ Good: パスエイリアス
import type { Question } from '@/types';
import { useQuizSettings } from '@/hooks/useQuizSettings';
import { OFFICIAL_CATEGORIES } from '@/constants';

// ❌ Bad: 相対パス
import type { Question } from '../../types';
import { useQuizSettings } from '../hooks/useQuizSettings';
```

**理由**:
- ファイル移動時の修正が不要
- インポート文が読みやすい
- IDEのサポートが向上

## 💻 コーディング原則

### 1. TypeScript Strict Mode

**原則**: 常にstrict modeで開発し、型安全性を最大化する

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 2. カスタムフックの活用

**原則**: 再利用可能なロジックはカスタムフックに抽出する

```typescript
// ✅ Good: カスタムフック化
function useQuizSettings() {
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(3);
  
  // LocalStorage統合
  useEffect(() => {
    const saved = localStorage.getItem('autoAdvance');
    if (saved) setAutoAdvance(JSON.parse(saved));
  }, []);
  
  return { autoAdvance, autoAdvanceDelay, setAutoAdvance, setAutoAdvanceDelay };
}

// ❌ Bad: コンポーネント内でロジック実装
function Component() {
  const [autoAdvance, setAutoAdvance] = useState(false);
  // ... 複雑なロジック ...
}
```

**ガイドライン**:
- 50行以上のロジックはフック化を検討
- 複数コンポーネントで使用するロジックは必ずフック化
- フックは `src/hooks/` に配置
- フック名は `use` で始める

### 3. 型定義の一元管理

**原則**: 型定義は必ず `@/types` から読み込む

```typescript
// ✅ Good: 型は @/types から
import type { Question, QuizState, Answer } from '@/types';

// ❌ Bad: ローカル型定義
type Question = {
  word: string;
  // ...
};
```

**型定義の配置**:
- `types/domain.ts`: ドメイン型（Question, QuestionSet等）
- `types/ui.ts`: UI型（Tab, DifficultyLevel等）
- `types/reading.ts`: 読解型（ReadingPassage等）
- `types/ai.ts`: AI型（AIPersonality等）
- `types/storage.ts`: ストレージ型（LearningSchedule等）

### 4. 定数の一元管理

**原則**: マジックナンバー・マジックストリングは定数化する

```typescript
// ✅ Good: 定数使用
import { OFFICIAL_CATEGORIES, DIFFICULTY_LEVELS } from '@/constants';

if (category === OFFICIAL_CATEGORIES.FOOD_HEALTH) {
  // ...
}

// ❌ Bad: マジックストリング
if (category === '食・健康') {
  // ...
}
```

## 🔍 品質原則

### 1. エラーゼロポリシー

**原則**: TypeScriptエラー、ESLintエラー、ビルドエラーは常にゼロを維持する

```bash
# ビルド前の必須チェック
npm run typecheck  # 0 errors
npm run lint       # 0 errors
npm run build      # success
```

### 2. 段階的改善

**原則**: 大規模リファクタリングは段階的に実施する

**Phase 1**: ディレクトリ構造整理
**Phase 2**: カスタムフック作成
**Phase 3**: コンポーネント分割（必要に応じて）

### 3. ドキュメント駆動開発

**原則**: コード変更と同時にドキュメントを更新する

- 新機能追加 → ドキュメント追加
- リファクタリング → ドキュメント更新
- 削除 → ドキュメント削除

## 📊 パフォーマンス原則

### 1. コンポーネントサイズ制限

**原則**: 1ファイルは2000行以下を目標とする

- 2000行以上: リファクタリング必須
- 1000-2000行: リファクタリング推奨
- 1000行以下: 適切

### 2. 不要な再レンダリング防止

**原則**: `useMemo`、`useCallback`、`memo`を適切に使用する

```typescript
// ✅ Good: メモ化
const filteredQuestions = useMemo(
  () => questions.filter(q => q.category === category),
  [questions, category]
);

// ❌ Bad: 毎回計算
const filteredQuestions = questions.filter(q => q.category === category);
```

## 🧪 テスト原則

### 1. スマートテスト実行

**原則**: 変更に関連するテストのみ実行する（pre-push）

```bash
# Husky pre-push フック
npm run test:smart
```

### 2. 煙テスト優先

**原則**: 基本動作を保証する軽量テストを優先する

```typescript
test('アプリが起動する', async () => {
  await page.goto('/');
  await expect(page.locator('text=/^[A-Za-z]{4,}$/')).toBeVisible();
});
```

## 🚀 デプロイ原則

### 1. ビルド成功必須

**原則**: ビルドが成功しない限りデプロイしない

```bash
npm run build  # 必ず成功すること
```

### 2. CI/CDグリーン必須

**原則**: すべてのCIチェックが通過した状態を維持する

- CSS品質チェック: ✅
- ビルドチェック: ✅
- 文法データ品質: ✅

## 📝 Git原則

### 1. コミットメッセージ規約

**原則**: Conventional Commitsに従う

```bash
# フォーマット
<type>(<scope>): <subject>

# 例
feat(quiz): クイズ自動進行機能を追加
fix(spelling): スペルチェックバグを修正
docs: README.mdを更新
refactor(hooks): useQuizSettingsを作成
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

### 2. ブランチ戦略

**原則**: mainブランチは常にデプロイ可能な状態を維持する

```bash
# 機能開発
git checkout -b feature/quiz-auto-advance

# バグ修正
git checkout -b fix/spelling-check-bug

# ドキュメント
git checkout -b docs/update-readme
```

## 🔐 セキュリティ原則

### 1. APIキー管理

**原則**: APIキーは環境変数で管理し、コードに埋め込まない

```typescript
// ✅ Good: 環境変数
const apiKey = import.meta.env.VITE_API_KEY;

// ❌ Bad: ハードコード
const apiKey = 'sk-1234567890abcdef';
```

### 2. ユーザーデータ保護

**原則**: ユーザーデータはローカルストレージで管理し、外部送信しない

- LocalStorage: 設定値、軽量データ
- IndexedDB: 進捗データ、大容量データ

## 📚 関連ドキュメント

- [プロジェクト構造](./project-structure.instructions.md)
- [開発ガイドライン](./development-guidelines.instructions.md)
- [コード品質](./code-quality.instructions.md)

---

**Last Updated**: 2025年12月19日  
**Version**: 3.0.0（8-AIシステム統合完了、Phase 1-4完了）
