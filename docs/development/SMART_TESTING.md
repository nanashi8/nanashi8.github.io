---
title: スマートテストシステム
created: 2025-12-02
updated: 2025-12-05
status: in-progress
tags: [development, test]
---

# スマートテストシステム

## 概要

変更内容を自動分析し、**必要なテストのみを実行**する高速テストシステムです。

## 使い方

### 1. 開発サーバーを起動（別ターミナル）

```bash
npm run dev
```

### 2. スマートテストを実行

```bash
npm run test:smart
```

## テスト戦略

### 変更内容に基づく自動判定

| 変更ファイル                   | 実行されるテスト   | 理由                       |
| ------------------------------ | ------------------ | -------------------------- |
| `*.ts`, `*.tsx`                | 基本機能テスト     | TypeScript変更は機能に影響 |
| `*.css`, `*.scss`              | レイアウトテスト   | CSSはデザインに影響        |
| `QuestionCard.tsx`             | レイアウト + State | UIとロジック両方に影響     |
| `useState`, `useEffect` を含む | Stateテスト        | 状態管理の変更             |
| `public/data/**` のみ          | **スキップ**       | データのみの変更           |
| `*.md`, `docs/**` のみ         | **スキップ**       | ドキュメントのみの変更     |

### テストの種類

#### 1. 超高速基本テスト（5秒以内）

- ファイル: `tests/smoke-fast.spec.ts`
- 内容: アプリ起動 + クイズ開始 + エラーチェック
- 実行: `npm run test:smoke`

#### 2. フルレイアウトテスト（30秒程度）

- ファイル: `tests/smoke.spec.ts`
- 内容: 視覚回帰、レイアウト、CSS変数など
- 実行: `npm run test:smoke:full`

## Git統合

### Pre-push フック

プッシュ前に自動実行：

```bash
git push  # 自動的にスマートテストが実行される
```

強制プッシュ（テストスキップ）：

```bash
git push --no-verify
```

## 手動テストコマンド

```bash
# 超高速テスト（推奨）
npm run test:smoke

# フルテスト
npm run test:smoke:full

# スマートテスト（変更内容で自動判定）
npm run test:smart

# UIモード
npm run test:smoke:ui

# デバッグモード
npm run test:smoke:debug
```

## メリット

✅ **高速**: 不要なテストはスキップ  
✅ **賢い**: 変更内容を分析して最適なテストを選択  
✅ **効率的**: ドキュメントやデータのみの変更では実行しない  
✅ **安全**: 重要な変更は必ず検出

## トラブルシューティング

### 「開発サーバーが起動していません」

別のターミナルで：

```bash
npm run dev
```

### テストが遅い

超高速テストのみ実行：

```bash
npm run test:smoke
```

### レイアウトテストが失敗する

ベースライン更新：

```bash
npm run test:smoke:update
```
