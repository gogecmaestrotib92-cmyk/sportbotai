/**
 * TEST OUTREACH EMAIL
 * ===================
 * 
 * Preview the new premium outreach email template.
 * Sends a test email to yourself.
 * 
 * Usage:
 *   npx tsx scripts/test-outreach-email.ts your@email.com
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendToolReviewOutreach } from '../src/lib/email';

async function main() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log(`
Usage: npx tsx scripts/test-outreach-email.ts your@email.com

This will send a test outreach email so you can preview the template.
`);
    process.exit(1);
  }

  console.log(`\n📧 Sending test outreach email to: ${testEmail}\n`);

  const success = await sendToolReviewOutreach(
    testEmail,
    'Example Tool',
    'https://www.sportbotai.com/blog/tools/example-tool-review'
  );

  if (success) {
    console.log('✅ Test email sent! Check your inbox.\n');
  } else {
    console.log('❌ Failed to send test email.\n');
  }
}

main().catch(console.error);
