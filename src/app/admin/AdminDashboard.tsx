'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserManagement from './UserManagement';
import PendingPredictionsManager from './PendingPredictionsManager';

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
  referralSource: string | null;
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

interface ChatQuery {
  id: string;
  query: string;
  category: string | null;
  brainMode: string | null;
  sport: string | null;
  team: string | null;
  usedRealTimeSearch: boolean;
  createdAt: Date;
  user?: { email: string | null; name: string | null } | null;
}

interface FeedbackByConfidence {
  level: string;
  total: number;
  positive: number;
  negative: number;
  satisfactionRate: number;
}

interface RecentNegativeFeedback {
  query: string;
  rating: number;
  confidence: string | null;
  createdAt: Date;
}

interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avgRating: number;
  satisfactionRate: number;
  byConfidence: FeedbackByConfidence[];
  recentNegative: RecentNegativeFeedback[];
}

interface ChatAnalytics {
  totalQueries: number;
  todayQueries: number;
  queriesWithSearch: number;
  queriesWithCitations: number;
  searchRate: number;
  topCategories: Array<{ category: string; count: number }>;
  topTeams: Array<{ team: string; count: number }>;
  recentQueries: ChatQuery[];
  agentPostsCount: number;
  feedbackStats: FeedbackStats;
}

// ================================================================
// EDGE PERFORMANCE TRACKING INTERFACES
// ================================================================

interface EdgeBucketStats {
  bucket: string;
  count: number;
  wins: number;
  winRate: number;
  avgEdge: number;
  avgModelProb: number;
  avgMarketProb: number;
  vsMarket: number;
}

interface CalibrationBand {
  band: string;
  minProb: number;
  maxProb: number;
  count: number;
  avgModelProb: number;
  actualWinRate: number;
  calibrationError: number;
}

interface CLVStats {
  totalWithCLV: number;
  avgCLV: number;
  positiveCLVCount: number;
  positiveCLVPercent: number;
  bySport: Array<{ sport: string; avgCLV: number; count: number }>;
}

interface ROISimulation {
  totalBets: number;
  totalStaked: number;
  totalReturn: number;
  netProfit: number;
  roi: number;
  byEdgeBucket: Array<{ bucket: string; bets: number; profit: number; roi: number }>;
  bySport: Array<{ sport: string; bets: number; profit: number; roi: number }>;
}

interface EdgePerformanceStats {
  totalPredictions: number;
  evaluatedPredictions: number;
  pendingPredictions: number;
  overallWinRate: number;
  dataHealth?: {
    withModelProb: number;
    withModelProbPercent: number;
    withMarketProb: number;
    withMarketProbPercent: number;
    withCLV: number;
    withCLVPercent: number;
    withClosingOdds: number;
    withClosingOddsPercent: number;
    overallScore: number;
  };
  stuckPredictions?: number;
  byEdgeBucket: EdgeBucketStats[];
  calibration: CalibrationBand[];
  calibrationMSE: number;
  clvStats: CLVStats;
  roiSimulation: ROISimulation;
  bySport: Array<{ sport: string; count: number; wins: number; winRate: number; avgEdge: number }>;
  byLeague: Array<{ league: string; count: number; wins: number; winRate: number; avgEdge: number }>;
  recentPredictions: Array<{
    id: string;
    matchName: string;
    sport: string;
    league: string;
    kickoff: Date;
    selection: string | null;
    modelProbability: number | null;
    marketProbabilityFair: number | null;
    edgeValue: number | null;
    edgeBucket: string | null;
    marketOddsAtPrediction: number | null;
    binaryOutcome: number | null;
    clvValue: number | null;
  }>;
  pendingPredictionsList: Array<{
    id: string;
    matchId: string;
    matchName: string;
    sport: string;
    league: string;
    kickoff: Date;
    prediction: string;
    selection: string | null;
    conviction: number;
    modelProbability: number | null;
    marketOddsAtPrediction: number | null;
    valueBetSide: string | null;
    valueBetOdds: number | null;
  }>;
  // Daily Picks - High confidence picks for public showcase
  dailyPicks?: {
    total: number;
    wins: number;
    losses: number;
    pending: number;
    winRate: number;
    avgConfidence: number;
    avgEdge: number;
    streak: number; // positive = winning streak, negative = losing streak
    recentPicks: Array<{
      id: string;
      matchId: string;
      matchName: string;
      sport: string;
      league: string;
      kickoff: Date;
      selection: string | null;
      modelProbability: number | null;
      edgeValue: number | null;
      binaryOutcome: number | null; // 1 = win, 0 = loss, null = pending
    }>;
  };
}

interface AdminDashboardProps {
  stats: Stats;
  recentUsers: RecentUser[];
  recentAnalyses: RecentAnalysis[];
  chatAnalytics?: ChatAnalytics;
  edgePerformanceStats?: EdgePerformanceStats;
}

