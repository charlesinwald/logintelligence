# 📦 Publishing Guide

This guide covers how to publish `logintelligence` to npm, both for the initial release and future updates.

## Prerequisites

### 1. npm Account
- Create an account at [npmjs.com](https://www.npmjs.com/)
- Verify your email address
- (Optional) Set up 2FA for security

### 2. npm Authentication
Log in to npm on your local machine:
```bash
npm login
```

### 3. Package Name Availability
Check if the package name is available:
```bash
npm search logintelligence
```

If taken, update the `name` field in `package.json`.

## First-Time Setup

### 1. Update Package Metadata

Edit `package.json` and update these fields:

```json
{
  "name": "logintelligence",
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/charlesinwald/logintelligence.git"
  },
  "bugs": {
    "url": "https://github.com/charlesinwald/logintelligence/issues"
  },
  "homepage": "https://github.com/charlesinwald/logintelligence#readme"
}
```

### 2. Build the Client

Before publishing, build the React client:

```bash
cd client
yarn install
yarn build
cd ..
```

The build creates `client/dist/` which will be included in the npm package.

### 3. Test Locally

Test the package installation locally:

```bash
# Create a test package
npm pack

# This creates logintelligence-1.0.0.tgz
# Install it globally to test
npm install -g ./logintelligence-1.0.0.tgz

# Test the CLI
logintelligence setup
logintelligence --help
logintelligence --version

# Uninstall when done testing
npm uninstall -g logintelligence
```

## Publishing to npm

### Manual Publishing

#### 1. Version Bump

Update the version in `package.json` following [semver](https://semver.org/):

- **Patch** (1.0.0 → 1.0.1): Bug fixes
  ```bash
  npm version patch
  ```

- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
  ```bash
  npm version minor
  ```

- **Major** (1.0.0 → 2.0.0): Breaking changes
  ```bash
  npm version major
  ```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

#### 2. Push Changes

```bash
git push origin main
git push origin --tags
```

#### 3. Publish

```bash
# Dry run to see what will be published
npm publish --dry-run

# Actually publish
npm publish --access public
```

The `--access public` flag is required for scoped packages (like `@yourname/logintelligence`) or if you want the package to be public.

#### 4. Verify Publication

```bash
# Check on npm
npm view logintelligence

# Test installation
npm install -g logintelligence
```

### Automated Publishing with GitHub Actions

We've set up a GitHub Action that automatically publishes to npm when you create a release.

#### Setup GitHub Secrets

1. Get your npm access token:
   ```bash
   npm token create
   ```

2. Add it to GitHub:
   - Go to your repository on GitHub
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token

#### Create a Release

1. **Via GitHub UI:**
   - Go to your repository
   - Click "Releases" → "Create a new release"
   - Choose or create a tag (e.g., `v1.0.0`)
   - Title: `v1.0.0`
   - Description: Release notes
   - Click "Publish release"

2. **Via Command Line:**
   ```bash
   # Create and push a tag
   git tag v1.0.0
   git push origin v1.0.0

   # Then create a release on GitHub using gh CLI
   gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
   ```

The GitHub Action will:
- Build the client
- Run tests (if configured)
- Publish to npm

## Publishing Updates

### Quick Update Workflow

1. Make your changes and commit them

2. Bump the version:
   ```bash
   npm version patch  # or minor/major
   ```

3. Build the client:
   ```bash
   cd client && yarn build && cd ..
   ```

4. Push changes:
   ```bash
   git push origin main --tags
   ```

5. Publish:
   ```bash
   npm publish
   ```

### Using the Automated Workflow

1. Update version in `package.json`

2. Commit and push:
   ```bash
   git add package.json
   git commit -m "Bump version to 1.0.1"
   git push origin main
   ```

3. Create a release on GitHub (this triggers auto-publish)

## Pre-publish Checklist

Before each release, verify:

- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated (if you maintain one)
- [ ] Client built (`cd client && yarn build`)
- [ ] README.md up to date
- [ ] All tests passing
- [ ] `.npmignore` configured correctly
- [ ] Dependencies up to date
- [ ] Git committed and pushed
- [ ] Tag created (for automated workflow)

## What Gets Published

The npm package includes:

✅ **Included:**
- `server/` - Backend code
- `client/dist/` - Built React app
- `scripts/` - Utility scripts
- `bin/` - CLI executables
- `lib/` - Shared libraries
- `package.json`
- `README.md`
- `LICENSE`

❌ **Excluded** (via `.npmignore`):
- `client/src/` - React source code
- `client/node_modules/`
- `.env` files
- Development configs
- `.git/`
- Test files
- Documentation (QUICKSTART.md, etc.)

## Troubleshooting

### "You do not have permission to publish"
- Make sure you're logged in: `npm whoami`
- Check package name isn't taken
- Ensure you have publish rights

### "Package name too similar to existing package"
- Choose a different name
- Or use a scoped package: `@yourname/logintelligence`

### "prepublishOnly script failed"
- The client build failed
- Check `cd client && yarn build` runs successfully
- Ensure all client dependencies are installed

### Large Package Size
```bash
# Check what's in the package
npm pack --dry-run

# Check package size
npm pack
ls -lh logintelligence-*.tgz
```

If too large, update `.npmignore` to exclude unnecessary files.

## Best Practices

1. **Semantic Versioning**: Follow semver strictly
2. **Changelog**: Maintain a CHANGELOG.md
3. **Test Before Publishing**: Always test with `npm pack`
4. **Tag Releases**: Create git tags for all releases
5. **Release Notes**: Write clear release notes
6. **Deprecation**: Use `npm deprecate` for old versions if needed
7. **Security**: Enable 2FA on your npm account

## Common Commands

```bash
# View package info
npm view logintelligence

# View all versions
npm view logintelligence versions

# Deprecate a version
npm deprecate logintelligence@1.0.0 "This version has a critical bug"

# Unpublish (within 72 hours only, not recommended)
npm unpublish logintelligence@1.0.0

# Update README without version bump
npm publish --access public
```

## After Publishing

1. **Test Installation:**
   ```bash
   npm install -g logintelligence
   logintelligence --version
   ```

2. **Update Documentation:**
   - Update README with npm install instructions
   - Tweet/announce the release
   - Update project website

3. **Monitor:**
   - Check [npm package page](https://www.npmjs.com/package/logintelligence)
   - Monitor download stats
   - Watch for issues on GitHub

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm version command](https://docs.npmjs.com/cli/v8/commands/npm-version)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

**Ready to publish? Follow the checklist above and ship it! 🚀**
