import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logoutAction } from '@/actions/auth';
import AdminNav from '@/components/admin/AdminNav';
import { getSettings, regulatoryReady } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administration' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/admin');

  const user = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true, name: true, email: true } });
  if (!user || user.role !== 'ADMIN') redirect('/portal');

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
              <span className="text-[14.5px] font-medium">apextrail<span className="text-gold">funds</span></span>
            </Link>
            <span className="hidden rounded-md border border-white/10 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.16em] text-white/45 sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
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

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[210px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminNav />
        </aside>
        <div className="min-w-0 space-y-5">
          {!regulatoryReady(settings) ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3">
              <p className="text-[12.5px] text-amber-100/90">
                Regulatory identity is incomplete, so the public site shows “details pending” and refuses to state a
                licence or custodian. Add them in{' '}
                <Link href="/admin/settings" className="font-medium underline">Settings</Link> before inviting investors.
              </p>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
