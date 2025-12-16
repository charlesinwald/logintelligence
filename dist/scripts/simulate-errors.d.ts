/**
 * Error Simulation Script
 * Generates realistic error patterns for demo purposes
 * Requires Node.js 18+ for native fetch support
 */
interface ErrorData {
    message: string;
    stack_trace: string;
    timestamp: number;
    source: string;
    severity: string;
    environment: string;
    user_id: string;
    request_id: string;
    metadata: {
        url: string;
        method: string;
        ip: string;
        userAgent: string;
    };
}
/**
 * Generate a random error
 */
declare function generateError(): ErrorData;
/**
 * Send error to API
 */
declare function sendError(error: ErrorData): Promise<void>;
/**
 * Send batch of errors
 */
declare function sendBatch(count: number): Promise<void>;
export { generateError, sendError, sendBatch };
//# sourceMappingURL=simulate-errors.d.ts.map