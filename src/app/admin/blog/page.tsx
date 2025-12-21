import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import BlogAdminPanel from './BlogAdminPanel';

// Admin access list
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
  'stefan@automateed.com',
];

export default async function BlogAdminPage() {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user is admin
  if (!ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/');
  }

  // Fetch all blog posts
  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      views: true,
      createdAt: true,
      publishedAt: true,
      featuredImage: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get stats
  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'PUBLISHED').length,
    draft: posts.filter((p) => p.status === 'DRAFT').length,
    scheduled: posts.filter((p) => p.status === 'SCHEDULED').length,
    totalViews: posts.reduce((sum, p) => sum + p.views, 0),
  };

  return <BlogAdminPanel posts={posts} stats={stats} />;
}
