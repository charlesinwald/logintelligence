# LogIntelligence Deployment Guide

This guide explains how to use the automated deployment scripts to build, publish, and update LogIntelligence.

## Overview

LogIntelligence provides two deployment workflows:

1. **Full Deployment** - Builds, publishes to npm, and updates globally
2. **Local Deployment** - Builds and updates globally without publishing to npm (for testing)

## Full Deployment (with npm publish)

Use this when you're ready to publish a new version to npm.

### Using npm scripts (recommended):

```bash
# Patch release (bug fixes): 1.0.0 → 1.0.1
npm run deploy

# Minor release (new features): 1.0.0 → 1.1.0
npm run deploy:minor

# Major release (breaking changes): 1.0.0 → 2.0.0
npm run deploy:major
```

### Using the script directly:

```bash
# Patch release
./deploy.sh patch

# Minor release
./deploy.sh minor

# Major release
./deploy.sh major
```

### What it does:

1. ✅ Bumps the version in package.json
2. ✅ Installs all dependencies
3. ✅ Builds the server (TypeScript compilation)
4. ✅ Builds the client (Vite production build)
5. ✅ Runs tests (if available)
6. ✅ Creates npm package tarball
7. ✅ Prompts to publish to npm
8. ✅ Installs the new version globally
9. ✅ Verifies installation
10. ✅ Prompts to commit version bump
11. ✅ Prompts to create git tag
12. ✅ Prompts to push to remote
13. ✅ Cleans up old tarballs

## Local Deployment (no npm publish)

Use this for local development and testing without publishing to npm.

### Using npm scripts (recommended):

```bash
# Deploy without version bump
npm run deploy:local

# Deploy with patch bump
npm run deploy:local:patch

# Deploy with minor bump
npm run deploy:local:minor

# Deploy with major bump
npm run deploy:local:major
```

### Using the script directly:

```bash
# No version bump (default)
./deploy-local.sh skip

# With version bump
./deploy-local.sh patch
./deploy-local.sh minor
./deploy-local.sh major
```

### What it does:

1. ✅ Optionally bumps the version
2. ✅ Installs all dependencies
3. ✅ Builds the server and client
4. ✅ Creates npm package tarball
5. ✅ Installs globally from local tarball
6. ✅ Verifies installation
7. ✅ Cleans up old tarballs

## Version Bumping

Following [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.0 → 1.0.1): Bug fixes, minor changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

## Prerequisites

### For Full Deployment:

1. **npm login**: You must be logged in to npm
   ```bash
   npm login
   ```

2. **npm permissions**: You need publish permissions for the `logintelligence` package

3. **Git**: Clean working directory is recommended

### For Local Deployment:

- No special prerequisites, works offline

## Interactive Prompts

The full deployment script will prompt you to:

1. **Continue with uncommitted changes?** (if git working directory is dirty)
2. **Publish to npm?** - Choose 'n' to skip publishing
3. **Commit version bump?** - Automatically commits package.json changes
4. **Create git tag?** - Tags the commit with version number
5. **Push to remote?** - Pushes commits and tags to git remote

You can skip any of these steps by responding 'n'.

## Example Workflows

### Quick local test:

```bash
# Make some changes
npm run deploy:local
# Test the changes
logintelligence
```

### Release a bug fix:

```bash
# Make bug fixes
npm run deploy
# Follow prompts to publish and push
```

### Release a new feature:

```bash
# Add new feature
npm run deploy:minor
# Follow prompts to publish and push
```

## Troubleshooting

### "Failed to publish to npm"

- Make sure you're logged in: `npm login`
- Check if you have publish permissions
- Verify the version doesn't already exist on npm

### "Permission denied: ./deploy.sh"

Make the script executable:
```bash
chmod +x deploy.sh deploy-local.sh
```

### Global install fails

The script will automatically try installing from the local tarball if npm installation fails.

### Old tarballs accumulating

The scripts automatically clean up old tarballs, keeping only the latest version.

## Post-Deployment

After deployment, verify the installation:

```bash
# Check version
logintelligence --version

# Test setup
logintelligence setup

# Start the dashboard
logintelligence
```

## Manual Deployment

If you prefer manual control:

```bash
# 1. Bump version
npm version patch  # or minor/major

# 2. Build
npm run build

# 3. Publish
npm publish

# 4. Install globally
npm install -g logintelligence@latest
```

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines. For automated deployments:

```bash
# Set npm token
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# Deploy without prompts (would need script modification)
./deploy.sh patch
```

## Files Generated

During deployment, these files are created:

- `logintelligence-{version}.tgz` - npm package tarball (kept for latest version)
- `dist/` - Compiled server code
- `client/dist/` - Built client code

## Support

For issues or questions:
- GitHub Issues: https://github.com/charlesinwald/logintelligence/issues
- Email: charlesinwald@users.noreply.github.com
