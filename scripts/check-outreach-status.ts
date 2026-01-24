/**
 * Check outreach status for latest tool reviews
 * 
 * Run: npx tsx scripts/check-outreach-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Today we fixed the template
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tools = await prisma.toolReview.findMany({
    where: {
      reviewContent: { not: null },
      blogSlug: { not: null },
    },
    orderBy: { reviewGeneratedAt: 'desc' },
    take: 30,
    select: {
      toolName: true,
      contactEmail: true,
      outreachStatus: true,
      outreachSentAt: true,
      blogSlug: true,
    }
  });

  console.log('Latest 30 tools with reviews - Outreach Analysis:');
  console.log('='.repeat(80));
  
  const correctTemplate: typeof tools = [];
  const badTemplate: typeof tools = [];
  const notSent: typeof tools = [];
  const noEmail: typeof tools = [];
  
  for (const t of tools) {
    if (!t.contactEmail) {
      noEmail.push(t);
    } else if (t.outreachStatus !== 'SENT') {
      notSent.push(t);
    } else {
      const sentDate = new Date(t.outreachSentAt!);
      if (sentDate >= today) {
        correctTemplate.push(t);
      } else {
        badTemplate.push(t);
      }
    }
  }
  
  console.log('\n✅ CONTACTED WITH CORRECT TEMPLATE (sent today after fix):');
  if (correctTemplate.length === 0) {
    console.log('   None');
  } else {
    correctTemplate.forEach(t => {
      console.log(`   ✅ ${t.toolName} → ${t.contactEmail}`);
    });
  }
  
  console.log('\n⚠️  CONTACTED WITH BAD TEMPLATE (sent before today - NEEDS RESEND):');
  if (badTemplate.length === 0) {
    console.log('   None');
  } else {
    badTemplate.forEach(t => {
      const date = new Date(t.outreachSentAt!).toISOString().slice(0,10);
      console.log(`   ⚠️  ${t.toolName} → ${t.contactEmail} (sent ${date})`);
    });
  }
  
  console.log('\n📧 HAS EMAIL BUT NOT YET CONTACTED:');
  if (notSent.length === 0) {
    console.log('   None');
  } else {
    notSent.forEach(t => {
      console.log(`   📧 ${t.toolName} → ${t.contactEmail}`);
    });
  }
  
  console.log('\n❌ NO EMAIL FOUND:');
  if (noEmail.length === 0) {
    console.log('   None');
  } else {
    noEmail.forEach(t => {
      console.log(`   ❌ ${t.toolName}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY:');
  console.log(`   ✅ Correct template (today): ${correctTemplate.length}`);
  console.log(`   ⚠️  Bad template (needs resend): ${badTemplate.length}`);
  console.log(`   📧 Not sent yet: ${notSent.length}`);
  console.log(`   ❌ No email: ${noEmail.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
