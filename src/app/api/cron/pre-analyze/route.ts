/**
 * Pre-Analyze Matches Cron Job
 * 
 * Runs daily to pre-analyze ALL upcoming matches across major sports.
 * Uses Unified Match Service for consistent data across all components.
 * This ensures:
 * 1. INSTANT loading for all users (pre-warmed cache)
 * 2. Consistent edges between Market Alerts and Analyzer (same AI model)
 * 3. Reduced per-user API costs (analysis done once, shared)
 * 
 * Process:
 * 1. Fetch all upcoming events from The Odds API (next 48 hours)
 * 2. Generate matchId for each event
 * 3. Call match-preview API internally to run AI analysis
 * 4. Cache results in Redis + update OddsSnapshot with real AI edges
 * 
 * Schedule: Daily at 6 AM UTC (0 6 * * *)
 * Also can be triggered manually: GET /api/cron/pre-analyze?secret=xxx
 * 
 * Quota usage: ~5 API calls for events (free) + ~5 for odds
 * AI usage: ~50-100 analyses per day (gpt-4o-mini)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { theOddsClient, OddsApiEvent } from '@/lib/theOdds';
import { generateMatchPreview } from '@/lib/blog/match-generator';
import { cacheSet, cacheGet, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
import { analyzeMarket, type MarketIntel, type OddsData, oddsToImpliedProb } from '@/lib/value-detection';
import { normalizeSport, getMatchRostersV2 } from '@/lib/data-layer/bridge';
import { getMatchInjuriesViaPerplexity } from '@/lib/perplexity';
import { getESPNInjuriesForTeam, getESPNH2H } from '@/lib/data-layer/providers/espn-injuries';
import { getEnrichedMatchData, getMatchInjuries, getMatchGoalTiming, getMatchKeyPlayers, getFixtureReferee, getMatchFixtureInfo } from '@/lib/football-api';
import { normalizeToUniversalSignals, formatSignalsForAI, getSignalSummary, type RawMatchInput } from '@/lib/universal-signals';
import { ANALYSIS_PERSONALITY } from '@/lib/sportbot-brain';
import {
  getUnifiedMatchData,
  type MatchIdentifier,
  type OddsInfo,
} from '@/lib/unified-match-service';
import { applyConvictionCap, type BookmakerOdds } from '@/lib/accuracy-core/types';
import { runAccuracyPipeline, type PipelineInput } from '@/lib/accuracy-core';
import { getExpectedScores, validateScoreProbabilityConsistency, type ModelInput } from '@/lib/accuracy-core/prediction-models';
import OpenAI from 'openai';

export const maxDuration = 300; // 5 minute timeout for batch processing

const CRON_SECRET = process.env.CRON_SECRET;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sports to pre-analyze with league-specific configurations
// Pre-analyze sports - matches exactly what's shown in MatchBrowser.tsx UI
const PRE_ANALYZE_SPORTS = [
  // Soccer (12 leagues)
  { key: 'soccer_epl', title: 'EPL', league: 'Premier League', hasDraw: true },
  { key: 'soccer_spain_la_liga', title: 'La Liga', league: 'La Liga', hasDraw: true },
  { key: 'soccer_germany_bundesliga', title: 'Bundesliga', league: 'Bundesliga', hasDraw: true },
  { key: 'soccer_italy_serie_a', title: 'Serie A', league: 'Serie A', hasDraw: true },
  { key: 'soccer_france_ligue_one', title: 'Ligue 1', league: 'Ligue 1', hasDraw: true },
  { key: 'soccer_portugal_primeira_liga', title: 'Primeira Liga', league: 'Primeira Liga', hasDraw: true },
  { key: 'soccer_netherlands_eredivisie', title: 'Eredivisie', league: 'Eredivisie', hasDraw: true },
  { key: 'soccer_turkey_super_league', title: 'Süper Lig', league: 'Süper Lig', hasDraw: true },
  { key: 'soccer_belgium_first_div', title: 'Jupiler Pro League', league: 'Jupiler Pro League', hasDraw: true },
  { key: 'soccer_spl', title: 'Scottish Premiership', league: 'Scottish Premiership', hasDraw: true },
  { key: 'soccer_uefa_champs_league', title: 'Champions League', league: 'Champions League', hasDraw: true },
  { key: 'soccer_uefa_europa_league', title: 'Europa League', league: 'Europa League', hasDraw: true },
  // Basketball (2 leagues)
  { key: 'basketball_nba', title: 'NBA', league: 'NBA', hasDraw: false },
  { key: 'basketball_euroleague', title: 'EuroLeague', league: 'EuroLeague', hasDraw: false },
  // American Football (2 leagues)
  { key: 'americanfootball_nfl', title: 'NFL', league: 'NFL', hasDraw: false },
  { key: 'americanfootball_ncaaf', title: 'NCAA Football', league: 'NCAA Football', hasDraw: false },
  // Hockey (1 league)
  { key: 'icehockey_nhl', title: 'NHL', league: 'NHL', hasDraw: false },
];

/**
 * League-specific prediction hints based on historical accuracy patterns
 * These are empirically derived from prediction performance analysis
 * Updated: January 2025 based on 263 verified predictions
 */
const LEAGUE_HINTS: Record<string, string> = {
  // EPL: 41.7% accuracy - home picks underperforming (42.9%), away picks better (62.5%)
  'Premier League': `
EPL WARNING: Home picks have been underperforming (43% accuracy vs 62% away).
- Modern EPL has weak home advantage (post-COVID ~45% home wins)
- Top 6 away wins are often undervalued
- Be skeptical of home picks for mid-table teams
- Trust form data for away teams more than home advantage`,

  // La Liga: need monitoring 
  'La Liga': `
LA LIGA INSIGHT: Adjust for Spanish football patterns.
- REDUCE draw predictions - draws are overrated here
- Away wins happen more than expected, especially for top 4 teams
- Real Madrid/Barcelona away wins are very reliable
- Mid-table clashes are volatile - lower conviction`,

  // Bundesliga: home bias caution
  'Bundesliga': `
BUNDESLIGA WARNING: Strong away team performance historically.
- Bayern/Dortmund away wins are very reliable
- Home advantage is weaker than other leagues
- Bottom teams lose away almost always
- High-scoring nature means form matters more than H2H`,

  // Serie A: defensive patterns
  'Serie A': `
SERIE A INSIGHT: Defensive league patterns.
- Low-scoring games favor underdogs and draws
- Big teams struggle away at mid-table sides
- Home teams rarely get blown out
- Trust clean sheet data heavily`,

  // Ligue 1: No data yet - PSG dominated
  'Ligue 1': `
LIGUE 1 INSIGHT: PSG dominates, rest is unpredictable.
- PSG home/away wins are very reliable
- Without PSG, the league is highly volatile
- Away wins for non-PSG teams are rare
- Lower conviction on all non-PSG matches`,

  // NBA: 45% accuracy - home picks (60.6%) good, away picks (37.2%) underperforming
  'NBA': `
NBA INSIGHT: Strong home pick accuracy (61%), away picks struggling (37%).
- HOME COURT MATTERS: NBA home teams win ~57% of games
- Be MORE conservative on away picks - require stronger evidence
- Back-to-back games are significant - favor rested teams
- Trust form data, especially for home teams
- Road underdogs need very clear edge to pick`,

  // NFL: 72.7% accuracy - our best sport!
  'NFL': `
NFL INSIGHT: Our highest accuracy sport (73%). Trust the model.
- Home field matters more than other sports
- Division games are more predictable than expected
- Favor road teams with elite QBs only when clear edge
- Weather games favor running teams`,

  // NHL: 24.5% accuracy - CRITICAL ISSUE, home picks terrible (14.8%)
  'NHL': `
NHL CRITICAL WARNING: Very low accuracy (25%), home picks especially bad (15%).
- DO NOT trust home ice advantage - it's overrated in our model
- High variance sport - goalie matchups dominate outcomes
- Favor AWAY picks more often - road teams perform better than expected
- Lower conviction on ALL picks - NHL is unpredictable
- Check for goalie injuries before picking - they matter most
- Consider NOT picking a winner if match is close`,

  // Euroleague: 66.7% accuracy - home picks excellent (85.7%), away weaker (50%)
  'Euroleague': `
EUROLEAGUE INSIGHT: Strong accuracy (67%), especially home picks (86%).
- HOME COURT IS HUGE: Trust home picks strongly
- European basketball has even stronger home advantage than NBA
- Away picks need very strong form evidence
- Trust the form data and H2H patterns`,
};

/**
 * Get league-specific hint for AI prompt
 */
function getLeagueHint(league: string): string {
  return LEAGUE_HINTS[league] || '';
}

// ============================================
// MATCH IMPORTANCE SCORING FOR BLOG GENERATION
// ============================================
// Not all matches deserve a blog post. Score based on importance.
// Generate blog only if score >= 3

const TOP_LEAGUES = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Champions League',
  'Europa League',
  'NBA',
  'NFL',
  'NHL',
];

const BIG_TEAMS = [
  // England
  'Manchester City', 'Man City', 'Arsenal', 'Liverpool', 'Manchester United', 'Man United',
  'Chelsea', 'Tottenham', 'Newcastle',
  // Spain
  'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Athletic Bilbao',
  // Italy
  'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma',
  // Germany
  'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
  // France
  'Paris Saint-Germain', 'PSG', 'Monaco', 'Marseille', 'Lyon',
  // Portugal
  'Porto', 'Benfica', 'Sporting CP',
  // NBA - Top teams
  'Lakers', 'Celtics', 'Warriors', 'Heat', 'Bucks', 'Nuggets', 'Suns', '76ers',
  // NFL - Popular teams
  'Chiefs', 'Cowboys', 'Eagles', 'Patriots', '49ers', 'Bills', 'Ravens',
  // NHL - Big markets
  'Rangers', 'Bruins', 'Maple Leafs', 'Canadiens', 'Oilers', 'Lightning',
];

// Known derbies/rivalries (partial team name matching)
const DERBY_PAIRS = [
  ['Manchester United', 'Manchester City'], // Manchester Derby
  ['Liverpool', 'Manchester United'], // Historic rivalry
  ['Arsenal', 'Tottenham'], // North London Derby
  ['Real Madrid', 'Barcelona'], // El Clasico
  ['Real Madrid', 'Atletico Madrid'], // Madrid Derby
  ['Inter', 'AC Milan'], // Milan Derby
  ['Juventus', 'Inter'], // Derby d'Italia
  ['Bayern', 'Dortmund'], // Der Klassiker
  ['PSG', 'Marseille'], // Le Classique
  ['Celtic', 'Rangers'], // Old Firm
  ['Porto', 'Benfica'], // O Clássico
  ['Lakers', 'Celtics'], // NBA Classic
  ['Cowboys', 'Eagles'], // NFC East Rivalry
  ['Chiefs', 'Raiders'], // AFC West Rivalry
];

/**
 * Calculate match importance score for blog generation
 * Generate blog only if score >= 3
 */
function shouldGenerateBlog(
  homeTeam: string,
  awayTeam: string,
  league: string,
  valueEdge: number // as percentage, e.g. 5.0 for 5%
): { generate: boolean; score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Top League (+3 points)
  if (TOP_LEAGUES.some(l => league.toLowerCase().includes(l.toLowerCase()))) {
    score += 3;
    reasons.push(`Top league: ${league}`);
  }

  // 2. Big Team Involved (+2 points per team, max +4)
  const homeBig = BIG_TEAMS.some(t =>
    homeTeam.toLowerCase().includes(t.toLowerCase()) ||
    t.toLowerCase().includes(homeTeam.toLowerCase())
  );
  const awayBig = BIG_TEAMS.some(t =>
    awayTeam.toLowerCase().includes(t.toLowerCase()) ||
    t.toLowerCase().includes(awayTeam.toLowerCase())
  );
  if (homeBig) {
    score += 2;
    reasons.push(`Big team: ${homeTeam}`);
  }
  if (awayBig) {
    score += 2;
    reasons.push(`Big team: ${awayTeam}`);
  }

  // 3. Value Edge (+2 points if >= 5%)
  if (valueEdge >= 5) {
    score += 2;
    reasons.push(`Value edge: ${valueEdge.toFixed(1)}%`);
  }

  // 4. Derby/Rivalry (+3 points)
  const isDerby = DERBY_PAIRS.some(pair => {
    const [team1, team2] = pair;
    const homeMatch = homeTeam.toLowerCase().includes(team1.toLowerCase()) ||
      homeTeam.toLowerCase().includes(team2.toLowerCase());
    const awayMatch = awayTeam.toLowerCase().includes(team1.toLowerCase()) ||
      awayTeam.toLowerCase().includes(team2.toLowerCase());
    return homeMatch && awayMatch;
  });
  if (isDerby) {
    score += 3;
    reasons.push('Derby/Rivalry match');
  }

  const generate = score >= 3;

  return { generate, score, reasons };
}

