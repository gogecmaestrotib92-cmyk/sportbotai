/**
 * Serbian Account/Dashboard Page - /sr/account
 * Moj Nalog - upravljanje nalogom i pretplatom
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AccountDashboardSr from './AccountDashboardSr';

export const metadata: Metadata = {
  title: 'Moj Nalog',
  description: 'Upravljajte svojim SportBot AI nalogom, pretplatom i podešavanjima.',
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

export default async function SerbianAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/sr/login?callbackUrl=/sr/account');
  }

  const userData = await getUserData(session.user.id);

  if (!userData) {
    redirect('/sr/login');
  }

  return (
    <AccountDashboardSr user={userData} />
  );
}
