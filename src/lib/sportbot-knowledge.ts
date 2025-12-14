/**
 * SportBot Knowledge System
 * 
 * Self-learning agent that:
 * 1. Stores successful Q&A pairs
 * 2. Learns patterns from frequent questions
 * 3. Builds sport-specific expertise
 * 4. Injects learned knowledge into prompts
 */

import { prisma } from '@/lib/prisma';

// ============================================
// TYPES
// ============================================

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  sport: string | null;
  category: string | null;
  quality: number; // 1-5 rating
  useCount: number;
  createdAt: Date;
}

export interface LearnedPattern {
  sport: string;
  category: string;
  commonQuestions: string[];
  keyFacts: string[];
  terminology: string[];
  tipPatterns: string[];
}

export interface SportExpertise {
  sport: string;
  questionCount: number;
  topCategories: string[];
  learnedFacts: string[];
  commonMistakes: string[];
}

// ============================================
// KNOWLEDGE STORAGE
// ============================================

/**
 * Save a successful Q&A pair to the knowledge base
 * Only save high-quality answers that used real-time data
 */
export async function saveKnowledge(params: {
  question: string;
  answer: string;
  sport?: string;
  category?: string;
  hadRealTimeData: boolean;
  citations?: string[];
}): Promise<void> {
  const { question, answer, sport, category, hadRealTimeData, citations } = params;
  
  // Only save if answer is substantial and had real data
  if (answer.length < 100 || !hadRealTimeData) {
    return;
  }
  
  // Don't save greetings or generic responses
  if (/^(hello|hi|hey|thanks)/i.test(question)) {
    return;
  }
  
  try {
    // Check if similar question exists (fuzzy match)
    const existing = await prisma.knowledgeBase.findFirst({
      where: {
        question: {
          contains: question.slice(0, 50),
          mode: 'insensitive',
        },
      },
    });
    
    if (existing) {
      // Update use count
      await prisma.knowledgeBase.update({
        where: { id: existing.id },
        data: { 
          useCount: { increment: 1 },
          // Update answer if new one is longer/better
          ...(answer.length > existing.answer.length ? { answer } : {}),
        },
      });
    } else {
      // Create new entry
      await prisma.knowledgeBase.create({
        data: {
          question,
          answer,
          sport: sport || null,
          category: category || null,
          citations: citations || [],
          quality: 3, // Default quality
          useCount: 1,
        },
      });
    }
    
    console.log('[Knowledge] Saved Q&A pair:', question.slice(0, 50));
  } catch (error) {
    console.error('[Knowledge] Failed to save:', error);
  }
}

// ============================================
// KNOWLEDGE RETRIEVAL
// ============================================

/**
 * Find similar past answers for context
 */
export async function findSimilarKnowledge(
  question: string,
  sport?: string,
  limit: number = 3
): Promise<KnowledgeEntry[]> {
  try {
    // Extract key terms from question
    const keyTerms = extractKeyTerms(question);
    
    // Search knowledge base
    const results = await prisma.knowledgeBase.findMany({
      where: {
        OR: [
          // Match by sport
          ...(sport ? [{ sport: { equals: sport, mode: 'insensitive' as const } }] : []),
          // Match by key terms in question
          ...keyTerms.map(term => ({
            question: { contains: term, mode: 'insensitive' as const },
          })),
        ],
        quality: { gte: 3 }, // Only good quality answers
      },
      orderBy: [
        { useCount: 'desc' },
        { quality: 'desc' },
      ],
      take: limit,
    });
    
    return results as KnowledgeEntry[];
  } catch (error) {
    console.error('[Knowledge] Search failed:', error);
    return [];
  }
}

/**
 * Extract key terms for matching
 */
function extractKeyTerms(text: string): string[] {
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'who', 'where', 'when', 'how', 'does', 'do', 'did'];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 5);
}

// ============================================
// PATTERN LEARNING
// ============================================

/**
 * Analyze query patterns and build sport expertise
 */
export async function analyzePatterns(): Promise<Map<string, SportExpertise>> {
  const expertise = new Map<string, SportExpertise>();
  
  try {
    // Get query distribution by sport
    const sportCounts = await prisma.chatQuery.groupBy({
      by: ['sport'],
      _count: { sport: true },
      where: { sport: { not: null } },
      orderBy: { _count: { sport: 'desc' } },
      take: 10,
    });
    
    // Get category patterns per sport
    for (const { sport, _count } of sportCounts) {
      if (!sport) continue;
      
      const categories = await prisma.chatQuery.groupBy({
        by: ['category'],
        _count: { category: true },
        where: { sport },
        orderBy: { _count: { category: 'desc' } },
        take: 5,
      });
      
      // Get learned facts from knowledge base
      const facts = await prisma.knowledgeBase.findMany({
        where: { sport, quality: { gte: 4 } },
        select: { answer: true },
        take: 10,
      });
      
      expertise.set(sport, {
        sport,
        questionCount: _count.sport,
        topCategories: categories.map(c => c.category).filter(Boolean) as string[],
        learnedFacts: extractFactsFromAnswers(facts.map(f => f.answer)),
        commonMistakes: [], // Could be populated from user feedback
      });
    }
  } catch (error) {
    console.error('[Knowledge] Pattern analysis failed:', error);
  }
  
  return expertise;
}

/**
 * Extract key facts from stored answers
 */
function extractFactsFromAnswers(answers: string[]): string[] {
  const facts: string[] = [];
  
  for (const answer of answers) {
    // Extract sentences that look like facts
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    for (const sentence of sentences) {
      // Look for factual patterns
      if (/\b(is|are|was|were|has|have|plays for|scored|won|leads|currently)\b/i.test(sentence)) {
        facts.push(sentence.trim());
      }
    }
  }
  
  // Return unique facts, limited
  return [...new Set(facts)].slice(0, 20);
}

