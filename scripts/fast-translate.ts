/**
 * ULTRA FAST parallel translation - ALL chunks in parallel
 * 
 * Usage: npx tsx scripts/fast-translate.ts [--limit=N] [--concurrency=N]
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a Serbian translator for sports content. Use Latin script (NOT Cyrillic). Keep HTML tags, team/player names, URLs unchanged. Return ONLY translated text.`;

// Semaphore for concurrency control
class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;
  constructor(private max: number) {}
  
  async acquire() {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    await new Promise<void>(resolve => this.queue.push(resolve));
    this.running++;
  }
  
  release() {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

interface TranslationTask {
  postId: string;
  field: string;
  text: string;
}

interface TranslationResult {
  postId: string;
  field: string;
  result: string;
}

async function translateText(text: string, sem: Semaphore): Promise<string> {
  if (!text?.trim()) return '';
  
  await sem.acquire();
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 16000,
    });
    return response.choices[0]?.message?.content || text;
  } finally {
    sem.release();
  }
}

function generateSerbianSlug(title: string, originalSlug: string): string {
  // Extract team names and date from original slug to keep them
  // E.g. "manchester-united-vs-liverpool-prediction-2025" -> "manchester-united-vs-liverpool-prognoza-2025"
  
  // Common slug translations
  const replacements: [RegExp, string][] = [
    [/prediction/g, 'prognoza'],
    [/preview/g, 'najava'],
    [/analysis/g, 'analiza'],
    [/guide/g, 'vodic'],
    [/tips/g, 'saveti'],
    [/betting/g, 'kladjenje'],
    [/odds/g, 'kvote'],
    [/match/g, 'utakmica'],
  ];
  
  let slugSr = originalSlug;
  for (const [pattern, replacement] of replacements) {
    slugSr = slugSr.replace(pattern, replacement);
  }
  
  return slugSr;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 20;
  const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1]) : 30;

  console.log('🚀 ULTRA FAST TRANSLATION - ALL CHUNKS PARALLEL');
  console.log(`   Posts: ${limit} | Concurrency: ${concurrency} API calls\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set!');
    process.exit(1);
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      translatedAt: null,
    },
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
    },
  });

  console.log(`📝 Found ${posts.length} posts to translate`);

  if (posts.length === 0) {
    console.log('✅ All posts already translated!');
    return;
  }

  // Collect ALL translation tasks
  const tasks: TranslationTask[] = [];
  
  for (const post of posts) {
    tasks.push({ postId: post.id, field: 'titleSr', text: post.title });
    tasks.push({ postId: post.id, field: 'excerptSr', text: post.excerpt });
    tasks.push({ postId: post.id, field: 'contentSr', text: post.content });
    if (post.metaTitle) tasks.push({ postId: post.id, field: 'metaTitleSr', text: post.metaTitle });
    if (post.metaDescription) tasks.push({ postId: post.id, field: 'metaDescriptionSr', text: post.metaDescription });
    if (post.newsTitle) tasks.push({ postId: post.id, field: 'newsTitleSr', text: post.newsTitle });
    if (post.newsContent) tasks.push({ postId: post.id, field: 'newsContentSr', text: post.newsContent });
  }

  console.log(`📦 Total chunks to translate: ${tasks.length}`);
  console.log(`   Running ${concurrency} API calls in parallel...\n`);

  const startTime = Date.now();
  const sem = new Semaphore(concurrency);
  
  // Run ALL translations in parallel (semaphore controls concurrency)
  const results = await Promise.allSettled(
    tasks.map(async (task): Promise<TranslationResult> => {
      const result = await translateText(task.text, sem);
      process.stdout.write('.');
      return { postId: task.postId, field: task.field, result };
    })
  );

  console.log('\n\n📝 Saving to database...');

  // Group results by postId
  const resultsByPost = new Map<string, Record<string, string>>();
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { postId, field, result: text } = result.value;
      if (!resultsByPost.has(postId)) {
        resultsByPost.set(postId, {});
      }
      resultsByPost.get(postId)![field] = text;
      successCount++;
    } else {
      failCount++;
    }
  }

  // Save all posts
  const postMap = new Map(posts.map(p => [p.id, p]));
  
  for (const [postId, translations] of resultsByPost) {
    const post = postMap.get(postId)!;
    const slugSr = generateSerbianSlug(translations.titleSr || post.title, post.slug);
    
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        ...translations,
        slugSr,
        translatedAt: new Date(),
      },
    });
    console.log(`   ✅ ${post.slug} -> ${slugSr}`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n========================================`);
  console.log(`✅ Done in ${totalTime}s`);
  console.log(`   Chunks: ${successCount} ok, ${failCount} failed`);
  console.log(`   Posts: ${resultsByPost.size} translated`);
  console.log(`========================================\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
