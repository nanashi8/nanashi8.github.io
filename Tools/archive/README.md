# Tools Archive

このフォルダには、過去に使用されたがアクティブな開発では不要になったツールが保管されています。

## アーカイブ基準

以下の条件に該当するツールをアーカイブしています：

### 1. データ修正・正規化系（完了済み作業）
- `fix_*.py` - 読み仮名修正、データ修正
- `normalize_*.py` - データ正規化
- `augment_*.py` - データ拡張
- `dedupe_*.py` - 重複削除
- `fill_*.py` - データ補完
- `enforce_*.py` - 整合性強制

### 2. 変換・移行系（完了済み作業）
- `convert_*.py`, `convert_*.swift` - フォーマット変換
- `translate_*.py` - 翻訳
- `map_*.py` - マッピング

### 3. リストア・復元系（非常時のみ）
- `restore_*.py`, `restore_*.sh` - バックアップ復元
- `revert_*.py` - 変更の巻き戻し

### 4. レポート生成系（完了済み作業）
- `generate_manual_*.py` - マニュアルレビュー生成
- `generate_phrasal_*.py` - フレーズ生成
- `generate_reading_*.py` - 読み仮名生成
- `generate_related_*.py` - 関連語生成
- `report_*.py` - レポート生成

### 5. 古いデータファイル
- `*.csv` - 古いCSVファイル
- `*.txt` - 正規化レポート等
- `reports/` - 過去の変換レポート

## アクティブなツール（親ディレクトリ）

現在も使用されているツールは親ディレクトリに残されています：

### テスト・検証系
- `test_csv_choices.swift` - CSV選択肢生成テスト
- `validate_csvs.swift` - CSV検証（Swift）
- `validate_japanese_csvs.py` - 日本語CSV検証
- `csv_validator.py` - CSV検証（Python）
- `check_csv_loader.swift` - CSVローダーチェック

### 分析系
- `analyze_csv_structure.swift` - CSV構造分析

### 生成系
- `generate_csvs.swift` - CSV生成

### データ管理系
- `fill_csv_ids.swift` - CSV ID補完（継続使用）
- `convert_related_fields.swift` - 関連フィールド変換（継続使用）

## 復元方法

アーカイブされたツールが必要な場合：

```bash
# 特定のツールを復元
mv archive/tool_name.py ./

# 複数のツールを復元
mv archive/fix_*.py ./
```

## 注意事項

- アーカイブされたツールは、過去のデータ形式に依存している可能性があります
- 使用前に、現在のデータ形式との互換性を確認してください
- 必要に応じてツールの更新が必要な場合があります

---

**アーカイブ日**: 2025年11月5日  
**アーカイブ理由**: プロジェクト構造の整理とクリーンアップ
