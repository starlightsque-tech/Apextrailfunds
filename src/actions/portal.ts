'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { recordAudit } from '@/lib/audit';
import { sendEmail } from '@/lib/email';
import { getSettings } from '@/lib/settings';
import { money } from '@/lib/format';

export type PortalState = { error?: string; ok?: string };

const requestSchema = z.object({
  amount: z.coerce.number().int().min(1).max(1_000_000_000),
  note: z.string().max(1000).optional().or(z.literal(''))
});

export async function createSubscriptionRequest(
  _prev: PortalState,
  formData: FormData
): Promise<PortalState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in first.' };

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return { error: 'Account not found.' };
  if (user.status !== 'ACTIVE') return { error: 'Your account must be approved before you can request a subscription.' };

  const settings = await getSettings();
  const parsed = requestSchema.safeParse({
    amount: formData.get('amount'),
    note: formData.get('note')
  });
  if (!parsed.success) return { error: 'Enter a valid amount.' };
  if (parsed.data.amount < Number(settings.minSubscription)) {
    return { error: `The minimum commitment is ${money(Number(settings.minSubscription), 'USD', 0)}.` };
  }

  const existing = await prisma.subscriptionRequest.findFirst({
    where: { userId: user.id, status: { in: ['REQUESTED', 'INSTRUCTED'] } }
  });
  if (existing) return { error: 'You already have a subscription request in progress.' };

  await prisma.subscriptionRequest.create({
    data: { userId: user.id, amount: parsed.data.amount, note: parsed.data.note || null }
  });

  await recordAudit(user.id, 'subscription.requested', user.id, { amount: parsed.data.amount });

  if (settings.adminEmail) {
    await sendEmail({
      to: settings.adminEmail,
      template: 'admin-new-subscription',
      subject: `New subscription request — ${user.name}`,
      html: `<p><strong>${user.name}</strong> (${user.email}) requested a subscription of ${money(parsed.data.amount, 'USD', 0)}.</p>
             <p>Note: ${parsed.data.note || '—'}</p><p>Review it in the admin panel.</p>`
    });
  }

  revalidatePath('/portal');
  return { ok: 'Request received. The manager will issue custodian subscription instructions by email.' };
}

export async function createRedemptionRequest(_prev: PortalState, formData: FormData): Promise<PortalState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in first.' };

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return { error: 'Account not found.' };
  if (user.status !== 'ACTIVE') return { error: 'Your account is not active.' };

  const payoutMethodId = String(formData.get('payoutMethodId') ?? '') || null;
  if (!payoutMethodId) return { error: 'Choose a payout destination for the redemption.' };
  const payout = await prisma.payoutMethod.findFirst({ where: { id: payoutMethodId, userId: user.id } });
  if (!payout) return { error: 'That payout destination was not found on your account.' };

  const parsed = requestSchema.safeParse({ amount: formData.get('amount'), note: formData.get('note') });
  if (!parsed.success) return { error: 'Enter a valid amount.' };

  // Available balance is derived from the custodian-reported ledger, never from a stored "profit".
  const entries = await prisma.ledgerEntry.findMany({ where: { userId: user.id } });
  const nav = entries.reduce((acc, e) => {
    const amt = Number(e.amount);
    switch (e.type) {
      case 'SUBSCRIPTION':
      case 'DISTRIBUTION':
      case 'ADJUSTMENT':
        return acc + amt;
      case 'WITHDRAWAL':
      case 'FEE':
        return acc - amt;
      default:
        return acc;
    }
  }, 0);

  if (parsed.data.amount > nav) return { error: 'The requested amount exceeds your capital account balance.' };

  await prisma.redemptionRequest.create({
    data: { userId: user.id, amount: parsed.data.amount, note: parsed.data.note || null, payoutMethodId }
  });
  await recordAudit(user.id, 'redemption.requested', user.id, { amount: parsed.data.amount });

  revalidatePath('/portal');
  return { ok: 'Redemption request received. It is processed on the notice period stated in the offering documents.' };
}

export async function cancelRequest(kind: 'subscription' | 'redemption', id: string) {
  const session = await getSession();
  if (!session) return;
  if (kind === 'subscription') {
    await prisma.subscriptionRequest.updateMany({
      where: { id, userId: session.uid, status: 'REQUESTED' },
      data: { status: 'CANCELLED' }
    });
  } else {
    await prisma.redemptionRequest.updateMany({
      where: { id, userId: session.uid, status: 'REQUESTED' },
      data: { status: 'CANCELLED' }
    });
  }
  revalidatePath('/portal');
  await recordAudit(session.uid, `${kind}.cancelled`, id);
}


const payoutSchema = z.object({
  kind: z.enum(['BANK_ACCOUNT', 'STABLECOIN_WALLET']),
  label: z.string().min(2).max(80),
  currency: z.string().min(2).max(10),
  accountName: z.string().min(2).max(160),
  bankName: z.string().max(160).optional().or(z.literal('')),
  accountNumber: z.string().max(64).optional().or(z.literal('')),
  iban: z.string().max(64).optional().or(z.literal('')),
  swift: z.string().max(24).optional().or(z.literal('')),
  walletAddress: z.string().max(200).optional().or(z.literal('')),
  network: z.string().max(60).optional().or(z.literal(''))
});

export async function addPayoutMethod(_prev: PortalState, formData: FormData): Promise<PortalState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in first.' };
  if (session.imp) return { error: 'Payout destinations cannot be changed while support access is active.' };

  const parsed = payoutSchema.safeParse({
    kind: formData.get('kind'),
    label: formData.get('label'),
    currency: formData.get('currency'),
    accountName: formData.get('accountName'),
    bankName: formData.get('bankName'),
    accountNumber: formData.get('accountNumber'),
    iban: formData.get('iban'),
    swift: formData.get('swift'),
    walletAddress: formData.get('walletAddress'),
    network: formData.get('network')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the payout details.' };
  const d = parsed.data;

  if (d.kind === 'BANK_ACCOUNT' && !d.accountNumber && !d.iban) {
    return { error: 'Enter an account number or IBAN.' };
  }
  if (d.kind === 'STABLECOIN_WALLET' && !d.walletAddress) {
    return { error: 'Enter the wallet address.' };
  }

  const existing = await prisma.payoutMethod.count({ where: { userId: session.uid } });
  if (existing >= 10) return { error: 'You have reached the maximum of 10 payout destinations.' };

  await prisma.payoutMethod.create({
    data: {
      userId: session.uid,
      kind: d.kind,
      label: d.label,
      currency: d.currency.toUpperCase(),
      accountName: d.accountName,
      bankName: d.bankName || null,
      accountNumber: d.accountNumber || null,
      iban: d.iban || null,
      swift: d.swift || null,
      walletAddress: d.walletAddress || null,
      network: d.network || null
    }
  });

  await recordAudit(session.uid, 'payout.added', session.uid, { kind: d.kind, label: d.label });
  revalidatePath('/portal/payouts');
  revalidatePath('/portal/redeem');
  return { ok: 'Payout destination saved. Payments must match the account holder name.' };
}

export async function removePayoutMethod(formData: FormData) {
  const session = await getSession();
  if (!session || session.imp) return;
  const id = String(formData.get('id') ?? '');
  await prisma.payoutMethod.deleteMany({ where: { id, userId: session.uid } });
  await recordAudit(session.uid, 'payout.removed', id);
  revalidatePath('/portal/payouts');
  revalidatePath('/portal/redeem');
}
