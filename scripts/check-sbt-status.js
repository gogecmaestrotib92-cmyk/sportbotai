require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const all = await p.toolReview.findMany({
    where: { sourceUrl: { contains: 'sportsbettingtools' } },
    select: { toolName: true, contactEmail: true, contentWords: true, blogPostId: true }
  });
  
  console.log('=== SPORTSBETTINGTOOLS.IO STATUS ===');
  console.log('Total:', all.length);
  console.log('With email:', all.filter(t => t.contactEmail).length);
  console.log('With content (>100 words):', all.filter(t => t.contentWords > 100).length);
  console.log('With blog post:', all.filter(t => t.blogPostId).length);
  console.log('Ready for review (email+content, no blog):', all.filter(t => t.contentWords > 100 && !t.blogPostId && t.contactEmail).length);
  
  const needEmail = all.filter(t => t.contentWords > 100 && !t.blogPostId && !t.contactEmail);
  console.log('\n--- Need email extraction (' + needEmail.length + ') ---');
  needEmail.slice(0, 15).forEach(t => console.log('-', t.toolName));
  
  await p.$disconnect();
}

check();
