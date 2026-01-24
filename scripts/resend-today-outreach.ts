/**
 * Resend today's outreach emails with the CORRECT template
 * 
 * Run: npx tsx scripts/resend-today-outreach.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tools = await prisma.toolReview.findMany({
    where: {
      outreachStatus: 'SENT',
      outreachSentAt: {
        gte: today,
        lt: tomorrow
      },
      blogSlug: { not: null },
      contactEmail: { not: null }
    },
    orderBy: { outreachSentAt: 'asc' }
  });

  console.log(`\n📧 Resending ${tools.length} emails with CORRECT template...\n`);
  console.log('='.repeat(60));

  let sent = 0;
  let failed = 0;

  for (const tool of tools) {
    const reviewUrl = `https://www.sportbotai.com/${tool.blogSlug}`;
    console.log(`\n📧 ${tool.toolName} → ${tool.contactEmail}`);
    console.log(`   Review: ${reviewUrl}`);

    try {
      const success = await sendToolReviewOutreach(
        tool.contactEmail!,
        tool.toolName,
        reviewUrl
      );

      if (success) {
        console.log(`   ✅ Sent!`);
        sent++;
      } else {
        console.log(`   ❌ Failed`);
        failed++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err instanceof Error ? err.message : err}`);
      failed++;
    }

    // Rate limit - 2 seconds between emails
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Sent: ${sent}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('\nNote: These are follow-up emails with the CORRECT template.');
  console.log('Subject will be: "Wrote a review of {tool}"');

  await prisma.$disconnect();
}

main().catch(console.error);
