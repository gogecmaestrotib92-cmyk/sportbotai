import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const content = fs.readFileSync('./content/BULK_KEYWORDS.md', 'utf-8');
  
  // Extract keywords (lines that are actual keywords)
  const keywords = content
    .split('\n')
    .map(l => l.trim().toLowerCase())
    .filter(l => {
      if (l.length < 3) return false;
      if (l.startsWith('#')) return false;
      if (l.startsWith('-')) return false;
      if (l.startsWith('`')) return false;
      if (l.startsWith('*')) return false;
      if (l.includes('keywords')) return false;
      if (l.includes('categories')) return false;
      if (l.includes('evergreen')) return false;
      if (l.includes('copy/paste')) return false;
      if (l.includes('ready for')) return false;
      if (l.includes('total')) return false;
      return true;
    });

  console.log('Found', keywords.length, 'keywords');
  
  // Get existing keywords
  const existing = await prisma.blogKeyword.findMany({
    select: { keyword: true }
  });
  const existingSet = new Set(existing.map(e => e.keyword));
  
  // Filter new keywords
  const newKeywords = keywords.filter(k => !existingSet.has(k));
  console.log('New keywords to add:', newKeywords.length);
  console.log('Already existed:', keywords.length - newKeywords.length);
  
  // Batch insert
  if (newKeywords.length > 0) {
    await prisma.blogKeyword.createMany({
      data: newKeywords.map(keyword => ({ keyword, status: 'PENDING' })),
      skipDuplicates: true,
    });
  }
  
  const total = await prisma.blogKeyword.count();
  console.log('Total keywords in queue:', total);
}

main().catch(console.error).finally(() => prisma.$disconnect());
