/**
 * Test Script: Send Edge Report
 * 
 * Usage: npx tsx scripts/send-edge-report-test.ts
 * 
 * Sends a test "The Edge Report" email to contact@sportbotai.com
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sendWeeklyEdgeReport } from '../src/lib/email';

const TEST_EMAIL = 'gogecmaestrotib92@gmail.com';

async function main() {
  console.log('📊 Sending test Edge Report to', TEST_EMAIL);
  
  const sampleData = {
    picks: [
      {
        homeTeam: 'Arsenal',
        awayTeam: 'Manchester United',
        league: 'Premier League',
        kickoff: 'Sat 15:00',
        prediction: 'Home Win',
        confidence: 82,
        edge: '+5.3% edge',
        insight: 'Arsenal unbeaten at home in 14 matches. United struggling away with just 2 wins from last 8. Arteta\'s pressing system dominant — xG gap of 1.2 in last 5 home games.',
      },
      {
        homeTeam: 'Barcelona',
        awayTeam: 'Atletico Madrid',
        league: 'La Liga',
        kickoff: 'Sun 21:00',
        prediction: 'Over 2.5 Goals',
        confidence: 76,
        edge: '+3.8% edge',
        insight: 'Barcelona\'s last 8 home games have seen 3+ goals. Atletico more open this season under Simeone with a shift to 4-4-2. BTTS in 6 of last 7 H2H meetings.',
      },
      {
        homeTeam: 'Inter Milan',
        awayTeam: 'Juventus',
        league: 'Serie A',
        kickoff: 'Sun 18:00',
        prediction: 'Home Win',
        confidence: 71,
        edge: '+2.9% edge',
        insight: 'Derby d\'Italia at San Siro. Inter dominant at home with 9W-1D-0L. Juventus missing 3 key defenders. Lautaro Martínez on a 5-match scoring streak.',
      },
    ],
    trackRecord: {
      totalPicks: 12,
      correct: 8,
      hitRate: 66.7,
      streak: 'W3',
    },
    weeklyInsight: {
      title: 'Home advantage is back — and bigger than before',
      body: 'Our data shows home win rates across Europe\'s top 5 leagues jumped to 49.2% this month, up from 44.1% last season. The biggest shift? Serie A, where home teams are winning at 54%. Factor this into your analysis — the market is still pricing home advantage at pre-COVID levels.',
    },
    proPick: {
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      league: 'Bundesliga · Der Klassiker',
      confidence: 88,
    },
  };
  
  const success = await sendWeeklyEdgeReport(
    'test-user-id',
    TEST_EMAIL,
    'Stefan',
    sampleData
  );
  
  if (success) {
    console.log('✅ Edge Report sent successfully!');
  } else {
    console.log('❌ Failed to send Edge Report');
  }
  
  process.exit(0);
}

main().catch(console.error);
