/**
 * Backfill Prediction V2 Fields
 * 
 * Updates existing predictions with the new v2 tracking fields:
 * - selection
 * - modelProbability
 * - marketProbabilityRaw
 * - marketProbabilityFair
 * - marketOddsAtPrediction
 * - edgeValue
 * - edgeBucket
 * - marketType
 * - predictionTimestamp
 * 
 * Run: npx ts-node scripts/backfill-prediction-v2-fields.ts
 */

import 'dotenv/config';
import { PrismaClient, EdgeBucket } from '@prisma/client';
import { connect } from 'http2';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Backfill Prediction V2 Fields ===\n');
  
  // Get predictions that have legacy fields but missing v2 fields
  const predictions = await prisma.prediction.findMany({
    where: {
      modelVersion: 'v2',
      modelProbability: null,
      valueBetEdge: { not: null },
    },
  });
  
  console.log(`Found ${predictions.length} predictions needing v2 field backfill\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const p of predictions) {
    if (!p.valueBetEdge || !p.odds || !p.valueBetSide) {
      skipped++;
      continue;
    }
    
    // Calculate implied probability from odds
    const impliedProb = 1 / p.odds;
    
    // Model probability = implied prob + edge
    const modelProb = impliedProb + (p.valueBetEdge / 100);
    
    // Edge bucket
    let edgeBucket: EdgeBucket;
    if (p.valueBetEdge >= 8) {
      edgeBucket = 'HIGH';
    } else if (p.valueBetEdge >= 5) {
      edgeBucket = 'MEDIUM';
    } else if (p.valueBetEdge >= 2) {
      edgeBucket = 'SMALL';
    } else {
      edgeBucket = 'NO_EDGE';
    }
    
    // Selection (parse from match name)
    const matchParts = p.matchName.split(' vs ');
    const homeTeam = matchParts[0]?.trim();
    const awayTeam = matchParts[1]?.trim();
    const selection = p.valueBetSide === 'HOME' ? homeTeam :
                      p.valueBetSide === 'AWAY' ? awayTeam : 'Draw';
    
    try {
      await prisma.prediction.update({
        where: { id: p.id },
        data: {
          selection,
          modelProbability: modelProb * 100,
          marketProbabilityRaw: impliedProb * 100,
          marketProbabilityFair: impliedProb * 100,
          marketOddsAtPrediction: p.odds,
          edgeValue: p.valueBetEdge,
          edgeBucket,
          marketType: 'MONEYLINE',
          predictionTimestamp: p.createdAt,
        },
      });
      updated++;
      console.log(`✓ ${p.matchName} → ${selection} (${p.valueBetEdge.toFixed(1)}% edge)`);
    } catch (err) {
      console.error(`✗ ${p.matchName}: ${err}`);
      skipped++;
    }
  }
  
  console.log(`\n=== Results ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
connect



