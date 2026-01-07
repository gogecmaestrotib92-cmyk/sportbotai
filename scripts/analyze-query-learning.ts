#!/usr/bin/env npx ts-node
/**
 * Query Learning Analysis Script
 * 
 * Analyzes chat queries to find patterns for improvement:
 * - Queries that needed LLM fallback (patterns missing)
 * - Entity mismatches (asked about X, answered about Y)
 * - Low confidence classifications
 * - Negative feedback patterns
 * 
 * Run: npx ts-node scripts/analyze-query-learning.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧠 Query Learning Analysis\n');
  console.log('='.repeat(60));
  
  // 1. Basic Stats
  console.log('\n📊 BASIC STATS\n');
  
  const [
    totalQueries,
    last24h,
    last7d,
    withFeedback,
    positiveFeedback,
    negativeFeedback,
  ] = await Promise.all([
    prisma.chatQuery.count(),
    prisma.chatQuery.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.chatQuery.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.chatQuery.count({ where: { feedbackRating: { not: null } } }),
    prisma.chatQuery.count({ where: { feedbackRating: 5 } }),
    prisma.chatQuery.count({ where: { feedbackRating: 1 } }),
  ]);
  
  console.log(`Total queries: ${totalQueries.toLocaleString()}`);
  console.log(`Last 24h: ${last24h}`);
  console.log(`Last 7d: ${last7d}`);
  console.log(`With feedback: ${withFeedback} (${positiveFeedback} 👍 / ${negativeFeedback} 👎)`);
  
  // 2. LLM Fallback Rate
  console.log('\n📈 LLM FALLBACK (patterns missing)\n');
  
  const llmCount = await prisma.chatQuery.count({ where: { wasLLMClassified: true } });
  const patternCount = await prisma.chatQuery.count({ where: { wasLLMClassified: false } });
  
  console.log(`Pattern-matched: ${patternCount} (${((patternCount / (patternCount + llmCount)) * 100).toFixed(1)}%)`);
  console.log(`LLM fallback: ${llmCount} (${((llmCount / (patternCount + llmCount)) * 100).toFixed(1)}%)`);
  
  // Get examples of LLM fallback queries
  const llmExamples = await prisma.chatQuery.findMany({
    where: { wasLLMClassified: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { query: true, detectedIntent: true, intentConfidence: true },
  });
  
  if (llmExamples.length > 0) {
    console.log('\nRecent LLM-classified queries (need patterns):');
    for (const ex of llmExamples) {
      console.log(`  • "${ex.query.substring(0, 60)}..." → ${ex.detectedIntent} (${((ex.intentConfidence || 0) * 100).toFixed(0)}%)`);
    }
  }
  
  // 3. Entity Mismatches
  console.log('\n⚠️ ENTITY MISMATCHES (asked X, got Y)\n');
  
  const mismatchCount = await prisma.chatQuery.count({ where: { entityMismatch: true } });
  console.log(`Total mismatches: ${mismatchCount}`);
  
  const mismatches = await prisma.chatQuery.findMany({
    where: { entityMismatch: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { query: true, mismatchDetails: true },
  });
  
  if (mismatches.length > 0) {
    console.log('\nRecent mismatches:');
    for (const m of mismatches) {
      console.log(`  • "${m.query.substring(0, 50)}..."`);
      console.log(`    ${m.mismatchDetails}`);
    }
  }
  
  // 4. Low Confidence Classifications
  console.log('\n🎯 LOW CONFIDENCE CLASSIFICATIONS (<60%)\n');
  
  const lowConfidence = await prisma.chatQuery.findMany({
    where: { intentConfidence: { lt: 0.6 } },
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: { query: true, detectedIntent: true, intentConfidence: true },
  });
  
  console.log(`Found ${lowConfidence.length} low-confidence queries:`);
  for (const lc of lowConfidence) {
    console.log(`  • "${lc.query.substring(0, 50)}..." → ${lc.detectedIntent} (${((lc.intentConfidence || 0) * 100).toFixed(0)}%)`);
  }
  
  // 5. Intent Distribution
  console.log('\n📋 INTENT DISTRIBUTION\n');
  
  const intentDist = await prisma.chatQuery.groupBy({
    by: ['detectedIntent'],
    where: { detectedIntent: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { detectedIntent: 'desc' } },
    take: 15,
  });
  
  for (const i of intentDist) {
    const bar = '█'.repeat(Math.min(Math.round(i._count._all / 10), 30));
    console.log(`  ${(i.detectedIntent || 'UNKNOWN').padEnd(20)} ${i._count._all.toString().padStart(5)} ${bar}`);
  }
  
  // 6. Negative Feedback Analysis
  console.log('\n👎 NEGATIVE FEEDBACK PATTERNS\n');
  
  const negativeQueries = await prisma.chatQuery.findMany({
    where: { feedbackRating: 1 },
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: { 
      query: true, 
      detectedIntent: true, 
      responseSource: true,
      category: true,
      feedbackComment: true,
    },
  });
  
  if (negativeQueries.length > 0) {
    console.log('Recent thumbs-down queries:');
    for (const nq of negativeQueries) {
      console.log(`  • "${nq.query.substring(0, 50)}..."`);
      console.log(`    Intent: ${nq.detectedIntent || 'unknown'}, Source: ${nq.responseSource || 'unknown'}`);
      if (nq.feedbackComment) {
        console.log(`    Comment: ${nq.feedbackComment}`);
      }
    }
  } else {
    console.log('No negative feedback yet 🎉');
  }
  
  // 7. Response Source Distribution
  console.log('\n📡 RESPONSE SOURCE DISTRIBUTION\n');
  
  const sourceDist = await prisma.chatQuery.groupBy({
    by: ['responseSource'],
    where: { responseSource: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { responseSource: 'desc' } },
  });
  
  for (const s of sourceDist) {
    const bar = '█'.repeat(Math.min(Math.round(s._count._all / 10), 30));
    console.log(`  ${(s.responseSource || 'UNKNOWN').padEnd(15)} ${s._count._all.toString().padStart(5)} ${bar}`);
  }
  
  // 8. Cache Hit Rate
  console.log('\n💾 CACHE PERFORMANCE\n');
  
  const cacheHits = await prisma.chatQuery.count({ where: { cacheHit: true } });
  const cacheMisses = await prisma.chatQuery.count({ where: { cacheHit: false } });
  
  const cacheRate = (cacheHits / (cacheHits + cacheMisses)) * 100;
  console.log(`Cache hit rate: ${cacheRate.toFixed(1)}% (${cacheHits} hits / ${cacheMisses} misses)`);
  
  // 9. Average Latency
  console.log('\n⏱️ LATENCY ANALYSIS\n');
  
  const latencyStats = await prisma.chatQuery.aggregate({
    _avg: { latencyMs: true },
    _min: { latencyMs: true },
    _max: { latencyMs: true },
    where: { latencyMs: { not: null } },
  });
  
  console.log(`Average: ${(latencyStats._avg.latencyMs || 0).toFixed(0)}ms`);
  console.log(`Min: ${latencyStats._min.latencyMs || 0}ms`);
  console.log(`Max: ${latencyStats._max.latencyMs || 0}ms`);
  
  // 10. Pattern Suggestions
  console.log('\n💡 PATTERN SUGGESTIONS\n');
  
  // Find common words in LLM-classified queries
  const llmQueries = await prisma.chatQuery.findMany({
    where: { wasLLMClassified: true },
    take: 100,
    select: { query: true, detectedIntent: true },
  });
  
  if (llmQueries.length > 0) {
    // Group by intent
    const byIntent: Record<string, string[]> = {};
    for (const q of llmQueries) {
      const intent = q.detectedIntent || 'UNKNOWN';
      if (!byIntent[intent]) byIntent[intent] = [];
      byIntent[intent].push(q.query);
    }
    
    // For each intent, find common words
    for (const [intent, queries] of Object.entries(byIntent)) {
      if (queries.length < 3) continue;
      
      const wordFreq: Record<string, number> = {};
      for (const q of queries) {
        const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        for (const word of words) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      }
      
      const commonWords = Object.entries(wordFreq)
        .filter(([, count]) => count >= queries.length * 0.3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
      
      if (commonWords.length >= 2) {
        console.log(`For ${intent} (${queries.length} queries):`);
        console.log(`  Suggested pattern: /\\b(${commonWords.join('|')})\\b/i`);
        console.log(`  Example queries:`);
        for (const ex of queries.slice(0, 3)) {
          console.log(`    • "${ex.substring(0, 60)}..."`);
        }
        console.log();
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Analysis complete!');
  console.log('\nNext steps:');
  console.log('1. Add suggested patterns to query-intelligence.ts');
  console.log('2. Review entity mismatches - fix data source selection');
  console.log('3. Investigate negative feedback - improve responses');
  console.log('4. Consider more player/team expansions for low confidence');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
