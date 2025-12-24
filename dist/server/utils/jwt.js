import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
/**
 * Generate access token (short-lived, 15 minutes)
 */
export function generateAccessToken(userId, email) {
    const payload = { userId, email };
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}
/**
 * Generate refresh token (long-lived, 7 days)
 */
export function generateRefreshToken(userId, email) {
    const payload = { userId, email };
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN
    });
}
/**
 * Verify access token
 */
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token expired');
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        throw error;
    }
}
/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        throw error;
    }
}
/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token) {
    try {
        return jwt.decode(token);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map