# Change Log

All notable changes to the "Instructions Validator" extension will be documented in this file.

## [Unreleased]

## [0.4.3] - 2026-01-14

### 🔕 Improvements
- ✅ Workspace root / Activation / CodeQualityGuard / Git などの情報ログを設定で抑制可能化（デフォルトOFF）
- ✅ Autopilot の「事前誘導」「閉ループ再計画」「天体儀ビュー」を off/summary/full で制御（デフォルトは要約/非表示）

## [0.4.2] - 2026-01-14

### 🔕 Improvements
- ✅ GitHub Actions健康診断のレポート本文をデフォルトで短文化（詳細は"Servant: Show Warning Log"へ）
- ✅ 設定 `servant.actionsHealth.reportVerbosity` で full/summary を切り替え可能

## [0.4.1] - 2026-01-14

### 🔕 Improvements
- ✅ 警告出力をデフォルトで簡略化（長文レポート/JSONは表示しない）
- ✅ "Servant: Show Warning Log" で警告詳細（診断レポート/JSON）を閲覧可能
- ✅ 起動ログ/監視開始ログ/Autopilot初期化ログを設定で抑制可能

### 🔕 静かな警告システム（Quiet Warning System）

**コンセプト**: サーバントは静かに見守り、必要に応じてAIが対処

#### Features
- ✅ **静かな警告**: モーダルダイアログを廃止
  - ステータスバーで警告を表示
  - Output Channelに詳細をログ
  - ユーザーの作業を中断しない

- ✅ **構造化ログ**: AI対応可能な警告形式
  - JSON形式で警告内容を出力
  - 対処方法を明記
  - AIガイダンスを含む

- ✅ **チャット連携**: Copilot Chatで対処可能
  - Servantの出力を貼り付けるだけ
  - AIが警告を解析して対処提案
  - コマンドボタンで即座に実行

- ✅ **ServantWarningLogger**: 警告管理の統一API
  - Specチェック警告
  - コード品質警告
  - Git違反警告

#### Technical
- `ServantWarningLogger.ts`: 構造化ログシステム
- `ChatParticipant.ts`: 警告対応機能追加
- `AutopilotController.ts`: blockingCritical削除
### � Bug Fixes
- ✅ Specチェックプロンプトの連続表示を修正
  - 5分間のクールダウン機能を追加
  - 記録成功時にクールダウンをリセット
  - 繰り返し表示される問題を解消

### �🛡️ 失敗防止システム（Failure Prevention System）

**背景**: 2026-01-08の天体儀表示不具合（HTML内の関数重複）を二度と繰り返さないための根本的な対策

#### New Features
- ✅ **CodeQualityGuard**: リアルタイムコード品質検証
  - 関数の重複定義を検出（最優先）
  - HTML/テンプレート内のJavaScript重複検出
  - 変数スコープ問題の検出（const再代入など）
  - VS Code問題パネルに自動表示
  
- ✅ **保存時自動検証**: ファイル保存時に品質チェック実行
  - エラー/警告を即座に通知
  - ステータスバーに検出件数を表示
  
- ✅ **修正提案システム**: 検出した問題に対して具体的な修正案を提示
  - 「どの定義を削除すべきか」を明示
  - 「宣言タイプを変更すべき」などの提案

#### Technical
- `CodeQualityGuard.ts`: コア品質検証エンジン
- `FAILURE_PREVENTION_SYSTEM.md`: 設計ドキュメント
- extension.ts統合: 保存イベントフック

#### Future Plans
- Phase 2: 失敗パターンDBとの統合
- Phase 3: AI協調による予防システム
- Phase 4: プリコミットフック統合

## [0.3.23] - 2026-01-08

### 🐛 Bug Fixes
- ✅ 天体儀表示不具合を修正（HTML内の重複コード削除）
- ✅ `sun` 変数スコープの修正
- ✅ `animate` 関数の重複定義を削除

### 🔧 Improvements
- ✅ バージョン自動インクリメント機能追加（`npm run package:vsix`）
- ✅ VSIX作成フローの改善

## [0.3.22] - 2026-01-08

### ✨ 天体儀（Constellation）機能復元

プロジェクト構造を3D空間で可視化する天体儀の元の構想を実装しました。

#### Features
- ✅ 中心に太陽（プロジェクトゴール：生徒の学習効率化最大化）を配置
- ✅ 距離 = 重要度の逆数（中心に近いほど重要）
- ✅ 高さ（Y軸）= 更新日（新しいほど高い）
- ✅ エッジの太さ = 結合度（強い結合=太線、弱い結合=細線）
- ✅ 円筒座標系による均等配置
- ✅ 実データ連携（NeuralDependencyGraph → ConstellationDataGenerator）

