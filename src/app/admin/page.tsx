import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboard from './AdminDashboard';

// Admin access list
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
  'stefan@automateed.com',
];

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user is admin
  if (!ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/');
  }

  // Fetch dashboard stats
  const [
    totalUsers,
    proUsers,
    premiumUsers,
    totalAnalyses,
    todayAnalyses,
    recentUsers,
    recentAnalyses,
    // Chat/Memory stats
    chatStats,
    topCategories,
    topTeams,
    recentQueries,
    agentPostsCount,
    feedbackStats,
    // Prediction stats
    aiPredictionStats,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // Pro subscribers
    prisma.user.count({ where: { plan: 'PRO' } }),
    
    // Premium subscribers
    prisma.user.count({ where: { plan: 'PREMIUM' } }),
    
    // Total analyses
    prisma.analysis.count(),
    
    // Today's analyses
    prisma.analysis.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    
    // Recent users (last 10)
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
        referralSource: true,
        _count: { select: { analyses: true } },
      },
    }),
    
    // Recent analyses (last 10)
    prisma.analysis.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sport: true,
        homeTeam: true,
        awayTeam: true,
        createdAt: true,
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    
    // Chat query stats
    getChatStats(),
    
    // Top categories
    getTopCategoriesFromDB(),
    
    // Top teams
    getTopTeamsFromDB(),
    
    // Recent queries
    getRecentQueries(),
    
    // Agent posts count
    getAgentPostsCount(),
    
    // Feedback stats
    getFeedbackStats(),
    
    // Edge Performance Tracking (new prediction stats)
    getEdgePerformanceStats(),
  ]);

  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = (proUsers * 18.99) + (premiumUsers * 40);

  const stats = {
    totalUsers,
    proUsers,
    premiumUsers,
    freeUsers: totalUsers - proUsers - premiumUsers,
    totalAnalyses,
    todayAnalyses,
    mrr,
  };

  const chatAnalytics = {
    ...chatStats,
    topCategories,
    topTeams,
    recentQueries,
    agentPostsCount,
    feedbackStats,
  };

  return (
    <AdminDashboard
      stats={stats}
      recentUsers={recentUsers}
      recentAnalyses={recentAnalyses}
      chatAnalytics={chatAnalytics}
      edgePerformanceStats={aiPredictionStats}
    />
  );
}

// Helper functions for chat analytics
async function getChatStats() {
  try {
    const [totalQueries, todayQueries, queriesWithSearch, queriesWithCitations] = await Promise.all([
      prisma.chatQuery.count(),
      prisma.chatQuery.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.chatQuery.count({ where: { usedRealTimeSearch: true } }),
      prisma.chatQuery.count({ where: { hadCitations: true } }),
    ]);
    
    return {
      totalQueries,
      todayQueries,
      queriesWithSearch,
      queriesWithCitations,
      searchRate: totalQueries > 0 ? Math.round((queriesWithSearch / totalQueries) * 100) : 0,
    };
  } catch {
    return { totalQueries: 0, todayQueries: 0, queriesWithSearch: 0, queriesWithCitations: 0, searchRate: 0 };
  }
}

async function getTopCategoriesFromDB() {
  try {
    const results = await prisma.chatQuery.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    });
    return results.map(r => ({ category: r.category!, count: r._count.category }));
  } catch {
    return [];
  }
}

async function getTopTeamsFromDB() {
  try {
    const results = await prisma.chatQuery.groupBy({
      by: ['team'],
      where: { team: { not: null } },
      _count: { team: true },
      orderBy: { _count: { team: 'desc' } },
      take: 10,
    });
    return results.map(r => ({ team: r.team!, count: r._count.team }));
  } catch {
    return [];
  }
}

