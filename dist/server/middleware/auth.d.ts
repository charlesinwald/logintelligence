import { Request, Response, NextFunction } from 'express';
import type { Subscription } from '../models/Subscription.js';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        name: string | null;
        subscription: Subscription;
    };
}
/**
 * Authentication middleware
 * Supports both JWT tokens (Authorization header or cookie) and API keys (X-API-Key header)
 */
export declare function authenticateUser(req: AuthRequest, res: Response, next: NextFunction): void;
/**
 * Optional authentication middleware
 * Adds user data to request if authenticated, but doesn't require it
 */
export declare function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map