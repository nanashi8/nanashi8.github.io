# Phase 5計画: パフォーマンス最適化

**開始日**: 2025年12月31日  
**ステータス**: 計画中

---

## 🎯 目標

Phase 5では、Instructions Validatorのパフォーマンスを大幅に向上させ、大規模プロジェクトでも快適に動作するように最適化します。特にpre-commit時の検証速度を重視します。

### パフォーマンス目標

| 項目 | 現在 | 目標 | 改善率 |
|------|------|------|--------|
| 10ファイル検証 | ~500ms | <100ms | 80%改善 |
| 100ファイル検証 | ~5s | <500ms | 90%改善 |
| メモリ使用量 | 50MB | <30MB | 40%削減 |
| キャッシュヒット率 | 0% | >80% | - |

---

## 📋 実装範囲

### 1. キャッシング機構

#### ValidationCache
- ファイルハッシュベースのキャッシング
- メモリ内キャッシュ（LRU方式）
- ディスクキャッシュ（永続化）
- キャッシュ無効化戦略

#### 実装内容:
```typescript
class ValidationCache {
  // メモリキャッシュ (LRU)
  private memoryCache: Map<string, CachedResult>;
  private maxMemorySize: number = 100; // 最大100エントリ
  
  // ディスクキャッシュ
  private diskCachePath: string;
  
  async get(fileHash: string): Promise<CachedResult | null>
  async set(fileHash: string, result: ValidationResult): Promise<void>
  async invalidate(filePath: string): Promise<void>
  async clear(): Promise<void>
}
```

#### キャッシュキー生成:
```typescript
// ファイル内容 + Instructionsバージョン + RuleEngineバージョン
const cacheKey = crypto.createHash('md5')
  .update(fileContent)
  .update(instructionsVersion)
  .update(engineVersion)
  .digest('hex');
```

### 2. 並列処理

#### ParallelValidator
- Worker threadsによる並列検証
- ファイル単位の並列化
- CPUコア数に応じた最適化

#### 実装内容:
```typescript
class ParallelValidator {
  private workerPool: Worker[];
  private maxWorkers: number;
  
  async validateParallel(files: string[]): Promise<ValidationResult[]>
  private createWorker(): Worker
  private distributeWork(files: string[]): Promise<ValidationResult[]>
}
```

#### Worker戦略:
- CPUコア数の75%を使用（オーバーヘッド考慮）
- ファイルサイズでバッチ分割
- 大きいファイルを優先処理

### 3. インクリメンタル検証

#### IncrementalValidator
- 変更されたファイルのみを検証
- Gitステータスとの統合
- ファイル変更検出（mtime, content hash）

#### 実装内容:
```typescript
class IncrementalValidator {
  private changeDetector: FileChangeDetector;
  
  async getChangedFiles(since?: Date): Promise<string[]>
  async validateIncremental(files: string[]): Promise<ValidationResult[]>
  private detectChanges(file: string): Promise<boolean>
}
```

### 4. RuleEngine最適化

#### 最適化項目:
1. **正規表現の事前コンパイル**
   - 頻繁に使用する正規表現をキャッシュ
   - RegExpオブジェクトの再利用

2. **文字列操作の最適化**
   - `String.prototype.match`の代わりに`RegExp.exec`ループ
   - 不要な文字列コピーを削減

3. **早期リターン**
   - 違反が見つかった時点で処理を中断（オプション）
   - ルール優先度による順序最適化

4. **メモリ最適化**
   - 大きなファイルのストリーミング処理
   - 不要なオブジェクト生成を削減

### 5. 設定オプション

```json
{
  "instructionsValidator.performance.enableCache": true,
  "instructionsValidator.performance.cacheLocation": ".vscode/cache",
  "instructionsValidator.performance.maxCacheSize": 100,
  "instructionsValidator.performance.enableParallel": true,
  "instructionsValidator.performance.maxWorkers": 4,
  "instructionsValidator.performance.enableIncremental": true,
  "instructionsValidator.performance.largeFileThreshold": 1048576
}
```

---

## 🛠️ 技術設計

### アーキテクチャ

```
┌─────────────────────────────────────┐
│  PreCommitValidator                  │
│  ┌─────────────────────────────┐   │
│  │ IncrementalValidator        │   │
│  │ - getChangedFiles()         │   │
│  └─────────────────────────────┘   │
│              ↓                      │
│  ┌─────────────────────────────┐   │
│  │ ParallelValidator           │   │
│  │ - validateParallel()        │   │
│  │ - Worker Pool               │   │
│  └─────────────────────────────┘   │
│              ↓                      │
│  ┌─────────────────────────────┐   │
│  │ ValidationCache             │   │
│  │ - Memory Cache (LRU)        │   │
│  │ - Disk Cache                │   │
│  └─────────────────────────────┘   │
│              ↓                      │
│  ┌─────────────────────────────┐   │
│  │ RuleEngine (Optimized)      │   │
│  │ - Compiled RegExp           │   │
│  │ - Stream Processing         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### ファイル構成

```
extensions/instructions-validator/
├── src/
│   ├── performance/
│   │   ├── ValidationCache.ts         (新規)
│   │   ├── ParallelValidator.ts       (新規)
│   │   ├── IncrementalValidator.ts    (新規)
│   │   └── PerformanceMonitor.ts      (新規)
│   ├── engine/
│   │   └── RuleEngine.ts              (最適化)
│   └── git/
│       └── PreCommitValidator.ts      (並列処理統合)
└── tests/
    ├── ValidationCache.test.ts        (新規)
    ├── ParallelValidator.test.ts      (新規)
    └── IncrementalValidator.test.ts   (新規)
