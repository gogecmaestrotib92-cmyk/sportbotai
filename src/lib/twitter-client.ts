/**
 * Twitter/X API Client for SportBot
 * 
 * Handles posting tweets, threads, and media uploads.
 * Uses Twitter API v2 with OAuth 1.0a for posting.
 */

import crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

const TWITTER_API_URL = 'https://api.twitter.com/2';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _TWITTER_UPLOAD_URL = 'https://upload.twitter.com/1.1'; // Reserved for media uploads

interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function getConfig(): TwitterConfig | null {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return null;
  }

  return { apiKey, apiSecret, accessToken, accessTokenSecret };
}

// ============================================
// OAUTH 1.0a SIGNATURE
// ============================================

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  config: TwitterConfig
): string {
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(
      Object.keys(params)
        .sort()
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&')
    ),
  ].join('&');

  const signingKey = `${encodeURIComponent(config.apiSecret)}&${encodeURIComponent(config.accessTokenSecret)}`;
  
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
}

function generateOAuthHeader(
  method: string,
  url: string,
  config: TwitterConfig,
  additionalParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: '1.0',
    ...additionalParams,
  };

  const signature = generateOAuthSignature(method, url, oauthParams, config);
  oauthParams.oauth_signature = signature;

  const headerString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerString}`;
}

// ============================================
// TYPES
// ============================================

export interface Tweet {
  id: string;
  text: string;
  created_at?: string;
}

export interface TweetResponse {
  success: boolean;
  tweet?: Tweet;
  error?: string;
}

export interface ThreadResponse {
  success: boolean;
  tweets?: Tweet[];
  error?: string;
}

export type PostCategory = 
  | 'MORNING_BRIEFING'
  | 'MATCH_PREVIEW'
  | 'LIVE_UPDATE'
  | 'POST_MATCH'
  | 'CALL_VALIDATION'
  | 'HOT_TAKE'
  | 'TRENDING';

export interface ScheduledPost {
  id: string;
  content: string;
  category: PostCategory;
  scheduledFor: Date;
  matchId?: string;
  predictionId?: string;
  posted: boolean;
  postedAt?: Date;
  tweetId?: string;
}

// ============================================
// TWITTER CLIENT
// ============================================

class TwitterClient {
  private config: TwitterConfig | null;

  constructor() {
    this.config = getConfig();
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Post a single tweet
   */
  async postTweet(text: string, replyToId?: string): Promise<TweetResponse> {
    if (!this.config) {
      return { success: false, error: 'Twitter API not configured' };
    }

    // Twitter character limit
    if (text.length > 280) {
      return { success: false, error: `Tweet too long: ${text.length}/280 characters` };
    }

    try {
      const url = `${TWITTER_API_URL}/tweets`;
      const body: Record<string, unknown> = { text };
      
      if (replyToId) {
        body.reply = { in_reply_to_tweet_id: replyToId };
      }

      const authHeader = generateOAuthHeader('POST', url, this.config);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Twitter] Post failed:', errorData);
        return { 
          success: false, 
          error: errorData.detail || errorData.title || 'Failed to post tweet' 
        };
      }

      const data = await response.json();
      console.log('[Twitter] Tweet posted:', data.data.id);

      return {
        success: true,
        tweet: {
          id: data.data.id,
          text: data.data.text,
        },
      };
    } catch (error) {
      console.error('[Twitter] Post error:', error);
      return { success: false, error: 'Failed to connect to Twitter API' };
    }
  }

  /**
   * Post a thread (multiple tweets in sequence)
   */
  async postThread(tweets: string[]): Promise<ThreadResponse> {
    if (!this.config) {
      return { success: false, error: 'Twitter API not configured' };
    }

    if (tweets.length === 0) {
      return { success: false, error: 'No tweets provided' };
    }

    const postedTweets: Tweet[] = [];
    let replyToId: string | undefined;

    for (let i = 0; i < tweets.length; i++) {
      const result = await this.postTweet(tweets[i], replyToId);
      
      if (!result.success || !result.tweet) {
        return { 
          success: false, 
          error: `Failed at tweet ${i + 1}: ${result.error}`,
          tweets: postedTweets,
        };
      }

      postedTweets.push(result.tweet);
      replyToId = result.tweet.id;

      // Small delay between tweets to avoid rate limiting
      if (i < tweets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('[Twitter] Thread posted:', postedTweets.length, 'tweets');
    return { success: true, tweets: postedTweets };
  }

  /**
   * Delete a tweet (for cleanup/testing)
   */
  async deleteTweet(tweetId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Twitter API not configured' };
    }

    try {
      const url = `${TWITTER_API_URL}/tweets/${tweetId}`;
      const authHeader = generateOAuthHeader('DELETE', url, this.config);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to delete tweet' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to connect to Twitter API' };
    }
  }
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format a SportBot post for Twitter (add hashtags, trim length)
 */
export function formatForTwitter(
  content: string, 
  options?: {
    hashtags?: string[];
    emoji?: string;
    maxLength?: number;
  }
): string {
  const { hashtags = [], emoji, maxLength = 270 } = options || {};
  
  let tweet = content;
  
  // Add emoji prefix if provided
  if (emoji) {
    tweet = `${emoji} ${tweet}`;
  }
  
  // Calculate space needed for hashtags
  const hashtagString = hashtags.length > 0 
    ? '\n\n' + hashtags.map(h => `#${h}`).join(' ')
    : '';
  
  const availableLength = maxLength - hashtagString.length;
  
  // Trim content if needed - find a good break point
  if (tweet.length > availableLength) {
    // Try to cut at sentence end first (. ! ?)
    let cutPoint = tweet.lastIndexOf('. ', availableLength - 1);
    if (cutPoint === -1) cutPoint = tweet.lastIndexOf('! ', availableLength - 1);
    if (cutPoint === -1) cutPoint = tweet.lastIndexOf('? ', availableLength - 1);
    
    // If no sentence break, try to cut at word boundary
    if (cutPoint === -1 || cutPoint < availableLength / 2) {
      cutPoint = tweet.lastIndexOf(' ', availableLength - 1);
    }
    
    // If still no good break, just cut at limit
    if (cutPoint === -1 || cutPoint < availableLength / 2) {
      cutPoint = availableLength - 1;
    }
    
    tweet = tweet.substring(0, cutPoint + 1).trim();
    
    // Only add ... if we didn't end on sentence punctuation
    if (!/[.!?]$/.test(tweet)) {
      tweet = tweet + '.';
    }
  }
  
  return tweet + hashtagString;
}

