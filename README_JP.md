# 英語学習Webアプリ

[![CSS品質チェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![ビルドチェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)
[![文法データ品質](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml)
[![ドキュメントリンク検証](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/link-checker.yml)

TypeScript + React + Vite で構築された英語学習アプリです。忘却曲線・間隔反復・学習状況シグナルなどを使い、次に何を出題するかを調整します。

- デモサイト: https://nanashi8.github.io/
- ドキュメント: [docs/](docs/)
- English README: [README.md](README.md)

## このリポジトリの読みどころ（私たちの仕事）

このリポジトリは、英語学習アプリ本体だけでなく、学習データ・検証・運用ルールまでを同じ場所に置き、長期運用で「壊れやすいところ」を仕組みで守ることを重視しています。

- 出題の中核は、Position（0-100）ベースで7つの専門ロジックを統合するメタ層: [src/ai/scheduler/QuestionScheduler.ts](src/ai/scheduler/QuestionScheduler.ts), [src/ai/specialists/](src/ai/specialists/)
- レイアウトは、変更禁止仕様 + レスポンシブ実装パターン + 視覚回帰テストで崩れを検出/予防: [docs/development/UI_IMMUTABLE_SPECIFICATIONS.md](docs/development/UI_IMMUTABLE_SPECIFICATIONS.md), [docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md](docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md), [docs/development/VISUAL_REGRESSION_TESTING.md](docs/development/VISUAL_REGRESSION_TESTING.md)
- 変更の品質は、型チェック/lint/ドキュメント検証をまとめたゲートと、コミット前ガードで担保（オプトイン）: [package.json](package.json), [scripts/pre-commit-ai-guard.sh](scripts/pre-commit-ai-guard.sh)
- AI支援で作業しても破綻しないよう、指示書体系と作業タイプ別ワークフローを整備: [.aitk/instructions/README.md](.aitk/instructions/README.md), [docs/references/AI_WORKFLOW_INSTRUCTIONS.md](docs/references/AI_WORKFLOW_INSTRUCTIONS.md)

## クイックスタート

前提:

- Node.js 20（[.nvmrc](.nvmrc) 参照）

```bash
npm install
npm run dev
```

http://localhost:5173 を開きます。

## 特徴（誇張なしの範囲）

- 出題順の決定を行うメタスケジューラ（[src/ai/scheduler/](src/ai/scheduler/)）
- 複数の「専門ロジック」（記憶/認知負荷/予測/エンゲージメント等）を統合（[src/ai/AICoordinator.ts](src/ai/AICoordinator.ts)）
- 間隔反復・忘却曲線の扱い（[src/ai/specialists/](src/ai/specialists/)）
- ミス後の短い遅延を挟んだ再出題（短期記憶の影響を減らす目的）
- `localStorage` を使ったローカル永続化

補足: 中核のスケジューリングは主にルール/ヒューリスティクスベースです。MLの実験コードも含みますが（[src/ai/ml/](src/ai/ml/)）、アプリ実行に必須ではありません。

## AI統合フラグ

開発環境（`npm run dev`）では自動で有効化されます。

本番ビルドで有効化したい場合は、ブラウザコンソールで次を実行します:

```js
localStorage.setItem('enable-ai-coordination', 'true');
location.reload();
```

詳細は [docs/ai-systems/how-to-enable.md](docs/ai-systems/how-to-enable.md) を参照してください。

## よく使うコマンド

```bash
# ユニットテスト（fast設定）
npm test

# 型チェック + lint + ドキュメント/ルール検証（PR前推奨）
npm run quality:check

# ビルド / プレビュー
npm run build
npm run preview
```

データ検証やPlaywrightのスモークテストなどは [package.json](package.json) を参照してください。

## 構成

- [src/](src/) - Reactアプリ本体・出題ロジック
- [public/data/](public/data/) - 学習データ
- [docs/](docs/) - 仕様・ガイド・レポート
- [scripts/](scripts/) - 自動化/検証（Pythonを使うものあり）
- [tests/](tests/) - テスト（unit/integration/simulation）
- [extensions/](extensions/) - VS Code拡張など（[extensions/servant/](extensions/servant/)）

## コントリビューション / 品質

- 変更前に [docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md](docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md) を確認してください。
- PR前に `npm run quality:check` の実行を推奨します。
- このREADMEは、実装根拠（実ファイル）へのリンクを添えて、開発者とAI支援（GitHub Copilot / GPT-5.2）で協業しながら更新しています。

## カタログ（ざっくり全体像）

このリポジトリは、Webアプリ本体・学習データ・検証/自動化ツールが同居しています。

- **学習アプリ（TypeScript + React + Vite）**
  - 「次に何を出すか」を決める入口（メタスケジューラ）: [src/ai/scheduler/QuestionScheduler.ts](src/ai/scheduler/QuestionScheduler.ts)
  - 複数の専門ロジック/シグナルの統合: [src/ai/AICoordinator.ts](src/ai/AICoordinator.ts)
  - 記憶・定着の扱い（間隔反復/忘却曲線に近いスコアリング）: [src/strategies/memoryAcquisitionAlgorithm.ts](src/strategies/memoryAcquisitionAlgorithm.ts), [src/strategies/memoryRetentionAlgorithm.ts](src/strategies/memoryRetentionAlgorithm.ts)
  - 単調さを減らすための混ぜ方（インターリーブ）: [src/ai/specialists/GamificationAI.ts](src/ai/specialists/GamificationAI.ts)
  - 進捗はローカル保存（localStorageベース）: [src/storage/progress/progressStorage.ts](src/storage/progress/progressStorage.ts)
  - 基本はルール/ヒューリスティクス中心（ML実験コードも同梱）: [src/ai/ml/](src/ai/ml/)

- **学習データ（public/data）**
  - 単語・文法・読解などのデータと派生ファイル: [public/data/](public/data/)
  - 変換/検証スクリプト: [scripts/](scripts/) / [tools/](tools/)
  - データ品質の考え方や参照先は: [docs/guidelines/](docs/guidelines/)

- **品質ゲートとテスト**
  - 型チェック + lint + ドキュメント/ルール検証をまとめて実行: `npm run quality:check`
  - Playwrightのスモーク/ビジュアルテストやシミュレーションテスト: [tests/](tests/)

- **先進的な取り組み（事例）**
  アプリ本体・データ・自動化が同居するリポジトリでは、変更の影響が「静かに」広がりやすく、気づいた時には出題・UI・品質が崩れていることがあります。
  そこでこのプロジェクトでは、AI支援を前提にしつつも推測で壊さないための前提（仕様/ルール/ガード）を整備し、壊れやすい領域から順に仕組み化しています。

  - 8個のAIシステム（7つの専門AI + 1つのメタ統合）で「次に何を出すか」を合議で決める構成: [src/ai/scheduler/QuestionScheduler.ts](src/ai/scheduler/QuestionScheduler.ts), [src/ai/specialists/](src/ai/specialists/), [src/ai/meta/](src/ai/meta/)
  - UI・データ・自動化が同居する前提で、コミット前に「指示/仕様を見てから触る」を促すガード（オプトイン）: [scripts/pre-commit-ai-guard.sh](scripts/pre-commit-ai-guard.sh), [scripts/ai-guard-check.mjs](scripts/ai-guard-check.mjs)
  - UIの変更範囲やデザインルールをドキュメント化し、レビュー/AI支援時の前提を固定する: [docs/development/UI_IMMUTABLE_SPECIFICATIONS.md](docs/development/UI_IMMUTABLE_SPECIFICATIONS.md), [docs/development/UI_DEVELOPMENT_GUIDELINES.md](docs/development/UI_DEVELOPMENT_GUIDELINES.md), [docs/development/DESIGN_SYSTEM_RULES.md](docs/development/DESIGN_SYSTEM_RULES.md)
  - レイアウト崩れを検出/予防するための基盤（レスポンシブ実装パターン + 視覚回帰テストのガイド/雛形）: [docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md](docs/development/RESPONSIVE_IMPLEMENTATION_GUIDE.md), [docs/development/VISUAL_REGRESSION_TESTING.md](docs/development/VISUAL_REGRESSION_TESTING.md), [tests/smoke.spec.ts](tests/smoke.spec.ts)
  - 「AI支援で開発する」前提のガバナンス（指示書体系 + 作業タイプ別ワークフロー）: [.aitk/instructions/README.md](.aitk/instructions/README.md), [docs/references/AI_WORKFLOW_INSTRUCTIONS.md](docs/references/AI_WORKFLOW_INSTRUCTIONS.md)
  - スタイル面の「禁止パターン」を機械的に検出するチェック（例: 特定のクラス/セレクタの検出）: [scripts/check-no-dark-mode.mjs](scripts/check-no-dark-mode.mjs)

- **VS Code拡張（任意）**
  - 指示書（`.instructions.md`）ベースのルール検証と開発フロー支援を行う拡張: [extensions/servant/](extensions/servant/)
  - リアルタイム検証（Problems表示）と Quick Fix（コードアクション）
  - Git hook 連携（オプトイン）: `pre-commit` / `commit-msg` を導入でき、`pre-commit` は repo 側ガード（[scripts/pre-commit-ai-guard.sh](scripts/pre-commit-ai-guard.sh)）がある場合はそれを優先実行
  - 仕様/意思決定の作業補助（例）: `Servant: Review Required Instructions`, `Servant: Record Spec Check`, `Servant: Open Working Spec`, `Servant: Append Decision Log`
  - 便利コマンド: `Servant: 🚀 Quick Fix Commit (DECISIONS追記→コミット)` は [docs/specifications/DECISIONS.md](docs/specifications/DECISIONS.md) に追記しつつ `git add`/`git commit` まで実行
  - コマンド/設定の全体像は拡張側READMEに集約: [extensions/servant/README.md](extensions/servant/README.md)

  アプリ実行には必須ではありません。

## ライセンス

このリポジトリのルートにはライセンスファイルがありません。

利用条件（概要）:
- 個人利用・教育機関での利用（教材としての利用を含む）は許可します。
- 商用利用は不可（応相談。リポジトリオーナーに連絡してください）。

VS Code拡張（[extensions/servant/](extensions/servant/)）は個別にライセンスを持ちます: [extensions/servant/LICENSE](extensions/servant/LICENSE)
