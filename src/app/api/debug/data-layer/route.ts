/**
 * Debug endpoint to test DataLayer functionality
 * 
 * Usage: GET /api/debug/data-layer?sport=basketball&home=Lakers&away=Celtics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedMatchDataV2, normalizeSport, isDataLayerAvailable } from '@/lib/data-layer/bridge';
import { getDataLayer } from '@/lib/data-layer';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sport = searchParams.get('sport') || 'basketball';
  const homeTeam = searchParams.get('home') || 'Lakers';
  const awayTeam = searchParams.get('away') || 'Celtics';

  const startTime = Date.now();
  const logs: string[] = [];
  
  const log = (msg: string) => {
    const logEntry = `[${Date.now() - startTime}ms] ${msg}`;
    logs.push(logEntry);
    console.log(`[Debug-DataLayer] ${logEntry}`);
  };

  try {
    log(`Starting test: ${homeTeam} vs ${awayTeam} (${sport})`);
    
    // Check env var
    log(`API_FOOTBALL_KEY present: ${!!process.env.API_FOOTBALL_KEY}`);
    log(`API_FOOTBALL_KEY length: ${(process.env.API_FOOTBALL_KEY || '').length}`);
    
    // Check normalized sport
    const normalizedSport = normalizeSport(sport);
    log(`Normalized sport: ${sport} -> ${normalizedSport}`);
    
    // Check if DataLayer is available
    const available = isDataLayerAvailable(sport);
    log(`DataLayer available for ${sport}: ${available}`);
    
    // Get DataLayer instance
    const dataLayer = getDataLayer();
    log(`DataLayer instance created`);
    
    // List available sports
    const availableSports = dataLayer.getAvailableSports();
    log(`Available sports: ${availableSports.join(', ')}`);
    
    // Test findTeam
    log(`Finding team: ${homeTeam}`);
    const teamResult = await dataLayer.findTeam({ sport: normalizedSport as any, name: homeTeam });
    log(`Team result: ${teamResult.success ? `Found: ${teamResult.data?.name} (ID: ${teamResult.data?.externalId})` : `Failed: ${teamResult.error}`}`);
    
    // Test full enriched data
    log(`Getting enriched match data...`);
    const enrichedData = await getEnrichedMatchDataV2(
      homeTeam,
      awayTeam,
      sport
    );
    log(`Enriched data source: ${enrichedData.dataSource}`);
    log(`Home form games: ${enrichedData.homeForm?.length || 0}`);
    log(`Away form games: ${enrichedData.awayForm?.length || 0}`);
    log(`H2H games: ${enrichedData.headToHead?.length || 0}`);
    log(`H2H summary: ${JSON.stringify(enrichedData.h2hSummary)}`);
    
    const totalTime = Date.now() - startTime;
    log(`Complete in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      input: { sport, homeTeam, awayTeam, normalizedSport },
      environment: {
        apiKeyPresent: !!process.env.API_FOOTBALL_KEY,
        apiKeyLength: (process.env.API_FOOTBALL_KEY || '').length,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
      dataLayerInfo: {
        available,
        availableSports,
      },
      teamLookup: teamResult.success ? {
        name: teamResult.data?.name,
        id: teamResult.data?.externalId,
      } : { error: teamResult.error },
      enrichedData: {
        dataSource: enrichedData.dataSource,
        homeFormCount: enrichedData.homeForm?.length || 0,
        awayFormCount: enrichedData.awayForm?.length || 0,
        h2hCount: enrichedData.headToHead?.length || 0,
        h2hSummary: enrichedData.h2hSummary,
        homeStats: enrichedData.homeStats,
        awayStats: enrichedData.awayStats,
      },
      logs,
      totalTimeMs: totalTime,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    log(`ERROR: ${errorMessage}`);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack,
      logs,
      environment: {
        apiKeyPresent: !!process.env.API_FOOTBALL_KEY,
        apiKeyLength: (process.env.API_FOOTBALL_KEY || '').length,
        nodeEnv: process.env.NODE_ENV,
      },
    }, { status: 500 });
  }
}
