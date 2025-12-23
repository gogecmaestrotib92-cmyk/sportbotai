import { prisma } from '../src/lib/prisma';

async function main() {
  const post = await prisma.blogPost.findFirst({
    where: { 
      OR: [
        { id: 'cmjipog49002oig8j72ndlhqf' },
        { slug: { contains: 'thunder-bulls' } },
        { slug: { contains: 'oklahoma-city-thunder-vs-chicago-bulls' } },
      ]
    },
    orderBy: { createdAt: 'desc' },
    select: { 
      id: true,
      title: true, 
      slug: true, 
      content: true,
      createdAt: true,
    }
  });

  if (!post) {
    console.log('Post not found');
    return;
  }

  console.log('=== POST FOUND ===');
  console.log('ID:', post.id);
  console.log('Title:', post.title);
  console.log('Slug:', post.slug);
  console.log('Created:', post.createdAt);
  console.log('');
  
  // Find key players section
  const keyPlayersMatch = post.content?.match(/Key Players to Watch([\s\S]*?)(?=##|<h2|$)/i);
  if (keyPlayersMatch) {
    console.log('📋 KEY PLAYERS SECTION:');
    console.log(keyPlayersMatch[1].substring(0, 1000));
  } else {
    console.log('No "Key Players to Watch" section found');
  }
  
  console.log('\n=== PLAYER NAME MENTIONS ===');
  // Check for specific player names
  const playerPatterns = [
    /Shai Gilgeous-Alexander/gi,
    /Jalen Williams/gi,
    /Chet Holmgren/gi,
    /Lu Dort/gi,
    /Coby White/gi,
    /Zach LaVine/gi,
    /Nikola Vucevic/gi,
    /Josh Giddey/gi, // Should NOT appear for OKC
    /Luka Dončić/gi, // Random check
  ];
  
  for (const pattern of playerPatterns) {
    const matches = post.content?.match(pattern);
    if (matches) {
      console.log(`  ✓ ${pattern.source}: ${matches.length} mentions`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
