/**
 * Backlink Scout - Automated Tool Discovery & Outreach
 * 
 * Discovers sports betting/analytics tools via:
 * 1. Google Custom Search API (most reliable)
 * 2. Curated seed list with expansion
 * 3. SimilarWeb-style discovery from known tools
 * 
 * Then extracts content, generates reviews, finds emails, sends outreach.
 * 
 * Required ENV vars:
 * - GOOGLE_SEARCH_API_KEY - Google Cloud Console API key
 * - GOOGLE_SEARCH_CX - Custom Search Engine ID
 * - OPENAI_API_KEY - For review generation
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { marked } from 'marked';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Delays to avoid rate limiting (milliseconds)
  MIN_DELAY: 2000,
  MAX_DELAY: 5000,
  
  // Content extraction
  MAX_WORDS: 5000,
  
  // Google Custom Search
  GOOGLE_SEARCH_QUERIES: [
    'sports betting analytics tool',
    'betting odds tracker app',
    'sports betting software',
    'handicapping software',
    'fantasy sports analytics',
    'sports prediction tool',
    'betting value finder',
    'odds comparison tool',
    'expected value betting calculator',
    'sports betting roi tracker',
  ],
  
  // Seed list of known tools (curated, 60+ tools across categories)
  SEED_TOOLS: [
    // === ODDS COMPARISON ===
    { name: 'Oddspedia', url: 'https://oddspedia.com', category: 'odds-comparison' },
    { name: 'OddsChecker', url: 'https://oddschecker.com', category: 'odds-comparison' },
    { name: 'OddsPortal', url: 'https://oddsportal.com', category: 'odds-comparison' },
    { name: 'Smarkets', url: 'https://smarkets.com', category: 'odds-comparison' },
    { name: 'BetBrain', url: 'https://betbrain.com', category: 'odds-comparison' },
    { name: 'Oddschecker US', url: 'https://oddschecker.com/us', category: 'odds-comparison' },
    
    // === ANALYTICS & PICKS ===
    { name: 'Action Network', url: 'https://actionnetwork.com', category: 'analytics' },
    { name: 'BettingPros', url: 'https://bettingpros.com', category: 'analytics' },
    { name: 'The Lines', url: 'https://thelines.com', category: 'analytics' },
    { name: 'SharpSide', url: 'https://sharpside.com', category: 'analytics' },
    { name: 'Unabated', url: 'https://unabated.com', category: 'analytics' },
    { name: 'NumberFire', url: 'https://numberfire.com', category: 'analytics' },
    { name: 'Covers', url: 'https://covers.com', category: 'analytics' },
    { name: 'BetQL', url: 'https://betql.co', category: 'analytics' },
    { name: 'Dimers', url: 'https://dimers.com', category: 'analytics' },
    { name: 'Pikkit', url: 'https://pikkit.com', category: 'analytics' },
    { name: 'Sportsgrid', url: 'https://sportsgrid.com', category: 'analytics' },
    { name: 'Doc Sports', url: 'https://docsports.com', category: 'analytics' },
    { name: 'Wager Talk', url: 'https://wagertalk.com', category: 'analytics' },
    { name: 'Pregame', url: 'https://pregame.com', category: 'analytics' },
    { name: 'Sports Insights', url: 'https://sportsinsights.com', category: 'analytics' },
    { name: 'Killer Sports', url: 'https://killersports.com', category: 'analytics' },
    
    // === ARBITRAGE & VALUE ===
    { name: 'OddsJam', url: 'https://oddsjam.com', category: 'arbitrage' },
    { name: 'RebelBetting', url: 'https://rebelbetting.com', category: 'arbitrage' },
    { name: 'BetBurger', url: 'https://betburger.com', category: 'arbitrage' },
    { name: 'Surebet', url: 'https://surebet.com', category: 'arbitrage' },
    { name: 'BetSlayer', url: 'https://betslayer.com', category: 'arbitrage' },
    { name: 'Trademate Sports', url: 'https://tradematesports.com', category: 'arbitrage' },
    { name: 'Bet Dynamo', url: 'https://betdynamo.com', category: 'arbitrage' },
    { name: 'Sharp Sports', url: 'https://sharpsports.io', category: 'arbitrage' },
    { name: 'Proton Bets', url: 'https://protonbets.com', category: 'arbitrage' },
    
    // === PREDICTION & MODELS ===
    { name: 'PredictIt', url: 'https://predictit.org', category: 'prediction' },
    { name: 'FiveThirtyEight', url: 'https://projects.fivethirtyeight.com/sports', category: 'prediction' },
    { name: 'Massey Ratings', url: 'https://masseyratings.com', category: 'prediction' },
    { name: 'TeamRankings', url: 'https://teamrankings.com', category: 'prediction' },
    { name: 'KenPom', url: 'https://kenpom.com', category: 'prediction' },
    { name: 'Sagarin Ratings', url: 'https://sagarin.com', category: 'prediction' },
    { name: 'Accuscore', url: 'https://accuscore.com', category: 'prediction' },
    { name: 'Polymarket', url: 'https://polymarket.com', category: 'prediction' },
    { name: 'Metaculus', url: 'https://metaculus.com', category: 'prediction' },
    
    // === FANTASY SPORTS ===
    { name: 'FantasyPros', url: 'https://fantasypros.com', category: 'fantasy' },
    { name: 'RotoGrinders', url: 'https://rotogrinders.com', category: 'fantasy' },
    { name: 'FantasyLabs', url: 'https://fantasylabs.com', category: 'fantasy' },
    { name: 'Daily Fantasy Nerd', url: 'https://dailyfantasynerd.com', category: 'fantasy' },
    { name: 'Awesemo', url: 'https://awesemo.com', category: 'fantasy' },
    { name: 'RotoWire', url: 'https://rotowire.com', category: 'fantasy' },
    { name: 'Fantasy Cruncher', url: 'https://fantasycruncher.com', category: 'fantasy' },
    { name: 'SaberSim', url: 'https://sabersim.com', category: 'fantasy' },
    
    // === LIVESCORES & DATA ===
    { name: 'FlashScore', url: 'https://flashscore.com', category: 'livescore' },
    { name: 'Sofascore', url: 'https://sofascore.com', category: 'livescore' },
    { name: 'LiveScore', url: 'https://livescore.com', category: 'livescore' },
    { name: 'ESPN', url: 'https://espn.com', category: 'livescore' },
    { name: 'FBref', url: 'https://fbref.com', category: 'data' },
    { name: 'Transfermarkt', url: 'https://transfermarkt.com', category: 'data' },
    { name: 'Understat', url: 'https://understat.com', category: 'data' },
    { name: 'WhoScored', url: 'https://whoscored.com', category: 'data' },
    { name: 'StatsBomb', url: 'https://statsbomb.com', category: 'data' },
    { name: 'Football Reference', url: 'https://pro-football-reference.com', category: 'data' },
    { name: 'Basketball Reference', url: 'https://basketball-reference.com', category: 'data' },
    { name: 'Hockey Reference', url: 'https://hockey-reference.com', category: 'data' },
    { name: 'Baseball Reference', url: 'https://baseball-reference.com', category: 'data' },
    
    // === NEWS & MEDIA ===
    { name: 'VSiN', url: 'https://vsin.com', category: 'news' },
    { name: 'The Athletic', url: 'https://theathletic.com', category: 'news' },
    { name: 'Rotoballer', url: 'https://rotoballer.com', category: 'news' },
    { name: 'Sports Handle', url: 'https://sportshandle.com', category: 'news' },
    { name: 'Legal Sports Report', url: 'https://legalsportsreport.com', category: 'news' },
    { name: 'EGR Global', url: 'https://egr.global', category: 'news' },
    
    // === REVIEWS & GUIDES ===
    { name: 'Sportsbook Review', url: 'https://sportsbookreview.com', category: 'reviews' },
    { name: 'Picks.co', url: 'https://picks.co', category: 'reviews' },
    { name: 'BetMines', url: 'https://betmines.com', category: 'reviews' },
    { name: 'Bookies.com', url: 'https://bookies.com', category: 'reviews' },
    { name: 'Betting USA', url: 'https://bettingusa.com', category: 'reviews' },
    { name: 'Bonus.com', url: 'https://bonus.com', category: 'reviews' },
    
    // === ODDS DATA PROVIDERS ===
    { name: 'DonBest', url: 'https://donbest.com', category: 'odds-data' },
    { name: 'The Odds API', url: 'https://the-odds-api.com', category: 'odds-data' },
    { name: 'Sportradar', url: 'https://sportradar.com', category: 'odds-data' },
    { name: 'Genius Sports', url: 'https://geniussports.com', category: 'odds-data' },
    { name: 'BetRadar', url: 'https://betradar.com', category: 'odds-data' },
    { name: 'Betgenius', url: 'https://betgenius.com', category: 'odds-data' },
    
    // === TOOLS & CALCULATORS ===
    { name: 'Bet Calculator', url: 'https://aceodds.com/bet-calculator', category: 'tools' },
    { name: 'Odds Converter', url: 'https://oddsconverter.co.uk', category: 'tools' },
    { name: 'Betting Tools', url: 'https://bettingtools.co', category: 'tools' },
    { name: 'Smart Betting Club', url: 'https://smartbettingclub.com', category: 'tools' },
    
    // === POSITIVE EV TOOLS (from sportsbettingtools.io) ===
    { name: 'OddsView', url: 'https://oddsview.com', category: 'positive-ev' },
    { name: 'OddsShopper', url: 'https://oddsshopper.com', category: 'positive-ev' },
    { name: 'Sharp.App', url: 'https://sharp.app', category: 'positive-ev' },
    { name: 'Prop Professor', url: 'https://propprofessor.com', category: 'positive-ev' },
    { name: 'Optimal.Bet', url: 'https://optimal.bet', category: 'positive-ev' },
    { name: 'BeeBettor', url: 'https://beebettor.com', category: 'positive-ev' },
    { name: 'GamedayMath', url: 'https://gamedaymath.com', category: 'positive-ev' },
    { name: '8rain Station', url: 'https://8rainstation.com', category: 'positive-ev' },
    { name: 'Pinnacle Odds Dropper', url: 'https://pinnacleoddsdropper.com', category: 'positive-ev' },
    { name: 'Bettor Odds', url: 'https://bettorodds.com', category: 'positive-ev' },
    { name: 'Doink Sports', url: 'https://doinksports.com', category: 'positive-ev' },
    
    // === ARBITRAGE & MATCHED BETTING (from sportsbettingtools.io) ===
    { name: 'Dark Horse Odds', url: 'https://darkhorseodds.com', category: 'arbitrage' },
    { name: 'DoubleDown Arbs', url: 'https://doubledownarbs.com', category: 'arbitrage' },
    { name: 'OddsPulse', url: 'https://oddspulse.com', category: 'arbitrage' },
    { name: 'SureBet', url: 'https://surebet.com', category: 'arbitrage' },
    { name: 'OddsPotato', url: 'https://oddspotato.com', category: 'arbitrage' },
    { name: 'Pick the Odds', url: 'https://picktheodds.app', category: 'arbitrage' },
    
    // === RESEARCH TOOLS (from sportsbettingtools.io) ===
    { name: 'Hall of Fame Bets', url: 'https://hofbets.com', category: 'research' },
    { name: 'Props.Cash', url: 'https://props.cash', category: 'research' },
    { name: 'Rithmm', url: 'https://rithmm.com', category: 'research' },
    { name: 'Solved Sports', url: 'https://solvedsports.com', category: 'research' },
    { name: 'Parlay Science', url: 'https://parlayscience.com', category: 'research' },
    { name: 'FTN Betting', url: 'https://ftnfantasy.com/bets', category: 'research' },
    { name: 'DataWise Bets', url: 'https://datawisebets.com', category: 'research' },
    { name: 'Bet Labs', url: 'https://sportsinsights.com/get-bet-labs', category: 'research' },
    { name: 'Ballpark Pal', url: 'https://ballparkpal.com', category: 'research' },
    { name: 'Establish the Run', url: 'https://establishtherun.com', category: 'research' },
    { name: 'Betalytics', url: 'https://betalytics.com', category: 'research' },
    { name: 'EV Analytics', url: 'https://evanalytics.com', category: 'research' },
    { name: 'EdgHouse', url: 'https://edghouse.com', category: 'research' },
    { name: 'Linemate', url: 'https://linemate.io', category: 'research' },
    { name: 'xEP Network', url: 'https://xep.ai', category: 'research' },
    { name: 'Gridiron AI', url: 'https://gridironai.com', category: 'research' },
    { name: 'Basketball Monster', url: 'https://basketballmonster.com', category: 'research' },
    { name: 'The Power Rank', url: 'https://thepowerrank.com', category: 'research' },
    { name: 'Pocket Props', url: 'https://pocketprops.com', category: 'research' },
    { name: 'ShotQualityBets', url: 'https://shotqualitybets.com', category: 'research' },
    { name: 'Outlier.Bet', url: 'https://outlier.bet', category: 'research' },
    
    // === BET TRACKING (from sportsbettingtools.io) ===
    { name: 'BetStamp', url: 'https://betstamp.app', category: 'bet-tracking' },
    { name: 'Juice Reel', url: 'https://juicereel.com', category: 'bet-tracking' },
    { name: 'Sportsbook Scout', url: 'https://sportsbookscout.com', category: 'bet-tracking' },
    { name: 'BetRecaps', url: 'https://betrecaps.com', category: 'bet-tracking' },
    { name: 'Gambly', url: 'https://gambly.com', category: 'bet-tracking' },
    
    // === ODDS SCREEN & DATA (from sportsbettingtools.io) ===
    { name: 'SpankOdds', url: 'https://spankodds.com', category: 'odds-screen' },
    { name: 'OddsLogic', url: 'https://oddslogic.com', category: 'odds-screen' },
    { name: 'SBR Odds', url: 'https://sportsbookreview.com/betting-odds', category: 'odds-screen' },
    { name: 'Metabet', url: 'https://metabet.io', category: 'odds-data' },
    { name: 'OddsJam API', url: 'https://oddsjam.com/odds-api', category: 'odds-data' },
    { name: 'Unabated API', url: 'https://unabated.com/get-unabated-api', category: 'odds-data' },
    
    // === PICKS & CONTENT (from sportsbettingtools.io) ===
    { name: 'RAS Picks', url: 'https://raspicks.com', category: 'picks' },
    { name: 'Juiced Bets', url: 'https://juicedbets.com', category: 'picks' },
    { name: 'Pickswise', url: 'https://pickswise.com', category: 'picks' },
    { name: 'Scores and Odds', url: 'https://scoresandodds.com', category: 'content' },
    
    // === DFS & PROPS (from sportsbettingtools.io) ===
    { name: 'Betr Fantasy', url: 'https://betr.app', category: 'dfs' },
    { name: 'PrizePicks', url: 'https://prizepicks.com', category: 'dfs' },
    { name: 'Underdog Fantasy', url: 'https://underdogfantasy.com', category: 'dfs' },
    { name: 'Vivid Picks', url: 'https://vividpicks.com', category: 'dfs' },
    { name: 'Sleeper Fantasy', url: 'https://sleeper.com', category: 'dfs' },
    
    // === EXCHANGE & SOCIAL (from sportsbettingtools.io) ===
    { name: 'ProphetX', url: 'https://prophetx.com', category: 'exchange' },
    { name: 'NoVig', url: 'https://novig.us', category: 'exchange' },
    { name: 'Sporttrade', url: 'https://getsporttrade.com', category: 'exchange' },
    { name: 'Fliff', url: 'https://getfliff.com', category: 'social' },
    { name: 'Kutt', url: 'https://kutt.com', category: 'social' },
    { name: 'Thrillz', url: 'https://thrillzz.com', category: 'social' },
    { name: 'Rebet', url: 'https://rebet.com', category: 'social' },
    
    // === OTHER TOOLS (from sportsbettingtools.io) ===
    { name: 'PropSwap', url: 'https://propswap.com', category: 'other' },
    { name: 'Vault Sports', url: 'https://vaultsportshq.com', category: 'other' },
  ],
  
  // Skip these domains (big sportsbooks, casinos)
  BLOCKED_DOMAINS: [
    'bet365.com',
    'draftkings.com',
    'fanduel.com',
    'betmgm.com',
    'caesars.com',
    'pointsbet.com',
    'williamhill.com',
    'paddypower.com',
    'betfair.com',
    'unibet.com',
    '888sport.com',
    'bovada.lv',
    'betonline.ag',
    'pinnacle.com',
    'betway.com',
    'stake.com',
    // Casinos
    'casino',
    'poker',
    'slots',
    'blackjack',
    'roulette',
    // Social/General
    'reddit.com',
    'twitter.com',
    'facebook.com',
    'youtube.com',
    'linkedin.com',
    'instagram.com',
    'medium.com',
    'wikipedia.org',
    'sportbotai.com', // ourselves
  ],
};

// Rotating user agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomDelay(): number {
  return Math.floor(Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY + 1)) + CONFIG.MIN_DELAY;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isBlockedDomain(url: string): boolean {
  const domain = url.toLowerCase();
  return CONFIG.BLOCKED_DOMAINS.some(blocked => domain.includes(blocked));
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ============================================
// PRODUCT HUNT API (Official GraphQL)
// ============================================

interface DiscoveredTool {
  name: string;
  url: string;
  description: string;
  logo?: string;
  sourceUrl: string;
  source: string;
}

/**
 * Fetch tools from Product Hunt using official GraphQL API
 * Uses Developer Token for authentication
 * 
 * Note: PH API is limited - we get recent posts and hope to find relevant ones.
 * For sports betting, the curated seed list is more reliable.
 */
