import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = { title: 'Strategy' };

const SIGNALS = [
  { title: 'Trend', body: 'Time-series momentum across daily and weekly windows, filtered for liquidity so a signal is tradeable at the size we need.' },
  { title: 'Carry', body: 'Funding and basis differentials between spot and perpetual markets, expressed only where the collateral path is operationally clean.' },
  { title: 'Dispersion', body: 'Relative-value positions between correlated majors, entered when the spread deviates beyond its trailing distribution.' }
];

const RISK = [
  ['Gross exposure cap', '200% of NAV'],
  ['Single-asset cap', '25% of NAV'],
  ['Drawdown governor', 'De-risk 50% at −8% rolling drawdown'],
  ['Rebalance cadence', 'Weekly, or intraday on a limit breach'],
  ['Leverage', 'Only via collateralised venues under the custodian agreement'],
  ['Universe', 'Liquid majors and approved derivatives only']
];

export default function StrategyPage() {
  return (
    <div className="container-x py-16 sm:py-20">
      <p className="eyebrow">Strategy</p>
      <h1 className="h1 mt-4 max-w-3xl">Rules written before the trade.</h1>
      <p className="body mt-6 max-w-2xl">
        The programme combines three return sources under one risk budget. Each has an entry condition, an exit
        condition and a maximum size that is set in advance — not adjusted after the fact.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {SIGNALS.map((s, i) => (
          <div key={s.title} className="card p-6">
            <p className="font-mono text-[12px] text-gold/80">0{i + 1}</p>
            <p className="mt-3 text-[15px] font-medium">{s.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-mist">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-10 md:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="h2">Risk framework</h2>
          <p className="body mt-4">
            Limits are enforced in the execution layer, not left to discretion. If a limit is breached, the book is
            reduced on the next cycle and the breach is logged for the monthly report.
          </p>
          <p className="body mt-4">
            Borrowing, if used at all, is arranged through the custodian’s collateral programme. We do not accept
            client assets into wallets we control, and we do not lend client assets to third parties.
          </p>
        </div>
        <div className="card divide-y divide-line">
          {RISK.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-6 px-5 py-3.5">
              <span className="text-[13px] text-mist">{k}</span>
              <span className="text-right font-mono text-[12.5px] text-white/90">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 card p-7">
        <h2 className="h3">What this strategy does not do</h2>
        <ul className="mt-4 grid gap-3 text-[13px] leading-relaxed text-mist sm:grid-cols-2">
          <li>• It does not target a fixed daily, weekly or monthly return.</li>
          <li>• It does not guarantee capital or protect against total loss.</li>
          <li>• It does not trade on inside information, and holds no illiquid tokens by design.</li>
          <li>• It does not accept deposits into privately controlled wallets.</li>
        </ul>
        <Link href="/apply" className="btn-primary btn-sm mt-6">
          Apply for access <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
