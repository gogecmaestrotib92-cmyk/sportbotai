import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in dev, reduce in production
  
  // Session Replay (optional - comment out if not needed)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking (set via CI/CD or Vercel)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /ResizeObserver loop/,
    /Loading chunk/,
    // Network errors users can't control
    /Network request failed/,
    /Failed to fetch/,
    /Load failed/,
    // Auth-related (expected behavior)
    /NEXT_REDIRECT/,
  ],

  // Before sending, sanitize sensitive data
  beforeSend(event) {
    // Remove sensitive user data if present
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});
