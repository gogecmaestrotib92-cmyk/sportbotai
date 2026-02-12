import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';

// Revalidate every hour
export const revalidate = 3600;

const pageTitle = 'Featured Tools | Sports Analytics Reviews';
const pageDescription = 'Independently reviewed sports analytics tools and platforms. Each has been tested for accuracy, usability, and value by our team.';
const pageUrl = `${SITE_CONFIG.url}/partners`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: 'SportBot AI',
    type: 'website',
    locale: 'en_US',
    images: [{
      url: `${SITE_CONFIG.url}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'SportBot AI Partners',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
};

// Get tool reviews from blog posts
async function getToolReviews() {
  try {
    const reviews = await prisma.blogPost.findMany({
      where: {
        slug: { endsWith: '-review' },
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        views: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return reviews.map(review => ({
      ...review,
      toolName: review.title.replace(' Review', '').replace(' review', ''),
      reviewUrl: `/blog/${review.slug}`,
    }));
  } catch (error) {
    console.error('Error fetching tool reviews:', error);
    return [];
  }
}

export default async function PartnersPage() {
  const reviews = await getToolReviews();

  // JSON-LD structured data - Using simpler Review schema to avoid SoftwareApplication validation errors
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Featured Sports Analytics Tools',
      numberOfItems: reviews.length,
      itemListElement: reviews.map((review, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_CONFIG.url}${review.reviewUrl}`,
        name: review.toolName,
      })),
    },
  };


  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <section className="pt-16 pb-12 px-4 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-emerald-400 text-sm font-medium">Independently Reviewed</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Featured <span className="text-gradient-accent">Tools</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Sports analytics platforms and tools we've reviewed.
            Each has been tested for accuracy, usability, and value.
          </p>
        </div>
      </section>

      {/* Featured Tools Grid */}
      <section className="pb-16 px-4 relative">
        <div className="max-w-6xl mx-auto">
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={review.reviewUrl}
                  className="group relative rounded-2xl bg-gradient-to-b from-zinc-800/50 to-zinc-900/80 border border-zinc-700/50 hover:border-emerald-500/50 transition-all duration-500 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10"
                >
                  {/* Featured Image - Full Width Banner */}
                  <div className="aspect-[16/9] relative bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                    {review.featuredImage ? (
                      <Image
                        src={review.featuredImage}
                        alt={review.toolName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl opacity-50">🔧</span>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                    {/* Verified badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-500/30">
                      <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Reviewed
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {review.toolName}
                    </h2>

                    {review.excerpt && (
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                        {review.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium group-hover:text-emerald-300 transition-colors">
                        <span>Read Review</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{review.views?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🔧</p>
              <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
              <p className="text-zinc-500 max-w-md mx-auto">
                We're reviewing sports analytics tools and will feature them here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Submit Your Tool */}
      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-transparent border border-emerald-500/20 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Have a Sports Analytics Tool?</h2>
            <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
              We review and feature quality sports analytics platforms.
              Get exposure to our audience and a featured badge for your site.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              Submit for Review
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Badge Info */}
      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span>🏅</span> Featured Badge Program
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              Tools we review can display our "Featured on SportBot AI" badge on their website.
              In exchange, we provide dofollow backlinks to help their SEO.
            </p>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/favicon.svg"
                  alt="SportBot AI"
                  width={24}
                  height={24}
                  className="rounded w-6 h-6"
                />
                <span className="text-white text-sm font-medium">Featured on SportBot AI</span>
              </div>
              <span className="text-xs text-zinc-600">Sample badge</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Why Get Featured?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-semibold text-white mb-2">Dofollow Backlink</h3>
              <p className="text-sm text-zinc-500">Quality SEO link from our growing domain authority.</p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
              <div className="text-3xl mb-3">👀</div>
              <h3 className="font-semibold text-white mb-2">Targeted Exposure</h3>
              <p className="text-sm text-zinc-500">Reach sports analytics enthusiasts actively looking for tools.</p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="font-semibold text-white mb-2">Third-Party Validation</h3>
              <p className="text-sm text-zinc-500">Honest review adds credibility to your platform.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
