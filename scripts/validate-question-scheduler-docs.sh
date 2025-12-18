#!/bin/bash

# ==============================================================================
# QuestionScheduler ドキュメント-実装 整合性検証スクリプト
# ==============================================================================
# 目的: Phase 1-2で作成したドキュメントと実装の整合性を自動検証
# 作成日: 2025-12-19 (Phase 4)
# 実行時間: ~30秒
# ==============================================================================

# set -e を無効化してエラー発生時も続行する

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# カウンター
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    ((WARNINGS++))
}

# ==============================================================================
# Phase 1: ドキュメント存在確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 1: ドキュメント存在確認"
echo "=========================================="

# Phase 1ドキュメント
if [ -f "docs/specifications/QUESTION_SCHEDULER_SPEC.md" ]; then
    LINE_COUNT=$(wc -l < "docs/specifications/QUESTION_SCHEDULER_SPEC.md" | tr -d ' ')
    if [ "$LINE_COUNT" -ge 1000 ]; then
        log_success "QUESTION_SCHEDULER_SPEC.md 存在 ($LINE_COUNT lines)"
    else
        log_error "QUESTION_SCHEDULER_SPEC.md が不完全 ($LINE_COUNT lines < 1000)"
    fi
else
    log_error "QUESTION_SCHEDULER_SPEC.md が存在しません"
fi

if [ -f "docs/references/QUESTION_SCHEDULER_TYPES.md" ]; then
    LINE_COUNT=$(wc -l < "docs/references/QUESTION_SCHEDULER_TYPES.md" | tr -d ' ')
    if [ "$LINE_COUNT" -ge 900 ]; then
        log_success "QUESTION_SCHEDULER_TYPES.md 存在 ($LINE_COUNT lines)"
    else
        log_error "QUESTION_SCHEDULER_TYPES.md が不完全 ($LINE_COUNT lines < 900)"
    fi
else
    log_error "QUESTION_SCHEDULER_TYPES.md が存在しません"
fi

if [ -f "docs/how-to/QUESTION_SCHEDULER_RECOVERY.md" ]; then
    LINE_COUNT=$(wc -l < "docs/how-to/QUESTION_SCHEDULER_RECOVERY.md" | tr -d ' ')
    if [ "$LINE_COUNT" -ge 1000 ]; then
        log_success "QUESTION_SCHEDULER_RECOVERY.md 存在 ($LINE_COUNT lines)"
    else
        log_error "QUESTION_SCHEDULER_RECOVERY.md が不完全 ($LINE_COUNT lines < 1000)"
    fi
else
    log_error "QUESTION_SCHEDULER_RECOVERY.md が存在しません"
fi

# Phase 2ドキュメント
if [ -f "docs/references/QUESTION_SCHEDULER_API.md" ]; then
    LINE_COUNT=$(wc -l < "docs/references/QUESTION_SCHEDULER_API.md" | tr -d ' ')
    if [ "$LINE_COUNT" -ge 400 ]; then
        log_success "QUESTION_SCHEDULER_API.md 存在 ($LINE_COUNT lines)"
    else
        log_error "QUESTION_SCHEDULER_API.md が不完全 ($LINE_COUNT lines < 400)"
    fi
else
    log_error "QUESTION_SCHEDULER_API.md が存在しません"
fi

if [ -f "docs/guidelines/META_AI_INTEGRATION_GUIDE.md" ]; then
    LINE_COUNT=$(wc -l < "docs/guidelines/META_AI_INTEGRATION_GUIDE.md" | tr -d ' ')
    log_success "META_AI_INTEGRATION_GUIDE.md 存在 ($LINE_COUNT lines)"
else
    log_error "META_AI_INTEGRATION_GUIDE.md が存在しません"
fi

if [ -f "docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md" ]; then
    LINE_COUNT=$(wc -l < "docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md" | tr -d ' ')
    if [ "$LINE_COUNT" -ge 600 ]; then
        log_success "DETECTED_SIGNAL_USAGE_GUIDE.md 存在 ($LINE_COUNT lines)"
    else
        log_error "DETECTED_SIGNAL_USAGE_GUIDE.md が不完全 ($LINE_COUNT lines < 600)"
    fi
else
    log_error "DETECTED_SIGNAL_USAGE_GUIDE.md が存在しません"
fi

# ==============================================================================
# Phase 2: 実装ファイル存在確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 2: 実装ファイル存在確認"
echo "=========================================="

if [ -f "src/ai/scheduler/QuestionScheduler.ts" ]; then
    LINE_COUNT=$(wc -l < "src/ai/scheduler/QuestionScheduler.ts" | tr -d ' ')
    if [ "$LINE_COUNT" -ge 700 ]; then
        log_success "QuestionScheduler.ts 存在 ($LINE_COUNT lines)"
    else
        log_warning "QuestionScheduler.ts が短すぎる可能性 ($LINE_COUNT lines < 700)"
    fi
else
    log_error "QuestionScheduler.ts が存在しません"
fi

if [ -f "src/ai/scheduler/types.ts" ]; then
    log_success "types.ts 存在"