/**
 * Detect back-to-back games for NBA/NHL
 * Returns rest context for AI prompt
 */
function getRestDaysContext(
  sport: string,
  homeFormData: Array<{ date: string }> | null,
  awayFormData: Array<{ date: string }> | null,
  matchDate: string,
  homeTeam: string,
  awayTeam: string
): string | null {
  // Only relevant for NBA and NHL
  if (!sport.includes('basketball') && !sport.includes('hockey')) {
    return null;
  }

  const matchTime = new Date(matchDate).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const getRestDays = (formData: Array<{ date: string }> | null): number => {
    if (!formData || formData.length === 0) return 3; // Assume well-rested if no data

    // Find most recent game before this match
    const lastGameDate = formData
      .map(g => new Date(g.date).getTime())
      .filter(d => d < matchTime)
      .sort((a, b) => b - a)[0];

    if (!lastGameDate) return 3;

    const daysSinceLastGame = Math.floor((matchTime - lastGameDate) / oneDayMs);
    return daysSinceLastGame;
  };

  const homeRest = getRestDays(homeFormData);
  const awayRest = getRestDays(awayFormData);

  const parts: string[] = [];

  // Back-to-back detection (played yesterday)
  const homeB2B = homeRest <= 1;
  const awayB2B = awayRest <= 1;

  if (homeB2B && !awayB2B) {
    parts.push(`⚠️ ${homeTeam} on BACK-TO-BACK (played yesterday). Expect fatigue, lower energy.`);
    parts.push(`${awayTeam} well-rested (${awayRest} days). Significant advantage.`);
  } else if (awayB2B && !homeB2B) {
    parts.push(`⚠️ ${awayTeam} on BACK-TO-BACK (played yesterday). Road B2B is brutal.`);
    parts.push(`${homeTeam} well-rested (${homeRest} days). Significant advantage.`);
  } else if (homeB2B && awayB2B) {
    parts.push(`Both teams on BACK-TO-BACK. Expect sloppy play, favor home court.`);
  } else if (homeRest >= 3 && awayRest <= 1) {
    parts.push(`REST EDGE: ${homeTeam} very rested (${homeRest} days) vs tired ${awayTeam} (${awayRest} days).`);
  } else if (awayRest >= 3 && homeRest <= 1) {
    parts.push(`REST EDGE: ${awayTeam} very rested (${awayRest} days) vs tired ${homeTeam} (${homeRest} days).`);
  }

  if (parts.length === 0) return null;

  return parts.join(' ');
}

/**
 * Get real-time roster/key player context for NBA/NHL/NFL
 * Uses Perplexity to fetch current season rosters to avoid outdated AI training data
 * Caches results for 6 hours since rosters don't change mid-game
 */
