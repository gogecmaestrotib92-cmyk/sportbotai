import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Strip betting/promotional content from blog content for Google News
 */
function stripPromotionalContent(content: string): string {
  let result = content;
  
  // Remove the entire "SportBot AI Prediction" section (heading + following prediction box)
  result = result.replace(/<h2[^>]*>\s*SportBot AI Prediction\s*<\/h2>/gi, '');
  
  // Remove prediction boxes - specifically the ones with "🎯" emoji and prediction content
  result = result.replace(
    /<div[^>]*style="[^"]*#10b981[^"]*"[^>]*>\s*<div[^>]*>\s*<span[^>]*>🎯<\/span>[\s\S]*?<\/div>\s*<\/div>/gi,
    ''
  );
  
  // Remove CTA boxes with class="cta-box" where link is at the end: <div class="cta-box">...<a>...</a></div>
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<a[^>]*>[^<]*<\/a>\s*<\/div>/gi,
    ''
  );
  
  // Remove CTA boxes with class="cta-box" where link is inside p: <div class="cta-box">...<a>...</a>...</p></div>
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<\/p>\s*<\/div>/gi,
    ''
  );
  
  // Remove promotional phrases that appear inline
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
  
  // Remove probability percentages shown in prediction boxes like "55%", "Win: 55%"
  result = result.replace(/\b(win|probability|chance):\s*\d+%/gi, '');
  result = result.replace(/\b\d+(\.\d+)?%\s*(probability|chance|win)/gi, '');
  
  // Replace betting language with neutral terms
  result = result.replace(/best bet|betting value|value bet/gi, 'key factor');
  result = result.replace(/\bstake\b|\bwager\b/gi, 'consideration');
  result = result.replace(/gamblers?|bettors?/gi, 'fans');
  result = result.replace(/betting tips|betting preview/gi, 'match analysis');
  
  // Clean up empty paragraphs that may have just had promotional text
  result = result.replace(/<p[^>]*>\s*<\/p>/gi, '');
  
  // Clean up empty divs
  for (let i = 0; i < 3; i++) {
    result = result.replace(/<div[^>]*>\s*<\/div>/gi, '');
  }
  
  return result;
}

/**
 * Add a news-friendly end box that links back to the site
 */
function addNewsEndBox(content: string, league: string): string {
  if (content.includes('More Coverage') || content.includes('View All Matches')) {
    return content;
  }
  
  const newsEndBox = `
<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center; border: 1px solid #334155;">
  <div style="font-size: 32px; margin-bottom: 12px;">⚽</div>
  <h3 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
    More ${league || 'Sports'} Coverage
  </h3>
  <p style="color: #94a3b8; font-size: 15px; margin: 0 0 20px 0; max-width: 400px; margin-left: auto; margin-right: auto;">
    Follow all ${league || 'sports'} matches with live updates and expert analysis.
  </p>
  <a href="/matches" style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
    View All Matches →
  </a>
</div>`;
  
  return content + newsEndBox;
}

async function main() {
  // Regenerate all posts with the fixed stripping function
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true, content: true, league: true }
  });
  
  console.log('Regenerating newsContent for all', posts.length, 'posts...\n');
  
  let count = 0;
  for (const post of posts) {
    if (!post.content) continue;
    
    let newsContent = stripPromotionalContent(post.content);
    newsContent = addNewsEndBox(newsContent, post.league || 'Sports');
    
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { newsContent }
    });
    
    count++;
    if (count % 20 === 0) {
      console.log('Processed', count, 'posts...');
    }
  }
  
  console.log('\n✓ Regenerated newsContent for', count, 'posts');
  await prisma.$disconnect();
}

main().catch(console.error);
