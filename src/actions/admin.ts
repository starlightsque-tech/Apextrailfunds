'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, setSessionCookie, type SessionPayload } from '@/lib/session';
import { redirect } from 'next/navigation';
import { recordAudit } from '@/lib/audit';
import { sendApplicationDecision, sendBroadcast, sendEmail } from '@/lib/email';
import { getSettings } from '@/lib/settings';
import { money } from '@/lib/format';

export type AdminState = { error?: string; ok?: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Not authorised');
  return session;
}

export async function reviewApplication(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const note = String(formData.get('note') ?? '').slice(0, 2000);

  if (!['APPROVED', 'REJECTED'].includes(decision)) return { error: 'Choose a decision.' };

  const application = await prisma.application.findUnique({ where: { id }, include: { user: true } });
  if (!application) return { error: 'Application not found.' };

  const approved = decision === 'APPROVED';
  await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { status: approved ? 'APPROVED' : 'REJECTED', decisionNote: note || null, reviewedBy: session.email, reviewedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: application.userId },
      data: { status: approved ? 'ACTIVE' : application.user.status }
    })
  ]);

  await sendApplicationDecision(application.user, approved, note);
  await recordAudit(session.uid, `application.${decision.toLowerCase()}`, application.userId);
  revalidatePath('/admin/applications');
  revalidatePath('/admin');
  return { ok: `Application ${approved ? 'approved' : 'declined'} and the investor notified.` };
}

export async function setUserStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['ACTIVE', 'SUSPENDED', 'APPLICANT'].includes(status)) return { error: 'Unknown status.' };

  await prisma.user.update({ where: { id: userId }, data: { status: status as 'ACTIVE' | 'SUSPENDED' | 'APPLICANT' } });
  await recordAudit(session.uid, 'user.status_changed', userId, { status });
  revalidatePath('/admin/investors');
  revalidatePath(`/admin/investors/${userId}`);
  return { ok: 'Status updated.' };
}

const entrySchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(4),
  type: z.enum(['SUBSCRIPTION', 'WITHDRAWAL', 'DISTRIBUTION', 'FEE', 'ADJUSTMENT']),
  amount: z.coerce.number().finite().min(0),
  units: z.coerce.number().finite().min(0).optional(),
  navPerUnit: z.coerce.number().finite().min(0).optional(),
  memo: z.string().max(500).optional().or(z.literal(''))
});

export async function addLedgerEntry(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = entrySchema.safeParse({
    userId: formData.get('userId'),
    date: formData.get('date'),
    type: formData.get('type'),
    amount: formData.get('amount'),
    units: formData.get('units') || undefined,
    navPerUnit: formData.get('navPerUnit') || undefined,
    memo: formData.get('memo')
  });
  if (!parsed.success) return { error: 'Check the entry fields — amount and date are required.' };
  if (parsed.data.amount <= 0) return { error: 'Amount must be greater than zero.' };

  const entry = await prisma.ledgerEntry.create({
    data: {
      userId: parsed.data.userId,
      date: new Date(parsed.data.date),
      type: parsed.data.type,
      amount: parsed.data.amount,
      units: parsed.data.units ?? null,
      navPerUnit: parsed.data.navPerUnit ?? null,
      memo: parsed.data.memo || null,
      createdBy: session.email
    }
  });
  await recordAudit(session.uid, 'ledger.entry_created', parsed.data.userId, {
    type: entry.type,
    amount: entry.amount.toString()
  });
  revalidatePath(`/admin/investors/${parsed.data.userId}`);
  revalidatePath('/admin/ledger');
  return { ok: 'Entry posted to the capital account.' };
}

export async function deleteLedgerEntry(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const entry = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!entry) return { error: 'Entry not found.' };

  await prisma.ledgerEntry.delete({ where: { id } });
  await recordAudit(session.uid, 'ledger.entry_deleted', entry.userId, { id });
  revalidatePath(`/admin/investors/${entry.userId}`);
  revalidatePath('/admin/ledger');
  return { ok: 'Entry removed.' };
}

