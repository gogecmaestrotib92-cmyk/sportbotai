/**
 * Test Perplexity Injuries for NBA, NHL, NFL
 * 
 * Run: npx tsx scripts/test-perplexity-injuries.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Import after env is loaded
import { getMatchInjuriesViaPerplexity } from '../src/lib/perplexity.js';

async function testSport(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  label: string
) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${label}: ${homeTeam} vs ${awayTeam}`);
  console.log(`Sport key: ${sport}`);
  console.log('='.repeat(60));
  
  const result = await getMatchInjuriesViaPerplexity(homeTeam, awayTeam, sport);
  
  if (!result.success) {
    console.log(`❌ FAILED: ${result.error}`);
    return false;
  }
  
  console.log(`✅ SUCCESS`);
  console.log(`\n${homeTeam} injuries (${result.home.length}):`);
  if (result.home.length === 0) {
    console.log('  No injuries reported');
  } else {
    result.home.forEach(inj => {
      console.log(`  - ${inj.playerName}: ${inj.injury} (${inj.status})`);
    });
  }
  
  console.log(`\n${awayTeam} injuries (${result.away.length}):`);
  if (result.away.length === 0) {
    console.log('  No injuries reported');
  } else {
    result.away.forEach(inj => {
      console.log(`  - ${inj.playerName}: ${inj.injury} (${inj.status})`);
    });
  }
  
  if (result.source) {
    console.log(`\nSource: ${result.source}`);
  }
  
  return true;
}

async function main() {
  console.log('🏀🏒🏈 Testing Perplexity Injuries for All Sports\n');
  
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY not set in .env.local');
    process.exit(1);
  }
  
  console.log('✅ Perplexity API key found');
  
  const tests = [
    // NBA test
    {
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Boston Celtics',
      sport: 'basketball_nba',
      label: 'NBA',
    },
    // NHL test
    {
      homeTeam: 'Toronto Maple Leafs',
      awayTeam: 'Montreal Canadiens',
      sport: 'icehockey_nhl',
      label: 'NHL',
    },
    // NFL test
    {
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      sport: 'americanfootball_nfl',
      label: 'NFL',
    },
  ];
  
  const results: { label: string; success: boolean }[] = [];
  
  for (const test of tests) {
    const success = await testSport(test.homeTeam, test.awayTeam, test.sport, test.label);
    results.push({ label: test.label, success });
    
    // Small delay between API calls
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.label}`);
  });
  
  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
