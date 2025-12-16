interface Config {
    GEMINI_API_KEY?: string;
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
 * Check if configured
 */
export declare function isConfigured(): boolean;
declare const _default: {
    getConfig: typeof getConfig;
    saveConfig: typeof saveConfig;
    getApiKey: typeof getApiKey;
    setApiKey: typeof setApiKey;
    getConfigPath: typeof getConfigPath;
    isConfigured: typeof isConfigured;
};
export default _default;
//# sourceMappingURL=config.d.ts.map