/**
 * NextAuth Configuration
 * 
 * Centralized auth configuration for SportBot AI.
 * Supports Google and GitHub OAuth providers.
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Plan limits
export const PLAN_LIMITS = {
  FREE: 3,      // 3 analyses per day
  PRO: 30,      // 30 analyses per day
  PREMIUM: -1,  // Unlimited (-1 = no limit)
} as const;

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
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
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
      
      // If the URL contains /analyzer, use it
      if (url.includes('/analyzer')) {
        if (url.startsWith('/')) {
          return `${siteUrl}${url}`;
        }
        return url;
      }
      
      // For all other cases (including home page, empty, etc.), go to analyzer
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
    },
  });

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, plan: 'FREE' };
  }

  const limit = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
  
  // Unlimited plan
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, plan: user.plan };
  }

  // Check if we need to reset daily count
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
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    plan: user.plan,
  };
}

/**
 * Increment user's analysis count
 */
export async function incrementAnalysisCount(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastAnalysisDate: true, analysisCount: true },
  });

  const lastAnalysis = user?.lastAnalysisDate;
  const lastAnalysisDay = lastAnalysis ? new Date(lastAnalysis) : null;
  if (lastAnalysisDay) {
    lastAnalysisDay.setHours(0, 0, 0, 0);
  }

  // If new day, reset count to 1; otherwise increment
  const isNewDay = !lastAnalysisDay || lastAnalysisDay.getTime() !== today.getTime();
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      analysisCount: isNewDay ? 1 : { increment: 1 },
      lastAnalysisDate: new Date(),
    },
  });
}
