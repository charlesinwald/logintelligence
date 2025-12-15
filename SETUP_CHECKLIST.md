# ✅ Setup Checklist

Use this checklist to get your LogIntelligence Dashboard running smoothly.

## Pre-Installation

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Text editor ready (VS Code, Sublime, etc.)
- [ ] Terminal/command line access

## Get Gemini API Key

- [ ] Visit [Google AI Studio](https://ai.google.dev/)
- [ ] Create account or sign in
- [ ] Click "Get API Key"
- [ ] Create new API key
- [ ] Copy the key (starts with `AIza...`)

## Initial Setup

- [ ] Clone/download the project
- [ ] Navigate to project directory: `cd logintelligence`
- [ ] Copy environment file: `cp .env.example .env`
- [ ] Edit `.env` and paste your Gemini API key
- [ ] Save the `.env` file

## Install Dependencies

- [ ] Run: `npm run setup`
- [ ] Wait for server dependencies to install
- [ ] Wait for client dependencies to install
- [ ] Verify database was created in `data/` folder
- [ ] Check for any error messages

## First Run

- [ ] Open terminal in project root
- [ ] Run: `npm run dev`
- [ ] Wait for both servers to start
- [ ] Server should be on http://localhost:3000
- [ ] Client should be on http://localhost:5173
- [ ] Check for "Connected" status in dashboard

## Test with Simulation

- [ ] Open a **new terminal** (keep servers running)
- [ ] Navigate to project directory
- [ ] Run: `npm run simulate`
- [ ] Watch the dashboard for incoming errors
- [ ] Verify errors appear in the feed
- [ ] Check AI analysis appears
- [ ] Wait for spike alert to appear
- [ ] Verify category chart updates

## Verify Features

### Dashboard
- [ ] Connection status shows "Connected" (green dot)
- [ ] Stats cards show data (Total Errors, Error Rate, etc.)
- [ ] Time window selector works (15m, 1h, 24h)

### Error Feed
- [ ] Errors appear in real-time
- [ ] Click to expand an error
- [ ] Stack trace is visible
- [ ] AI analysis shows up
- [ ] Severity badges are color-coded
- [ ] Severity filter works

### Category Chart
- [ ] Chart displays error categories
- [ ] Bars are color-coded
- [ ] Category list shows below chart
- [ ] Updates as new errors arrive

### Spike Detection
- [ ] Red alert appears during simulation
- [ ] Alert shows current rate vs baseline
- [ ] Alert can be dismissed with X button

## Common Issues Checklist

### "Cannot connect to server"
- [ ] Is the server running? (check terminal)
- [ ] Is it on port 3000? (check server logs)
- [ ] Check browser console for errors
- [ ] Try refreshing the page

### "API key invalid"
- [ ] Check `.env` file exists in root
- [ ] Verify API key has no quotes around it
- [ ] Ensure no extra spaces in API key
- [ ] Try generating a new key from Google AI Studio

### "Database error"
- [ ] Check `data/` folder exists
- [ ] Try: `rm -rf data/ && node scripts/setup-db.js`
- [ ] Verify file permissions on `data/` folder

### "Port already in use"
- [ ] Change PORT in `.env` to 3001 or 3002
- [ ] Change port in `client/vite.config.js` for client
- [ ] Restart both servers

### "Dependencies failed to install"
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Delete `node_modules/`: `rm -rf node_modules/`
- [ ] Delete `package-lock.json`: `rm package-lock.json`
- [ ] Try again: `npm install`

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Build client: `npm run build`
- [ ] Test production build: `NODE_ENV=production npm start`
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificate
- [ ] Configure firewall rules
- [ ] Set up process manager (PM2)
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Back up database regularly

## Customization Checklist

### Branding
- [ ] Update title in `client/index.html`
- [ ] Customize header in `Dashboard.jsx`
- [ ] Update footer text in `Dashboard.jsx`
- [ ] Change color scheme in `tailwind.config.js`

### Configuration
- [ ] Adjust spike threshold in `patterns.js`
- [ ] Modify time bucket size (default 5 min)
- [ ] Change AI model in `ai.js` (gemini-1.5-flash)
- [ ] Update stats refresh interval (default 30s)

### Features
- [ ] Add authentication middleware
- [ ] Implement rate limiting
- [ ] Add email notifications
- [ ] Create custom alert rules
- [ ] Add export functionality

## Documentation Checklist

- [ ] Read full [README.md](./README.md)
- [ ] Review [QUICKSTART.md](./QUICKSTART.md)
- [ ] Check [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- [ ] Understand API endpoints
- [ ] Review WebSocket events
- [ ] Explore database schema

## Next Steps

- [ ] Experiment with different simulation modes
- [ ] Try sending custom errors via API
- [ ] Modify error templates in simulation script
- [ ] Customize the dashboard UI
- [ ] Add your own error sources
- [ ] Integrate with real applications

## Success Criteria

You've successfully set up the dashboard when:

✅ Dashboard shows "Connected" status
✅ Errors appear in real-time during simulation
✅ AI analysis categorizes each error
✅ Category chart displays data
✅ Spike alerts appear during high error rates
✅ All stats cards show accurate numbers

## Need Help?

If you're stuck:

1. Check the terminal for error messages
2. Review the troubleshooting section in README.md
3. Verify all checklist items above
4. Check browser console for frontend errors
5. Ensure all environment variables are set correctly

---

**Ready to build? Let's go! 🚀**