async function getRecentQueries() {
  try {
    return await prisma.chatQuery.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        query: true,
        category: true,
        brainMode: true,
        sport: true,
        team: true,
        usedRealTimeSearch: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

async function getAgentPostsCount() {
  try {
    return await prisma.agentPost.count();
  } catch {
    return 0;
  }
}

async function getFeedbackStats() {
  try {
    const allFeedback = await prisma.chatFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Last 100 for analysis
    });
    
    const total = allFeedback.length;
    const positive = allFeedback.filter(f => f.rating >= 4).length;
    const negative = allFeedback.filter(f => f.rating <= 2).length;
    const neutral = allFeedback.filter(f => f.rating === 3).length;
    
    const avgRating = total > 0 
      ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / total)
      : 0;
    
    const satisfactionRate = total > 0 
      ? Math.round((positive / total) * 100)
      : 0;
    
    // Feedback by confidence level
    const byConfidence: Record<string, { total: number; positive: number; negative: number }> = {};
    for (const f of allFeedback) {
      const level = f.dataConfidenceLevel || 'UNKNOWN';
      if (!byConfidence[level]) {
        byConfidence[level] = { total: 0, positive: 0, negative: 0 };
      }
      byConfidence[level].total++;
      if (f.rating >= 4) byConfidence[level].positive++;
      if (f.rating <= 2) byConfidence[level].negative++;
    }
    
    // Recent negative feedback for review
    const recentNegative = allFeedback
      .filter(f => f.rating <= 2)
      .slice(0, 5)
      .map(f => ({
        query: f.query?.substring(0, 100) || 'N/A',
        rating: f.rating,
        confidence: f.dataConfidenceLevel,
        createdAt: f.createdAt,
      }));
    
    return {
      total,
      positive,
      negative,
      neutral,
      avgRating: Math.round(avgRating * 100) / 100,
      satisfactionRate,
      byConfidence: Object.entries(byConfidence).map(([level, stats]) => ({
        level,
        ...stats,
        satisfactionRate: stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0,
      })),
      recentNegative,
    };
  } catch {
    return {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      avgRating: 0,
      satisfactionRate: 0,
      byConfidence: [],
      recentNegative: [],
    };
  }
}

/**
 * ================================================================
 * EDGE PERFORMANCE TRACKING SYSTEM
 * ================================================================
 * 
 * Purpose: Measure whether model-identified value edges are 
 * directionally correct, well-calibrated, and outperform market
 * expectations over time.
 * 
 * This system is strictly for INTERNAL EVALUATION, model improvement,
 * and quality control — NOT for user-facing betting claims.
 * 
 * Core Definitions:
 * - P_model: model-estimated probability at prediction time
 * - P_market_fair: vig-removed market probability
 * - Edge: P_model − P_market_fair
 * - binaryOutcome: 1 = selection won, 0 = selection lost
 * 
 * Edge Buckets:
 * - NO_EDGE: |edge| < 2%
 * - SMALL: 2-5%
 * - MEDIUM: 5-8%
 * - HIGH: >8%
 * ================================================================
 */

interface EdgeBucketStats {
  bucket: string;
  count: number;
  wins: number;
  winRate: number;
  avgEdge: number;
  avgModelProb: number;
  avgMarketProb: number;
  vsMarket: number; // Win rate - market implied win rate
}

interface CalibrationBand {
  band: string;        // e.g., "60-70%"
  minProb: number;
  maxProb: number;
  count: number;
  avgModelProb: number;
  actualWinRate: number;
  calibrationError: number; // avgModelProb - actualWinRate
}

interface CLVStats {
  totalWithCLV: number;
  avgCLV: number;
  positiveCLVCount: number;
  positiveCLVPercent: number;
  bySport: Array<{ sport: string; avgCLV: number; count: number }>;
}

interface ROISimulation {
  // ROI simulation is for internal model evaluation only
  totalBets: number;
  totalStaked: number; // 1 unit per bet
  totalReturn: number;
  netProfit: number;
  roi: number; // percentage
  byEdgeBucket: Array<{ bucket: string; bets: number; profit: number; roi: number }>;
  bySport: Array<{ sport: string; bets: number; profit: number; roi: number }>;
}

