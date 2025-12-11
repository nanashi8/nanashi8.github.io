---
description: プロジェクト構造とディレクトリ配置ルール
applyTo: '**'
---

# プロジェクト構造ガイド

Phase 1-2リファクタリング完了後（2025年12月11日）のプロジェクト構造を説明します。

## 📁 ディレクトリ構造

```
nanashi8.github.io/
├── src/                          # ソースコード
│   ├── types/                    # 型定義（5ファイル + index.ts）
│   │   ├── domain.ts             # ドメイン型（Question, QuestionSet等）
│   │   ├── ui.ts                 # UI型（Tab, DifficultyLevel等）
│   │   ├── reading.ts            # 読解型（ReadingPassage等）
│   │   ├── ai.ts                 # AI型（AIPersonality等）
│   │   ├── storage.ts            # ストレージ型（LearningSchedule等）
│   │   └── index.ts              # 統合エクスポート
│   │
│   ├── constants/                # 定数定義
│   │   ├── categories.ts         # OFFICIAL_CATEGORIES, DIFFICULTY_LEVELS
│   │   ├── dataSources.ts        # DataSource型定義
│   │   └── index.ts              # 統合エクスポート
│   │
│   ├── hooks/                    # カスタムフック（6個、485行）
│   │   ├── useQuizSettings.ts    # 自動進行設定管理
│   │   ├── useQuizFilters.ts     # フィルター状態管理
│   │   ├── useQuizState.ts       # クイズ状態管理
│   │   ├── useSpellingGame.ts    # スペリングゲームロジック
│   │   ├── useSessionStats.ts    # セッション統計
│   │   └── useLearningLimits.ts  # 学習制限管理
│   │
│   ├── ai/                       # AI機能（8モジュール）
│   │   ├── cognitive/
│   │   │   └── cognitiveLoadAI.ts       # 認知負荷管理
│   │   ├── prediction/
│   │   │   └── errorPredictionAI.ts     # エラー予測
│   │   ├── adaptation/
│   │   │   ├── adaptiveLearningAI.ts    # 適応学習
│   │   │   └── learningStyleAI.ts       # 学習スタイル
│   │   ├── analysis/
│   │   │   ├── radarChartAI.ts          # レーダーチャート
│   │   │   ├── learningCurveAI.ts       # 学習曲線
│   │   │   └── linguisticRelationsAI.ts # 言語関係分析
│   │   ├── optimization/
│   │   │   ├── learningOptimizer.ts     # 学習最適化
│   │   │   └── contextualLearningAI.ts  # 文脈学習
│   │   ├── engagement/
│   │   │   └── gamificationAI.ts        # ゲーミフィケーション
│   │   └── index.ts              # 統合エクスポート
│   │
│   ├── storage/                  # ストレージ管理（6モジュール）
│   │   ├── indexedDB/
│   │   │   └── indexedDBStorage.ts      # IndexedDB実装
│   │   ├── progress/
│   │   │   └── progressStorage.ts       # 進捗管理（3550行）
│   │   ├── migration/
│   │   │   └── dataMigration.ts         # データ移行
│   │   ├── manager/
│   │   │   ├── storageManager.ts        # ストレージマネージャー
│   │   │   ├── storageInfo.ts           # ストレージ情報
│   │   │   └── dataExport.ts            # データエクスポート
│   │   └── index.ts              # 統合エクスポート
│   │
│   ├── features/                 # 機能モジュール（13モジュール）
│   │   ├── learning/
│   │   │   ├── learningAssistant.ts     # 学習アシスタント
│   │   │   ├── forgettingAlert.ts       # 忘却アラート
│   │   │   ├── goalSimulator.ts         # 目標シミュレーター
│   │   │   └── retentionRateImproved.ts # 定着率改善
│   │   ├── interaction/
│   │   │   ├── aiCommentGenerator.ts    # AIコメント生成
│   │   │   ├── aiCommentHelpers.ts      # コメントヘルパー
│   │   │   ├── teacherInteractions.ts   # 教師インタラクション
│   │   │   ├── timeBasedGreeting.ts     # 時間ベース挨拶
│   │   │   └── englishTrivia.ts         # 英語トリビア
│   │   ├── analysis/
│   │   │   └── confusionPairs.ts        # 混同分析
│   │   ├── speech/
│   │   │   └── speechSynthesis.ts       # 音声合成
│   │   └── index.ts              # 統合エクスポート
│   │
│   ├── components/               # Reactコンポーネント（20個以上）
│   │   ├── QuizView.tsx          # クイズビュー（528行）
│   │   ├── SpellingView.tsx      # スペリングビュー（749行、Phase 2で-15.8%）
│   │   ├── ComprehensiveReadingView.tsx # 読解ビュー（2564行）
│   │   ├── StatsView.tsx         # 統計ビュー
│   │   └── [その他コンポーネント]
│   │
│   ├── utils/                    # ユーティリティ関数
│   │   └── utils.ts              # 汎用ユーティリティ（1106行）
│   │
│   ├── styles/                   # CSSスタイル
│   │   └── [各種CSSファイル]
│   │
│   ├── App.tsx                   # メインアプリケーション（1623行、Phase 2で-1.7%）
│   └── main.tsx                  # エントリーポイント
│
├── public/                       # 静的ファイル
│   └── data/                     # データファイル（CSV、JSON）
│       ├── junior_high_vocab_v2.csv
│       ├── junior_high_phrases_v2.csv
│       └── grammar_questions_v2.json
│
├── docs/                         # ドキュメント（139個→統合予定）
│   ├── README.md                 # ドキュメント索引
│   ├── QUICKSTART.md             # クイックスタート（作成予定）
│   ├── development/              # 開発ドキュメント
│   │   ├── REFACTORING_PLAN.md   # Phase 1-2完了報告
│   │   └── DOCUMENTATION_REVISION_PLAN.md
│   ├── quality/                  # 品質ドキュメント
│   ├── specifications/           # 仕様書
│   └── [その他]
│
├── scripts/                      # 品質チェック・データ処理スクリプト
│   ├── check-guidelines.sh
│   ├── check-data-quality.sh
│   └── [その他スクリプト]
│
├── tests/                        # Playwright E2Eテスト
│   └── smoke-fast.spec.ts
│
├── .aitk/instructions/           # AI開発指示書
│   ├── README.md                 # Instructions索引
│   ├── core-principles.instructions.md
│   ├── project-structure.instructions.md
│   ├── development-guidelines.instructions.md
│   ├── code-quality.instructions.md
│   ├── data-quality/
│   └── patterns/
│
├── .github/                      # GitHub設定
│   ├── workflows/                # GitHub Actions
│   │   ├── css-lint.yml
│   │   ├── build.yml
│   │   └── grammar-quality-check.yml
│   ├── DEVELOPMENT_GUIDELINES.md
│   └── CONTRIBUTING.md
│
├── package.json                  # 依存関係・スクリプト
├── tsconfig.json                 # TypeScript設定
├── vite.config.ts                # Vite設定（パスエイリアス含む）
├── tailwind.config.js            # Tailwind CSS設定
└── README.md                     # プロジェクト説明
```