export async function scrapeProductHunt(searchTerm: string): Promise<DiscoveredTool[]> {
  const tools: DiscoveredTool[] = [];
  
  const token = process.env.PRODUCTHUNT_TOKEN;
  
  if (!token) {
    console.log('[BacklinkScout] Product Hunt not configured (PRODUCTHUNT_TOKEN)');
    return tools;
  }
  
  try {
    // Get recent posts - PH API is limited, no search or topic filtering via API
    const query = `
      query {
        posts(first: 20) {
          edges {
            node {
              name
              tagline
              slug
              website
            }
          }
        }
      }
    `;
    
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      console.error(`[BacklinkScout] Product Hunt API returned ${response.status}`);
      return tools;
    }
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('[BacklinkScout] Product Hunt GraphQL errors:', data.errors);
      return tools;
    }
    
    const posts = data?.data?.posts?.edges || [];
    const searchLower = searchTerm.toLowerCase();
    const keywords = ['sport', 'bet', 'odds', 'fantasy', 'analytic', 'predict', 'track', 'score'];
    
    for (const edge of posts) {
      const post = edge.node;
      const websiteUrl = post.website;
      const name = (post.name || '').toLowerCase();
      const tagline = (post.tagline || '').toLowerCase();
      
      // Filter for relevant posts
      const isRelevant = keywords.some(kw => name.includes(kw) || tagline.includes(kw));
      
      if (websiteUrl && isRelevant && !isBlockedDomain(websiteUrl)) {
        tools.push({
          name: post.name || 'Unknown',
          url: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
          description: post.tagline || '',
          sourceUrl: `https://www.producthunt.com/posts/${post.slug}`,
          source: 'producthunt',
        });
      }
    }
    
    console.log(`[BacklinkScout] Found ${tools.length} relevant tools from ${posts.length} PH posts`);
    
  } catch (error) {
    console.error(`[BacklinkScout] Product Hunt API error:`, error);
  }
  
  return tools;
}

