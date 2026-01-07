/**
 * Chat Feedback API
 * 
 * Allows users to rate AI responses (thumbs up/down)
 * for continuous improvement of the chat system.
 * 
 * LEARNING SYSTEM:
 * - Thumbs DOWN: Mark answer as bad, don't reuse from cache
 * - Thumbs UP: Boost knowledge quality, prefer this answer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashChatQuery } from '@/lib/cache';

// ============================================
// LEARNING FROM FEEDBACK
// ============================================

/**
 * When user gives thumbs DOWN:
 * 1. Mark the cached answer as unreliable (set expiresAt to now)
 * 2. Reduce knowledge base quality score
 * 3. Record the pattern for future avoidance
 */
async function learnFromNegativeFeedback(queryHash: string, query: string, response: string): Promise<void> {
  try {
    // 1. Expire the cached answer so it won't be reused
    await prisma.chatQuery.updateMany({
      where: { queryHash },
      data: { 
        expiresAt: new Date(), // Expire immediately
      },
    });
    console.log(`[Learning] ❌ Expired cached answer for query hash: ${queryHash}`);

    // 2. Reduce quality of similar knowledge base entries
    const keyTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3).slice(0, 5);
    for (const term of keyTerms) {
      await prisma.knowledgeBase.updateMany({
        where: {
          question: { contains: term, mode: 'insensitive' },
          quality: { gt: 1 }, // Don't go below 1
        },
        data: {
          quality: { decrement: 1 },
        },
      });
    }
    console.log(`[Learning] Reduced quality for knowledge matching: ${keyTerms.join(', ')}`);

    // 3. Record the failed pattern (for future analysis)
    await prisma.chatFeedback.updateMany({
      where: { queryHash, rating: 1 },
      data: { feedback: 'MARKED_BAD' }, // Flag for analysis
    });

  } catch (error) {
    console.error('[Learning] Failed to learn from negative feedback:', error);
  }
}

/**
 * When user gives thumbs UP:
 * 1. Extend cache expiry (answer is good, keep it longer)
 * 2. Boost knowledge base quality score
 */
async function learnFromPositiveFeedback(queryHash: string, query: string, response: string): Promise<void> {
  try {
    // 1. Extend cache expiry by 24 hours (good answer, keep it)
    const extendedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.chatQuery.updateMany({
      where: { 
        queryHash,
        expiresAt: { gt: new Date() }, // Only if not already expired
      },
      data: { 
        expiresAt: extendedExpiry,
      },
    });
    console.log(`[Learning] ✅ Extended cache for query hash: ${queryHash}`);

    // 2. Boost quality of similar knowledge base entries
    const keyTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3).slice(0, 5);
    for (const term of keyTerms) {
      await prisma.knowledgeBase.updateMany({
        where: {
          question: { contains: term, mode: 'insensitive' },
          quality: { lt: 5 }, // Don't go above 5
        },
        data: {
          quality: { increment: 1 },
          useCount: { increment: 1 },
        },
      });
    }
    console.log(`[Learning] Boosted quality for knowledge matching: ${keyTerms.join(', ')}`);

  } catch (error) {
    console.error('[Learning] Failed to learn from positive feedback:', error);
  }
}

interface FeedbackRequest {
  messageId: string;
  query: string;
  response: string;
  rating: number; // 1 = thumbs down, 5 = thumbs up
  feedback?: string;
  sport?: string;
  category?: string;
  brainMode?: string;
  usedRealTimeSearch?: boolean;
  fromCache?: boolean;
  // Data confidence fields
  dataConfidenceLevel?: string;
  dataConfidenceScore?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { 
      messageId, 
      query, 
      response, 
      rating, 
      feedback,
      sport,
      category,
      brainMode,
      usedRealTimeSearch,
      fromCache,
      dataConfidenceLevel,
      dataConfidenceScore,
    } = body;

    // Validate required fields
    if (!messageId || !query || !response || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, query, response, rating' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating !== 1 && rating !== 5) {
      return NextResponse.json(
        { error: 'Rating must be 1 (thumbs down) or 5 (thumbs up)' },
        { status: 400 }
      );
    }

    // Get session (optional - anonymous feedback allowed)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userPlan = session?.user?.plan;

    // Generate query hash for grouping similar queries
    const queryHash = hashChatQuery(query);

    // Save feedback to database
    const savedFeedback = await prisma.chatFeedback.create({
      data: {
        messageId,
        queryHash,
        query: query.slice(0, 2000), // Limit length
        response: response.slice(0, 5000), // Limit length
        rating,
        feedback: feedback?.slice(0, 1000),
        sport,
        category,
        brainMode,
        usedRealTimeSearch: usedRealTimeSearch || false,
        fromCache: fromCache || false,
        userId,
        userPlan: userPlan || null,
        dataConfidenceLevel,
        dataConfidenceScore,
      },
    });

    console.log(`[Feedback] Saved: ${rating === 5 ? '👍' : '👎'} for "${query.slice(0, 50)}..." (confidence: ${dataConfidenceLevel || 'N/A'})`);

    // LEARNING FROM FEEDBACK
    // If negative feedback, mark this answer as problematic
    if (rating === 1) {
      await learnFromNegativeFeedback(queryHash, query, response);
    }
    // If positive feedback, boost knowledge quality
    if (rating === 5) {
      await learnFromPositiveFeedback(queryHash, query, response);
    }

    return NextResponse.json({
      success: true,
      id: savedFeedback.id,
      message: rating === 5 ? 'Thanks for the positive feedback!' : 'Thanks for your feedback, we\'ll improve!',
    });

  } catch (error) {
    console.error('[Feedback] Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

// GET - Admin endpoint to view feedback stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (you might want to add an admin field to User model)
    if (!session?.user?.email?.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get feedback stats
    const [totalFeedback, positiveCount, negativeCount, recentFeedback] = await Promise.all([
      prisma.chatFeedback.count(),
      prisma.chatFeedback.count({ where: { rating: 5 } }),
      prisma.chatFeedback.count({ where: { rating: 1 } }),
      prisma.chatFeedback.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          query: true,
          rating: true,
          feedback: true,
          category: true,
          sport: true,
          usedRealTimeSearch: true,
          fromCache: true,
          createdAt: true,
        },
      }),
    ]);

    // Get category breakdown
    const categoryStats = await prisma.chatFeedback.groupBy({
      by: ['category'],
      _count: { id: true },
      _avg: { rating: true },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalFeedback,
        positive: positiveCount,
        negative: negativeCount,
        positiveRate: totalFeedback > 0 ? ((positiveCount / totalFeedback) * 100).toFixed(1) : 0,
      },
      categoryStats,
      recentFeedback,
    });

  } catch (error) {
    console.error('[Feedback] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback stats' },
      { status: 500 }
    );
  }
}