export async function upsertPerformance(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const month = String(formData.get('month') ?? '');
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: 'Month must be in YYYY-MM format.' };

  const net = Number(formData.get('netReturn'));
  if (!Number.isFinite(net)) return { error: 'Enter a numeric net return.' };

  const grossRaw = String(formData.get('grossReturn') ?? '');
  const navRaw = String(formData.get('navPerUnit') ?? '');
  const aumRaw = String(formData.get('aum') ?? '');
  const published = formData.get('published') === 'on';

  await prisma.performancePoint.upsert({
    where: { month },
    update: {
      netReturn: net,
      grossReturn: grossRaw ? Number(grossRaw) : null,
      navPerUnit: navRaw ? Number(navRaw) : null,
      aum: aumRaw ? Number(aumRaw) : null,
      published
    },
    create: {
      month,
      netReturn: net,
      grossReturn: grossRaw ? Number(grossRaw) : null,
      navPerUnit: navRaw ? Number(navRaw) : null,
      aum: aumRaw ? Number(aumRaw) : null,
      published
    }
  });

  await recordAudit(session.uid, 'performance.upserted', month, { net, published });
  revalidatePath('/admin/performance');
  revalidatePath('/performance');
  return { ok: `${month} saved${published ? ' and published' : ' as draft'}.` };
}

export async function togglePerformance(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const point = await prisma.performancePoint.findUnique({ where: { id } });
  if (!point) return { error: 'Not found.' };
  await prisma.performancePoint.update({ where: { id }, data: { published: !point.published } });
  await recordAudit(session.uid, 'performance.toggled', point.month, { published: !point.published });
  revalidatePath('/admin/performance');
  revalidatePath('/performance');
  return { ok: point.published ? 'Unpublished.' : 'Published.' };
}

const SETTING_KEYS = [
  'fundDisplayName',
  'fundLegalName',
  'custodianName',
  'jurisdiction',
  'licenceRef',
  'auditorName',
  'adminEmail',
  'fromEmail',
  'minSubscription',
  'liquidityNoticeDays',
  'managementFee',
  'performanceFee',
  'addressLine',
  'complianceApproved'
] as const;

export async function saveSettings(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  for (const key of SETTING_KEYS) {
    if (!formData.has(key)) continue;
    const value = String(formData.get(key) ?? '').slice(0, 500);
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  const settings = await getSettings();
  const ready = Boolean(settings.fundLegalName && settings.custodianName && settings.jurisdiction && settings.licenceRef);
  if (!ready && formData.get('complianceApproved') === 'on') {
    return { error: 'Cannot mark regulatory details as approved until entity, jurisdiction, licence and custodian are filled in.' };
  }

  await recordAudit(session.uid, 'settings.saved');
  revalidatePath('/admin/settings');
  revalidatePath('/disclosures');
  return { ok: 'Settings saved.' };
}

export async function uploadDocument(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const file = formData.get('file');
  const title = String(formData.get('title') ?? '').trim();
  const category = String(formData.get('category') ?? 'OTHER');
  const visibility = String(formData.get('visibility') ?? 'PUBLIC');
  const ownerEmail = String(formData.get('ownerEmail') ?? '').trim().toLowerCase();

  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file to upload.' };
  if (file.size > 9 * 1024 * 1024) return { error: 'Files are limited to 9 MB.' };
  if (!title) return { error: 'Give the document a title.' };

  let ownerId: string | null = null;
  if (ownerEmail) {
    const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!owner) return { error: 'No investor found with that email.' };
    ownerId = owner.id;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await prisma.document.create({
    data: {
      title,
      category: category as 'FACT_SHEET' | 'FINANCIAL_STATEMENT' | 'LEGAL' | 'TAX' | 'OTHER',
      visibility: visibility as 'PUBLIC' | 'INVESTOR' | 'PRIVATE',
      ownerId,
      filename: file.name || 'document.pdf',
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      data: buffer,
      uploadedBy: session.email
    }
  });

  await recordAudit(session.uid, 'document.uploaded', title, { visibility, ownerEmail: ownerEmail || null });
  revalidatePath('/admin/documents');
  revalidatePath('/documents');
  return { ok: 'Document uploaded.' };
}

export async function removeDocument(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return { error: 'Not found.' };
  await prisma.document.delete({ where: { id } });
  await recordAudit(session.uid, 'document.deleted', id, { title: doc.title });
  revalidatePath('/admin/documents');
  revalidatePath('/documents');
  return { ok: 'Document removed.' };
}

export async function broadcastEmail(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!subject || body.length < 5) return { error: 'Add a subject and a message.' };

  const recipients = await prisma.user.findMany({
    where: { status: 'ACTIVE', emailOptOut: false, role: 'INVESTOR' },
    select: { id: true, email: true, name: true }
  });
  if (recipients.length === 0) return { error: 'There are no active, opted-in investors to email.' };

  const html = body
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  const result = await sendBroadcast(recipients, subject, html);
  await recordAudit(session.uid, 'email.broadcast', undefined, { subject, ...result });
  revalidatePath('/admin/email');
  return { ok: `Queued ${result.sent + result.failed} recipient(s): ${result.sent} accepted, ${result.failed} failed.` };
}

