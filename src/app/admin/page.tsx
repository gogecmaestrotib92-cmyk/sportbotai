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
    
    // AI Prediction stats (Prediction model from pre-analyze)
    getAIPredictionStats(),
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
  };

  return (
    <AdminDashboard
      stats={stats}
      recentUsers={recentUsers}
      recentAnalyses={recentAnalyses}
      chatAnalytics={chatAnalytics}
      aiPredictionStats={aiPredictionStats}
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

/**
 * Get AI Prediction stats from the Prediction model (pre-analyzed matches)
 * Only shows v2 (new model) stats - legacy v1 predictions are excluded
 */
async function getAIPredictionStats() {
  try {
    const modelVersionFilter = { modelVersion: 'v2' };
    
    const [
      totalPredictions,
      pendingPredictions,
      hitPredictions,
      missPredictions,
      recentPredictions,
      byLeague,
      bySport,
      byConviction,
      byType,
      valueBetStats,
      // Also get legacy stats for comparison
      legacyStats,
    ] = await Promise.all([
      // Total predictions (v2 only)
      prisma.prediction.count({ where: modelVersionFilter }),
      
      // Pending (not yet validated)
      prisma.prediction.count({ where: { ...modelVersionFilter, outcome: 'PENDING' } }),
      
      // Hits
      prisma.prediction.count({ where: { ...modelVersionFilter, outcome: 'HIT' } }),
      
      // Misses
      prisma.prediction.count({ where: { ...modelVersionFilter, outcome: 'MISS' } }),
      
      // Recent 50 predictions (v2 only)
      prisma.prediction.findMany({
        where: modelVersionFilter,
        take: 50,
        orderBy: { kickoff: 'desc' },
        select: {
          id: true,
          matchName: true,
          sport: true,
          league: true,
          kickoff: true,
          prediction: true,
          conviction: true,
          odds: true,
          outcome: true,
          actualResult: true,
          createdAt: true,
          valueBetSide: true,
          valueBetOdds: true,
          valueBetEdge: true,
          valueBetOutcome: true,
          valueBetProfit: true,
          modelVersion: true,
        },
      }),
      
      // By league (v2 only)
      prisma.prediction.groupBy({
        by: ['league'],
        where: { ...modelVersionFilter, outcome: { not: 'PENDING' } },
        _count: { id: true },
      }).then(async (leagues) => {
        return Promise.all(
          leagues.map(async (l) => {
            const hits = await prisma.prediction.count({
              where: { ...modelVersionFilter, league: l.league, outcome: 'HIT' },
            });
            return {
              league: l.league,
              total: l._count.id,
              hits,
              accuracy: l._count.id > 0 ? Math.round((hits / l._count.id) * 100) : 0,
            };
          })
        );
      }),
      
      // By sport (v2 only)
      prisma.prediction.groupBy({
        by: ['sport'],
        where: { ...modelVersionFilter, outcome: { not: 'PENDING' } },
        _count: { id: true },
      }).then(async (sports) => {
        return Promise.all(
          sports.map(async (s) => {
            const hits = await prisma.prediction.count({
              where: { ...modelVersionFilter, sport: s.sport, outcome: 'HIT' },
            });
            return {
              sport: s.sport,
              total: s._count.id,
              hits,
              accuracy: s._count.id > 0 ? Math.round((hits / s._count.id) * 100) : 0,
            };
          })
        );
      }),
      
      // By conviction level (grouped into Low: 1-3, Medium: 4-6, High: 7-10)
      getConvictionStats('v2'),
      
      // By prediction type (HOME, AWAY, DRAW)
      getTypeStats('v2'),
      
      // Value bet ROI stats
      getValueBetStats('v2'),
      
      // Legacy v1 stats for comparison
      getLegacyStats(),
    ]);
    
    const evaluatedCount = hitPredictions + missPredictions;
    const overallAccuracy = evaluatedCount > 0 
      ? Math.round((hitPredictions / evaluatedCount) * 100) 
      : 0;
    
    return {
      totalPredictions,
      pendingPredictions,
      hitPredictions,
      missPredictions,
      evaluatedCount,
      overallAccuracy,
      recentPredictions,
      byLeague: byLeague.sort((a, b) => b.total - a.total).slice(0, 10),
      bySport: bySport.sort((a, b) => b.total - a.total),
      byConviction,
      byType,
      valueBetStats,
      legacyStats,
    };
  } catch (error) {
    console.error('Error fetching AI prediction stats:', error);
    return {
      totalPredictions: 0,
      pendingPredictions: 0,
      hitPredictions: 0,
      missPredictions: 0,
      evaluatedCount: 0,
      overallAccuracy: 0,
      recentPredictions: [],
      byLeague: [],
      bySport: [],
      byConviction: [],
      byType: [],
      valueBetStats: { totalBets: 0, hits: 0, misses: 0, totalProfit: 0, roi: 0 },
      legacyStats: { total: 0, hits: 0, accuracy: 0 },
    };
  }
}

/**
 * Get legacy v1 stats for comparison
 */
async function getLegacyStats() {
  try {
    const total = await prisma.prediction.count({
      where: { modelVersion: 'v1', outcome: { not: 'PENDING' } }
    });
    const hits = await prisma.prediction.count({
      where: { modelVersion: 'v1', outcome: 'HIT' }
    });
    return {
      total,
      hits,
      accuracy: total > 0 ? Math.round((hits / total) * 100) : 0,
    };
  } catch {
    return { total: 0, hits: 0, accuracy: 0 };
  }
}

/**
 * Get accuracy stats grouped by conviction level
 */
async function getConvictionStats(modelVersion: string = 'v2') {
  try {
    // Get all evaluated predictions with conviction
    const predictions = await prisma.prediction.findMany({
      where: { modelVersion, outcome: { not: 'PENDING' } },
      select: { conviction: true, outcome: true },
    });
    
    // Group by conviction ranges: Low (1-3), Medium (4-6), High (7-10)
    const groups = {
      low: { label: 'Low (1-3)', total: 0, hits: 0 },
      medium: { label: 'Medium (4-6)', total: 0, hits: 0 },
      high: { label: 'High (7-10)', total: 0, hits: 0 },
    };
    
    for (const p of predictions) {
      const conv = p.conviction;
      const isHit = p.outcome === 'HIT';
      
      if (conv <= 3) {
        groups.low.total++;
        if (isHit) groups.low.hits++;
      } else if (conv <= 6) {
        groups.medium.total++;
        if (isHit) groups.medium.hits++;
      } else {
        groups.high.total++;
        if (isHit) groups.high.hits++;
      }
    }
    
    return Object.values(groups).map(g => ({
      level: g.label,
      total: g.total,
      hits: g.hits,
      accuracy: g.total > 0 ? Math.round((g.hits / g.total) * 100) : 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Get accuracy stats grouped by prediction type (HOME, AWAY, DRAW)
 */
async function getTypeStats(modelVersion: string = 'v2') {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { modelVersion, outcome: { not: 'PENDING' } },
      select: { prediction: true, outcome: true },
    });
    
    const groups = {
      home: { label: 'Home Win', total: 0, hits: 0 },
      away: { label: 'Away Win', total: 0, hits: 0 },
      draw: { label: 'Draw', total: 0, hits: 0 },
    };
    
    for (const p of predictions) {
      const pred = p.prediction.toLowerCase();
      const isHit = p.outcome === 'HIT';
      
      if (pred.includes('home')) {
        groups.home.total++;
        if (isHit) groups.home.hits++;
      } else if (pred.includes('away')) {
        groups.away.total++;
        if (isHit) groups.away.hits++;
      } else if (pred.includes('draw')) {
        groups.draw.total++;
        if (isHit) groups.draw.hits++;
      }
    }
    
    return Object.values(groups).map(g => ({
      type: g.label,
      total: g.total,
      hits: g.hits,
      accuracy: g.total > 0 ? Math.round((g.hits / g.total) * 100) : 0,
    }));
  } catch {
    return [];
  }
}
/**
 * Get value bet ROI statistics
 */
async function getValueBetStats(modelVersion: string = 'v2') {
  try {
    // Get all predictions with value bet data that have been evaluated
    const predictions = await prisma.prediction.findMany({
      where: { 
        modelVersion,
        valueBetOutcome: { not: null },
        valueBetProfit: { not: null },
      },
      select: { 
        valueBetOutcome: true, 
        valueBetProfit: true,
        valueBetOdds: true,
        valueBetEdge: true,
      },
    });
    
    const hits = predictions.filter(p => p.valueBetOutcome === 'HIT').length;
    const misses = predictions.filter(p => p.valueBetOutcome === 'MISS').length;
    const totalBets = hits + misses;
    const totalProfit = predictions.reduce((sum, p) => sum + (p.valueBetProfit || 0), 0);
    const roi = totalBets > 0 ? (totalProfit / totalBets) * 100 : 0; // ROI as percentage
    
    // Average odds and edge for winning bets
    const winningBets = predictions.filter(p => p.valueBetOutcome === 'HIT');
    const avgWinningOdds = winningBets.length > 0 
      ? winningBets.reduce((sum, p) => sum + (p.valueBetOdds || 0), 0) / winningBets.length 
      : 0;
    const avgEdge = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + (p.valueBetEdge || 0), 0) / predictions.length
      : 0;
    
    return {
      totalBets,
      hits,
      misses,
      totalProfit: Math.round(totalProfit * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      avgWinningOdds: Math.round(avgWinningOdds * 100) / 100,
      avgEdge: Math.round(avgEdge * 10) / 10,
    };
  } catch {
    return { totalBets: 0, hits: 0, misses: 0, totalProfit: 0, roi: 0, avgWinningOdds: 0, avgEdge: 0 };
  }
}