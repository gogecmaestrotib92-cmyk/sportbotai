/**
 * Test Script: Send Weekend Picks (Daily Picks)
 * 
 * Usage: npx tsx scripts/send-weekend-picks-test.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sendDailyTopMatchesEmail } from '../src/lib/email';

const TEST_EMAIL = 'gogecmaestrotib92@gmail.com';

async function main() {
  console.log('⚽ Sending test Weekend Picks to', TEST_EMAIL);
  
  const sampleMatches = [
    {
      homeTeam: 'Liverpool',
      awayTeam: 'Chelsea',
      league: 'Premier League',
      kickoff: '15:00',
      confidence: 78,
      prediction: 'Home Win',
      edge: '+4.1%',
      headline: 'Liverpool dominant at Anfield this season.',
    },
    {
      homeTeam: 'Real Madrid',
      awayTeam: 'Sevilla',
      league: 'La Liga',
      kickoff: '21:00',
      confidence: 84,
      prediction: 'Home Win',
      edge: '+6.2%',
      headline: 'Real Madrid unbeaten in 11 home matches.',
    },
  ];
  
  const success = await sendDailyTopMatchesEmail(
    'test-user-id',
    TEST_EMAIL,
    'Stefan',
    sampleMatches
  );
  
  if (success) {
    console.log('✅ Weekend Picks sent successfully!');
  } else {
    console.log('❌ Failed to send');
  }
  
  process.exit(0);
}

main().catch(console.error);
