import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ErrorData, AIData } from '../../db/index.js';
import type { LLMProvider } from './types.js';
import { buildAnalysisPrompt, parseAIResponse } from './types.js';

/**
 * Google Gemini LLM Provider
 */
export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private genAI: GoogleGenerativeAI;
  private streamingModel: string;
  private batchModel: string;

  constructor(
    apiKey: string,
    streamingModel: string = 'gemini-2.5-flash',
    batchModel: string = 'gemini-1.5-flash'
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.streamingModel = streamingModel;
    this.batchModel = batchModel;
  }

  isConfigured(): boolean {
    return true; // If we got here, API key was provided
  }

  async analyzeErrorStreaming(
    error: ErrorData,
    onChunk?: (chunk: string) => void
  ): Promise<AIData> {
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
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  async analyzeError(error: ErrorData): Promise<AIData> {
    const model = this.genAI.getGenerativeModel({ model: this.batchModel });
    const prompt = buildAnalysisPrompt(error);

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return parseAIResponse(text);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
}
