import type { ErrorData, AIData } from '../db/index.js';
/**
 * Analyzes an error using Gemini AI and streams the response
 * @param error - Error object with message, stack_trace, source
 * @param onChunk - Callback for each chunk of streaming response
 * @returns Parsed AI analysis
 */
export declare function analyzeErrorStreaming(error: ErrorData, onChunk?: (chunk: string) => void): Promise<AIData>;
/**
 * Non-streaming version for batch processing
 */
export declare function analyzeError(error: ErrorData): Promise<AIData>;
export interface BatchAnalysisResult {
    errorId: number;
    success: boolean;
    analysis: AIData | null;
    error: string | null;
}
/**
 * Batch analyze multiple errors
 */
export declare function analyzeErrorBatch(errors: Array<ErrorData & {
    id: number;
}>): Promise<BatchAnalysisResult[]>;
declare const _default: {
    analyzeError: typeof analyzeError;
    analyzeErrorStreaming: typeof analyzeErrorStreaming;
    analyzeErrorBatch: typeof analyzeErrorBatch;
};
export default _default;
//# sourceMappingURL=ai.d.ts.map