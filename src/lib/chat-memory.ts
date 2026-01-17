/**
 * Conversation Memory for AI Chat
 * 
 * Stores recent messages per session for multi-turn context.
 * Enables the AI to understand pronouns like "And him?" or "What about their next game?"
 */

import { cacheGet, cacheSet } from '@/lib/cache';

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    // Extracted entities for reference resolution
    entities?: {
        players?: string[];
        teams?: string[];
        matches?: string[];
    };
}

export interface ConversationMemory {
    messages: ChatMessage[];
    lastUpdated: number;
    // Last mentioned entities for pronoun resolution
    lastPlayer?: string;
    lastTeam?: string;
    lastMatch?: string;
    lastSport?: string;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_MESSAGES = 10;  // Keep last 10 messages for context
const MEMORY_TTL = 3600;  // 1 hour TTL
const CACHE_PREFIX = 'chat-memory:';

// ============================================
// MEMORY FUNCTIONS
// ============================================

/**
 * Get conversation memory for a session
 */
export async function getConversationMemory(sessionId: string): Promise<ConversationMemory> {
    const cacheKey = `${CACHE_PREFIX}${sessionId}`;
    const cached = await cacheGet<ConversationMemory>(cacheKey);

    if (cached) {
        return cached;
    }

    return {
        messages: [],
        lastUpdated: Date.now(),
    };
}

/**
 * Add a message to conversation memory
 */
export async function addToMemory(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    entities?: { players?: string[]; teams?: string[]; matches?: string[] }
): Promise<void> {
    const memory = await getConversationMemory(sessionId);

    // Add new message
    memory.messages.push({
        role,
        content,
        timestamp: Date.now(),
        entities,
    });

    // Keep only last N messages
    if (memory.messages.length > MAX_MESSAGES) {
        memory.messages = memory.messages.slice(-MAX_MESSAGES);
    }

    // Update last mentioned entities (for pronoun resolution)
    if (entities?.players?.length) {
        memory.lastPlayer = entities.players[0];
    }
    if (entities?.teams?.length) {
        memory.lastTeam = entities.teams[0];
    }
    if (entities?.matches?.length) {
        memory.lastMatch = entities.matches[0];
    }

    memory.lastUpdated = Date.now();

    // Save to cache
    const cacheKey = `${CACHE_PREFIX}${sessionId}`;
    await cacheSet(cacheKey, memory, MEMORY_TTL);
}

/**
 * Resolve pronouns in a query using conversation memory
 */
export async function resolvePronouns(
    sessionId: string,
    query: string
): Promise<{ resolvedQuery: string; usedMemory: boolean }> {
    const memory = await getConversationMemory(sessionId);
    let resolvedQuery = query;
    let usedMemory = false;

    // Check for player pronouns
    if (memory.lastPlayer && /\b(his|him|he|the player)\b/i.test(query)) {
        resolvedQuery = resolvedQuery.replace(
            /\b(his|him|he|the player)\b/gi,
            memory.lastPlayer
        );
        usedMemory = true;
        console.log(`[ChatMemory] Resolved pronoun to player: ${memory.lastPlayer}`);
    }

    // Check for team pronouns
    if (memory.lastTeam && /\b(their|them|they|the team)\b/i.test(query)) {
        resolvedQuery = resolvedQuery.replace(
            /\b(their|them|they|the team)\b/gi,
            memory.lastTeam
        );
        usedMemory = true;
        console.log(`[ChatMemory] Resolved pronoun to team: ${memory.lastTeam}`);
    }

    // Check for match pronouns
    if (memory.lastMatch && /\b(that game|the game|that match|the match|it)\b/i.test(query)) {
        // For match references, append context instead of replacing
        if (!/\b(vs|versus|against)\b/i.test(query)) {
            resolvedQuery = `${query} (referring to ${memory.lastMatch})`;
            usedMemory = true;
            console.log(`[ChatMemory] Added match context: ${memory.lastMatch}`);
        }
    }

    return { resolvedQuery, usedMemory };
}

/**
 * Format conversation history for LLM context
 */
export function formatConversationHistory(memory: ConversationMemory): string {
    if (memory.messages.length === 0) {
        return '';
    }

    let context = '=== CONVERSATION HISTORY ===\n';
    context += '(Use this to understand context from previous messages)\n\n';

    for (const msg of memory.messages.slice(-5)) {  // Last 5 messages
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        // Truncate long messages
        const content = msg.content.length > 200
            ? msg.content.substring(0, 200) + '...'
            : msg.content;
        context += `${role}: ${content}\n\n`;
    }

    // Add last mentioned entities
    if (memory.lastPlayer || memory.lastTeam || memory.lastMatch) {
        context += 'Recently discussed:\n';
        if (memory.lastPlayer) context += `- Player: ${memory.lastPlayer}\n`;
        if (memory.lastTeam) context += `- Team: ${memory.lastTeam}\n`;
        if (memory.lastMatch) context += `- Match: ${memory.lastMatch}\n`;
        context += '\n';
    }

    return context;
}

/**
 * Extract entities from a message for memory storage
 */
export function extractEntitiesForMemory(
    content: string,
    queryEntities?: Array<{ type: string; name: string }>
): { players?: string[]; teams?: string[]; matches?: string[] } {
    const result: { players?: string[]; teams?: string[]; matches?: string[] } = {};

    if (queryEntities) {
        const players = queryEntities.filter(e => e.type === 'PLAYER').map(e => e.name);
        const teams = queryEntities.filter(e => e.type === 'TEAM').map(e => e.name);
        const matches = queryEntities.filter(e => e.type === 'MATCH').map(e => e.name);

        if (players.length) result.players = players;
        if (teams.length) result.teams = teams;
        if (matches.length) result.matches = matches;
    }

    return result;
}

/**
 * Clear conversation memory for a session
 */
export async function clearMemory(sessionId: string): Promise<void> {
    const cacheKey = `${CACHE_PREFIX}${sessionId}`;
    await cacheSet(cacheKey, { messages: [], lastUpdated: Date.now() }, MEMORY_TTL);
}
