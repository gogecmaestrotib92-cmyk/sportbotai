/**
 * Feedback Modal Component
 * 
 * Modal for "Suggest a Feature" and "Report a Problem" from user dashboard
 */

'use client';

import { useState, useEffect } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'feature' | 'problem';
  userEmail?: string | null;
  userName?: string | null;
}

export default function FeedbackModal({ 
  isOpen, 
  onClose, 
  type, 
  userEmail,
  userName 
}: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim().length < 10) {
      setErrorMessage('Please provide more details (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName || 'Dashboard User',
          email: userEmail || 'no-reply@sportbotai.com',
          subject: type === 'feature' ? 'feedback' : 'support',
          message: `[${type === 'feature' ? '💡 Feature Request' : '🐛 Problem Report'}]\n\n${message}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send feedback');
      }

      setSubmitStatus('success');
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const config = {
    feature: {
      title: 'Suggest a Feature',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      placeholder: "Describe the feature you'd like to see...\n\nExample: I'd love to have notifications when my favorite team plays.",
      buttonText: 'Submit Suggestion',
      successTitle: 'Thanks for your idea!',
      successMessage: 'We read every suggestion and use them to improve SportBot AI.',
    },
    problem: {
      title: 'Report a Problem',
      icon: (
        <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      placeholder: "Describe the problem you encountered...\n\nPlease include:\n- What you were trying to do\n- What happened instead\n- Any error messages you saw",
      buttonText: 'Submit Report',
      successTitle: 'Report received!',
      successMessage: "We'll look into this and fix it as soon as possible.",
    },
  };

  const currentConfig = config[type];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-bg-card rounded-2xl border border-divider shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              type === 'feature' ? 'bg-primary/10' : 'bg-danger/10'
            }`}>
              {currentConfig.icon}
            </div>
            <h2 className="text-xl font-semibold text-text-primary">
              {currentConfig.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitStatus === 'success' ? (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                type === 'feature' ? 'bg-primary/10' : 'bg-green-500/10'
              }`}>
                <svg className={`w-8 h-8 ${type === 'feature' ? 'text-primary' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {currentConfig.successTitle}
              </h3>
              <p className="text-text-secondary mb-6">
                {currentConfig.successMessage}
              </p>
              <button
                onClick={onClose}
                className="btn-primary px-6 py-2"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="feedback-message" className="block text-sm font-medium text-text-secondary mb-2">
                  Your {type === 'feature' ? 'suggestion' : 'report'}
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={currentConfig.placeholder}
                  rows={6}
                  className="w-full px-4 py-3 bg-bg border border-divider rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  disabled={isSubmitting}
                />
                {errorMessage && (
                  <p className="mt-2 text-sm text-danger">{errorMessage}</p>
                )}
                <p className="mt-2 text-xs text-text-muted">
                  Sending as: {userEmail || 'anonymous'}
                </p>
              </div>

              {submitStatus === 'error' && !errorMessage && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <p className="text-sm text-danger">Failed to send. Please try again.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-bg border border-divider text-text-secondary rounded-lg font-medium hover:bg-bg-hover transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || message.trim().length < 10}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    type === 'feature'
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-accent text-bg hover:bg-accent-green'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    currentConfig.buttonText
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
