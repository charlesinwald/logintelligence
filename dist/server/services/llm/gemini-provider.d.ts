import type { ErrorData, AIData } from '../../db/index.js';
import type { LLMProvider } from './types.js';
/**
 * Google Gemini LLM Provider
 */
export declare class GeminiProvider implements LLMProvider {
    name: string;
    private genAI;
    private streamingModel;
    private batchModel;
    constructor(apiKey: string, streamingModel?: string, batchModel?: string);
    isConfigured(): boolean;
    analyzeErrorStreaming(error: ErrorData, onChunk?: (chunk: string) => void): Promise<AIData>;
    analyzeError(error: ErrorData): Promise<AIData>;
}
//# sourceMappingURL=gemini-provider.d.ts.map