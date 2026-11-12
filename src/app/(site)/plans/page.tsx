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
      <h1 className="h1 mt-4 max-w-3xl">Three ways to allocate, one risk framework.</h1>
      <p className="body mt-6 max-w-2xl">
        Each programme is a share class within the same systematic mandate, differing by liquidity, minimum and fee
        terms. None of them target a fixed return, and none is capital-protected.
      </p>

      {plans.length === 0 ? (
        <div className="mt-10 card p-6">
          <EmptyState title="No programmes are open right now">
            The manager has not published an open programme. Apply for access and you will be notified when terms are
            released.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="card flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-medium text-white">{p.name}</p>
                  <p className="mt-1 text-[12.5px] text-mist">{p.tagline ?? 'Systematic digital-asset sleeve'}</p>
                </div>
                <span className="chip border-white/12 bg-white/[0.04] text-white/60">{p.riskBand} risk</span>
              </div>

              <dl className="mt-5 space-y-2.5 text-[12.5px]">
                {[
                  ['Minimum', money(p.minAmount, 'USD', 0)],
                  ['Notice period', `${p.liquidityDays} days`],
                  ['Term', p.termMonths ? `${p.termMonths} months` : 'Open-ended'],
                  ['Fees', `${p.managementFee}% mgmt · ${p.performanceFee}% perf`]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-line pb-2">
                    <dt className="text-mist">{k}</dt>
                    <dd className="font-mono text-white/85">{v}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 line-clamp-4 flex-1 text-[12.5px] leading-relaxed text-mist">{p.strategy}</p>

              <Link href="/apply" className="btn-ghost btn-sm mt-5">
                Apply to allocate <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-line bg-white/[0.02] p-5">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.7} />
        <p className="text-[12px] leading-relaxed text-white/45">
          Programmes are offered only to eligible investors under the offering memorandum. Capital is at risk, returns
          are variable and past performance does not predict future results. Custody is held with a licensed third-party
          custodian; the portal cannot move funds.
        </p>
      </div>
    </div>
  );
}
