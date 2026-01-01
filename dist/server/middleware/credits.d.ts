import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
/**
 * Middleware to check if user has enough credits for AI operations
 * Returns 402 Payment Required if insufficient credits
 */
export declare function requireCredits(creditsNeeded?: number): (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Optional middleware that adds credit info to request but doesn't block
 */
export declare function attachCredits(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=credits.d.ts.map