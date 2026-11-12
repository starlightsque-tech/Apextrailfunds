import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { money, date } from '@/lib/format';
import { createSubscriptionRequest } from '@/actions/portal';
import RequestForm from '@/components/portal/RequestForm';
import { Badge, statusTone } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Subscribe' };

export default async function SubscribePage() {
  const session = await getSession();
  if (!session) return null;

  const [settings, existing] = await Promise.all([
    getSettings(),
    prisma.subscriptionRequest.findMany({ where: { userId: session.uid }, orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Subscribe</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Request a subscription</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-mist">
          Submitting a request does not move money. The manager reviews it, confirms eligibility and sends custodian
          subscription instructions with the account to pay into.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="card p-5 sm:p-6">
          <RequestForm
            action={createSubscriptionRequest}
            amountLabel={`Commitment amount (USD, minimum ${money(Number(settings.minSubscription), 'USD', 0)})`}
            cta="Submit subscription request"
            hint={`Liquidity: ${settings.liquidityNoticeDays}-day notice after settlement.`}
          />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-[13.5px] font-medium text-white">What happens next</p>
            <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-mist">
              <li>1. Manager review — usually within two business days.</li>
              <li>2. Custodian onboarding: identity, entity and source-of-funds checks.</li>
              <li>3. Subscription agreement issued for signature.</li>
              <li>4. Funds sent to the custodian’s account — never to us.</li>
              <li>5. Entry posted here once settlement is confirmed.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
            <p className="text-[12.5px] font-medium text-amber-200">Fraud warning</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-amber-100/80">
              We will never email you a crypto wallet address, ask for a transfer to an individual’s account, or request
              your password or one-time codes. Confirm instructions with the custodian using contact details in the
              offering documents.
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[13.5px] font-medium text-white">Your requests</p>
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
                <td colSpan={4} className="py-8 text-center text-[12.5px] text-mist">No requests yet.</td>
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
