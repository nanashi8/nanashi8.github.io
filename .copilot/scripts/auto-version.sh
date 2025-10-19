#!/bin/bash

# 自動バージョン管理スクリプト
# 使用方法: .copilot/scripts/auto-version.sh [description]

set -e

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 設定ファイル読み込み
CONFIG_FILE=".copilot/auto-version-config.json"

# 現在のブランチを取得
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 現在のブランチ: ${CURRENT_BRANCH}${NC}"

# 変更行数を計算
CHANGED_LINES=$(git diff --cached --numstat | awk '{s+=$1+$2} END {print s}')
if [ -z "$CHANGED_LINES" ]; then
    CHANGED_LINES=$(git diff --numstat | awk '{s+=$1+$2} END {print s}')
fi
echo -e "${BLUE}📊 変更行数: ${CHANGED_LINES}${NC}"

# バージョン番号を決定
determine_version() {
    local base_version="${CURRENT_BRANCH#v}"
    local major=$(echo $base_version | cut -d. -f1)
    local minor=$(echo $base_version | cut -d. -f2)
    local patch=$(echo $base_version | cut -d. -f3 | cut -d_ -f1)
    
    if [ "$CHANGED_LINES" -gt 1000 ]; then
        # メジャーアップデート
        major=$((major + 1))
        minor=0
        patch=0
    elif [ "$CHANGED_LINES" -gt 100 ]; then
        # マイナーアップデート
        minor=$((minor + 1))
        patch=0
    else
        # パッチアップデート
        patch=$((patch + 1))
    fi
    
    echo "v${major}.${minor}.${patch}"
}

NEW_VERSION=$(determine_version)
echo -e "${GREEN}🎯 新しいバージョン: ${NEW_VERSION}${NC}"

# 変更タイプを判断
determine_change_type() {
    local description="$1"
    if [[ "$description" =~ (feature|機能|実装) ]]; then
        echo "feature"
    elif [[ "$description" =~ (fix|bugfix|修正) ]]; then
        echo "bugfix"
    elif [[ "$description" =~ (refactor|リファクタ) ]]; then
        echo "refactor"
    elif [[ "$description" =~ (doc|ドキュメント) ]]; then
        echo "docs"
    else
        echo "feature"
    fi
}

# 説明を取得
DESCRIPTION="${1:-auto-update}"
CHANGE_TYPE=$(determine_change_type "$DESCRIPTION")

# 新しいブランチ名を生成
NEW_BRANCH="${NEW_VERSION}_${CHANGE_TYPE}/${DESCRIPTION}"
echo -e "${BLUE}🌿 新しいブランチ: ${NEW_BRANCH}${NC}"

# ブランチを作成
echo -e "${YELLOW}📝 ブランチを作成中...${NC}"
git checkout -b "$NEW_BRANCH"

# 変更をステージング（まだの場合）
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}📦 変更をステージング中...${NC}"
    git add .
fi

# コミット
echo -e "${YELLOW}💾 コミット中...${NC}"
COMMIT_MSG="feat: ${DESCRIPTION}

変更行数: ${CHANGED_LINES}
変更タイプ: ${CHANGE_TYPE}
バージョン: ${NEW_VERSION}"

git commit -m "$COMMIT_MSG"

# タグを作成
echo -e "${YELLOW}🏷️  タグを作成中...${NC}"
git tag -a "$NEW_VERSION" -m "${NEW_VERSION}: ${DESCRIPTION}"

# バージョンドキュメントを生成
echo -e "${YELLOW}📄 ドキュメントを生成中...${NC}"
VERSION_DOC=".copilot/versions/${NEW_VERSION}-${DESCRIPTION}.md"
cat > "$VERSION_DOC" << EOF
# SimpleWord ${NEW_VERSION}

**日付**: $(date +%Y-%m-%d)
**ブランチ**: ${NEW_BRANCH}
**変更タイプ**: ${CHANGE_TYPE}

---

## 変更内容

${DESCRIPTION}

## 統計

- 変更行数: ${CHANGED_LINES}
- 変更ファイル数: $(git diff --name-only HEAD~1 | wc -l)

## 変更されたファイル

\`\`\`
$(git diff --name-only HEAD~1)
\`\`\`

## コミット情報

- コミットハッシュ: $(git rev-parse --short HEAD)
- コミット日時: $(git log -1 --format=%cd)

---

## 次のステップ

1. [ ] 動作確認
2. [ ] 追加テスト
3. [ ] mainへのマージ準備
EOF

git add "$VERSION_DOC"
git commit --amend --no-edit

# Changelogを更新
echo -e "${YELLOW}📝 Changelogを更新中...${NC}"
CHANGELOG=".copilot/changelog.md"
TEMP_CHANGELOG=$(mktemp)

cat > "$TEMP_CHANGELOG" << EOF
## $(date +%Y-%m-%d): ${NEW_VERSION} - ${DESCRIPTION}

### 変更内容
- 変更行数: ${CHANGED_LINES}
- 変更タイプ: ${CHANGE_TYPE}

### 影響範囲
$(git diff --name-only HEAD~1 | sed 's/^/- /')

---

EOF

cat "$CHANGELOG" >> "$TEMP_CHANGELOG"
mv "$TEMP_CHANGELOG" "$CHANGELOG"

git add "$CHANGELOG"
git commit --amend --no-edit

# ビルドテスト
echo -e "${YELLOW}🔨 ビルドテスト中...${NC}"
BUILD_RESULT="UNKNOWN"
if xcodebuild -project SimpleWord.xcodeproj -scheme SimpleWord -destination 'platform=iOS Simulator,name=iPhone 17' build > /dev/null 2>&1; then
    BUILD_RESULT="✅ BUILD SUCCEEDED"
    echo -e "${GREEN}${BUILD_RESULT}${NC}"
else
    BUILD_RESULT="❌ BUILD FAILED"
    echo -e "${RED}${BUILD_RESULT}${NC}"
fi

# レポート生成
echo -e "${GREEN}📊 バージョン管理完了！${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}  バージョン管理完了レポート${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "✅ ブランチ作成: ${GREEN}${NEW_BRANCH}${NC}"
echo -e "✅ コミット作成: ${GREEN}$(git rev-parse --short HEAD)${NC}"
echo -e "✅ タグ作成: ${GREEN}${NEW_VERSION}${NC}"
echo -e "✅ ドキュメント生成: ${GREEN}${VERSION_DOC}${NC}"
echo -e "✅ Changelog更新: ${GREEN}完了${NC}"
echo -e "✅ ビルドテスト: ${BUILD_RESULT}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo "1. 動作確認を行う"
echo "2. 必要に応じて追加テストを実行"
echo "3. mainブランチへのマージを検討"
echo ""
echo -e "${BLUE}現在のブランチ: ${NEW_BRANCH}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
