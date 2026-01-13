#!/bin/bash
# Project Boundary Violation Detector
# プロジェクト境界外への誤配置ファイルを検出

set -e

PARENT_DIR="/Users/yuichinakamura/Documents/nanashi8-github-io-git"
PROJECT_DIR="$PARENT_DIR/nanashi8.github.io"

echo "🔍 プロジェクト境界チェック開始..."
echo ""

# プロジェクトルートにいることを確認
if [ "$PWD" != "$PROJECT_DIR" ]; then
    echo "⚠️  警告: プロジェクトルート外で実行されています"
    echo "   現在: $PWD"
    echo "   期待: $PROJECT_DIR"
    echo ""
fi

# 親ディレクトリの不要ファイルをチェック
cd "$PARENT_DIR"

VIOLATIONS=0

echo "📁 親ディレクトリの状態:"
echo "---"

# 許可されたファイル・フォルダ
ALLOWED_ITEMS=(
    ".venv"
    ".git"
    ".DS_Store"
    "nanashi8.github.io"
    "nanashi8.github.io.code-workspace"
)

# 全アイテムをチェック
for item in .[^.]* *; do
    # 存在チェック
    [ -e "$item" ] || continue
    
    # 許可リストにあるかチェック
    is_allowed=false
    for allowed in "${ALLOWED_ITEMS[@]}"; do
        if [ "$item" = "$allowed" ]; then
            is_allowed=true
            break
        fi
    done
    
    if [ "$is_allowed" = false ]; then
        echo "❌ 誤配置: $item"
        VIOLATIONS=$((VIOLATIONS + 1))
        
        # サイズと最終更新日を表示
        if [ -d "$item" ]; then
            SIZE=$(du -sh "$item" 2>/dev/null | cut -f1)
            echo "   タイプ: ディレクトリ"
            echo "   サイズ: $SIZE"
        else
            SIZE=$(ls -lh "$item" 2>/dev/null | awk '{print $5}')
            echo "   タイプ: ファイル"
            echo "   サイズ: $SIZE"
        fi
        
        MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$item" 2>/dev/null)
        echo "   更新: $MODIFIED"
        echo ""
    fi
done

if [ $VIOLATIONS -eq 0 ]; then
    echo "✅ 誤配置ファイルなし - プロジェクト境界は正常です"
    echo ""
else
    echo "---"
    echo "🚨 $VIOLATIONS 個の誤配置を検出しました"
    echo ""
    echo "修正方法:"
    echo "  1. プロジェクト内に移動すべきか確認"
    echo "  2. 不要なら削除"
    echo "  3. 削除コマンド例: rm -rf [ファイル名]"
    echo ""
    exit 1
fi

# プロジェクト内の重要フォルダが存在するか確認
echo "📂 プロジェクト内の重要フォルダ:"
cd "$PROJECT_DIR"

REQUIRED_DIRS=(
    "src"
    "public"
    "docs"
    "scripts"
    "tests"
    "config"
    ".aitk"
    ".github"
    ".vscode"
)

MISSING=0
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✓ $dir"
    else
        echo "   ✗ $dir (存在しません)"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo ""
    echo "⚠️  $MISSING 個の重要フォルダが見つかりません"
    exit 1
fi

echo ""
echo "✅ プロジェクト境界チェック完了"
