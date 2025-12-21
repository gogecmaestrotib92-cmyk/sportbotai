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

BRAND CONTEXT:
- SportBot AI is an AI-powered sports betting ANALYTICS platform
- We provide educational content about sports analysis, NOT betting tips
- Focus: probability analysis, value detection, risk assessment
- Always include responsible gambling messaging
- Target: Sports enthusiasts interested in data-driven analysis

RESEARCH DATA:
Facts: ${JSON.stringify(research.facts)}
Statistics: ${JSON.stringify(research.statistics)}
Recent News: ${JSON.stringify(research.recentNews)}

REQUIREMENTS:
- SEO-optimized title (include keyword naturally)
- Meta description (150-160 chars)
- 6-8 sections with clear H2 headings
- Each section should have 2-4 subheadings (H3)
- Each subheading needs 2-3 key points that will become full paragraphs
- Target 2000-2500 words total
- Include a "Responsible Gambling" section before the conclusion
- Final section should be a strong conclusion

Return JSON:
{
  "title": "SEO-optimized title",
  "metaDescription": "150-160 char description",
  "sections": [
    {
      "heading": "H2 heading",
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

CRITICAL WRITING GUIDELINES:

1. CONTENT STRUCTURE - THIS IS CRUCIAL:
   - Under each H2 heading, write 2-3 substantial paragraphs BEFORE any H3
   - Under each H3, write 2-4 paragraphs (not just one!)
   - Each paragraph should be 3-5 sentences
   - Total article: 2000-2500 words minimum
   - Use transitional sentences between sections

2. WRITING STYLE:
   - Write like a knowledgeable friend explaining concepts
   - Mix short punchy sentences with longer explanatory ones
   - Use rhetorical questions to engage readers
   - Include real examples and scenarios
   - Avoid bullet-point-only sections - write actual paragraphs

3. HTML FORMATTING:
   - Use: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>
   - Add <figure> with <img> placeholders for 2-3 inline images: 
     <figure><img src="[IMAGE:description of what image should show]" alt="descriptive alt text" /><figcaption>Caption here</figcaption></figure>
   - One image after intro, one mid-article, one before conclusion

4. INTERNAL LINKING:
   - Add 3-5 internal links using ONLY the existing blog URLs provided above
   - Use natural anchor text within sentences
   - Example: <a href="/blog/understanding-expected-goals-xg-football">learn more about xG</a>
   - DO NOT make up URLs - only use exact slugs from the list above
   - If no relevant existing posts, link to: /blog, /matches, /pricing, /ai-desk

5. TABLES:
   - Include at least one data table if the topic allows
   - Use proper <table>, <thead>, <tbody>, <tr>, <th>, <td> tags

6. SPORTBOT AI BRAND VOICE:
   - Educational and analytical, not salesy
   - Data-driven with real statistics when possible
   - Professional yet approachable
   - Emphasizes understanding sports, not "beating bookmakers"
   - Always acknowledges uncertainty in predictions

7. RESPONSIBLE GAMBLING:
   - Include a dedicated section with practical tips
   - Mention setting limits, recognizing problem gambling signs
   - Link to gambling help resources

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
