import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { money, date, num } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [pendingApps, activeInvestors, pendingSubs, pendingReds, entries, audit, emailFails] = await Promise.all([
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'INVESTOR', status: 'ACTIVE' } }),
    prisma.subscriptionRequest.count({ where: { status: { in: ['REQUESTED', 'INSTRUCTED'] } } }),
    prisma.redemptionRequest.count({ where: { status: { in: ['REQUESTED', 'INSTRUCTED'] } } }),
    prisma.ledgerEntry.findMany({ select: { type: true, amount: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { actor: { select: { email: true } } } }),
    prisma.emailLog.count({ where: { status: 'FAILED' } })
  ]);

  const nav = entries.reduce((acc, e) => {
    const amt = Number(e.amount);
    if (e.type === 'SUBSCRIPTION' || e.type === 'DISTRIBUTION' || e.type === 'ADJUSTMENT') return acc + amt;
    return acc - amt;
  }, 0);

  const stats = [
    { k: 'Applications to review', v: num(pendingApps, 0), href: '/admin/applications' },
    { k: 'Active investors', v: num(activeInvestors, 0), href: '/admin/investors' },
    { k: 'Open requests', v: num(pendingSubs + pendingReds, 0), href: '/admin/requests' },
    { k: 'Aggregate NAV', v: money(nav, 'USD', 0), href: '/admin/ledger' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Administration</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Operations overview</h1>
        <p className="mt-2 text-[13.5px] text-mist">
          Applications, custodian-confirmed entries and investor communications in one place.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.k} href={s.href} className="bg-surface px-5 py-5 transition hover:bg-elevated">
            <p className="text-[11px] uppercase tracking-[0.14em] text-mist">{s.k}</p>
            <p className="mt-2 font-mono text-[22px] text-white">{s.v}</p>
          </Link>
        ))}
      </div>

      {emailFails > 0 ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3">
          <p className="text-[12.5px] text-rose-200">
            {emailFails} email(s) failed to send. Check the outbox in{' '}
            <Link href="/admin/email" className="underline">Email</Link> — usually a missing RESEND_API_KEY or an unverified sender domain.
          </p>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-[13.5px] font-medium text-white">Recent activity</p>
          <Link href="/admin/applications" className="text-[12px] text-mist hover:text-white">Applications</Link>
        </div>
        <table className="table-x">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {audit.length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center text-[12.5px] text-mist">No activity recorded yet.</td></tr>
            ) : (
              audit.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-mist">{date(a.createdAt)}</td>
                  <td className="text-white/85">{a.action}</td>
                  <td className="text-mist">{a.actor?.email ?? 'system'}</td>
                  <td className="max-w-[220px] truncate font-mono text-[11.5px] text-mist">{a.target ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Reminder: you do not accept deposits</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
            Subscription cash is paid to the custodian’s account. Post entries here only after the custodian confirms
            settlement, and keep the confirmation reference in the memo.
          </p>
        </div>
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Publishing performance</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
            Drafts stay private. Publishing a month puts net returns on the public performance page with the risk
            warning attached.
          </p>
          <Link href="/admin/performance" className="btn-ghost btn-sm mt-4">Manage performance</Link>
        </div>
      </div>
    </div>
  );
}
