/**
 * Analytics & Event Tracking Utility
 * 
 * Centralized analytics for Google Analytics and custom events
 */

// Types for analytics events
type AnalyticsEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

type AnalysisEvent = {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  plan: string;
};

type PurchaseEvent = {
  plan: string;
  price: number;
  currency?: string;
};

/**
 * Check if Google Analytics is available
 */
function isGAAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Track a custom event to Google Analytics
 */
export function trackEvent({ action, category, label, value }: AnalyticsEvent): void {
  if (!isGAAvailable()) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

/**
 * Track page view (for client-side navigation)
 */
export function trackPageView(url: string): void {
  if (!isGAAvailable()) return;

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    page_path: url,
  });
}

/**
 * Track analysis started
 */
export function trackAnalysisStart({ sport, homeTeam, awayTeam, plan }: AnalysisEvent): void {
  trackEvent({
    action: 'analysis_start',
    category: 'Engagement',
    label: `${sport}: ${homeTeam} vs ${awayTeam}`,
  });

  // Also track sport separately
  trackEvent({
    action: 'sport_selected',
    category: 'Engagement',
    label: sport,
  });
}

/**
 * Track analysis completed
 */
export function trackAnalysisComplete({ sport, homeTeam, awayTeam, plan }: AnalysisEvent): void {
  trackEvent({
    action: 'analysis_complete',
    category: 'Conversion',
    label: `${sport}: ${homeTeam} vs ${awayTeam}`,
  });
}

/**
 * Track checkout started
 */
export function trackCheckoutStart({ plan, price, currency = 'EUR' }: PurchaseEvent): void {
  if (!isGAAvailable()) return;

  window.gtag('event', 'begin_checkout', {
    currency,
    value: price,
    items: [
      {
        item_id: plan.toLowerCase(),
        item_name: `${plan} Plan`,
        price: price,
        quantity: 1,
      },
    ],
  });
}

/**
 * Track purchase completed
 */
export function trackPurchase({ plan, price, currency = 'EUR' }: PurchaseEvent): void {
  if (!isGAAvailable()) return;

  window.gtag('event', 'purchase', {
    transaction_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    currency,
    value: price,
    items: [
      {
        item_id: plan.toLowerCase(),
        item_name: `${plan} Plan`,
        price: price,
        quantity: 1,
      },
    ],
  });
}

/**
 * Track sign up
 */
export function trackSignUp(method: 'email' | 'google' | 'github'): void {
  if (!isGAAvailable()) return;

  window.gtag('event', 'sign_up', {
    method,
  });
}

/**
 * Track login
 */
export function trackLogin(method: 'email' | 'google' | 'github'): void {
  if (!isGAAvailable()) return;

  window.gtag('event', 'login', {
    method,
  });
}

/**
 * Set user properties (plan, etc.)
 */
export function setUserProperties(properties: { plan?: string; userId?: string }): void {
  if (!isGAAvailable()) return;

  window.gtag('set', 'user_properties', {
    user_plan: properties.plan,
  });

  if (properties.userId) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: properties.userId,
    });
  }
}

/**
 * Track CTA clicks
 */
export function trackCTAClick(ctaName: string, location: string): void {
  trackEvent({
    action: 'cta_click',
    category: 'Engagement',
    label: `${ctaName} - ${location}`,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string): void {
  trackEvent({
    action: 'feature_used',
    category: 'Engagement',
    label: feature,
  });
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}
