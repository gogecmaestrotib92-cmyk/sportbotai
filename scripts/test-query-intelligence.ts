/**
 * Test Query Intelligence System
 * 
 * Tests the smart query understanding with various query types
 */

import { understandQuery, mapIntentToCategory } from '../src/lib/query-intelligence';

const testQueries = [
  // Match previews
  "Liverpool vs Chelsea this weekend",
  "What's the prediction for Lakers vs Warriors?",
  "Man City Arsenal analysis",
  
  // Team stats
  "How is Barcelona's form this season?",
  "Liverpool's last 5 games results",
  "Real Madrid injuries update",
  
  // Player stats
  "Haaland goal stats this season",
  "Who is the top scorer in Premier League?",
  "Messi vs Ronaldo career comparison",
  
  // Betting/odds
  "Best value bets for tonight",
  "What are the odds for Man United game?",
  "Over 2.5 goals probability Chelsea match",
  
  // Live updates
  "Is there any breaking news about Tottenham?",
  "Current score Liverpool game",
  "Latest transfer rumors Arsenal",
  
  // Head to head
  "Barcelona vs Real Madrid history",
  "How many times has Liverpool beaten City?",
  
  // General questions
  "When does the World Cup start?",
  "What's the weather for tonight's game?",
  "Hello, can you help me?",
  
  // Ambiguous
  "Tell me about Mbappe",
  "Lakers tonight",
  "Chelsea",
];

async function runTests() {
  console.log('🧠 Testing Query Intelligence System\n');
  console.log('='.repeat(70));

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    
    try {
      const understanding = await understandQuery(query);
      const legacyCategory = mapIntentToCategory(understanding.intent);
      
      console.log(`   Intent: ${understanding.intent}`);
      console.log(`   Confidence: ${Math.round(understanding.intentConfidence * 100)}%`);
      console.log(`   Legacy Category: ${legacyCategory}`);
      console.log(`   TimeFrame: ${understanding.timeFrame}`);
      
      const teams = understanding.entities.filter(e => e.type === 'TEAM').map(e => e.name);
      const players = understanding.entities.filter(e => e.type === 'PLAYER').map(e => e.name);
      const leagues = understanding.entities.filter(e => e.type === 'LEAGUE').map(e => e.name);
      
      if (teams.length > 0) {
        console.log(`   Teams: ${teams.join(', ')}`);
      }
      if (players.length > 0) {
        console.log(`   Players: ${players.join(', ')}`);
      }
      if (leagues.length > 0) {
        console.log(`   Leagues: ${leagues.join(', ')}`);
      }
      if (understanding.sport) {
        console.log(`   Sport: ${understanding.sport}`);
      }
      if (understanding.suggestedDataSources.length > 0) {
        console.log(`   Data Sources: ${understanding.suggestedDataSources.join(', ')}`);
      }
      if (understanding.isAmbiguous) {
        console.log(`   ⚠️ Ambiguous! Question: ${understanding.clarifyingQuestion}`);
      }
      
      console.log('-'.repeat(70));
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log('\n✅ Test complete!');
}

runTests().catch(console.error);
