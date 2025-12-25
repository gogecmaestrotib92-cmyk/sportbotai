/**
 * Adapters Index
 * 
 * Export all adapters for external use
 */

export { BaseSportAdapter, AdapterRegistry } from './base';
export type { ISportAdapter, AdapterConfig } from './base';

export { BasketballAdapter, getBasketballAdapter } from './basketball';
export { HockeyAdapter, getHockeyAdapter } from './hockey';
export { NFLAdapter, getNFLAdapter } from './nfl';
export { SoccerAdapter, getSoccerAdapter } from './soccer';
export { MMAAdapter, getMMAAdapter } from './mma';
