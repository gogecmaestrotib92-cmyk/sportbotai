// OpenAI-powered content generation for blog posts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { ResearchResult, BlogOutline, GeneratedContent, BlogCategory, BLOG_CATEGORIES } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  const response = await openai.chat.completions.create({
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

  const response = await openai.chat.completions.create({
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
  const response = await openai.chat.completions.create({
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