/**
 * Split long content into a thread
 */
export function splitIntoThread(content: string, maxTweetLength: number = 270): string[] {
  const tweets: string[] = [];
  const sentences = content.split(/(?<=[.!?])\s+/);
  let currentTweet = '';

  for (const sentence of sentences) {
    const testTweet = currentTweet ? `${currentTweet} ${sentence}` : sentence;
    
    if (testTweet.length <= maxTweetLength) {
      currentTweet = testTweet;
    } else {
      if (currentTweet) {
        tweets.push(currentTweet);
      }
      // If sentence is too long, cut at word boundary
      if (sentence.length > maxTweetLength) {
        let cutPoint = sentence.lastIndexOf(' ', maxTweetLength - 1);
        if (cutPoint === -1 || cutPoint < maxTweetLength / 2) {
          cutPoint = maxTweetLength - 1;
        }
        currentTweet = sentence.substring(0, cutPoint + 1).trim();
        if (!/[.!?]$/.test(currentTweet)) {
          currentTweet = currentTweet + '.';
        }
      } else {
        currentTweet = sentence;
      }
    }
  }

  if (currentTweet) {
    tweets.push(currentTweet);
  }

  // Add thread numbering if multiple tweets
  if (tweets.length > 1) {
    return tweets.map((t, i) => `${i + 1}/${tweets.length} ${t}`);
  }

  return tweets;
}

// ============================================
// SINGLETON EXPORT
// ============================================

let twitterClient: TwitterClient | null = null;

export function getTwitterClient(): TwitterClient {
  if (!twitterClient) {
    twitterClient = new TwitterClient();
  }
  return twitterClient;
}

export { TwitterClient };
