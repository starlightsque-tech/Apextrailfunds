import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { money, date } from '@/lib/format';
import ApplicationForm from '@/components/forms/ApplicationForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Apply for access' };

export default async function ApplyPage() {
  const session = await getSession();
  if (!session) redirect('/signup');
  if (session.role === 'ADMIN') redirect('/admin');

  const [settings, user] = await Promise.all([
    getSettings(),
    prisma.user.findUnique({ where: { id: session.uid }, include: { application: true } })
  ]);
  if (!user) redirect('/login');

  if (user.application) {
    return (
      <div className="container-x flex justify-center py-20">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Application already on file</h1>
          <p className="body mt-3">
            Submitted {date(user.application.createdAt)} · status <strong className="text-white">{user.application.status}</strong>.
            You can follow progress in your portal.
          </p>
          <Link href="/portal" className="btn-primary mt-7">Go to portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="eyebrow">Application</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Apply for access</h1>
          <p className="body mt-5">
            Signed in as {user.email}. Tell us how you invest and the manager will review eligibility. Approval releases
            the offering documents and funding instructions — not a payment address.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { k: 'Minimum commitment', v: money(Number(settings.minSubscription), 'USD', 0) },
              { k: 'Liquidity', v: `${settings.liquidityNoticeDays}-day notice` },
              { k: 'Eligibility', v: 'Professional / high-net-worth investors' },
              { k: 'Verification', v: 'Identity and source of funds, before funding' }
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between border-b border-line pb-2.5">
                <span className="text-[13px] text-mist">{r.k}</span>
                <span className="text-right text-[13px] font-medium text-white">{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <ApplicationForm minSubscription={settings.minSubscription} country={user.country ?? ''} />
        </div>
      </div>
    </div>
  );
}
