'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');

  const handleUnsubscribe = async () => {
    if (!email) return;
    
    setStatus('loading');
    
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 text-center border border-slate-800">
          <p className="text-6xl mb-4">❓</p>
          <h1 className="text-2xl font-bold text-white mb-4">Missing Email</h1>
          <p className="text-slate-400 mb-6">
            No email address provided. Please use the unsubscribe link from your email.
          </p>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 text-center border border-slate-800">
          <p className="text-6xl mb-4">✅</p>
          <h1 className="text-2xl font-bold text-white mb-4">Unsubscribed</h1>
          <p className="text-slate-400 mb-2">
            <strong className="text-white">{email}</strong>
          </p>
          <p className="text-slate-400 mb-6">
            You won&apos;t receive any more emails from us. We&apos;re sorry to see you go!
          </p>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 text-center border border-slate-800">
        <p className="text-6xl mb-4">📧</p>
        <h1 className="text-2xl font-bold text-white mb-4">Unsubscribe</h1>
        <p className="text-slate-400 mb-2">
          You&apos;re about to unsubscribe:
        </p>
        <p className="text-white font-medium mb-6">{email}</p>
        
        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
          </div>
        )}
        
        <button
          onClick={handleUnsubscribe}
          disabled={status === 'loading'}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 mb-4"
        >
          {status === 'loading' ? 'Processing...' : 'Yes, Unsubscribe Me'}
        </button>
        
        <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
          Cancel
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
