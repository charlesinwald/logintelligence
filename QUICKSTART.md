# 🚀 Quick Start Guide

Get the LogIntelligence Dashboard running in under 5 minutes!

## Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key

## Step 2: Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit and add your Gemini API key
nano .env  # or use your preferred editor
```

Your `.env` should look like:
```env
GEMINI_API_KEY=AIza...your-key-here
PORT=3000
NODE_ENV=development
DB_PATH=./data/errors.db
```

## Step 3: Install Dependencies

```bash
# Install all dependencies and initialize database
npm run setup
```

This command will:
- Install server dependencies
- Install client dependencies
- Create the SQLite database
- Set up the schema

## Step 4: Start the Application

```bash
# Start both server and client
npm run dev
```

This will start:
- **Backend server** on http://localhost:3000
- **React dashboard** on http://localhost:5173

## Step 5: Generate Demo Errors

Open a **new terminal** and run:

```bash
# Run the comprehensive demo
npm run simulate
```

This will:
1. Send errors at a normal rate
2. Generate a spike to trigger alerts
3. Create error patterns
4. Send batch errors

## 🎉 Done!

Visit **http://localhost:5173** and watch the dashboard come alive with real-time error analysis!

## What to Watch For

- **Live Error Feed**: Errors appear in real-time on the left
- **AI Analysis**: Watch the AI categorize and analyze each error
- **Category Chart**: See the distribution update automatically
- **Spike Alerts**: Red alerts appear when error rates spike
- **Stats Cards**: Monitor total errors, error rate, and categories

## Troubleshooting

### Port Already in Use
If port 3000 or 5173 is busy:
```bash
# Change PORT in .env
PORT=3001

# Client port is configured in client/vite.config.js
```

### Database Issues
If you have database errors:
```bash
# Remove existing database and reinitialize
rm -rf data/
node scripts/setup-db.js
```

### API Key Issues
Make sure your `.env` file:
- Is in the root directory (not in server/ or client/)
- Has `GEMINI_API_KEY=` without quotes around the value
- Contains a valid API key from Google AI Studio

### Connection Issues
If the dashboard shows "Disconnected":
1. Check that the server is running on http://localhost:3000
2. Check the browser console for errors
3. Verify Socket.io is connecting (check server logs)

## Next Steps

- Check out the full [README.md](./README.md) for detailed documentation
- Explore the API endpoints at http://localhost:3000/api/errors
- Modify the simulation script to test your own error patterns
- Customize the dashboard components in `client/src/components/`

## Different Simulation Modes

```bash
# Normal error rate (300 seconds)
node scripts/simulate-errors.js normal

# Generate a spike (30 rapid errors)
node scripts/simulate-errors.js spike

# Generate similar errors (pattern detection)
node scripts/simulate-errors.js pattern

# Send a specific batch size
node scripts/simulate-errors.js batch 50

# Full demo (recommended)
npm run simulate
```

---

**Have fun exploring the LogIntelligence Dashboard! 🎯**