```

---

## 📝 実装手順

### ステップ1: ValidationCache実装 (1-2時間)
- [ ] ValidationCacheクラス作成
- [ ] LRUメモリキャッシュ実装
- [ ] ディスクキャッシュ実装
- [ ] ハッシュ生成ロジック
- [ ] テスト作成 (最低10ケース)

### ステップ2: IncrementalValidator実装 (1時間)
- [ ] IncrementalValidatorクラス作成
- [ ] ファイル変更検出ロジック
- [ ] Git統合
- [ ] テスト作成

### ステップ3: ParallelValidator実装 (1-2時間)
- [ ] ParallelValidatorクラス作成
- [ ] Worker pool実装
- [ ] ワークディストリビューション
- [ ] テスト作成

### ステップ4: RuleEngine最適化 (1時間)
- [ ] 正規表現の事前コンパイル
- [ ] 文字列操作の最適化
- [ ] 早期リターンの実装
- [ ] パフォーマンステスト

### ステップ5: 統合とテスト (1時間)
- [ ] PreCommitValidatorへの統合
- [ ] 設定オプション追加
- [ ] E2Eテスト
- [ ] ベンチマークテスト

### ステップ6: パフォーマンス測定 (30分)
- [ ] PerformanceMonitor実装
- [ ] ベンチマーク結果収集
- [ ] 目標達成確認

---

## 🧪 テスト戦略

### ユニットテスト (最低30ケース追加)

```typescript
describe('ValidationCache', () => {
  it('should cache validation results');
  it('should invalidate cache on file change');
  it('should use LRU eviction policy');
  it('should persist cache to disk');
  it('should load cache from disk');
  // ... 10+ more tests
});

describe('ParallelValidator', () => {
  it('should validate files in parallel');
  it('should respect maxWorkers setting');
  it('should handle worker failures gracefully');
  it('should distribute work evenly');
  // ... 10+ more tests
});

describe('IncrementalValidator', () => {
  it('should detect changed files');
  it('should skip unchanged files');
  it('should work with Git status');
  // ... 5+ more tests
});
```

### ベンチマークテスト

```typescript
describe('Performance Benchmarks', () => {
  it('should validate 10 files in <100ms');
  it('should validate 100 files in <500ms');
  it('should use <30MB memory');
  it('should achieve >80% cache hit rate');
});
```

---

## 📊 成功基準

| 項目 | 目標 | 検証方法 |
|------|------|----------|
| テストパス率 | 85/85 | npm test |
| 10ファイル検証 | <100ms | ベンチマーク |
| 100ファイル検証 | <500ms | ベンチマーク |
| メモリ使用量 | <30MB | プロファイリング |
| キャッシュヒット率 | >80% | 実測値 |
| コード品質 | lintエラー0 | npm run lint |

---

## 🚧 リスクと対策

### リスク1: Worker threadsのオーバーヘッド
**対策**: 小さいファイル（<1KB）は直接処理、大きいファイルのみWorker使用

### リスク2: キャッシュ無効化の複雑さ
**対策**: ハッシュベースで確実に検出、必要に応じて全クリア機能提供

### リスク3: メモリリーク
**対策**: LRU方式でメモリ上限を厳密に管理、定期的なクリーンアップ

### リスク4: クロスプラットフォーム互換性
**対策**: Worker threadsはNode.js 10.5+で標準、フォールバック実装

---

## 📅 スケジュール

- **Day 1**: ステップ1-2完了 (ValidationCache + IncrementalValidator)
- **Day 2**: ステップ3-4完了 (ParallelValidator + RuleEngine最適化)
- **Day 3**: ステップ5-6完了 (統合 + テスト + ベンチマーク)

**予想完了日**: 2025年1月3日

---

## 🎯 Phase 5完了条件

- [x] Phase 5計画書作成
- [ ] ValidationCache実装完了
- [ ] IncrementalValidator実装完了
- [ ] ParallelValidator実装完了
- [ ] RuleEngine最適化完了
- [ ] 全85テストパス
- [ ] パフォーマンス目標達成
- [ ] ベンチマーク結果ドキュメント化
- [ ] Phase 5完了レポート作成

---

## 🔜 次のフェーズ予定

**Phase 6**: Marketplace公開
- README作成
- アイコン・スクリーンショット準備
- 公開手続き
- プロモーション

---

**準備完了！Phase 5実装を開始します！** 🚀
