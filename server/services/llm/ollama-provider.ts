import type { ErrorData, AIData } from '../../db/index.js';
import type { LLMProvider } from './types.js';
import { buildAnalysisPrompt, parseAIResponse } from './types.js';

/**
 * Ollama Local LLM Provider
 * Supports running local models like Llama 3, Mistral, etc.
 */
export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.1') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return false;

      const data = await response.json() as { models?: Array<{ name: string }> };
      // Check if the specified model is available
      return data.models?.some((m) => m.name.includes(this.model)) || false;
    } catch (error) {
      console.error('Error checking Ollama configuration:', error);
      return false;
    }
  }

  async analyzeErrorStreaming(
    error: ErrorData,
    onChunk?: (chunk: string) => void
  ): Promise<AIData> {
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
        if (done) break;

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
          } catch (e) {
            // Skip invalid JSON lines
            console.warn('Failed to parse Ollama response line:', line);
          }
        }
      }

      return parseAIResponse(fullResponse);
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      throw error;
    }
  }

  async analyzeError(error: ErrorData): Promise<AIData> {
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

      const data = await response.json() as { response: string };
      return parseAIResponse(data.response);
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      throw error;
    }
  }
}
