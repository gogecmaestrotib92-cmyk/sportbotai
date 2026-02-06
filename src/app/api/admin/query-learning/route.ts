/**
 * Query Learning Insights API
 * 
 * Provides insights from the query learning system:
 * - Stats overview
 * - Queries needing attention
 * - Pattern suggestions
 * - Entity mismatches
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getQueryStats, 
  getQueriesNeedingAttention, 
  generateLearningInsights,
  suggestPatterns,
} from '@/lib/query-learning';
import type { QueryIntent } from '@/lib/query-intelligence';

export async function GET(request: NextRequest) {
  // Only allow admin users
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !['admin@sportbotai.com', 'stefan@sportbotai.com'].includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';
  
  try {
    switch (action) {
      case 'stats': {
        const stats = await getQueryStats();
        return NextResponse.json({ success: true, stats });
      }
      
      case 'attention': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const queries = await getQueriesNeedingAttention(limit);
        return NextResponse.json({ success: true, queries });
      }
      
      case 'insights': {
        const insights = await generateLearningInsights();
        return NextResponse.json({ success: true, insights });
      }
      
      case 'suggest-patterns': {
        const intent = searchParams.get('intent') as QueryIntent;
        if (!intent) {
          return NextResponse.json({ error: 'Missing intent parameter' }, { status: 400 });
        }
        const suggestions = await suggestPatterns(intent);
        return NextResponse.json({ success: true, intent, suggestions });
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[QueryLearning API] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch learning data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
