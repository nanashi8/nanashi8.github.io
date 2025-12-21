---
title: AI統合の有効化方法
created: 2025-12-19
updated: 2025-12-19
status: in-progress
tags: [other, ai]
---

# AI統合の有効化方法

## 方法1: ブラウザのコンソールで有効化

開発者ツール（F12）のコンソールで以下を実行：

```javascript
localStorage.setItem('enable-ai-coordination', 'true');
location.reload();
```

## 方法2: 開発環境で自動有効化

開発環境（`npm run dev`）では自動的に有効化されます。

## 無効化する場合

```javascript
localStorage.removeItem('enable-ai-coordination');
location.reload();
```

## 確認方法

ブラウザのコンソールで以下のログが表示されれば成功：

```
🤖 [MemorizationView] AI統合が有効化されました
🧠 [MemoryAI] ...
💤 [CognitiveLoadAI] ...
🤖 [AICoordinator] ...
```
