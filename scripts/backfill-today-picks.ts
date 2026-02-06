/**
 * Backfill today's predictions with modelProbability and edgeValue from fullResponse
 * 
 * Run: npx tsx scripts/backfill-today-picks.ts
 */

import 'dotenv/config';
import { PrismaClient, EdgeBucket } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillToday() {
  console.log('=== Backfilling today\'s predictions from fullResponse ===');
  
  // Get predictions from today/tomorrow that are missing modelProbability
  const predictions = await prisma.prediction.findMany({
    where: {
      kickoff: { gte: new Date('2026-02-04T00:00:00Z') },
      modelProbability: null,
      fullResponse: { not: null },
    }
  });
  
  console.log(`Found ${predictions.length} predictions to backfill\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const p of predictions) {
    const fr = p.fullResponse as Record<string, unknown>;
    if (!fr) { skipped++; continue; }
    
    // Extract from fullResponse
    const marketIntel = (fr.marketIntel || {}) as Record<string, unknown>;
    const modelProbs = (marketIntel.modelProbability || {}) as Record<string, number>;
    const valueEdge = (marketIntel.valueEdge || {}) as Record<string, unknown>;
    
    // Get the model probability for the selected side
    let modelProb: number | null = null;
    let edgeVal: number | null = (valueEdge.edgePercent as number) ?? null;
    
    // Determine what side was selected
    const selectedSide = p.prediction?.toLowerCase(); // 'home', 'away', 'draw'
    if (selectedSide && modelProbs) {
      if (selectedSide === 'home' && modelProbs.home) {
        modelProb = modelProbs.home;
      } else if (selectedSide === 'away' && modelProbs.away) {
        modelProb = modelProbs.away;
      }
    }
    
    // If no modelProb, try to derive from homeWin/awayWin/draw fields
    if (!modelProb && p.homeWin && p.awayWin) {
      if (selectedSide === 'home') modelProb = p.homeWin * 100;
      else if (selectedSide === 'away') modelProb = p.awayWin * 100;
      else if (selectedSide === 'draw' && p.draw) modelProb = (p.draw as number) * 100;
    }
    
    if (!modelProb || !edgeVal) {
      console.log(`⏭️ Skip ${p.matchName}: modelProb=${modelProb}, edge=${edgeVal}`);
      skipped++;
      continue;
    }
    
    // Edge bucket
    let edgeBucket: EdgeBucket;
    if (edgeVal >= 8) edgeBucket = 'HIGH';
    else if (edgeVal >= 5) edgeBucket = 'MEDIUM';
    else if (edgeVal >= 2) edgeBucket = 'SMALL';
    else if (edgeVal > 0) edgeBucket = 'NO_EDGE';
    else edgeBucket = 'NEGATIVE';
    
    // Generate headline from fullResponse
    let headline = '';
    const headlines = (fr.headlines || []) as Array<{text?: string}>;
    if (headlines[0]?.text) {
      headline = headlines[0].text;
    } else {
      const story = (fr.story || {}) as Record<string, unknown>;
      const snapshot = (story.snapshot || []) as string[];
      if (snapshot[0]) {
        headline = snapshot[0];
      }
    }
    
    try {
      await prisma.prediction.update({
        where: { id: p.id },
        data: {
          modelProbability: Math.round(modelProb * 100 * 10) / 10, // Convert to percentage with 1 decimal
          edgeValue: Math.round(edgeVal * 10) / 10,
          edgeBucket,
          headline: headline || null,
        },
      });
      updated++;
      console.log(`✅ ${p.matchName} → Model: ${modelProb.toFixed(1)}%, Edge: ${edgeVal.toFixed(1)}%`);
    } catch (err) {
      console.error(`❌ ${p.matchName}: ${err}`);
      skipped++;
    }
  }
  
  console.log(`\n=== Results ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

backfillToday().finally(() => prisma.$disconnect());
