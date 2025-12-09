/**
 * Match Context Data Service
 * 
 * Fetches additional context for match analysis:
 * - Injuries & Suspensions (from API-Football)
 * - Weather conditions (from OpenWeatherMap)
 * - Venue information
 * 
 * This data enriches the AI analysis with real-world factors.
 */

import { cacheGet, cacheSet, CACHE_TTL } from './cache';

// ============================================
// TYPES
// ============================================

export interface InjuredPlayer {
  name: string;
  position: string;
  reason: string; // "Injury", "Suspension", "Doubtful"
  type: 'injury' | 'suspension' | 'doubtful';
}

export interface TeamInjuries {
  teamName: string;
  players: InjuredPlayer[];
  lastUpdated: string;
}

export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  description: string;
  icon: string;
  precipitation: number; // mm
  isIndoor: boolean;
}

export interface VenueInfo {
  name: string;
  city: string;
  capacity: number;
  surface: string; // "grass", "artificial", "indoor"
  isNeutral: boolean;
}

export interface MatchContext {
  homeInjuries: InjuredPlayer[] | null;
  awayInjuries: InjuredPlayer[] | null;
  weather: WeatherData | null;
  venue: VenueInfo | null;
  dataAvailable: boolean;
}

// ============================================
// API-FOOTBALL INJURIES
// ============================================

