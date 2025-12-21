# プロジェクトクリーンアップ計画 2025-12-17

## 📋 概要

プロジェクトのフォルダ構成見直し、不要ファイルの削除、ドキュメント整理を段階的に実施する計画。
**既存実装への影響ゼロ**を最優先とし、各工程で検証を実施。

---

## 🎯 実施方針

1. **安全第一**: 各工程で動作確認・テスト実行
2. **段階的実施**: 小さな変更を積み重ねる
3. **履歴保持**: `git mv` を使用してファイル履歴を保持
4. **ロールバック可能**: 各フェーズでコミットを作成
5. **参照更新**: 移動・削除時は全参照箇所を更新

---

## 📊 現状分析

### 削除対象候補

#### 1. 完全に不要なもの（影響なし）
- `nanashi8.github-io/` フォルダ（1ファイルのみ、使用されていない）
- `README_QUALITY_PIPELINE.md` ルート直下（docs/に統合可能）

#### 2. 統合・整理が必要なもの
- docs直下の実装サマリーファイル（アーカイブ化検討）
- issues/の古いissueファイル（クローズ済み課題）

#### 3. 慎重な判断が必要なもの
- src直下のre-exportファイル（既存コードが依存）
- scriptsの一部（使用頻度低いが将来必要な可能性）

---

## 🗓️ 詳細工程計画

### **Phase 1: 準備・検証環境構築** (所要時間: 1-2時間)

#### 工程 1.1: 現状バックアップとブランチ作成
- **作業内容**:
  - 専用ブランチ `cleanup/2025-12-17` を作成
  - 現在のテストスイートを実行し、全てパスすることを確認
  - 依存関係マップを作成（後続工程で参照）
- **検証方法**:
  ```bash
  npm run test:all:full
  npm run build
  git checkout -b cleanup/2025-12-17
  ```
- **成果物**: ベースライン記録、依存関係マップ
- **リスク**: なし

#### 工程 1.2: 依存関係の完全な洗い出し
- **作業内容**:
  - 全importステートメントを抽出
  - re-exportファイルの使用箇所を特定
  - ドキュメント間の参照リンクを洗い出し
- **検証方法**:
  ```bash
  grep -r "from '\\.\\./forgettingAlert'" src/
  grep -r "from '\\.\\./timeBasedGreeting'" src/
  grep -r "from '\\.\\./goalSimulator'" src/
  ```
- **成果物**: 依存関係レポート
- **リスク**: 低

---

### **Phase 2: 低リスククリーンアップ** (所要時間: 2-3時間)

#### 工程 2.1: 空フォルダの削除
- **作業内容**:
  - `nanashi8.github-io/` フォルダを削除
  - 関連する参照がないことを確認
- **影響範囲**: なし（1ファイルのみ、未使用）
- **検証方法**:
  ```bash
  grep -r "nanashi8.github-io" .
  git rm -r nanashi8.github-io/
  npm run test:all:full
  ```
- **ロールバック**: `git reset --hard HEAD`
- **リスク**: 極低

#### 工程 2.2: ルート直下ドキュメントの整理
- **作業内容**:
  - `README_QUALITY_PIPELINE.md` を `docs/quality/` に移動
  - または `docs/archive/` に移動（既に統合済みの場合）
  - README.mdからの参照を更新
- **影響範囲**: ドキュメントのみ
- **検証方法**:
  ```bash
  git mv README_QUALITY_PIPELINE.md docs/quality/QUALITY_PIPELINE_LEGACY.md
  grep -r "README_QUALITY_PIPELINE" .
  # 参照箇所を更新
  ```
- **ロールバック**: `git reset --hard HEAD`
- **リスク**: 極低

#### 工程 2.3: issuesフォルダの整理
- **作業内容**:
  - クローズ済み・古いissueを `issues/archive/` に移動
  - 現在アクティブなissueのみルートに残す
- **対象ファイル**:
  - `1.md` → archive（古い）
  - `113.md` → 内容確認後判断
  - `2025-12-03-04-43-28.md` → archive（日付古い）
- **影響範囲**: issueトラッキングのみ
- **検証方法**: ファイル内容確認、手動レビュー
- **ロールバック**: `git reset --hard HEAD`
- **リスク**: 極低

#### 工程 2.4: Phase 2の統合テスト
- **作業内容**:
  - 全テストスイートを実行
  - ビルドが成功することを確認
  - ドキュメントリンクの検証
