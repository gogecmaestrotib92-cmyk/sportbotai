/**
 * Chat Learning Service
 * 
 * Makes the AI smarter over time by:
 * 1. Persisting chat history per user (cross-session memory)
 * 2. Learning user preferences from patterns
 * 3. Caching high-quality responses
 * 4. Using feedback to improve future responses
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
  teams?: string[];
  players?: string[];
  sport?: string;
  intent?: string;
}

export interface UserContext {
  recentTopics: string[];        // Last 5 topics discussed
  favoriteTeams: string[];       // Teams they ask about most
  preferredSports: string[];     // Sports they follow
  analysisStyle?: string;        // How they like responses
  totalInteractions: number;
  avgSatisfaction?: number;      // Based on feedback
}

export interface LearnedResponseMatch {
  response: string;
  score: number;
  useCount: number;
}

// ============================================
// CHAT SESSION MANAGEMENT
// ============================================

/**
 * Get or create a chat session for a user
 */
export async function getOrCreateSession(userId: string, sessionId?: string): Promise<string> {
  // If sessionId provided, verify it belongs to user
  if (sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (existing) {
      return existing.id;
    }
  }

  // Create new session
  const session = await prisma.chatSession.create({
    data: {
      userId,
      title: 'New Chat',
    },
  });

  return session.id;
}

/**
 * Get recent sessions for a user
 */
export async function getUserSessions(userId: string, limit = 10) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Add a message to a session
 */
export async function addMessage(
  sessionId: string,
  message: ChatMessageInput
): Promise<string> {
  const msg = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: message.role,
      content: message.content,
      teams: message.teams || [],
      players: message.players || [],
      sport: message.sport,
      intent: message.intent,
    },
  });

  // Update session
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
      // Auto-title from first user message
      ...(message.role === 'user' ? {
        title: message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
      } : {}),
    },
  });

  return msg.id;
}

/**
 * Get messages from a session (for context injection)
 */
export async function getSessionMessages(sessionId: string, limit = 10) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get recent messages across all user sessions (for user context)
 */
export async function getUserRecentMessages(userId: string, limit = 20) {
  return prisma.chatMessage.findMany({
    where: {
      session: { userId },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      session: { select: { id: true } },
    },
  });
}

// ============================================
// USER PREFERENCE LEARNING
// ============================================

/**
 * Get or create user preferences
 */
export async function getUserPreference(userId: string) {
  let pref = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!pref) {
    pref = await prisma.userPreference.create({
      data: { userId },
    });
  }

  return pref;
}

/**
 * Update user preferences based on a new interaction
 */
export async function updateUserPreferences(
  userId: string,
  interaction: {
    sport?: string;
    teams?: string[];
    intent?: string;
    feedback?: number;
  }
): Promise<void> {
  const pref = await getUserPreference(userId);

  // Update preferred sports
  const sports = [...(pref.preferredSports || [])];
  if (interaction.sport && !sports.includes(interaction.sport)) {
    sports.unshift(interaction.sport);
    if (sports.length > 5) sports.pop();
  }

  // Update most asked teams
  const teams = [...(pref.mostAskedTeams || [])];
  for (const team of interaction.teams || []) {
    if (!teams.includes(team)) {
      teams.unshift(team);
      if (teams.length > 10) teams.pop();
    }
  }

  // Calculate rolling average feedback
  let avgFeedback = pref.avgFeedbackScore;
  if (interaction.feedback) {
    if (avgFeedback === null) {
      avgFeedback = interaction.feedback;
    } else {
      // Exponential moving average (more weight to recent)
      avgFeedback = avgFeedback * 0.8 + interaction.feedback * 0.2;
    }
  }

  await prisma.userPreference.update({
    where: { userId },
    data: {
      preferredSports: sports,
      mostAskedTeams: teams,
      totalQueries: { increment: 1 },
      avgFeedbackScore: avgFeedback,
    },
  });
}

/**
 * Build user context for prompt injection
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  const [pref, recentMessages, favoriteTeams] = await Promise.all([
    getUserPreference(userId),
    getUserRecentMessages(userId, 20),
    prisma.favoriteTeam.findMany({
      where: { userId },
      select: { teamName: true },
    }),
  ]);

  // Extract recent topics from messages
  const recentTopics: string[] = [];
  for (const msg of recentMessages) {
    if (msg.role === 'user' && msg.teams.length > 0) {
      for (const team of msg.teams) {
        if (!recentTopics.includes(team)) {
          recentTopics.push(team);
        }
      }
    }
    if (recentTopics.length >= 5) break;
  }

  return {
    recentTopics,
    favoriteTeams: favoriteTeams.map(f => f.teamName),
    preferredSports: pref.preferredSports || [],
    analysisStyle: pref.analysisStyle || undefined,
    totalInteractions: pref.totalQueries,
    avgSatisfaction: pref.avgFeedbackScore || undefined,
  };
}

/**
 * Format user context for prompt injection
 */
