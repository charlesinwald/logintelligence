import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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
    }
    catch (error) {
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
    }
    catch (error) {
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
 * Get LLM provider
 */
export function getLLMProvider() {
    const config = getConfig();
    return config.LLM_PROVIDER || process.env.LLM_PROVIDER || 'gemini';
}
/**
 * Set LLM provider
 */
export function setLLMProvider(provider) {
    const config = getConfig();
    config.LLM_PROVIDER = provider;
    return saveConfig(config);
}
/**
 * Get Ollama base URL
 */
export function getOllamaBaseURL() {
    const config = getConfig();
    return config.OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
}
/**
 * Set Ollama base URL
 */
export function setOllamaBaseURL(baseUrl) {
    const config = getConfig();
    config.OLLAMA_BASE_URL = baseUrl;
    return saveConfig(config);
}
/**
 * Get Ollama model
 */
export function getOllamaModel() {
    const config = getConfig();
    return config.OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'llama3.1';
}
/**
 * Set Ollama model
 */
export function setOllamaModel(model) {
    const config = getConfig();
    config.OLLAMA_MODEL = model;
    return saveConfig(config);
}
/**
 * Check if configured
 */
export function isConfigured() {
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
//# sourceMappingURL=config.js.map