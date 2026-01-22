import { getESPNH2H } from '../src/lib/data-layer/providers/espn-injuries';

async function test() {
  console.log('=== Testing ESPN H2H ===\n');

  // Test NBA
  console.log('NBA: Dallas Mavericks vs Golden State Warriors');
  const nba = await getESPNH2H('Dallas Mavericks', 'Golden State Warriors', 'nba', 2);
  console.log('Result:', nba.success ? `${nba.summary.totalMatches} matches found` : `Failed: ${nba.error}`);
  if (nba.success) {
    console.log(`  Team1 Wins: ${nba.summary.team1Wins}, Team2 Wins: ${nba.summary.team2Wins}`);
  }

  // Test NFL
  console.log('\nNFL: Kansas City Chiefs vs Buffalo Bills');
  const nfl = await getESPNH2H('Kansas City Chiefs', 'Buffalo Bills', 'nfl', 2);
  console.log('Result:', nfl.success ? `${nfl.summary.totalMatches} matches found` : `Failed: ${nfl.error}`);
  if (nfl.success) {
    console.log(`  Team1 Wins: ${nfl.summary.team1Wins}, Team2 Wins: ${nfl.summary.team2Wins}`);
  }

  // Test NHL
  console.log('\nNHL: Boston Bruins vs Vegas Golden Knights');
  const nhl = await getESPNH2H('Boston Bruins', 'Vegas Golden Knights', 'nhl', 3);
  console.log('Result:', nhl.success ? `${nhl.summary.totalMatches} matches found` : `Failed: ${nhl.error}`);
  if (nhl.success) {
    console.log(`  Team1 Wins: ${nhl.summary.team1Wins}, Team2 Wins: ${nhl.summary.team2Wins}`);
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
