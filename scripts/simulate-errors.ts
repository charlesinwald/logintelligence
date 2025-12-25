/**
 * Error Simulation Script
 * Generates realistic error patterns for demo purposes
 * Requires Node.js 18+ for native fetch support
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Sample error templates
interface ErrorTemplate {
  type: string;
  messages: string[];
  stacks: string[];
  severity: string[];
}

const ERROR_TEMPLATES: ErrorTemplate[] = [
  {
    type: 'database',
    messages: [
      'Connection timeout: Database connection pool exhausted',
      'Failed to execute query: Table "users" does not exist',
      'Deadlock detected in transaction',
      'Database connection refused on port 5432',
      'Query execution timeout after 30000ms'
    ],
    stacks: [
      `Error: Connection timeout
    at Database.connect (db/connection.js:45)
    at async UserRepository.findById (repositories/user.js:12)
    at async AuthService.authenticate (services/auth.js:89)`,
      `Error: Table does not exist
    at QueryRunner.execute (db/query-runner.js:123)
    at async Repository.findOne (repositories/base.js:56)
    at async UserService.getUser (services/user.js:34)`
    ],
    severity: ['high', 'critical', 'medium']
  },
  {
    type: 'authentication',
    messages: [
      'JWT token expired',
      'Invalid credentials provided',
      'Session timeout after 3600 seconds',
      'OAuth2 token refresh failed',
      'Permission denied: User lacks required role'
    ],
    stacks: [
      `Error: JWT expired
    at TokenValidator.verify (auth/token.js:67)
    at AuthMiddleware.authenticate (middleware/auth.js:23)
    at async handle (app.js:145)`,
      `Error: Invalid credentials
    at AuthService.login (services/auth.js:112)
    at async AuthController.handleLogin (controllers/auth.js:45)`
    ],
    severity: ['medium', 'high', 'low']
  },
  {
    type: 'network',
    messages: [
      'ECONNREFUSED: Connection refused to external API',
      'Request timeout after 5000ms',
      'DNS lookup failed for api.example.com',
      'Socket hang up during HTTP request',
      'Network unreachable: ENETUNREACH'
    ],
    stacks: [
      `Error: ECONNREFUSED
    at TCPConnectWrap.afterConnect (net.js:1144)
    at HttpClient.request (http/client.js:89)
    at async ExternalService.fetchData (services/external.js:34)`,
      `Error: Request timeout
    at Timeout._onTimeout (utils/timeout.js:23)
    at async ApiClient.get (clients/api.js:67)`
    ],
    severity: ['high', 'medium', 'critical']
  },
  {
    type: 'null_reference',
    messages: [
      'Cannot read property "id" of undefined',
      'TypeError: Cannot read properties of null (reading "name")',
      'ReferenceError: user is not defined',
      'Undefined is not a function (evaluating "data.map")',
      'Cannot access property of undefined object'
    ],
    stacks: [
      `TypeError: Cannot read property 'id' of undefined
    at UserService.getUserProfile (services/user.js:78)
    at async ProfileController.getProfile (controllers/profile.js:23)
    at async Router.handle (express/router.js:234)`,
      `ReferenceError: user is not defined
    at validateUser (utils/validation.js:45)
    at async AuthMiddleware.checkAuth (middleware/auth.js:89)`
    ],
    severity: ['high', 'critical', 'medium']
  },
  {
    type: 'api',
    messages: [
      '404 Not Found: Resource does not exist',
      '500 Internal Server Error: Unhandled exception',
      '429 Too Many Requests: Rate limit exceeded',
      '503 Service Unavailable: Service temporarily down',
      '400 Bad Request: Invalid request parameters'
    ],
    stacks: [
      `Error: 404 Not Found
    at ApiClient.handleResponse (clients/api.js:145)
    at async ResourceService.fetch (services/resource.js:56)`,
      `Error: 500 Internal Server Error
    at ErrorHandler.handle (middleware/error.js:34)
    at async App.handleRequest (app.js:234)`
    ],
    severity: ['medium', 'critical', 'high', 'low']
  }
];

const SERVICES = [
  'api-gateway',
  'auth-service',
  'user-service',
  'payment-service',
  'notification-service',
  'analytics-service'
];

const ENVIRONMENTS = ['production', 'staging', 'development'];

interface ErrorData {
  message: string;
  stack_trace: string;
  timestamp: number;
  source: string;
  severity: string;
  environment: string;
  user_id: string;
  request_id: string;
  metadata: {
    url: string;
    method: string;
    ip: string;
    userAgent: string;
  };
}

/**
 * Generate a random error
 */
