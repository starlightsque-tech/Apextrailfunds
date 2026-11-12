import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCapitalAccount } from '@/lib/account';
import { money, num, date } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Field';
import TermProgress from '@/components/portal/TermProgress';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Portfolio' };

export default async function PortfolioPage() {
  const session = await getSession();
  if (!session) return null;

  const [positions, account, plans, interests] = await Promise.all([
    prisma.position.findMany({
      where: { userId: session.uid },
      orderBy: { startedAt: 'desc' },
      include: { plan: { select: { name: true, riskBand: true, termMonths: true } } }
    }),
    getCapitalAccount(session.uid),
    prisma.plan.findMany({ where: { status: 'OPEN' }, orderBy: { sortOrder: 'asc' } }),
    prisma.planApplication.findMany({ where: { userId: session.uid }, orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  const active = positions.filter((p) => p.status === 'ACTIVE');
  const invested = active.reduce((acc, p) => acc + Number(p.committed), 0);
  const valued = active.reduce(
    (acc, p) => acc + (p.units && p.navPerUnit ? Number(p.units) * Number(p.navPerUnit) : Number(p.committed)),
    0
  );
  const cash = Math.max(0, account.nav - invested);

  const allocation = [
    ...active.map((p) => ({ label: p.plan.name, value: Number(p.committed) })),
    ...(cash > 0 ? [{ label: 'Unallocated', value: cash }] : [])
  ];
  const total = allocation.reduce((a, b) => a + b.value, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your allocation</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
            Positions are recorded by the manager from custodian settlement. Valuation uses the last published NAV per
            unit; figures are unaudited.
          </p>
        </div>
        <Link href="/portal/subscribe" className="btn-primary btn-sm">Add capital</Link>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {[
          { k: 'Capital account', v: money(account.nav, 'USD', 0) },
          { k: 'Invested', v: money(invested, 'USD', 0) },
          { k: 'Estimated value', v: money(valued, 'USD', 0) }
        ].map((s) => (
          <div key={s.k} className="bg-surface px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-mist">{s.k}</p>
            <p className="mt-2 font-mono text-[22px] text-white">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[13.5px] font-medium text-white">Positions</p>
          </div>
          {positions.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No positions yet">
                Once a subscription settles and the manager records it, your holdings appear here with the programme
                they belong to.
              </EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-x">
                <thead>
                  <tr>
                    <th>Programme</th>
                    <th className="text-right">Committed</th>
                    <th className="text-right">Units</th>
                    <th className="text-right">Est. value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const value = p.units && p.navPerUnit ? Number(p.units) * Number(p.navPerUnit) : Number(p.committed);
                    return (
                      <tr key={p.id}>
                        <td>
                          <p className="text-white/90">{p.plan.name}</p>
                          <p className="text-[11px] text-mist">{p.plan.riskBand} risk · since {date(p.startedAt)}</p>
                          {p.status === 'ACTIVE' ? (
                            <div className="mt-2 max-w-[220px]">
                              <TermProgress startedAt={p.startedAt.toISOString()} termMonths={p.plan.termMonths ?? null} />
                            </div>
                          ) : null}
                        </td>
                        <td className="text-right font-mono text-white/85">{money(p.committed, 'USD', 0)}</td>
                        <td className="text-right font-mono text-mist">{p.units ? num(p.units, 2) : '—'}</td>
                        <td className="text-right font-mono text-white/85">{money(value, 'USD', 0)}</td>
                        <td><Badge tone={p.status === 'ACTIVE' ? 'green' : 'neutral'}>{p.status}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <p className="text-[13.5px] font-medium text-white">Allocation</p>
            {allocation.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-mist">Nothing allocated yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {allocation.map((a) => (
                  <div key={a.label}>
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="text-white/80">{a.label}</span>
                      <span className="font-mono text-mist">{((a.value / total) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gold/70" style={{ width: `${(a.value / total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="text-[13.5px] font-medium text-white">Your expressions of interest</p>
            {interests.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-mist">None recorded.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {interests.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <span className="text-[12px] text-white/80">{money(i.amount, 'USD', 0)}</span>
                    <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {plans.length > 0 ? (
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Open programmes</p>
          <div className="mt-3 divide-y divide-line">
            {plans.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[13px] text-white/90">{p.name}</p>
                  <p className="text-[11.5px] text-mist">
                    Min {money(p.minAmount, 'USD', 0)} · {p.liquidityDays}-day notice · {p.riskBand} risk
                  </p>
                </div>
                <Link href={`/portal/invest?plan=${p.id}`} className="btn-ghost btn-sm">Express interest</Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
