import { db } from '../db/index.js';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '../utils/apiKey.js';
import { getSubscriptionByUserId, isProTier } from './Subscription.js';
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
 * Check if user can create more API keys based on subscription tier
 * Free tier: Max 1 API key
 * Pro tier: Unlimited
 */
export function canCreateApiKey(userId) {
    const subscription = getSubscriptionByUserId(userId);
    const isPro = subscription ? isProTier(subscription) : false;
    if (isPro) {
        // Pro tier: unlimited API keys
        return {
            allowed: true,
            currentCount: getApiKeysByUserId(userId).length,
            limit: 999999 // Effectively unlimited
        };
    }
    // Free tier: max 1 API key
    const currentKeys = getApiKeysByUserId(userId);
    const currentCount = currentKeys.length;
    const limit = 1;
    if (currentCount >= limit) {
        return {
            allowed: false,
            reason: `Free tier users are limited to ${limit} API key. Upgrade to Pro for unlimited API keys.`,
            currentCount,
            limit
        };
    }
    return {
        allowed: true,
        currentCount,
        limit
    };
}
/**
 * Create a new API key
 * Returns the plain text key (only time it's shown)
 * Throws error if user has reached their API key limit
 */
export function createApiKey(data) {
    // Check if user can create more API keys
    const canCreate = canCreateApiKey(data.user_id);
    if (!canCreate.allowed) {
        throw new Error(canCreate.reason || 'API key limit reached');
    }
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