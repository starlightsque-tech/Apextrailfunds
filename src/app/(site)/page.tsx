import Link from 'next/link';
import { ArrowRight, ShieldCheck, Layers, LineChart, Scale, FileText, Lock, Compass } from 'lucide-react';
import { getSettings, regulatoryReady } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { monthLabel, pct } from '@/lib/format';

export const dynamic = 'force-dynamic';

const PILLARS = [
  {
    icon: Compass,
    title: 'One systematic mandate',
    body: 'A rules-based digital-asset programme: trend and carry signals across a defined universe, sized by volatility rather than conviction.'
  },
  {
    icon: Layers,
    title: 'Risk before return',
    body: 'Exposure is capped at the portfolio level, with per-asset limits and a hard drawdown governor that de-risks automatically.'
  },
  {
    icon: Scale,
    title: 'Transparent economics',
    body: 'A single management fee and a performance fee with a high-water mark. No entry fees, no exit penalties, no soft-dollar arrangements.'
  }
];

const PROCESS = [
  { step: '01', title: 'Apply', body: 'Tell us about you or your entity, your experience and intended commitment. Applications are reviewed by a person, not a script.' },
  { step: '02', title: 'Verify', body: 'We confirm identity, entity documents and source of funds — as required by the custodian and by applicable law.' },
  { step: '03', title: 'Fund at the custodian', body: 'Approved investors receive subscription instructions. Cash moves to the licensed custodian, never to a wallet operated by us.' },
  { step: '04', title: 'Track in the portal', body: 'Capital account, statements and documents live in your portal. Subscriptions and redemptions follow the notice period.' }
];

