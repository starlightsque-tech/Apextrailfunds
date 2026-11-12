import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import Link from 'next/link';
import { getCapitalAccount } from '@/lib/account';
import { money, date } from '@/lib/format';
import { createRedemptionRequest } from '@/actions/portal';
import RequestForm from '@/components/portal/RequestForm';
import { Badge, statusTone } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Redeem' };

export default async function RedeemPage() {
  const session = await getSession();
  if (!session) return null;

  const [settings, account, existing, payouts] = await Promise.all([
    getSettings(),
    getCapitalAccount(session.uid),
    prisma.redemptionRequest.findMany({ where: { userId: session.uid }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.payoutMethod.findMany({ where: { userId: session.uid }, orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Redeem</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Request a redemption</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-mist">
          Redemptions are processed on {settings.liquidityNoticeDays} days’ notice and paid from the custodian to your
          verified bank or wallet destination. The manager may suspend redemptions where markets are disorderly, as
          permitted by the offering documents.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="card p-5 sm:p-6">
          <div className="mb-5 flex items-baseline justify-between border-b border-line pb-3">
            <span className="text-[12.5px] text-mist">Available (custodian-confirmed)</span>
            <span className="font-mono text-[14px] text-white">{money(account.nav, 'USD', 0)}</span>
          </div>
          {payouts.length === 0 ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
              <p className="text-[12.5px] text-amber-100/90">
                Add a payout destination before requesting a redemption.
              </p>
              <Link href="/portal/payouts" className="btn-ghost btn-sm mt-3">Add payout destination</Link>
            </div>
          ) : (
            <RequestForm
              action={createRedemptionRequest}
              amountLabel="Redemption amount (USD)"
              cta="Submit redemption request"
              hint={`Notice period: ${settings.liquidityNoticeDays} days. Partial redemptions are permitted.`}
            >
              <div>
                <label className="label" htmlFor="payoutMethodId">Pay out to</label>
                <select id="payoutMethodId" name="payoutMethodId" className="input" required>
                  {payouts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} · {p.kind === 'BANK_ACCOUNT' ? 'Bank' : 'Wallet'} · {p.currency}
                    </option>
                  ))}
                </select>
              </div>
            </RequestForm>
          )}
        </div>

        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Before you submit</p>
          <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-mist">
            <li>• Payment destination must match the verified account holder name.</li>
            <li>• Third-party payments are not permitted.</li>
            <li>• A redemption fee does not apply; network or bank charges may be deducted at cost.</li>
            <li>• Requests cannot be withdrawn once processing has begun.</li>
          </ul>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[13.5px] font-medium text-white">Redemption requests</p>
        </div>
        <table className="table-x">
          <thead>
            <tr>
              <th>Submitted</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th>Manager note</th>
            </tr>
          </thead>
          <tbody>
            {existing.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[12.5px] text-mist">No redemption requests.</td>
              </tr>
            ) : (
              existing.map((r) => (
                <tr key={r.id}>
                  <td className="text-mist">{date(r.createdAt)}</td>
                  <td className="text-right font-mono text-white/85">{money(r.amount, 'USD', 0)}</td>
                  <td><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                  <td className="text-mist">{r.adminNote || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
