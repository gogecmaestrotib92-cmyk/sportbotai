/**
 * Success Animation Components
 * 
 * Premium animated success indicators.
 * Minimal, clean Apple-style animations.
 */

'use client';

import { useEffect, useState } from 'react';

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
  delay?: number;
}

/**
 * Animated success checkmark with ring
 */
export function SuccessCheckmark({ 
  size = 'md', 
  className = '',
  onComplete,
  delay = 0
}: SuccessCheckmarkProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const strokeSizes = {
    sm: 2,
    md: 2.5,
    lg: 3,
  };

  if (!show) return null;

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg viewBox="0 0 52 52" className="w-full h-full">
        {/* Circle */}
        <circle
          className="stroke-accent fill-none animate-[success-circle_0.6s_ease-out_forwards]"
          cx="26"
          cy="26"
          r="24"
          strokeWidth={strokeSizes[size]}
          strokeLinecap="round"
          style={{
            strokeDasharray: '166',
            strokeDashoffset: '166',
          }}
        />
        {/* Checkmark */}
        <path
          className="stroke-accent fill-none animate-[success-check_0.3s_ease-out_0.4s_forwards]"
          d="M14 27l8 8 16-16"
          strokeWidth={strokeSizes[size]}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: '48',
            strokeDashoffset: '48',
          }}
        />
      </svg>
    </div>
  );
}

interface SuccessToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
}

/**
 * Success toast with checkmark animation
 */
export function SuccessToast({ 
  message, 
  show, 
  onHide, 
  duration = 2500 
}: SuccessToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onHide, duration]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-bg-card/95 backdrop-blur-md border border-accent/30 rounded-2xl p-6 shadow-2xl shadow-accent/10 animate-in zoom-in-90 fade-in duration-300">
        <div className="flex flex-col items-center gap-3">
          <SuccessCheckmark size="lg" />
          <p className="text-white font-medium text-center">{message}</p>
        </div>
      </div>
    </div>
  );
}

interface SuccessBadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Inline success badge with pulse animation
 */
export function SuccessBadge({ children, className = '' }: SuccessBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/15 text-accent text-sm font-medium rounded-full animate-in fade-in zoom-in-95 duration-300 ${className}`}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </span>
  );
}

/**
 * Confetti-like success particles (subtle)
 */
export function SuccessParticles({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-accent rounded-full animate-[success-particle_0.8s_ease-out_forwards]"
          style={{
            left: '50%',
            top: '50%',
            '--angle': `${i * 60}deg`,
            '--distance': '40px',
            animationDelay: `${i * 50}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default SuccessCheckmark;
