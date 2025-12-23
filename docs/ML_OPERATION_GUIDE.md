# ML機能 運用ガイド

**最終更新**: 2025年12月23日  
**対象バージョン**: Week 5実装完了版

---

## 🎯 概要

このガイドは、個人適応型ML（機械学習）機能の運用方法を説明します。ML機能は、ユーザーの学習パターンに適応し、個別最適化された出題順序を実現します。

### ML機能の役割
- **個人適応**: 回答パターンからユーザーの特性を学習
- **オンライン学習**: 回答するたびにモデルが更新される
- **ハイブリッドAI**: ルールベース + ML の組み合わせ

---

## 🚀 ML機能の有効化

### 1. 設定画面を開く
暗記タブの右上「⚙️設定」ボタンをクリック

### 2. ML機能をON
「🤖 機械学習（ML）」セクションで「OFF」ボタンをクリック→「ON」に変更

### 3. ページをリロード
設定を反映するため、ブラウザをリロード（F5キーまたは⌘+R）

### 4. 確認
- 開発環境（localhost）では、コンソールに「✅ [AICoordinator] ML enabled by user setting」と表示される
- 回答後に「[ML] learn() called」ログが表示される

---

## 📊 AB測定との併用

ML機能は、既存のA/B/Cテストと並行して動作します。

### variant割り当て
- ML ONでも、variant（A/B/C）は自動割り当てされる
- 各variantでMLの効果を測定可能

### 推奨測定プラン
1. **ベースライン**: variant=A で30セッション実行（ML OFF）
2. **ハイブリッド**: variant=B で30セッション実行（ML ON）
3. **本流化**: variant=C で30セッション実行（ML ON）
4. **比較**: デバッグパネルでA/B/C+ML統計を確認

---

## 🔍 動作確認

### 開発環境での確認
開発環境（`npm run dev`）では、以下のログで動作確認できます：

```
✅ [AICoordinator] ML enabled by user setting
✅ [Memory AI] ML model loaded from cache
✅ [CognitiveLoad AI] ML model loaded from cache
...
[ML] learn() called { word: "example", isCorrect: true, features: [...] }
```

### ML統計の確認
1. デバッグパネル（画面下部のボタン）を開く
2. 「🧪 A/Bテスト集計」セクションを確認
3. 「🤖 ML統計」セクションでML ONセッション数を確認

### 性能確認
- 推論時間が50ms超えの場合、コンソールに警告表示
- メモリ使用量が100MB超えの場合も警告表示

---

## ⚠️ トラブルシューティング

### ML機能が有効にならない

**症状**: ML ONにしてもlearn()が呼ばれない

**原因と対策**:
1. **AI統合がOFF**
   - localStorageで`enable-ai-coordination`が`false`
   - → 開発環境では自動でONになるはず
   
2. **AICoordinatorが初期化されていない**
   - `scheduler.aiCoordinator`が`null`
   - → ページリロードで解決

3. **mlEnabledフラグが保存されていない**
   - localStorageで`ab_ml_enabled`を確認
   - → ブラウザのプライベートモードを解除

### 推論時間が遅い

**症状**: 50ms超えの警告が頻繁に出る

**原因と対策**:
1. **初回ロードが遅い**
   - モデルの初回ロード時は遅い（正常）
   - 2回目以降はキャッシュから高速ロード
   
2. **メモリ不足**
   - 他のタブを閉じてメモリ解放
   - ブラウザを再起動

3. **デバイス性能**
   - CPU/GPUの性能に依存
   - 軽量デバイスでは遅くなる可能性あり

### メモリ使用量が多い

**症状**: 100MB超えの警告が出る

**原因と対策**:
1. **複数モデルの同時ロード**
   - 7つの専門AIが同時にモデルをロード
   - → 正常動作（合計で50-80MB程度が目安）

2. **キャッシュのクリア**
   - コンソールで`MLEnhancedSpecialistAI.clearModelCache()`実行
   - → メモリ解放

3. **長時間使用**
   - 長時間使用でメモリリークの可能性
   - → ページリロードで解決

---

## 🛠️ 高度な設定

### localStorageの直接操作

**ML機能の手動設定**:
```javascript
// ML ONに設定
localStorage.setItem('ab_ml_enabled', 'true');

// ML OFFに設定
localStorage.setItem('ab_ml_enabled', 'false');

// 設定確認
console.log(localStorage.getItem('ab_ml_enabled'));
```

**AI統合の手動設定**:
```javascript
// AI統合をON
localStorage.setItem('enable-ai-coordination', 'true');

// AI統合をOFF
localStorage.setItem('enable-ai-coordination', 'false');
```

