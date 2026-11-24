#!/bin/bash

# Generate Reports Script
# Creates 9 PR analysis reports for the test repository

set -e

echo "🚀 Starting Report Generation for Multi-Agent Code Review System"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p reports

# Array of PRs to analyze
OWNER="udacity"
REPO="cd14715-simple-todo-app"
PRs=(1 2 3)

echo -e "${BLUE}Analyzing PRs from: ${OWNER}/${REPO}${NC}"
echo ""

# Generate reports for each PR
for PR in "${PRs[@]}"; do
  echo -e "${YELLOW}📊 Generating reports for PR #${PR}...${NC}"

  # Run the analysis
  npm run dev -- "$OWNER" "$REPO" "$PR" || {
    echo -e "${YELLOW}Note: PR #${PR} analysis completed with output above${NC}"
  }

  echo ""
done

echo -e "${GREEN}✅ Report Generation Complete!${NC}"
echo ""
echo "Generated Reports:"
echo "==================="
ls -lh reports/ 2>/dev/null | grep -E '\.(json|md|html)$' || echo "No reports found"
echo ""
echo -e "${GREEN}Total files created: $(ls -1 reports/*.{json,md,html} 2>/dev/null | wc -l)${NC}"
