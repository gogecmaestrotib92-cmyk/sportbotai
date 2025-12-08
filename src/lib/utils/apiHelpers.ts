/**
 * API Helper Utilities
 * 
 * Provides retry logic, error handling, and request utilities
 * for API integrations (The Odds API, OpenAI, etc.)
 */

// ===========================================
// TYPES
// ===========================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;     // ms
  maxDelay: number;      // ms
  backoffFactor: number; // exponential backoff multiplier
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
}

export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

// ===========================================
// DEFAULT CONFIG
// ===========================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

// ===========================================
// ERROR CLASSIFICATION
// ===========================================

/**
 * Determines if an error is retryable based on status code
 */
export function isRetryableError(statusCode: number): boolean {
  // Retry on server errors (5xx) and rate limiting (429)
  return statusCode >= 500 || statusCode === 429;
}

/**
 * Parses API error response into structured error
 */
export function parseApiError(
  error: unknown, 
  statusCode?: number
): ApiError {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect. Please check your internet connection.',
        retryable: true,
      };
    }
    
    // Timeout errors
    if (error.name === 'AbortError') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        retryable: true,
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      statusCode,
      retryable: statusCode ? isRetryableError(statusCode) : false,
    };
  }
  
  // Status code based errors
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: 'Invalid request. Please check your input.',
          statusCode,
          retryable: false,
        };
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'API key is invalid or missing.',
          statusCode,
          retryable: false,
        };
      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied. Please check your subscription.',
          statusCode,
          retryable: false,
        };
      case 404:
        return {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          statusCode,
          retryable: false,
        };
      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait and try again.',
          statusCode,
          retryable: true,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVER_ERROR',
          message: 'Server error. Please try again later.',
          statusCode,
          retryable: true,
        };
    }
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
    statusCode,
    retryable: false,
  };
}

// ===========================================
// RETRY LOGIC
// ===========================================

/**
 * Calculate delay for next retry attempt with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  // Add jitter (±10%) to prevent thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const apiError = parseApiError(error);
      if (!apiError.retryable || attempt === retryConfig.maxRetries) {
        throw lastError;
      }
      
      // Wait before next retry
      const delay = calculateRetryDelay(attempt, retryConfig);
      console.log(`Retry attempt ${attempt + 1}/${retryConfig.maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// ===========================================
// FETCH WITH TIMEOUT
// ===========================================

/**
 * Fetch with configurable timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ===========================================
// USER-FRIENDLY ERROR MESSAGES
// ===========================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
    action: 'Retry',
  },
  RATE_LIMITED: {
    title: 'Too Many Requests',
    description: 'You\'ve made too many requests. Please wait a moment before trying again.',
    action: 'Wait & Retry',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    description: 'Our servers are experiencing issues. Please try again in a few minutes.',
    action: 'Retry Later',
  },
  UNAUTHORIZED: {
    title: 'Authentication Error',
    description: 'API key is invalid or not configured. Please check your settings.',
    action: 'Check Settings',
  },
  NO_DATA: {
    title: 'No Data Available',
    description: 'No matches or odds data available for this selection.',
    action: 'Try Another',
  },
  ANALYSIS_FAILED: {
    title: 'Analysis Failed',
    description: 'Unable to generate analysis. This might be due to insufficient data.',
    action: 'Try Again',
  },
};

/**
 * Get user-friendly error message based on error code
 */
export function getErrorDisplay(code: string): typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES] {
  return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || {
    title: 'Error',
    description: 'Something went wrong. Please try again.',
    action: 'Retry',
  };
}

// ===========================================
// API QUOTA TRACKING
// ===========================================

export interface QuotaInfo {
  used: number;
  remaining: number;
  limit: number;
  resetDate?: Date;
}

/**
 * Parse quota info from API response headers
 */
export function parseQuotaHeaders(headers: Headers): Partial<QuotaInfo> {
  return {
    used: parseInt(headers.get('x-requests-used') || '0'),
    remaining: parseInt(headers.get('x-requests-remaining') || '0'),
  };
}

/**
 * Check if quota is critically low (< 10%)
 */
export function isQuotaLow(quota: QuotaInfo): boolean {
  return quota.remaining / quota.limit < 0.1;
}