interface EdgePerformanceStats {
  // Overview
  totalPredictions: number;
  evaluatedPredictions: number;
  pendingPredictions: number;
  overallWinRate: number;
  
  // Edge bucket performance (CORE)
  byEdgeBucket: EdgeBucketStats[];
  
  // Calibration analysis
  calibration: CalibrationBand[];
  calibrationMSE: number; // Mean squared error
  
  // CLV tracking
  clvStats: CLVStats;
  
  // ROI simulation (internal only)
  roiSimulation: ROISimulation;
  
  // Segmentation
  bySport: Array<{ sport: string; count: number; wins: number; winRate: number; avgEdge: number }>;
  byLeague: Array<{ league: string; count: number; wins: number; winRate: number; avgEdge: number }>;
  
  // Recent predictions for raw data view
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
  
  // Pending predictions for manual result entry
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
}

async function getEdgePerformanceStats(): Promise<EdgePerformanceStats> {
  try {
    // Get all v2 predictions with edge data
    const predictions = await prisma.prediction.findMany({
      where: { modelVersion: 'v2' },
      select: {
        id: true,
        matchId: true,
        matchName: true,
        sport: true,
        league: true,
        kickoff: true,
        selection: true,
        modelProbability: true,
        marketProbabilityFair: true,
        edgeValue: true,
        edgeBucket: true,
        marketOddsAtPrediction: true,
        binaryOutcome: true,
        clvValue: true,
        closingProbabilityFair: true,
        outcome: true,
        conviction: true,
        valueBetSide: true,
        valueBetOdds: true,
        // Legacy fallbacks
        valueBetEdge: true,
        odds: true,
        prediction: true,
      },
      orderBy: { kickoff: 'desc' },
    });

    const total = predictions.length;
    const evaluated = predictions.filter(p => p.binaryOutcome !== null).length;
    const pending = total - evaluated;
    
    // ============================================
    // EDGE BUCKET PERFORMANCE
    // ============================================
    const buckets = {
      'HIGH': { count: 0, wins: 0, totalEdge: 0, totalModelProb: 0, totalMarketProb: 0 },
      'MEDIUM': { count: 0, wins: 0, totalEdge: 0, totalModelProb: 0, totalMarketProb: 0 },
      'SMALL': { count: 0, wins: 0, totalEdge: 0, totalModelProb: 0, totalMarketProb: 0 },
      'NO_EDGE': { count: 0, wins: 0, totalEdge: 0, totalModelProb: 0, totalMarketProb: 0 },
    };
    
    for (const p of predictions) {
      if (p.binaryOutcome === null) continue;
      
      // Determine bucket - use stored bucket or calculate from edge
      let bucket = p.edgeBucket as keyof typeof buckets;
      if (!bucket && p.edgeValue !== null) {
        const absEdge = Math.abs(p.edgeValue);
        if (absEdge >= 8) bucket = 'HIGH';
        else if (absEdge >= 5) bucket = 'MEDIUM';
        else if (absEdge >= 2) bucket = 'SMALL';
        else bucket = 'NO_EDGE';
      } else if (!bucket && p.valueBetEdge !== null) {
        // Fallback to legacy valueBetEdge
        const absEdge = Math.abs(p.valueBetEdge);
        if (absEdge >= 8) bucket = 'HIGH';
        else if (absEdge >= 5) bucket = 'MEDIUM';
        else if (absEdge >= 2) bucket = 'SMALL';
        else bucket = 'NO_EDGE';
      }
      
      if (!bucket) continue;
      
      const b = buckets[bucket];
      b.count++;
      if (p.binaryOutcome === 1) b.wins++;
      b.totalEdge += p.edgeValue ?? p.valueBetEdge ?? 0;
      b.totalModelProb += p.modelProbability ?? 0;
      b.totalMarketProb += p.marketProbabilityFair ?? 0;
    }
    
    const byEdgeBucket: EdgeBucketStats[] = Object.entries(buckets)
      .filter(([_, b]) => b.count > 0)
      .map(([bucket, b]) => ({
        bucket,
        count: b.count,
        wins: b.wins,
        winRate: Math.round((b.wins / b.count) * 100),
        avgEdge: Math.round((b.totalEdge / b.count) * 10) / 10,
        avgModelProb: Math.round((b.totalModelProb / b.count) * 10) / 10,
        avgMarketProb: Math.round((b.totalMarketProb / b.count) * 10) / 10,
        vsMarket: Math.round(((b.wins / b.count) * 100) - (b.totalMarketProb / b.count)),
      }))
      .sort((a, b) => {
        const order = { 'HIGH': 0, 'MEDIUM': 1, 'SMALL': 2, 'NO_EDGE': 3 };
        return (order[a.bucket as keyof typeof order] ?? 4) - (order[b.bucket as keyof typeof order] ?? 4);
      });

    // ============================================
    // CALIBRATION ANALYSIS
    // ============================================
    const calibrationBands: Record<string, { count: number; wins: number; totalProb: number }> = {};
    const bandRanges = [
      { band: '0-10%', min: 0, max: 10 },
      { band: '10-20%', min: 10, max: 20 },
      { band: '20-30%', min: 20, max: 30 },
      { band: '30-40%', min: 30, max: 40 },
      { band: '40-50%', min: 40, max: 50 },
      { band: '50-60%', min: 50, max: 60 },
      { band: '60-70%', min: 60, max: 70 },
      { band: '70-80%', min: 70, max: 80 },
      { band: '80-90%', min: 80, max: 90 },
      { band: '90-100%', min: 90, max: 100 },
    ];
    
    for (const range of bandRanges) {
      calibrationBands[range.band] = { count: 0, wins: 0, totalProb: 0 };
    }
    
    for (const p of predictions) {
      if (p.binaryOutcome === null || p.modelProbability === null) continue;
      
      const prob = p.modelProbability;
      const range = bandRanges.find(r => prob >= r.min && prob < r.max);
      if (range) {
        calibrationBands[range.band].count++;
        calibrationBands[range.band].totalProb += prob;
        if (p.binaryOutcome === 1) calibrationBands[range.band].wins++;
      }
    }
    
    let totalCalibError = 0;
    let calibCount = 0;
    const calibration: CalibrationBand[] = bandRanges
      .filter(r => calibrationBands[r.band].count > 0)
      .map(r => {
        const b = calibrationBands[r.band];
        const avgProb = b.totalProb / b.count;
        const actualRate = (b.wins / b.count) * 100;
        const error = avgProb - actualRate;
        totalCalibError += error * error;
        calibCount++;
        return {
          band: r.band,
          minProb: r.min,
          maxProb: r.max,
          count: b.count,
          avgModelProb: Math.round(avgProb * 10) / 10,
          actualWinRate: Math.round(actualRate * 10) / 10,
          calibrationError: Math.round(error * 10) / 10,
        };
      });
    
    const calibrationMSE = calibCount > 0 ? Math.round(Math.sqrt(totalCalibError / calibCount) * 10) / 10 : 0;

    // ============================================
    // CLV (CLOSING LINE VALUE) STATS
    // ============================================
    const predictionsWithCLV = predictions.filter(p => p.clvValue !== null);
    const avgCLV = predictionsWithCLV.length > 0
      ? predictionsWithCLV.reduce((sum, p) => sum + (p.clvValue ?? 0), 0) / predictionsWithCLV.length
      : 0;
    const positiveCLV = predictionsWithCLV.filter(p => (p.clvValue ?? 0) > 0);
    
    // CLV by sport
    const clvBySport: Record<string, { total: number; count: number }> = {};
    for (const p of predictionsWithCLV) {
      if (!clvBySport[p.sport]) clvBySport[p.sport] = { total: 0, count: 0 };
      clvBySport[p.sport].total += p.clvValue ?? 0;
      clvBySport[p.sport].count++;
    }
    
    const clvStats: CLVStats = {
      totalWithCLV: predictionsWithCLV.length,
      avgCLV: Math.round(avgCLV * 100) / 100,
      positiveCLVCount: positiveCLV.length,
      positiveCLVPercent: predictionsWithCLV.length > 0 
        ? Math.round((positiveCLV.length / predictionsWithCLV.length) * 100) 
        : 0,
      bySport: Object.entries(clvBySport).map(([sport, data]) => ({
        sport,
        avgCLV: Math.round((data.total / data.count) * 100) / 100,
        count: data.count,
      })),
    };

    // ============================================
    // ROI SIMULATION (INTERNAL ONLY)
    // This is for internal model evaluation only.
    // Flat 1 unit stake per prediction where edge >= 2%.
    // ============================================
    const roiBuckets: Record<string, { bets: number; profit: number }> = {
      'HIGH': { bets: 0, profit: 0 },
      'MEDIUM': { bets: 0, profit: 0 },
      'SMALL': { bets: 0, profit: 0 },
    };
    const roiSports: Record<string, { bets: number; profit: number }> = {};
    let totalBets = 0;
    let totalReturn = 0;
    
    for (const p of predictions) {
      if (p.binaryOutcome === null) continue;
      
      // Only stake when edge >= 2%
      const edge = p.edgeValue ?? p.valueBetEdge ?? 0;
      if (Math.abs(edge) < 2) continue;
      
      const odds = p.marketOddsAtPrediction ?? p.odds ?? 0;
      if (odds <= 1) continue;
      
      totalBets++;
      const profit = p.binaryOutcome === 1 ? (odds - 1) : -1; // 1 unit stake
      totalReturn += p.binaryOutcome === 1 ? odds : 0;
      
      // By bucket
      let bucket: string;
      if (Math.abs(edge) >= 8) bucket = 'HIGH';
      else if (Math.abs(edge) >= 5) bucket = 'MEDIUM';
      else bucket = 'SMALL';
      
      roiBuckets[bucket].bets++;
      roiBuckets[bucket].profit += profit;
      
      // By sport
      if (!roiSports[p.sport]) roiSports[p.sport] = { bets: 0, profit: 0 };
      roiSports[p.sport].bets++;
      roiSports[p.sport].profit += profit;
    }
    
    const netProfit = totalReturn - totalBets;
    const roiSimulation: ROISimulation = {
      totalBets,
      totalStaked: totalBets, // 1 unit per bet
      totalReturn: Math.round(totalReturn * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      roi: totalBets > 0 ? Math.round((netProfit / totalBets) * 1000) / 10 : 0,
      byEdgeBucket: Object.entries(roiBuckets)
        .filter(([_, d]) => d.bets > 0)
        .map(([bucket, d]) => ({
          bucket,
          bets: d.bets,
          profit: Math.round(d.profit * 100) / 100,
          roi: Math.round((d.profit / d.bets) * 1000) / 10,
        })),
      bySport: Object.entries(roiSports)
        .filter(([_, d]) => d.bets > 0)
        .map(([sport, d]) => ({
          sport,
          bets: d.bets,
          profit: Math.round(d.profit * 100) / 100,
          roi: Math.round((d.profit / d.bets) * 1000) / 10,
        })),
    };

    // ============================================
    // SPORT & LEAGUE SEGMENTATION
    // ============================================
    const sportStats: Record<string, { count: number; wins: number; totalEdge: number }> = {};
    const leagueStats: Record<string, { count: number; wins: number; totalEdge: number }> = {};
    
    for (const p of predictions) {
      if (p.binaryOutcome === null) continue;
      
      // Sport
      if (!sportStats[p.sport]) sportStats[p.sport] = { count: 0, wins: 0, totalEdge: 0 };
      sportStats[p.sport].count++;
      if (p.binaryOutcome === 1) sportStats[p.sport].wins++;
      sportStats[p.sport].totalEdge += p.edgeValue ?? p.valueBetEdge ?? 0;
      
      // League
      if (!leagueStats[p.league]) leagueStats[p.league] = { count: 0, wins: 0, totalEdge: 0 };
      leagueStats[p.league].count++;
      if (p.binaryOutcome === 1) leagueStats[p.league].wins++;
      leagueStats[p.league].totalEdge += p.edgeValue ?? p.valueBetEdge ?? 0;
    }
    
    const bySport = Object.entries(sportStats)
      .map(([sport, d]) => ({
        sport,
        count: d.count,
        wins: d.wins,
        winRate: Math.round((d.wins / d.count) * 100),
        avgEdge: Math.round((d.totalEdge / d.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);
    
    const byLeague = Object.entries(leagueStats)
      .map(([league, d]) => ({
        league,
        count: d.count,
        wins: d.wins,
        winRate: Math.round((d.wins / d.count) * 100),
        avgEdge: Math.round((d.totalEdge / d.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Overall win rate
    const totalWins = predictions.filter(p => p.binaryOutcome === 1).length;
    const overallWinRate = evaluated > 0 ? Math.round((totalWins / evaluated) * 100) : 0;

    // Recent predictions for raw data view
    const recentPredictions = predictions.slice(0, 50).map(p => ({
      id: p.id,
      matchName: p.matchName,
      sport: p.sport,
      league: p.league,
      kickoff: p.kickoff,
      selection: p.selection ?? p.prediction,
      modelProbability: p.modelProbability,
      marketProbabilityFair: p.marketProbabilityFair,
      edgeValue: p.edgeValue ?? p.valueBetEdge,
      edgeBucket: p.edgeBucket,
      marketOddsAtPrediction: p.marketOddsAtPrediction ?? p.odds,
      binaryOutcome: p.binaryOutcome,
      clvValue: p.clvValue,
    }));

    // Pending predictions for manual result entry
    const pendingPredictionsList = predictions
      .filter(p => p.outcome === 'PENDING')
      .slice(0, 100)
      .map(p => ({
        id: p.id,
        matchId: p.matchId,
        matchName: p.matchName,
        sport: p.sport,
        league: p.league,
        kickoff: p.kickoff,
        prediction: p.prediction,
        selection: p.selection,
        conviction: p.conviction,
        modelProbability: p.modelProbability,
        marketOddsAtPrediction: p.marketOddsAtPrediction ?? p.odds,
        valueBetSide: p.valueBetSide,
        valueBetOdds: p.valueBetOdds,
      }));

    return {
      totalPredictions: total,
      evaluatedPredictions: evaluated,
      pendingPredictions: pending,
      overallWinRate,
      byEdgeBucket,
      calibration,
      calibrationMSE,
      clvStats,
      roiSimulation,
      bySport,
      byLeague,
      recentPredictions,
      pendingPredictionsList,
    };
  } catch (error) {
    console.error('Error fetching edge performance stats:', error);
    return getDefaultEdgePerformanceStats();
  }
}

function getDefaultEdgePerformanceStats(): EdgePerformanceStats {
  return {
    totalPredictions: 0,
    evaluatedPredictions: 0,
    pendingPredictions: 0,
    overallWinRate: 0,
    byEdgeBucket: [],
    calibration: [],
    calibrationMSE: 0,
    clvStats: {
      totalWithCLV: 0,
      avgCLV: 0,
      positiveCLVCount: 0,
      positiveCLVPercent: 0,
      bySport: [],
    },
    roiSimulation: {
      totalBets: 0,
      totalStaked: 0,
      totalReturn: 0,
      netProfit: 0,
      roi: 0,
      byEdgeBucket: [],
      bySport: [],
    },
    bySport: [],
    byLeague: [],
    recentPredictions: [],
    pendingPredictionsList: [],
  };
}