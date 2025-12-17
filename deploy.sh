#!/bin/bash

# LogIntelligence Deploy Script
# This script builds, publishes to npm, and updates the package globally

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

# Get version bump type (patch, minor, or major)
BUMP_TYPE=${1:-patch}

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Invalid version bump type: $BUMP_TYPE"
    echo "Usage: ./deploy.sh [patch|minor|major]"
    echo "  patch - Bug fixes (1.0.0 -> 1.0.1)"
    echo "  minor - New features (1.0.0 -> 1.1.0)"
    echo "  major - Breaking changes (1.0.0 -> 2.0.0)"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_step "Current version: $CURRENT_VERSION"

# Check if working directory is clean
if [[ -n $(git status -s) ]]; then
    print_warning "Working directory has uncommitted changes"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Bump version
print_step "Bumping version ($BUMP_TYPE)..."
npm version $BUMP_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
print_step "New version: $NEW_VERSION"

# Install dependencies
print_step "Installing root dependencies..."
npm install

print_step "Installing client dependencies..."
cd client && npm install && cd ..

# Build the project
print_step "Building server..."
npm run build:server

print_step "Building client..."
cd client && npm run build && cd ..

# Run tests if they exist
if grep -q "\"test\":" package.json; then
    print_step "Running tests..."
    npm test || {
        print_error "Tests failed!"
        exit 1
    }
fi

# Create npm package
print_step "Creating npm package..."
npm pack

# Publish to npm
print_step "Publishing to npm..."
read -p "Do you want to publish to npm? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm publish || {
        print_error "Failed to publish to npm!"
        print_warning "You may need to run 'npm login' first"
        exit 1
    }
    print_step "Successfully published v$NEW_VERSION to npm!"

    # Wait a few seconds for npm to propagate the package
    print_step "Waiting for npm to propagate the package..."
    sleep 5
else
    print_warning "Skipping npm publish"
fi

# Install/Update globally
print_step "Installing logintelligence globally..."
npm install -g logintelligence@$NEW_VERSION || {
    print_warning "Global install failed, trying with local package..."
    npm install -g ./logintelligence-$NEW_VERSION.tgz
}

# Verify installation
print_step "Verifying installation..."
INSTALLED_VERSION=$(logintelligence --version 2>/dev/null || echo "unknown")
echo -e "Installed version: ${GREEN}$INSTALLED_VERSION${NC}"

# Commit version bump
read -p "Do you want to commit the version bump? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add package.json package-lock.json
    git commit -m "Bump version to $NEW_VERSION"

    read -p "Do you want to create a git tag? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"
        print_step "Created git tag v$NEW_VERSION"

        read -p "Do you want to push to remote? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push && git push --tags
            print_step "Pushed to remote with tags"
        fi
    fi
fi

# Cleanup
print_step "Cleaning up old tarballs..."
find . -maxdepth 1 -name "logintelligence-*.tgz" ! -name "logintelligence-$NEW_VERSION.tgz" -delete

echo ""
print_step "🎉 Deploy complete!"
echo -e "${GREEN}Version ${NEW_VERSION} is ready to use!${NC}"
echo ""
echo "Quick start:"
echo "  logintelligence setup    # Configure the package"
echo "  logintelligence          # Start the dashboard"
echo ""
