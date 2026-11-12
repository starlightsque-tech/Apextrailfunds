'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, clearSessionCookie, getSession } from '@/lib/session';
import { readPurposeToken, signPurposeToken, absoluteUrl } from '@/lib/tokens';
import {
  sendVerificationEmail,
  sendApplicationReceived,
  sendPasswordResetEmail
} from '@/lib/email';
import { recordAudit } from '@/lib/audit';

export type FormState = { error?: string; ok?: string };

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10, 'Use at least 10 characters'),
  country: z.string().min(2).max(80),
  phone: z.string().max(40).optional().or(z.literal('')),
  entityType: z.string().min(2),
  experience: z.string().min(2),
  intendedAmount: z.coerce.number().int().min(1).max(1_000_000_000),
  referrer: z.string().max(120).optional().or(z.literal('')),
  accredited: z.coerce.boolean().optional(),
  terms: z.coerce.boolean().optional()
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    country: formData.get('country'),
    phone: formData.get('phone'),
    entityType: formData.get('entityType'),
    experience: formData.get('experience'),
    intendedAmount: formData.get('intendedAmount'),
    referrer: formData.get('referrer'),
    accredited: formData.get('accredited') === 'on',
    terms: formData.get('terms') === 'on'
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  }
  if (!parsed.data.terms) return { error: 'You must confirm that you have read the risk disclosure.' };
  if (!parsed.data.accredited) return { error: 'This programme is limited to professional or high-net-worth investors.' };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'An account with this email already exists. Sign in instead.' };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name,
      country: parsed.data.country,
      phone: parsed.data.phone || null,
      status: 'APPLICANT',
      emailVerified: false,
      application: {
        create: {
          entityType: parsed.data.entityType,
          country: parsed.data.country,
          accredited: true,
          experience: parsed.data.experience,
          intendedAmount: parsed.data.intendedAmount,
          referrer: parsed.data.referrer || null,
          status: 'PENDING'
        }
      }
    }
  });

  await setSessionCookie({ uid: user.id, role: 'INVESTOR', email: user.email, name: user.name });
  await Promise.allSettled([
    sendVerificationEmail(user),
    sendApplicationReceived(user)
  ]);
  await recordAudit(user.id, 'application.submitted', user.id, { entityType: parsed.data.entityType });

  redirect('/apply-submitted');
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'Invalid email or password.' };
  if (user.status === 'SUSPENDED') return { error: 'This account is suspended. Contact the manager.' };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: 'Invalid email or password.' };

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await setSessionCookie({
    uid: user.id,
    role: user.role,
    email: user.email,
    name: user.name
  });

  redirect(user.role === 'ADMIN' ? '/admin' : '/portal');
}

export async function logoutAction() {
  clearSessionCookie();
  redirect('/');
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return { error: 'Enter your email address.' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await sendPasswordResetEmail(user);
    await recordAudit(null, 'password.reset_requested', user.id);
  }
  return { ok: 'If that email is registered, a reset link is on its way.' };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 10) return { error: 'Use at least 10 characters.' };
  if (password !== confirm) return { error: 'Passwords do not match.' };

  const claim = await readPurposeToken(token, 'reset-password');
  if (!claim) return { error: 'This reset link is invalid or has expired.' };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: claim.uid }, data: { passwordHash } });
  await recordAudit(claim.uid, 'password.reset');
  redirect('/login?reset=1');
}

export async function verifyEmailAction(token: string) {
  const claim = await readPurposeToken(token, 'verify-email');
  if (!claim) return false;
  await prisma.user.update({ where: { id: claim.uid }, data: { emailVerified: true } });
  return true;
}

export async function unsubscribeAction(token: string) {
  const claim = await readPurposeToken(token, 'unsubscribe');
  if (!claim) return false;
  await prisma.user.update({ where: { id: claim.uid }, data: { emailOptOut: true } });
  return true;
}

export async function resendVerificationAction(): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in first.' };
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return { error: 'Account not found.' };
  if (user.emailVerified) return { ok: 'Your email is already confirmed.' };
  await sendVerificationEmail(user);
  return { ok: 'Confirmation email sent.' };
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in first.' };

  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  if (name.length < 2) return { error: 'Enter your full name.' };

  await prisma.user.update({
    where: { id: session.uid },
    data: { name, phone: phone || null, country: country || null }
  });
  await recordAudit(session.uid, 'profile.updated', session.uid);
  return { ok: 'Profile updated.' };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in first.' };

  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  if (next.length < 10) return { error: 'New password must be at least 10 characters.' };

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return { error: 'Account not found.' };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: 'Current password is incorrect.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) }
  });
  await recordAudit(user.id, 'password.changed', user.id);
  return { ok: 'Password changed.' };
}

export async function resendVerificationToken(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error('Not signed in');
  return signPurposeToken(session.uid, 'verify-email', 48);
}

export async function previewVerifyUrl(): Promise<string> {
  const session = await getSession();
  if (!session) return absoluteUrl('/login');
  const token = await signPurposeToken(session.uid, 'verify-email', 48);
  return absoluteUrl(`/verify-email?token=${token}`);
}