- **検証方法**:
  ```bash
  npm run test:all:full
  npm run build
  npm run lint
  ```
- **成果物**: Phase 2完了レポート
- **コミット**: `chore: Phase 2 cleanup - remove unused files and reorganize docs`

---

### **Phase 3: ドキュメント統合・整理** (所要時間: 3-4時間)

#### 工程 3.1: 重複ドキュメントの特定
- **作業内容**:
  - docs直下の実装サマリーを分析
  - 統合可能なドキュメントをリストアップ
- **対象ファイル**（例）:
  - `IMPLEMENTATION_SUMMARY.md`
  - `PHASE2_IMPLEMENTATION_SUMMARY.md`
  - `PHASE3_IMPLEMENTATION_SUMMARY.md`
  - `ADAPTIVE_NETWORK_IMPLEMENTATION_SUMMARY.md`
  - `ADAPTIVE_NETWORK_INTEGRATION_COMPLETE.md`
  - `LEARNING_AI_COMPLETION_REPORT.md`
- **影響範囲**: ドキュメントのみ
- **検証方法**: 内容レビュー、重複度チェック
- **リスク**: 低

#### 工程 3.2: 実装サマリーの統合
- **作業内容**:
  - 類似内容のサマリーを統合
  - 最新情報を統合版に集約
  - 古いバージョンは `docs/archive/summaries/` に移動
- **統合案**:
  - 新ファイル: `docs/reports/COMPLETE_IMPLEMENTATION_HISTORY.md`
    - Phase 1-3の全実装サマリーを統合
    - 時系列でセクション分け
  - 個別ファイルは archive に移動
- **影響範囲**: ドキュメントのみ
- **検証方法**:
  ```bash
  grep -r "PHASE2_IMPLEMENTATION_SUMMARY" docs/
  grep -r "PHASE3_IMPLEMENTATION_SUMMARY" docs/
  # 参照箇所を新ファイルに更新
  ```
- **ロールバック**: `git reset --hard HEAD`
- **リスク**: 低

#### 工程 3.3: AI関連ドキュメントの整理
- **作業内容**:
  - AI機能関連ドキュメントを精査
  - `LEARNING_AI_*.md` を1つに統合（可能なら）
  - `META_AI_INTEGRATION_GUIDE.md` の現状確認
- **統合案**:
  - 新ファイル: `docs/design/ADAPTIVE_LEARNING_COMPLETE_DESIGN.md`
    - 全AI学習機能の設計を統合
  - または既存の `adaptive-learning-api.md` を拡張
- **影響範囲**: ドキュメントのみ
- **検証方法**: 内容レビュー
- **リスク**: 低

#### 工程 3.4: docs/README.mdの更新
- **作業内容**:
  - ドキュメント目次を最新状態に更新
  - 統合・移動したファイルのリンクを修正
  - カテゴリ分類を見直し
- **影響範囲**: ドキュメントナビゲーション
- **検証方法**: リンク切れチェック、手動確認
- **リスク**: 低

#### 工程 3.5: Phase 3の統合テスト
- **作業内容**:
  - ドキュメントリンクの完全性チェック
  - 参照整合性の確認
- **検証方法**:
  ```bash
  npm run lint:md
  # カスタムリンクチェックスクリプト実行
  ```
- **成果物**: Phase 3完了レポート
- **コミット**: `docs: consolidate and reorganize implementation documentation`

---

### **Phase 4: scriptsフォルダの整理** (所要時間: 2-3時間)

#### 工程 4.1: スクリプト使用状況の調査
- **作業内容**:
  - package.jsonから参照されているスクリプトを特定
  - CI/CDで使用されているスクリプトを特定
  - 最終実行日時を確認（可能なら）
- **調査対象**:
  - scripts/ 配下の全ファイル（50+ファイル）
- **影響範囲**: なし（調査のみ）
- **検証方法**:
  ```bash
  grep -r "scripts/" package.json
  grep -r "scripts/" .github/workflows/
  ```
- **成果物**: スクリプト使用状況レポート
- **リスク**: なし

#### 工程 4.2: 未使用スクリプトのアーカイブ化
- **作業内容**:
  - 6ヶ月以上使用されていないスクリプトを特定
  - `scripts/archive/` に移動（削除はしない）
  - READMEにアーカイブ理由を記載
