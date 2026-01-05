import { cacheGet, CACHE_KEYS } from '@/lib/cache';

async function check() {
  const cacheKey = CACHE_KEYS.matchPreview('West Ham United', 'Nottingham Forest', 'soccer_epl', '2026-01-06');
  console.log('Cache key:', cacheKey);
  
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log('Found cached data!');
    console.log('dataAvailability:', JSON.stringify((cached as any).dataAvailability));
    console.log('preAnalyzed:', (cached as any).preAnalyzed);
  } else {
    console.log('No cached data found');
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
