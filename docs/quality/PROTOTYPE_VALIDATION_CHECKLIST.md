# 🚀 実装着手 チェックリスト

**日付**: 2026年1月7日
**目標**: v0.3.21 確実表示確認 → Phase 1 準備
**責任者**: Development Team

---

## 📋 Phase 0: プロトタイプ検証（本日実施）

### 0-1 VSIX 0.3.21 インストール

- [ ] `extensions/servant/servant-0.3.21.vsix` が存在することを確認
  ```bash
  ls -lh extensions/servant/servant-0.3.21.vsix
  # 期待: 538.87 KB
  ```

- [ ] VS Code拡張機能パネルで VSIX をインストール
  ```
  拡張機能 → ⋮メニュー → 「VSIXからインストール...」
  → servant-0.3.21.vsix を選択
  ```

- [ ] VS Code をリロード（Cmd+Shift+P → Reload Window）

### 0-2 天体儀機能の起動確認

- [ ] コマンドパレット（Cmd+Shift+P）で「Servant: 天体儀を開く」を実行
  または statusbar の 🌟 ボタンをクリック

- [ ] WebView パネルが開くことを確認

- [ ] 初期メッセージを確認
  ```
  [Extension Host] Servant is now active
  [Extension Host] [ConstellationViewPanel] Constructor called
  [Extension Host] [ConstellationViewPanel] Calling _update()
  ```

### 0-3 データ生成・表示確認

- [ ] Output パネルで「Servant」チャンネルを確認
  ```
  [ConstellationViewPanel] Data generated: {nodeCount: 873, edgeCount: 708}
  [ConstellationViewPanel] HTML set successfully
  ```

- [ ] WebView内のデバッグパネル（🐛ボタン）を確認
  - "WebView bootstrap script initialized" ✅
  - "Waiting for data via postMessage..." ✅

- [ ] データ受信メッセージを確認
  ```
  [WebView INFO] Received data via postMessage: nodes=873 edges=708
  [WebView INFO] Calling init()
  ```

### 0-4 Three.js ロード確認

- [ ] デバッグパネルで Three.js ロード状態を確認
  ```
  ✓ Three.js loaded (XXXms)
  ✓ OrbitControls loaded (XXms)
  ✓ Scene created
  ✓ Camera created
  ✓ Renderer created
  ✓ init() completed successfully
  ```

### 0-5 天体儀の可視化確認

- [ ] WebView内に 873 個のノード（球体）が表示される
  - 色: 青系グラデーション
  - サイズ: 中程度

- [ ] 708 本のエッジ（線）が表示される
  - 色: 薄い白/水色
  - 太さ: 可視的に見える

- [ ] 軸（赤=X, 緑=Y, 青=Z）が表示される

- [ ] グリッドが表示される

### 0-6 インタラクション確認

- [ ] マウスドラッグでカメラ回転
  - スムーズに回転する
  - ポップイン（ちらつき）がない

- [ ] マウスホイールでズーム
  - スムーズにズームイン/アウト
  - 最小値・最大値が設定されている

- [ ] 右クリックドラッグでパン
  - カメラが平行移動する

### 0-7 パフォーマンス確認

- [ ] DevTools （Cmd+Shift+I） → Performance タブ
  ```
  [Method 1] フレームレート測定
  1. Recording開始
  2. カメラを移動（30秒）
  3. Recording停止
  4. FPS確認 → 期待値: 55-60fps
  ```

- [ ] メモリ使用量確認
  ```
  [Method 2] メモリ測定
  DevTools → Memory → Take heap snapshot
  → 期待値: 150-200MB
  ```

### 0-8 エラーログ確認

- [ ] DevTools → Console タブでエラーがないことを確認
  ```
  ❌ エラーが表示される場合：
  - "Uncaught SyntaxError" → postMessage受信失敗
  - "Cannot read property" → データフロー問題
  - "WebGL error" → 描画エラー
  
  ✅ 許容される警告：
  - Deprecation warnings (無視可)
  - "Unrecognized feature" (無視可)
  ```

### 0-9 デバッグログ確認

- [ ] WebView デバッグパネル内容
  ```
  期待される最終ログ：
  ✓ WebView bootstrap script initialized
  ✓ Waiting for data via postMessage...
  ✓ Three.js loaded (XXms)
  ✓ OrbitControls loaded (XXms)
  ✓ init() completed successfully
  ✓ Received data via postMessage: nodes=873 edges=708
  ✓ Loading data: 873 nodes, 708 edges
  ✓ Constellation initialized (success)
  ```

---

## 📊 検証結果テンプレート

