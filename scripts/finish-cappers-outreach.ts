import { PrismaClient } from '@prisma/client';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  // Get Cappers tool review
  const cappers = await prisma.toolReview.findFirst({
    where: { toolName: 'Cappers' }
  });
  
  if (!cappers) {
    console.log('Cappers not found');
    return;
  }
  
  console.log('Found Cappers:', cappers.toolName);
  console.log('Blog Slug:', cappers.blogSlug);
  console.log('Email:', cappers.contactEmail);
  
  if (cappers.blogSlug && cappers.contactEmail) {
    console.log('\n📧 Sending outreach email...');
    const reviewUrl = `https://sportbot.ai/blog/${cappers.blogSlug}`;
    const sent = await sendToolReviewOutreach(
      cappers.contactEmail,
      cappers.toolName,
      reviewUrl
    );
    
    if (sent) {
      // Update the tool review status
      await prisma.toolReview.update({
        where: { id: cappers.id },
        data: { outreachStatus: 'SENT', outreachSentAt: new Date() }
      });
      console.log('✅ Outreach sent!');
    } else {
      console.log('❌ Failed to send outreach');
    }
  } else {
    console.log('Missing blog post or email, cannot send outreach');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
