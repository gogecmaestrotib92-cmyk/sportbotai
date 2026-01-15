/**
 * Analytics & Event Tracking Utility
 * 
 * Centralized analytics for Google Analytics and custom events
 */

// Type for gtag function
type GtagFunction = (
  command: 'config' | 'event' | 'set',
  targetId: string,
  config?: Record<string, unknown>
) => void;

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: GtagFunction;
  }
}

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
 * Get gtag function if available, otherwise return null
 */
function getGtag(): GtagFunction | null {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    return window.gtag;
  }
  return null;
}

/**
 * Check if Google Analytics is available
 */
function isGAAvailable(): boolean {
  return getGtag() !== null;
}

/**
 * Track a custom event to Google Analytics
 */
export function trackEvent({ action, category, label, value }: AnalyticsEvent): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

/**
 * Track page view (for client-side navigation)
 */
export function trackPageView(url: string): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
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
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', 'begin_checkout', {
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
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', 'purchase', {
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
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', 'sign_up', {
    method,
  });
}

/**
 * Track login
 */
export function trackLogin(method: 'email' | 'google' | 'github'): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', 'login', {
    method,
  });
}

/**
 * Set user properties (plan, etc.)
 */
export function setUserProperties(properties: { plan?: string; userId?: string }): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('set', 'user_properties', {
    user_plan: properties.plan,
  });

  if (properties.userId) {
    gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
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

/**
 * Track chat message sent
 */
export function trackChatMessage(query: string, isVoice: boolean = false): void {
  trackEvent({
    action: 'chat_message',
    category: 'Engagement',
    label: isVoice ? 'voice' : 'text',
  });

  // Also track query length bucket for analysis
  const length = query.length;
  const bucket = length < 20 ? 'short' : length < 50 ? 'medium' : 'long';
  trackEvent({
    action: 'chat_query_length',
    category: 'Engagement',
    label: bucket,
  });
}

/**
 * Track match analysis page view
 */
export function trackMatchView(sport: string, homeTeam: string, awayTeam: string): void {
  trackEvent({
    action: 'match_view',
    category: 'Content',
    label: `${sport}: ${homeTeam} vs ${awayTeam}`,
  });

  // Track sport separately for segmentation
  trackEvent({
    action: 'sport_viewed',
    category: 'Content',
    label: sport,
  });
}

/**
 * Track blog post view
 */
export function trackBlogView(slug: string, category: string): void {
  trackEvent({
    action: 'blog_view',
    category: 'Content',
    label: `${category}: ${slug}`,
  });
}

/**
 * Track PRO upgrade click (pre-purchase intent)
 */
export function trackUpgradeIntent(location: string): void {
  trackEvent({
    action: 'upgrade_intent',
    category: 'Conversion',
    label: location,
  });
}

/**
 * Track share action
 */
export function trackShare(contentType: string, method: string): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', 'share', {
    content_type: contentType,
    method: method,
  });
}