else
    log_error "types.ts が存在しません"
fi

# ==============================================================================
# Phase 3: 型定義の整合性確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 3: 型定義の整合性確認"
echo "=========================================="

# ScheduleParams が存在するか
if grep -q "interface ScheduleParams" src/ai/scheduler/types.ts 2>/dev/null; then
    log_success "ScheduleParams インターフェース定義あり"
else
    log_error "ScheduleParams インターフェース定義なし"
fi

# ScheduleResult が存在するか
if grep -q "interface ScheduleResult" src/ai/scheduler/types.ts 2>/dev/null; then
    log_success "ScheduleResult インターフェース定義あり"
else
    log_error "ScheduleResult インターフェース定義なし"
fi

# DetectedSignal が存在するか
if grep -q "interface DetectedSignal" src/ai/scheduler/types.ts 2>/dev/null; then
    log_success "DetectedSignal インターフェース定義あり"
else
    log_error "DetectedSignal インターフェース定義なし"
fi

# DetectedSignal に必須フィールドがあるか
if grep -A 5 "interface DetectedSignal" src/ai/scheduler/types.ts 2>/dev/null | grep -q "type:"; then
    log_success "DetectedSignal.type フィールドあり"
else
    log_error "DetectedSignal.type フィールドなし"
fi

if grep -A 5 "interface DetectedSignal" src/ai/scheduler/types.ts 2>/dev/null | grep -q "confidence:"; then
    log_success "DetectedSignal.confidence フィールドあり"
else
    log_error "DetectedSignal.confidence フィールドなし"
fi

# ==============================================================================
# Phase 4: QuestionScheduler メソッド存在確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 4: QuestionScheduler メソッド確認"
echo "=========================================="

# schedule() メソッド
if grep -q "schedule(params: ScheduleParams)" src/ai/scheduler/QuestionScheduler.ts 2>/dev/null; then
    log_success "schedule() メソッド定義あり"
else
    log_error "schedule() メソッド定義なし"
fi

# buildContext() メソッド
if grep -q "buildContext" src/ai/scheduler/QuestionScheduler.ts 2>/dev/null; then
    log_success "buildContext() メソッド定義あり"
else
    log_error "buildContext() メソッド定義なし"
fi

# detectSignals() メソッド
if grep -q "detectSignals" src/ai/scheduler/QuestionScheduler.ts 2>/dev/null; then
    log_success "detectSignals() メソッド定義あり"
else
    log_error "detectSignals() メソッド定義なし"
fi

# calculatePriorities() メソッド
if grep -q "calculatePriorities" src/ai/scheduler/QuestionScheduler.ts 2>/dev/null; then
    log_success "calculatePriorities() メソッド定義あり"
else
    log_error "calculatePriorities() メソッド定義なし"
fi

# sortAndBalance() メソッド
if grep -q "sortAndBalance" src/ai/scheduler/QuestionScheduler.ts 2>/dev/null; then
    log_success "sortAndBalance() メソッド定義あり"
else
    log_error "sortAndBalance() メソッド定義なし"
fi

# ==============================================================================
# Phase 5: ドキュメント内容の整合性確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 5: ドキュメント内容の整合性確認"
echo "=========================================="

# SPEC.mdにschedule()が記載されているか
if grep -q "schedule(params: ScheduleParams)" docs/specifications/QUESTION_SCHEDULER_SPEC.md 2>/dev/null; then
    log_success "SPEC.md に schedule() メソッド記載あり"
else
    log_error "SPEC.md に schedule() メソッド記載なし"
fi

# TYPES.mdにScheduleParamsが記載されているか
if grep -q "interface ScheduleParams" docs/references/QUESTION_SCHEDULER_TYPES.md 2>/dev/null; then
    log_success "TYPES.md に ScheduleParams 記載あり"
else
    log_error "TYPES.md に ScheduleParams 記載なし"
fi

# API.mdにschedule()の説明があるか
if grep -q "schedule メソッド" docs/references/QUESTION_SCHEDULER_API.md 2>/dev/null; then
    log_success "API.md に schedule() メソッド説明あり"
else
    log_error "API.md に schedule() メソッド説明なし"
fi

# DETECTED_SIGNAL_USAGE_GUIDE.mdに5種のシグナルが記載されているか
SIGNAL_COUNT=0
if grep -q "fatigue" docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md 2>/dev/null; then ((SIGNAL_COUNT++)); fi
if grep -q "struggling" docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md 2>/dev/null; then ((SIGNAL_COUNT++)); fi
if grep -q "overlearning" docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md 2>/dev/null; then ((SIGNAL_COUNT++)); fi
if grep -q "boredom" docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md 2>/dev/null; then ((SIGNAL_COUNT++)); fi
if grep -q "optimal" docs/how-to/DETECTED_SIGNAL_USAGE_GUIDE.md 2>/dev/null; then ((SIGNAL_COUNT++)); fi

