#!/bin/bash
# ファイル混入の復元スクリプト
# 作成日: 2025年10月24日

echo "========================================="
echo "ファイル混入の復元を開始します"
echo "========================================="
echo ""

# プロジェクトルートに移動
cd "$(dirname "$0")/.." || exit 1

# 1. QuizView.swiftの復元
echo "1. QuizView.swiftを復元しています..."
if git restore SimpleWord/Features/Quiz/Views/QuizView.swift; then
    echo "   ✅ QuizView.swift 復元完了"
else
    echo "   ❌ QuizView.swift 復元失敗"
    echo "   手動で復元してください: git restore SimpleWord/Features/Quiz/Views/QuizView.swift"
fi
echo ""

# 2. README.mdの復元
echo "2. README.mdを復元しています..."
if [ -f "README_RECOVERED.md" ]; then
    cp README_RECOVERED.md README.md
    echo "   ✅ README.md 復元完了"
else
    echo "   ❌ README_RECOVERED.md が見つかりません"
    echo "   手動で復元してください"
fi
echo ""

# 3. 状態確認
echo "3. 復元後の状態を確認..."
echo ""
echo "--- Git ステータス ---"
git status --short
echo ""

# 4. 差分確認（オプション）
echo "========================================="
echo "復元が完了しました"
echo "========================================="
echo ""
echo "次のステップ:"
echo "  1. 復元された内容を確認: git diff"
echo "  2. 問題なければコミット: git add . && git commit -m 'fix: ファイル混入を修正'"
echo "  3. README_RECOVERED.mdを削除（オプション）: rm README_RECOVERED.md"
echo ""
