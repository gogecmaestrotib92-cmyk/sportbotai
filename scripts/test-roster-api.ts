/**
 * Test script for API-based team roster lookup via DataLayer
 * 
 * Run with: npx tsx scripts/test-roster-api.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getMatchRostersV2 } from '../src/lib/data-layer/bridge';
import { DataLayer } from '../src/lib/data-layer';

const dataLayer = new DataLayer();

async function testRosterAPI() {
  console.log('=== Testing DataLayer-based Roster Lookup ===\n');
  
  // First, we need to find team IDs
  console.log('Finding team IDs...\n');
  
  const okcResult = await dataLayer.findTeam({ sport: 'basketball', name: 'Oklahoma City Thunder' });
  const okcTeam = okcResult.success ? okcResult.data : null;
  console.log(`OKC Team ID: ${okcTeam?.id || 'NOT FOUND'}`);
  
  const bullsResult = await dataLayer.findTeam({ sport: 'basketball', name: 'Chicago Bulls' });
  const bullsTeam = bullsResult.success ? bullsResult.data : null;
  console.log(`Bulls Team ID: ${bullsTeam?.id || 'NOT FOUND'}`);
  
  const mavsResult = await dataLayer.findTeam({ sport: 'basketball', name: 'Dallas Mavericks' });
  const mavsTeam = mavsResult.success ? mavsResult.data : null;
  console.log(`Mavericks Team ID: ${mavsTeam?.id || 'NOT FOUND'}\n`);
  
  // Test NBA rosters via DataLayer
  console.log('Testing NBA (Oklahoma City Thunder) via DataLayer...');
  if (okcTeam) {
    const okcResult = await dataLayer.getTeamRoster('basketball', okcTeam.id);
    if (okcResult.success && okcResult.data) {
      const okcRoster = okcResult.data;
      console.log(`✅ Found ${okcRoster.length} players for ${okcTeam.name}`);
      console.log('Top 5 players:');
      okcRoster.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.position || 'N/A'})`);
      });
      // Check if Josh Giddey is NOT there (traded to Bulls)
      const giddey = okcRoster.find(p => p.name.toLowerCase().includes('giddey'));
      if (giddey) {
        console.log(`  ⚠️ WARNING: Josh Giddey still showing in OKC roster!`);
      } else {
        console.log(`  ✅ Josh Giddey not in OKC roster (correct - traded to Bulls)`);
      }
    } else {
      console.log(`❌ Failed to get OKC roster: ${okcResult.error?.message}`);
    }
  } else {
    console.log('❌ Failed to find OKC team');
  }
  
  console.log('\nTesting NBA (Chicago Bulls) via DataLayer...');
  if (bullsTeam) {
    const bullsResult = await dataLayer.getTeamRoster('basketball', bullsTeam.id);
    if (bullsResult.success && bullsResult.data) {
      const bullsRoster = bullsResult.data;
      console.log(`✅ Found ${bullsRoster.length} players for ${bullsTeam.name}`);
      // Check if Josh Giddey is there
      const giddey = bullsRoster.find(p => p.name.toLowerCase().includes('giddey'));
      if (giddey) {
        console.log(`  🏀 Josh Giddey found: ${giddey.name} (${giddey.position || 'N/A'})`);
      } else {
        console.log(`  ⚠️ WARNING: Josh Giddey NOT found in Bulls roster!`);
      }
      console.log('Top 5 players:');
      bullsRoster.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.position || 'N/A'})`);
      });
    } else {
      console.log(`❌ Failed to get Bulls roster: ${bullsResult.error?.message}`);
    }
  } else {
    console.log('❌ Failed to find Bulls team');
  }
  
  console.log('\nTesting NBA (Dallas Mavericks) via DataLayer...');
  if (mavsTeam) {
    const mavsResult = await dataLayer.getTeamRoster('basketball', mavsTeam.id);
    if (mavsResult.success && mavsResult.data) {
      const mavsRoster = mavsResult.data;
      console.log(`✅ Found ${mavsRoster.length} players for ${mavsTeam.name}`);
      // Check if Luka is NOT there (traded to Lakers)
      const luka = mavsRoster.find(p => p.name.toLowerCase().includes('doncic'));
      if (luka) {
        console.log(`  ⚠️ WARNING: Luka Dončić still showing in Mavs roster!`);
      } else {
        console.log(`  ✅ Luka Dončić not in Mavs roster (correct - traded to Lakers)`);
      }
      console.log('Top 5 players:');
      mavsRoster.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.position || 'N/A'})`);
      });
    } else {
      console.log(`❌ Failed to get Mavs roster: ${mavsResult.error?.message}`);
    }
  } else {
    console.log('❌ Failed to find Mavericks team');
  }
  
  // Test match rosters using bridge function
  console.log('\n=== Testing Match Rosters via Bridge ===\n');
  console.log('OKC Thunder vs Chicago Bulls...');
  const matchRosters = await getMatchRostersV2('Oklahoma City Thunder', 'Chicago Bulls', 'basketball');
  if (matchRosters) {
    console.log('Match rosters preview:');
    console.log(matchRosters.substring(0, 800) + '...');
  } else {
    console.log('❌ Failed to get match rosters');
  }
  
  console.log('\n=== Test Complete ===');
}

testRosterAPI().catch(console.error);
