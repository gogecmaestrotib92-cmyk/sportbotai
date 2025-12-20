/**
 * Pre-Analyze Matches Cron Job
 * 
 * Runs daily to pre-analyze ALL upcoming matches across major sports.
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
import { cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
import { analyzeMarket, type MarketIntel, type OddsData, oddsToImpliedProb } from '@/lib/value-detection';
import { getEnrichedMatchDataV2, normalizeSport } from '@/lib/data-layer/bridge';
import { getEnrichedMatchData, getMatchInjuries, getMatchGoalTiming, getMatchKeyPlayers, getFixtureReferee, getMatchFixtureInfo } from '@/lib/football-api';
import { normalizeToUniversalSignals, formatSignalsForAI, getSignalSummary, type RawMatchInput } from '@/lib/universal-signals';
import { ANALYSIS_PERSONALITY } from '@/lib/sportbot-brain';
import OpenAI from 'openai';

export const maxDuration = 300; // 5 minute timeout for batch processing

const CRON_SECRET = process.env.CRON_SECRET;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sports to pre-analyze with league-specific configurations
const PRE_ANALYZE_SPORTS = [
  { key: 'soccer_epl', title: 'EPL', league: 'Premier League', hasDraw: true },
  { key: 'soccer_spain_la_liga', title: 'La Liga', league: 'La Liga', hasDraw: true },
  { key: 'soccer_germany_bundesliga', title: 'Bundesliga', league: 'Bundesliga', hasDraw: true },
  { key: 'soccer_italy_serie_a', title: 'Serie A', league: 'Serie A', hasDraw: true },
  { key: 'soccer_france_ligue_one', title: 'Ligue 1', league: 'Ligue 1', hasDraw: true },
  { key: 'basketball_nba', title: 'NBA', league: 'NBA', hasDraw: false },
  { key: 'americanfootball_nfl', title: 'NFL', league: 'NFL', hasDraw: false },
  { key: 'icehockey_nhl', title: 'NHL', league: 'NHL', hasDraw: false },
];

/**
 * League-specific prediction hints based on historical accuracy patterns
 * These are empirically derived from prediction performance analysis
 */
const LEAGUE_HINTS: Record<string, string> = {
  // EPL: 64% accuracy - our best soccer league, trust form data
  'Premier League': `
EPL INSIGHT: This is a high-quality league with predictable patterns. 
- Big 6 away wins are undervalued by markets
- Bottom half teams rarely win against top 10 at home
- Trust recent form over historical reputation`,

  // La Liga: 0% accuracy - heavily over-predict draws, need away focus  
  'La Liga': `
LA LIGA WARNING: Our model has struggled here. Adjustments needed:
- MASSIVELY reduce draw predictions - draws are overrated here
- Away wins happen more than expected, especially for top 4 teams
- Real Madrid/Barcelona away wins are severely underpriced
- Mid-table clashes are volatile - lower conviction`,

  // Bundesliga: 33% accuracy - home bias problem
  'Bundesliga': `
BUNDESLIGA WARNING: Strong away team performance historically.
- Bayern/Dortmund away wins are very reliable
- Home advantage is weaker than other leagues
- Bottom teams lose away almost always
- High-scoring nature means form matters more than H2H`,

  // Serie A: 50% accuracy - decent, defensive focus
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

  // NBA: 63% accuracy - our best sport
  'NBA': `
NBA INSIGHT: Our highest accuracy sport. Trust the model.
- Form and H2H data are very predictive
- Back-to-back games create real edges
- Road underdogs often have value
- High-scoring nature means favorites cover`,

  // NFL: No recent data
  'NFL': `
NFL INSIGHT: Weekly reset nature makes prediction harder.
- Home field matters more than other sports
- Division games are unpredictable
- Favor road teams with elite QBs
- Weather games favor running teams`,

  // NHL: 50% accuracy
  'NHL': `
NHL INSIGHT: High variance sport with goalie dependency.
- Form is less predictive than other sports
- Goalie matchups matter enormously (check injuries)
- Road underdogs often have value
- Divisional games are more unpredictable`,
};

