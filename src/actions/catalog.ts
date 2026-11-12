'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { recordAudit } from '@/lib/audit';

export type CatalogState = { error?: string; ok?: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Not authorised');
  return session;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(120),
  tagline: z.string().max(200).optional().or(z.literal('')),
  strategy: z.string().min(10, 'Describe the strategy in at least a sentence.').max(4000),
  riskBand: z.enum(['Low', 'Medium', 'Medium-High', 'High']),
  minAmount: z.coerce.number().int().min(1),
  maxAmount: z.coerce.number().int().min(0).optional(),
  targetSize: z.coerce.number().int().min(0).optional(),
  termMonths: z.coerce.number().int().min(0).max(360).optional(),
  liquidityDays: z.coerce.number().int().min(0).max(3650),
  managementFee: z.coerce.number().min(0).max(20),
  performanceFee: z.coerce.number().min(0).max(60),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED']),
  sortOrder: z.coerce.number().int().min(0).max(999).optional()
});

export async function savePlan(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const parsed = planSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    name: formData.get('name'),
    tagline: formData.get('tagline'),
    strategy: formData.get('strategy'),
    riskBand: formData.get('riskBand'),
    minAmount: formData.get('minAmount'),
    maxAmount: formData.get('maxAmount') || undefined,
    targetSize: formData.get('targetSize') || undefined,
    termMonths: formData.get('termMonths') || undefined,
    liquidityDays: formData.get('liquidityDays'),
    managementFee: formData.get('managementFee'),
    performanceFee: formData.get('performanceFee'),
    status: formData.get('status'),
    sortOrder: formData.get('sortOrder') || undefined
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the programme fields.' };
  const d = parsed.data;
  if (d.maxAmount && d.maxAmount > 0 && d.maxAmount < d.minAmount) {
    return { error: 'Maximum per investor must be at least the minimum.' };
  }

  const data = {
    name: d.name,
    tagline: d.tagline || null,
    strategy: d.strategy,
    riskBand: d.riskBand,
    minAmount: d.minAmount,
    maxAmount: d.maxAmount && d.maxAmount > 0 ? d.maxAmount : null,
    targetSize: d.targetSize || null,
    termMonths: d.termMonths || null,
    liquidityDays: d.liquidityDays,
    managementFee: d.managementFee,
    performanceFee: d.performanceFee,
    status: d.status,
    sortOrder: d.sortOrder ?? 0
  };

  if (d.id) {
    await prisma.plan.update({ where: { id: d.id }, data });
    await recordAudit(session.uid, 'plan.updated', d.id, { name: d.name, status: d.status });
  } else {
    let slug = slugify(d.name);
    if (await prisma.plan.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const created = await prisma.plan.create({ data: { ...data, slug } });
    await recordAudit(session.uid, 'plan.created', created.id, { name: d.name });
  }

  revalidatePath('/admin/plans');
  revalidatePath('/plans');
  return { ok: d.id ? 'Programme updated.' : 'Programme created.' };
}

export async function setPlanStatus(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['DRAFT', 'OPEN', 'CLOSED'].includes(status)) return { error: 'Unknown status.' };

  await prisma.plan.update({ where: { id }, data: { status: status as 'DRAFT' | 'OPEN' | 'CLOSED' } });
  await recordAudit(session.uid, 'plan.status_changed', id, { status });
  revalidatePath('/admin/plans');
  revalidatePath('/plans');
  return { ok: `Programme ${status.toLowerCase()}.` };
}

export async function deletePlan(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const positions = await prisma.position.count({ where: { planId: id } });
  if (positions > 0) return { error: `This programme has ${positions} position(s). Close it instead of deleting.` };

  await prisma.plan.delete({ where: { id } });
  await recordAudit(session.uid, 'plan.deleted', id);
  revalidatePath('/admin/plans');
  revalidatePath('/plans');
  return { ok: 'Programme deleted.' };
}

const fundingSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2).max(120),
  kind: z.enum(['BANK_TRANSFER', 'CUSTODIAN_PORTAL', 'STABLECOIN']),
  currency: z.string().min(2).max(10),
  accountName: z.string().min(2).max(160),
  bankName: z.string().max(160).optional().or(z.literal('')),
  accountNumber: z.string().max(64).optional().or(z.literal('')),
  iban: z.string().max(64).optional().or(z.literal('')),
  swift: z.string().max(24).optional().or(z.literal('')),
  walletAddress: z.string().max(200).optional().or(z.literal('')),
  network: z.string().max(60).optional().or(z.literal('')),
  referenceHint: z.string().max(120).optional().or(z.literal('')),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  custodianVerified: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional()
});

export async function saveFundingMethod(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const parsed = fundingSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    label: formData.get('label'),
    kind: formData.get('kind'),
    currency: formData.get('currency'),
    accountName: formData.get('accountName'),
    bankName: formData.get('bankName'),
    accountNumber: formData.get('accountNumber'),
    iban: formData.get('iban'),
    swift: formData.get('swift'),
    walletAddress: formData.get('walletAddress'),
    network: formData.get('network'),
    referenceHint: formData.get('referenceHint'),
    instructions: formData.get('instructions'),
    custodianVerified: formData.get('custodianVerified') === 'on',
    active: formData.get('active') === 'on',
    sortOrder: formData.get('sortOrder') || undefined
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the funding channel fields.' };
  const d = parsed.data;

  const data = {
    label: d.label,
    kind: d.kind,
    currency: d.currency.toUpperCase(),
    accountName: d.accountName,
    bankName: d.bankName || null,
    accountNumber: d.accountNumber || null,
    iban: d.iban || null,
    swift: d.swift || null,
    walletAddress: d.walletAddress || null,
    network: d.network || null,
    referenceHint: d.referenceHint || null,
    instructions: d.instructions || null,
    custodianVerified: Boolean(d.custodianVerified),
    active: Boolean(d.active),
    sortOrder: d.sortOrder ?? 0
  };

  if (d.id) {
    await prisma.fundingMethod.update({ where: { id: d.id }, data });
    await recordAudit(session.uid, 'funding.updated', d.id, { label: d.label });
  } else {
    const created = await prisma.fundingMethod.create({ data });
    await recordAudit(session.uid, 'funding.created', created.id, { label: d.label });
  }

  revalidatePath('/admin/funding');
  revalidatePath('/portal/fund');
  return { ok: d.id ? 'Funding channel updated.' : 'Funding channel added.' };
}