#### Technical
- Three.js + OrbitControls
- 実プロジェクトデータを反映
- WebView - Extension 間のpostMessage通信

## [0.1.0] - 2025-12-31

### 🎉 Initial Release

世界初のInstructions違反リアルタイム検出VSCode拡張機能がリリースされました！

### ✨ Features

#### Phase 1: MVP (基本機能)
- ✅ `.instructions.md`ファイルのリアルタイム検証
- ✅ Problems パネルへの違反表示
- ✅ TypeScript, JavaScript, Markdown, JSON対応
- ✅ Position/Argument/Why/How階層の検証
- ✅ MUST/MUST NOT/SHOULD/SHOULD NOTルールのサポート
- ✅ 11/11テストパス

#### Phase 2: Decision Trees統合
- ✅ YAMLベースの決定木定義
- ✅ 複雑なルール判定の自動化
- ✅ 条件分岐による高度な検証
- ✅ 24/24テストパス（累計）

#### Phase 3: Quick Fix機能
- ✅ 💡 リアルタイムQuick Fix提供
- ✅ Position階層修正アクション
- ✅ バッチ方式3原則ガイダンス
- ✅ 仕様書参照コメント自動挿入
- ✅ 説明コメント自動挿入
- ✅ 6種類の修正アクション
- ✅ 46/46テストパス（累計）

#### Phase 4: Pre-Commit統合
- ✅ Git hooks自動インストール
- ✅ コミット前の自動検証
- ✅ 違反時のコミットブロック
- ✅ VSCode SCM API統合
- ✅ 既存hookのバックアップ機能
- ✅ Conventional Commits推奨
- ✅ 55/55テストパス（累計）

#### Phase 5: パフォーマンス最適化
- ✅ LRUメモリキャッシュ（最大100エントリ）
- ✅ ディスクキャッシュ（永続化）
- ✅ 増分検証（変更ファイルのみ）
- ✅ ハッシュベースの無効化
- ✅ **最大98.7%の速度向上**
- ✅ キャッシュヒット率表示
- ✅ 55/55テストパス（維持）

### 📦 Commands

- `Instructions Validator: Validate` - 手動検証を実行
- `Instructions Validator: Validate Before Commit` - コミット前検証を実行
- `Instructions Validator: Install Git Hooks` - Git hooksをインストール
- `Instructions Validator: Uninstall Git Hooks` - Git hooksをアンインストール

### ⚙️ Configuration

以下の設定オプションが追加されました：

- `instructionsValidator.enable` - 拡張機能の有効/無効
- `instructionsValidator.severity` - 違反の深刻度
- `instructionsValidator.preCommit.enabled` - pre-commit検証の有効化
- `instructionsValidator.preCommit.strictMode` - 厳格モード
- `instructionsValidator.preCommit.autoFix` - 自動修正
- `instructionsValidator.preCommit.ignorePatterns` - 無視パターン
- `instructionsValidator.commitMsg.enabled` - コミットメッセージ検証
- `instructionsValidator.performance.enableCache` - キャッシュ有効化
- `instructionsValidator.performance.cacheLocation` - キャッシュ場所
- `instructionsValidator.performance.maxCacheSize` - 最大キャッシュサイズ
- `instructionsValidator.performance.enableIncremental` - 増分検証
- `instructionsValidator.performance.largeFileThreshold` - 大ファイル閾値

### 📊 Performance

- **初回検証**: 10ファイル 472ms
- **2回目検証**: 10ファイル 6ms (98.7%改善)
- **部分変更**: 10ファイル中2変更 53ms (88.8%改善)

### 🐛 Known Issues

- Windows環境でのGit hooksはGit Bashが必要
- VSCode外からの`git commit`はVSCodeが起動している必要あり
- 大規模リポジトリ（1000+ファイル）では検証に時間がかかる可能性

### 🔜 Roadmap

#### Phase 6: Marketplace公開
- README.md作成
- アイコン作成
- スクリーンショット準備
- 公開手続き

#### 今後の改善
- Worker threadsによる並列処理
- RuleEngine最適化
- キャッシュ管理コマンド
- カスタムルールテンプレート
- マルチワークスペース対応

---

## Version History

- **0.1.0** (2025-12-31): Initial release with all Phase 1-5 features
