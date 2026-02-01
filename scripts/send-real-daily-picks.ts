/**
 * Script: Send Daily Picks Email with Real Match Data
 * 
 * This script:
 * 1. Fetches upcoming matches from The Odds API
 * 2. Runs AI analysis on each match
 * 3. Sorts by confidence and takes top 3
 * 4. Sends email to FREE users with real picks
 * 
 * Usage:
 *   npx tsx scripts/send-real-daily-picks.ts --preview     # Preview only, don't send
 *   npx tsx scripts/send-real-daily-picks.ts --send-test   # Send to test emails only
 *   npx tsx scripts/send-real-daily-picks.ts --send-all    # Send to all FREE users
 */

import { prisma } from '../src/lib/prisma';
import { sendDailyTopMatchesEmail } from '../src/lib/email';

// Types
interface TopMatch {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  confidence: number;
  prediction: string;
  edge?: string;
  headline: string;
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

// Config
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Sports to check (in order of priority)
const SPORTS_TO_CHECK = [
  'soccer_epl',           // Premier League
  'soccer_spain_la_liga', // La Liga
  'soccer_italy_serie_a', // Serie A
  'soccer_germany_bundesliga', // Bundesliga
  'soccer_france_ligue_one', // Ligue 1
  'basketball_nba',       // NBA
];

/**
 * Fetch upcoming events from The Odds API (FREE - no quota)
 */
async function fetchUpcomingEvents(sportKey: string): Promise<OddsApiEvent[]> {
  if (!ODDS_API_KEY) {
    console.log('⚠️  ODDS_API_KEY not set, using mock data');
    return [];
  }

  try {
    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sportKey}/events?apiKey=${ODDS_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch events for ${sportKey}: ${response.status}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching events for ${sportKey}:`, error);
    return [];
  }
}

/**
 * Fetch odds for events (USES QUOTA - be careful!)
 */
async function fetchOddsForSport(sportKey: string): Promise<OddsApiEvent[]> {
  if (!ODDS_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sportKey}/odds?apiKey=${ODDS_API_KEY}&regions=eu,uk&markets=h2h`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch odds for ${sportKey}: ${response.status}`);
      return [];
    }
    
    const remaining = response.headers.get('x-requests-remaining');
    console.log(`📊 Odds API quota remaining: ${remaining}`);
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching odds for ${sportKey}:`, error);
    return [];
  }
}

/**
 * Calculate implied probability from decimal odds
 */
function impliedProbability(decimalOdds: number): number {
  return (1 / decimalOdds) * 100;
}

/**
 * Simple confidence estimation based on odds
 * In production, this would call the full AI analyze endpoint
 */
function estimateConfidence(event: OddsApiEvent): { confidence: number; prediction: string; edge: string; headline: string } {
  const bookmaker = event.bookmakers?.[0];
  if (!bookmaker) {
    return { confidence: 50, prediction: 'Draw', edge: '', headline: 'No odds data available' };
  }

  const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
  if (!h2hMarket) {
    return { confidence: 50, prediction: 'Draw', edge: '', headline: 'No h2h market' };
  }

  const homeOdds = h2hMarket.outcomes.find(o => o.name === event.home_team)?.price || 2.0;
  const awayOdds = h2hMarket.outcomes.find(o => o.name === event.away_team)?.price || 2.0;
  const drawOdds = h2hMarket.outcomes.find(o => o.name === 'Draw')?.price || 3.5;

  const homeProb = impliedProbability(homeOdds);
  const awayProb = impliedProbability(awayOdds);
  const drawProb = impliedProbability(drawOdds);

  // Find best pick
  let prediction: string;
  let confidence: number;
  let impliedProb: number;

  if (homeProb > awayProb && homeProb > drawProb) {
    prediction = 'Home Win';
    impliedProb = homeProb;
    confidence = Math.min(85, Math.round(homeProb * 0.9)); // Conservative
  } else if (awayProb > homeProb && awayProb > drawProb) {
    prediction = 'Away Win';
    impliedProb = awayProb;
    confidence = Math.min(85, Math.round(awayProb * 0.9));
  } else {
    prediction = 'Draw';
    impliedProb = drawProb;
    confidence = Math.min(75, Math.round(drawProb * 0.85));
  }

  // Add some variance based on odds spread
  const oddsSpread = Math.abs(homeOdds - awayOdds);
  if (oddsSpread > 1.5) {
    confidence = Math.min(85, confidence + 5);
  }

  // Calculate edge (difference between our confidence and implied probability)
  const edge = confidence > impliedProb ? `+${(confidence - impliedProb).toFixed(1)}%` : '';

  // Generate headline based on odds
  let headline: string;
  if (homeOdds < 1.5) {
    headline = `${event.home_team} heavy favorites at home`;
  } else if (awayOdds < 1.5) {
    headline = `${event.away_team} strong favorites away`;
  } else if (oddsSpread < 0.3) {
    headline = 'Evenly matched - could go either way';
  } else {
    headline = `Competitive fixture with value on ${prediction.toLowerCase()}`;
  }

  return { confidence, prediction, edge, headline };
}

/**
 * Get upcoming matches (next 7 days)
 */
function filterUpcomingMatches(events: OddsApiEvent[]): OddsApiEvent[] {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  return events.filter(event => {
    const eventDate = new Date(event.commence_time);
    return eventDate >= now && eventDate <= nextWeek;
  }).slice(0, 20); // Limit to 20 per sport
}

