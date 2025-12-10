'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ 
        backgroundColor: '#0B0E11', 
        color: 'white', 
        fontFamily: 'system-ui, sans-serif',
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '20px', maxWidth: '400px' }}>
          {/* Error Icon */}
          <div style={{ marginBottom: '24px' }}>
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#F87171" 
              strokeWidth="2"
              style={{ margin: '0 auto' }}
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 style={{ fontSize: '28px', marginBottom: '16px', fontWeight: 'bold' }}>
            Critical Error
          </h1>
          <p style={{ color: '#9CA3AF', marginBottom: '24px', lineHeight: '1.6' }}>
            A critical error occurred. We apologize for the inconvenience.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#2AF6A0',
                color: '#0B0E11',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '2px solid #2A3036',
                fontWeight: '600',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
