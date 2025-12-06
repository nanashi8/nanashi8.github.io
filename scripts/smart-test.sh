#!/bin/bash

# スマート煙テスト
# 変更内容に基づいて必要なテストのみを実行

set -e

echo "🔍 変更ファイルを分析中..."

# 変更されたファイルを取得（コミット前の変更）
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo "")
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
ALL_CHANGES="$CHANGED_FILES $STAGED_FILES"

# 変更がない場合
if [ -z "$ALL_CHANGES" ]; then
  echo "✅ 変更なし - テストスキップ"
  exit 0
fi

echo "📝 変更されたファイル:"
echo "$ALL_CHANGES" | tr ' ' '\n' | grep -v '^$' | sed 's/^/  - /'

# フラグ初期化
RUN_BASIC_TEST=false
RUN_LAYOUT_TEST=false
RUN_STATE_TEST=false

# 変更内容を分析
if echo "$ALL_CHANGES" | grep -qE '\.(tsx?|jsx?)$'; then
  echo "🔵 TypeScript/JSXファイルの変更を検出 - 基本テスト実行"
  RUN_BASIC_TEST=true
fi

if echo "$ALL_CHANGES" | grep -qE '\.(css|scss)$|/QuestionCard\.tsx|/GrammarQuizView\.tsx'; then
  echo "🎨 CSS/レイアウトファイルの変更を検出 - レイアウトテスト実行"
  RUN_LAYOUT_TEST=true
fi

if echo "$ALL_CHANGES" | grep -qE 'useState|useEffect|QuestionCard\.tsx'; then
  echo "⚡ State管理ファイルの変更を検出 - Stateテスト実行"
  RUN_STATE_TEST=true
fi

# データファイルのみの変更はテストスキップ
if echo "$ALL_CHANGES" | grep -qE '^public/data/' && ! echo "$ALL_CHANGES" | grep -qvE '^public/data/'; then
  echo "📊 データファイルのみの変更 - テストスキップ"
  exit 0
fi

# ドキュメントのみの変更はテストスキップ
if echo "$ALL_CHANGES" | grep -qE '\.md$|^docs/' && ! echo "$ALL_CHANGES" | grep -qvE '\.md$|^docs/'; then
  echo "📚 ドキュメントのみの変更 - テストスキップ"
  exit 0
fi

# 少なくとも1つのテストが必要な場合
if [ "$RUN_BASIC_TEST" = false ] && [ "$RUN_LAYOUT_TEST" = false ] && [ "$RUN_STATE_TEST" = false ]; then
  echo "⚠️  変更種別が不明 - 安全のため基本テストを実行"
  RUN_BASIC_TEST=true
fi

# テスト実行（test-runner.shを使用して自動的にサーバー管理）
echo ""
echo "🧪 テスト実行開始..."

if [ "$RUN_BASIC_TEST" = true ]; then
  echo "▶️  基本機能テスト"
  bash scripts/test-runner.sh smoke-fast || exit 1
fi

if [ "$RUN_LAYOUT_TEST" = true ]; then
  echo "▶️  レイアウトテスト"
  npm run test:smoke:full || exit 1
fi

echo ""
echo "✅ すべてのテストが完了しました！"