export function formatUserContextForPrompt(ctx: UserContext): string {
  const parts: string[] = [];

  if (ctx.favoriteTeams.length > 0) {
    parts.push(`FAVORITE TEAMS: ${ctx.favoriteTeams.join(', ')}`);
  }

  if (ctx.recentTopics.length > 0) {
    parts.push(`RECENTLY DISCUSSED: ${ctx.recentTopics.join(', ')}`);
  }

  if (ctx.preferredSports.length > 0) {
    parts.push(`PREFERRED SPORTS: ${ctx.preferredSports.join(', ')}`);
  }

  if (ctx.totalInteractions > 10) {
    parts.push(`RETURNING USER (${ctx.totalInteractions} interactions)`);
  }

  if (ctx.avgSatisfaction !== undefined) {
    const satisfaction = ctx.avgSatisfaction >= 4 ? 'high' : ctx.avgSatisfaction >= 2.5 ? 'moderate' : 'low';
    parts.push(`SATISFACTION: ${satisfaction}`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `
=== USER CONTEXT (personalize your response) ===
${parts.join('\n')}
===============================================`;
}

// ============================================
// LEARNED RESPONSE CACHING
// ============================================

function hashQueryPattern(query: string): string {
  const normalized = query.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Find a learned high-quality response for a query
 */
export async function findLearnedResponse(
  query: string,
  sport?: string
): Promise<LearnedResponseMatch | null> {
  const queryHash = hashQueryPattern(query);

  const learned = await prisma.learnedResponse.findFirst({
    where: {
      queryHash,
      feedbackScore: { gte: 3 }, // Only use well-rated responses
      ...(sport ? { sport } : {}),
    },
    orderBy: { feedbackScore: 'desc' },
  });

  if (!learned) {
    return null;
  }

  // Update use count
  await prisma.learnedResponse.update({
    where: { id: learned.id },
    data: {
      useCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  return {
    response: learned.response,
    score: learned.feedbackScore,
    useCount: learned.useCount,
  };
}

/**
 * Save a response that got positive feedback
 */
export async function saveLearnedResponse(
  query: string,
  response: string,
  feedback: number,
  sport?: string,
  intent?: string
): Promise<void> {
  // Only save responses with positive feedback
  if (feedback < 4) return;

  const queryHash = hashQueryPattern(query);

  await prisma.learnedResponse.upsert({
    where: { queryHash },
    create: {
      queryPattern: query.toLowerCase().trim(),
      queryHash,
      response,
      feedbackScore: feedback,
      sport,
      intent,
    },
    update: {
      // If existing, average the feedback
      feedbackScore: {
        increment: (feedback - 3) * 0.5, // Adjust score based on new feedback
      },
    },
  });
}

/**
 * Downgrade a response that got negative feedback
 */
export async function downgradeLearnedResponse(query: string): Promise<void> {
  const queryHash = hashQueryPattern(query);

  await prisma.learnedResponse.updateMany({
    where: { queryHash },
    data: {
      feedbackScore: { decrement: 1 },
    },
  });

  // Delete if score drops too low
  await prisma.learnedResponse.deleteMany({
    where: {
      queryHash,
      feedbackScore: { lt: 0 },
    },
  });
}

// ============================================
// FEEDBACK PROCESSING
// ============================================

/**
 * Process feedback for learning
 */
export async function processFeedback(
  userId: string,
  messageId: string,
  feedback: 1 | 5,
  query?: string,
  response?: string,
  sport?: string,
  intent?: string
): Promise<void> {
  // Update message feedback
  await prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      feedback,
      feedbackAt: new Date(),
    },
  });

  // Update user preferences
  await updateUserPreferences(userId, { feedback });

  // Update learned responses
  if (query && response) {
    if (feedback === 5) {
      await saveLearnedResponse(query, response, feedback, sport, intent);
    } else {
      await downgradeLearnedResponse(query);
    }
  }
}

// ============================================
// CONVERSATION HISTORY FOR PROMPT
// ============================================

/**
 * Get formatted conversation history for prompt injection
 */
export async function getConversationHistoryForPrompt(
  sessionId: string,
  maxMessages = 6
): Promise<string> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: maxMessages,
  });

  if (messages.length === 0) {
    return '';
  }

  // Reverse to chronological order
  const chronological = messages.reverse();

  const formatted = chronological.map(m => 
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 500)}${m.content.length > 500 ? '...' : ''}`
  ).join('\n\n');

  return `
=== CONVERSATION HISTORY (reference previous context) ===
${formatted}
========================================================`;
}

/**
 * Get user's past topics for context
 */
export async function getUserTopicsForPrompt(userId: string): Promise<string> {
  const ctx = await buildUserContext(userId);
  return formatUserContextForPrompt(ctx);
}
