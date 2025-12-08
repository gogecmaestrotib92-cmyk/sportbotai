/**
 * API Error Display Component
 * 
 * Consistent, user-friendly error display with retry functionality.
 */

'use client';

import { ERROR_MESSAGES } from '@/lib/utils/apiHelpers';

interface ApiErrorDisplayProps {
  code?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'inline' | 'card' | 'fullscreen';
}

export default function ApiErrorDisplay({
  code,
  title,
  description,
  onRetry,
  retryLabel,
  variant = 'card',
}: ApiErrorDisplayProps) {
  // Get default messages based on code
  const defaultMessages = code 
    ? (ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.NETWORK_ERROR)
    : ERROR_MESSAGES.NETWORK_ERROR;
  
  const displayTitle = title || defaultMessages.title;
  const displayDescription = description || defaultMessages.description;
  const displayAction = retryLabel || defaultMessages.action;
  
  // Icon based on error type
  const getIcon = () => {
    switch (code) {
      case 'NETWORK_ERROR':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
          </svg>
        );
      case 'RATE_LIMITED':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'SERVER_ERROR':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
          </svg>
        );
      case 'NO_DATA':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        );
    }
  };
  
  // Inline variant (compact)
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm flex-1">{displayDescription}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            {displayAction}
          </button>
        )}
      </div>
    );
  }
  
  // Fullscreen variant (for critical errors)
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            {getIcon()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{displayTitle}</h1>
          <p className="text-gray-600 mb-6">{displayDescription}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-900/90 transition-colors"
            >
              {displayAction}
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Card variant (default)
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
        {getIcon()}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{displayTitle}</h3>
      <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">{displayDescription}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-900 text-white font-medium rounded-xl hover:bg-primary-900/90 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {displayAction}
        </button>
      )}
    </div>
  );
}
