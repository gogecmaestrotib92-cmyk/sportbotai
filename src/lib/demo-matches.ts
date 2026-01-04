/**
 * Demo Matches - Pre-generated analyses for anonymous users
 * 
 * These showcase analyses are served to unregistered users to:
 * 1. Save API costs (no GPT/Perplexity calls)
 * 2. Show curated, high-quality examples
 * 3. Instant load time (0 latency)
 * 
 * Update these periodically with fresh, relevant matches.
 * Each demo includes full analysis data matching MatchPreviewData interface.
 */

export interface DemoMatch {
  id: string;
  sport: string;
  league: string;
  featured: boolean; // Show on homepage
  lastUpdated: string;
  data: {
    matchInfo: {
      id: string;
      homeTeam: string;
      awayTeam: string;
      league: string;
      sport: string;
      hasDraw?: boolean;
      scoringUnit?: string;
      kickoff: string;
      venue?: string;
    };
    story: {
      favored: 'home' | 'away' | 'draw';
      confidence: 'strong' | 'moderate' | 'slight';
      narrative?: string;
      snapshot?: string[];
      riskFactors?: string[];
      supportingStats?: Array<{
        icon: string;
        stat: string;
        context: string;
      }>;
    };
    universalSignals?: {
      form: { score: number; label: string; direction: string };
      edge: { score: number; label: string; direction: string };
      tempo: { score: number; label: string };
      efficiency: { score: number; label: string };
      availability: { score: number; label: string };
      clarityScore: number;
    };
    // Injuries data for expandable availability section
    injuries?: {
      home: Array<{ player: string; position?: string; reason?: string; details?: string }>;
      away: Array<{ player: string; position?: string; reason?: string; details?: string }>;
    };
    viralStats?: {
      h2h: { headline: string; favors: string };
      form: { home: string; away: string };
      keyAbsence: { player: string; team: string; impact: string } | null;
      streak: { text: string; team: string } | null;
    };
    headlines?: Array<{
      icon: string;
      text: string;
      favors: string;
      viral?: boolean;
    }>;
  };
}

// ============================================
// DEMO MATCHES DATABASE
// Update these with current, relevant matches
// ============================================

