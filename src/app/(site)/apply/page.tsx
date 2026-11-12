import ApplyForm from '@/components/forms/ApplyForm';
import { getSettings } from '@/lib/settings';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Apply for access' };

export default async function ApplyPage() {
  const s = await getSettings();

  return (
    <div className="container-x py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="eyebrow">Application</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Apply for access</h1>
          <p className="body mt-5">
            This is a reviewed application, not a signup. Tell us who you are and how you invest; the manager reviews
            each application and confirms eligibility before any documents or subscription instructions are released.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { k: 'Minimum commitment', v: money(Number(s.minSubscription), 'USD', 0) },
              { k: 'Liquidity', v: `${s.liquidityNoticeDays}-day notice` },
              { k: 'Eligibility', v: 'Professional / high-net-worth investors' },
              { k: 'Verification', v: 'Identity and source of funds, before funding' }
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between border-b border-line pb-2.5">
                <span className="text-[13px] text-mist">{r.k}</span>
                <span className="text-right text-[13px] font-medium text-white">{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-line bg-white/[0.02] p-5">
            <p className="text-[13px] font-medium text-white/85">What happens after you apply</p>
            <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-mist">
              <li>1. You receive a confirmation email and a portal account.</li>
              <li>2. The manager reviews your answers and may request documents.</li>
              <li>3. If approved, you receive the offering documents and custodian subscription instructions.</li>
              <li>4. We never ask you to send funds to a wallet address in an email.</li>
            </ol>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <ApplyForm minSubscription={s.minSubscription} />
        </div>
      </div>
    </div>
  );
}
