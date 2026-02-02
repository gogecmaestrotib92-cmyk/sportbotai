import { PrismaClient } from '@prisma/client';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

const TOOLS = [
  { toolName: 'StatSalt', toolUrl: 'https://statsalt.com/', contactEmail: null as string | null, blogSlug: 'tools/statsalt-review' },
  { toolName: 'PickDawgz', toolUrl: 'https://pickdawgz.com/', contactEmail: 'help@pickdawgz.com', blogSlug: 'tools/pickdawgz-review' },
  { toolName: 'Scores and Stats', toolUrl: 'https://www.scoresandstats.com/', contactEmail: 'sales@scoresandstats.com', blogSlug: 'tools/scores-and-stats-review' },
  { toolName: 'XCLSV Media', toolUrl: 'https://xclsvmedia.com/', contactEmail: 'zaire@xclsvmedia.com', blogSlug: 'tools/xclsv-media-review' },
];

async function main() {
  console.log('='.repeat(60));
  console.log('Fixing ToolReview records and sending outreach emails');
  console.log('='.repeat(60));
  
  let successCount = 0;
  let emailsSent = 0;
  
  for (const tool of TOOLS) {
    console.log(`\nProcessing: ${tool.toolName}`);
    
    // Get blog post
    const blogPost = await prisma.blogPost.findUnique({
      where: { slug: tool.blogSlug }
    });
    
    if (!blogPost) {
      console.log(`  ❌ Blog post not found: ${tool.blogSlug}`);
      continue;
    }
    
    console.log(`  ✅ Found blog post: ${blogPost.title}`);
    
    // Create ToolReview record
    try {
      await prisma.toolReview.upsert({
        where: { toolUrl: tool.toolUrl },
        create: {
          toolName: tool.toolName,
          toolUrl: tool.toolUrl,
          toolDescription: 'Generated via outreach script',
          contactEmail: tool.contactEmail,
          sourceUrl: 'manual',
          scrapedFrom: 'MANUAL_OUTREACH',
          contentExtracted: 'Content extracted during generation',
          contentWords: 500,
          blogPostId: blogPost.id,
          blogSlug: tool.blogSlug,
          reviewTitle: blogPost.title,
          reviewContent: blogPost.content,
          reviewGeneratedAt: new Date(),
          reviewStatus: 'PUBLISHED',
        },
        update: {
          blogPostId: blogPost.id,
          blogSlug: tool.blogSlug,
          reviewStatus: 'PUBLISHED',
        },
      });
      console.log(`  ✅ ToolReview record created/updated`);
      successCount++;
    } catch (error) {
      console.log(`  ❌ ToolReview error: ${error}`);
      continue;
    }
    
    // Send outreach email
    if (tool.contactEmail) {
      try {
        const reviewUrl = `https://sportbotai.com/blog/${tool.blogSlug}`;
        await sendToolReviewOutreach(
          tool.contactEmail,
          tool.toolName,
          reviewUrl
        );
        console.log(`  ✅ Outreach email sent to ${tool.contactEmail}`);
        emailsSent++;
      } catch (error) {
        console.log(`  ❌ Email failed: ${error}`);
      }
    } else {
      console.log(`  ⚠️ No contact email - skipping outreach`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`ToolReview records: ${successCount}/${TOOLS.length}`);
  console.log(`Outreach emails sent: ${emailsSent}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
