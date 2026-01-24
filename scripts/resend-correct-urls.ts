/**
 * Resend to tools contacted today with CORRECT URLs
 * (Database was fixed after first batch went out with /tools/tools/ bug)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  // Get ALL tools we sent today (they got bad links earlier)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const toolsToResend = await prisma.toolReview.findMany({
    where: {
      outreachStatus: 'SENT',
      outreachSentAt: { gte: today },
      contactEmail: { not: null },
      blogSlug: { not: null },
    },
  });

  console.log(`Found ${toolsToResend.length} tools to resend with CORRECT URLs...\n`);

  let success = 0;
  let failed = 0;

  for (const tool of toolsToResend) {
    if (!tool.contactEmail || !tool.blogSlug) continue;
    
    // Clean slug (should already be clean now, but safeguard)
    const cleanSlug = tool.blogSlug.replace(/^tools\//, '');
    const reviewUrl = `https://sportbotai.com/tools/${cleanSlug}`;
    
    console.log(`📧 ${tool.toolName} -> ${reviewUrl}`);
    
    try {
      const result = await sendToolReviewOutreach(
        tool.contactEmail,
        tool.toolName,
        reviewUrl
      );
      
      if (result) {
        console.log(`   ✅ Sent!`);
        success++;
      } else {
        console.log(`   ❌ Failed`);
        failed++;
      }
      
      // Rate limit - 2 seconds between emails
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.log(`   ❌ Error: ${err}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DONE!');
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);

  await prisma.$disconnect();
}

main().catch(console.error);
