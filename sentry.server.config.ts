import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Filter out noisy errors
  ignoreErrors: [
    /NEXT_REDIRECT/,
    /NEXT_NOT_FOUND/,
  ],
});
