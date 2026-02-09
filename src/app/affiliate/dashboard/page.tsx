'use client';

/**
 * Affiliate Dashboard - Partner portal for tracking referrals and earnings
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AffiliateStats {
  affiliate: {
    name: string;
    code: string;
    email: string;
    status: string;
    commissionRate: number;
  };
  stats: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    pendingCommission: number;
    approvedCommission: number;
    paidCommission: number;
    totalEarnings: number;
  };
  recentConversions: Array<{
    id: string;
    planName: string;
    amount: number;
    commission: number;
    status: string;
    createdAt: string;
  }>;
  monthlyStats: Array<{
    month: string;
    clicks: number;
    conversions: number;
    commission: number;
  }>;
}

export default function AffiliateDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/affiliate/dashboard');
      if (res.status === 401) {
        router.push('/affiliate/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!data) return;
    const link = `https://sportbot.ai/?ref=${data.affiliate.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await fetch('/api/affiliate/logout', { method: 'POST' });
    router.push('/affiliate/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Error loading dashboard'}</p>
          <Link href="/affiliate/login" className="text-emerald-400 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  const { affiliate, stats, recentConversions, monthlyStats } = data;
  const referralLink = `https://sportbot.ai/?ref=${affiliate.code}`;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Affiliate Dashboard</h1>
                <p className="text-sm text-gray-400">Welcome, {affiliate.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-2xl p-6 mb-8 border border-emerald-800/30">
          <h2 className="text-lg font-semibold text-white mb-2">Your Referral Link</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
            />
            <button
              onClick={copyLink}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Commission rate: <span className="text-emerald-400 font-semibold">{(affiliate.commissionRate * 100).toFixed(0)}%</span> • 
            Cookie duration: <span className="text-emerald-400 font-semibold">90 days</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Clicks"
            value={stats.totalClicks.toLocaleString()}
            icon={<ClickIcon />}
            color="blue"
          />
          <StatCard
            label="Conversions"
            value={stats.totalConversions.toLocaleString()}
            subtext={`${stats.conversionRate.toFixed(1)}% rate`}
            icon={<ConversionIcon />}
            color="emerald"
          />
          <StatCard
            label="Pending"
            value={`$${stats.pendingCommission.toFixed(2)}`}
            icon={<PendingIcon />}
            color="yellow"
          />
          <StatCard
            label="Total Earned"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            subtext={`$${stats.paidCommission.toFixed(2)} paid`}
            icon={<EarningsIcon />}
            color="emerald"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Conversions */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Conversions</h3>
            {recentConversions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No conversions yet. Share your link to get started!</p>
            ) : (
              <div className="space-y-3">
                {recentConversions.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-white font-medium">{conv.planName}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-semibold">+${conv.commission.toFixed(2)}</p>
                      <StatusBadge status={conv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Performance */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Performance</h3>
            {monthlyStats.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {monthlyStats.map((month) => (
                  <div key={month.month} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-white font-medium">{month.month}</p>
                      <p className="text-gray-400 text-sm">
                        {month.clicks} clicks • {month.conversions} conversions
                      </p>
                    </div>
                    <p className="text-emerald-400 font-semibold">${month.commission.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payout Info */}
        <div className="mt-8 bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payout Information</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-400">Minimum Payout</p>
              <p className="text-white font-semibold">$50.00</p>
            </div>
            <div>
              <p className="text-gray-400">Payout Schedule</p>
              <p className="text-white font-semibold">Monthly (Net-30)</p>
            </div>
            <div>
              <p className="text-gray-400">Payment Methods</p>
              <p className="text-white font-semibold">PayPal, Wire Transfer</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            Commissions are approved after 30 days (refund period). Payouts are processed on the 1st of each month.
          </p>
        </div>
      </main>
    </div>
  );
}

// Components
function StatCard({ label, value, subtext, icon, color }: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'yellow' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
      {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    APPROVED: 'bg-blue-500/20 text-blue-400',
    PAID: 'bg-emerald-500/20 text-emerald-400',
    REFUNDED: 'bg-red-500/20 text-red-400',
    CANCELLED: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status] || styles.PENDING}`}>
      {status.toLowerCase()}
    </span>
  );
}

// Icons
function ClickIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  );
}

function ConversionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function EarningsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
