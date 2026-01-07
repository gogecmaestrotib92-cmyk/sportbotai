/**
 * Chat Feedback Correlation Analysis
 * 
 * Analyzes the correlation between data confidence levels and user satisfaction
 * to identify where the chat bot is underperforming.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ConfidenceStats {
  level: string;
  total: number;
  thumbsUp: number;
  thumbsDown: number;
  satisfactionRate: number;
}

interface ScoreRangeStats {
  range: string;
  total: number;
  thumbsUp: number;
  thumbsDown: number;
  satisfactionRate: number;
  avgScore: number;
}

async function analyzeFeedback() {
  console.log('📊 Chat Feedback Correlation Analysis\n');
  console.log('='.repeat(60));

  // Get all feedback
  const allFeedback = await prisma.chatFeedback.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n📈 Total Feedback: ${allFeedback.length}`);
  
  // Rating is 1-5 scale, not up/down
  // Consider 4-5 as positive (thumbs up), 1-2 as negative (thumbs down), 3 as neutral
  const thumbsUp = allFeedback.filter(f => f.rating >= 4).length;
  const thumbsDown = allFeedback.filter(f => f.rating <= 2).length;
  const neutral = allFeedback.filter(f => f.rating === 3).length;
  const avgRating = allFeedback.length > 0 
    ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length).toFixed(2)
    : '0';
  const overallSatisfaction = allFeedback.length > 0 
    ? Math.round((thumbsUp / allFeedback.length) * 100) 
    : 0;

  console.log(`   ⭐ Average Rating: ${avgRating}/5`);
  console.log(`   👍 Positive (4-5): ${thumbsUp}`);
  console.log(`   😐 Neutral (3): ${neutral}`);
  console.log(`   👎 Negative (1-2): ${thumbsDown}`);
  console.log(`   ✅ Satisfaction Rate: ${overallSatisfaction}%`);

  // Analyze by confidence level
  console.log('\n' + '='.repeat(60));
  console.log('📊 SATISFACTION BY CONFIDENCE LEVEL');
  console.log('='.repeat(60));

  const confidenceLevels = ['FULL', 'PARTIAL', 'MINIMAL', 'NONE', null];
  const levelStats: ConfidenceStats[] = [];

  for (const level of confidenceLevels) {
    const feedback = allFeedback.filter(f => f.dataConfidenceLevel === level);
    if (feedback.length === 0) continue;

    const up = feedback.filter(f => f.rating >= 4).length;
    const down = feedback.filter(f => f.rating <= 2).length;
    const avgRating = (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(2);
    const rate = Math.round((up / feedback.length) * 100);

    const displayLevel = level || 'UNKNOWN';
    levelStats.push({
      level: displayLevel,
      total: feedback.length,
      thumbsUp: up,
      thumbsDown: down,
      satisfactionRate: rate,
    });

    console.log(`\n${displayLevel}:`);
    console.log(`   Total: ${feedback.length} | Avg: ${avgRating}/5 | 👍 ${up} | 👎 ${down} | Satisfaction: ${rate}%`);
  }

  // Analyze by score ranges
  console.log('\n' + '='.repeat(60));
  console.log('📊 SATISFACTION BY CONFIDENCE SCORE RANGE');
  console.log('='.repeat(60));

  const scoreRanges = [
    { min: 80, max: 100, label: '80-100 (High)' },
    { min: 50, max: 79, label: '50-79 (Medium)' },
    { min: 20, max: 49, label: '20-49 (Low)' },
    { min: 0, max: 19, label: '0-19 (Very Low)' },
  ];

  const rangeStats: ScoreRangeStats[] = [];

  for (const range of scoreRanges) {
    const feedback = allFeedback.filter(f => 
      f.dataConfidenceScore !== null && 
      f.dataConfidenceScore >= range.min && 
      f.dataConfidenceScore <= range.max
    );
    if (feedback.length === 0) continue;

    const up = feedback.filter(f => f.rating >= 4).length;
    const down = feedback.filter(f => f.rating <= 2).length;
    const rate = Math.round((up / feedback.length) * 100);
    const avgScore = Math.round(feedback.reduce((sum, f) => sum + (f.dataConfidenceScore || 0), 0) / feedback.length);
    const avgRating = (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(2);

    rangeStats.push({
      range: range.label,
      total: feedback.length,
      thumbsUp: up,
      thumbsDown: down,
      satisfactionRate: rate,
      avgScore,
    });

    console.log(`\n${range.label}:`);
    console.log(`   Total: ${feedback.length} | Avg Rating: ${avgRating}/5 | 👍 ${up} | 👎 ${down} | Satisfaction: ${rate}%`);
  }

  // Show feedback without confidence data
  const noConfidenceData = allFeedback.filter(f => f.dataConfidenceLevel === null);
  if (noConfidenceData.length > 0) {
    console.log(`\n⚠️  Feedback without confidence data: ${noConfidenceData.length}`);
    console.log('   (These are from before the confidence tracking was added)');
  }

  // Analyze negative feedback patterns
  console.log('\n' + '='.repeat(60));
  console.log('🔍 NEGATIVE FEEDBACK ANALYSIS');
  console.log('='.repeat(60));

  const negativeFeedback = allFeedback.filter(f => f.rating <= 2);
  
  if (negativeFeedback.length > 0) {
    console.log(`\nTotal negative feedback (1-2 rating): ${negativeFeedback.length}`);
    
    // By confidence level
    const negByLevel: Record<string, number> = {};
    for (const f of negativeFeedback) {
      const level = f.dataConfidenceLevel || 'UNKNOWN';
      negByLevel[level] = (negByLevel[level] || 0) + 1;
    }
    
    console.log('\nBy Confidence Level:');
    for (const [level, count] of Object.entries(negByLevel).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${level}: ${count}`);
    }

    // Show recent negative feedback queries
    console.log('\nRecent Negative Feedback:');
    const recentNegative = negativeFeedback.slice(0, 5);
    for (const f of recentNegative) {
      console.log(`\n   Query: "${f.userQuery?.substring(0, 60)}..."`);
      console.log(`   Confidence: ${f.dataConfidenceLevel || 'N/A'} (${f.dataConfidenceScore ?? 'N/A'})`);
      console.log(`   Time: ${f.createdAt}`);
    }
  } else {
    console.log('\n✅ No negative feedback recorded!');
  }

  // Key insights
  console.log('\n' + '='.repeat(60));
  console.log('💡 KEY INSIGHTS');
  console.log('='.repeat(60));

  if (levelStats.length > 0) {
    const sortedByRate = [...levelStats].sort((a, b) => a.satisfactionRate - b.satisfactionRate);
    const worstLevel = sortedByRate[0];
    const bestLevel = sortedByRate[sortedByRate.length - 1];

    if (worstLevel && bestLevel && worstLevel.level !== bestLevel.level) {
      console.log(`\n📉 Lowest satisfaction: ${worstLevel.level} (${worstLevel.satisfactionRate}%)`);
      console.log(`📈 Highest satisfaction: ${bestLevel.level} (${bestLevel.satisfactionRate}%)`);
      
      if (worstLevel.satisfactionRate < 70) {
        console.log(`\n⚠️  RECOMMENDATION: Improve responses when data confidence is ${worstLevel.level}`);
        console.log('   Consider being more explicit about data limitations in these cases.');
      }
    }
  }

  if (rangeStats.length > 0) {
    const correlation = rangeStats.length > 1 && 
      rangeStats[0].satisfactionRate >= rangeStats[rangeStats.length - 1].satisfactionRate;
    
    if (correlation) {
      console.log('\n✅ Higher confidence scores correlate with better satisfaction.');
      console.log('   The confidence system is working as intended!');
    }
  }

  await prisma.$disconnect();
}

analyzeFeedback().catch(e => {
  console.error(e);
  process.exit(1);
});