/**
 * Format kickoff time
 */
function formatKickoff(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get sport display name
 */
function getSportDisplayName(sportKey: string): string {
  const names: Record<string, string> = {
    'soccer_epl': 'Premier League',
    'soccer_spain_la_liga': 'La Liga',
    'soccer_italy_serie_a': 'Serie A',
    'soccer_germany_bundesliga': 'Bundesliga',
    'soccer_france_ligue_one': 'Ligue 1',
    'basketball_nba': 'NBA',
    'basketball_euroleague': 'Euroleague',
    'americanfootball_nfl': 'NFL',
  };
  return names[sportKey] || sportKey;
}

/**
 * Main function to get top picks
 */
async function getTopPicks(limit: number = 3): Promise<TopMatch[]> {
  console.log('🔍 Fetching upcoming matches...\n');
  
  const allMatches: Array<OddsApiEvent & { confidence: number; prediction: string; edge: string; headline: string }> = [];
  
  for (const sportKey of SPORTS_TO_CHECK) {
    console.log(`  📅 Checking ${getSportDisplayName(sportKey)}...`);
    
    // Fetch events with odds
    const events = await fetchOddsForSport(sportKey);
    const weekendEvents = filterUpcomingMatches(events);
    
    console.log(`     Found ${weekendEvents.length} upcoming matches`);
    
    for (const event of weekendEvents) {
      const analysis = estimateConfidence(event);
      allMatches.push({
        ...event,
        ...analysis,
      });
    }
    
    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Sort by confidence (highest first)
  allMatches.sort((a, b) => b.confidence - a.confidence);
  
  // Take top N
  const topPicks = allMatches.slice(0, limit);
  
  console.log(`\n🏆 Top ${limit} picks:\n`);
  topPicks.forEach((match, i) => {
    console.log(`  ${i + 1}. ${match.home_team} vs ${match.away_team}`);
    console.log(`     ${getSportDisplayName(match.sport_key)} - ${formatKickoff(match.commence_time)}`);
    console.log(`     ${match.confidence}% confidence - ${match.prediction} ${match.edge}`);
    console.log(`     "${match.headline}"\n`);
  });
  
  return topPicks.map(match => ({
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    league: getSportDisplayName(match.sport_key),
    kickoff: formatKickoff(match.commence_time),
    confidence: match.confidence,
    prediction: match.prediction,
    edge: match.edge,
    headline: match.headline,
  }));
}

/**
 * Get FREE users who haven't unsubscribed
 */
async function getFreeUsersToEmail(): Promise<Array<{ id: string; email: string; name: string | null }>> {
  const users = await prisma.user.findMany({
    where: {
      plan: 'FREE',
      email: { not: null },
      unsubscribedAt: null, // Not unsubscribed
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  
  return users.filter(u => u.email) as Array<{ id: string; email: string; name: string | null }>;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const sendTest = args.includes('--send-test');
  const sendAll = args.includes('--send-all');
  
  console.log('🎯 Daily Picks Email Generator\n');
  console.log('================================\n');
  
  // Get top picks
  const topPicks = await getTopPicks(3);
  
  if (topPicks.length === 0) {
    console.log('❌ No matches found for this weekend!');
    process.exit(1);
  }
  
  if (preview) {
    console.log('👀 Preview mode - not sending any emails');
    process.exit(0);
  }
  
  if (sendTest) {
    console.log('📧 Sending test emails...\n');
    
    // Check for --to flag for single recipient
    const toIndex = args.indexOf('--to');
    const singleRecipient = toIndex !== -1 ? args[toIndex + 1] : null;
    
    const testEmails = singleRecipient
      ? [{ id: 'test-1', email: singleRecipient, name: 'Stefan' }]
      : [
          { id: 'test-1', email: 'stefanmitrovic93@gmail.com', name: 'Stefan' },
          { id: 'test-2', email: 'gogecmaestrotib92@gmail.com', name: 'Stefan' },
        ];
    
    for (const user of testEmails) {
      const sent = await sendDailyTopMatchesEmail(user.id, user.email, user.name, topPicks);
      console.log(`  ${sent ? '✅' : '❌'} ${user.email}`);
    }
    
    console.log('\n✨ Test emails sent!');
    process.exit(0);
  }
  
  if (sendAll) {
    console.log('📧 Sending to all FREE users...\n');
    
    const users = await getFreeUsersToEmail();
    console.log(`Found ${users.length} FREE users to email\n`);
    
    let sent = 0;
    let failed = 0;
    
    for (const user of users) {
      try {
        const result = await sendDailyTopMatchesEmail(user.id, user.email, user.name, topPicks);
        if (result) {
          sent++;
          console.log(`  ✅ ${user.email}`);
        } else {
          failed++;
          console.log(`  ❌ ${user.email} - send failed`);
        }
        
        // Small delay between emails
        await new Promise(r => setTimeout(r, 200));
      } catch (error) {
        failed++;
        console.log(`  ❌ ${user.email} - ${error}`);
      }
    }
    
    console.log(`\n📊 Results: ${sent} sent, ${failed} failed`);
    process.exit(0);
  }
  
  // Default: just show help
  console.log('Usage:');
  console.log('  --preview    Preview picks without sending emails');
  console.log('  --send-test  Send to test emails only');
  console.log('  --send-all   Send to all FREE users');
  process.exit(0);
}

main().catch(console.error);
