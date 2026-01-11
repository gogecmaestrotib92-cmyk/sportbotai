/**
 * Generate reviews for tools that have email + content but no blog post
 * Run: npx tsx scripts/generate-reviews-now.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { generateToolReviewPosts } from '../src/lib/blog/tool-review-generator';

async function main() {
  console.log('📝 Generating reviews for ready tools...\n');
  
  try {
    const result = await generateToolReviewPosts(10); // Generate up to 10
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Generated: ${result.generated}`);
    console.log(`⏭️ Skipped: ${result.skipped}`);
    console.log(`❌ Errors: ${result.errors}`);
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
