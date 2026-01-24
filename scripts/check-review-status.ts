import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReviewStatus() {
  const tools = await prisma.toolReview.findMany({
    where: { outreachStatus: 'SENT' },
    select: { 
      toolName: true, 
      blogSlug: true, 
      reviewStatus: true,
      outreachSentAt: true
    },
    orderBy: { outreachSentAt: 'desc' }
  });
  
  const withReview = tools.filter(t => t.blogSlug);
  const withoutReview = tools.filter(t => !t.blogSlug);
  
  console.log('=== WITH REVIEW (has blogSlug) ===');
  withReview.forEach(t => {
    console.log(`✅ ${t.toolName} -> /blog/${t.blogSlug} (${t.reviewStatus})`);
  });
  
  console.log('\n=== WITHOUT REVIEW (no blogSlug) ===');
  withoutReview.forEach(t => {
    console.log(`❌ ${t.toolName} (${t.reviewStatus})`);
  });
  
  console.log('\n📊 Summary:');
  console.log(`   ${withReview.length} with review`);
  console.log(`   ${withoutReview.length} without review`);
  console.log(`   ${tools.length} total outreach sent`);
  
  await prisma.$disconnect();
}

checkReviewStatus();