// ============================================
// ALTERNATIVETO SCRAPER
// ============================================

export async function scrapeAlternativeTo(searchTerm: string): Promise<DiscoveredTool[]> {
  const tools: DiscoveredTool[] = [];
  
  try {
    const searchUrl = `https://alternativeto.net/browse/search/?q=${encodeURIComponent(searchTerm)}`;
    
    await delay(getRandomDelay()); // Respect rate limits
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      console.error(`[BacklinkScout] AlternativeTo returned ${response.status}`);
      return tools;
    }
    
    const html = await response.text();
    
    // Parse results - AlternativeTo uses server-side rendering
    // Look for app cards with links
    const appMatches = Array.from(html.matchAll(/<a[^>]*href="\/software\/([^"\/]+)\/"[^>]*class="[^"]*app-name[^"]*"[^>]*>([^<]+)<\/a>/gi));
    
    for (const match of appMatches) {
      const slug = match[1];
      const name = match[2].trim();
      const sourceUrl = `https://alternativeto.net/software/${slug}/`;
      
      tools.push({
        name,
        url: sourceUrl, // Will extract actual URL from app page
        description: '',
        sourceUrl,
        source: 'alternativeto',
      });
    }
    
    console.log(`[BacklinkScout] Found ${tools.length} tools for "${searchTerm}" on AlternativeTo`);
    
  } catch (error) {
    console.error(`[BacklinkScout] AlternativeTo scrape error:`, error);
  }
  
  return tools;
}

