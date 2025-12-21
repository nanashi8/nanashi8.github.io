#!/bin/bash
# .aitkリンクパス修正スクリプト
# docs内からプロジェクトルートの.aitkを参照するリンクを修正

set -e

echo "🔧 .aitkリンク修正開始..."

# バックアップ作成
BACKUP_DIR=".link-fix-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 バックアップ作成: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
find docs -name "*.md" -exec cp --parents {} "$BACKUP_DIR" \; 2>/dev/null || \
  find docs -name "*.md" | while read f; do
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"
    cp "$f" "$BACKUP_DIR/$f"
  done

# 修正パターン1: ](.aitk/ → ](../.aitk/
echo "🔄 パターン1: ](.aitk/ → ](../.aitk/"
PATTERN1_COUNT=$(grep -r '](\.aitk/' docs --include="*.md" | wc -l | tr -d ' ')
echo "   対象: ${PATTERN1_COUNT}箇所"

find docs -name "*.md" -type f -exec sed -i '' 's|](\.aitk/|](../.aitk/|g' {} \;

# 修正パターン2: 重複の../を削除 (../../.aitk/ → ../.aitk/)
echo "🔄 パターン2: 重複パス修正"
find docs -name "*.md" -type f -exec sed -i '' 's|](\.\./../\.aitk/|](../.aitk/|g' {} \;

# 検証
echo ""
echo "✅ 修正完了"
echo ""
echo "📊 検証結果:"

# 修正後の.aitkリンク数
AFTER_AITK=$(grep -r '](\.\.\/\.aitk/' docs --include="*.md" 2>/dev/null | wc -l | tr -d ' ')
REMAINING_BAD=$(grep -r '](\.aitk/' docs --include="*.md" 2>/dev/null | wc -l | tr -d ' ')

echo "   修正済み: ${AFTER_AITK}箇所 (../.aitk/)"
echo "   未修正: ${REMAINING_BAD}箇所 (.aitk/)"

if [ "$REMAINING_BAD" -gt 0 ]; then
  echo ""
  echo "⚠️  未修正のリンクが残っています:"
  grep -r '](\.aitk/' docs --include="*.md" | head -5
fi

echo ""
echo "🔍 断線数チェック..."
node scripts/analyze-doc-links.mjs 2>/dev/null | grep '断線リンク:' || echo "   スクリプト実行エラー"

echo ""
echo "✅ 完了"
echo "📦 バックアップ: $BACKUP_DIR"
