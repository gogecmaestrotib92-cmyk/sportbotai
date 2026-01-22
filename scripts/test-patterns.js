// Test the INSTANT PATH regex patterns

const instantMatchPattern = /^([a-zA-Z\s]+?)\s+(?:vs\.?|versus|against|@|-)\s+([a-zA-Z\s]+)$/i;
const simpleMatchPattern = /^([a-zA-Z]{3,})\s+([a-zA-Z]{3,})$/i;

const testCases = [
  'Roma vs Stuttgart',
  'roma vs stuttgart',
  'AS Roma vs VfB Stuttgart',
  'Roma Stuttgart',
  'roma stuttgart',
  'Roma - Stuttgart',
  'who will win Roma vs Stuttgart',
  'analyze Roma vs Stuttgart',
];

console.log('Testing INSTANT PATH patterns:\n');

for (const test of testCases) {
  const trimmed = test.trim();
  let match = trimmed.match(instantMatchPattern);
  let patternUsed = 'instantMatchPattern';
  
  if (!match) {
    match = trimmed.match(simpleMatchPattern);
    patternUsed = 'simpleMatchPattern';
  }
  
  if (match) {
    const [, rawHome, rawAway] = match;
    const homeWord = rawHome.trim().split(/\s+/).pop() || '';
    const awayWord = rawAway.trim().split(/\s+/).pop() || '';
    console.log(`✅ "${test}"`);
    console.log(`   Pattern: ${patternUsed}`);
    console.log(`   homeWord: "${homeWord}", awayWord: "${awayWord}"`);
  } else {
    console.log(`❌ "${test}" - NO MATCH`);
  }
  console.log('');
}