// ============================================
// BETALIST SCRAPER (Startup launches)
// ============================================

export async function scrapeBetaList(searchTerm: string): Promise<DiscoveredTool[]> {
  const tools: DiscoveredTool[] = [];
  
  try {
    const searchUrl = `https://betalist.com/search?q=${encodeURIComponent(searchTerm)}`;
    
    await delay(getRandomDelay());
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) return tools;
    
    const html = await response.text();
    
    // BetaList structure: look for startup cards
    // Note: Using [\s\S] instead of . with 's' flag for ES2017 compatibility
    const startupMatches = Array.from(html.matchAll(/<a[^>]*href="\/startups\/([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi));
    
    for (const match of startupMatches) {
      const slug = match[1];
      const name = match[2].trim();
      
      tools.push({
        name,
        url: `https://betalist.com/startups/${slug}`,
        description: '',
        sourceUrl: `https://betalist.com/startups/${slug}`,
        source: 'betalist',
      });
    }
    
    console.log(`[BacklinkScout] Found ${tools.length} tools for "${searchTerm}" on BetaList`);
    
  } catch (error) {
    console.error(`[BacklinkScout] BetaList scrape error:`, error);
  }
  
  return tools;
}

// ============================================
// CONTENT EXTRACTION (from tool's website)
// ============================================

// ============================================
// SPORTSBETTINGTOOLS.IO SCRAPER (Primary source)
// ============================================

interface SportsBettingTool {
  name: string;
  url: string;
  description: string;
  category?: string;
  pricing?: string;
}

/**
 * Scrape sportsbettingtools.io for betting tools
 * Uses Puppeteer since the site is JS-rendered (Next.js)
 */
export async function scrapeSportsBettingTools(): Promise<DiscoveredTool[]> {
  const tools: DiscoveredTool[] = [];
  
  try {
    // Dynamic import for Puppeteer (heavy dependency)
    let browser;
    try {
      const puppeteer = await import('puppeteer');
      
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (err) {
      console.error('[BacklinkScout] Puppeteer not available:', err);
      return tools;
    }
    
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    
    console.log('[BacklinkScout] Loading sportsbettingtools.io...');
    await page.goto('https://sportsbettingtools.io', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Wait for the tool cards to load
    await page.waitForSelector('.grid', { timeout: 15000 });
    
    // Wait a bit more for all cards to render
    await delay(3000);
    
    // Extract tool data from the page - improved extraction
    const toolsData = await page.evaluate(() => {
      const results: { name: string; url: string; description: string }[] = [];
      const seenNames = new Set<string>();
      
      // Find all cards in the grid
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      
      for (const card of cards) {
        // Get the tool name from heading
        const nameEl = card.querySelector('h2, h3, h4');
        const name = nameEl?.textContent?.trim() || '';
        
        if (!name || seenNames.has(name)) continue;
        
        // Find the "Visit Website" link (the actual tool URL)
        const links = Array.from(card.querySelectorAll('a[href]'));
        let toolUrl = '';
        
        for (const link of links) {
          const href = (link as HTMLAnchorElement).href;
          const text = link.textContent?.toLowerCase() || '';
          
          // Prioritize "Visit Website" links
          if (text.includes('visit website') || text.includes('visit →')) {
            toolUrl = href;
            break;
          }
          
          // Otherwise take first external non-app-store link
          if (!toolUrl && 
              href.startsWith('http') && 
              !href.includes('sportsbettingtools.io') &&
              !href.includes('apps.apple.com') &&
              !href.includes('play.google.com') &&
              !href.includes('discord.com') &&
              !href.includes('discord.gg')) {
            toolUrl = href;
          }
        }
        
        if (!toolUrl) continue;
        
        // Get description
        const descEl = card.querySelector('p');
        const description = descEl?.textContent?.trim().slice(0, 300) || '';
        
        seenNames.add(name);
        results.push({ name, url: toolUrl, description });
      }
      
      return results;
    });
    
    console.log(`[BacklinkScout] Found ${toolsData.length} unique tools on sportsbettingtools.io`);
    
    // Convert to DiscoveredTool format
    for (const tool of toolsData) {
      if (!isBlockedDomain(tool.url)) {
        tools.push({
          name: tool.name,
          url: tool.url,
          description: tool.description,
          sourceUrl: 'https://sportsbettingtools.io',
          source: 'sportsbettingtools',
        });
      }
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('[BacklinkScout] sportsbettingtools.io scrape error:', error);
  }
  
  return tools;
}

/**
 * Extract text content from a website
 * Cleans HTML and returns first N words
 */
export async function extractWebsiteContent(url: string): Promise<{ content: string; wordCount: number }> {
  try {
    await delay(getRandomDelay());
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Remove script, style, nav, footer, header tags
    let cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    
    // Extract text from remaining HTML
    cleaned = cleaned
      .replace(/<[^>]+>/g, ' ')  // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
    
    // Get first N words
    const words = cleaned.split(' ').filter(w => w.length > 0);
    const limitedWords = words.slice(0, CONFIG.MAX_WORDS);
    const content = limitedWords.join(' ');
    
    return {
      content,
      wordCount: limitedWords.length,
    };
    
  } catch (error) {
    console.error(`[BacklinkScout] Failed to extract content from ${url}:`, error);
    return { content: '', wordCount: 0 };
  }
}

// ============================================
// EMAIL FINDER
// ============================================

/**
 * Find contact email from a website
 * Checks multiple pages, social media links, and falls back to Perplexity search
 */
export async function findContactEmail(baseUrl: string): Promise<{ email: string | null; source: string }> {
  // Clean URL
  const cleanUrl = baseUrl.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/$/, '');
  
  // Expanded list of pages to check
  const pagesToCheck = [
    cleanUrl,
    `${cleanUrl}/contact`,
    `${cleanUrl}/contact-us`,
    `${cleanUrl}/contactus`,
    `${cleanUrl}/about`,
    `${cleanUrl}/about-us`,
    `${cleanUrl}/aboutus`,
    `${cleanUrl}/team`,
    `${cleanUrl}/our-team`,
    `${cleanUrl}/support`,
    `${cleanUrl}/help`,
    `${cleanUrl}/faq`,
    `${cleanUrl}/legal`,
    `${cleanUrl}/privacy`,
    `${cleanUrl}/terms`,
    `${cleanUrl}/footer`, // Some SPAs
  ];
  
  // Common email patterns to look for
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  // Priority order for email types
  const emailPriority = [
    /^(hello|hi|contact|info|support|team|help|press|media|partnerships|partner|business|collab)@/i,  // Best
    /^[a-z]+@/i,                                  // Single name (e.g., john@)
    /.*/,                                          // Any
  ];
  
  // Blacklist for emails we don't want
  const isBlacklisted = (email: string) => {
    const lower = email.toLowerCase();
    return lower.includes('example.com') ||
           lower.includes('yourdomain') ||
           lower.includes('email.com') ||
           lower.includes('test@') ||
           lower.includes('noreply') ||
           lower.includes('no-reply') ||
           lower.includes('donotreply') ||
           lower.includes('do-not-reply') ||
           lower.includes('unsubscribe') ||
           lower.includes('notifications') ||
           lower.includes('mailer-daemon') ||
           lower.includes('postmaster') ||
           lower.includes('.png') ||
           lower.includes('.jpg') ||
           lower.includes('.jpeg') ||
           lower.includes('.gif') ||
           lower.includes('.svg') ||
           lower.includes('.webp') ||
           lower.endsWith('.js') ||
           lower.endsWith('.css') ||
           lower.endsWith('.map') ||
           lower.includes('sentry.io') ||
           lower.includes('google.com') ||
           lower.includes('facebook.com') ||
           lower.includes('twitter.com') ||
           lower.includes('github.com') ||
           lower.includes('stripe.com') ||
           lower.includes('cloudflare.com') ||
           lower.includes('amazonaws.com') ||
           lower.includes('vercel.com') ||
           lower.includes('netlify.com') ||
           lower.includes('wixsite.com');
  };
  
  for (const pageUrl of pagesToCheck) {
    try {
      await delay(800); // Small delay between pages
      
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });
      
      if (!response.ok) continue;
      
      const html = await response.text();
      const emails = html.match(emailRegex) || [];
      
      // Filter out blacklisted emails and deduplicate
      const filteredEmails = Array.from(new Set(emails)).filter(e => !isBlacklisted(e));
      
      if (filteredEmails.length > 0) {
        // Sort by priority
        for (const priorityRegex of emailPriority) {
          const match = filteredEmails.find(e => priorityRegex.test(e));
          if (match) {
            const source = pageUrl === cleanUrl ? 'homepage' : 
                          pageUrl.includes('contact') ? 'contact_page' :
                          pageUrl.includes('about') ? 'about_page' :
                          pageUrl.includes('support') || pageUrl.includes('help') ? 'support_page' :
                          pageUrl.includes('privacy') || pageUrl.includes('terms') || pageUrl.includes('legal') ? 'legal_page' : 'other';
            console.log(`[EmailFinder] Found ${match} from ${source}`);
            return { email: match.toLowerCase(), source };
          }
        }
      }
      
    } catch (error) {
      // Page doesn't exist or timeout, continue
    }
  }
  
  // Fallback: Use Perplexity to find contact email
  console.log(`[EmailFinder] Scraping failed for ${cleanUrl}, trying Perplexity...`);
  const perplexityResult = await findEmailViaPerplexity(cleanUrl);
  if (perplexityResult.email) {
    return perplexityResult;
  }
  
  return { email: null, source: 'not_found' };
}

/**
 * Use Perplexity to find contact email when scraping fails
 */
async function findEmailViaPerplexity(url: string): Promise<{ email: string | null; source: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return { email: null, source: 'perplexity_not_configured' };
  }
  
  try {
    // Extract domain for search
    const domain = new URL(url).hostname.replace('www.', '');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Find the contact or support email address for the given website. Return ONLY the email address, nothing else. If you cannot find one, return "NOT_FOUND".',
          },
          {
            role: 'user',
            content: `What is the contact or support email address for ${domain}? Look for their contact page, about page, or any public listing.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });
    
    if (!response.ok) {
      console.error(`[EmailFinder] Perplexity error: ${response.status}`);
      return { email: null, source: 'perplexity_error' };
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Extract email from response
    const emailMatch = answer.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !answer.includes('NOT_FOUND')) {
      console.log(`[EmailFinder] Perplexity found: ${emailMatch[0]}`);
      return { email: emailMatch[0].toLowerCase(), source: 'perplexity' };
    }
    
    return { email: null, source: 'perplexity_not_found' };
  } catch (error) {
    console.error(`[EmailFinder] Perplexity search failed:`, error);
    return { email: null, source: 'perplexity_error' };
  }
}

// ============================================
// REVIEW GENERATOR (GPT)
// ============================================

// Lazy-loaded OpenAI client (only when generating reviews)
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Generate a tool review using GPT
 */
export async function generateToolReview(
  toolName: string,
  toolUrl: string,
  toolDescription: string,
  websiteContent: string = ''
): Promise<{ title: string; content: string; slug: string }> {
  
  // Let GPT output markdown naturally - it's what it's trained for
  const prompt = `Write a comprehensive, in-depth review of ${toolName} for SportBot AI blog.

**Tool:** ${toolName}
**URL:** ${toolUrl}
**Description:** ${toolDescription}
**Website content:** ${websiteContent.substring(0, 6000)}

IMPORTANT: Write 4000-5000 words. This should be an exhaustive, SEO-optimized article. Go deep on every section.

Structure:

## Introduction
3-4 paragraphs introducing the tool, the problem it solves, who it's for, and why readers should care. Include context about the sports betting landscape.

## What is ${toolName}?
Detailed explanation of what the tool is, its history/background, the company behind it, and its core mission. 3-4 paragraphs.

## Key Features (In-Depth Analysis)
### 1. [Feature Name]
2-3 paragraphs explaining the feature, how it works, and real-world benefits. Include use cases.

### 2. [Feature Name]
2-3 paragraphs with same depth.

### 3. [Feature Name]
2-3 paragraphs with same depth.

### 4. [Feature Name]
2-3 paragraphs with same depth.

### 5. [Feature Name]
2-3 paragraphs with same depth.

## How to Get Started
Step-by-step guide: signing up, setting up an account, first steps. 3-4 paragraphs.

## User Experience & Interface
Detailed analysis of the UI/UX, mobile experience, ease of use. 2-3 paragraphs.

## Who Should Use ${toolName}?
### Beginners
Why it works (or doesn't) for beginners. 1-2 paragraphs.

### Intermediate Bettors
1-2 paragraphs.

### Professional/Sharp Bettors
1-2 paragraphs.

## ${toolName} vs Competitors
Compare to 2-3 similar tools briefly. What makes this one different?

## Pros and Cons
### Pros
- **[Pro title]:** 2-3 sentence explanation
- **[Pro title]:** 2-3 sentence explanation
- **[Pro title]:** 2-3 sentence explanation
- **[Pro title]:** 2-3 sentence explanation
- **[Pro title]:** 2-3 sentence explanation

### Cons
- **[Con title]:** 2-3 sentence explanation
- **[Con title]:** 2-3 sentence explanation
- **[Con title]:** 2-3 sentence explanation

## Pricing & Value
Detailed pricing breakdown, comparison to competitors, value analysis. 2-3 paragraphs.

## Tips for Getting the Most Out of ${toolName}
3-5 actionable tips with explanations.

## Frequently Asked Questions
5-6 FAQs with detailed answers.

## Final Verdict
2-3 paragraphs summarizing the review, who should use it, and final recommendation.

RULES:
1. Be objective and balanced - acknowledge limitations
2. Write naturally and engagingly with varied sentence structure
3. Include specific details and examples where possible
4. Use transition sentences between sections
5. MINIMUM 4000 words - be thorough!

Return JSON:
{"title": "${toolName} Review: [catchy subtitle]", "slug": "${toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-review", "content": "## Introduction\\n...full markdown content..."}`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  // Convert markdown to HTML (root fix - work WITH the model, not against it)
  const markdownContent = result.content || '';
  const htmlContent = await marked(markdownContent);
  
  // Add CTA box after conversion
  const ctaBox = `
<div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; border: 1px solid #334155;">
  <p style="color: #2AF6A0; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">🔗 Ready to Try ${toolName}?</p>
  <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">Visit their website to learn more and get started.</p>
  <a href="${toolUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #2AF6A0; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Visit ${toolName} →</a>
</div>`;
  
  // Insert CTA before the Verdict section
  let finalContent = htmlContent;
  const verdictMatch = finalContent.match(/<h2[^>]*>(?:Final\s+)?Verdict/i);
  if (verdictMatch && verdictMatch.index !== undefined) {
    finalContent = finalContent.slice(0, verdictMatch.index) + ctaBox + finalContent.slice(verdictMatch.index);
  } else {
    // Append at end if no verdict section
    finalContent += ctaBox;
  }
  
  return {
    title: result.title || `${toolName} Review`,
    slug: result.slug || toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    content: finalContent,
  };
}

// ============================================
// GOOGLE CUSTOM SEARCH (Most Reliable)
// ============================================

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

/**
 * Search Google for sports betting tools
 * Requires GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX env vars
 * 
 * Free tier: 100 queries/day, $5 per 1000 after
 */
export async function searchGoogle(query: string): Promise<DiscoveredTool[]> {
  const tools: DiscoveredTool[] = [];
  
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  
  if (!apiKey || !cx) {
    console.log('[BacklinkScout] Google Search not configured (GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX)');
    return tools;
  }
  
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[BacklinkScout] Google Search returned ${response.status}`);
      return tools;
    }
    
    const data = await response.json();
    const items: GoogleSearchResult[] = data.items || [];
    
    for (const item of items) {
      if (!isBlockedDomain(item.link)) {
        tools.push({
          name: item.title.split(' - ')[0].split(' | ')[0].trim(),
          url: item.link,
          description: item.snippet,
          sourceUrl: `https://google.com/search?q=${encodeURIComponent(query)}`,
          source: 'google',
        });
      }
    }
    
    console.log(`[BacklinkScout] Found ${tools.length} tools for "${query}" via Google`);
    
  } catch (error) {
    console.error(`[BacklinkScout] Google Search error:`, error);
  }
  
  return tools;
}

