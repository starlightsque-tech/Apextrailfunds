'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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
import { resolveReferral, uniqueReferralCode } from '@/lib/referral';

export type FormState = { error?: string; ok?: string };

const signupSchema = z.object({
  name: z.string().min(2, 'Enter your full name').max(120),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(10, 'Use at least 10 characters'),
  confirm: z.string(),
  country: z.string().min(2, 'Select your country').max(80),
  phone: z.string().min(5, 'Enter a phone number').max(40),
  referralCode: z.string().max(20).optional().or(z.literal(''))
});

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
    country: formData.get('country'),
    phone: formData.get('phone'),
    referralCode: formData.get('referralCode')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  }
  if (parsed.data.password !== parsed.data.confirm) return { error: 'Passwords do not match.' };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'An account with this email already exists. Sign in instead.' };

  const referredBy = await resolveReferral(parsed.data.referralCode);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      name: parsed.data.name.trim(),
      country: parsed.data.country,
      phone: parsed.data.phone.trim(),
      status: 'APPLICANT',
      emailVerified: false,
      referralCode: await uniqueReferralCode(),
      referredBy
    }
  });

  await setSessionCookie({ uid: user.id, role: 'INVESTOR', email: user.email, name: user.name });
  await Promise.allSettled([sendVerificationEmail(user)]);
  await recordAudit(user.id, 'account.created', user.id, { referredBy: Boolean(referredBy) });

  redirect('/portal');
}

const applicationSchema = z.object({
  entityType: z.string().min(2),
  experience: z.string().min(2),
  intendedAmount: z.coerce.number().int().min(1).max(1_000_000_000),
  country: z.string().min(2).max(80),
  accredited: z.coerce.boolean().optional(),
  terms: z.coerce.boolean().optional(),
  referrer: z.string().max(120).optional().or(z.literal(''))
});

export async function submitApplicationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in to continue.' };

  const parsed = applicationSchema.safeParse({
    entityType: formData.get('entityType'),
    experience: formData.get('experience'),
    intendedAmount: formData.get('intendedAmount'),
    country: formData.get('country'),
    accredited: formData.get('accredited') === 'on',
    terms: formData.get('terms') === 'on',
    referrer: formData.get('referrer')
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  if (!parsed.data.terms) return { error: 'You must confirm that you have read the risk disclosure.' };
  if (!parsed.data.accredited) return { error: 'This programme is limited to professional or high-net-worth investors.' };

  const user = await prisma.user.findUnique({ where: { id: session.uid }, include: { application: true } });
  if (!user) return { error: 'Account not found.' };
  if (user.application) return { error: 'You already have an application on file.' };

  await prisma.application.create({
    data: {
      userId: user.id,
      entityType: parsed.data.entityType,
      country: parsed.data.country,
      accredited: true,
      experience: parsed.data.experience,
      intendedAmount: parsed.data.intendedAmount,
      referrer: parsed.data.referrer || null,
      status: 'PENDING'
    }
  });
  if (user.phone || user.country === parsed.data.country) {
    await prisma.user.update({ where: { id: user.id }, data: { country: parsed.data.country } });
  }

  await Promise.allSettled([sendApplicationReceived(user)]);
  await recordAudit(user.id, 'application.submitted', user.id, { entityType: parsed.data.entityType });
  revalidatePath('/portal');
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
  if (session.imp) return { error: 'Profile changes are disabled while support access is active.' };

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
  if (session.imp) return { error: 'Password changes are disabled while support access is active.' };

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
