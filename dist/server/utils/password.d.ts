/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a plain text password with a hashed password
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one number
 */
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Generate a random password reset token
 */
export declare function generateResetToken(): string;
//# sourceMappingURL=password.d.ts.map