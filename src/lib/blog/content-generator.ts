// OpenAI-powered content generation for blog posts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { ResearchResult, BlogOutline, GeneratedContent, BlogCategory, BLOG_CATEGORIES } from './types';

// Lazy initialization to support scripts that load env manually
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Get existing blog posts for internal linking
async function getExistingBlogSlugs(): Promise<{ slug: string; title: string }[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, title: true },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });
    return posts;
  } catch {
    return [];
  }
}

// Generate a blog outline from research
export async function generateOutline(
  keyword: string,
  research: ResearchResult
): Promise<BlogOutline> {
  const prompt = `Create a detailed blog post outline for SportBot AI about: "${keyword}"

═══════════════════════════════════════════════════════════════
🎯 SEARCH INTENT ANALYSIS
═══════════════════════════════════════════════════════════════

First, determine what the user ACTUALLY wants when searching this:
- What questions are they trying to answer?
- What problems are they trying to solve?
- Are they beginners or experienced?
- What would make them satisfied after reading?

Structure the outline to directly address these needs.

═══════════════════════════════════════════════════════════════
📌 ABOUT SPORTBOT AI (https://www.sportbotai.com)
═══════════════════════════════════════════════════════════════

SportBot AI is an AI-powered sports analytics platform. Our mission:
"Understand any match in 60 seconds" — we sell UNDERSTANDING, not winning.

WHAT WE DO:
- Pre-match intelligence: headlines, form, H2H history & AI insights
- AI-powered probability analysis and value detection
- Educational content about sports analysis (NOT betting tips)

OUR FEATURES (mention naturally when relevant):
1. 🌍 Multi-Sport Coverage — Soccer, NBA, NFL, NHL, MMA/UFC in one platform
2. 📊 Team Intelligence — Deep team profiles, form trends, injury reports
3. ⚡ Value Detection — Compare AI probabilities with bookmaker odds
4. 💬 AI Sports Desk — Chat with AI about any match, team, or player
5. 🔔 Market Alerts — Notifications when odds shift or value edges appear
6. 📁 Analysis History — Access past analyses, track research decisions

KEY PAGES TO LINK:
- /matches — Browse upcoming matches with AI analysis
- /ai-desk — Chat with our AI Sports Desk assistant
- /pricing — View subscription plans
- /blog — More educational articles

IMPORTANT:
- NEVER recommend competitor tools/platforms (no tipster sites, no other analytics platforms)
- When suggesting "tools" or "platforms," suggest SportBot AI features instead
- We focus on EDUCATION and UNDERSTANDING, not "beating bookmakers"
- Always include responsible gambling messaging
- Target audience: Sports enthusiasts interested in data-driven analysis

═══════════════════════════════════════════════════════════════
📊 RESEARCH DATA TO INCORPORATE
═══════════════════════════════════════════════════════════════

Facts: ${JSON.stringify(research.facts)}
Statistics: ${JSON.stringify(research.statistics)}
Recent News: ${JSON.stringify(research.recentNews)}

═══════════════════════════════════════════════════════════════
📝 OUTLINE REQUIREMENTS
═══════════════════════════════════════════════════════════════

- SEO-optimized title (include keyword naturally, NOT forced)
- Meta description (150-160 chars, compelling hook)
- 6-8 sections with clear H2 headings that address user questions
- Each section: 2-4 subheadings (H3)
- Each subheading: 2-3 key points that become full paragraphs
- Target 2000-2500 words total
- Include a "Responsible Gambling" section before conclusion
- Strong conclusion that summarizes key takeaways

SECTION FLOW:
1. Introduction with hook and TL;DR
2-5. Core content sections answering user questions
6. Practical tips/how-to section
7. Responsible Gambling
8. Conclusion with actionable takeaways

Return JSON:
{
  "title": "SEO-optimized title (natural, not keyword-stuffed)",
  "metaDescription": "150-160 char compelling description",
  "sections": [
    {
      "heading": "H2 heading (addresses user question)",
      "subheadings": ["H3 sub 1", "H3 sub 2", "H3 sub 3"],
      "keyPoints": ["detailed point 1", "detailed point 2", "detailed point 3"]
    }
  ],
  "estimatedWordCount": 2200
}`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No outline generated');
  }

  return JSON.parse(content) as BlogOutline;
}

