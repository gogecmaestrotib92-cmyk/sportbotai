/**
 * Test the data router
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { routeQuery } from '../src/lib/data-router';

async function test() {
  const message = "how many points joel embiid average this season";
  const category = "STATS";
  
  console.log(`Testing router with: "${message}"`);
  console.log(`Category: ${category}`);
  
  const result = await routeQuery(message, category);
  
  console.log('\nRouter result:');
  console.log('  Source:', result.source);
  console.log('  Has data:', !!result.data);
  console.log('  Error:', result.error || 'none');
  
  if (result.data) {
    console.log('\n=== DATA ===');
    console.log(result.data);
  }
}

test().catch(console.error);
