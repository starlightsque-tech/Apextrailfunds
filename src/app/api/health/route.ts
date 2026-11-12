import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { status: 'degraded', db: 'down', error: error instanceof Error ? error.message : 'unknown' },
      { status: 503 }
    );
  }
}
