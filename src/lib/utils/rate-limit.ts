/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for rate limiting
 */

interface RateLimitConfig {
  maxTokens: number; // Maximum number of tokens in the bucket
  refillRate: number; // Number of tokens added per interval
  refillInterval: number; // Interval in milliseconds
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory store for rate limiting (use Redis in production)
const buckets = new Map<string, TokenBucket>();

/**
 * Default rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Status updates: 10 updates per minute per driver
  STATUS_UPDATE: {
    maxTokens: 10,
    refillRate: 10,
    refillInterval: 60 * 1000, // 1 minute
  },
  // API calls: 100 requests per minute per IP
  API_GENERAL: {
    maxTokens: 100,
    refillRate: 100,
    refillInterval: 60 * 1000, // 1 minute
  },
  // Strict: 5 requests per minute (for sensitive operations)
  STRICT: {
    maxTokens: 5,
    refillRate: 5,
    refillInterval: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Check if request should be rate limited
 * @param key - Unique identifier for the rate limit (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining tokens
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_GENERAL
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  
  // Get or create bucket for this key
  let bucket = buckets.get(key);
  
  if (!bucket) {
    bucket = {
      tokens: config.maxTokens,
      lastRefill: now,
    };
    buckets.set(key, bucket);
  }

  // Refill tokens based on time elapsed
  const timeSinceLastRefill = now - bucket.lastRefill;
  const refillIntervals = Math.floor(timeSinceLastRefill / config.refillInterval);
  
  if (refillIntervals > 0) {
    const tokensToAdd = refillIntervals * config.refillRate;
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if we have tokens available
  const allowed = bucket.tokens >= 1;
  
  if (allowed) {
    bucket.tokens -= 1;
  }

  // Calculate reset time
  const resetAt = bucket.lastRefill + config.refillInterval;

  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    resetAt,
  };
}

/**
 * Middleware helper for rate limiting in API routes
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_GENERAL
): {
  allowed: boolean;
  headers: Record<string, string>;
  error?: { message: string; code: string };
} {
  const result = checkRateLimit(identifier, config);

  const headers = {
    'X-RateLimit-Limit': config.maxTokens.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    headers['Retry-After'] = retryAfter.toString();

    return {
      allowed: false,
      headers,
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    };
  }

  return {
    allowed: true,
    headers,
  };
}

/**
 * Get IP address from request
 */
export function getClientIp(request: Request): string {
  // Check for forwarded IP (from proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default if no IP is available
  return 'unknown';
}

/**
 * Clean up old buckets to prevent memory leaks
 * Should be called periodically (e.g., every hour)
 */
export function cleanupOldBuckets(maxAge: number = 60 * 60 * 1000): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  buckets.forEach((bucket, key) => {
    if (now - bucket.lastRefill > maxAge) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => buckets.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`Cleaned up ${keysToDelete.length} old rate limit buckets`);
  }
}

/**
 * Reset rate limit for a specific key (useful for testing or admin actions)
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig): {
  tokens: number;
  maxTokens: number;
  lastRefill: Date;
  resetAt: Date;
} {
  const bucket = buckets.get(key);
  
  if (!bucket) {
    return {
      tokens: config.maxTokens,
      maxTokens: config.maxTokens,
      lastRefill: new Date(),
      resetAt: new Date(Date.now() + config.refillInterval),
    };
  }

  return {
    tokens: Math.floor(bucket.tokens),
    maxTokens: config.maxTokens,
    lastRefill: new Date(bucket.lastRefill),
    resetAt: new Date(bucket.lastRefill + config.refillInterval),
  };
}

// Setup periodic cleanup
if (typeof global !== 'undefined') {
  setInterval(() => {
    cleanupOldBuckets();
  }, 60 * 60 * 1000); // Run every hour
}
