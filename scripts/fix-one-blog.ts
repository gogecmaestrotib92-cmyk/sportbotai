// Quick fix for a specific blog
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    const { generateFeaturedImage } = await import('../src/lib/blog/image-generator');

    // Find the stanley cup blog
    const blog = await prisma.blogPost.findFirst({
        where: { slug: { contains: 'stanley-cup-betting' } },
        select: { id: true, title: true, focusKeyword: true, category: true }
    });

    if (!blog) {
        console.log('Blog not found');
        return;
    }

    console.log('Regenerating image for:', blog.title);

    const result = await generateFeaturedImage(
        blog.title,
        blog.focusKeyword || 'stanley cup betting strategy',
        blog.category || 'Sports Analysis'
    );

    await prisma.blogPost.update({
        where: { id: blog.id },
        data: { featuredImage: result.url }
    });

    console.log('✅ Done:', result.url);
    await prisma.$disconnect();
}

fix();
