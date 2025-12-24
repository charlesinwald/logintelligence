import { nanoid } from 'nanoid';
import crypto from 'crypto';

const API_KEY_PREFIX = 'li_sk_';
const API_KEY_LENGTH = 32;

/**
 * Generate a new API key
 * Format: li_sk_<32 random characters>
 */
export function generateApiKey(): string {
  const randomPart = nanoid(API_KEY_LENGTH);
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Hash an API key for secure storage
 * Uses SHA-256 to create a one-way hash
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Get the prefix of an API key for display purposes
 * Returns first 8 characters (li_sk_ab)
 */
export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 8);
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return false;
  }

  // Check length: prefix (6 chars) + random part (32 chars) = 38 total
  const expectedLength = API_KEY_PREFIX.length + API_KEY_LENGTH;
  return apiKey.length === expectedLength;
}

/**
 * Compare a plain API key with a hashed version
 */
export function compareApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  return computedHash === hash;
}
