#!/usr/bin/env node
import { createInterface } from 'readline';
import { stdin, argv } from 'process';
const defaultOptions = {
    serverUrl: 'localhost',
    port: 7878,
    source: 'cli-stream',
    severity: 'medium',
    environment: process.env.NODE_ENV || 'development',
    batchSize: 10,
    batchTimeout: 1000
};
function parseArgs() {
    const options = { ...defaultOptions };
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1];
        switch (arg) {
            case '--server':
            case '-s':
                options.serverUrl = nextArg;
                i++;
                break;
            case '--port':
            case '-p':
                options.port = parseInt(nextArg);
                i++;
                break;
            case '--source':
                options.source = nextArg;
                i++;
                break;
            case '--severity':
                options.severity = nextArg;
                i++;
                break;
            case '--env':
            case '-e':
                options.environment = nextArg;
                i++;
                break;
            case '--batch-size':
                options.batchSize = parseInt(nextArg);
                i++;
                break;
            case '--batch-timeout':
                options.batchTimeout = parseInt(nextArg);
                i++;
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
        }
    }
    return options;
}
function showHelp() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📥 LogIntelligence Stream Ingest                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Ingest errors from stdin/stderr streams into LogIntelligence.

Usage:
  your-app 2>&1 | logintelligence ingest [options]
  your-app 2>&1 | tsx scripts/ingest-stream.ts [options]

Options:
  -s, --server <url>        Server URL (default: localhost)
  -p, --port <port>         Server port (default: 7878)
  --source <name>           Source identifier (default: cli-stream)
  --severity <level>        Default severity: critical|high|medium|low
                           (default: medium)
  -e, --env <environment>   Environment: production|staging|development
                           (default: development)
  --batch-size <n>          Number of errors to batch (default: 10)
  --batch-timeout <ms>      Max time to wait for batch (default: 1000ms)
  -h, --help                Show this help

Examples:
  # Pipe stderr from a Node.js app
  node app.js 2>&1 | logintelligence ingest --source my-app

  # Monitor a Python script
  python script.py 2>&1 | logintelligence ingest --source python-app --severity high

  # Custom server location
  npm test 2>&1 | logintelligence ingest --server 192.168.1.100 --port 7878

  # Monitor build output
  npm run build 2>&1 | logintelligence ingest --source build-process
`);
}
class ErrorBatcher {
    options;
    endpoint;
    batch = [];
    timeout = null;
    constructor(options, endpoint) {
        this.options = options;
        this.endpoint = endpoint;
    }
    async add(line) {
        // Skip empty lines
        if (!line.trim())
            return;
        this.batch.push({
            message: line,
            timestamp: Date.now()
        });
        // Send batch if it reaches the size limit
        if (this.batch.length >= this.options.batchSize) {
            await this.flush();
            return;
        }
        // Reset timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        // Set timeout to flush batch
        this.timeout = setTimeout(() => this.flush(), this.options.batchTimeout);
    }
    async flush() {
        if (this.batch.length === 0)
            return;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        const errors = this.batch.map(item => ({
            message: item.message,
            source: this.options.source,
            severity: this.options.severity,
            environment: this.options.environment,
            timestamp: item.timestamp,
            metadata: {
                ingested_via: 'cli-stream',
                ingested_at: new Date().toISOString()
            }
        }));
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    errors
                })
            });
            if (!response.ok) {
                console.error(`[LogIntelligence] Failed to send batch: ${response.statusText}`);
            }
            else {
                console.error(`[LogIntelligence] ✓ Sent ${errors.length} error(s)`);
            }
        }
        catch (error) {
            console.error(`[LogIntelligence] Error sending batch:`, error instanceof Error ? error.message : error);
        }
        this.batch = [];
    }
}
async function main() {
    const options = parseArgs();
    const endpoint = `http://${options.serverUrl}:${options.port}/api/errors`;
    console.error(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📥 LogIntelligence Stream Ingest Active              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Configuration:
  Server:      http://${options.serverUrl}:${options.port}
  Source:      ${options.source}
  Severity:    ${options.severity}
  Environment: ${options.environment}
  Batch size:  ${options.batchSize} errors
  Batch wait:  ${options.batchTimeout}ms

Listening for input... (Press Ctrl+C to stop)
`);
    const batcher = new ErrorBatcher(options, endpoint);
    const rl = createInterface({ input: stdin });
    // Process each line from stdin
    rl.on('line', async (line) => {
        // Echo the line to stdout so it still appears in terminal
        console.log(line);
        // Send to LogIntelligence
        await batcher.add(line);
    });
    // Handle end of input
    rl.on('close', async () => {
        await batcher.flush();
        console.error('\n[LogIntelligence] Stream ended, all errors sent.');
        process.exit(0);
    });
    // Handle Ctrl+C
    process.on('SIGINT', async () => {
        console.error('\n[LogIntelligence] Shutting down...');
        await batcher.flush();
        process.exit(0);
    });
    // Test connection
    try {
        const response = await fetch(`http://${options.serverUrl}:${options.port}/health`);
        if (!response.ok) {
            console.error(`[LogIntelligence] Warning: Server health check failed`);
        }
    }
    catch (error) {
        console.error(`[LogIntelligence] Warning: Could not connect to server at ${endpoint}`);
        console.error(`[LogIntelligence] Make sure the LogIntelligence server is running`);
    }
}
main().catch(error => {
    console.error('[LogIntelligence] Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=ingest-stream.js.map