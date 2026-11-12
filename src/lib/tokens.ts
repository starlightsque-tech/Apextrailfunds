import { SignJWT, jwtVerify } from 'jose';

type Purpose = 'verify-email' | 'reset-password' | 'unsubscribe';

function key() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? '');
}

export async function signPurposeToken(uid: string, purpose: Purpose, hours: number) {
  return new SignJWT({ uid, purpose })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(key());
}

export async function readPurposeToken(token: string, purpose: Purpose) {
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.purpose !== purpose || !payload.uid) return null;
    return { uid: String(payload.uid) };
  } catch {
    return null;
  }
}

export function absoluteUrl(path: string) {
  const base =
    process.env.APP_URL ||
    (process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:3000');
  return `${base.replace(/\/$/, '')}${path}`;
}
