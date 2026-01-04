/**
 * Pattern-based category matching for errors without AI analysis
 * Provides fallback categorization when AI categories are unavailable
 */

export interface CategoryPattern {
  category: string;
  keywords: string[];
  priority: number;
}

/**
 * Category patterns based on common error types
 * Patterns are prioritized (higher = checked first)
 */
export const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    category: 'Database',
    keywords: [
      'database',
      'sql',
      'query',
      'connection pool',
      'deadlock',
      'transaction',
      'postgres',
      'postgresql',
      'mysql',
      'mongodb',
      'mongo',
      'redis',
      'table does not exist',
      'constraint violation',
      'db.',
      'connection timeout',
      'connection refused on port 5432',
      'connection refused on port 3306',
      'connection refused on port 27017',
      'prisma',
      'sequelize',
      'typeorm'
    ],
    priority: 10
  },
  {
    category: 'Authentication',
    keywords: [
      'auth',
      'jwt',
      'token',
      'oauth',
      'session',
      'login',
      'credential',
      'permission',
      'unauthorized',
      'forbidden',
      'access denied',
      'token expired',
      'invalid token',
      'authentication failed',
      'authorization',
      '401',
      '403'
    ],
    priority: 10
  },
  {
    category: 'Network',
    keywords: [
      'econnrefused',
      'timeout',
      'dns',
      'socket',
      'network',
      'connection refused',
      'unreachable',
      'etimedout',
      'fetch failed',
      'request timeout',
      'connection reset',
      'socket hang up',
      'enetunreach',
      'enotfound',
      'getaddrinfo',
      'ehostunreach',
      'econnreset'
    ],
    priority: 9
  },
  {
    category: 'API',
    keywords: [
      '404',
      '500',
      '503',
      '502',
      '429',
      'bad request',
      'not found',
      'internal server error',
      'service unavailable',
      'gateway timeout',
      'rate limit',
      'too many requests',
      'bad gateway',
      'http error',
      'status code'
    ],
    priority: 9
  },
  {
    category: 'Null Reference',
    keywords: [
      'cannot read property',
      'cannot read properties',
      'undefined',
      'null',
      'is not defined',
      'typeerror',
      'referenceerror',
      'cannot access',
      'is not a function',
      'of undefined',
      'of null'
    ],
    priority: 8
  },
  {
    category: 'Memory',
    keywords: [
      'memory',
      'heap',
      'out of memory',
      'allocation failed',
      'stack overflow',
      'memory limit',
      'oom',
      'enomem',
      'javascript heap'
    ],
    priority: 8
  },
  {
    category: 'Validation',
    keywords: [
      'validation',
      'invalid',
      'required',
      'schema',
      'malformed',
      'invalid input',
      'validation error',
      'validation failed',
      'zod',
      'joi',
      'yup'
    ],
    priority: 7
  },
  {
    category: 'Timeout',
    keywords: [
      'request timeout',
      'execution timeout',
      'operation timed out',
      'timed out',
      'deadline exceeded',
      'timeout'
    ],
    priority: 11 // Higher priority to match before Network
  },
  {
    category: 'Configuration',
    keywords: [
      'environment variable',
      'missing env',
      'env var',
      'process.env',
      '.env',
      'dotenv',
      'config',
      'configuration',
      'settings',
      'not configured'
    ],
    priority: 11 // Higher priority to match before Database
  }
];

/**
 * Match error to category based on keywords in message and stack trace
 * @param error Error object with message and optional stack_trace
 * @returns Category name or null if no match found
 */
export function matchErrorCategory(error: {
  message: string;
  stack_trace?: string | null;
}): string | null {
  const searchText = `${error.message} ${error.stack_trace || ''}`.toLowerCase();

  // Sort patterns by priority (higher first)
  const sortedPatterns = [...CATEGORY_PATTERNS].sort((a, b) => b.priority - a.priority);

  for (const pattern of sortedPatterns) {
    for (const keyword of pattern.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return pattern.category;
      }
    }
  }

  return null;
}

/**
 * Get hybrid category using fallback chain:
 * AI category > User category > Pattern-based > null
 * @param error Error object with ai_category, category, message, and stack_trace
 * @returns Category name or null
 */
export function getHybridCategory(error: {
  ai_category?: string | null;
  category?: string | null;
  message: string;
  stack_trace?: string | null;
}): string | null {
  // Priority 1: AI-generated category (most accurate)
  if (error.ai_category) {
    return error.ai_category;
  }

  // Priority 2: User-provided category (explicit intent)
  if (error.category) {
    return error.category;
  }

  // Priority 3: Pattern-based matching (heuristic fallback)
  return matchErrorCategory(error);
}

/**
 * Get the source of the category for UI display
 * @param error Error object
 * @returns Category source: 'ai', 'user', 'pattern', or 'none'
 */
export function getCategorySource(error: {
  ai_category?: string | null;
  category?: string | null;
  message: string;
  stack_trace?: string | null;
}): 'ai' | 'user' | 'pattern' | 'none' {
  if (error.ai_category) {
    return 'ai';
  }
  if (error.category) {
    return 'user';
  }
  if (matchErrorCategory(error)) {
    return 'pattern';
  }
  return 'none';
}
