import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { monthLabel, num, pct } from '@/lib/format';
import PerformanceChart from '@/components/charts/PerformanceChart';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Performance' };

export default async function PerformancePage() {
  const settings = await getSettings();
  const points = await prisma.performancePoint
    .findMany({ where: { published: true }, orderBy: { month: 'asc' } })
    .catch(() => []);

  let cumulative = 0;
  const series = points.map((p) => {
    cumulative = (1 + cumulative / 100) * (1 + p.netReturn / 100) * 100 - 100;
    return {
      label: monthLabel(p.month),
      monthly: Number(p.netReturn.toFixed(2)),
      cumulative: Number(cumulative.toFixed(2))
    };
  });

  const latest = points.at(-1);

  return (
    <div className="container-x py-16 sm:py-20">
      <p className="eyebrow">Performance</p>
      <h1 className="h1 mt-4 max-w-3xl">Reported monthly, net of fees.</h1>
      <p className="body mt-6 max-w-2xl">
        Figures below are published by the manager for completed months. They are net of the management fee and, where
        a high-water mark was exceeded, the performance fee. Where a month has not been published, it is not estimated.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {[
          { k: 'Latest month', v: latest ? monthLabel(latest.month) : '—' },
          { k: 'Latest net return', v: latest ? pct(latest.netReturn) : '—' },
          { k: 'NAV per unit', v: latest?.navPerUnit ? `$${num(latest.navPerUnit, 4)}` : '—' }
        ].map((s) => (
          <div key={s.k} className="bg-surface px-6 py-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{s.k}</p>
            <p className="mt-2 font-mono text-xl text-white">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 card p-5 sm:p-7">
        {series.length === 0 ? (
          <EmptyState title="No published performance yet">
            Monthly returns appear here once the manager publishes them for a completed reporting period.
            This site does not display hypothetical, back-tested or projected figures.
          </EmptyState>
        ) : (
          <PerformanceChart data={series} />
        )}
      </div>

      {points.length > 0 ? (
        <div className="mt-6 card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-x">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-right">Net return</th>
                  <th className="text-right">Gross return</th>
                  <th className="text-right">NAV / unit</th>
                  <th className="text-right">AUM</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.id}>
                    <td>{monthLabel(p.month)}</td>
                    <td className={`text-right font-mono ${p.netReturn < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {pct(p.netReturn)}
                    </td>
                    <td className="text-right font-mono text-white/70">{pct(p.grossReturn)}</td>
                    <td className="text-right font-mono text-white/70">
                      {p.navPerUnit ? `$${num(p.navPerUnit, 4)}` : '—'}
                    </td>
                    <td className="text-right font-mono text-white/70">
                      {p.aum ? `$${num(p.aum, 0)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-line bg-white/[0.02] p-6">
        <p className="text-[13px] font-medium text-white/80">Important</p>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-mist">
          <li>• Past performance is not a reliable indicator of future results.</li>
          <li>• Returns are reported in USD and are unaudited unless the accompanying statement states otherwise.</li>
          <li>• Individual investor returns differ from fund returns because of subscription timing, fees and roundings.</li>
          <li>• Digital assets can fall sharply and liquidity can disappear; you may lose your entire investment.</li>
          {!settings.auditorName ? (
            <li>• No auditor has been engaged or named for the figures shown. Ask the manager for the current audited statements.</li>
          ) : (
            <li>• Auditor: {settings.auditorName}.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
