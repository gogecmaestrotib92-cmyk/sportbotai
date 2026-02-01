import { sendDailyTopMatchesEmail } from '../src/lib/email';

const testMatches = [
  {
    homeTeam: 'Arsenal',
    awayTeam: 'Manchester City',
    league: 'Premier League',
    kickoff: '17:30',
    confidence: 78,
    prediction: 'Over 2.5 Goals',
    edge: '+5.2%',
    headline: 'Both teams averaging 3.1 goals in last 5 H2H meetings'
  },
  {
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    league: 'La Liga',
    kickoff: '21:00',
    confidence: 72,
    prediction: 'BTTS Yes',
    edge: '+4.8%',
    headline: 'El Clásico - both teams have scored in 8 of last 10'
  },
  {
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    league: 'Serie A',
    kickoff: '20:45',
    confidence: 65,
    prediction: 'Home Win',
    edge: '+3.1%',
    headline: 'Inter unbeaten at home this season (12W-3D)'
  }
];

async function main() {
  console.log('Sending test Daily Picks email...');
  
  const result = await sendDailyTopMatchesEmail(
    'test-user-id',
    'gogecmaestrotib92@gmail.com',
    'Stefan',
    testMatches
  );
  
  console.log(result ? '✅ Email sent!' : '❌ Failed to send');
  process.exit(0);
}

main().catch(console.error);
