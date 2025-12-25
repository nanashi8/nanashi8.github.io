---
title: 16. ストレージ戦略
created: 2025-11-22
updated: 2025-12-05
status: in-progress
tags: [specification, ai]
---

# 16. ストレージ戦略

## 📌 概要

学習データの永続化に**IndexedDB**と**LocalStorage**を使い分ける戦略。
大容量データと小容量データで最適なストレージを選択し、パフォーマンスを最大化。

## 🎯 使い分けの方針

### IndexedDB（メインストレージ）

**用途**: 大容量の学習データ

- ✅ 単語ごとの進捗データ（wordProgress）
- ✅ セッション履歴（sessionHistory）
- ✅ 日別・週別の学習履歴
- ✅ スキップグループ
- ✅ エラーパターン分析データ

**特徴**:

- 容量制限: 50MB〜数GB（ブラウザ依存）
- 非同期API（async/await対応）
- トランザクションサポート
- インデックス検索が高速

### LocalStorage（設定ストレージ）

**用途**: 小容量の設定データ

- ✅ ユーザー設定（settings）
- ✅ UI状態（activeTab, filters）
- ✅ 学習目標（goals）
- ✅ 一時キャッシュ

**特徴**:

- 容量制限: 5-10MB
- 同期API（即座にアクセス）
- シンプルなkey-value
- JSON文字列で保存

## 📊 容量比較

| データ種類     | サイズ | ストレージ   | 理由                 |
| -------------- | ------ | ------------ | -------------------- |
| wordProgress   | ~5MB   | IndexedDB    | 大容量、頻繁な更新   |
| sessionHistory | ~2MB   | IndexedDB    | 累積増加             |
| settings       | ~5KB   | LocalStorage | 小容量、高速アクセス |
| goals          | ~2KB   | LocalStorage | 小容量、頻繁アクセス |
| questionSets   | ~10MB  | IndexedDB    | 問題データ大容量     |

## 🗄️ IndexedDBの実装

### データベース初期化

```typescript
const DB_NAME = 'englishQuizDB';
const DB_VERSION = 3;

async function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // wordProgressストア作成
      if (!db.objectStoreNames.contains('wordProgress')) {
        const store = db.createObjectStore('wordProgress', { keyPath: 'word' });
        store.createIndex('retentionRate', 'retentionRate', { unique: false });
        store.createIndex('lastAttempt', 'lastAttempt', { unique: false });
      }

      // sessionHistoryストア作成
      if (!db.objectStoreNames.contains('sessionHistory')) {
        const store = db.createObjectStore('sessionHistory', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}
```

### データ保存

```typescript
async function saveWordProgress(word: string, progress: WordProgress): Promise<void> {
  const db = await initDatabase();
  const transaction = db.transaction(['wordProgress'], 'readwrite');
  const store = transaction.objectStore('wordProgress');

  await store.put({ ...progress, word });
}
```

### データ取得

```typescript
async function loadWordProgress(word: string): Promise<WordProgress | null> {
  const db = await initDatabase();
  const transaction = db.transaction(['wordProgress'], 'readonly');
  const store = transaction.objectStore('wordProgress');

  return new Promise((resolve, reject) => {
    const request = store.get(word);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
```

### 範囲検索

```typescript
async function getRecentSessions(days: number = 30): Promise<SessionHistory[]> {
  const db = await initDatabase();
  const transaction = db.transaction(['sessionHistory'], 'readonly');
  const store = transaction.objectStore('sessionHistory');
  const index = store.index('timestamp');

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const range = IDBKeyRange.lowerBound(cutoff);

  return new Promise((resolve, reject) => {
    const request = index.getAll(range);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

## 💾 LocalStorageの実装

### データ保存

```typescript
function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch (error) {
    console.error('設定の保存に失敗:', error);
    // QuotaExceededErrorの場合は古いデータを削除
    if (error.name === 'QuotaExceededError') {
      cleanupOldData();
    }
  }
}
```

### データ取得

```typescript
function loadSettings(): Settings {
  try {
    const data = localStorage.getItem('settings');
    return data ? JSON.parse(data) : getDefaultSettings();
  } catch (error) {
    console.error('設定の読み込みに失敗:', error);
    return getDefaultSettings();
  }
}
```

## 🔄 データ移行

### LocalStorage → IndexedDB

容量超過時の自動移行:

```typescript
async function migrateToIndexedDB(): Promise<void> {
  console.log('📦 LocalStorage → IndexedDB 移行開始');

  // 1. LocalStorageからデータ取得
  const oldProgress = localStorage.getItem('wordProgress');
  if (!oldProgress) return;

  const progressData = JSON.parse(oldProgress);

  // 2. IndexedDBに保存
  const db = await initDatabase();
  const transaction = db.transaction(['wordProgress'], 'readwrite');
  const store = transaction.objectStore('wordProgress');

  for (const [word, progress] of Object.entries(progressData)) {
    await store.put({ ...progress, word });
  }

  // 3. LocalStorageから削除
  localStorage.removeItem('wordProgress');

  console.log('✅ 移行完了');
}
```

## 📈 容量監視

### LocalStorage使用量チェック

```typescript
function checkLocalStorageSize(): {
  totalMB: number;
  details: { key: string; size: number }[];
} {
  let totalSize = 0;
  const details: { key: string; size: number }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        totalSize += size;
        details.push({ key, size });
      }
    }
  }

  const totalMB = totalSize / (1024 * 1024);

  // 警告表示（4MB以上）
  if (totalMB > 4) {
    console.warn('⚠️ LocalStorage使用量が多い:', totalMB.toFixed(2), 'MB');
  }

  return { totalMB, details };
}
```

### IndexedDB使用量推定

```typescript
async function estimateIndexedDBSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}
```

## 🧹 データクリーンアップ

### 古いデータの削除

```typescript
async function cleanupOldData(daysToKeep: number = 90): Promise<void> {
  const db = await initDatabase();
  const transaction = db.transaction(['sessionHistory'], 'readwrite');
  const store = transaction.objectStore('sessionHistory');
  const index = store.index('timestamp');

  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  const range = IDBKeyRange.upperBound(cutoff);

  return new Promise((resolve, reject) => {
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });
}
```

## ⚡ パフォーマンス最適化

### メモリキャッシュ

頻繁にアクセスするデータはメモリにキャッシュ:

```typescript
class ProgressCache {
  private cache: Map<string, WordProgress> = new Map();
  private lastSync: number = Date.now();

