/**
 * Fix non-descriptive "here" anchor text in blog posts
 * 
 * Replaces: href="/blog/xxx-review">here</a>
 * With: href="/blog/xxx-review">read our XXX review</a>
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Map of URLs to descriptive anchor text
const linkReplacements = [
  // vitibet-review post
  {
    slug: 'tools/vitibet-review',
    replacements: [
      {
        from: 'href="/blog/tools/betmines-review">here</a>',
        to: 'href="/blog/tools/betmines-review">read our BetMines review</a>'
      },
      {
        from: 'href="/blog/tools/protipster-review">here</a>',
        to: 'href="/blog/tools/protipster-review">read our ProTipster review</a>'
      },
      {
        from: 'href="/blog/tools/tipstrr-review">here</a>',
        to: 'href="/blog/tools/tipstrr-review">read our Tipstrr review</a>'
      }
    ]
  },
  // action-network-review post
  {
    slug: 'tools/action-network-review',
    replacements: [
      {
        from: 'href="/blog/metabet-review">here</a>',
        to: 'href="/blog/metabet-review">read our MetaBet review</a>'
      },
      {
        from: 'href="/blog/vault-sports-review">here</a>',
        to: 'href="/blog/vault-sports-review">read our Vault Sports review</a>'
      },
      {
        from: 'href="/blog/pick-the-odds-review">here</a>',
        to: 'href="/blog/pick-the-odds-review">read our Pick The Odds review</a>'
      }
    ]
  }
];

async function main() {
  console.log('Starting anchor text fixes...\n');

  for (const post of linkReplacements) {
    console.log(`Processing: ${post.slug}`);
    
    // Get current content
    const blogPost = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true, content: true }
    });

    if (!blogPost) {
      console.log(`  ❌ Post not found: ${post.slug}`);
      continue;
    }

    let updatedContent = blogPost.content;
    let changeCount = 0;

    for (const replacement of post.replacements) {
      if (updatedContent.includes(replacement.from)) {
        updatedContent = updatedContent.replace(replacement.from, replacement.to);
        console.log(`  ✓ Replaced: "${replacement.from.substring(0, 50)}..."`);
        changeCount++;
      } else {
        console.log(`  ⚠ Not found: "${replacement.from.substring(0, 50)}..."`);
      }
    }

    if (changeCount > 0) {
      await prisma.blogPost.update({
        where: { id: blogPost.id },
        data: { content: updatedContent }
      });
      console.log(`  ✅ Updated ${changeCount} links in ${post.slug}\n`);
    } else {
      console.log(`  ⚠ No changes needed for ${post.slug}\n`);
    }
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
