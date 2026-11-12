import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'atf_session';

export type SessionPayload = {
  uid: string;
  role: 'ADMIN' | 'INVESTOR';
  email: string;
  name: string;
};

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET is missing or too short');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, maxAgeSeconds = 60 * 60 * 24 * 7) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(key());
}

export async function readToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.uid) return null;
    return {
      uid: String(payload.uid),
      role: payload.role === 'ADMIN' ? 'ADMIN' : 'INVESTOR',
      email: String(payload.email ?? ''),
      name: String(payload.name ?? '')
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readToken(token);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