/**
 * Get league-specific hint for AI prompt
 */
function getLeagueHint(league: string): string {
  return LEAGUE_HINTS[league] || '';
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
 * Fetch and format injury data for a match
 * Returns a formatted string for AI prompt, or null if unavailable
 */
async function getInjuryInfo(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league: string
): Promise<string | null> {
  try {
    // Only soccer has reliable injury data via API-Sports
    if (!sport.startsWith('soccer_')) {
      return null;
    }
    
    const injuries = await getMatchInjuries(homeTeam, awayTeam, league);
    
    if (!injuries || (injuries.home.length === 0 && injuries.away.length === 0)) {
      return null;
    }
    
    const formatInjuries = (team: string, list: any[]): string => {
      if (list.length === 0) return '';
      const top = list.slice(0, 3); // Limit to top 3 injuries per team
      const names = top.map(inj => `${inj.playerName} (${inj.type || inj.reason || 'injured'})`).join(', ');
      return `${team}: ${names}${list.length > 3 ? ` +${list.length - 3} more` : ''}`;
    };
    
    const parts: string[] = [];
    const homeStr = formatInjuries(homeTeam, injuries.home);
    const awayStr = formatInjuries(awayTeam, injuries.away);
    
    if (homeStr) parts.push(homeStr);
    if (awayStr) parts.push(awayStr);
    
    return parts.length > 0 ? parts.join(' | ') : null;
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
 * Generate matchId (base64 encoded match data)
 */
function generateMatchId(event: OddsApiEvent, sportKey: string, league: string): string {
  const matchData = {
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    sport: sportKey,
    league: league,
    kickoff: event.commence_time,
  };
  return Buffer.from(JSON.stringify(matchData)).toString('base64');
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
  // NEW: Include enriched data for building rich UI components
  enrichedData: {
    homeFormStr: string;
    awayFormStr: string;
    homeStats: { played: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number };
    awayStats: { played: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number };
    h2h: { total: number; homeWins: number; awayWins: number; draws: number };
  };
} | null> {
  try {
    // Determine if soccer or other sport
    const isNonSoccer = !sport.startsWith('soccer_');
    
    // Get enriched match data, injuries, and referee in parallel
    const [enrichedDataRaw, injuryInfo, refereeContext] = await Promise.all([
      isNonSoccer 
        ? getEnrichedMatchDataV2(homeTeam, awayTeam, sport, league)
        : getEnrichedMatchData(homeTeam, awayTeam, league),
      getInjuryInfo(homeTeam, awayTeam, sport, league),
      getRefereeContext(homeTeam, awayTeam, sport, league),
    ]);
    
    // Cast to any for cross-sport compatibility (different data shapes)
    const enrichedData = enrichedDataRaw as any;
    
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
        total: enrichedData.h2h?.total || 0,
        homeWins: enrichedData.h2h?.homeWins || 0,
        awayWins: enrichedData.h2h?.awayWins || 0,
        draws: enrichedData.h2h?.draws || 0,
      },
    };
    
    // Normalize to universal signals
    const signals = normalizeToUniversalSignals(rawInput);
    const signalsSummary = getSignalSummary(signals);
    
    // Determine if this sport has draws
    const hasDraw = !!odds.draw;
    const favoredOptions = hasDraw ? '"home" | "away" | "draw"' : '"home" | "away"';
    
    // Get league-specific hints for better accuracy
    const leagueHint = getLeagueHint(league);
    
    // Build injury context for prompt
    const injuryContext = injuryInfo 
      ? `INJURIES: ${injuryInfo}\n(Use this in risk assessment - missing key players matter!)`
      : 'INJURIES: No injury data available - assume full squads';
    
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
    
    // Build AIXBT-style prompt - sharp, opinionated, data-backed
    const prompt = `${homeTeam} vs ${awayTeam} | ${league}

MARKET: ${odds.home} / ${odds.away}${odds.draw ? ` / ${odds.draw}` : ''}
FORM: ${homeTeam} ${homeFormStr} | ${awayTeam} ${awayFormStr}${splitsContext ? `\nSPLITS: ${splitsContext}` : ''}${h2hContext ? `\n${h2hContext}` : ''}
SIGNALS: ${signalsSummary}
${injuryContext}${restContext ? `\nREST FACTOR: ${restContext}` : ''}${refereeContext ? `\n${refereeContext}` : ''}
${leagueHint ? `\n${leagueHint}\n` : ''}
Be AIXBT. Sharp takes. Back them with numbers FROM THE DATA ABOVE ONLY.

JSON output:
{
  "probabilities": { "home": 0.XX, "away": 0.XX${hasDraw ? ', "draw": 0.XX' : ''} },
  "favored": ${favoredOptions},
  "confidence": "high" | "medium" | "low",
  "snapshot": [
    "THE EDGE: [team] because [stat]. Not close.",
    "MARKET MISS: [what odds undervalue]. The data screams [X].",
    "THE PATTERN: [H2H/streak with numbers]. This isn't random.",
    "THE RISK: [caveat based on form/market data${injuryInfo ? '/injuries' : ''}${restContext ? '/fatigue' : ''}]. Don't ignore this."
  ],
  "gameFlow": "Sharp take on how this plays out. Cite the numbers.",
  "riskFactors": ["Risk based on form/market/H2H${injuryInfo ? '/injury' : ''}${restContext ? '/rest' : ''} data only", "Secondary if relevant"]
}

CRITICAL RULES:
- ONLY use data provided above. Do NOT invent injuries, suspensions, or lineup info not shown above.
- riskFactors must be based on form patterns, market odds, H2H${injuryInfo ? ', or listed injuries' : ''} - NOT made-up info.
${injuryInfo ? '- FACTOR IN INJURIES: The listed injuries are real and current. Use them in your analysis.' : '- If you don\'t have injury data, don\'t mention injuries.'}
- AVOID HOME BIAS: Modern football home advantage is only ~5%. Don't favor home teams without strong statistical evidence.
- RESPECT THE MARKET: Odds reflect wisdom of millions. Only call an edge when form/H2H data clearly contradicts implied probabilities.
- BE CONTRARIAN: Your accuracy is better on away picks. Look harder for away value.

SNAPSHOT VIBE:
- First bullet: State your pick. Be confident. Give the stat.
- Second bullet: What's the market sleeping on? Find the gap.
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
    
    const marketIntel = analyzeMarket(signals, oddsData, hasDraw);
    
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
      total: enrichedData.h2hSummary?.totalMeetings || enrichedData.h2h?.total || 0,
      homeWins: enrichedData.h2hSummary?.homeWins || enrichedData.h2h?.homeWins || 0,
      awayWins: enrichedData.h2hSummary?.awayWins || enrichedData.h2h?.awayWins || 0,
      draws: enrichedData.h2hSummary?.draws || enrichedData.h2h?.draws || 0,
    };
    
    // Build fallback snapshot from actual data if AI doesn't provide one
    const fallbackSnapshot = buildFallbackSnapshot(
      homeTeam, awayTeam, homeFormStr, awayFormStr, homeStats, awayStats, h2hData, signals
    );
    
    // Return story in SAME format as generateAIAnalysis
    return {
      story: {
        favored: aiResponse.favored || (hasDraw ? 'draw' : 'home'),
        confidence: mapConfidence(aiResponse.confidence),
        narrative: aiResponse.gameFlow || aiResponse.narrative || 'Analysis not available.',
        snapshot: aiResponse.snapshot || fallbackSnapshot,
        riskFactors: aiResponse.riskFactors || ['Limited historical data'],
      },
      probabilities: aiResponse.probabilities || { home: 0.33, away: 0.33, draw: 0.34 },
      signals,
      marketIntel,
      // Include universalSignals for UI
      universalSignals: signals,
      // Include headlines
      headlines: [
        { icon: '📊', text: `${homeTeam} vs ${awayTeam}: Pre-analyzed`, favors: aiResponse.favored || 'neutral', viral: false }
      ],
      // NEW: Include enriched data for building viralStats etc.
      enrichedData: {
        homeFormStr,
        awayFormStr,
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

export async function GET(request: NextRequest) {
  // Verify cron secret - allow Vercel cron OR manual Bearer token
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}`;
  
  if (CRON_SECRET && !isVercelCron && !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Pre-Analyze] Starting daily pre-analysis cron job...');
  
  if (!theOddsClient.isConfigured()) {
    console.error('[Pre-Analyze] Odds API not configured');
    return NextResponse.json({ error: 'Odds API not configured' }, { status: 500 });
  }
  
  const stats = {
    sportsProcessed: 0,
    matchesFound: 0,
    matchesAnalyzed: 0,
    cacheWrites: 0,
    oddsSnapshotUpdates: 0,
    predictionsCreated: 0,
    errors: [] as string[],
    analyzedMatches: [] as string[],
  };
  
  // Process each sport
  for (const sport of PRE_ANALYZE_SPORTS) {
    try {
      console.log(`[Pre-Analyze] Fetching events for ${sport.key}...`);
      
      // Get odds (includes events)
      const oddsResponse = await theOddsClient.getOddsForSport(sport.key, {
        regions: ['eu', 'us'],
        markets: ['h2h'],
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
          
          const matchRef = `${event.home_team} vs ${event.away_team}`;
          const matchDate = new Date(event.commence_time).toISOString().split('T')[0];
          const cacheKey = CACHE_KEYS.matchPreview(
            event.home_team, 
            event.away_team, 
            sport.key, 
            matchDate
          );
          
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
          
          // Build H2H headline
          const buildH2HHeadline = () => {
            if (h2h.total === 0) return 'First ever meeting';
            const dominantTeam = h2h.homeWins > h2h.awayWins ? event.home_team : event.away_team;
            const dominantWins = Math.max(h2h.homeWins, h2h.awayWins);
            if (dominantWins >= 5) return `${dominantTeam}: ${dominantWins} wins in last ${h2h.total}`;
            if (h2h.draws >= h2h.total / 2) return `${h2h.draws} draws in ${h2h.total} meetings`;
            return `${h2h.homeWins}-${h2h.draws}-${h2h.awayWins} in ${h2h.total} meetings`;
          };
          
          // Build viralStats (same logic as full API)
          const viralStats = {
            h2h: {
              headline: buildH2HHeadline(),
              favors: h2h.homeWins > h2h.awayWins ? 'home' : h2h.awayWins > h2h.homeWins ? 'away' : 'even',
            },
            form: {
              home: homeFormStr.slice(-5),
              away: awayFormStr.slice(-5),
            },
            keyAbsence: null, // No injury data in quick analysis
            streak: null, // Could add later
          };
          
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
              hasInjuries: false,
            },
            story: analysis.story,
            signals: analysis.signals,
            // Universal signals for UI display
            universalSignals: analysis.universalSignals,
            // Headlines for viral display
            headlines: analysis.headlines,
            probabilities: analysis.probabilities,
            marketIntel: analysis.marketIntel,
            odds: {
              homeOdds: consensus.home,
              awayOdds: consensus.away,
              drawOdds: consensus.draw,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
            },
            // Rich UI components - NOW POPULATED!
            viralStats,
            homeAwaySplits,
            goalsTiming: null, // Requires specific API call
            contextFactors: null, // Could add later
            keyPlayerBattle: null, // Requires specific API call
            referee: null, // Requires specific API call
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
          
          // Update OddsSnapshot with real AI edge
          try {
            const probs = analysis.probabilities;
            
            // Normalize probabilities to percentages (0-100)
            // AI may return decimals (0.45) or percentages (45) - detect and normalize
            const isDecimal = probs.home < 1 && probs.away < 1;
            const homeProb = isDecimal ? probs.home * 100 : probs.home;
            const awayProb = isDecimal ? probs.away * 100 : probs.away;
            const drawProb = probs.draw ? (isDecimal ? probs.draw * 100 : probs.draw) : 0;
            
            // Use oddsToImpliedProb which returns percentages (e.g., 54.05)
            const impliedHome = oddsToImpliedProb(consensus.home);
            const impliedAway = oddsToImpliedProb(consensus.away);
            const impliedDraw = consensus.draw ? oddsToImpliedProb(consensus.draw) : 0;
            
            // Edge = model probability - implied probability (both in percentage)
            const homeEdge = homeProb - impliedHome;
            const awayEdge = awayProb - impliedAway;
            const drawEdge = probs.draw ? drawProb - impliedDraw : null;
            
            const bestEdge = Math.max(homeEdge, awayEdge, drawEdge || 0);
            const alertLevel = bestEdge > 10 ? 'HIGH' : bestEdge > 5 ? 'MEDIUM' : bestEdge > 3 ? 'LOW' : null;
            
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
                modelHomeProb: homeProb,  // Store as percentage (0-100)
                modelAwayProb: awayProb,
                modelDrawProb: drawProb || null,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdge >= 5,
                alertLevel,
                alertNote: analysis.marketIntel?.valueEdge?.label || null,
                bookmaker: 'consensus',
              },
              update: {
                homeOdds: consensus.home,
                awayOdds: consensus.away,
                drawOdds: consensus.draw ?? null,
                modelHomeProb: homeProb,  // Store as percentage (0-100)
                modelAwayProb: awayProb,
                modelDrawProb: drawProb || null,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdge >= 5,
                alertLevel,
                alertNote: analysis.marketIntel?.valueEdge?.label || null,
                updatedAt: new Date(),
              },
            });
            
            stats.oddsSnapshotUpdates++;
            console.log(`[Pre-Analyze] OddsSnapshot updated: ${matchRef} (${bestEdge.toFixed(1)}% edge)`);
          } catch (dbError) {
            console.error(`[Pre-Analyze] OddsSnapshot update failed:`, dbError);
          }
          
          // Create Prediction record for accuracy tracking
          try {
            const probs = analysis.probabilities;
            const matchDate = new Date(event.commence_time);
            
            // Normalize probabilities (AI may return decimals or percentages)
            const normProbs = {
              home: probs.home < 1 ? probs.home : probs.home / 100,
              away: probs.away < 1 ? probs.away : probs.away / 100,
              draw: probs.draw ? (probs.draw < 1 ? probs.draw : probs.draw / 100) : null,
            };
            
            // Calculate implied probabilities from odds
            const impliedProbs = {
              home: 1 / consensus.home,
              away: 1 / consensus.away,
              draw: consensus.draw ? 1 / consensus.draw : null,
            };
            
            // Calculate edges for each outcome
            const edges = {
              home: (normProbs.home - impliedProbs.home) * 100,
              away: (normProbs.away - impliedProbs.away) * 100,
              draw: normProbs.draw && impliedProbs.draw ? (normProbs.draw - impliedProbs.draw) * 100 : -999,
            };
            
            // Find the outcome with the highest edge (not just highest probability)
            let predictedOutcome: 'home' | 'away' | 'draw';
            let predictedProb: number;
            let predictedOdds: number;
            let edge: number;
            
            const maxEdge = Math.max(edges.home, edges.away, edges.draw);
            
            if (edges.draw === maxEdge && normProbs.draw) {
              predictedOutcome = 'draw';
              predictedProb = normProbs.draw;
              predictedOdds = consensus.draw || 0;
              edge = edges.draw;
            } else if (edges.away >= edges.home) {
              predictedOutcome = 'away';
              predictedProb = normProbs.away;
              predictedOdds = consensus.away;
              edge = edges.away;
            } else {
              predictedOutcome = 'home';
              predictedProb = normProbs.home;
              predictedOdds = consensus.home;
              edge = edges.home;
            }
            
            // Conviction: 1-10 scale based on edge magnitude
            // 1-3: Slight edge (0-3% edge)
            // 4-6: Moderate edge (3-7% edge)
            // 7-10: Strong edge (7%+ edge)
            const conviction = Math.min(10, Math.max(1, Math.round(2 + edge * 1.2)));
            
            // Data quality check - require minimum form data
            const homeFormLength = homeFormStr.replace(/-/g, '').length;
            const awayFormLength = awayFormStr.replace(/-/g, '').length;
            const hasMinimumFormData = homeFormLength >= 3 && awayFormLength >= 3;
            
            // Minimum edge threshold based on league performance
            // Underperforming leagues need higher edge to compensate
            const LEAGUE_EDGE_THRESHOLDS: Record<string, number> = {
              'La Liga': 6,        // 0% accuracy - need very high edge
              'Bundesliga': 5,     // 33% accuracy - need higher edge
              'Serie A': 4,        // 50% accuracy - slightly higher
              'Premier League': 3, // 64% accuracy - standard
              'NBA': 3,            // 63% accuracy - standard
              'NHL': 4,            // 50% accuracy - slightly higher
              'NFL': 3,            // Good sample pending
              'Ligue 1': 4,        // No data yet - cautious
            };
            const minEdgeThreshold = LEAGUE_EDGE_THRESHOLDS[sport.league] || 5; // Default 5% for unknown leagues
            
            // Only create predictions when:
            // 1. We have minimum form data (quality gate)
            // 2. Edge exceeds league-specific threshold
            if (!hasMinimumFormData) {
              console.log(`[Pre-Analyze] Skipped: ${matchRef} (insufficient form data: ${homeFormLength}/${awayFormLength})`);
            } else if (edge > minEdgeThreshold) {
              const predictionId = `pre_${sport.key}_${event.id}_${Date.now()}`;
              
              // Store prediction as "Home Win", "Away Win", or "Draw" for validation compatibility
              const predictionText = predictedOutcome === 'home' ? `Home Win - ${event.home_team}` :
                                     predictedOutcome === 'away' ? `Away Win - ${event.away_team}` : 'Draw';
              
              // Get the implied prob for the predicted outcome
              const storedImpliedProb = predictedOutcome === 'home' ? impliedProbs.home :
                                        predictedOutcome === 'away' ? impliedProbs.away :
                                        impliedProbs.draw || 0;
              
              await prisma.prediction.upsert({
                where: { id: predictionId },
                create: {
                  id: predictionId,
                  matchId: event.id,
                  matchName: matchRef,
                  sport: sport.key,
                  league: sport.league,
                  kickoff: matchDate,
                  type: 'MATCH_RESULT',
                  prediction: predictionText,
                  reasoning: analysis.story?.narrative || 'AI model analysis',
                  conviction,
                  odds: predictedOdds,
                  impliedProb: storedImpliedProb * 100,
                  source: 'PRE_ANALYZE',
                  outcome: 'PENDING',
                },
                update: {
                  conviction,
                  odds: predictedOdds,
                  reasoning: analysis.story?.narrative || 'AI model analysis',
                },
              });
              
              stats.predictionsCreated++;
              console.log(`[Pre-Analyze] Prediction: ${matchRef} → ${predictionText} (edge: ${edge.toFixed(1)}%, conv: ${conviction})`);
            } else {
              console.log(`[Pre-Analyze] Skipped: ${matchRef} (edge: ${edge.toFixed(1)}% < ${minEdgeThreshold}% for ${sport.league})`);
            }
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