// Generate the full blog post content
export async function generateContent(
  keyword: string,
  outline: BlogOutline,
  research: ResearchResult
): Promise<GeneratedContent> {
  // Get existing posts for internal linking
  const existingPosts = await getExistingBlogSlugs();
  const internalLinksInfo = existingPosts.length > 0
    ? `\n\nEXISTING BLOG POSTS FOR INTERNAL LINKING (use 3-5 of these):
${existingPosts.slice(0, 15).map(p => `- "/blog/${p.slug}" - ${p.title}`).join('\n')}`
    : '';

  const prompt = `Write a complete, engaging blog post for SportBot AI following this outline.

KEYWORD: "${keyword}"
TITLE: "${outline.title}"

OUTLINE:
${outline.sections.map((s, i) => `
${i + 1}. ${s.heading}
   ${s.subheadings.map(sub => `- ${sub}`).join('\n   ')}
   Key points: ${s.keyPoints.join(', ')}
`).join('\n')}

RESEARCH TO INCORPORATE:
- Facts: ${research.facts.join(' | ')}
- Statistics: ${research.statistics.join(' | ')}
- Recent developments: ${research.recentNews.join(' | ')}
${internalLinksInfo}

═══════════════════════════════════════════════════════════════
🎯 PEOPLE-FIRST WRITING (GOOGLE'S CORE PRINCIPLE)
═══════════════════════════════════════════════════════════════

Focus on answering the REAL needs and intentions of the reader.
Identify the user's actual QUESTIONS and make solving them your first priority.
DO NOT write for search engines or keyword stuffing — write for HUMANS.

═══════════════════════════════════════════════════════════════
🔍 SEARCH INTENT MATCHING
═══════════════════════════════════════════════════════════════

Analyze what the user actually wants:
- Informational: "What is...?", "How does...?" → Explain clearly with examples
- Commercial: Comparisons, reviews → Be objective, show pros/cons
- Transactional: "How to bet on..." → Step-by-step practical guidance

Organize content to deliver EXACTLY what the user searched for.

═══════════════════════════════════════════════════════════════
✍️ NATURAL, CONVERSATIONAL TONE (CRITICAL)
═══════════════════════════════════════════════════════════════

Write as if speaking to a friend who asked you a question:
✔ Use contractions naturally (it's, don't, you're, we've, that's)
✔ Address the reader directly ("you", "your", "we")
✔ Include rhetorical questions ("So what does this mean for you?")
✔ Vary sentence length — mix short punchy ones with longer explanations
✔ Add emotional nuance — excitement, caution, curiosity
✔ Use transitions like "Here's the thing...", "Now, let's talk about..."
✔ Include asides and parentheticals (like this one)

DO NOT sound like a lecture or textbook. Sound like a conversation.

═══════════════════════════════════════════════════════════════
🚫 BANNED AI PHRASES (INSTANT QUALITY PENALTY)
═══════════════════════════════════════════════════════════════

NEVER use these robotic AI-sounding phrases:
❌ "In today's digital landscape..."
❌ "It's important to note that..."
❌ "Cutting-edge" / "State-of-the-art"
❌ "Seamless" / "Seamlessly"
❌ "Delve into" / "Delving deeper"
❌ "At the end of the day..."
❌ "Robust" / "Robust solutions"
❌ "Leverage" (as a verb)
❌ "Elevate your..."
❌ "Navigate the complexities"
❌ "In conclusion..." (at the start of conclusion)
❌ "Furthermore..." / "Moreover..." (overused)
❌ "A myriad of..."
❌ "It goes without saying..."
❌ "Needless to say..."
❌ Generic definitions that add no value

Instead, use direct, specific language that sounds like a real person wrote it.

═══════════════════════════════════════════════════════════════
💡 ORIGINAL INSIGHT & REAL EXAMPLES (E-E-A-T)
═══════════════════════════════════════════════════════════════

Add genuine value through:
✔ Specific real-world examples ("When Liverpool faced Manchester City last season...")
✔ Relatable scenarios ("Imagine you're watching a match and notice...")
✔ Actual statistics with context ("City averaged 2.3 xG at home, compared to 1.8 away")
✔ Reasoning and WHY explanations, not just WHAT
✔ Personal-sounding insights ("One thing many bettors overlook is...")
✔ Acknowledge limitations ("Of course, no model is perfect...")

DO NOT: Write filler content or repeat generic facts everyone knows.

═══════════════════════════════════════════════════════════════
🔄 BREAK AI PATTERNS (CRITICAL FOR QUALITY)
═══════════════════════════════════════════════════════════════

AI writing has predictable patterns. Break them:

✔ Vary paragraph lengths (some 2 sentences, some 5-6)
✔ Start sentences differently (not all "The", "This", "It")
✔ Mix sentence structures (questions, statements, exclamations)
✔ Include occasional one-sentence paragraphs for emphasis
✔ Use fragments intentionally for effect ("Big mistake.")
✔ Vary transitions — don't repeat the same ones
✔ Add personality touches ("Here's where it gets interesting...")

═══════════════════════════════════════════════════════════════
📖 CONTENT STRUCTURE
═══════════════════════════════════════════════════════════════

- Under each H2 heading, write 2-3 substantial paragraphs BEFORE any H3
- Under each H3, write 2-4 paragraphs (not just one!)
- Each paragraph: 3-5 sentences with varied length
- Total article: 2000-2500 words minimum
- Use clear transitions between sections
- Include a TL;DR or key takeaway in the intro

═══════════════════════════════════════════════════════════════
🖼️ INLINE IMAGES (MANDATORY)
═══════════════════════════════════════════════════════════════

Include EXACTLY 4 inline images using this format:
<figure><img src="[IMAGE:descriptive prompt for image generation]" alt="descriptive alt text" /><figcaption>Caption here</figcaption></figure>

Placement:
- Image 1: After introduction
- Image 2: After second major section
- Image 3: Mid-article, breaking up content
- Image 4: Before conclusion

Each description should be specific and visual.

═══════════════════════════════════════════════════════════════
🔗 HTML & INTERNAL LINKING
═══════════════════════════════════════════════════════════════

HTML Tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>, <table>

Internal Links (3-5 using SHORT anchor text):
- GOOD: <a href="/blog/slug">xG analysis</a>
- BAD: <a href="/blog/slug">Full Long Title Here</a>
- Only use URLs from the list above or: /blog, /matches, /pricing, /ai-desk

Include at least one data table with proper <table> markup.

═══════════════════════════════════════════════════════════════
🎰 RESPONSIBLE GAMBLING (REQUIRED SECTION)
═══════════════════════════════════════════════════════════════

Include a dedicated section with:
- Setting limits (time, money)
- Recognizing warning signs
- Link to help resources (BeGambleAware, etc.)
- Emphasis: betting for entertainment, not income

═══════════════════════════════════════════════════════════════
🏷️ ABOUT SPORTBOT AI (https://www.sportbotai.com)
═══════════════════════════════════════════════════════════════

SportBot AI is an AI-powered sports analytics platform. Our mission:
"Understand any match in 60 seconds" — we sell UNDERSTANDING, not winning.

WHAT WE DO:
- Pre-match intelligence: headlines, form, H2H history & AI insights
- AI-powered probability analysis and value detection
- Educational content about sports analysis (NOT betting tips)

OUR FEATURES (mention 1-2 naturally when relevant):
1. 🌍 Multi-Sport Coverage — Soccer, NBA, NFL, NHL, MMA/UFC in one platform
2. 📊 Team Intelligence — Deep team profiles, form trends, injury reports
3. ⚡ Value Detection — Compare AI probabilities with bookmaker odds
4. 💬 AI Sports Desk (/ai-desk) — Chat with AI about any match, team, or player
5. 🔔 Market Alerts — Notifications when odds shift or value edges appear
6. 📁 Analysis History — Access past analyses, track research decisions

BRAND VOICE:
- Educational and analytical, not salesy or hype-driven
- Data-driven with real statistics and context
- Professional yet approachable and conversational
- Emphasizes UNDERSTANDING sports, not "beating bookmakers"
- Acknowledges uncertainty — no guaranteed outcomes

CRITICAL RULES:
- NEVER recommend competitor tools/platforms (no tipster sites, no other analytics tools)
- When mentioning "tools" or "platforms," suggest SportBot AI features naturally
- Link to our pages: /matches, /ai-desk, /pricing, /blog
- Include subtle feature mentions (e.g., "tools like our AI Sports Desk can help...")

═══════════════════════════════════════════════════════════════

Return JSON:
{
  "title": "Final title",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling 2-3 sentence excerpt that makes readers want to click",
  "content": "<article>Full HTML content with multiple paragraphs per section</article>",
  "metaTitle": "SEO title (60 chars max)",
  "metaDescription": "Meta description (160 chars max)",
  "focusKeyword": "main keyword",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "One of: ${BLOG_CATEGORIES.join(', ')}"
}`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content generated');
  }

  const generated = JSON.parse(content) as GeneratedContent;
  
  // Validate category
  if (!BLOG_CATEGORIES.includes(generated.category as BlogCategory)) {
    generated.category = 'Educational Guides';
  }

  return generated;
}

