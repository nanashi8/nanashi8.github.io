#!/bin/sh
#
# Pre-commit hook: AI修正前のガードチェック
#
# このフックは以下を自動実行:
# 1. AI失敗履歴から類似パターン検索
# 2. 危険な変更パターンの検出
# 3. 関連仕様書の提示
#
# インストール方法:
#   ln -sf ../../scripts/pre-commit-ai-guard.sh .git/hooks/pre-commit

set -e

echo ""
echo "🛡️  サーバント水先案内人: Pre-commit ガードチェック"
echo ""

# 変更されたファイルを取得
CHANGED_FILES=${AI_GUARD_CHANGED_FILES:-$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)}

# テストや検証用にstaged diffを注入できるようにする
DIFF_CONTENT=${AI_GUARD_DIFF:-$(git diff --cached)}

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ 変更ファイルなし - スキップ"
  exit 0
fi

echo "📁 変更ファイル:"
echo "$CHANGED_FILES" | sed 's/^/   - /'
echo ""

# 危険なパターンをチェック
echo "⚠️  危険なパターンをチェック中..."
echo ""

DANGEROUS_PATTERNS_FOUND=0

# バッチ方式関連の変更
if echo "$CHANGED_FILES" | grep -qE "(MemorizationView|QuestionScheduler)"; then
  # バッチ配列の変更を検出
  if printf "%s\n" "$DIFF_CONTENT" | grep -qE "questions\.(sort|splice|push|unshift|reverse)"; then
    echo "🚨 [CRITICAL] バッチ配列の変更を検出！"
    echo "   - バッチ確定後は配列を変更してはいけません"
    echo "   - 確認: .aitk/instructions/batch-system-enforcement.instructions.md"
    echo ""
    DANGEROUS_PATTERNS_FOUND=1
  fi

  # clearExpiredFlagsの使用を検出
  if printf "%s\n" "$DIFF_CONTENT" | grep -qE "clearExpiredFlags"; then
    echo "🚨 [CRITICAL] clearExpiredFlags使用を検出！"
    echo "   - useCategorySlots=true時は無効化する必要があります"
    echo "   - 確認: .aitk/instructions/batch-system-enforcement.instructions.md"
    echo ""
    DANGEROUS_PATTERNS_FOUND=1
  fi

  # 再スケジューリングの使用を検出
  if printf "%s\n" "$DIFF_CONTENT" | grep -qE "(reSchedule|reschedule|再スケジュール)"; then
    echo "🚨 [CRITICAL] 再スケジューリング使用を検出！"
    echo "   - バッチ方式では再スケジューリングは禁止です"
    echo "   - 確認: .aitk/instructions/batch-system-enforcement.instructions.md"
    echo ""
    DANGEROUS_PATTERNS_FOUND=1
  fi
fi

# useEffect依存配列の変更
if printf "%s\n" "$DIFF_CONTENT" | grep -qE "useEffect.*\["; then
  echo "⚠️  [HIGH] useEffect依存配列の変更を検出"
  echo "   - 無限ループの危険性があります"
  echo "   - state更新とuseEffect実行の因果関係を確認してください"
  echo ""
fi

# 型定義関連
if printf "%s\n" "$DIFF_CONTENT" | grep -E "(correctCount|incorrectCount|attemptCount)" | grep -qv "memorizationCorrect\|memorizationAttempts"; then
  echo "⚠️  [MEDIUM] 古いプロパティ名の可能性"
  echo "   - 型定義ファイルを確認してください"
  echo "   - 正: memorizationCorrect, memorizationAttempts"
  echo ""
fi

if [ $DANGEROUS_PATTERNS_FOUND -eq 1 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ CRITICAL: 危険なパターンが検出されました"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "修正を続行する前に、以下を確認してください:"
  echo ""
  echo "1. .aitk/instructions/batch-system-enforcement.instructions.md"
  echo "2. .aitk/instructions/ai-failure-prevention.instructions.md"
  echo ""
  echo "それでも続行する場合:"
  echo "   git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ ガードチェック完了"
echo ""

exit 0
