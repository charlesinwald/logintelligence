#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import {
  isConfigured,
  getApiKey,
  getLLMProvider,
  getOllamaBaseURL,
  getOllamaModel
} from '../lib/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  // Handle commands
  if (command === 'setup') {
    // Run setup script
    const { setup } = await import('./setup.js');
    await setup();
    process.exit(0);
  }

  if (command === 'version' || command === '-v' || command === '--version') {
    const packageJson = JSON.parse(
      await import('fs').then(fs => fs.promises.readFile(join(rootDir, 'package.json'), 'utf-8'))
    );
    console.log(`logintelligence v${packageJson.version}`);
    process.exit(0);
  }

  if (command === 'help' || command === '-h' || command === '--help') {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ⚡ LogIntelligence Dashboard                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Usage: logintelligence [command]

Commands:
  (none)           Start the dashboard
  setup            Configure LLM provider (Gemini or Ollama)
  simulate         Run error simulation for demo
  ingest           Ingest errors from stdin/stderr stream
  version, -v      Show version number
  help, -h         Show this help message

Examples:
  logintelligence              # Start the dashboard
  logintelligence setup        # Configure LLM provider
  logintelligence simulate     # Run demo simulation
  your-app 2>&1 | logintelligence ingest --source my-app

For more information, visit:
https://github.com/charlesinwald/logintelligence
`);
    process.exit(0);
  }

  if (command === 'simulate') {
    console.log('🎯 Running error simulation...\n');

    const simulate = spawn('node', [join(rootDir, 'dist/scripts/simulate-errors.js'), ...args.slice(1)], {
      stdio: 'inherit',
      cwd: rootDir
    });

    simulate.on('exit', (code: number | null) => {
      process.exit(code || 0);
    });

    return;
  }

  if (command === 'ingest') {
    const ingest = spawn('node', [join(rootDir, 'dist/scripts/ingest-stream.js'), ...args.slice(1)], {
      stdio: 'inherit',
      cwd: rootDir
    });

    ingest.on('exit', (code: number | null) => {
      process.exit(code || 0);
    });

    return;
  }

  // Check if configured
  if (!isConfigured()) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   ⚠️  LogIntelligence Dashboard Not Configured         ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('You need to configure your LLM provider first.\n');
    console.log('Run: logintelligence setup\n');
    process.exit(1);
  }

  // Start the application
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║   🚀 Starting LogIntelligence Dashboard                ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Set environment variables from config
  const llmProvider = getLLMProvider();
  process.env.LLM_PROVIDER = llmProvider;

  if (llmProvider === 'gemini') {
    process.env.GEMINI_API_KEY = getApiKey() || '';
  } else if (llmProvider === 'ollama') {
    process.env.OLLAMA_BASE_URL = getOllamaBaseURL();
    process.env.OLLAMA_MODEL = getOllamaModel();
  }

  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PORT = process.env.PORT || '7878';

  // Ensure database directory exists
  const dbDir = join(rootDir, 'data');
  if (!existsSync(dbDir)) {
    await import('fs').then(fs => fs.promises.mkdir(dbDir, { recursive: true }));
  }

  // Set database path environment variable
  const dbPath = join(dbDir, 'errors.db');
  process.env.DB_PATH = dbPath;

  // Initialize database if needed
  if (!existsSync(dbPath)) {
    console.log('📦 Initializing database...');
    await import(join(rootDir, 'dist/server/db/index.js'));
    console.log('✓ Database initialized\n');
  }

  // Determine ports
  const PORT = process.env.PORT;

  console.log(`Server starting on: http://localhost:${PORT}`);
  console.log(`Dashboard will open at: http://localhost:${PORT}\n`);

  // Start the server
  const serverEnv: Record<string, string> = {
    ...process.env,
    LLM_PROVIDER: llmProvider,
    NODE_ENV: 'production',
    PORT: PORT
  };

  // Add provider-specific environment variables
  if (llmProvider === 'gemini') {
    serverEnv.GEMINI_API_KEY = getApiKey() || '';
  } else if (llmProvider === 'ollama') {
    serverEnv.OLLAMA_BASE_URL = getOllamaBaseURL();
    serverEnv.OLLAMA_MODEL = getOllamaModel();
  }

  const server = spawn('node', [join(rootDir, 'dist/server/index.js')], {
    stdio: 'inherit',
    cwd: rootDir,
    env: serverEnv
  });

  // Wait a bit for server to start, then open browser
  setTimeout(() => {
    const url = `http://localhost:${PORT}`;

    // Open browser based on platform
    const open = async () => {
      const { default: openBrowser } = await import('open');
      try {
        await openBrowser(url);
        console.log(`\n✓ Dashboard opened in your default browser`);
        console.log(`✓ If it didn't open, visit: ${url}\n`);
      } catch (error) {
        console.log(`\n✓ Server running at: ${url}`);
        console.log(`Please open this URL in your browser.\n`);
      }
    };

    open().catch(() => {
      console.log(`\n✓ Server running at: ${url}`);
      console.log(`Please open this URL in your browser.\n`);
    });
  }, 2000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    server.kill('SIGTERM');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });

  server.on('exit', (code: number | null) => {
    if (code !== 0 && code !== null) {
      console.error(`\n✗ Server exited with code ${code}`);
      process.exit(code);
    }
  });
}

// Run main function
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

