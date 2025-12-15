# 📦 npm Installation Guide

Complete guide for installing and using `logintelligence` as an npm package.

## Installation

### Global Installation (Recommended)

Install globally to use the `logintelligence` command anywhere:

```bash
npm install -g logintelligence
```

### Local Installation

Install in a specific project:

```bash
npm install logintelligence
```

Then use with npx:

```bash
npx logintelligence
```

## First-Time Setup

After installation, configure your Gemini API key:

```bash
logintelligence setup
```

This will:
1. Prompt you to enter your Gemini API key
2. Save it to `~/.logintelligence/config.json`
3. Confirm successful configuration

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key (starts with `AIza...`)
5. Paste it when running `logintelligence setup`

## Usage

### Start the Dashboard

```bash
logintelligence
```

This will:
- Start the server on http://localhost:3000
- Automatically open your default browser
- Display the real-time dashboard

Press `Ctrl+C` to stop.

### Run Error Simulation

Generate demo errors to see the dashboard in action:

```bash
logintelligence simulate
```

Available simulation modes:

```bash
# Full demo (recommended first time)
logintelligence simulate

# Normal error rate
logintelligence simulate normal

# Generate error spike
logintelligence simulate spike

# Generate similar errors (pattern detection)
logintelligence simulate pattern

# Send specific batch size
logintelligence simulate batch 50
```

### Other Commands

```bash
# Reconfigure API key
logintelligence setup

# Show version
logintelligence --version

# Show help
logintelligence --help
```

## Configuration

### Config File Location

Your configuration is stored at:
- **Linux/Mac**: `~/.logintelligence/config.json`
- **Windows**: `C:\Users\<YourName>\.logintelligence\config.json`

### Manual Configuration

You can manually edit the config file:

```json
{
  "GEMINI_API_KEY": "AIza..."
}
```

### Environment Variables

You can also use environment variables (takes precedence over config file):

```bash
export GEMINI_API_KEY="your-key-here"
logintelligence
```

### Custom Port

Change the server port:

```bash
PORT=8080 logintelligence
```

## Integrating with Your Application

### Sending Errors to the Dashboard

Once the dashboard is running, send errors from your application:

```javascript
// Example: Node.js application
async function reportError(error) {
  await fetch('http://localhost:3000/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack_trace: error.stack,
      source: 'my-app',
      severity: 'high',
      environment: 'production',
      metadata: {
        url: req.url,
        method: req.method,
        user: req.user?.id
      }
    })
  });
}

// Use in error handler
app.use((err, req, res, next) => {
  reportError(err).catch(console.error);
  res.status(500).send('Internal Server Error');
});
```

### Python Example

```python
import requests
import traceback

def report_error(error, source='python-app'):
    payload = {
        'message': str(error),
        'stack_trace': traceback.format_exc(),
        'source': source,
        'severity': 'high',
        'environment': 'production'
    }

    requests.post('http://localhost:3000/api/errors', json=payload)

# Use in exception handler
try:
    # Your code
    pass
except Exception as e:
    report_error(e)
    raise
```

## Data Storage

- **Database**: SQLite database in the package installation directory
- **Location**: `<package-dir>/data/errors.db`
- **Persistence**: Data persists between restarts

To reset the database:
1. Find the package directory: `npm list -g logintelligence`
2. Delete the `data/` folder
3. Restart `logintelligence`

## Updating

### Update to Latest Version

```bash
# Global installation
npm update -g logintelligence

# Local installation
npm update logintelligence
```

### Check for Updates

```bash
# See current version
logintelligence --version

# Check latest available
npm view logintelligence version

# See all versions
npm view logintelligence versions
```

## Uninstallation

```bash
# Uninstall global package
npm uninstall -g logintelligence

# Remove config (optional)
rm -rf ~/.logintelligence
```

## Troubleshooting

### "logintelligence: command not found"

**Cause**: Global npm bin directory not in PATH

**Solution**:
```bash
# Find npm global bin directory
npm config get prefix

# Add to PATH (Linux/Mac - add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(npm config get prefix)/bin"

# Windows - Add to System Environment Variables
# Add: C:\Users\<YourName>\AppData\Roaming\npm
```

### "Not configured" Error

**Cause**: No API key configured

**Solution**:
```bash
logintelligence setup
```

### Port Already in Use

**Cause**: Port 3000 is busy

**Solution**:
```bash
PORT=3001 logintelligence
```

### Permission Denied

**Cause**: Need sudo for global install

**Solution**:
```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g logintelligence

# Option 2: Configure npm to use different directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g logintelligence
```

### Database Errors

**Cause**: Corrupted database or permissions

**Solution**:
```bash
# Find package location
npm list -g logintelligence

# Remove data directory
# cd to package directory and:
rm -rf data/

# Restart
logintelligence
```

## Advanced Usage

### Running Behind a Proxy

```bash
# Set proxy for npm
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Install
npm install -g logintelligence
```

### Using with Docker

```dockerfile
FROM node:18

# Install logintelligence globally
RUN npm install -g logintelligence

# Set API key
ENV GEMINI_API_KEY=your-key-here

# Expose port
EXPOSE 3000

# Start
CMD ["logintelligence"]
```

### Programmatic Usage

```javascript
// Import as a module
import { startServer } from 'logintelligence/server/index.js';

// Custom configuration
process.env.GEMINI_API_KEY = 'your-key';
process.env.PORT = '8080';

// Start server programmatically
startServer();
```

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/logintelligence/issues)
- **Documentation**: [Full README](https://github.com/yourusername/logintelligence)
- **npm Package**: [npmjs.com/package/logintelligence](https://www.npmjs.com/package/logintelligence)

## Quick Reference

```bash
# Installation
npm install -g logintelligence

# Setup
logintelligence setup

# Start
logintelligence

# Simulate
logintelligence simulate

# Update
npm update -g logintelligence

# Uninstall
npm uninstall -g logintelligence
```

---

**Happy error monitoring! 🚀**
