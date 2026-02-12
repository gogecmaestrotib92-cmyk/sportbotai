/**
 * Test script to verify Steam Move and Reverse Line Movement detection
 * 
 * Run with: npx tsx scripts/test-steam-detection.ts
 */

import { analyzeMarket, calculateModelProbability, type OddsData } from '../src/lib/value-detection.js';
import type { UniversalSignals } from '../src/lib/universal-signals.js';

// Mock signals for testing (matching actual interface)
const mockSignals: UniversalSignals = {
  form: 'Strong',
  strength_edge: 'Home +15%',
  tempo: 'Medium',
  efficiency_edge: 'Home offense',
  availability_impact: 'Low',
  confidence: 'high',
  clarity_score: 75,
  display: {
    edge: { direction: 'home', percentage: 15, label: 'Home +15%' },
    form: { home: 'strong', away: 'neutral', trend: 'home_better', label: 'Home in better form' },
    tempo: { level: 'medium', label: 'Medium pace', avgGoals: 1.6 },
    efficiency: { winner: 'home', aspect: 'offense', label: 'Home more efficient', homeOffense: 1.8, awayOffense: 1.2, homeDefense: 0.9, awayDefense: 1.3 },
    availability: { level: 'low', note: null, label: 'Normal availability' },
  },
};

console.log('='.repeat(60));
console.log('STEAM MOVE & RLM DETECTION TEST');
console.log('='.repeat(60));

// Test 1: No previous odds (current production behavior)
console.log('\n📊 TEST 1: No Previous Odds (current behavior)');
const currentOdds: OddsData = { homeOdds: 1.80, awayOdds: 4.50, drawOdds: 3.60 };
const result1 = analyzeMarket(mockSignals, currentOdds, true, undefined, 'epl');
console.log('  Line Movement:', result1.lineMovement || 'undefined (no previous odds)');
console.log('  Model Prob:', result1.modelProbability);

// Test 2: Sharp steam move toward home (odds shortened significantly)
console.log('\n🔥 TEST 2: Sharp Steam Move TOWARD HOME');
const previousOdds1: OddsData = { homeOdds: 2.10, awayOdds: 3.80, drawOdds: 3.50 };
const currentOdds1: OddsData = { homeOdds: 1.80, awayOdds: 4.50, drawOdds: 3.60 };
// Home odds went from 2.10 → 1.80 = 0.30 drop = sharp move toward home
const result2 = analyzeMarket(mockSignals, currentOdds1, true, previousOdds1, 'epl');
console.log('  Previous Home Odds: 2.10 → Current: 1.80 (diff: 0.30)');
console.log('  Line Movement:', result2.lineMovement);
console.log('  Is Steam Move:', result2.lineMovement?.isSteamMove);
console.log('  Steam Direction:', result2.lineMovement?.steamDirection);
console.log('  Model Prob (with steam):', result2.modelProbability);

// Test 3: Sharp steam move toward away
console.log('\n🔥 TEST 3: Sharp Steam Move TOWARD AWAY');
const previousOdds2: OddsData = { homeOdds: 1.80, awayOdds: 4.00, drawOdds: 3.60 };
const currentOdds2: OddsData = { homeOdds: 2.10, awayOdds: 3.40, drawOdds: 3.50 };
// Home odds went from 1.80 → 2.10 = 0.30 increase = sharp move toward away
const result3 = analyzeMarket(mockSignals, currentOdds2, true, previousOdds2, 'epl');
console.log('  Previous Home Odds: 1.80 → Current: 2.10 (diff: -0.30)');
console.log('  Line Movement:', result3.lineMovement);
console.log('  Is Steam Move:', result3.lineMovement?.isSteamMove);
console.log('  Steam Direction:', result3.lineMovement?.steamDirection);
console.log('  Model Prob (with steam):', result3.modelProbability);

// Test 4: Reverse Line Movement
console.log('\n🔄 TEST 4: Reverse Line Movement Detection');
// Model strongly favors home (edge: home +15%), but line is moving toward away
const previousOdds3: OddsData = { homeOdds: 1.70, awayOdds: 5.00, drawOdds: 3.80 };
const currentOdds3: OddsData = { homeOdds: 1.95, awayOdds: 4.00, drawOdds: 3.60 };
// Home odds drifted out (1.70 → 1.95) despite model favoring home = RLM
const result4 = analyzeMarket(mockSignals, currentOdds3, true, previousOdds3, 'epl');
console.log('  Model favors: HOME (+15% edge)');
console.log('  Line moving: TOWARD AWAY (home 1.70 → 1.95)');
console.log('  Is Reverse:', result4.lineMovement?.isReverse);
console.log('  RLM Explanation:', result4.lineMovement?.rlmExplanation);

// Test 5: Compare probability WITH vs WITHOUT steam
console.log('\n📈 TEST 5: Probability Comparison (Steam Impact)');
const probWithoutSteam = calculateModelProbability(mockSignals, true, 'epl');
const probWithSteam = calculateModelProbability(mockSignals, true, 'epl', {
  detected: true,
  direction: 'home',
  magnitude: 'sharp',
});
console.log('  Without Steam:', probWithoutSteam);
console.log('  With Sharp Steam (home):', probWithSteam);
console.log('  Home Prob Boost:', probWithSteam.home - probWithoutSteam.home, '%');

// Test 6: League calibration comparison
console.log('\n🌍 TEST 6: League Calibration Comparison');
const leagues = ['epl', 'laliga', 'bundesliga', 'seriea', 'ligue1'];
for (const league of leagues) {
  const prob = calculateModelProbability(mockSignals, true, league);
  console.log(`  ${league.padEnd(12)}: Home ${prob.home}% | Away ${prob.away}% | Draw ${prob.draw}%`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!');
console.log('='.repeat(60));
