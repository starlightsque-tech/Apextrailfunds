import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCapitalAccount } from '@/lib/account';
import { date, money, num } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { StatusForm, LedgerForm, DeleteEntryForm, UserEmailForm } from '@/components/admin/forms';
import { PositionForm, ClosePositionForm, MatureForm } from '@/components/admin/catalog-forms';
import { startImpersonation } from '@/actions/admin';

export const dynamic = 'force-dynamic';

export default async function InvestorDetail({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      application: true,
      subscriptions: { orderBy: { createdAt: 'desc' } },
      redemptions: { orderBy: { createdAt: 'desc' } },
      documents: { select: { id: true, title: true, createdAt: true } },
      positions: { orderBy: { startedAt: 'desc' }, include: { plan: true } },
      payoutMethods: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!user) notFound();

  const account = await getCapitalAccount(user.id);
  const today = new Date().toISOString().slice(0, 10);
  const plans = await prisma.plan.findMany({ where: { status: { not: 'CLOSED' } }, orderBy: { sortOrder: 'asc' } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/investors" className="text-[12px] text-mist hover:text-white">← All investors</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="mt-1 text-[13px] text-mist">{user.email} · {user.country ?? '—'} · joined {date(user.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(user.status)}>{user.status}</Badge>
          <StatusForm userId={user.id} status={user.status} />
          <form action={startImpersonation}>
            <input type="hidden" name="userId" value={user.id} />
            <button className="btn-ghost btn-sm border-sky-300/30 text-sky-200" type="submit">
              Sign in as investor
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {[
          { k: 'Capital account', v: money(account.nav, 'USD', 0) },
          { k: 'Contributions', v: money(account.contributions, 'USD', 0) },
          { k: 'Units', v: num(account.units, 4) }
        ].map((s) => (
          <div key={s.k} className="bg-surface px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-mist">{s.k}</p>
            <p className="mt-2 font-mono text-[20px] text-white">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Post a capital entry</p>
          <p className="mt-1 text-[12px] text-mist">Only after the custodian confirms. Keep the settlement reference.</p>
          <div className="mt-4"><LedgerForm userId={user.id} today={today} /></div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <p className="text-[13.5px] font-medium text-white">Application</p>
            {user.application ? (
              <dl className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-2">
                <div><dt className="text-mist">Entity</dt><dd className="text-white/85">{user.application.entityType}</dd></div>
                <div><dt className="text-mist">Experience</dt><dd className="text-white/85">{user.application.experience}</dd></div>
                <div><dt className="text-mist">Intended</dt><dd className="text-white/85">{money(user.application.intendedAmount, 'USD', 0)}</dd></div>
                <div><dt className="text-mist">Status</dt><dd className="text-white/85">{user.application.status}</dd></div>
                {user.application.decisionNote ? (
                  <div className="sm:col-span-2"><dt className="text-mist">Note</dt><dd className="text-white/85">{user.application.decisionNote}</dd></div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-2 text-[12.5px] text-mist">No application on file.</p>
            )}
          </div>

          <div className="card p-5">
            <p className="text-[13.5px] font-medium text-white">Email this investor</p>
            <div className="mt-3"><UserEmailForm userId={user.id} /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4"><p className="text-[13.5px] font-medium text-white">Ledger</p></div>
          <div className="max-h-[360px] overflow-auto">
            <table className="table-x">
              <thead><tr><th>Date</th><th>Type</th><th className="text-right">Amount</th><th>Memo</th><th></th></tr></thead>
              <tbody>
                {account.entries.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-[12px] text-mist">No entries.</td></tr>
                ) : account.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-mist">{date(e.date)}</td>
                    <td className="text-white/85">{e.type}</td>
                    <td className="text-right font-mono text-white/85">{money(e.amount, 'USD', 0)}</td>
                    <td className="max-w-[140px] truncate text-mist">{e.memo || '—'}</td>
                    <td className="text-right"><DeleteEntryForm id={e.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Requests</p>
          <div className="mt-3 space-y-2">
            {[...user.subscriptions.map((r) => ({ ...r, kind: 'Subscription' })), ...user.redemptions.map((r) => ({ ...r, kind: 'Redemption' }))]
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(0, 8)
              .map((r) => (
                <div key={`${r.kind}-${r.id}`} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                  <div>
                    <p className="text-[12.5px] text-white/85">{r.kind} · {money(r.amount, 'USD', 0)}</p>
                    <p className="text-[11px] text-mist">{date(r.createdAt)}</p>
                  </div>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
              ))}
            {user.subscriptions.length === 0 && user.redemptions.length === 0 ? (
              <p className="text-[12.5px] text-mist">No requests.</p>
            ) : null}
          </div>

          <p className="mt-5 text-[11.5px] leading-relaxed text-white/35">
            Documents released privately: {user.documents.length}. Email verification:{' '}
            {user.emailVerified ? 'confirmed' : 'not confirmed'}.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[13.5px] font-medium text-white">Positions</p>
          </div>
          <table className="table-x">
            <thead><tr><th>Programme</th><th className="text-right">Committed</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {user.positions.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-[12px] text-mist">No positions recorded.</td></tr>
              ) : user.positions.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="text-white/90">{p.plan.name}</p>
                    <p className="text-[11px] text-mist">{date(p.startedAt)}</p>
                  </td>
                  <td className="text-right font-mono text-white/85">{money(p.committed, 'USD', 0)}</td>
                  <td><Badge tone={p.status === 'ACTIVE' ? 'green' : 'neutral'}>{p.status}</Badge></td>
                  <td className="text-right">{p.status === 'ACTIVE' ? <ClosePositionForm id={p.id} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {user.positions.some((p) => p.status === 'ACTIVE') ? (
            <div className="border-t border-line p-5">
              <p className="text-[12.5px] font-medium text-white/85">Settle a matured position</p>
              <p className="mt-1 text-[11.5px] text-mist">
                Releases capital back to the investor and posts only the gain the custodian has actually realised.
              </p>
              <div className="mt-3">
                <MatureForm
                  id={user.positions.find((p) => p.status === 'ACTIVE')!.id}
                  today={today}
                />
              </div>
            </div>
          ) : null}
          <div className="border-t border-line p-5">
            {plans.length === 0 ? (
              <p className="text-[12px] text-mist">
                Create an open programme first in <Link href="/admin/plans" className="text-gold hover:underline">Programmes</Link>.
              </p>
            ) : (
              <PositionForm userId={user.id} today={today} plans={plans.map((p) => ({ id: p.id, name: p.name, minAmount: p.minAmount }))} />
            )}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Payout destinations</p>
          {user.payoutMethods.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-mist">None registered.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {user.payoutMethods.map((p) => (
                <div key={p.id} className="rounded-lg border border-line px-3 py-2">
                  <p className="text-[12.5px] text-white/85">{p.label} · {p.currency}</p>
                  <p className="break-all font-mono text-[11px] text-mist">
                    {p.accountName} · {p.iban || p.accountNumber || p.walletAddress} {p.network ? `(${p.network})` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-white/35">
            Payout details are visible to administrators only. Payment must match the account holder name above.
          </p>
        </div>
      </div>
    </div>
  );
}
