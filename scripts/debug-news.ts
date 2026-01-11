import { prisma } from '../src/lib/prisma';

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(s: string): number {
  return stripHtml(s).split(' ').filter(w => w.length > 0).length;
}

async function main() {
  const p = await prisma.blogPost.findFirst({
    where: { slug: 'steelers-vs-texans-preview-prediction-2026' },
    select: { content: true, newsContent: true }
  });
  if (!p) return;
  
  const blogWords = countWords(p.content || '');
  const newsWords = countWords(p.newsContent || '');
  
  console.log('Steelers vs Texans:');
  console.log(`  Blog: ${blogWords} words`);
  console.log(`  News: ${newsWords} words (${Math.round(newsWords/blogWords*100)}% of blog)`);
  
  // Check average across all match previews
  const all = await prisma.blogPost.findMany({
    where: { postType: 'MATCH_PREVIEW' },
    select: { newsContent: true },
    take: 50
  });
  
  const wordCounts = all.map(x => countWords(x.newsContent || '')).filter(w => w > 0);
  const avg = Math.round(wordCounts.reduce((a,b) => a+b, 0) / wordCounts.length);
  const min = Math.min(...wordCounts);
  const max = Math.max(...wordCounts);
  
  console.log('');
  console.log('Across 50 match previews:');
  console.log(`  Average: ${avg} words`);
  console.log(`  Min: ${min} words`);
  console.log(`  Max: ${max} words`);
  
  await prisma.$disconnect();
}

main();
