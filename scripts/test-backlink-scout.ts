/**
 * Test Backlink Scout
 * 
 * Run with: npx tsx scripts/test-backlink-scout.ts
 * 
 * Actions:
 *   --seed      Test seed list (curated tools)
 *   --google    Test Google search (needs API keys)
 *   --discover  Find new tools (dry run by default)
 *   --live      Actually save to database
 *   --ph        Test Product Hunt scraper only
 *   --alt       Test AlternativeTo scraper only
 *   --extract   Test content extraction
 *   --email     Test email finder
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  scrapeProductHunt,
  scrapeAlternativeTo,
  scrapeBetaList,
  searchGoogle,
  getSeedTools,
  extractWebsiteContent,
  findContactEmail,
  runBacklinkScout,
  generateToolReview,
} from '../src/lib/backlink-scout';
import { sendEmail, sendToolReviewOutreach } from '../src/lib/email';
// Image generation disabled for now - uses placeholder
// import { generateFeaturedImage } from '../src/lib/blog/image-generator';

// Generate personalized outreach email
function generateOutreachEmail(toolName: string, toolUrl: string, review: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
    .cta { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <p>Hi there! 👋</p>
  
  <p>I'm Goran, founder of <a href="https://sportbotai.com">SportBot AI</a> – an AI-powered sports analytics platform.</p>
  
  <p>I've been building a <strong>Sports Betting Tools Directory</strong> to help our users discover quality tools, and I wanted to let you know that <strong>${toolName}</strong> is featured!</p>
  
  <div class="highlight">
    <strong>Your listing:</strong><br>
    <a href="https://sportbotai.com/tools">${toolName}</a> - Featured in our curated directory
  </div>
  
  <p>Here's what we wrote about ${toolName}:</p>
  <blockquote style="border-left: 3px solid #ddd; padding-left: 15px; color: #555; margin: 15px 0;">
    ${review.substring(0, 300)}...
  </blockquote>
  
  <p><strong>Quick ask:</strong> Would you consider adding SportBot AI to your resources or partners page? We'd be happy to upgrade your listing to a "Featured Tool" status with a dofollow backlink in return. 🤝</p>
  
  <p>Either way, thanks for building a great product!</p>
  
  <p>
    Cheers,<br>
    <strong>Goran</strong><br>
    Founder, SportBot AI
  </p>
  
  <div class="footer">
    <p>P.S. Check out your listing at <a href="https://sportbotai.com/tools">sportbotai.com/tools</a></p>
    <p style="font-size: 12px;">Don't want these emails? Just reply and let me know.</p>
  </div>
</body>
</html>
  `.trim();
}

async function main() {
  const args = process.argv.slice(2);

  console.log('🔍 Backlink Scout Test\n');

  // Test seed list (curated tools)
  if (args.includes('--seed')) {
    console.log('Testing seed list (curated tools)...\n');

    const tools = await getSeedTools();
    console.log(`Found ${tools.length} curated tools:\n`);

    for (const tool of tools) {
      console.log(`  📦 ${tool.name}`);
      console.log(`     URL: ${tool.url}`);
      console.log(`     Description: ${tool.description}`);
      console.log('');
    }
    return;
  }

  // Test Google search
  if (args.includes('--google')) {
    console.log('Testing Google Custom Search...\n');

    const query = args[args.indexOf('--google') + 1] || 'sports betting analytics tool';
    console.log(`Query: "${query}"\n`);

    const tools = await searchGoogle(query);
    console.log(`Found ${tools.length} tools:\n`);

    for (const tool of tools.slice(0, 10)) {
      console.log(`  📦 ${tool.name}`);
      console.log(`     URL: ${tool.url}`);
      console.log(`     Description: ${tool.description.substring(0, 100)}...`);
      console.log('');
    }
    return;
  }

  // Test Product Hunt only
  if (args.includes('--ph')) {
    console.log('Testing Product Hunt scraper...\n');

    const tools = await scrapeProductHunt('sports betting');
    console.log(`Found ${tools.length} tools:\n`);

    for (const tool of tools.slice(0, 10)) {
      console.log(`  📦 ${tool.name}`);
      console.log(`     URL: ${tool.url}`);
      console.log(`     Source: ${tool.sourceUrl}`);
      console.log(`     Description: ${tool.description.substring(0, 100)}...`);
      console.log('');
    }
    return;
  }

  // Test AlternativeTo only
  if (args.includes('--alt')) {
    console.log('Testing AlternativeTo scraper...\n');

    const tools = await scrapeAlternativeTo('sports betting');
    console.log(`Found ${tools.length} tools:\n`);

    for (const tool of tools.slice(0, 10)) {
      console.log(`  📦 ${tool.name}`);
      console.log(`     URL: ${tool.url}`);
      console.log('');
    }
    return;
  }

  // Test content extraction
  if (args.includes('--extract')) {
    const testUrl = args[args.indexOf('--extract') + 1] || 'https://example.com';
    console.log(`Testing content extraction from: ${testUrl}\n`);

    const { content, wordCount } = await extractWebsiteContent(testUrl);
    console.log(`Extracted ${wordCount} words:\n`);
    console.log(content.substring(0, 1000) + '...');
    return;
  }

  // Test email finder
  if (args.includes('--email')) {
    const testUrl = args[args.indexOf('--email') + 1] || 'https://example.com';
    console.log(`Testing email finder for: ${testUrl}\n`);

    const { email, source } = await findContactEmail(testUrl);
    console.log(`Email: ${email || 'not found'}`);
    console.log(`Source: ${source}`);
    return;
  }

  // Full discover run
  if (args.includes('--discover')) {
    const isLive = args.includes('--live');
    const maxTools = args.includes('--all') ? 100 : 10; // --all for full run

    // Parse source argument: --source=sportsbettingtools or --source=seed,google
    let sources: ('sportsbettingtools' | 'seed' | 'google' | 'producthunt' | 'alternativeto' | 'betalist')[] = ['sportsbettingtools', 'seed'];
    const sourceArg = args.find(a => a.startsWith('--source='));
    if (sourceArg) {
      sources = sourceArg.replace('--source=', '').split(',') as typeof sources;
    }

    console.log(`Running full discovery (${isLive ? 'LIVE' : 'DRY RUN'}, max ${maxTools} tools)...`);
    console.log(`Sources: ${sources.join(', ')}\n`);

    const result = await runBacklinkScout({
      sources,
      searchTerms: [],
      maxNew: maxTools,
      dryRun: !isLive,
    });

    console.log('\n📊 Results:');
    console.log(`   Discovered: ${result.discovered}`);
    console.log(`   New: ${result.new}`);
    console.log(`   Skipped: ${result.skipped}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(e => console.log(`   - ${e}`));
    }
    return;
  }

  // Show stats
  if (args.includes('--stats')) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const total = await prisma.toolReview.count();
    const withEmail = await prisma.toolReview.count({ where: { contactEmail: { not: null } } });
    const withReview = await prisma.toolReview.count({ where: { reviewContent: { not: null } } });
    const outreachSent = await prisma.toolReview.count({ where: { outreachStatus: 'SENT' } });
    const tools = await prisma.toolReview.findMany({
      select: { toolName: true, contactEmail: true, reviewContent: true, outreachStatus: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n📊 Backlink Scout Database Summary');
    console.log('==================================');
    console.log(`Total tools: ${total}`);
    console.log(`With email: ${withEmail}`);
    console.log(`With AI review: ${withReview}`);
    console.log(`Outreach sent: ${outreachSent}`);
    console.log(`Without email: ${total - withEmail}`);
    console.log('\n📧 Tools with emails:');
    tools.filter(t => t.contactEmail).forEach(t => {
      const reviewStatus = t.reviewContent ? '📝' : '⏳';
      const outreachIcon = t.outreachStatus === 'SENT' ? '✉️' : '';
      console.log(`  ✅ ${t.toolName}: ${t.contactEmail} ${reviewStatus}${outreachIcon}`);
    });

    await prisma.$disconnect();
    return;
  }

  // Generate AI reviews for tools with emails
  if (args.includes('--reviews')) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const isLive = args.includes('--live');
    const isRealistic = args.includes('--realistic');
    const limit = args.includes('--all') ? 100 : 5;

    // Import realistic targets filter
    const { BIG_BRANDS } = await import('../src/config/realistic-targets');

    console.log(`Generating AI reviews (${isLive ? 'LIVE' : 'DRY RUN'}${isRealistic ? ', REALISTIC ONLY' : ''}, limit ${limit})...\n`);

    // Get tools with emails but no review yet
    let tools = await prisma.toolReview.findMany({
      where: {
        contactEmail: { not: null },
        reviewContent: null,
      },
      take: limit * 3, // Get more to filter
    });

    // Filter out big brands if --realistic flag
    if (isRealistic) {
      const originalCount = tools.length;
      tools = tools.filter(tool => {
        const domain = new URL(tool.toolUrl).hostname.replace('www.', '').toLowerCase();
        const isBigBrand = BIG_BRANDS.some(big => domain.includes(big.replace('www.', '')));
        if (isBigBrand) {
          console.log(`⏭️ Skipping big brand: ${tool.toolName} (${domain})`);
        }
        return !isBigBrand;
      });
      tools = tools.slice(0, limit);
      console.log(`\nFiltered: ${originalCount} → ${tools.length} (skipped ${originalCount - tools.length} big brands)\n`);
    }

    console.log(`Found ${tools.length} tools needing reviews\n`);

    for (const tool of tools) {
      console.log(`[Review] Generating for: ${tool.toolName}`);

      if (isLive) {
        try {
          const reviewResult = await generateToolReview(
            tool.toolName,
            tool.toolUrl,
            tool.toolDescription || '',
            tool.contentExtracted || '',
          );

          await prisma.toolReview.update({
            where: { id: tool.id },
            data: {
              reviewTitle: reviewResult.title,
              reviewContent: reviewResult.content,
              reviewGeneratedAt: new Date(),
              reviewStatus: 'GENERATED',
            },
          });

          console.log(`[Review] ✅ Saved: ${reviewResult.title} (${reviewResult.content.length} chars)`);
        } catch (err) {
          console.error(`[Review] ❌ Failed:`, err);
        }
      } else {
        console.log(`[Review] Would generate review (dry run)`);
      }
    }

    await prisma.$disconnect();
    return;
  }

  // Preview reviews and emails
  if (args.includes('--preview')) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const limit = 2;

    const tools = await prisma.toolReview.findMany({
      where: {
        contactEmail: { not: null },
        reviewContent: { not: null },
      },
      take: limit,
    });

    for (const tool of tools) {
      console.log('═'.repeat(70));
      console.log(`📝 TOOL: ${tool.toolName}`);
      console.log(`🔗 URL: ${tool.toolUrl}`);
      console.log(`📧 EMAIL: ${tool.contactEmail}`);
      console.log('─'.repeat(70));
      console.log(`REVIEW TITLE: ${tool.reviewTitle}`);
      console.log('─'.repeat(70));
      console.log('REVIEW CONTENT:');
      console.log(tool.reviewContent);
      console.log('─'.repeat(70));
      console.log('OUTREACH EMAIL PREVIEW:');
      console.log('─'.repeat(70));
      const emailHtml = generateOutreachEmail(tool.toolName, tool.toolUrl, tool.reviewContent || '');
      // Strip HTML for preview
      const emailText = emailHtml
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      console.log(emailText);
      console.log('\n');
    }

    await prisma.$disconnect();
    return;
  }

  // Send outreach emails
  if (args.includes('--outreach')) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const isLive = args.includes('--live');
    const isRealistic = args.includes('--realistic');
    const limit = args.includes('--all') ? 50 : 3;

    // Import realistic targets filter
    const { BIG_BRANDS } = await import('../src/config/realistic-targets');

    console.log(`Sending outreach emails (${isLive ? 'LIVE' : 'DRY RUN'}${isRealistic ? ', REALISTIC ONLY' : ''}, limit ${limit})...\n`);

    // Get tools with emails and reviews but no outreach sent
    let tools = await prisma.toolReview.findMany({
      where: {
        contactEmail: { not: null },
        reviewContent: { not: null },
        outreachStatus: 'NOT_SENT',
      },
      take: limit * 3, // Get more to filter
    });

    // Filter out big brands if --realistic flag
    if (isRealistic) {
      const originalCount = tools.length;
      tools = tools.filter(tool => {
        const domain = new URL(tool.toolUrl).hostname.replace('www.', '').toLowerCase();
        const isBigBrand = BIG_BRANDS.some(big => domain.includes(big.replace('www.', '')));
        if (isBigBrand) {
          console.log(`⏭️ Skipping big brand: ${tool.toolName} (${domain})`);
        }
        return !isBigBrand;
      });
      tools = tools.slice(0, limit);
      console.log(`\nFiltered: ${originalCount} → ${tools.length} (skipped ${originalCount - tools.length} big brands)\n`);
    }

    console.log(`Found ${tools.length} tools ready for outreach\n`);

    for (const tool of tools) {
      // Build review URL from blogSlug or generate from tool name
      const reviewSlug = tool.blogSlug || `tools/${tool.toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const reviewUrl = `https://www.sportbotai.com/${reviewSlug}`;
      
      console.log(`[Outreach] ${tool.toolName} → ${tool.contactEmail}`);
      console.log(`[Outreach] Review URL: ${reviewUrl}`);

      if (isLive) {
        try {
          // Use the proper email template with correct review link
          const sent = await sendToolReviewOutreach(
            tool.contactEmail!,
            tool.toolName,
            reviewUrl
          );

          if (sent) {
            await prisma.toolReview.update({
              where: { id: tool.id },
              data: {
                outreachStatus: 'SENT',
                outreachSentAt: new Date(),
              },
            });
            console.log(`[Outreach] ✅ Sent`);
          } else {
            console.log(`[Outreach] ❌ Failed to send`);
          }
        } catch (err) {
          console.error(`[Outreach] ❌ Error:`, err);
        }

        // Rate limit: wait 2 seconds between emails
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.log(`[Outreach] Would send email (dry run)`);
      }
    }

    await prisma.$disconnect();
    return;
  }

  // Publish reviews as blog posts
  if (args.includes('--publish')) {
    const { PrismaClient } = await import('@prisma/client');
    const { marked } = await import('marked');
    const prisma = new PrismaClient();

    // Helper: Convert content to HTML if it's markdown
    const ensureHtml = async (content: string, toolName: string, toolUrl: string): Promise<string> => {
      // Check if already HTML (starts with a tag)
      if (content.trim().startsWith('<')) {
        return content;
      }
      // Convert markdown to HTML
      const html = await marked(content);

      // Add CTA box if not present
      if (!html.includes('Ready to Try')) {
        const ctaBox = `
<div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; border: 1px solid #334155;">
  <p style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">🔗 Ready to Try ${toolName}?</p>
  <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">Visit their website to learn more and get started.</p>
  <a href="${toolUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Visit ${toolName} →</a>
</div>`;

        // Insert before Verdict if present
        const verdictMatch = html.match(/<h2[^>]*>(?:Final\s+)?Verdict/i);
        if (verdictMatch && verdictMatch.index !== undefined) {
          return html.slice(0, verdictMatch.index) + ctaBox + html.slice(verdictMatch.index);
        }
        return html + ctaBox;
      }
      return html;
    };

    const isLive = args.includes('--live');
    const limitArg = args.find(a => a.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : (args.includes('--all') ? 100 : 5);

    console.log(`Publishing reviews as blog posts (${isLive ? 'LIVE' : 'DRY RUN'}, limit ${limit})...\n`);

    // Get reviews without blog posts
    const tools = await prisma.toolReview.findMany({
      where: {
        reviewContent: { not: null },
        blogPostId: null,
      },
      take: limit,
    });

    console.log(`Found ${tools.length} reviews to publish\n`);

    for (const tool of tools) {
      // Create slug from tool name (flat, no subdirectory)
      const slug = `${tool.toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-review`;

      console.log(`[Publish] ${tool.toolName} → /blog/${slug}`);

      if (isLive) {
        try {
          // Check if slug exists
          const existing = await prisma.blogPost.findUnique({ where: { slug } });
          if (existing) {
            console.log(`[Publish] ⏭️ Slug already exists, linking...`);
            await prisma.toolReview.update({
              where: { id: tool.id },
              data: { blogPostId: existing.id, blogSlug: slug },
            });
            continue;
          }

          // Capture homepage screenshot for featured image
          let featuredImage = '/sports/football.jpg'; // fallback
          const skipImage = args.includes('--no-image');

          if (!skipImage && tool.toolUrl) {
            try {
              console.log(`[Publish] Capturing screenshot of ${tool.toolUrl}...`);
              const { captureScreenshotWithFallback } = await import('../src/lib/blog/screenshot-generator');
              featuredImage = await captureScreenshotWithFallback(
                tool.toolUrl,
                tool.toolName,
                '/sports/football.jpg'
              );
              console.log(`[Publish] ✅ Screenshot captured`);
            } catch (imgErr) {
              console.log(`[Publish] ⚠️ Screenshot failed, using fallback:`, imgErr instanceof Error ? imgErr.message : imgErr);
            }
          } else if (skipImage) {
            console.log(`[Publish] Skipping screenshot (--no-image)`);
          } else {
            console.log(`[Publish] No tool URL, using fallback image`);
          }

          // Create blog post
          const htmlContent = await ensureHtml(tool.reviewContent!, tool.toolName, tool.toolUrl);

          const blogPost = await prisma.blogPost.create({
            data: {
              title: tool.reviewTitle || `${tool.toolName} Review`,
              slug,
              excerpt: `A comprehensive review of ${tool.toolName} - a sports betting analytics tool. See features, pros, cons, and our verdict.`,
              content: htmlContent,
              category: 'Tools & Resources',
              tags: ['tool-review', 'sports-betting', 'analytics', tool.toolName.toLowerCase()],
              status: 'PUBLISHED',
              publishedAt: new Date(),
              postType: 'GENERAL',
              metaTitle: `${tool.toolName} Review: Is It Worth It? | SportBot AI`,
              metaDescription: `Our honest review of ${tool.toolName}. See key features, pros and cons, pricing, and whether it's right for your sports betting strategy.`,
              featuredImage,
            },
          });

          // Link to tool review
          await prisma.toolReview.update({
            where: { id: tool.id },
            data: {
              blogPostId: blogPost.id,
              blogSlug: slug,
              reviewStatus: 'PUBLISHED',
            },
          });

          console.log(`[Publish] ✅ Created: /blog/${slug}`);
        } catch (err) {
          console.error(`[Publish] ❌ Error:`, err);
        }
      } else {
        console.log(`[Publish] Would create blog post (dry run)`);
      }
    }

    await prisma.$disconnect();
    return;
  }

  // Show help
  console.log('Usage:');
  console.log('  --stats      Show database summary');
  console.log('  --preview    Preview sample reviews and outreach emails');
  console.log('  --seed       List curated seed tools');
  console.log('  --google [query]  Test Google Custom Search');
  console.log('  --discover   Run full discovery (dry run)');
  console.log('  --reviews    Generate AI reviews for tools with emails');
  console.log('  --publish    Publish reviews as blog posts');
  console.log('  --outreach   Send outreach emails to tools with reviews');
  console.log('  --live       Actually save/send (use with --discover, --reviews, --publish, --outreach)');
  console.log('  --all        Process all tools (use with --discover, --reviews, --publish, --outreach)');
  console.log('  --ph         Test Product Hunt scraper only');
  console.log('  --alt        Test AlternativeTo scraper only');
  console.log('  --extract <url>  Test content extraction');
  console.log('  --email <url>    Test email finder');
}

main().catch(console.error);
