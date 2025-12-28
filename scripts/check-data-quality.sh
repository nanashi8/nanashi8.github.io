#!/usr/bin/env bash

# Data quality check entrypoint.
#
# NOTE:
# - pre-commit hook expects this script to exist (npm run check:data-quality)
# - It must emit summary lines containing "🔴 エラー:" and "🟡 警告:" so the hook can parse counts.
# - The underlying checker implementation currently lives in scripts/archive/.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ nodeが見つかりません"
  exit 1
fi

CHECKER="$PROJECT_ROOT/scripts/data-quality-check.mjs"
if [ ! -f "$CHECKER" ]; then
  echo "❌ データ品質チェッカーが見つかりません: scripts/data-quality-check.mjs"
  exit 1
fi

node "$CHECKER"

# Report path (written by the checker): scripts/output/data-quality-report.txt
