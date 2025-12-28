import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.logintelligence');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  LLM_PROVIDER?: 'gemini' | 'ollama';
  GEMINI_API_KEY?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
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
 * Get LLM provider
 */
export function getLLMProvider(): 'gemini' | 'ollama' {
  const config = getConfig();
  return config.LLM_PROVIDER || (process.env.LLM_PROVIDER as 'gemini' | 'ollama') || 'gemini';
}

/**
 * Set LLM provider
 */
export function setLLMProvider(provider: 'gemini' | 'ollama'): boolean {
  const config = getConfig();
  config.LLM_PROVIDER = provider;
  return saveConfig(config);
}

/**
 * Get Ollama base URL
 */
export function getOllamaBaseURL(): string {
  const config = getConfig();
  return config.OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
}

/**
 * Set Ollama base URL
 */
export function setOllamaBaseURL(baseUrl: string): boolean {
  const config = getConfig();
  config.OLLAMA_BASE_URL = baseUrl;
  return saveConfig(config);
}

/**
 * Get Ollama model
 */
export function getOllamaModel(): string {
  const config = getConfig();
  return config.OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'llama3.1';
}

/**
 * Set Ollama model
 */
export function setOllamaModel(model: string): boolean {
  const config = getConfig();
  config.OLLAMA_MODEL = model;
  return saveConfig(config);
}

/**
 * Check if configured
 */
export function isConfigured(): boolean {
  const provider = getLLMProvider();
  if (provider === 'ollama') {
    // Ollama doesn't require API key configuration
    return true;
  }
  return !!getApiKey();
}

export default {
  getConfig,
  saveConfig,
  getApiKey,
  setApiKey,
  getLLMProvider,
  setLLMProvider,
  getOllamaBaseURL,
  setOllamaBaseURL,
  getOllamaModel,
  setOllamaModel,
  getConfigPath,
  isConfigured
};

