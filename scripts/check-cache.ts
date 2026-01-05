import { cacheGet, CACHE_KEYS } from '@/lib/cache';

async function check() {
  // Check NBA match
  const cacheKey = CACHE_KEYS.matchPreview('Detroit Pistons', 'New York Knicks', 'basketball_nba', '2026-01-06');
  console.log('Cache key:', cacheKey);
  
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log('Found cached data!');
    console.log('dataAvailability:', JSON.stringify((cached as any).dataAvailability));
    console.log('preAnalyzed:', (cached as any).preAnalyzed);
    console.log('hasMomentumAndForm:', !!(cached as any).momentumAndForm);
    if ((cached as any).momentumAndForm) {
      console.log('homeForm length:', (cached as any).momentumAndForm.homeForm?.length);
      console.log('awayForm length:', (cached as any).momentumAndForm.awayForm?.length);
    }
  } else {
    console.log('No cached data found');
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
