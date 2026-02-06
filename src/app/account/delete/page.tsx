/**
 * Account Deletion Page
 * 
 * Allows users to permanently delete their account and all associated data.
 * Requires confirmation before deletion.
 */

'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect to home
      await signOut({ redirect: false });
      router.push('/?deleted=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="container-custom max-w-lg">
        {/* Back Link */}
        <Link 
          href="/account" 
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-8 transition-colors"
        >
          ← Back to Account
        </Link>

        {/* Warning Card */}
        <div className="bg-danger/10 border border-danger/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-danger/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-danger mb-2">Delete Your Account</h1>
              <p className="text-text-secondary text-sm">
                This action is <strong className="text-white">permanent and irreversible</strong>. 
                All your data will be permanently deleted, including:
              </p>
            </div>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="bg-bg-card rounded-2xl border border-divider p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">What will be deleted:</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-text-secondary">
              <span className="text-danger">✕</span>
              Your account and login credentials
            </li>
            <li className="flex items-center gap-3 text-text-secondary">
              <span className="text-danger">✕</span>
              All analysis history and saved matches
            </li>
            <li className="flex items-center gap-3 text-text-secondary">
              <span className="text-danger">✕</span>
              Your favorite teams and preferences
            </li>
            <li className="flex items-center gap-3 text-text-secondary">
              <span className="text-danger">✕</span>
              Subscription data (you will NOT be refunded)
            </li>
          </ul>
        </div>

        {/* Confirmation */}
        <div className="bg-bg-card rounded-2xl border border-divider p-6">
          <h2 className="text-white font-semibold mb-4">Confirm Deletion</h2>
          <p className="text-text-secondary text-sm mb-4">
            Type <strong className="text-danger font-mono">DELETE</strong> below to confirm you want to permanently delete your account:
          </p>
          
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Type DELETE"
            className="w-full px-4 py-3 bg-bg-primary border border-divider rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-danger mb-4 font-mono"
          />

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg mb-4">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/account"
              className="flex-1 px-4 py-3 text-center text-text-secondary bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="flex-1 px-4 py-3 bg-danger text-white rounded-xl hover:bg-danger/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </div>

        {/* Email support note */}
        <p className="text-center text-text-muted text-xs mt-8">
          Need help? Contact us at{' '}
          <a href="mailto:contact@sportbotai.com" className="text-primary hover:underline">
            contact@sportbotai.com
          </a>
        </p>
      </div>
    </div>
  );
}
