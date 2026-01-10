/**
 * A/B Testing Infrastructure
 * 
 * Cookie-based variant assignment with analytics tracking.
 * Variants are sticky per user (stored in cookie for 30 days).
 */

// ============================================
// TYPES
// ============================================

export type Variant = 'A' | 'B';

export interface ABTest {
  id: string;
  name: string;
  variants: {
    A: string; // Description of variant A
    B: string; // Description of variant B
  };
  // Traffic split (0-100, percentage for variant B)
  trafficSplitB: number;
}

// ============================================
// ACTIVE TESTS
// ============================================

export const ACTIVE_TESTS: Record<string, ABTest> = {
  'hero-2024-12': {
    id: 'hero-2024-12',
    name: 'Hero Section Test - Dec 2024',
    variants: {
      A: 'Original: "Know Any Match Before It Happens"',
      B: 'Test: "AI-Powered Match Intelligence"',
    },
    trafficSplitB: 50, // 50/50 split
  },
  'query-classification-2026-01': {
    id: 'query-classification-2026-01',
    name: 'Query Classification Strategy - Jan 2026',
    variants: {
      A: 'Original: Pattern-first, LLM fallback',
      B: 'Test: LLM-first for ambiguous queries (confidence < 0.7)',
    },
    trafficSplitB: 20, // 20% get variant B (safer test)
  },
};

// ============================================
// VARIANT ASSIGNMENT (Server-side)
// ============================================

/**
 * Get or assign variant from cookies (server-side)
 */
export function getVariantFromCookies(
  testId: string,
  cookieValue: string | undefined
): Variant {
  // If cookie exists and is valid, return it
  if (cookieValue === 'A' || cookieValue === 'B') {
    return cookieValue;
  }
  
  // Otherwise assign based on traffic split
  const test = ACTIVE_TESTS[testId];
  if (!test) return 'A';
  
  const random = Math.random() * 100;
  return random < test.trafficSplitB ? 'B' : 'A';
}

/**
 * Generate cookie name for a test
 */
export function getTestCookieName(testId: string): string {
  return `ab_${testId}`;
}

// ============================================
// ANALYTICS TRACKING
// ============================================

/**
 * Track variant exposure (call when variant is rendered)
 * This sends to Google Analytics if available
 */
export function trackVariantExposure(testId: string, variant: Variant): void {
  if (typeof window === 'undefined') return;
  
  // Google Analytics 4 event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'ab_test_exposure', {
      test_id: testId,
      variant: variant,
      test_name: ACTIVE_TESTS[testId]?.name || testId,
    });
  }
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[A/B Test] ${testId}: Variant ${variant} exposed`);
  }
}

/**
 * Track conversion for a test
 */
export function trackConversion(testId: string, variant: Variant, action: string): void {
  if (typeof window === 'undefined') return;
  
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'ab_test_conversion', {
      test_id: testId,
      variant: variant,
      action: action,
    });
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[A/B Test] ${testId}: Variant ${variant} converted (${action})`);
  }
}
