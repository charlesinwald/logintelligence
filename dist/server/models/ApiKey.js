import { db } from '../db/index.js';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '../utils/apiKey.js';
// Prepared statements
const statements = {
    insertApiKey: db.prepare(`
    INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
    VALUES (?, ?, ?, ?)
  `),
    getApiKeyById: db.prepare(`
    SELECT * FROM api_keys WHERE id = ?
  `),
    getApiKeyByHash: db.prepare(`
    SELECT * FROM api_keys WHERE key_hash = ?
  `),
    getApiKeysByUserId: db.prepare(`
    SELECT * FROM api_keys WHERE user_id = ?
    ORDER BY created_at DESC
  `),
    updateApiKeyLastUsed: db.prepare(`
    UPDATE api_keys
    SET last_used_at = ?
    WHERE id = ?
  `),
    deleteApiKey: db.prepare(`
    DELETE FROM api_keys WHERE id = ?
  `),
    deleteApiKeyByUserId: db.prepare(`
    DELETE FROM api_keys WHERE id = ? AND user_id = ?
  `)
};
/**
 * Create a new API key
 * Returns the plain text key (only time it's shown)
 */
export function createApiKey(data) {
    // Generate new API key
    const plainKey = generateApiKey();
    const keyHash = hashApiKey(plainKey);
    const keyPrefix = getApiKeyPrefix(plainKey);
    const result = statements.insertApiKey.run(data.user_id, keyHash, keyPrefix, data.name || null);
    const apiKeyId = Number(result.lastInsertRowid);
    const apiKey = getApiKeyById(apiKeyId);
    if (!apiKey) {
        throw new Error('Failed to create API key');
    }
    return {
        ...apiKey,
        plain_key: plainKey
    };
}
/**
 * Get API key by ID
 */
export function getApiKeyById(id) {
    return statements.getApiKeyById.get(id) || null;
}
/**
 * Get API key by hash
 */
export function getApiKeyByHash(hash) {
    return statements.getApiKeyByHash.get(hash) || null;
}
/**
 * Verify API key and return associated key record
 */
export function verifyApiKey(plainKey) {
    const keyHash = hashApiKey(plainKey);
    return getApiKeyByHash(keyHash);
}
/**
 * Get all API keys for a user (without plain text keys)
 */
export function getApiKeysByUserId(userId) {
    return statements.getApiKeysByUserId.all(userId);
}
/**
 * Update API key last used timestamp
 */
export function updateApiKeyLastUsed(id) {
    const now = Date.now();
    statements.updateApiKeyLastUsed.run(now, id);
}
/**
 * Delete API key
 */
export function deleteApiKey(id) {
    statements.deleteApiKey.run(id);
}
/**
 * Delete API key (with user ownership check)
 */
export function deleteApiKeyByUser(id, userId) {
    const result = statements.deleteApiKeyByUserId.run(id, userId);
    return result.changes > 0;
}
//# sourceMappingURL=ApiKey.js.map