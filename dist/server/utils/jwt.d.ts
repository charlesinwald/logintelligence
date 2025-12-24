export interface TokenPayload {
    userId: number;
    email: string;
}
/**
 * Generate access token (short-lived, 15 minutes)
 */
export declare function generateAccessToken(userId: number, email: string): string;
/**
 * Generate refresh token (long-lived, 7 days)
 */
export declare function generateRefreshToken(userId: number, email: string): string;
/**
 * Verify access token
 */
export declare function verifyAccessToken(token: string): TokenPayload;
/**
 * Verify refresh token
 */
export declare function verifyRefreshToken(token: string): TokenPayload;
/**
 * Decode token without verification (for debugging)
 */
export declare function decodeToken(token: string): TokenPayload | null;
//# sourceMappingURL=jwt.d.ts.map