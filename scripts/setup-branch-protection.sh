#!/bin/bash

# GitHub Branch Protection Rules Setup Script
# このスクリプトは GitHub CLI を使用して、main ブランチ保護ルールを設定します

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  GitHub Branch Protection Rules Setup${NC}"
echo "==============================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated to GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q)
echo -e "${GREEN}✓ Repository: ${REPO}${NC}"
echo ""

# Main branch protection rules
echo -e "${YELLOW}Setting up branch protection rules for 'main'...${NC}"
echo ""

# Dismiss stale PR reviews
echo "1️⃣  Dismissing stale PR reviews on new commits..."
gh api repos/{owner}/{repo}/branches/main/protection \
    --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "refactoring-safety-check",
      "safe-deployment/quality-check",
      "safe-deployment/staging-deployment"
    ]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "enforce_admins": true,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false,
  "required_conversation_resolution": true
}
EOF

echo -e "${GREEN}✓ Branch protection rules updated${NC}"
echo ""

# Verify settings
echo -e "${YELLOW}Verifying branch protection settings...${NC}"
echo ""

gh api repos/{owner}/{repo}/branches/main/protection \
    --jq '.required_status_checks.contexts[]' \
    | while read -r context; do
        echo "  ✓ Required check: $context"
    done

echo ""
echo -e "${GREEN}✅ Branch protection setup complete!${NC}"
echo ""
echo "Protected settings:"
echo "  ✓ Require status checks: Yes"
echo "  ✓ Require branches to be up to date: Yes"
echo "  ✓ Require pull request reviews: Yes (1 approval minimum)"
echo "  ✓ Dismiss stale PR reviews: Yes"
echo "  ✓ Require conversation resolution: Yes"
echo "  ✓ Enforce admins: Yes"
echo "  ✓ Allow force pushes: No"
echo "  ✓ Allow deletions: No"
echo ""
echo -e "${BLUE}📋 Branch protection rules active. Developers must:${NC}"
echo "  1. Create a PR (not push directly to main)"
echo "  2. Wait for GitHub Actions tests to pass"
echo "  3. Get 1 approval from a reviewer"
echo "  4. Merge (not rebase)"
echo ""
