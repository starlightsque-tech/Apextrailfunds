import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logoutAction } from '@/actions/auth';
import { getSettings } from '@/lib/settings';
import { Badge, statusTone } from '@/components/ui/Badge';
import PortalNav from '@/components/portal/PortalNav';
import { stopImpersonation } from '@/actions/admin';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/portal');

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, name: true, email: true, status: true, role: true, emailVerified: true }
  });
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/admin');

  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 glass">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-md border border-gold/40 bg-gold/10 text-[11px] font-semibold text-gold">
                AT
              </span>
              <span className="text-[14.5px] font-medium">
                apextrail<span className="text-gold">funds</span>
              </span>
            </Link>
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-white/35 sm:inline">Investor portal</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={statusTone(user.status)}>{user.status === 'ACTIVE' ? 'Approved investor' : user.status === 'APPLICANT' ? 'Under review' : 'Suspended'}</Badge>
            <div className="hidden text-right sm:block">
              <p className="text-[13px] leading-tight text-white">{user.name}</p>
              <p className="text-[11.5px] leading-tight text-mist">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button className="btn-ghost btn-sm" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PortalNav />
          <div className="mt-6 rounded-xl border border-line bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Support</p>
            <p className="mt-2 text-[12px] leading-relaxed text-mist">
              Use the chat launcher, or email{' '}
              <a className="text-white hover:text-gold" href={`mailto:${settings.adminEmail || 'investors@apextrailfunds.com'}`}>
                {settings.adminEmail || 'investors@apextrailfunds.com'}
              </a>.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          {session.imp ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-400/30 bg-sky-400/[0.08] px-4 py-3">
              <p className="text-[12.5px] text-sky-100/90">
                <strong className="font-medium">Support access.</strong> You are viewing {user.name}’s portal as an
                administrator. This session is read/write for support purposes and every action is logged.
              </p>
              <form action={stopImpersonation}>
                <button className="btn-ghost btn-sm border-sky-300/40" type="submit">Exit to admin</button>
              </form>
            </div>
          ) : null}
          {!user.emailVerified ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3">
              <p className="text-[12.5px] text-amber-100/90">
                Confirm your email address to receive statements and payment instructions.
              </p>
              <Link href="/portal/profile" className="text-[12.5px] font-medium text-amber-200 hover:underline">
                Resend confirmation
              </Link>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