// Generate a catchy excerpt if needed
export async function generateExcerpt(title: string, content: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Write a compelling 2-sentence excerpt for this blog post that will encourage clicks. 
Title: "${title}"
Content preview: "${content.substring(0, 500)}..."

Return only the excerpt text, no quotes.`
    }],
    temperature: 0.8,
    max_tokens: 150,
  });

  return response.choices[0]?.message?.content || '';
}

// Estimate token usage and cost
export function estimateGenerationCost(
  researchTokens: number,
  outlineTokens: number, 
  contentTokens: number
): number {
  // GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output (approx)
  const inputCost = (researchTokens + outlineTokens * 0.5 + contentTokens * 0.3) * 0.00000015;
  const outputCost = (outlineTokens * 0.5 + contentTokens * 0.7) * 0.0000006;
  
  // Perplexity Sonar: ~$1/1000 requests
  const perplexityCost = 0.001;
  
  return inputCost + outputCost + perplexityCost;
}

// ============================================
// TOOL REVIEW CONTENT GENERATION
// Uses same patterns as regular blog content
// ============================================

export interface ToolReviewContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

/**
 * Generate a tool review blog post following the same patterns as regular blogs
 * Outputs proper HTML directly (no markdown conversion needed)
 * Target: 5000-6000 words for comprehensive SEO-optimized reviews
 */
export async function generateToolReviewContent(
  toolName: string,
  toolUrl: string,
  toolDescription: string,
  websiteContent: string
): Promise<ToolReviewContent> {
  
  // Get existing posts for internal linking
  const existingPosts = await getExistingBlogSlugs();
  const internalLinksInfo = existingPosts.length > 0
    ? `\nEXISTING BLOG POSTS FOR INTERNAL LINKING (use 5-8 naturally throughout):
${existingPosts.slice(0, 15).map(p => `- "/blog/${p.slug}" - ${p.title}`).join('\n')}`
    : '';

  const prompt = `Write a COMPREHENSIVE, in-depth tool review for SportBot AI blog.

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL: LENGTH REQUIREMENT
═══════════════════════════════════════════════════════════════

This review MUST be 5000-6000 words. This is a long-form, authoritative guide.
Each section should have multiple detailed paragraphs.
Include real examples, use cases, comparisons, and detailed explanations.

═══════════════════════════════════════════════════════════════
📋 TOOL INFORMATION
═══════════════════════════════════════════════════════════════

Tool Name: ${toolName}
Website: ${toolUrl}
Description: ${toolDescription}

Website Content (for research):
${websiteContent.substring(0, 8000)}

═══════════════════════════════════════════════════════════════
📝 REQUIRED STRUCTURE (5000-6000 words total)
═══════════════════════════════════════════════════════════════

<h2>Introduction</h2>
<p>3-4 paragraphs introducing the tool, the problem it solves, and why readers should care. Set the context for sports bettors.</p>

<h2>What is ${toolName}?</h2>
<p>Detailed explanation of the platform - its history, who created it, what makes it unique in the market. 2-3 paragraphs.</p>

<h2>Key Features (Deep Dive)</h2>
For EACH feature, write 2-3 detailed paragraphs explaining:
- What it does
- How it works
- Why it matters for bettors
- Real-world use cases

<h3>1. [Feature Name]</h3>
<p>Detailed multi-paragraph explanation...</p>

<h3>2. [Feature Name]</h3>
<p>Detailed multi-paragraph explanation...</p>

<h3>3. [Feature Name]</h3>
<p>Detailed multi-paragraph explanation...</p>

<h3>4. [Feature Name]</h3>
<p>Detailed multi-paragraph explanation...</p>

<h3>5. [Feature Name]</h3>
<p>Detailed multi-paragraph explanation...</p>

<h2>How to Get Started with ${toolName}</h2>
<p>Step-by-step guide on signing up and using the platform. Include tips for beginners. 3-4 paragraphs.</p>

<h2>Who Should Use ${toolName}?</h2>
<h3>Ideal For</h3>
<p>Detailed profile of who benefits most - specific user types, experience levels, betting styles.</p>
<h3>Not Ideal For</h3>
<p>Who might want to look elsewhere and why.</p>

<h2>Pricing and Value Analysis</h2>
<p>Detailed breakdown of pricing tiers, what you get at each level, comparison to competitors, and whether it's worth the cost. Include a pricing table if possible. 3-4 paragraphs.</p>

<h2>${toolName} vs Alternatives</h2>
<p>Compare to 2-3 similar tools in the market. What does ${toolName} do better? Where do alternatives win? 4-5 paragraphs.</p>

<h2>Pros and Cons</h2>
<h3>Pros</h3>
<ul>
<li><strong>[Pro]:</strong> Detailed explanation (2-3 sentences each)</li>
<li><strong>[Pro]:</strong> Detailed explanation</li>
<li><strong>[Pro]:</strong> Detailed explanation</li>
<li><strong>[Pro]:</strong> Detailed explanation</li>
<li><strong>[Pro]:</strong> Detailed explanation</li>
</ul>
<h3>Cons</h3>
<ul>
<li><strong>[Con]:</strong> Detailed explanation</li>
<li><strong>[Con]:</strong> Detailed explanation</li>
<li><strong>[Con]:</strong> Detailed explanation</li>
</ul>

<h2>Tips for Getting the Most Out of ${toolName}</h2>
<p>5-6 actionable tips for users to maximize value. Each tip should be a paragraph.</p>

<h2>Frequently Asked Questions</h2>
<p>5-6 common questions with detailed answers.</p>
<h3>Is ${toolName} legit?</h3>
<p>Answer...</p>
<h3>Does ${toolName} offer a free trial?</h3>
<p>Answer...</p>
<h3>[More relevant questions]</h3>
<p>Answer...</p>

<div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; border: 1px solid #334155;">
<p style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">🔗 Ready to Try ${toolName}?</p>
<p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">Visit their website to learn more and get started.</p>
<a href="${toolUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Visit ${toolName} →</a>
</div>

<h2>Final Verdict</h2>
<p>2-3 paragraphs summarizing your overall assessment. Who should get it? Is it worth the money? Final recommendation.</p>

═══════════════════════════════════════════════════════════════
✍️ WRITING STYLE
═══════════════════════════════════════════════════════════════

✔ Natural, conversational tone (contractions, "you", rhetorical questions)
✔ Be objective and balanced - acknowledge both strengths and weaknesses
✔ Include specific examples and use cases
✔ Vary sentence length - mix short punchy sentences with longer explanations
✔ Use HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <table>
✔ NO MARKDOWN - output pure HTML only
✔ Include data tables where relevant (pricing, feature comparisons)
${internalLinksInfo}

═══════════════════════════════════════════════════════════════
🏷️ ABOUT SPORTBOT AI
═══════════════════════════════════════════════════════════════

We review tools in the sports analytics space objectively.
Mention SportBot AI features naturally where relevant:
- AI-powered match analysis (/matches)
- AI Sports Desk for questions (/ai-desk)
- Value detection and probability analysis
- Market alerts for odds movements

═══════════════════════════════════════════════════════════════

REMEMBER: 5000-6000 words minimum. This is a comprehensive guide, not a quick overview.

Return JSON:
{
  "title": "${toolName} Review [Current Year]: [Compelling subtitle about value proposition]",
  "slug": "${toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-review",
  "excerpt": "Compelling 2-3 sentence excerpt that makes readers want to click and read the full review.",
  "content": "<h2>Introduction</h2><p>...</p>...FULL 5000-6000 word HTML content with all sections...",
  "metaTitle": "${toolName} Review 2026: Features, Pricing & Honest Verdict",
  "metaDescription": "Complete ${toolName} review with features, pricing, pros & cons. See if it's worth it for your betting strategy.",
  "tags": ["tool-review", "sports-betting", "analytics", "${toolName.toLowerCase()}", "betting-tools"]
}`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o', // Use gpt-4o for longer, higher quality content
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 16000, // Increased for 5000-6000 word output
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content generated for tool review');
  }

  return JSON.parse(content) as ToolReviewContent;
}