function generateError(): ErrorData {
  const template = ERROR_TEMPLATES[Math.floor(Math.random() * ERROR_TEMPLATES.length)];
  const message = template.messages[Math.floor(Math.random() * template.messages.length)];
  const stack = template.stacks[Math.floor(Math.random() * template.stacks.length)];
  const severity = template.severity[Math.floor(Math.random() * template.severity.length)];

  return {
    message,
    stack_trace: stack,
    timestamp: Date.now(),
    source: SERVICES[Math.floor(Math.random() * SERVICES.length)],
    severity,
    environment: ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)],
    user_id: `user_${Math.floor(Math.random() * 10000)}`,
    request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    metadata: {
      url: `/api/v1/${template.type}/${Math.floor(Math.random() * 100)}`,
      method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (compatible; ErrorBot/1.0)'
    }
  };
}

/**
 * Send error to API
 */
async function sendError(error: ErrorData): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(error)
    });

    if (!response.ok) {
      console.error(`Failed to send error: ${response.status} ${response.statusText}`);
    } else {
      const data = await response.json() as { errors: Array<{ id: string }> };
      console.log(`✓ Error sent: ${error.message.substring(0, 60)}... (ID: ${data.errors[0].id})`);
    }
  } catch (error) {
    console.error('Failed to send error:', (error as Error).message);
  }
}

/**
 * Send batch of errors
 */
async function sendBatch(count: number): Promise<void> {
  const errors = Array.from({ length: count }, () => generateError());

  try {
    const response = await fetch(`${API_URL}/api/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ errors })
    });

    if (!response.ok) {
      console.error(`Failed to send batch: ${response.status} ${response.statusText}`);
    } else {
      const data = await response.json();
      console.log(`✓ Batch sent: ${count} errors`);
    }
  } catch (error) {
    console.error('Failed to send batch:', (error as Error).message);
  }
}

/**
 * Simulate normal error rate
 */
async function simulateNormalRate(durationMs: number = 60000): Promise<void> {
  console.log(`\n📊 Simulating normal error rate for ${durationMs / 1000} seconds...`);
  const startTime = Date.now();

  while (Date.now() - startTime < durationMs) {
    await sendError(generateError());
    // Random delay between 2-5 seconds
    await sleep(2000 + Math.random() * 3000);
  }

  console.log('✓ Normal rate simulation complete');
}

/**
 * Simulate error spike
 */
async function simulateSpike(count: number = 20): Promise<void> {
  console.log(`\n🚨 Simulating error spike (${count} errors)...`);

  // Send errors rapidly to trigger spike detection
  for (let i = 0; i < count; i++) {
    await sendError(generateError());
    await sleep(200); // Rapid fire
  }

  console.log('✓ Spike simulation complete');
}

/**
 * Simulate specific error pattern (repeated errors)
 */
async function simulatePattern(count: number = 10): Promise<void> {
  console.log(`\n🔁 Simulating error pattern (${count} similar errors)...`);

  const baseError = generateError();

  for (let i = 0; i < count; i++) {
    await sendError({
      ...baseError,
      timestamp: Date.now(),
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    await sleep(500);
  }

  console.log('✓ Pattern simulation complete');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main simulation runner
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] || 'demo';

  console.log('🎯 Error Simulation Script');
  console.log(`Mode: ${mode}`);
  console.log(`API URL: ${API_URL}\n`);

  try {
    switch (mode) {
      case 'normal':
        // Continuous normal rate
        await simulateNormalRate(300000); // 5 minutes
        break;

      case 'spike':
        // Generate a spike
        await simulateSpike(30);
        break;

      case 'pattern':
        // Generate repeated pattern
        await simulatePattern(15);
        break;

      case 'batch':
        // Send a batch
        const batchSize = parseInt(args[1]) || 10;
        await sendBatch(batchSize);
        break;

      case 'demo':
      default:
        // Demo: Mix of normal rate, spike, and pattern
        console.log('Running comprehensive demo...\n');

        // 1. Normal rate for 30 seconds
        await simulateNormalRate(30000);

        // 2. Create a spike
        await sleep(2000);
        await simulateSpike(25);

        // 3. Normal rate again
        await sleep(5000);
        await simulateNormalRate(20000);

        // 4. Create a pattern
        await sleep(2000);
        await simulatePattern(12);

        // 5. Final batch
        await sleep(2000);
        await sendBatch(5);

        console.log('\n✓ Demo complete!');
        break;
    }
  } catch (error) {
    console.error('Simulation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateError, sendError, sendBatch };

