import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = '5e73f01586e0b0d7a097aae7c0c3ef1e';

// Your analyzed matches - manually map to real results
// API date is 2024-12-17 for matches dated 2025-12-18 in system
const MANUAL_RESULTS: Record<string, { homeScore: number; awayScore: number; winner: 'home' | 'away' }> = {};

async function fetchAndUpdateResults() {
  console.log('Fetching NBA games from Dec 17, 2024...');
  
  // Fetch NBA results
  const nbaResp = await fetch(
    'https://v1.basketball.api-sports.io/games?date=2024-12-17&league=12&season=2024-2025',
    { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v1.basketball.api-sports.io' } }
  );
  const nbaData = await nbaResp.json();
  const nbaGames = nbaData.response || [];
  
  console.log(`Found ${nbaGames.length} NBA games`);
  nbaGames.forEach((g: any) => {
    const homeScore = g.scores?.home?.total || 0;
    const awayScore = g.scores?.away?.total || 0;
    console.log(`  ${g.teams.home.name} vs ${g.teams.away.name}: ${homeScore}-${awayScore}`);
    
    // Build lookup
    const key = `${g.teams.home.name.toLowerCase()}|${g.teams.away.name.toLowerCase()}`;
    MANUAL_RESULTS[key] = { homeScore, awayScore, winner: homeScore > awayScore ? 'home' : 'away' };
  });
  
  console.log('\nFetching NHL games from Dec 17, 2024...');
  
  // Fetch NHL results
  const nhlResp = await fetch(
    'https://v1.hockey.api-sports.io/games?date=2024-12-17&league=57&season=2024',
    { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v1.hockey.api-sports.io' } }
  );
  const nhlData = await nhlResp.json();
  const nhlGames = nhlData.response || [];
  
  console.log(`Found ${nhlGames.length} NHL games`);
  nhlGames.forEach((g: any) => {
    const homeScore = g.scores?.home || 0;
    const awayScore = g.scores?.away || 0;
    console.log(`  ${g.teams.home.name} vs ${g.teams.away.name}: ${homeScore}-${awayScore}`);
    
    const key = `${g.teams.home.name.toLowerCase()}|${g.teams.away.name.toLowerCase()}`;
    MANUAL_RESULTS[key] = { homeScore, awayScore, winner: homeScore > awayScore ? 'home' : 'away' };
  });
  
  console.log('\n--- Updating predictions ---\n');
  
  // Get pending predictions
  const predictions = await prisma.prediction.findMany({
    where: { outcome: 'PENDING' }
  });
  
  let updated = 0;
  
  for (const pred of predictions) {
    const [homeTeam, awayTeam] = pred.matchName.split(' vs ').map(t => t.trim());
    
    // Try to find result - check both exact and partial matches
    let result = null;
    
    for (const [key, res] of Object.entries(MANUAL_RESULTS)) {
      const [apiHome, apiAway] = key.split('|');
      
      // Check if teams match (fuzzy)
      const homeMatch = apiHome.includes(homeTeam.toLowerCase().split(' ').pop() || '') || 
                       homeTeam.toLowerCase().includes(apiHome.split(' ').pop() || '');
      const awayMatch = apiAway.includes(awayTeam.toLowerCase().split(' ').pop() || '') ||
                       awayTeam.toLowerCase().includes(apiAway.split(' ').pop() || '');
      
      if (homeMatch && awayMatch) {
        result = res;
        break;
      }
    }
    
    if (result) {
      // Determine if prediction was correct
      const predictedHome = pred.prediction?.toLowerCase().includes('home') ||
        pred.prediction?.toLowerCase().includes(homeTeam.split(' ').pop()?.toLowerCase() || '');
      const predictedAway = pred.prediction?.toLowerCase().includes('away') ||
        pred.prediction?.toLowerCase().includes(awayTeam.split(' ').pop()?.toLowerCase() || '');
      
      let wasAccurate = false;
      if (predictedHome && result.winner === 'home') wasAccurate = true;
      if (predictedAway && result.winner === 'away') wasAccurate = true;
      
      const actualResult = result.winner === 'home' ? `${homeTeam} Win` : `${awayTeam} Win`;
      
      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          actualScore: `${result.homeScore}-${result.awayScore}`,
          actualResult,
          outcome: wasAccurate ? 'HIT' : 'MISS',
          validatedAt: new Date(),
        }
      });
      
      console.log(`✅ ${pred.matchName}: ${result.homeScore}-${result.awayScore} -> ${wasAccurate ? 'CORRECT' : 'WRONG'}`);
      updated++;
    } else {
      console.log(`⏳ ${pred.matchName}: No result found`);
    }
  }
  
  console.log(`\n📊 Updated ${updated} predictions`);
  await prisma.$disconnect();
}

fetchAndUpdateResults().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
