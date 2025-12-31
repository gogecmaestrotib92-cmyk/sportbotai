/**
 * Standalone script to translate existing blog posts to Serbian
 * 
 * Usage: npx ts-node scripts/run-translations.ts [--limit=N] [--type=news|blog] [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranslationResult {
  titleSr: string;
  excerptSr: string;
  contentSr: string;
  metaTitleSr?: string;
  metaDescriptionSr?: string;
  newsTitleSr?: string;
  newsContentSr?: string;
}

async function translateToSerbian(text: string, context: string = 'general'): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }

  const systemPrompt = `You are a professional Serbian translator specializing in sports content.

CRITICAL RULES:
1. Translate to Serbian using Latin script (NOT Cyrillic)
2. Keep ALL HTML tags exactly as they are (<h2>, <p>, <strong>, <a href="...">, etc.)
3. Keep team names, player names, and league names in English (e.g., "Manchester United", "Lionel Messi", "Premier League")
4. Keep technical sports terms that are commonly used in English
5. Preserve all URLs, links, and attributes unchanged
6. Maintain the exact same formatting and structure
7. Do NOT add or remove any HTML tags
8. Do NOT translate content inside href attributes or other HTML attributes

Example:
Input: <h2>Match Preview</h2><p>Manchester United faces Liverpool in a crucial Premier League clash.</p>
Output: <h2>Najava Utakmice</h2><p>Manchester United se suočava sa Liverpool u ključnom Premier League okršaju.</p>`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Translate the following ${context} to Serbian:\n\n${text}` },
    ],
    temperature: 0.3,
    max_tokens: 16000,
  });

  return response.choices[0]?.message?.content || text;
}

async function translateBlogPost(post: {
  title: string;
  excerpt: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  newsTitle?: string | null;
  newsContent?: string | null;
}): Promise<TranslationResult> {
  console.log(`   Translating title...`);
  const titleSr = await translateToSerbian(post.title, 'title');
  
  console.log(`   Translating excerpt...`);
  const excerptSr = await translateToSerbian(post.excerpt, 'excerpt/summary');
  
  console.log(`   Translating main content...`);
  const contentSr = await translateToSerbian(post.content, 'article content');

  const result: TranslationResult = {
    titleSr,
    excerptSr,
    contentSr,
  };

  if (post.metaTitle) {
    console.log(`   Translating meta title...`);
    result.metaTitleSr = await translateToSerbian(post.metaTitle, 'SEO meta title');
  }

  if (post.metaDescription) {
    console.log(`   Translating meta description...`);
    result.metaDescriptionSr = await translateToSerbian(post.metaDescription, 'SEO meta description');
  }

  if (post.newsTitle) {
    console.log(`   Translating news title...`);
    result.newsTitleSr = await translateToSerbian(post.newsTitle, 'news headline');
  }

  if (post.newsContent) {
    console.log(`   Translating news content...`);
    result.newsContentSr = await translateToSerbian(post.newsContent, 'news article content');
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const typeArg = args.find(a => a.startsWith('--type='));
  const dryRun = args.includes('--dry-run');
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10;
  const type = typeArg?.split('=')[1] as 'news' | 'blog' | undefined;

  console.log('🌍 Starting Serbian translation job...');
  console.log(`   Limit: ${limit} posts`);
  console.log(`   Type: ${type || 'all'}`);
  console.log(`   Dry run: ${dryRun}`);
  console.log('');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set!');
    process.exit(1);
  }

  // Find posts without Serbian translations
  const whereClause: Record<string, unknown> = {
    status: 'PUBLISHED',
    translatedAt: null, // Not yet translated
  };

  if (type === 'news') {
    whereClause.postType = { in: ['NEWS', 'MATCH_PREVIEW'] };
  } else if (type === 'blog') {
    whereClause.postType = { in: ['GENERAL', 'GUIDE', 'ANALYSIS'] };
  }

  const posts = await prisma.blogPost.findMany({
    where: whereClause,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      newsTitle: true,
      newsContent: true,
      postType: true,
    },
  });

  console.log(`📝 Found ${posts.length} posts to translate\n`);

  if (posts.length === 0) {
    console.log('✅ All posts are already translated!');
    return;
  }

  // Show posts to be translated
  for (const post of posts) {
    console.log(`   - [${post.postType}] ${post.title.substring(0, 60)}...`);
  }
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN - No changes will be made');
    
    // Estimate cost
    let totalChars = 0;
    for (const post of posts) {
      totalChars += (post.title?.length || 0);
      totalChars += (post.excerpt?.length || 0);
      totalChars += (post.content?.length || 0);
      totalChars += (post.metaTitle?.length || 0);
      totalChars += (post.metaDescription?.length || 0);
      totalChars += (post.newsTitle?.length || 0);
      totalChars += (post.newsContent?.length || 0);
    }
    
    const estimatedTokens = Math.ceil(totalChars / 4);
    const estimatedCost = (estimatedTokens / 1000000) * 0.15 + (estimatedTokens / 1000000) * 0.6;
    
    console.log(`\n📊 Estimated stats:`);
    console.log(`   Total characters: ${totalChars.toLocaleString()}`);
    console.log(`   Estimated tokens: ~${estimatedTokens.toLocaleString()}`);
    console.log(`   Estimated cost: ~$${estimatedCost.toFixed(4)}`);
    return;
  }

  // Translate posts
  let translated = 0;
  let failed = 0;

  for (const post of posts) {
    console.log(`\n🔄 [${translated + 1}/${posts.length}] Translating: ${post.title.substring(0, 50)}...`);
    
    try {
      const translations = await translateBlogPost({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        newsTitle: post.newsTitle,
        newsContent: post.newsContent,
      });

      // Update post with translations
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          titleSr: translations.titleSr,
          excerptSr: translations.excerptSr,
          contentSr: translations.contentSr,
          metaTitleSr: translations.metaTitleSr,
          metaDescriptionSr: translations.metaDescriptionSr,
          newsTitleSr: translations.newsTitleSr,
          newsContentSr: translations.newsContentSr,
          translatedAt: new Date(),
        },
      });

      console.log(`   ✅ Successfully translated!`);
      translated++;
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Failed to translate: ${error}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Translation complete!`);
  console.log(`   Translated: ${translated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`========================================\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