// ============================================
// DYNAMIC PROMPT INJECTION
// ============================================

/**
 * Build context injection for system prompt based on learned knowledge
 */
export async function buildLearnedContext(
  question: string,
  sport?: string
): Promise<string> {
  const contextParts: string[] = [];
  
  try {
    // 1. Get similar past answers
    const similar = await findSimilarKnowledge(question, sport, 2);
    if (similar.length > 0) {
      contextParts.push('RELEVANT PAST KNOWLEDGE:');
      for (const entry of similar) {
        contextParts.push(`Q: ${entry.question.slice(0, 100)}`);
        contextParts.push(`A: ${entry.answer.slice(0, 300)}...`);
      }
    }
    
    // 2. Get sport-specific expertise
    if (sport) {
      const topQueries = await prisma.chatQuery.groupBy({
        by: ['category'],
        _count: { category: true },
        where: { sport },
        orderBy: { _count: { category: 'desc' } },
        take: 3,
      });
      
      if (topQueries.length > 0) {
        contextParts.push(`\nSPORT EXPERTISE (${sport.toUpperCase()}):`);
        contextParts.push(`Most asked about: ${topQueries.map(q => q.category).filter(Boolean).join(', ')}`);
      }
    }
    
    // 3. Get trending topics (recent popular queries)
    const trending = await prisma.chatQuery.groupBy({
      by: ['team'],
      _count: { team: true },
      where: {
        team: { not: null },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
      },
      orderBy: { _count: { team: 'desc' } },
      take: 5,
    });
    
    if (trending.length > 0) {
      contextParts.push(`\nTRENDING TEAMS TODAY: ${trending.map(t => t.team).filter(Boolean).join(', ')}`);
    }
    
  } catch (error) {
    console.error('[Knowledge] Context build failed:', error);
  }
  
  return contextParts.join('\n');
}

// ============================================
// QUALITY FEEDBACK
// ============================================

/**
 * Update answer quality based on feedback
 */
export async function rateAnswer(
  questionId: string,
  rating: 1 | 2 | 3 | 4 | 5
): Promise<void> {
  try {
    await prisma.knowledgeBase.update({
      where: { id: questionId },
      data: { quality: rating },
    });
  } catch (error) {
    console.error('[Knowledge] Rating failed:', error);
  }
}

/**
 * Get knowledge base stats for admin
 */
export async function getKnowledgeStats(): Promise<{
  totalEntries: number;
  bySport: Array<{ sport: string; count: number }>;
  topUsed: KnowledgeEntry[];
  avgQuality: number;
}> {
  try {
    const [total, bySport, topUsed, avgQuality] = await Promise.all([
      prisma.knowledgeBase.count(),
      
      prisma.knowledgeBase.groupBy({
        by: ['sport'],
        _count: { sport: true },
        where: { sport: { not: null } },
        orderBy: { _count: { sport: 'desc' } },
      }),
      
      prisma.knowledgeBase.findMany({
        orderBy: { useCount: 'desc' },
        take: 10,
      }),
      
      prisma.knowledgeBase.aggregate({
        _avg: { quality: true },
      }),
    ]);
    
    return {
      totalEntries: total,
      bySport: bySport.map(s => ({ sport: s.sport || 'Unknown', count: s._count.sport })),
      topUsed: topUsed as KnowledgeEntry[],
      avgQuality: avgQuality._avg.quality || 0,
    };
  } catch (error) {
    console.error('[Knowledge] Stats failed:', error);
    return {
      totalEntries: 0,
      bySport: [],
      topUsed: [],
      avgQuality: 0,
    };
  }
}

// ============================================
// SPORT-SPECIFIC TERMINOLOGY
// ============================================

/**
 * Sport terminology that the agent should know
 * This grows as we learn from queries
 */
export const SPORT_TERMINOLOGY: Record<string, string[]> = {
  football: [
    'clean sheet', 'hat-trick', 'brace', 'assist', 'xG', 'xA',
    'possession', 'pressing', 'counter-attack', 'set piece',
    'VAR', 'offside', 'penalty', 'free kick', 'corner',
    'relegation', 'promotion', 'derby', 'clasico',
  ],
  basketball: [
    'triple-double', 'double-double', 'assist', 'rebound', 'block',
    'three-pointer', 'free throw', 'turnover', 'steal',
    'pick and roll', 'fast break', 'zone defense', 'man-to-man',
    'playoffs', 'conference', 'division', 'draft pick',
  ],
  tennis: [
    'ace', 'double fault', 'break point', 'set point', 'match point',
    'tiebreak', 'deuce', 'advantage', 'love',
    'forehand', 'backhand', 'volley', 'serve and volley',
    'grand slam', 'ATP', 'WTA', 'ranking points',
  ],
  mma: [
    'knockout', 'submission', 'decision', 'TKO', 'unanimous',
    'split decision', 'guillotine', 'rear naked choke', 'armbar',
    'ground and pound', 'clinch', 'takedown', 'sprawl',
    'weight class', 'pound for pound', 'title fight',
  ],
};

/**
 * Get terminology for detected sport
 */
export function getTerminologyForSport(sport: string): string[] {
  const normalized = sport.toLowerCase().replace(/[^a-z]/g, '');
  
  for (const [key, terms] of Object.entries(SPORT_TERMINOLOGY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return terms;
    }
  }
  
  return [];
}
