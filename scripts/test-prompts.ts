import { classifyQuery, QueryIntent } from '../src/lib/query-intelligence';

// All the prompts we offer to users (from suggested-prompts, components, etc.)
const OFFERED_PROMPTS = [
  // From AIDeskChat.tsx & AIDeskHeroChat.tsx fallbacks
  "Analyze Real Madrid vs Barcelona",
  "What's the latest injury news for Arsenal?",
  "Who's top of the Serie A table?",
  "How many goals has Haaland scored this season?",
  "Any transfer rumors for the January window?",
  "When do Liverpool play next in the Premier League?",
  
  // From suggested-prompts/route.ts STATIC_PROMPTS.general
  "Who is the starting goalkeeper for Real Madrid?",
  "What are the current NBA standings?",
  "Who leads the NFL in passing yards?",
  
  // From STATIC_PROMPTS.seasonal
  "Who leads the MVP race in the NBA?",
  "Which teams are in the Champions League knockouts?",
  "Who's on a hot streak in the NHL right now?",
  "What's the latest on the NFL playoff picture?",
  "Who are the top scorers in La Liga this season?",
  
  // From STATIC_PROMPTS.news
  "Any major injuries reported today?",
  "What matches are happening this weekend?",
  "Latest manager news in the Premier League",
  "Who scored hat-tricks this week?",
  "What did Guardiola say in his latest press conference?",
  
  // Dynamic format: "Analyze X vs Y"
  "Analyze Sevilla vs Celta Vigo",
  "Analyze Lakers vs Celtics",
  "Analyze Chiefs vs Bills",
  
  // Personalized prompts format (from getPersonalizedPrompts)
  "Will Arsenal win their next game?",
  "Any injury updates for Manchester United?",
  "Latest news on Chelsea",
  "How's Liverpool's form lately?",
];

// Expected intent for each prompt
const EXPECTED_INTENTS: Record<string, QueryIntent[]> = {
  "Analyze Real Madrid vs Barcelona": ['MATCH_PREDICTION'],
  "What's the latest injury news for Arsenal?": ['INJURY_NEWS'],
  "Who's top of the Serie A table?": ['STANDINGS'],
  "How many goals has Haaland scored this season?": ['PLAYER_STATS'],
  "Any transfer rumors for the January window?": ['NEWS', 'GENERAL'],
  "When do Liverpool play next in the Premier League?": ['SCHEDULE'],
  "Who is the starting goalkeeper for Real Madrid?": ['LINEUP', 'PLAYER_STATS'],
  "What are the current NBA standings?": ['STANDINGS'],
  "Who leads the NFL in passing yards?": ['PLAYER_STATS', 'STANDINGS'],
  "Who leads the MVP race in the NBA?": ['PLAYER_STATS', 'NEWS'],
  "Which teams are in the Champions League knockouts?": ['STANDINGS', 'NEWS'],
  "Who's on a hot streak in the NHL right now?": ['FORM_CHECK', 'NEWS'],
  "What's the latest on the NFL playoff picture?": ['STANDINGS', 'NEWS'],
  "Who are the top scorers in La Liga this season?": ['PLAYER_STATS'],
  "Any major injuries reported today?": ['INJURY_NEWS'],
  "What matches are happening this weekend?": ['SCHEDULE'],
  "Latest manager news in the Premier League": ['NEWS', 'GENERAL'],
  "Who scored hat-tricks this week?": ['PLAYER_STATS', 'NEWS', 'MATCH_RESULT'],
  "What did Guardiola say in his latest press conference?": ['NEWS', 'GENERAL'],
  "Analyze Sevilla vs Celta Vigo": ['MATCH_PREDICTION'],
  "Analyze Lakers vs Celtics": ['MATCH_PREDICTION'],
  "Analyze Chiefs vs Bills": ['MATCH_PREDICTION'],
  "Will Arsenal win their next game?": ['MATCH_PREDICTION'],
  "Any injury updates for Manchester United?": ['INJURY_NEWS'],
  "Latest news on Chelsea": ['NEWS', 'FORM_CHECK'],
  "How's Liverpool's form lately?": ['FORM_CHECK'],
};

async function testPrompts() {
  console.log('Testing all offered prompts against query intelligence...\n');
  
  let passed = 0;
  let failed = 0;
  const failures: { prompt: string; got: string; expected: string[] }[] = [];
  
  for (const prompt of OFFERED_PROMPTS) {
    const result = await classifyQuery(prompt);
    const expected = EXPECTED_INTENTS[prompt] || ['GENERAL'];
    const isPass = expected.includes(result.intent);
    
    if (isPass) {
      console.log(`✅ "${prompt.substring(0, 50)}..." → ${result.intent}`);
      passed++;
    } else {
      console.log(`❌ "${prompt.substring(0, 50)}..." → ${result.intent} (expected: ${expected.join(' or ')})`);
      failures.push({ prompt, got: result.intent, expected });
      failed++;
    }
  }
  
  console.log('\n========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');
  
  if (failures.length > 0) {
    console.log('FAILURES:\n');
    for (const f of failures) {
      console.log(`  Prompt: "${f.prompt}"`);
      console.log(`  Got: ${f.got}, Expected: ${f.expected.join(' or ')}`);
      console.log('');
    }
  }
}

testPrompts().catch(console.error);
