/**
 * Test script for Screenshotone API
 */

const SCREENSHOTONE_API_KEY = process.env.SCREENSHOTONE_API_KEY;

async function testScreenshot() {
  if (!SCREENSHOTONE_API_KEY) {
    console.log('SCREENSHOTONE_API_KEY not set. Get one at https://screenshotone.com (free tier: 100/month)');
    console.log('\nTo test, run: SCREENSHOTONE_API_KEY=your_key npx ts-node scripts/test-screenshot.ts');
    return;
  }
  
  const websiteUrl = 'https://www.oddschecker.com';
  console.log(`Capturing ${websiteUrl} via Screenshotone...`);
  
  const params = new URLSearchParams({
    access_key: SCREENSHOTONE_API_KEY,
    url: websiteUrl,
    format: 'png',
    viewport_width: '1920',
    viewport_height: '1080',
    block_cookie_banners: 'true',
    block_banners_by_heuristics: 'true',
    block_ads: 'true',
    block_chats: 'true',
    block_trackers: 'true',
    delay: '2',
    timeout: '30',
  });
  
  const apiUrl = `https://api.screenshotone.com/take?${params.toString()}`;
  console.log('Fetching screenshot...');
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error: ${response.status} - ${errorText}`);
    return;
  }
  
  const fs = await import('fs');
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync('/tmp/screenshotone-test.png', buffer);
  
  console.log('✅ Screenshot saved to /tmp/screenshotone-test.png');
  console.log(`File size: ${Math.round(buffer.length / 1024)} KB`);
}

testScreenshot().catch(console.error);
