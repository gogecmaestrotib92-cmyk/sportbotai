'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-danger/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-danger" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Team Profile Unavailable</h1>
        <p className="text-text-secondary mb-6">
          This team profile is temporarily unavailable. Please try again later or browse matches instead.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={reset}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            Try Again
          </button>
          <Link href="/matches" className="btn-primary inline-flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Browse Matches
          </Link>
        </div>
      </div>
    </div>
  );
}
