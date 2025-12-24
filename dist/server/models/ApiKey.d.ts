export interface ApiKey {
    id: number;
    user_id: number;
    key_hash: string;
    key_prefix: string;
    name: string | null;
    last_used_at: number | null;
    created_at: number;
}
export interface CreateApiKeyData {
    user_id: number;
    name?: string;
}
export interface ApiKeyWithPlainText extends ApiKey {
    plain_key: string;
}
/**
 * Create a new API key
 * Returns the plain text key (only time it's shown)
 */
export declare function createApiKey(data: CreateApiKeyData): ApiKeyWithPlainText;
/**
 * Get API key by ID
 */
export declare function getApiKeyById(id: number): ApiKey | null;
/**
 * Get API key by hash
 */
export declare function getApiKeyByHash(hash: string): ApiKey | null;
/**
 * Verify API key and return associated key record
 */
export declare function verifyApiKey(plainKey: string): ApiKey | null;
/**
 * Get all API keys for a user (without plain text keys)
 */
export declare function getApiKeysByUserId(userId: number): ApiKey[];
/**
 * Update API key last used timestamp
 */
export declare function updateApiKeyLastUsed(id: number): void;
/**
 * Delete API key
 */
export declare function deleteApiKey(id: number): void;
/**
 * Delete API key (with user ownership check)
 */
export declare function deleteApiKeyByUser(id: number, userId: number): boolean;
//# sourceMappingURL=ApiKey.d.ts.map