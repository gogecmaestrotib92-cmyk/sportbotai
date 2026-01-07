import { NextRequest, NextResponse } from 'next/server';
import { captureScreenshotWithFallback, captureWebsiteScreenshot } from '@/lib/blog/screenshot-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Debug endpoint for testing screenshot capture
 * GET /api/debug/screenshot?url=https://example.com&name=Test
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || 'https://killersports.com/';
  const name = request.nextUrl.searchParams.get('name') || 'Test';
  
  console.log(`[Screenshot Debug] Testing ${url} with name ${name}`);
  console.log(`[Screenshot Debug] SCREENSHOTONE_API_KEY configured: ${!!process.env.SCREENSHOTONE_API_KEY}`);
  console.log(`[Screenshot Debug] BLOB_READ_WRITE_TOKEN configured: ${!!process.env.BLOB_READ_WRITE_TOKEN}`);
  
  try {
    console.log('[Screenshot Debug] Calling captureWebsiteScreenshot...');
    const result = await captureWebsiteScreenshot(url, name);
    
    return NextResponse.json({
      success: true,
      url: result.url,
      width: result.width,
      height: result.height,
      message: 'Screenshot captured successfully'
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Screenshot Debug] Error:', errorMsg);
    console.error('[Screenshot Debug] Stack:', stack);
    
    return NextResponse.json({
      success: false,
      error: errorMsg,
      stack: stack,
      envCheck: {
        screenshotoneKey: !!process.env.SCREENSHOTONE_API_KEY,
        blobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      }
    }, { status: 500 });
  }
}