async function fetchSoccerInjuries(
  teamId: number,
  teamName: string
): Promise<TeamInjuries | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return null;

  const cacheKey = `injuries:soccer:${teamId}`;
  const cached = await cacheGet<TeamInjuries>(cacheKey);
  if (cached) return cached;

  try {
    // Get current season
    const now = new Date();
    const season = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

    const response = await fetch(
      `https://v3.football.api-sports.io/injuries?team=${teamId}&season=${season}`,
      {
        headers: { 'x-apisports-key': apiKey },
      }
    );

    if (!response.ok) {
      console.error(`[Injuries] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      console.log(`[Injuries] No injury data for team ${teamId}`);
      return null;
    }

    // Get recent injuries (last 30 days or still active)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const players: InjuredPlayer[] = data.response
      .filter((injury: any) => {
        const fixtureDate = new Date(injury.fixture?.date || '');
        return fixtureDate >= thirtyDaysAgo;
      })
      .slice(0, 10)
      .map((injury: any) => ({
        name: injury.player?.name || 'Unknown',
        position: injury.player?.type || 'Unknown',
        reason: injury.player?.reason || 'Unknown',
        type: injury.player?.reason?.toLowerCase().includes('suspend') 
          ? 'suspension' 
          : injury.player?.reason?.toLowerCase().includes('doubt')
            ? 'doubtful'
            : 'injury',
      }));

    const result: TeamInjuries = {
      teamName,
      players,
      lastUpdated: new Date().toISOString(),
    };

    await cacheSet(cacheKey, result, CACHE_TTL.TEAM_FORM);
    console.log(`[Injuries] Found ${players.length} injuries for ${teamName}`);
    
    return result;
  } catch (error) {
    console.error('[Injuries] Error fetching injuries:', error);
    return null;
  }
}

// ============================================
// WEATHER DATA (OpenWeatherMap)
// ============================================

async function fetchWeather(
  city: string,
  isIndoorSport: boolean = false
): Promise<WeatherData | null> {
  // Indoor sports don't need weather
  if (isIndoorSport) {
    return {
      temperature: 20,
      feelsLike: 20,
      humidity: 50,
      windSpeed: 0,
      description: 'Indoor venue',
      icon: '🏟️',
      precipitation: 0,
      isIndoor: true,
    };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.log('[Weather] OPENWEATHER_API_KEY not configured');
    return null;
  }

  const cacheKey = `weather:${city.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = await cacheGet<WeatherData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      console.error(`[Weather] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    const weatherIcons: Record<string, string> = {
      '01': '☀️',
      '02': '⛅',
      '03': '☁️',
      '04': '☁️',
      '09': '🌧️',
      '10': '🌦️',
      '11': '⛈️',
      '13': '❄️',
      '50': '🌫️',
    };

    const iconCode = data.weather?.[0]?.icon?.slice(0, 2) || '01';

    const result: WeatherData = {
      temperature: Math.round(data.main?.temp || 20),
      feelsLike: Math.round(data.main?.feels_like || 20),
      humidity: data.main?.humidity || 50,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
      description: data.weather?.[0]?.description || 'Unknown',
      icon: weatherIcons[iconCode] || '🌤️',
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      isIndoor: false,
    };

    await cacheSet(cacheKey, result, 30 * 60); // 30 min cache for weather
    console.log(`[Weather] ${city}: ${result.temperature}°C, ${result.description}`);

    return result;
  } catch (error) {
    console.error('[Weather] Error fetching weather:', error);
    return null;
  }
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Get match context data (injuries, weather, venue)
 * 
 * @param homeTeam - Home team name
 * @param awayTeam - Away team name
 * @param sport - Sport type (e.g., "soccer", "premier_league")
 * @param venueCity - Optional venue city for weather
 */
export async function getMatchContext(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  venueCity?: string
): Promise<MatchContext> {
  const sportLower = sport.toLowerCase();
  const isSoccer = sportLower.includes('soccer') || 
                   sportLower.includes('football') ||
                   sportLower.includes('premier') ||
                   sportLower.includes('la_liga') ||
                   sportLower.includes('serie_a') ||
                   sportLower.includes('bundesliga') ||
                   sportLower.includes('ligue_1') ||
                   sportLower.includes('champions') ||
                   sportLower.includes('europa');
  
  const isIndoor = sportLower.includes('basketball') || 
                   sportLower.includes('hockey') || 
                   sportLower.includes('nba') || 
                   sportLower.includes('nhl');

  const results: MatchContext = {
    homeInjuries: null,
    awayInjuries: null,
    weather: null,
    venue: null,
    dataAvailable: false,
  };

  try {
    const promises: Promise<any>[] = [];

    // For soccer, try to fetch injuries by searching for team IDs
    if (isSoccer) {
      // Try to get team IDs from cache or API
      const [homeId, awayId] = await Promise.all([
        findTeamId(homeTeam),
        findTeamId(awayTeam),
      ]);
      
      if (homeId) {
        promises.push(
          fetchSoccerInjuries(homeId, homeTeam).then(r => {
            results.homeInjuries = r?.players || null;
          })
        );
      }
      
      if (awayId) {
        promises.push(
          fetchSoccerInjuries(awayId, awayTeam).then(r => {
            results.awayInjuries = r?.players || null;
          })
        );
      }
    }

    // Fetch weather for outdoor sports
    if (!isIndoor && venueCity) {
      promises.push(
        fetchWeather(venueCity, false).then(r => { results.weather = r; })
      );
    }

    await Promise.allSettled(promises);

    results.dataAvailable = !!(
      (results.homeInjuries && results.homeInjuries.length > 0) || 
      (results.awayInjuries && results.awayInjuries.length > 0) || 
      results.weather
    );
    
  } catch (error) {
    console.error('[MatchContext] Error:', error);
  }

  return results;
}

/**
 * Helper to find team ID by name
 */
async function findTeamId(teamName: string): Promise<number | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return null;
  
  // Check cache first
  const cacheKey = `teamid:${teamName.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = await cacheGet<number>(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(teamName)}`,
      {
        headers: { 'x-apisports-key': apiKey },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.response && data.response.length > 0) {
      const teamId = data.response[0].team.id;
      await cacheSet(cacheKey, teamId, CACHE_TTL.TEAM_ID || 24 * 60 * 60);
      return teamId;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Format match context for AI prompt
 */
export function formatMatchContextForPrompt(context: MatchContext, homeTeam: string, awayTeam: string): string {
  if (!context.dataAvailable) {
    return '';
  }

  const parts: string[] = ['### ADDITIONAL MATCH CONTEXT ###'];

  // Injuries
  if (context.homeInjuries && context.homeInjuries.length > 0) {
    parts.push(`\n**${homeTeam} - Injuries/Absences:**`);
    context.homeInjuries.forEach(p => {
      const emoji = p.type === 'suspension' ? '🟥' : p.type === 'doubtful' ? '⚠️' : '🏥';
      parts.push(`${emoji} ${p.name} (${p.position}) - ${p.reason}`);
    });
  }

  if (context.awayInjuries && context.awayInjuries.length > 0) {
    parts.push(`\n**${awayTeam} - Injuries/Absences:**`);
    context.awayInjuries.forEach(p => {
      const emoji = p.type === 'suspension' ? '🟥' : p.type === 'doubtful' ? '⚠️' : '🏥';
      parts.push(`${emoji} ${p.name} (${p.position}) - ${p.reason}`);
    });
  }

  // Weather
  if (context.weather && !context.weather.isIndoor) {
    parts.push(`\n**Weather Conditions:**`);
    parts.push(`${context.weather.icon} ${context.weather.description}`);
    parts.push(`Temperature: ${context.weather.temperature}°C (feels like ${context.weather.feelsLike}°C)`);
    parts.push(`Humidity: ${context.weather.humidity}%`);
    parts.push(`Wind: ${context.weather.windSpeed} km/h`);
    if (context.weather.precipitation > 0) {
      parts.push(`Precipitation: ${context.weather.precipitation}mm`);
    }
  }

  return parts.join('\n');
}
