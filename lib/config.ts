import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.logintelligence');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get configuration
 */
export function getConfig(): Config {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading config:', (error as Error).message);
    return {};
  }
}

/**
 * Save configuration
 */
export function saveConfig(config: Config): boolean {
  ensureConfigDir();

  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving config:', (error as Error).message);
    return false;
  }
}

/**
 * Get API key
 */
export function getApiKey(): string | undefined {
  const config = getConfig();
  return config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
}

/**
 * Set API key
 */
export function setApiKey(apiKey: string): boolean {
  const config = getConfig();
  config.GEMINI_API_KEY = apiKey;
  return saveConfig(config);
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Check if configured
 */
export function isConfigured(): boolean {
  return !!getApiKey();
}

export default {
  getConfig,
  saveConfig,
  getApiKey,
  setApiKey,
  getConfigPath,
  isConfigured
};

