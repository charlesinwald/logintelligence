# LogIntelligence - Complete Features List

## Overview
LogIntelligence is a real-time AI-powered error monitoring and analysis dashboard that automatically categorizes, analyzes, and detects patterns in application errors.

---

## Core Features

### 1. Error Ingestion & Management
- **REST API Endpoint** for error submission (`POST /api/errors`)
- **Single & Batch Error Submission** - Submit one error or up to 100 errors per batch
- **Comprehensive Error Data** - Capture message, stack trace, source, severity, environment, user ID, request ID, and custom metadata
- **Automatic Timestamping** - Errors timestamped automatically if not provided
- **SQLite Database Storage** with WAL mode for concurrent read/write operations
- **Clear All Errors** functionality (`DELETE /api/errors`)
- **Error Retrieval** - Get recent errors with customizable limits
- **Time Range Queries** - Retrieve errors within specific time ranges
- **Individual Error Details** - Get specific error by ID with similar errors

### 2. AI-Powered Analysis
- **Multiple LLM Provider Support**:
  - Google Gemini (primary)
  - Local LLM via Ollama (optional)
- **Streaming AI Analysis** - Real-time streaming of AI insights via WebSocket
- **Automatic Error Classification** - AI categorizes errors (Database, Authentication, Network, etc.)
- **Severity Assessment** - AI determines error severity (critical, high, medium, low)
- **Root Cause Hypothesis** - AI generates brief root cause analysis for each error
- **Batch Analysis** - Process multiple errors asynchronously
- **Credit-Based AI Usage** - Pro users get unlimited credits; Free users have limited AI analysis

### 3. Pattern Detection & Intelligence
- **Error Pattern Tracking** - Automatic identification of recurring error patterns
- **Pattern Hashing** - MD5 hashing of normalized errors for deduplication
- **Error Normalization** - Removes numbers, UUIDs, emails for better pattern matching
- **Similarity Detection** - Levenshtein distance algorithm to find similar errors (70%+ threshold)
- **Pattern Occurrence Counting** - Track how many times each pattern appears
- **Time-Based Pattern Analysis** - Track patterns over time with first_seen and last_seen timestamps

### 4. Spike Detection & Alerting
- **Real-time Spike Detection** - Alerts when error rates exceed baseline thresholds
- **Time-Bucketed Statistics** - 5-minute time buckets for accurate rate calculations
- **Baseline Comparison** - Current rate compared to hourly average (12 buckets)
- **Configurable Threshold Multiplier** - Default 2x baseline triggers spike alerts
- **Per-Source/Category Spikes** - Spike detection calculated per source and category combination
- **WebSocket Spike Alerts** - Real-time spike notifications to all connected clients
- **Dismissible Spike Notifications** - Users can clear spike alerts from dashboard

### 5. Real-Time Communication
- **WebSocket Support** via Socket.io
- **Connection Management** - Automatic connection status tracking
- **Real-Time Events**:
  - `error:new` - New error received
  - `error:ai_stream` - Streaming AI analysis chunks
  - `error:ai_complete` - AI analysis complete
  - `alert:spike` - Spike detected
  - `data:stats_update` - Periodic stats updates (every 30s)
  - `errors:cleared` - All errors cleared notification
  - `connection:established` - Connection confirmation
- **Initial Data Loading** - Request initial dashboard data on connection
- **Ping/Pong Health Checks** - Connection health monitoring

### 6. Dashboard & Visualization
- **Real-Time Error Feed** - Live-updating error stream with expandable cards
- **Category Distribution Chart** - Bar chart showing top 10 error categories
- **Statistics Overview Cards**:
  - Total Errors
  - Error Rate (per minute)
  - Category Count
  - Active Errors in Memory
- **Time Window Selection** - View errors from last 15 minutes, 1 hour, or 24 hours
- **Severity Filtering** - Filter errors by severity level
- **Color-Coded Severity Badges** - Visual severity indicators
- **Full Stack Trace Viewing** - Expandable error cards with complete stack traces
- **AI Analysis Streaming Display** - Watch AI analysis appear in real-time
- **Connection Status Indicator** - Visual connected/disconnected status
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Theme UI** - Modern glassmorphism design with dotted surface backgrounds
- **Accessibility Features** - Skip links, ARIA labels, keyboard navigation

### 7. Authentication & User Management
- **Email/Password Registration** - Create accounts with email and password
- **Email/Password Login** - Standard authentication
- **Google OAuth Sign-In** - Single sign-on with Google accounts
- **JWT-Based Authentication** - Access tokens and refresh tokens
- **Secure HTTP-Only Cookies** - Refresh tokens stored securely
- **Password Requirements**:
  - Minimum 8 characters
  - Password strength validation
  - Secure bcrypt hashing
- **Password Reset Flow**:
  - Forgot password functionality
  - Reset token generation (1-hour expiration)
  - Reset password with token
