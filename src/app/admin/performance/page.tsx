import { prisma } from '@/lib/prisma';
import { monthLabel, pct, num } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { PerformanceForm, TogglePublishForm } from '@/components/admin/forms';

export const dynamic = 'force-dynamic';

export default async function AdminPerformancePage() {
  const points = await prisma.performancePoint.findMany({ orderBy: { month: 'desc' } });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Performance</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Publish monthly returns</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Enter the net return for a completed month. Drafts are invisible to investors. Publishing adds the month to
          the public performance page.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Add or update a month</p>
          <div className="mt-4"><PerformanceForm /></div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4"><p className="text-[13.5px] font-medium text-white">Published &amp; drafts</p></div>
          <div className="max-h-[420px] overflow-auto">
            <table className="table-x">
              <thead><tr><th>Month</th><th className="text-right">Net</th><th className="text-right">NAV</th><th>State</th><th></th></tr></thead>
              <tbody>
                {points.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[12.5px] text-mist">No months entered.</td></tr>
                ) : points.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap text-white/85">{monthLabel(p.month)}</td>
                    <td className={`text-right font-mono ${p.netReturn < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{pct(p.netReturn)}</td>
                    <td className="text-right font-mono text-mist">{p.navPerUnit ? num(p.navPerUnit, 4) : '—'}</td>
                    <td><Badge tone={p.published ? 'green' : 'neutral'}>{p.published ? 'Published' : 'Draft'}</Badge></td>
                    <td className="text-right"><TogglePublishForm id={p.id} published={p.published} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white/[0.02] p-4">
        <p className="text-[12px] leading-relaxed text-white/45">
          Only publish figures you can support with the administrator’s report. Marketing rules in most jurisdictions
          prohibit presenting hypothetical or back-tested returns as actual performance, and prohibit implying that
          past results will repeat.
        </p>
      </div>
    </div>
  );
}
