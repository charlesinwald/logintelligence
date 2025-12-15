/**
 * Database setup script
 * Initializes the SQLite database with schema
 */

import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/errors.db';

// Ensure data directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  console.log(`Creating directory: ${dbDir}`);
  mkdirSync(dbDir, { recursive: true });
}

// Import and initialize database
import('../server/db/index.js')
  .then(() => {
    console.log('✓ Database setup complete!');
    console.log(`Database location: ${DB_PATH}`);
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('✗ Database setup failed:', error);
    process.exit(1);
  });

