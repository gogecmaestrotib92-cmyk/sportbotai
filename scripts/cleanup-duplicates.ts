import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  // Find tools that were sent outreach but have no blogSlug (and are not SKIP)
  const withoutSlug = await prisma.toolReview.findMany({
    where: { 
      outreachStatus: 'SENT',
      blogSlug: null,
      reviewStatus: { not: 'SKIP' }
    },
    select: { id: true, toolName: true, toolUrl: true }
  });
  
  const toDelete: typeof withoutSlug = [];
  const noReview: typeof withoutSlug = [];
  
  for (const tool of withoutSlug) {
    const domain = new URL(tool.toolUrl).hostname.replace('www.', '');
    
    // Check if duplicate exists with review
    const duplicate = await prisma.toolReview.findFirst({
      where: {
        toolUrl: { contains: domain },
        blogSlug: { not: null },
        id: { not: tool.id }
      }
    });
    
    if (duplicate) {
      toDelete.push(tool);
    } else {
      noReview.push(tool);
    }
  }
  
  console.log('=== DUPLICATES TO DELETE ===');
  toDelete.forEach(t => console.log('  -', t.toolName));
  
  console.log('\n=== NO REVIEW (sent outreach without review) ===');
  noReview.forEach(t => console.log('  -', t.toolName, '-', t.toolUrl));
  
  // Delete duplicates
  if (toDelete.length > 0) {
    const result = await prisma.toolReview.deleteMany({
      where: { id: { in: toDelete.map(t => t.id) } }
    });
    console.log('\nDeleted', result.count, 'duplicate records');
  }
  
  console.log('\nSummary:');
  console.log('  Deleted duplicates:', toDelete.length);
  console.log('  Tools that got outreach WITHOUT review:', noReview.length);
  
  await prisma.$disconnect();
}

cleanupDuplicates();
