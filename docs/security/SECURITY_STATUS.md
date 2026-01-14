# セキュリティ状況レポート

最終更新: 2026年1月14日

## 概要

このドキュメントは、nanashi8.github.ioプロジェクトの既知のセキュリティアラートとその対応状況を記録しています。

## 対応済み

### CodeQL アラート

#### 1. Insecure randomness (2箇所) - 修正完了 ✅

- **ファイル**: `src/metrics/ab/identity.ts`, `src/components/MemorizationView.tsx`
- **問題**: `Math.random()`使用によるセキュリティリスク
- **対応**: `crypto.randomUUID()`に変更（Web Crypto API標準）
- **コミット**: 3cb3e13, 前回セッション

#### 2. Bad tag filter (1箇所) - 修正完了 ✅

- **ファイル**: `extensions/servant/src/learning/CodeQualityGuard.ts:193`
- **問題**: HTML scriptタグの正規表現パターンが脆弱
- **対応**: より厳格な正規表現パターンに変更、型チェック追加
- **コミット**: a1bb06d
- **CodeQL Alert**: #265

#### 3. es-module-shims 更新 - 完了 ✅

- **バージョン**: 1.10.1 → 2.8.0
- **対応**: 15件のCodeQLアラートを解消する可能性
- **コミット**: 6921089

#### 4. Clear-text storage (2箇所) - 文書化完了 ✅

- **ファイル**: `src/features/speech/japaneseSpeech.ts:240`, `src/components/SettingsView.tsx:81`
- **問題**: CodeQLが音声設定のlocalStorage保存を機密情報として誤検知
- **対応**: 説明コメントを追加（音声性別・速度・名前はUI設定であり機密情報ではない）
- **コミット**: 6bc7017
- **CodeQL Alert**: #230, #14

## 未対応（対応困難）

### 外部ライブラリの脆弱性

これらの脆弱性は外部ライブラリに起因し、直接修正が困難です。

#### Dependabot アラート (高深刻度: 6件)

##### 1. node-fetch < 2.6.7 (HIGH)

- **概要**: セキュアなヘッダーが信頼されていないサイトに転送される
- **影響範囲**: `@tensorflow/tfjs-vis@1.5.1` → `glamor` → `fbjs` → `isomorphic-fetch`
- **修正版**: 2.6.7
- **対応状況**: `@tensorflow/tfjs-vis@1.5.1`が最新版だが、古い依存関係を使用
- **破壊的変更**: `@tensorflow/tfjs-vis@1.1.0`へのダウングレードが必要
- **リスク評価**: 開発時のみ使用（可視化ライブラリ）、本番環境への影響は限定的

##### 2. d3-color < 3.1.0 (HIGH)

- **概要**: ReDoS（正規表現サービス拒否）脆弱性
- **影響範囲**: `@tensorflow/tfjs-vis` → `vega` → `vega-functions`/`vega-geo`
- **修正版**: 3.1.0
- **対応状況**: `@tensorflow/tfjs-vis`の依存関係更新待ち
- **リスク評価**: 開発時のみ使用、悪用には特定の入力が必要

##### 3. vega-expression < 5.2.1 (HIGH)

- **概要**: `VEGA_DEBUG`グローバル変数使用時のXSS
- **影響範囲**: `@tensorflow/tfjs-vis` → `vega`/`vega-lite`
- **修正版**: 5.2.1
- **対応状況**: `@tensorflow/tfjs-vis`の依存関係更新待ち
- **リスク評価**: `VEGA_DEBUG`を使用していない環境では影響なし

##### 4. vega < 6.2.0 (HIGH)

- **概要**: `VEGA_DEBUG`グローバル変数使用時のXSS
- **影響範囲**: `@tensorflow/tfjs-vis`
- **修正版**: 6.2.0
- **対応状況**: `@tensorflow/tfjs-vis`の依存関係更新待ち
- **リスク評価**: `VEGA_DEBUG`を使用していない環境では影響なし

##### 5. vega-functions <= 6.1.0 (HIGH)

- **概要**: `setdata`関数経由のXSS
- **影響範囲**: `@tensorflow/tfjs-vis` → `vega`
- **修正版**: 6.1.1
- **対応状況**: `@tensorflow/tfjs-vis`の依存関係更新待ち
- **リスク評価**: 開発時のみ使用、限定的な影響

##### 6. qs < 6.14.1 (HIGH) - 修正済み ✅

- **概要**: ブラケット記法のarrayLimit回避によるDoS
- **影響範囲**: 間接依存
- **修正版**: 6.14.1
- **対応状況**: npm audit fixで自動解決

#### その他の脆弱性

##### esbuild <= 0.24.2 (MODERATE)

- **概要**: 開発サーバーへのリクエスト転送
- **影響範囲**: `vite`の依存関係
- **対応状況**: 開発時のみの影響、本番ビルドには無関係
- **リスク評価**: 低（開発環境のみ）

##### tmp <= 0.2.3 (LOW)

- **概要**: シンボリックリンク経由の任意ファイル書き込み
- **影響範囲**: `@lhci/cli` → `inquirer` → `external-editor`
- **対応状況**: Lighthouse CIツールの依存関係、実行時の影響は限定的

#### vendor/three.js の insecure-randomness

- **ファイル**: `public/vendor/three/three.module.js`
- **問題**: `Math.random()`使用
- **対応状況**: 外部ライブラリ、直接修正不可
- **リスク評価**: 3Dグラフィックスライブラリでの使用、セキュリティ影響は限定的

## 推奨事項

### 短期（即時対応可能）

- ✅ CodeQL Insecure randomness修正完了
- ✅ CodeQL Bad tag filter修正完了
- ✅ es-module-shims更新完了

### 中期（要検討）

1. `@tensorflow/tfjs-vis`の代替ライブラリ検討
   - Chart.js、D3.js、Plotly.js等への移行
   - メリット: 最新の依存関係、活発なメンテナンス
   - デメリット: 実装コストが高い

2. vendorライブラリのアップデート監視
   - three.jsの定期的な更新チェック

### 長期（監視継続）

1. Dependabotアラートの定期確認
2. CodeQLスキャン結果の監視
3. 依存関係の定期的な棚卸し

## リスク評価サマリー

| カテゴリ            | 件数 | 深刻度       | 対応状況    | 実影響 |
| ------------------- | ---- | ------------ | ----------- | ------ |
| CodeQL (修正済み)   | 3    | HIGH         | ✅ 完了     | なし   |
| Dependabot (外部)   | 6    | HIGH         | 🔄 上流待ち | 限定的 |
| Dependabot (その他) | 2    | MODERATE/LOW | 🔄 監視中   | 低い   |

### 総合評価

- **本番環境への直接的な影響**: 低
- **開発環境での影響**: 中（開発時のみ）
- **対応の緊急度**: 低〜中（上流パッケージの更新待ち）

## 次回レビュー

- 2026年2月（1ヶ月後）
- `@tensorflow/tfjs-vis`の更新チェック
- 新規CodeQLアラートの確認
