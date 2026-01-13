/**
 * Regenerate newsContent for existing match previews with the new maxSections=8
 * Run: npx tsx scripts/regenerate-news-content.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Strip betting/promotional content from blog content for Google News
 */
function stripPromotionalContent(content: string): string {
  let result = content;
  
  // Remove the entire "SportBot AI Prediction" section
  result = result.replace(/<h2[^>]*>\s*SportBot AI Prediction\s*<\/h2>/gi, '');
  
  // Remove prediction boxes
  result = result.replace(
    /<div[^>]*style="[^"]*#10b981[^"]*"[^>]*>\s*<div[^>]*>\s*<span[^>]*>🎯<\/span>[\s\S]*?<\/div>\s*<\/div>/gi,
    ''
  );
  
  // Remove CTA boxes
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<a[^>]*>[^<]*<\/a>\s*<\/div>/gi,
    ''
  );
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<\/p>\s*<\/div>/gi,
    ''
  );
  
  // Remove promotional phrases
  result = result.replace(/🤖\s*Want Real-Time AI Analysis\?/gi, '');
  result = result.replace(/🤖\s*Want Deep Insights\?/gi, '');
  result = result.replace(/Ready for Deeper Analysis\?/gi, '');
  result = result.replace(/Unlock Advanced Stats/gi, '');
  result = result.replace(/Get live probability updates[^<]*/gi, '');
  
  // Remove standalone promotional links
  result = result.replace(/<a[^>]*href="\/(?:register|pricing|login)"[^>]*>[^<]*<\/a>/gi, '');
  
  // Remove "Pro tip" paragraphs
  result = result.replace(/<p[^>]*>\s*(?:<[^>]+>)*\s*Pro tip[^<]*(?:<[^>]+>)*\s*<\/p>/gi, '');
  
  // Remove standalone promotional text
  result = result.replace(/Try SportBot AI free|Get Started Free|Start Your Free|Join now|Subscribe today|See Pro Features/gi, '');
  
  // Remove probability percentages
  result = result.replace(/\b(win|probability|chance):\s*\d+%/gi, '');
  result = result.replace(/\b\d+(\.\d+)?%\s*(probability|chance|win)/gi, '');
  
  // Replace betting language with neutral terms
  result = result.replace(/best bet|betting value|value bet/gi, 'key factor');
  result = result.replace(/\bstake\b|\bwager\b/gi, 'consideration');
  result = result.replace(/gamblers?|bettors?/gi, 'fans');
  result = result.replace(/betting tips|betting preview/gi, 'match analysis');
  
  // Clean up empty paragraphs and divs
  result = result.replace(/<p[^>]*>\s*<\/p>/gi, '');
  for (let i = 0; i < 3; i++) {
    result = result.replace(/<div[^>]*>\s*<\/div>/gi, '');
  }
  
  return result;
}

/**
 * Transform blog content into news-friendly content (NEW: maxSections=8)
 */
function transformToNewsContent(
  blogContent: string,
  league: string
): string {
  const newsContent = stripPromotionalContent(blogContent);
  
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
  
  const sections = newsContent.split(/<h2[^>]*>/i);
  
  // NEW: Include 9 sections (all analysis including tactical matchup)
  let newsArticle = '';
  const maxSections = 9;
  
  for (let i = 0; i < Math.min(sections.length, maxSections); i++) {
    if (i === 0) {
      newsArticle = sections[i];
    } else {
      newsArticle += '<h2>' + sections[i];
    }
  }
  
  // Clean up trailing incomplete HTML
  newsArticle = newsArticle.replace(/<h2[^>]*>[^<]*$/, '');
  
  // Add news end box
  if (!newsArticle.includes('More ' + league + ' Coverage')) {
    newsArticle += newsEndBox;
  }
  
  return newsArticle;
}

async function main() { 
  console.log('🔄 Regenerating newsContent for match previews...\n');
  
  const posts = await prisma.blogPost.findMany({
    where: { 
      postType: 'MATCH_PREVIEW'
    },
    select: { 
      id: true, 
      slug: true, 
      content: true, 
      newsContent: true,
      league: true 
    }
  });
  
  console.log(`Found ${posts.length} match previews\n`);
  
  let updated = 0;
  for (const post of posts) {
    if (!post.content) continue;
    
    const oldLen = post.newsContent?.length || 0;
    const newNewsContent = transformToNewsContent(post.content, post.league || 'Sports');
    const newLen = newNewsContent.length;
    
    // Only update if longer (any increase)
    if (newLen > oldLen) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { newsContent: newNewsContent }
      });
      
      const h2Count = (newNewsContent.match(/<h2/gi) || []).length;
      console.log(`✅ ${post.slug}`);
      console.log(`   ${oldLen} → ${newLen} chars (+${((newLen/oldLen - 1) * 100).toFixed(0)}%), ${h2Count} H2s`);
      updated++;
    }
  }
  
  console.log(`\n✅ Updated ${updated} posts`);
  await prisma.$disconnect();
}

main().catch(console.error);
