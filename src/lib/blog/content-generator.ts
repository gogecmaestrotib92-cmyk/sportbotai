// OpenAI-powered content generation for blog posts

import OpenAI from 'openai';
import { ResearchResult, BlogOutline, GeneratedContent, BlogCategory, BLOG_CATEGORIES } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
- 5-7 sections with clear H2 headings
- Each section should have 2-3 subheadings (H3)
- Include key points for each section
- Target 1500-2000 words total
- Include a "Responsible Gambling" or "Final Thoughts" section

Return JSON:
{
  "title": "SEO-optimized title",
  "metaDescription": "150-160 char description",
  "sections": [
    {
      "heading": "H2 heading",
      "subheadings": ["H3 sub 1", "H3 sub 2"],
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ],
  "estimatedWordCount": 1800
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
  const prompt = `Write a complete blog post for SportBot AI following this outline.

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

WRITING GUIDELINES:
1. Write in a professional but accessible tone
2. Use HTML formatting (h2, h3, p, ul, li, strong, em)
3. Include the keyword naturally 3-5 times
4. Add internal link placeholders: <a href="/blog/[related-topic]">anchor text</a>
5. Include at least one data table if relevant
6. Add a responsible gambling note
7. End with a clear conclusion
8. Target ${outline.estimatedWordCount} words

SPORTBOT AI BRAND VOICE:
- Educational, not promotional
- Data-driven and analytical
- Professional but friendly
- Emphasizes understanding, not "winning systems"
- Always mentions responsible gambling

Return JSON:
{
  "title": "Final title",
  "slug": "url-friendly-slug",
  "excerpt": "2-3 sentence excerpt for previews",
  "content": "<article>Full HTML content here</article>",
  "metaTitle": "SEO title (60 chars max)",
  "metaDescription": "Meta description (160 chars max)",
  "focusKeyword": "main keyword",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "One of: ${BLOG_CATEGORIES.join(', ')}"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
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
