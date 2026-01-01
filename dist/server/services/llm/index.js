import dotenv from 'dotenv';
import { GeminiProvider } from './gemini-provider.js';
import { OllamaProvider } from './ollama-provider.js';
dotenv.config();
/**
 * Creates and returns the appropriate LLM provider based on environment configuration
 */
export function createLLMProvider() {
    const provider = process.env.LLM_PROVIDER || 'gemini';
    switch (provider.toLowerCase()) {
        case 'ollama': {
            const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
            const model = process.env.OLLAMA_MODEL || 'llama3.1';
            console.log(`[LLM] Using Ollama provider with model: ${model} at ${baseUrl}`);
            return new OllamaProvider(baseUrl, model);
        }
        case 'gemini':
        default: {
            const apiKey = process.env.GEMINI_API_KEY || '';
            if (!apiKey) {
                throw new Error('GEMINI_API_KEY is required when using Gemini provider. ' +
                    'Set LLM_PROVIDER=ollama to use local LLM instead.');
            }
            const streamingModel = process.env.GEMINI_STREAMING_MODEL || 'gemini-2.5-flash';
            const batchModel = process.env.GEMINI_BATCH_MODEL || 'gemini-1.5-flash';
            console.log(`[LLM] Using Gemini provider with models: ${streamingModel} (streaming), ${batchModel} (batch)`);
            return new GeminiProvider(apiKey, streamingModel, batchModel);
        }
    }
}
export { buildAnalysisPrompt, parseAIResponse } from './types.js';
//# sourceMappingURL=index.js.map