// ============================================
// SEED LIST DISCOVERY (Curated + Reliable)
// ============================================

/**
 * Get tools from curated seed list
 * These are manually verified tools that we know are good targets
 */
export async function getSeedTools(): Promise<DiscoveredTool[]> {
  return CONFIG.SEED_TOOLS.map(seed => ({
    name: seed.name,
    url: seed.url,
    description: `Sports betting ${seed.category} tool`,
    sourceUrl: 'curated',
    source: 'seed_list',
  }));
}

// ============================================
// MAIN SCOUT FUNCTION
// ============================================

export interface ScoutResult {
  discovered: number;
  new: number;
  skipped: number;
  errors: string[];
}

/**
 * Run the full backlink scout process
 * 1. Scrape directories for new tools
 * 2. Filter duplicates and blocked domains
 * 3. Extract content and find emails
 * 4. Generate reviews
 * 5. Queue outreach
 */
export async function runBacklinkScout(options: {
  sources?: ('google' | 'seed' | 'producthunt' | 'alternativeto' | 'betalist' | 'sportsbettingtools')[];
  searchTerms?: string[];
  maxNew?: number;
  dryRun?: boolean;
}): Promise<ScoutResult> {
  
  const {
    sources = ['sportsbettingtools', 'seed'], // Default: sportsbettingtools.io first, then seed list
    searchTerms = CONFIG.GOOGLE_SEARCH_QUERIES.slice(0, 3), // Limit to first 3 terms
    maxNew = 5,
    dryRun = false,
  } = options;
  
  const result: ScoutResult = {
    discovered: 0,
    new: 0,
    skipped: 0,
    errors: [],
  };
  
  console.log(`[BacklinkScout] Starting scout...`);
  console.log(`[BacklinkScout] Sources: ${sources.join(', ')}`);
  console.log(`[BacklinkScout] Search terms: ${searchTerms.join(', ')}`);
  
  const allTools: DiscoveredTool[] = [];
  
  // 1. Scrape each source
  for (const source of sources) {
    // Sources that don't need search terms
    if (source === 'seed') {
      const tools = await getSeedTools();
      allTools.push(...tools);
      result.discovered += tools.length;
      continue;
    }
    
    if (source === 'sportsbettingtools') {
      console.log('[BacklinkScout] Scraping sportsbettingtools.io...');
      const tools = await scrapeSportsBettingTools();
      allTools.push(...tools);
      result.discovered += tools.length;
      continue;
    }
    
    for (const term of searchTerms) {
      let tools: DiscoveredTool[] = [];
      
      switch (source) {
        case 'google':
          tools = await searchGoogle(term);
          break;
        case 'producthunt':
          tools = await scrapeProductHunt(term);
          break;
        case 'alternativeto':
          tools = await scrapeAlternativeTo(term);
          break;
        case 'betalist':
          tools = await scrapeBetaList(term);
          break;
      }
      
      allTools.push(...tools);
      result.discovered += tools.length;
      
      // Delay between sources
      await delay(getRandomDelay());
    }
  }
  
  console.log(`[BacklinkScout] Total discovered: ${allTools.length}`);
  
  // 2. Deduplicate by domain
  const seenDomains = new Set<string>();
  const uniqueTools = allTools.filter(tool => {
    const domain = extractDomain(tool.url);
    if (seenDomains.has(domain)) return false;
    seenDomains.add(domain);
    return true;
  });
  
  console.log(`[BacklinkScout] Unique tools: ${uniqueTools.length}`);
  
  // 3. Filter blocked domains
  const validTools = uniqueTools.filter(tool => !isBlockedDomain(tool.url));
  
  console.log(`[BacklinkScout] After filtering blocked: ${validTools.length}`);
  
  // 4. Check which are new (not in DB) - compare by full URL
  const existingUrls = await prisma.toolReview.findMany({
    where: {
      toolUrl: {
        in: validTools.map(t => t.url),
      },
    },
    select: { toolUrl: true },
  });
  
  const existingSet = new Set(existingUrls.map(e => e.toolUrl));
  const newTools = validTools.filter(t => !existingSet.has(t.url));
  
  console.log(`[BacklinkScout] New tools: ${newTools.length}`);
  console.log(`[BacklinkScout] Already in DB: ${existingUrls.length}`);
  
  // 5. Process up to maxNew tools
  const toProcess = newTools.slice(0, maxNew);
  
  for (const tool of toProcess) {
    try {
      console.log(`[BacklinkScout] Processing: ${tool.name} (${tool.url})`);
      
      if (dryRun) {
        console.log(`[BacklinkScout] DRY RUN - Would process ${tool.name}`);
        result.new++;
        continue;
      }
      
      // Extract content
      const { content, wordCount } = await extractWebsiteContent(tool.url);
      console.log(`[BacklinkScout] Extracted ${wordCount} words from ${tool.url}`);
      
      // Find email
      const { email, source: emailSource } = await findContactEmail(tool.url);
      console.log(`[BacklinkScout] Email: ${email || 'not found'} (${emailSource})`);
      
      // Save to database (upsert to handle duplicates)
      await prisma.toolReview.upsert({
        where: { toolUrl: tool.url },
        update: {
          contentExtracted: content,
          contentWords: wordCount,
          contactEmail: email,
          emailSource: emailSource,
          outreachStatus: email ? 'NOT_SENT' : 'NO_EMAIL',
        },
        create: {
          toolName: tool.name,
          toolUrl: tool.url,
          toolDescription: tool.description,
          toolLogo: tool.logo,
          scrapedFrom: tool.source,
          sourceUrl: tool.sourceUrl,
          contentExtracted: content,
          contentWords: wordCount,
          contactEmail: email,
          emailSource: emailSource,
          reviewStatus: 'PENDING',
          outreachStatus: email ? 'NOT_SENT' : 'NO_EMAIL',
        },
      });
      
      result.new++;
      console.log(`[BacklinkScout] Saved: ${tool.name}`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`${tool.name}: ${errorMsg}`);
      console.error(`[BacklinkScout] Error processing ${tool.name}:`, error);
    }
  }
  
  result.skipped = validTools.length - newTools.length;
  
  console.log(`[BacklinkScout] Complete!`);
  console.log(`[BacklinkScout] New: ${result.new}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`);
  
  return result;
}
