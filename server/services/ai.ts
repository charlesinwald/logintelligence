import type { ErrorData, AIData } from '../db/index.js';
import { createLLMProvider } from './llm/index.js';

// Create the LLM provider singleton
const llmProvider = createLLMProvider();

/**
 * Analyzes an error using the configured LLM provider and streams the response
 * @param error - Error object with message, stack_trace, source
 * @param onChunk - Callback for each chunk of streaming response
 * @returns Parsed AI analysis
 */
export async function analyzeErrorStreaming(
  error: ErrorData,
  onChunk?: (chunk: string) => void
): Promise<AIData> {
  return llmProvider.analyzeErrorStreaming(error, onChunk);
}

/**
 * Non-streaming version for batch processing
 */
export async function analyzeError(error: ErrorData): Promise<AIData> {
  return llmProvider.analyzeError(error);
}

export interface BatchAnalysisResult {
  errorId: number;
  success: boolean;
  analysis: AIData | null;
  error: string | null;
}

/**
 * Batch analyze multiple errors
 */
export async function analyzeErrorBatch(errors: Array<ErrorData & { id: number }>): Promise<BatchAnalysisResult[]> {
  const results = await Promise.allSettled(
    errors.map(error => analyzeError(error))
  );

  return results.map((result, index) => ({
    errorId: errors[index].id,
    success: result.status === 'fulfilled',
    analysis: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? (result.reason as Error).message : null
  }));
}

/**
 * Get the current LLM provider name
 */
export function getProviderName(): string {
  return llmProvider.name;
}

export default {
  analyzeError,
  analyzeErrorStreaming,
  analyzeErrorBatch,
  getProviderName
};
