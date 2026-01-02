/**
 * Fix Prediction Outcomes - Re-validate with correct logic
 * 
 * The bug: "if (pred.includes('home') || pred.includes('win'))"
 * caused ALL predictions with "win" to be treated as home predictions
 * 
 * This means "Away Win - Liverpool" was being validated as a HOME prediction!
 * 
 * Run: npx tsx scripts/fix-prediction-outcomes.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface MatchResult {
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
}

function validatePredictionFixed(
  prediction: string,
  result: MatchResult
): { outcome: 'HIT' | 'MISS' | 'PUSH'; reason: string } {
  const pred = prediction.toLowerCase();
  const { homeScore, awayScore, winner } = result;
  
  // FIXED LOGIC: Check specific patterns first
  if (pred.includes('home win') || (pred.includes('home') && !pred.includes('away'))) {
    return winner === 'home' 
      ? { outcome: 'HIT', reason: 'Home team won as predicted' }
      : { outcome: 'MISS', reason: `Predicted home win, got ${winner}` };
  }
  
  if (pred.includes('away win') || (pred.includes('away') && !pred.includes('home'))) {
    return winner === 'away'
      ? { outcome: 'HIT', reason: 'Away team won as predicted' }
      : { outcome: 'MISS', reason: `Predicted away win, got ${winner}` };
  }
  
  if (pred.includes('draw')) {
    return winner === 'draw'
      ? { outcome: 'HIT', reason: 'Draw as predicted' }
      : { outcome: 'MISS', reason: `Predicted draw, got ${winner} win` };
  }
  
  return { outcome: 'MISS', reason: 'Could not determine prediction type' };
}

async function main() {
  console.log('🔍 Finding predictions with results...\n');
  
  // Get all settled predictions (HIT or MISS) that have scores
  const predictions = await prisma.prediction.findMany({
    where: {
      outcome: { in: ['HIT', 'MISS'] },
      actualScore: { not: null },
    },
    orderBy: { kickoff: 'desc' },
  });
  
  console.log(`Found ${predictions.length} predictions with results\n`);
  
  let fixed = 0;
  let unchanged = 0;
  const changes: Array<{ match: string; prediction: string; oldOutcome: string; newOutcome: string; reason: string }> = [];
  
  for (const pred of predictions) {
    // Parse score from "2-1" format
    const scoreParts = pred.actualScore!.split('-').map(s => parseInt(s.trim()));
    if (scoreParts.length !== 2 || scoreParts.some(isNaN)) {
      console.log(`⚠️  Skipping ${pred.matchName} - invalid score format: ${pred.actualScore}`);
      continue;
    }
    
    const result: MatchResult = {
      homeScore: scoreParts[0],
      awayScore: scoreParts[1],
      winner: scoreParts[0] > scoreParts[1] ? 'home' :
              scoreParts[1] > scoreParts[0] ? 'away' : 'draw',
    };
    
    const corrected = validatePredictionFixed(pred.prediction, result);
    
    if (corrected.outcome !== pred.outcome) {
      fixed++;
      changes.push({
        match: pred.matchName,
        prediction: pred.prediction,
        oldOutcome: pred.outcome,
        newOutcome: corrected.outcome,
        reason: corrected.reason,
      });
      
      // Update in database
      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          outcome: corrected.outcome,
        },
      });
    } else {
      unchanged++;
    }
  }
  
  console.log('📊 Results:\n');
  console.log(`✅ Fixed: ${fixed} predictions`);
  console.log(`   Unchanged: ${unchanged} predictions\n`);
  
  if (changes.length > 0) {
    console.log('🔄 Changes made:\n');
    for (const change of changes.slice(0, 20)) {
      console.log(`${change.match}`);
      console.log(`  Prediction: ${change.prediction}`);
      console.log(`  ${change.oldOutcome} → ${change.newOutcome} (${change.reason})`);
      console.log();
    }
    
    if (changes.length > 20) {
      console.log(`... and ${changes.length - 20} more\n`);
    }
    
    // Calculate new accuracy
    const allUpdated = await prisma.prediction.findMany({
      where: { outcome: { in: ['HIT', 'MISS'] } },
    });
    
    const hits = allUpdated.filter(p => p.outcome === 'HIT').length;
    const total = allUpdated.length;
    const accuracy = ((hits / total) * 100).toFixed(1);
    
    console.log('📈 New Accuracy Stats:\n');
    console.log(`Overall: ${accuracy}% (${hits}/${total})`);
    
    // By prediction type
    const homePredsUpdated = allUpdated.filter(p => 
      p.prediction.toLowerCase().includes('home win') || 
      (p.prediction.toLowerCase().includes('home') && !p.prediction.toLowerCase().includes('away'))
    );
    const awayPredsUpdated = allUpdated.filter(p => 
      p.prediction.toLowerCase().includes('away win') || 
      (p.prediction.toLowerCase().includes('away') && !p.prediction.toLowerCase().includes('home'))
    );
    const drawPredsUpdated = allUpdated.filter(p => p.prediction.toLowerCase().includes('draw'));
    
    const homeHits = homePredsUpdated.filter(p => p.outcome === 'HIT').length;
    const awayHits = awayPredsUpdated.filter(p => p.outcome === 'HIT').length;
    const drawHits = drawPredsUpdated.filter(p => p.outcome === 'HIT').length;
    
    console.log(`Home Win: ${homePredsUpdated.length > 0 ? ((homeHits / homePredsUpdated.length) * 100).toFixed(1) : '0'}% (${homeHits}/${homePredsUpdated.length})`);
    console.log(`Away Win: ${awayPredsUpdated.length > 0 ? ((awayHits / awayPredsUpdated.length) * 100).toFixed(1) : '0'}% (${awayHits}/${awayPredsUpdated.length})`);
    console.log(`Draw: ${drawPredsUpdated.length > 0 ? ((drawHits / drawPredsUpdated.length) * 100).toFixed(1) : '0'}% (${drawHits}/${drawPredsUpdated.length})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