export async function sendTestEmail(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const to = String(formData.get('to') ?? '').trim();
  if (!to) return { error: 'Enter a destination address.' };
  const settings = await getSettings();

  const result = await sendEmail({
    to,
    template: 'test',
    subject: `${settings.fundDisplayName} — email test`,
    html: `<p>This is a test message from your apextrailfunds portal.</p><p>If you can read it, transactional email is wired up correctly.</p>`
  });

  return result.ok
    ? { ok: (result as { queued?: boolean }).queued ? 'No provider configured — message stored in the outbox.' : 'Test sent.' }
    : { error: (result as { error?: string }).error ?? 'Send failed.' };
}

export async function updateRequestStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const kind = String(formData.get('kind') ?? '');
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const adminNote = String(formData.get('adminNote') ?? '').slice(0, 1000);

  if (!['REQUESTED', 'INSTRUCTED', 'SETTLED', 'CANCELLED'].includes(status)) return { error: 'Unknown status.' };

  if (kind === 'subscription') {
    const req = await prisma.subscriptionRequest.update({ where: { id }, data: { status: status as 'REQUESTED', adminNote: adminNote || null } });
    await recordAudit(session.uid, 'subscription.updated', req.userId, { status });
  } else {
    const req = await prisma.redemptionRequest.update({ where: { id }, data: { status: status as 'REQUESTED', adminNote: adminNote || null } });
    await recordAudit(session.uid, 'redemption.updated', req.userId, { status });
  }

  revalidatePath('/admin/requests');
  return { ok: 'Request updated.' };
}

export async function sendUserEmail(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!subject || !body) return { error: 'Add a subject and message.' };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'User not found.' };

  const result = await sendEmail({
    to: user.email,
    userId: user.id,
    template: 'admin-message',
    subject,
    html: body.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
  });

  await recordAudit(session.uid, 'email.user_sent', userId, { subject });
  return result.ok ? { ok: 'Message queued.' } : { error: (result as { error?: string }).error ?? 'Send failed.' };
}

export async function recordDepositConfirmed(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const amount = Number(formData.get('amount') ?? 0);
  if (!userId || !Number.isFinite(amount) || amount <= 0) return { error: 'Provide an investor and an amount.' };

  await prisma.ledgerEntry.create({
    data: {
      userId,
      date: new Date(),
      type: 'SUBSCRIPTION',
      amount,
      memo: `Settlement confirmed by ${session.email} — ${money(amount, 'USD', 0)}`,
      createdBy: session.email
    }
  });
  await recordAudit(session.uid, 'ledger.settlement_confirmed', userId, { amount });
  revalidatePath(`/admin/investors/${userId}`);
  return { ok: 'Settlement entry posted.' };
}


/**
 * Support access: an administrator can open an investor's portal without their
 * password. Every start and stop is audited, the portal shows a persistent
 * banner, and profile/password changes are blocked for the impersonated session.
 */
export async function startImpersonation(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true }
  });
  if (!target) redirect('/admin/investors');
  if (target.role === 'ADMIN') redirect('/admin/investors');

  const payload: SessionPayload = {
    uid: target.id,
    role: 'INVESTOR',
    email: target.email,
    name: target.name,
    imp: session.uid
  };

  await setSessionCookie(payload);
  await recordAudit(session.uid, 'support.impersonation_started', target.id, { email: target.email });
  redirect('/portal');
}

export async function stopImpersonation() {
  const session = await getSession();
  if (!session?.imp) redirect('/admin');

  const admin = await prisma.user.findUnique({
    where: { id: session.imp },
    select: { id: true, email: true, name: true, role: true }
  });
  if (!admin || admin.role !== 'ADMIN') redirect('/login');

  await setSessionCookie({ uid: admin.id, role: 'ADMIN', email: admin.email, name: admin.name });
  await recordAudit(admin.id, 'support.impersonation_ended', session.uid, { email: session.email });
  redirect(`/admin/investors/${session.uid}`);
}