- **候補例**:
  - 一時的な修正スクリプト（fix-*）
  - 古い移行スクリプト
  - 実験的スクリプト
- **影響範囲**: 開発ワークフローのみ
- **検証方法**: スクリプト実行確認（必要なもののみ）
- **ロールバック**: `git reset --hard HEAD`
- **リスク**: 低

#### 工程 4.3: スクリプトのカテゴリ分け
- **作業内容**:
  - scripts/ 内にサブフォルダを作成
    - `scripts/validation/` - 検証スクリプト
    - `scripts/maintenance/` - メンテナンススクリプト
    - `scripts/data/` - データ処理スクリプト
    - `scripts/tools/` - 開発ツール
  - 各スクリプトを適切なフォルダに移動
  - package.jsonのパスを更新
- **影響範囲**: package.json、CI/CD設定
- **検証方法**:
  ```bash
  npm run validate
  npm run test:python
  ```
- **ロールバック**: `git reset --hard HEAD`
- **リスク**: 中

#### 工程 4.4: scripts/README.mdの作成
- **作業内容**:
  - スクリプト一覧と用途を記載
  - カテゴリ別にドキュメント化
  - 使用例を追加
- **影響範囲**: ドキュメントのみ
- **検証方法**: 手動レビュー
- **リスク**: なし

#### 工程 4.5: Phase 4の統合テスト
- **作業内容**:
  - 全スクリプトが正しいパスで実行できることを確認
  - CI/CDパイプラインが正常に動作することを確認
- **検証方法**:
  ```bash
  npm run test:all:full
  npm run validate:grammar
  # GitHub Actions での動作確認
  ```
- **成果物**: Phase 4完了レポート
- **コミット**: `refactor(scripts): reorganize and categorize maintenance scripts`

---

### **Phase 5: src/配下の慎重な整理** (所要時間: 4-5時間)

⚠️ **最もリスクが高いフェーズ - 慎重に実施**

#### 工程 5.1: re-exportファイルの依存関係完全調査
- **作業内容**:
  - src直下のre-exportファイルの全使用箇所を特定
  - 各ファイルのインポート元を追跡
- **対象ファイル**:
  - `forgettingAlert.ts`
  - `timeBasedGreeting.ts`
  - `goalSimulator.ts`
  - その他のre-exportファイル
- **影響範囲**: なし（調査のみ）
- **検証方法**:
  ```bash
  # 各ファイルの使用箇所を洗い出し
  grep -r "from.*forgettingAlert" src/ tests/
  grep -r "from.*timeBasedGreeting" src/ tests/
  grep -r "from.*goalSimulator" src/ tests/
  ```
- **成果物**: 完全な依存関係マップ
- **リスク**: なし

#### 工程 5.2: インポートパスの段階的更新（オプション）
- **作業内容**:
  - re-exportファイルを経由しているインポートを直接インポートに変更
  - 1ファイルずつ段階的に実施
  - 各変更後にテストを実行
- **実施判断**: 
  - 依存が少ない場合のみ実施（5-10箇所以内）
  - 依存が多い場合は**実施しない**（リスク大）
- **例**:
  ```typescript
  // Before
  import { generateTimeBasedGreeting } from '../timeBasedGreeting';
  
  // After
  import { generateTimeBasedGreeting } from '../features/interaction/timeBasedGreeting';
  ```
- **影響範囲**: インポートパスのみ
- **検証方法**:
  ```bash
  # 各ファイル変更後
  npm run typecheck
  npm run test:unit
  ```
- **ロールバック**: 各ステップでコミット、必要時にrevert
- **リスク**: 中〜高

#### 工程 5.3: re-exportファイルの削除（オプション）
- **作業内容**:
  - 工程5.2で全インポートを更新した場合のみ実施
  - 使用されなくなったre-exportファイルを削除
- **実施条件**: 工程5.2が完全に成功した場合のみ
- **影響範囲**: ソースコード構造
- **検証方法**:
  ```bash
  npm run test:all:full
  npm run build
  npm run typecheck
  ```
- **ロールバック**: `git reset --hard HEAD`
- **リスク**: 高

#### 工程 5.4: Phase 5の代替案（推奨）
- **推奨アプローチ**: **re-exportファイルはそのまま残す**
  - 理由:
    1. 既存コードへの影響が大きい
    2. 下位互換性を維持
    3. リファクタリングのリスクが高い
    4. 機能的な問題がない
  - アクション:
    - ドキュメントに「レガシーre-export」として記録
    - 新規コードでは直接インポートを推奨
    - 段階的に自然消滅させる
