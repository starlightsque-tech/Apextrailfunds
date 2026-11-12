import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return new NextResponse('Not found', { status: 404 });

  const session = await getSession();

  if (doc.visibility === 'INVESTOR') {
    if (!session) return new NextResponse('Sign in required', { status: 401 });
    if (session.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: session.uid }, select: { status: true } });
      if (!user || user.status !== 'ACTIVE') return new NextResponse('Access denied', { status: 403 });
    }
  }

  if (doc.visibility === 'PRIVATE') {
    if (!session) return new NextResponse('Sign in required', { status: 401 });
    if (session.role !== 'ADMIN' && doc.ownerId !== session.uid) {
      return new NextResponse('Access denied', { status: 403 });
    }
  }

  await recordAudit(session?.uid ?? null, 'document.downloaded', doc.id, { title: doc.title });

  const safeName = doc.filename.replace(/[^\w.\-]+/g, '_');
  return new NextResponse(Buffer.from(doc.data), {
    headers: {
      'Content-Type': doc.mimeType || 'application/octet-stream',
      'Content-Length': String(doc.size),
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
