import { prisma } from './prisma';

export async function recordAudit(actorId: string | null, action: string, target?: string, meta?: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? undefined,
        action,
        target,
        meta: meta ? JSON.stringify(meta).slice(0, 4000) : undefined
      }
    });
  } catch (error) {
    console.error('[audit] failed', error);
  }
}
