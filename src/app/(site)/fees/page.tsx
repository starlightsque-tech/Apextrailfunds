import { getSettings } from '@/lib/settings';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Fees' };

export default async function FeesPage() {
  const s = await getSettings();
  const mgmt = Number(s.managementFee);
  const perf = Number(s.performanceFee);
  const sample = 100000;
  const mgmtCost = (sample * mgmt) / 100;
  const gain = sample * 0.1;
  const perfCost = (gain * perf) / 100;

  return (
    <div className="container-x py-16 sm:py-20">
      <p className="eyebrow">Fees</p>
      <h1 className="h1 mt-4 max-w-3xl">Two fees. No surprises.</h1>
      <p className="body mt-6 max-w-2xl">
        Fees are set out in the offering memorandum. The figures below are the current standard terms and are shown
        before any investor-specific arrangement agreed in writing with the manager.
      </p>

      <div className="mt-10 card overflow-hidden">
        <table className="table-x">
          <thead>
            <tr>
              <th>Fee</th>
              <th>Basis</th>
              <th className="text-right">Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium text-white">Management fee</td>
              <td className="text-mist">Accrued daily, charged monthly on net asset value</td>
              <td className="text-right font-mono">{mgmt.toFixed(2)}% p.a.</td>
            </tr>
            <tr>
              <td className="font-medium text-white">Performance fee</td>
              <td className="text-mist">On new gains above the previous high-water mark, crystallised annually</td>
              <td className="text-right font-mono">{perf}%</td>
            </tr>
            <tr>
              <td className="font-medium text-white">Subscription fee</td>
              <td className="text-mist">—</td>
              <td className="text-right font-mono">0%</td>
            </tr>
            <tr>
              <td className="font-medium text-white">Redemption fee</td>
              <td className="text-mist">{s.liquidityNoticeDays}-day notice, no penalty</td>
              <td className="text-right font-mono">0%</td>
            </tr>
            <tr>
              <td className="font-medium text-white">Custody &amp; administration</td>
              <td className="text-mist">Charged by the custodian, passed through at cost</td>
              <td className="text-right font-mono">At cost</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <p className="eyebrow">Worked example</p>
          <p className="mt-3 text-[13px] leading-relaxed text-mist">
            On a {money(sample, 'USD', 0)} account held for a full year, with a 10% gross gain:
          </p>
          <div className="mt-4 space-y-2.5 text-[13px]">
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-mist">Management fee</span>
              <span className="font-mono text-white">{money(mgmtCost)}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-mist">Performance fee (on {money(gain, 'USD', 0)} gain)</span>
              <span className="font-mono text-white">{money(perfCost)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-white/80">Net to investor before custody costs</span>
              <span className="font-mono text-gold">{money(sample + gain - mgmtCost - perfCost, 'USD', 0)}</span>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <p className="eyebrow">What we do not charge</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-mist">
            <li>• No entry or exit load.</li>
            <li>• No platform or account fee.</li>
            <li>• No soft-dollar or rebate arrangements with venues.</li>
            <li>• No fee on capital that has not appreciated above the high-water mark.</li>
          </ul>
          <p className="mt-5 text-[11.5px] leading-relaxed text-white/35">
            The example is illustrative arithmetic, not a projection of returns. Fees reduce returns.
          </p>
        </div>
      </div>
    </div>
  );
}