export default async function HomePage() {
  const settings = await getSettings();
  const recent = await prisma.performancePoint
    .findMany({ where: { published: true }, orderBy: { month: 'desc' }, take: 3 })
    .catch(() => []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] glow" />
        <div className="container-x relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="eyebrow">Systematic digital-asset fund</p>
            <h1 className="h1 mt-5">
              Discipline over<br />
              <span className="text-gold">conviction.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-mist">
              apextrailfunds runs a rules-based digital-asset programme for professional investors.
              Positions are sized by risk, checked against hard limits, and reported monthly. Custody sits with a
              licensed third-party custodian — we never hold your assets.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/apply" className="btn-primary">
                Apply for access <ArrowRight size={16} />
              </Link>
              <Link href="/strategy" className="btn-ghost">Read the strategy</Link>
            </div>
            <p className="mt-6 max-w-lg text-[12px] leading-relaxed text-white/40">
              Available to professional and institutional investors only. Capital at risk — you may lose the full
              amount invested. Not an offer where prohibited.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {[
              { k: 'Mandate', v: 'Systematic, long/short' },
              { k: 'Liquidity', v: `${settings.liquidityNoticeDays}-day notice` },
              { k: 'Minimum', v: `$${Number(settings.minSubscription).toLocaleString('en-US')}` }
            ].map((s) => (
              <div key={s.k} className="bg-surface px-6 py-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{s.k}</p>
                <p className="mt-2 font-mono text-[15px] text-white">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mandate */}
      <section className="container-x py-20">
        <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">The mandate</p>
            <h2 className="h2 mt-4">A programme built to be explained in one page.</h2>
            <p className="body mt-5">
              Most digital-asset losses come from position size, not from being wrong about direction. Our programme
              starts from the size of the risk and works backwards: exposure is a function of measured volatility,
              correlation and liquidity, rebalanced on a fixed schedule.
            </p>
            <p className="body mt-4">
              We do not claim to predict prices. We claim that the process is written down, applied consistently, and
              reported in a way a client can audit.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.title} className="card card-hover p-5">
                <p.icon size={18} className="text-gold" strokeWidth={1.7} />
                <p className="mt-4 text-[14.5px] font-medium">{p.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-mist">{p.body}</p>
              </div>
            ))}
            <div className="card card-hover p-5">
              <Lock size={18} className="text-gold" strokeWidth={1.7} />
              <p className="mt-4 text-[14.5px] font-medium">Assets held elsewhere</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist">
                Client cash and assets sit with {settings.custodianName || 'a licensed custodian'}.
                The portal issues instructions and records statements; it cannot move funds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Performance teaser — only real, published data */}
      <section className="border-y border-line bg-[#090b0f]">
        <div className="container-x py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Reported performance</p>
              <h2 className="h2 mt-3">Published monthly, net of fees.</h2>
            </div>
            <Link href="/performance" className="btn-ghost btn-sm">
              Full performance <ArrowRight size={15} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-8">
              <p className="text-[14px] font-medium text-white/80">No performance has been published yet.</p>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-mist">
                Monthly returns appear here once the manager publishes them for the current reporting period. We do
                not show projected, back-tested or illustrative figures on this site.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {recent.map((r) => (
                <div key={r.id} className="bg-surface px-6 py-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{monthLabel(r.month)}</p>
                  <p className="mt-2 font-mono text-2xl text-white">{pct(r.netReturn)}</p>
                  <p className="mt-1 text-[12px] text-mist">Net return, after fees</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-5 max-w-3xl text-[11.5px] leading-relaxed text-white/35">
            Past performance is not a reliable indicator of future results. Figures are net of management and
            performance fees where stated, and are not audited unless the accompanying statement says so.
          </p>
        </div>
      </section>

      {/* Process */}
      <section className="container-x py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="h2 mt-3 max-w-2xl">Four steps, and none of them involve sending crypto to an address we give you.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((s) => (
            <div key={s.step} className="card p-5">
              <p className="font-mono text-[12px] text-gold/80">{s.step}</p>
              <p className="mt-3 text-[14.5px] font-medium">{s.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fees */}
      <section className="container-x pb-20">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-7 md:grid-cols-[1.2fr_1fr] md:p-10">
            <div>
              <p className="eyebrow">Economics</p>
              <h2 className="h2 mt-3">Fees you can compute yourself.</h2>
              <p className="body mt-4">
                {settings.managementFee}% annual management fee, charged monthly on net asset value.
                A {settings.performanceFee}% performance fee applies to new gains above the previous high-water mark.
                There are no subscription, redemption or platform fees.
              </p>
              <Link href="/fees" className="btn-ghost btn-sm mt-6">Fee detail</Link>
            </div>
            <div className="grid gap-4">
              {[
                { k: 'Management', v: `${settings.managementFee}% p.a.` },
                { k: 'Performance', v: `${settings.performanceFee}% over HWM` },
                { k: 'Subscription / redemption', v: 'None' }
              ].map((f) => (
                <div key={f.k} className="flex items-baseline justify-between border-b border-line pb-3">
                  <span className="text-[13px] text-mist">{f.k}</span>
                  <span className="font-mono text-[14px] text-white">{f.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Documents + trust */}
      <section className="container-x pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: FileText, title: 'Offering documents', body: 'Memorandum, subscription agreement and fact sheet, released after eligibility is confirmed.', href: '/documents', cta: 'Document library' },
            { icon: ShieldCheck, title: 'Custody & assurance', body: regulatoryReady(settings) ? `Custody: ${settings.custodianName}. Jurisdiction: ${settings.jurisdiction}.` : 'Custodian, jurisdiction and licence details are published once confirmed by the manager.', href: '/disclosures', cta: 'Risk & disclosures' },
            { icon: LineChart, title: 'Reporting', body: 'Monthly capital-account statements and a written market note, delivered to your portal and by email.', href: '/portal', cta: 'Investor portal' }
          ].map((c) => (
            <div key={c.title} className="card card-hover flex flex-col p-6">
              <c.icon size={18} className="text-gold" strokeWidth={1.7} />
              <p className="mt-4 text-[15px] font-medium">{c.title}</p>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-mist">{c.body}</p>
              <Link href={c.href} className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-white/80 hover:text-white">
                {c.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
          <div className="relative max-w-2xl">
            <h2 className="h2">Start with the documents, not a deposit.</h2>
            <p className="body mt-4">
              Applications are reviewed individually. If the mandate is not a fit for your objectives, we will say so
              before you commit anything.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/apply" className="btn-primary">Apply for access <ArrowRight size={16} /></Link>
              <Link href="/contact" className="btn-ghost">Speak to the team</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
