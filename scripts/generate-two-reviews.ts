/**
 * Generate tool reviews for Sports Prediction AI and Odds Assist
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

const tools = [
  {
    name: 'Sports Prediction AI',
    url: 'https://sportsprediction.ai/',
    email: 'info@sportsprediction.ai',
    slug: 'tools/sports-prediction-ai-review',
    description: 'Sports Prediction AI is an AI-powered sports betting platform that uses machine learning algorithms to analyze historical data and generate predictions for various sports including football, basketball, tennis, and more. Features include probability estimates, value bet detection, and bankroll management recommendations.'
  },
  {
    name: 'Odds Assist',
    url: 'https://oddsassist.com/',
    email: 'hello@oddsassist.com',
    slug: 'tools/odds-assist-review',
    description: 'Odds Assist is a comprehensive odds comparison and sports betting tools platform. It helps bettors find the best odds across multiple sportsbooks, track line movements, and identify arbitrage opportunities. Features include real-time odds updates, betting calculators, and smart alerts for value bets.'
  }
];

async function processTool(tool: typeof tools[0]) {
  console.log('\n' + '='.repeat(60));
  console.log(`📝 Processing: ${tool.name}`);
  console.log('='.repeat(60));
  
  // Check if exists
  const existing = await prisma.blogPost.findUnique({ where: { slug: tool.slug } });
  if (existing) {
    console.log('⚠️ Already exists, sending outreach only...');
    const reviewUrl = `https://www.sportbotai.com/blog/${tool.slug}`;
    await sendToolReviewOutreach(tool.email, tool.name, reviewUrl);
    console.log('✅ Outreach sent!');
    return;
  }
  
  // Generate content
  console.log('   Generating review content...');
  const review = await generateToolReviewContent(tool.name, tool.url, tool.description, '');
  console.log(`   ✅ Generated: ${review.title}`);
  
  // Screenshot
  console.log('   📸 Capturing screenshot...');
  let featuredImage = '/sports/football.jpg';
  try {
    featuredImage = await captureScreenshotWithFallback(tool.url, tool.name, '/sports/football.jpg');
    console.log(`   ✅ Screenshot: ${featuredImage.includes('blob') ? 'captured' : 'fallback'}`);
  } catch (e) {
    console.log('   ⚠️ Screenshot failed, using fallback');
  }
  
  // Create blog post
  console.log('   💾 Publishing...');
  await prisma.blogPost.create({
    data: {
      title: review.title,
      slug: tool.slug,
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
  console.log(`   ✅ Published: /blog/${tool.slug}`);
  
  // Send outreach
  console.log(`   📧 Sending outreach to ${tool.email}...`);
  const reviewUrl = `https://www.sportbotai.com/blog/${tool.slug}`;
  const sent = await sendToolReviewOutreach(tool.email, tool.name, reviewUrl);
  
  if (sent) {
    console.log('   ✅ Outreach sent!');
  } else {
    console.log('   ❌ Outreach failed');
  }
  
  console.log(`   🎉 Done! Review: ${reviewUrl}`);
}

async function main() {
  console.log('🚀 Processing 2 tool reviews...');
  for (const tool of tools) {
    await processTool(tool);
  }
  console.log('\n✅ All done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
