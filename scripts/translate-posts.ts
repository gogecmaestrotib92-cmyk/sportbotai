/**
 * Script to translate existing blog posts to Serbian
 * 
 * Usage: npx ts-node scripts/translate-posts.ts [--limit=N] [--type=news|blog]
 * 
 * This translates posts that don't have Serbian translations yet.
 */

import { PrismaClient } from '@prisma/client';
import { translateBlogPost, estimateTranslationCost } from '../src/lib/translate';

const prisma = new PrismaClient();

async function translatePosts() {
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

  // Estimate total cost
  let totalCost = 0;
  for (const post of posts) {
    const textLength = (post.title?.length || 0) + 
                       (post.excerpt?.length || 0) + 
                       (post.content?.length || 0) +
                       (post.metaTitle?.length || 0) +
                       (post.metaDescription?.length || 0) +
                       (post.newsTitle?.length || 0) +
                       (post.newsContent?.length || 0);
    totalCost += estimateTranslationCost(new Array(textLength).fill('a').join(''));
  }
  console.log(`💰 Estimated cost: $${totalCost.toFixed(4)}\n`);

  if (dryRun) {
    console.log('🏃 Dry run - not translating. Posts that would be translated:');
    for (const post of posts) {
      console.log(`   - ${post.slug}: "${post.title.substring(0, 50)}..."`);
    }
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const post of posts) {
    console.log(`📖 Translating: ${post.slug}`);
    console.log(`   Title: "${post.title.substring(0, 60)}..."`);
    
    try {
      const startTime = Date.now();
      
      const translations = await translateBlogPost({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        newsTitle: post.newsTitle,
        newsContent: post.newsContent,
        postType: post.postType,
      });

      // Update the post with translations
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

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✅ Translated in ${duration}s`);
      console.log(`   Serbian title: "${translations.titleSr.substring(0, 60)}..."`);
      console.log('');
      
      successCount++;

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Error translating ${post.slug}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Translation Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${posts.length}`);
}

translatePosts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
