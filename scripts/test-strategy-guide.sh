#!/bin/bash

# テスト戦略ガイド（自動実行）
# コミット時に適切なテスト方針をガイド

echo ""
echo "📋 テスト戦略チェック"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 変更ファイルの種類を判定
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# カテゴリ別ファイル数を集計
UTIL_FILES=$(echo "$CHANGED_FILES" | grep -E 'src/utils/.*\.(ts|tsx)$' | wc -l)
HOOK_FILES=$(echo "$CHANGED_FILES" | grep -E 'src/hooks/.*\.(ts|tsx)$' | wc -l)
COMPONENT_FILES=$(echo "$CHANGED_FILES" | grep -E 'src/components/.*\.(tsx)$' | wc -l)
TEST_FILES=$(echo "$CHANGED_FILES" | grep -E 'tests/.*\.(test|spec)\.(ts|tsx)$' | wc -l)
CORE_LOGIC=$(echo "$CHANGED_FILES" | grep -E 'src/(ai|features|storage)/.*\.(ts|tsx)$' | wc -l)

# テスト戦略の推奨を表示
NEEDS_ATTENTION=0

if [ "$UTIL_FILES" -gt 0 ] && [ "$TEST_FILES" -eq 0 ]; then
  echo ""
  echo "🎯 ユーティリティ関数が変更されました ($UTIL_FILES ファイル)"
  echo "   推奨: TDD（テストファースト）で実装"
  echo "   目標カバレッジ: 100%"
  echo ""
  echo "   例: tests/unit/utils/yourUtil.test.ts"
  echo "   ✓ 関数ごとに個別のテストファイル作成"
  echo "   ✓ エッジケース（空配列、null、undefinedなど）を網羅"
  NEEDS_ATTENTION=1
fi

if [ "$CORE_LOGIC" -gt 0 ] && [ "$TEST_FILES" -eq 0 ]; then
  echo ""
  echo "🔴 コアロジックが変更されました ($CORE_LOGIC ファイル)"
  echo "   必須: TDD（Red-Green-Refactor）推奨"
  echo "   目標カバレッジ: 90%以上"
  echo ""
  echo "   重要なロジックは必ずテストを追加してください:"
  echo "   - スペルチェックアルゴリズム"
  echo "   - スコア計算"
  echo "   - 復習スケジューリング"
  echo "   - データ変換・バリデーション"
  NEEDS_ATTENTION=1
fi

if [ "$HOOK_FILES" -gt 0 ] && [ "$TEST_FILES" -eq 0 ]; then
  echo ""
  echo "⚡ React Hooksが変更されました ($HOOK_FILES ファイル)"
  echo "   推奨: テスト追加"
  echo "   目標カバレッジ: 80%"
  echo ""
  echo "   @testing-library/react-hooks を使用"
  echo "   状態管理のロジックをテスト"
  NEEDS_ATTENTION=1
fi

if [ "$COMPONENT_FILES" -gt 0 ] && [ "$TEST_FILES" -eq 0 ]; then
  echo ""
  echo "📦 UIコンポーネントが変更されました ($COMPONENT_FILES ファイル)"
  echo "   推奨: E2Eテスト（Playwright）で十分"
  echo "   目標カバレッジ: 60%"
  echo ""
  echo "   ユニットテストは必須ではありませんが、以下は推奨:"
  echo "   - 複雑な条件分岐"
  echo "   - イベントハンドラのロジック"
fi

# バグ修正の検出
COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
  COMMIT_MSG=$(cat "$COMMIT_MSG_FILE" 2>/dev/null || echo "")
  if echo "$COMMIT_MSG" | grep -qiE '(fix|bug|issue|#[0-9]+)'; then
    echo ""
    echo "🐛 バグ修正のコミットです"
    echo "   必須: テストファースト（バグ再現テスト）"
    echo ""
    echo "   手順:"
    echo "   1. バグを再現するテストを書く（失敗を確認）"
    echo "   2. コードを修正"
    echo "   3. テストが通ることを確認"
    echo "   4. リグレッション防止完了✅"
    NEEDS_ATTENTION=1
  fi
fi

# テストファイルがある場合は称賛
if [ "$TEST_FILES" -gt 0 ]; then
  echo ""
  echo "✅ テストファイルが含まれています！($TEST_FILES ファイル)"
  echo "   素晴らしい！テストカバレッジを確認:"
  echo "   npm run test:unit:coverage"
fi

# カバレッジチェック（参考情報）
if [ "$NEEDS_ATTENTION" -eq 1 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💡 テストを追加する場合:"
  echo ""
  echo "   # テストファイル作成"
  echo "   touch tests/unit/yourFeature.test.ts"
  echo ""
  echo "   # ウォッチモードで開発"
  echo "   npm run test:unit:watch"
  echo ""
  echo "   # カバレッジ確認"
  echo "   npm run test:unit:coverage"
  echo ""
  echo "ℹ️  テストは推奨ですが、コミットはブロックしません"
  echo "   チーム方針に従ってください"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 常に成功（コミットをブロックしない）
exit 0
