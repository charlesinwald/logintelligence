import { db } from '../db/index.js';
// Prepared statements
const statements = {
    insertUser: db.prepare(`
    INSERT INTO users (email, password_hash, name)
    VALUES (?, ?, ?)
  `),
    getUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),
    getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),
    getUserByVerificationToken: db.prepare(`
    SELECT * FROM users WHERE verification_token = ?
  `),
    getUserByResetToken: db.prepare(`
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
    deleteUser: db.prepare(`
    DELETE FROM users WHERE id = ?
  `)
};
/**
 * Create a new user
 */
export function createUser(userData) {
    const result = statements.insertUser.run(userData.email, userData.password_hash, userData.name || null);
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
export function getUserById(userId) {
    return statements.getUserById.get(userId) || null;
}
/**
 * Get user by email
 */
export function getUserByEmail(email) {
    return statements.getUserByEmail.get(email) || null;
}
/**
 * Get user by verification token
 */
export function getUserByVerificationToken(token) {
    return statements.getUserByVerificationToken.get(token) || null;
}
/**
 * Get user by reset token (only if not expired)
 */
export function getUserByResetToken(token) {
    const now = Date.now();
    return statements.getUserByResetToken.get(token, now) || null;
}
/**
 * Update user
 */
export function updateUser(userId, updates) {
    const now = Date.now();
    statements.updateUser.run(updates.name || null, updates.email || null, updates.password_hash || null, updates.email_verified !== undefined ? updates.email_verified : null, updates.verification_token !== undefined ? updates.verification_token : undefined, updates.reset_token !== undefined ? updates.reset_token : undefined, updates.reset_token_expires !== undefined ? updates.reset_token_expires : undefined, now, userId);
    const user = getUserById(userId);
    if (!user) {
        throw new Error('User not found after update');
    }
    return user;
}
/**
 * Delete user
 */
export function deleteUser(userId) {
    statements.deleteUser.run(userId);
}
/**
 * Check if email exists
 */
export function emailExists(email) {
    return getUserByEmail(email) !== null;
}
//# sourceMappingURL=User.js.map