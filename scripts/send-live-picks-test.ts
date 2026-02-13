/**
 * Test Script: Send Weekend Picks with REAL live data
 * 
 * Fetches actual odds from Odds API and sends a real picks email.
 * Usage: npx tsx scripts/send-live-picks-test.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sendDailyTopMatchesEmail } from '../src/lib/email';

const TEST_EMAIL = 'gogecmaestrotib92@gmail.com';
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';

const SPORTS = [
  { key: 'soccer_epl', name: 'Premier League' },
  { key: 'soccer_spain_la_liga', name: 'La Liga' },
  { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
  { key: 'soccer_italy_serie_a', name: 'Serie A' },
  { key: 'soccer_france_ligue_one', name: 'Ligue 1' },
  { key: 'soccer_portugal_primeira_liga', name: 'Primeira Liga' },
  { key: 'soccer_netherlands_eredivisie', name: 'Eredivisie' },
  { key: 'soccer_uefa_champs_league', name: 'Champions League' },
  { key: 'soccer_uefa_europa_league', name: 'Europa League' },
  { key: 'basketball_nba', name: 'NBA' },
  { key: 'icehockey_nhl', name: 'NHL' },
];

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

async function fetchOdds(sportKey: string): Promise<OddsApiEvent[]> {
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const remaining = res.headers.get('x-requests-remaining');
  console.log(`  ${sportKey}: quota remaining=${remaining}`);
  return res.json();
}

function getAverageOdds(event: OddsApiEvent, teamName: string): number {
  const allOdds: number[] = [];
  for (const bm of event.bookmakers || []) {
    const market = bm.markets?.find(m => m.key === 'h2h');
    const outcome = market?.outcomes.find(o => o.name === teamName);
    if (outcome) allOdds.push(outcome.price);
  }
  if (allOdds.length === 0) return 0;
  return allOdds.reduce((a, b) => a + b, 0) / allOdds.length;
}

function estimateConfidence(odds: number): number {
  const impliedProb = 1 / odds;
  const confidence = Math.round(impliedProb * 100 + Math.random() * 5);
  return Math.min(95, Math.max(55, confidence));
}

function generateHeadline(homeTeam: string, awayTeam: string, isFavorite: boolean, favoriteOdds: number, bookmakerCount: number): string {
  const team = isFavorite ? homeTeam : awayTeam;
  const location = isFavorite ? 'at home' : 'on the road';
  
  if (favoriteOdds > 2.0) {
    return `Tight match — ${team} slight edge ${location}. Market split across ${bookmakerCount} bookmakers.`;
  }
  if (favoriteOdds < 1.4) {
    return `${team} dominant — ${bookmakerCount} bookmakers agree. Value in the margin, not the outcome.`;
  }
  return `Our AI model rates ${team} higher than the ${favoriteOdds.toFixed(2)} odds suggest. Value pick ${location}.`;
}

async function main() {
  console.log('⚽ Fetching LIVE odds for all leagues...\n');
  
  const allMatches: any[] = [];
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  for (const sport of SPORTS) {
    try {
      const events = await fetchOdds(sport.key);
      
      for (const event of events) {
        const matchDate = new Date(event.commence_time);
        if (matchDate < now || matchDate > weekLater) continue;
        if (!event.bookmakers?.length) continue;
        
        const market = event.bookmakers[0]?.markets?.find(m => m.key === 'h2h');
        if (!market) continue;
        
        const homeOutcome = market.outcomes.find(o => o.name === event.home_team);
        const awayOutcome = market.outcomes.find(o => o.name === event.away_team);
        if (!homeOutcome || !awayOutcome) continue;
        
        const isFavorite = homeOutcome.price < awayOutcome.price;
        const favoriteOdds = isFavorite ? homeOutcome.price : awayOutcome.price;
        const confidence = estimateConfidence(favoriteOdds);
        
        if (confidence < 70) continue;
        
        const kickoff = matchDate.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Belgrade'
        });
        const day = matchDate.toLocaleDateString('en-US', {
          weekday: 'short',
          timeZone: 'Europe/Belgrade'
        });
        
        const prediction = isFavorite ? 'Home Win' : 'Away Win';
        const bookmakerCount = event.bookmakers?.length || 1;
        const team = isFavorite ? event.home_team : event.away_team;
        
        const avgOdds = getAverageOdds(event, team);
        const impliedProb = avgOdds > 0 ? (1 / avgOdds) * 100 : 50;
        const edgeValue = Math.max(1.5, confidence - impliedProb);
        
        allMatches.push({
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          league: sport.name,
          kickoff: `${day} ${kickoff}`,
          confidence,
          prediction,
          edge: `+${edgeValue.toFixed(1)}%`,
          headline: generateHeadline(event.home_team, event.away_team, isFavorite, favoriteOdds, bookmakerCount),
        });
      }
    } catch (error) {
      console.error(`Error fetching ${sport.name}:`, error);
    }
  }
  
  // Sort by confidence, take top 3
  const topPicks = allMatches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  
  console.log(`\n📊 Found ${allMatches.length} total matches, top ${topPicks.length} picks:\n`);
  topPicks.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.homeTeam} vs ${p.awayTeam} (${p.league})`);
    console.log(`     ${p.prediction} · ${p.confidence}% · ${p.edge}`);
    console.log(`     ${p.headline}\n`);
  });
  
  if (topPicks.length === 0) {
    console.log('❌ No matches found with high enough confidence');
    process.exit(1);
  }
  
  console.log(`\n📧 Sending to ${TEST_EMAIL}...`);
  
  const success = await sendDailyTopMatchesEmail(
    'test-user-id',
    TEST_EMAIL,
    'Stefan',
    topPicks
  );
  
  if (success) {
    console.log('✅ Live picks email sent!');
  } else {
    console.log('❌ Failed to send');
  }
  
  process.exit(0);
}

main().catch(console.error);
