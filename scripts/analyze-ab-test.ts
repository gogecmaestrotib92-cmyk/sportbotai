#!/usr/bin/env npx tsx
/**
 * A/B Test Analysis Script
 * 
 * Analyzes A/B test results for query classification.
 * Compares performance metrics between variant A (control) and B (test).
 * 
 * Usage: npx tsx scripts/analyze-ab-test.ts [test-id]
 * Example: npx tsx scripts/analyze-ab-test.ts query-classification-2026-01
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VariantStats {
  variant: string;
  totalQueries: number;
  avgConfidence: number;
  llmFallbackRate: number;
  feedbackPositive: number;
  feedbackNegative: number;
  feedbackRate: number;
  mismatchCount: number;
  mismatchRate: number;
  avgLatencyMs: number;
}

async function getVariantStats(testId: string, variant: 'A' | 'B'): Promise<VariantStats> {
  const where = { 
    abTestId: testId, 
    abTestVariant: variant 
  };
  
  const [
    totalQueries,
    avgConfidence,
    llmCount,
    positiveFeedback,
    negativeFeedback,
    mismatchCount,
    avgLatency,
  ] = await Promise.all([
    prisma.chatQuery.count({ where }),
    prisma.chatQuery.aggregate({
      where,
      _avg: { intentConfidence: true },
    }),
    prisma.chatQuery.count({ where: { ...where, wasLLMClassified: true } }),
    prisma.chatQuery.count({ where: { ...where, feedbackRating: 5 } }),
    prisma.chatQuery.count({ where: { ...where, feedbackRating: 1 } }),
    prisma.chatQuery.count({ where: { ...where, entityMismatch: true } }),
    prisma.chatQuery.aggregate({
      where,
      _avg: { latencyMs: true },
    }),
  ]);
  
  const totalFeedback = positiveFeedback + negativeFeedback;
  
  return {
    variant,
    totalQueries,
    avgConfidence: avgConfidence._avg.intentConfidence || 0,
    llmFallbackRate: totalQueries > 0 ? (llmCount / totalQueries) * 100 : 0,
    feedbackPositive: positiveFeedback,
    feedbackNegative: negativeFeedback,
    feedbackRate: totalQueries > 0 ? (totalFeedback / totalQueries) * 100 : 0,
    mismatchCount,
    mismatchRate: totalQueries > 0 ? (mismatchCount / totalQueries) * 100 : 0,
    avgLatencyMs: avgLatency._avg.latencyMs || 0,
  };
}

function calculateSignificance(a: VariantStats, b: VariantStats): string {
  // Simple significance calculation (would use proper statistical test in production)
  if (a.totalQueries < 100 || b.totalQueries < 100) {
    return '⚠️ Not enough data (need 100+ queries per variant)';
  }
  
  // Compare positive feedback rates
  const aPositiveRate = a.feedbackPositive / (a.feedbackPositive + a.feedbackNegative || 1);
  const bPositiveRate = b.feedbackPositive / (b.feedbackPositive + b.feedbackNegative || 1);
  
  if (Math.abs(aPositiveRate - bPositiveRate) < 0.05) {
    return '🔄 No significant difference';
  } else if (bPositiveRate > aPositiveRate) {
    return '✅ Variant B is performing better';
  } else {
    return '❌ Variant A is performing better';
  }
}

async function main() {
  const testId = process.argv[2] || 'query-classification-2026-01';
  
  console.log(`\n🧪 A/B Test Analysis: ${testId}\n`);
  console.log('='.repeat(60));
  
  const statsA = await getVariantStats(testId, 'A');
  const statsB = await getVariantStats(testId, 'B');
  
  if (statsA.totalQueries === 0 && statsB.totalQueries === 0) {
    console.log('\n❌ No data found for this test.\n');
    console.log('Make sure:');
    console.log('1. The test is active in src/lib/ab-testing.ts');
    console.log('2. Users have been sending queries');
    console.log('3. The abTestId and abTestVariant fields are being saved\n');
    process.exit(1);
  }
  
  console.log('\n📊 VARIANT COMPARISON\n');
  
  const headers = ['Metric', 'Variant A (Control)', 'Variant B (Test)', 'Δ'];
  const rows = [
    ['Total Queries', statsA.totalQueries, statsB.totalQueries, '-'],
    ['Avg Confidence', `${(statsA.avgConfidence * 100).toFixed(1)}%`, `${(statsB.avgConfidence * 100).toFixed(1)}%`, 
      `${((statsB.avgConfidence - statsA.avgConfidence) * 100).toFixed(1)}%`],
    ['LLM Fallback Rate', `${statsA.llmFallbackRate.toFixed(1)}%`, `${statsB.llmFallbackRate.toFixed(1)}%`,
      `${(statsB.llmFallbackRate - statsA.llmFallbackRate).toFixed(1)}%`],
    ['👍 Positive Feedback', statsA.feedbackPositive, statsB.feedbackPositive, '-'],
    ['👎 Negative Feedback', statsA.feedbackNegative, statsB.feedbackNegative, '-'],
    ['Mismatch Rate', `${statsA.mismatchRate.toFixed(1)}%`, `${statsB.mismatchRate.toFixed(1)}%`,
      `${(statsB.mismatchRate - statsA.mismatchRate).toFixed(1)}%`],
    ['Avg Latency', `${statsA.avgLatencyMs.toFixed(0)}ms`, `${statsB.avgLatencyMs.toFixed(0)}ms`,
      `${(statsB.avgLatencyMs - statsA.avgLatencyMs).toFixed(0)}ms`],
  ];
  
  // Print table
  console.log(headers.map((h, i) => h.padEnd(i === 0 ? 25 : 20)).join(''));
  console.log('-'.repeat(85));
  for (const row of rows) {
    console.log(row.map((c, i) => String(c).padEnd(i === 0 ? 25 : 20)).join(''));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 RECOMMENDATION\n');
  console.log(calculateSignificance(statsA, statsB));
  
  // Show sample queries from each variant
  console.log('\n📝 SAMPLE QUERIES (Variant A)\n');
  const samplesA = await prisma.chatQuery.findMany({
    where: { abTestId: testId, abTestVariant: 'A' },
    select: { query: true, detectedIntent: true, intentConfidence: true, wasLLMClassified: true },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  for (const s of samplesA) {
    console.log(`  • "${s.query.substring(0, 50)}..." → ${s.detectedIntent} (${((s.intentConfidence || 0) * 100).toFixed(0)}%) ${s.wasLLMClassified ? '[LLM]' : ''}`);
  }
  
  console.log('\n📝 SAMPLE QUERIES (Variant B)\n');
  const samplesB = await prisma.chatQuery.findMany({
    where: { abTestId: testId, abTestVariant: 'B' },
    select: { query: true, detectedIntent: true, intentConfidence: true, wasLLMClassified: true },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  for (const s of samplesB) {
    console.log(`  • "${s.query.substring(0, 50)}..." → ${s.detectedIntent} (${((s.intentConfidence || 0) * 100).toFixed(0)}%) ${s.wasLLMClassified ? '[LLM]' : ''}`);
  }
  
  console.log('\n');
  process.exit(0);
}

main().catch(console.error);
