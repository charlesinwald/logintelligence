import { db } from '../db/index.js';
import type { Statement } from 'better-sqlite3';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  email_verified: number;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: number | null;
  created_at: number;
  updated_at: number;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  name?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password_hash?: string;
  email_verified?: number;
  verification_token?: string | null;
  reset_token?: string | null;
  reset_token_expires?: number | null;
}

// Prepared statements
const statements = {
  insertUser: db.prepare<[string, string, string | null]>(`
    INSERT INTO users (email, password_hash, name)
    VALUES (?, ?, ?)
  `),

  getUserById: db.prepare<[number]>(`
    SELECT * FROM users WHERE id = ?
  `),

  getUserByEmail: db.prepare<[string]>(`
    SELECT * FROM users WHERE email = ?
  `),

  getUserByVerificationToken: db.prepare<[string]>(`
    SELECT * FROM users WHERE verification_token = ?
  `),

  getUserByResetToken: db.prepare<[string, number]>(`
    SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?
  `),

  updateUser: db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        password_hash = COALESCE(?, password_hash),
        email_verified = COALESCE(?, email_verified),
        verification_token = ?,
        reset_token = ?,
        reset_token_expires = ?,
        updated_at = ?
    WHERE id = ?
  `),

  deleteUser: db.prepare<[number]>(`
    DELETE FROM users WHERE id = ?
  `)
};

/**
 * Create a new user
 */
export function createUser(userData: CreateUserData): User {
  const result = statements.insertUser.run(
    userData.email,
    userData.password_hash,
    userData.name || null
  );

  const userId = Number(result.lastInsertRowid);
  const user = getUserById(userId);

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Get user by ID
 */
export function getUserById(userId: number): User | null {
  return statements.getUserById.get(userId) as User | undefined || null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  return statements.getUserByEmail.get(email) as User | undefined || null;
}

/**
 * Get user by verification token
 */
export function getUserByVerificationToken(token: string): User | null {
  return statements.getUserByVerificationToken.get(token) as User | undefined || null;
}

/**
 * Get user by reset token (only if not expired)
 */
export function getUserByResetToken(token: string): User | null {
  const now = Date.now();
  return statements.getUserByResetToken.get(token, now) as User | undefined || null;
}

/**
 * Update user
 */
export function updateUser(userId: number, updates: UpdateUserData): User {
  const now = Date.now();

  statements.updateUser.run(
    updates.name || null,
    updates.email || null,
    updates.password_hash || null,
    updates.email_verified !== undefined ? updates.email_verified : null,
    updates.verification_token !== undefined ? updates.verification_token : undefined,
    updates.reset_token !== undefined ? updates.reset_token : undefined,
    updates.reset_token_expires !== undefined ? updates.reset_token_expires : undefined,
    now,
    userId
  );

  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found after update');
  }

  return user;
}

/**
 * Delete user
 */
export function deleteUser(userId: number): void {
  statements.deleteUser.run(userId);
}

/**
 * Check if email exists
 */
export function emailExists(email: string): boolean {
  return getUserByEmail(email) !== null;
}
