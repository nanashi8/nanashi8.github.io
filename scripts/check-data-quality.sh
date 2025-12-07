#!/bin/bash

# データ品質チェックスクリプト
# すべてのデータファイルの品質をチェックします

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 データ品質チェックを開始します..."
echo ""

# Python3の確認
if ! command -v python3 &> /dev/null; then
    echo "❌ python3が見つかりません"
    exit 1
fi

# チェックスクリプトを実行
cd "$PROJECT_ROOT"
python3 scripts/data-quality-check.py

# 終了コードを保存
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ データ品質チェック完了: エラーなし"
    exit 0
else
    echo ""
    echo "❌ データ品質チェック完了: エラーあり"
    echo "📝 詳細はscripts/output/data-quality-report.txtを確認してください"
    exit 1
fi
