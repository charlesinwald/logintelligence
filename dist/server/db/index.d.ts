import Database from 'better-sqlite3';
export interface ErrorData {
    message: string;
    stack_trace?: string | null;
    timestamp: number;
    source: string;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
    environment?: string | null;
    user_id?: string | null;
    request_id?: string | null;
    metadata?: Record<string, any> | null;
    ai_category?: string | null;
}
export interface ErrorRecord extends ErrorData {
    id: number;
    ai_severity?: string | null;
    ai_hypothesis?: string | null;
    ai_processed_at?: number | null;
    created_at: number;
}
export interface AIData {
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    hypothesis: string;
}
export interface CategoryStat {
    category: string | null;
    count: number;
    last_occurrence: number;
}
export interface ErrorPattern {
    id: number;
    pattern_hash: string;
    category: string | null;
    message_template: string | null;
    first_seen: number;
    last_seen: number;
    occurrence_count: number;
    severity: string | null;
    created_at: number;
    updated_at: number;
}
export interface ErrorStat {
    id: number;
    time_bucket: number;
    source: string;
    category: string | null;
    error_count: number;
    created_at: number;
}
export interface StatsRow {
    time_bucket: number;
    source: string;
    category: string | null;
    total_errors: number;
}
export interface HourlyAverage {
    source: string;
    category: string | null;
    avg_errors: number;
}
export declare const db: Database.Database;
export declare const statements: any;
export declare function insertError(errorData: ErrorData): number;
export declare function updateErrorWithAI(errorId: number, aiData: AIData): Database.RunResult;
export declare function getRecentErrors(limit?: number): ErrorRecord[];
export declare function getCategoryStats(timeWindowMs?: number): CategoryStat[];
export declare function getErrorsInTimeRange(startTime: number, endTime: number): ErrorRecord[];
export default db;
//# sourceMappingURL=index.d.ts.map