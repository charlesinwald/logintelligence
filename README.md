# ⚡ LogIntelligence

> Real-time AI-powered error monitoring and analysis dashboard

A production-ready error monitoring solution that automatically categorizes, analyzes, and detects patterns in your application errors using AI. Get instant insights with real-time streaming analysis and intelligent alerting.

## 📋 Prerequisites

- Node.js 18 or higher
- A free Google Gemini API key ([Get one here](https://ai.google.dev/))

## 🚀 Quick Start

Get up and running in 30 seconds:

```bash
# Install globally
npm install -g logintelligence

# Configure your API key
logintelligence setup

# Start the dashboard
logintelligence
```

The dashboard will automatically open in your browser at http://localhost:7878

### First Time Setup

1. **Get a Gemini API Key** (free): Visit [https://ai.google.dev/](https://ai.google.dev/) and generate an API key
2. **Run setup**: When you run `logintelligence setup`, paste your API key when prompted
3. **Start monitoring**: Run `logintelligence` to launch the dashboard

### Try the Demo

Want to see it in action? Run the error simulator:

```bash
logintelligence simulate
```

This will generate realistic error patterns so you can explore the dashboard features.

## 📡 Send Your First Error

Once the dashboard is running, send an error from your application:

```bash
curl -X POST http://localhost:7878/api/errors \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Database connection timeout",
    "stack_trace": "Error: Connection timeout\n    at Database.connect...",
    "source": "api-gateway",
    "severity": "high"
  }'
```

Watch it appear instantly in the dashboard with AI-powered analysis!

## 🎯 What You Get

- **Real-time Error Ingestion**: REST API endpoint for single or batch error submission
- **AI-Powered Classification**: Automatic categorization and severity assessment using Google Gemini
- **Live Streaming Analysis**: See AI analysis happening in real-time via WebSocket
- **Pattern Detection**: Automatic clustering of similar errors using Levenshtein distance
- **Spike Detection**: Smart alerting when error rates exceed baseline thresholds
- **Time-Windowed Views**: Analyze errors over 15 minutes, 1 hour, or 24 hours
- **Beautiful Dashboard**: Modern React UI with real-time charts and filtering

## 📖 CLI Commands

```bash
logintelligence              # Start dashboard on port 7878
logintelligence setup        # Configure Gemini API key
logintelligence simulate     # Run error simulation demo
logintelligence ingest       # Ingest errors from log files
logintelligence --help       # Show all available commands
logintelligence --version    # Show version number
```

## 🏗️ Tech Stack

- **Backend**: Node.js with Express
- **Real-time**: Socket.io for WebSocket connections
- **AI**: Google Gemini API for error classification
- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: SQLite with better-sqlite3
- **Validation**: Zod

## 💡 Integration Examples

### Node.js/Express

```javascript
const axios = require('axios');

// Send error to LogIntelligence
async function reportError(error, context = {}) {
  try {
    await axios.post('http://localhost:7878/api/errors', {
      message: error.message,
      stack_trace: error.stack,
      source: 'my-app',
      severity: 'high',
      metadata: context
    });
  } catch (err) {
    console.error('Failed to report error:', err);
  }
}

// Use in your error handling
app.use((err, req, res, next) => {
  reportError(err, { url: req.url, method: req.method });
  res.status(500).json({ error: 'Internal server error' });
});
```

### Python

```python
import requests
import traceback

def report_error(error, source="python-app"):
    try:
        requests.post('http://localhost:7878/api/errors', json={
            'message': str(error),
            'stack_trace': traceback.format_exc(),
            'source': source,
            'severity': 'high'
        })
    except Exception as e:
        print(f'Failed to report error: {e}')
```

### Any Language (curl)

```bash
# Send error from any language/script
curl -X POST http://localhost:7878/api/errors \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"$ERROR_MESSAGE\",
    \"source\": \"$APP_NAME\",
    \"severity\": \"high\"
  }"
```

## ❓ Troubleshooting

### API Key Issues

If you see "API key not configured" errors:
```bash
# Re-run setup
logintelligence setup

# Or manually set environment variable
export GEMINI_API_KEY=your_key_here
logintelligence
```

### Port Already in Use

If port 7878 is taken, set a custom port:
```bash
PORT=8080 logintelligence
```

### Database Errors

If you encounter database issues:
```bash
# Remove and reinitialize database
rm -rf ~/.logintelligence/data
logintelligence
```

### Node Version

Ensure you're using Node.js 18 or higher:
```bash
node --version  # Should be v18.0.0 or higher
```

---

## 🔧 Development Setup

Want to contribute or run from source?

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/charlesinwald/logintelligence.git
cd logintelligence

# Install dependencies
npm run setup
```

This will install both server and client dependencies and initialize the database.

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Gemini API key
nano .env
```

Required environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=7878
NODE_ENV=development
DB_PATH=./data/errors.db
```

### 3. Start the Development Server

```bash
# Start both server and client (recommended)
npm run dev

# Or start them separately:
npm run server:dev  # Server on http://localhost:7878
npm run client:dev  # Client on http://localhost:5173
```

The dashboard will be available at **http://localhost:5173**

### 4. Generate Demo Errors

Open a new terminal and run the simulation script:

```bash
# Run comprehensive demo (recommended for first time)
npm run simulate

# Or use specific modes:
node scripts/simulate-errors.js normal   # Normal error rate
node scripts/simulate-errors.js spike    # Generate error spike
node scripts/simulate-errors.js pattern  # Generate repeated errors
node scripts/simulate-errors.js batch 20 # Send batch of 20 errors
```

## 📡 API Documentation

### Ingest Errors

**POST** `/api/errors`

Submit a single error:
```json
{
  "message": "Connection timeout: Database connection pool exhausted",
  "stack_trace": "Error: Connection timeout\n    at Database.connect...",
  "source": "api-gateway",
  "severity": "high",
  "environment": "production",
  "user_id": "user_12345",
  "request_id": "req_abc123",
  "metadata": {
    "url": "/api/users",
    "method": "GET"
  }
}
```

Submit a batch:
```json
{
  "errors": [
    { "message": "...", "source": "..." },
    { "message": "...", "source": "..." }
  ]
}
```

### Get Recent Errors

**GET** `/api/errors?limit=100`

Returns recent errors with AI analysis.

### Get Statistics

**GET** `/api/errors/stats?window=3600000`

Returns error statistics for the specified time window (in milliseconds).

### Get Error by ID

**GET** `/api/errors/:id`

Returns a specific error with similar errors.

### Get Errors in Time Range

**GET** `/api/errors/range/:start/:end`

Returns errors between start and end timestamps.

## 🔌 WebSocket Events

### Client → Server

- `request:initial_data` - Request initial dashboard data
- `request:stats` - Request updated statistics
- `request:spike_check` - Check for spike detection
- `ping` - Connection health check

### Server → Client

- `connection:established` - Connection confirmation
- `data:initial` - Initial errors and stats
- `error:new` - New error received
- `error:ai_stream` - Streaming AI analysis chunks
- `error:ai_complete` - AI analysis complete
- `alert:spike` - Spike detected
- `data:stats_update` - Periodic stats update (every 30s)

## 🏛️ Architecture

```
┌─────────────────┐
│  React Client   │ ← WebSocket (Socket.io)
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP/WS
         ↓
┌─────────────────┐
│  Express Server │ ← REST API + WebSocket
│   (Port 7878)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ↓         ↓          ↓
┌────────┐ ┌──────┐  ┌─────────┐
│ SQLite │ │Gemini│  │Socket.io│
│  (WAL) │ │  AI  │  │ Events  │
└────────┘ └──────┘  └─────────┘
```

### Key Design Patterns

1. **Streaming AI Responses**: AI analysis streams through Socket.io as it's generated
2. **Time-Bucketed Stats**: 5-minute buckets for efficient spike detection
3. **Pattern Hashing**: MD5 hashes of normalized errors for deduplication
4. **Connection Pooling**: SQLite WAL mode for concurrent read/write
5. **Real-time Updates**: All clients receive updates via WebSocket broadcasts

## 📊 Database Schema

### Errors Table
Stores all incoming error events with AI analysis results.

### Error Patterns Table
Tracks recurring error patterns with occurrence counts.

### Error Stats Table
Time-series aggregation in 5-minute buckets for spike detection.

## 🎨 Dashboard Features

### Error Feed
- Live-updating error stream
- Expandable error cards with full stack traces
- Severity filtering
- Real-time AI analysis streaming
- Color-coded severity badges

### Category Chart
- Bar chart showing error distribution by category
- Top 10 categories
- Dynamic color coding

### Spike Alerts
- Prominent alerts when error rates spike
- Shows current rate vs baseline
- Dismissible notifications

### Stats Overview
- Total errors
- Error rate (per minute)
- Category count
- Active errors in memory

## 🔧 Development

### Project Structure

```
error-intelligence/
├── server/
│   ├── index.js          # Express + Socket.io setup
│   ├── routes/
│   │   └── errors.js     # Error ingestion endpoints
│   ├── services/
│   │   ├── ai.js         # Gemini API integration
│   │   └── patterns.js   # Pattern detection & spike detection
│   ├── db/
│   │   ├── index.js      # SQLite setup with prepared statements
│   │   └── schema.sql    # Database schema
│   └── socket/
│       └── handler.js    # WebSocket event handlers
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ErrorFeed.jsx
│   │   │   ├── CategoryChart.jsx
│   │   │   └── SpikeAlert.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   └── utils/
│   │       └── formatters.js
│   └── index.html
├── scripts/
│   ├── simulate-errors.js  # Error simulation for demo
│   └── setup-db.js         # Database initialization
└── package.json
```

### Running Tests

```bash
# Start the server
npm run server:dev

# In another terminal, run simulations
npm run simulate
```

### Building for Production

```bash
# Build the client
npm run build

# Start production server
NODE_ENV=production npm start
```

The server will serve the built client from `client/dist/`.

## 🚀 Deployment Considerations

### Environment Variables
- Set `NODE_ENV=production`
- Configure `FRONTEND_URL` for CORS in production
- Secure your `GEMINI_API_KEY`

### Database
- SQLite works well for MVP/demo purposes
- For production scale, consider PostgreSQL or MongoDB
- Current implementation supports thousands of errors efficiently

### Scaling
- Add Redis for Socket.io adapter (multi-server support)
- Implement rate limiting on API endpoints
- Add authentication for dashboard access
- Set up reverse proxy (nginx) for production

## 📝 Spike Detection Algorithm

The spike detection algorithm works as follows:

1. Errors are bucketed into 5-minute time windows
2. Current bucket error count is compared to hourly average
3. Spike is triggered when current rate exceeds 2x baseline
4. Spikes are calculated per source/category combination
5. Alerts are broadcast to all connected clients

## 🎯 Future Enhancements

- [ ] Webhook notifications for critical spikes
- [ ] Error deduplication with fingerprinting
- [ ] User authentication and authorization
- [ ] Export errors to CSV/JSON
- [ ] Email alerts for critical errors
- [ ] Error resolution workflow
- [ ] Integration with Slack/PagerDuty
- [ ] Advanced analytics and trends
- [ ] Custom alerting rules
- [ ] Multi-tenant support

## 🤝 Contributing

This is a portfolio/demo project. Feel free to fork and adapt for your own use!

## 📄 License

MIT License - feel free to use this code for your own projects.

## 🙏 Acknowledgments

- Built with [Gemini AI](https://ai.google.dev/) for intelligent error classification
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Real-time communication via [Socket.io](https://socket.io/)

---

**Built with ❤️ as a weekend MVP to showcase modern full-stack development patterns.**
