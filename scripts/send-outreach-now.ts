/**
 * Send outreach emails to tools that have reviews ready
 * Run: npx tsx scripts/send-outreach-now.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding tools ready for outreach...\n');
  
  const ready = await prisma.toolReview.findMany({
    where: {
      reviewStatus: { in: ['GENERATED', 'PUBLISHED'] },
      outreachStatus: 'NOT_SENT',
      contactEmail: { not: null },
      blogSlug: { not: null }
    }
  });
  
  console.log(`Found ${ready.length} tools ready for outreach\n`);
  
  let sent = 0;
  let failed = 0;
  
  for (const tool of ready) {
    const reviewUrl = `https://sportbot.ai/blog/${tool.blogSlug}`;
    console.log(`📧 ${tool.toolName} -> ${tool.contactEmail}`);
    
    try {
      const success = await sendToolReviewOutreach(
        tool.contactEmail!,
        tool.toolName,
        reviewUrl
      );
      
      if (success) {
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: { 
            outreachStatus: 'SENT', 
            outreachSentAt: new Date() 
          }
        });
        console.log(`   ✅ Sent!`);
        sent++;
      } else {
        console.log(`   ❌ Failed to send`);
        failed++;
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e instanceof Error ? e.message : e}`);
      failed++;
    }
    
    // Small delay between emails
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Sent: ${sent}`);
  console.log(`❌ Failed: ${failed}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
