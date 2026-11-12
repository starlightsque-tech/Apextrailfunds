import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCapitalAccount } from '@/lib/account';
import { money, date, pct } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Portal overview' };

export default async function PortalHome() {
  const session = await getSession();
  if (!session) return null;

  const [user, account, requests, redemptions, docs, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.uid } }),
    getCapitalAccount(session.uid),
    prisma.subscriptionRequest.findMany({ where: { userId: session.uid }, orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.redemptionRequest.findMany({ where: { userId: session.uid }, orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.document.findMany({
      where: { OR: [{ visibility: 'INVESTOR' }, { ownerId: session.uid }] },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, title: true, category: true, createdAt: true }
    }),
    getSettings()
  ]);

  if (!user) return null;

  const application = await prisma.application.findUnique({ where: { userId: session.uid } });
  const latestPerf = await prisma.performancePoint.findFirst({
    where: { published: true },
    orderBy: { month: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="mt-2 text-[13.5px] text-mist">
          {user.status === 'ACTIVE'
            ? 'Your account is active. Capital-account figures below reflect entries confirmed by the manager from custodian records.'
            : 'Your application is being reviewed. You can prepare documents and review the disclosures in the meantime.'}
        </p>
      </div>

      {application && application.status !== 'APPROVED' ? (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13.5px] font-medium text-white">Application status</p>
              <p className="mt-1 text-[12.5px] text-mist">
                Submitted {date(application.createdAt)} · commitment {money(application.intendedAmount, 'USD', 0)} ·{' '}
                {application.entityType}
              </p>
            </div>
            <Badge tone={statusTone(application.status)}>{application.status}</Badge>
          </div>
          {application.status === 'REJECTED' && application.decisionNote ? (
            <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[12.5px] text-rose-200">
              {application.decisionNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/portal/fund" className="btn-primary">
          Deposit funds
        </Link>
        <Link href="/portal/redeem" className="btn-ghost">
          Withdraw
        </Link>
        <Link href="/portal/subscribe" className="btn-ghost">
          Subscribe
        </Link>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface px-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Capital account</p>
          <p className="mt-2 font-mono text-[22px] text-white">{money(account.nav, 'USD', 0)}</p>
          <p className="mt-1 text-[11.5px] text-white/35">Net of fees and withdrawals</p>
        </div>
        <div className="bg-surface px-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Contributions</p>
          <p className="mt-2 font-mono text-[22px] text-white">{money(account.contributions, 'USD', 0)}</p>
          <p className="mt-1 text-[11.5px] text-white/35">{account.units.toFixed(2)} units held</p>
        </div>
        <div className="bg-surface px-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Latest fund month</p>
          <p className="mt-2 font-mono text-[22px] text-white">{latestPerf ? pct(latestPerf.netReturn) : '—'}</p>
          <p className="mt-1 text-[11.5px] text-white/35">
            {latestPerf ? 'Net return, after fees' : 'No month published yet'}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13.5px] font-medium text-white">Recent account activity</p>
            <Link href="/portal/account" className="text-[12px] text-mist hover:text-white">View all</Link>
          </div>
          {account.entries.length === 0 ? (
            <p className="mt-4 text-[12.5px] leading-relaxed text-mist">
              No entries yet. Subscriptions appear here once the custodian confirms settlement.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-line">
              {account.entries.slice(0, 4).map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[12.5px] text-white/85">{e.type}</p>
                    <p className="text-[11.5px] text-mist">{date(e.date)}{e.memo ? ` · ${e.memo}` : ''}</p>
                  </div>
                  <span className={`font-mono text-[12.5px] ${e.type === 'WITHDRAWAL' || e.type === 'FEE' ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {e.type === 'WITHDRAWAL' || e.type === 'FEE' ? '−' : '+'}
                    {money(e.amount, 'USD', 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Next steps</p>
          <div className="mt-3 space-y-2.5">
            <Link href="/portal/subscribe" className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] text-white/85 hover:border-white/20">
              Request a subscription <ArrowRight size={14} />
            </Link>
            <Link href="/portal/documents" className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] text-white/85 hover:border-white/20">
              Offering documents <ArrowRight size={14} />
            </Link>
            <Link href="/portal/redeem" className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] text-white/85 hover:border-white/20">
              Request a redemption <ArrowRight size={14} />
            </Link>
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-white/35">
            Redemptions follow the {settings.liquidityNoticeDays}-day notice period. Funds are never sent to wallets
            operated by the manager.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Your requests</p>
          {requests.length === 0 && redemptions.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-mist">You have no open requests.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {[...requests.map((r) => ({ ...r, kind: 'Subscription' })), ...redemptions.map((r) => ({ ...r, kind: 'Redemption' }))]
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 5)
                .map((r) => (
                  <div key={`${r.kind}-${r.id}`} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <div>
                      <p className="text-[12.5px] text-white/85">{r.kind} · {money(r.amount, 'USD', 0)}</p>
                      <p className="text-[11px] text-mist">{date(r.createdAt)}</p>
                    </div>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Recent documents</p>
          {docs.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-mist">Documents appear here once the manager publishes them.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {docs.map((d) => (
                <a key={d.id} href={`/api/documents/${d.id}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 hover:border-white/20">
                  <FileText size={15} className="text-gold" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-white/85">{d.title}</span>
                    <span className="block text-[11px] text-mist">{date(d.createdAt)}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
