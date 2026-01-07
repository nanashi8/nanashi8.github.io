#!/bin/bash
# 自動生成されたチェックスクリプト
# 生成日時: 2026-01-07T06:26:46.418Z

echo "🔍 適応的ガードシステム - 自動チェック開始"


# property-naming-error (重み: 1.00)
echo "📋 型定義を確認せずにプロパティ名を推測"
if grep -rn "Property .* does not exist on type" src/**/*.ts src/**/*.tsx 2>/dev/null; then
  echo "::error::property-naming-error が検出されました"
  echo "::error::対策: .aitk/instructions/property-naming-convention.instructions.md"
  exit 1
fi


echo "✅ すべてのチェックが成功しました"
