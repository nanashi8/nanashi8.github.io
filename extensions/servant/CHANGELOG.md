# Change Log

All notable changes to the "Instructions Validator" extension will be documented in this file.

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
