import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!email || !password) {
    console.log('[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin bootstrap.');
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { role: 'ADMIN', status: 'ACTIVE', emailVerified: true, passwordHash },
      create: {
        email: email.toLowerCase(),
        name: 'Fund Administrator',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true
      }
    });
    console.log(`[seed] admin ready: ${admin.email}`);
  }

  const defaults = {
    fundDisplayName: 'apextrailfunds',
    fundLegalName: '',
    custodianName: '',
    jurisdiction: '',
    licenceRef: '',
    auditorName: '',
    adminEmail: process.env.ADMIN_EMAIL || '',
    fromEmail: process.env.EMAIL_FROM || 'no-reply@apextrailfunds.com',
    minSubscription: '25000',
    liquidityNoticeDays: '30',
    managementFee: '1.50',
    performanceFee: '15',
    addressLine: '',
    complianceApproved: 'false'
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log('[seed] default settings ensured.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
