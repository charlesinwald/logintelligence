interface Config {
    LLM_PROVIDER?: 'gemini' | 'ollama';
    GEMINI_API_KEY?: string;
    OLLAMA_BASE_URL?: string;
    OLLAMA_MODEL?: string;
    [key: string]: any;
}
/**
 * Get configuration
 */
export declare function getConfig(): Config;
/**
 * Save configuration
 */
export declare function saveConfig(config: Config): boolean;
/**
 * Get API key
 */
export declare function getApiKey(): string | undefined;
/**
 * Set API key
 */
export declare function setApiKey(apiKey: string): boolean;
/**
 * Get config file path
 */
export declare function getConfigPath(): string;
/**
 * Get LLM provider
 */
export declare function getLLMProvider(): 'gemini' | 'ollama';
/**
 * Set LLM provider
 */
export declare function setLLMProvider(provider: 'gemini' | 'ollama'): boolean;
/**
 * Get Ollama base URL
 */
export declare function getOllamaBaseURL(): string;
/**
 * Set Ollama base URL
 */
export declare function setOllamaBaseURL(baseUrl: string): boolean;
/**
 * Get Ollama model
 */
export declare function getOllamaModel(): string;
/**
 * Set Ollama model
 */
export declare function setOllamaModel(model: string): boolean;
/**
 * Check if configured
 */
export declare function isConfigured(): boolean;
declare const _default: {
    getConfig: typeof getConfig;
    saveConfig: typeof saveConfig;
    getApiKey: typeof getApiKey;
    setApiKey: typeof setApiKey;
    getLLMProvider: typeof getLLMProvider;
    setLLMProvider: typeof setLLMProvider;
    getOllamaBaseURL: typeof getOllamaBaseURL;
    setOllamaBaseURL: typeof setOllamaBaseURL;
    getOllamaModel: typeof getOllamaModel;
    setOllamaModel: typeof setOllamaModel;
    getConfigPath: typeof getConfigPath;
    isConfigured: typeof isConfigured;
};
export default _default;
//# sourceMappingURL=config.d.ts.map