- **Auto User Creation** - Google OAuth automatically creates accounts
- **Email Verification** - Email marked as verified for Google OAuth users
- **Session Management** - Refresh token rotation
- **Protected Routes** - Authentication required for dashboard access
- **Public Routes** - Login page accessible without authentication
- **User Profile** - Get current user info (`GET /api/auth/me`)

### 8. Subscription & Billing
- **Two-Tier System**:
  - **Free Tier** - Basic error tracking, limited AI analysis, standard support
  - **Pro Tier** ($29/month) - Unlimited error tracking, unlimited AI analysis, priority support
- **Stripe Integration** - Secure payment processing
- **Checkout Session Creation** - Seamless upgrade flow
- **Webhook Handling** - Automatic subscription updates from Stripe
  - `checkout.session.completed` - Activate subscription
  - `customer.subscription.updated` - Update subscription status
  - `customer.subscription.deleted` - Downgrade to free tier
- **Subscription Verification** - Verify checkout sessions post-payment
- **Manual Sync** - Force sync subscription from Stripe
- **Subscription Status Tracking**:
  - Active subscriptions
  - Trial periods
  - Cancel at period end
  - Current period dates
- **Stripe Customer Management** - Automatic customer creation and linking
- **Upgrade Page** - Beautiful upgrade UI with feature comparison
- **Subscription Status Display** - Show tier and status in user menu

### 9. Credits System
- **Credit Balance Tracking** - Track credits per user
- **Pro Plan Benefits** - Pro users have unlimited credits (no deduction)
- **Free Plan Limits** - Free users consume credits for AI analysis
- **Credit Deduction** - 1 credit per AI error analysis
- **Credit Summary API** - Get current credit balance (`GET /api/credits`)
- **Automatic Credit Checks** - Verify credits before AI analysis
- **Credit Display** - Show credit balance in user menu
- **Insufficient Credits Handling** - Skip AI analysis with notification when out of credits

### 10. API Key Management
- **API Key Generation** - Create API keys for programmatic access
- **Secure Key Storage** - Keys hashed with SHA-256
- **Key Prefix Display** - Show first 8 characters for identification
- **Named API Keys** - Optional names for organization
- **Last Used Tracking** - Track when each key was last used
- **Multiple Keys per User** - Create multiple API keys
- **Key-Based Authentication** - Use `X-API-Key` header for error submission
- **User Association** - API keys linked to user accounts for credit tracking
- **Key Deletion** - Remove API keys with ownership checks

### 11. Statistics & Analytics
- **Time-Windowed Statistics** - Analyze errors over customizable time windows
- **Category Breakdown** - Count and last occurrence per category
- **Time-Series Data** - 5-minute bucketed time series for trend analysis
- **Error Rate Calculation** - Errors per minute within time window
- **Total Error Counts** - Aggregate error counts
- **Multi-Dimensional Stats** - Stats by source, category, and time bucket
- **Historical Data** - Maintain time-series data for hourly average calculations
- **Indexed Queries** - Optimized database indexes for fast statistics retrieval

### 12. CLI & Developer Tools
- **Global CLI Installation** - `npm install -g logintelligence`
- **CLI Commands**:
  - `logintelligence` - Start dashboard on port 7878
  - `logintelligence setup` - Configure Gemini API key
  - `logintelligence simulate` - Run error simulation demo
  - `logintelligence ingest` - Ingest errors from log files
  - `logintelligence --help` - Show all available commands
  - `logintelligence --version` - Show version number
- **Error Simulation** - Generate realistic error patterns for testing
- **Simulation Modes**:
  - Normal error rate
  - Spike generation
  - Pattern repetition
  - Batch error submission
- **Auto Browser Launch** - Automatically opens dashboard in browser
- **Database Initialization** - Automatic database setup on first run
- **Environment Configuration** - `.env` file support for configuration

### 13. Integration & Interoperability
- **REST API** - Standard HTTP endpoints for all operations
- **WebSocket API** - Real-time bidirectional communication
- **Language Agnostic** - Integrate from any programming language
- **cURL Examples** - Simple integration via command line
- **Node.js SDK Example** - Express middleware integration
- **Python Example** - Python error reporting integration
- **Batch Error Submission** - Submit multiple errors in one request (up to 100)
- **JSON Validation** - Zod schema validation for all inputs
- **CORS Support** - Configurable CORS for frontend integration
- **Rate Limiting** - Express rate limiter for API protection

