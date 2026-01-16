/**
 * Accuracy Metrics - Live Performance Tracking
 * 
 * Queries rolling prediction accuracy from the database
 * to replace static hardcoded values with live metrics.
 * 
 * Includes 1-hour caching to avoid repeated DB queries.
 */

import { prisma } from '@/lib/prisma';

// ============================================
// CACHE CONFIGURATION
// ============================================

interface CachedAccuracy {
    value: number;
    timestamp: number;
    sampleSize: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_SAMPLE_SIZE = 20; // Minimum predictions for reliable accuracy
const ROLLING_DAYS = 30; // 30-day rolling window

// In-memory cache for accuracy metrics
const accuracyCache: Map<string, CachedAccuracy> = new Map();

// Default fallback values (used when insufficient data)
const DEFAULT_ACCURACY: Record<string, number> = {
    'americanfootball_nfl': 0.52,
    'basketball_nba': 0.50,
    'basketball_euroleague': 0.48,
    'soccer': 0.48,
    'icehockey_nhl': 0.50,
    'default': 0.50,
};

// ============================================
// LIVE ACCURACY QUERY
// ============================================

/**
 * Get live historical accuracy for a sport from the database
 * Uses 30-day rolling window of evaluated predictions
 * 
 * @param sport Sport key (e.g., 'basketball_nba', 'soccer')
 * @returns Accuracy percentage (0.0 - 1.0)
 */
export async function getLiveHistoricalAccuracy(sport: string): Promise<number> {
    const cacheKey = normalizeSportKey(sport);

    // Check cache first
    const cached = accuracyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.value;
    }

    try {
        const thirtyDaysAgo = new Date(Date.now() - ROLLING_DAYS * 24 * 60 * 60 * 1000);

        // Query predictions with binary outcome set (evaluated)
        const predictions = await prisma.prediction.findMany({
            where: {
                sport: {
                    contains: getSportPattern(cacheKey),
                    mode: 'insensitive',
                },
                binaryOutcome: { not: null },
                kickoff: { gte: thirtyDaysAgo },
            },
            select: {
                binaryOutcome: true,
            },
        });

        if (predictions.length < MIN_SAMPLE_SIZE) {
            // Not enough data, use default
            const defaultVal = DEFAULT_ACCURACY[cacheKey] ?? DEFAULT_ACCURACY['default'];
            cacheAccuracy(cacheKey, defaultVal, predictions.length);
            return defaultVal;
        }

        // Calculate accuracy
        const wins = predictions.filter(p => p.binaryOutcome === 1).length;
        const accuracy = wins / predictions.length;

        // Cache and return
        cacheAccuracy(cacheKey, accuracy, predictions.length);
        return accuracy;

    } catch (error) {
        console.error(`[Accuracy-Metrics] Error fetching accuracy for ${sport}:`, error);
        return DEFAULT_ACCURACY[cacheKey] ?? DEFAULT_ACCURACY['default'];
    }
}

/**
 * Get live accuracy metrics for all sports
 * Useful for dashboard display
 */
export async function getAllSportsAccuracy(): Promise<Record<string, { accuracy: number; sampleSize: number }>> {
    const sports = ['basketball_nba', 'americanfootball_nfl', 'icehockey_nhl', 'soccer'];
    const results: Record<string, { accuracy: number; sampleSize: number }> = {};

    for (const sport of sports) {
        await getLiveHistoricalAccuracy(sport);
        const cached = accuracyCache.get(sport);
        results[sport] = {
            accuracy: cached?.value ?? DEFAULT_ACCURACY[sport] ?? 0.5,
            sampleSize: cached?.sampleSize ?? 0,
        };
    }

    return results;
}

/**
 * Get accuracy by edge bucket
 * Shows if high-edge predictions actually perform better
 */
export async function getAccuracyByEdgeBucket(): Promise<Array<{
    bucket: string;
    accuracy: number;
    sampleSize: number;
}>> {
    try {
        const thirtyDaysAgo = new Date(Date.now() - ROLLING_DAYS * 24 * 60 * 60 * 1000);

        const predictions = await prisma.prediction.findMany({
            where: {
                binaryOutcome: { not: null },
                edgeBucket: { not: null },
                kickoff: { gte: thirtyDaysAgo },
            },
            select: {
                edgeBucket: true,
                binaryOutcome: true,
            },
        });

        // Group by bucket
        const buckets: Record<string, { wins: number; total: number }> = {
            'HIGH': { wins: 0, total: 0 },
            'MEDIUM': { wins: 0, total: 0 },
            'SMALL': { wins: 0, total: 0 },
            'NO_EDGE': { wins: 0, total: 0 },
        };

        for (const p of predictions) {
            if (p.edgeBucket && buckets[p.edgeBucket]) {
                buckets[p.edgeBucket].total++;
                if (p.binaryOutcome === 1) buckets[p.edgeBucket].wins++;
            }
        }

        return Object.entries(buckets)
            .filter(([_, data]) => data.total >= 5)
            .map(([bucket, data]) => ({
                bucket,
                accuracy: data.total > 0 ? data.wins / data.total : 0,
                sampleSize: data.total,
            }));

    } catch (error) {
        console.error('[Accuracy-Metrics] Error fetching bucket accuracy:', error);
        return [];
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeSportKey(sport: string): string {
    const lower = sport.toLowerCase();

    if (lower.includes('nfl') || lower.includes('americanfootball')) {
        return 'americanfootball_nfl';
    }
    if (lower.includes('nba') || lower.includes('basketball')) {
        return 'basketball_nba';
    }
    if (lower.includes('euroleague')) {
        return 'basketball_euroleague';
    }
    if (lower.includes('nhl') || lower.includes('hockey') || lower.includes('icehockey')) {
        return 'icehockey_nhl';
    }
    if (lower.includes('soccer') || lower.includes('football') && !lower.includes('american')) {
        return 'soccer';
    }

    return lower;
}

function getSportPattern(normalizedKey: string): string {
    // Return pattern for SQL LIKE query
    switch (normalizedKey) {
        case 'americanfootball_nfl': return 'nfl';
        case 'basketball_nba': return 'nba';
        case 'basketball_euroleague': return 'euroleague';
        case 'icehockey_nhl': return 'nhl';
        case 'soccer': return 'soccer';
        default: return normalizedKey;
    }
}

function cacheAccuracy(key: string, value: number, sampleSize: number): void {
    accuracyCache.set(key, {
        value,
        timestamp: Date.now(),
        sampleSize,
    });
}

/**
 * Force refresh cache for a specific sport
 * Call after prediction outcomes are updated
 */
export function invalidateAccuracyCache(sport?: string): void {
    if (sport) {
        accuracyCache.delete(normalizeSportKey(sport));
    } else {
        accuracyCache.clear();
    }
}

/**
 * Get current cache status (for debugging)
 */
export function getAccuracyCacheStatus(): Array<{
    sport: string;
    accuracy: number;
    sampleSize: number;
    ageMinutes: number;
}> {
    const now = Date.now();
    return Array.from(accuracyCache.entries()).map(([sport, cached]) => ({
        sport,
        accuracy: cached.value,
        sampleSize: cached.sampleSize,
        ageMinutes: Math.round((now - cached.timestamp) / 60000),
    }));
}
