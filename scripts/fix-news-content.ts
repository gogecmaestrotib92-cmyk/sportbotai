import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/lib/prisma';

/**
 * Strip betting/promotional content from blog content for Google News
 */
function stripPromotionalContent(content: string): string {
  let result = content;
  
  result = result.replace(/<h2[^>]*>\s*SportBot AI Prediction\s*<\/h2>/gi, '');
  result = result.replace(
    /<div[^>]*style="[^"]*#10b981[^"]*"[^>]*>\s*<div[^>]*>\s*<span[^>]*>🎯<\/span>[\s\S]*?<\/div>\s*<\/div>/gi,
    ''
  );
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<a[^>]*>[^<]*<\/a>\s*<\/div>/gi,
    ''
  );
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<\/p>\s*<\/div>/gi,
    ''
  );
  result = result.replace(/🤖\s*Want Real-Time AI Analysis\?/gi, '');
  result = result.replace(/🤖\s*Want Deep Insights\?/gi, '');
  result = result.replace(/Ready for Deeper Analysis\?/gi, '');
  result = result.replace(/Unlock Advanced Stats/gi, '');
  result = result.replace(/Get live probability updates[^<]*/gi, '');
  result = result.replace(/<a[^>]*href="\/(?:register|pricing|login)"[^>]*>[^<]*<\/a>/gi, '');
  result = result.replace(/<p[^>]*>\s*(?:<[^>]+>)*\s*Pro tip[^<]*(?:<[^>]+>)*\s*<\/p>/gi, '');
  result = result.replace(/Try SportBot AI free|Get Started Free|Start Your Free|Join now|Subscribe today|See Pro Features/gi, '');
  result = result.replace(/\b(win|probability|chance):\s*\d+%/gi, '');
  result = result.replace(/\b\d+(\.\d+)?%\s*(probability|chance|win)/gi, '');
  result = result.replace(/best bet|betting value|value bet/gi, 'key factor');
  result = result.replace(/\bstake\b|\bwager\b/gi, 'consideration');
  result = result.replace(/gamblers?|bettors?/gi, 'fans');
  result = result.replace(/betting tips|betting preview/gi, 'match analysis');
  result = result.replace(/<p[^>]*>\s*<\/p>/gi, '');
  for (let i = 0; i < 3; i++) {
    result = result.replace(/<div[^>]*>\s*<\/div>/gi, '');
  }
  
  return result;
}

/**
 * Transform blog content into news-friendly content - FIXED VERSION
 */
function transformToNewsContent(
  blogContent: string,
  league: string
): string {
  let newsContent = stripPromotionalContent(blogContent);
  
  const newsEndBox = `
<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center; border: 1px solid #334155;">
  <div style="font-size: 32px; margin-bottom: 12px;">⚡</div>
  <h3 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
    More ${league} Coverage
  </h3>
  <p style="color: #94a3b8; font-size: 15px; margin: 0 0 20px 0; max-width: 400px; margin-left: auto; margin-right: auto;">
    Follow all ${league} matches with live updates and expert analysis.
  </p>
  <a href="/matches" style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
    View All Matches →
  </a>
</div>`;
  
  // Take first 5 sections (Match Overview, Home Form, Away Form, H2H, Key Stats)
  const sections = newsContent.split(/<h2[^>]*>/i);
  
  let newsArticle = '';
  const maxSections = 5;
  
  for (let i = 0; i < Math.min(sections.length, maxSections); i++) {
    if (i === 0) {
      newsArticle = sections[i];
    } else {
      newsArticle += '<h2>' + sections[i];
    }
  }
  
  // Clean up any trailing incomplete HTML
  newsArticle = newsArticle.replace(/<h2[^>]*>[^<]*$/, '');
  
  // Add the news end box
  if (!newsArticle.includes('More ' + league + ' Coverage')) {
    newsArticle += newsEndBox;
  }
  
  return newsArticle;
}

async function main() {
  // Get all match preview posts
  const posts = await prisma.blogPost.findMany({
    where: {
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
      status: 'PUBLISHED'
    },
    select: {
      id: true,
      slug: true,
      content: true,
      newsContent: true,
      league: true,
      sport: true
    }
  });

  console.log(`Found ${posts.length} posts to update\n`);

  let updated = 0;
  
  for (const post of posts) {
    const league = post.league || post.sport || 'Sports';
    const newNewsContent = transformToNewsContent(post.content, league);
    
    // Only update if newsContent is short (broken)
    if (!post.newsContent || post.newsContent.length < 1500) {
      console.log(`Updating: ${post.slug}`);
      console.log(`  Old length: ${post.newsContent?.length || 0}, New length: ${newNewsContent.length}`);
      
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { newsContent: newNewsContent }
      });
      
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} posts with proper newsContent`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => process.exit(0)));
