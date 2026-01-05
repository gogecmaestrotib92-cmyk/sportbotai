/**
 * NextAuth Configuration
 * 
 * Centralized auth configuration for SportBot AI.
 * Supports Google and GitHub OAuth providers.
 * 
 * CREDITS SYSTEM:
 * - FREE: 1 analysis/day, no chat
 * - PRO: 10 analyses/billing period, 50 chats/billing period
 * - PREMIUM: Unlimited
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Plan limits for ANALYSIS (per billing period for PRO, daily for FREE)
export const ANALYSIS_LIMITS = {
  FREE: 1,       // 1 analysis per day
  PRO: 10,       // 10 analyses per billing period
  PREMIUM: -1,   // Unlimited (-1 = no limit)
} as const;

// Plan limits for CHAT (per billing period for PRO, none for FREE)
export const CHAT_LIMITS = {
  FREE: 0,       // No chat for free users
  PRO: 50,       // 50 chats per billing period
  PREMIUM: -1,   // Unlimited
} as const;

// Legacy export for backwards compatibility
export const PLAN_LIMITS = ANALYSIS_LIMITS;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    // Only add Google if credentials exist
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code"
            }
          }
        })]
      : []),
    // Only add GitHub if credentials exist
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Case-insensitive email lookup
        const user = await prisma.user.findFirst({
          where: { 
            email: { 
              equals: credentials.email.toLowerCase().trim(),
              mode: 'insensitive' 
            } 
          },
        });

        if (!user) {
          // User doesn't exist
          throw new Error('No account found with this email');
        }

        if (!user.password) {
          // User exists but was created via OAuth (no password)
          throw new Error('This account uses Google sign-in. Please click "Continue with Google"');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          throw new Error('Incorrect password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          analysisCount: user.analysisCount,
        };
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign-ins
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Get the proper base URL
      const siteUrl = process.env.NEXTAUTH_URL || baseUrl;
      
      // Normalize the URL to get just the path
      let urlPath = url;
      if (url.startsWith(siteUrl)) {
        urlPath = url.slice(siteUrl.length) || '/';
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        // External URL - don't allow
        return `${siteUrl}/analyzer`;
      }
      
      // Ensure urlPath starts with /
      if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
      }
      
      // Check if the URL contains Serbian locale
      const isSerbianPath = urlPath.startsWith('/sr/') || urlPath === '/sr';
      
      // If it's a Serbian path, preserve it completely
      if (isSerbianPath) {
        return `${siteUrl}${urlPath}`;
      }
      
      // Check for specific valid pages
      const validPaths = ['/analyzer', '/matches', '/ai-desk', '/pricing', '/market-alerts', '/account', '/my-teams', '/history'];
      if (validPaths.some(path => urlPath.includes(path))) {
        return `${siteUrl}${urlPath}`;
      }
      
      // Default: go to analyzer
      return `${siteUrl}/analyzer`;
    },
    async jwt({ token, user, trigger }) {
      // First time jwt callback is run, user object is available
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan || 'FREE';
        token.analysisCount = (user as any).analysisCount || 0;
      }
      
      // When session is updated (e.g., from update() call), refresh from DB
      if (trigger === 'update' && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { plan: true, analysisCount: true, lastAnalysisDate: true },
          });
          if (dbUser) {
            token.plan = dbUser.plan || 'FREE';
            
            // Check if we need to reset count (new day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastAnalysisDay = dbUser.lastAnalysisDate ? new Date(dbUser.lastAnalysisDate) : null;
            if (lastAnalysisDay) {
              lastAnalysisDay.setHours(0, 0, 0, 0);
            }
            
            // If it's a new day, count should be 0
            if (!lastAnalysisDay || lastAnalysisDay.getTime() !== today.getTime()) {
              token.analysisCount = 0;
            } else {
              token.analysisCount = dbUser.analysisCount || 0;
            }
          }
        } catch (e) {
          console.error('Error refreshing user data:', e);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as any;
        session.user.analysisCount = (token.analysisCount as number) || 0;
        session.user.subscriptionTier = (token.plan as string) || 'FREE';
      }
      return session;
    },
  },
  
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Check if user can perform analysis based on their plan
 * - FREE: Daily limit (resets at midnight)
 * - PRO: Billing period limit (resets on stripeCurrentPeriodEnd)
 * - PREMIUM: Unlimited
 */
