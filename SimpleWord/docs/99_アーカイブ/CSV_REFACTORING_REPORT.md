# CSV リファクタリング完了レポート

## 実施日
2025年10月26日

## 概要
CSV読み込み処理を一元化し、保守性・テスタビリティ・拡張性を向上させるリファクタリングを実施しました。

## 実装した新しい構造

### 1. データソース抽象化層

#### DataSourceProtocol.swift
- データ取得方法を抽象化（CSV, API, DB など実装方法を隠蔽）
- `DataSourceError`: 統一的なエラー型
- `DataSourceResult<T>`: データ取得結果の型
- `DataSource` プロトコル: データ取得の抽象インターフェース

#### CSVDataSource.swift
- CSV形式のデータソース実装
- 列数チェックとエラーハンドリングを統一
- Bundle優先、Resourcesフォルダへのフォールバック対応
- クォート対応のCSVパーサー内蔵

#### DataSourceFactory.swift
- DataSource生成を一元管理
- テスト用モックDataSourceの提供

### 2. パーサー層

#### Parser.swift
- パース処理の抽象化
- `CSVLineParser<T>`: CSV行をエンティティに変換

#### QuestionItemParser.swift
- QuestionItem専用のパーサー実装
- 安全な配列アクセス拡張を提供

### 3. リポジトリ層

#### RepositoryProtocol.swift
- データ取得を抽象化
- ビジネスロジックからデータ取得方法を分離

#### QuestionItemRepository.swift
- QuestionItem用のリポジトリ実装
- 警告ログ出力
- テスト用DI対応

### 4. スキーマ定義

#### QuestionItemCSVSchema.swift
- CSV構造を定数で管理
- 列数、列インデックス、ヘッダ名候補を一元管理

### 5. ユーティリティ

#### Logger.swift
- 統一的なログ出力
- ログレベル管理（debug, info, warning, error）
- DEBUGビルドのみ出力

#### Result+Extensions.swift
- Result型の便利メソッド
- `onSuccess()`, `onFailure()` でチェーン可能なエラーハンドリング

### 6. 互換性レイヤー

#### LegacyCSVLoaderAdapter.swift
- 既存の `CSVLoader` インターフェースを維持
- 新しいRepositoryを内部で使用

#### LegacyCSVQuestionLoaderAdapter.swift
- 既存の `CSVQuestionLoader` インターフェースを維持
- 新しいRepositoryを内部で使用

### 7. 既存ファイルの更新

#### CSVLoader.swift
- 新しいアダプターを使用するように簡略化
- 既存インターフェースは完全に維持

#### CSVQuestionLoader.swift
- 新しいアダプターを使用するように簡略化
- 既存インターフェースは完全に維持

## アーキテクチャ図

```
┌─────────────────────────────────────────┐
│          ViewModel / View               │
│  (既存コードは変更不要)                   │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼──────────┐   ┌────────▼─────────┐
│  CSVLoader     │   │ CSVQuestionLoader│
│  (互換性維持)   │   │  (互換性維持)     │
└─────┬──────────┘   └────────┬─────────┘
      │                       │
      │    ┌──────────────────┘
      │    │
┌─────▼────▼───────────────────────────┐
│  Legacy Adapters                     │
│  (段階的な移行をサポート)              │
└─────┬────────────────────────────────┘
      │
┌─────▼────────────────────────────────┐
│  QuestionItemRepository              │
│  (新しいデータ取得層)                  │
└─────┬────────────────────────────────┘
      │
┌─────▼────────────────────────────────┐
│  CSVDataSource + Parser              │
│  (CSV読み込みの実装)                   │
└──────────────────────────────────────┘
```

## 利点

### 1. 保守性の向上
- CSV読み込みロジックが一元化され、変更時の影響範囲が明確
- 列数や列名の定義が `QuestionItemCSVSchema` に集約

### 2. テスタビリティの向上
- Repository に MockDataSource を注入可能
- 各層が独立してテスト可能

### 3. 拡張性の向上
- CSV以外（API, DB）への切り替えが容易
- 新しいエンティティ用のRepositoryを追加しやすい

### 4. エラーハンドリングの統一
- `DataSourceError` で統一的なエラー処理
- `Result` 型でSwiftらしいエラーハンドリング

### 5. 既存コードとの互換性
- 既存の `CSVLoader`, `CSVQuestionLoader` のインターフェースを完全に維持
- 段階的な移行が可能

## ビルド結果
✅ **BUILD SUCCEEDED** - エラーなしでコンパイル成功

## 次のステップ（推奨）

### Phase 1: Xcodeプロジェクトでのフォルダ整理 ⚠️ **あなたが実施**
以下のフォルダ構造に整理してください：

```
SimpleWord/
  Common/
    Data/
      DataSource/
        - DataSourceProtocol.swift
        - CSVDataSource.swift
        - DataSourceFactory.swift
      Parser/
        - Parser.swift
        - QuestionItemParser.swift
      Repository/
        - RepositoryProtocol.swift
        - QuestionItemRepository.swift
      Schema/
        - QuestionItemCSVSchema.swift
      Legacy/
        - LegacyCSVLoaderAdapter.swift
        - LegacyCSVQuestionLoaderAdapter.swift
    Extensions/
      - Result+Extensions.swift
    Utility/
      - Logger.swift
```

**Xcodeでの操作手順:**
1. Xcodeでプロジェクトを開く
2. 左サイドバーで「SimpleWord」グループを選択
3. 右クリック → 「New Group」で「Common」グループを作成
4. 「Common」内に「Data」「Extensions」「Utility」グループを作成
5. 「Data」内に「DataSource」「Parser」「Repository」「Schema」「Legacy」グループを作成
6. ファイルシステムから各ファイルをドラッグ＆ドロップして適切なグループに配置
7. ビルドして動作確認

### Phase 2: 段階的な移行（オプション）
新しいコードでは `QuestionItemRepository` を直接使用することを推奨：

```swift
// 新しい推奨方法
let repository = QuestionItemRepository(fileName: "中学英単語")
switch repository.fetch() {
case .success(let items):
    // 処理
case .failure(let error):
    // エラー処理
}
```

### Phase 3: 単体テストの追加（オプション）
新しい構造に対するテストを追加：

```swift
// テスト例
func testQuestionItemRepository() {
    let mockData = [/* テストデータ */]
    let mockDataSource = DataSourceFactory.makeMockDataSource(items: mockData)
    let repository = QuestionItemRepository(dataSource: mockDataSource)
    
    let result = repository.fetch()
    // アサーション
}
```

## 注意事項

1. **既存コードは動作し続けます**
   - `CSVLoader` と `CSVQuestionLoader` のインターフェースは完全に維持
   - 内部実装のみ新しい構造を使用

2. **段階的な移行が可能**
   - すぐに全てを書き換える必要はありません
   - 新しい機能から徐々に `QuestionItemRepository` を使用

3. **Deprecation警告**
   - Legacy Adapters には `@available(*, deprecated)` マークを付与
   - 将来的な移行を促進

## まとめ

CSV読み込み処理の一元化により、以下を達成しました：

✅ コードの重複を排除  
✅ エラーハンドリングの統一  
✅ テスタビリティの向上  
✅ 既存コードとの完全な互換性  
✅ ビルド成功  

次は、Xcodeプロジェクトでフォルダ構造を整理してください。
