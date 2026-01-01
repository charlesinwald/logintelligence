import { buildAnalysisPrompt, parseAIResponse } from './types.js';
/**
 * Ollama Local LLM Provider
 * Supports running local models like Llama 3, Mistral, etc.
 */
export class OllamaProvider {
    name = 'ollama';
    baseUrl;
    model;
    constructor(baseUrl = 'http://localhost:11434', model = 'llama3.1') {
        this.baseUrl = baseUrl;
        this.model = model;
    }
    async isConfigured() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok)
                return false;
            const data = await response.json();
            // Check if the specified model is available
            return data.models?.some((m) => m.name.includes(this.model)) || false;
        }
        catch (error) {
            console.error('Error checking Ollama configuration:', error);
            return false;
        }
    }
    async analyzeErrorStreaming(error, onChunk) {
        const prompt = buildAnalysisPrompt(error);
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: true,
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            let fullResponse = '';
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) {
                throw new Error('No response body from Ollama');
            }
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            fullResponse += json.response;
                            if (onChunk) {
                                onChunk(json.response);
                            }
                        }
                    }
                    catch (e) {
                        // Skip invalid JSON lines
                        console.warn('Failed to parse Ollama response line:', line);
                    }
                }
            }
            return parseAIResponse(fullResponse);
        }
        catch (error) {
            console.error('Error calling Ollama API:', error);
            throw error;
        }
    }
    async analyzeError(error) {
        const prompt = buildAnalysisPrompt(error);
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            const data = await response.json();
            return parseAIResponse(data.response);
        }
        catch (error) {
            console.error('Error calling Ollama API:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=ollama-provider.js.map