export const DEMO_MATCHES: DemoMatch[] = [
  // ----------------------------------------
  // SOCCER - Premier League
  // ----------------------------------------
  {
    id: 'demo-premier-league-1',
    sport: 'soccer',
    league: 'Premier League',
    featured: true,
    lastUpdated: '2025-12-15',
    data: {
      matchInfo: {
        id: 'demo-premier-league-1',
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester City',
        league: 'Premier League',
        sport: 'soccer',
        hasDraw: true,
        scoringUnit: 'goals',
        kickoff: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        venue: 'Anfield',
      },
      story: {
        favored: 'home',
        confidence: 'moderate',
        narrative: "Liverpool's Anfield fortress meets a City side still finding their rhythm. The Reds have been relentless at home, while City's away form has been uncharacteristically inconsistent. This clash of titans could swing on set pieces and transitions.",
        snapshot: [
          "Liverpool unbeaten at Anfield in 18 months",
          "City struggling with injuries in midfield",
          "H2H: 3 of last 5 meetings decided by 1 goal",
          "Both teams average over 2 goals per game"
        ],
        riskFactors: [
          "City's quality can shine on any given day",
          "Liverpool's pressing intensity may dip late",
          "Key referee appointment - lets play flow"
        ],
        supportingStats: [
          { icon: '🏟️', stat: '94% home win rate', context: 'Liverpool at Anfield (all comps)' },
          { icon: '⚽', stat: '2.8 goals/game', context: 'Liverpool home average' },
          { icon: '🎯', stat: '72% pass accuracy', context: 'City under pressure away' }
        ],
      },
      universalSignals: {
        form: { score: 78, label: 'Liverpool Surging', direction: 'home' },
        edge: { score: 65, label: 'Home Advantage', direction: 'home' },
        tempo: { score: 85, label: 'High Intensity Expected' },
        efficiency: { score: 72, label: 'Clinical Home Side' },
        availability: { score: 68, label: 'City Missing Key Players' },
        clarityScore: 74,
      },
      viralStats: {
        h2h: { headline: '3 of last 5 decided by 1 goal', favors: 'neutral' },
        form: { home: 'WWWDW', away: 'WDWLW' },
        keyAbsence: { player: 'Rodri', team: 'away', impact: 'Season-ending ACL injury' },
        streak: { text: '6 home wins in a row', team: 'home' },
      },
      headlines: [
        { icon: '🔥', text: 'Liverpool 6-game home winning streak', favors: 'home', viral: true },
        { icon: '🏥', text: 'City without Rodri all season', favors: 'home' },
        { icon: '⚔️', text: 'Title race implications', favors: 'neutral', viral: true },
        { icon: '📊', text: 'Over 2.5 goals in 8 of last 10 H2H', favors: 'neutral' },
      ],
      // Injuries for expandable availability section
      injuries: {
        home: [
          { player: 'Diogo Jota', position: 'Forward', reason: 'injury', details: 'Muscle injury' },
          { player: 'Harvey Elliott', position: 'Midfielder', reason: 'injury', details: 'Foot fracture' },
        ],
        away: [
          { player: 'Rodri', position: 'Midfielder', reason: 'injury', details: 'ACL - Season ending' },
          { player: 'Oscar Bobb', position: 'Midfielder', reason: 'injury', details: 'Leg fracture' },
          { player: 'Nathan Ake', position: 'Defender', reason: 'doubtful', details: 'Hamstring' },
        ],
      },
    },
  },

  // ----------------------------------------
  // NBA - Basketball
  // ----------------------------------------
  {
    id: 'demo-nba-1',
    sport: 'basketball_nba',
    league: 'NBA',
    featured: true,
    lastUpdated: '2025-12-15',
    data: {
      matchInfo: {
        id: 'demo-nba-1',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        league: 'NBA',
        sport: 'basketball_nba',
        hasDraw: false,
        scoringUnit: 'points',
        kickoff: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        venue: 'Crypto.com Arena',
      },
      story: {
        favored: 'home',
        confidence: 'slight',
        narrative: "The NBA's greatest rivalry resumes. LeBron and the Lakers have found their groove at home, while the Celtics bring the league's best road record. Expect a high-scoring affair with momentum swings in every quarter.",
        snapshot: [
          "Lakers 8-2 in last 10 home games",
          "Celtics best road record in the NBA",
          "LeBron averaging 28.3 PPG vs Boston",
          "Total has gone OVER in 6 of last 8 H2H"
        ],
        riskFactors: [
          "Celtics' depth could exploit Lakers' bench",
          "Back-to-back game for Lakers",
          "Tatum historically strong at Staples/Crypto"
        ],
        supportingStats: [
          { icon: '🏀', stat: '118.2 PPG', context: 'Lakers home average' },
          { icon: '🛡️', stat: '105.8 PPG allowed', context: 'Celtics road defense' },
          { icon: '👑', stat: '28.3 PPG', context: 'LeBron vs Boston career' }
        ],
      },
      universalSignals: {
        form: { score: 72, label: 'Lakers Hot at Home', direction: 'home' },
        edge: { score: 55, label: 'Slight Home Edge', direction: 'home' },
        tempo: { score: 88, label: 'Fast-Paced Expected' },
        efficiency: { score: 75, label: 'Both Teams Efficient' },
        availability: { score: 82, label: 'Healthy Squads' },
        clarityScore: 68,
      },
      viralStats: {
        h2h: { headline: 'OVER in 6 of last 8 meetings', favors: 'neutral' },
        form: { home: 'WWLWW', away: 'WWWLW' },
        keyAbsence: null,
        streak: { text: '4-game home win streak', team: 'home' },
      },
      headlines: [
        { icon: '🏆', text: 'Historic rivalry: 12 combined titles', favors: 'neutral', viral: true },
        { icon: '🔥', text: 'Lakers 8-2 in last 10 at home', favors: 'home' },
        { icon: '✈️', text: 'Celtics best road record in NBA', favors: 'away' },
        { icon: '📈', text: 'High-scoring affair expected', favors: 'neutral' },
      ],
    },
  },

  // ----------------------------------------
  // NFL - American Football
  // ----------------------------------------
  {
    id: 'demo-nfl-1',
    sport: 'americanfootball_nfl',
    league: 'NFL',
    featured: true,
    lastUpdated: '2025-12-15',
    data: {
      matchInfo: {
        id: 'demo-nfl-1',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        league: 'NFL',
        sport: 'americanfootball_nfl',
        hasDraw: false,
        scoringUnit: 'points',
        kickoff: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        venue: 'Arrowhead Stadium',
      },
      story: {
        favored: 'home',
        confidence: 'moderate',
        narrative: "The AFC's premier rivalry continues at Arrowhead. Mahomes owns a dominant record against Allen, but the Bills have closed the gap. Cold weather and crowd noise will test Buffalo's composure in a potential playoff preview.",
        snapshot: [
          "Chiefs 9-1 at home vs Bills (Mahomes era)",
          "Allen 0-4 in playoff games at Arrowhead",
          "Both teams clinched playoff spots",
          "Chiefs average +6.5 point margin at home"
        ],
        riskFactors: [
          "Bills' improved defense could limit Mahomes",
          "Weather could affect passing game",
          "Chiefs dealing with OL injuries"
        ],
        supportingStats: [
          { icon: '🏈', stat: '9-1', context: 'Chiefs vs Bills at home (Mahomes)' },
          { icon: '❄️', stat: '-5°F', context: 'Expected game-time temp' },
          { icon: '📣', stat: '137 dB', context: 'Arrowhead crowd record' }
        ],
      },
      universalSignals: {
        form: { score: 80, label: 'Chiefs Rolling', direction: 'home' },
        edge: { score: 70, label: 'Arrowhead Factor', direction: 'home' },
        tempo: { score: 65, label: 'Weather May Slow Play' },
        efficiency: { score: 78, label: 'Elite Offenses' },
        availability: { score: 70, label: 'Minor Injury Concerns' },
        clarityScore: 72,
      },
      viralStats: {
        h2h: { headline: 'Mahomes 9-1 vs Allen', favors: 'home' },
        form: { home: 'WWWLW', away: 'WLWWW' },
        keyAbsence: null,
        streak: { text: '5 straight home wins vs Bills', team: 'home' },
      },
      headlines: [
        { icon: '❄️', text: 'Freezing conditions at Arrowhead', favors: 'home', viral: true },
        { icon: '🐐', text: 'Mahomes 9-1 vs Allen all-time', favors: 'home' },
        { icon: '🦬', text: 'Bills defense ranked #2 in NFL', favors: 'away' },
        { icon: '🏆', text: 'Potential AFC Championship preview', favors: 'neutral', viral: true },
      ],
    },
  },

  // ----------------------------------------
  // NHL - Hockey
  // ----------------------------------------
  {
    id: 'demo-nhl-1',
    sport: 'icehockey_nhl',
    league: 'NHL',
    featured: false,
    lastUpdated: '2025-12-15',
    data: {
      matchInfo: {
        id: 'demo-nhl-1',
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        league: 'NHL',
        sport: 'icehockey_nhl',
        hasDraw: false,
        scoringUnit: 'goals',
        kickoff: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Scotiabank Arena',
      },
      story: {
        favored: 'home',
        confidence: 'strong',
        narrative: "The oldest rivalry in hockey returns with the Leafs surging. Toronto's offense has been lethal at home while Montreal struggles on the road. Matthews leads the league in goals and will test a young Habs defense.",
        snapshot: [
          "Leafs 12-3-1 at home this season",
          "Matthews: 25 goals in 30 games",
          "Canadiens 4-9-2 on the road",
          "Last 5 H2H: 4 games had 6+ total goals"
        ],
        riskFactors: [
          "Rivalry games can be unpredictable",
          "Habs goaltending has been solid lately",
          "Leafs sometimes underperform vs rivals"
        ],
        supportingStats: [
          { icon: '🏒', stat: '25 goals', context: 'Matthews (league leader)' },
          { icon: '🏠', stat: '12-3-1', context: 'Leafs home record' },
          { icon: '✈️', stat: '4-9-2', context: 'Canadiens road record' }
        ],
      },
      universalSignals: {
        form: { score: 85, label: 'Leafs Dominant', direction: 'home' },
        edge: { score: 75, label: 'Clear Home Favorite', direction: 'home' },
        tempo: { score: 78, label: 'Fast-Paced Rivalry' },
        efficiency: { score: 82, label: 'Leafs Clinical' },
        availability: { score: 90, label: 'Both Healthy' },
        clarityScore: 82,
      },
      viralStats: {
        h2h: { headline: '4 of last 5 had 6+ goals', favors: 'neutral' },
        form: { home: 'WWWWL', away: 'LLWLL' },
        keyAbsence: null,
        streak: { text: '4-game winning streak', team: 'home' },
      },
      headlines: [
        { icon: '🍁', text: 'Original Six rivalry match', favors: 'neutral', viral: true },
        { icon: '🔥', text: 'Matthews leads NHL in goals', favors: 'home' },
        { icon: '📉', text: 'Habs 4-9-2 on the road', favors: 'home' },
        { icon: '⚔️', text: 'Expect a high-scoring battle', favors: 'neutral' },
      ],
    },
  },

  // ----------------------------------------
  // LA LIGA - Soccer
  // ----------------------------------------
  {
    id: 'demo-laliga-1',
    sport: 'soccer',
    league: 'La Liga',
    featured: false,
    lastUpdated: '2025-12-15',
    data: {
      matchInfo: {
        id: 'demo-laliga-1',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        league: 'La Liga',
        sport: 'soccer',
        hasDraw: true,
        scoringUnit: 'goals',
        kickoff: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Santiago Bernabéu',
      },
      story: {
        favored: 'home',
        confidence: 'slight',
        narrative: "El Clásico at the renovated Bernabéu. Real Madrid's European form has been patchy but they're strong domestically. Barcelona's young stars have been electric, making this one impossible to call with certainty.",
        snapshot: [
          "Real Madrid unbeaten at home in La Liga",
          "Barcelona's young trio scoring freely",
          "Last 6 Clásicos: 3 home wins, 2 away, 1 draw",
          "Combined 28 league goals this season"
        ],
        riskFactors: [
          "Barcelona's pressing can trouble Madrid",
          "Clásico atmospheres unpredictable",
          "Both teams rotated in midweek"
        ],
        supportingStats: [
          { icon: '🏟️', stat: 'Unbeaten', context: 'Real Madrid at home in La Liga' },
          { icon: '⚽', stat: '15 goals', context: 'Barcelona top 3 combined' },
          { icon: '📊', stat: '2.3', context: 'Average goals per Clásico (last 10)' }
        ],
      },
      universalSignals: {
        form: { score: 70, label: 'Both in Good Form', direction: 'neutral' },
        edge: { score: 58, label: 'Slight Home Edge', direction: 'home' },
        tempo: { score: 82, label: 'High Press Expected' },
        efficiency: { score: 75, label: 'Clinical Attacks' },
        availability: { score: 78, label: 'Key Players Fit' },
        clarityScore: 65,
      },
      viralStats: {
        h2h: { headline: 'Last 6: 3 home, 2 away, 1 draw', favors: 'neutral' },
        form: { home: 'WWDWW', away: 'WWWDW' },
        keyAbsence: null,
        streak: { text: 'Unbeaten at home', team: 'home' },
      },
      headlines: [
        { icon: '🌟', text: 'El Clásico at the new Bernabéu', favors: 'neutral', viral: true },
        { icon: '🏠', text: 'Real Madrid unbeaten at home', favors: 'home' },
        { icon: '🔥', text: 'Barcelona youth revolution', favors: 'away' },
        { icon: '⚔️', text: 'Title implications on the line', favors: 'neutral', viral: true },
      ],
    },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all featured demo matches (for homepage/landing)
 */
export function getFeaturedDemos(): DemoMatch[] {
  return DEMO_MATCHES.filter(m => m.featured);
}

/**
 * Get demo matches by sport
 */
export function getDemosBySport(sport: string): DemoMatch[] {
  const normalizedSport = sport.toLowerCase();
  return DEMO_MATCHES.filter(m => 
    m.sport.toLowerCase().includes(normalizedSport) ||
    normalizedSport.includes(m.sport.toLowerCase())
  );
}

/**
 * Get a specific demo by ID
 */
export function getDemoById(id: string): DemoMatch | undefined {
  return DEMO_MATCHES.find(m => m.id === id);
}

/**
 * Find best matching demo for a given team matchup
 * Returns undefined if no good match found
 */
export function findMatchingDemo(homeTeam: string, awayTeam: string, sport?: string): DemoMatch | undefined {
  const normalizeTeam = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
  const homeNorm = normalizeTeam(homeTeam);
  const awayNorm = normalizeTeam(awayTeam);

  return DEMO_MATCHES.find(m => {
    const demoHome = normalizeTeam(m.data.matchInfo.homeTeam);
    const demoAway = normalizeTeam(m.data.matchInfo.awayTeam);
    
    // Check if teams match (either order)
    const teamsMatch = 
      (demoHome.includes(homeNorm) || homeNorm.includes(demoHome)) &&
      (demoAway.includes(awayNorm) || awayNorm.includes(demoAway));
    
    // If sport specified, must match
    if (sport) {
      const sportMatches = m.sport.toLowerCase().includes(sport.toLowerCase()) ||
                          sport.toLowerCase().includes(m.sport.toLowerCase());
      return teamsMatch && sportMatches;
    }
    
    return teamsMatch;
  });
}

/**
 * Get a random featured demo (for "Try a sample" CTA)
 */
export function getRandomFeaturedDemo(): DemoMatch {
  const featured = getFeaturedDemos();
  return featured[Math.floor(Math.random() * featured.length)];
}

/**
 * Check if we have a demo for this match (for anonymous user routing)
 */
export function hasDemoForMatch(homeTeam: string, awayTeam: string, sport?: string): boolean {
  return findMatchingDemo(homeTeam, awayTeam, sport) !== undefined;
}
