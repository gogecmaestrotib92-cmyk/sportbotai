/**
 * Test: Verified NBA Stats Mode
 * 
 * Tests the new verified stats pipeline:
 * 1. Season resolution ("this season" -> "2024-2025")
 * 2. Player resolution with caching
 * 3. Stats fetching with validation
 * 4. Response contract verification
 * 
 * Usage: npx tsx scripts/test-verified-stats.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { 
  getVerifiedPlayerStats, 
  getVerifiedTeamStats, 
  isStatsQuery,
  formatVerifiedPlayerStats,
  formatVerifiedTeamStats,
  SeasonNormalizer,
} from '../src/lib/verified-nba-stats';

// ============================================================================
// Test Cases
// ============================================================================

const PLAYER_TESTS = [
  {
    name: 'Embiid avg points this season',
    query: 'Embiid avg points this season',
    expectedPlayer: 'Joel Embiid',
  },
  {
    name: 'Jokic rebounds per game this season',
    query: 'Jokic rebounds per game this season',
    expectedPlayer: 'Nikola Jokic',
  },
  {
    name: 'How many points is Steph Curry averaging',
    query: 'How many points is Steph Curry averaging',
    expectedPlayer: 'Stephen Curry',
  },
  {
    name: 'LeBron James stats this season',
    query: 'LeBron James stats this season',
    expectedPlayer: 'LeBron James',
  },
  {
    name: 'Wemby blocks per game',
    query: 'Wemby blocks per game',
    expectedPlayer: 'Victor Wembanyama',
  },
];

const TEAM_TESTS = [
  {
    name: 'Celtics points per game this season',
    query: 'Celtics points per game this season',
    expectedTeam: 'Boston Celtics',
  },
  {
    name: 'Lakers win percentage',
    query: 'Lakers win percentage',
    expectedTeam: 'Los Angeles Lakers',
  },
];

const SEASON_TESTS = [
  { input: undefined, expected: SeasonNormalizer.getCurrentSeason() },
  { input: 'this season', expected: SeasonNormalizer.getCurrentSeason() },
  { input: 'current season', expected: SeasonNormalizer.getCurrentSeason() },
  { input: '2024-2025', expected: '2024-2025' },
  { input: '2024-25', expected: '2024-2025' },
  { input: '2024', expected: '2024-2025' },
];

const STATS_QUERY_TESTS = [
  { query: 'Embiid avg points this season', expected: true },
  { query: 'How many rebounds does Jokic average', expected: true },
  { query: 'Celtics points per game', expected: true },
  { query: 'Who won the 2020 NBA Finals', expected: false }, // No current stats
  { query: 'Is LeBron injured', expected: false }, // Injury, not stats
];

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         VERIFIED NBA STATS MODE - TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test Season Normalizer
  console.log('📅 Testing Season Normalizer...\n');
  for (const test of SEASON_TESTS) {
    const result = SeasonNormalizer.normalize(test.input);
    const pass = result === test.expected;
    console.log(`  ${pass ? '✅' : '❌'} "${test.input || '(undefined)'}" -> "${result}" ${pass ? '' : `(expected: ${test.expected})`}`);
    if (pass) passed++; else failed++;
  }
  console.log();
  
  // Test isStatsQuery detection
  console.log('🔍 Testing Stats Query Detection...\n');
  for (const test of STATS_QUERY_TESTS) {
    const result = isStatsQuery(test.query);
    const pass = result === test.expected;
    console.log(`  ${pass ? '✅' : '❌'} "${test.query}" -> ${result} ${pass ? '' : `(expected: ${test.expected})`}`);
    if (pass) passed++; else failed++;
  }
  console.log();
  
  // Test Player Stats
  console.log('🏀 Testing Player Stats...\n');
  for (const test of PLAYER_TESTS) {
    console.log(`  Testing: "${test.name}"...`);
    
    const result = await getVerifiedPlayerStats(test.query);
    
    if (result.success && result.data) {
      const stats = result.data;
      
      // Verify response contract
      const hasAllFields = 
        stats.playerFullName &&
        stats.season &&
        stats.seasonType &&
        stats.gamesPlayed >= 0 &&
        stats.source === 'API-Sports NBA';
      
      if (hasAllFields) {
        console.log(`  ✅ ${stats.playerFullName}`);
        console.log(`     Season: ${stats.season} (${stats.seasonType})`);
        console.log(`     Games: ${stats.gamesPlayed}`);
        console.log(`     PPG: ${stats.stats.pointsPerGame} | RPG: ${stats.stats.reboundsPerGame} | APG: ${stats.stats.assistsPerGame}`);
        console.log(`     Source: ${stats.source}`);
        passed++;
      } else {
        console.log(`  ❌ Missing required fields in response`);
        console.log(`     Data: ${JSON.stringify(stats, null, 2)}`);
        failed++;
      }
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      failed++;
    }
    console.log();
  }
  
  // Test Team Stats
  console.log('🏟️ Testing Team Stats...\n');
  for (const test of TEAM_TESTS) {
    console.log(`  Testing: "${test.name}"...`);
    
    const result = await getVerifiedTeamStats(test.query);
    
    if (result.success && result.data) {
      const stats = result.data;
      
      // Verify response contract
      const hasAllFields = 
        stats.teamFullName &&
        stats.season &&
        stats.seasonType &&
        stats.gamesPlayed >= 0 &&
        stats.source === 'API-Sports NBA';
      
      if (hasAllFields) {
        console.log(`  ✅ ${stats.teamFullName}`);
        console.log(`     Season: ${stats.season} (${stats.seasonType})`);
        console.log(`     Record: ${stats.stats.wins}-${stats.stats.losses} (${(stats.stats.winPercentage * 100).toFixed(1)}%)`);
        console.log(`     PPG: ${stats.stats.pointsPerGame} | Opp PPG: ${stats.stats.pointsAllowedPerGame}`);
        console.log(`     Source: ${stats.source}`);
        passed++;
      } else {
        console.log(`  ❌ Missing required fields in response`);
        failed++;
      }
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      failed++;
    }
    console.log();
  }
  
  // Test Formatted Output
  console.log('📝 Testing Formatted Output...\n');
  const embiidResult = await getVerifiedPlayerStats('Embiid points this season');
  if (embiidResult.success && embiidResult.data) {
    const formatted = formatVerifiedPlayerStats(embiidResult.data);
    console.log('  Formatted Player Stats:');
    console.log('  ' + formatted.split('\n').join('\n  '));
    passed++;
  } else {
    console.log('  ❌ Could not format player stats');
    failed++;
  }
  console.log();
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
