import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { money } from '@/lib/format';
import { InterestForm } from '@/components/portal/CatalogForms';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invest' };

export default async function InvestPage({ searchParams }: { searchParams: { plan?: string } }) {
  const session = await getSession();
  if (!session) return null;

  const plans = await prisma.plan.findMany({ where: { status: 'OPEN' }, orderBy: { sortOrder: 'asc' } });
  const selected = plans.find((p) => p.id === searchParams.plan) ?? plans[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Invest</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Choose a programme</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Recording interest starts a conversation, not a transaction. The manager confirms eligibility, then the
          custodian issues subscription documents and funding instructions.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="card p-6">
          <EmptyState title="No open programmes">
            There are no open programmes at the moment. <Link href="/contact" className="text-gold hover:underline">Contact the team</Link> to be notified.
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/portal/invest?plan=${p.id}`}
                className={`block rounded-xl border p-4 transition ${
                  selected?.id === p.id ? 'border-gold/40 bg-gold/[0.06]' : 'border-line bg-surface hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium text-white">{p.name}</p>
                    <p className="mt-1 text-[12px] text-mist">{p.tagline ?? 'Systematic sleeve'}</p>
                  </div>
                  <span className="chip border-white/12 bg-white/[0.04] text-white/60">{p.riskBand}</span>
                </div>
                <p className="mt-3 text-[11.5px] text-mist">
                  Min {money(p.minAmount, 'USD', 0)} · {p.liquidityDays}-day notice · {p.managementFee}% / {p.performanceFee}%
                </p>
              </Link>
            ))}
          </div>

          <div className="card p-5">
            {selected ? (
              <>
                <p className="text-[13.5px] font-medium text-white">{selected.name}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-mist">{selected.strategy}</p>
                <div className="mt-4">
                  <InterestForm planId={selected.id} min={selected.minAmount} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
