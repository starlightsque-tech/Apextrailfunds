import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { readPurposeToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email preferences' };

export default async function UnsubscribePage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? '';
  const claim = token ? await readPurposeToken(token, 'unsubscribe') : null;

  if (claim) {
    await prisma.user.update({ where: { id: claim.uid }, data: { emailOptOut: true } });
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="container-x flex justify-center py-24">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {claim ? 'You are unsubscribed' : 'Link invalid or expired'}
          </h1>
          <p className="body mt-3">
            {claim
              ? 'You will no longer receive non-essential emails. Account, security and statement notices will still be sent while you hold an account.'
              : 'Sign in to manage your email preferences from your profile.'}
          </p>
          <Link href="/" className="btn-ghost mt-7">Return to site</Link>
        </div>
      </div>
    </div>
  );
}
