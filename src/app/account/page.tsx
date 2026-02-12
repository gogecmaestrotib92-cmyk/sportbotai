/**
 * Account/Dashboard Page
 * 
 * User account management with subscription info and Stripe portal
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AccountDashboard from './AccountDashboard';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your SportBot AI account, subscription, and preferences.',
};

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      plan: true,
      analysisCount: true,
      lastAnalysisDate: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      createdAt: true,
      _count: {
        select: {
          analyses: true,
        },
      },
    },
  });

  return user;
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/account');
  }

  const userData = await getUserData(session.user.id);

  if (!userData) {
    redirect('/login');
  }

  return (
    <AccountDashboard user={userData} />
  );
}
