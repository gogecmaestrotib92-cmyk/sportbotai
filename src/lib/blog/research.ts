// Perplexity API client for research
// Uses Perplexity Sonar for web-grounded research

import { ResearchResult } from './types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function researchTopic(keyword: string): Promise<ResearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const systemPrompt = `You are a sports betting and analytics research assistant for SportBot AI.
Your task is to research topics related to sports betting analytics, statistics, and responsible gambling.

IMPORTANT GUIDELINES:
- Focus on educational, analytical content
- Never promote gambling or guarantee wins
- Include statistical facts and data
- Cite recent developments (2024-2025)
- Focus on the analytical/educational aspect
- Include responsible gambling considerations when relevant

Return your research in JSON format with these fields:
{
  "facts": ["array of 5-7 key facts about the topic"],
  "statistics": ["array of 3-5 relevant statistics with sources"],
  "recentNews": ["array of 2-3 recent developments or news"],
  "sources": ["array of source names/domains used"],
  "relatedTopics": ["array of 3-5 related topics for internal linking"]
}`;

  const userPrompt = `Research this topic thoroughly for a blog article: "${keyword}"

Focus on:
1. Core concepts and definitions
2. Practical applications for sports analysis
3. Statistical evidence and data
4. Recent trends (2024-2025)
5. Expert opinions and best practices
6. Responsible gambling angle if applicable

Return ONLY valid JSON.`;

  const messages: PerplexityMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar', // Uses web search
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Perplexity response');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Perplexity response');
    }

    const research: ResearchResult = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    return {
      facts: research.facts || [],
      statistics: research.statistics || [],
      recentNews: research.recentNews || [],
      sources: research.sources || [],
      relatedTopics: research.relatedTopics || [],
    };

  } catch (error) {
    console.error('Research error:', error);
    throw error;
  }
}

// Get related keywords for internal linking
export async function getRelatedKeywords(keyword: string, existingKeywords: string[]): Promise<string[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return [];
  }

  const prompt = `Given the topic "${keyword}", suggest 5 closely related topics for sports betting analytics blog content.
  
Existing topics (avoid duplicates): ${existingKeywords.slice(0, 20).join(', ')}

Return ONLY a JSON array of strings, like: ["topic 1", "topic 2", ...]`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return [];

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    
    return [];
  } catch {
    return [];
  }
}
