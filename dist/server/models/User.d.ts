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
/**
 * Create a new user
 */
export declare function createUser(userData: CreateUserData): User;
/**
 * Get user by ID
 */
export declare function getUserById(userId: number): User | null;
/**
 * Get user by email
 */
export declare function getUserByEmail(email: string): User | null;
/**
 * Get user by verification token
 */
export declare function getUserByVerificationToken(token: string): User | null;
/**
 * Get user by reset token (only if not expired)
 */
export declare function getUserByResetToken(token: string): User | null;
/**
 * Update user
 */
export declare function updateUser(userId: number, updates: UpdateUserData): User;
/**
 * Delete user
 */
export declare function deleteUser(userId: number): void;
/**
 * Check if email exists
 */
export declare function emailExists(email: string): boolean;
//# sourceMappingURL=User.d.ts.map