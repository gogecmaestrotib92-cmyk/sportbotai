/**
 * Translation service for Serbian localization
 * 
 * Uses OpenAI GPT-4 for high-quality sports content translation
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranslateOptions {
  preserveHtml?: boolean;
  context?: 'news' | 'blog' | 'match_preview';
}

/**
 * Translate text from English to Serbian
 */
export async function translateToSerbian(
  text: string,
  options: TranslateOptions = {}
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const { preserveHtml = true, context = 'news' } = options;

  const systemPrompt = `You are a professional sports translator specializing in English to Serbian (Latin script) translation.

CRITICAL RULES:
1. Use Serbian Latin script (NOT Cyrillic) - e.g., "utakmica" not "утакмица"
2. Keep all team names, player names, and league names in ENGLISH (do not translate proper nouns)
3. Keep all numbers, dates, times, and statistics exactly as they are
4. ${preserveHtml ? 'Preserve ALL HTML tags exactly as they appear (<h2>, <p>, <strong>, <em>, <ul>, <li>, etc.)' : 'Return plain text without HTML'}
5. Maintain the same tone - professional sports journalism
6. Use Serbian sports terminology:
   - "match" → "utakmica" or "meč"
   - "game" → "utakmica"
   - "win" → "pobeda"
   - "loss" → "poraz"
   - "draw" → "nerešeno" or "remi"
   - "goal" → "gol"
   - "score" → "rezultat"
   - "team" → "tim" or "ekipa"
   - "coach" → "trener"
   - "player" → "igrač"
   - "injury" → "povreda"
   - "odds" → "kvote"
   - "betting" → "klađenje"
   - "prediction" → "predikcija" or "predviđanje"
   - "analysis" → "analiza"
   - "form" → "forma"
   - "home" → "domaćin"
   - "away" → "gost"

CONTEXT: This is ${context === 'news' ? 'a sports news article' : context === 'match_preview' ? 'a match preview article' : 'a sports blog post'}.

Return ONLY the translated text, no explanations.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for translation
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.3, // Lower temperature for consistent translations
      max_tokens: Math.min(text.length * 2, 16000), // Estimate: Serbian can be longer
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Translate multiple fields at once (more efficient)
 */
export async function translateBlogPost(post: {
  title: string;
  excerpt: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  newsTitle?: string | null;
  newsContent?: string | null;
  postType?: string;
}): Promise<{
  titleSr: string;
  excerptSr: string;
  contentSr: string;
  metaTitleSr: string | null;
  metaDescriptionSr: string | null;
  newsTitleSr: string | null;
  newsContentSr: string | null;
}> {
  const context = post.postType === 'NEWS' || post.postType === 'MATCH_PREVIEW' 
    ? 'match_preview' 
    : 'blog';

  // Translate in parallel for speed
  const [
    titleSr,
    excerptSr,
    contentSr,
    metaTitleSr,
    metaDescriptionSr,
    newsTitleSr,
    newsContentSr,
  ] = await Promise.all([
    translateToSerbian(post.title, { preserveHtml: false, context }),
    translateToSerbian(post.excerpt, { preserveHtml: false, context }),
    translateToSerbian(post.content, { preserveHtml: true, context }),
    post.metaTitle ? translateToSerbian(post.metaTitle, { preserveHtml: false, context }) : Promise.resolve(null),
    post.metaDescription ? translateToSerbian(post.metaDescription, { preserveHtml: false, context }) : Promise.resolve(null),
    post.newsTitle ? translateToSerbian(post.newsTitle, { preserveHtml: false, context }) : Promise.resolve(null),
    post.newsContent ? translateToSerbian(post.newsContent, { preserveHtml: true, context }) : Promise.resolve(null),
  ]);

  return {
    titleSr,
    excerptSr,
    contentSr,
    metaTitleSr,
    metaDescriptionSr,
    newsTitleSr,
    newsContentSr,
  };
}

/**
 * Estimate translation cost (GPT-4o-mini pricing)
 * Input: $0.15 per 1M tokens
 * Output: $0.60 per 1M tokens
 */
export function estimateTranslationCost(text: string): number {
  // Rough estimate: 4 chars = 1 token
  const inputTokens = Math.ceil(text.length / 4);
  const outputTokens = inputTokens * 1.2; // Serbian often longer
  
  const inputCost = (inputTokens / 1_000_000) * 0.15;
  const outputCost = (outputTokens / 1_000_000) * 0.60;
  
  return inputCost + outputCost;
}