export async function deleteFundingMethod(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  await prisma.fundingMethod.delete({ where: { id } });
  await recordAudit(session.uid, 'funding.deleted', id);
  revalidatePath('/admin/funding');
  revalidatePath('/portal/fund');
  return { ok: 'Funding channel removed.' };
}

const positionSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  committed: z.coerce.number().min(1),
  units: z.coerce.number().min(0).optional(),
  navPerUnit: z.coerce.number().min(0).optional(),
  startedAt: z.string().min(4),
  status: z.enum(['ACTIVE', 'CLOSED'])
});

export async function savePosition(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const parsed = positionSchema.safeParse({
    userId: formData.get('userId'),
    planId: formData.get('planId'),
    committed: formData.get('committed'),
    units: formData.get('units') || undefined,
    navPerUnit: formData.get('navPerUnit') || undefined,
    startedAt: formData.get('startedAt'),
    status: formData.get('status')
  });
  if (!parsed.success) return { error: 'Check the position fields.' };

  const d = parsed.data;
  const created = await prisma.position.create({
    data: {
      userId: d.userId,
      planId: d.planId,
      committed: d.committed,
      units: d.units ?? null,
      navPerUnit: d.navPerUnit ?? null,
      startedAt: new Date(d.startedAt),
      status: d.status
    }
  });
  await recordAudit(session.uid, 'position.created', created.id, { userId: d.userId, planId: d.planId });
  revalidatePath(`/admin/investors/${d.userId}`);
  revalidatePath('/portal/portfolio');
  return { ok: 'Position recorded.' };
}

export async function closePosition(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const position = await prisma.position.update({ where: { id }, data: { status: 'CLOSED', endedAt: new Date() } });
  await recordAudit(session.uid, 'position.closed', id, { userId: position.userId });
  revalidatePath(`/admin/investors/${position.userId}`);
  revalidatePath('/portal/portfolio');
  return { ok: 'Position closed.' };
}

/** Investor-initiated interest in an open programme. */
export async function expressInterest(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in first.' };

  const planId = String(formData.get('planId') ?? '');
  const amount = Number(formData.get('amount') ?? 0);
  const note = String(formData.get('note') ?? '').slice(0, 500);

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.status !== 'OPEN') return { error: 'That programme is not open.' };
  if (!Number.isFinite(amount) || amount < plan.minAmount) {
    return { error: `The minimum for ${plan.name} is ${plan.minAmount.toLocaleString('en-US')} USD.` };
  }
  if (plan.maxAmount && amount > plan.maxAmount) {
    return { error: `The maximum per investor for ${plan.name} is ${plan.maxAmount.toLocaleString('en-US')} USD.` };
  }

  await prisma.planApplication.create({ data: { planId, userId: session.uid, amount, note: note || null } });
  await recordAudit(session.uid, 'plan.interest', planId, { amount });
  revalidatePath('/portal/portfolio');
  return { ok: 'Interest recorded. The manager will confirm eligibility and funding instructions.' };
}


/**
 * Settle a matured position. Capital is only released, and only a realised gain is
 * credited, when the manager records the custodian's settlement — the app never
 * mints profit on a timer.
 */
export async function maturePosition(_prev: CatalogState, formData: FormData): Promise<CatalogState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const realizedGain = Number(formData.get('realizedGain') ?? 0);
  const reference = String(formData.get('reference') ?? '').slice(0, 200);
  const dateValue = String(formData.get('date') ?? '') || new Date().toISOString().slice(0, 10);

  if (!Number.isFinite(realizedGain) || realizedGain < 0) return { error: 'Enter a valid realised gain (0 if none).' };
  if (!reference.trim()) return { error: 'Record the custodian settlement reference.' };

  const position = await prisma.position.findUnique({ where: { id }, include: { plan: true } });
  if (!position) return { error: 'Position not found.' };
  if (position.status === 'CLOSED') return { error: 'That position is already closed.' };

  await prisma.$transaction(async (tx) => {
    await tx.position.update({
      where: { id },
      data: { status: 'CLOSED', endedAt: new Date(`${dateValue}T12:00:00Z`) }
    });
    if (realizedGain > 0) {
      await tx.ledgerEntry.create({
        data: {
          userId: position.userId,
          date: new Date(`${dateValue}T12:00:00Z`),
          type: 'DISTRIBUTION',
          amount: realizedGain,
          memo: `Realised gain — ${position.plan.name} — ${reference}`,
          createdBy: session.email
        }
      });
    }
  });

  await recordAudit(session.uid, 'position.matured', id, { realizedGain, reference });
  revalidatePath(`/admin/investors/${position.userId}`);
  revalidatePath('/portal/portfolio');
  revalidatePath('/portal/account');
  return {
    ok:
      realizedGain > 0
        ? `Position matured. Capital released and ${realizedGain.toFixed(2)} USD realised gain posted.`
        : 'Position matured and capital released. No gain posted.'
  };
}
