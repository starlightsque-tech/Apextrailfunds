import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { date } from '@/lib/format';
import { PayoutForm } from '@/components/portal/CatalogForms';
import { removePayoutMethod } from '@/actions/portal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payout destinations' };

function mask(value: string | null) {
  if (!value) return null;
  const clean = value.replace(/\s+/g, '');
  return clean.length <= 6 ? clean : `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

export default async function PayoutsPage() {
  const session = await getSession();
  if (!session) return null;

  const methods = await prisma.payoutMethod.findMany({ where: { userId: session.uid }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Payouts</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Where redemptions are paid</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Add a destination in your own name. Third-party payments are not permitted, and a change of destination may
          require re-verification before the next redemption.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Add a destination</p>
          <div className="mt-4"><PayoutForm /></div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[13.5px] font-medium text-white">Saved destinations</p>
          </div>
          {methods.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No payout destinations yet">
                You must add one before submitting a redemption request.
              </EmptyState>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] text-white/90">
                      {m.label}
                      <Badge tone={m.kind === 'BANK_ACCOUNT' ? 'neutral' : 'gold'}>
                        {m.kind === 'BANK_ACCOUNT' ? 'Bank' : 'Wallet'}
                      </Badge>
                    </p>
                    <p className="truncate text-[11.5px] text-mist">
                      {m.accountName} · {mask(m.iban) ?? mask(m.accountNumber) ?? mask(m.walletAddress)} · {m.currency}
                    </p>
                    <p className="text-[11px] text-white/30">Added {date(m.createdAt)}</p>
                  </div>
                  <form action={removePayoutMethod}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="text-[11.5px] text-rose-300/80 hover:text-rose-300" type="submit">remove</button>
                  </form>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-line px-5 py-3">
            <Link href="/portal/redeem" className="text-[12.5px] text-gold hover:underline">Request a redemption →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
