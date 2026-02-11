const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting search...');
  
  const posts = await prisma.blogPost.findMany({
    where: {
      slug: {
        in: ['tools/action-network-review', 'tools/vitibet-review']
      }
    },
    select: {
      slug: true,
      content: true
    }
  });
  
  console.log(`Found ${posts.length} posts`);
  
  for (const post of posts) {
    console.log('\n=== ' + post.slug + ' ===');
    
    // Find 'here' links with more context
    const matches = [...post.content.matchAll(/href="([^"]+)"[^>]*>here<\/a>/gi)];
    console.log('Found ' + matches.length + ' instances of "here" links');
    
    matches.forEach((m, i) => {
      console.log(`\n--- Instance ${i+1} ---`);
      console.log('Link to:', m[1]);
      console.log('Full match:', m[0]);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