type TabType = 'overview' | 'users' | 'chat' | 'predictions';
type PredictionSubTab = 'overview' | 'calibration' | 'clv' | 'roi' | 'raw' | 'manage' | 'dailypicks';

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard({
  stats,
  recentUsers,
  recentAnalyses,
  chatAnalytics,
  edgePerformanceStats,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [predictionSubTab, setPredictionSubTab] = useState<PredictionSubTab>('dailypicks');
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [analysesPage, setAnalysesPage] = useState(1);
  const [chatPage, setChatPage] = useState(1);
  const [predictionsPage, setPredictionsPage] = useState(1);

  // Paginated data
  const paginatedUsers = recentUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);
  const totalUsersPages = Math.ceil(recentUsers.length / ITEMS_PER_PAGE);

  const paginatedAnalyses = recentAnalyses.slice((analysesPage - 1) * ITEMS_PER_PAGE, analysesPage * ITEMS_PER_PAGE);
  const totalAnalysesPages = Math.ceil(recentAnalyses.length / ITEMS_PER_PAGE);

  const paginatedQueries = chatAnalytics?.recentQueries.slice((chatPage - 1) * ITEMS_PER_PAGE, chatPage * ITEMS_PER_PAGE) || [];
  const totalChatPages = Math.ceil((chatAnalytics?.recentQueries.length || 0) / ITEMS_PER_PAGE);

  const paginatedPredictions = edgePerformanceStats?.recentPredictions.slice((predictionsPage - 1) * ITEMS_PER_PAGE, predictionsPage * ITEMS_PER_PAGE) || [];
  const totalPredictionsPages = Math.ceil((edgePerformanceStats?.recentPredictions.length || 0) / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary mt-1">SportBot AI analytics</p>
          </div>
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-white font-medium transition-colors"
          >
            📝 Blog Admin
          </Link>
        </div>

        {/* Quick Stats - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <QuickStat label="Users" value={stats.totalUsers} />
          <QuickStat label="MRR" value={`€${stats.mrr.toFixed(0)}`} highlight />
          <QuickStat label="Pro" value={stats.proUsers} />
          <QuickStat label="Premium" value={stats.premiumUsers} />
          <QuickStat label="Analyses" value={stats.totalAnalyses} />
          <QuickStat label="Today" value={stats.todayAnalyses} />
          <QuickStat label="Chat" value={chatAnalytics?.totalQueries || 0} />
          <QuickStat label="Win Rate" value={`${edgePerformanceStats?.overallWinRate || 0}%`} color="green" />
        </div>

        {/* Tabs - Simplified */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            📊 Overview
          </TabButton>
          <TabButton active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')}>
            🎯 Predictions
          </TabButton>
          <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
            💬 Chat
          </TabButton>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            👥 Users
          </TabButton>
        </div>

        {/* ============================================ */}
        {/* OVERVIEW TAB */}
        {/* ============================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Row */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Subscriptions */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Subscriptions</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-text-muted">{stats.freeUsers}</div>
                    <div className="text-xs text-text-secondary">Free</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.proUsers}</div>
                    <div className="text-xs text-text-secondary">Pro</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-accent">{stats.premiumUsers}</div>
                    <div className="text-xs text-text-secondary">Premium</div>
                  </div>
                </div>
              </div>

              {/* Chat Stats */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Chat Activity</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-blue-400">{chatAnalytics?.todayQueries || 0}</div>
                    <div className="text-xs text-text-secondary">Today</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-purple-400">{chatAnalytics?.agentPostsCount || 0}</div>
                    <div className="text-xs text-text-secondary">Posts</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-green-400">{chatAnalytics?.searchRate || 0}%</div>
                    <div className="text-xs text-text-secondary">Search</div>
                  </div>
                </div>
              </div>

              {/* Predictions Summary */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Edge Performance</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-green-400">{edgePerformanceStats?.overallWinRate || 0}%</div>
                    <div className="text-xs text-text-secondary">Win Rate</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-blue-400">{edgePerformanceStats?.evaluatedPredictions || 0}</div>
                    <div className="text-xs text-text-secondary">Evaluated</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{edgePerformanceStats?.pendingPredictions || 0}</div>
                    <div className="text-xs text-text-secondary">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Split */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Latest Users</h3>
                <div className="space-y-2">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-[10px] font-bold text-bg-primary">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-sm text-text-primary truncate max-w-[150px]">{user.name || user.email}</span>
                      </div>
                      <PlanBadge plan={user.plan} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Analyses */}
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Latest Analyses</h3>
                <div className="space-y-2">
                  {recentAnalyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                      <div>
                        <div className="text-sm text-text-primary">{analysis.homeTeam} vs {analysis.awayTeam}</div>
                        <div className="text-xs text-text-muted">{analysis.sport}</div>
                      </div>
                      <div className="text-xs text-text-secondary">{formatTimeAgo(new Date(analysis.createdAt))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* EDGE PERFORMANCE TRACKING - Complete Redesign */}
        {/* Internal model evaluation only - NOT for user-facing claims */}
        {/* ============================================ */}
        {activeTab === 'predictions' && edgePerformanceStats && (
          <div className="space-y-6">
            {/* Internal Notice */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ <strong>Internal Only</strong> — Edge performance tracking for model evaluation. Not for user-facing claims.
              </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="card p-4 text-center border-blue-500/30 bg-blue-500/5">
                <div className="text-3xl font-bold text-blue-400">{edgePerformanceStats.totalPredictions}</div>
                <div className="text-xs text-text-secondary">Total</div>
              </div>
              <div className="card p-4 text-center border-green-500/30 bg-green-500/5">
                <div className="text-3xl font-bold text-green-400">{edgePerformanceStats.overallWinRate}%</div>
                <div className="text-xs text-text-secondary">Win Rate</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-text-primary">{edgePerformanceStats.evaluatedPredictions}</div>
                <div className="text-xs text-text-secondary">Evaluated</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{edgePerformanceStats.pendingPredictions}</div>
                <div className="text-xs text-text-secondary">Pending</div>
              </div>
              <div className="card p-4 text-center">
                <div className={`text-3xl font-bold ${edgePerformanceStats.roiSimulation.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {edgePerformanceStats.roiSimulation.roi >= 0 ? '+' : ''}{edgePerformanceStats.roiSimulation.roi}%
                </div>
                <div className="text-xs text-text-secondary">Sim ROI</div>
              </div>
              {/* Data Health Score */}
              <div className={`card p-4 text-center ${(edgePerformanceStats.dataHealth?.overallScore ?? 0) >= 60
                  ? 'border-green-500/30 bg-green-500/5'
                  : (edgePerformanceStats.dataHealth?.overallScore ?? 0) >= 30
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}>
                <div className={`text-3xl font-bold ${(edgePerformanceStats.dataHealth?.overallScore ?? 0) >= 60
                    ? 'text-green-400'
                    : (edgePerformanceStats.dataHealth?.overallScore ?? 0) >= 30
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}>
                  {edgePerformanceStats.dataHealth?.overallScore ?? 0}%
                </div>
                <div className="text-xs text-text-secondary">Data Health</div>
              </div>
              {/* Stuck Predictions */}
              {(edgePerformanceStats.stuckPredictions ?? 0) > 0 && (
                <div className="card p-4 text-center border-orange-500/30 bg-orange-500/5">
                  <div className="text-3xl font-bold text-orange-400">{edgePerformanceStats.stuckPredictions}</div>
                  <div className="text-xs text-text-secondary">⚠️ Stuck</div>
                </div>
              )}
            </div>

            {/* Sub-tabs for detailed views */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <SubTabButton active={predictionSubTab === 'dailypicks'} onClick={() => setPredictionSubTab('dailypicks')}>
                ⭐ Daily Picks ({edgePerformanceStats.dailyPicks?.total || 0})
              </SubTabButton>
              <SubTabButton active={predictionSubTab === 'manage'} onClick={() => setPredictionSubTab('manage')}>
                ✏️ Manage ({edgePerformanceStats.pendingPredictionsList?.length || 0})
              </SubTabButton>
              <SubTabButton active={predictionSubTab === 'overview'} onClick={() => setPredictionSubTab('overview')}>
                📊 Edge Buckets
              </SubTabButton>
              <SubTabButton active={predictionSubTab === 'calibration'} onClick={() => setPredictionSubTab('calibration')}>
                🎯 Calibration
              </SubTabButton>
              <SubTabButton active={predictionSubTab === 'clv'} onClick={() => setPredictionSubTab('clv')}>
                📈 CLV
              </SubTabButton>
              <SubTabButton active={predictionSubTab === 'roi'} onClick={() => setPredictionSubTab('roi')}>
                💰 ROI Sim
              </SubTabButton>
              <SubTabButton active={predictionSubTab === 'raw'} onClick={() => setPredictionSubTab('raw')}>
                📋 Raw Data
              </SubTabButton>
            </div>

            {/* ===== DAILY PICKS - HIGH CONFIDENCE SHOWCASE ===== */}
            {predictionSubTab === 'dailypicks' && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-accent-primary">
                      {edgePerformanceStats.dailyPicks?.total || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Total Picks</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className={`text-3xl font-bold ${
                      (edgePerformanceStats.dailyPicks?.winRate || 0) >= 60 
                        ? 'text-green-400' 
                        : (edgePerformanceStats.dailyPicks?.winRate || 0) >= 50 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                    }`}>
                      {edgePerformanceStats.dailyPicks?.winRate || 0}%
                    </div>
                    <div className="text-xs text-text-secondary">Win Rate</div>
                  </div>
                  <div className="card p-4 text-center bg-green-500/10 border-green-500/30">
                    <div className="text-3xl font-bold text-green-400">
                      {edgePerformanceStats.dailyPicks?.wins || 0}
                    </div>
                    <div className="text-xs text-text-secondary">✅ Wins</div>
                  </div>
                  <div className="card p-4 text-center bg-red-500/10 border-red-500/30">
                    <div className="text-3xl font-bold text-red-400">
                      {edgePerformanceStats.dailyPicks?.losses || 0}
                    </div>
                    <div className="text-xs text-text-secondary">❌ Losses</div>
                  </div>
                  <div className="card p-4 text-center bg-blue-500/10 border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400">
                      {edgePerformanceStats.dailyPicks?.pending || 0}
                    </div>
                    <div className="text-xs text-text-secondary">⏳ Pending</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className={`text-3xl font-bold ${
                      (edgePerformanceStats.dailyPicks?.streak || 0) > 0 
                        ? 'text-green-400' 
                        : (edgePerformanceStats.dailyPicks?.streak || 0) < 0 
                          ? 'text-red-400' 
                          : 'text-text-secondary'
                    }`}>
                      {(edgePerformanceStats.dailyPicks?.streak || 0) > 0 
                        ? `🔥 ${edgePerformanceStats.dailyPicks?.streak}`
                        : (edgePerformanceStats.dailyPicks?.streak || 0) < 0 
                          ? `❄️ ${Math.abs(edgePerformanceStats.dailyPicks?.streak || 0)}`
                          : '-'}
                    </div>
                    <div className="text-xs text-text-secondary">Streak</div>
                  </div>
                </div>

                {/* Average Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-4">
                    <div className="text-sm text-text-secondary mb-1">Avg Confidence</div>
                    <div className="text-2xl font-bold text-accent-primary">
                      {edgePerformanceStats.dailyPicks?.avgConfidence || 0}%
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Min required: 60%
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="text-sm text-text-secondary mb-1">Avg Edge</div>
                    <div className="text-2xl font-bold text-green-400">
                      +{edgePerformanceStats.dailyPicks?.avgEdge || 0}%
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Min required: 3%
                    </div>
                  </div>
                </div>

                {/* Public Record Banner */}
                <div className="card p-4 bg-gradient-to-r from-accent-primary/20 to-purple-500/20 border-accent-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">📊 Public Record</h3>
                      <p className="text-sm text-text-secondary">
                        {edgePerformanceStats.dailyPicks?.wins || 0}W - {edgePerformanceStats.dailyPicks?.losses || 0}L 
                        ({edgePerformanceStats.dailyPicks?.winRate || 0}% win rate)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Criteria: Confidence ≥60%, Edge ≥3%</div>
                      <div className="text-xs text-text-muted">These are our showcase picks</div>
                    </div>
                  </div>
                </div>

                {/* Recent Daily Picks Table */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-primary">
                    <h3 className="text-sm font-medium text-text-primary">Recent Daily Picks</h3>
                    <p className="text-xs text-text-muted mt-1">High confidence picks (≥60% model confidence, ≥3% edge)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Match</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Sport</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Selection</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Confidence</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Edge</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Result</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary">
                        {(edgePerformanceStats.dailyPicks?.recentPicks || []).length > 0 ? (
                          edgePerformanceStats.dailyPicks?.recentPicks.map((pick) => (
                            <tr key={pick.id} className="hover:bg-bg-tertiary/50">
                              <td className="px-4 py-3">
                                <Link 
                                  href={`/match/${pick.matchId}`}
                                  className="text-accent-primary hover:underline"
                                >
                                  {pick.matchName}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-text-secondary">
                                {pick.sport}
                              </td>
                              <td className="px-4 py-3 text-text-primary font-medium">
                                {pick.selection || 'N/A'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-accent-primary font-medium">
                                  {pick.modelProbability?.toFixed(0) || '-'}%
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-green-400 font-medium">
                                  +{pick.edgeValue?.toFixed(1) || '-'}%
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {pick.binaryOutcome === 1 ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                    ✅ WIN
                                  </span>
                                ) : pick.binaryOutcome === 0 ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                    ❌ LOSS
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                    ⏳ PENDING
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-text-muted text-xs">
                                {new Date(pick.kickoff).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                              No Daily Picks yet. Picks will appear when confidence ≥60% and edge ≥3%.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===== MANAGE PENDING PREDICTIONS ===== */}
            {predictionSubTab === 'manage' && (
              <PendingPredictionsManager
                predictions={edgePerformanceStats.pendingPredictionsList || []}
              />
            )}

            {/* ===== EDGE BUCKET OVERVIEW ===== */}
            {predictionSubTab === 'overview' && (
              <div className="space-y-6">
                {/* Edge Bucket Performance Table - CORE */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-primary">
                    <h3 className="text-sm font-medium text-text-primary">Edge Bucket Performance</h3>
                    <p className="text-xs text-text-muted mt-1">Higher edge → Higher expected accuracy</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Bucket</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Count</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Win Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Avg Edge</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">vs Market</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary">
                        {edgePerformanceStats.byEdgeBucket.length > 0 ? (
                          edgePerformanceStats.byEdgeBucket.map((bucket) => (
                            <tr key={bucket.bucket} className="hover:bg-bg-tertiary/50">
                              <td className="px-4 py-3">
                                <EdgeBucketBadge bucket={bucket.bucket} />
                              </td>
                              <td className="px-4 py-3 text-text-secondary">
                                {bucket.count} <span className="text-text-muted">({bucket.wins}W)</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-medium ${bucket.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                  {bucket.winRate}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-text-secondary">+{bucket.avgEdge}%</td>
                              <td className="px-4 py-3">
                                <span className={`font-medium ${bucket.vsMarket >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {bucket.vsMarket >= 0 ? '+' : ''}{bucket.vsMarket}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                              No edge data yet. Predictions need modelProbability and marketProbabilityFair.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sport & League Breakdown */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">By Sport</h3>
                    {edgePerformanceStats.bySport.length > 0 ? (
                      <div className="space-y-2">
                        {edgePerformanceStats.bySport.slice(0, 6).map((sport) => (
                          <div key={sport.sport} className="flex items-center gap-2">
                            <span className="text-xs text-text-primary w-24 truncate">{sport.sport}</span>
                            <div className="flex-1 h-4 bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${sport.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(sport.winRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-secondary w-24 text-right">
                              {sport.winRate}% ({sport.wins}/{sport.count})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <div className="text-text-muted text-sm">No data</div>}
                  </div>

                  <div className="card p-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">By League (Top 6)</h3>
                    {edgePerformanceStats.byLeague.length > 0 ? (
                      <div className="space-y-2">
                        {edgePerformanceStats.byLeague.slice(0, 6).map((league) => (
                          <div key={league.league} className="flex items-center gap-2">
                            <span className="text-xs text-text-primary w-24 truncate" title={league.league}>{league.league}</span>
                            <div className="flex-1 h-4 bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${league.winRate >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(league.winRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-secondary w-24 text-right">
                              {league.winRate}% ({league.wins}/{league.count})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <div className="text-text-muted text-sm">No data</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ===== CALIBRATION ANALYSIS ===== */}
            {predictionSubTab === 'calibration' && (
              <div className="space-y-6">
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-primary">
                    <h3 className="text-sm font-medium text-text-primary">Model Calibration</h3>
                    <p className="text-xs text-text-muted mt-1">
                      If model says 70% → actual win rate should be ~70%. MSE: {edgePerformanceStats.calibrationMSE}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Prob Band</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Count</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Avg Model Prob</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Actual Win Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary">
                        {edgePerformanceStats.calibration.length > 0 ? (
                          edgePerformanceStats.calibration.map((band) => (
                            <tr key={band.band} className="hover:bg-bg-tertiary/50">
                              <td className="px-4 py-3 text-text-primary">{band.band}</td>
                              <td className="px-4 py-3 text-text-secondary">{band.count}</td>
                              <td className="px-4 py-3 text-text-secondary">{band.avgModelProb}%</td>
                              <td className="px-4 py-3">
                                <span className={band.actualWinRate >= 50 ? 'text-green-400' : 'text-text-secondary'}>
                                  {band.actualWinRate}%
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`${Math.abs(band.calibrationError) <= 5 ? 'text-green-400' : Math.abs(band.calibrationError) <= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {band.calibrationError >= 0 ? '+' : ''}{band.calibrationError}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                              No calibration data. Predictions need modelProbability field.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Calibration Legend */}
                <div className="card p-4">
                  <h4 className="text-sm font-medium text-text-primary mb-2">How to Read</h4>
                  <div className="text-xs text-text-muted space-y-1">
                    <p>• <span className="text-green-400">Green error (±5%)</span> = Well calibrated</p>
                    <p>• <span className="text-yellow-400">Yellow error (±10%)</span> = Slight miscalibration</p>
                    <p>• <span className="text-red-400">Red error (&gt;10%)</span> = Needs attention</p>
                    <p>• Positive error = Model overconfident, Negative = Model underconfident</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== CLV (CLOSING LINE VALUE) ===== */}
            {predictionSubTab === 'clv' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary">{edgePerformanceStats.clvStats.totalWithCLV}</div>
                    <div className="text-xs text-text-secondary">Predictions w/ CLV</div>
                  </div>
                  <div className="card p-4 text-center border-blue-500/30 bg-blue-500/5">
                    <div className={`text-2xl font-bold ${edgePerformanceStats.clvStats.avgCLV >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {edgePerformanceStats.clvStats.avgCLV >= 0 ? '+' : ''}{edgePerformanceStats.clvStats.avgCLV}%
                    </div>
                    <div className="text-xs text-text-secondary">Avg CLV</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{edgePerformanceStats.clvStats.positiveCLVCount}</div>
                    <div className="text-xs text-text-secondary">Positive CLV</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary">{edgePerformanceStats.clvStats.positiveCLVPercent}%</div>
                    <div className="text-xs text-text-secondary">+CLV Rate</div>
                  </div>
                </div>

                {edgePerformanceStats.clvStats.bySport.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-primary">
                      <h3 className="text-sm font-medium text-text-primary">CLV by Sport</h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {edgePerformanceStats.clvStats.bySport.map((sport) => (
                          <div key={sport.sport} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                            <span className="text-sm text-text-primary">{sport.sport}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-text-muted">{sport.count} predictions</span>
                              <span className={`text-sm font-medium ${sport.avgCLV >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {sport.avgCLV >= 0 ? '+' : ''}{sport.avgCLV}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {edgePerformanceStats.clvStats.totalWithCLV === 0 && (
                  <div className="card p-8 text-center">
                    <p className="text-text-muted">No CLV data available. Need closing odds to calculate CLV.</p>
                    <p className="text-xs text-text-muted mt-2">CLV = Closing probability - Opening probability</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== ROI SIMULATION (Internal Only) ===== */}
            {predictionSubTab === 'roi' && (
              <div className="space-y-6">
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-400">
                    💡 <strong>Simulation Rules:</strong> Flat 1 unit stake per prediction where edge ≥ 2%. No compounding.
                  </p>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary">{edgePerformanceStats.roiSimulation.totalBets}</div>
                    <div className="text-xs text-text-secondary">Total Bets</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary">{edgePerformanceStats.roiSimulation.totalStaked}u</div>
                    <div className="text-xs text-text-secondary">Total Staked</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{edgePerformanceStats.roiSimulation.totalReturn.toFixed(1)}u</div>
                    <div className="text-xs text-text-secondary">Total Return</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className={`text-2xl font-bold ${edgePerformanceStats.roiSimulation.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {edgePerformanceStats.roiSimulation.netProfit >= 0 ? '+' : ''}{edgePerformanceStats.roiSimulation.netProfit.toFixed(1)}u
                    </div>
                    <div className="text-xs text-text-secondary">Net P/L</div>
                  </div>
                  <div className={`card p-4 text-center ${edgePerformanceStats.roiSimulation.roi >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className={`text-2xl font-bold ${edgePerformanceStats.roiSimulation.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {edgePerformanceStats.roiSimulation.roi >= 0 ? '+' : ''}{edgePerformanceStats.roiSimulation.roi}%
                    </div>
                    <div className="text-xs text-text-secondary">ROI</div>
                  </div>
                </div>

                {edgePerformanceStats.roiSimulation.byEdgeBucket.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-primary">
                      <h3 className="text-sm font-medium text-text-primary">ROI by Edge Bucket</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Bucket</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Bets</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Profit</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary">
                          {edgePerformanceStats.roiSimulation.byEdgeBucket.map((bucket) => (
                            <tr key={bucket.bucket} className="hover:bg-bg-tertiary/50">
                              <td className="px-4 py-3"><EdgeBucketBadge bucket={bucket.bucket} /></td>
                              <td className="px-4 py-3 text-text-secondary">{bucket.bets}</td>
                              <td className="px-4 py-3">
                                <span className={bucket.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {bucket.profit >= 0 ? '+' : ''}{bucket.profit}u
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={bucket.roi >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {bucket.roi >= 0 ? '+' : ''}{bucket.roi}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {edgePerformanceStats.roiSimulation.bySport.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-primary">
                      <h3 className="text-sm font-medium text-text-primary">ROI by Sport</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Sport</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Bets</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">Profit</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary">
                          {edgePerformanceStats.roiSimulation.bySport.map((sport) => (
                            <tr key={sport.sport} className="hover:bg-bg-tertiary/50">
                              <td className="px-4 py-3 text-text-primary">{sport.sport}</td>
                              <td className="px-4 py-3 text-text-secondary">{sport.bets}</td>
                              <td className="px-4 py-3">
                                <span className={sport.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {sport.profit >= 0 ? '+' : ''}{sport.profit}u
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={sport.roi >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {sport.roi >= 0 ? '+' : ''}{sport.roi}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== RAW DATA ===== */}
            {predictionSubTab === 'raw' && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-primary">Recent Predictions (Raw)</h3>
                  <span className="text-xs text-text-muted">{edgePerformanceStats.recentPredictions.length} shown</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-tertiary">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Match</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Selection</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">P_model</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">P_market</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Edge</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Odds</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                      {paginatedPredictions.map((pred) => (
                        <tr key={pred.id} className="hover:bg-bg-tertiary/50">
                          <td className="px-3 py-2">
                            <div className="text-text-primary truncate max-w-[180px]">{pred.matchName}</div>
                            <div className="text-xs text-text-muted">{pred.league}</div>
                          </td>
                          <td className="px-3 py-2 text-text-secondary text-xs">{pred.selection || '-'}</td>
                          <td className="px-3 py-2 text-text-secondary">{pred.modelProbability?.toFixed(1) || '-'}%</td>
                          <td className="px-3 py-2 text-text-secondary">{pred.marketProbabilityFair?.toFixed(1) || '-'}%</td>
                          <td className="px-3 py-2">
                            {pred.edgeValue !== null ? (
                              <span className={pred.edgeValue >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {pred.edgeValue >= 0 ? '+' : ''}{pred.edgeValue.toFixed(1)}%
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 text-text-secondary">{pred.marketOddsAtPrediction?.toFixed(2) || '-'}</td>
                          <td className="px-3 py-2">
                            <BinaryOutcomeBadge outcome={pred.binaryOutcome} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={predictionsPage}
                  totalPages={totalPredictionsPages}
                  onPageChange={setPredictionsPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* CHAT TAB */}
        {/* ============================================ */}
        {activeTab === 'chat' && chatAnalytics && (
          <div className="space-y-6">
            {/* Top Categories & Teams */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Top Categories</h3>
                {chatAnalytics.topCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chatAnalytics.topCategories.slice(0, 8).map((cat) => (
                      <span key={cat.category} className="px-3 py-1 rounded-full bg-bg-tertiary text-text-primary text-sm">
                        {cat.category} <span className="text-text-muted">({cat.count})</span>
                      </span>
                    ))}
                  </div>
                ) : <div className="text-text-muted text-sm">No data</div>}
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Top Teams</h3>
                {chatAnalytics.topTeams.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chatAnalytics.topTeams.slice(0, 8).map((team) => (
                      <span key={team.team} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">
                        {team.team} <span className="text-accent/60">({team.count})</span>
                      </span>
                    ))}
                  </div>
                ) : <div className="text-text-muted text-sm">No data</div>}
              </div>
            </div>

            {/* Recent Queries Table */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-primary">Recent Queries</h3>
                <span className="text-xs text-text-muted">{chatAnalytics.recentQueries.length} total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Query</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">User</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Mode</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Search</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {paginatedQueries.map((q) => (
                      <tr key={q.id} className="hover:bg-bg-tertiary/50">
                        <td className="px-3 py-2">
                          <div className="text-text-primary max-w-[250px] truncate" title={q.query}>{q.query}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-text-secondary truncate max-w-[100px]">
                          {q.user?.email || <span className="text-text-muted">Anon</span>}
                        </td>
                        <td className="px-3 py-2">
                          {q.category ? <CategoryBadge category={q.category} /> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {q.brainMode ? <ModeBadge mode={q.brainMode} /> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {q.usedRealTimeSearch ? <span className="text-green-400">✓</span> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-text-secondary">{formatTimeAgo(new Date(q.createdAt))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={chatPage}
                totalPages={totalChatPages}
                onPageChange={setChatPage}
              />
            </div>

            {/* User Feedback Analytics */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-text-primary mb-4">💬 User Feedback</h3>

              {/* Feedback Overview */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-bg-tertiary rounded-lg p-3">
                  <div className="text-2xl font-bold text-text-primary">{chatAnalytics.feedbackStats.total}</div>
                  <div className="text-xs text-text-muted">Total Reviews</div>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{chatAnalytics.feedbackStats.positive}</div>
                  <div className="text-xs text-text-muted">Positive (4-5★)</div>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-400">{chatAnalytics.feedbackStats.negative}</div>
                  <div className="text-xs text-text-muted">Negative (1-2★)</div>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">{chatAnalytics.feedbackStats.avgRating.toFixed(1)}★</div>
                  <div className="text-xs text-text-muted">Avg Rating</div>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-3">
                  <div className="text-2xl font-bold text-accent">{chatAnalytics.feedbackStats.satisfactionRate}%</div>
                  <div className="text-xs text-text-muted">Satisfaction</div>
                </div>
              </div>

              {/* Satisfaction by Data Confidence */}
              {chatAnalytics.feedbackStats.byConfidence.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-text-secondary mb-2">Satisfaction by Data Confidence</h4>
                  <div className="flex flex-wrap gap-2">
                    {chatAnalytics.feedbackStats.byConfidence.map((conf) => (
                      <div key={conf.level} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary">
                        <span className={`text-sm font-medium ${conf.level === 'FULL' ? 'text-green-400' :
                          conf.level === 'PARTIAL' ? 'text-yellow-400' :
                            conf.level === 'MINIMAL' ? 'text-orange-400' :
                              conf.level === 'NONE' ? 'text-red-400' :
                                'text-text-muted'
                          }`}>
                          {conf.level}
                        </span>
                        <span className="text-xs text-text-muted">({conf.total})</span>
                        <span className={`text-xs font-medium ${conf.satisfactionRate >= 80 ? 'text-green-400' :
                          conf.satisfactionRate >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                          {conf.satisfactionRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Negative Feedback */}
              {chatAnalytics.feedbackStats.recentNegative.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-text-secondary mb-2">⚠️ Recent Negative Feedback</h4>
                  <div className="space-y-2">
                    {chatAnalytics.feedbackStats.recentNegative.map((f, i) => (
                      <div key={i} className="p-2 rounded bg-red-500/10 border border-red-500/20">
                        <div className="text-sm text-text-primary truncate">&quot;{f.query}&quot;</div>
                        <div className="flex gap-3 mt-1 text-xs text-text-muted">
                          <span>Rating: {f.rating}★</span>
                          {f.confidence && <span>Confidence: {f.confidence}</span>}
                          <span>{formatTimeAgo(new Date(f.createdAt))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* USERS TAB - Combined with User Management */}
        {/* ============================================ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Toggle User Management */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowUserManagement(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showUserManagement ? 'bg-primary text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
              >
                Recent Users
              </button>
              <button
                onClick={() => setShowUserManagement(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showUserManagement ? 'bg-primary text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
              >
                ⚙️ Manage Users
              </button>
            </div>

            {showUserManagement ? (
              <div className="card p-5">
                <UserManagement />
              </div>
            ) : (
              <>
                {/* Users Table */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-primary">All Users</h3>
                    <span className="text-xs text-text-muted">{recentUsers.length} total</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">User</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Plan</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Source</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Analyses</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary">
                        {paginatedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-bg-tertiary/50">
                            <td className="px-3 py-2">
                              <div className="text-text-primary">{user.name || 'Anonymous'}</div>
                              <div className="text-xs text-text-muted">{user.email}</div>
                            </td>
                            <td className="px-3 py-2"><PlanBadge plan={user.plan} /></td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{user.referralSource || 'Direct'}</td>
                            <td className="px-3 py-2 text-text-secondary">{user._count.analyses}</td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{formatDate(new Date(user.createdAt))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={usersPage}
                    totalPages={totalUsersPages}
                    onPageChange={setUsersPage}
                  />
                </div>

                {/* Recent Analyses */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-primary">Recent Analyses</h3>
                    <span className="text-xs text-text-muted">{recentAnalyses.length} total</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Match</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Sport</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">User</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary">
                        {paginatedAnalyses.map((analysis) => (
                          <tr key={analysis.id} className="hover:bg-bg-tertiary/50">
                            <td className="px-3 py-2 text-text-primary">{analysis.homeTeam} vs {analysis.awayTeam}</td>
                            <td className="px-3 py-2 text-text-secondary capitalize">{analysis.sport}</td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{analysis.user.name || analysis.user.email}</td>
                            <td className="px-3 py-2 text-xs text-text-secondary">{formatTimeAgo(new Date(analysis.createdAt))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={analysesPage}
                    totalPages={totalAnalysesPages}
                    onPageChange={setAnalysesPage}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function QuickStat({ label, value, highlight, color }: {
  label: string;
  value: string | number;
  highlight?: boolean;
  color?: 'green' | 'blue' | 'purple';
}) {
  const colorClass = highlight ? 'text-accent' :
    color === 'green' ? 'text-green-400' :
      color === 'blue' ? 'text-blue-400' :
        color === 'purple' ? 'text-purple-400' : 'text-text-primary';

  return (
    <div className="card p-3 text-center">
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
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
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${active
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[plan] || colors.FREE}`}>
      {plan}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
      {category}
    </span>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    agent: 'bg-purple-500/20 text-purple-400',
    data: 'bg-green-500/20 text-green-400',
    analysis: 'bg-yellow-500/20 text-yellow-400',
    post: 'bg-pink-500/20 text-pink-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[mode] || 'bg-gray-500/20 text-gray-400'}`}>
      {mode}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === 'PENDING') {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">⏳ Pending</span>;
  }
  if (outcome === 'HIT') {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">✓ Hit</span>;
  }
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">✗ Miss</span>;
}

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-border-primary flex items-center justify-between">
      <span className="text-xs text-text-muted">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded text-sm bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded text-sm bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function SubTabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${active
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'
        }`}
    >
      {children}
    </button>
  );
}

function EdgeBucketBadge({ bucket }: { bucket: string }) {
  const styles: Record<string, string> = {
    HIGH: 'bg-green-500/20 text-green-400 border border-green-500/30',
    MEDIUM: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    SMALL: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    NO_EDGE: 'bg-gray-500/20 text-gray-400',
  };
  const labels: Record<string, string> = {
    HIGH: '🔥 High (>8%)',
    MEDIUM: '📈 Medium (5-8%)',
    SMALL: '📊 Small (2-5%)',
    NO_EDGE: '— No Edge (<2%)',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[bucket] || styles.NO_EDGE}`}>
      {labels[bucket] || bucket}
    </span>
  );
}

function BinaryOutcomeBadge({ outcome }: { outcome: number | null }) {
  if (outcome === null) {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">⏳ Pending</span>;
  }
  if (outcome === 1) {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">✓ Win</span>;
  }
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">✗ Loss</span>;
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
  });
}
