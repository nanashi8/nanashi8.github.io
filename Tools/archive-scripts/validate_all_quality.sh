#!/bin/bash
# 全ての品質検証を実行するスクリプト

# エラーで終了しない（全ての検証を実行）
set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "品質検証パイプライン"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. デザインシステム準拠検証
echo "🎨 1/4 デザインシステム準拠検証を実行中..."
echo "   - 22色コアパレット準拠"
echo "   - 6段階タイポグラフィ（12-32px、4pxステップ）"
echo "   - 6段階スペーシング（4-48px）"
python3 "$SCRIPT_DIR/validate_design_system.py"
DESIGN_SYSTEM_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 2. UI仕様書準拠検証
echo "📋 2/4 UI仕様書準拠検証を実行中..."
python3 "$SCRIPT_DIR/validate_ui_specifications.py"
UI_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. 長文タブ フレーズ訳品質検証
echo "📖 3/4 長文タブ フレーズ訳品質検証を実行中..."
python3 "$SCRIPT_DIR/validate_phrase_translations.py"
PHRASE_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 4. 文法・和訳タブ 日本語品質検証
echo "✏️  4/4 文法・和訳タブ 日本語品質検証を実行中..."
python3 "$SCRIPT_DIR/validate_grammar_translations.py"
GRAMMAR_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "最終結果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $DESIGN_SYSTEM_EXIT_CODE -eq 0 ] && [ $UI_EXIT_CODE -eq 0 ] && [ $PHRASE_EXIT_CODE -eq 0 ] && [ $GRAMMAR_EXIT_CODE -eq 0 ]; then
    echo "✅ 全ての検証が成功しました"
    echo ""
    echo "検証項目:"
    echo "  ✓ デザインシステム準拠（22色・6段階タイポグラフィ・6段階スペーシング）"
    echo "  ✓ UI仕様書準拠"
    echo "  ✓ 長文タブ フレーズ訳品質"
    echo "  ✓ 文法・和訳タブ 日本語品質"
    exit 0
else
    echo "❌ 検証に失敗しました"
    
    if [ $DESIGN_SYSTEM_EXIT_CODE -ne 0 ]; then
        echo "  - デザインシステム準拠検証: 失敗"
        echo "    → python3 scripts/fix_hardcoded_colors.py"
        echo "    → python3 scripts/fix_hardcoded_typography.py"
        echo "    → python3 scripts/fix_hardcoded_spacing.py"
    fi
    
    if [ $UI_EXIT_CODE -ne 0 ]; then
        echo "  - UI仕様書準拠検証: 失敗"
    fi
    
    if [ $PHRASE_EXIT_CODE -ne 0 ]; then
        echo "  - 長文タブ フレーズ訳品質検証: 失敗"
    fi
    
    if [ $GRAMMAR_EXIT_CODE -ne 0 ]; then
        echo "  - 文法・和訳タブ 日本語品質検証: 失敗"
    fi
    
    echo ""
    echo "詳細は上記の出力を確認してください。"
    exit 1
fi