  async get(word: string): Promise<WordProgress | null> {
    // キャッシュにあれば即返す
    if (this.cache.has(word)) {
      return this.cache.get(word)!;
    }

    // なければIndexedDBから取得
    const progress = await loadWordProgress(word);
    if (progress) {
      this.cache.set(word, progress);
    }
    return progress;
  }

  async save(word: string, progress: WordProgress): Promise<void> {
    // キャッシュ更新
    this.cache.set(word, progress);

    // 定期的にIndexedDBに同期
    if (Date.now() - this.lastSync > 5000) {
      await this.syncToDatabase();
    }
  }

  private async syncToDatabase(): Promise<void> {
    for (const [word, progress] of this.cache) {
      await saveWordProgress(word, progress);
    }
    this.lastSync = Date.now();
  }
}
```

### バッチ保存

複数のデータをまとめて保存:

```typescript
async function batchSaveWordProgress(
  entries: Array<{ word: string; progress: WordProgress }>
): Promise<void> {
  const db = await initDatabase();
  const transaction = db.transaction(['wordProgress'], 'readwrite');
  const store = transaction.objectStore('wordProgress');

  for (const entry of entries) {
    store.put({ ...entry.progress, word: entry.word });
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
```

## 🔒 データ整合性

### トランザクション使用

```typescript
async function updateMultipleRecords(
  updates: Array<{ word: string; progress: WordProgress }>
): Promise<void> {
  const db = await initDatabase();
  const transaction = db.transaction(['wordProgress'], 'readwrite');

  try {
    const store = transaction.objectStore('wordProgress');

    for (const update of updates) {
      await store.put({ ...update.progress, word: update.word });
    }

    await transaction.complete;
  } catch (error) {
    transaction.abort();
    throw error;
  }
}
```

## 🌐 ブラウザ互換性

### 対応状況

| ブラウザ   | IndexedDB | LocalStorage | 備考                         |
| ---------- | --------- | ------------ | ---------------------------- |
| Chrome     | ✅        | ✅           | フル対応                     |
| Firefox    | ✅        | ✅           | フル対応                     |
| Safari     | ✅        | ✅           | プライベートモードに制限あり |
| Edge       | ✅        | ✅           | フル対応                     |
| iOS Safari | ✅        | ✅           | 容量制限あり                 |

### フォールバック

```typescript
async function initStorageStrategy(): Promise<'indexedDB' | 'localStorage'> {
  // IndexedDBが利用可能か確認
  if ('indexedDB' in window) {
    try {
      await initDatabase();
      return 'indexedDB';
    } catch (error) {
      console.warn('IndexedDB初期化失敗、LocalStorageを使用');
    }
  }

  // LocalStorageにフォールバック
  return 'localStorage';
}
```

## 📝 データ構造

### wordProgress（IndexedDB）

```typescript
interface WordProgress {
  word: string; // プライマリキー
  correctCount: number;
  incorrectCount: number;
  lastAttempt: number; // インデックス
  retentionRate: number; // インデックス
  masteryLevel: 'struggling' | 'learning' | 'mastered';
  averageResponseTime: number;
  spellingAccuracy?: number;
  commonMistakes?: string[];
}
```

### settings（LocalStorage）

```typescript
interface Settings {
  difficulty: DifficultyLevel;
  wordPhraseFilter: WordPhraseFilter;
  phraseTypeFilter: PhraseTypeFilter;
  soundEnabled: boolean;
  darkMode: boolean;
  fontSize: number;
  aiPersonality: AIPersonality;
}
```

## 📝 関連ドキュメント

- [15-データ構造](./15-data-structures.md)
- [05-統計・分析](./05-stats-analytics.md)
