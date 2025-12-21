// Main blog generation pipeline
// Orchestrates the full flow: Research → Outline → Content → Images → Save

import { prisma } from '@/lib/prisma';
import { researchTopic, getRelatedKeywords } from './research';
import { generateOutline, generateContent, estimateGenerationCost } from './content-generator';
import { generateFeaturedImage, generateContentImage, getPlaceholderImage } from './image-generator';
import { BlogGenerationConfig, BlogGenerationResult, SEED_KEYWORDS } from './types';

export async function generateBlogPost(config: BlogGenerationConfig): Promise<BlogGenerationResult> {
  const startTime = Date.now();
  let totalCost = 0;

  try {
    console.log(`[Blog Generator] Starting generation for: "${config.keyword}"`);

    // Step 1: Check if keyword exists, create if not
    let keywordRecord = await prisma.blogKeyword.findUnique({
      where: { keyword: config.keyword },
    });

    if (!keywordRecord) {
      keywordRecord = await prisma.blogKeyword.create({
        data: {
          keyword: config.keyword,
          status: 'ACTIVE',
        },
      });
    }

    // Step 2: Check for recent posts with this keyword (avoid duplicates)
    // Allow regeneration after 7 days (aligned with getNextKeyword)
    if (!config.forceRegenerate) {
      const recentPost = await prisma.blogPost.findFirst({
        where: {
          keywordId: keywordRecord.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days (was 30)
          },
        },
      });

      if (recentPost) {
        return {
          success: false,
          error: `A post for "${config.keyword}" was generated recently. Use forceRegenerate to override.`,
        };
      }
    }

    // Step 3: Research the topic using Perplexity
    console.log('[Blog Generator] Step 1/5: Researching topic...');
    const research = await researchTopic(config.keyword);
    totalCost += 0.001; // Perplexity cost estimate

    // Step 4: Generate outline
    console.log('[Blog Generator] Step 2/5: Creating outline...');
    const outline = await generateOutline(config.keyword, research);
    totalCost += 0.01; // GPT-4o-mini cost estimate

    // Step 5: Generate full content
    console.log('[Blog Generator] Step 3/6: Writing content...');
    const content = await generateContent(config.keyword, outline, research);
    totalCost += 0.05; // GPT-4o-mini cost estimate

    // Step 6: Generate featured image
    console.log('[Blog Generator] Step 4/6: Generating featured image...');
    let featuredImage: string;
    let imageAlt: string;
    
    try {
      const imageResult = await generateFeaturedImage(
        content.title,
        config.keyword,
        content.category
      );
      featuredImage = imageResult.url;
      imageAlt = imageResult.alt;
      totalCost += 0.005; // GPT-4.1 nano + Flux Schnell cost estimate
    } catch (imageError) {
      console.warn('[Blog Generator] Image generation failed, using placeholder:', imageError);
      featuredImage = getPlaceholderImage(config.keyword);
      imageAlt = `${content.title} - SportBot AI`;
    }

    // Step 7: Process inline images in content
    console.log('[Blog Generator] Step 5/6: Processing inline images...');
    let processedContent = content.content;
    const imageMatches = Array.from(content.content.matchAll(/\[IMAGE:([^\]]+)\]/g));
    let imageIndex = 0;
    
    for (const match of imageMatches) {
      const imageDescription = match[1];
      try {
        const inlineImage = await generateContentImage(
          imageDescription,
          config.keyword,
          content.category,
          imageIndex
        );
        // Replace placeholder with actual image
        processedContent = processedContent.replace(
          match[0],
          inlineImage.url
        );
        totalCost += 0.004;
        imageIndex++;
        console.log(`[Blog Generator] Generated inline image ${imageIndex}: ${imageDescription.substring(0, 30)}...`);
      } catch (inlineError) {
        console.warn(`[Blog Generator] Inline image ${imageIndex + 1} failed, using placeholder`);
        // Use a themed placeholder
        processedContent = processedContent.replace(
          match[0],
          `https://placehold.co/1200x630/1e40af/ffffff?text=${encodeURIComponent(imageDescription.substring(0, 30))}`
        );
        imageIndex++;
      }
      
      // Limit to 3 inline images to control costs
      if (imageIndex >= 3) break;
    }

    // Step 8: Save to database
    console.log('[Blog Generator] Step 6/6: Saving to database...');
    
    // Ensure unique slug
    let slug = content.slug;
    const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: content.title,
        slug: slug,
        excerpt: content.excerpt,
        content: processedContent,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        focusKeyword: content.focusKeyword,
        featuredImage: featuredImage,
        imageAlt: imageAlt,
        category: content.category,
        tags: content.tags,
        status: 'PUBLISHED', // Auto-publish
        publishedAt: new Date(),
        keywordId: keywordRecord.id,
        aiModel: 'gpt-4.1-nano + gpt-4o-mini + perplexity-sonar + flux-schnell',
        generationCost: totalCost,
      },
    });

    // Step 9: Update keyword record
    await prisma.blogKeyword.update({
      where: { id: keywordRecord.id },
      data: {
        lastGeneratedAt: new Date(),
        generationCount: { increment: 1 },
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[Blog Generator] ✅ Complete! Post ID: ${post.id}, Duration: ${duration}ms, Cost: $${totalCost.toFixed(4)}`);

    return {
      success: true,
      postId: post.id,
      slug: post.slug,
      cost: totalCost,
      duration: duration,
    };

  } catch (error) {
    console.error('[Blog Generator] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cost: totalCost,
      duration: Date.now() - startTime,
    };
  }
}

// Get next keyword to generate (prioritize PENDING, then round-robin ACTIVE)
export async function getNextKeyword(): Promise<string | null> {
  // FIRST: Try to get a PENDING keyword (never used - from bulk import)
  const pendingKeyword = await prisma.blogKeyword.findFirst({
    where: {
      status: 'PENDING',
    },
    orderBy: { createdAt: 'asc' }, // Oldest first (FIFO)
  });

  if (pendingKeyword) {
    // Activate it so it enters the rotation
    await prisma.blogKeyword.update({
      where: { id: pendingKeyword.id },
      data: { status: 'ACTIVE' },
    });
    console.log(`[Blog Generator] Using PENDING keyword: "${pendingKeyword.keyword}"`);
    return pendingKeyword.keyword;
  }

  // SECOND: Try to get an ACTIVE keyword that hasn't been used recently
  const keyword = await prisma.blogKeyword.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [
        { lastGeneratedAt: null },
        {
          lastGeneratedAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      ],
    },
    orderBy: [
      { lastGeneratedAt: 'asc' }, // Oldest first
      { generationCount: 'asc' }, // Least used first
    ],
  });

  if (keyword) {
    return keyword.keyword;
  }

  // THIRD: If all keywords are recent, pick the oldest one
  const oldestKeyword = await prisma.blogKeyword.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { lastGeneratedAt: 'asc' },
  });

  return oldestKeyword?.keyword || null;
}

// Seed the database with initial keywords
export async function seedKeywords(): Promise<number> {
  let added = 0;

  for (const keyword of SEED_KEYWORDS) {
    const existing = await prisma.blogKeyword.findUnique({
      where: { keyword },
    });

    if (!existing) {
      await prisma.blogKeyword.create({
        data: {
          keyword,
          status: 'ACTIVE',
        },
      });
      added++;
    }
  }

  console.log(`[Blog Generator] Seeded ${added} new keywords`);
  return added;
}

// Add new keywords from related topics
export async function expandKeywords(baseKeyword: string): Promise<string[]> {
  const existingKeywords = await prisma.blogKeyword.findMany({
    select: { keyword: true },
  });

  const existingList = existingKeywords.map((k: { keyword: string }) => k.keyword);
  const newKeywords = await getRelatedKeywords(baseKeyword, existingList);

  const added: string[] = [];
  for (const keyword of newKeywords) {
    if (!existingList.includes(keyword)) {
      await prisma.blogKeyword.create({
        data: {
          keyword,
          status: 'PENDING',
        },
      });
      added.push(keyword);
    }
  }

  return added;
}

// Generate multiple posts (for batch processing)
export async function generateBatch(count: number = 1): Promise<BlogGenerationResult[]> {
  const results: BlogGenerationResult[] = [];

  for (let i = 0; i < count; i++) {
    const keyword = await getNextKeyword();
    
    if (!keyword) {
      console.log('[Blog Generator] No more keywords available');
      break;
    }

    const result = await generateBlogPost({ keyword });
    results.push(result);

    // Small delay between generations to avoid rate limits
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}