- **影響範囲**: なし
- **リスク**: なし

#### 工程 5.5: Phase 5の完了判定
- **判断基準**:
  - Option A: 工程5.2-5.3を実施し、全テストパス → Phase 5完了
  - Option B: リスク判断により実施見送り → Phase 5スキップ（推奨）
- **成果物**: Phase 5実施レポートまたはスキップ理由書
- **コミット**: 実施した場合のみ `refactor(src): remove legacy re-export files`

---

## 📈 予想される成果

### 削減見込み
- **ファイル数**: 15-25個削除または統合
- **ドキュメント**: 10-15個統合
- **フォルダ**: 1個削除

### 品質向上
- ドキュメント構造の明確化
- 重複情報の削減
- メンテナンス性の向上

---

## ⏱️ 総所要時間見積もり

| Phase | 所要時間 | 累積時間 |
|-------|---------|---------|
| Phase 1: 準備・検証環境構築 | 1-2時間 | 1-2時間 |
| Phase 2: 低リスククリーンアップ | 2-3時間 | 3-5時間 |
| Phase 3: ドキュメント統合・整理 | 3-4時間 | 6-9時間 |
| Phase 4: scriptsフォルダの整理 | 2-3時間 | 8-12時間 |
| Phase 5: src/配下の整理（オプション） | 4-5時間 or スキップ | 12-17時間 or 8-12時間 |
| **合計** | **12-17時間** | **（Phase 5スキップ時: 8-12時間）** |

---

## 🚨 リスク管理

### 高リスク領域
1. **src/配下のre-exportファイル削除**
   - 対策: Phase 5は慎重に、または実施見送り
   - ロールバックプラン: 各ステップでコミット

2. **scriptsフォルダの再編成**
   - 対策: package.jsonとCI/CDの参照を完全に更新
   - 検証: 全自動化パイプラインの実行確認

### 低リスク領域
- 空フォルダ削除
- ドキュメント整理・統合
- issuesフォルダ整理

---

## ✅ 各フェーズの完了条件

### Phase 1
- [ ] 専用ブランチ作成完了
- [ ] 全テストがパス
- [ ] 依存関係マップ作成完了

### Phase 2
- [ ] 不要ファイル削除完了
- [ ] ルート直下ドキュメント整理完了
- [ ] 全テストがパス
- [ ] コミット作成完了

### Phase 3
- [ ] ドキュメント統合完了
- [ ] docs/README.md更新完了
- [ ] リンク切れゼロ
- [ ] コミット作成完了

### Phase 4
- [ ] スクリプトのカテゴリ分け完了
- [ ] package.json更新完了
- [ ] 全自動化パイプライン動作確認
- [ ] コミット作成完了

### Phase 5（オプション）
- [ ] 実施判断完了
- [ ] 実施する場合: 全インポート更新完了
- [ ] 全テストがパス
- [ ] コミット作成完了

---

## 📝 実施後の報告

各フェーズ完了後、以下を記録:
1. 実施した作業内容
2. 削除・移動したファイルリスト
3. 更新した参照箇所
4. テスト結果
5. 発生した問題と解決方法

最終レポート: `docs/reports/CLEANUP_COMPLETE_2025-12-17.md`

---

## 🎯 推奨実施順序

**最小リスクアプローチ（推奨）**:
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5スキップ
総所要時間: 8-12時間
```

**完全クリーンアップアプローチ**:
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
総所要時間: 12-17時間
リスク: 中〜高
```

**段階的アプローチ（最も安全）**:
```
Week 1: Phase 1-2
Week 2: Phase 3
Week 3: Phase 4
Phase 5: 将来の検討事項として保留
```

---

## 📚 参考資料

- [ドキュメント整理レポート 2025-12-15](../processes/DOCS_REORGANIZATION_2025-12-15.md)
- [ルートファイル整理レポート 2025-12-15](../processes/ROOT_FILES_CLEANUP_2025-12-15.md)
- [リファクタリング安全ガイド](../processes/REFACTORING_SAFETY.md)
- [プロジェクト構造検証](../design/PROJECT_STRUCTURE_VALIDATION.md)

---

**作成日**: 2025年12月17日  
**作成者**: AI Assistant  
**バージョン**: 1.0
