import type { ErrorData, AIData } from '../../db/index.js';
/**
 * Base interface for all LLM providers
 */
export interface LLMProvider {
    /**
     * Provider name (e.g., 'gemini', 'ollama')
     */
    name: string;
    /**
     * Analyzes an error with streaming support
     * @param error - Error to analyze
     * @param onChunk - Optional callback for streaming chunks
     * @returns Parsed AI analysis
     */
    analyzeErrorStreaming(error: ErrorData, onChunk?: (chunk: string) => void): Promise<AIData>;
    /**
     * Analyzes an error without streaming (batch mode)
     * @param error - Error to analyze
     * @returns Parsed AI analysis
     */
    analyzeError(error: ErrorData): Promise<AIData>;
    /**
     * Check if the provider is properly configured
     * @returns true if provider can be used
     */
    isConfigured(): boolean | Promise<boolean>;
}
/**
 * Configuration for LLM providers
 */
export interface LLMConfig {
    provider: 'gemini' | 'ollama';
    gemini?: {
        apiKey: string;
        streamingModel?: string;
        batchModel?: string;
    };
    ollama?: {
        baseUrl: string;
        model: string;
    };
}
/**
 * Shared prompt builder for consistent analysis across providers
 */
export declare function buildAnalysisPrompt(error: ErrorData): string;
/**
 * Parse AI response into structured format
 * Works across all LLM providers since they follow the same output format
 */
export declare function parseAIResponse(text: string): AIData;
//# sourceMappingURL=types.d.ts.map