if [ "$SIGNAL_COUNT" -eq 5 ]; then
    log_success "DETECTED_SIGNAL_USAGE_GUIDE.md に5種のシグナル記載あり"
else
    log_error "DETECTED_SIGNAL_USAGE_GUIDE.md に5種のシグナル記載不完全 ($SIGNAL_COUNT/5)"
fi

# ==============================================================================
# Phase 6: カテゴリー優先度の整合性確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 6: カテゴリー優先度の整合性確認"
echo "=========================================="

# incorrect優先がドキュメントに記載されているか
if grep -q "incorrect.*最優先" docs/specifications/QUESTION_SCHEDULER_SPEC.md 2>/dev/null; then
    log_success "SPEC.md に incorrect最優先の記載あり"
else
    log_warning "SPEC.md に incorrect最優先の記載が見つかりません"
fi

# categoryボーナスの値がドキュメントに記載されているか
if grep -q "incorrect.*100" docs/specifications/QUESTION_SCHEDULER_SPEC.md 2>/dev/null; then
    log_success "SPEC.md に incorrect優先度値（100）の記載あり"
else
    log_warning "SPEC.md に incorrect優先度値の記載が見つかりません"
fi

# ==============================================================================
# Phase 7: 振動防止の整合性確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 7: 振動防止の整合性確認"
echo "=========================================="

# 振動防止がドキュメントに記載されているか
if grep -q "vibration" docs/specifications/QUESTION_SCHEDULER_SPEC.md 2>/dev/null; then
    log_success "SPEC.md に振動防止の記載あり"
else
    log_error "SPEC.md に振動防止の記載なし"
fi

# 1分ルールがドキュメントに記載されているか
if grep -q "60.*秒" docs/specifications/QUESTION_SCHEDULER_SPEC.md 2>/dev/null || grep -q "1.*分" docs/specifications/QUESTION_SCHEDULER_SPEC.md 2>/dev/null; then
    log_success "SPEC.md に1分ルールの記載あり"
else
    log_warning "SPEC.md に1分ルールの明確な記載が見つかりません"
fi

# ==============================================================================
# Phase 8: instructions ファイル確認
# ==============================================================================

echo ""
echo "=========================================="
echo "Phase 8: instructions ファイル確認"
echo "=========================================="

# meta-ai-priority.instructions.md
if [ -f "$HOME/.aitk/instructions/meta-ai-priority.instructions.md" ]; then
    log_success "meta-ai-priority.instructions.md 存在"

    # Phase 1-2ドキュメントへの参照があるか
    if grep -q "QUESTION_SCHEDULER_SPEC.md" "$HOME/.aitk/instructions/meta-ai-priority.instructions.md" 2>/dev/null; then
        log_success "meta-ai-priority.instructions.md に SPEC.md への参照あり"
    else
        log_warning "meta-ai-priority.instructions.md に SPEC.md への参照なし"
    fi
else
    log_error "meta-ai-priority.instructions.md が存在しません"
fi

# tools.instructions.md
if [ -f "$HOME/.aitk/instructions/tools.instructions.md" ]; then
    log_success "tools.instructions.md 存在"

    # Phase 1-2ドキュメントへの参照があるか
    if grep -q "Phase 1" "$HOME/.aitk/instructions/tools.instructions.md" 2>/dev/null; then
        log_success "tools.instructions.md に Phase 1-2 ドキュメントへの参照あり"
    else
        log_warning "tools.instructions.md に Phase 1-2 への参照なし"
    fi
else
    log_error "tools.instructions.md が存在しません"
fi

# ==============================================================================
# 結果サマリー
# ==============================================================================

echo ""
echo "=========================================="
echo "検証結果サマリー"
echo "=========================================="
echo ""
echo "合計チェック数: $TOTAL_CHECKS"
echo -e "${GREEN}✓ 成功: $PASSED_CHECKS${NC}"
echo -e "${RED}✗ 失敗: $FAILED_CHECKS${NC}"
echo -e "${YELLOW}⚠ 警告: $WARNINGS${NC}"
echo ""

# 整合性スコア計算
if [ "$TOTAL_CHECKS" -gt 0 ]; then
    SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "整合性スコア: $SCORE/100"
    echo ""

    if [ "$SCORE" -ge 95 ]; then
        echo -e "${GREEN}✅ 優秀 (95%以上)${NC}"
        echo "ドキュメントと実装の整合性は非常に高いです。"
    elif [ "$SCORE" -ge 85 ]; then
        echo -e "${BLUE}✓ 良好 (85-94%)${NC}"
        echo "ドキュメントと実装の整合性は良好です。"
    elif [ "$SCORE" -ge 70 ]; then
        echo -e "${YELLOW}⚠ 要改善 (70-84%)${NC}"
        echo "一部のドキュメントまたは実装に問題があります。"
    else
        echo -e "${RED}✗ 不合格 (70%未満)${NC}"
        echo "ドキュメントと実装の整合性に重大な問題があります。"
    fi
    echo ""
fi

# 終了コード
if [ "$FAILED_CHECKS" -eq 0 ]; then
    exit 0
else
    exit 1
fi
