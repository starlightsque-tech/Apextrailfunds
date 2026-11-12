import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { readPurposeToken } from '@/lib/tokens';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Confirm email' };

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? '';
  const claim = token ? await readPurposeToken(token, 'verify-email') : null;
  let done = false;

  if (claim) {
    await prisma.user.update({ where: { id: claim.uid }, data: { emailVerified: true } });
    await recordAudit(claim.uid, 'email.verified');
    done = true;
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="container-x flex justify-center py-24">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/35 bg-gold/10 text-gold">✓</div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            {done ? 'Email confirmed' : 'Link invalid or expired'}
          </h1>
          <p className="body mt-3">
            {done
              ? 'Thank you — your email address is confirmed. You can continue in your portal.'
              : 'This confirmation link is no longer valid. Sign in and request a new one from your profile.'}
          </p>
          <Link href={done ? '/portal' : '/login'} className="btn-primary mt-7">
            {done ? 'Open portal' : 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
