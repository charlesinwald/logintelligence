import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
/**
 * Middleware to require Pro tier subscription
 * Must be used after authenticateUser middleware
 */
export declare function requirePro(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=requirePro.d.ts.map