```markdown
### v0.3.21 動作確認レポート

**日時**: YYYY-MM-DD HH:mm
**実施者**: [名前]
**環境**: 
  - VS Code: [version]
  - OS: macOS [version]
  - Node: [version]

#### 起動確認
- [x] VSIX インストール成功
- [x] 拡張機能有効化
- [x] 🌟 天体儀コマンド実行可能

#### 可視化確認
- [x] ノード表示: 873個確認
- [x] エッジ表示: 708本確認
- [x] 軸・グリッド: 表示確認
- [x] 初期カラーリング: 正常

#### インタラクション確認
- [x] 回転スムーズ
- [x] ズーム動作
- [x] パン動作
- [x] ラグ・ポップイン: なし

#### パフォーマンス
- [x] フレームレート: 58-60fps
- [x] メモリ（ピーク）: 178MB
- [x] CPU負荷: 中程度

#### エラー確認
- [x] DevTools Console: エラーなし
- [x] Output: 警告のみ
- [x] デバッグパネル: 完全初期化

#### 判定
**✅ PASS**: すべての検証項目をクリア

#### 次のステップ
- Phase 1 設計開始
- テスト環境構築
- パフォーマンスベースライン測定
```

---

## 🔧 トラブルシューティング

### 症状: 天体儀が表示されない

**確認項目**:
1. Output パネルで "Data generated" メッセージを確認
   ```
   [ConstellationViewPanel] Data generated: {nodeCount: 873, edgeCount: 708}
   ```
   - ない場合: データ生成エラー

2. WebView デバッグパネルで "Received data" を確認
   ```
   [WebView INFO] Received data via postMessage
   ```
   - ない場合: postMessage通信失敗

3. DevTools Console でエラーを確認
   ```
   Uncaught SyntaxError: ...
   → JSON パース失敗
   
   Cannot read property 'nodes'
   → データ構造エラー
   ```

**対処方法**:
```bash
# キャッシュクリア + 再起動
rm -rf ~/.vscode/extensions/nanashi8.servant-0.3.21/
# 拡張機能を再インストール
```

### 症状: フレームレートが低い（30fps以下）

**確認項目**:
1. DevTools Performance タブで重い処理を特定
2. ノード数を確認: 873は標準
3. GPUメモリ使用量を確認

**対処方法**:
```javascript
// DevTools Console で実行
window.__CONSTELLATION_DATA.nodes.length  // ノード数確認
renderer.info.render.calls                 // Draw calls確認
```

---

## 📝 Phase 1 準備チェックリスト

検証完了後、以下を実施：

### 開発環境準備
- [ ] テスト用の大規模データセット生成スクリプト作成
  ```bash
  scripts/generate-large-graphs.mjs
  # 出力: nodes=5000, 10000, 20000のテストデータ
  ```

- [ ] パフォーマンス測定スクリプト作成
  ```bash
  scripts/benchmark.mjs
  # 測定項目: FPS, Memory, GPU, Draw calls
  ```

- [ ] Jest テストフレームワークセットアップ確認
  ```bash
  npm test -- --passWithNoTests
  ```

### ドキュメント準備
- [ ] PHASE1_DETAILED_DESIGN.md を精読
- [ ] テスト計画書を確認
- [ ] コード設計ドキュメント作成

### コード準備
- [ ] ConstellationViewPanel.ts のコード構造を把握
  - Module script の位置（行番号: ~1000-1500）
  - animate() ループの位置
  - Node 初期化ロジック

- [ ] 既存テストの実行
  ```bash
  npm test
  # すべてパス
  ```

---

## 📅 スケジュール

| 日付 | 内容 | 責任者 |
|------|------|--------|
| **1月7日（本日）** | v0.3.21 検証 | Team |
| **1月8-10日** | Phase 1 設計レビュー | Lead |
| **1月11-13日** | テスト環境構築 | QA |
| **1月14-17日** | Phase 1 実装 | Dev |
| **1月18日** | v0.3.22 リリース | Release |

---

## ✅ 最終チェック

すべてのチェック項目が完了したら、以下をコミット：

```bash
git add docs/CONSTELLATION_ENHANCEMENT_ROADMAP.md
git add docs/PHASE1_DETAILED_DESIGN.md
git commit -m "feat(constellation): Add enhancement roadmap and Phase 1 detailed design (v0.3.21)"
git push origin main
```

**コミットメッセージ例**:
```
feat(constellation): Finalize v0.3.21 prototype and Phase 1-3 implementation plan

- v0.3.21: Stable postMessage-based data transfer
- Phase 1: LOD + Frustum Culling (20K nodes target)
- Phase 2: Paging + Web Worker (100K nodes target)  
- Phase 3: Compression + IndexedDB (1M+ nodes ready)

Total roadmap: 30-40 engineering days
Ready for incremental feature expansion.
```

---

**作成日**: 2026年1月7日
**ステータス**: 🟢 準備完了 → 検証実施待ち
