# データ移行・保護機能の実装

## 背景

IndexedDBへの移行やデータ構造の変更により、既存の学習履歴が失われる可能性があります。
試験運用中のユーザーデータを保護しつつ、将来の更新に対応する仕組みが必要です。

## データ変更による影響分析

### 🔴 影響が大きい変更（学習履歴が消える可能性）

1. **IndexedDBへの移行**
   - LocalStorageとIndexedDBは完全に別のストレージ
   - 移行スクリプトなしだと既存データが見えなくなる
   - **対策**: マイグレーション機能を実装

1. **データスキーマの変更**
   - `QuizResult` や `WordProgress` の構造を変更
   - 例: フィールド名変更、型変更、必須フィールド追加
   - **対策**: バージョン管理とマイグレーション

### 🟡 互換性を保てる変更(注意が必要)

1. **新フィールドの追加**

   ```typescript
   // オプショナルなら既存データと互換性あり
   interface WordProgress {
     word: string;
     correctCount: number;
     newField?: string; // ← 安全
   }
   ```

1. **計算ロジックの変更**
   - 正答率の計算方法を変更
   - スコアリングアルゴリズムの改善
   - → 過去データは保持されるが、統計値が変わる

### 🟢 影響がない変更

- UI/UXの変更
- デザイン変更
- 新しいタブの追加
- アニメーション改善

## 推奨アプローチ: 段階的移行

### Phase 1: データバックアップ機能（優先度: 高）

```typescript
// src/utils/dataBackup.ts
export function exportAllData(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    quizResults: [],
    wordProgress: {},
  };
  
  // LocalStorageから全データを取得
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('quiz-result-')) {
      data.quizResults.push(JSON.parse(localStorage.getItem(key)));
    }
  }
  
  const progressData = localStorage.getItem('progress-data');
  if (progressData) {
    data.wordProgress = JSON.parse(progressData);
  }
  
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    // データを復元
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
```

**実装内容**:

- 成績タブに「データをエクスポート」ボタンを追加
- JSON形式でダウンロード
- 「データをインポート」機能で復元可能

### Phase 2: バージョン管理システム

```typescript
// src/utils/dataVersion.ts
const CURRENT_VERSION = '2.0';

interface VersionedData {
  version: string;
  data: any;
}

export function migrateData(oldVersion: string, data: any): any {
  // 1.0 → 2.0 の移行
  if (oldVersion === '1.0' && CURRENT_VERSION === '2.0') {
    return migrateV1toV2(data);
  }
  return data;
}

function migrateV1toV2(data: any): any {
  // LocalStorage → IndexedDB への変換
  return {
    ...data,
    migratedAt: new Date().toISOString(),
  };
}
```

**実装内容**:

- すべてのデータにバージョン番号を付与
- 読み込み時に自動マイグレーション
- 互換性のないバージョンは警告表示

### Phase 3: IndexedDB移行スクリプト

```typescript
// src/utils/storageMigration.ts
export async function migrateToIndexedDB(): Promise<boolean> {
  console.log('🔄 LocalStorage → IndexedDB 移行開始');
  
  // 1. LocalStorageから全データを読み込み
  const backup = exportAllData();
  
  // 2. IndexedDBにデータを書き込み
  const db = await openIndexedDB();
  // ... データ移行処理
  
  // 3. 移行完了フラグを保存
  localStorage.setItem('migration-completed', 'true');
  localStorage.setItem('migration-backup', backup);
  
  console.log('✅ 移行完了');
  return true;
}
```

**実装内容**:

- 自動バックアップ作成
- デュアルストレージ期間（1-2週間）
- 問題があればロールバック可能

## 安全な移行手順

### ステップ1: バックアップ機能を追加(今すぐ実装)

```text
成績タブに「データをエクスポート」ボタン追加
    ↓
ユーザーがJSON形式でダウンロード可能
    ↓
いつでも復元可能
```

### ステップ2: デュアルストレージ期間(1-2週間)

```text
LocalStorage(既存) ← 読み書き継続
         ↓
    同時に保存
         ↓
IndexedDB(新規) ← バックグラウンドで同期
```

### ステップ3: 完全移行

```text
IndexedDBを主ストレージに切り替え
    ↓
LocalStorageは読み取り専用(フォールバック用)
```

## 今すぐ実装すべき保護機能

- [ ] **エクスポート/インポート機能** - 最優先
- [ ] **データバージョン番号** - 将来の移行に必須
- [ ] **自動バックアップ（週1回）** - バックグラウンドで実行
- [ ] **移行前の確認ダイアログ** - ユーザーに明示
- [ ] **ストレージ使用量の表示** - 容量監視

## 実装タスク

### Phase 1: バックアップ機能(1日)

- [ ] `src/utils/dataBackup.ts` の作成
- [ ] StatsViewにエクスポートボタン追加
- [ ] インポート機能の実装
- [ ] ファイルダウンロード/アップロード処理

### Phase 2: バージョン管理(1日)

- [ ] `src/utils/dataVersion.ts` の作成
- [ ] データ読み込み時のバージョンチェック
- [ ] マイグレーション関数の実装
- [ ] 互換性チェック

### Phase 3: IndexedDB移行(2日)

- [ ] `src/utils/storageMigration.ts` の作成
- [ ] デュアルストレージ実装
- [ ] 移行UIの作成
- [ ] ロールバック機能

## セキュリティとプライバシー

1. **エクスポートデータの暗号化**（オプション）
   - ユーザーが設定したパスワードで暗号化
   - 機密性の高い学習データを保護

1. **ローカル完結**
   - すべてのデータはユーザーのデバイスに保存
   - サーバーにアップロードしない
   - プライバシー保護

1. **バックアップの自動削除**
   - 古いバックアップ（90日以上）を自動削除
   - ストレージ圧迫を防ぐ

## 参考資料

- [Web Storage API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Data migration best practices](https://web.dev/storage-for-the-web/)

## 関連Issue

- #4 ストレージ容量対策: LocalStorageからIndexedDBへの移行検討
