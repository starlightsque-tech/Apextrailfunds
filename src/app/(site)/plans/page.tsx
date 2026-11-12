import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { money } from '@/lib/format';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Programmes' };

export default async function PlansPage() {
  const plans = await prisma.plan
    .findMany({ where: { status: 'OPEN' }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
    .catch(() => []);

  return (
    <div className="container-x py-16 sm:py-20">
      <p className="eyebrow">Programmes</p>
      <h1 className="h1 mt-4 max-w-3xl">Terms in the open.</h1>
      <p className="body mt-6 max-w-2xl">
        Each programme is a share class within the same systematic mandate, differing by minimum, maximum, duration,
        liquidity and fee terms. Returns are variable — the manager publishes actual monthly performance after the fact.
      </p>

      {plans.length === 0 ? (
        <div className="mt-10 card p-6">
          <EmptyState title="No programmes are open right now">
            The manager has not published an open programme. Create an account and you will be notified when terms are
            released.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <article key={p.id} className="card card-hover flex flex-col overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-medium text-white">{p.name}</h2>
                    <p className="mt-1 text-[12px] text-mist">{p.tagline ?? 'Systematic digital-asset sleeve'}</p>
                  </div>
                  <span className="chip border-white/12 bg-white/[0.04] text-[10.5px] text-white/60">{p.riskBand}</span>
                </div>
              </div>

              <div className="px-5 py-5">
                <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">Duration</p>
                <p className="mt-1 font-mono text-[28px] leading-none text-white">
                  {p.termMonths ? `${p.termMonths}` : '∞'}
                  <span className="ml-1.5 text-[13px] text-mist">{p.termMonths ? 'months' : 'open-ended'}</span>
                </p>
                <p className="mt-1.5 text-[11px] text-white/35">{p.liquidityDays}-day notice on redemption</p>

                <dl className="mt-5 space-y-2.5 text-[12.5px]">
                  <div className="flex items-baseline justify-between border-b border-line pb-2">
                    <dt className="text-mist">Minimum</dt>
                    <dd className="font-mono text-white/85">{money(p.minAmount, 'USD', 0)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-line pb-2">
                    <dt className="text-mist">Maximum per investor</dt>
                    <dd className="font-mono text-white/85">{p.maxAmount ? money(p.maxAmount, 'USD', 0) : 'No cap'}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-line pb-2">
                    <dt className="text-mist">Management fee</dt>
                    <dd className="font-mono text-white/85">{p.managementFee}% p.a.</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-mist">Performance fee</dt>
                    <dd className="font-mono text-white/85">{p.performanceFee}% over HWM</dd>
                  </div>
                </dl>

                <p className="mt-4 line-clamp-3 text-[12px] leading-relaxed text-mist">{p.strategy}</p>
              </div>

              <div className="mt-auto border-t border-line px-5 py-4">
                <Link href="/signup" className="btn-primary btn-sm w-full justify-between">
                  Apply to allocate <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-line bg-white/[0.02] p-5">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.7} />
        <p className="text-[12px] leading-relaxed text-white/45">
          Programmes are offered only to eligible investors under the offering memorandum. No return, distribution or
          capital protection is promised; digital assets can fall sharply and you may lose your entire allocation.
          Custody is held with a licensed third-party custodian.
        </p>
      </div>
    </div>
  );
}