## 🎯 ファイル配置ルール

### 1. 型定義（types/）

**ルール**: すべての型定義は `src/types/` に配置する

```typescript
// ✅ Good: types/ に配置
// src/types/domain.ts
export interface Question {
  word: string;
  reading: string;
  meaning: string;
  // ...
}

// ❌ Bad: コンポーネントファイル内で型定義
// src/components/QuizView.tsx
interface Question { /* ... */ }
```

**カテゴリ別配置**:
- `domain.ts`: ビジネスロジックの型（Question, QuestionSet, Answer等）
- `ui.ts`: UI関連の型（Tab, DifficultyLevel, Category等）
- `reading.ts`: 読解機能の型（ReadingPassage, ComprehensionQuestion等）
- `ai.ts`: AI機能の型（AIPersonality, CommentContext等）
- `storage.ts`: ストレージの型（LearningSchedule, ProgressData等）

### 2. 定数（constants/）

**ルール**: マジックナンバー・ストリングは定数化して `src/constants/` に配置

```typescript
// ✅ Good: constants/ に配置
// src/constants/categories.ts
export const OFFICIAL_CATEGORIES = {
  LANGUAGE_BASICS: '言語基本',
  FOOD_HEALTH: '食・健康',
  // ...
} as const;

// ❌ Bad: ハードコード
if (category === '食・健康') { /* ... */ }
```

### 3. カスタムフック（hooks/）

**ルール**: 再利用可能なロジックは `src/hooks/` に配置

**命名規則**: `use` + 機能名（キャメルケース）

```typescript
// ✅ Good: hooks/ に配置
// src/hooks/useQuizSettings.ts
export function useQuizSettings() {
  // ロジック
}

// ❌ Bad: コンポーネント内でロジック実装
function QuizView() {
  const [autoAdvance, setAutoAdvance] = useState(false);
  // ... 複雑なロジック ...
}
```

**フック化の基準**:
- 50行以上のロジック → フック化を検討
- 複数コンポーネントで使用 → 必ずフック化
- 状態管理 + 副作用を含む → フック化推奨

### 4. AI機能（ai/）

**ルール**: AI関連のロジックは `src/ai/` 配下に機能別で配置

**サブディレクトリ**:
- `cognitive/`: 認知負荷管理
- `prediction/`: エラー予測
- `adaptation/`: 適応学習、学習スタイル
- `analysis/`: 分析機能（レーダーチャート、学習曲線等）
- `optimization/`: 学習最適化、文脈学習
- `engagement/`: ゲーミフィケーション

### 5. ストレージ（storage/）

**ルール**: データ永続化に関するコードは `src/storage/` 配下に配置

**サブディレクトリ**:
- `indexedDB/`: IndexedDB実装
- `progress/`: 進捗管理（3550行の大規模ファイル）
- `migration/`: データ移行
- `manager/`: ストレージマネージャー、情報取得、エクスポート

### 6. 機能モジュール（features/）

