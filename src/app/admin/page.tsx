import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboard from './AdminDashboard';

// Admin access list
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
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
    predictionStats,
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
    
    // Prediction accuracy stats
    getPredictionStats(),
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
      predictionStats={predictionStats}
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

async function getPredictionStats() {
  try {
    // Get all predictions with outcomes - using unique matchRef to avoid counting duplicates
    const [
      totalPredictions,
      totalUniqueMatches,
      evaluatedPredictions,
      accuratePredictions,
      recentPredictions,
      byLeague,
      byConfidence,
      last30Days,
      last7Days,
    ] = await Promise.all([
      // Total prediction records (for reference)
      prisma.predictionOutcome.count(),
      
      // Total UNIQUE matches (the real count we care about)
      prisma.predictionOutcome.findMany({
        distinct: ['matchRef'],
        select: { matchRef: true },
      }).then(results => results.length),
      
      // Evaluated unique matches (has wasAccurate set) - count unique matchRefs
      prisma.predictionOutcome.findMany({
        where: { wasAccurate: { not: null } },
        distinct: ['matchRef'],
        select: { matchRef: true },
      }).then(results => results.length),
      
      // Accurate predictions - count unique matchRefs where wasAccurate is true
      prisma.predictionOutcome.findMany({
        where: { wasAccurate: true },
        distinct: ['matchRef'],
        select: { matchRef: true },
      }).then(results => results.length),
      
      // Recent predictions (last 50 unique matches)
      prisma.predictionOutcome.findMany({
        take: 50,
        orderBy: { matchDate: 'desc' },
        distinct: ['matchRef'],
        select: {
          id: true,
          matchRef: true,
          league: true,
          matchDate: true,
          narrativeAngle: true,
          predictedScenario: true,
          confidenceLevel: true,
          actualResult: true,
          actualScore: true,
          wasAccurate: true,
          learningNote: true,
          createdAt: true,
        },
      }),
      
      // Accuracy by league
      prisma.predictionOutcome.groupBy({
        by: ['league'],
        where: { 
          wasAccurate: { not: null },
          league: { not: null },
        },
        _count: { id: true },
      }).then(async (leagues) => {
        // For each league, get accurate count
        const leagueStats = await Promise.all(
          leagues.map(async (l) => {
            const accurate = await prisma.predictionOutcome.count({
              where: { league: l.league, wasAccurate: true },
            });
            return {
              league: l.league!,
              total: l._count.id,
              accurate,
              accuracy: l._count.id > 0 ? Math.round((accurate / l._count.id) * 100) : 0,
            };
          })
        );
        return leagueStats.sort((a, b) => b.total - a.total).slice(0, 10);
      }),
      
      // Accuracy by confidence level
      prisma.predictionOutcome.groupBy({
        by: ['confidenceLevel'],
        where: { 
          wasAccurate: { not: null },
          confidenceLevel: { not: null },
        },
        _count: { id: true },
      }).then(async (levels) => {
        const levelStats = await Promise.all(
          levels.map(async (l) => {
            const accurate = await prisma.predictionOutcome.count({
              where: { confidenceLevel: l.confidenceLevel, wasAccurate: true },
            });
            return {
              confidence: l.confidenceLevel!,
              total: l._count.id,
              accurate,
              accuracy: l._count.id > 0 ? Math.round((accurate / l._count.id) * 100) : 0,
            };
          })
        );
        return levelStats.sort((a, b) => a.confidence - b.confidence);
      }),
      
      // Last 30 days stats
      prisma.predictionOutcome.findMany({
        where: {
          matchDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          wasAccurate: { not: null },
        },
        select: { wasAccurate: true, matchDate: true },
      }),
      
      // Last 7 days stats
      prisma.predictionOutcome.findMany({
        where: {
          matchDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          wasAccurate: { not: null },
        },
        select: { wasAccurate: true },
      }),
    ]);

    // Calculate overall accuracy
    const overallAccuracy = evaluatedPredictions > 0 
      ? Math.round((accuratePredictions / evaluatedPredictions) * 100) 
      : 0;
    
    // Calculate 30-day accuracy
    const accurate30d = last30Days.filter(p => p.wasAccurate).length;
    const accuracy30d = last30Days.length > 0 
      ? Math.round((accurate30d / last30Days.length) * 100) 
      : 0;
    
    // Calculate 7-day accuracy
    const accurate7d = last7Days.filter(p => p.wasAccurate).length;
    const accuracy7d = last7Days.length > 0 
      ? Math.round((accurate7d / last7Days.length) * 100) 
      : 0;
    
    // Build daily trend for last 30 days
    const dailyTrend: Array<{ date: string; total: number; accurate: number; accuracy: number }> = [];
    const dateMap = new Map<string, { total: number; accurate: number }>();
    
    for (const pred of last30Days) {
      const dateKey = pred.matchDate.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey) || { total: 0, accurate: 0 };
      existing.total++;
      if (pred.wasAccurate) existing.accurate++;
      dateMap.set(dateKey, existing);
    }
    
    // Sort by date
    const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [date, stats] of sortedDates) {
      dailyTrend.push({
        date,
        total: stats.total,
        accurate: stats.accurate,
        accuracy: stats.total > 0 ? Math.round((stats.accurate / stats.total) * 100) : 0,
      });
    }

    return {
      totalPredictions: totalUniqueMatches, // Use unique match count as the main number
      totalRecords: totalPredictions, // Keep raw record count for debugging
      evaluatedPredictions,
      accuratePredictions,
      pendingEvaluation: totalUniqueMatches - evaluatedPredictions,
      overallAccuracy,
      accuracy7d,
      accuracy30d,
      total7d: last7Days.length,
      total30d: last30Days.length,
      recentPredictions,
      byLeague,
      byConfidence,
      dailyTrend,
    };
  } catch (error) {
    console.error('Error fetching prediction stats:', error);
    return {
      totalPredictions: 0,
      totalRecords: 0,
      evaluatedPredictions: 0,
      accuratePredictions: 0,
      pendingEvaluation: 0,
      overallAccuracy: 0,
      accuracy7d: 0,
      accuracy30d: 0,
      total7d: 0,
      total30d: 0,
      recentPredictions: [],
      byLeague: [],
      byConfidence: [],
      dailyTrend: [],
    };
  }
}
