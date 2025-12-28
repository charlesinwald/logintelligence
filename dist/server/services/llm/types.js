/**
 * Shared prompt builder for consistent analysis across providers
 */
export function buildAnalysisPrompt(error) {
    return `You are an expert error analysis system. Analyze the following application error and provide a structured response.

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
}
/**
 * Parse AI response into structured format
 * Works across all LLM providers since they follow the same output format
 */
export function parseAIResponse(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const analysis = {
        category: 'Unknown',
        severity: 'medium',
        hypothesis: 'Unable to analyze error'
    };
    for (const line of lines) {
        if (line.toUpperCase().startsWith('CATEGORY:')) {
            analysis.category = line.substring(line.indexOf(':') + 1).trim();
        }
        else if (line.toUpperCase().startsWith('SEVERITY:')) {
            const severity = line.substring(line.indexOf(':') + 1).trim().toLowerCase();
            if (['critical', 'high', 'medium', 'low'].includes(severity)) {
                analysis.severity = severity;
            }
        }
        else if (line.toUpperCase().startsWith('HYPOTHESIS:')) {
            analysis.hypothesis = line.substring(line.indexOf(':') + 1).trim();
        }
    }
    return analysis;
}
//# sourceMappingURL=types.js.map