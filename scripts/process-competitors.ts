/**
 * Process competitor tools: extract content, find emails, generate reviews
 */

import { PrismaClient } from '@prisma/client';
import { extractWebsiteContent, findContactEmail, generateToolReview } from '../src/lib/backlink-scout';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

const COMPETITOR_URLS = [
  'https://playerprops.ai',
  'https://aipredictions.ai',
  'https://gambly.com',
  'https://juicereel.com'
];

async function processCompetitors() {
  const action = process.argv[2] || 'all'; // all, content, review, outreach
  
  console.log(`\n🎯 Processing competitors - Action: ${action}\n`);
  
  for (const url of COMPETITOR_URLS) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📍 ${url}`);
    console.log('='.repeat(50));
    
    const tool = await prisma.toolReview.findFirst({
      where: { toolUrl: url }
    });
    
    if (!tool) {
      console.log('❌ Tool not found in DB');
      continue;
    }
    
    console.log(`📝 Status: review=${tool.reviewStatus}, outreach=${tool.outreachStatus}`);
    console.log(`📧 Email: ${tool.contactEmail || 'not found'}`);
    console.log(`📄 Content: ${tool.contentWords || 0} words`);
    
    // Step 1: Extract content if needed
    if (action === 'all' || action === 'content') {
      if (!tool.contentWords || tool.contentWords < 100) {
        console.log('\n🔍 Extracting content...');
        try {
          const { content, wordCount } = await extractWebsiteContent(url);
          console.log(`✅ Extracted ${wordCount} words`);
          
          await prisma.toolReview.update({
            where: { id: tool.id },
            data: {
              contentExtracted: content,
              contentWords: wordCount,
            }
          });
        } catch (e) {
          console.log(`❌ Content extraction failed: ${e}`);
        }
      } else {
        console.log(`\n✅ Already has content (${tool.contentWords} words)`);
      }
      
      // Find email if needed
      if (!tool.contactEmail) {
        console.log('\n🔍 Finding email...');
        try {
          const { email, source } = await findContactEmail(url);
          if (email) {
            console.log(`✅ Found email: ${email} (${source})`);
            await prisma.toolReview.update({
              where: { id: tool.id },
              data: { 
                contactEmail: email, 
                emailSource: source,
                outreachStatus: 'NOT_SENT'
              }
            });
          } else {
            console.log(`❌ No email found`);
          }
        } catch (e) {
          console.log(`❌ Email search failed: ${e}`);
        }
      } else {
        console.log(`\n✅ Already has email: ${tool.contactEmail}`);
      }
    }
    
    // Step 2: Generate review if needed
    if (action === 'all' || action === 'review') {
      // Reload tool to get updated content
      const updatedTool = await prisma.toolReview.findFirst({
        where: { toolUrl: url }
      });
      
      if (updatedTool && updatedTool.reviewStatus === 'PENDING' && updatedTool.contentWords && updatedTool.contentWords > 50) {
        console.log('\n📝 Generating review...');
        try {
          await prisma.toolReview.update({
            where: { id: updatedTool.id },
            data: { reviewStatus: 'GENERATING' }
          });
          
          const review = await generateToolReview(
            updatedTool.toolName,
            updatedTool.toolUrl,
            updatedTool.toolDescription || '',
            updatedTool.contentExtracted || ''
          );
          
          console.log(`✅ Generated: ${review.title}`);
          
          // Screenshot
          let featuredImage = '/sports/football.jpg';
          try {
            featuredImage = await captureScreenshotWithFallback(
              updatedTool.toolUrl,
              updatedTool.toolName,
              '/sports/football.jpg'
            );
            console.log(`📸 Screenshot: ${featuredImage}`);
          } catch (e) {
            console.log(`📸 Screenshot failed, using fallback`);
          }
          
          // Create blog post
          const blogPost = await prisma.blogPost.create({
            data: {
              title: review.title,
              slug: `tools/${review.slug}`,
              excerpt: `A comprehensive review of ${updatedTool.toolName} - see features, pricing, pros and cons.`,
              content: review.content,
              category: 'Tools & Resources',
              tags: ['tool-review', 'sports-betting', 'analytics', 'ai-predictions'],
              status: 'DRAFT',
              postType: 'GENERAL',
              metaTitle: review.title,
              metaDescription: `Our in-depth review of ${updatedTool.toolName}. Features, pricing, pros and cons.`,
              featuredImage,
            },
          });
          
          await prisma.toolReview.update({
            where: { id: updatedTool.id },
            data: {
              reviewStatus: 'GENERATED',
              blogPostId: blogPost.id,
              blogSlug: blogPost.slug,
              reviewTitle: review.title,
              reviewContent: review.content,
              reviewGeneratedAt: new Date(),
            },
          });
          
          console.log(`✅ Blog post created: /blog/${blogPost.slug}`);
          
        } catch (e) {
          console.log(`❌ Review generation failed: ${e}`);
          await prisma.toolReview.update({
            where: { id: updatedTool.id },
            data: { reviewStatus: 'FAILED' }
          });
        }
      } else if (updatedTool?.reviewStatus === 'GENERATED') {
        console.log(`\n✅ Review already generated: ${updatedTool.blogSlug}`);
      } else {
        console.log(`\n⏭️ Skipping review (status: ${updatedTool?.reviewStatus}, words: ${updatedTool?.contentWords})`);
      }
    }
    
    // Step 3: Send outreach if needed
    if (action === 'all' || action === 'outreach') {
      // Reload tool
      const finalTool = await prisma.toolReview.findFirst({
        where: { toolUrl: url }
      });
      
      if (finalTool && 
          finalTool.contactEmail && 
          finalTool.blogSlug &&
          (finalTool.reviewStatus === 'GENERATED' || finalTool.reviewStatus === 'PUBLISHED') &&
          finalTool.outreachStatus === 'NOT_SENT') {
        
        console.log('\n📧 Sending outreach email...');
        const reviewUrl = `https://sportbotai.com/blog/${finalTool.blogSlug}`;
        
        try {
          const sent = await sendToolReviewOutreach(
            finalTool.contactEmail,
            finalTool.toolName,
            reviewUrl
          );
          
          if (sent) {
            await prisma.toolReview.update({
              where: { id: finalTool.id },
              data: {
                outreachStatus: 'SENT',
                outreachSentAt: new Date(),
              }
            });
            console.log(`✅ Email sent to: ${finalTool.contactEmail}`);
          } else {
            console.log(`❌ Email send failed`);
          }
        } catch (e) {
          console.log(`❌ Outreach failed: ${e}`);
        }
      } else if (finalTool?.outreachStatus === 'SENT') {
        console.log(`\n✅ Outreach already sent`);
      } else {
        console.log(`\n⏭️ Skipping outreach (email: ${finalTool?.contactEmail}, blog: ${finalTool?.blogSlug}, status: ${finalTool?.reviewStatus}, outreach: ${finalTool?.outreachStatus})`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('🏁 Done!');
  console.log('='.repeat(50));
  
  await prisma.$disconnect();
}

processCompetitors().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