### モデルキャッシュのクリア

開発環境でモデルを再ロードしたい場合：

```javascript
// ブラウザコンソールで実行可能にするため、一時的にグローバルに公開
// (開発環境のみ推奨)
window.clearMLCache = () => {
  // localStorageから重みをクリア
  const keys = Object.keys(localStorage).filter(k => k.startsWith('ml_weights_'));
  keys.forEach(k => localStorage.removeItem(k));
  console.log('ML weights cleared from localStorage');
  
  // ページリロード（モデルキャッシュはリロードでクリアされる）
  location.reload();
};

// 実行
window.clearMLCache();
```

**注意**: モデルキャッシュ（メモリ上）はページリロードで自動的にクリアされます。

### メモリ使用量の確認

開発環境で確認する場合：

```javascript
// TensorFlow.jsのメモリ情報を取得
const memInfo = tf.memory();
console.log('Memory usage:', {
  numBytes: (memInfo.numBytes / (1024 * 1024)).toFixed(2) + 'MB',
  numTensors: memInfo.numTensors,
  numDataBuffers: memInfo.numDataBuffers
});
```

**注意**: `tf`オブジェクトは通常グローバルに公開されていません。開発者ツールのコンソールでは直接アクセスできない場合があります。

---

## 📈 効果測定

### 主KPI: 取得語数/セッション
- セッション開始時: 未定着（Position 20-100）
- セッション終了時: 定着済み（Position 0-19）
- **取得語数** = 定着済みに遷移した単語数

### 補助KPI
- **取得率**: 取得語数 / ユニーク語数
- **振動スコア**: Position変動の激しさ（≤30が目標、>50で悪化）
- **所要時間**: セッション完了までの時間

### 判定基準（暫定）
- ✅ **合格**: ML ONが ML OFFに対して取得語数 +10% かつ振動スコア悪化なし
- ⏳ **継続測定**: 改善が見られるが統計的有意性が不十分
- ❌ **不合格**: 改善なし or 振動スコア >50

---

## 🔄 切戻し条件

以下の条件でML機能を無効化することを推奨：

### 1. 性能劣化
- 推論時間が常に100ms超え
- メモリ使用量が200MB超え
- ブラウザが頻繁にクラッシュ

### 2. 品質劣化
- 振動スコアが連続3セッションで50超え
- 取得語数が明らかに減少（-20%以上）
- ユーザー体験が悪化（出題が不自然）

### 3. 互換性問題
- 特定ブラウザで動作しない
- モバイル環境で正常動作しない

### 切戻し手順
1. 設定画面でML機能をOFF
2. ページリロード
3. variant=A（Position中心）で継続

---

## 📝 データ収集のベストプラクティス

### 推奨セッション数
- **最小**: 10セッション（傾向把握）
- **推奨**: 30セッション（統計的有意性確保）
- **理想**: 50セッション（詳細分析可能）

### データエクスポート
1. デバッグパネルを開く
2. 「💾 JSONエクスポート」ボタンをクリック
3. ファイルをダウンロード（`ab-session-logs-{timestamp}.json`）

### データ分析
エクスポートしたJSONファイルを使って：
- 取得語数の分散分析
- 振動スコアの時系列分析
- variant間のt検定

---

## 🎓 FAQ

### Q1: ML機能は必須ですか？
**A**: いいえ。ML機能はオプションです。ML OFFでも学習は可能です。

### Q2: ML ONにすると学習効率が必ず上がりますか？
**A**: 保証はありません。個人差やデータ量に依存します。30セッション程度の実測が推奨です。

### Q3: モバイルでも使えますか？
**A**: ブラウザがTensorFlow.jsに対応していれば使用可能です。ただし、性能は限定的です。

### Q4: データはどこに保存されますか？
**A**: localStorageに保存されます。サーバーには送信されません（プライバシー保護）。

### Q5: 複数デバイスで同期できますか？
**A**: 現状は非対応です。各デバイスで独立してモデルが学習されます。

---

## 📞 サポート

問題が発生した場合：
1. コンソールログを確認（F12キー）
2. localStorageをクリア（ブラウザ設定）
3. ページをハードリロード（Ctrl+Shift+R）
4. 問題が解決しない場合はIssueを作成

---

## 🔄 更新履歴

- **2025-12-23**: 初版作成（Week 5実装完了時点）
  - ML機能の有効化手順
  - トラブルシューティング
  - 効果測定と切戻し条件