async function getRosterContextCached(
  homeTeam: string,
  awayTeam: string,
  sport: 'basketball' | 'hockey' | 'american_football',
  league: string
): Promise<string | null> {
  const cacheKey = `roster:${sport}:${homeTeam}:${awayTeam}`;

  try {
    // Check cache first (6 hour TTL)
    const cached = await cacheGet<string>(cacheKey);
    if (cached) {
      console.log(`[Pre-Analyze] Roster context cache HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`[Pre-Analyze] Fetching roster from API for ${homeTeam} vs ${awayTeam} (${sport})`);

    // Fetch from API-Sports via DataLayer (structured data, not AI-generated)
    const rosterContext = await getMatchRostersV2(homeTeam, awayTeam, sport);

    if (rosterContext) {
      // Cache for 6 hours
      await cacheSet(cacheKey, rosterContext, 6 * 60 * 60);
      console.log(`[Pre-Analyze] Roster context cached: ${cacheKey}`);
    }

    return rosterContext;
  } catch (error) {
    console.warn(`[Pre-Analyze] Failed to fetch roster context for ${homeTeam} vs ${awayTeam}:`, error);
    return null;
  }
}

/**
 * Fetch and format injury data for a match
 * Returns a formatted string for AI prompt, or null if unavailable
 * 
 * - Soccer: Uses API-Sports (reliable structured data)
 * - Basketball/NHL/NFL: Uses Perplexity (real-time web search)
 */
async function getInjuryInfo(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league: string
): Promise<string | null> {
  try {
    // Soccer: Use API-Sports (structured data)
    if (sport.startsWith('soccer_')) {
      const injuries = await getMatchInjuries(homeTeam, awayTeam, league);

      if (!injuries || (injuries.home.length === 0 && injuries.away.length === 0)) {
        return null;
      }

      const formatInjuries = (team: string, list: any[]): string => {
        if (list.length === 0) return '';
        const top = list.slice(0, 3); // Limit to top 3 injuries per team
        // Safeguard against undefined values
        const names = top
          .filter(inj => inj.playerName) // Skip entries without player name
          .map(inj => {
            const name = inj.playerName || 'Unknown';
            const reason = inj.type || inj.reason || 'injured';
            return `${name} (${reason})`;
          })
          .join(', ');
        if (!names) return '';
        return `${team}: ${names}${list.length > 3 ? ` +${list.length - 3} more` : ''}`;
      };

      const parts: string[] = [];
      const homeStr = formatInjuries(homeTeam, injuries.home);
      const awayStr = formatInjuries(awayTeam, injuries.away);

      if (homeStr) parts.push(homeStr);
      if (awayStr) parts.push(awayStr);

      return parts.length > 0 ? parts.join(' | ') : null;
    }

    // Basketball/NHL/NFL: Use ESPN's hidden API (same as fresh analysis)
    if (sport.includes('basketball') || sport.includes('hockey') || sport.includes('nhl') ||
      sport.includes('football') || sport.includes('nfl')) {
      
      // Determine sport key for ESPN
      let espnSport: 'nba' | 'nhl' | 'nfl';
      if (sport.includes('basketball') || sport.includes('nba')) {
        espnSport = 'nba';
      } else if (sport.includes('hockey') || sport.includes('nhl')) {
        espnSport = 'nhl';
      } else {
        espnSport = 'nfl';
      }
      
      console.log(`[Pre-Analyze] Fetching injuries via ESPN for ${homeTeam} vs ${awayTeam} (${espnSport})`);

      try {
        // Fetch injuries for both teams from ESPN
        const [homeInjuries, awayInjuries] = await Promise.all([
          getESPNInjuriesForTeam(homeTeam, espnSport),
          getESPNInjuriesForTeam(awayTeam, espnSport),
        ]);

        if (homeInjuries.length === 0 && awayInjuries.length === 0) {
          console.log(`[Pre-Analyze] No injuries found via ESPN for ${homeTeam} vs ${awayTeam}`);
          return null;
        }

        const formatInjuries = (team: string, list: typeof homeInjuries): string => {
          if (list.length === 0) return '';
          const top = list.slice(0, 4); // Show up to 4 injuries for US sports
          const names = top
            .filter(inj => inj.playerName)
            .map(inj => {
              const name = inj.playerName || 'Unknown';
              const injury = inj.type || 'Injury';
              const status = inj.status || 'Unknown';
              return `${name} (${injury} - ${status})`;
            })
            .join(', ');
          if (!names) return '';
          return `${team}: ${names}${list.length > 4 ? ` +${list.length - 4} more` : ''}`;
        };

        const parts: string[] = [];
        const homeStr = formatInjuries(homeTeam, homeInjuries);
        const awayStr = formatInjuries(awayTeam, awayInjuries);

        if (homeStr) parts.push(homeStr);
        if (awayStr) parts.push(awayStr);

        const injuryContext = parts.length > 0 ? parts.join(' | ') : null;

        if (injuryContext) {
          console.log(`[Pre-Analyze] ESPN injuries: ${injuryContext}`);
        }

        return injuryContext;
      } catch (espnError) {
        console.warn(`[Pre-Analyze] ESPN failed for ${homeTeam} vs ${awayTeam}, falling back to Perplexity:`, espnError);
        
        // Fallback to Perplexity if ESPN fails
        const result = await getMatchInjuriesViaPerplexity(homeTeam, awayTeam, sport);

        if (!result.success || (result.home.length === 0 && result.away.length === 0)) {
          console.log(`[Pre-Analyze] No injuries found via Perplexity fallback for ${homeTeam} vs ${awayTeam}`);
          return null;
        }

        const formatInjuries = (team: string, list: typeof result.home): string => {
          if (list.length === 0) return '';
          const top = list.slice(0, 4);
          const names = top
            .filter(inj => inj.playerName)
            .map(inj => {
              const name = inj.playerName || 'Unknown';
              const injury = inj.injury || 'Injury';
              const status = inj.status || 'Unknown';
              return `${name} (${injury} - ${status})`;
            })
            .join(', ');
          if (!names) return '';
          return `${team}: ${names}${list.length > 4 ? ` +${list.length - 4} more` : ''}`;
        };

        const parts: string[] = [];
        const homeStr = formatInjuries(homeTeam, result.home);
        const awayStr = formatInjuries(awayTeam, result.away);

        if (homeStr) parts.push(homeStr);
        if (awayStr) parts.push(awayStr);

        const injuryContext = parts.length > 0 ? parts.join(' | ') : null;

        if (injuryContext) {
          console.log(`[Pre-Analyze] Perplexity fallback injuries: ${injuryContext}`);
        }

        return injuryContext;
      }
    }

    return null;
  } catch (error) {
    console.warn(`[Pre-Analyze] Failed to fetch injuries for ${homeTeam} vs ${awayTeam}:`, error);
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate home/away split statistics from form data
 * Returns formatted string showing performance at home vs away
 */
function getHomeAwaySplits(
  homeTeam: string,
  awayTeam: string,
  homeForm: any[] | null,
  awayForm: any[] | null
): string | null {
  if (!homeForm?.length || !awayForm?.length) return null;

  // Calculate home team's home record
  const homeAtHome = homeForm.filter((m: any) => m.home === true);
  const homeAtHomeWins = homeAtHome.filter((m: any) => m.result === 'W').length;
  const homeAtHomePct = homeAtHome.length > 0 ? Math.round((homeAtHomeWins / homeAtHome.length) * 100) : null;

  // Calculate away team's away record  
  const awayOnRoad = awayForm.filter((m: any) => m.home === false);
  const awayOnRoadWins = awayOnRoad.filter((m: any) => m.result === 'W').length;
  const awayOnRoadPct = awayOnRoad.length > 0 ? Math.round((awayOnRoadWins / awayOnRoad.length) * 100) : null;

  const parts: string[] = [];

  if (homeAtHomePct !== null && homeAtHome.length >= 2) {
    parts.push(`${homeTeam} home: ${homeAtHomeWins}/${homeAtHome.length} (${homeAtHomePct}%)`);
  }

  if (awayOnRoadPct !== null && awayOnRoad.length >= 2) {
    parts.push(`${awayTeam} away: ${awayOnRoadWins}/${awayOnRoad.length} (${awayOnRoadPct}%)`);
  }

  return parts.length > 0 ? parts.join(' | ') : null;
}

/**
 * Format H2H (head-to-head) context for AI prompt
 */
function getH2HContext(
  homeTeam: string,
  awayTeam: string,
  h2hSummary: { totalMatches: number; homeWins: number; awayWins: number; draws: number } | null
): string | null {
  if (!h2hSummary || h2hSummary.totalMatches === 0) return null;

  const { totalMatches, homeWins, awayWins, draws } = h2hSummary;

  // Short format: "H2H (last 5): Arsenal 3-1-1 Chelsea"
  const parts = [`H2H (last ${totalMatches}):`];
  parts.push(`${homeTeam} ${homeWins}-${draws}-${awayWins} ${awayTeam}`);

  // Add narrative if one side dominates
  if (homeWins >= 3 && awayWins <= 1) {
    parts.push(`(${homeTeam} dominates)`);
  } else if (awayWins >= 3 && homeWins <= 1) {
    parts.push(`(${awayTeam} dominates)`);
  }

  return parts.join(' ');
}

/**
 * Fetch referee stats for soccer matches
 */
async function getRefereeContext(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league: string
): Promise<string | null> {
  try {
    // Only soccer has referee data
    if (!sport.startsWith('soccer_')) {
      return null;
    }

    const fixtureInfo = await getMatchFixtureInfo(homeTeam, awayTeam, league);

    if (!fixtureInfo?.referee) {
      return null;
    }

    return `Referee: ${fixtureInfo.referee}`;
  } catch (error) {
    console.warn(`[Pre-Analyze] Failed to fetch referee for ${homeTeam} vs ${awayTeam}:`, error);
    return null;
  }
}

/**
 * Get consensus odds from bookmakers
 */
function getConsensusOdds(event: OddsApiEvent): { home: number; away: number; draw?: number } | null {
  if (!event.bookmakers || event.bookmakers.length === 0) return null;

  let homeTotal = 0, awayTotal = 0, drawTotal = 0;
  let homeCount = 0, awayCount = 0, drawCount = 0;

  for (const bookmaker of event.bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket) continue;

    for (const outcome of h2hMarket.outcomes) {
      const name = outcome.name.toLowerCase();
      if (name === event.home_team.toLowerCase() || name.includes('home')) {
        homeTotal += outcome.price;
        homeCount++;
      } else if (name === event.away_team.toLowerCase() || name.includes('away')) {
        awayTotal += outcome.price;
        awayCount++;
      } else if (name === 'draw' || name === 'the draw') {
        drawTotal += outcome.price;
        drawCount++;
      }
    }
  }

  if (homeCount === 0 || awayCount === 0) return null;

  return {
    home: homeTotal / homeCount,
    away: awayTotal / awayCount,
    draw: drawCount > 0 ? drawTotal / drawCount : undefined,
  };
}

/**
 * Get Over/Under line from bookmakers
 * Returns the consensus O/U line (averaged across bookmakers)
 */
function getOverUnderData(event: OddsApiEvent): { line: number; overOdds?: number; underOdds?: number } | null {
  if (!event.bookmakers || event.bookmakers.length === 0) return null;

  let lineTotal = 0, overOddsTotal = 0, underOddsTotal = 0;
  let count = 0;

  for (const bookmaker of event.bookmakers) {
    const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
    if (!totalsMarket) continue;

    const overOutcome = totalsMarket.outcomes.find(o => o.name.toLowerCase() === 'over');
    const underOutcome = totalsMarket.outcomes.find(o => o.name.toLowerCase() === 'under');

    if (overOutcome?.point && overOutcome.price && underOutcome?.price) {
      lineTotal += overOutcome.point;
      overOddsTotal += overOutcome.price;
      underOddsTotal += underOutcome.price;
      count++;
    }
  }

  if (count === 0) return null;

  return {
    line: lineTotal / count,
    overOdds: overOddsTotal / count,
    underOdds: underOddsTotal / count,
  };
}

/**
 * Generate clean, SEO-friendly matchId slug
 */
function generateMatchId(event: OddsApiEvent, sportKey: string, _league: string): string {
  const homeSlug = event.home_team.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const awaySlug = event.away_team.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const sportCode = sportKey.split('_').slice(1).join('-') || sportKey;
  const date = event.commence_time.split('T')[0];
  return `${homeSlug}-vs-${awaySlug}-${sportCode}-${date}`;
}

/**
 * Build a meaningful fallback snapshot from actual data
 */
function buildFallbackSnapshot(
  homeTeam: string,
  awayTeam: string,
  homeForm: string,
  awayForm: string,
  homeStats: { played: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number },
  awayStats: { played: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number },
  h2h: { total: number; homeWins: number; awayWins: number; draws: number },
  signals: any
): string[] {
  const snapshot: string[] = [];

  // 1. Form comparison with actual data
  const homeWins = homeForm.split('').filter(r => r === 'W').length;
  const awayWins = awayForm.split('').filter(r => r === 'W').length;
  const homeFormLength = homeForm.replace(/-/g, '').length;
  const awayFormLength = awayForm.replace(/-/g, '').length;

  if (homeFormLength > 0 && awayFormLength > 0) {
    const betterForm = homeWins > awayWins ? homeTeam : awayWins > homeWins ? awayTeam : 'Both teams';
    if (homeWins !== awayWins) {
      snapshot.push(`${betterForm} in better form: ${homeWins}W in last ${homeFormLength} vs ${awayWins}W for opponent`);
    } else {
      snapshot.push(`Similar form: Both with ${homeWins}W in last ${Math.max(homeFormLength, awayFormLength)} games`);
    }
  }

  // 2. Scoring/defensive edge
  if (homeStats.played > 0 && awayStats.played > 0) {
    const homeAvgScored = homeStats.goalsScored / homeStats.played;
    const awayAvgConceded = awayStats.goalsConceded / awayStats.played;
    const awayAvgScored = awayStats.goalsScored / awayStats.played;
    const homeAvgConceded = homeStats.goalsConceded / homeStats.played;

    if (homeAvgScored > awayAvgScored + 0.3) {
      snapshot.push(`${homeTeam} more clinical: ${homeAvgScored.toFixed(1)} goals/game vs ${awayAvgScored.toFixed(1)}`);
    } else if (awayAvgScored > homeAvgScored + 0.3) {
      snapshot.push(`${awayTeam} more clinical: ${awayAvgScored.toFixed(1)} goals/game vs ${homeAvgScored.toFixed(1)}`);
    } else if (homeAvgConceded < awayAvgConceded - 0.3) {
      snapshot.push(`${homeTeam} tighter defense: ${homeAvgConceded.toFixed(1)} conceded/game vs ${awayAvgConceded.toFixed(1)}`);
    }
  }

  // 3. H2H if available
  if (h2h.total >= 3) {
    const h2hWinner = h2h.homeWins > h2h.awayWins ? homeTeam : h2h.awayWins > h2h.homeWins ? awayTeam : null;
    if (h2hWinner) {
      const wins = Math.max(h2h.homeWins, h2h.awayWins);
      snapshot.push(`H2H edge: ${h2hWinner} leads ${wins}-${Math.min(h2h.homeWins, h2h.awayWins)} in last ${h2h.total} meetings`);
    } else {
      snapshot.push(`H2H balanced: ${h2h.homeWins}-${h2h.draws}-${h2h.awayWins} in last ${h2h.total} meetings`);
    }
  }

  // 4. Risk/uncertainty caveat
  if (signals?.clarity_score && signals.clarity_score < 60) {
    snapshot.push(`Lower confidence: ${signals.clarity_score}% data clarity score`);
  } else if (homeFormLength < 3 || awayFormLength < 3) {
    snapshot.push(`Limited recent form data available for analysis`);
  } else {
    snapshot.push(`Standard confidence level based on available data`);
  }

  return snapshot.length >= 3 ? snapshot : [
    `${homeTeam} vs ${awayTeam} analysis`,
    `Form: ${homeTeam} (${homeForm}) vs ${awayTeam} (${awayForm})`,
    `Pre-match edge assessment in progress`,
  ];
}

/**
 * Quick AI analysis for pre-caching
 * Now matches the full API format for consistency
 */
async function runQuickAnalysis(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league: string,
  odds: { home: number; away: number; draw?: number },
  kickoff: string
): Promise<{
  story: {
    favored: 'home' | 'away' | 'draw';
    confidence: 'strong' | 'moderate' | 'slight';
    narrative: string;
    snapshot: string[];
    riskFactors: string[];
  };
  probabilities: { home: number; away: number; draw?: number };
  signals: any;
  universalSignals: any;
  headlines: Array<{ icon: string; text: string; favors: string; viral: boolean }>;
  marketIntel: MarketIntel | null;
  // Include structured injuries for UI availability section
  injuries: {
    home: Array<{ player: string; position: string; reason: 'injury' | 'suspension' | 'doubtful'; details: string; expectedReturn?: string }>;
    away: Array<{ player: string; position: string; reason: 'injury' | 'suspension' | 'doubtful'; details: string; expectedReturn?: string }>;
  };
  // NEW: Include enriched data for building rich UI components
  enrichedData: {
    homeFormStr: string;
    awayFormStr: string;
    homeForm: Array<{ date: string; opponent: string; result: 'W' | 'D' | 'L'; score: string }>;
    awayForm: Array<{ date: string; opponent: string; result: 'W' | 'D' | 'L'; score: string }>;
    headToHead: Array<{ date: string; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number }>;
    homeStats: { played: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number };
    awayStats: { played: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number };
    h2h: { total: number; homeWins: number; awayWins: number; draws: number };
  };
} | null> {
  try {
    // Determine sport type for roster lookup
    const rosterSport = sport.includes('basketball') ? 'basketball' as const
      : sport.includes('hockey') ? 'hockey' as const
        : sport.includes('american') ? 'american_football' as const
          : null;

    // Build match identifier for unified service
    const matchId: MatchIdentifier = { homeTeam, awayTeam, sport, league };
    const oddsInfo: OddsInfo = {
      home: odds.home,
      away: odds.away,
      draw: odds.draw,
    };

    // Get enriched match data through UNIFIED SERVICE (consistent 4-layer data across app)
    // Also get injuries, referee, and roster context in parallel
    // For soccer: fetch via API-Sports, for NBA/NHL/NFL: fetch via ESPN injuries API
    const isSoccerMatch = sport.startsWith('soccer_');
    const isUSAorBasketball = sport.includes('basketball') || sport.includes('hockey') || sport.includes('nhl') ||
      sport.includes('football') || sport.includes('nfl');

    // Determine ESPN sport key for US sports
    const espnSportKey: 'nba' | 'nhl' | 'nfl' | null = isUSAorBasketball
      ? (sport.includes('basketball') || sport.includes('nba') ? 'nba'
        : sport.includes('hockey') || sport.includes('nhl') ? 'nhl'
        : sport.includes('football') || sport.includes('nfl') ? 'nfl' : null)
      : null;

    const [unifiedData, injuryInfo, structuredInjuries, espnHomeInjuries, espnAwayInjuries, refereeContext, rosterContext] = await Promise.all([
      getUnifiedMatchData(matchId, { odds: oddsInfo, includeOdds: false }),
      getInjuryInfo(homeTeam, awayTeam, sport, league),
      isSoccerMatch ? getMatchInjuries(homeTeam, awayTeam, league) : Promise.resolve({ home: [], away: [] }),
      // For US sports: use ESPN injuries API directly (not Perplexity)
      espnSportKey ? getESPNInjuriesForTeam(homeTeam, espnSportKey) : Promise.resolve([]),
      espnSportKey ? getESPNInjuriesForTeam(awayTeam, espnSportKey) : Promise.resolve([]),
      getRefereeContext(homeTeam, awayTeam, sport, league),
      // Fetch real-time roster context for NBA/NHL/NFL to avoid outdated AI training data
      rosterSport ? getRosterContextCached(homeTeam, awayTeam, rosterSport, league) : Promise.resolve(null),
    ]);

    // Merge injuries from soccer API or ESPN - with safeguards against undefined values
    const safeString = (val: any, fallback = 'Unknown'): string =>
      val !== undefined && val !== null && val !== '' ? String(val) : fallback;

    const finalInjuries = {
      home: isSoccerMatch
        ? (structuredInjuries?.home || [])
        : (espnHomeInjuries?.map(i => ({
          player: safeString(i.playerName, 'Unknown Player'),
          position: 'Unknown', // ESPN doesn't provide position in NormalizedInjury
          reason: 'injury' as const,
          details: `${safeString(i.type, 'Injury')} - ${safeString(i.status, 'Unknown Status')}`,
          expectedReturn: i.expectedReturn ? i.expectedReturn.toISOString() : undefined,
        })).filter(i => i.player !== 'Unknown Player') || []),
      away: isSoccerMatch
        ? (structuredInjuries?.away || [])
        : (espnAwayInjuries?.map(i => ({
          player: safeString(i.playerName, 'Unknown Player'),
          position: 'Unknown', // ESPN doesn't provide position in NormalizedInjury
          reason: 'injury' as const,
          details: `${safeString(i.type, 'Injury')} - ${safeString(i.status, 'Unknown Status')}`,
          expectedReturn: i.expectedReturn ? i.expectedReturn.toISOString() : undefined,
        })).filter(i => i.player !== 'Unknown Player') || []),
    };

    console.log(`[Pre-Analyze] Injuries fetched - home: ${finalInjuries.home.length}, away: ${finalInjuries.away.length} (source: ${isSoccerMatch ? 'API-Sports' : 'ESPN'})`);
    if (finalInjuries.home.length > 0) {
      console.log(`[Pre-Analyze] ${homeTeam} injuries: ${finalInjuries.home.slice(0, 3).map(i => i.player).join(', ')}`);
    }
    if (finalInjuries.away.length > 0) {
      console.log(`[Pre-Analyze] ${awayTeam} injuries: ${finalInjuries.away.slice(0, 3).map(i => i.player).join(', ')}`);
    }

    // Use enriched data from unified service for cross-sport compatibility
    const enrichedData = unifiedData.enrichedData as any;

    // ESPN H2H PRIMARY: For US sports, ESPN is more reliable than API-Sports for H2H
    if (isUSAorBasketball) {
      console.log(`[Pre-Analyze] Fetching H2H from ESPN for ${homeTeam} vs ${awayTeam}`);
      try {
        const espnSport = sport.includes('basketball') || sport.includes('nba') ? 'nba' :
          sport.includes('hockey') || sport.includes('nhl') ? 'nhl' :
            sport.includes('football') || sport.includes('nfl') ? 'nfl' : null;

        if (espnSport) {
          const espnH2H = await getESPNH2H(homeTeam, awayTeam, espnSport, 3);
          if (espnH2H.success && espnH2H.summary.totalMatches > 0) {
            console.log(`[Pre-Analyze] ESPN H2H: ${espnH2H.summary.totalMatches} matches (${espnH2H.summary.team1Wins}-${espnH2H.summary.draws}-${espnH2H.summary.team2Wins})`);
            enrichedData.h2hSummary = {
              totalMatches: espnH2H.summary.totalMatches,
              homeWins: espnH2H.summary.team1Wins,
              awayWins: espnH2H.summary.team2Wins,
              draws: espnH2H.summary.draws,
            };
            enrichedData.headToHead = espnH2H.matches.map(m => ({
              date: m.date,
              homeTeam: m.homeTeam,
              awayTeam: m.awayTeam,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
            }));
            enrichedData.h2hSource = 'ESPN';
          } else {
            console.log(`[Pre-Analyze] ESPN H2H: No matches found for this matchup`);
          }
        }
      } catch (espnErr) {
        console.error(`[Pre-Analyze] ESPN H2H failed:`, espnErr);
        // API-Sports H2H will be used as fallback (already in enrichedData)
      }
    }

    // Build form strings
    const homeFormStr = enrichedData.homeForm?.map((m: any) => m.result).join('') || '-----';
    const awayFormStr = enrichedData.awayForm?.map((m: any) => m.result).join('') || '-----';

    // Create raw match input for signals (matching RawMatchInput interface)
    const rawInput: RawMatchInput = {
      sport: sport.includes('soccer') ? 'soccer' :
        sport.includes('basketball') ? 'basketball' :
          sport.includes('american') ? 'nfl' :
            sport.includes('hockey') ? 'hockey' : 'other',
      homeTeam,
      awayTeam,
      homeForm: homeFormStr,
      awayForm: awayFormStr,
      homeStats: {
        played: enrichedData.homeStats?.played || 0,
        wins: enrichedData.homeStats?.wins || 0,
        draws: enrichedData.homeStats?.draws || 0,
        losses: enrichedData.homeStats?.losses || 0,
        scored: enrichedData.homeStats?.goalsScored || enrichedData.homeStats?.pointsScored || 0,
        conceded: enrichedData.homeStats?.goalsConceded || enrichedData.homeStats?.pointsConceded || 0,
      },
      awayStats: {
        played: enrichedData.awayStats?.played || 0,
        wins: enrichedData.awayStats?.wins || 0,
        draws: enrichedData.awayStats?.draws || 0,
        losses: enrichedData.awayStats?.losses || 0,
        scored: enrichedData.awayStats?.goalsScored || enrichedData.awayStats?.pointsScored || 0,
        conceded: enrichedData.awayStats?.goalsConceded || enrichedData.awayStats?.pointsConceded || 0,
      },
      h2h: {
        total: enrichedData.h2hSummary?.totalMatches || 0,
        homeWins: enrichedData.h2hSummary?.homeWins || 0,
        awayWins: enrichedData.h2hSummary?.awayWins || 0,
        draws: enrichedData.h2hSummary?.draws || 0,
      },
      // Include structured injury data for availability signals
      homeInjuries: finalInjuries.home.map((i: any) => i.player) || [],
      awayInjuries: finalInjuries.away.map((i: any) => i.player) || [],
      homeInjuryDetails: finalInjuries.home.map((i: any) => ({
        player: i.player || 'Unknown',
        reason: i.reason,
        details: i.details,
        position: i.position,
      })) || [],
      awayInjuryDetails: finalInjuries.away.map((i: any) => ({
        player: i.player || 'Unknown',
        reason: i.reason,
        details: i.details,
        position: i.position,
      })) || [],
    };

    // Normalize to universal signals
    const signals = normalizeToUniversalSignals(rawInput);
    const signalsSummary = getSignalSummary(signals);

    // Determine if this sport has draws
    const hasDraw = !!odds.draw;
    const favoredOptions = hasDraw ? '"home" | "away" | "draw"' : '"home" | "away"';

    // Get league-specific hints for better accuracy
    const leagueHint = getLeagueHint(league);

    // Build injury context for prompt - ONLY include if we have actual data
    const injuryContext = injuryInfo
      ? `INJURIES: ${injuryInfo}\n(Use this in risk assessment - missing key players matter!)`
      : ''; // Don't mention injuries at all if no data

    // Build rest days context for NBA/NHL
    const restContext = getRestDaysContext(
      sport,
      enrichedData.homeForm,
      enrichedData.awayForm,
      kickoff,
      homeTeam,
      awayTeam
    );

    // Build home/away split context
    const splitsContext = getHomeAwaySplits(
      homeTeam,
      awayTeam,
      enrichedData.homeForm,
      enrichedData.awayForm
    );

    // Build H2H context
    const h2hContext = getH2HContext(
      homeTeam,
      awayTeam,
      enrichedData.h2hSummary || enrichedData.h2h
    );

    // Determine edge direction for AI alignment
    const edgeDirection = signals.display?.edge?.direction || 'even';
    const edgeTeam = edgeDirection === 'home' ? homeTeam : edgeDirection === 'away' ? awayTeam : 'Neither';
    const edgePercentage = signals.display?.edge?.percentage || 0;

    // Build AIXBT-style prompt - sharp, opinionated, data-backed
    const prompt = `${homeTeam} (HOME) vs ${awayTeam} (AWAY) | ${league}

⚠️ VENUE: ${homeTeam} is playing at HOME. ${awayTeam} is the AWAY team traveling.

MARKET: ${odds.home} / ${odds.away}${odds.draw ? ` / ${odds.draw}` : ''}
FORM: ${homeTeam} ${homeFormStr} | ${awayTeam} ${awayFormStr}${splitsContext ? `\nSPLITS: ${splitsContext}` : ''}${h2hContext ? `\n${h2hContext}` : ''}
SIGNALS: ${signalsSummary}
COMPUTED EDGE: ${edgeTeam} ${edgePercentage > 0 ? `+${edgePercentage}%` : '(even)'}
${injuryContext}${restContext ? `\nREST FACTOR: ${restContext}` : ''}${refereeContext ? `\n${refereeContext}` : ''}${rosterContext ? `\n\n${rosterContext}` : ''}
${leagueHint ? `\n${leagueHint}\n` : ''}
Be AIXBT. Sharp takes. Back them with numbers FROM THE DATA ABOVE ONLY.

IMPORTANT: Your analysis MUST align with the COMPUTED EDGE above.
- If COMPUTED EDGE shows "${homeTeam}" → your snapshot should favor ${homeTeam}
- If COMPUTED EDGE shows "${awayTeam}" → your snapshot should favor ${awayTeam}

JSON output:
{
  "probabilities": { "home": 0.XX, "away": 0.XX${hasDraw ? ', "draw": 0.XX' : ''} },
  "favored": ${favoredOptions},
  "confidence": "high" | "medium" | "low",
  "snapshot": [
    "THE EDGE: [use team NAME not home/away] because [stat]. Not close.",
    "MARKET MISS: [what odds undervalue - remember ${homeTeam} is HOME, ${awayTeam} is AWAY]. The data screams [X].",
    "THE PATTERN: [H2H/streak with numbers]. This isn't random.",
    "THE RISK: [caveat based on form/market data${restContext ? '/fatigue' : ''}${injuryInfo ? ' and listed injuries' : ''}]. Don't ignore this."
  ],
  "gameFlow": "Sharp take on how this plays out. Cite the numbers. Remember: ${homeTeam} is at HOME.",
  "riskFactors": ["Risk based on form/market/H2H${injuryInfo ? '/injury' : ''}${restContext ? '/rest' : ''} data only", "Secondary if relevant"]
}

CRITICAL RULES:
- ONLY use data provided above. Do NOT invent injuries, suspensions, or lineup info not shown above.
- ${homeTeam} is HOME, ${awayTeam} is AWAY. NEVER say "${awayTeam} has home advantage".
- riskFactors must be based on form patterns, market odds, H2H${injuryInfo ? ', or listed injuries' : ''} - NOT made-up info.
${injuryInfo ? '- FACTOR IN INJURIES: The listed injuries are real and current. Use them in your analysis.' : '- DO NOT mention injuries, absences, or suspensions. You have no injury data.'}
- AVOID HOME BIAS: Modern football home advantage is only ~5%. Don't favor home teams without strong statistical evidence.
- RESPECT THE MARKET: Odds reflect wisdom of millions. Only call an edge when form/H2H data clearly contradicts implied probabilities.
- BE CONTRARIAN: Your accuracy is better on away picks. Look harder for away value.

SNAPSHOT VIBE:
- First bullet: State your pick (should align with COMPUTED EDGE: ${edgeTeam}). Give the stat.
- Second bullet: What's the market sleeping on? If home edge, talk about ${homeTeam}'s home form. If away edge, talk about ${awayTeam}'s away form.
- Third bullet: Pattern recognition. H2H, streaks, momentum.
- Fourth bullet: What could wreck this thesis? Use form/momentum risks, not imagined injuries.

NO GENERIC TAKES. If you can't find an edge, say so.
${!hasDraw ? 'NO DRAWS in this sport. Pick a winner.' : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANALYSIS_PERSONALITY },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2, // Lower temperature for more consistent predictions
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Build market intel using signals and odds
    const oddsData: OddsData = {
      homeOdds: odds.home,
      awayOdds: odds.away,
      drawOdds: odds.draw,
    };

    // Pass league for calibration (convert display name to key)
    const leagueKey = league.toLowerCase().replace(/\s+/g, '_');
    const marketIntel = analyzeMarket(signals, oddsData, hasDraw, undefined, leagueKey);

    // Map confidence to API format
    const mapConfidence = (conf: string | number): 'strong' | 'moderate' | 'slight' => {
      if (conf === 'high' || (typeof conf === 'number' && conf >= 7)) return 'strong';
      if (conf === 'low' || (typeof conf === 'number' && conf <= 4)) return 'slight';
      return 'moderate';
    };

    // Build enriched data for rich UI components
    const homeStats = {
      played: enrichedData.homeStats?.played || 0,
      wins: enrichedData.homeStats?.wins || 0,
      draws: enrichedData.homeStats?.draws || 0,
      losses: enrichedData.homeStats?.losses || 0,
      goalsScored: enrichedData.homeStats?.goalsScored || enrichedData.homeStats?.pointsScored || 0,
      goalsConceded: enrichedData.homeStats?.goalsConceded || enrichedData.homeStats?.pointsConceded || 0,
    };
    const awayStats = {
      played: enrichedData.awayStats?.played || 0,
      wins: enrichedData.awayStats?.wins || 0,
      draws: enrichedData.awayStats?.draws || 0,
      losses: enrichedData.awayStats?.losses || 0,
      goalsScored: enrichedData.awayStats?.goalsScored || enrichedData.awayStats?.pointsScored || 0,
      goalsConceded: enrichedData.awayStats?.goalsConceded || enrichedData.awayStats?.pointsConceded || 0,
    };
    const h2hData = {
      total: enrichedData.h2hSummary?.totalMatches || enrichedData.h2h?.total || 0,
      homeWins: enrichedData.h2hSummary?.homeWins || enrichedData.h2h?.homeWins || 0,
      awayWins: enrichedData.h2hSummary?.awayWins || enrichedData.h2h?.awayWins || 0,
      draws: enrichedData.h2hSummary?.draws || enrichedData.h2h?.draws || 0,
    };

    // Build fallback snapshot from actual data if AI doesn't provide one
    const fallbackSnapshot = buildFallbackSnapshot(
      homeTeam, awayTeam, homeFormStr, awayFormStr, homeStats, awayStats, h2hData, signals
    );

    // Sanitize AI snapshot - remove any "undefined" strings that AI might output
    const sanitizeSnapshot = (snapshot: string[] | undefined): string[] => {
      if (!snapshot || !Array.isArray(snapshot)) return fallbackSnapshot;
      return snapshot.map(s =>
        typeof s === 'string'
          ? s.replace(/\bundefined\b/gi, 'unconfirmed').replace(/\bnull\b/gi, 'unknown')
          : s
      );
    };

    // Return story in SAME format as generateAIAnalysis
    return {
      story: {
        favored: aiResponse.favored || (hasDraw ? 'draw' : 'home'),
        confidence: mapConfidence(aiResponse.confidence),
        narrative: aiResponse.gameFlow || aiResponse.narrative || 'Analysis not available.',
        snapshot: sanitizeSnapshot(aiResponse.snapshot),
        riskFactors: aiResponse.riskFactors || ['Limited historical data'],
      },
      probabilities: aiResponse.probabilities || { home: 0.33, away: 0.33, draw: 0.34 },
      signals,
      marketIntel,
      // Include universalSignals for UI
      universalSignals: signals,
      // Include structured injuries for UI availability section
      injuries: {
        home: finalInjuries.home as any[] || [],
        away: finalInjuries.away as any[] || [],
      },
      // Include headlines
      headlines: [
        { icon: '📊', text: `${homeTeam} vs ${awayTeam}: AI Prediction`, favors: aiResponse.favored || 'neutral', viral: false }
      ],
      // NEW: Include enriched data for building viralStats etc.
      enrichedData: {
        homeFormStr,
        awayFormStr,
        homeForm: enrichedData.homeForm || [],
        awayForm: enrichedData.awayForm || [],
        headToHead: enrichedData.headToHead || [],
        homeStats,
        awayStats,
        h2h: h2hData,
      },
    };
  } catch (error) {
    console.error(`[Pre-Analyze] AI analysis failed for ${homeTeam} vs ${awayTeam}:`, error);
    return null;
  }
}

// ============================================
// MAIN CRON HANDLER
// ============================================

// Split leagues into batches to avoid timeout (17 leagues / 4 batches = ~4-5 per batch)
// Runs hourly 6-9 AM UTC (7-10 AM CET) so all leagues done by 10 AM CET
const BATCH_CONFIG = [
  // Batch 0: Top 5 soccer - runs at 6 AM UTC (7 AM CET)
  ['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a', 'soccer_france_ligue_one'],
  // Batch 1: Mid soccer - runs at 7 AM UTC (8 AM CET)
  ['soccer_portugal_primeira_liga', 'soccer_netherlands_eredivisie', 'soccer_turkey_super_league', 'soccer_belgium_first_div', 'soccer_spl'],
  // Batch 2: UCL/UEL + Basketball - runs at 8 AM UTC (9 AM CET)
  ['soccer_uefa_champs_league', 'soccer_uefa_europa_league', 'basketball_nba', 'basketball_euroleague'],
  // Batch 3: American sports - runs at 9 AM UTC (10 AM CET)
  ['americanfootball_nfl', 'americanfootball_ncaaf', 'icehockey_nhl'],
];

export async function GET(request: NextRequest) {
  // Verify cron secret - allow Vercel cron OR Bearer token OR query param
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}` || secretParam === CRON_SECRET;

  if (CRON_SECRET && !isVercelCron && !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional: filter to specific sport via query param
  const sportFilter = url.searchParams.get('sport');
  if (sportFilter) {
    console.log(`[Pre-Analyze] Filtering to sport: ${sportFilter}`);
  }

  // Batch parameter: 0-3, or 'all' for manual full run
  const batchParam = url.searchParams.get('batch');
  const currentHour = new Date().getUTCHours();

  // Auto-detect batch based on hour if not specified
  // Morning: 6 AM = batch 0, 7 AM = batch 1, 8 AM = batch 2, 9 AM = batch 3
  // Evening: 18 PM = batch 0, 19 PM = batch 1, 20 PM = batch 2, 21 PM = batch 3
  let batchIndex: number | null = null;
  if (batchParam === 'all') {
    batchIndex = null; // Process all
  } else if (batchParam !== null) {
    batchIndex = parseInt(batchParam, 10);
  } else {
    // Auto-detect from hour (morning 6-9 AM UTC, evening 18-21 PM UTC)
    if (currentHour === 6 || currentHour === 18) batchIndex = 0;
    else if (currentHour === 7 || currentHour === 19) batchIndex = 1;
    else if (currentHour === 8 || currentHour === 20) batchIndex = 2;
    else if (currentHour === 9 || currentHour === 21) batchIndex = 3;
    else batchIndex = null; // Outside scheduled hours, run all
  }

  console.log(`[Pre-Analyze] Starting cron job... Batch: ${batchIndex !== null ? batchIndex : 'ALL'}, Hour: ${currentHour} UTC`);

  if (!theOddsClient.isConfigured()) {
    console.error('[Pre-Analyze] Odds API not configured');
    return NextResponse.json({ error: 'Odds API not configured' }, { status: 500 });
  }

  const stats = {
    sportsProcessed: 0,
    matchesFound: 0,
    matchesAnalyzed: 0,
    skippedCached: 0, // Matches already in cache (saves API calls)
    cacheWrites: 0,
    oddsSnapshotUpdates: 0,
    predictionsCreated: 0,
    errors: [] as string[],
    analyzedMatches: [] as string[],
    batch: batchIndex,
  };

  // Determine which sports to process
  let sportsToProcess = PRE_ANALYZE_SPORTS;

  if (sportFilter) {
    // Manual filter takes precedence
    sportsToProcess = PRE_ANALYZE_SPORTS.filter(s => s.key === sportFilter || s.key.includes(sportFilter));
  } else if (batchIndex !== null && BATCH_CONFIG[batchIndex]) {
    // Use batch config
    const batchKeys = BATCH_CONFIG[batchIndex];
    sportsToProcess = PRE_ANALYZE_SPORTS.filter(s => batchKeys.includes(s.key));
    console.log(`[Pre-Analyze] Batch ${batchIndex}: Processing ${sportsToProcess.map(s => s.title).join(', ')}`);
  }

  if (sportFilter && sportsToProcess.length === 0) {
    return NextResponse.json({
      error: `Sport not found: ${sportFilter}`,
      availableSports: PRE_ANALYZE_SPORTS.map(s => s.key)
    }, { status: 400 });
  }

  // Process each sport
  for (const sport of sportsToProcess) {
    try {
      console.log(`[Pre-Analyze] Fetching events for ${sport.key}...`);

      // Get odds (includes events) - fetch h2h AND totals for O/U data
      const oddsResponse = await theOddsClient.getOddsForSport(sport.key, {
        regions: ['eu', 'us'],
        markets: ['h2h', 'totals'],
      });

      if (!oddsResponse.data || oddsResponse.data.length === 0) {
        console.log(`[Pre-Analyze] No events for ${sport.key}`);
        continue;
      }

      stats.sportsProcessed++;

      // Filter to next 48 hours
      const now = new Date();
      const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const upcomingEvents = oddsResponse.data.filter(event => {
        const matchDate = new Date(event.commence_time);
        return matchDate >= now && matchDate <= cutoff;
      });

      console.log(`[Pre-Analyze] Found ${upcomingEvents.length} upcoming events for ${sport.key}`);
      stats.matchesFound += upcomingEvents.length;

      // Limit to prevent timeout (max 10 per sport)
      const eventsToProcess = upcomingEvents.slice(0, 10);

      for (const event of eventsToProcess) {
        try {
          const consensus = getConsensusOdds(event);
          if (!consensus) {
            console.log(`[Pre-Analyze] No odds for ${event.home_team} vs ${event.away_team}`);
            continue;
          }

          // Extract O/U data from the same event
          const overUnderData = getOverUnderData(event);
          if (overUnderData) {
            console.log(`[Pre-Analyze] O/U line: ${overUnderData.line} (over: ${overUnderData.overOdds?.toFixed(2)}, under: ${overUnderData.underOdds?.toFixed(2)})`);
          }

          const matchRef = `${event.home_team} vs ${event.away_team}`;
          const matchDateStr = new Date(event.commence_time).toISOString().split('T')[0];
          const matchDate = new Date(event.commence_time); // Date object for pipeline
          const cacheKey = CACHE_KEYS.matchPreview(
            event.home_team,
            event.away_team,
            sport.key,
            matchDateStr
          );

          // OPTIMIZATION: Check if already cached to avoid redundant API-Football calls
          const existingCache = await cacheGet<any>(cacheKey);
          if (existingCache?.analysis?.probabilities) {
            console.log(`[Pre-Analyze] SKIP - already cached: ${matchRef}`);
            stats.skippedCached = (stats.skippedCached || 0) + 1;
            continue;
          }

          console.log(`[Pre-Analyze] Analyzing: ${matchRef} | Cache key: ${cacheKey}`);

          // Run AI analysis
          const analysis = await runQuickAnalysis(
            event.home_team,
            event.away_team,
            sport.key,
            sport.league,
            consensus,
            event.commence_time
          );

          if (!analysis) {
            stats.errors.push(`${matchRef}: Analysis failed`);
            continue;
          }

          stats.matchesAnalyzed++;
          stats.analyzedMatches.push(matchRef);

          // Extract enriched data for building rich UI components
          const { homeFormStr, awayFormStr, homeStats, awayStats, h2h } = analysis.enrichedData;

          // ============================================
          // RUN ACCURACY-CORE PIPELINE EARLY
          // ============================================
          // This ensures we have Poisson/Elo probabilities for:
          // 1. Cache storage (marketIntel.modelProbability)
          // 2. OddsSnapshot storage
          // 3. Prediction creation
          // 
          // SINGLE SOURCE OF TRUTH: All probabilities come from here!
          // Note: matchDate already defined above as new Date(event.commence_time)
          const pipelineOdds: BookmakerOdds[] = [{
            bookmaker: 'consensus',
            homeOdds: consensus.home,
            awayOdds: consensus.away,
            drawOdds: consensus.draw || undefined,
          }];

          const pipelineInput: PipelineInput = {
            matchId: event.id,
            sport: sport.key,
            league: sport.league,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            kickoff: matchDate,
            homeStats: {
              played: homeStats?.played || 0,
              wins: homeStats?.wins || 0,
              draws: homeStats?.draws || 0,
              losses: homeStats?.losses || 0,
              scored: homeStats?.goalsScored || 0,
              conceded: homeStats?.goalsConceded || 0,
            },
            awayStats: {
              played: awayStats?.played || 0,
              wins: awayStats?.wins || 0,
              draws: awayStats?.draws || 0,
              losses: awayStats?.losses || 0,
              scored: awayStats?.goalsScored || 0,
              conceded: awayStats?.goalsConceded || 0,
            },
            homeForm: homeFormStr,
            awayForm: awayFormStr,
            h2h: h2h ? {
              total: h2h.total || 0,
              homeWins: h2h.homeWins || 0,
              awayWins: h2h.awayWins || 0,
              draws: h2h.draws || 0,
            } : undefined,
            odds: pipelineOdds,
            situational: (() => {
              const isFatigueSport = sport.key.includes('basketball') || sport.key.includes('hockey') || sport.key.includes('football');
              const matchTime = matchDate.getTime();
              const oneDayMs = 24 * 60 * 60 * 1000;

              const getRestDays = (formData: any[] | null): number => {
                if (!formData || formData.length === 0) return 3;
                const lastGameDate = formData
                  .map((g: any) => new Date(g.date).getTime())
                  .filter((d: number) => d < matchTime)
                  .sort((a: number, b: number) => b - a)[0];
                if (!lastGameDate) return 3;
                return Math.floor((matchTime - lastGameDate) / oneDayMs);
              };

              const homeRestDays = getRestDays(analysis.enrichedData?.homeForm);
              const awayRestDays = getRestDays(analysis.enrichedData?.awayForm);

              // Count injuries
              const countInjuries = (injuries: any[]) => {
                let outCount = 0;
                let doubtfulCount = 0;
                for (const inj of injuries || []) {
                  const reason = (inj.reason || inj.status || '').toLowerCase();
                  if (reason.includes('out') || reason.includes('injury') && !reason.includes('questionable') && !reason.includes('doubtful') && !reason.includes('probable')) {
                    outCount++;
                  } else if (reason.includes('doubtful') || reason.includes('questionable') || reason.includes('gtd')) {
                    doubtfulCount++;
                  }
                }
                return { outCount, doubtfulCount };
              };

              const homeInjuryCounts = countInjuries(analysis.injuries?.home || []);
              const awayInjuryCounts = countInjuries(analysis.injuries?.away || []);

              return {
                homeRestDays: isFatigueSport ? homeRestDays : 3,
                awayRestDays: isFatigueSport ? awayRestDays : 3,
                isHomeBackToBack: isFatigueSport ? homeRestDays <= 1 : false,
                isAwayBackToBack: isFatigueSport ? awayRestDays <= 1 : false,
                homeGamesLast7Days: isFatigueSport ? (analysis.enrichedData?.homeForm || []).filter((g: any) => {
                  const gameTime = new Date(g.date).getTime();
                  return gameTime > (matchTime - 7 * oneDayMs) && gameTime < matchTime;
                }).length : 0,
                awayGamesLast7Days: isFatigueSport ? (analysis.enrichedData?.awayForm || []).filter((g: any) => {
                  const gameTime = new Date(g.date).getTime();
                  return gameTime > (matchTime - 7 * oneDayMs) && gameTime < matchTime;
                }).length : 0,
                homeInjuriesOut: homeInjuryCounts.outCount,
                awayInjuriesOut: awayInjuryCounts.outCount,
                homeInjuriesDoubtful: homeInjuryCounts.doubtfulCount,
                awayInjuriesDoubtful: awayInjuryCounts.doubtfulCount,
              };
            })(),
            config: { logPredictions: false, minEdgeToShow: 0.02 },
          };

          const pipelineResult = await runAccuracyPipeline(pipelineInput);

          // Extract calibrated probabilities (Poisson/Elo) - THE SOURCE OF TRUTH
          const pipelineProbs = {
            home: pipelineResult.details.calibratedProbabilities.home,
            away: pipelineResult.details.calibratedProbabilities.away,
            draw: pipelineResult.details.calibratedProbabilities.draw || null,
          };
          const pipelineEdge = pipelineResult.details.edge;
          const modelMethod = pipelineResult.details.rawProbabilities.method;

          console.log(`[Pre-Analyze] ${modelMethod.toUpperCase()}: ${matchRef} | H:${(pipelineProbs.home * 100).toFixed(1)}% A:${(pipelineProbs.away * 100).toFixed(1)}%${pipelineProbs.draw ? ` D:${(pipelineProbs.draw * 100).toFixed(1)}%` : ''} | Edge: ${pipelineEdge.primaryEdge.outcome} ${pipelineEdge.primaryEdge.value > 0 ? '+' : ''}${(pipelineEdge.primaryEdge.value * 100).toFixed(1)}%`);

          // Build H2H headline
          const buildH2HHeadline = () => {
            if (h2h.total === 0) return 'First ever meeting';
            const dominantTeam = h2h.homeWins > h2h.awayWins ? event.home_team : event.away_team;
            const dominantWins = Math.max(h2h.homeWins, h2h.awayWins);
            if (dominantWins >= 5) return `${dominantTeam}: ${dominantWins} wins in last ${h2h.total}`;
            if (h2h.draws >= h2h.total / 2) return `${h2h.draws} draws in ${h2h.total} meetings`;
            return `${h2h.homeWins}-${h2h.draws}-${h2h.awayWins} in ${h2h.total} meetings`;
          };

          // Find key absence from injuries (same logic as match-preview API)
          const findKeyAbsence = (): { player: string; team: 'home' | 'away'; impact: 'star' | 'key' | 'rotation' } | null => {
            const homeInjuries = analysis.injuries?.home || [];
            const awayInjuries = analysis.injuries?.away || [];

            // Check home team injuries first - priority to key positions
            const homeKeyPlayer = homeInjuries.find((i: any) =>
              i.position?.toLowerCase().includes('forward') ||
              i.position?.toLowerCase().includes('striker') ||
              i.position?.toLowerCase().includes('quarterback') ||
              i.position?.toLowerCase().includes('center') ||
              i.position?.toLowerCase().includes('goalie') ||
              i.position?.toLowerCase().includes('midfielder')
            );
            if (homeKeyPlayer) {
              return {
                player: homeKeyPlayer.player,
                team: 'home' as const,
                impact: 'star' as const,
              };
            }
            // Check away team
            const awayKeyPlayer = awayInjuries.find((i: any) =>
              i.position?.toLowerCase().includes('forward') ||
              i.position?.toLowerCase().includes('striker') ||
              i.position?.toLowerCase().includes('quarterback') ||
              i.position?.toLowerCase().includes('center') ||
              i.position?.toLowerCase().includes('goalie') ||
              i.position?.toLowerCase().includes('midfielder')
            );
            if (awayKeyPlayer) {
              return {
                player: awayKeyPlayer.player,
                team: 'away' as const,
                impact: 'star' as const,
              };
            }
            // Return first injury if any
            if (homeInjuries.length > 0) {
              return {
                player: homeInjuries[0].player,
                team: 'home' as const,
                impact: homeInjuries.length === 1 ? 'key' as const : 'star' as const,
              };
            }
            if (awayInjuries.length > 0) {
              return {
                player: awayInjuries[0].player,
                team: 'away' as const,
                impact: awayInjuries.length === 1 ? 'key' as const : 'star' as const,
              };
            }
            return null;
          };

          // Detect win streaks (same logic as match-preview API)
          const detectStreak = (): { text: string; team: 'home' | 'away' } | null => {
            const homeWinStreak = (homeFormStr.match(/W+$/) || [''])[0].length;
            const awayWinStreak = (awayFormStr.match(/W+$/) || [''])[0].length;
            const homeUnbeaten = (homeFormStr.match(/[WD]+$/) || [''])[0].length;
            const awayUnbeaten = (awayFormStr.match(/[WD]+$/) || [''])[0].length;

            if (homeWinStreak >= 3) return { text: `${homeWinStreak} wins in a row`, team: 'home' as const };
            if (awayWinStreak >= 3) return { text: `${awayWinStreak} wins in a row`, team: 'away' as const };
            if (homeUnbeaten >= 5) return { text: `${homeUnbeaten} unbeaten`, team: 'home' as const };
            if (awayUnbeaten >= 5) return { text: `${awayUnbeaten} unbeaten`, team: 'away' as const };

            return null;
          };

          // Build viralStats (same logic as full API) - NOW WITH REAL DATA!
          const keyAbsence = findKeyAbsence();
          const streak = detectStreak();
          const viralStats = {
            h2h: {
              headline: buildH2HHeadline(),
              favors: h2h.homeWins > h2h.awayWins ? 'home' : h2h.awayWins > h2h.homeWins ? 'away' : 'even',
            },
            form: {
              home: homeFormStr.slice(-5),
              away: awayFormStr.slice(-5),
            },
            keyAbsence, // NOW POPULATED from analysis.injuries!
            streak, // NOW POPULATED from form data!
          };

          // Log what we found
          if (keyAbsence) {
            console.log(`[Pre-Analyze] ${matchRef} keyAbsence: ${keyAbsence.player} (${keyAbsence.team})`);
          }
          if (streak) {
            console.log(`[Pre-Analyze] ${matchRef} streak: ${streak.text} (${streak.team})`);
          }

          // Build homeAwaySplits (estimated from overall stats)
          const homeAwaySplits = {
            homeTeamAtHome: {
              played: Math.ceil(homeStats.played / 2),
              wins: Math.ceil(homeStats.wins * 0.6),
              draws: Math.ceil(homeStats.draws / 2),
              losses: Math.floor(homeStats.losses * 0.4),
              goalsFor: Math.ceil(homeStats.goalsScored * 0.55),
              goalsAgainst: Math.floor(homeStats.goalsConceded * 0.45),
              cleanSheets: Math.ceil(homeStats.played * 0.25),
              highlight: homeStats.wins > homeStats.losses ? 'Strong at home this season' : null,
            },
            awayTeamAway: {
              played: Math.ceil(awayStats.played / 2),
              wins: Math.floor(awayStats.wins * 0.4),
              draws: Math.ceil(awayStats.draws / 2),
              losses: Math.ceil(awayStats.losses * 0.6),
              goalsFor: Math.floor(awayStats.goalsScored * 0.45),
              goalsAgainst: Math.ceil(awayStats.goalsConceded * 0.55),
              cleanSheets: Math.floor(awayStats.played * 0.15),
              highlight: awayStats.wins > awayStats.losses ? 'Good travellers this season' : null,
            },
          };

          // Build full response for cache - MUST match match-preview API response format!
          // The client expects data.matchInfo to exist

          // ============================================
          // OVERRIDE marketIntel WITH PIPELINE PROBABILITIES
          // ============================================
          // Re-run analyzeMarket with pipeline probabilities to ensure
          // ALL edge calculations use the SAME Poisson/Elo source
          const oddsData = {
            homeOdds: consensus.home,
            awayOdds: consensus.away,
            drawOdds: consensus.draw,
          };
          const leagueKey = sport.league.toLowerCase().replace(/\s+/g, '_');
          const pipelineMarketIntel = analyzeMarket(
            analysis.signals,
            oddsData,
            sport.hasDraw,
            undefined,
            leagueKey,
            pipelineProbs  // <-- PIPELINE PROBABILITIES AS SINGLE SOURCE OF TRUTH
          );

          // Override probabilities with pipeline values (convert to percentage format for UI)
          const pipelineProbabilitiesForUI = {
            home: pipelineProbs.home * 100,
            away: pipelineProbs.away * 100,
            draw: pipelineProbs.draw != null ? pipelineProbs.draw * 100 : undefined,
          };

          // Calculate expected scores using Poisson/Elo model
          const sportType = sport.key.includes('basketball') ? 'basketball'
            : sport.key.includes('nfl') || sport.key.includes('american') ? 'football'
              : sport.key.includes('nhl') || sport.key.includes('hockey') ? 'hockey'
                : 'soccer';

          const modelInputForScores: ModelInput = {
            sport: sportType,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            league: sport.league,
            homeStats: pipelineInput.homeStats,
            awayStats: pipelineInput.awayStats,
            homeForm: homeFormStr,
            awayForm: awayFormStr,
          };

          // Pass consensus odds to getExpectedScores for odds-based adjustments when stats are missing
          const expectedScores = getExpectedScores(modelInputForScores, {
            homeOdds: consensus.home,
            awayOdds: consensus.away,
            drawOdds: consensus.draw,
          });
          console.log(`[Pre-Analyze] Expected scores: ${event.home_team} ${expectedScores.home} - ${expectedScores.away} ${event.away_team}`);

          // Validate score ↔ probability consistency
          const consistency = validateScoreProbabilityConsistency(
            expectedScores,
            pipelineProbabilitiesForUI,
            sportType,
          );
          if (!consistency.consistent) {
            console.warn(`[Pre-Analyze] ⚠️ Score-Probability DIVERGENCE for ${event.home_team} vs ${event.away_team}: ${consistency.warning}`);
          }

          const cacheResponse = {
            // matchInfo wrapper - required by client!
            matchInfo: {
              id: generateMatchId(event, sport.key, sport.league),
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              league: sport.league,
              sport: sport.key,
              hasDraw: sport.hasDraw,
              scoringUnit: sport.hasDraw ? 'goals' : 'points',
              kickoff: event.commence_time,
              venue: null,
            },
            // Data availability
            dataAvailability: {
              source: 'API_SPORTS',
              hasFormData: homeFormStr !== '-----',
              hasH2H: h2h.total > 0,
              hasInjuries: (analysis.injuries?.home?.length || 0) + (analysis.injuries?.away?.length || 0) > 0,
            },
            story: analysis.story,
            signals: analysis.signals,
            // Universal signals for UI display
            universalSignals: analysis.universalSignals,
            // Headlines for viral display
            headlines: analysis.headlines,
            // USE PIPELINE PROBABILITIES - SINGLE SOURCE OF TRUTH
            probabilities: pipelineProbabilitiesForUI,
            // USE PIPELINE-BASED MARKET INTEL
            marketIntel: pipelineMarketIntel,
            odds: {
              homeOdds: consensus.home,
              awayOdds: consensus.away,
              drawOdds: consensus.draw,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
            },
            // Include injuries data for UI
            injuries: {
              home: analysis.injuries?.home || [],
              away: analysis.injuries?.away || [],
            },
            // Rich UI components - NOW POPULATED!
            viralStats,
            homeAwaySplits,
            goalsTiming: null, // Requires specific API call
            contextFactors: null, // Could add later
            keyPlayerBattle: null, // Requires specific API call
            referee: null, // Requires specific API call
            // CRITICAL: Include momentumAndForm for UI to display form data!
            momentumAndForm: {
              homeMomentumScore: null,
              awayMomentumScore: null,
              homeTrend: homeFormStr.includes('W') ? (homeFormStr.startsWith('WW') ? 'up' : 'stable') : 'down',
              awayTrend: awayFormStr.includes('W') ? (awayFormStr.startsWith('WW') ? 'up' : 'stable') : 'down',
              keyFormFactors: analysis.story?.riskFactors || [],
              homeForm: analysis.enrichedData.homeForm || [],
              awayForm: analysis.enrichedData.awayForm || [],
              formDataSource: 'API_SPORTS',
              headToHead: analysis.enrichedData.headToHead || [],
              h2hSummary: {
                totalMatches: h2h.total,
                homeWins: h2h.homeWins,
                awayWins: h2h.awayWins,
                draws: h2h.draws,
              },
              homeStats,
              awayStats,
            },
            // Expected scores from Poisson/Elo model
            expectedScores,
            // Over/Under data from totals market
            overUnder: overUnderData,
            preAnalyzed: true,
            preAnalyzedAt: new Date().toISOString(),
          };

          // Cache the response with longer TTL for pre-analyzed content
          try {
            await cacheSet(cacheKey, cacheResponse, CACHE_TTL.PRE_ANALYZED);
            stats.cacheWrites++;
            console.log(`[Pre-Analyze] Cached: ${matchRef}`);
          } catch (cacheError) {
            console.error(`[Pre-Analyze] Cache write failed:`, cacheError);
          }

          // Update OddsSnapshot with PIPELINE probabilities (single source of truth)
          try {
            // Use pipeline probabilities (already calculated above)
            // Convert to percentages for storage
            const homeProb = pipelineProbs.home * 100;
            const awayProb = pipelineProbs.away * 100;
            const drawProb = pipelineProbs.draw != null ? pipelineProbs.draw * 100 : 0;

            // Use pipeline edges (already calculated)
            const homeEdge = pipelineEdge.home * 100;
            const awayEdge = pipelineEdge.away * 100;
            const drawEdge = pipelineEdge.draw !== undefined ? pipelineEdge.draw * 100 : null;

            const bestEdge = Math.max(homeEdge, awayEdge, drawEdge || 0);
            const alertLevel = bestEdge > 10 ? 'HIGH' : bestEdge > 5 ? 'MEDIUM' : bestEdge > 3 ? 'LOW' : null;

            // ============================================
            // REAL STEAM MOVE DETECTION
            // Fetch existing snapshot to calculate ACTUAL line movement
            // ============================================
            const existingSnapshot = await prisma.oddsSnapshot.findUnique({
              where: {
                matchRef_sport_bookmaker: {
                  matchRef,
                  sport: sport.key,
                  bookmaker: 'consensus',
                },
              },
              select: {
                homeOdds: true,
                awayOdds: true,
                drawOdds: true,
                openingHomeOdds: true,
                openingAwayOdds: true,
                openingDrawOdds: true,
              },
            });

            // Calculate real odds changes
            const STEAM_THRESHOLD = 2.5; // 2.5% change = significant movement
            let homeChange: number | null = null;
            let awayChange: number | null = null;
            let drawChange: number | null = null;
            let hasSteamMove = false;
            let steamNote: string | null = null;

            if (existingSnapshot && existingSnapshot.homeOdds > 0) {
              // Calculate % change from last snapshot
              homeChange = ((consensus.home - existingSnapshot.homeOdds) / existingSnapshot.homeOdds) * 100;
              awayChange = ((consensus.away - existingSnapshot.awayOdds) / existingSnapshot.awayOdds) * 100;
              if (consensus.draw && existingSnapshot.drawOdds) {
                drawChange = ((consensus.draw - existingSnapshot.drawOdds) / existingSnapshot.drawOdds) * 100;
              }

              // Detect REAL steam move (significant line movement)
              if (Math.abs(homeChange) >= STEAM_THRESHOLD) {
                hasSteamMove = true;
                steamNote = homeChange < 0 
                  ? `Sharp money on Home (${Math.abs(homeChange).toFixed(1)}% drop: ${existingSnapshot.homeOdds.toFixed(2)} → ${consensus.home.toFixed(2)})`
                  : `Line drifting from Home (+${homeChange.toFixed(1)}%: ${existingSnapshot.homeOdds.toFixed(2)} → ${consensus.home.toFixed(2)})`;
              } else if (Math.abs(awayChange) >= STEAM_THRESHOLD) {
                hasSteamMove = true;
                steamNote = awayChange < 0
                  ? `Sharp money on Away (${Math.abs(awayChange).toFixed(1)}% drop: ${existingSnapshot.awayOdds.toFixed(2)} → ${consensus.away.toFixed(2)})`
                  : `Line drifting from Away (+${awayChange.toFixed(1)}%: ${existingSnapshot.awayOdds.toFixed(2)} → ${consensus.away.toFixed(2)})`;
              } else if (drawChange !== null && Math.abs(drawChange) >= STEAM_THRESHOLD) {
                hasSteamMove = true;
                steamNote = drawChange < 0
                  ? `Sharp money on Draw (${Math.abs(drawChange).toFixed(1)}% drop)`
                  : `Line drifting from Draw (+${drawChange.toFixed(1)}%)`;
              }

              if (hasSteamMove) {
                console.log(`[Pre-Analyze] STEAM DETECTED: ${matchRef} - ${steamNote}`);
              }
            }

            // Store previous odds (for tracking movement over time)
            const prevHomeOdds = existingSnapshot?.homeOdds ?? null;
            const prevAwayOdds = existingSnapshot?.awayOdds ?? null;
            const prevDrawOdds = existingSnapshot?.drawOdds ?? null;

            // Store opening odds (first time we see this match)
            const openingHomeOdds = existingSnapshot?.openingHomeOdds ?? consensus.home;
            const openingAwayOdds = existingSnapshot?.openingAwayOdds ?? consensus.away;
            const openingDrawOdds = existingSnapshot?.openingDrawOdds ?? consensus.draw ?? null;

            await prisma.oddsSnapshot.upsert({
              where: {
                matchRef_sport_bookmaker: {
                  matchRef,
                  sport: sport.key,
                  bookmaker: 'consensus',
                },
              },
              create: {
                matchRef,
                sport: sport.key,
                league: sport.league,
                homeTeam: event.home_team,
                awayTeam: event.away_team,
                matchDate: new Date(event.commence_time),
                homeOdds: consensus.home,
                awayOdds: consensus.away,
                drawOdds: consensus.draw ?? null,
                openingHomeOdds: consensus.home,  // First snapshot = opening odds
                openingAwayOdds: consensus.away,
                openingDrawOdds: consensus.draw ?? null,
                modelHomeProb: homeProb,  // PIPELINE probability (Poisson/Elo)
                modelAwayProb: awayProb,
                modelDrawProb: drawProb || null,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdge >= 3,
                hasSteamMove: false,  // First snapshot = no steam yet
                alertLevel,
                alertNote: pipelineMarketIntel?.valueEdge?.label || null,
                bookmaker: 'consensus',
              },
              update: {
                // Current odds
                homeOdds: consensus.home,
                awayOdds: consensus.away,
                drawOdds: consensus.draw ?? null,
                // Previous odds (for tracking)
                prevHomeOdds,
                prevAwayOdds,
                prevDrawOdds,
                // Opening odds (preserved)
                openingHomeOdds,
                openingAwayOdds,
                openingDrawOdds,
                // Calculated changes
                homeChange,
                awayChange,
                drawChange,
                // Model probabilities
                modelHomeProb: homeProb,  // PIPELINE probability (Poisson/Elo)
                modelAwayProb: awayProb,
                modelDrawProb: drawProb || null,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdge >= 3,
                // REAL steam detection
                hasSteamMove,
                alertLevel,
                alertNote: hasSteamMove ? steamNote : (pipelineMarketIntel?.valueEdge?.label || null),
                updatedAt: new Date(),
              },
            });

            stats.oddsSnapshotUpdates++;
            console.log(`[Pre-Analyze] OddsSnapshot: ${matchRef} (${bestEdge.toFixed(1)}% edge on ${pipelineEdge.primaryEdge.outcome})`);
          } catch (dbError) {
            console.error(`[Pre-Analyze] OddsSnapshot update failed:`, dbError);
          }

          // ============================================
          // GENERATE BLOG POST BASED ON MATCH IMPORTANCE
          // ============================================
          // Only generate blogs for important matches to avoid spam
          // Uses scoring: Top league +3, Big team +2, Value edge +2, Derby +3
          // Generate if score >= 3

          // Calculate best edge for importance scoring (re-use pipeline data)
          const blogBestEdge = Math.max(
            pipelineEdge.home * 100,
            pipelineEdge.away * 100,
            (pipelineEdge.draw ?? 0) * 100
          );

          const blogImportance = shouldGenerateBlog(
            event.home_team,
            event.away_team,
            sport.league,
            blogBestEdge
          );

          if (blogImportance.generate) {
            console.log(`[Pre-Analyze] Blog: ${matchRef} (score: ${blogImportance.score}, reasons: ${blogImportance.reasons.join(', ')})`);

            generateMatchPreview({
              matchId: event.id,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              sport: sport.title,
              sportKey: sport.key,
              league: sport.league,
              commenceTime: event.commence_time,
              homeTeamLogo: undefined,
              awayTeamLogo: undefined,
              leagueLogo: undefined,
              odds: consensus,
            }).then(result => {
              if (result.success) {
                console.log(`[Pre-Analyze] Blog created: ${result.slug}`);
              }
            }).catch(err => {
              console.log(`[Pre-Analyze] Blog skipped: ${err.message}`);
            });
          } else {
            console.log(`[Pre-Analyze] Blog skipped (low importance): ${matchRef} (score: ${blogImportance.score})`);
          }

          // ============================================
          // STORE FULL RESPONSE FOR AI CHAT (UNCONDITIONAL)
          // ============================================
          // This runs for ALL matches, not just value bets
          // Ensures chat can display analysis even for non-value matches
          // NOW ALSO stores edge data for daily picks filtering
          try {
            const predictionDateStr = new Date(event.commence_time).toISOString().split('T')[0];
            const chatPredictionId = `pre_${sport.key}_${event.id}_${predictionDateStr}`;

            // Calculate best edge for this match (even if not a qualified value bet)
            const edges = {
              home: pipelineEdge.home * 100,
              away: pipelineEdge.away * 100,
              draw: pipelineEdge.draw !== undefined ? pipelineEdge.draw * 100 : -999,
            };
            
            // Find best edge candidate
            type EdgeCandidate = { side: 'HOME' | 'AWAY' | 'DRAW'; edge: number; odds: number; prob: number };
            const edgeCandidates: EdgeCandidate[] = [
              { side: 'HOME', edge: edges.home, odds: consensus.home, prob: pipelineProbs.home },
              { side: 'AWAY', edge: edges.away, odds: consensus.away, prob: pipelineProbs.away },
            ];
            if (pipelineProbs.draw && consensus.draw && edges.draw > -999) {
              edgeCandidates.push({ side: 'DRAW', edge: edges.draw, odds: consensus.draw, prob: pipelineProbs.draw });
            }
            edgeCandidates.sort((a, b) => b.edge - a.edge);
            const bestEdge = edgeCandidates[0];
            
            // Determine edge bucket (using Prisma enum values)
            const getEdgeBucket = (edge: number): 'NO_EDGE' | 'SMALL' | 'MEDIUM' | 'HIGH' => {
              if (edge >= 5) return 'HIGH';
              if (edge >= 3) return 'MEDIUM';
              if (edge >= 2) return 'SMALL';
              return 'NO_EDGE';
            };

            // Check if a better MATCH_ANALYSIS record already exists - don't overwrite it!
            const existingPrediction = await prisma.prediction.findFirst({
              where: { matchName: matchRef },
              orderBy: { edgeValue: 'desc' },
            });
            
            if (existingPrediction && existingPrediction.source === 'MATCH_ANALYSIS' && 
                existingPrediction.edgeValue && existingPrediction.edgeValue >= bestEdge.edge) {
              console.log(`[Pre-Analyze] ⏭️ Skipping ${matchRef} - better MATCH_ANALYSIS exists (edge: ${existingPrediction.edgeValue?.toFixed(1)}% vs ${bestEdge.edge.toFixed(1)}%)`);
            } else {
              // Either no existing record, or PRE_ANALYZE has better edge - upsert
              // Delete any existing record with same matchName first to avoid duplicates
              await prisma.prediction.deleteMany({
                where: { matchName: matchRef }
              });
              
              await prisma.prediction.create({
                data: {
                  id: chatPredictionId,
                  matchId: event.id,
                  matchName: matchRef,
                  sport: sport.key,
                  league: sport.league,
                  kickoff: new Date(event.commence_time),
                  type: 'MATCH_RESULT',
                  prediction: `${event.home_team} vs ${event.away_team}`,
                  reasoning: analysis.story?.narrative || 'AI-generated match analysis',
                  conviction: 5,
                  source: 'PRE_ANALYZE',
                  outcome: 'PENDING',
                  homeWin: pipelineProbabilitiesForUI.home,
                  awayWin: pipelineProbabilitiesForUI.away,
                  draw: pipelineProbabilitiesForUI.draw || null,
                  predictedScore: `${expectedScores.home}-${expectedScores.away}`,
                  fullResponse: JSON.parse(JSON.stringify(cacheResponse)),
                  // Edge data for daily picks
                  selection: bestEdge.side === 'HOME' ? event.home_team : bestEdge.side === 'AWAY' ? event.away_team : 'Draw',
                  modelProbability: bestEdge.prob * 100,
                  marketOddsAtPrediction: bestEdge.odds,
                  edgeValue: bestEdge.edge,
                  edgeBucket: getEdgeBucket(bestEdge.edge),
                  odds: bestEdge.odds,
                  valueBetSide: bestEdge.side,
                  valueBetOdds: bestEdge.odds,
                  valueBetEdge: bestEdge.edge,
                },
              });
              console.log(`[Pre-Analyze] ✅ Stored prediction for: ${matchRef} (edge: ${bestEdge.edge.toFixed(1)}%, selection: ${bestEdge.side})`);
            }
          } catch (fullResponseError) {
            console.error(`[Pre-Analyze] Failed to store fullResponse:`, fullResponseError);
          }

          // Create Prediction record for accuracy tracking
          try {
            // Pipeline already ran above - use pipelineProbs and pipelineEdge
            // Convert probabilities to the format needed
            const normProbs = {
              home: pipelineProbs.home,
              away: pipelineProbs.away,
              draw: pipelineProbs.draw,
            };
            const edges = {
              home: pipelineEdge.home * 100,
              away: pipelineEdge.away * 100,
              draw: pipelineEdge.draw !== undefined ? pipelineEdge.draw * 100 : -999,
            };

            // ============================================
            // VALUE BET SELECTION (SIMPLIFIED)
            // ============================================
            // We now ONLY track value bets - no separate "winner prediction"
            // A value bet is the outcome where our model sees positive edge
            //
            // FILTERS to avoid losses:
            // 1. Max odds cap: 4.00 (avoid longshots that rarely hit)
            // 2. Min edge: 3% (industry standard - matches value-detection.ts)
            // 3. Min probability: 25% (allow some underdog value picks)
            const MAX_VALUE_BET_ODDS = 4.00;
            const MIN_VALUE_BET_EDGE = 3; // 3% edge required (was 5%, lowered for more predictions)
            const MIN_VALUE_BET_PROB = 0.25; // 25% minimum probability (was 30%)

            // Find the outcome with the best edge (our value pick)
            type ValueCandidate = { side: 'HOME' | 'AWAY' | 'DRAW'; edge: number; odds: number; prob: number };
            const candidates: ValueCandidate[] = [
              { side: 'HOME', edge: edges.home, odds: consensus.home, prob: normProbs.home },
              { side: 'AWAY', edge: edges.away, odds: consensus.away, prob: normProbs.away },
            ];
            if (normProbs.draw && consensus.draw && edges.draw > -999) {
              candidates.push({ side: 'DRAW', edge: edges.draw, odds: consensus.draw, prob: normProbs.draw });
            }

            // Sort by edge descending, pick best that passes filters
            candidates.sort((a, b) => b.edge - a.edge);

            const bestCandidate = candidates.find(c =>
              c.edge >= MIN_VALUE_BET_EDGE &&
              c.odds <= MAX_VALUE_BET_ODDS &&
              c.prob >= MIN_VALUE_BET_PROB
            );

            // Skip if no value found
            if (!bestCandidate) {
              console.log(`[Pre-Analyze] No value: ${matchRef} (best edge: ${candidates[0]?.edge.toFixed(1)}%, odds: ${candidates[0]?.odds.toFixed(2)}, prob: ${(candidates[0]?.prob * 100).toFixed(0)}%)`);
              continue; // Skip this match - no qualified value bet
            }

            const valueBetSide = bestCandidate.side;
            const valueBetOdds = bestCandidate.odds;
            const valueBetEdge = bestCandidate.edge;
            const valueBetProb = bestCandidate.prob;

            // Conviction: 1-10 scale based on edge strength + probability
            // Higher edge + higher probability = higher conviction
            const edgeScore = Math.min(5, valueBetEdge / 2); // 0-5 points from edge
            const probScore = Math.min(5, valueBetProb * 10);  // 0-5 points from probability
            const rawConviction = Math.round(edgeScore + probScore);
            const conviction = applyConvictionCap(rawConviction, sport.key);

            // Data quality check - require minimum form data
            const homeFormLength = homeFormStr.replace(/-/g, '').length;
            const awayFormLength = awayFormStr.replace(/-/g, '').length;
            const hasMinimumFormData = homeFormLength >= 3 && awayFormLength >= 3;

            if (!hasMinimumFormData) {
              console.log(`[Pre-Analyze] Skipped: ${matchRef} (insufficient form data: ${homeFormLength}/${awayFormLength})`);
              continue;
            }

            // Use deterministic ID to prevent duplicates (based on event + date, not timestamp)
            const predictionDateStr = matchDate.toISOString().split('T')[0];
            const predictionId = `pre_${sport.key}_${event.id}_${predictionDateStr}`;

            // Calculate implied probabilities for storage
            const impliedProbs = {
              home: 1 / consensus.home,
              away: 1 / consensus.away,
              draw: consensus.draw ? 1 / consensus.draw : 0,
            };

            // Build prediction text from value bet
            const valueTeam = valueBetSide === 'HOME' ? event.home_team :
              valueBetSide === 'AWAY' ? event.away_team : 'Draw';
            const predictionText = valueBetSide === 'HOME' ? `Home Win - ${event.home_team}` :
              valueBetSide === 'AWAY' ? `Away Win - ${event.away_team}` : 'Draw';

            // Get the implied prob for the value bet
            const storedImpliedProb = valueBetSide === 'HOME' ? impliedProbs.home :
              valueBetSide === 'AWAY' ? impliedProbs.away :
                impliedProbs.draw || 0;

            // Build reasoning showing value bet rationale
            const reasoning = `VALUE BET: ${valueTeam} at ${valueBetOdds.toFixed(2)} odds (+${valueBetEdge.toFixed(1)}% edge). Model: ${(valueBetProb * 100).toFixed(0)}% vs Market: ${(storedImpliedProb * 100).toFixed(0)}%. ${analysis.story?.narrative || ''}`;

            // Calculate edge bucket for v2 tracking
            const edgeBucket = valueBetEdge >= 8 ? 'HIGH' : valueBetEdge >= 5 ? 'MEDIUM' : 'SMALL';

            // Build selection text (outcome for v2 tracking)
            const selectionText = valueBetSide === 'HOME' ? event.home_team :
              valueBetSide === 'AWAY' ? event.away_team : 'Draw';

            // Check if a better MATCH_ANALYSIS record already exists - don't overwrite it!
            const existingPrediction = await prisma.prediction.findFirst({
              where: { matchName: matchRef },
              orderBy: { edgeValue: 'desc' },
            });
            
            if (existingPrediction && existingPrediction.source === 'MATCH_ANALYSIS' && 
                existingPrediction.edgeValue && existingPrediction.edgeValue >= valueBetEdge) {
              console.log(`[Pre-Analyze] ⏭️ Skipping value bet ${matchRef} - better MATCH_ANALYSIS exists (edge: ${existingPrediction.edgeValue?.toFixed(1)}% vs ${valueBetEdge.toFixed(1)}%)`);
            } else {
              // Either no existing record, or PRE_ANALYZE has better edge - create fresh
              // Delete any existing record with same matchName first to avoid duplicates
              await prisma.prediction.deleteMany({
                where: { matchName: matchRef }
              });
              
              await prisma.prediction.create({
                data: {
                  id: predictionId,
                  matchId: event.id,
                  matchName: matchRef,
                  sport: sport.key,
                  league: sport.league,
                  kickoff: matchDate,
                  type: 'MATCH_RESULT',
                  prediction: predictionText,
                  reasoning,
                  conviction,
                  odds: valueBetOdds,
                  impliedProb: storedImpliedProb * 100,
                  source: 'PRE_ANALYZE',
                  outcome: 'PENDING',
                  // ============ CRITICAL: Probabilities for AI Chat ============
                  // Without these, AI chat makes up probabilities!
                  homeWin: pipelineProbabilitiesForUI.home,
                  awayWin: pipelineProbabilitiesForUI.away,
                  draw: pipelineProbabilitiesForUI.draw || null,
                  predictedScore: `${expectedScores.home}-${expectedScores.away}`,
                  // ============ FULL RESPONSE FOR AI CHAT ============
                  // Store the complete analysis so AI chat can display same data as match page
                  fullResponse: JSON.parse(JSON.stringify(cacheResponse)),
                  // ============================================================
                  // Value bet IS the prediction now
                  valueBetSide,
                  valueBetOdds,
                  valueBetEdge,
                  valueBetOutcome: 'PENDING',
                  // CLV Tracking: Store opening odds at prediction time
                  openingOdds: valueBetOdds,
                  clvFetched: false,
                  // V2 Edge Tracking fields for admin dashboard
                  modelVersion: 'v2',
                  selection: selectionText,
                  modelProbability: valueBetProb * 100, // Store as percentage
                  marketProbabilityRaw: storedImpliedProb * 100, // Raw implied prob
                  marketProbabilityFair: storedImpliedProb * 100, // For now same as raw
                  marketOddsAtPrediction: valueBetOdds,
                  edgeValue: valueBetEdge,
                  edgeBucket,
                  marketType: 'MONEYLINE',
                  predictionTimestamp: new Date(),
                },
              });

              stats.predictionsCreated++;
              console.log(`[Pre-Analyze] VALUE BET: ${matchRef} → ${valueTeam} @ ${valueBetOdds.toFixed(2)} (+${valueBetEdge.toFixed(1)}% edge, ${(valueBetProb * 100).toFixed(0)}% model prob)`);
            }
            // Note: Blog post is now generated earlier for ALL matches (not just value bets)
          } catch (predError) {
            console.error(`[Pre-Analyze] Prediction creation failed:`, predError);
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (eventError) {
          const errorMsg = eventError instanceof Error ? eventError.message : 'Unknown error';
          stats.errors.push(`${event.home_team} vs ${event.away_team}: ${errorMsg}`);
          console.error(`[Pre-Analyze] Event error:`, eventError);
        }
      }

      console.log(`[Pre-Analyze] API quota remaining: ${oddsResponse.requestsRemaining}`);

    } catch (sportError) {
      const errorMsg = sportError instanceof Error ? sportError.message : 'Unknown error';
      stats.errors.push(`${sport.key}: ${errorMsg}`);
      console.error(`[Pre-Analyze] Sport error for ${sport.key}:`, sportError);
    }
  }

  console.log('[Pre-Analyze] Cron job complete:', stats);

  return NextResponse.json({
    success: true,
    stats,
    timestamp: new Date().toISOString(),
  });
}
