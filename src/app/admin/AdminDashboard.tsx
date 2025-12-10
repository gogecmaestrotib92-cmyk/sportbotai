'use client';

import { useState } from 'react';

interface Stats {
  totalUsers: number;
  proUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalAnalyses: number;
  todayAnalyses: number;
  mrr: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string | null;
  plan: string;
  createdAt: Date;
  _count: { analyses: number };
}

interface RecentAnalysis {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  createdAt: Date;
  user: { name: string | null; email: string | null };
}

interface AdminDashboardProps {
  stats: Stats;
  recentUsers: RecentUser[];
  recentAnalyses: RecentAnalysis[];
}

export default function AdminDashboard({ stats, recentUsers, recentAnalyses }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analyses'>('overview');

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary mt-1">SportBot AI analytics and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            label="MRR"
            value={`€${stats.mrr.toFixed(2)}`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            highlight
          />
          <StatCard
            label="Total Analyses"
            value={stats.totalAnalyses}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label="Today's Analyses"
            value={stats.todayAnalyses}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Subscription Breakdown */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Subscription Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-bg-tertiary">
              <div className="text-2xl font-bold text-text-muted">{stats.freeUsers}</div>
              <div className="text-sm text-text-secondary">Free</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-2xl font-bold text-primary">{stats.proUsers}</div>
              <div className="text-sm text-text-secondary">Pro</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="text-2xl font-bold text-accent">{stats.premiumUsers}</div>
              <div className="text-sm text-text-secondary">Premium</div>
            </div>
          </div>
          
          {/* Conversion rate */}
          <div className="mt-4 pt-4 border-t border-border-primary">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Conversion Rate</span>
              <span className="text-text-primary font-medium">
                {stats.totalUsers > 0 
                  ? ((stats.proUsers + stats.premiumUsers) / stats.totalUsers * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          >
            Recent Users
          </TabButton>
          <TabButton
            active={activeTab === 'analyses'}
            onClick={() => setActiveTab('analyses')}
          >
            Recent Analyses
          </TabButton>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Users Preview */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Latest Users</h3>
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="text-xs font-bold text-bg-primary">
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{user.name || 'Anonymous'}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                      </div>
                    </div>
                    <PlanBadge plan={user.plan} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Analyses Preview */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Latest Analyses</h3>
              <div className="space-y-3">
                {recentAnalyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {analysis.homeTeam} vs {analysis.awayTeam}
                      </div>
                      <div className="text-xs text-text-muted">
                        {analysis.sport} • {analysis.user.name || analysis.user.email}
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary">
                      {formatTimeAgo(new Date(analysis.createdAt))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Analyses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-bg-tertiary/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{user.name || 'Anonymous'}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={user.plan} />
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {user._count.analyses}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatDate(new Date(user.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analyses' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Match</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Sport</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {recentAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-bg-tertiary/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-text-primary">
                        {analysis.homeTeam} vs {analysis.awayTeam}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary capitalize">{analysis.sport}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {analysis.user.name || analysis.user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatTimeAgo(new Date(analysis.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon, highlight }: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-4 ${highlight ? 'border-accent/30 bg-accent/5' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={highlight ? 'text-accent' : 'text-text-muted'}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </div>
      <div className="text-sm text-text-secondary">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-accent text-bg-primary'
          : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    FREE: 'bg-text-muted/20 text-text-muted',
    PRO: 'bg-primary/20 text-primary',
    PREMIUM: 'bg-accent/20 text-accent',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[plan] || colors.FREE}`}>
      {plan}
    </span>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
