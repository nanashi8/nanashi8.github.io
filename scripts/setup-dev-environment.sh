#!/bin/bash
# Development Environment Setup Script
# Run this after cloning the repository

set -e

echo "🚀 Setting up development environment..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js $NODE_VERSION installed"
    
    if [ -f ".nvmrc" ]; then
        REQUIRED_VERSION=$(cat .nvmrc)
        echo "ℹ️  Required version: v$REQUIRED_VERSION"
        if command -v nvm &> /dev/null; then
            echo "   Run 'nvm use' to switch to the correct version"
        fi
    fi
else
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 20.11.0 or use nvm"
    exit 1
fi
echo ""

# Install dependencies
echo "📥 Installing npm dependencies..."
cd nanashi8.github.io
npm install
echo "✅ Dependencies installed"
echo ""

# Setup Husky
echo "🪝 Setting up Git hooks..."
npx husky install
npx husky add .husky/pre-commit "cd nanashi8.github.io && npx lint-staged"
chmod +x .husky/pre-commit
echo "✅ Git hooks configured"
echo ""

# Type check
echo "🔍 Running TypeScript type check..."
npm run type-check
echo "✅ Type check passed"
echo ""

# Lint check
echo "🧹 Running ESLint..."
npm run lint
echo "✅ Linting passed"
echo ""

# Format check
echo "💅 Checking code formatting..."
npm run format:check
echo "✅ Formatting check passed"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test -- --run
echo "✅ Tests passed"
echo ""

# Python validation (optional)
echo "🐍 Python validation scripts..."
cd ..
if command -v python3 &> /dev/null; then
    echo "   Available Python scripts:"
    echo "   - python3 scripts/validate_all_content.py"
    echo "   - python3 scripts/validate_design_system.py"
    echo "   - python3 scripts/validate_naming_conventions.py"
else
    echo "⚠️  Python 3 not found (optional for data validation)"
fi
echo ""

echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Start dev server:  npm run dev"
echo "   2. Run tests:         npm test"
echo "   3. Build:             npm run build"
echo "   4. See docs/4-development/setup/DEVELOPMENT_SETUP_GUIDE.md"
echo ""
