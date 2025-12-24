/**
 * Generate a new API key
 * Format: li_sk_<32 random characters>
 */
export declare function generateApiKey(): string;
/**
 * Hash an API key for secure storage
 * Uses SHA-256 to create a one-way hash
 */
export declare function hashApiKey(apiKey: string): string;
/**
 * Get the prefix of an API key for display purposes
 * Returns first 8 characters (li_sk_ab)
 */
export declare function getApiKeyPrefix(apiKey: string): string;
/**
 * Validate API key format
 */
export declare function isValidApiKeyFormat(apiKey: string): boolean;
/**
 * Compare a plain API key with a hashed version
 */
export declare function compareApiKey(apiKey: string, hash: string): boolean;
//# sourceMappingURL=apiKey.d.ts.map