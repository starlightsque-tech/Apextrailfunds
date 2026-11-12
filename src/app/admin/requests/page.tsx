import { prisma } from '@/lib/prisma';
import { date, money } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { RequestStatusForm } from '@/components/admin/forms';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  const [subs, reds] = await Promise.all([
    prisma.subscriptionRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true }, take: 60 }),
    prisma.redemptionRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true }, take: 60 })
  ]);

  const table = (rows: typeof subs, kind: 'subscription' | 'redemption') => (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <p className="text-[13.5px] font-medium capitalize text-white">{kind} requests</p>
      </div>
      {rows.length === 0 ? (
        <div className="p-5"><EmptyState title={`No ${kind} requests`} /></div>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-[200px]">
                <p className="text-[13px] text-white/90">{r.user.name}</p>
                <p className="text-[11.5px] text-mist">{r.user.email} · {date(r.createdAt)}</p>
                {r.note ? <p className="mt-1 max-w-sm text-[11.5px] text-mist">“{r.note}”</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] text-white">{money(r.amount, 'USD', 0)}</span>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>
              <RequestStatusForm id={r.id} kind={kind} status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Requests</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Subscription &amp; redemption queue</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Status here is your internal workflow. “Instructed” means the custodian has been given subscription
          instructions; “Settled” should align with the ledger entry you post after cash is confirmed.
        </p>
      </div>
      {table(subs, 'subscription')}
      {table(reds, 'redemption')}
    </div>
  );
}
