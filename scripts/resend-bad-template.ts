/**
 * Resend outreach to tools that got the bad template
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find tools that were sent before today (bad template)
  const toolsToResend = await prisma.toolReview.findMany({
    where: {
      outreachStatus: 'SENT',
      outreachSentAt: { lt: today },
      contactEmail: { not: null },
      blogSlug: { not: null },
    },
  });

  console.log(`Found ${toolsToResend.length} tools that got bad template. Resending...\n`);

  let success = 0;
  let failed = 0;

  for (const tool of toolsToResend) {
    try {
      // Skip if no email
      if (!tool.contactEmail) {
        console.log(`⏭️  Skipping ${tool.toolName} - no email`);
        continue;
      }
      
      // Strip 'tools/' prefix if it exists (legacy bug)
      const cleanSlug = tool.blogSlug?.replace(/^tools\//, '') || '';
      const reviewUrl = `https://sportbotai.com/blog/tools/${cleanSlug}`;
      
      console.log(`📧 Resending to ${tool.toolName} (${tool.contactEmail})...`);
      
      // Function takes positional args: (email, toolName, reviewUrl)
      const result = await sendToolReviewOutreach(
        tool.contactEmail,
        tool.toolName,
        reviewUrl
      );

      if (result) {
        console.log(`   ✅ Sent!`);
        
        // Update timestamp
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: { outreachSentAt: new Date() },
        });
        
        success++;
      } else {
        console.log(`   ❌ Failed to send`);
        failed++;
      }

      // Rate limit - wait 2 seconds between emails
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DONE!');
  console.log(`   ✅ Successfully resent: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);

  await prisma.$disconnect();
}

main().catch(console.error);