export async function canUserAnalyze(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  plan: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      analysisCount: true,
      lastAnalysisDate: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, plan: 'FREE' };
  }

  const limit = ANALYSIS_LIMITS[user.plan as keyof typeof ANALYSIS_LIMITS];
  
  // Unlimited plan (PREMIUM)
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, plan: user.plan };
  }

  // FREE: Daily limit (resets at midnight)
  if (user.plan === 'FREE') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastAnalysis = user.lastAnalysisDate;
    const lastAnalysisDay = lastAnalysis ? new Date(lastAnalysis) : null;
    if (lastAnalysisDay) {
      lastAnalysisDay.setHours(0, 0, 0, 0);
    }

    // Reset count if it's a new day
    const count = lastAnalysisDay && lastAnalysisDay.getTime() === today.getTime()
      ? user.analysisCount
      : 0;

    const remaining = Math.max(0, limit - count);
    return { allowed: remaining > 0, remaining, limit, plan: user.plan };
  }

  // PRO: Billing period limit (resets when subscription renews)
  // If no billing period set, use monthly default
  const periodEnd = user.stripeCurrentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Check if last analysis was in current billing period
  const lastAnalysis = user.lastAnalysisDate;
  const isCurrentPeriod = lastAnalysis && lastAnalysis >= periodStart;
  
  const count = isCurrentPeriod ? user.analysisCount : 0;
  const remaining = Math.max(0, limit - count);
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    plan: user.plan,
  };
}

/**
 * Increment user's analysis count
 * - FREE: Daily count
 * - PRO: Billing period count
 */
export async function incrementAnalysisCount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      plan: true,
      lastAnalysisDate: true, 
      analysisCount: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) return;

  // FREE: Daily reset
  if (user.plan === 'FREE') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastAnalysis = user.lastAnalysisDate;
    const lastAnalysisDay = lastAnalysis ? new Date(lastAnalysis) : null;
    if (lastAnalysisDay) {
      lastAnalysisDay.setHours(0, 0, 0, 0);
    }

    const isNewDay = !lastAnalysisDay || lastAnalysisDay.getTime() !== today.getTime();
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        analysisCount: isNewDay ? 1 : { increment: 1 },
        lastAnalysisDate: new Date(),
      },
    });
    return;
  }

  // PRO/PREMIUM: Billing period count (or just increment)
  const periodEnd = user.stripeCurrentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const lastAnalysis = user.lastAnalysisDate;
  const isCurrentPeriod = lastAnalysis && lastAnalysis >= periodStart;
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      analysisCount: isCurrentPeriod ? { increment: 1 } : 1,
      lastAnalysisDate: new Date(),
    },
  });
}

/**
 * Check if user can use AI chat based on their plan
 * - FREE: No chat access
 * - PRO: 50 chats per billing period
 * - PREMIUM: Unlimited
 */
export async function canUserChat(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  plan: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      chatCount: true,
      lastChatDate: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, plan: 'FREE' };
  }

  const limit = CHAT_LIMITS[user.plan as keyof typeof CHAT_LIMITS];
  
  // FREE: No chat access
  if (limit === 0) {
    return { allowed: false, remaining: 0, limit: 0, plan: user.plan };
  }
  
  // Unlimited plan (PREMIUM)
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, plan: user.plan };
  }

  // PRO: Billing period limit
  const periodEnd = user.stripeCurrentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const lastChat = user.lastChatDate;
  const isCurrentPeriod = lastChat && lastChat >= periodStart;
  
  const count = isCurrentPeriod ? (user.chatCount || 0) : 0;
  const remaining = Math.max(0, limit - count);
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    plan: user.plan,
  };
}

/**
 * Increment user's chat count
 */
export async function incrementChatCount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      plan: true,
      lastChatDate: true, 
      chatCount: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) return;

  // PRO/PREMIUM: Billing period count
  const periodEnd = user.stripeCurrentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const lastChat = user.lastChatDate;
  const isCurrentPeriod = lastChat && lastChat >= periodStart;
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      chatCount: isCurrentPeriod ? { increment: 1 } : 1,
      lastChatDate: new Date(),
    },
  });
}

/**
 * Reset user credits (called on subscription renewal via Stripe webhook)
 */
export async function resetUserCredits(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      analysisCount: 0,
      chatCount: 0,
      lastAnalysisDate: null,
      lastChatDate: null,
    },
  });
}
