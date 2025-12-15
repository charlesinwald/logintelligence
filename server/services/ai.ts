import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import type { ErrorData, AIData } from '../db/index.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Analyzes an error using Gemini AI and streams the response
 * @param error - Error object with message, stack_trace, source
 * @param onChunk - Callback for each chunk of streaming response
 * @returns Parsed AI analysis
 */
export async function analyzeErrorStreaming(
  error: ErrorData,
  onChunk?: (chunk: string) => void
): Promise<AIData> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert error analysis system. Analyze the following application error and provide a structured response.

Error Details:
- Source/Service: ${error.source}
- Message: ${error.message}
- Stack Trace: ${error.stack_trace || 'Not provided'}
- Timestamp: ${new Date(error.timestamp).toISOString()}
${error.environment ? `- Environment: ${error.environment}` : ''}

Please provide:
1. CATEGORY: One concise category (e.g., "Database", "Authentication", "Network", "Null Reference", "Timeout", "Permission", "Configuration", "API", "Memory", "Syntax")
2. SEVERITY: One of: critical, high, medium, low
3. HYPOTHESIS: A brief 1-2 sentence root cause analysis

Format your response EXACTLY as:
CATEGORY: [category]
SEVERITY: [severity]
HYPOTHESIS: [your analysis]

Be concise and technical. Focus on actionable insights.`;

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

/**
 * Non-streaming version for batch processing
 */
export async function analyzeError(error: ErrorData): Promise<AIData> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert error analysis system. Analyze the following application error and provide a structured response.

Error Details:
- Source/Service: ${error.source}
- Message: ${error.message}
- Stack Trace: ${error.stack_trace || 'Not provided'}
- Timestamp: ${new Date(error.timestamp).toISOString()}
${error.environment ? `- Environment: ${error.environment}` : ''}

Please provide:
1. CATEGORY: One concise category (e.g., "Database", "Authentication", "Network", "Null Reference", "Timeout", "Permission", "Configuration", "API", "Memory", "Syntax")
2. SEVERITY: One of: critical, high, medium, low
3. HYPOTHESIS: A brief 1-2 sentence root cause analysis

Format your response EXACTLY as:
CATEGORY: [category]
SEVERITY: [severity]
HYPOTHESIS: [your analysis]

Be concise and technical. Focus on actionable insights.`;

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

/**
 * Parse AI response into structured format
 */
function parseAIResponse(text: string): AIData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  const analysis: AIData = {
    category: 'Unknown',
    severity: 'medium',
    hypothesis: 'Unable to analyze error'
  };

  for (const line of lines) {
    if (line.toUpperCase().startsWith('CATEGORY:')) {
      analysis.category = line.substring(line.indexOf(':') + 1).trim();
    } else if (line.toUpperCase().startsWith('SEVERITY:')) {
      const severity = line.substring(line.indexOf(':') + 1).trim().toLowerCase();
      if (['critical', 'high', 'medium', 'low'].includes(severity)) {
        analysis.severity = severity as 'critical' | 'high' | 'medium' | 'low';
      }
    } else if (line.toUpperCase().startsWith('HYPOTHESIS:')) {
      analysis.hypothesis = line.substring(line.indexOf(':') + 1).trim();
    }
  }

  return analysis;
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

export default {
  analyzeError,
  analyzeErrorStreaming,
  analyzeErrorBatch
};

