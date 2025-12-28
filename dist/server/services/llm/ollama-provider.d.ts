import type { ErrorData, AIData } from '../../db/index.js';
import type { LLMProvider } from './types.js';
/**
 * Ollama Local LLM Provider
 * Supports running local models like Llama 3, Mistral, etc.
 */
export declare class OllamaProvider implements LLMProvider {
    name: string;
    private baseUrl;
    private model;
    constructor(baseUrl?: string, model?: string);
    isConfigured(): Promise<boolean>;
    analyzeErrorStreaming(error: ErrorData, onChunk?: (chunk: string) => void): Promise<AIData>;
    analyzeError(error: ErrorData): Promise<AIData>;
}
//# sourceMappingURL=ollama-provider.d.ts.map