#!/bin/bash

# LogIntelligence Local Deploy Script
# This script builds and updates the package globally without publishing to npm
# Perfect for local development and testing

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Get version bump type (patch, minor, major, or skip)
BUMP_TYPE=${1:-skip}

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major|skip)$ ]]; then
    print_error "Invalid version bump type: $BUMP_TYPE"
    echo "Usage: ./deploy-local.sh [patch|minor|major|skip]"
    echo "  patch - Bug fixes (1.0.0 -> 1.0.1)"
    echo "  minor - New features (1.0.0 -> 1.1.0)"
    echo "  major - Breaking changes (1.0.0 -> 2.0.0)"
    echo "  skip  - Don't bump version (default)"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_step "Current version: $CURRENT_VERSION"

# Bump version if requested
if [[ "$BUMP_TYPE" != "skip" ]]; then
    print_step "Bumping version ($BUMP_TYPE)..."
    npm version $BUMP_TYPE --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
    print_step "New version: $NEW_VERSION"
else
    NEW_VERSION=$CURRENT_VERSION
    print_step "Skipping version bump"
fi

# Install dependencies
print_step "Installing dependencies..."
npm install --silent

print_step "Installing client dependencies..."
cd client && npm install --silent && cd ..

# Build the project
print_step "Building server..."
npm run build:server

print_step "Building client..."
cd client && npm run build && cd ..

# Create npm package
print_step "Creating npm package..."
npm pack

# Install globally from local package
print_step "Installing logintelligence globally from local package..."
npm install -g ./logintelligence-$NEW_VERSION.tgz

# Verify installation
print_step "Verifying installation..."
INSTALLED_VERSION=$(logintelligence --version 2>/dev/null || echo "unknown")
echo -e "Installed version: ${GREEN}$INSTALLED_VERSION${NC}"

# Cleanup old tarballs
print_step "Cleaning up old tarballs..."
find . -maxdepth 1 -name "logintelligence-*.tgz" ! -name "logintelligence-$NEW_VERSION.tgz" -delete

echo ""
print_step "🎉 Local deploy complete!"
echo -e "${GREEN}Version ${NEW_VERSION} is installed globally!${NC}"
echo ""
echo "Quick start:"
echo "  logintelligence setup    # Configure the package"
echo "  logintelligence          # Start the dashboard"
echo ""
