import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAnalysisPrompt, parseAIResponse } from './types.js';
/**
 * Google Gemini LLM Provider
 */
export class GeminiProvider {
    name = 'gemini';
    genAI;
    streamingModel;
    batchModel;
    constructor(apiKey, streamingModel = 'gemini-2.5-flash', batchModel = 'gemini-1.5-flash') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.streamingModel = streamingModel;
        this.batchModel = batchModel;
    }
    isConfigured() {
        return true; // If we got here, API key was provided
    }
    async analyzeErrorStreaming(error, onChunk) {
        const model = this.genAI.getGenerativeModel({ model: this.streamingModel });
        const prompt = buildAnalysisPrompt(error);
        try {
            const result = await model.generateContentStream(prompt);
            let fullResponse = '';
            // Stream chunks to the callback
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;
                if (onChunk) {
                    onChunk(chunkText);
                }
            }
            // Parse the response
            return parseAIResponse(fullResponse);
        }
        catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }
    async analyzeError(error) {
        const model = this.genAI.getGenerativeModel({ model: this.batchModel });
        const prompt = buildAnalysisPrompt(error);
        try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            return parseAIResponse(text);
        }
        catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=gemini-provider.js.map