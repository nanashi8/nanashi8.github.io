---
title: ライト/ダークモード開発ガイド
created: 2025-12-04
updated: 2025-12-15
status: in-progress
tags: [design, ai, dark-mode]
---

# ライト/ダークモード開発ガイド

## 概要

このプロジェクトは、ライトモードとダークモードの完全な分離を保証するための厳格なルールとツールを提供します。

## 重要な原則

**ライトモードの変更がダークモードに影響してはならない**
**ダークモードの変更がライトモードに影響してはならない**

## クイックスタート

### 開発時の基本ルール

すべての色関連のスタイルは、両モードで独立した定義を持つ必要があります：

```tsx
// ✅ 正しい
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">

// ❌ 間違い（ダークモード定義なし）
<div className="bg-white text-gray-900">

// ❌ 間違い（インラインスタイルで固定）
<div style={{ backgroundColor: 'white' }}>
```

### チェックツールの使用

コミット前にモード分離をチェック：

```bash
npm run check:dark-mode
```

### 詳細ガイドライン

完全なルールと例は [.copilot-instructions.md](./.copilot-instructions.md) を参照してください。

## チェック項目

コード変更時は以下を確認：

- [ ] すべての背景色に `dark:` バリアントがある
- [ ] すべてのテキスト色に `dark:` バリアントがある
- [ ] すべての枠線色に `dark:` バリアントがある
- [ ] インラインスタイルで色を固定していない
- [ ] CSSファイルに `.dark-mode` セレクタがある

## 推奨される色パレット

### ライトモード

- 背景: `bg-white`, `bg-gray-50`, `bg-gray-100`, `bg-blue-50`
- テキスト: `text-gray-700`, `text-gray-800`, `text-gray-900`
- 枠線: `border-gray-200`, `border-gray-300`

### ダークモード

- 背景: `dark:bg-gray-800`, `dark:bg-gray-900`, `dark:bg-black`
- テキスト: `dark:text-gray-100`, `dark:text-gray-200`, `dark:text-gray-300`
- 枠線: `dark:border-gray-600`, `dark:border-gray-700`

## トラブルシューティング

### ダークモードで色がおかしい

1. `dark:` プレフィックスが欠落していないか確認
1. インラインスタイルで色を固定していないか確認
1. `npm run check:dark-mode` を実行して問題を検出

### ライトモードの変更がダークモードに影響する

1. 両モードで別々のクラスを使用しているか確認
1. CSS変数を共有していないか確認
1. `.dark-mode` セレクタで適切にオーバーライドしているか確認

## 自動化

- **チェックスクリプト**: `scripts/check_dark_mode_isolation.sh`
- **ガイドライン**: `.copilot-instructions.md`
- **npm スクリプト**: `npm run check:dark-mode`

## 参考資料

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [プロジェクトの Copilot Instructions](./.copilot-instructions.md)
