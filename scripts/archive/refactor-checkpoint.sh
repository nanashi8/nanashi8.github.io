#!/bin/bash
# Refactoring checkpoint script
# リファクタリングの各ステップ前後で実行する安全確認

set -e

CHECKPOINT_DIR=".git/refactoring-checkpoints"
mkdir -p "$CHECKPOINT_DIR"

# コマンドライン引数から操作を取得
OPERATION=${1:-"save"}
PHASE_NAME=${2:-"unnamed"}

case "$OPERATION" in
    save)
        echo "📸 Creating refactoring checkpoint: $PHASE_NAME"
        
        TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
        CHECKPOINT_FILE="$CHECKPOINT_DIR/${PHASE_NAME}-${TIMESTAMP}.json"
        
        # 現在の状態を記録
        cat > "$CHECKPOINT_FILE" << EOF
{
  "phase": "$PHASE_NAME",
  "timestamp": "$TIMESTAMP",
  "commit": "$(git rev-parse HEAD)",
  "branch": "$(git symbolic-ref --short HEAD 2>/dev/null || echo 'detached')",
  "src_file_count": $(find src -type f 2>/dev/null | wc -l | tr -d ' '),
  "components_count": $(find src/components -type f 2>/dev/null | wc -l | tr -d ' '),
  "hooks_count": $(find src/hooks -type f 2>/dev/null | wc -l | tr -d ' ' || echo 0),
  "features_count": $(find src/features -type f 2>/dev/null | wc -l | tr -d ' ' || echo 0),
  "build_status": "$(npm run build > /dev/null 2>&1 && echo 'success' || echo 'failed')"
}
EOF
        
        # バックアップタグも作成
        TAG_NAME="checkpoint/${PHASE_NAME}-${TIMESTAMP}"
        git tag -f "$TAG_NAME" HEAD 2>/dev/null || true
        
        echo "✅ Checkpoint saved:"
        echo "   File: $CHECKPOINT_FILE"
        echo "   Tag: $TAG_NAME"
        echo "   Commit: $(git rev-parse --short HEAD)"
        cat "$CHECKPOINT_FILE" | grep -E '(phase|src_file_count|build_status)' | sed 's/^/   /'
        ;;
        
    compare)
        echo "📊 Comparing with previous checkpoint..."
        
        if [ ! -d "$CHECKPOINT_DIR" ] || [ -z "$(ls -A $CHECKPOINT_DIR 2>/dev/null)" ]; then
            echo "⚠️  No previous checkpoints found"
            exit 0
        fi
        
        LATEST_CHECKPOINT=$(ls -t "$CHECKPOINT_DIR"/*.json 2>/dev/null | head -1)
        if [ -z "$LATEST_CHECKPOINT" ]; then
            echo "⚠️  No checkpoint files found"
            exit 0
        fi
        
        echo "Latest checkpoint: $(basename $LATEST_CHECKPOINT)"
        
        PREV_COUNT=$(grep '"src_file_count"' "$LATEST_CHECKPOINT" | grep -o '[0-9]*')
        CURR_COUNT=$(find src -type f 2>/dev/null | wc -l | tr -d ' ')
        DIFF=$((CURR_COUNT - PREV_COUNT))
        
        echo ""
        echo "File count comparison:"
        echo "  Previous: $PREV_COUNT files"
        echo "  Current:  $CURR_COUNT files"
        echo "  Change:   ${DIFF:+$DIFF} files"
        
        if [ "$DIFF" -lt -20 ]; then
            echo ""
            echo "⚠️  WARNING: Large decrease in file count ($DIFF)"
            echo "   This might indicate accidental deletion"
            echo "   Review changes carefully before proceeding"
        fi
        ;;
        
    restore)
        echo "🔄 Restoring from checkpoint..."
        
        if [ -z "$PHASE_NAME" ]; then
            echo "❌ Usage: $0 restore <checkpoint-name>"
            echo ""
            echo "Available checkpoints:"
            ls -1 "$CHECKPOINT_DIR"/*.json 2>/dev/null | xargs -n1 basename | sed 's/\.json$//' || echo "  (none)"
            exit 1
        fi
        
        CHECKPOINT_FILE=$(ls -t "$CHECKPOINT_DIR/${PHASE_NAME}"*.json 2>/dev/null | head -1)
        if [ -z "$CHECKPOINT_FILE" ]; then
            echo "❌ Checkpoint not found: $PHASE_NAME"
            exit 1
        fi
        
        COMMIT_HASH=$(grep '"commit"' "$CHECKPOINT_FILE" | grep -o '[a-f0-9]\{40\}')
        
        echo "Restoring to commit: $COMMIT_HASH"
        git reset --hard "$COMMIT_HASH"
        
        echo "✅ Restored successfully"
        ;;
        
    list)
        echo "📋 Available checkpoints:"
        
        if [ ! -d "$CHECKPOINT_DIR" ] || [ -z "$(ls -A $CHECKPOINT_DIR 2>/dev/null)" ]; then
            echo "  (none)"
            exit 0
        fi
        
        for checkpoint in $(ls -t "$CHECKPOINT_DIR"/*.json 2>/dev/null); do
            PHASE=$(grep '"phase"' "$checkpoint" | cut -d'"' -f4)
            TIMESTAMP=$(grep '"timestamp"' "$checkpoint" | cut -d'"' -f4)
            FILES=$(grep '"src_file_count"' "$checkpoint" | grep -o '[0-9]*')
            BUILD=$(grep '"build_status"' "$checkpoint" | cut -d'"' -f4)
            
            echo "  [$TIMESTAMP] $PHASE"
            echo "    Files: $FILES | Build: $BUILD"
        done
        ;;
        
    *)
        echo "Usage: $0 {save|compare|restore|list} [phase-name]"
        echo ""
        echo "Commands:"
        echo "  save <name>    - Create checkpoint before refactoring"
        echo "  compare        - Compare current state with last checkpoint"
        echo "  restore <name> - Restore to checkpoint"
        echo "  list           - List all checkpoints"
        echo ""
        echo "Example workflow:"
        echo "  $0 save phase2-start"
        echo "  # ... make changes ..."
        echo "  $0 compare"
        echo "  git commit -m 'refactor: phase 2 complete'"
        echo "  $0 save phase2-complete"
        exit 1
        ;;
esac
