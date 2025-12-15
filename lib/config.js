import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.logintelligence');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get configuration
 */
export function getConfig() {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading config:', error.message);
    return {};
  }
}

/**
 * Save configuration
 */
export function saveConfig(config) {
  ensureConfigDir();

  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving config:', error.message);
    return false;
  }
}

/**
 * Get API key
 */
export function getApiKey() {
  const config = getConfig();
  return config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
}

/**
 * Set API key
 */
export function setApiKey(apiKey) {
  const config = getConfig();
  config.GEMINI_API_KEY = apiKey;
  return saveConfig(config);
}

/**
 * Get config file path
 */
export function getConfigPath() {
  return CONFIG_FILE;
}

/**
 * Check if configured
 */
export function isConfigured() {
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