**ルール**: ビジネスロジックは `src/features/` 配下に機能別で配置

**サブディレクトリ**:
- `learning/`: 学習支援、忘却アラート、目標シミュレーター、定着率
- `interaction/`: AIコメント、教師インタラクション、挨拶、トリビア
- `analysis/`: 混同分析
- `speech/`: 音声合成

### 7. Reactコンポーネント（components/）

**ルール**: UIコンポーネントは `src/components/` に配置

**命名規則**: パスカルケース + `.tsx`

```typescript
// ✅ Good: components/ に配置
// src/components/QuizView.tsx
export function QuizView() { /* ... */ }

// ❌ Bad: srcルートに配置
// src/QuizView.tsx
```

**コンポーネントサイズ制限**:
- 2000行以上: リファクタリング必須
- 1000-2000行: リファクタリング推奨
- 1000行以下: 適切

### 8. ユーティリティ（utils/）

**ルール**: 汎用ヘルパー関数は `src/utils/` に配置

```typescript
// ✅ Good: 汎用関数
// src/utils/utils.ts
export function shuffleArray<T>(array: T[]): T[] { /* ... */ }

// ❌ Bad: 特定機能に依存
// utils.tsに特定のAI機能ロジックを配置
```

## 🔗 パスエイリアス

**設定済みエイリアス**:

```json
{
  "@/*": "src/*",
  "@/types": "src/types",
  "@/constants": "src/constants",
  "@/hooks": "src/hooks",
  "@/ai": "src/ai",
  "@/storage": "src/storage",
  "@/features": "src/features",
  "@/components": "src/components",
  "@/utils": "src/utils"
}
```

**使用例**:

```typescript
// ✅ Good: パスエイリアス使用
import type { Question, QuizState } from '@/types';
import { OFFICIAL_CATEGORIES } from '@/constants';
import { useQuizSettings } from '@/hooks/useQuizSettings';
import { cognitiveLoadAI } from '@/ai/cognitive/cognitiveLoadAI';
import { progressStorage } from '@/storage/progress/progressStorage';

// ❌ Bad: 相対パス
import type { Question } from '../../types';
import { OFFICIAL_CATEGORIES } from '../constants';
```

**メリット**:
- ファイル移動時の修正不要
- インポート文が読みやすい
- IDEのオートコンプリート向上

## 📊 プロジェクト統計（2025年12月11日）

| 項目 | 数値 |
|------|------|
| srcトップレベルディレクトリ | 11個 |
| srcルート直下ファイル | 15個（Phase 1で28個→15個、-46%） |
| カスタムフック | 6個（485行） |
| AI機能モジュール | 8個 |
| ストレージモジュール | 6個 |
| 機能モジュール | 13個 |
| Reactコンポーネント | 20個以上 |
| 総コード行数（主要ファイル） | 13,976行 |

## 🚫 アンチパターン

### 1. srcルートへの直接配置

```typescript
// ❌ Bad: srcルートにファイルを増やす
src/
├── myNewFeature.ts     // ❌ 配置場所が不明確
└── helperFunction.ts   // ❌ 汎用なのか機能固有なのか不明

// ✅ Good: 適切なディレクトリに配置
src/
├── features/
│   └── myNewFeature/
│       └── myNewFeature.ts
└── utils/
    └── helperFunction.ts
```

### 2. 相対パスの多用

```typescript
// ❌ Bad: 相対パス
import { Question } from '../../../types/domain';
import { useQuizSettings } from '../../hooks/useQuizSettings';

// ✅ Good: パスエイリアス
import type { Question } from '@/types';
import { useQuizSettings } from '@/hooks/useQuizSettings';
```

### 3. 型定義の分散

```typescript
// ❌ Bad: 各ファイルで型定義
// src/components/QuizView.tsx
interface Question { /* ... */ }

// src/components/SpellingView.tsx
interface Question { /* ... */ }  // 重複！

// ✅ Good: types/ で一元管理
// src/types/domain.ts
export interface Question { /* ... */ }
```

### 4. 巨大コンポーネント

```typescript
// ❌ Bad: 2000行超のコンポーネント
// src/components/ComprehensiveReadingView.tsx (2564行)

// ✅ Good: カスタムフック抽出 + コンポーネント分割
// src/hooks/useReading.ts
export function useReading() { /* ロジック */ }

// src/components/ComprehensiveReadingView.tsx
export function ComprehensiveReadingView() {
  const reading = useReading();
  return <ReadingDisplay {...reading} />;
}
```

## 📝 新規ファイル追加時のチェックリスト

- [ ] 適切なディレクトリに配置されているか？
- [ ] ファイル名が命名規則に従っているか？
- [ ] パスエイリアスを使用しているか？
- [ ] 型定義は `@/types` からインポートしているか？
- [ ] 定数は `@/constants` からインポートしているか？
- [ ] エクスポートは `index.ts` で統合されているか？

## 📚 関連ドキュメント

- [開発ガイドライン](./development-guidelines.instructions.md)

---

**Last Updated**: 2025年12月11日  
**Version**: 2.0.0（Phase 1-2完了）
