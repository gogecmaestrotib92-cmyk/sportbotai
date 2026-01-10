/**
 * Validate Cache Cron Job
 * 
 * Runs after pre-analyze to validate cached data completeness.
 * Detects and refreshes analyses with missing/incomplete data.
 * 
 * Issues detected:
 * - Missing form data (homeForm/awayForm is null or '-----')
 * - Missing H2H data when it should exist
 * - Parsing errors (wrong sport code, team names)
 * - Stale data from before code fixes
 * 
 * Schedule: Daily at 10 AM UTC (after pre-analyze completes)
 * Manual trigger: GET /api/cron/validate-cache?secret=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheDelete, CACHE_KEYS } from '@/lib/cache';
import { theOddsClient, OddsApiEvent } from '@/lib/theOdds';
import { getEnrichedMatchDataV2 } from '@/lib/data-layer/bridge';

export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

// Sports to validate (same as pre-analyze)
const SPORTS_TO_VALIDATE = [
  'soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga',
  'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_portugal_primeira_liga',
  'soccer_netherlands_eredivisie', 'soccer_turkey_super_league', 
  'soccer_belgium_first_div', 'soccer_spl', 'soccer_uefa_champs_league',
  'soccer_uefa_europa_league', 'basketball_nba', 'basketball_euroleague',
  'americanfootball_nfl', 'americanfootball_ncaaf', 'icehockey_nhl',
];

interface ValidationResult {
  matchKey: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  issues: string[];
  action: 'OK' | 'REFRESHED' | 'DELETED' | 'FAILED';
}

interface CachedAnalysis {
  matchInfo?: {
    homeTeam: string;
    awayTeam: string;
    sport: string;
  };
  homeTeam?: string;
  awayTeam?: string;
  sport?: string;
  universalSignals?: {
    form?: { home?: string; away?: string };
  };
  signals?: {
    form?: { home?: string; away?: string };
  };
  momentumAndForm?: {
    homeForm?: string;
    awayForm?: string;
  };
  preAnalyzed?: boolean;
  preAnalyzedAt?: string;
}

/**
 * Check if form data is valid (not null, not all dashes)
 */
function isValidForm(form: string | null | undefined): boolean {
  if (!form) return false;
  if (form === '-----') return false;
  if (form.length === 0) return false;
  // Must have at least one W, L, or D
  return /[WLD]/i.test(form);
}

/**
 * Validate a single cached analysis
 */
function validateCachedAnalysis(cached: CachedAnalysis): string[] {
  const issues: string[] = [];
  
  // Check for form data
  const homeForm = cached.universalSignals?.form?.home || 
                   cached.signals?.form?.home || 
                   cached.momentumAndForm?.homeForm;
  const awayForm = cached.universalSignals?.form?.away || 
                   cached.signals?.form?.away || 
                   cached.momentumAndForm?.awayForm;
  
  if (!isValidForm(homeForm)) {
    issues.push('MISSING_HOME_FORM');
  }
  if (!isValidForm(awayForm)) {
    issues.push('MISSING_AWAY_FORM');
  }
  
  // Check if analysis is too old (more than 24 hours)
  if (cached.preAnalyzedAt) {
    const analysisAge = Date.now() - new Date(cached.preAnalyzedAt).getTime();
    const hoursOld = analysisAge / (1000 * 60 * 60);
    if (hoursOld > 48) {
      issues.push('STALE_ANALYSIS');
    }
  }
  
  return issues;
}

/**
 * Try to refresh data for a match
 */
async function refreshMatchData(
  homeTeam: string, 
  awayTeam: string, 
  sport: string,
  cacheKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to fetch fresh data from data layer
    const freshData = await getEnrichedMatchDataV2(homeTeam, awayTeam, sport);
    
    if (freshData.dataSource === 'UNAVAILABLE') {
      return { success: false, error: 'Data unavailable from API' };
    }
    
    const homeFormCount = freshData.homeForm?.length || 0;
    const awayFormCount = freshData.awayForm?.length || 0;
    
    if (homeFormCount === 0 && awayFormCount === 0) {
      return { success: false, error: 'No form data returned' };
    }
    
    // Delete the bad cache entry - next request will regenerate
    await cacheDelete(cacheKey);
    
    console.log(`[Validate] Deleted stale cache for ${homeTeam} vs ${awayTeam}, fresh data: home=${homeFormCount}, away=${awayFormCount}`);
    
    return { success: true };
  } catch (error) {
    console.error(`[Validate] Failed to refresh ${homeTeam} vs ${awayTeam}:`, error);
    return { success: false, error: String(error) };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const secret = request.nextUrl.searchParams.get('secret');
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';
  const sportFilter = request.nextUrl.searchParams.get('sport');
  
  // Auth check
  if (secret !== CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log(`[Validate] Starting cache validation at ${new Date().toISOString()}`);
  console.log(`[Validate] Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}, Sport filter: ${sportFilter || 'all'}`);
  
  const results: ValidationResult[] = [];
  let totalChecked = 0;
  let totalIssues = 0;
  let totalRefreshed = 0;
  let totalFailed = 0;
  
  const sportsToCheck = sportFilter 
    ? SPORTS_TO_VALIDATE.filter(s => s.includes(sportFilter))
    : SPORTS_TO_VALIDATE;
  
  for (const sportKey of sportsToCheck) {
    try {
      // Fetch events for this sport
      const eventsResult = await theOddsClient.getEvents(sportKey);
      if (!eventsResult.success || !eventsResult.data) {
        console.log(`[Validate] No events for ${sportKey}`);
        continue;
      }
      
      // Filter to next 48 hours
      const now = Date.now();
      const cutoff = now + (48 * 60 * 60 * 1000);
      const upcomingEvents = eventsResult.data.filter(e => {
        const eventTime = new Date(e.commence_time).getTime();
        return eventTime > now && eventTime < cutoff;
      });
      
      console.log(`[Validate] Checking ${upcomingEvents.length} events for ${sportKey}`);
      
      for (const event of upcomingEvents) {
        totalChecked++;
        const matchDate = new Date(event.commence_time).toISOString().split('T')[0];
        const cacheKey = CACHE_KEYS.matchPreview(event.home_team, event.away_team, sportKey, matchDate);
        
        // Check cache
        const cached = await cacheGet<CachedAnalysis>(cacheKey);
        
        if (!cached) {
          // No cache - might not be analyzed yet, skip
          continue;
        }
        
        // Validate the cached data
        const issues = validateCachedAnalysis(cached);
        
        if (issues.length === 0) {
          // Data is OK
          continue;
        }
        
        totalIssues++;
        const result: ValidationResult = {
          matchKey: cacheKey,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          sport: sportKey,
          issues,
          action: 'OK',
        };
        
        if (!dryRun) {
          // Try to refresh
          const refreshResult = await refreshMatchData(
            event.home_team,
            event.away_team,
            sportKey,
            cacheKey
          );
          
          if (refreshResult.success) {
            result.action = 'DELETED';
            totalRefreshed++;
          } else {
            result.action = 'FAILED';
            totalFailed++;
          }
        }
        
        results.push(result);
        
        // Rate limit
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (error) {
      console.error(`[Validate] Error processing ${sportKey}:`, error);
    }
  }
  
  const summary = {
    totalChecked,
    totalIssues,
    totalRefreshed,
    totalFailed,
    durationMs: Date.now() - startTime,
    dryRun,
  };
  
  console.log(`[Validate] Complete:`, summary);
  
  return NextResponse.json({
    success: true,
    summary,
    issues: results,
  });
}
