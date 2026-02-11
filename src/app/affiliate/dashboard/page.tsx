'use client';

/**
 * Affiliate Dashboard - Partner portal for tracking referrals and earnings
 * Enhanced with real-time stats, charts, and detailed conversion tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AffiliateStats {
  affiliate: {
    name: string;
    code: string;
    email: string;
    status: string;
    commissionRate: number;
    cookieDays: number;
    createdAt: string;
  };
  stats: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    uniqueVisitors: number;
    todayClicks: number;
    todayConversions: number;
    weekClicks: number;
    weekConversions: number;
    pendingCommission: number;
    approvedCommission: number;
    paidCommission: number;
    totalEarnings: number;
    avgOrderValue: number;
  };
  recentConversions: Array<{
    id: string;
    planName: string;
    amount: number;
    commission: number;
    status: string;
    createdAt: string;
  }>;
  recentClicks: Array<{
    id: string;
    landingPage: string;
    referer: string;
    createdAt: string;
    converted: boolean;
  }>;
  topLandingPages: Array<{ page: string; count: number }>;
  topReferrers: Array<{ source: string; count: number }>;
  monthlyStats: Array<{
    month: string;
    clicks: number;
    conversions: number;
    commission: number;
    revenue: number;
  }>;
  dailyStats: Array<{
    date: string;
    clicks: number;
    conversions: number;
  }>;
}

export default function AffiliateDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'clicks' | 'conversions'>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/dashboard');
      if (res.status === 401) {
        router.push('/affiliate/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const copyLink = () => {
    if (!data) return;
    const link = `https://www.sportbotai.com/?ref=${data.affiliate.code}`;
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

  const { affiliate, stats, recentConversions, recentClicks, topLandingPages, topReferrers, monthlyStats, dailyStats } = data;
  const referralLink = `https://www.sportbotai.com/?ref=${affiliate.code}`;

  // Calculate max for chart scaling
  const maxDailyClicks = Math.max(...dailyStats.map(d => d.clicks), 1);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-400 truncate max-w-[120px] sm:max-w-none">Welcome, {affiliate.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={fetchDashboard}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                title="Refresh data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <span className="text-gray-500 text-xs hidden sm:inline">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 border border-emerald-800/30">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Your Referral Link</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white font-mono text-xs sm:text-sm"
            />
            <button
              onClick={copyLink}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            <span className="text-emerald-400 font-semibold">{(affiliate.commissionRate * 100).toFixed(0)}%</span> recurring • 
            <span className="text-emerald-400 font-semibold">{affiliate.cookieDays}d</span> cookie
          </p>
        </div>

        {/* Today's Quick Stats */}
        <div className="bg-gray-900/30 rounded-xl border border-gray-800/50 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-6 flex-1">
              <div className="flex-1 sm:flex-none">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Today</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stats.todayClicks} <span className="text-xs sm:text-sm text-gray-400 font-normal">clicks</span></p>
              </div>
              <div className="h-8 w-px bg-gray-700"></div>
              <div className="flex-1 sm:flex-none">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Today</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-400">{stats.todayConversions} <span className="text-xs sm:text-sm text-gray-400 font-normal">conv.</span></p>
              </div>
              <div className="h-8 w-px bg-gray-700 hidden md:block"></div>
              <div className="hidden md:block">
                <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
                <p className="text-lg font-semibold text-white">{stats.weekClicks} clicks • {stats.weekConversions} conv.</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                affiliate.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                affiliate.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {affiliate.status}
              </span>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <StatCard
            label="Total Clicks"
            value={stats.totalClicks.toLocaleString()}
            subtext={`${stats.uniqueVisitors} unique visitors`}
            icon={<ClickIcon />}
            color="blue"
          />
          <StatCard
            label="Conversions"
            value={stats.totalConversions.toLocaleString()}
            subtext={`${stats.conversionRate.toFixed(1)}% conversion rate`}
            icon={<ConversionIcon />}
            color="emerald"
          />
          <StatCard
            label="Pending"
            value={`$${stats.pendingCommission.toFixed(2)}`}
            subtext="Awaiting approval"
            icon={<PendingIcon />}
            color="yellow"
          />
          <StatCard
            label="Total Earned"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            subtext={`$${stats.paidCommission.toFixed(2)} paid out`}
            icon={<EarningsIcon />}
            color="emerald"
          />
        </div>

        {/* 7-Day Performance Chart */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6 mb-4 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Last 7 Days</h3>
          <div className="flex items-end gap-2 h-32">
            {dailyStats.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-1" style={{ height: '100px' }}>
                  <div 
                    className="w-full bg-blue-500/30 rounded-t transition-all"
                    style={{ height: `${(day.clicks / maxDailyClicks) * 100}%`, minHeight: day.clicks > 0 ? '4px' : '0' }}
                    title={`${day.clicks} clicks`}
                  ></div>
                  {day.conversions > 0 && (
                    <div className="w-3 h-3 bg-emerald-500 rounded-full absolute" title={`${day.conversions} conversions`}></div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 text-center">{day.date.split(',')[0]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500/30 rounded"></span> Clicks
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Conversions
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-800 overflow-x-auto">
          {(['overview', 'clicks', 'conversions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Top Sources */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Traffic Sources</h3>
              {topReferrers.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No traffic data yet</p>
              ) : (
                <div className="space-y-3">
                  {topReferrers.map((ref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-white truncate flex-1">{ref.source}</span>
                      <span className="text-gray-400 ml-2">{ref.count} clicks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Landing Pages */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Top Landing Pages</h3>
              {topLandingPages.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No landing page data yet</p>
              ) : (
                <div className="space-y-3">
                  {topLandingPages.map((page, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-white truncate flex-1 font-mono text-sm">{page.page}</span>
                      <span className="text-gray-400 ml-2">{page.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Performance */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6 lg:col-span-2">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Monthly Performance</h3>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-xs sm:text-sm min-w-[400px]">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-2 sm:pb-3 font-medium">Month</th>
                      <th className="pb-2 sm:pb-3 font-medium text-right">Clicks</th>
                      <th className="pb-2 sm:pb-3 font-medium text-right">Conv.</th>
                      <th className="pb-2 sm:pb-3 font-medium text-right hidden sm:table-cell">Revenue</th>
                      <th className="pb-2 sm:pb-3 font-medium text-right">Comm.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.map((month) => (
                      <tr key={month.month} className="border-t border-gray-800">
                        <td className="py-2 sm:py-3 text-white font-medium">{month.month}</td>
                        <td className="py-2 sm:py-3 text-right text-gray-300">{month.clicks}</td>
                        <td className="py-2 sm:py-3 text-right text-gray-300">{month.conversions}</td>
                        <td className="py-2 sm:py-3 text-right text-gray-300 hidden sm:table-cell">${month.revenue.toFixed(2)}</td>
                        <td className="py-2 sm:py-3 text-right text-emerald-400 font-semibold">${month.commission.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clicks' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Recent Clicks</h3>
            {recentClicks.length === 0 ? (
              <p className="text-gray-400 text-center py-6 sm:py-8 text-sm">No clicks recorded yet. Share your link to get started!</p>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {recentClicks.map((click) => (
                    <div key={click.id} className="bg-gray-800/50 rounded-lg p-3 text-xs">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400">{new Date(click.createdAt).toLocaleString()}</span>
                        {click.converted ? (
                          <span className="text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">Converted ✓</span>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Pending</span>
                        )}
                      </div>
                      <p className="text-white font-mono text-[10px] truncate mb-1">{click.landingPage}</p>
                      <p className="text-gray-500 text-[10px] truncate">{click.referer || 'Direct'}</p>
                    </div>
                  ))}
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 font-medium">Landing Page</th>
                      <th className="pb-3 font-medium">Referrer</th>
                      <th className="pb-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClicks.map((click) => (
                      <tr key={click.id} className="border-t border-gray-800">
                        <td className="py-3 text-gray-300 whitespace-nowrap">
                          {new Date(click.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 text-white font-mono text-xs truncate max-w-[200px]">
                          {click.landingPage}
                        </td>
                        <td className="py-3 text-gray-400 truncate max-w-[150px]">
                          {click.referer}
                        </td>
                        <td className="py-3 text-right">
                          {click.converted ? (
                            <span className="text-emerald-400 text-xs bg-emerald-500/20 px-2 py-1 rounded">Converted ✓</span>
                          ) : (
                            <span className="text-gray-500 text-xs">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'conversions' && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Conversion History</h3>
            {recentConversions.length === 0 ? (
              <p className="text-gray-400 text-center py-6 sm:py-8 text-sm">No conversions yet. Share your link to get started!</p>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {recentConversions.map((conv) => (
                    <div key={conv.id} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium text-sm">{conv.planName}</p>
                          <p className="text-gray-500 text-xs">{new Date(conv.createdAt).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={conv.status} />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Sale: ${conv.amount.toFixed(2)}</span>
                        <span className="text-emerald-400 font-semibold">+${conv.commission.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium text-right">Sale Amount</th>
                      <th className="pb-3 font-medium text-right">Your Commission</th>
                      <th className="pb-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentConversions.map((conv) => (
                      <tr key={conv.id} className="border-t border-gray-800">
                        <td className="py-3 text-gray-300 whitespace-nowrap">
                          {new Date(conv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-white font-medium">{conv.planName}</td>
                        <td className="py-3 text-right text-gray-300">${conv.amount.toFixed(2)}</td>
                        <td className="py-3 text-right text-emerald-400 font-semibold">+${conv.commission.toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <StatusBadge status={conv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payout Info */}
        <div className="mt-4 sm:mt-8 bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Payout Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-xs sm:text-sm">
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
            <div>
              <p className="text-gray-400">Avg. Order Value</p>
              <p className="text-white font-semibold">${stats.avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800">
            <p className="text-gray-500 text-[10px] sm:text-xs leading-relaxed">
              💡 Commissions approved after 30-day refund period. Payouts on 1st of month for $50+ balances.
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact us at <a href="mailto:contact@sportbotai.com" className="text-emerald-400 hover:underline">contact@sportbotai.com</a></p>
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
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-lg sm:text-2xl font-bold text-white truncate">{value}</p>
      <p className="text-gray-400 text-xs sm:text-sm">{label}</p>
      {subtext && <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">{subtext}</p>}
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
