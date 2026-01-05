/**
 * Test NBA Injury Data via Perplexity
 * 
 * Usage: npx ts-node scripts/test-nba-injuries.ts
 */

import 'dotenv/config';

// Perplexity client (inline for testing)
async function searchPerplexity(query: string): Promise<{
  success: boolean;
  content: string;
  citations: string[];
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      content: 'PERPLEXITY_API_KEY not set in .env',
      citations: [],
    };
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const systemPrompt = `You are a sports injury reporter. Today is ${today}.

Your task is to find CURRENT injury reports for NBA teams.

REQUIREMENTS:
1. Only report injuries that are ACTIVE/CURRENT (not past injuries)
2. Include: Player name, injury type, status (Out/Doubtful/Questionable/Probable), expected return
3. Cite sources (ESPN, NBA.com, team official sources)
4. If no injuries found, say "No reported injuries"

Format each injury as:
- [PLAYER NAME] - [INJURY TYPE] - [STATUS] - [EXPECTED RETURN if known]

Be concise but complete.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        max_tokens: 1500,
        temperature: 0.1,
        search_recency_filter: 'day',
        return_citations: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        content: `Perplexity API error: ${response.status} - ${error}`,
        citations: [],
      };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices?.[0]?.message?.content || 'No content',
      citations: data.citations || [],
    };
  } catch (error) {
    return {
      success: false,
      content: `Error: ${error}`,
      citations: [],
    };
  }
}

async function testNBAInjuries() {
  console.log('🏀 Testing NBA Injury Data via Perplexity\n');
  console.log('='.repeat(60));

  // Test 1: Specific team injuries
  const teams = [
    'New York Knicks',
    'Los Angeles Lakers',
    'Boston Celtics',
  ];

  for (const team of teams) {
    console.log(`\n📋 ${team} Injury Report:`);
    console.log('-'.repeat(40));
    
    const result = await searchPerplexity(`${team} injury report today current injuries status`);
    
    if (result.success) {
      console.log(result.content);
      if (result.citations.length > 0) {
        console.log('\n📚 Sources:');
        result.citations.slice(0, 3).forEach((url, i) => {
          console.log(`  ${i + 1}. ${url}`);
        });
      }
    } else {
      console.log(`❌ Failed: ${result.content}`);
    }
    
    console.log('-'.repeat(40));
    
    // Rate limit pause
    await new Promise(r => setTimeout(r, 1000));
  }

  // Test 2: Two-team matchup (for pre-match analysis)
  console.log('\n\n🆚 Testing Match-Specific Injuries:');
  console.log('='.repeat(60));
  
  const matchResult = await searchPerplexity(
    'Detroit Pistons vs New York Knicks injury report both teams injuries status today'
  );
  
  if (matchResult.success) {
    console.log(matchResult.content);
    if (matchResult.citations.length > 0) {
      console.log('\n📚 Sources:');
      matchResult.citations.slice(0, 5).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }
  } else {
    console.log(`❌ Failed: ${matchResult.content}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete');
}

testNBAInjuries().catch(console.error);
