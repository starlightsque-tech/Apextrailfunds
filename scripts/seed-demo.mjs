/**
 * Local preview only. Creates one demo investor with sample ledger entries and
 * two published months so the UI can be reviewed without live data.
 * Never run this against a production database.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo-password-123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo.investor@example.com' },
    update: {},
    create: {
      email: 'demo.investor@example.com',
      name: 'Demo Investor',
      passwordHash,
      role: 'INVESTOR',
      status: 'ACTIVE',
      emailVerified: true,
      country: 'United Kingdom',
      application: {
        create: {
          entityType: 'Individual',
          country: 'United Kingdom',
          accredited: true,
          experience: '7+ years',
          intendedAmount: 100000,
          status: 'APPROVED',
          reviewedBy: 'demo',
          reviewedAt: new Date()
        }
      }
    }
  });

  const existing = await prisma.ledgerEntry.count({ where: { userId: user.id } });
  if (existing === 0) {
    await prisma.ledgerEntry.createMany({
      data: [
        { userId: user.id, date: new Date('2026-06-01'), type: 'SUBSCRIPTION', amount: 100000, units: 1000, navPerUnit: 100, memo: 'Sample — demo data' },
        { userId: user.id, date: new Date('2026-06-30'), type: 'FEE', amount: 125, memo: 'Sample — management fee' },
        { userId: user.id, date: new Date('2026-07-31'), type: 'DISTRIBUTION', amount: 640, memo: 'Sample — demo data' }
      ]
    });
  }

  for (const [month, netReturn] of [['2026-06', 0.8], ['2026-07', -0.42], ['2026-08', 1.16]]) {
    await prisma.performancePoint.upsert({
      where: { month },
      update: {},
      create: { month, netReturn, grossReturn: netReturn + 0.18, navPerUnit: 100.5, aum: 1250000, published: true }
    });
  }

  console.log('Demo investor: demo.investor@example.com / demo-password-123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
