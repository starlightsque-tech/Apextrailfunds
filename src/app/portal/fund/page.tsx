import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/Field';
import FundingChooser from '@/components/portal/FundingChooser';

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
        <FundingChooser
          email={user?.email ?? ''}
          channels={methods.map((m) => ({
            id: m.id,
            label: m.label,
            kind: m.kind,
            currency: m.currency,
            accountName: m.accountName,
            bankName: m.bankName,
            accountNumber: m.accountNumber,
            iban: m.iban,
            swift: m.swift,
            walletAddress: m.walletAddress,
            network: m.network,
            referenceHint: m.referenceHint,
            instructions: m.instructions,
            custodianVerified: m.custodianVerified
          }))}
        />
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
