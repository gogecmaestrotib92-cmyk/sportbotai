/**
 * Team Search API
 * 
 * GET /api/team/search?q=teamName
 * Search for teams by name
 */

import { NextRequest, NextResponse } from 'next/server';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// Cache for search results (10 min TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

interface TeamSearchResult {
  id: number;
  name: string;
  logo: string;
  country: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ 
      error: 'Search query must be at least 2 characters' 
    }, { status: 400 });
  }

  // Check cache
  const cacheKey = `team-search:${query.toLowerCase()}`;
  const cached = getCached<TeamSearchResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, results: cached, cached: true });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'API not configured' 
    }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${API_FOOTBALL_BASE}/teams?search=${encodeURIComponent(query)}`,
      {
        headers: { 'x-apisports-key': apiKey },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    const results: TeamSearchResult[] = (data.response || [])
      .slice(0, 20) // Limit to 20 results
      .map((item: any) => ({
        id: item.team.id,
        name: item.team.name,
        logo: item.team.logo,
        country: item.team.country,
      }));

    // Cache results
    setCache(cacheKey, results);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Team search error:', error);
    return NextResponse.json({ 
      error: 'Failed to search teams' 
    }, { status: 500 });
  }
}
