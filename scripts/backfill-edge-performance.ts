/**
 * Backfill Edge Performance Fields for Existing Predictions
 * 
 * This script populates the new edge performance tracking fields:
 * - modelProbability, marketProbabilityFair, edgeValue, edgeBucket
 * - binaryOutcome (from legacy outcome field)
 * - selection (parsed from prediction text)
 * 
 * Run: npx ts-node scripts/backfill-edge-performance.ts
 */

import { PrismaClient, EdgeBucket, CallOutcome } from '@prisma/client';

const prisma = new PrismaClient();

// Edge bucket thresholds
const EDGE_THRESHOLDS = {
  NO_EDGE: 2,   // < 2%
  SMALL: 5,    // 2-5%
  MEDIUM: 8,   // 5-8%
  HIGH: 100,   // > 8%
};

function getEdgeBucket(edge: number): EdgeBucket {
  const absEdge = Math.abs(edge);
  if (absEdge < EDGE_THRESHOLDS.NO_EDGE) return 'NO_EDGE';
  if (absEdge < EDGE_THRESHOLDS.SMALL) return 'SMALL';
  if (absEdge < EDGE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'HIGH';
}

// Convert decimal odds to fair probability (no vig)
function oddsToFairProbability(odds: number): number {
  if (odds <= 1) return 100;
  return (1 / odds) * 100;
}

// Parse selection from prediction text
function parseSelection(prediction: string): string | null {
  const lower = prediction.toLowerCase();
  
  // Home/Away/Draw patterns
  if (lower.includes('home win') || lower.includes('home team')) return 'home';
  if (lower.includes('away win') || lower.includes('away team')) return 'away';
  if (lower.includes('draw')) return 'draw';
  
  // Over/Under patterns
  if (lower.includes('over')) return 'over';
  if (lower.includes('under')) return 'under';
  
  // BTTS patterns
  if (lower.includes('btts yes') || lower.includes('both teams to score: yes')) return 'btts_yes';
  if (lower.includes('btts no') || lower.includes('both teams to score: no')) return 'btts_no';
  
  // Try to match team names (generic)
  if (lower.includes('win') || lower.includes('victory')) {
    // Could be home or away, default to home if unclear
    return 'home';
  }
  
  return null;
}

// Convert legacy outcome to binary outcome
function toBinaryOutcome(outcome: CallOutcome): number | null {
  if (outcome === 'PENDING') return null;
  if (outcome === 'HIT') return 1;
  if (outcome === 'MISS') return 0;
  // PUSH/VOID etc - treat as null (excluded from analysis)
  return null;
}

async function backfillPredictions() {
  console.log('🔄 Starting Edge Performance Backfill...\n');

  // Get all predictions that need backfilling
  const predictions = await prisma.prediction.findMany({
    where: {
      modelVersion: 'v2',
      // Only backfill if we don't have edge data yet
      OR: [
        { edgeBucket: null },
        { binaryOutcome: null, outcome: { not: 'PENDING' } },
      ],
    },
    orderBy: { kickoff: 'desc' },
  });

  console.log(`📊 Found ${predictions.length} predictions to backfill\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const pred of predictions) {
    try {
      const updates: Record<string, unknown> = {};

      // 1. Compute binaryOutcome from legacy outcome
      if (pred.binaryOutcome === null && pred.outcome !== 'PENDING') {
        const binary = toBinaryOutcome(pred.outcome as CallOutcome);
        if (binary !== null) {
          updates.binaryOutcome = binary;
        }
      }

      // 2. Parse selection from prediction text
      if (!pred.selection && pred.prediction) {
        const selection = parseSelection(pred.prediction);
        if (selection) {
          updates.selection = selection;
        }
      }

      // 3. Compute market probability from odds
      const odds = pred.valueBetOdds || pred.odds;
      if (odds && odds > 1) {
        // Fair probability (assume ~5% vig, so raw implied / 1.05)
        const rawImplied = (1 / odds) * 100;
        const fairProb = rawImplied / 1.025; // Adjust for typical 2.5% vig per side
        
        if (!pred.marketProbabilityFair) {
          updates.marketProbabilityFair = Math.round(fairProb * 10) / 10;
        }
        if (!pred.marketProbabilityRaw) {
          updates.marketProbabilityRaw = Math.round(rawImplied * 10) / 10;
        }
        if (!pred.marketOddsAtPrediction) {
          updates.marketOddsAtPrediction = odds;
        }
      }

      // 4. Estimate model probability from valueBetEdge + market prob
      if (pred.valueBetEdge && !pred.modelProbability) {
        const marketFair = updates.marketProbabilityFair as number || pred.marketProbabilityFair;
        if (marketFair) {
          // Edge = P_model - P_market_fair, so P_model = Edge + P_market_fair
          const modelProb = marketFair + pred.valueBetEdge;
          updates.modelProbability = Math.round(Math.max(0, Math.min(100, modelProb)) * 10) / 10;
        }
      }

      // 5. Compute edge value
      const modelProb = updates.modelProbability as number || pred.modelProbability;
      const marketFair = updates.marketProbabilityFair as number || pred.marketProbabilityFair;
      
      if (modelProb && marketFair && pred.edgeValue === null) {
        const edge = modelProb - marketFair;
        updates.edgeValue = Math.round(edge * 10) / 10;
      }

      // 6. Classify into edge bucket
      const edgeValue = updates.edgeValue as number || pred.edgeValue;
      if (edgeValue !== null && edgeValue !== undefined && !pred.edgeBucket) {
        updates.edgeBucket = getEdgeBucket(edgeValue);
      }

      // 7. Set prediction timestamp if missing
      if (!pred.predictionTimestamp) {
        updates.predictionTimestamp = pred.createdAt;
      }

      // 8. Set result timestamp if we have outcome
      if (!pred.resultTimestamp && pred.validatedAt) {
        updates.resultTimestamp = pred.validatedAt;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await prisma.prediction.update({
          where: { id: pred.id },
          data: updates,
        });
        updated++;
        
        if (updated % 50 === 0) {
          console.log(`  ✓ Updated ${updated} predictions...`);
        }
      } else {
        skipped++;
      }
    } catch (err) {
      errors++;
      console.error(`  ✗ Error updating ${pred.id}:`, err);
    }
  }

  console.log('\n✅ Backfill Complete!');
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

async function showStats() {
  console.log('\n📈 Edge Performance Stats After Backfill:\n');

  // Count by edge bucket
  const bucketCounts = await prisma.prediction.groupBy({
    by: ['edgeBucket'],
    where: { modelVersion: 'v2', edgeBucket: { not: null } },
    _count: true,
  });

  console.log('Edge Bucket Distribution:');
  for (const bucket of bucketCounts) {
    console.log(`  ${bucket.edgeBucket}: ${bucket._count}`);
  }

  // Count by binary outcome
  const outcomeCounts = await prisma.prediction.groupBy({
    by: ['binaryOutcome'],
    where: { modelVersion: 'v2' },
    _count: true,
  });

  console.log('\nBinary Outcome Distribution:');
  for (const outcome of outcomeCounts) {
    const label = outcome.binaryOutcome === 1 ? 'Win' : outcome.binaryOutcome === 0 ? 'Loss' : 'Pending';
    console.log(`  ${label}: ${outcome._count}`);
  }

  // Count with edge data
  const withEdge = await prisma.prediction.count({
    where: { modelVersion: 'v2', edgeValue: { not: null } },
  });
  const total = await prisma.prediction.count({
    where: { modelVersion: 'v2' },
  });

  console.log(`\nTotal with Edge Data: ${withEdge}/${total} (${Math.round(withEdge/total*100)}%)`);
}

async function main() {
  try {
    await backfillPredictions();
    await showStats();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
