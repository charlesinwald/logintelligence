# 🚀 Quick Start: Publishing to npm

This guide will help you publish `logintelligence` to npm in minutes.

## ✅ Pre-Publishing Checklist

Before publishing, complete these steps:

### 1. Update Package Metadata

Edit `package.json` and replace placeholder information:

```json
{
  "name": "logintelligence",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "url": "https://github.com/YOUR_USERNAME/logintelligence.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/logintelligence/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/logintelligence#readme"
}
```

### 2. Build the Client

```bash
cd client
yarn install
yarn build
cd ..
```

This creates `client/dist/` which will be included in the npm package.

### 3. Test Locally

```bash
# Create a test package
npm pack

# This creates logintelligence-1.0.0.tgz
# Install it locally to test
npm install -g ./logintelligence-1.0.0.tgz

# Test the CLI
logintelligence setup
logintelligence --help

# Clean up
npm uninstall -g logintelligence
rm logintelligence-1.0.0.tgz
```

## 📦 Publishing Process

### First-Time Setup

#### 1. Create npm Account

If you don't have one:
- Go to [npmjs.com](https://www.npmjs.com/signup)
- Create account and verify email

#### 2. Login to npm

```bash
npm login
```

Enter your username, password, and email.

#### 3. Check Package Name

Verify the name is available:

```bash
npm search logintelligence
```

If taken, choose a different name or use a scoped package (`@yourname/logintelligence`).

### Publish!

```bash
# Final check - see what will be published
npm publish --dry-run

# Publish to npm
npm publish --access public
```

The `--access public` flag makes it publicly available.

## 🎉 Success!

Your package is now published! Users can install it with:

```bash
npm install -g logintelligence
```

### Verify Publication

```bash
# Check it's on npm
npm view logintelligence

# View the package page
# Visit: https://www.npmjs.com/package/logintelligence
```

## 🔄 Publishing Updates

When you make changes:

### 1. Update Version

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm version patch

# For new features (1.0.0 → 1.1.0)
npm version minor

# For breaking changes (1.0.0 → 2.0.0)
npm version major
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

### 2. Build Client

```bash
cd client && yarn build && cd ..
```

### 3. Push to Git

```bash
git push origin main
git push origin --tags
```

### 4. Publish Update

```bash
npm publish
```

## 🤖 Automated Publishing (Optional)

We've set up GitHub Actions for automatic publishing.

### Setup

1. **Get npm Token:**
   ```bash
   npm token create
   ```

2. **Add to GitHub:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - New secret: `NPM_TOKEN`
   - Paste your npm token

3. **Create Release:**

   ```bash
   # Create and push tag
   git tag v1.0.0
   git push origin v1.0.0

   # Create release on GitHub (or use UI)
   gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
   ```

The GitHub Action will automatically publish to npm!

## 📋 Quick Command Reference

```bash
# One-time setup
npm login

# Before each publish
cd client && yarn build && cd ..
npm version patch  # or minor/major
git push origin main --tags

# Publish
npm publish --access public

# Verify
npm view logintelligence
```

## 🆘 Common Issues

### "Package name taken"
- Change name in `package.json`
- Or use scoped: `@yourname/logintelligence`

### "Permission denied"
- Run `npm login`
- Check you're logged in: `npm whoami`

### "Build failed"
- Ensure client builds: `cd client && yarn build`
- Check for errors in build output

### "Package too large"
- Check size: `npm pack --dry-run`
- Update `.npmignore` to exclude unnecessary files

## 📚 Full Documentation

For detailed information, see:
- [PUBLISHING.md](./PUBLISHING.md) - Complete publishing guide
- [NPM_INSTALL_GUIDE.md](./NPM_INSTALL_GUIDE.md) - User installation guide
- [README.md](./README.md) - Project documentation

## 🎯 Next Steps

After publishing:

1. **Test Installation:**
   ```bash
   npm install -g logintelligence
   logintelligence --version
   ```

2. **Share:**
   - Tweet about it
   - Post on Reddit (/r/node, /r/javascript)
   - Share on LinkedIn
   - Add to your portfolio

3. **Monitor:**
   - Watch download stats on npmjs.com
   - Monitor GitHub issues
   - Respond to user feedback

---

**Ready to publish? Follow the checklist above! 🚀**
