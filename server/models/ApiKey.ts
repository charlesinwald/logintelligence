import { db } from '../db/index.js';
import type { Statement } from 'better-sqlite3';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '../utils/apiKey.js';

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
  plain_key: string; // Only returned once when created
}

// Prepared statements
const statements = {
  insertApiKey: db.prepare<[number, string, string, string | null]>(`
    INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
    VALUES (?, ?, ?, ?)
  `),

  getApiKeyById: db.prepare<[number]>(`
    SELECT * FROM api_keys WHERE id = ?
  `),

  getApiKeyByHash: db.prepare<[string]>(`
    SELECT * FROM api_keys WHERE key_hash = ?
  `),

  getApiKeysByUserId: db.prepare<[number]>(`
    SELECT * FROM api_keys WHERE user_id = ?
    ORDER BY created_at DESC
  `),

  updateApiKeyLastUsed: db.prepare<[number, number]>(`
    UPDATE api_keys
    SET last_used_at = ?
    WHERE id = ?
  `),

  deleteApiKey: db.prepare<[number]>(`
    DELETE FROM api_keys WHERE id = ?
  `),

  deleteApiKeyByUserId: db.prepare<[number, number]>(`
    DELETE FROM api_keys WHERE id = ? AND user_id = ?
  `)
};

/**
 * Create a new API key
 * Returns the plain text key (only time it's shown)
 */
export function createApiKey(data: CreateApiKeyData): ApiKeyWithPlainText {
  // Generate new API key
  const plainKey = generateApiKey();
  const keyHash = hashApiKey(plainKey);
  const keyPrefix = getApiKeyPrefix(plainKey);

  const result = statements.insertApiKey.run(
    data.user_id,
    keyHash,
    keyPrefix,
    data.name || null
  );

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
export function getApiKeyById(id: number): ApiKey | null {
  return statements.getApiKeyById.get(id) as ApiKey | undefined || null;
}

/**
 * Get API key by hash
 */
export function getApiKeyByHash(hash: string): ApiKey | null {
  return statements.getApiKeyByHash.get(hash) as ApiKey | undefined || null;
}

/**
 * Verify API key and return associated key record
 */
export function verifyApiKey(plainKey: string): ApiKey | null {
  const keyHash = hashApiKey(plainKey);
  return getApiKeyByHash(keyHash);
}

/**
 * Get all API keys for a user (without plain text keys)
 */
export function getApiKeysByUserId(userId: number): ApiKey[] {
  return statements.getApiKeysByUserId.all(userId) as ApiKey[];
}

/**
 * Update API key last used timestamp
 */
export function updateApiKeyLastUsed(id: number): void {
  const now = Date.now();
  statements.updateApiKeyLastUsed.run(now, id);
}

/**
 * Delete API key
 */
export function deleteApiKey(id: number): void {
  statements.deleteApiKey.run(id);
}

/**
 * Delete API key (with user ownership check)
 */
export function deleteApiKeyByUser(id: number, userId: number): boolean {
  const result = statements.deleteApiKeyByUserId.run(id, userId);
  return result.changes > 0;
}
