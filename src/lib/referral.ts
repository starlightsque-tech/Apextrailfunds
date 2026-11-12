import { prisma } from './prisma';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(length = 7) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function uniqueReferralCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateReferralCode();
    const clash = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!clash) return code;
  }
  return `ATF${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/** Validates a code and returns the referring user's email, or null. */
export async function resolveReferral(code?: string | null) {
  const clean = (code ?? '').trim().toUpperCase();
  if (!clean) return null;
  const user = await prisma.user.findUnique({ where: { referralCode: clean }, select: { email: true } });
  return user?.email ?? null;
}
