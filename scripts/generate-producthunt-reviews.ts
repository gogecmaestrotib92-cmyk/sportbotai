/**
 * Generate Reviews and Send Outreach for Product Hunt Tools
 * 
 * This script:
 * 1. Generates blog reviews for Product Hunt tools
 * 2. Publishes them
 * 3. Sends outreach emails
 */

import { prisma } from '../src/lib/prisma';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { sendToolReviewOutreach } from '../src/lib/email';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';

async function generateAndOutreach() {
  console.log('🚀 Generating reviews for Product Hunt tools...\n');
  
  // Get Product Hunt tools that need reviews
  const tools = await prisma.toolReview.findMany({
    where: {
      scrapedFrom: 'producthunt',
      blogPostId: null,
      contactEmail: { not: null },
    },
  });
  
  console.log(`Found ${tools.length} tools to process\n`);
  
  for (const tool of tools) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📝 Processing: ${tool.toolName}`);
      console.log(`   URL: ${tool.toolUrl}`);
      console.log(`   Email: ${tool.contactEmail}`);
      
      // Generate review content
      console.log(`\n   Generating review content...`);
      const review = await generateToolReviewContent(
        tool.toolName,
        tool.toolUrl,
        tool.toolDescription || '',
        tool.contentExtracted || ''
      );
      
      console.log(`   ✅ Content generated: ${review.title}`);
      
      // Capture screenshot
      let featuredImage = '/sports/football.jpg';
      try {
        console.log(`   Capturing screenshot...`);
        featuredImage = await captureScreenshotWithFallback(
          tool.toolUrl,
          tool.toolName,
          '/sports/football.jpg'
        );
        if (featuredImage.includes('blob.vercel-storage.com')) {
          console.log(`   ✅ Screenshot captured`);
        }
      } catch (imgErr) {
        console.log(`   ⚠️ Using fallback image`);
      }
      
      // Check if slug exists
      const existing = await prisma.blogPost.findUnique({ where: { slug: review.slug } });
      if (existing) {
        console.log(`   ⚠️ Slug ${review.slug} exists, linking to existing post`);
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: { blogPostId: existing.id, blogSlug: review.slug },
        });
        continue;
      }
      
      // Create blog post (add tools/ prefix for tool reviews)
      const slug = `tools/${review.slug}`;
      const blogPost = await prisma.blogPost.create({
        data: {
          title: review.title,
          slug: slug,
          excerpt: review.excerpt,
          content: review.content,
          category: 'Tools & Resources',
          tags: review.tags,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          postType: 'GENERAL',
          metaTitle: review.metaTitle,
          metaDescription: review.metaDescription,
          featuredImage,
        },
      });
      
      console.log(`   ✅ Published: /blog/${slug}`);
      
      // Link tool review to blog post
      await prisma.toolReview.update({
        where: { id: tool.id },
        data: {
          blogPostId: blogPost.id,
          blogSlug: slug,
          reviewTitle: review.title,
          reviewContent: review.content,
          reviewGeneratedAt: new Date(),
          reviewStatus: 'PUBLISHED',
        },
      });
      
      // Send outreach email
      if (tool.contactEmail) {
        const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
        console.log(`\n   📧 Sending outreach to ${tool.contactEmail}...`);
        
        const emailSent = await sendToolReviewOutreach(
          tool.contactEmail,
          tool.toolName,
          reviewUrl
        );
        
        if (emailSent) {
          console.log(`   ✅ Outreach email sent!`);
          await prisma.toolReview.update({
            where: { id: tool.id },
            data: {
              outreachStatus: 'SENT',
              outreachSentAt: new Date(),
            },
          });
        } else {
          console.log(`   ❌ Outreach email failed`);
        }
      }
      
      // Small delay between tools
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      console.error(`\n   ❌ Error processing ${tool.toolName}:`, error);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All done!');
  
  await prisma.$disconnect();
}

generateAndOutreach().catch(console.error);
