import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Funding' };

export default async function FundPage() {
  const session = await getSession();
  if (!session) return null;

  const [user, settings, methods] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.uid }, select: { status: true, email: true } }),
    getSettings(),
    prisma.fundingMethod.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })
  ]);

  const approved = user?.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Funding</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Subscription instructions</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Pay only to a destination the manager has confirmed is the custodian’s own account. Always verify details by
          calling the custodian on a number from the offering documents — never from an email alone.
        </p>
      </div>

      {!approved ? (
        <div className="card p-6">
          <EmptyState title="Available after approval">
            Funding instructions unlock once your application is approved and the custodian completes verification.
            Until then, do not send funds to any address you receive by email or chat.
          </EmptyState>
        </div>
      ) : methods.length === 0 ? (
        <div className="card p-6">
          <EmptyState title="No funding channels published">
            The manager has not published subscription destinations. Request them from the team — and treat any
            unsolicited payment details as fraudulent.
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {methods.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-white">{m.label}</p>
                  <p className="mt-1 text-[11.5px] text-mist">
                    {m.kind.replace(/_/g, ' ').toLowerCase()} · {m.currency}
                  </p>
                </div>
                {m.custodianVerified ? (
                  <Badge tone="green">Custodian verified</Badge>
                ) : (
                  <Badge tone="amber">Pending verification</Badge>
                )}
              </div>

              {!m.custodianVerified ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
                  <p className="text-[11.5px] leading-relaxed text-amber-100/85">
                    The manager has not attested these details belong to the custodian. Confirm with the custodian
                    directly before paying anything.
                  </p>
                </div>
              ) : null}

              <dl className="mt-4 space-y-2 text-[12.5px]">
                {[
                  ['Account name', m.accountName],
                  ['Bank', m.bankName],
                  ['Account number', m.accountNumber],
                  ['IBAN', m.iban],
                  ['SWIFT / BIC', m.swift],
                  ['Wallet', m.walletAddress],
                  ['Network', m.network]
                ]
                  .filter(([, v]) => Boolean(v))
                  .map(([k, v]) => (
                    <div key={k as string} className="flex items-start justify-between gap-4 border-b border-line pb-2">
                      <dt className="text-mist">{k}</dt>
                      <dd className="max-w-[60%] break-all text-right font-mono text-[11.5px] text-white/85">{v}</dd>
                    </div>
                  ))}
                <div className="flex items-start justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-mist">Payment reference</dt>
                  <dd className="text-right font-mono text-[11.5px] text-white/85">
                    {m.referenceHint ? `${m.referenceHint}-${user?.email.split('@')[0]}` : user?.email}
                  </dd>
                </div>
              </dl>

              {m.instructions ? (
                <p className="mt-3 text-[12px] leading-relaxed text-mist">{m.instructions}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-line bg-white/[0.02] p-5">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.7} />
        <p className="text-[11.5px] leading-relaxed text-white/45">
          {settings.fundDisplayName} never requests payment to a personal account, never accepts card details by email,
          and never asks for your password or one-time codes. A payment reference is required for same-day allocation.
        </p>
      </div>
    </div>
  );
}
