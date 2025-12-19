/**
 * Script to manually update prediction results
 * Run with: npx ts-node scripts/update-results.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.API_FOOTBALL_KEY || '5e73f01586e0b0d7a097aae7c0c3ef1e';

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  completed: boolean;
}

async function fetchNBAResult(searchHome: string, searchAway: string, dateStr: string): Promise<MatchResult | null> {
  try {
    // Use 2024 date since API has real-world data
    const apiDate = dateStr.replace('2025', '2024');
    console.log(`  NBA API date: ${apiDate}`);
    
    const response = await fetch(
      `https://v1.basketball.api-sports.io/games?date=${apiDate}&league=12&season=2024-2025`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.basketball.api-sports.io',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const games = data.response || [];

    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.status?.short || '';

      if (!['FT', 'AOT', 'AP'].includes(status)) continue;

      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home?.total ?? 0,
          awayScore: game.scores?.away?.total ?? 0,
          completed: true,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('NBA fetch error:', error);
    return null;
  }
}

async function fetchNHLResult(searchHome: string, searchAway: string, dateStr: string): Promise<MatchResult | null> {
  try {
    // Use 2024 date since API has real-world data
    const apiDate = dateStr.replace('2025', '2024');
    console.log(`  NHL API date: ${apiDate}`);
    
    const response = await fetch(
      `https://v1.hockey.api-sports.io/games?date=${apiDate}&league=57&season=2024`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.hockey.api-sports.io',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const games = data.response || [];

    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.status?.short || '';

      if (!['FT', 'AOT', 'AP', 'POST'].includes(status)) continue;

      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home ?? 0,
          awayScore: game.scores?.away ?? 0,
          completed: true,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('NHL fetch error:', error);
    return null;
  }
}

function evaluatePrediction(predictedScenario: string, homeScore: number, awayScore: number) {
  const predicted = predictedScenario.toLowerCase();
  const actualResult = homeScore > awayScore ? 'Home Win' : awayScore > homeScore ? 'Away Win' : 'Draw';

  if (predicted.includes('home') || predicted.includes(' win')) {
    // Check if it predicted the home team to win
    if (predicted.includes('home')) {
      return { wasAccurate: homeScore > awayScore, actualResult };
    }
  }
  if (predicted.includes('away')) {
    return { wasAccurate: awayScore > homeScore, actualResult };
  }
  // Check if team name is in prediction
  return { wasAccurate: false, actualResult };
}

async function updatePredictionResults() {
  console.log('Fetching pending predictions...');
  
  const pendingPredictions = await prisma.prediction.findMany({
    where: { outcome: 'PENDING' },
  });
  
  console.log(`Found ${pendingPredictions.length} pending predictions`);
  
  let updated = 0;
  
  for (const prediction of pendingPredictions) {
    const [homeTeam, awayTeam] = prediction.matchName.split(' vs ').map(t => t.trim());
    if (!homeTeam || !awayTeam) continue;
    
    const searchHome = homeTeam.toLowerCase();
    const searchAway = awayTeam.toLowerCase();
    const dateStr = prediction.matchDate.toISOString().split('T')[0];
    
    console.log(`\nChecking: ${prediction.matchRef} (${dateStr})`);
    
    // Detect sport
    const isNBA = ['bulls', 'cavaliers', 'timberwolves', 'grizzlies', 'heat', 'pistons', 'celtics', 'lakers', 'warriors', 'nuggets', 'suns', 'bucks', 'nets', 'knicks'].some(t => searchHome.includes(t) || searchAway.includes(t));
    const isNHL = ['predators', 'hurricanes', 'panthers', 'kings', 'red wings', 'mammoth', 'bruins', 'rangers', 'penguins'].some(t => searchHome.includes(t) || searchAway.includes(t));
    
    let result: MatchResult | null = null;
    
    if (isNBA) {
      console.log('  -> Checking NBA API...');
      result = await fetchNBAResult(searchHome, searchAway, dateStr);
    } else if (isNHL) {
      console.log('  -> Checking NHL API...');
      result = await fetchNHLResult(searchHome, searchAway, dateStr);
    }
    
    if (result && result.completed) {
      const homeWon = result.homeScore > result.awayScore;
      const predictedHome = prediction.prediction?.toLowerCase().includes(homeTeam.split(' ').pop()?.toLowerCase() || '');
      const predictedAway = prediction.prediction?.toLowerCase().includes(awayTeam.split(' ').pop()?.toLowerCase() || '');
      
      let wasAccurate = false;
      if (predictedHome && homeWon) wasAccurate = true;
      if (predictedAway && !homeWon) wasAccurate = true;
      
      const actualResult = homeWon ? `${homeTeam} Win` : `${awayTeam} Win`;
      
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          actualResult,
          actualScore: `${result.homeScore}-${result.awayScore}`,
          outcome: wasAccurate ? 'HIT' : 'MISS',
          validatedAt: new Date(),
        },
      });
      
      console.log(`  ✅ Updated: ${result.homeScore}-${result.awayScore} -> ${wasAccurate ? 'CORRECT' : 'WRONG'}`);
      updated++;
    } else {
      console.log('  ⏳ No result found yet');
    }
  }
  
  console.log(`\n📊 Summary: Updated ${updated} predictions`);
  await prisma.$disconnect();
}

updatePredictionResults().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
