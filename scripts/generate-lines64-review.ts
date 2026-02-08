/**
 * Generate tool review for Lines64
 * 
 * Usage: npx tsx scripts/generate-lines64-review.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';

const prisma = new PrismaClient();

const TOOL = {
  toolName: 'Lines64',
  toolUrl: 'https://lines64.com/',
  contactEmail: null, // Contact form only at https://lines64.com/contact/
  description: `Lines64 is a comprehensive sports betting resource and online magazine covering all aspects of betting. Founded by Mark Prezelj (Editor-in-Chief) and Tit Krajnik (Writer, Data Specialist), the site is dedicated to helping bettors navigate the world of value betting, arbitrage betting, matched betting, fantasy sports, dropping odds, and prediction markets.

Key features include:
- In-depth tool reviews: OddsJam, RebelBetting, BetBurger, WinnerOdds, BetHero, Trademate, and more
- Comprehensive betting tutorials and guides
- Coverage of US, UK, CA, BR, and AUS markets
- Bookmaker limitation guides and account longevity tips
- Dropping odds alert service comparisons
- Fantasy sports guides for niche sports (darts, cycling, F1)
- Weekly newsletter with betting data science news

The site emphasizes hands-on testing - they actually try or use the products they review, unlike many competitors who just aggregate content. They cover esports betting (Counter-Strike, Age of Empires, LoL, WoW) and have resources on GitHub and Discord community.`,
};

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Generating review for: ${TOOL.toolName}`);
  console.log('='.repeat(60));
  console.log(`   URL: ${TOOL.toolUrl}`);
  console.log(`   Email: ${TOOL.contactEmail || 'N/A (contact form only)'}`);
  
  // Generate slug
  const slugBase = TOOL.toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const slug = `tools/${slugBase}-review`;
  
  // Check if already exists
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    console.log(`⚠️  Blog post already exists: /blog/${slug}`);
    console.log(`   View at: https://www.sportbotai.com/blog/${slug}`);
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\n🤖 Generating review content...`);
  const review = await generateToolReviewContent(
    TOOL.toolName, 
    TOOL.toolUrl, 
    TOOL.description, 
    '' // No extracted content needed, we have a good description
  );
  
  console.log(`   ✅ Content generated (${review.content.length} chars)`);
  
  // Capture screenshot
  console.log(`\n📸 Capturing screenshot...`);
  let featuredImage = '/sports/football.jpg';
  try {
    featuredImage = await captureScreenshotWithFallback(
      TOOL.toolUrl,
      TOOL.toolName,
      '/sports/football.jpg'
    );
    if (featuredImage.includes('blob.vercel-storage.com')) {
      console.log(`   ✅ Screenshot captured`);
    } else {
      console.log(`   ⚠️ Using fallback image`);
    }
  } catch (err) {
    console.log(`   ⚠️ Screenshot failed, using fallback`);
  }
  
  // Create blog post
  console.log(`\n💾 Creating blog post...`);
  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: review.title,
      content: review.content,
      excerpt: review.metaDescription,
      featuredImage,
      category: 'TOOLS',
      tags: ['tool-review', 'value-betting', 'arbitrage-betting', 'matched-betting', 'sports-betting-tools', 'betting-education'],
      status: 'PUBLISHED',
      publishedAt: new Date(),
      metaTitle: review.title,
      metaDescription: review.metaDescription,
    },
  });
  
  console.log(`   ✅ Blog post created: /blog/${slug}`);
  
  // Create/update ToolReview record
  const existingToolReview = await prisma.toolReview.findFirst({
    where: { toolUrl: TOOL.toolUrl }
  });
  
  if (existingToolReview) {
    await prisma.toolReview.update({
      where: { id: existingToolReview.id },
      data: { blogPostId: post.id }
    });
  } else {
    await prisma.toolReview.create({
      data: {
        toolName: TOOL.toolName,
        toolUrl: TOOL.toolUrl,
        toolDescription: TOOL.description,
        sourceUrl: 'manual-outreach',
        scrapedFrom: 'MANUAL_OUTREACH',
        contentExtracted: TOOL.description,
        contentWords: TOOL.description.split(/\s+/).length,
        contactEmail: TOOL.contactEmail,
        outreachStatus: 'NOT_SENT',
        blogPostId: post.id,
      },
    });
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ DONE!`);
  console.log(`   Review URL: https://www.sportbotai.com/blog/${slug}`);
  console.log(`   Note: Contact form at https://lines64.com/contact/`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

main().catch(console.error);
