import { type ErrorData, type ErrorRecord } from '../db/index.js';
/**
 * Generate a hash for error pattern matching
 * Uses message and first few lines of stack trace for similarity
 */
export declare function generateErrorHash(error: ErrorData): string;
/**
 * Track error pattern and update occurrence count
 */
export declare function trackErrorPattern(error: ErrorData, aiCategory: string | null): string;
export interface SpikeDetection {
    spike: boolean;
    currentRate: number;
    averageRate: number;
    threshold: number;
    multiplier: string;
    source: string;
    category: string | null;
    message: string;
}
/**
 * Detect spikes in error rates
 * Returns alerts if current rate exceeds baseline by threshold
 */
export declare function detectSpikes(source: string, category: string | null, thresholdMultiplier?: number): SpikeDetection;
export interface SimilarError extends ErrorRecord {
    similarity: number;
}
/**
 * Find similar errors based on message similarity
 */
export declare function findSimilarErrors(error: ErrorRecord, recentErrors: ErrorRecord[], threshold?: number): SimilarError[];
export interface ErrorStatistics {
    totalErrors: number;
    errorRate: number;
    categories: Array<{
        category: string | null;
        count: number;
        lastOccurrence: number;
    }>;
    timeSeries: Array<{
        timestamp: number;
        count: number;
        source: string;
        category: string | null;
    }>;
}
/**
 * Get error statistics for dashboard
 */
export declare function getErrorStatistics(timeWindowMs?: number): ErrorStatistics;
declare const _default: {
    generateErrorHash: typeof generateErrorHash;
    trackErrorPattern: typeof trackErrorPattern;
    detectSpikes: typeof detectSpikes;
    findSimilarErrors: typeof findSimilarErrors;
    getErrorStatistics: typeof getErrorStatistics;
};
export default _default;
//# sourceMappingURL=patterns.d.ts.map