### 14. Configuration & Settings
- **Settings Panel** - Dashboard settings UI
- **Reconnect Functionality** - Manual WebSocket reconnection
- **Config Persistence** - Save user preferences
- **Environment Variables**:
  - `GEMINI_API_KEY` - Google Gemini API key
  - `OLLAMA_URL` - Local Ollama server URL (optional)
  - `PORT` - Server port (default 7878)
  - `NODE_ENV` - Environment (development/production)
  - `DB_PATH` - Database file path
  - `FRONTEND_URL` - Frontend URL for CORS
  - `JWT_SECRET` - JWT signing secret
  - `STRIPE_SECRET_KEY` - Stripe API key
  - `STRIPE_PRICE_ID` - Stripe price ID for Pro plan
  - `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
  - `GOOGLE_CLIENT_ID` - Google OAuth client ID
- **Config Reset** - Reset configuration to defaults
- **Port Configuration** - Custom port via environment variable

### 15. Database & Data Management
- **SQLite Database** - Lightweight, file-based storage
- **Three Core Tables**:
  - `errors` - All error events with AI analysis
  - `error_patterns` - Recurring error patterns
  - `error_stats` - Time-series aggregation (5-minute buckets)
  - `users` - User accounts
  - `subscriptions` - Subscription tiers and status
  - `api_keys` - API keys for programmatic access
  - `credits` - Credit balance tracking
- **Optimized Indexes** - Indexes on timestamp, source, severity, category, created_at
- **Prepared Statements** - All queries use prepared statements for performance
- **WAL Mode** - Write-Ahead Logging for concurrent access
- **Automatic Migrations** - Schema initialization on startup
- **Data Persistence** - Errors stored permanently in SQLite
- **Metadata Storage** - JSON metadata field for custom error context

### 16. Security Features
- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **HTTP-Only Cookies** - Refresh tokens protected from XSS
- **CORS Configuration** - Restricted cross-origin access
- **Input Validation** - Zod schemas for all inputs
- **SQL Injection Protection** - Prepared statements prevent SQL injection
- **API Key Hashing** - SHA-256 hashing for API keys
- **Rate Limiting** - Protection against abuse
- **Secure Stripe Webhook Verification** - Signature verification for webhooks
- **Environment Secret Management** - Secrets stored in environment variables
- **Production HTTPS** - Secure cookies in production

### 17. Error Feed Features
- **Infinite Scroll** - Efficiently display large error lists
- **Hide Errors** - Temporarily hide errors from view
- **Clear All Errors** - Clear all errors from dashboard and database
- **Expandable Cards** - Click to expand for full details
- **Timestamp Display** - Relative timestamps (e.g., "2 minutes ago")
- **Source Badge** - Visual source/service identifier
- **Severity Badge** - Color-coded severity (critical=red, high=orange, medium=yellow, low=blue)
- **AI Status Indicators** - Show processing, completed, or skipped status
- **Stack Trace Formatting** - Monospace, scrollable stack traces
- **Metadata Display** - Show custom metadata if present

### 18. Deployment Features
- **Production Build** - Optimized client build with Vite
- **Static File Serving** - Express serves built client
- **Deployment Scripts**:
  - `deploy.sh` - Deploy with version bump
  - `deploy-local.sh` - Local deployment
  - Version bump options (patch, minor, major)
- **NPM Publishing** - Published to npm registry
- **Environment Detection** - Automatic dev/prod mode detection
- **Logging** - Comprehensive server-side logging
- **Error Handling** - Global error handlers
- **Graceful Shutdown** - Proper cleanup on server stop

---

## Technical Architecture

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: SQLite with better-sqlite3
- **AI**: Google Gemini API / Ollama (local)
- **Authentication**: JWT, bcrypt, Google OAuth
- **Payment**: Stripe
- **Validation**: Zod
- **Language**: TypeScript

### Frontend Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Zustand (auth store)
- **HTTP Client**: Native fetch API
- **WebSocket Client**: Socket.io-client

### Development Tools
- **TypeScript Compiler**: tsc
- **Dev Server**: tsx watch
- **Concurrency**: concurrently for parallel dev servers
- **Scripts**: Comprehensive npm scripts for all tasks

---

## Future Enhancements (Roadmap)
- [ ] Webhook notifications for critical spikes
- [ ] Email alerts for critical errors
- [ ] Error resolution workflow
- [ ] Integration with Slack/PagerDuty
- [ ] Advanced analytics and trends
- [ ] Custom alerting rules
- [ ] Multi-tenant support
- [ ] Export errors to CSV/JSON
- [ ] Team collaboration features

---

## Use Cases

1. **Individual Developers** - Monitor personal projects with free tier
2. **Startups** - Track errors across microservices with Pro plan
3. **Enterprise Teams** - Centralized error monitoring with team collaboration
4. **DevOps Engineers** - Real-time error spike detection and alerting
5. **QA Teams** - Track and analyze error patterns during testing
6. **Support Teams** - Investigate user-reported issues with error context
7. **API Providers** - Monitor API errors from multiple clients
8. **SaaS Applications** - Track errors per customer/tenant

---

## Integration Examples

### Node.js/Express
```javascript
const axios = require('axios');

async function reportError(error, context = {}) {
  await axios.post('http://localhost:7878/api/errors', {
    message: error.message,
    stack_trace: error.stack,
    source: 'my-app',
    severity: 'high',
    metadata: context
  });
}

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
    requests.post('http://localhost:7878/api/errors', json={
        'message': str(error),
        'stack_trace': traceback.format_exc(),
        'source': source,
        'severity': 'high'
    })
```

### cURL
```bash
curl -X POST http://localhost:7878/api/errors \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "message": "Database connection failed",
    "source": "my-app",
    "severity": "high"
  }'
```

---

**Built with ❤️ by Charles Inwald**
